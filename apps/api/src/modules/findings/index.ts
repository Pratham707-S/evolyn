/**
 * ============================================================================
 * MODULE: Issue Findings & Verbatim Citations (apps/api/src/modules/findings)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNERS: Ayan (Backend Lead) & Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Anti-Hallucination Verbatim Quote Guard:
 *    - `verifyVerbatimQuote(quote, sourceText)`: Confirms `sourceQuote` exists verbatim
 *      inside canonical stored source before an issue is allowed to persist.
 * 2. Innovation 2 — Claim Evidence Strength Engine:
 *    - For every factual claim flagged, compute evidence strength (0% to 100%).
 *    - Cross-reference with verified facts in knowledge repo.
 * 3. Issue Severity Classification:
 *    - Categorize issues: CRITICAL, HIGH, MEDIUM, LOW, SUGGESTION.
 *
 * GUARDRAILS & CONTRACTS:
 * - NEVER accept an issue where `sourceQuote` is generated or hallucinated by LLM.
 * - Adhere to `detectedIssueSchema` from `@evolyn/shared`.
 * ============================================================================
 */

import type { DetectedIssue } from '@evolyn/shared';
import type { RawFindingInput } from './findings.types.js';

export interface IFindingsService {
  recordFindings(
    reviewRunId: string,
    rawFindings: RawFindingInput[],
    submissionText: string
  ): Promise<DetectedIssue[]>;
  verifyVerbatimQuote(quote: string, sourceText: string): boolean;
  getFindingsByReviewRunId(reviewRunId: string): Promise<DetectedIssue[] | null>;
}

export { FindingsService, findingsService } from './findings.service.js';
export { FindingsRepository, findingsRepository } from './findings.repository.js';
export { FindingsController, findingsController } from './findings.controller.js';
export * from './findings.types.js';
