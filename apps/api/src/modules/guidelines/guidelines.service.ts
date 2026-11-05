import {
    createGuidelineSchema,
    RULE_TYPES,
    SEVERITY_LEVELS,
} from '@evolyn/shared';

import type {
    Guideline,
    GuidelineRule,
} from '@evolyn/shared';

import {
    guidelinesRepository,
    GuidelinesRepository,
    type GuidelineRecord,
    type GuidelineRuleRecord,
} from './guidelines.repository.js';

import type {
    IGuidelineService,
    GuidelineWithRules,
} from './index.js';

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
> & {
    replaceRules?: (
        guidelineId: string,
        rules: RuleExtractionResult[],
    ) => Promise<GuidelineRuleRecord[]>;
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
    ) { }

    setRuleExtractor(extractor?: GuidelineRuleExtractor): void {
        this.ruleExtractor = extractor;
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
}

// Default service instance
export const guidelinesService = new GuidelinesService(
    guidelinesRepository,
);
