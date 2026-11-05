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
      {
        message: 'Guideline not found: missing-guideline',
      },
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
});