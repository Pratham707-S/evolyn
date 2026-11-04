import type { DetectedIssue, ReviewRun } from '@evolyn/shared';

export interface ReviewExecutionResult {
  reviewRun: ReviewRun;
  issues: DetectedIssue[];
}
