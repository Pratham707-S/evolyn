import { asc, eq } from 'drizzle-orm';
import type { DetectedIssue } from '@evolyn/shared';
import { db } from '../../db/index.js';
import {
  approvedFacts,
  detectedIssues,
  guidelineRules,
  guidelines,
  reviewRuns,
} from '../../db/schema.js';

export type DetectedIssueRecord = typeof detectedIssues.$inferSelect;

export interface CanonicalSourceRecord {
  id: string;
  type: 'RULE' | 'FACT';
  content: string;
}

export class FindingsRepository {
  async recordMany(findings: DetectedIssue[]): Promise<DetectedIssueRecord[]> {
    if (findings.length === 0) {
      return [];
    }

    return db
      .insert(detectedIssues)
      .values(
        findings.map(({ id: _id, ...finding }) => ({
          ...finding,
          ruleId: finding.ruleId ?? null,
          factId: finding.factId ?? null,
          charStart: finding.charStart ?? null,
          charEnd: finding.charEnd ?? null,
        }))
      )
      .returning();
  }

  async listByReviewRunId(reviewRunId: string): Promise<DetectedIssueRecord[]> {
    return db
      .select()
      .from(detectedIssues)
      .where(eq(detectedIssues.reviewRunId, reviewRunId))
      .orderBy(asc(detectedIssues.createdAt), asc(detectedIssues.id));
  }

  async reviewRunExists(reviewRunId: string): Promise<boolean> {
    const [run] = await db
      .select({ id: reviewRuns.id })
      .from(reviewRuns)
      .where(eq(reviewRuns.id, reviewRunId))
      .limit(1);
    return Boolean(run);
  }

  async findCanonicalSource(source: {
    ruleId?: string | null;
    factId?: string | null;
  }): Promise<CanonicalSourceRecord | null> {
    if (source.ruleId) {
      const [rule] = await db
        .select({
          id: guidelineRules.id,
          ruleStatement: guidelineRules.ruleStatement,
          explanation: guidelineRules.explanation,
          rawContent: guidelines.rawContent,
        })
        .from(guidelineRules)
        .leftJoin(guidelines, eq(guidelineRules.guidelineId, guidelines.id))
        .where(eq(guidelineRules.id, source.ruleId))
        .limit(1);

      if (rule) {
        const content = [rule.ruleStatement, rule.explanation, rule.rawContent]
          .filter((part): part is string => typeof part === 'string' && part.length > 0)
          .join('\n');
        return {
          id: rule.id,
          type: 'RULE',
          content,
        };
      }
    }

    if (source.factId) {
      const [fact] = await db
        .select({
          id: approvedFacts.id,
          claimStatement: approvedFacts.claimStatement,
          approvedProofSource: approvedFacts.approvedProofSource,
        })
        .from(approvedFacts)
        .where(eq(approvedFacts.id, source.factId))
        .limit(1);

      if (fact) {
        const content = [fact.claimStatement, fact.approvedProofSource]
          .filter((part): part is string => typeof part === 'string' && part.length > 0)
          .join('\n');
        return {
          id: fact.id,
          type: 'FACT',
          content,
        };
      }
    }

    return null;
  }
}

export const findingsRepository = new FindingsRepository();
