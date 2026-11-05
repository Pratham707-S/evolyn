import { Router } from 'express';
import { asc, cosineDistance, getTableColumns, isNotNull, sql } from 'drizzle-orm';
import type { GuidelineRule } from '@evolyn/shared';

import type { ISubmissionService } from '../submissions/index.js';
import { submissionService } from '../submissions/index.js';
import { findingsService } from '../findings/index.js';
import { knowledgeService } from '../knowledge/index.js';
import { GeminiAIProvider } from '../../infrastructure/ai/gemini.provider.js';
import { db } from '../../db/index.js';
import { guidelineRules } from '../../db/schema.js';
import type { IReviewService } from './index.js';
import { ReviewService } from './reviews.service.js';
import { ReviewsController } from './reviews.controller.js';

export function createReviewsRouter(
  reviews: IReviewService,
  submissions: Pick<ISubmissionService, 'getSubmissionById'>
) {
  const router = Router();
  const controller = new ReviewsController(reviews, submissions);

  router.post('/submissions/:id/analyze', controller.analyze);
  router.get('/submissions/:id/review', controller.getBySubmissionId);

  return router;
}

export const defaultGuidelineRuleSearch = {
  async findSimilarRules(queryVector: number[], limit = 20): Promise<GuidelineRule[]> {
    try {
      const distance = cosineDistance(guidelineRules.embedding, queryVector);
      const rows = await db
        .select({
          ...getTableColumns(guidelineRules),
          distance: sql<number>`${distance}`,
        })
        .from(guidelineRules)
        .where(isNotNull(guidelineRules.embedding))
        .orderBy(asc(distance))
        .limit(limit);

      return rows.map((record) => ({
        id: record.id,
        guidelineId: record.guidelineId,
        ruleType: record.ruleType as GuidelineRule['ruleType'],
        ruleStatement: record.ruleStatement,
        explanation: record.explanation,
        severity: record.severity as GuidelineRule['severity'],
        metadata:
          record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
            ? (record.metadata as Record<string, unknown>)
            : undefined,
        createdAt: record.createdAt.toISOString(),
      }));
    } catch {
      return [];
    }
  },
};

export const reviewService: IReviewService = new ReviewService({
  submissions: submissionService,
  guidelines: defaultGuidelineRuleSearch,
  knowledge: knowledgeService,
  findings: findingsService,
  ai: new GeminiAIProvider(),
});

export const reviewsRouter = createReviewsRouter(reviewService, submissionService);

