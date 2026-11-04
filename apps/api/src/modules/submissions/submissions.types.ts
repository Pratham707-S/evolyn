import type { ContentSubmission, ReviewRun, Decision } from '@evolyn/shared';

export interface SubmissionWithReview extends ContentSubmission {
  reviewRun?: ReviewRun | null;
  decision?: Decision | null;
}
