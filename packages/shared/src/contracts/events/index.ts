/**
 * Domain Event Contracts
 * Standard payload shapes for internal asynchronous domain events and audit logging
 */

export interface GuidelineCreatedEvent {
  eventId: string;
  timestamp: string;
  guidelineId: string;
  title: string;
  rulesExtracted: number;
}

export interface SubmissionAuditedEvent {
  eventId: string;
  timestamp: string;
  submissionId: string;
  reviewRunId: string;
  complianceScore: number;
  totalIssuesCount: number;
}

export interface DecisionRecordedEvent {
  eventId: string;
  timestamp: string;
  submissionId: string;
  decisionId: string;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  reviewerName: string;
}
