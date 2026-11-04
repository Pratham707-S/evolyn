import type {
  Guideline,
  GuidelineRule,
  GuidelineConflict,
  ApprovedFact,
  ContentSubmission,
  ReviewRun,
  DetectedIssue,
  Decision,
  RecurringMistake,
  CreateGuidelineInput,
  CreateApprovedFactInput,
  CreateSubmissionInput,
  SubmitDecisionInput,
} from '../../types.js';

// ==========================================
// 1. Guidelines & Rules Contracts
// ==========================================
export type CreateGuidelineRequest = CreateGuidelineInput;

export interface CreateGuidelineResponse {
  guideline: Guideline;
  rulesCount: number;
}

export interface ListGuidelinesResponse {
  guidelines: Guideline[];
  total: number;
}

export interface GuidelineDetailResponse {
  guideline: Guideline;
  rules: GuidelineRule[];
  conflicts: GuidelineConflict[];
}

// ==========================================
// 2. Approved Facts Contracts
// ==========================================
export type CreateApprovedFactRequest = CreateApprovedFactInput;

export interface ListApprovedFactsResponse {
  facts: ApprovedFact[];
  total: number;
}

// ==========================================
// 3. Submissions Contracts
// ==========================================
export type CreateSubmissionRequest = CreateSubmissionInput;

export interface CreateSubmissionResponse {
  submission: ContentSubmission;
}

export interface ListSubmissionsResponse {
  submissions: ContentSubmission[];
  total: number;
}

// ==========================================
// 4. Governance Reviews & Findings Contracts
// ==========================================
export interface AnalyzeSubmissionResponse {
  reviewRunId: string;
  submissionId: string;
  overallComplianceScore: number;
  totalIssuesCount: number;
  summary: {
    passedChecksCount: number;
    failedChecksCount: number;
    notes?: string;
  };
  issues: DetectedIssue[];
}

export interface ReviewDetailsResponse {
  submission: ContentSubmission;
  reviewRun: ReviewRun;
  issues: DetectedIssue[];
  decision?: Decision | null;
}

// ==========================================
// 5. Human Decisions Contracts
// ==========================================
export type SubmitDecisionRequest = SubmitDecisionInput;

export interface SubmitDecisionResponse {
  decision: Decision;
  updatedSubmissionStatus: string;
}

// ==========================================
// 6. Insights & Improvement Loop Contracts
// ==========================================
export interface ListRecurringMistakesResponse {
  mistakes: RecurringMistake[];
  total: number;
}

// ==========================================
// Standard API Envelope & Errors
// ==========================================
export interface ApiErrorResponse {
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}
