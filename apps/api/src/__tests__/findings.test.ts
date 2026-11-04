import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FindingsService } from '../modules/findings/findings.service.js';
import type {
  DetectedIssueRecord,
  FindingsRepository,
} from '../modules/findings/findings.repository.js';
import type { RawFindingInput } from '../modules/findings/findings.types.js';

const reviewRunId = 'c0a80123-4567-4890-a123-456789abcdef';

function createRawFinding(overrides: Partial<RawFindingInput> = {}): RawFindingInput {
  return {
    ruleId: 'd0a80123-4567-4890-a123-456789abcdef',
    issueType: 'PROHIBITED_PHRASE',
    flaggedExcerpt: 'Guaranteed results',
    explanation: 'Avoid absolute guarantees.',
    sourceQuote: 'Do not promise guaranteed results.',
    sourceText: 'Our policy: Do not promise guaranteed results.',
    ...overrides,
  };
}

function createIssueRecord(
  overrides: Partial<DetectedIssueRecord> = {}
): DetectedIssueRecord {
  return {
    id: 'e0a80123-4567-4890-a123-456789abcdef',
    reviewRunId,
    ruleId: 'd0a80123-4567-4890-a123-456789abcdef',
    factId: null,
    issueType: 'PROHIBITED_PHRASE',
    flaggedExcerpt: 'Guaranteed results',
    charStart: 10,
    charEnd: 29,
    explanation: 'Avoid absolute guarantees.',
    suggestedFix: '',
    sourceQuote: 'Do not promise guaranteed results.',
    confidenceScore: 1,
    evidenceStrengthScore: 0,
    status: 'OPEN',
    createdAt: new Date('2026-11-04T10:00:00.000Z'),
    ...overrides,
  };
}

function createRepository(
  overrides: Partial<
    Pick<FindingsRepository, 'recordMany' | 'listByReviewRunId'>
  > = {}
): Pick<FindingsRepository, 'recordMany' | 'listByReviewRunId'> {
  return {
    recordMany: async (findings) =>
      findings.map((finding) =>
        createIssueRecord({
          ...finding,
          id: createIssueRecord().id,
          ruleId: finding.ruleId ?? null,
          factId: finding.factId ?? null,
          charStart: finding.charStart ?? null,
          charEnd: finding.charEnd ?? null,
        })
      ),
    listByReviewRunId: async () => [],
    ...overrides,
  };
}

describe('FindingsService', () => {
  it('only accepts non-empty exact source quotations', () => {
    const service = new FindingsService(createRepository());

    assert.equal(
      service.verifyVerbatimQuote('exact phrase', 'An exact phrase appears here.'),
      true
    );
    assert.equal(service.verifyVerbatimQuote('Exact phrase', 'exact phrase'), false);
    assert.equal(service.verifyVerbatimQuote('', 'any source text'), false);
  });

  it('verifies citations, maps excerpt offsets, and applies schema defaults', async () => {
    let persistedFindings = 0;
    const service = new FindingsService(
      createRepository({
        recordMany: async (findings) => {
          persistedFindings = findings.length;
          return findings.map((finding) =>
            createIssueRecord({
              ...finding,
              id: createIssueRecord().id,
              ruleId: finding.ruleId ?? null,
              factId: finding.factId ?? null,
              charStart: finding.charStart ?? null,
              charEnd: finding.charEnd ?? null,
            })
          );
        },
      })
    );

    const findings = await service.recordFindings(
      reviewRunId,
      [createRawFinding()],
      'Post: Guaranteed results are not acceptable.'
    );

    assert.equal(persistedFindings, 1);
    assert.equal(findings[0].charStart, 6);
    assert.equal(findings[0].charEnd, 24);
    assert.equal(findings[0].status, 'OPEN');
    assert.equal(findings[0].evidenceStrengthScore, 0);
  });

  it('does not persist findings with fabricated quotations', async () => {
    let persistCalled = false;
    const service = new FindingsService(
      createRepository({
        recordMany: async () => {
          persistCalled = true;
          return [];
        },
      })
    );

    await assert.rejects(
      service.recordFindings(
        reviewRunId,
        [createRawFinding({ sourceQuote: 'fabricated quote' })],
        'Guaranteed results are not acceptable.'
      ),
      /not present verbatim/
    );
    assert.equal(persistCalled, false);
  });

  it('rejects offsets that do not match the submitted content', async () => {
    const service = new FindingsService(createRepository());

    await assert.rejects(
      service.recordFindings(
        reviewRunId,
        [createRawFinding({ charStart: 0, charEnd: 19 })],
        'Post: Guaranteed results are not acceptable.'
      ),
      /offsets do not match/
    );
  });

  it('retrieves findings by review run and validates IDs', async () => {
    const service = new FindingsService(
      createRepository({
        listByReviewRunId: async () => [createIssueRecord()],
      })
    );

    const findings = await service.getFindingsByReviewRunId(reviewRunId);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].id, createIssueRecord().id);
    await assert.rejects(service.getFindingsByReviewRunId('invalid-id'));
  });
});
