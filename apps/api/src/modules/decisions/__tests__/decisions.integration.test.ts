import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';
import type { Decision } from '@evolyn/shared';

import { app } from '../../../app.js';
import { decisionService } from '../decisions.service.js';
import { DecisionError } from '../decisions.types.js';

interface DispatchOptions {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface DispatchResult {
  statusCode: number;
  body: any;
  headers: Record<string, any>;
}

/**
 * In-Memory Express Request Dispatcher
 * Exercises complete Express routing, middleware, and error-handling
 * without binding to network ports.
 */
function dispatch(options: DispatchOptions): Promise<DispatchResult> {
  return new Promise((resolve, reject) => {
    try {
      const socket = new Socket();
      const req = new http.IncomingMessage(socket);
      req.method = options.method;
      req.url = options.url;

      const payload =
        options.body !== undefined ? JSON.stringify(options.body) : null;
      req.headers = {
        host: 'localhost',
        ...(options.headers || {}),
        ...(payload !== null
          ? {
              'content-type': 'application/json',
              'content-length': String(Buffer.byteLength(payload)),
            }
          : {}),
      };

      const res = new http.ServerResponse(req);
      let rawOutput = '';

      res.write = function (chunk: any) {
        if (chunk) rawOutput += chunk;
        return true;
      };

      res.end = function (chunk: any) {
        if (chunk) rawOutput += chunk;
        let parsed: any = rawOutput;
        try {
          parsed = JSON.parse(rawOutput);
        } catch {
          // Keep raw string if non-JSON payload
        }
        resolve({
          statusCode: res.statusCode,
          body: parsed,
          headers: res.getHeaders(),
        });
        return this;
      };

      app(req, res);

      process.nextTick(() => {
        if (payload !== null) {
          req.push(payload);
        }
        req.push(null);
      });
    } catch (error) {
      reject(error);
    }
  });
}

const submissionId = 'c0a80123-4567-4890-a123-456789abcdef';
const decisionId = 'd0a80123-4567-4890-a123-456789abcdef';

const sampleDecision: Decision = {
  id: decisionId,
  submissionId,
  decision: 'APPROVED',
  reviewerName: 'Judge Pratham',
  comments: 'Approved after review.',
  overriddenIssueIds: [],
  createdAt: '2026-11-05T10:00:00.000Z',
};

const validBody = {
  decision: 'APPROVED',
  reviewerName: 'Judge Pratham',
  comments: 'Approved after review.',
};

describe('Decisions Integration Tests (Express App E2E)', () => {
  const originalRecordDecision = decisionService.recordDecision.bind(
    decisionService
  );
  const originalGetDecisionBySubmissionId =
    decisionService.getDecisionBySubmissionId.bind(decisionService);

  function restoreMocks() {
    decisionService.recordDecision = originalRecordDecision;
    decisionService.getDecisionBySubmissionId =
      originalGetDecisionBySubmissionId;
  }

  beforeEach(() => {
    restoreMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  describe('POST /api/submissions/:id/decision', () => {
    it('returns 201 with the SubmitDecisionResponse contract', async () => {
      decisionService.recordDecision = async (input) => {
        assert.equal(input.submissionId, submissionId);
        assert.equal(input.decision, 'APPROVED');
        assert.deepEqual(input.overriddenIssueIds, []);
        return sampleDecision;
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: validBody,
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.decision.id, decisionId);
      assert.equal(res.body.decision.submissionId, submissionId);
      assert.equal(res.body.updatedSubmissionStatus, 'APPROVED');
    });

    it('reports REVIEWED for CHANGES_REQUESTED decisions', async () => {
      decisionService.recordDecision = async () => ({
        ...sampleDecision,
        decision: 'CHANGES_REQUESTED',
      });

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: { ...validBody, decision: 'CHANGES_REQUESTED' },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.updatedSubmissionStatus, 'REVIEWED');
    });

    it('returns 400 when the path and body submission IDs differ', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: {
          ...validBody,
          submissionId: 'f0a80123-4567-4890-a123-456789abcdef',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /does not match/);
    });

    it('returns 400 for an invalid request body', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Judge Pratham',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(Array.isArray(res.body.details));
    });

    it('returns 400 for an invalid decision type', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: { ...validBody, decision: 'MAYBE' },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions/not-a-valid-uuid/decision',
        body: validBody,
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });

    it('returns 404 when the submission does not exist', async () => {
      decisionService.recordDecision = async () => {
        throw new DecisionError(
          'SUBMISSION_NOT_FOUND',
          'Submission not found'
        );
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: validBody,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Submission not found');
    });

    it('returns 400 when the submission has not been reviewed', async () => {
      decisionService.recordDecision = async () => {
        throw new DecisionError(
          'SUBMISSION_NOT_REVIEWED',
          'Submission cannot receive a decision in PENDING status'
        );
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: validBody,
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /PENDING/);
    });

    it('returns 409 when a decision already exists', async () => {
      decisionService.recordDecision = async () => {
        throw new DecisionError(
          'DECISION_EXISTS',
          'A decision has already been recorded for this submission'
        );
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: validBody,
      });

      assert.equal(res.statusCode, 409);
      assert.match(res.body.error, /already been recorded/);
    });

    it('returns 400 for unknown override issue IDs', async () => {
      decisionService.recordDecision = async () => {
        throw new DecisionError(
          'UNKNOWN_OVERRIDE_ISSUE',
          'Override issue(s) do not belong to this submission'
        );
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: {
          ...validBody,
          overriddenIssueIds: [
            'e0a80123-4567-4890-a123-456789abcdef',
          ],
        },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /do not belong/);
    });

    it('returns 500 without leaking stack traces', async () => {
      decisionService.recordDecision = async () => {
        throw new Error('Unexpected database failure');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${submissionId}/decision`,
        body: validBody,
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Unexpected database failure');
      assert.equal(res.body.stack, undefined);
    });
  });

  describe('GET /api/submissions/:id/decision', () => {
    it('returns the recorded decision', async () => {
      decisionService.getDecisionBySubmissionId = async (id) => {
        assert.equal(id, submissionId);
        return sampleDecision;
      };

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${submissionId}/decision`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.decision.id, decisionId);
    });

    it('returns 404 when no decision exists', async () => {
      decisionService.getDecisionBySubmissionId = async () => null;

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${submissionId}/decision`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Decision not found');
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions/not-a-valid-uuid/decision',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });
  });
});
