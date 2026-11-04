import type { RecurringMistake } from '@evolyn/shared';
import type { RuleRefinementSuggestion } from './insights.types.js';

export interface IInsightsService {
  trackViolation(ruleId: string, sampleExcerpt: string): Promise<void>;
  listRecurringMistakes(): Promise<RecurringMistake[]>;
  generateRefinement(ruleId: string): Promise<RuleRefinementSuggestion>;
  applyRefinement(ruleId: string, newStatement: string): Promise<void>;
}

export * from './insights.types.js';
