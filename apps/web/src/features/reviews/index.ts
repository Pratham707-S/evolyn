import type { DetectedIssue, ReviewRun } from '@evolyn/shared';

export interface ReviewViewState {
  selectedIssueId?: string | null;
  activeSeverityFilter?: string;
  isDecisionModalOpen: boolean;
}

export type { DetectedIssue, ReviewRun };
