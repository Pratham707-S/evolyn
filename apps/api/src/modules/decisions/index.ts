/**
 * ============================================================================
 * MODULE: Human Review Decisions (apps/api/src/modules/decisions)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER : Ayan (Backend Lead)
 * REVIEWER       : Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Human Decision Sign-off Workflow:
 *    - Record final human judgment: APPROVED, REJECTED, or CHANGES_REQUESTED.
 *    - Capture mandatory reviewer identity, comments, and overridden issue IDs.
 * 2. Immutable Audit Logging:
 *    - Persist final sign-off into `decisions` table with timestamp and reviewer metadata.
 * 3. Submission Lifecycle Finalization:
 *    - Transition submission status to final state (APPROVED / REJECTED) upon decision.
 *
 * GUARDRAILS & CONTRACTS:
 * - AI cannot approve content autonomously; decisions require human authentication.
 * - Validate input against `submitDecisionSchema` from `@evolyn/shared`.
 * ============================================================================
 */

import type { Decision, SubmitDecisionInput } from '@evolyn/shared';

export interface IDecisionService {
  recordDecision(input: SubmitDecisionInput): Promise<Decision>;
  getDecisionBySubmissionId(submissionId: string): Promise<Decision | null>;
}

export * from './decisions.types.js';
