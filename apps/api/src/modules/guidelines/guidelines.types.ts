import type {
  GuidelineCategory,
  GuidelineStatus,
  RuleType,
  Severity,
} from '@evolyn/shared';

export interface GuidelineQueryFilter {
  category?: GuidelineCategory;
  status?: GuidelineStatus;
}

/**
 * Represents one atomic, verifiable rule extracted
 * from a brand guideline.
 */
export interface RuleExtractionResult {
  ruleStatement: string;
  ruleType: RuleType;
  explanation: string;
  severity: Severity;
}

/**
 * Abstraction for extracting rules from guideline content.
 * Actual AI implementation will be injected later.
 */
export interface GuidelineRuleExtractor {
  extractRules(
    rawContent: string,
  ): Promise<RuleExtractionResult[]>;
}
