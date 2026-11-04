import type { Guideline, GuidelineRule } from '@evolyn/shared';

export interface GuidelineQueryFilter {
  category?: string;
  status?: string;
  limit?: number;
}

export interface RuleExtractionResult {
  ruleStatement: string;
  ruleType: 'MANDATORY' | 'PROHIBITED' | 'CONDITIONAL' | 'RECOMMENDED';
  explanation: string;
  severity: 'CRITICAL' | 'WARNING' | 'SUGGESTION';
}
