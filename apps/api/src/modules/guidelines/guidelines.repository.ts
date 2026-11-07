import {
    and,
    asc,
    cosineDistance,
    desc,
    eq,
    getTableColumns,
    inArray,
    isNotNull,
    isNull,
    or,
    sql,
    type SQL,
} from 'drizzle-orm';

import { db } from '../../db/index.js';
import {
    guidelines,
    guidelineRules,
    guidelineConflicts,
} from '../../db/schema.js';

import type { CreateGuidelineInput } from '@evolyn/shared';
import type {
    GuidelineQueryFilter,
    RuleExtractionResult,
} from './guidelines.types.js';
import type { DetectedConflict } from './conflict-detector.js';

export type GuidelineRecord = typeof guidelines.$inferSelect;
export type GuidelineRuleRecord = typeof guidelineRules.$inferSelect;
export type GuidelineConflictRecord =
    typeof guidelineConflicts.$inferSelect;

export interface RelevantRuleRecord extends GuidelineRuleRecord {
    similarity: number;
}

export class GuidelinesRepository {
    constructor(
        private readonly database: typeof db = db,
    ) { }

    async create(input: CreateGuidelineInput): Promise<GuidelineRecord> {
        const [guideline] = await this.database
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

    /**
     * Persist multiple extracted rules for a guideline (append mode).
     */
    async createRules(
        guidelineId: string,
        rules: RuleExtractionResult[],
    ): Promise<GuidelineRuleRecord[]> {
        if (rules.length === 0) {
            return [];
        }

        return this.database
            .insert(guidelineRules)
            .values(
                rules.map((rule) => ({
                    guidelineId,
                    ruleType: rule.ruleType,
                    ruleStatement: rule.ruleStatement,
                    explanation: rule.explanation,
                    severity: rule.severity,
                })),
            )
            .returning();
    }

    /**
     * Atomically replace all rules for a guideline (safe re-extraction).
     * Prevents duplicate rules upon repeated extraction runs.
     * Enforces database transaction support — non-transactional deletion fallback is strictly forbidden.
     */
    async replaceRules(
        guidelineId: string,
        rules: RuleExtractionResult[],
    ): Promise<GuidelineRuleRecord[]> {
        const executor =
            'transaction' in this.database &&
            typeof this.database.transaction === 'function'
                ? this.database
                : null;

        if (!executor) {
            throw new Error(
                'Database transaction support is required for atomic rule replacement',
            );
        }

        return executor.transaction(async (tx) => {
            await tx
                .delete(guidelineRules)
                .where(eq(guidelineRules.guidelineId, guidelineId));

            if (rules.length === 0) {
                return [];
            }

            return tx
                .insert(guidelineRules)
                .values(
                    rules.map((rule) => ({
                        guidelineId,
                        ruleType: rule.ruleType,
                        ruleStatement: rule.ruleStatement,
                        explanation: rule.explanation,
                        severity: rule.severity,
                    })),
                )
                .returning();
        });
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

        return this.database
            .select()
            .from(guidelines)
            .where(whereClause)
            .orderBy(desc(guidelines.createdAt));
    }

    async findById(id: string): Promise<GuidelineRecord | null> {
        const [guideline] = await this.database
            .select()
            .from(guidelines)
            .where(eq(guidelines.id, id))
            .limit(1);

        return guideline ?? null;
    }

    async update(
        id: string,
        input: Partial<CreateGuidelineInput & { status: string }>
    ): Promise<GuidelineRecord | null> {
        const [updated] = await this.database
            .update(guidelines)
            .set({
                ...(input.title ? { title: input.title } : {}),
                ...(input.category ? { category: input.category } : {}),
                ...(input.version ? { version: input.version } : {}),
                ...(input.rawContent ? { rawContent: input.rawContent } : {}),
                ...(input.status ? { status: input.status } : {}),
                updatedAt: new Date(),
            })
            .where(eq(guidelines.id, id))
            .returning();

        return updated ?? null;
    }

    async delete(id: string): Promise<boolean> {
        const deleted = await this.database
            .delete(guidelines)
            .where(eq(guidelines.id, id))
            .returning();

        return deleted.length > 0;
    }

    async findRulesByGuidelineId(
        guidelineId: string,
    ): Promise<GuidelineRuleRecord[]> {
        return this.database
            .select()
            .from(guidelineRules)
            .where(eq(guidelineRules.guidelineId, guidelineId))
            .orderBy(desc(guidelineRules.createdAt));
    }

    async findRulesWithoutEmbeddings(
        guidelineId: string,
    ): Promise<GuidelineRuleRecord[]> {
        return this.database
            .select()
            .from(guidelineRules)
            .where(
                and(
                    eq(guidelineRules.guidelineId, guidelineId),
                    isNull(guidelineRules.embedding),
                ),
            )
            .orderBy(desc(guidelineRules.createdAt));
    }

    async updateRuleEmbedding(
        ruleId: string,
        embedding: number[],
    ): Promise<GuidelineRuleRecord> {
        const [updatedRule] = await this.database
            .update(guidelineRules)
            .set({ embedding })
            .where(eq(guidelineRules.id, ruleId))
            .returning();

        if (!updatedRule) {
            throw new Error(`Failed to update embedding for rule: ${ruleId}`);
        }

        return updatedRule;
    }

    /**
     * Retrieve semantically relevant guideline rules using vector cosine similarity.
     * Excludes inactive guidelines and rules without embeddings.
     */
    async findRelevantRules(
        queryVector: number[],
        limit = 10,
    ): Promise<RelevantRuleRecord[]> {
        const distance = cosineDistance(
            guidelineRules.embedding,
            queryVector,
        );

        const results = await this.database
            .select({
                ...getTableColumns(guidelineRules),
                distance: sql<number>`${distance}`,
            })
            .from(guidelineRules)
            .innerJoin(guidelines, eq(guidelineRules.guidelineId, guidelines.id))
            .where(
                and(
                    isNotNull(guidelineRules.embedding),
                    eq(guidelines.status, 'ACTIVE'),
                ),
            )
            .orderBy(asc(distance))
            .limit(limit);

        return results.map(({ distance, ...rule }) => ({
            ...rule,
            similarity: 1 - distance,
        }));
    }

    async findConflictsByRuleIds(
        ruleIds: string[],
    ): Promise<GuidelineConflictRecord[]> {
        if (ruleIds.length === 0) {
            return [];
        }

        return this.database
            .select()
            .from(guidelineConflicts)
            .where(
                or(
                    inArray(guidelineConflicts.ruleAId, ruleIds),
                    inArray(guidelineConflicts.ruleBId, ruleIds),
                ),
            );
    }

    /**
     * Persist detected guideline rule conflicts with concurrency safety.
     * Enforces canonical rule ID ordering (ruleAId < ruleBId) consistent with the strict database CHECK constraint.
     * Skips invalid self-conflict pairs (ruleAId === ruleBId) before database insertion.
     * Uses onConflictDoNothing to guarantee concurrent insertion safety against database unique index.
     */
    async createConflicts(
        conflicts: DetectedConflict[],
    ): Promise<GuidelineConflictRecord[]> {
        if (conflicts.length === 0) {
            return [];
        }

        // Filter out invalid self-conflicts (ruleAId === ruleBId) to respect strict database constraint CHECK (rule_a_id < rule_b_id)
        const nonSelfConflicts = conflicts.filter(
            (conflict) => conflict.ruleAId !== conflict.ruleBId,
        );

        if (nonSelfConflicts.length === 0) {
            return [];
        }

        // Canonical ordering: ensure ruleAId is strictly < ruleBId
        const normalized = nonSelfConflicts.map((conflict) => {
            const [ruleAId, ruleBId] =
                conflict.ruleAId < conflict.ruleBId
                    ? [conflict.ruleAId, conflict.ruleBId]
                    : [conflict.ruleBId, conflict.ruleAId];

            return {
                ruleAId,
                ruleBId,
                conflictType: conflict.conflictType,
                explanation: conflict.explanation,
                severity: conflict.severity,
                status: 'OPEN' as const,
            };
        });

        // Deduplicate within the same batch to avoid duplicate key violations in single SQL statement
        const seen = new Set<string>();
        const uniqueConflicts = normalized.filter((c) => {
            const key = `${c.ruleAId}:${c.ruleBId}:${c.conflictType}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (uniqueConflicts.length === 0) {
            return [];
        }

        return this.database
            .insert(guidelineConflicts)
            .values(uniqueConflicts)
            .onConflictDoNothing()
            .returning();
    }
}

export const guidelinesRepository = new GuidelinesRepository();
