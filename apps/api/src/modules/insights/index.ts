/**
 * ============================================================================
 * MODULE: Insights & Rule Improvement Loop (apps/api/src/modules/insights)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER : Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Innovation 3 — Recurring Mistake -> Guideline Improvement Loop:
 *    - Aggregate recurring rule violations across past submissions.
 *    - Identify rules with unusually high failure rates or frequent human overrides.
 * 2. Automated Rule Refinement Engine:
 *    - Use Gemini to analyze violation patterns and generate clarified wording suggestions.
 * 3. Human Approval of Guideline Edits:
 *    - Allow brand leads to preview `diff` of suggested guideline changes and apply them.
 *
 * GUARDRAILS & CONTRACTS:
 * - Guideline refinements must never be auto-applied; human lead confirmation is mandatory.
 * ============================================================================
 */

import type { RecurringMistake } from '@evolyn/shared';
import type { RuleRefinementSuggestion } from './insights.types.js';

export interface IInsightsService {
  trackViolation(ruleId: string, sampleExcerpt: string): Promise<void>;
  listRecurringMistakes(): Promise<RecurringMistake[]>;
  generateRefinement(ruleId: string): Promise<RuleRefinementSuggestion>;
  applyRefinement(ruleId: string, newStatement: string): Promise<void>;
}

export * from './insights.types.js';
