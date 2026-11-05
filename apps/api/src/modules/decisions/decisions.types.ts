import type { Decision, SubmitDecisionInput } from '@evolyn/shared';
import type { IInsightsService } from '../insights/index.js';
import type { ISubmissionService } from '../submissions/index.js';
import type { DecisionIssueRecord, DecisionRecord } from './decisions.repository.js';

/**
 * Narrow persistence port used by DecisionService.
 * Keeping it structural (instead of importing DecisionsRepository directly)
 * lets unit tests swap in an in-memory double.
 */
export interface DecisionRepositoryPort {
  create(input: SubmitDecisionInput): Promise<DecisionRecord>;
  findBySubmissionId(submissionId: string): Promise<DecisionRecord | null>;
  deleteById(id: string): Promise<void>;
  listIssuesBySubmissionId(submissionId: string): Promise<DecisionIssueRecord[]>;
  updateIssueStatuses(issueIds: string[], status: 'OVERRIDDEN'): Promise<void>;
  restoreIssueStatuses(issues: DecisionIssueRecord[]): Promise<void>;
}

export interface DecisionDependencies {
  submissions: Pick<
    ISubmissionService,
    'getSubmissionById' | 'updateSubmissionStatus'
  >;
  repository: DecisionRepositoryPort;
  /**
   * Optional until modules/insights provides a concrete implementation.
   * Notification failures must never roll back a recorded decision.
   */
  insights?: Pick<IInsightsService, 'trackViolation'>;
}

export type DecisionErrorCode =
  | 'SUBMISSION_NOT_FOUND'
  | 'SUBMISSION_NOT_REVIEWED'
  | 'DECISION_EXISTS'
  | 'UNKNOWN_OVERRIDE_ISSUE'
  | 'SUBMISSION_ID_MISMATCH';

export class DecisionError extends Error {
  constructor(
    public readonly code: DecisionErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'DecisionError';
  }
}

/**
 * Maps a human decision to the submission lifecycle status.
 *
 * CHANGES_REQUESTED has no matching submission status in the shared enum,
 * so the submission stays in REVIEWED while the immutable decision is stored.
 */
export function decisionToSubmissionStatus(
  decision: Decision['decision']
): 'APPROVED' | 'REJECTED' | 'REVIEWED' {
  switch (decision) {
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    case 'CHANGES_REQUESTED':
      return 'REVIEWED';
  }
}

export interface DecisionRecordResult {
  decision: Decision;
  updatedSubmissionStatus: 'APPROVED' | 'REJECTED' | 'REVIEWED';
}
