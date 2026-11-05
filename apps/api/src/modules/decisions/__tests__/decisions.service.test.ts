import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  SubmissionStatus,
  SubmitDecisionInput,
} from '@evolyn/shared';

import type { SubmissionWithReview } from '../../submissions/index.js';
import type {
  DecisionIssueRecord,
  DecisionRecord,
} from '../decisions.repository.js';
import type {
  DecisionDependencies,
  DecisionRepositoryPort,
} from '../decisions.types.js';
import { DecisionError } from '../decisions.types.js';
import { DecisionService } from '../decisions.service.js';

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
  create?: (input: SubmitDecisionInput) => Promise<DecisionRecord>;
  updateStatus?: (id: string, status: SubmissionStatus) => Promise<void>;
  updateIssueStatuses?: (
    ids: string[],
    status: 'OVERRIDDEN'
  ) => Promise<void>;
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

describe('DecisionService', () => {
  it('records an APPROVED decision and finalizes the submission', async () => {
    const { dependencies, calls } = createHarness();
    const service = new DecisionService(dependencies);

    const decision = await service.recordDecision(validInput);

    assert.equal(decision.decision, 'APPROVED');
    assert.equal(decision.submissionId, submissionId);
    assert.deepEqual(decision.overriddenIssueIds, []);
    assert.deepEqual(calls.statuses, ['APPROVED']);
    assert.equal(calls.created.length, 1);
    assert.equal(calls.created[0].reviewerName, 'Judge Pratham');
    assert.deepEqual(calls.overridden, []);
  });

  it('maps REJECTED to a REJECTED submission status', async () => {
    const { dependencies, calls } = createHarness();
    const service = new DecisionService(dependencies);

    const decision = await service.recordDecision({
      ...validInput,
      decision: 'REJECTED',
    });

    assert.equal(decision.decision, 'REJECTED');
    assert.deepEqual(calls.statuses, ['REJECTED']);
  });

  it('keeps CHANGES_REQUESTED submissions in REVIEWED status', async () => {
    const { dependencies, calls } = createHarness();
    const service = new DecisionService(dependencies);

    const decision = await service.recordDecision({
      ...validInput,
      decision: 'CHANGES_REQUESTED',
    });

    assert.equal(decision.decision, 'CHANGES_REQUESTED');
    assert.deepEqual(calls.statuses, ['REVIEWED']);
  });

  it('marks overridden issues as OVERRIDDEN', async () => {
    const { dependencies, calls } = createHarness({
      issues: [createIssue()],
    });
    const service = new DecisionService(dependencies);

    const decision = await service.recordDecision({
      ...validInput,
      overriddenIssueIds: [issueId],
    });

    assert.deepEqual(decision.overriddenIssueIds, [issueId]);
    assert.deepEqual(calls.overridden, [[issueId]]);
  });

  it('deduplicates override issue IDs before persisting', async () => {
    const { dependencies, calls } = createHarness({
      issues: [createIssue()],
    });
    const service = new DecisionService(dependencies);

    const decision = await service.recordDecision({
      ...validInput,
      overriddenIssueIds: [issueId, issueId],
    });

    assert.deepEqual(decision.overriddenIssueIds, [issueId]);
    assert.deepEqual(calls.created[0].overriddenIssueIds, [issueId]);
    assert.deepEqual(calls.overridden, [[issueId]]);
  });

  it('skips loading issues when there are no overrides and insights is disabled', async () => {
    const { dependencies, calls } = createHarness({ includeInsights: false });
    const service = new DecisionService(dependencies);

    await service.recordDecision(validInput);

    assert.equal(calls.issueListCalls, 0);
  });

  it('loads issues for insights notifications even without overrides', async () => {
    const { dependencies, calls } = createHarness({
      issues: [createIssue()],
    });
    const service = new DecisionService(dependencies);

    await service.recordDecision(validInput);

    assert.equal(calls.issueListCalls, 1);
    assert.deepEqual(calls.insights, [
      { ruleId, sampleExcerpt: 'guaranteed' },
    ]);
  });

  it('does not fail when an insights notifier throws synchronously', async () => {
    const { dependencies, calls } = createHarness({
      trackViolation: () => {
        throw new Error('Synchronous insights failure');
      },
    });
    const service = new DecisionService(dependencies);

    const originalConsoleError = console.error;
    console.error = () => {};

    try {
      const decision = await service.recordDecision(validInput);
      assert.equal(decision.decision, 'APPROVED');
      assert.deepEqual(calls.statuses, ['APPROVED']);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('rejects invalid decision input', async () => {
    const { dependencies, calls } = createHarness();
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision({ ...validInput, comments: '' }),
      (error: unknown) =>
        error instanceof Error && error.name === 'ZodError'
    );
    await assert.rejects(
      service.recordDecision({
        ...validInput,
        submissionId: 'not-a-uuid',
      }),
      (error: unknown) =>
        error instanceof Error && error.name === 'ZodError'
    );
    assert.equal(calls.created.length, 0);
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

  it('rejects when the submission has not been reviewed', async () => {
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

  it('rejects a second decision for the same submission', async () => {
    const { dependencies, calls } = createHarness({
      existing: createDecisionRecord(),
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision(validInput),
      (error: unknown) =>
        error instanceof DecisionError && error.code === 'DECISION_EXISTS'
    );
    assert.equal(calls.created.length, 0);
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

  it('notifies insights for rule-backed issues only', async () => {
    const { dependencies, calls } = createHarness({
      issues: [
        createIssue(),
        createIssue({ id: otherIssueId, ruleId: null }),
      ],
    });
    const service = new DecisionService(dependencies);

    await service.recordDecision(validInput);

    assert.deepEqual(calls.insights, [
      { ruleId, sampleExcerpt: 'guaranteed' },
    ]);
  });

  it('does not fail the decision when insights notification fails', async () => {
    const { dependencies, calls } = createHarness({
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
      assert.deepEqual(calls.statuses, ['APPROVED']);
    } finally {
      console.error = originalConsoleError;
    }
  });

  it('does not notify insights when no insights dependency is configured', async () => {
    const { dependencies, calls } = createHarness({ includeInsights: false });
    const service = new DecisionService(dependencies);

    const decision = await service.recordDecision(validInput);

    assert.equal(decision.decision, 'APPROVED');
    assert.deepEqual(calls.insights, []);
  });

  it('deletes the decision and restores issue statuses when the status update fails', async () => {
    const { dependencies, calls } = createHarness({
      issues: [createIssue()],
      updateStatus: async () => {
        throw new Error('Submission status write failed');
      },
    });
    const service = new DecisionService(dependencies);

    await assert.rejects(
      service.recordDecision({
        ...validInput,
        overriddenIssueIds: [issueId],
      }),
      /Submission status write failed/
    );

    assert.deepEqual(calls.deleted, [decisionId]);
    assert.equal(calls.restored.length, 1);
    assert.deepEqual(calls.restored[0], [createIssue()]);
  });

  it('returns the recorded decision for a submission', async () => {
    const { dependencies } = createHarness({
      existing: createDecisionRecord(),
    });
    const service = new DecisionService(dependencies);

    const decision = await service.getDecisionBySubmissionId(submissionId);

    assert.equal(decision?.id, decisionId);
    assert.equal(decision?.decision, 'APPROVED');
    assert.equal(decision?.createdAt, createdAt.toISOString());
  });

  it('returns null when no decision exists and rejects invalid IDs', async () => {
    const { dependencies } = createHarness();
    const service = new DecisionService(dependencies);

    assert.equal(
      await service.getDecisionBySubmissionId(submissionId),
      null
    );
    await assert.rejects(
      service.getDecisionBySubmissionId('invalid-id'),
      (error: unknown) =>
        error instanceof Error && error.name === 'ZodError'
    );
  });
});
