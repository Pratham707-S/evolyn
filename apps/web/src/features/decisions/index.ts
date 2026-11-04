/**
 * ============================================================================
 * FEATURE: Human Decision Workbench & Audit Trail (apps/web/src/features/decisions)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER        : Pratham Kave (Frontend Lead)
 * BACKEND COUNTERPART   : Ayan (Backend Lead)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Human Decision Modal & Sign-off UI:
 *    - Three clear action triggers: APPROVED (Green), CHANGES_REQUESTED (Amber), REJECTED (Red).
 *    - Required reviewer name and feedback comments textarea.
 * 2. Issue Override Checklist:
 *    - Allow reviewer to explicitly mark false positives / overrides with justification.
 * 3. Immutable Decision & Audit Trail Badge:
 *    - Display permanent sign-off badge with reviewer timestamp on completed reviews.
 *
 * API INTEGRATION POINTS:
 * - POST /api/decisions (Submit Human Sign-off)
 * - GET  /api/decisions/:submissionId (Audit history)
 * ============================================================================
 */

import type { Decision, DecisionType, SubmitDecisionInput } from '@evolyn/shared';

export interface DecisionFormValues {
  decision: DecisionType;
  reviewerName: string;
  comments: string;
  overriddenIssueIds: string[];
}

export type { Decision, SubmitDecisionInput };
