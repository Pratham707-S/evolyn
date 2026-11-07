import { z } from 'zod';
import {
  guidelineCategorySchema,
  guidelineStatusSchema,
  ruleTypeSchema,
  severitySchema,
  submissionChannelSchema,
  submissionStatusSchema,
  issueTypeSchema,
  issueStatusSchema,
  decisionTypeSchema,
  conflictTypeSchema,
  conflictStatusSchema,
  createGuidelineSchema,
  createGuidelineRuleSchema,
  createApprovedFactSchema,
  createSubmissionSchema,
  detectedIssueSchema,
  submitDecisionSchema,
  guidelineConflictSchema,
  healthCheckResponseSchema,
  rewriteActionSchema,
  rewriteContentSchema,
  rewriteResponseSchema,
  brandSetupSchema,
  updateGuidelineSchema,
  brandGovernanceFindingSchema,
  brandGovernanceEvaluationResponseSchema,
  brandGovernanceEvaluateRequestSchema,
} from './schemas.js';

export type GuidelineCategory = z.infer<typeof guidelineCategorySchema>;
export type GuidelineStatus = z.infer<typeof guidelineStatusSchema>;
export type RuleType = z.infer<typeof ruleTypeSchema>;
export type Severity = z.infer<typeof severitySchema>;

export type CreateGuidelineInput = z.infer<typeof createGuidelineSchema>;
export type CreateGuidelineRuleInput = z.infer<typeof createGuidelineRuleSchema>;

export interface Guideline {
  id: string;
  title: string;
  category: GuidelineCategory;
  version: string;
  rawContent: string;
  s3Url?: string | null;
  status: GuidelineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GuidelineRule {
  id: string;
  guidelineId: string;
  ruleType: RuleType;
  ruleStatement: string;
  explanation: string;
  severity: Severity;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type CreateApprovedFactInput = z.infer<typeof createApprovedFactSchema>;

export interface ApprovedFact {
  id: string;
  topic: string;
  claimStatement: string;
  approvedProofSource: string;
  validUntil?: string | null;
  createdAt: string;
}

export type SubmissionChannel = z.infer<typeof submissionChannelSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

export interface ContentSubmission {
  id: string;
  title: string;
  channel: SubmissionChannel;
  rawText: string;
  fileUrl?: string | null;
  submittedBy: string;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export type IssueType = z.infer<typeof issueTypeSchema>;
export type IssueStatus = z.infer<typeof issueStatusSchema>;
export type DetectedIssue = z.infer<typeof detectedIssueSchema>;

export interface ReviewRun {
  id: string;
  submissionId: string;
  overallComplianceScore: number;
  totalIssuesCount: number;
  modelUsed: string;
  summary: {
    passedChecksCount: number;
    failedChecksCount: number;
    notes?: string;
  };
  createdAt: string;
}

export type DecisionType = z.infer<typeof decisionTypeSchema>;
export type SubmitDecisionInput = z.infer<typeof submitDecisionSchema>;

export interface Decision {
  id: string;
  submissionId: string;
  decision: DecisionType;
  reviewerName: string;
  comments: string;
  overriddenIssueIds: string[];
  createdAt: string;
}

export type ConflictType = z.infer<typeof conflictTypeSchema>;
export type ConflictStatus = z.infer<typeof conflictStatusSchema>;
export type GuidelineConflict = z.infer<typeof guidelineConflictSchema>;

export interface RecurringMistake {
  id: string;
  ruleId: string;
  violationCount: number;
  sampleExcerpts: string[];
  suggestedGuidelineRevision?: string | null;
  status: 'PENDING_REVIEW' | 'APPLIED' | 'DISMISSED';
  updatedAt: string;
}

export type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;

export type RewriteAction = z.infer<typeof rewriteActionSchema>;
export type RewriteContentInput = z.infer<typeof rewriteContentSchema>;
export type RewriteResponse = z.infer<typeof rewriteResponseSchema>;

export type BrandSetup = z.infer<typeof brandSetupSchema>;
export type UpdateGuidelineInput = z.infer<typeof updateGuidelineSchema>;
export type BrandGovernanceFinding = z.infer<typeof brandGovernanceFindingSchema>;
export type BrandGovernanceEvaluation = z.infer<typeof brandGovernanceEvaluationResponseSchema>;
export type BrandGovernanceEvaluateRequest = z.infer<typeof brandGovernanceEvaluateRequestSchema>;
