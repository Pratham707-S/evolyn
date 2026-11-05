import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import type {
  Decision,
  SubmissionStatus,
  SubmitDecisionInput,
} from '@evolyn/shared';

import type { SubmissionWithReview } from '../modules/submissions/index.js';
import type {
  DecisionIssueRecord,
  DecisionRecord,
} from '../modules/decisions/decisions.repository.js';
import type {
  DecisionDependencies,
  DecisionRepositoryPort,
} from '../modules/decisions/decisions.types.js';
import { DecisionError } from '../modules/decisions/decisions.types.js';
import { DecisionService } from '../modules/decisions/decisions.service.js';
import { DecisionsController } from '../modules/decisions/decisions.controller.js';
import { createDecisionsRouter } from '../modules/decisions/decisions.routes.js';
import type { IDecisionService } from '../modules/decisions/index.js';
import type { ISubmissionService } from '../modules/submissions/index.js';

const submissionId = 'c0a80123-4567-4890-a123-456789abcdef';
const decisionId = 'd0a80123-4567-4890-a123-456789abcdef';
const issueId = 'e0a80123-4567-4890-a123-456789abcdef';
const otherIssueId = 'f0a80123-4567-4890-a123-456789abcdef';
const unknownIssueId = 'a1a80123-4567-4890-a123-456789abcdef';
const ruleId = 'b2a80123-4567-4890-a123-456789abcdef';
const createdAt = new Date('2026-11-05T10:00:00.000Z');

const reviewedSubmission: SubmissionWithReview = {
  id: submissionId,
  title: 'Launch copy',
  channel: 'SOCIAL',
  rawText: 'Our guaranteed launch is ready.',
  fileUrl: null,
  submittedBy: 'Ayan',
  status: 'REVIEWED',
  createdAt: createdAt.toISOString(),
  updatedAt: createdAt.toISOString(),
  reviewRun: null,
  decision: null,
};

const validInput: SubmitDecisionInput = {
  submissionId,
  decision: 'APPROVED',
  reviewerName: 'Judge Pratham',
  comments: 'Approved after review.',
  overriddenIssueIds: [],
};

function createDecisionRecord(
  overrides: Partial<DecisionRecord> = {}
): DecisionRecord {
  return {
    id: decisionId,
    submissionId,
    decision: 'APPROVED',
    reviewerName: 'Judge Pratham',
    comments: 'Approved after review.',
    overriddenIssueIds: [],
    createdAt,
    ...overrides,
  };
}

function createIssue(
  overrides: Partial<DecisionIssueRecord> = {}
): DecisionIssueRecord {
  return {
    id: issueId,
    ruleId,
    flaggedExcerpt: 'guaranteed',
    status: 'OPEN',
    ...overrides,
  };
}

interface HarnessOptions {
  submission?: SubmissionWithReview | null;
  issues?: DecisionIssueRecord[];
  existing?: DecisionRecord | null;
  history?: DecisionRecord[];
  create?: (input: SubmitDecisionInput) => Promise<DecisionRecord>;
  updateStatus?: (id: string, status: SubmissionStatus) => Promise<void>;
  updateIssueStatuses?: (ids: string[], status: 'OVERRIDDEN') => Promise<void>;
  deleteById?: (id: string) => Promise<void>;
  restoreIssueStatuses?: (issues: DecisionIssueRecord[]) => Promise<void>;
  trackViolation?: (ruleId: string, sampleExcerpt: string) => Promise<void>;
  includeInsights?: boolean;
}

interface RecordedCalls {
  statuses: string[];
  created: SubmitDecisionInput[];
  overridden: string[][];
  deleted: string[];
  restored: DecisionIssueRecord[][];
  insights: Array<{ ruleId: string; sampleExcerpt: string }>;
  issueListCalls: number;
}

function createHarness(options: HarnessOptions = {}): {
  dependencies: DecisionDependencies;
  calls: RecordedCalls;
} {
  const calls: RecordedCalls = {
    statuses: [],
    created: [],
    overridden: [],
    deleted: [],
    restored: [],
    insights: [],
    issueListCalls: 0,
  };

  const repository: DecisionRepositoryPort = {
    create:
      options.create ??
      (async (input) => {
        calls.created.push(input);
        return createDecisionRecord({
          decision: input.decision,
          overriddenIssueIds: input.overriddenIssueIds,
        });
      }),
    findBySubmissionId: async () => options.existing ?? null,
    findLatestBySubmissionId: async () => options.existing ?? null,
    listBySubmissionId: async () => options.history ?? (options.existing ? [options.existing] : []),
    deleteById:
      options.deleteById ??
      (async (id) => {
        calls.deleted.push(id);
      }),
    listIssuesBySubmissionId: async () => {
      calls.issueListCalls += 1;
      return options.issues ?? [createIssue()];
    },
    updateIssueStatuses:
      options.updateIssueStatuses ??
      (async (ids) => {
        calls.overridden.push(ids);
      }),
    restoreIssueStatuses:
      options.restoreIssueStatuses ??
      (async (issues) => {
        calls.restored.push(issues);
      }),
  };

  const dependencies: DecisionDependencies = {
    submissions: {
      getSubmissionById: async () =>
        options.submission === undefined
          ? reviewedSubmission
          : options.submission,
      updateSubmissionStatus:
        options.updateStatus ??
        (async (_id, status) => {
          calls.statuses.push(status);
        }),
    },
    repository,
  };

  if (options.includeInsights !== false) {
    dependencies.insights = {
      trackViolation:
        options.trackViolation ??
        (async (id, sampleExcerpt) => {
          calls.insights.push({ ruleId: id, sampleExcerpt });
        }),
    };
  }

  return { dependencies, calls };
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe('DecisionService Unit Tests', () => {
  it('records an APPROVED decision and transitions submission status to APPROVED', async () => {
    const { dependencies, calls } = createHarness();
    const service = new DecisionService(dependencies);

    const result = await service.recordDecision(validInput);

    assert.equal(result.id, decisionId);
    assert.equal(result.decision, 'APPROVED');
    assert.equal(result.reviewerName, 'Judge Pratham');
    assert.deepEqual(calls.statuses, ['APPROVED']);
    assert.equal(calls.created.length, 1);
  });

  it('records a REJECTED decision and transitions submission status to REJECTED', async () => {
    const { dependencies, calls } = createHarness();
    const service = new DecisionService(dependencies);

    const result = await service.recordDecision({
      ...validInput,
      decision: 'REJECTED',
    });

    assert.equal(result.decision, 'REJECTED');
    assert.deepEqual(calls.statuses, ['REJECTED']);
  });

  it('records CHANGES_REQUESTED and leaves submission status in REVIEWED', async () => {
    const { dependencies, calls } = createHarness();
    const service = new DecisionService(dependencies);

    const result = await service.recordDecision({
      ...validInput,
      decision: 'CHANGES_REQUESTED',
    });

    assert.equal(result.decision, 'CHANGES_REQUESTED');
    assert.deepEqual(calls.statuses, ['REVIEWED']);
  });

  it('rejects when the submission does not exist', async () => {
    const { dependencies, calls } = createHarness({ submission: null });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision(validInput),
      (error: unknown) =>
        error instanceof DecisionError &&
        error.code === 'SUBMISSION_NOT_FOUND'
    );
    assert.equal(calls.created.length, 0);
  });

  it('rejects when the submission is in PENDING status', async () => {
    const { dependencies, calls } = createHarness({
      submission: { ...reviewedSubmission, status: 'PENDING' },
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision(validInput),
      (error: unknown) =>
        error instanceof DecisionError &&
        error.code === 'SUBMISSION_NOT_REVIEWED'
    );
    assert.equal(calls.created.length, 0);
    assert.deepEqual(calls.statuses, []);
  });

  it('rejects when the submission is in ANALYZING status', async () => {
    const { dependencies, calls } = createHarness({
      submission: { ...reviewedSubmission, status: 'ANALYZING' },
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision(validInput),
      (error: unknown) =>
        error instanceof DecisionError &&
        error.code === 'SUBMISSION_NOT_REVIEWED'
    );
    assert.equal(calls.created.length, 0);
  });

  it('rejects duplicate decisions when submission is already finalized as APPROVED', async () => {
    const { dependencies, calls } = createHarness({
      submission: { ...reviewedSubmission, status: 'APPROVED' },
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision(validInput),
      (error: unknown) =>
        error instanceof DecisionError && error.code === 'DECISION_EXISTS'
    );
    assert.equal(calls.created.length, 0);
  });

  it('rejects duplicate decisions when existing decision is APPROVED or REJECTED', async () => {
    const { dependencies, calls } = createHarness({
      existing: createDecisionRecord({ decision: 'APPROVED' }),
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision(validInput),
      (error: unknown) =>
        error instanceof DecisionError && error.code === 'DECISION_EXISTS'
    );
    assert.equal(calls.created.length, 0);
  });

  it('rejects concurrent decision requests for the same submission', async () => {
    let releaseGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });

    const { dependencies } = createHarness({
      create: async (input) => {
        await gate;
        return createDecisionRecord({ decision: input.decision });
      },
    });
    const service = new DecisionService(dependencies);

    const first = service.recordDecision(validInput);
    const concurrent = service.recordDecision(validInput);

    await assert.rejects(
      concurrent,
      (error: unknown) =>
        error instanceof DecisionError && error.code === 'DECISION_EXISTS'
    );

    releaseGate();
    const result = await first;
    assert.equal(result.decision, 'APPROVED');
  });

  it('updates issue statuses to OVERRIDDEN for valid override IDs', async () => {
    const { dependencies, calls } = createHarness({
      issues: [createIssue()],
    });
    const service = new DecisionService(dependencies);

    await service.recordDecision({
      ...validInput,
      overriddenIssueIds: [issueId],
    });

    assert.deepEqual(calls.overridden, [[issueId]]);
  });

  it('rejects overrides that do not belong to the submission', async () => {
    const { dependencies, calls } = createHarness({
      issues: [createIssue()],
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision({
        ...validInput,
        overriddenIssueIds: [unknownIssueId],
      }),
      (error: unknown) =>
        error instanceof DecisionError &&
        error.code === 'UNKNOWN_OVERRIDE_ISSUE'
    );
    assert.equal(calls.created.length, 0);
    assert.deepEqual(calls.overridden, []);
  });

  it('deletes decision and restores issue statuses if status update fails (rollback)', async () => {
    const { dependencies, calls } = createHarness({
      issues: [createIssue()],
      updateStatus: async () => {
        throw new Error('Database write error updating submission status');
      },
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision({
        ...validInput,
        overriddenIssueIds: [issueId],
      }),
      /Database write error updating submission status/
    );

    assert.deepEqual(calls.deleted, [decisionId]);
    assert.equal(calls.restored.length, 1);
    assert.deepEqual(calls.restored[0], [createIssue()]);
  });

  it('notifies insights safely and does not roll back decision on insights failure', async () => {
    const { dependencies } = createHarness({
      trackViolation: async () => {
        throw new Error('Insights service unavailable');
      },
    });
    const service = new DecisionService(dependencies);

    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      const decision = await service.recordDecision(validInput);
      assert.equal(decision.decision, 'APPROVED');
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('retrieves chronological decision history in asc order', async () => {
    const dec1 = createDecisionRecord({
      id: '11111111-1111-4111-a111-111111111111',
      decision: 'CHANGES_REQUESTED',
      createdAt: new Date('2026-11-05T09:00:00Z'),
    });
    const dec2 = createDecisionRecord({
      id: '22222222-2222-4222-a222-222222222222',
      decision: 'APPROVED',
      createdAt: new Date('2026-11-05T11:00:00Z'),
    });

    const { dependencies } = createHarness({
      history: [dec1, dec2],
    });
    const service = new DecisionService(dependencies);

    const history = await service.getDecisionHistory(submissionId);
    assert.equal(history.length, 2);
    assert.equal(history[0].id, dec1.id);
    assert.equal(history[0].decision, 'CHANGES_REQUESTED');
    assert.equal(history[1].id, dec2.id);
    assert.equal(history[1].decision, 'APPROVED');
  });

  it('returns null when no decision exists and rejects invalid UUIDs', async () => {
    const { dependencies } = createHarness();
    const service = new DecisionService(dependencies);

    assert.equal(await service.getDecisionBySubmissionId(submissionId), null);
    await assert.rejects(
      service.getDecisionBySubmissionId('invalid-uuid'),
      /Invalid uuid/
    );
  });
});

describe('DecisionsController Unit Tests', () => {
  const dummyDecision: Decision = {
    id: decisionId,
    submissionId,
    decision: 'APPROVED',
    reviewerName: 'Judge Pratham',
    comments: 'Meets requirements.',
    overriddenIssueIds: [],
    createdAt: createdAt.toISOString(),
  };

  function createMockDecisionService(
    overrides: Partial<IDecisionService> = {}
  ): IDecisionService {
    return {
      recordDecision: async () => dummyDecision,
      getDecisionBySubmissionId: async () => dummyDecision,
      getDecisionHistory: async () => [dummyDecision],
      ...overrides,
    };
  }

  function createMockSubmissionService(
    overrides: Partial<Pick<ISubmissionService, 'getSubmissionById'>> = {}
  ): Pick<ISubmissionService, 'getSubmissionById'> {
    return {
      getSubmissionById: async () => reviewedSubmission,
      ...overrides,
    };
  }

  it('registers decision routes on createDecisionsRouter', () => {
    const router = createDecisionsRouter(
      createMockDecisionService(),
      createMockSubmissionService()
    );
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route?.path,
        methods: layer.route?.stack.map((routeLayer) => routeLayer.method),
      }));

    assert.deepEqual(routes, [
      { path: '/submissions/:id/decision', methods: ['post'] },
      { path: '/submissions/:id/decision', methods: ['get'] },
      { path: '/submissions/:id/decisions', methods: ['get'] },
    ]);
  });

  it('records a decision and returns 201 with response contract', async () => {
    const controller = new DecisionsController(
      createMockDecisionService(),
      createMockSubmissionService()
    );
    const req = {
      params: { id: submissionId },
      body: {
        decision: 'APPROVED',
        reviewerName: 'Judge Pratham',
        comments: 'Meets requirements.',
      },
    } as unknown as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (err?: unknown) => {
      if (err) throw err;
    };

    await controller.record(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      decision: dummyDecision,
      updatedSubmissionStatus: 'APPROVED',
    });
  });

  it('rejects with 400 when body submissionId mismatches param id', async () => {
    const controller = new DecisionsController(
      createMockDecisionService(),
      createMockSubmissionService()
    );
    const req = {
      params: { id: submissionId },
      body: {
        submissionId: 'f0a80123-4567-4890-a123-456789abcdef',
        decision: 'APPROVED',
        reviewerName: 'Judge Pratham',
        comments: 'Meets requirements.',
      },
    } as unknown as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (err?: unknown) => {
      if (err) throw err;
    };

    await controller.record(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 400);
    assert.match(
      (res.body as { error: string }).error,
      /Body submissionId does not match the submission in the URL/
    );
  });

  it('returns 200 with latest decision on getBySubmissionId', async () => {
    const controller = new DecisionsController(
      createMockDecisionService(),
      createMockSubmissionService()
    );
    const req = { params: { id: submissionId } } as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (err?: unknown) => {
      if (err) throw err;
    };

    await controller.getBySubmissionId(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { decision: dummyDecision });
  });

  it('returns 404 when no decision exists on getBySubmissionId', async () => {
    const controller = new DecisionsController(
      createMockDecisionService({ getDecisionBySubmissionId: async () => null }),
      createMockSubmissionService()
    );
    const req = { params: { id: submissionId } } as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (err?: unknown) => {
      if (err) throw err;
    };

    await controller.getBySubmissionId(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Decision not found' });
  });

  it('returns 200 with chronological history and total count', async () => {
    const controller = new DecisionsController(
      createMockDecisionService({
        getDecisionHistory: async () => [dummyDecision],
      }),
      createMockSubmissionService()
    );
    const req = { params: { id: submissionId } } as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (err?: unknown) => {
      if (err) throw err;
    };

    await controller.getHistoryBySubmissionId(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      submissionId,
      decisions: [dummyDecision],
      total: 1,
    });
  });

  it('returns 404 from history when submission does not exist', async () => {
    const controller = new DecisionsController(
      createMockDecisionService(),
      createMockSubmissionService({ getSubmissionById: async () => null })
    );
    const req = { params: { id: submissionId } } as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (err?: unknown) => {
      if (err) throw err;
    };

    await controller.getHistoryBySubmissionId(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Submission not found' });
  });
});
