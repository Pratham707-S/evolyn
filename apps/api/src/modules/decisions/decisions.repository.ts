import { asc, desc, eq, inArray } from 'drizzle-orm';
import type { SubmitDecisionInput } from '@evolyn/shared';

import { db } from '../../db/index.js';
import { decisions, detectedIssues, reviewRuns } from '../../db/schema.js';

export type DecisionRecord = typeof decisions.$inferSelect;

export interface DecisionIssueRecord {
  id: string;
  ruleId: string | null;
  flaggedExcerpt: string;
  status: string;
}

export class DecisionsRepository {
  constructor(private readonly database: typeof db = db) {}

  async create(input: SubmitDecisionInput): Promise<DecisionRecord> {
    const [decision] = await this.database
      .insert(decisions)
      .values({
        submissionId: input.submissionId,
        decision: input.decision,
        reviewerName: input.reviewerName,
        comments: input.comments,
        overriddenIssueIds: input.overriddenIssueIds ?? [],
      })
      .returning();

    if (!decision) {
      throw new Error('Failed to persist decision');
    }

    return decision;
  }

  async findLatestBySubmissionId(
    submissionId: string
  ): Promise<DecisionRecord | null> {
    const [decision] = await this.database
      .select()
      .from(decisions)
      .where(eq(decisions.submissionId, submissionId))
      .orderBy(desc(decisions.createdAt), desc(decisions.id))
      .limit(1);

    return decision ?? null;
  }

  async findBySubmissionId(
    submissionId: string
  ): Promise<DecisionRecord | null> {
    return this.findLatestBySubmissionId(submissionId);
  }

  async listBySubmissionId(
    submissionId: string,
    order: 'asc' | 'desc' = 'asc'
  ): Promise<DecisionRecord[]> {
    const orderDirection =
      order === 'asc'
        ? [asc(decisions.createdAt), asc(decisions.id)]
        : [desc(decisions.createdAt), desc(decisions.id)];

    return this.database
      .select()
      .from(decisions)
      .where(eq(decisions.submissionId, submissionId))
      .orderBy(...orderDirection);
  }

  async deleteById(id: string): Promise<void> {
    await this.database.delete(decisions).where(eq(decisions.id, id));
  }

  async listIssuesBySubmissionId(
    submissionId: string
  ): Promise<DecisionIssueRecord[]> {
    return this.database
      .select({
        id: detectedIssues.id,
        ruleId: detectedIssues.ruleId,
        flaggedExcerpt: detectedIssues.flaggedExcerpt,
        status: detectedIssues.status,
      })
      .from(detectedIssues)
      .innerJoin(reviewRuns, eq(detectedIssues.reviewRunId, reviewRuns.id))
      .where(eq(reviewRuns.submissionId, submissionId));
  }

  async updateIssueStatuses(
    issueIds: string[],
    status: 'OVERRIDDEN'
  ): Promise<void> {
    if (issueIds.length === 0) {
      return;
    }

    await this.database
      .update(detectedIssues)
      .set({ status })
      .where(inArray(detectedIssues.id, issueIds));
  }

  async restoreIssueStatuses(issues: DecisionIssueRecord[]): Promise<void> {
    const statuses = ['OPEN', 'ACCEPTED', 'OVERRIDDEN'] as const;

    for (const status of statuses) {
      const ids = issues
        .filter((issue) => issue.status === status)
        .map((issue) => issue.id);

      if (ids.length > 0) {
        await this.database
          .update(detectedIssues)
          .set({ status })
          .where(inArray(detectedIssues.id, ids));
      }
    }
  }
}

export const decisionsRepository = new DecisionsRepository();
