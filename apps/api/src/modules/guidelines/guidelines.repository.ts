import { and, desc, eq, type SQL } from 'drizzle-orm';

import { db } from '../../db/index.js';
import { guidelines, guidelineRules } from '../../db/schema.js';

import type { CreateGuidelineInput } from '@evolyn/shared';
import type { GuidelineQueryFilter } from './guidelines.types.js';

export type GuidelineRecord = typeof guidelines.$inferSelect;
export type GuidelineRuleRecord = typeof guidelineRules.$inferSelect;

export class GuidelinesRepository {
    async create(input: CreateGuidelineInput): Promise<GuidelineRecord> {
        const [guideline] = await db
            .insert(guidelines)
            .values({
                title: input.title,
                category: input.category,
                version: input.version,
                rawContent: input.rawContent,
                s3Url: input.s3Url ?? null,
            })
            .returning();

        if (!guideline) {
            throw new Error('Failed to create guideline');
        }

        return guideline;
    }

    async findMany(
        filter: GuidelineQueryFilter = {},
    ): Promise<GuidelineRecord[]> {
        const conditions: SQL[] = [];

        if (filter.status) {
            conditions.push(eq(guidelines.status, filter.status));
        }

        if (filter.category) {
            conditions.push(eq(guidelines.category, filter.category));
        }

        const whereClause = conditions.length
            ? and(...conditions)
            : undefined;

        const query = db
            .select()
            .from(guidelines)
            .where(whereClause)
            .orderBy(desc(guidelines.createdAt));

        if (filter.limit !== undefined) {
            return query.limit(filter.limit);
        }

        return query;
    }

    async findById(id: string): Promise<GuidelineRecord | null> {
        const [guideline] = await db
            .select()
            .from(guidelines)
            .where(eq(guidelines.id, id))
            .limit(1);

        return guideline ?? null;
    }

    async findRulesByGuidelineId(
        guidelineId: string,
    ): Promise<GuidelineRuleRecord[]> {
        return db
            .select()
            .from(guidelineRules)
            .where(eq(guidelineRules.guidelineId, guidelineId))
            .orderBy(desc(guidelineRules.createdAt));
    }
}

export const guidelinesRepository = new GuidelinesRepository();