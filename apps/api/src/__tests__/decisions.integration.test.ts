import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import http from 'http';
import { Socket } from 'net';
import type { Decision, SubmissionStatus } from '@evolyn/shared';

import { app } from '../app.js';
import { DecisionError } from '../modules/decisions/decisions.types.js';
import { decisionService } from '../modules/decisions/decisions.routes.js';
import { submissionService, type SubmissionWithReview } from '../modules/submissions/index.js';
import { reviewService } from '../modules/reviews/reviews.routes.js';
import type { DecisionRecord } from '../modules/decisions/decisions.repository.js';

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

      const payload = options.body !== undefined ? JSON.stringify(options.body) : null;
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
          req.emit('data', Buffer.from(payload));
        }
        req.emit('end');
      });
    } catch (err) {
      reject(err);
    }
  });
}

const validSubmissionId = 'a1a80123-4567-4890-a123-456789abcdef';
const validDecisionId = 'b2a80123-4567-4890-a123-456789abcdef';
const validIssueId = 'c3a80123-4567-4890-a123-456789abcdef';

const sampleDecision: Decision = {
  id: validDecisionId,
  submissionId: validSubmissionId,
  decision: 'APPROVED',
  reviewerName: 'Chief Brand Officer',
  comments: 'All brand claims are verified.',
  overriddenIssueIds: [],
  createdAt: '2026-11-05T12:00:00.000Z',
};

const sampleSubmission: SubmissionWithReview = {
  id: validSubmissionId,
  title: 'Q4 Product Launch Announcement',
  channel: 'BLOG',
  rawText: 'Our cloud platform delivers enterprise-grade SLA compliance.',
  submittedBy: 'DevOps Lead',
  status: 'REVIEWED',
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T11:00:00.000Z',
  reviewRun: null,
  decision: null,
};

describe('Decisions Integration Tests (Express App E2E)', () => {
  let originalRecordDecision: typeof decisionService.recordDecision;
  let originalGetDecisionBySubmissionId: typeof decisionService.getDecisionBySubmissionId;
  let originalGetDecisionHistory: typeof decisionService.getDecisionHistory;
  let originalGetSubmissionById: typeof submissionService.getSubmissionById;
  let originalUpdateSubmissionStatus: typeof submissionService.updateSubmissionStatus;

  beforeEach(() => {
    originalRecordDecision = decisionService.recordDecision;
    originalGetDecisionBySubmissionId = decisionService.getDecisionBySubmissionId;
    originalGetDecisionHistory = decisionService.getDecisionHistory;
    originalGetSubmissionById = submissionService.getSubmissionById;
    originalUpdateSubmissionStatus = submissionService.updateSubmissionStatus;

    submissionService.getSubmissionById = async () => sampleSubmission;
    submissionService.updateSubmissionStatus = async () => {};
  });

  afterEach(() => {
    decisionService.recordDecision = originalRecordDecision;
    decisionService.getDecisionBySubmissionId = originalGetDecisionBySubmissionId;
    decisionService.getDecisionHistory = originalGetDecisionHistory;
    submissionService.getSubmissionById = originalGetSubmissionById;
    submissionService.updateSubmissionStatus = originalUpdateSubmissionStatus;
  });

  describe('POST /api/submissions/:id/decision', () => {
    it('records an APPROVED decision and returns 201 with updated status', async () => {
      let passedInput: any;
      decisionService.recordDecision = async (input) => {
        passedInput = input;
        return sampleDecision;
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'All brand claims are verified.',
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.decision.id, validDecisionId);
      assert.equal(res.body.decision.decision, 'APPROVED');
      assert.equal(res.body.updatedSubmissionStatus, 'APPROVED');
      assert.equal(passedInput.submissionId, validSubmissionId);
    });

    it('records a REJECTED decision and returns 201 with updated status', async () => {
      decisionService.recordDecision = async () => ({
        ...sampleDecision,
        decision: 'REJECTED',
      });

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'REJECTED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Contains prohibited claims.',
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.decision.decision, 'REJECTED');
      assert.equal(res.body.updatedSubmissionStatus, 'REJECTED');
    });

    it('records CHANGES_REQUESTED and keeps submission status in REVIEWED', async () => {
      decisionService.recordDecision = async () => ({
        ...sampleDecision,
        decision: 'CHANGES_REQUESTED',
      });

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'CHANGES_REQUESTED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Please adjust claims wording.',
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.decision.decision, 'CHANGES_REQUESTED');
      assert.equal(res.body.updatedSubmissionStatus, 'REVIEWED');
    });

    it('returns 400 when body submissionId mismatches the URL parameter', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          submissionId: 'e9eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Mismatch check.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(
        res.body.error,
        'Body submissionId does not match the submission in the URL'
      );
    });

    it('returns 400 when decision type is invalid', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'INVALID_TYPE',
          reviewerName: 'Chief Brand Officer',
          comments: 'Invalid decision.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });

    it('returns 400 when comments are missing or empty', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: '',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });

    it('returns 400 when reviewerName is missing', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          comments: 'Good.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions/not-a-uuid/decision',
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'UUID check.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });

    it('returns 404 when submission does not exist', async () => {
      submissionService.getSubmissionById = async () => null;

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Submission does not exist.',
        },
      });

      assert.equal(res.statusCode, 404);
      assert.match(res.body.error, /Submission not found/);
    });

    it('returns 400 when submission is in PENDING status', async () => {
      submissionService.getSubmissionById = async () => ({
        ...sampleSubmission,
        status: 'PENDING',
      });

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Cannot decide on pending submission.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /Submission cannot receive a decision in PENDING status/);
    });

    it('returns 409 when attempting to record a decision on an already finalized submission', async () => {
      submissionService.getSubmissionById = async () => ({
        ...sampleSubmission,
        status: 'APPROVED',
      });

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Duplicate decision check.',
        },
      });

      assert.equal(res.statusCode, 409);
      assert.match(res.body.error, /A final decision has already been recorded/);
    });

    it('returns 400 when overridden issue does not belong to submission', async () => {
      decisionService.recordDecision = async () => {
        throw new DecisionError(
          'UNKNOWN_OVERRIDE_ISSUE',
          'Override issue(s) do not belong to this submission: f9eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
        );
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Overriding non-existent issue.',
          overriddenIssueIds: ['f9eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
        },
      });

      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, /Override issue\(s\) do not belong to this submission/);
    });

    it('returns 500 without leaking stack traces on unexpected internal error', async () => {
      decisionService.recordDecision = async () => {
        throw new Error('Database connection failure');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Error test.',
        },
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Database connection failure');
      assert.equal(res.body.stack, undefined);
    });
  });

  describe('GET /api/submissions/:id/decision', () => {
    it('returns 200 with latest decision', async () => {
      decisionService.getDecisionBySubmissionId = async (id) => {
        assert.equal(id, validSubmissionId);
        return sampleDecision;
      };

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/decision`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.decision.id, validDecisionId);
      assert.equal(res.body.decision.decision, 'APPROVED');
    });

    it('returns 404 when no decision exists', async () => {
      decisionService.getDecisionBySubmissionId = async () => null;

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/decision`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Decision not found');
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions/invalid-id/decision',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });
  });

  describe('GET /api/submissions/:id/decisions (Decision History)', () => {
    it('returns 200 with chronological decision history and total count', async () => {
      const dec1: Decision = {
        ...sampleDecision,
        id: '11111111-1111-4111-a111-111111111111',
        decision: 'CHANGES_REQUESTED',
        createdAt: '2026-11-05T09:00:00.000Z',
      };
      const dec2: Decision = {
        ...sampleDecision,
        id: '22222222-2222-4222-a222-222222222222',
        decision: 'APPROVED',
        createdAt: '2026-11-05T12:00:00.000Z',
      };

      decisionService.getDecisionHistory = async (id) => {
        assert.equal(id, validSubmissionId);
        return [dec1, dec2];
      };

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/decisions`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.submissionId, validSubmissionId);
      assert.equal(res.body.total, 2);
      assert.equal(res.body.decisions.length, 2);
      assert.equal(res.body.decisions[0].id, dec1.id);
      assert.equal(res.body.decisions[0].decision, 'CHANGES_REQUESTED');
      assert.equal(res.body.decisions[1].id, dec2.id);
      assert.equal(res.body.decisions[1].decision, 'APPROVED');
    });

    it('returns 404 when submission does not exist', async () => {
      submissionService.getSubmissionById = async () => null;

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/decisions`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Submission not found');
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions/bad-uuid/decisions',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });
  });

  describe('Full Revision Lifecycle (CHANGES_REQUESTED -> Revision -> Re-Audit -> Approval)', () => {
    it('executes complete revision lifecycle and verifies chronological audit trail', async () => {
      let currentSubmissionStatus: SubmissionStatus = 'REVIEWED';
      const recordedDecisions: Decision[] = [];

      submissionService.getSubmissionById = async () => ({
        ...sampleSubmission,
        status: currentSubmissionStatus,
      });

      submissionService.updateSubmissionStatus = async (_id, status) => {
        currentSubmissionStatus = status;
      };

      decisionService.recordDecision = async (input) => {
        const id = `dec-${recordedDecisions.length + 1}`;
        const dec: Decision = {
          id,
          submissionId: input.submissionId,
          decision: input.decision,
          reviewerName: input.reviewerName,
          comments: input.comments,
          overriddenIssueIds: input.overriddenIssueIds ?? [],
          createdAt: new Date().toISOString(),
        };
        recordedDecisions.push(dec);
        return dec;
      };

      decisionService.getDecisionHistory = async () => recordedDecisions;

      // Step 1: Initial decision is CHANGES_REQUESTED
      const step1 = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'CHANGES_REQUESTED',
          reviewerName: 'Legal Reviewer',
          comments: 'Please tone down guarantee assertions.',
        },
      });
      assert.equal(step1.statusCode, 201);
      assert.equal(step1.body.decision.decision, 'CHANGES_REQUESTED');
      assert.equal(step1.body.updatedSubmissionStatus, 'REVIEWED');

      // Step 2: Author revises content and triggers re-audit
      reviewService.executeReview = async () => ({
        reviewRun: {
          id: 'new-run-id',
          submissionId: validSubmissionId,
          overallComplianceScore: 98,
          totalIssuesCount: 0,
          modelUsed: 'gemini-2.0-flash',
          summary: { passedChecksCount: 5, failedChecksCount: 0 },
          createdAt: new Date().toISOString(),
        },
        issues: [],
      });

      const step2 = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
        body: {
          content: 'Our cloud platform delivers enterprise-grade SLA compliance with industry best practices.',
        },
      });
      assert.equal(step2.statusCode, 200);

      // Step 3: Reviewer inspects revised audit and records APPROVED
      const step3 = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/decision`,
        body: {
          decision: 'APPROVED',
          reviewerName: 'Chief Brand Officer',
          comments: 'Revised wording meets compliance standards.',
        },
      });
      assert.equal(step3.statusCode, 201);
      assert.equal(step3.body.decision.decision, 'APPROVED');
      assert.equal(step3.body.updatedSubmissionStatus, 'APPROVED');

      // Step 4: Decision history contains both decisions in order
      const historyRes = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/decisions`,
      });
      assert.equal(historyRes.statusCode, 200);
      assert.equal(historyRes.body.total, 2);
      assert.equal(historyRes.body.decisions[0].decision, 'CHANGES_REQUESTED');
      assert.equal(historyRes.body.decisions[1].decision, 'APPROVED');

      // Step 5: Immutability guarantee: neither decision record was overwritten or modified
      assert.equal(historyRes.body.decisions[0].reviewerName, 'Legal Reviewer');
      assert.equal(historyRes.body.decisions[1].reviewerName, 'Chief Brand Officer');
    });
  });
});
