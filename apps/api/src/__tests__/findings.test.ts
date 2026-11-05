import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FindingsService, type FindingsRepositoryDependency } from '../modules/findings/findings.service.js';
import type { DetectedIssueRecord } from '../modules/findings/findings.repository.js';
import type { RawFindingInput } from '../modules/findings/findings.types.js';

const reviewRunId = 'c0a80123-4567-4890-a123-456789abcdef';
const trustedRuleId = 'd0a80123-4567-4890-a123-456789abcdef';
const trustedFactId = 'f0a80123-4567-4890-a123-456789abcdef';
const canonicalRuleContent = 'Our policy: Do not promise guaranteed results.';
const canonicalFactContent = 'Evolyn achieved 99.98% platform uptime throughout calendar year 2025.';

function createRawFinding(overrides: Partial<RawFindingInput> = {}): RawFindingInput {
  return {
    ruleId: trustedRuleId,
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
    ruleId: trustedRuleId,
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
  overrides: Partial<FindingsRepositoryDependency> = {}
): FindingsRepositoryDependency {
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
    reviewRunExists: async () => true,
    findCanonicalSource: async (source) => {
      if (source.ruleId === trustedRuleId) {
        return {
          id: trustedRuleId,
          type: 'RULE',
          content: canonicalRuleContent,
        };
      }
      if (source.factId === trustedFactId) {
        return {
          id: trustedFactId,
          type: 'FACT',
          content: canonicalFactContent,
        };
      }
      return null;
    },
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

  // Proof 1: Genuine quote from a trusted source passes
  it('verifies genuine citations from trusted stored source, maps excerpt offsets, and applies defaults', async () => {
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

  // Proof 2: Fabricated quote fails
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
        [createRawFinding({ sourceQuote: 'totally fabricated quote not in canonical content' })],
        'Post: Guaranteed results are not acceptable.'
      ),
      /not present verbatim in its trusted source/
    );
    assert.equal(persistCalled, false);
  });

  // Proof 3: Fabricated sourceText cannot bypass verification
  it('rejects fabricated sourceText that attempts to bypass canonical verification', async () => {
    let persistCalled = false;
    const service = new FindingsService(
      createRepository({
        recordMany: async () => {
          persistCalled = true;
          return [];
        },
      })
    );

    // AI supplies both a fake quote AND fake matching sourceText in the input
    await assert.rejects(
      service.recordFindings(
        reviewRunId,
        [
          createRawFinding({
            sourceQuote: 'Fake guarantee rule invented by AI',
            sourceText: 'Our policy: Fake guarantee rule invented by AI is strictly enforced.',
          }),
        ],
        'Post: Guaranteed results are not acceptable.'
      ),
      /not present verbatim in its trusted source/
    );
    assert.equal(persistCalled, false);
  });

  // Proof 4: Unknown source ID fails
  it('rejects unknown or inaccessible source IDs', async () => {
    const service = new FindingsService(createRepository());

    await assert.rejects(
      service.recordFindings(
        reviewRunId,
        [
          createRawFinding({
            ruleId: 'a1111111-2222-3333-4444-555555555555',
          }),
        ],
        'Post: Guaranteed results are not acceptable.'
      ),
      /Unknown or inaccessible source: a1111111-2222-3333-4444-555555555555/
    );
  });

  it('rejects finding with missing source ID (neither ruleId nor factId provided)', async () => {
    const service = new FindingsService(createRepository());

    await assert.rejects(
      service.recordFindings(
        reviewRunId,
        [
          createRawFinding({
            ruleId: null,
            factId: null,
          }),
        ],
        'Post: Guaranteed results are not acceptable.'
      ),
      /must specify a valid ruleId or factId/
    );
  });

  // Proof 5: Quote found only in AI-provided text fails
  it('rejects a quote found only in AI-provided text and absent in canonical stored ground truth', async () => {
    const service = new FindingsService(createRepository());

    await assert.rejects(
      service.recordFindings(
        reviewRunId,
        [
          createRawFinding({
            sourceQuote: 'Only in AI text',
            sourceText: 'This text contains Only in AI text which is not stored in DB',
          }),
        ],
        'Post: Guaranteed results are not acceptable.'
      ),
      /not present verbatim in its trusted source/
    );
  });

  it('verifies genuine citations from canonical approved facts', async () => {
    const service = new FindingsService(createRepository());

    const findings = await service.recordFindings(
      reviewRunId,
      [
        createRawFinding({
          ruleId: null,
          factId: trustedFactId,
          issueType: 'UNSUBSTANTIATED_CLAIM',
          flaggedExcerpt: '99.98% platform uptime',
          sourceQuote: '99.98% platform uptime',
          sourceText: 'Some AI text',
        }),
      ],
      'Marketing: Evolyn achieved 99.98% platform uptime during tests.'
    );

    assert.equal(findings.length, 1);
    assert.equal(findings[0].factId, trustedFactId);
    assert.equal(findings[0].ruleId, null);
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
    assert.ok(findings);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].id, createIssueRecord().id);
    await assert.rejects(service.getFindingsByReviewRunId('invalid-id'));
  });

  it('returns null when review run does not exist', async () => {
    const service = new FindingsService(
      createRepository({
        reviewRunExists: async () => false,
      })
    );

    const findings = await service.getFindingsByReviewRunId(reviewRunId);
    assert.equal(findings, null);
  });
});
