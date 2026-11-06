/**
 * ============================================================================
 * FEATURE: Human Decision Workbench & Audit Trail (apps/web/src/features/decisions)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER: Lead Frontend Engineer
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & CAPABILITIES:
 * 1. Human Decision Modal & Sign-Off Workbench:
 *    - Three clear action triggers: APPROVED, CHANGES_REQUESTED, REJECTED.
 *    - Required reviewer name and feedback comments textarea.
 * 2. Issue Override Checklist:
 *    - Allow reviewer to explicitly mark false positives / overrides with justification.
 * 3. Immutable Decision & Audit Trail Timeline:
 *    - Display permanent sign-off badge and chronological history with reviewer timestamp.
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

// Components from PR #20 (Live API integration)
export { DecisionBadge } from './components/decision-badge';
export { DecisionModal } from './components/decision-modal';
export { ApprovalQueue } from './components/approval-queue';
export { ApprovalDetailView } from './components/approval-detail-view';
export {
  DecisionHistoryTimeline,
  type DecisionHistoryTimelineProps,
  type TimelineDecision,
} from './components/decision-history-timeline';

// Rich UI Components & Types from PR #14 / Brand UI
export { ApprovalsMetrics } from './components/approvals-metrics';
export { ApprovalsTabs } from './components/approvals-tabs';
export { ApprovalsTable } from './components/approvals-table';
export {
  ApprovalInspector,
  type DecisionItem,
  type AuditChangeItem,
} from './components/approval-inspector';
export { DecisionDetailModal } from './components/decision-detail-modal';
export { DecisionHistoryDetail } from './components/decision-history-detail';
export { DecisionHistoryMetrics } from './components/decision-history-metrics';

// API client helpers
export * from './api/decisions-api';
