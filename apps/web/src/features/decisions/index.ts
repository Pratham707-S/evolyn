import type { Decision, DecisionType, SubmitDecisionInput } from '@evolyn/shared';

export interface DecisionFormValues {
  decision: DecisionType;
  reviewerName: string;
  comments: string;
  overriddenIssueIds: string[];
}

export type { Decision, SubmitDecisionInput };
