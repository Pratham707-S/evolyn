import type { RecurringMistake } from '@evolyn/shared';

export interface RuleRefinementSuggestion {
  ruleId: string;
  originalStatement: string;
  suggestedRevision: string;
  rationale: string;
  violationCount: number;
}
