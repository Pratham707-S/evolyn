import {
    and,
    desc,
    eq,
    inArray,
    or,
    type SQL,
} from 'drizzle-orm';

import { db } from '../../db/index.js';
import {
    guidelines,
    guidelineRules,
    guidelineConflicts,
} from '../../db/schema.js';

import type { CreateGuidelineInput } from '@evolyn/shared';
import type { GuidelineQueryFilter } from './guidelines.types.js';
import type { DetectedConflict } from './conflict-detector.js';

export type GuidelineRecord = typeof guidelines.$inferSelect;
export type GuidelineRuleRecord = typeof guidelineRules.$inferSelect;
export type GuidelineConflictRecord =
    typeof guidelineConflicts.$inferSelect;

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

        return db
            .select()
            .from(guidelines)
            .where(whereClause)
            .orderBy(desc(guidelines.createdAt));
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

    async findConflictsByRuleIds(
        ruleIds: string[],
    ): Promise<GuidelineConflictRecord[]> {
        if (ruleIds.length === 0) {
            return [];
        }

        return db
            .select()
            .from(guidelineConflicts)
            .where(
                or(
                    inArray(guidelineConflicts.ruleAId, ruleIds),
                    inArray(guidelineConflicts.ruleBId, ruleIds),
                ),
            );
    }

    async createConflicts(
        conflicts: DetectedConflict[],
    ): Promise<GuidelineConflictRecord[]> {
        if (conflicts.length === 0) {
            return [];
        }

        return db
            .insert(guidelineConflicts)
            .values(
                conflicts.map((conflict) => ({
                    ruleAId: conflict.ruleAId,
                    ruleBId: conflict.ruleBId,
                    conflictType: conflict.conflictType,
                    explanation: conflict.explanation,
                    severity: conflict.severity,
                    status: 'OPEN',
                })),
            )
            .returning();
    }
}

export const guidelinesRepository = new GuidelinesRepository();
