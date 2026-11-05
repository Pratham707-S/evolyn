import { desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { reviewRuns } from '../../db/schema.js';

export type ReviewRunRecord = typeof reviewRuns.$inferSelect;

export interface CreateReviewRunInput {
  submissionId: string;
  overallComplianceScore: number;
  totalIssuesCount: number;
  modelUsed: string;
  summary: {
    passedChecksCount: number;
    failedChecksCount: number;
    notes?: string;
  };
}

export class ReviewsRepository {
  async create(input: CreateReviewRunInput): Promise<ReviewRunRecord> {
    const [reviewRun] = await db.insert(reviewRuns).values(input).returning();
    if (!reviewRun) {
      throw new Error('Failed to persist review run');
    }

    return reviewRun;
  }

  async findLatestBySubmissionId(submissionId: string): Promise<ReviewRunRecord | null> {
    const [reviewRun] = await db
      .select()
      .from(reviewRuns)
      .where(eq(reviewRuns.submissionId, submissionId))
      .orderBy(desc(reviewRuns.createdAt), desc(reviewRuns.id))
      .limit(1);

    return reviewRun ?? null;
  }

  async deleteById(id: string): Promise<void> {
    await db.delete(reviewRuns).where(eq(reviewRuns.id, id));
  }
}
