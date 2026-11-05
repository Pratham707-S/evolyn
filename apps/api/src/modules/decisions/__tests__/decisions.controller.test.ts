import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { NextFunction, Request, Response } from 'express';
import type { Decision } from '@evolyn/shared';

import type { IDecisionService } from '../index.js';
import { DecisionsController } from '../decisions.controller.js';
import { DecisionError } from '../decisions.types.js';

const submissionId = 'c0a80123-4567-4890-a123-456789abcdef';
const decisionId = 'd0a80123-4567-4890-a123-456789abcdef';

const decision: Decision = {
  id: decisionId,
  submissionId,
  decision: 'APPROVED',
  reviewerName: 'Judge Pratham',
  comments: 'Approved.',
  overriddenIssueIds: [],
  createdAt: '2026-11-05T10:00:00.000Z',
};

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

function createRequest(
  overrides: Partial<Request<{ id: string }>> = {}
): Request<{ id: string }> {
  return {
    params: { id: submissionId },
    body: {
      decision: 'APPROVED',
      reviewerName: 'Judge Pratham',
      comments: 'Approved.',
    },
    ...overrides,
  } as Request<{ id: string }>;
}

function createService(
  overrides: Partial<IDecisionService> = {}
): IDecisionService {
  return {
    recordDecision: async () => decision,
    getDecisionBySubmissionId: async () => decision,
    ...overrides,
  };
}

function createNext() {
  let captured: unknown;
  const next: NextFunction = (error?: unknown) => {
    captured = error;
  };

  return {
    next,
    getError: () => captured,
  };
}

describe('DecisionsController', () => {
  it('records a decision and returns 201 with the response contract', async () => {
    let receivedInput: unknown;
    const service = createService({
      recordDecision: async (input) => {
        receivedInput = input;
        return decision;
      },
    });
    const controller = new DecisionsController(service);
    const res = createResponse();
    const { next, getError } = createNext();

    await controller.record(
      createRequest(),
      res as unknown as Response,
      next
    );

    assert.equal(getError(), undefined);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {
      decision,
      updatedSubmissionStatus: 'APPROVED',
    });
    assert.deepEqual(receivedInput, {
      submissionId,
      decision: 'APPROVED',
      reviewerName: 'Judge Pratham',
      comments: 'Approved.',
      overriddenIssueIds: [],
    });
  });

  it('derives REVIEWED for CHANGES_REQUESTED decisions', async () => {
    const changesRequested: Decision = {
      ...decision,
      decision: 'CHANGES_REQUESTED',
    };
    const controller = new DecisionsController(
      createService({ recordDecision: async () => changesRequested })
    );
    const res = createResponse();
    const { next } = createNext();

    await controller.record(
      createRequest({
        body: {
          decision: 'CHANGES_REQUESTED',
          reviewerName: 'Judge Pratham',
          comments: 'Please revise the claims.',
        },
      }),
      res as unknown as Response,
      next
    );

    assert.equal(res.statusCode, 201);
    assert.equal(
      (res.body as { updatedSubmissionStatus: string })
        .updatedSubmissionStatus,
      'REVIEWED'
    );
  });

  it('rejects a body submissionId that does not match the URL', async () => {
    let called = false;
    const controller = new DecisionsController(
      createService({
        recordDecision: async () => {
          called = true;
          return decision;
        },
      })
    );
    const res = createResponse();
    const { next } = createNext();

    await controller.record(
      createRequest({
        body: {
          submissionId: 'f0a80123-4567-4890-a123-456789abcdef',
          decision: 'APPROVED',
          reviewerName: 'Judge Pratham',
          comments: 'Approved.',
        },
      }),
      res as unknown as Response,
      next
    );

    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
    assert.match(
      (res.body as { error: string }).error,
      /does not match the submission in the URL/
    );
  });

  it('forwards body validation errors to the error handler', async () => {
    const controller = new DecisionsController(createService());
    const res = createResponse();
    const { next, getError } = createNext();

    await controller.record(
      createRequest({
        body: {
          decision: 'APPROVED',
          reviewerName: 'Judge Pratham',
        },
      }),
      res as unknown as Response,
      next
    );

    const error = getError();
    assert.ok(error instanceof Error);
    assert.equal(error.name, 'ZodError');
  });

  it('forwards invalid path UUIDs to the error handler', async () => {
    const controller = new DecisionsController(createService());
    const res = createResponse();
    const { next, getError } = createNext();

    await controller.record(
      createRequest({ params: { id: 'not-a-uuid' } }),
      res as unknown as Response,
      next
    );

    const error = getError();
    assert.ok(error instanceof Error);
    assert.equal(error.name, 'ZodError');
  });

  it('maps domain errors to the expected HTTP status codes', async () => {
    const cases: Array<{
      error: DecisionError;
      expectedStatus: number;
    }> = [
      {
        error: new DecisionError('SUBMISSION_NOT_FOUND', 'Submission not found'),
        expectedStatus: 404,
      },
      {
        error: new DecisionError(
          'SUBMISSION_NOT_REVIEWED',
          'Submission cannot receive a decision'
        ),
        expectedStatus: 400,
      },
      {
        error: new DecisionError(
          'DECISION_EXISTS',
          'Decision already recorded'
        ),
        expectedStatus: 409,
      },
      {
        error: new DecisionError(
          'UNKNOWN_OVERRIDE_ISSUE',
          'Unknown override issue'
        ),
        expectedStatus: 400,
      },
    ];

    for (const { error, expectedStatus } of cases) {
      const controller = new DecisionsController(
        createService({
          recordDecision: async () => {
            throw error;
          },
        })
      );
      const res = createResponse();
      const { next, getError } = createNext();

      await controller.record(
        createRequest(),
        res as unknown as Response,
        next
      );

      assert.equal(getError(), undefined);
      assert.equal(res.statusCode, expectedStatus);
      assert.deepEqual(res.body, { error: error.message });
    }
  });

  it('returns a decision by submission ID', async () => {
    const controller = new DecisionsController(createService());
    const res = createResponse();
    const { next, getError } = createNext();

    await controller.getBySubmissionId(
      createRequest(),
      res as unknown as Response,
      next
    );

    assert.equal(getError(), undefined);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { decision });
  });

  it('returns 404 when no decision exists', async () => {
    const controller = new DecisionsController(
      createService({ getDecisionBySubmissionId: async () => null })
    );
    const res = createResponse();
    const { next } = createNext();

    await controller.getBySubmissionId(
      createRequest(),
      res as unknown as Response,
      next
    );

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Decision not found' });
  });
});
