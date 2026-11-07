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
  REWRITE_ACTIONS,
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
// Review Workspace Rewrite (Core AI Assistance)
// ----------------------------------------
export const rewriteActionSchema = z.enum(REWRITE_ACTIONS);

export const rewriteContentSchema = z.object({
  action: rewriteActionSchema,
  content: z
    .string({ required_error: 'Content is required' })
    .min(1, 'Content is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Content cannot be empty or whitespace only',
    })
    .refine((val) => val.length <= 50000, {
      message: 'Content must not exceed 50000 characters',
    }),
  instructions: z
    .string()
    .max(1000, 'Instructions must not exceed 1000 characters')
    .optional(),
});

export const rewriteResponseSchema = z.object({
  originalText: z.string(),
  rewrittenText: z.string().min(1, 'Rewritten text cannot be empty'),
  action: rewriteActionSchema,
  rationale: z.string().min(1, 'Rationale cannot be empty'),
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

// ----------------------------------------
// Brand Setup & Profile
// ----------------------------------------
export const brandSetupSchema = z.object({
  brandName: z.string().min(1, 'Brand name is required'),
  industry: z.string().default('Marketing Technology'),
  description: z.string().default(''),
  logoUrl: z.string().optional().default(''),
  primaryColor: z.string().default('#111111'),
  secondaryColor: z.string().default('#EDE7DE'),
  headerFont: z.string().default('Instrument Serif'),
  bodyFont: z.string().default('DM Sans'),
  voiceTone: z
    .object({
      formality: z.number().min(1).max(5).default(3),
      boldness: z.number().min(1).max(5).default(4),
      accessibility: z.number().min(1).max(5).default(4),
      toneDescriptors: z.array(z.string()).default(['Authoritative', 'Precise', 'Modern']),
      dos: z.array(z.string()).default([]),
      donts: z.array(z.string()).default([]),
    })
    .default({}),
  governance: z
    .object({
      approvalStrategy: z.string().default('single'),
      requireEvidence: z.boolean().default(true),
      blockCompetitors: z.boolean().default(true),
      enforcePalette: z.boolean().default(true),
      brandGuardianEmail: z.string().default('guardian@evolyn.ai'),
      minComplianceScore: z.number().default(85),
    })
    .default({}),
});

export const updateGuidelineSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  category: z.string().optional(),
  version: z.string().optional(),
  rawContent: z.string().min(10).optional(),
  status: guidelineStatusSchema.optional(),
});

// ----------------------------------------
// Dedicated Brand Governance AI Schemas
// ----------------------------------------
export const brandGovernanceFindingSchema = z.object({
  id: z.string().optional(),
  category: z.enum(['BRAND_VOICE', 'BRAND_RULE', 'FACT_VERIFICATION']),
  severity: z.enum(['CRITICAL', 'WARNING', 'SUGGESTION']),
  statement: z.string().min(1),
  sourceEvidence: z.string().min(1),
  suggestedImprovement: z.string().min(1),
  explanation: z.string().optional(),
  relatedRule: z.string().optional(),
});

export const brandGovernanceContextSchema = z.object({
  brandSetup: z
    .object({
      brandName: z.string(),
      description: z.string().optional(),
      industry: z.string().optional(),
      voiceTone: z
        .object({
          formality: z.number().optional(),
          boldness: z.number().optional(),
          accessibility: z.number().optional(),
          toneDescriptors: z.array(z.string()).optional(),
          dos: z.array(z.string()).optional(),
          donts: z.array(z.string()).optional(),
        })
        .optional(),
      governance: z
        .object({
          minComplianceScore: z.number().optional(),
          requireEvidence: z.boolean().optional(),
          blockCompetitors: z.boolean().optional(),
          brandGuardianEmail: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  rules: z.array(
    z.object({
      id: z.string(),
      ruleType: z.string(),
      ruleStatement: z.string(),
      severity: z.string(),
      explanation: z.string().optional(),
    })
  ),
  facts: z.array(
    z.object({
      id: z.string(),
      topic: z.string(),
      claimStatement: z.string(),
      approvedProofSource: z.string(),
    })
  ),
  setupProgress: z
    .object({
      isBrandSetupComplete: z.boolean(),
      isGuidelinesComplete: z.boolean(),
      isKnowledgeLibraryComplete: z.boolean(),
      isFullyConfigured: z.boolean(),
      nextIncompleteStep: z.enum([
        'brand-setup',
        'guidelines',
        'knowledge-library',
        'ready',
      ]),
    })
    .optional(),
});

export const brandGovernanceEvaluationResponseSchema = z.object({
  governanceDecision: z.enum(['COMPLIANT', 'NEEDS_REVISION', 'NON_COMPLIANT']),
  overallGovernanceScore: z.number().min(0).max(100),
  brandVoiceScore: z.number().min(0).max(100),
  rulesComplianceScore: z.number().min(0).max(100),
  factGroundingScore: z.number().min(0).max(100),
  findings: z.array(brandGovernanceFindingSchema),
  summary: z.string().min(1),
  requiresHumanApproval: z.literal(true),
  evaluatedAt: z.string(),
});

export const brandGovernanceEvaluateRequestSchema = z.object({
  content: z.string().min(1, 'Content to evaluate is required'),
  contextOverrides: z
    .object({
      brandSetupId: z.string().uuid().optional(),
      includeRules: z.boolean().default(true),
      includeFacts: z.boolean().default(true),
    })
    .optional(),
});
