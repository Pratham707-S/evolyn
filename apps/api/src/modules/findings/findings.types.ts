import type { DetectedIssue, IssueType } from '@evolyn/shared';

export interface RawFindingInput {
  ruleId?: string | null;
  factId?: string | null;
  issueType: IssueType;
  flaggedExcerpt: string;
  charStart?: number | null;
  charEnd?: number | null;
  explanation: string;
  suggestedFix?: string;
  sourceQuote: string;
  sourceText: string;
  confidenceScore?: number;
  evidenceStrengthScore?: number;
}
