import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';
import type { ReviewRun, SubmissionDetails } from '@evolyn/shared';

import { app } from '../app.js';
import { reviewService } from '../modules/reviews/reviews.routes.js';
import { submissionService } from '../modules/submissions/index.js';

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
const validReviewRunId = 'b2a80123-4567-4890-a123-456789abcdef';

const sampleReviewRun: ReviewRun = {
  id: validReviewRunId,
  submissionId: validSubmissionId,
  overallComplianceScore: 92,
  totalIssuesCount: 0,
  modelUsed: 'gemini-1.5-pro',
  summary: {
    passedChecksCount: 5,
    failedChecksCount: 0,
  },
  createdAt: '2026-11-05T12:00:00.000Z',
};

const sampleSubmission: SubmissionDetails = {
  id: validSubmissionId,
  title: 'Q4 Product Launch Announcement',
  channel: 'BLOG',
  rawText: 'Our cloud platform delivers enterprise-grade SLA compliance guaranteed across all regions.',
  submittedBy: 'DevOps Lead',
  status: 'PENDING',
  createdAt: '2026-11-05T11:00:00.000Z',
  updatedAt: '2026-11-05T11:00:00.000Z',
  reviewRun: null,
  decision: null,
};

describe('Reviews Integration Tests (Express App E2E)', () => {
  const originalExecuteReview = reviewService.executeReview.bind(reviewService);
  const originalGetReviewBySubmissionId = reviewService.getReviewBySubmissionId.bind(reviewService);
  const originalGetSubmissionById = submissionService.getSubmissionById.bind(submissionService);

  function restoreMocks() {
    reviewService.executeReview = originalExecuteReview;
    reviewService.getReviewBySubmissionId = originalGetReviewBySubmissionId;
    submissionService.getSubmissionById = originalGetSubmissionById;
  }

  beforeEach(() => {
    restoreMocks();
  });

  afterEach(() => {
    restoreMocks();
  });

  describe('POST /api/submissions/:id/analyze', () => {
    it('returns 200 with review run and detected issues', async () => {
      reviewService.executeReview = async (id: string) => {
        assert.equal(id, validSubmissionId);
        return {
          reviewRun: sampleReviewRun,
          issues: [],
        };
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.reviewRunId, validReviewRunId);
      assert.equal(res.body.submissionId, validSubmissionId);
      assert.equal(res.body.overallComplianceScore, 92);
      assert.equal(res.body.totalIssuesCount, 0);
      assert.deepEqual(res.body.issues, []);
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions/not-a-valid-uuid/analyze',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(Array.isArray(res.body.details));
    });

    it('returns 404 when submission does not exist', async () => {
      reviewService.executeReview = async () => {
        throw new Error('Submission not found');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Submission not found');
    });

    it('returns 400 when submission is in an invalid status for analysis', async () => {
      reviewService.executeReview = async () => {
        throw new Error('Submission cannot be analyzed in status APPROVED');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Submission cannot be analyzed in status APPROVED');
    });

    it('returns 500 when unexpected internal error occurs without leaking stack traces', async () => {
      reviewService.executeReview = async () => {
        throw new Error('Unexpected database failure');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Unexpected database failure');
      assert.equal(res.body.stack, undefined);
    });
  });

  describe('GET /api/submissions/:id/review', () => {
    it('returns 200 with submission details, review run, issues, and decision', async () => {
      submissionService.getSubmissionById = async (id: string) => {
        assert.equal(id, validSubmissionId);
        return {
          ...sampleSubmission,
          status: 'REVIEWED',
          reviewRun: sampleReviewRun,
        };
      };

      reviewService.getReviewBySubmissionId = async (id: string) => {
        assert.equal(id, validSubmissionId);
        return {
          reviewRun: sampleReviewRun,
          issues: [],
        };
      };

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/review`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.submission.id, validSubmissionId);
      assert.equal(res.body.reviewRun.id, validReviewRunId);
      assert.deepEqual(res.body.issues, []);
      assert.equal(res.body.decision, null);
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions/not-a-valid-uuid/review',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(Array.isArray(res.body.details));
    });

    it('returns 404 when review does not exist', async () => {
      submissionService.getSubmissionById = async () => sampleSubmission;
      reviewService.getReviewBySubmissionId = async () => null;

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/review`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Review not found');
    });

    it('returns 404 when submission does not exist', async () => {
      submissionService.getSubmissionById = async () => null;
      reviewService.getReviewBySubmissionId = async () => ({
        reviewRun: sampleReviewRun,
        issues: [],
      });

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/review`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Review not found');
    });
  });
});
