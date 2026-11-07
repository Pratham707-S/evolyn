import {
    createGuidelineSchema,
    updateGuidelineSchema,
    RULE_TYPES,
    SEVERITY_LEVELS,
} from '@evolyn/shared';

import { detectRuleConflicts } from './conflict-detector.js';
import { defaultMaintenanceGate } from '../maintenance/maintenance-gate.js';

import type {
    Guideline,
    GuidelineRule,
} from '@evolyn/shared';

import {
    guidelinesRepository,
    GuidelinesRepository,
    type GuidelineRecord,
    type GuidelineRuleRecord,
    type GuidelineConflictRecord,
    type RelevantRuleRecord,
} from './guidelines.repository.js';

import type {
    IGuidelineService,
    GuidelineWithRules,
} from './index.js';

import type {
    GuidelineQueryFilter,
    GuidelineRuleExtractor,
    RuleExtractionResult,
    GuidelineEmbeddingGenerator,
    EmbeddingGenerationResult,
    RuleMatchResult,
} from './guidelines.types.js';

type GuidelinesRepositoryPort = Pick<
    GuidelinesRepository,
    | 'create'
    | 'findMany'
    | 'findById'
    | 'update'
    | 'delete'
    | 'findRulesByGuidelineId'
    | 'createRules'
    | 'findConflictsByRuleIds'
    | 'createConflicts'
    | 'findRulesWithoutEmbeddings'
    | 'updateRuleEmbedding'
> & {
    replaceRules?: (
        guidelineId: string,
        rules: RuleExtractionResult[],
    ) => Promise<GuidelineRuleRecord[]>;
    findRelevantRules?: (
        queryVector: number[],
        limit?: number,
    ) => Promise<RelevantRuleRecord[]>;
};

function validateEnum<T extends readonly string[]>(
    value: string,
    allowedValues: T,
    fieldName: string,
): void {
    if (!allowedValues.includes(value as T[number])) {
        throw new Error(
            `Invalid ${fieldName}: ${value}. Allowed values: ${allowedValues.join(', ')}`,
        );
    }
}

function mapGuideline(record: GuidelineRecord): Guideline {
    return {
        id: record.id,
        title: record.title,
        category: record.category as Guideline['category'],
        version: record.version,
        rawContent: record.rawContent,
        s3Url: record.s3Url,
        status: record.status as Guideline['status'],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

function mapRule(record: GuidelineRuleRecord): GuidelineRule {
    const metadata = record.metadata;

    return {
        id: record.id,
        guidelineId: record.guidelineId,
        ruleType: record.ruleType as GuidelineRule['ruleType'],
        ruleStatement: record.ruleStatement,
        explanation: record.explanation,
        severity: record.severity as GuidelineRule['severity'],
        ...(metadata &&
            typeof metadata === 'object' &&
            !Array.isArray(metadata)
            ? { metadata: metadata as Record<string, unknown> }
            : {}),
        createdAt: record.createdAt.toISOString(),
    };
}

export class GuidelinesService implements IGuidelineService {
    constructor(
        private readonly repository: GuidelinesRepositoryPort = guidelinesRepository,
        private ruleExtractor?: GuidelineRuleExtractor,
        private readonly embeddingGenerator?: GuidelineEmbeddingGenerator,
    ) { }

    setRuleExtractor(extractor?: GuidelineRuleExtractor): void {
        this.ruleExtractor = extractor;
    }

    async generateAndSaveEmbeddings(
        guidelineId: string,
    ): Promise<EmbeddingGenerationResult> {
        return await defaultMaintenanceGate.withSharedLock(async () => {
            if (!guidelineId || !guidelineId.trim()) {
                throw new Error('Guideline ID cannot be empty');
            }

            if (!this.embeddingGenerator) {
                throw new Error('Embedding generator is not configured');
            }

            const guideline = await this.repository.findById(guidelineId);

            if (!guideline) {
                throw new Error('Guideline not found');
            }

            const rules = await this.repository.findRulesWithoutEmbeddings(
                guidelineId,
            );

            let generatedCount = 0;

            for (const rule of rules) {
                const embedding = await this.embeddingGenerator.generateEmbedding(
                    rule.ruleStatement,
                    { dimensions: 768 },
                );

                if (
                    !Array.isArray(embedding) ||
                    embedding.length !== 768 ||
                    !embedding.every(Number.isFinite)
                ) {
                    throw new Error(
                        `Invalid embedding generated for rule: ${rule.id}`,
                    );
                }

                await this.repository.updateRuleEmbedding(rule.id, embedding);

                generatedCount++;
            }

            return {
                guidelineId,
                generatedCount,
            };
        });
    }

    /**
     * Extract and validate atomic rules from guideline content.
     */
    async extractRules(
        rawContent: string,
    ): Promise<RuleExtractionResult[]> {
        if (!rawContent || !rawContent.trim()) {
            throw new Error('Guideline content cannot be empty');
        }

        if (!this.ruleExtractor) {
            throw new Error('Rule extractor is not configured');
        }

        const extractedRules =
            await this.ruleExtractor.extractRules(rawContent);

        if (!Array.isArray(extractedRules)) {
            throw new Error('Rule extractor returned an invalid response');
        }

        return extractedRules.map((rule, index) => {
            if (
                !rule ||
                typeof rule.ruleStatement !== 'string' ||
                !rule.ruleStatement.trim()
            ) {
                throw new Error(
                    `Invalid rule statement at index ${index}`,
                );
            }

            if (!RULE_TYPES.includes(rule.ruleType)) {
                throw new Error(
                    `Invalid rule type at index ${index}`,
                );
            }

            if (
                typeof rule.explanation !== 'string' ||
                !rule.explanation.trim()
            ) {
                throw new Error(
                    `Invalid rule explanation at index ${index}`,
                );
            }

            if (!SEVERITY_LEVELS.includes(rule.severity)) {
                throw new Error(
                    `Invalid rule severity at index ${index}`,
                );
            }

            return {
                ruleStatement: rule.ruleStatement.trim(),
                ruleType: rule.ruleType,
                explanation: rule.explanation.trim(),
                severity: rule.severity,
            };
        });
    }

    /**
     * Extract rules strictly from canonical guideline content and persist them.
     * Always uses canonical guideline.rawContent stored in database; caller-supplied override is disallowed.
     * Replaces rules atomically to prevent duplicate accumulation upon re-extraction.
     * Rejects empty extraction output before persistence to protect existing stored rules.
     */
    async extractAndSaveRules(
        guidelineId: string,
    ): Promise<GuidelineRule[]> {
        if (!guidelineId || !guidelineId.trim()) {
            throw new Error('Guideline ID cannot be empty');
        }

        const guideline = await this.repository.findById(guidelineId);

        if (!guideline) {
            throw new Error('Guideline not found');
        }

        const contentToExtract = guideline.rawContent?.trim();

        if (!contentToExtract) {
            throw new Error('Guideline content cannot be empty');
        }

        const extractedRules = await this.extractRules(contentToExtract);

        if (extractedRules.length === 0) {
            throw new Error('No atomic rules could be extracted from the guideline content');
        }

        const persistenceMethod =
            typeof this.repository.replaceRules === 'function'
                ? this.repository.replaceRules.bind(this.repository)
                : this.repository.createRules.bind(this.repository);

        const savedRules = await persistenceMethod(
            guidelineId,
            extractedRules,
        );

        return savedRules.map(mapRule);
    }

    // Create a new guideline
    async createGuideline(
        input: Parameters<IGuidelineService['createGuideline']>[0],
    ): Promise<Guideline> {
        const validatedInput = createGuidelineSchema.parse(input);

        const guideline = await this.repository.create(validatedInput);

        return mapGuideline(guideline);
    }

    // Retrieve guidelines with optional filters
    async getGuidelines(
        filter: GuidelineQueryFilter = {},
    ): Promise<Guideline[]> {
        if (filter.category) {
            validateEnum(
                filter.category,
                ['TONE', 'TERMINOLOGY', 'CLAIM_VERIFICATION', 'COMPLIANCE', 'GENERAL'],
                'category filter',
            );
        }

        if (filter.status) {
            validateEnum(
                filter.status,
                ['DRAFT', 'ACTIVE', 'ARCHIVED'],
                'status filter',
            );
        }

        const records = await this.repository.findMany(filter);

        return records.map(mapGuideline);
    }

    // Retrieve a guideline with associated atomic rules
    async getGuidelineById(
        id: string,
    ): Promise<GuidelineWithRules | null> {
        if (!id || !id.trim()) {
            throw new Error('Guideline ID cannot be empty');
        }

        const guideline = await this.repository.findById(id);

        if (!guideline) {
            return null;
        }

        const rules = await this.repository.findRulesByGuidelineId(id);

        return {
            ...mapGuideline(guideline),
            rules: rules.map(mapRule),
        };
    }

    async updateGuideline(
        id: string,
        input: unknown,
    ): Promise<Guideline | null> {
        if (!id || !id.trim()) {
            throw new Error('Guideline ID cannot be empty');
        }

        const validated = updateGuidelineSchema.parse(input);
        const updated = await this.repository.update(id, validated as any);
        if (!updated) {
            return null;
        }

        return mapGuideline(updated);
    }

    async deleteGuideline(id: string): Promise<boolean> {
        if (!id || !id.trim()) {
            throw new Error('Guideline ID cannot be empty');
        }

        return await this.repository.delete(id);
    }

    async detectAndSaveConflicts(
        guidelineId: string,
    ): Promise<GuidelineConflictRecord[]> {
        if (!guidelineId || !guidelineId.trim()) {
            throw new Error('Guideline ID cannot be empty');
        }

        const guideline = await this.repository.findById(guidelineId);

        if (!guideline) {
            throw new Error('Guideline not found');
        }

        const ruleRecords =
            await this.repository.findRulesByGuidelineId(guidelineId);

        if (ruleRecords.length < 2) {
            return [];
        }

        // Convert database rules into validated shared rule types.
        const rules = ruleRecords.map(mapRule);

        // Detect explicit contradictions between unique rule pairs.
        const detectedConflicts = detectRuleConflicts(rules);

        if (detectedConflicts.length === 0) {
            return [];
        }

        // Check existing conflicts to prevent sequential duplicates.
        const existingConflicts =
            await this.repository.findConflictsByRuleIds(
                rules.map((rule) => rule.id),
            );

        const existingKeys = new Set(
            existingConflicts.map((conflict) => {
                const ids = [
                    conflict.ruleAId,
                    conflict.ruleBId,
                ].sort();

                return `${ids[0]}:${ids[1]}:${conflict.conflictType}`;
            }),
        );

        const newConflicts = detectedConflicts.filter((conflict) => {
            const ids = [
                conflict.ruleAId,
                conflict.ruleBId,
            ].sort();

            const key =
                `${ids[0]}:${ids[1]}:${conflict.conflictType}`;

            return !existingKeys.has(key);
        });

        if (newConflicts.length === 0) {
            return [];
        }

        return this.repository.createConflicts(newConflicts);
    }

    /**
     * Retrieve semantically relevant rules using vector cosine similarity.
     * Validates that query vector has exactly 768 finite dimensions and a positive limit.
     */
    async findRelevantRules(
        queryVector: number[],
        limit = 10,
    ): Promise<RuleMatchResult[]> {
        if (
            !Array.isArray(queryVector) ||
            queryVector.length !== 768 ||
            !queryVector.every(Number.isFinite)
        ) {
            throw new Error(
                'Query embedding must contain exactly 768 finite numbers',
            );
        }

        if (!Number.isInteger(limit) || limit <= 0) {
            throw new Error('Limit must be a positive integer');
        }

        if (!this.repository.findRelevantRules) {
            throw new Error('Repository does not support semantic rule search');
        }

        const rules = await this.repository.findRelevantRules(
            queryVector,
            limit,
        );

        return rules.map((rule) => ({
            ...mapRule(rule),
            similarity: rule.similarity,
        }));
    }
}

// Default service instance
export const guidelinesService = new GuidelinesService(
    guidelinesRepository,
);
