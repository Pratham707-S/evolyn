import type { ReviewExecutionResult } from './reviews.types.js';

export interface IReviewService {
  executeReview(submissionId: string): Promise<ReviewExecutionResult>;
  getReviewBySubmissionId(submissionId: string): Promise<ReviewExecutionResult | null>;
}

export * from './reviews.types.js';
