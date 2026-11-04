import type {
  Guideline,
  GuidelineRule,
  GuidelineCategory,
  GuidelineStatus,
  RuleType,
  Severity,
} from '@evolyn/shared';

export interface GuidelineQueryFilter {
  category?: GuidelineCategory;
  status?: GuidelineStatus;
}

export interface RuleExtractionResult {
  ruleStatement: string;
  ruleType: RuleType;
  explanation: string;
  severity: Severity;
}
