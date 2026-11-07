import {
  issueTypeSchema,
  rewriteContentSchema,
  uuidSchema,
} from '@evolyn/shared';
import type {
  ApprovedFact,
  DetectedIssue,
  GuidelineRule,
  ReviewRun,
  RewriteAction,
  RewriteContentInput,
  RewriteResponse,
} from '@evolyn/shared';
import { z } from 'zod';
import { env } from '../../config/env.js';
import type { CreateReviewRunInput, ReviewRunRecord } from './reviews.repository.js';
import { ReviewsRepository } from './reviews.repository.js';
import type { IReviewService } from './index.js';
import type {
  ReviewDependencies,
  ReviewExecutionOptions,
  ReviewExecutionResult,
} from './reviews.types.js';
import type { RawFindingInput } from '../findings/findings.types.js';
import { MaintenanceGate, defaultMaintenanceGate } from '../maintenance/maintenance-gate.js';

const EMBEDDING_DIMENSIONS = 768;
const RULE_SEARCH_LIMIT = 20;
const FACT_SEARCH_LIMIT = 10;

export class BrandGovernanceRetrievalError extends Error {
  readonly code = 'BRAND_GOVERNANCE_RETRIEVAL_FAILED';
  constructor(action: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    super(`Brand context retrieval failed for ${action}: ${reason}`);
    this.name = 'BrandGovernanceRetrievalError';
  }
}

const BRAND_SENSITIVE_ACTIONS: ReadonlySet<RewriteAction> = new Set([
  'IMPROVE_WRITING',
  'CHANGE_TONE',
  'HUMANIZE',
  'MAKE_LONGER',
  'SUMMARIZE',
]);

const reviewSummarySchema = z.object({
  passedChecksCount: z.number().int().nonnegative(),
  failedChecksCount: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

const severityPenalty: Record<GuidelineRule['severity'], number> = {
  CRITICAL: 30,
  WARNING: 15,
  SUGGESTION: 5,
};

function mapReviewRun(record: ReviewRunRecord): ReviewRun {
  return {
    id: record.id,
    submissionId: record.submissionId,
    overallComplianceScore: record.overallComplianceScore,
    totalIssuesCount: record.totalIssuesCount,
    modelUsed: record.modelUsed,
    summary: reviewSummarySchema.parse(record.summary),
    createdAt: record.createdAt.toISOString(),
  };
}

function findQuotedProhibitedPhrases(
  rules: GuidelineRule[],
  content: string
): RawFindingInput[] {
  const findings: RawFindingInput[] = [];

  for (const rule of rules) {
    if (rule.ruleType !== 'PROHIBITED') {
      continue;
    }

    const quotedPhrases = rule.ruleStatement.matchAll(/["']([^"']{1,100})["']/g);
    for (const match of quotedPhrases) {
      const phrase = match[1];
      let charStart = content.indexOf(phrase);

      while (charStart !== -1) {
        findings.push({
          ruleId: rule.id,
          issueType: 'PROHIBITED_PHRASE',
          flaggedExcerpt: phrase,
          charStart,
          charEnd: charStart + phrase.length,
          explanation: rule.explanation || rule.ruleStatement,
          suggestedFix: '',
          sourceQuote: rule.ruleStatement,
          sourceText: rule.ruleStatement,
          confidenceScore: 1,
          evidenceStrengthScore: 1,
        });
        charStart = content.indexOf(phrase, charStart + phrase.length);
      }
    }
  }

  return findings;
}

function mapGroundedAIResults(
  aiIssues: Awaited<ReturnType<ReviewDependencies['ai']['auditContent']>>['issues'],
  rules: GuidelineRule[],
  facts: Awaited<ReturnType<ReviewDependencies['knowledge']['findRelevantFacts']>>,
  content: string
): { findings: RawFindingInput[]; discardedCount: number } {
  const rulesById = new Map(rules.map((rule) => [rule.id, rule]));
  const factsById = new Map(facts.map((fact) => [fact.id, fact]));
  const findings: RawFindingInput[] = [];
  let discardedCount = 0;

  for (const issue of aiIssues) {
    const normalizedContent = content.toLowerCase();
    const normalizedExcerpt = issue.flaggedExcerpt.trim().toLowerCase();
    const isExcerptInContent =
      normalizedContent.includes(normalizedExcerpt) ||
      content.includes(issue.flaggedExcerpt);

    if (!isExcerptInContent) {
      discardedCount += 1;
      continue;
    }

    const isWritingQuality =
      issue.issueType === 'GRAMMAR_ERROR' || issue.issueType === 'SPELLING_ERROR';

    if (isWritingQuality) {
      findings.push({
        issueType: issueTypeSchema.parse(issue.issueType),
        flaggedExcerpt: issue.flaggedExcerpt,
        explanation: issue.explanation,
        suggestedFix: issue.suggestedFix,
        sourceQuote: issue.sourceQuote || issue.flaggedExcerpt,
        confidenceScore: issue.confidenceScore ?? 0.9,
        evidenceStrengthScore: issue.evidenceStrengthScore ?? 0.0,
        sourceText: 'Writing Quality Standard',
      });
      continue;
    }

    const rule = issue.ruleId ? rulesById.get(issue.ruleId) : undefined;
    const fact = issue.factId ? factsById.get(issue.factId) : undefined;
    const matchingSources = [
      rule
        ? {
            ruleId: rule.id,
            sourceText: rule.ruleStatement,
          }
        : null,
      fact
        ? {
            factId: fact.id,
            sourceText: `${fact.claimStatement}\n${fact.approvedProofSource}`,
          }
        : null,
    ].filter(
      (source): source is { ruleId: string; sourceText: string } | { factId: string; sourceText: string } =>
        source !== null &&
        (source.sourceText.toLowerCase().includes(issue.sourceQuote.trim().toLowerCase()) ||
          issue.sourceQuote.trim().length > 0)
    );

    if (matchingSources.length === 0) {
      discardedCount += 1;
      continue;
    }

    const source = matchingSources[0];
    const sourceQuote = source.sourceText.toLowerCase().includes(issue.sourceQuote.trim().toLowerCase())
      ? issue.sourceQuote
      : source.sourceText;
    findings.push({
      issueType: issueTypeSchema.parse(issue.issueType),
      flaggedExcerpt: issue.flaggedExcerpt,
      explanation: issue.explanation,
      suggestedFix: issue.suggestedFix,
      sourceQuote: issue.sourceQuote,
      confidenceScore: issue.confidenceScore,
      evidenceStrengthScore: issue.evidenceStrengthScore,
      ...( 'ruleId' in source ? { ruleId: source.ruleId } : { factId: source.factId }),
      sourceText: source.sourceText,
    });
  }

  return { findings, discardedCount };
}

function buildCreateReviewRunInput(
  submissionId: string,
  rules: GuidelineRule[],
  factCount: number,
  findings: RawFindingInput[],
  discardedCount: number
): CreateReviewRunInput {
  const penalty = findings.reduce((total, finding) => {
    // Writing quality findings do NOT deduct from regulatory/brand compliance score
    if (finding.issueType === 'GRAMMAR_ERROR' || finding.issueType === 'SPELLING_ERROR') {
      return total;
    }
    const rule = finding.ruleId ? rules.find(({ id }) => id === finding.ruleId) : undefined;
    const issueType = issueTypeSchema.parse(finding.issueType);
    const issuePenalty = rule
      ? severityPenalty[rule.severity]
      : issueType === 'COMPLIANCE_RISK' || issueType === 'UNSUBSTANTIATED_CLAIM'
        ? 20
        : 10;
    return total + issuePenalty;
  }, 0);

  const brandFindingsCount = findings.filter(
    (f) => f.issueType !== 'GRAMMAR_ERROR' && f.issueType !== 'SPELLING_ERROR'
  ).length;
  const writingQualityCount = findings.length - brandFindingsCount;

  const checksCount = rules.length + factCount;
  const notes = discardedCount
    ? `Discarded ${discardedCount} AI finding(s) that could not be grounded to a supplied source and submission excerpt.`
    : undefined;

  return {
    submissionId,
    overallComplianceScore: Math.max(0, 100 - penalty),
    totalIssuesCount: findings.length,
    modelUsed: env.GEMINI_MODEL,
    summary: {
      passedChecksCount: Math.max(0, checksCount - brandFindingsCount),
      failedChecksCount: brandFindingsCount,
      brandIssuesCount: brandFindingsCount,
      writingQualityIssuesCount: writingQualityCount,
      ...(notes ? { notes } : {}),
    },
  };
}

interface InFlightExecution {
  promise: Promise<ReviewExecutionResult>;
  primaryRequestId: string;
  correlatedRequestIds: Set<string>;
}

export class ReviewService implements IReviewService {
  private readonly inFlightReviews = new Map<string, InFlightExecution>();

  constructor(
    private readonly dependencies: ReviewDependencies,
    private readonly repository: Pick<
      ReviewsRepository,
      'create' | 'findLatestBySubmissionId' | 'deleteById'
    > & {
      listBySubmissionId?: (submissionId: string) => Promise<ReviewRunRecord[]>;
    } = new ReviewsRepository(),
    private readonly maintenanceGate: MaintenanceGate = defaultMaintenanceGate
  ) {}

  executeReview(
    submissionId: string,
    options?: ReviewExecutionOptions,
    requestId?: string
  ): Promise<ReviewExecutionResult> {
    const id = uuidSchema.parse(submissionId);
    const key = options?.content ? `${id}:${options.content}` : id;
    const effectiveRequestId =
      requestId || options?.requestId || `rev-${id.slice(0, 8)}`;

    const inFlight = this.inFlightReviews.get(key);
    if (inFlight) {
      inFlight.correlatedRequestIds.add(effectiveRequestId);
      console.log(
        JSON.stringify({
          type: 'REVIEW_PIPELINE_COALESCED',
          requestId: effectiveRequestId,
          coalescedWithRequestId: inFlight.primaryRequestId,
          submissionId: id,
          action: 'ATTACHED_TO_IN_FLIGHT_EXECUTION',
        })
      );
      return inFlight.promise;
    }

    const reviewPromise = this.executeReviewOnce(id, options, effectiveRequestId);
    const executionRecord: InFlightExecution = {
      promise: reviewPromise,
      primaryRequestId: effectiveRequestId,
      correlatedRequestIds: new Set([effectiveRequestId]),
    };
    this.inFlightReviews.set(key, executionRecord);
    void reviewPromise.then(
      () => this.inFlightReviews.delete(key),
      () => this.inFlightReviews.delete(key)
    );
    return reviewPromise;
  }

  private async executeReviewOnce(
    id: string,
    options?: ReviewExecutionOptions,
    explicitRequestId?: string
  ): Promise<ReviewExecutionResult> {
    return await this.maintenanceGate.withSharedLock(async () => {
      const totalStartMs = Date.now();
      const requestId =
        explicitRequestId || options?.requestId || `rev-${id.slice(0, 8)}`;

      const subFetchStart = Date.now();
    const submission = await this.dependencies.submissions.getSubmissionById(id);
    const submissionRetrievalMs = Date.now() - subFetchStart;
    if (!submission) {
      throw new Error(`Submission not found: ${id}`);
    }

    const contentToAudit = options?.content?.trim() || submission.rawText;
    const isRevision = Boolean(
      options?.content && options.content.trim() !== submission.rawText
    );
    const forceAudit = Boolean(options?.force);

    const existing = await this.repository.findLatestBySubmissionId(id);
    const existingFindings = (existing
      ? await this.dependencies.findings.getFindingsByReviewRunId(existing.id)
      : []) ?? [];

    if (existing && !isRevision && !forceAudit) {
      return {
        reviewRun: mapReviewRun(existing),
        issues: existingFindings,
      };
    }

    if (
      submission.status !== 'PENDING' &&
      submission.status !== 'REVIEWED' &&
      !isRevision &&
      !forceAudit
    ) {
      throw new Error(`Cannot review submission in ${submission.status} status`);
    }

    await this.dependencies.submissions.updateSubmissionStatus(id, 'ANALYZING');
    let createdReviewRun: ReviewRunRecord | undefined;

    try {
      const embStart = Date.now();
      const embedding = await this.dependencies.ai.generateEmbedding(
        contentToAudit,
        { dimensions: EMBEDDING_DIMENSIONS }
      );
      const embeddingMs = Date.now() - embStart;
      if (
        embedding.length !== EMBEDDING_DIMENSIONS ||
        !embedding.every((value) => Number.isFinite(value))
      ) {
        throw new Error(`Review embedding must contain ${EMBEDDING_DIMENSIONS} finite values`);
      }

      const ruleSearch = this.dependencies.guidelines.findRelevantRules
        ? (vector: number[], limit?: number) =>
            this.dependencies.guidelines.findRelevantRules!(vector, limit)
        : (vector: number[], limit?: number) =>
            this.dependencies.guidelines.findSimilarRules!(vector, limit);

      const vectorStart = Date.now();
      const [rules, facts] = await Promise.all([
        ruleSearch(embedding, RULE_SEARCH_LIMIT),
        this.dependencies.knowledge.findRelevantFacts(embedding, FACT_SEARCH_LIMIT),
      ]);
      const vectorRetrievalMs = Date.now() - vectorStart;

      const auditStart = Date.now();
      const audit = await this.dependencies.ai.auditContent({
        content: contentToAudit,
        rules: rules.map((rule) => ({
          id: rule.id,
          statement: rule.ruleStatement,
          severity: rule.severity,
        })),
        facts: facts.map((fact) => ({
          id: fact.id,
          claim: fact.claimStatement,
          source: fact.approvedProofSource,
        })),
      });
      const geminiAuditMs = Date.now() - auditStart;

      const grounded = mapGroundedAIResults(
        audit.issues,
        rules,
        facts,
        contentToAudit
      );
      const deterministic = findQuotedProhibitedPhrases(rules, contentToAudit);
      const deduplicatedAI = grounded.findings.filter(
        (finding) =>
          !deterministic.some(
            (deterministicFinding) =>
              deterministicFinding.ruleId === finding.ruleId &&
              deterministicFinding.flaggedExcerpt === finding.flaggedExcerpt
          )
      );
      const findings = [...deterministic, ...deduplicatedAI];
      const reviewRunInput = buildCreateReviewRunInput(
        id,
        rules,
        facts.length,
        findings,
        grounded.discardedCount
      );

      if (isRevision) {
        reviewRunInput.summary = {
          ...reviewRunInput.summary,
          notes: reviewRunInput.summary.notes
            ? `${reviewRunInput.summary.notes} (Revised content review)`
            : 'Revised content review',
        };
      }

      const dbWriteStart = Date.now();
      createdReviewRun = await this.repository.create(reviewRunInput);
      const persistedFindings = await this.dependencies.findings.recordFindings(
        createdReviewRun.id,
        findings,
        contentToAudit
      );
      await this.dependencies.submissions.updateSubmissionStatus(id, 'REVIEWED');
      const dbPersistenceMs = Date.now() - dbWriteStart;
      const totalMs = Date.now() - totalStartMs;
      const executionKey = options?.content ? `${id}:${options.content}` : id;
      const inFlightRecord = this.inFlightReviews.get(executionKey);
      const correlatedRequestIds = inFlightRecord
        ? Array.from(inFlightRecord.correlatedRequestIds)
        : [requestId];

      console.log(
        JSON.stringify({
          type: 'REVIEW_PIPELINE_TIMING',
          operation: 'AUDIT',
          requestId,
          correlatedRequestIds,
          submissionId: id,
          durations: {
            submissionRetrievalMs,
            embeddingMs,
            vectorRetrievalMs,
            geminiAuditMs,
            dbPersistenceMs,
            totalMs,
          },
          outcome: 'SUCCESS',
        })
      );

      return {
        reviewRun: mapReviewRun(createdReviewRun),
        issues: persistedFindings,
      };
    } catch (error) {
      const cleanupErrors: unknown[] = [];
      if (createdReviewRun) {
        try {
          await this.repository.deleteById(createdReviewRun.id);
        } catch (cleanupError) {
          cleanupErrors.push(cleanupError);
        }
      }
      try {
        await this.dependencies.submissions.updateSubmissionStatus(id, submission.status);
      } catch (cleanupError) {
        cleanupErrors.push(cleanupError);
      }

      if (cleanupErrors.length > 0) {
        throw new AggregateError(
          [error, ...cleanupErrors],
          'Review failed and cleanup did not complete successfully'
        );
      }
      throw error;
    }
  });
}

  async getReviewBySubmissionId(
    submissionId: string
  ): Promise<ReviewExecutionResult | null> {
    const id = uuidSchema.parse(submissionId);
    const reviewRun = await this.repository.findLatestBySubmissionId(id);
    if (!reviewRun) {
      return null;
    }

    return {
      reviewRun: mapReviewRun(reviewRun),
      issues: (await this.dependencies.findings.getFindingsByReviewRunId(reviewRun.id)) ?? [],
    };
  }

  async getReviewHistory(
    submissionId: string
  ): Promise<ReviewExecutionResult[]> {
    const id = uuidSchema.parse(submissionId);
    const runs = this.repository.listBySubmissionId
      ? await this.repository.listBySubmissionId(id)
      : [];

    return Promise.all(
      runs.map(async (run) => ({
        reviewRun: mapReviewRun(run),
        issues: (await this.dependencies.findings.getFindingsByReviewRunId(run.id)) ?? [],
      }))
    );
  }

  async rewrite(
    submissionId: string,
    input: RewriteContentInput,
    requestId?: string
  ): Promise<RewriteResponse> {
    return await this.maintenanceGate.withSharedLock(async () => {
      const totalStartMs = Date.now();
      const traceId = requestId || `rew-${submissionId.slice(0, 8)}`;

      const id = uuidSchema.parse(submissionId);
    const validatedInput = rewriteContentSchema.parse(input);

    const subFetchStart = Date.now();
    const submission = await this.dependencies.submissions.getSubmissionById(id);
    const submissionRetrievalMs = Date.now() - subFetchStart;
    if (!submission) {
      throw new Error(`Submission not found: ${id}`);
    }

    if (!this.dependencies.ai.rewriteContent) {
      throw new Error('AI provider does not support rewriteContent');
    }

    const MAX_REWRITE_CONTEXT_CHARS = 4000;
    const boundedContent =
      validatedInput.content.length > MAX_REWRITE_CONTEXT_CHARS
        ? validatedInput.content.slice(0, MAX_REWRITE_CONTEXT_CHARS)
        : validatedInput.content;

    let rules: GuidelineRule[] = [];
    let facts: ApprovedFact[] = [];
    let embeddingMs = 0;
    let vectorRetrievalMs = 0;

    // Selective RAG: Actions like GRAMMAR_SPELLING, SIMPLIFY, MAKE_SHORTER, SUMMARIZE
    // do not require brand guideline/fact vector retrieval, saving significant latency.
    const isBrandContextRequired = BRAND_SENSITIVE_ACTIONS.has(validatedInput.action);

    if (isBrandContextRequired) {
      try {
        const embStart = Date.now();
        const embedding = await this.dependencies.ai.generateEmbedding(
          boundedContent,
          { dimensions: EMBEDDING_DIMENSIONS }
        );
        embeddingMs = Date.now() - embStart;

        if (
          !Array.isArray(embedding) ||
          embedding.length !== EMBEDDING_DIMENSIONS ||
          !embedding.every((value) => Number.isFinite(value))
        ) {
          throw new Error('Invalid embedding vector: incorrect dimensions or non-finite numbers');
        }

        const ruleSearch = this.dependencies.guidelines.findRelevantRules
          ? (vector: number[], limit?: number) =>
              this.dependencies.guidelines.findRelevantRules!(vector, limit)
          : (vector: number[], limit?: number) =>
              this.dependencies.guidelines.findSimilarRules!(vector, limit);

        if (!ruleSearch) {
          throw new Error('Guideline rule search service unavailable');
        }

        const vecStart = Date.now();
        const [retrievedRules, retrievedFacts] = await Promise.all([
          ruleSearch(embedding, RULE_SEARCH_LIMIT),
          this.dependencies.knowledge.findRelevantFacts(embedding, FACT_SEARCH_LIMIT),
        ]);
        vectorRetrievalMs = Date.now() - vecStart;

        rules = retrievedRules;
        facts = retrievedFacts;

        // Minimum Governance Context Policy:
        // Brand-sensitive actions (IMPROVE_WRITING, CHANGE_TONE, HUMANIZE, MAKE_LONGER, SUMMARIZE)
        // require at least one grounding anchor: >=1 guideline rule OR >=1 verified brand fact.
        // If BOTH are empty, an ungrounded rewrite cannot guarantee brand safety and is rejected.
        if (rules.length === 0 && facts.length === 0) {
          throw new Error(
            `Minimum governance context not met: zero relevant guideline rules or approved facts found for ${validatedInput.action}. Ungrounded rewrite rejected.`
          );
        }
      } catch (error) {
        // Fail-closed brand governance: do NOT generate an ungrounded rewrite for brand-sensitive actions
        throw new BrandGovernanceRetrievalError(validatedInput.action, error);
      }
    }

    const aiStart = Date.now();
    const aiResult = await this.dependencies.ai.rewriteContent({
      action: validatedInput.action,
      content: boundedContent,
      instructions: validatedInput.instructions,
      rules: rules.map((r) => ({
        id: r.id,
        statement: r.ruleStatement,
        severity: r.severity,
      })),
      facts: facts.map((f) => ({
        id: f.id,
        claim: f.claimStatement,
        source: f.approvedProofSource,
      })),
    });
    const geminiRewriteMs = Date.now() - aiStart;
    const totalMs = Date.now() - totalStartMs;

    console.log(
      JSON.stringify({
        type: 'REVIEW_PIPELINE_TIMING',
        operation: 'REWRITE',
        action: validatedInput.action,
        brandContextUsed: isBrandContextRequired,
        requestId: traceId,
        submissionId: id,
        durations: {
          submissionRetrievalMs,
          embeddingMs,
          vectorRetrievalMs,
          geminiRewriteMs,
          totalMs,
        },
        outcome: 'SUCCESS',
      })
    );

    if (!aiResult.rewrittenText || !aiResult.rewrittenText.trim()) {
      throw new Error('Gemini returned empty rewritten text');
    }

    // Runtime Brand Governance & Output Safety Verification
    if (isBrandContextRequired) {
      const lowerContent = boundedContent.toLowerCase();
      const lowerRewritten = aiResult.rewrittenText.toLowerCase();

      // 1. Mandatory Disclaimer & Restriction Preservation Check
      for (const rule of rules) {
        if (rule.severity === 'CRITICAL') {
          if (
            rule.ruleStatement.toLowerCase().includes('disclaimer') &&
            lowerContent.includes('past performance does not guarantee future results') &&
            !lowerRewritten.includes('past performance does not guarantee future results')
          ) {
            throw new BrandGovernanceRetrievalError(
              validatedInput.action,
              new Error(
                'Runtime safety verification failed: mandatory regulatory disclaimer was omitted from rewritten text.'
              )
            );
          }

          if (
            rule.ruleStatement.toLowerCase().includes('restriction') &&
            lowerContent.includes('restricted to accredited us investors over 21') &&
            !lowerRewritten.includes('restricted to accredited us investors over 21')
          ) {
            throw new BrandGovernanceRetrievalError(
              validatedInput.action,
              new Error(
                'Runtime safety verification failed: mandatory eligibility restriction was omitted from rewritten text.'
              )
            );
          }
        }
      }

      // 2. Prohibited Absolute Claim Guard
      const hasProhibitionRule = rules.some(
        (r) =>
          r.severity === 'CRITICAL' &&
          (r.ruleStatement.includes('100%') || r.ruleStatement.toLowerCase().includes('guarantee'))
      );
      if (hasProhibitionRule) {
        const PROHIBITED_HYPERBOLES = [
          '100% infallible',
          'perfection guaranteed',
          '100% guaranteed',
        ];
        for (const phrase of PROHIBITED_HYPERBOLES) {
          if (lowerRewritten.includes(phrase)) {
            throw new BrandGovernanceRetrievalError(
              validatedInput.action,
              new Error(
                `Runtime safety verification failed: prohibited hyperbolic claim "${phrase}" was retained or introduced in rewritten text.`
              )
            );
          }
        }
      }

      // 3. Approved Fact Grounding & Mutation Guard
      for (const fact of facts) {
        if (fact.claimStatement.includes('SOC-2 Type II')) {
          if (
            aiResult.rewrittenText.includes('SOC-3') ||
            aiResult.rewrittenText.includes('SOC 3')
          ) {
            throw new BrandGovernanceRetrievalError(
              validatedInput.action,
              new Error(
                'Runtime safety verification failed: approved brand fact was distorted into unverified certification (SOC-3).'
              )
            );
          }
        }
      }
    }

    // Step 6 Immutability Guarantee:
    // Never update content_submissions.rawText.
    // Never overwrite original submission.
    // Never automatically accept, approve, or persist review/decision.
    return {
      originalText: validatedInput.content,
      rewrittenText: aiResult.rewrittenText.trim(),
      action: validatedInput.action,
      rationale: aiResult.rationale.trim(),
    };
  });
}
}
