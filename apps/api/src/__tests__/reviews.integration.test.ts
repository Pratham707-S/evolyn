import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';
import { REWRITE_ACTIONS, type ReviewRun } from '@evolyn/shared';

import { app } from '../app.js';
import { reviewService } from '../modules/reviews/reviews.routes.js';
import { submissionService } from '../modules/submissions/index.js';
import type { SubmissionWithReview } from '../modules/submissions/index.js';

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

const sampleSubmission: SubmissionWithReview = {
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
  const originalGetReviewHistory = reviewService.getReviewHistory?.bind(reviewService);
  const originalGetSubmissionById = submissionService.getSubmissionById.bind(submissionService);

  function restoreMocks() {
    reviewService.executeReview = originalExecuteReview;
    reviewService.getReviewBySubmissionId = originalGetReviewBySubmissionId;
    reviewService.getReviewHistory = originalGetReviewHistory;
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

    it('accepts revised content and executes review on revision', async () => {
      let passedOptions: unknown;
      reviewService.executeReview = async (id: string, options) => {
        assert.equal(id, validSubmissionId);
        passedOptions = options;
        return {
          reviewRun: sampleReviewRun,
          issues: [],
        };
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
        body: { content: 'Brand compliant revision text.' },
      });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(passedOptions, { content: 'Brand compliant revision text.' });
    });

    it('validates force parameter strictly: accepts boolean true and false, rejects string values', async () => {
      let passedOptions: unknown;
      reviewService.executeReview = async (id: string, options) => {
        passedOptions = options;
        return {
          reviewRun: sampleReviewRun,
          issues: [],
        };
      };

      // 1. force: true
      const resTrue = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
        body: { force: true },
      });
      assert.equal(resTrue.statusCode, 200);
      assert.deepEqual(passedOptions, { force: true });

      // 2. force: false
      const resFalse = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
        body: { force: false },
      });
      assert.equal(resFalse.statusCode, 200);
      assert.deepEqual(passedOptions, { force: false });

      // 3. force omitted
      const resOmitted = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
        body: {},
      });
      assert.equal(resOmitted.statusCode, 200);
      assert.equal(passedOptions, undefined);

      // 4. force: "true" (string) -> must be rejected with 400
      const resStringTrue = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
        body: { force: 'true' },
      });
      assert.equal(resStringTrue.statusCode, 400);
      assert.equal(resStringTrue.body.error, 'Validation failed');

      // 5. force: "false" (string) -> must be rejected with 400
      const resStringFalse = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/analyze`,
        body: { force: 'false' },
      });
      assert.equal(resStringFalse.statusCode, 400);
      assert.equal(resStringFalse.body.error, 'Validation failed');
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

  describe('GET /api/submissions/:id/reviews', () => {
    it('returns 200 with chronological review history array and total count', async () => {
      submissionService.getSubmissionById = async () => sampleSubmission;
      reviewService.getReviewHistory = async () => [
        {
          reviewRun: sampleReviewRun,
          issues: [],
        },
      ];

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/reviews`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.submissionId, validSubmissionId);
      assert.equal(res.body.total, 1);
      assert.equal(res.body.reviews.length, 1);
      assert.equal(res.body.reviews[0].reviewRun.id, validReviewRunId);
    });

    it('returns 404 when submission does not exist', async () => {
      submissionService.getSubmissionById = async () => null;

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validSubmissionId}/reviews`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Submission not found');
    });
  });

  describe('POST /api/submissions/:id/rewrite', () => {
    it('returns 200 with proposal for all eight supported actions', async () => {
      for (const action of REWRITE_ACTIONS) {
        reviewService.rewrite = async (id, input) => ({
          originalText: input.content,
          rewrittenText: `Rewritten: ${input.content}`,
          action: input.action,
          rationale: `Applied action ${input.action}.`,
        });

        const res = await dispatch({
          method: 'POST',
          url: `/api/submissions/${validSubmissionId}/rewrite`,
          body: {
            action,
            content: 'Brand copy that needs refinement.',
          },
        });

        assert.equal(res.statusCode, 200);
        assert.equal(res.body.action, action);
        assert.equal(res.body.originalText, 'Brand copy that needs refinement.');
        assert.equal(res.body.rewrittenText, 'Rewritten: Brand copy that needs refinement.');
        assert.equal(res.body.rationale, `Applied action ${action}.`);
      }
    });

    it('returns 400 when action is invalid', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'MAKE_FUNNY',
          content: 'Brand copy to rewrite.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(res.body.details.some((d: any) => d.field === 'action'));
    });

    it('returns 400 when content is missing', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'MAKE_SHORTER',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(res.body.details.some((d: any) => d.field === 'content'));
    });

    it('returns 400 when content is empty or whitespace only', async () => {
      const emptyRes = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'SIMPLIFY',
          content: '',
        },
      });
      assert.equal(emptyRes.statusCode, 400);
      assert.equal(emptyRes.body.error, 'Validation failed');

      const whitespaceRes = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'SIMPLIFY',
          content: '   \n  \t ',
        },
      });
      assert.equal(whitespaceRes.statusCode, 400);
      assert.equal(whitespaceRes.body.error, 'Validation failed');
    });

    it('returns 400 when content exceeds length limits', async () => {
      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'HUMANIZE',
          content: 'x'.repeat(50001),
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(res.body.details.some((d: any) => d.field === 'content'));
    });

    it('returns 404 when submission is not found', async () => {
      reviewService.rewrite = async () => {
        throw new Error(`Submission not found: ${validSubmissionId}`);
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'IMPROVE_WRITING',
          content: 'Some valid content.',
        },
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Submission not found');
    });

    it('returns 400 when submission id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions/not-a-uuid/rewrite',
        body: {
          action: 'IMPROVE_WRITING',
          content: 'Valid content.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
    });

    it('returns 500 without leaking stack traces or keys on provider failure', async () => {
      reviewService.rewrite = async () => {
        throw new Error('Gemini request failed with HTTP 500');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'GRAMMAR_SPELLING',
          content: 'Valid content for testing provider failure.',
        },
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Gemini request failed with HTTP 500');
      assert.equal(res.body.stack, undefined);
    });

    it('returns 500 when Gemini returns malformed output', async () => {
      reviewService.rewrite = async () => {
        throw new Error('Gemini returned invalid JSON for the rewrite');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'MAKE_LONGER',
          content: 'Valid content to expand.',
        },
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Gemini returned invalid JSON for the rewrite');
    });

    it('returns 500 when Gemini returns empty rewritten output', async () => {
      reviewService.rewrite = async () => {
        throw new Error('Gemini returned empty rewritten text');
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'SUMMARIZE',
          content: 'Valid content to summarize.',
        },
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Gemini returned empty rewritten text');
    });

    it('passes user instructions in rewrite request', async () => {
      let capturedInstructions: string | undefined;
      reviewService.rewrite = async (_id, input) => {
        capturedInstructions = input.instructions;
        return {
          originalText: input.content,
          rewrittenText: 'Tailored text',
          action: input.action,
          rationale: 'Followed user instruction',
        };
      };

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'CHANGE_TONE',
          content: 'We offer great software.',
          instructions: 'Sound more visionary and inspiring.',
        },
      });

      assert.equal(res.statusCode, 200);
      assert.equal(capturedInstructions, 'Sound more visionary and inspiring.');
    });

    it('guarantees original submission immutability and no auto-approval', async () => {
      let submissionUpdated = false;
      const initialRawText = sampleSubmission.rawText;
      const initialStatus = sampleSubmission.status;

      submissionService.updateSubmissionStatus = async () => {
        submissionUpdated = true;
      };

      reviewService.rewrite = async (_id, input) => ({
        originalText: input.content,
        rewrittenText: 'Polished text',
        action: input.action,
        rationale: 'Proposal only',
      });

      const res = await dispatch({
        method: 'POST',
        url: `/api/submissions/${validSubmissionId}/rewrite`,
        body: {
          action: 'IMPROVE_WRITING',
          content: sampleSubmission.rawText,
        },
      });

      assert.equal(res.statusCode, 200);
      assert.equal(submissionUpdated, false);
      assert.equal(sampleSubmission.rawText, initialRawText);
      assert.equal(sampleSubmission.status, initialStatus);
    });
  });
});
