/**
 * ============================================================================
 * MODULE: Review Orchestration Pipeline (apps/api/src/modules/reviews)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNERS: Ayan (Backend Lead) & Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. 5-Step Review Execution Pipeline:
 *    - Step 1: Fetch submission copy and embed chunks via Gemini API.
 *    - Step 2: Retrieve candidate brand rules from `guidelines` module (cosine similarity).
 *    - Step 3: Retrieve verified facts from `knowledge` module for all claims.
 *    - Step 4: Run structured LLM evaluation (tone, claims, prohibited vocabulary, grammar).
 *    - Step 5: Send raw issues to `findings` module for verbatim quote validation.
 * 2. Audit Trail Persistence:
 *    - Persist `review_runs` with start/completion timestamps, total issue counts, and status.
 *
 * GUARDRAILS & CONTRACTS:
 * - Keep review execution idempotent per submission revision.
 * - Every flagged issue must pass verbatim verification before persisting.
 * ============================================================================
 */

import type { RewriteContentInput, RewriteResponse } from '@evolyn/shared';
import type { ReviewExecutionOptions, ReviewExecutionResult } from './reviews.types.js';

export interface IReviewService {
  executeReview(
    submissionId: string,
    options?: ReviewExecutionOptions
  ): Promise<ReviewExecutionResult>;
  getReviewBySubmissionId(submissionId: string): Promise<ReviewExecutionResult | null>;
  getReviewHistory?(submissionId: string): Promise<ReviewExecutionResult[]>;
  rewrite?(
    submissionId: string,
    input: RewriteContentInput
  ): Promise<RewriteResponse>;
}

export { ReviewService } from './reviews.service.js';
export { ReviewsController } from './reviews.controller.js';
export { createReviewsRouter, reviewsRouter, reviewService, defaultGuidelineRuleSearch } from './reviews.routes.js';
export * from './reviews.types.js';
