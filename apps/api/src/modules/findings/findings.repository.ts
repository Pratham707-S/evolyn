import { asc, eq } from 'drizzle-orm';
import type { DetectedIssue } from '@evolyn/shared';
import { db } from '../../db/index.js';
import { detectedIssues } from '../../db/schema.js';

export type DetectedIssueRecord = typeof detectedIssues.$inferSelect;

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
}
