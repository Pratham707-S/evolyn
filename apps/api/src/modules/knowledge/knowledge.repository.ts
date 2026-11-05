import {
  and,
  asc,
  cosineDistance,
  eq,
  gt,
  isNotNull,
  isNull,
  or,
  type SQL,
} from 'drizzle-orm';
import { db } from '../../db/index.js';
import { approvedFacts } from '../../db/schema.js';

export type ApprovedFactRecord = typeof approvedFacts.$inferSelect;

export class KnowledgeRepository {
  async create(input: {
    topic: string;
    claimStatement: string;
    approvedProofSource: string;
    validUntil: Date | null;
    embedding: number[];
  }): Promise<ApprovedFactRecord> {
    const [fact] = await db.insert(approvedFacts).values(input).returning();
    if (!fact) {
      throw new Error('Failed to create approved fact');
    }

    return fact;
  }

  async list(topic?: string): Promise<ApprovedFactRecord[]> {
    const conditions: SQL[] = [];
    if (topic) {
      conditions.push(eq(approvedFacts.topic, topic));
    }
    conditions.push(
      or(isNull(approvedFacts.validUntil), gt(approvedFacts.validUntil, new Date()))!
    );

    return db
      .select()
      .from(approvedFacts)
      .where(and(...conditions))
      .orderBy(asc(approvedFacts.topic), asc(approvedFacts.createdAt));
  }

  async findRelevant(
    queryVector: number[],
    limit: number
  ): Promise<Array<ApprovedFactRecord & { similarity: number }>> {
    const distance = cosineDistance(approvedFacts.embedding, queryVector);
    const rows = await db
      .select({
        fact: approvedFacts,
        distance,
      })
      .from(approvedFacts)
      .where(
        and(
          or(isNull(approvedFacts.validUntil), gt(approvedFacts.validUntil, new Date())),
          isNotNull(approvedFacts.embedding)
        )
      )
      .orderBy(asc(distance))
      .limit(limit);

    return rows.map(({ fact, distance: score }) => ({
      ...fact,
      similarity: 1 - score,
    }));
  }
}
