import {
    createGuidelineSchema,
    GUIDELINE_CATEGORIES,
    GUIDELINE_STATUSES,
    RULE_TYPES,
    SEVERITY_LEVELS,
} from '@evolyn/shared';

import { detectRuleConflicts } from './conflict-detector.js';

import type {
    Guideline,
    GuidelineRule,
} from '@evolyn/shared';

import type {
    GuidelineWithRules,
    IGuidelineService,
} from './index.js';

import {
    GuidelinesRepository,
    guidelinesRepository,
} from './guidelines.repository.js';

import type {
    GuidelineRecord,
    GuidelineRuleRecord,
    GuidelineConflictRecord,
} from './guidelines.repository.js';

import type {
    GuidelineQueryFilter,
} from './guidelines.types.js';

type GuidelinesRepositoryPort = Pick<
    GuidelinesRepository,
    | 'create'
    | 'findMany'
    | 'findById'
    | 'findRulesByGuidelineId'
    | 'findConflictsByRuleIds'
    | 'createConflicts'
>;

function validateEnum<T extends readonly string[]>(
    value: string,
    allowed: T,
    field: string,
): T[number] {
    if (!allowed.includes(value)) {
        throw new Error(`Invalid ${field} value: ${value}`);
    }

    return value as T[number];
}

// Convert database record into shared Guideline type
function mapGuideline(record: GuidelineRecord): Guideline {
    return {
        id: record.id,
        title: record.title,
        category: validateEnum(
            record.category,
            GUIDELINE_CATEGORIES,
            'category',
        ),
        version: record.version,
        rawContent: record.rawContent,
        s3Url: record.s3Url,
        status: validateEnum(
            record.status,
            GUIDELINE_STATUSES,
            'status',
        ),
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

// Convert database rule into shared GuidelineRule type
function mapRule(record: GuidelineRuleRecord): GuidelineRule {
    const metadata = record.metadata;

    return {
        id: record.id,
        guidelineId: record.guidelineId,
        ruleType: validateEnum(
            record.ruleType,
            RULE_TYPES,
            'ruleType',
        ),
        ruleStatement: record.ruleStatement,
        explanation: record.explanation,
        severity: validateEnum(
            record.severity,
            SEVERITY_LEVELS,
            'severity',
        ),
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
        private readonly repository: GuidelinesRepositoryPort,
    ) { }

    // Create a new guideline
    async createGuideline(
        input: Parameters<IGuidelineService['createGuideline']>[0],
    ): Promise<Guideline> {
        const validatedInput = createGuidelineSchema.parse(input);

        const guideline = await this.repository.create(validatedInput);

        return mapGuideline(guideline);
    }

    // Retrieve guidelines
    async getGuidelines(
        filter?: GuidelineQueryFilter,
    ): Promise<Guideline[]> {
        const records = await this.repository.findMany(filter);

        return records.map(mapGuideline);
    }

    // Retrieve one guideline with its associated rules
    async getGuidelineById(
        id: string,
    ): Promise<GuidelineWithRules | null> {
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

    async detectAndSaveConflicts(
        guidelineId: string,
    ): Promise<GuidelineConflictRecord[]> {
        const guideline = await this.repository.findById(guidelineId);

        if (!guideline) {
            throw new Error(`Guideline not found: ${guidelineId}`);
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
}

// Default service instance
export const guidelinesService = new GuidelinesService(
    guidelinesRepository,
);
