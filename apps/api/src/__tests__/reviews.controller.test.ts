import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Request, Response, NextFunction } from 'express';
import type { ReviewRun } from '@evolyn/shared';
import { ReviewsController } from '../modules/reviews/reviews.controller.js';
import { createReviewsRouter } from '../modules/reviews/reviews.routes.js';
import type { IReviewService } from '../modules/reviews/index.js';
import type { ISubmissionService } from '../modules/submissions/index.js';

const submissionId = 'c0a80123-4567-4890-a123-456789abcdef';
const reviewRun: ReviewRun = {
  id: 'd0a80123-4567-4890-a123-456789abcdef',
  submissionId,
  overallComplianceScore: 85,
  totalIssuesCount: 1,
  modelUsed: 'test-model',
  summary: { passedChecksCount: 4, failedChecksCount: 1 },
  createdAt: '2026-11-05T00:01:00.000Z',
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

function createReviewService(
  overrides: Partial<IReviewService> = {}
): IReviewService {
  return {
    executeReview: async () => ({ reviewRun, issues: [] }),
    getReviewBySubmissionId: async () => ({ reviewRun, issues: [] }),
    ...overrides,
  };
}

function createSubmissionService(
  overrides: Partial<Pick<ISubmissionService, 'getSubmissionById'>> = {}
): Pick<ISubmissionService, 'getSubmissionById'> {
  return {
    getSubmissionById: async () => ({
      id: submissionId,
      title: 'Launch copy',
      channel: 'SOCIAL',
      rawText: 'A reviewed draft.',
      submittedBy: 'Ayan',
      status: 'REVIEWED',
      createdAt: '2026-11-05T00:00:00.000Z',
      updatedAt: '2026-11-05T00:01:00.000Z',
      reviewRun,
      decision: null,
    }),
    ...overrides,
  };
}

describe('ReviewsController', () => {
  it('registers analyze and review detail routes', () => {
    const router = createReviewsRouter(
      createReviewService(),
      createSubmissionService()
    );
    const routes = router.stack
      .filter((layer) => layer.route)
      .map((layer) => ({
        path: layer.route?.path,
        methods: layer.route?.stack.map((routeLayer) => routeLayer.method),
      }));

    assert.deepEqual(routes, [
      { path: '/submissions/:id/analyze', methods: ['post'] },
      { path: '/submissions/:id/rewrite', methods: ['post'] },
      { path: '/submissions/:id/review', methods: ['get'] },
      { path: '/submissions/:id/reviews', methods: ['get'] },
    ]);
  });

  it('returns the analyze response contract', async () => {
    const controller = new ReviewsController(createReviewService(), createSubmissionService());
    const req = { params: { id: submissionId } } as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (error?: unknown) => {
      if (error) throw error;
    };

    await controller.analyze(
      req,
      res as unknown as Response,
      next
    );

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      reviewRunId: reviewRun.id,
      submissionId,
      overallComplianceScore: 85,
      totalIssuesCount: 1,
      summary: reviewRun.summary,
      issues: [],
    });
  });

  it('returns complete review details and 404 when no review exists', async () => {
    const controller = new ReviewsController(
      createReviewService(),
      createSubmissionService()
    );
    const req = { params: { id: submissionId } } as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (error?: unknown) => {
      if (error) throw error;
    };

    await controller.getBySubmissionId(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 200);
    assert.equal((res.body as { reviewRun: ReviewRun }).reviewRun.id, reviewRun.id);
    assert.equal((res.body as { decision: null }).decision, null);

    const missingController = new ReviewsController(
      createReviewService({ getReviewBySubmissionId: async () => null }),
      createSubmissionService()
    );
    const missingResponse = createResponse();
    await missingController.getBySubmissionId(
      req,
      missingResponse as unknown as Response,
      next
    );
    assert.equal(missingResponse.statusCode, 404);
  });

  it('handles rewrite requests and returns the rewrite response contract', async () => {
    const controller = new ReviewsController(
      createReviewService({
        rewrite: async () => ({
          originalText: 'Original text to rewrite',
          rewrittenText: 'Concise text',
          action: 'MAKE_SHORTER',
          rationale: 'Removed superfluous words.',
        }),
      }),
      createSubmissionService()
    );
    const req = {
      params: { id: submissionId },
      body: {
        action: 'MAKE_SHORTER',
        content: 'Original text to rewrite',
      },
    } as unknown as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (error?: unknown) => {
      if (error) throw error;
    };

    await controller.rewrite(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      originalText: 'Original text to rewrite',
      rewrittenText: 'Concise text',
      action: 'MAKE_SHORTER',
      rationale: 'Removed superfluous words.',
    });
  });

  it('returns 404 from rewrite handler when submission is not found', async () => {
    const controller = new ReviewsController(
      createReviewService({
        rewrite: async () => {
          throw new Error(`Submission not found: ${submissionId}`);
        },
      }),
      createSubmissionService()
    );
    const req = {
      params: { id: submissionId },
      body: {
        action: 'IMPROVE_WRITING',
        content: 'Text to improve',
      },
    } as unknown as Request<{ id: string }>;
    const res = createResponse();
    const next: NextFunction = (error?: unknown) => {
      if (error) throw error;
    };

    await controller.rewrite(req, res as unknown as Response, next);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Submission not found' });
  });
});
