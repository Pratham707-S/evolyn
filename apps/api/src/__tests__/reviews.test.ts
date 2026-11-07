import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  REWRITE_ACTIONS,
  type ContentSubmission,
  type Guideline,
  type GuidelineRule,
} from '@evolyn/shared';
import type { ReviewRunRecord } from '../modules/reviews/reviews.repository.js';
import { ReviewService } from '../modules/reviews/reviews.service.js';
import type { ReviewDependencies } from '../modules/reviews/reviews.types.js';
import type { ReviewsRepository } from '../modules/reviews/reviews.repository.js';

const submissionId = 'c0a80123-4567-4890-a123-456789abcdef';
const reviewRunId = 'd0a80123-4567-4890-a123-456789abcdef';
const ruleId = 'e0a80123-4567-4890-a123-456789abcdef';
const guidelineId = 'f0a80123-4567-4890-a123-456789abcdef';

const submission: ContentSubmission = {
  id: submissionId,
  title: 'Launch copy',
  channel: 'SOCIAL',
  rawText: 'Our guaranteed launch is ready.',
  submittedBy: 'Ayan',
  status: 'PENDING',
  createdAt: '2026-11-05T00:00:00.000Z',
  updatedAt: '2026-11-05T00:00:00.000Z',
};

const guideline: Guideline = {
  id: guidelineId,
  title: 'Brand policy',
  category: 'GENERAL',
  version: '1.0',
  rawContent: 'Do not promise "guaranteed" results.',
  status: 'ACTIVE',
  createdAt: '2026-11-05T00:00:00.000Z',
  updatedAt: '2026-11-05T00:00:00.000Z',
};

const rule: GuidelineRule = {
  id: ruleId,
  guidelineId,
  ruleType: 'PROHIBITED',
  ruleStatement: 'Do not promise "guaranteed" results.',
  explanation: 'Avoid guarantees.',
  severity: 'CRITICAL',
  createdAt: '2026-11-05T00:00:00.000Z',
};

function createReviewRunRecord(
  overrides: Partial<ReviewRunRecord> = {}
): ReviewRunRecord {
  return {
    id: reviewRunId,
    submissionId,
    overallComplianceScore: 70,
    totalIssuesCount: 1,
    modelUsed: 'test-model',
    summary: { passedChecksCount: 0, failedChecksCount: 1 },
    createdAt: new Date('2026-11-05T00:01:00.000Z'),
    ...overrides,
  };
}

function createDependencies(
  overrides: Partial<ReviewDependencies> = {},
  statusUpdates: string[] = []
): ReviewDependencies {
  return {
    submissions: {
      getSubmissionById: async () => submission,
      updateSubmissionStatus: async (_id, status) => {
        statusUpdates.push(status);
      },
    },
    guidelines: {
      findSimilarRules: async () => [rule],
    },
    knowledge: {
      findRelevantFacts: async () => [],
    },
    findings: {
      recordFindings: async (_id, rawFindings, content) =>
        rawFindings.map((finding, index) => ({
          id: `a0a80123-4567-4890-a123-456789abcde${index}`,
          reviewRunId,
          ruleId: finding.ruleId ?? null,
          factId: finding.factId ?? null,
          issueType: finding.issueType,
          flaggedExcerpt: finding.flaggedExcerpt,
          charStart: finding.charStart ?? content.indexOf(finding.flaggedExcerpt),
          charEnd:
            finding.charEnd ??
            content.indexOf(finding.flaggedExcerpt) + finding.flaggedExcerpt.length,
          explanation: finding.explanation,
          suggestedFix: finding.suggestedFix ?? '',
          sourceQuote: finding.sourceQuote,
          confidenceScore: finding.confidenceScore ?? 1,
          evidenceStrengthScore: finding.evidenceStrengthScore ?? 0,
          status: 'OPEN',
        })),
      getFindingsByReviewRunId: async () => [],
    },
    ai: {
      generateEmbedding: async () => Array(768).fill(0.25),
      auditContent: async () => ({
        issues: [
          {
            ruleId,
            issueType: 'PROHIBITED_PHRASE',
            flaggedExcerpt: 'guaranteed',
            explanation: 'The copy promises a guarantee.',
            suggestedFix: 'Use qualified language.',
            sourceQuote: rule.ruleStatement,
            confidenceScore: 0.95,
            evidenceStrengthScore: 1,
          },
        ],
      }),
      rewriteContent: async (params) => ({
        rewrittenText: `Rewritten: ${params.content}`,
        rationale: `Applied ${params.action}.`,
      }),
    },
    ...overrides,
  };
}

function createRepository(
  overrides: Partial<
    Pick<
      ReviewsRepository,
      'create' | 'findLatestBySubmissionId' | 'listBySubmissionId' | 'deleteById'
    >
  > = {}
): Pick<
  ReviewsRepository,
  'create' | 'findLatestBySubmissionId' | 'listBySubmissionId' | 'deleteById'
> {
  return {
    create: async () => createReviewRunRecord(),
    findLatestBySubmissionId: async () => null,
    listBySubmissionId: async () => [],
    deleteById: async () => {},
    ...overrides,
  };
}

describe('ReviewService', () => {
  it('creates a review, verifies findings, and updates submission status', async () => {
    const statuses: string[] = [];
    let createdInput:
      | Parameters<ReviewsRepository['create']>[0]
      | undefined;
    let recordedCount = 0;
    const dependencies = createDependencies(
      {
        findings: {
          recordFindings: async (_id, rawFindings, content) => {
            recordedCount = rawFindings.length;
            return createDependencies().findings.recordFindings(_id, rawFindings, content);
          },
          getFindingsByReviewRunId: async () => [],
        },
      },
      statuses
    );
    const repository = createRepository({
      create: async (input) => {
        createdInput = input;
        return createReviewRunRecord({
          overallComplianceScore: input.overallComplianceScore,
          totalIssuesCount: input.totalIssuesCount,
          summary: input.summary,
        });
      },
    });
    const service = new ReviewService(dependencies, repository);

    const result = await service.executeReview(submissionId);

    assert.equal(createdInput?.submissionId, submissionId);
    assert.equal(createdInput?.totalIssuesCount, 1);
    assert.equal(createdInput?.overallComplianceScore, 70);
    assert.equal(recordedCount, 1);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].charStart, submission.rawText.indexOf('guaranteed'));
    assert.deepEqual(statuses, ['ANALYZING', 'REVIEWED']);
  });

  it('discards AI findings without a grounded citation or submitted excerpt', async () => {
    let recordedCount = -1;
    const dependencies = createDependencies({
      ai: {
        generateEmbedding: async () => Array(768).fill(0.25),
        auditContent: async () => ({
          issues: [
            {
              ruleId,
              issueType: 'PROHIBITED_PHRASE',
              flaggedExcerpt: 'not in submission',
              explanation: 'Unsupported finding.',
              suggestedFix: '',
              sourceQuote: 'fabricated source',
              confidenceScore: 0.5,
              evidenceStrengthScore: 0.5,
            },
          ],
        }),
      },
      findings: {
        recordFindings: async () => {
          recordedCount = 0;
          return [];
        },
        getFindingsByReviewRunId: async () => [],
      },
    });
    const service = new ReviewService(
      dependencies,
      createRepository({
        create: async (input) =>
          createReviewRunRecord({
            totalIssuesCount: input.totalIssuesCount,
            summary: input.summary,
            overallComplianceScore: input.overallComplianceScore,
          }),
      })
    );

    const result = await service.executeReview(submissionId);

    assert.equal(recordedCount, 0);
    assert.equal(result.issues.length, 0);
    assert.match(result.reviewRun.summary.notes ?? '', /Discarded 1 AI finding/);
  });

  it('records writing quality issues (GRAMMAR_ERROR and SPELLING_ERROR) without requiring brand ruleId and preserves brand score', async () => {
    let createdInput: Parameters<ReviewsRepository['create']>[0] | undefined;
    const dependencies = createDependencies({
      guidelines: {
        findSimilarRules: async () => [],
      },
      ai: {
        generateEmbedding: async () => Array(768).fill(0.25),
        auditContent: async () => ({
          issues: [
            {
              issueType: 'GRAMMAR_ERROR',
              flaggedExcerpt: 'launch',
              explanation: 'Grammar issue explanation',
              suggestedFix: 'launches',
              sourceQuote: 'Writing Quality Standard',
              confidenceScore: 0.95,
              evidenceStrengthScore: 0,
            },
            {
              issueType: 'SPELLING_ERROR',
              flaggedExcerpt: 'ready',
              explanation: 'Typo in ready',
              suggestedFix: 'readied',
              sourceQuote: 'Writing Quality Standard',
              confidenceScore: 0.9,
              evidenceStrengthScore: 0,
            },
          ],
        }),
      },
    });

    const service = new ReviewService(
      dependencies,
      createRepository({
        create: async (input) => {
          createdInput = input;
          return createReviewRunRecord({
            overallComplianceScore: input.overallComplianceScore,
            totalIssuesCount: input.totalIssuesCount,
            summary: input.summary,
          });
        },
      })
    );

    const result = await service.executeReview(submissionId);

    assert.equal(result.issues.length, 2);
    assert.equal(result.issues[0].issueType, 'GRAMMAR_ERROR');
    assert.equal(result.issues[1].issueType, 'SPELLING_ERROR');
    assert.equal(result.issues[0].ruleId, null);
    assert.equal(result.issues[0].factId, null);
    // Writing quality errors should not deduct brand compliance penalty (starts at 100 with 0 brand penalties)
    assert.equal(createdInput?.overallComplianceScore, 100);
    assert.equal(createdInput?.summary?.writingQualityIssuesCount, 2);
    assert.equal(createdInput?.summary?.brandIssuesCount, 0);
  });

  it('returns an existing review without running AI again', async () => {
    let auditCalled = false;
    const dependencies = createDependencies({
      ai: {
        generateEmbedding: async () => Array(768).fill(0.25),
        auditContent: async () => {
          auditCalled = true;
          return { issues: [] };
        },
      },
    });
    const existing = createReviewRunRecord({ id: '11111111-1111-4111-a111-111111111111' });
    const service = new ReviewService(
      dependencies,
      createRepository({ findLatestBySubmissionId: async () => existing })
    );

    const result = await service.executeReview(submissionId);

    assert.equal(result.reviewRun.id, existing.id);
    assert.equal(auditCalled, false);
  });

  it('triggers a new review run when revised content is supplied, preserving original submission', async () => {
    let auditCalledWithContent = '';
    const dependencies = createDependencies({
      ai: {
        generateEmbedding: async () => Array(768).fill(0.25),
        auditContent: async (params) => {
          auditCalledWithContent = params.content;
          return { issues: [] };
        },
      },
    });
    const existing = createReviewRunRecord({ id: '11111111-1111-4111-a111-111111111111' });
    const service = new ReviewService(
      dependencies,
      createRepository({ findLatestBySubmissionId: async () => existing })
    );

    const revisedCopy = 'Our fully compliant and verified launch is ready.';
    const result = await service.executeReview(submissionId, { content: revisedCopy });

    assert.equal(auditCalledWithContent, revisedCopy);
    assert.notEqual(result.reviewRun.id, existing.id);
  });

  it('retrieves chronological review history for a submission', async () => {
    const run1 = createReviewRunRecord({ id: '11111111-1111-4111-a111-111111111111' });
    const run2 = createReviewRunRecord({ id: '22222222-2222-4222-a222-222222222222' });
    const dependencies = createDependencies();
    const service = new ReviewService(
      dependencies,
      createRepository({
        listBySubmissionId: async () => [run2, run1],
      })
    );

    const history = await service.getReviewHistory(submissionId);

    assert.equal(history.length, 2);
    assert.equal(history[0]?.reviewRun.id, run2.id);
    assert.equal(history[1]?.reviewRun.id, run1.id);
  });

  it('coalesces concurrent review requests for the same submission', async () => {
    let releaseAudit!: () => void;
    const auditGate = new Promise<void>((resolve) => {
      releaseAudit = resolve;
    });
    let auditCalls = 0;
    let createCalls = 0;
    const dependencies = createDependencies({
      ai: {
        generateEmbedding: async () => Array(768).fill(0.25),
        auditContent: async () => {
          auditCalls += 1;
          await auditGate;
          return { issues: [] };
        },
      },
    });
    const repository = createRepository({
      create: async () => {
        createCalls += 1;
        return createReviewRunRecord({ totalIssuesCount: 0 });
      },
    });
    const service = new ReviewService(dependencies, repository);

    const firstRequest = service.executeReview(submissionId);
    const concurrentRequest = service.executeReview(submissionId);
    releaseAudit();
    const [firstResult, concurrentResult] = await Promise.all([
      firstRequest,
      concurrentRequest,
    ]);

    assert.equal(firstResult.reviewRun.id, concurrentResult.reviewRun.id);
    assert.equal(auditCalls, 1);
    assert.equal(createCalls, 1);
  });

  it('does not transition a finalized submission back into review', async () => {
    const statuses: string[] = [];
    const dependencies = createDependencies(
      {
        submissions: {
          getSubmissionById: async () => ({ ...submission, status: 'APPROVED' }),
          updateSubmissionStatus: async (_id, status) => {
            statuses.push(status);
          },
        },
      },
      statuses
    );
    const service = new ReviewService(dependencies, createRepository());

    await assert.rejects(
      service.executeReview(submissionId),
      /Cannot review submission in APPROVED status/
    );
    assert.deepEqual(statuses, []);
  });

  it('restores the original submission status when analysis fails', async () => {
    const statuses: string[] = [];
    const dependencies = createDependencies(
      {
        ai: {
          generateEmbedding: async () => Array(768).fill(0.25),
          auditContent: async () => {
            throw new Error('AI unavailable');
          },
        },
      },
      statuses
    );
    const service = new ReviewService(dependencies, createRepository());

    await assert.rejects(service.executeReview(submissionId), /AI unavailable/);
    assert.deepEqual(statuses, ['ANALYZING', 'PENDING']);
  });

  it('returns null when no review exists and rejects invalid IDs', async () => {
    const service = new ReviewService(createDependencies(), createRepository());

    assert.equal(await service.getReviewBySubmissionId(submissionId), null);
    await assert.rejects(service.getReviewBySubmissionId('invalid-id'));
  });

  it('rejects when submission does not exist', async () => {
    const dependencies = createDependencies({
      submissions: {
        getSubmissionById: async () => null,
        updateSubmissionStatus: async () => {},
      },
    });
    const service = new ReviewService(dependencies, createRepository());

    await assert.rejects(
      service.executeReview(submissionId),
      /Submission not found/
    );
  });

  it('proceeds safely when no guideline rules are found (missing guideline context)', async () => {
    let createdInput: Parameters<ReviewsRepository['create']>[0] | undefined;
    const dependencies = createDependencies({
      guidelines: {
        findSimilarRules: async () => [],
      },
      ai: {
        generateEmbedding: async () => Array(768).fill(0.25),
        auditContent: async () => ({ issues: [] }),
      },
    });
    const repository = createRepository({
      create: async (input) => {
        createdInput = input;
        return createReviewRunRecord({
          overallComplianceScore: input.overallComplianceScore,
          totalIssuesCount: 0,
        });
      },
    });
    const service = new ReviewService(dependencies, repository);

    const result = await service.executeReview(submissionId);
    assert.equal(createdInput?.totalIssuesCount, 0);
    assert.equal(result.issues.length, 0);
  });

  it('restores submission status and fails when knowledge retrieval fails', async () => {
    const statuses: string[] = [];
    const dependencies = createDependencies(
      {
        knowledge: {
          findRelevantFacts: async () => {
            throw new Error('Knowledge base connection timeout');
          },
        },
      },
      statuses
    );
    const service = new ReviewService(dependencies, createRepository());

    await assert.rejects(
      service.executeReview(submissionId),
      /Knowledge base connection timeout/
    );
    assert.deepEqual(statuses, ['ANALYZING', 'PENDING']);
  });

  it('rejects when embedding output has invalid dimensions', async () => {
    const statuses: string[] = [];
    const dependencies = createDependencies(
      {
        ai: {
          generateEmbedding: async () => Array(512).fill(0.25),
          auditContent: async () => ({ issues: [] }),
        },
      },
      statuses
    );
    const service = new ReviewService(dependencies, createRepository());

    await assert.rejects(
      service.executeReview(submissionId),
      /Review embedding must contain 768 finite values/
    );
    assert.deepEqual(statuses, ['ANALYZING', 'PENDING']);
  });

  it('rejects when embedding output contains NaN', async () => {
    const nanVector = Array(768).fill(0.25);
    nanVector[5] = Number.NaN;
    const statuses: string[] = [];
    const dependencies = createDependencies(
      {
        ai: {
          generateEmbedding: async () => nanVector,
          auditContent: async () => ({ issues: [] }),
        },
      },
      statuses
    );
    const service = new ReviewService(dependencies, createRepository());

    await assert.rejects(
      service.executeReview(submissionId),
      /Review embedding must contain 768 finite values/
    );
    assert.deepEqual(statuses, ['ANALYZING', 'PENDING']);
  });

  it('deletes review run and restores submission status when finding persistence fails', async () => {
    const statuses: string[] = [];
    let deletedReviewRunId: string | undefined;

    const dependencies = createDependencies(
      {
        findings: {
          recordFindings: async () => {
            throw new Error('Findings database insert failed');
          },
          getFindingsByReviewRunId: async () => [],
        },
      },
      statuses
    );
    const repository = createRepository({
      create: async () => createReviewRunRecord(),
      deleteById: async (id) => {
        deletedReviewRunId = id;
      },
    });
    const service = new ReviewService(dependencies, repository);

    await assert.rejects(
      service.executeReview(submissionId),
      /Findings database insert failed/
    );
    assert.equal(deletedReviewRunId, reviewRunId);
    assert.deepEqual(statuses, ['ANALYZING', 'PENDING']);
  });

  it('restores submission status when review persistence fails', async () => {
    const statuses: string[] = [];
    const dependencies = createDependencies({}, statuses);
    const repository = createRepository({
      create: async () => {
        throw new Error('Review run persistence failed');
      },
    });
    const service = new ReviewService(dependencies, repository);

    await assert.rejects(
      service.executeReview(submissionId),
      /Review run persistence failed/
    );
    assert.deepEqual(statuses, ['ANALYZING', 'PENDING']);
  });

  describe('ReviewService.rewrite', () => {
    it('supports all eight rewrite actions and returns correct response', async () => {
      const service = new ReviewService(createDependencies(), createRepository());

      for (const action of REWRITE_ACTIONS) {
        const result = await service.rewrite(submissionId, {
          action,
          content: 'This is the draft content to test rewriting.',
        });

        assert.equal(result.action, action);
        assert.equal(result.originalText, 'This is the draft content to test rewriting.');
        assert.ok(result.rewrittenText.length > 0);
        assert.ok(result.rationale.length > 0);
      }
    });

    it('retrieves semantic guidelines and approved facts to pass as context', async () => {
      const testFact = {
        id: 'f1a80123-4567-4890-a123-456789abcdef',
        topic: 'Compliance',
        claimStatement: 'SOC2 Type II certified annually.',
        approvedProofSource: 'Audit report 2025',
        similarity: 0.95,
        createdAt: '2026-11-05T00:00:00.000Z',
      };

      let passedRules: any[] = [];
      let passedFacts: any[] = [];
      let embeddingRequestedFor = '';

      const dependencies = createDependencies({
        ai: {
          generateEmbedding: async (text) => {
            embeddingRequestedFor = text;
            return Array(768).fill(0.1);
          },
          auditContent: async () => ({ issues: [] }),
          rewriteContent: async (params) => {
            passedRules = params.rules || [];
            passedFacts = params.facts || [];
            return {
              rewrittenText: 'Polished copy',
              rationale: 'Applied brand context',
            };
          },
        },
        guidelines: {
          findRelevantRules: async () => [rule],
        },
        knowledge: {
          findRelevantFacts: async () => [testFact],
        },
      });

      const service = new ReviewService(dependencies, createRepository());
      const result = await service.rewrite(submissionId, {
        action: 'IMPROVE_WRITING',
        content: 'Draft content to improve.',
      });

      assert.equal(embeddingRequestedFor, 'Draft content to improve.');
      assert.equal(passedRules.length, 1);
      assert.equal(passedRules[0].id, rule.id);
      assert.equal(passedFacts.length, 1);
      assert.equal(passedFacts[0].id, testFact.id);
      assert.equal(result.rewrittenText, 'Polished copy');
    });

    it('passes user instructions through to the AI provider', async () => {
      let passedInstructions = '';
      const dependencies = createDependencies({
        ai: {
          generateEmbedding: async () => Array(768).fill(0.1),
          auditContent: async () => ({ issues: [] }),
          rewriteContent: async (params) => {
            passedInstructions = params.instructions || '';
            return {
              rewrittenText: 'Casual copy',
              rationale: 'Made conversational per instruction',
            };
          },
        },
      });

      const service = new ReviewService(dependencies, createRepository());
      const result = await service.rewrite(submissionId, {
        action: 'CHANGE_TONE',
        content: 'Formal content statement.',
        instructions: 'Adopt a friendly, conversational voice.',
      });

      assert.equal(passedInstructions, 'Adopt a friendly, conversational voice.');
      assert.equal(result.rewrittenText, 'Casual copy');
    });

    it('supports MAKE_LONGER with 5,381, 20,000, and 50,000-character inputs without premature truncation', async () => {
      for (const charCount of [5381, 20000, 50000]) {
        let passedContentToAI = '';
        let passedEmbeddingContent = '';
        const inputContent = 'A'.repeat(charCount);

        const dependencies = createDependencies({
          ai: {
            generateEmbedding: async (text) => {
              passedEmbeddingContent = text;
              return Array(768).fill(0.1);
            },
            auditContent: async () => ({ issues: [] }),
            rewriteContent: async (params) => {
              passedContentToAI = params.content;
              return {
                rewrittenText: 'B'.repeat(charCount + 500),
                rationale: `Expanded content by 500 characters from ${charCount} chars.`,
              };
            },
          },
          guidelines: {
            findRelevantRules: async () => [rule],
          },
        });

        const service = new ReviewService(dependencies, createRepository());
        const result = await service.rewrite(submissionId, {
          action: 'MAKE_LONGER',
          content: inputContent,
        });

        assert.equal(
          passedContentToAI.length,
          charCount,
          `AI provider should receive all ${charCount} characters`
        );
        assert.equal(
          result.originalText.length,
          charCount,
          `Original text should preserve all ${charCount} characters`
        );
        assert.equal(result.rewrittenText.length, charCount + 500);
        // Embedding should be bounded to 8000 to prevent embedding API limit errors
        assert.ok(
          passedEmbeddingContent.length <= 8000,
          `Embedding input should be bounded to max 8000 chars, got ${passedEmbeddingContent.length}`
        );
      }
    });

    it('rejects MAKE_LONGER inputs exceeding 50,000 characters with schema validation error', async () => {
      const inputContent = 'C'.repeat(50001);

      const service = new ReviewService(createDependencies(), createRepository());
      await assert.rejects(
        service.rewrite(submissionId, {
          action: 'MAKE_LONGER',
          content: inputContent,
        }),
        /Content must not exceed 50000 characters/
      );
    });

    it('rejects when submission does not exist', async () => {
      const dependencies = createDependencies({
        submissions: {
          getSubmissionById: async () => null,
          updateSubmissionStatus: async () => {},
        },
      });
      const service = new ReviewService(dependencies, createRepository());

      await assert.rejects(
        service.rewrite(submissionId, {
          action: 'SIMPLIFY',
          content: 'Content',
        }),
        /Submission not found/
      );
    });

    it('guarantees submission immutability: never alters submission rawText, status, or review runs', async () => {
      const statuses: string[] = [];
      let repositoryCreateCalled = false;

      const dependencies = createDependencies(
        {
          submissions: {
            getSubmissionById: async () => ({ ...submission }),
            updateSubmissionStatus: async (_id, status) => {
              statuses.push(status);
            },
          },
        },
        statuses
      );

      const repository = createRepository({
        create: async () => {
          repositoryCreateCalled = true;
          return createReviewRunRecord();
        },
      });

      const service = new ReviewService(dependencies, repository);
      const originalSubmissionCopy = { ...submission };

      const result = await service.rewrite(submissionId, {
        action: 'HUMANIZE',
        content: 'Original raw text from reviewer.',
      });

      // Status was never modified
      assert.equal(statuses.length, 0);
      // No review run was created
      assert.equal(repositoryCreateCalled, false);
      // Original submission fields are identical
      assert.equal(submission.rawText, originalSubmissionCopy.rawText);
      assert.equal(submission.status, originalSubmissionCopy.status);
      // Returned proposed rewrite only
      assert.equal(result.originalText, 'Original raw text from reviewer.');
    });

    it('fails when AI provider returns empty rewritten output', async () => {
      const dependencies = createDependencies({
        ai: {
          generateEmbedding: async () => Array(768).fill(0.1),
          auditContent: async () => ({ issues: [] }),
          rewriteContent: async () => ({
            rewrittenText: '   ',
            rationale: 'Empty',
          }),
        },
      });

      const service = new ReviewService(dependencies, createRepository());
      await assert.rejects(
        service.rewrite(submissionId, {
          action: 'MAKE_SHORTER',
          content: 'Valid content',
        }),
        /Gemini returned empty rewritten text/
      );
    });

    it('proceeds safely with empty rules/facts if semantic retrieval throws', async () => {
      let passedRulesCount = -1;
      const dependencies = createDependencies({
        ai: {
          generateEmbedding: async () => {
            throw new Error('Vector service unavailable');
          },
          auditContent: async () => ({ issues: [] }),
          rewriteContent: async (params) => {
            passedRulesCount = params.rules?.length ?? 0;
            return {
              rewrittenText: 'Fallback rewritten text',
              rationale: 'Rewritten without semantic context',
            };
          },
        },
      });

      const service = new ReviewService(dependencies, createRepository());
      const result = await service.rewrite(submissionId, {
        action: 'SIMPLIFY',
        content: 'Valid content for fallback test',
      });

      assert.equal(passedRulesCount, 0);
      assert.equal(result.rewrittenText, 'Fallback rewritten text');
    });
  });
});
