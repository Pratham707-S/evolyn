/**
 * ============================================================================
 * FEATURE: Side-by-Side Review Workbench & Citations (apps/web/src/features/reviews)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER        : Pratham Kave (Frontend Lead)
 * BACKEND COUNTERPARTS  : Ayan (Backend Lead) & Pratham (Project Lead & Architect)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Split-Screen Review Workbench UI:
 *    - Left Panel: Submitted copy with inline highlighted text segments.
 *    - Right Panel: Interactive flagged issue cards with severity badges.
 * 2. Verbatim Citation Inspector (Anti-Hallucination UI):
 *    - Click on an issue card to highlight and auto-scroll to exact verbatim quote in source copy.
 * 3. Innovation 2 UI — Evidence Strength Meter:
 *    - Radial/bar gauge showing 0% to 100% evidence certainty with verified corporate proof source links.
 *
 * API INTEGRATION POINTS:
 * - GET  /api/reviews/:submissionId (Review run details & issues)
 * - POST /api/reviews/:submissionId/rerun (Trigger re-audit)
 * ============================================================================
 */

import type { DetectedIssue, ReviewRun } from '@evolyn/shared';

export interface ReviewViewState {
  selectedIssueId?: string | null;
  activeSeverityFilter?: string;
  isDecisionModalOpen: boolean;
}

export type { DetectedIssue, ReviewRun };

export * from './components';
export type { QueueItem } from './components/review-queue';
