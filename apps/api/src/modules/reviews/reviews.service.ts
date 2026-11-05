import {
  issueTypeSchema,
  uuidSchema,
} from '@evolyn/shared';
import type {
  DetectedIssue,
  GuidelineRule,
  ReviewRun,
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

const EMBEDDING_DIMENSIONS = 768;
const RULE_SEARCH_LIMIT = 20;
const FACT_SEARCH_LIMIT = 10;

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
        source !== null && source.sourceText.includes(issue.sourceQuote)
    );

    if (
      matchingSources.length === 0 ||
      !content.includes(issue.flaggedExcerpt)
    ) {
      discardedCount += 1;
      continue;
    }

    const source = matchingSources[0];
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
    const rule = finding.ruleId ? rules.find(({ id }) => id === finding.ruleId) : undefined;
    const issueType = issueTypeSchema.parse(finding.issueType);
    const issuePenalty = rule
      ? severityPenalty[rule.severity]
      : issueType === 'COMPLIANCE_RISK' || issueType === 'UNSUBSTANTIATED_CLAIM'
        ? 20
        : 10;
    return total + issuePenalty;
  }, 0);

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
      passedChecksCount: Math.max(0, checksCount - findings.length),
      failedChecksCount: findings.length,
      ...(notes ? { notes } : {}),
    },
  };
}

export class ReviewService implements IReviewService {
  private readonly inFlightReviews = new Map<string, Promise<ReviewExecutionResult>>();

  constructor(
    private readonly dependencies: ReviewDependencies,
    private readonly repository: Pick<
      ReviewsRepository,
      'create' | 'findLatestBySubmissionId' | 'deleteById'
    > & {
      listBySubmissionId?: (submissionId: string) => Promise<ReviewRunRecord[]>;
    } = new ReviewsRepository()
  ) {}

  executeReview(
    submissionId: string,
    options?: ReviewExecutionOptions
  ): Promise<ReviewExecutionResult> {
    const id = uuidSchema.parse(submissionId);
    const key = options?.content ? `${id}:${options.content}` : id;
    const inFlight = this.inFlightReviews.get(key);
    if (inFlight) {
      return inFlight;
    }

    const review = this.executeReviewOnce(id, options);
    this.inFlightReviews.set(key, review);
    void review.then(
      () => this.inFlightReviews.delete(key),
      () => this.inFlightReviews.delete(key)
    );
    return review;
  }

  private async executeReviewOnce(
    id: string,
    options?: ReviewExecutionOptions
  ): Promise<ReviewExecutionResult> {
    const submission = await this.dependencies.submissions.getSubmissionById(id);
    if (!submission) {
      throw new Error(`Submission not found: ${id}`);
    }

    const contentToAudit = options?.content?.trim() || submission.rawText;
    const isRevision = Boolean(
      options?.content && options.content.trim() !== submission.rawText
    );

    const existing = await this.repository.findLatestBySubmissionId(id);
    if (existing && !isRevision) {
      return {
        reviewRun: mapReviewRun(existing),
        issues: (await this.dependencies.findings.getFindingsByReviewRunId(existing.id)) ?? [],
      };
    }

    if (submission.status !== 'PENDING' && !isRevision) {
      throw new Error(`Cannot review submission in ${submission.status} status`);
    }

    await this.dependencies.submissions.updateSubmissionStatus(id, 'ANALYZING');
    let createdReviewRun: ReviewRunRecord | undefined;

    try {
      const embedding = await this.dependencies.ai.generateEmbedding(
        contentToAudit,
        { dimensions: EMBEDDING_DIMENSIONS }
      );
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

      const [rules, facts] = await Promise.all([
        ruleSearch(embedding, RULE_SEARCH_LIMIT),
        this.dependencies.knowledge.findRelevantFacts(embedding, FACT_SEARCH_LIMIT),
      ]);
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

      createdReviewRun = await this.repository.create(reviewRunInput);
      const persistedFindings = await this.dependencies.findings.recordFindings(
        createdReviewRun.id,
        findings,
        contentToAudit
      );
      await this.dependencies.submissions.updateSubmissionStatus(id, 'REVIEWED');

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
}
