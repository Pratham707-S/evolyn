import {
    createGuidelineSchema,
    GUIDELINE_CATEGORIES,
    GUIDELINE_STATUSES,
    RULE_TYPES,
    SEVERITY_LEVELS,
} from '@evolyn/shared';

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
} from './guidelines.repository.js';

import type {
    GuidelineQueryFilter,
    GuidelineRuleExtractor,
    RuleExtractionResult,
} from './guidelines.types.js';

type GuidelinesRepositoryPort = Pick<
    GuidelinesRepository,
    | 'create'
    | 'findMany'
    | 'findById'
    | 'findRulesByGuidelineId'
    | 'createRules'
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
        private readonly ruleExtractor?: GuidelineRuleExtractor,
    ) { }

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
     * Extract rules from guideline    content and persist them.
    */
    async extractAndSaveRules(
        guidelineId: string,
        rawContent: string,
    ): Promise<GuidelineRule[]> {
        if (!guidelineId || !guidelineId.trim()) {
            throw new Error('Guideline ID cannot be empty');
        }

        const guideline = await this.repository.findById(guidelineId);

        if (!guideline) {
            throw new Error('Guideline not found');
        }

        const extractedRules = await this.extractRules(rawContent);

        const savedRules = await this.repository.createRules(
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
}

// Default service instance
export const guidelinesService = new GuidelinesService(
    guidelinesRepository,
);
