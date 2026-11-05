import { apiClient, ApiClientError } from '../../../lib/api/client';
import type {
  ContentSubmission,
  Decision,
  DecisionType,
  DetectedIssue,
  ReviewRun,
  SubmissionStatus,
} from '@evolyn/shared';

export interface SubmissionsQueueResponse {
  submissions: ContentSubmission[];
  total: number;
}

export interface SubmissionReviewDetails {
  submission: ContentSubmission & {
    reviewRun?: ReviewRun | null;
    decision?: Decision | null;
  };
  reviewRun: ReviewRun;
  issues: DetectedIssue[];
  decision: Decision | null;
}

export interface SubmitDecisionPayload {
  decision: DecisionType;
  reviewerName: string;
  comments: string;
  overriddenIssueIds?: string[];
}

export interface SubmitDecisionResult {
  decision: Decision;
  updatedSubmissionStatus: 'APPROVED' | 'REJECTED' | 'REVIEWED';
}

export interface DecisionHistoryResult {
  submissionId: string;
  decisions: Decision[];
  total: number;
}

/**
 * Fetches submissions awaiting approval (defaults to status=REVIEWED).
 */
export async function fetchApprovalQueue(
  status: SubmissionStatus = 'REVIEWED'
): Promise<SubmissionsQueueResponse> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiClient<SubmissionsQueueResponse>(`/api/submissions${query}`);
}

/**
 * Fetches all submissions across statuses (used for audit history submission selector).
 */
export async function fetchAllSubmissions(): Promise<SubmissionsQueueResponse> {
  return apiClient<SubmissionsQueueResponse>('/api/submissions');
}

/**
 * Fetches comprehensive review details, including the review run and detected issues.
 */
export async function fetchSubmissionReview(
  submissionId: string
): Promise<SubmissionReviewDetails> {
  return apiClient<SubmissionReviewDetails>(
    `/api/submissions/${encodeURIComponent(submissionId)}/review`
  );
}

/**
 * Submits an authentic human decision (APPROVED, REJECTED, or CHANGES_REQUESTED).
 */
export async function submitHumanDecision(
  submissionId: string,
  payload: SubmitDecisionPayload
): Promise<SubmitDecisionResult> {
  return apiClient<SubmitDecisionResult>(
    `/api/submissions/${encodeURIComponent(submissionId)}/decision`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        submissionId,
      }),
    }
  );
}

/**
 * Fetches the latest recorded decision for a submission. Returns null if not found (404).
 */
export async function fetchLatestDecision(
  submissionId: string
): Promise<Decision | null> {
  try {
    const res = await apiClient<{ decision: Decision }>(
      `/api/submissions/${encodeURIComponent(submissionId)}/decision`
    );
    return res.decision;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetches chronological audit history for a submission.
 */
export async function fetchDecisionHistory(
  submissionId: string
): Promise<DecisionHistoryResult> {
  return apiClient<DecisionHistoryResult>(
    `/api/submissions/${encodeURIComponent(submissionId)}/decisions`
  );
}
