import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ReviewService,
  chunkDocument,
  deduplicateChunkFindings,
  type ReviewDependencies,
} from '../modules/reviews/reviews.service.js';
import { GeminiAIProvider } from '../infrastructure/ai/gemini.provider.js';
import type { GuidelineRule } from '../modules/guidelines/guidelines.types.js';
import type { RawFindingInput } from '../modules/findings/findings.types.js';

describe('Governance Audit Performance & Reliability Test Suite', () => {
  const submissionId = 'a1234567-89ab-4cde-0123-456789abcdef';
  const mockSubmission = {
    id: submissionId,
    title: 'Enterprise Launch Announcement',
    rawText: 'Short submission text for testing Evolyn brand compliance.',
    channel: 'BLOG',
    status: 'PENDING',
    submittedBy: 'marketing@evolyn.ai',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewRun: null,
    decision: null,
  };

  const mockRule: GuidelineRule = {
    id: 'b1234567-89ab-4cde-0123-456789abcdef',
    guidelineId: 'c1234567-89ab-4cde-0123-456789abcdef',
    ruleType: 'PROHIBITED',
    ruleStatement: "Never use the phrase '100% risk-free' in any customer marketing copy.",
    explanation: 'Regulatory standard against absolute guarantees.',
    severity: 'CRITICAL',
    createdAt: new Date().toISOString(),
  };

  const mockFact = {
    id: 'd1234567-89ab-4cde-0123-456789abcdef',
    topic: 'Platform Uptime',
    claimStatement: 'Evolyn achieved 99.98% platform uptime across all production clusters.',
    approvedProofSource: 'SOC 2 Type II Independent Audit Report 2025, Section 4.2',
    validUntil: '2027-12-31T00:00:00.000Z',
    createdAt: new Date().toISOString(),
  };

  // Scenario 1: Normal short document audit
  it('Scenario 1: executes normal short document audit cleanly and quickly', async () => {
    let auditExecuted = false;
    const dependencies: ReviewDependencies = {
      submissions: {
        getSubmissionById: async () => mockSubmission,
        updateSubmissionStatus: async () => {},
      },
      guidelines: {
        findRelevantRules: async () => [mockRule],
      },
      knowledge: {
        findRelevantFacts: async () => [mockFact],
      },
      ai: {
        generateEmbedding: async () => Array(768).fill(0.1),
        auditContent: async () => {
          auditExecuted = true;
          return {
            issues: [
              {
                ruleId: mockRule.id,
                issueType: 'PROHIBITED_PHRASE',
                flaggedExcerpt: 'Evolyn',
                explanation: 'Brand name verification check',
                suggestedFix: 'Evolyn',
                sourceQuote: mockRule.ruleStatement,
                confidenceScore: 1.0,
                evidenceStrengthScore: 1.0,
              },
            ],
          };
        },
      },
      findings: {
        recordFindings: async (_runId, items) =>
          items.map((it, idx) => ({ id: `find-${idx}`, ...it } as any)),
        getFindingsByReviewRunId: async () => [],
      },
    };

    const mockRepo: any = {
      create: async (data: any) => ({
        id: 'run-001',
        ...data,
        createdAt: new Date(),
      }),
      findLatestBySubmissionId: async () => null,
    };

    const service = new ReviewService(dependencies, mockRepo);
    const start = Date.now();
    const result = await service.executeReview(submissionId, { force: true });
    const duration = Date.now() - start;

    assert.equal(auditExecuted, true);
    assert.ok(result);
    assert.equal(result.issues.length, 1);
    assert.ok(duration < 2000, `Expected audit < 2000ms, took ${duration}ms`);
  });

  // Scenario 2: Long document audit with chunking
  it('Scenario 2: processes long document via chunking without silent truncation', async () => {
    const longText = 'Paragraph 1: Welcome to the Evolyn platform.\n\n'.repeat(50);
    const chunks = chunkDocument(longText, 1000, 100);

    assert.ok(chunks.length > 1, 'Long document should be split into multiple chunks');
    let totalCovered = 0;
    for (const c of chunks) {
      assert.ok(c.text.length <= 1100, 'Chunk size must remain bounded');
      assert.equal(longText.slice(c.charStart, c.charEnd), c.text);
      totalCovered += c.text.length;
    }
    // Entire document length must be preserved across chunks
    assert.equal(chunks[0].charStart, 0);
    assert.equal(chunks[chunks.length - 1].charEnd, longText.length);
  });

  // Scenario 3: Multiple simultaneous audit requests (single-flight coalescing)
  it('Scenario 3: coalesces simultaneous audits for identical submission without duplicate AI calls', async () => {
    let aiCallCount = 0;
    const dependencies: ReviewDependencies = {
      submissions: {
        getSubmissionById: async () => mockSubmission,
        updateSubmissionStatus: async () => {},
      },
      guidelines: { findRelevantRules: async () => [mockRule] },
      knowledge: { findRelevantFacts: async () => [mockFact] },
      ai: {
        generateEmbedding: async () => Array(768).fill(0.1),
        auditContent: async () => {
          aiCallCount++;
          await new Promise((resolve) => setTimeout(resolve, 50));
          return { issues: [] };
        },
      },
      findings: {
        recordFindings: async () => [],
        getFindingsByReviewRunId: async () => [],
      },
    };

    const mockRepo: any = {
      create: async (data: any) => ({
        id: 'run-coalesce',
        ...data,
        createdAt: new Date(),
      }),
      findLatestBySubmissionId: async () => null,
    };

    const service = new ReviewService(dependencies, mockRepo);
    const [res1, res2, res3] = await Promise.all([
      service.executeReview(submissionId, { force: true }, 'req-1'),
      service.executeReview(submissionId, { force: true }, 'req-2'),
      service.executeReview(submissionId, { force: true }, 'req-3'),
    ]);

    assert.equal(aiCallCount, 1, 'AI audit should execute exactly once for concurrent requests');
    assert.equal(res1.reviewRun.id, res2.reviewRun.id);
    assert.equal(res2.reviewRun.id, res3.reviewRun.id);
  });

  // Scenario 4: Duplicate retry prevention
  it('Scenario 4: prevents duplicate execution when retry is triggered on in-flight audit', async () => {
    let callCount = 0;
    const dependencies: ReviewDependencies = {
      submissions: {
        getSubmissionById: async () => mockSubmission,
        updateSubmissionStatus: async () => {},
      },
      guidelines: { findRelevantRules: async () => [mockRule] },
      knowledge: { findRelevantFacts: async () => [mockFact] },
      ai: {
        generateEmbedding: async () => Array(768).fill(0.1),
        auditContent: async () => {
          callCount++;
          await new Promise((resolve) => setTimeout(resolve, 60));
          return { issues: [] };
        },
      },
      findings: {
        recordFindings: async () => [],
        getFindingsByReviewRunId: async () => [],
      },
    };

    const mockRepo: any = {
      create: async (data: any) => ({
        id: 'run-retry-prevent',
        ...data,
        createdAt: new Date(),
      }),
      findLatestBySubmissionId: async () => null,
    };

    const service = new ReviewService(dependencies, mockRepo);
    const initialPromise = service.executeReview(submissionId, { force: true });
    // User clicks retry immediately while first is in-flight
    const retryPromise = service.executeReview(submissionId, { force: true });

    const [r1, r2] = await Promise.all([initialPromise, retryPromise]);
    assert.equal(callCount, 1, 'Only one audit run executed despite retry click');
    assert.equal(r1.reviewRun.id, r2.reviewRun.id);
  });

  // Scenario 5: Gemini timeout handling
  it('Scenario 5: aborts timed out Gemini calls cleanly without unbounded hanging', async () => {
    const slowProvider = new GeminiAIProvider(
      'mock-api-key',
      'gemini-flash-lite-latest',
      'gemini-embedding-001',
      async (_input, init) => {
        return new Promise((_, reject) => {
          const signal = (init as any)?.signal;
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new Error('The operation was aborted due to timeout'));
            });
          }
        });
      }
    );

    await assert.rejects(
      async () => {
        await (slowProvider as any).request('gemini-flash-lite-latest:generateContent', {}, { timeoutMs: 50 });
      },
      /Gemini request failed after all attempts|aborted/
    );
  });

  // Scenario 6: Gemini rate-limit / transient 503 failover to fallback model
  it('Scenario 6: immediately fails over to verified fallback model on transient 503 without stalling', async () => {
    const modelsAttempted: string[] = [];
    const provider = new GeminiAIProvider(
      'mock-api-key',
      'gemini-3.8-flash',
      'gemini-embedding-001',
      async (input) => {
        const url = String(input);
        const match = url.match(/\/models\/([^:]+):generateContent/);
        const model = match ? match[1] : '';
        modelsAttempted.push(model);

        if (model === 'gemini-3.8-flash') {
          return new Response(JSON.stringify({ error: { code: 503, message: 'Model overloaded' } }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Fallback response',
                        rationale: 'Clean failover',
                      }),
                    },
                  ],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    );

    const result = await provider.rewriteContent({
      action: 'IMPROVE_WRITING',
      content: 'Needs rewrite',
    });

    assert.equal(result.rewrittenText, 'Fallback response');
    assert.deepEqual(modelsAttempted, ['gemini-3.8-flash', 'gemini-flash-lite-latest']);
  });

  // Scenario 7: Invalid AI response handling
  it('Scenario 7: handles malformed AI response gracefully without crashing API', async () => {
    const provider = new GeminiAIProvider(
      'mock-api-key',
      'gemini-flash-lite-latest',
      'gemini-embedding-001',
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              {
                content: {
                  parts: [{ text: 'This is plain text, not valid JSON output' }],
                },
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    );

    await assert.rejects(
      async () => {
        await provider.auditContent({
          content: 'Test content',
          rules: [],
          facts: [],
        });
      },
      /(issues|Required|Gemini returned invalid JSON)/
    );
  });

  // Scenario 8: Database persistence failure and rollback cleanup
  it('Scenario 8: deletes partial review run and restores submission status if persistence fails', async () => {
    let deleteCalledWith = '';
    let restoredStatus = '';
    const dependencies: ReviewDependencies = {
      submissions: {
        getSubmissionById: async () => mockSubmission,
        updateSubmissionStatus: async (_id, status) => {
          restoredStatus = status;
        },
      },
      guidelines: { findRelevantRules: async () => [mockRule] },
      knowledge: { findRelevantFacts: async () => [mockFact] },
      ai: {
        generateEmbedding: async () => Array(768).fill(0.1),
        auditContent: async () => ({
          issues: [
            {
              ruleId: mockRule.id,
              issueType: 'PROHIBITED_PHRASE',
              flaggedExcerpt: 'Evolyn',
              explanation: 'Violation',
              suggestedFix: '',
              sourceQuote: mockRule.ruleStatement,
              confidenceScore: 1,
              evidenceStrengthScore: 1,
            },
          ],
        }),
      },
      findings: {
        recordFindings: async () => {
          throw new Error('Database write constraint violation');
        },
        getFindingsByReviewRunId: async () => [],
      },
    };

    const mockRepo: any = {
      create: async (data: any) => ({
        id: 'run-fail-persistence',
        ...data,
        createdAt: new Date(),
      }),
      deleteById: async (id: string) => {
        deleteCalledWith = id;
      },
      findLatestBySubmissionId: async () => null,
    };

    const service = new ReviewService(dependencies, mockRepo);
    await assert.rejects(
      async () => service.executeReview(submissionId, { force: true }),
      /Database write constraint violation/
    );

    assert.equal(deleteCalledWith, 'run-fail-persistence');
    assert.equal(restoredStatus, 'PENDING');
  });

  // Scenario 9: Chunk character offsets match original text exactly
  it('Scenario 9: maps chunk offsets to 100% exact offsets in original submitted document', async () => {
    const fullDocument =
      'Header Section\n\n' +
      'Body paragraph one discussing standard operations.\n\n' +
      'Body paragraph two containing our revolutionary feature with 100% risk-free guarantee.\n\n' +
      'Footer disclaimer information.';

    const chunks = chunkDocument(fullDocument, 60, 15);
    for (const chunk of chunks) {
      assert.equal(
        fullDocument.slice(chunk.charStart, chunk.charEnd),
        chunk.text,
        `Chunk ${chunk.index} offsets must exactly match full document slice`
      );
    }
  });

  // Scenario 10: Deduplication across chunk overlaps
  it('Scenario 10: eliminates duplicate findings caused by chunk overlap regions', () => {
    const sampleFindings: RawFindingInput[] = [
      {
        ruleId: mockRule.id,
        issueType: 'PROHIBITED_PHRASE',
        flaggedExcerpt: '100% risk-free',
        charStart: 120,
        charEnd: 134,
        explanation: 'Prohibited phrase',
        suggestedFix: 'reliable',
        sourceQuote: mockRule.ruleStatement,
        confidenceScore: 0.95,
        evidenceStrengthScore: 0.9,
      },
      // Duplicate finding from adjacent overlapping chunk
      {
        ruleId: mockRule.id,
        issueType: 'PROHIBITED_PHRASE',
        flaggedExcerpt: '100% risk-free',
        charStart: 122, // near offset within 10 chars
        charEnd: 136,
        explanation: 'Prohibited phrase',
        suggestedFix: 'reliable',
        sourceQuote: mockRule.ruleStatement,
        confidenceScore: 0.95,
        evidenceStrengthScore: 0.9,
      },
      // Unique distinct finding
      {
        ruleId: mockRule.id,
        issueType: 'PROHIBITED_PHRASE',
        flaggedExcerpt: 'revolutionary',
        charStart: 250,
        charEnd: 263,
        explanation: 'Buzzword',
        suggestedFix: 'advanced',
        sourceQuote: mockRule.ruleStatement,
        confidenceScore: 0.9,
        evidenceStrengthScore: 0.8,
      },
    ];

    const deduplicated = deduplicateChunkFindings(sampleFindings);
    assert.equal(deduplicated.length, 2, 'Expected duplicate overlapping finding to be eliminated');
    assert.equal(deduplicated[0].flaggedExcerpt, '100% risk-free');
    assert.equal(deduplicated[1].flaggedExcerpt, 'revolutionary');
  });
});
