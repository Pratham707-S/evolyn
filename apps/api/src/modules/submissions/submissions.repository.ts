import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { contentSubmissions, decisions, reviewRuns } from '../../db/schema.js';
import type { SubmissionChannel, SubmissionStatus } from '@evolyn/shared';

export type SubmissionRecord = typeof contentSubmissions.$inferSelect;
export type ReviewRunRecord = typeof reviewRuns.$inferSelect;
export type DecisionRecord = typeof decisions.$inferSelect;

export interface SubmissionDetailsRecord {
  submission: SubmissionRecord;
  reviewRun: ReviewRunRecord | null;
  decision: DecisionRecord | null;
}

export class SubmissionRepository {
  async create(input: {
    title: string;
    channel: SubmissionChannel;
    rawText: string;
    fileUrl?: string | null;
    submittedBy: string;
  }): Promise<SubmissionRecord> {
    const [submission] = await db
      .insert(contentSubmissions)
      .values({
        ...input,
        fileUrl: input.fileUrl ?? null,
      })
      .returning();

    if (!submission) {
      throw new Error('Failed to create submission');
    }

    return submission;
  }

  async findById(id: string): Promise<SubmissionDetailsRecord | null> {
    const [submission] = await db
      .select()
      .from(contentSubmissions)
      .where(eq(contentSubmissions.id, id))
      .limit(1);

    if (!submission) {
      return null;
    }

    const [reviewRun, decision] = await Promise.all([
      db
        .select()
        .from(reviewRuns)
        .where(eq(reviewRuns.submissionId, id))
        .orderBy(desc(reviewRuns.createdAt))
        .limit(1)
        .then(([record]) => record ?? null),
      db
        .select()
        .from(decisions)
        .where(eq(decisions.submissionId, id))
        .orderBy(desc(decisions.createdAt))
        .limit(1)
        .then(([record]) => record ?? null),
    ]);

    return { submission, reviewRun, decision };
  }

  async list(filter: {
    status?: SubmissionStatus;
    channel?: SubmissionChannel;
  }): Promise<SubmissionRecord[]> {
    const rows = await db
      .select()
      .from(contentSubmissions)
      .where(
        and(
          filter.status ? eq(contentSubmissions.status, filter.status) : undefined,
          filter.channel ? eq(contentSubmissions.channel, filter.channel) : undefined
        )
      )
      .orderBy(desc(contentSubmissions.createdAt));

    return rows;
  }

  async update(
    id: string,
    input: {
      rawText?: string;
      title?: string;
      status?: SubmissionStatus;
    }
  ): Promise<SubmissionRecord> {
    const updateData: Partial<typeof contentSubmissions.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (input.rawText !== undefined) updateData.rawText = input.rawText;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.status !== undefined) updateData.status = input.status;

    const [updatedSubmission] = await db
      .update(contentSubmissions)
      .set(updateData)
      .where(eq(contentSubmissions.id, id))
      .returning();

    if (!updatedSubmission) {
      throw new Error(`Submission not found: ${id}`);
    }

    return updatedSubmission;
  }

  async updateStatus(id: string, status: SubmissionStatus): Promise<void> {
    const [updatedSubmission] = await db
      .update(contentSubmissions)
      .set({ status, updatedAt: new Date() })
      .where(eq(contentSubmissions.id, id))
      .returning({ id: contentSubmissions.id });

    if (!updatedSubmission) {
      throw new Error(`Submission not found: ${id}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await db
      .delete(contentSubmissions)
      .where(eq(contentSubmissions.id, id))
      .returning({ id: contentSubmissions.id });
    return deleted.length > 0;
  }

  async deleteMany(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const deleted = await db
      .delete(contentSubmissions)
      .where(inArray(contentSubmissions.id, ids))
      .returning({ id: contentSubmissions.id });
    return deleted.length;
  }
}

export const submissionRepository = new SubmissionRepository();
