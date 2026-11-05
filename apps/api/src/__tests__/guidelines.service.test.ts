import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { CreateGuidelineInput } from '@evolyn/shared';

import {
  GuidelinesService,
} from '../modules/guidelines/guidelines.service.js';

import type {
  GuidelineRecord,
  GuidelineRuleRecord,
  GuidelineConflictRecord,
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

const contradictoryRule: GuidelineRuleRecord = {
  ...mockRule,
  id: 'rule-456',
  ruleType: 'PROHIBITED',
  ruleStatement: 'Never use the official brand logo.',
  severity: 'WARNING',
};

const mockConflict: GuidelineConflictRecord = {
  id: 'conflict-123',
  ruleAId: mockRule.id,
  ruleBId: contradictoryRule.id,
  conflictType: 'CONTRADICTION',
  explanation:
    'Both rules describe the same requirement but express opposite instructions.',
  severity: 'CRITICAL',
  status: 'OPEN',
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
    findConflictsByRuleIds: async () => [],
    createConflicts: async () => [],
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

  it('detects and saves guideline conflicts', async () => {
    let savedConflicts: unknown[] = [];

    const repository = createRepositoryMock({
      findRulesByGuidelineId: async () => [
        mockRule,
        contradictoryRule,
      ],
      createConflicts: async (conflicts) => {
        savedConflicts = conflicts;
        return [mockConflict];
      },
    });

    const service = new GuidelinesService(repository);

    const result = await service.detectAndSaveConflicts(
      'guideline-123',
    );

    assert.equal(result.length, 1);
    assert.equal(result[0]?.conflictType, 'CONTRADICTION');
    assert.equal(result[0]?.status, 'OPEN');
    assert.equal(savedConflicts.length, 1);
  });

  it('does not save duplicate conflicts', async () => {
    let createCalled = false;

    const repository = createRepositoryMock({
      findRulesByGuidelineId: async () => [
        mockRule,
        contradictoryRule,
      ],
      findConflictsByRuleIds: async () => [mockConflict],
      createConflicts: async () => {
        createCalled = true;
        return [];
      },
    });

    const service = new GuidelinesService(repository);

    const result = await service.detectAndSaveConflicts(
      'guideline-123',
    );

    assert.deepEqual(result, []);
    assert.equal(createCalled, false);
  });

  it('throws an error when guideline does not exist', async () => {
    let rulesFetchCalled = false;

    const repository = createRepositoryMock({
      findById: async () => null,
      findRulesByGuidelineId: async () => {
        rulesFetchCalled = true;
        return [];
      },
    });

    const service = new GuidelinesService(repository);

    await assert.rejects(
      service.detectAndSaveConflicts('missing-guideline'),
      /Guideline not found/,
    );

    assert.equal(rulesFetchCalled, false);
  });

  it('returns empty array when no conflicts are detected', async () => {
    let createCalled = false;

    const repository = createRepositoryMock({
      findRulesByGuidelineId: async () => [mockRule],
      createConflicts: async () => {
        createCalled = true;
        return [];
      },
    });

    const service = new GuidelinesService(repository);

    const result = await service.detectAndSaveConflicts(
      'guideline-123',
    );

    assert.deepEqual(result, []);
    assert.equal(createCalled, false);
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
      ),
      /Guideline not found/,
    );

    assert.equal(extractorCalled, false);
  });

  it('does not save rules when extraction fails, preserving existing rules', async () => {
    let persistenceCalled = false;

    const repository = createRepositoryMock({
      replaceRules: async () => {
        persistenceCalled = true;
        return [mockRule];
      },
      createRules: async () => {
        persistenceCalled = true;
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
      ),
      /AI extraction failed/,
    );

    assert.equal(persistenceCalled, false);
  });

  it('rejects with error when extraction returns an empty array to protect existing rules', async () => {
    let persistenceCalled = false;

    const repository = createRepositoryMock({
      replaceRules: async () => {
        persistenceCalled = true;
        return [];
      },
      createRules: async () => {
        persistenceCalled = true;
        return [];
      },
    });

    const extractor = {
      extractRules: async () => [],
    };

    const service = new GuidelinesService(repository, extractor);

    await assert.rejects(
      service.extractAndSaveRules('guideline-123'),
      /No atomic rules could be extracted from the guideline content/,
    );

    assert.equal(persistenceCalled, false);
  });

  it('extracts strictly from canonical guideline.rawContent stored in database', async () => {
    let extractedContent = '';

    const repository = createRepositoryMock({
      findById: async () => ({
        ...mockGuideline,
        rawContent: 'Canonical guideline text from database.',
      }),
      createRules: async () => [mockRule],
    });

    const extractor = {
      extractRules: async (content: string) => {
        extractedContent = content;
        return [
          {
            ruleStatement: 'Always use official logo.',
            ruleType: 'MANDATORY' as const,
            explanation: 'Consistency.',
            severity: 'CRITICAL' as const,
          },
        ];
      },
    };

    const service = new GuidelinesService(repository, extractor);

    const result = await service.extractAndSaveRules('guideline-123');

    assert.equal(extractedContent, 'Canonical guideline text from database.');
    assert.equal(result.length, 1);
  });

  it('uses replaceRules for safe atomic replacement when available', async () => {
    let replaceRulesCalled = false;
    let receivedGuidelineId = '';

    const repository = createRepositoryMock({
      findById: async () => mockGuideline,
      replaceRules: async (id, rules) => {
        replaceRulesCalled = true;
        receivedGuidelineId = id;
        return [mockRule];
      },
    });

    const extractor = {
      extractRules: async () => [
        {
          ruleStatement: 'Always use official logo.',
          ruleType: 'MANDATORY' as const,
          explanation: 'Consistency.',
          severity: 'CRITICAL' as const,
        },
      ],
    };

    const service = new GuidelinesService(repository, extractor);

    const result = await service.extractAndSaveRules('guideline-123');

    assert.equal(replaceRulesCalled, true);
    assert.equal(receivedGuidelineId, 'guideline-123');
    assert.equal(result.length, 1);
  });

  it('rejects when guideline canonical content is empty without touching persistence', async () => {
    let persistenceCalled = false;

    const repository = createRepositoryMock({
      findById: async () => ({
        ...mockGuideline,
        rawContent: '   ',
      }),
      replaceRules: async () => {
        persistenceCalled = true;
        return [];
      },
    });

    const extractor = {
      extractRules: async () => [],
    };

    const service = new GuidelinesService(repository, extractor);

    await assert.rejects(
      service.extractAndSaveRules('guideline-123'),
      /Guideline content cannot be empty/,
    );

    assert.equal(persistenceCalled, false);
  });
});
