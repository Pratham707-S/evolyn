import {
    asc,
    cosineDistance,
    desc,
    eq,
    getTableColumns,
    isNotNull,
    isNull,
    sql,
} from 'drizzle-orm';

import { db } from '../../db/index.js';
import { approvedFacts } from '../../db/schema.js';

import type { CreateApprovedFactInput } from '@evolyn/shared';

export type ApprovedFactRecord = typeof approvedFacts.$inferSelect;

export interface RelevantFactRecord extends ApprovedFactRecord {
    similarity: number;
}

export class KnowledgeRepository {
    constructor(
        private readonly database: typeof db = db,
    ) { }

    async create(
        input: CreateApprovedFactInput,
    ): Promise<ApprovedFactRecord> {
        const [fact] = await this.database
            .insert(approvedFacts)
            .values({
                topic: input.topic,
                claimStatement: input.claimStatement,
                approvedProofSource: input.approvedProofSource,
                validUntil: input.validUntil
                    ? new Date(input.validUntil)
                    : null,
            })
            .returning();

        if (!fact) {
            throw new Error('Failed to create approved fact');
        }

        return fact;
    }

    async findMany(topic?: string): Promise<ApprovedFactRecord[]> {
        const query = this.database
            .select()
            .from(approvedFacts);

        if (topic) {
            return query
                .where(eq(approvedFacts.topic, topic))
                .orderBy(desc(approvedFacts.createdAt));
        }

        return query.orderBy(desc(approvedFacts.createdAt));
    }

    async findByTopic(topic: string): Promise<ApprovedFactRecord[]> {
        return this.database
            .select()
            .from(approvedFacts)
            .where(eq(approvedFacts.topic, topic))
            .orderBy(desc(approvedFacts.createdAt));
    }

    async findRelevantFacts(
        queryVector: number[],
        limit = 10,
    ): Promise<RelevantFactRecord[]> {
        const distance = cosineDistance(
            approvedFacts.embedding,
            queryVector,
        );

        const results = await this.database
            .select({
                ...getTableColumns(approvedFacts),
                distance: sql<number>`${distance}`,
            })
            .from(approvedFacts)
            .where(isNotNull(approvedFacts.embedding))
            .orderBy(asc(distance))
            .limit(limit);

        return results.map(({ distance, ...fact }) => ({
            ...fact,
            similarity: 1 - distance,
        }));
    }

    async findFactsWithoutEmbeddings(): Promise<ApprovedFactRecord[]> {
        return this.database
            .select()
            .from(approvedFacts)
            .where(isNull(approvedFacts.embedding))
            .orderBy(desc(approvedFacts.createdAt));
    }

    async updateEmbedding(
        factId: string,
        embedding: number[],
    ): Promise<ApprovedFactRecord> {
        const [updatedFact] = await this.database
            .update(approvedFacts)
            .set({ embedding })
            .where(eq(approvedFacts.id, factId))
            .returning();

        if (!updatedFact) {
            throw new Error(
                `Failed to update embedding for fact: ${factId}`,
            );
        }

        return updatedFact;
    }
}

export const knowledgeRepository = new KnowledgeRepository();
