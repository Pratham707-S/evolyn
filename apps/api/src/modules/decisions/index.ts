/**
 * ============================================================================
 * MODULE: Human Decisions & Audit Sign-Off (apps/api/src/modules/decisions)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER: Lead Architect / Backend Engineer
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES:
 * 1. Human Sign-Off Workflow:
 *    - Process explicit human decisions: APPROVED, REJECTED, CHANGES_REQUESTED.
 *    - Record reviewer identity, decision, timestamp, comments, and overrides.
 *    - Ensure decision records remain immutable.
 * 2. Audit Trail & Decision History:
 *    - Maintain chronological decision history for submissions across revisions.
 *    - Update submission status safely and track issue overrides.
 * 3. Cross-Module Coordination:
 *    - Update submission status (APPROVED, REJECTED, or stay in REVIEWED).
 *    - Mark overridden issues in findings.
 *    - Notify recurring mistake insights safely.
 * ============================================================================
 */

import type { Decision, SubmitDecisionInput } from '@evolyn/shared';

export interface IDecisionService {
  recordDecision(input: SubmitDecisionInput): Promise<Decision>;
  getDecisionBySubmissionId(submissionId: string): Promise<Decision | null>;
  getDecisionHistory?(submissionId: string): Promise<Decision[]>;
}

export { DecisionService, decisionService } from './decisions.service.js';
export {
  DecisionsController,
  decisionsController,
} from './decisions.controller.js';
export {
  createDecisionsRouter,
  decisionsRouter,
} from './decisions.routes.js';
export * from './decisions.types.js';
export * from './decisions.repository.js';
