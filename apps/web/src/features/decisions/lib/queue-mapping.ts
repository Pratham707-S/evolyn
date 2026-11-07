/**
 * Pure mapping helpers for the Approvals workstation (/approvals).
 *
 * Every value displayed on the page must come from server records — no
 * hardcoded demo rows, reviewers, findings or diffs. These helpers are pure
 * so they can be unit tested without React.
 */
import type { ContentSubmission, DetectedIssue, ReviewRun } from '@evolyn/shared';
import type { AuditChangeItem, DecisionItem } from '../components/approval-inspector';

/**
 * Reviewer identity recorded with a decision. Until authenticated sessions
 * exist, this comes from configuration (NEXT_PUBLIC_REVIEWER_NAME) instead of
 * a hardcoded persona or the submitter field.
 */
export function configuredReviewerName(): string {
  const configured = (process.env.NEXT_PUBLIC_REVIEWER_NAME ?? '').trim();
  return configured || 'Human Reviewer';
}

/**
 * Map the UI decision label to the API decision type.
 */
export function decisionPayload(
  decision: 'Approved' | 'Changes Requested' | 'Rejected',
  notes: string,
  reviewerName: string
): { decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'; reviewerName: string; comments: string } {
  return {
    decision:
      decision === 'Approved' ? 'APPROVED' : decision === 'Rejected' ? 'REJECTED' : 'CHANGES_REQUESTED',
    reviewerName,
    comments: notes || `Reviewed and recorded as ${decision}`,
  };
}

/**
 * The approval queue only lists submissions that completed AI review and are
 * awaiting a human decision. The server endpoint filters by status; this
 * client-side filter is defense in depth against other statuses leaking in.
 */
export function filterApprovalQueue(submissions: ContentSubmission[]): ContentSubmission[] {
  return (submissions ?? []).filter((sub) => sub.status === 'REVIEWED');
}

/**
 * Map a live submission to a queue item using only server data.
 *
 * REVIEWED does NOT mean "Changes Requested": it means the AI review finished
 * and the submission awaits a human decision. The reviewer is unknown until a
 * decision is recorded, so it is never derived from the submitter. Findings
 * counts come from the real review run; changes are never synthesized from
 * rawText — they are loaded separately from GET /api/submissions/:id/review.
 */
export function mapQueueSubmission(
  sub: ContentSubmission,
  reviewRun?: ReviewRun | null
): DecisionItem {
  const decision: DecisionItem['decision'] =
    sub.status === 'APPROVED'
      ? 'Approved'
      : sub.status === 'REJECTED'
      ? 'Rejected'
      : 'Pending';

  return {
    id: sub.id,
    title: sub.title,
    snippet: sub.rawText.slice(0, 40) + (sub.rawText.length > 40 ? '...' : ''),
    content: sub.rawText,
    channel: sub.channel || 'Website',
    decision,
    // No decision has been recorded in this view yet, so there is no reviewer
    // to show — and the submitter must never be displayed as one.
    reviewer: '—',
    reviewerName: '—',
    date: new Date(sub.createdAt).toLocaleDateString(),
    // Real server identifier, not a fabricated review number.
    reviewId: `Sub #${sub.id.slice(0, 8)}`,
    summary: `Status: ${sub.status}. Awaiting human decision.`,
    findingsCount: reviewRun?.totalIssuesCount ?? 0,
    changes: undefined,
  };
}

/**
 * Map detected issues from GET /api/submissions/:id/review into the audit
 * change list. Before/after values come from the flagged excerpt and the
 * model's suggested fix — nothing is invented from rawText.
 */
export function mapIssuesToChanges(issues: DetectedIssue[]): AuditChangeItem[] {
  return (issues ?? []).map((issue, index) => ({
    id: issue.id ?? `issue-${issue.reviewRunId}-${index}`,
    title: issue.issueType,
    description: issue.explanation,
    before: issue.flaggedExcerpt || undefined,
    after: issue.suggestedFix || undefined,
    isApproved: issue.status === 'ACCEPTED',
    rule: issue.ruleId ? `Rule ${issue.ruleId.slice(0, 8)}` : 'Guideline check',
  }));
}

/**
 * Apply a recorded decision to the queue state. The page calls this ONLY
 * after the server confirmed the decision, so the UI can never show a
 * decision, reviewer or date that the API rejected.
 */
export function applyDecisionToItems(
  items: DecisionItem[],
  itemId: string,
  decision: 'Approved' | 'Changes Requested' | 'Rejected',
  reviewerName: string,
  date: string,
  summary?: string
): DecisionItem[] {
  return items.map((d) =>
    d.id === itemId
      ? { ...d, decision, summary: summary || d.summary, reviewerName, date }
      : d
  );
}
