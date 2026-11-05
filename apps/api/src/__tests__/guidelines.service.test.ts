import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { CreateGuidelineInput } from '@evolyn/shared';

import {
  GuidelinesService,
} from '../modules/guidelines/guidelines.service.js';

import type {
  GuidelineRecord,
  GuidelineRuleRecord,
} from '../modules/guidelines/guidelines.repository.js';

import type {
  GuidelineQueryFilter,
} from '../modules/guidelines/guidelines.types.js';

// Mock database records
const createdAt = new Date('2026-11-04T10:00:00.000Z');

const mockGuideline: GuidelineRecord = {
  id: 'guideline-123',
  title: 'Brand Guidelines',
  category: 'GENERAL',
  version: '1.0',
  rawContent: 'Always use the official brand logo.',
  s3Url: null,
  status: 'ACTIVE',
  createdAt,
  updatedAt: createdAt,
};

const mockRule: GuidelineRuleRecord = {
  id: 'rule-123',
  guidelineId: 'guideline-123',
  ruleType: 'MANDATORY',
  ruleStatement: 'Always use the official brand logo.',
  explanation: 'Maintains brand consistency.',
  severity: 'CRITICAL',
  embedding: null,
  metadata: {},
  createdAt,
};

// Mock repository
type RepositoryMock = ConstructorParameters<
  typeof GuidelinesService
>[0];

function createRepositoryMock(
  overrides: Partial<RepositoryMock> = {},
): RepositoryMock {
  const repository: RepositoryMock = {
    create: async (_input: CreateGuidelineInput) =>
      mockGuideline,

    findMany: async (_filter?: GuidelineQueryFilter) =>
      [mockGuideline],

    findById: async (_id: string) =>
      mockGuideline,

    findRulesByGuidelineId: async (_id: string) =>
      [mockRule],

    createRules: async (_guidelineId, _rules) => [mockRule],

    findRulesWithoutEmbeddings: async (_id: string) => [mockRule],

    updateRuleEmbedding: async (_ruleId: string, embedding: number[]) => ({
      ...mockRule,
      embedding,
    }),
  };

  return {
    ...repository,
    ...overrides,
  };
}

const validInput: CreateGuidelineInput = {
  title: 'Brand Guidelines',
  category: 'GENERAL',
  version: '1.0',
  rawContent: 'Always use the official brand logo.',
};

// Tests
describe('GuidelinesService', () => {
  it('creates a guideline successfully', async () => {
    const service = new GuidelinesService(
      createRepositoryMock(),
    );

    const result = await service.createGuideline(validInput);

    assert.equal(result.id, 'guideline-123');
    assert.equal(result.title, 'Brand Guidelines');
    assert.equal(result.category, 'GENERAL');
    assert.equal(result.status, 'ACTIVE');
    assert.equal(result.createdAt, createdAt.toISOString());
  });

  it('rejects invalid guideline input', async () => {
    let repositoryCalled = false;

    const repository = createRepositoryMock({
      create: async () => {
        repositoryCalled = true;
        return mockGuideline;
      },
    });

    const service = new GuidelinesService(repository);

    const invalidInput = {
      ...validInput,
      rawContent: 'short',
    };

    await assert.rejects(
      service.createGuideline(invalidInput),
      { name: 'ZodError' },
    );

    assert.equal(repositoryCalled, false);
  });

  it('retrieves all guidelines', async () => {
    const service = new GuidelinesService(
      createRepositoryMock(),
    );

    const result = await service.getGuidelines();

    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, 'guideline-123');
  });

  it('retrieves guidelines using filters', async () => {
    let receivedFilter: GuidelineQueryFilter | undefined;

    const repository = createRepositoryMock({
      findMany: async (filter) => {
        receivedFilter = filter;
        return [mockGuideline];
      },
    });

    const service = new GuidelinesService(repository);

    await service.getGuidelines({
      category: 'GENERAL',
      status: 'ACTIVE',
    });

    assert.deepEqual(receivedFilter, {
      category: 'GENERAL',
      status: 'ACTIVE',
    });
  });

  it('retrieves a guideline with its associated rules', async () => {
    const service = new GuidelinesService(
      createRepositoryMock(),
    );

    const result = await service.getGuidelineById(
      'guideline-123',
    );

    assert.ok(result);
    assert.equal(result.id, 'guideline-123');
    assert.equal(result.rules.length, 1);
    assert.equal(result.rules[0]?.ruleType, 'MANDATORY');
    assert.equal(
      result.rules[0]?.createdAt,
      createdAt.toISOString(),
    );
  });

  it('returns null when guideline does not exist', async () => {
    const repository = createRepositoryMock({
      findById: async () => null,
    });

    const service = new GuidelinesService(repository);

    const result = await service.getGuidelineById(
      'missing-id',
    );

    assert.equal(result, null);
  });

  it('extracts valid rules successfully', async () => {
    const extractor = {
      extractRules: async () => [
        {
          ruleStatement: 'Always use the official logo.',
          ruleType: 'MANDATORY' as const,
          explanation: 'Maintains brand consistency.',
          severity: 'CRITICAL' as const,
        },
      ],
    };

    const service = new GuidelinesService(
      createRepositoryMock(),
      extractor,
    );

    const result = await service.extractRules(
      'Always use the official logo.',
    );

    assert.equal(result.length, 1);
    assert.equal(result[0]?.ruleType, 'MANDATORY');
  });

  it('rejects empty guideline content', async () => {
    const extractor = {
      extractRules: async () => [],
    };

    const service = new GuidelinesService(
      createRepositoryMock(),
      extractor,
    );

    await assert.rejects(
      service.extractRules('   '),
      /cannot be empty/,
    );
  });

  it('rejects extraction when extractor is not configured', async () => {
    const service = new GuidelinesService(
      createRepositoryMock(),
    );

    await assert.rejects(
      service.extractRules('Valid guideline content.'),
      /not configured/,
    );
  });

  it('rejects invalid extracted rule type', async () => {
    const extractor = {
      extractRules: async () => [
        {
          ruleStatement: 'Use official logo.',
          ruleType: 'INVALID' as any,
          explanation: 'Brand consistency.',
          severity: 'CRITICAL' as const,
        },
      ],
    };

    const service = new GuidelinesService(
      createRepositoryMock(),
      extractor,
    );

    await assert.rejects(
      service.extractRules('Valid guideline content.'),
      /Invalid rule type/,
    );
  });

  it('rejects invalid extracted severity', async () => {
    const extractor = {
      extractRules: async () => [
        {
          ruleStatement: 'Use official logo.',
          ruleType: 'MANDATORY' as const,
          explanation: 'Brand consistency.',
          severity: 'INVALID' as any,
        },
      ],
    };

    const service = new GuidelinesService(
      createRepositoryMock(),
      extractor,
    );

    await assert.rejects(
      service.extractRules('Valid guideline content.'),
      /Invalid rule severity/,
    );
  });

  it('rejects empty extracted rule statements', async () => {
    const extractor = {
      extractRules: async () => [
        {
          ruleStatement: '   ',
          ruleType: 'MANDATORY' as const,
          explanation: 'Brand consistency.',
          severity: 'CRITICAL' as const,
        },
      ],
    };

    const service = new GuidelinesService(
      createRepositoryMock(),
      extractor,
    );

    await assert.rejects(
      service.extractRules('Valid guideline content.'),
      /Invalid rule statement/,
    );
  });
  it('extracts and saves rules successfully', async () => {
    let receivedGuidelineId = '';
    let receivedRules: unknown;

    const repository = createRepositoryMock({
      createRules: async (guidelineId, rules) => {
        receivedGuidelineId = guidelineId;
        receivedRules = rules;
        return [mockRule];
      },
    });

    const extractor = {
      extractRules: async () => [
        {
          ruleStatement: '  Always use the official logo.  ',
          ruleType: 'MANDATORY' as const,
          explanation: '  Maintains brand consistency.  ',
          severity: 'CRITICAL' as const,
        },
      ],
    };

    const service = new GuidelinesService(repository, extractor);

    const result = await service.extractAndSaveRules(
      'guideline-123',
      'Brand guideline content.',
    );

    assert.equal(receivedGuidelineId, 'guideline-123');
    assert.deepEqual(receivedRules, [
      {
        ruleStatement: 'Always use the official logo.',
        ruleType: 'MANDATORY',
        explanation: 'Maintains brand consistency.',
        severity: 'CRITICAL',
      },
    ]);

    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, 'rule-123');
    assert.equal(result[0]?.ruleType, 'MANDATORY');
    assert.equal(result[0]?.createdAt, createdAt.toISOString());
  });

  it('rejects rule extraction when guideline does not exist', async () => {
    let extractorCalled = false;

    const repository = createRepositoryMock({
      findById: async () => null,
    });

    const extractor = {
      extractRules: async () => {
        extractorCalled = true;
        return [];
      },
    };

    const service = new GuidelinesService(repository, extractor);

    await assert.rejects(
      service.extractAndSaveRules(
        'missing-guideline',
        'Brand guideline content.',
      ),
      /Guideline not found/,
    );

    assert.equal(extractorCalled, false);
  });

  it('does not save rules when extraction fails', async () => {
    let createRulesCalled = false;

    const repository = createRepositoryMock({
      createRules: async () => {
        createRulesCalled = true;
        return [mockRule];
      },
    });

    const extractor = {
      extractRules: async () => {
        throw new Error('AI extraction failed');
      },
    };

    const service = new GuidelinesService(repository, extractor);

    await assert.rejects(
      service.extractAndSaveRules(
        'guideline-123',
        'Brand guideline content.',
      ),
      /AI extraction failed/,
    );

    assert.equal(createRulesCalled, false);
  });

  it('returns an empty array when no rules are extracted', async () => {
    let createRulesCalled = false;

    const repository = createRepositoryMock({
      createRules: async (_guidelineId, rules) => {
        createRulesCalled = true;
        assert.deepEqual(rules, []);
        return [];
      },
    });

    const extractor = {
      extractRules: async () => [],
    };

    const service = new GuidelinesService(repository, extractor);

    const result = await service.extractAndSaveRules(
      'guideline-123',
      'Brand guideline content.',
    );

    assert.deepEqual(result, []);
    assert.equal(createRulesCalled, true);
  });

  it('generates and saves a valid 768-dimensional embedding', async () => {
    const embedding = Array(768).fill(0.1);
    let savedEmbedding: number[] | undefined;
    let receivedDimensions: number | undefined;

    const repository = createRepositoryMock({
      updateRuleEmbedding: async (_id, vector) => {
        savedEmbedding = vector;
        return { ...mockRule, embedding: vector };
      },
    });

    const generator = {
      generateEmbedding: async (
        _text: string,
        options?: { dimensions?: number },
      ) => {
        receivedDimensions = options?.dimensions;
        return embedding;
      },
    };

    const service = new GuidelinesService(
      repository,
      undefined,
      generator,
    );

    const result = await service.generateAndSaveEmbeddings(
      'guideline-123',
    );

    assert.equal(result.generatedCount, 1);
    assert.equal(result.guidelineId, 'guideline-123');
    assert.equal(receivedDimensions, 768);
    assert.deepEqual(savedEmbedding, embedding);
  });

  it('rejects embeddings with invalid dimensions', async () => {
    const generator = {
      generateEmbedding: async () => Array(767).fill(0.1),
    };

    const service = new GuidelinesService(
      createRepositoryMock(),
      undefined,
      generator,
    );

    await assert.rejects(
      service.generateAndSaveEmbeddings('guideline-123'),
      /Invalid embedding generated/,
    );
  });

  it('rejects embeddings containing NaN or Infinity', async () => {
    const invalidEmbedding = Array(768).fill(0.1);
    invalidEmbedding[10] = Number.NaN;

    const generator = {
      generateEmbedding: async () => invalidEmbedding,
    };

    const service = new GuidelinesService(
      createRepositoryMock(),
      undefined,
      generator,
    );

    await assert.rejects(
      service.generateAndSaveEmbeddings('guideline-123'),
      /Invalid embedding generated/,
    );
  });

  it('does not generate embeddings when all rules are already embedded', async () => {
    let generatorCalled = false;

    const repository = createRepositoryMock({
      findRulesWithoutEmbeddings: async () => [],
    });

    const generator = {
      generateEmbedding: async () => {
        generatorCalled = true;
        return Array(768).fill(0.1);
      },
    };

    const service = new GuidelinesService(
      repository,
      undefined,
      generator,
    );

    const result = await service.generateAndSaveEmbeddings(
      'guideline-123',
    );

    assert.equal(result.generatedCount, 0);
    assert.equal(generatorCalled, false);
  });

  it('rejects when guideline does not exist', async () => {
    let generatorCalled = false;

    const repository = createRepositoryMock({
      findById: async () => null,
    });

    const generator = {
      generateEmbedding: async () => {
        generatorCalled = true;
        return Array(768).fill(0.1);
      },
    };

    const service = new GuidelinesService(
      repository,
      undefined,
      generator,
    );

    await assert.rejects(
      service.generateAndSaveEmbeddings('missing-guideline'),
      /Guideline not found/,
    );

    assert.equal(generatorCalled, false);
  });

  it('rejects when embedding generator is not configured', async () => {
    const service = new GuidelinesService(
      createRepositoryMock(),
    );

    await assert.rejects(
      service.generateAndSaveEmbeddings('guideline-123'),
      /Embedding generator is not configured/,
    );
  });

  it('propagates embedding provider errors without saving', async () => {
    let saveCalled = false;

    const repository = createRepositoryMock({
      updateRuleEmbedding: async (_id, vector) => {
        saveCalled = true;
        return { ...mockRule, embedding: vector };
      },
    });

    const generator = {
      generateEmbedding: async () => {
        throw new Error('Gemini API unavailable');
      },
    };

    const service = new GuidelinesService(
      repository,
      undefined,
      generator,
    );

    await assert.rejects(
      service.generateAndSaveEmbeddings('guideline-123'),
      /Gemini API unavailable/,
    );

    assert.equal(saveCalled, false);
  });
});