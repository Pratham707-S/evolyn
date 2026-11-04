import { z } from 'zod';
import {
  GUIDELINE_CATEGORIES,
  GUIDELINE_STATUSES,
  RULE_TYPES,
  SEVERITY_LEVELS,
  SUBMISSION_CHANNELS,
  SUBMISSION_STATUSES,
  ISSUE_TYPES,
  ISSUE_STATUSES,
  DECISION_TYPES,
  CONFLICT_TYPES,
  CONFLICT_STATUSES,
} from './constants.js';

// Base ID and Timestamp helpers
export const uuidSchema = z.string().uuid();

// ----------------------------------------
// Guidelines & Rules
// ----------------------------------------
export const guidelineCategorySchema = z.enum(GUIDELINE_CATEGORIES);
export const guidelineStatusSchema = z.enum(GUIDELINE_STATUSES);
export const ruleTypeSchema = z.enum(RULE_TYPES);
export const severitySchema = z.enum(SEVERITY_LEVELS);

export const createGuidelineSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  category: guidelineCategorySchema.default('GENERAL'),
  version: z.string().default('1.0'),
  rawContent: z.string().min(10, 'Guideline content must be at least 10 characters'),
  s3Url: z.string().url().optional().nullable(),
});

export const createGuidelineRuleSchema = z.object({
  guidelineId: uuidSchema,
  ruleType: ruleTypeSchema,
  ruleStatement: z.string().min(5, 'Rule statement must be at least 5 characters'),
  explanation: z.string().optional().default(''),
  severity: severitySchema.default('WARNING'),
  metadata: z.record(z.unknown()).optional().default({}),
});

// ----------------------------------------
// Approved Facts & Terminology
// ----------------------------------------
export const createApprovedFactSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(100),
  claimStatement: z.string().min(5, 'Claim statement is required'),
  approvedProofSource: z.string().min(5, 'Proof source/citation is mandatory'),
  validUntil: z.string().optional().nullable(), // ISO Date string
});

// ----------------------------------------
// Content Submissions
// ----------------------------------------
export const submissionChannelSchema = z.enum(SUBMISSION_CHANNELS);
export const submissionStatusSchema = z.enum(SUBMISSION_STATUSES);

export const createSubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  channel: submissionChannelSchema.default('WEBSITE'),
  rawText: z.string().min(10, 'Content to review must be at least 10 characters'),
  fileUrl: z.string().url().optional().nullable(),
  submittedBy: z.string().min(1, 'Submitter name/handle is required').default('Judge / Reviewer'),
});

// ----------------------------------------
// Review & Detected Issues
// ----------------------------------------
export const issueTypeSchema = z.enum(ISSUE_TYPES);
export const issueStatusSchema = z.enum(ISSUE_STATUSES);

export const detectedIssueSchema = z.object({
  id: uuidSchema.optional(),
  reviewRunId: uuidSchema,
  ruleId: uuidSchema.optional().nullable(),
  factId: uuidSchema.optional().nullable(),
  issueType: issueTypeSchema,
  flaggedExcerpt: z.string(),
  charStart: z.number().int().nonnegative().optional().nullable(),
  charEnd: z.number().int().nonnegative().optional().nullable(),
  explanation: z.string(),
  suggestedFix: z.string().optional().default(''),
  sourceQuote: z.string(), // Verbatim quote from guideline/fact - NO FABRICATION
  confidenceScore: z.number().min(0).max(1).default(1.0),
  evidenceStrengthScore: z.number().min(0).max(1).default(0.0), // Core Innovation 2
  status: issueStatusSchema.default('OPEN'),
});

// ----------------------------------------
// Human Review Decisions (Core Judge Step)
// ----------------------------------------
export const decisionTypeSchema = z.enum(DECISION_TYPES);

export const submitDecisionSchema = z.object({
  submissionId: uuidSchema,
  decision: decisionTypeSchema,
  reviewerName: z.string().min(1, 'Reviewer name is required'),
  comments: z.string().min(1, 'Decision rationale/comments are required'),
  overriddenIssueIds: z.array(uuidSchema).default([]),
});

// ----------------------------------------
// Guideline Conflict & Ambiguity (Core Innovation 1)
// ----------------------------------------
export const conflictTypeSchema = z.enum(CONFLICT_TYPES);
export const conflictStatusSchema = z.enum(CONFLICT_STATUSES);

export const guidelineConflictSchema = z.object({
  id: uuidSchema.optional(),
  ruleAId: uuidSchema,
  ruleBId: uuidSchema,
  conflictType: conflictTypeSchema,
  explanation: z.string(),
  severity: severitySchema.default('WARNING'),
  status: conflictStatusSchema.default('OPEN'),
});

// ----------------------------------------
// Health Check Payload
// ----------------------------------------
export const healthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  timestamp: z.string(),
  uptime: z.number(),
  database: z.enum(['connected', 'disconnected', 'unconfigured']),
  gemini: z.object({
    model: z.string(),
    embeddingModel: z.string(),
    configured: z.boolean(),
  }),
});
