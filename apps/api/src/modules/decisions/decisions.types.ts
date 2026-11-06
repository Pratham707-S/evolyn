import type { Decision, SubmitDecisionInput } from '@evolyn/shared';
import type { IInsightsService } from '../insights/index.js';
import type { ISubmissionService } from '../submissions/index.js';
import type { DecisionIssueRecord, DecisionRecord } from './decisions.repository.js';

export interface DecisionRepositoryPort {
  create(input: SubmitDecisionInput): Promise<DecisionRecord>;
  findLatestBySubmissionId(submissionId: string): Promise<DecisionRecord | null>;
  findBySubmissionId(submissionId: string): Promise<DecisionRecord | null>;
  listBySubmissionId(submissionId: string, order?: 'asc' | 'desc'): Promise<DecisionRecord[]>;
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
 * APPROVED -> APPROVED
 * REJECTED -> REJECTED
 * CHANGES_REQUESTED -> REVIEWED
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
