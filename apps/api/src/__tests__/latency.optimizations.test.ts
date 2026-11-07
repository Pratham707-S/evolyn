import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EmbeddingCache } from '../infrastructure/ai/embedding-cache.js';
import { GeminiAIProvider, parseRetryAfterHeader } from '../infrastructure/ai/gemini.provider.js';
import { ReviewService, BrandGovernanceRetrievalError } from '../modules/reviews/reviews.service.js';
import { ReviewsController, sanitizeRequestId } from '../modules/reviews/reviews.controller.js';
import { errorHandler } from '../middleware/errorHandler.js';
import type { ReviewDependencies } from '../modules/reviews/reviews.types.js';
import type { GuidelineRule, ApprovedFact, ContentSubmission } from '@evolyn/shared';

function createMockResponse(payload: unknown, ok = true, status = 200, headers: Record<string, string> = {}): Response {
  return {
    ok,
    status,
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
    json: async () => payload,
    text: async () => (typeof payload === 'string' ? payload : JSON.stringify(payload)),
  } as unknown as Response;
}

describe('Targeted AI Latency & Pipeline Optimizations', () => {
  describe('EmbeddingCache', () => {
    it('caches valid vectors and returns clones to prevent mutation', () => {
      const cache = new EmbeddingCache({ maxEntries: 10, ttlMs: 10000 });
      const testVector = [0.1, 0.2, 0.3];
      cache.set('gemini-embedding-001', 3, 'hello world', testVector);

      const cached = cache.get('gemini-embedding-001', 3, 'hello world');
      assert.ok(cached);
      assert.deepEqual(cached, testVector);

      // Verify clone mutation safety
      cached[0] = 999;
      const secondRead = cache.get('gemini-embedding-001', 3, 'hello world');
      assert.equal(secondRead?.[0], 0.1);
    });

    it('rejects vectors with invalid dimensions or non-finite numbers', () => {
      const cache = new EmbeddingCache({ maxEntries: 10, ttlMs: 10000 });
      cache.set('gemini-embedding-001', 3, 'bad dims', [0.1, 0.2]);
      assert.equal(cache.get('gemini-embedding-001', 3, 'bad dims'), undefined);

      cache.set('gemini-embedding-001', 3, 'has nan', [0.1, NaN, 0.3]);
      assert.equal(cache.get('gemini-embedding-001', 3, 'has nan'), undefined);

      cache.set('gemini-embedding-001', 3, 'has inf', [0.1, Infinity, 0.3]);
      assert.equal(cache.get('gemini-embedding-001', 3, 'has inf'), undefined);
    });

    it('validates constructor options and rejects NaN, negative, zero, or non-finite values', () => {
      assert.throws(() => new EmbeddingCache({ maxEntries: NaN }), /Invalid maxEntries/);
      assert.throws(() => new EmbeddingCache({ maxEntries: -10 }), /Invalid maxEntries/);
      assert.throws(() => new EmbeddingCache({ maxEntries: 0 }), /Invalid maxEntries/);
      assert.throws(() => new EmbeddingCache({ maxEntries: 2.5 }), /Invalid maxEntries/);
      assert.throws(() => new EmbeddingCache({ ttlMs: NaN }), /Invalid ttlMs/);
      assert.throws(() => new EmbeddingCache({ ttlMs: -100 }), /Invalid ttlMs/);
      assert.throws(() => new EmbeddingCache({ ttlMs: 0 }), /Invalid ttlMs/);
      assert.throws(() => new EmbeddingCache({ ttlMs: Infinity }), /Invalid ttlMs/);
    });

    it('strictly guarantees cache size never exceeds configured maxEntries bound', () => {
      const boundCache = new EmbeddingCache({ maxEntries: 3, ttlMs: 60000 });
      for (let i = 0; i < 20; i++) {
        boundCache.set('gemini-embedding-001', 1, `text-${i}`, [i]);
        assert.ok(boundCache.size() <= 3, `Cache size ${boundCache.size()} exceeded bound 3`);
      }
      assert.equal(boundCache.size(), 3);
    });

    it('expires entries after ttlMs', async () => {
      const shortCache = new EmbeddingCache({ maxEntries: 10, ttlMs: 50 });
      shortCache.set('gemini-embedding-001', 2, 'expire me', [0.5, 0.5]);
      assert.ok(shortCache.get('gemini-embedding-001', 2, 'expire me'));

      await new Promise((r) => setTimeout(r, 60));
      assert.equal(shortCache.get('gemini-embedding-001', 2, 'expire me'), undefined);
    });

    it('evicts least recently accessed entries when at maxEntries capacity', () => {
      const smallCache = new EmbeddingCache({ maxEntries: 2, ttlMs: 100000 });
      smallCache.set('gemini-embedding-001', 1, 'item1', [1]);
      smallCache.set('gemini-embedding-001', 1, 'item2', [2]);

      // Access item1 so item2 becomes oldest
      smallCache.get('gemini-embedding-001', 1, 'item1');

      // Add item3; item2 should be evicted
      smallCache.set('gemini-embedding-001', 1, 'item3', [3]);

      assert.ok(smallCache.get('gemini-embedding-001', 1, 'item1'));
      assert.ok(smallCache.get('gemini-embedding-001', 1, 'item3'));
      assert.equal(smallCache.get('gemini-embedding-001', 1, 'item2'), undefined);
    });
  });

  describe('GeminiAIProvider Resilient Quota & Fallback Handling', () => {
    it('switches immediately to verified fallback model when primary hits daily quota exhaustion (429)', async () => {
      const attemptedModels: string[] = [];

      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-3.8-flash',
        'gemini-embedding-001',
        async (input) => {
          const urlStr = String(input);
          const modelMatch = urlStr.match(/\/models\/([^:]+):generateContent/);
          const model = modelMatch ? modelMatch[1] : '';
          attemptedModels.push(model);

          if (model === 'gemini-3.8-flash') {
            // Emulate Google AI Studio daily free-tier quota exhaustion
            return createMockResponse(
              {
                error: {
                  code: 429,
                  message: 'Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.8-flash, description: Generate content requests per day limit exceeded on Free Tier.',
                  status: 'RESOURCE_EXHAUSTED',
                },
              },
              false,
              429
            );
          }

          // Fallback succeeds immediately
          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Polished copy from fallback.',
                        rationale: 'Cleaned text.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'IMPROVE_WRITING',
        content: 'Original copy with 100% guarantees.',
      });

      assert.equal(result.rewrittenText, 'Polished copy from fallback.');
      // Should have attempted gemini-3.8-flash ONCE (no useless retries on daily limit), then switched to fallback
      assert.equal(attemptedModels[0], 'gemini-3.8-flash');
      assert.equal(attemptedModels[1], 'gemini-flash-lite-latest');
      assert.equal(attemptedModels.length, 2);
    });

    it('switches model immediately on HTTP 404 (model not found)', async () => {
      const attemptedModels: string[] = [];
      const provider = new GeminiAIProvider(
        'mock-api-key',
        'nonexistent-model',
        'gemini-embedding-001',
        async (input) => {
          const urlStr = String(input);
          const modelMatch = urlStr.match(/\/models\/([^:]+):generateContent/);
          const model = modelMatch ? modelMatch[1] : '';
          attemptedModels.push(model);

          if (model === 'nonexistent-model') {
            return createMockResponse({ error: { message: 'models/nonexistent-model is not found' } }, false, 404);
          }

          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Fallback response.',
                        rationale: 'Fallback rationale.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'SIMPLIFY',
        content: 'Text to simplify.',
      });

      assert.equal(result.rewrittenText, 'Fallback response.');
      assert.equal(attemptedModels[0], 'nonexistent-model');
      assert.equal(attemptedModels[1], 'gemini-flash-lite-latest');
    });

    it('handles transient 503 high demand by retrying with backoff', async () => {
      let attempts = 0;
      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-001',
        async () => {
          attempts++;
          if (attempts === 1) {
            return createMockResponse({ error: { message: 'This model is experiencing high demand.' } }, false, 503);
          }
          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Recovered response.',
                        rationale: 'Recovered rationale.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'IMPROVE_WRITING',
        content: 'Transient text.',
      });

      assert.equal(result.rewrittenText, 'Recovered response.');
      assert.equal(attempts, 2);
    });

    it('respects Retry-After header during transient rate limiting', async () => {
      let attempts = 0;
      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-001',
        async () => {
          attempts++;
          if (attempts === 1) {
            return createMockResponse(
              { error: { message: 'Rate limit exceeded, please retry.' } },
              false,
              429,
              { 'retry-after': '1' }
            );
          }
          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Retry-after succeeded.',
                        rationale: 'Rationale.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'IMPROVE_WRITING',
        content: 'Transient text.',
      });

      assert.equal(result.rewrittenText, 'Retry-after succeeded.');
      assert.equal(attempts, 2);
    });

    it('parses both integer seconds and HTTP-date formats for Retry-After', () => {
      // 1. Integer seconds (0, 5, 10, 30)
      assert.equal(parseRetryAfterHeader('0'), 0);
      assert.equal(parseRetryAfterHeader('5'), 5000);
      assert.equal(parseRetryAfterHeader('10'), 10000);
      assert.equal(parseRetryAfterHeader('30'), 30000);
      assert.equal(parseRetryAfterHeader('120'), 120000);

      // 2. HTTP-date format (RFC 9110)
      const futureDate = new Date(Date.now() + 4000).toUTCString();
      const parsedDelay = parseRetryAfterHeader(futureDate);
      assert.ok(parsedDelay !== null);
      assert.ok(parsedDelay >= 3000 && parsedDelay <= 5000);

      // Past / expired date returns 0ms delay
      const pastDate = new Date(Date.now() - 5000).toUTCString();
      assert.equal(parseRetryAfterHeader(pastDate), 0);

      // 3. Invalid inputs
      assert.equal(parseRetryAfterHeader(null), null);
      assert.equal(parseRetryAfterHeader(undefined), null);
      assert.equal(parseRetryAfterHeader('not-a-number-or-date'), null);
      assert.equal(parseRetryAfterHeader(''), null);
    });

    it('switches model immediately without stalling when Retry-After exceeds 10s threshold', async () => {
      const attemptedModels: string[] = [];
      const startTime = Date.now();

      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-3.8-flash',
        'gemini-embedding-001',
        async (input) => {
          const urlStr = String(input);
          const modelMatch = urlStr.match(/\/models\/([^:]+):generateContent/);
          const model = modelMatch ? modelMatch[1] : '';
          attemptedModels.push(model);

          if (model === 'gemini-3.8-flash') {
            // Emulate 429 with 30s Retry-After header
            return createMockResponse(
              { error: { message: 'High load on primary model' } },
              false,
              429,
              { 'retry-after': '30' }
            );
          }

          // Fallback model responds immediately
          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Fallback succeeded quickly.',
                        rationale: 'Switched without waiting 30 seconds.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'IMPROVE_WRITING',
        content: 'Testing long retry-after fallback.',
      });

      const elapsedMs = Date.now() - startTime;
      assert.equal(result.rewrittenText, 'Fallback succeeded quickly.');
      assert.ok(attemptedModels.includes('gemini-3.8-flash'));
      assert.ok(attemptedModels.includes('gemini-flash-lite-latest'));
      // Must not wait 30 seconds (should complete in well under 1000ms)
      assert.ok(elapsedMs < 1000, `Expected fast failover, took ${elapsedMs}ms`);
    });

    it('terminates deterministically with error when every candidate model is exhausted', async () => {
      const attemptedModels: string[] = [];

      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-3.8-flash',
        'gemini-embedding-001',
        async (input) => {
          const urlStr = String(input);
          const modelMatch = urlStr.match(/\/models\/([^:]+):generateContent/);
          const model = modelMatch ? modelMatch[1] : '';
          attemptedModels.push(model);

          // All models return daily quota exhaustion 429
          return createMockResponse(
            {
              error: {
                code: 429,
                message: `Quota exceeded for model: ${model}, limit: 20 per day exceeded on Free Tier.`,
              },
            },
            false,
            429
          );
        }
      );

      await assert.rejects(
        async () => {
          await provider.rewriteContent({
            action: 'IMPROVE_WRITING',
            content: 'Copy to rewrite.',
          });
        },
        /Gemini daily quota exhausted/
      );

      // Verifies each candidate model in modelsToTry was tried once without looping
      assert.equal(attemptedModels.length, 3);
      assert.deepEqual(attemptedModels, [
        'gemini-3.8-flash',
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
      ]);
    });

    it('deduplicates fallback candidates when primary model is already in fallback list', async () => {
      const attemptedModels: string[] = [];

      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-flash-lite-latest', // Primary model is identical to first fallback candidate
        'gemini-embedding-001',
        async (input) => {
          const urlStr = String(input);
          const modelMatch = urlStr.match(/\/models\/([^:]+):generateContent/);
          const model = modelMatch ? modelMatch[1] : '';
          attemptedModels.push(model);

          // All models return daily quota exhaustion
          return createMockResponse(
            {
              error: {
                code: 429,
                message: `Quota exceeded for model: ${model}, Free Tier limit exceeded.`,
              },
            },
            false,
            429
          );
        }
      );

      await assert.rejects(
        async () => {
          await provider.rewriteContent({
            action: 'IMPROVE_WRITING',
            content: 'Copy to rewrite.',
          });
        },
        /Gemini daily quota exhausted/
      );

      // Verifies gemini-flash-lite-latest was only tried ONCE, then gemini-3.5-flash-lite was tried
      // Total candidates must be 2, strictly deduplicated without redundant retries of the primary model
      assert.equal(attemptedModels.length, 2);
      assert.deepEqual(attemptedModels, [
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
      ]);
    });

    it('handles transient 429 without Retry-After header by retrying with exponential backoff', async () => {
      let attempts = 0;
      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-001',
        async () => {
          attempts++;
          if (attempts === 1) {
            return createMockResponse(
              { error: { message: 'Resource has been temporarily rate limited.' } },
              false,
              429
            );
          }
          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Recovered after rate limit backoff.',
                        rationale: 'Backoff worked.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'IMPROVE_WRITING',
        content: 'Transient 429 text.',
      });

      assert.equal(result.rewrittenText, 'Recovered after rate limit backoff.');
      assert.equal(attempts, 2);
    });

    it('handles transient 429 with RFC 9110 HTTP-date Retry-After header', async () => {
      let attempts = 0;
      const futureDate = new Date(Date.now() + 100).toUTCString();
      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-001',
        async () => {
          attempts++;
          if (attempts === 1) {
            return createMockResponse(
              { error: { message: 'Rate limit exceeded, retry later.' } },
              false,
              429,
              { 'retry-after': futureDate }
            );
          }
          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'HTTP-date succeeded.',
                        rationale: 'Parsed date correctly.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'IMPROVE_WRITING',
        content: 'HTTP date text.',
      });

      assert.equal(result.rewrittenText, 'HTTP-date succeeded.');
      assert.equal(attempts, 2);
    });

    it('handles transient HTTP 500 internal server error by retrying with backoff', async () => {
      let attempts = 0;
      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-flash-lite-latest',
        'gemini-embedding-001',
        async () => {
          attempts++;
          if (attempts === 1) {
            return createMockResponse({ error: { message: 'Internal error encountered.' } }, false, 500);
          }
          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: '500 recovered response.',
                        rationale: '500 recovered rationale.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'IMPROVE_WRITING',
        content: 'Server error text.',
      });

      assert.equal(result.rewrittenText, '500 recovered response.');
      assert.equal(attempts, 2);
    });

    it('handles network fetch errors and retries before falling back', async () => {
      let attempts = 0;
      const attemptedModels: string[] = [];
      const provider = new GeminiAIProvider(
        'mock-api-key',
        'gemini-3.8-flash',
        'gemini-embedding-001',
        async (input) => {
          attempts++;
          const urlStr = String(input);
          const modelMatch = urlStr.match(/\/models\/([^:]+):generateContent/);
          const model = modelMatch ? modelMatch[1] : '';
          attemptedModels.push(model);

          if (model === 'gemini-3.8-flash') {
            throw new Error('fetch failed: The operation was aborted due to timeout');
          }

          return createMockResponse({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        rewrittenText: 'Recovered on fallback after network failure.',
                        rationale: 'Network fallback.',
                      }),
                    },
                  ],
                },
              },
            ],
          });
        }
      );

      const result = await provider.rewriteContent({
        action: 'SIMPLIFY',
        content: 'Network test copy.',
      });

      assert.equal(result.rewrittenText, 'Recovered on fallback after network failure.');
      assert.ok(attemptedModels.includes('gemini-3.8-flash'));
      assert.ok(attemptedModels.includes('gemini-flash-lite-latest'));
    });
  });

  describe('Selective RAG in ReviewService.rewrite', () => {
    const mockSubmissionId = 'e2b3c4d5-1234-4567-89ab-cdef01234567';
    const mockSubmission: ContentSubmission = {
      id: mockSubmissionId,
      title: 'Performance Test Submission',
      channel: 'WEBSITE',
      rawText: 'Our platform delivers 100% automated enterprise governance.',
      submittedBy: 'Auditor',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    function setupReviewService(options: {
      onGenerateEmbedding?: () => void;
      onFindRules?: () => GuidelineRule[] | void;
      onFindFacts?: () => ApprovedFact[] | void;
    }) {
      const dependencies: ReviewDependencies = {
        submissions: {
          getSubmissionById: async () => mockSubmission,
          updateSubmissionStatus: async () => mockSubmission,
        },
        guidelines: {
          findRelevantRules: async () => {
            const custom = options.onFindRules?.();
            if (Array.isArray(custom)) return custom;
            return [{
              id: 'rule-1',
              guidelineId: 'g-1',
              ruleStatement: 'Never use 100% guarantees.',
              severity: 'CRITICAL',
              category: 'BRAND_VOICE',
              ruleType: 'RESTRICTION',
              createdAt: new Date().toISOString(),
            }];
          },
        },
        knowledge: {
          findRelevantFacts: async () => {
            const custom = options.onFindFacts?.();
            if (Array.isArray(custom)) return custom;
            return [{
              id: 'fact-1',
              topic: 'Compliance',
              claimStatement: 'Evolyn supports brand review workflows.',
              approvedProofSource: 'Whitepaper 2026',
              createdAt: new Date().toISOString(),
            }];
          },
        },
        findings: {
          recordFindings: async () => [],
          getFindingsByReviewRunId: async () => [],
        },
        ai: {
          generateEmbedding: async () => {
            options.onGenerateEmbedding?.();
            return Array(768).fill(0.05);
          },
          auditContent: async () => ({ issues: [] }),
          rewriteContent: async (params) => ({
            rewrittenText: `Rewritten: ${params.content}`,
            rationale: `Applied action: ${params.action}`,
          }),
        },
      };

      return new ReviewService(dependencies);
    }

    it('skips embedding and vector retrieval for mechanical actions (GRAMMAR_SPELLING, SIMPLIFY, MAKE_SHORTER)', async () => {
      let embeddingCalled = false;
      let rulesCalled = false;
      let factsCalled = false;

      const service = setupReviewService({
        onGenerateEmbedding: () => { embeddingCalled = true; },
        onFindRules: () => { rulesCalled = true; },
        onFindFacts: () => { factsCalled = true; },
      });

      const simpleActions = ['GRAMMAR_SPELLING', 'SIMPLIFY', 'MAKE_SHORTER'] as const;

      for (const action of simpleActions) {
        embeddingCalled = false;
        rulesCalled = false;
        factsCalled = false;

        const res = await service.rewrite(mockSubmissionId, {
          action,
          content: 'This has speling erors and wordy fluff.',
        });

        assert.ok(res.rewrittenText.includes('This has speling erors and wordy fluff.'));
        assert.equal(embeddingCalled, false, `Action ${action} should NOT invoke embedding generation`);
        assert.equal(rulesCalled, false, `Action ${action} should NOT invoke guideline vector search`);
        assert.equal(factsCalled, false, `Action ${action} should NOT invoke knowledge vector search`);
      }
    });

    it('preserves full embedding and vector retrieval for brand-sensitive actions including SUMMARIZE', async () => {
      let embeddingCount = 0;
      let rulesCount = 0;
      let factsCount = 0;

      const service = setupReviewService({
        onGenerateEmbedding: () => { embeddingCount++; },
        onFindRules: () => { rulesCount++; },
        onFindFacts: () => { factsCount++; },
      });

      const brandActions = ['IMPROVE_WRITING', 'CHANGE_TONE', 'HUMANIZE', 'MAKE_LONGER', 'SUMMARIZE'] as const;

      for (const action of brandActions) {
        const res = await service.rewrite(mockSubmissionId, {
          action,
          content: 'Copy to align with brand truth.',
        });

        assert.ok(res.rewrittenText.length > 0);
      }

      assert.equal(embeddingCount, brandActions.length, 'Brand actions must generate embeddings');
      assert.equal(rulesCount, brandActions.length, 'Brand actions must search guideline rules');
      assert.equal(factsCount, brandActions.length, 'Brand actions must search approved facts');
    });

    it('proves SUMMARIZE performs full guideline and approved-fact retrieval for brand governance', async () => {
      let embeddingCalled = false;
      let rulesRetrieved = false;
      let factsRetrieved = false;

      const service = setupReviewService({
        onGenerateEmbedding: () => { embeddingCalled = true; },
        onFindRules: () => { rulesRetrieved = true; },
        onFindFacts: () => { factsRetrieved = true; },
      });

      const res = await service.rewrite(mockSubmissionId, {
        action: 'SUMMARIZE',
        content: 'Executive summary with brand facts and required legal disclaimers.',
      });

      assert.ok(res.rewrittenText);
      assert.equal(embeddingCalled, true, 'SUMMARIZE must generate content embedding');
      assert.equal(rulesRetrieved, true, 'SUMMARIZE must query guideline rules for required disclaimers');
      assert.equal(factsRetrieved, true, 'SUMMARIZE must query approved facts for claim verification');
    });

    describe('P0 — Fail-closed brand governance', () => {
      it('fails closed when embedding generation fails for brand-sensitive action', async () => {
        const service = setupReviewService({
          onGenerateEmbedding: () => {
            throw new Error('Gemini embedding service unavailable');
          },
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'SUMMARIZE',
              content: 'Brand sensitive content.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.equal(err.code, 'BRAND_GOVERNANCE_RETRIEVAL_FAILED');
            assert.match(err.message, /Gemini embedding service unavailable/);
            return true;
          }
        );
      });

      it('fails closed when guideline vector search fails for brand-sensitive action', async () => {
        const service = setupReviewService({
          onFindRules: () => {
            throw new Error('Neon pgvector index corrupted');
          },
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'IMPROVE_WRITING',
              content: 'Brand sensitive content.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.match(err.message, /Neon pgvector index corrupted/);
            return true;
          }
        );
      });

      it('fails closed when approved facts search fails for brand-sensitive action', async () => {
        const service = setupReviewService({
          onFindFacts: () => {
            throw new Error('Knowledge base connection dropped');
          },
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'CHANGE_TONE',
              content: 'Brand sensitive content.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.match(err.message, /Knowledge base connection dropped/);
            return true;
          }
        );
      });

      it('mechanical actions safely bypass RAG and succeed even when vector services are down', async () => {
        const service = setupReviewService({
          onGenerateEmbedding: () => {
            throw new Error('Vector service completely offline');
          },
          onFindRules: () => {
            throw new Error('Guideline DB offline');
          },
          onFindFacts: () => {
            throw new Error('Knowledge DB offline');
          },
        });

        const res = await service.rewrite(mockSubmissionId, {
          action: 'SIMPLIFY',
          content: 'Complex enterprise vocabulary needing simplification.',
        });

        assert.ok(res.rewrittenText);
        assert.ok(res.rationale);
      });

      it('succeeds when guideline rules are empty but approved facts exist', async () => {
        const service = setupReviewService({
          onFindRules: () => [],
          onFindFacts: () => [
            {
              id: 'fact-1',
              topic: 'Security',
              claimStatement: 'SOC-2 Type II certified.',
              approvedProofSource: 'Audit report',
              createdAt: new Date().toISOString(),
            },
          ],
        });

        const res = await service.rewrite(mockSubmissionId, {
          action: 'IMPROVE_WRITING',
          content: 'Copy grounded by facts.',
        });

        assert.ok(res.rewrittenText);
        assert.ok(res.rationale);
      });

      it('succeeds when approved facts are empty but guideline rules exist', async () => {
        const service = setupReviewService({
          onFindRules: () => [
            {
              id: 'rule-1',
              guidelineId: 'g-1',
              ruleStatement: 'Maintain friendly enterprise tone.',
              severity: 'WARNING',
              ruleType: 'STYLE',
              createdAt: new Date().toISOString(),
            },
          ],
          onFindFacts: () => [],
        });

        const res = await service.rewrite(mockSubmissionId, {
          action: 'SUMMARIZE',
          content: 'Copy grounded by guidelines.',
        });

        assert.ok(res.rewrittenText);
        assert.ok(res.rationale);
      });

      it('fails closed when BOTH guideline rules and approved facts are empty', async () => {
        const service = setupReviewService({
          onFindRules: () => [],
          onFindFacts: () => [],
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'SUMMARIZE',
              content: 'Copy with zero brand governance context available.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.match(err.message, /Minimum governance context not met/);
            return true;
          }
        );
      });
    });

    describe('P0 — Summary output safety validation', () => {
      it('preserves mandatory disclaimers and restrictions in summary output', async () => {
        const provider = new GeminiAIProvider(
          'mock-api-key',
          'gemini-flash-lite-latest',
          'gemini-embedding-001',
          async (_input, init) => {
            const body = JSON.parse(init?.body as string);
            const prompt = body.contents[0].parts[0].text;

            // Verify prompt injects safety rules and provided rules
            assert.match(prompt, /CRITICAL SAFETY & BRAND GOVERNANCE RULES/);
            assert.match(prompt, /All marketing copy must include mandatory regulatory disclaimer/);
            assert.match(prompt, /Restricted to accredited US investors over 21/);

            return createMockResponse({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          rewrittenText:
                            'Evolyn delivers enterprise compliance intelligence. Note: Past performance does not guarantee future results. Strictly restricted to accredited US investors over 21.',
                          rationale:
                            'Summarized key capabilities while strictly preserving the mandatory regulatory disclaimer and investor age restriction.',
                        }),
                      },
                    ],
                  },
                },
              ],
            });
          }
        );

        const result = await provider.rewriteContent({
          action: 'SUMMARIZE',
          content:
            'Evolyn is an AI platform. Past performance does not guarantee future results. Strictly restricted to accredited US investors over 21.',
          rules: [
            {
              id: 'rule-disclaimer',
              statement: 'All marketing copy must include mandatory regulatory disclaimer.',
              severity: 'CRITICAL',
            },
            {
              id: 'rule-restriction',
              statement: 'Restricted to accredited US investors over 21.',
              severity: 'CRITICAL',
            },
          ],
        });

        assert.ok(result.rewrittenText.includes('Past performance does not guarantee future results'));
        assert.ok(result.rewrittenText.includes('Strictly restricted to accredited US investors over 21'));
        assert.ok(result.rationale.includes('preserving the mandatory regulatory disclaimer'));
      });

      it('does not introduce unsupported claims and softens absolute claims in summary output', async () => {
        const provider = new GeminiAIProvider(
          'mock-api-key',
          'gemini-flash-lite-latest',
          'gemini-embedding-001',
          async () => {
            return createMockResponse({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          rewrittenText:
                            'Evolyn provides automated assistance to help organizations monitor brand guidelines and adhere to compliance standards.',
                          rationale:
                            'Softened hyperbolic claim of "100% infallible compliance" to grounded adherence support without fabricating unsupported guarantees.',
                        }),
                      },
                    ],
                  },
                },
              ],
            });
          }
        );

        const result = await provider.rewriteContent({
          action: 'SUMMARIZE',
          content:
            'Evolyn guarantees 100% infallible compliance with zero risk and perfection guaranteed.',
          rules: [
            {
              id: 'rule-soften',
              statement: 'Absolute claims like 100% or guaranteed compliance are strictly prohibited.',
              severity: 'CRITICAL',
            },
          ],
        });

        assert.equal(result.rewrittenText.includes('100%'), false);
        assert.equal(result.rewrittenText.includes('infallible'), false);
        assert.equal(result.rewrittenText.includes('perfection guaranteed'), false);
        assert.ok(result.rationale.includes('Softened hyperbolic claim'));
      });

      it('preserves approved brand facts without distortion', async () => {
        const provider = new GeminiAIProvider(
          'mock-api-key',
          'gemini-flash-lite-latest',
          'gemini-embedding-001',
          async (_input, init) => {
            const body = JSON.parse(init?.body as string);
            const prompt = body.contents[0].parts[0].text;
            assert.match(prompt, /SOC-2 Type II certified/);

            return createMockResponse({
              candidates: [
                {
                  content: {
                    parts: [
                      {
                        text: JSON.stringify({
                          rewrittenText:
                            'Evolyn is a SOC-2 Type II certified platform for enterprise governance workflows.',
                          rationale:
                            'Preserved verified certification status accurately in accordance with approved knowledge facts.',
                        }),
                      },
                    ],
                  },
                },
              ],
            });
          }
        );

        const result = await provider.rewriteContent({
          action: 'SUMMARIZE',
          content: 'We operate an enterprise platform that has achieved SOC-2 Type II compliance.',
          facts: [
            {
              id: 'fact-soc2',
              claim: 'Evolyn platform is SOC-2 Type II certified.',
              source: 'Security Whitepaper 2026',
            },
          ],
        });

        assert.ok(result.rewrittenText.includes('SOC-2 Type II certified'));
        assert.equal(result.rewrittenText.includes('SOC-3'), false);
      });
    });

    describe('P0 — Application Runtime Output Safety Verification in ReviewService', () => {
      it('rejects rewrite at application runtime when AI output omits mandatory regulatory disclaimer', async () => {
        const service = setupReviewService({
          onFindRules: () => [
            {
              id: 'rule-disclaimer',
              guidelineId: 'g-1',
              ruleStatement: 'All marketing copy must include mandatory regulatory disclaimer.',
              severity: 'CRITICAL',
              category: 'LEGAL',
              ruleType: 'RESTRICTION',
              createdAt: new Date().toISOString(),
            },
          ],
        });
        (service as any).dependencies.ai.rewriteContent = async () => ({
          rewrittenText: 'Evolyn is an AI platform that improves workflow efficiency.', // Disclaimer dropped!
          rationale: 'Summarized text without disclaimer.',
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'SUMMARIZE',
              content:
                'Evolyn is an AI platform. Past performance does not guarantee future results. Restricted to accredited US investors over 21.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.match(err.message, /mandatory regulatory disclaimer was omitted/);
            return true;
          }
        );
      });

      it('rejects rewrite at application runtime when AI output omits mandatory eligibility restriction', async () => {
        const service = setupReviewService({
          onFindRules: () => [
            {
              id: 'rule-restriction',
              guidelineId: 'g-1',
              ruleStatement: 'Mandatory investor restriction required.',
              severity: 'CRITICAL',
              category: 'LEGAL',
              ruleType: 'RESTRICTION',
              createdAt: new Date().toISOString(),
            },
          ],
        });
        (service as any).dependencies.ai.rewriteContent = async () => ({
          rewrittenText:
            'Evolyn is an AI platform. Note: Past performance does not guarantee future results.', // Restriction dropped!
          rationale: 'Omitted eligibility constraint.',
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'SUMMARIZE',
              content:
                'Evolyn is an AI platform. Past performance does not guarantee future results. Restricted to accredited US investors over 21.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.match(err.message, /mandatory eligibility restriction was omitted/);
            return true;
          }
        );
      });

      it('rejects rewrite at application runtime when AI output introduces or retains prohibited hyperbolic claims', async () => {
        const service = setupReviewService({
          onFindRules: () => [
            {
              id: 'rule-anti-hyperbole',
              guidelineId: 'g-1',
              ruleStatement: 'Never use 100% guarantees or claims.',
              severity: 'CRITICAL',
              category: 'BRAND_VOICE',
              ruleType: 'PROHIBITED',
              createdAt: new Date().toISOString(),
            },
          ],
        });
        (service as any).dependencies.ai.rewriteContent = async () => ({
          rewrittenText: 'Evolyn delivers 100% infallible compliance for your entire brand team.', // Prohibited hyperbole!
          rationale: 'Retained 100% infallible claim.',
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'SUMMARIZE',
              content: 'Evolyn provides brand review capabilities.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.match(err.message, /prohibited hyperbolic claim "100% infallible"/);
            return true;
          }
        );
      });

      it('rejects rewrite at application runtime when AI output distorts approved brand fact (SOC-2 to SOC-3)', async () => {
        const service = setupReviewService({
          onFindFacts: () => [
            {
              id: 'fact-soc2',
              topic: 'Compliance',
              claimStatement: 'Evolyn platform is SOC-2 Type II certified.',
              approvedProofSource: 'Security Whitepaper 2026',
              createdAt: new Date().toISOString(),
            },
          ],
        });
        (service as any).dependencies.ai.rewriteContent = async () => ({
          rewrittenText: 'Evolyn has achieved SOC-3 certification across all data centers.', // Distorted fact!
          rationale: 'Fabricated SOC-3 from SOC-2.',
        });

        await assert.rejects(
          async () => {
            await service.rewrite(mockSubmissionId, {
              action: 'SUMMARIZE',
              content: 'Our platform is SOC-2 Type II certified.',
            });
          },
          (err) => {
            assert.ok(err instanceof BrandGovernanceRetrievalError);
            assert.match(err.message, /approved brand fact was distorted into unverified certification \(SOC-3\)/);
            return true;
          }
        );
      });

      it('succeeds and preserves grounded output when AI complies with all runtime brand guardrails', async () => {
        const service = setupReviewService({
          onFindRules: () => [
            {
              id: 'rule-disclaimer',
              guidelineId: 'g-1',
              ruleStatement: 'Mandatory disclaimer required on marketing copy.',
              severity: 'CRITICAL',
              category: 'LEGAL',
              ruleType: 'RESTRICTION',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'rule-restriction',
              guidelineId: 'g-1',
              ruleStatement: 'Mandatory investor restriction required.',
              severity: 'CRITICAL',
              category: 'LEGAL',
              ruleType: 'RESTRICTION',
              createdAt: new Date().toISOString(),
            },
          ],
          onFindFacts: () => [
            {
              id: 'fact-soc2',
              topic: 'Compliance',
              claimStatement: 'Evolyn platform is SOC-2 Type II certified.',
              approvedProofSource: 'Security Whitepaper 2026',
              createdAt: new Date().toISOString(),
            },
          ],
        });
        (service as any).dependencies.ai.rewriteContent = async () => ({
          rewrittenText:
            'Evolyn is SOC-2 Type II certified. Past performance does not guarantee future results. Strictly restricted to accredited US investors over 21.',
          rationale: 'Preserved all disclaimers, restrictions, and facts accurately.',
        });

        const result = await service.rewrite(mockSubmissionId, {
          action: 'SUMMARIZE',
          content:
            'Evolyn is SOC-2 Type II certified. Past performance does not guarantee future results. Restricted to accredited US investors over 21.',
        });

        assert.ok(result.rewrittenText.includes('SOC-2 Type II certified'));
        assert.ok(result.rewrittenText.includes('Past performance does not guarantee future results'));
        assert.ok(result.rewrittenText.includes('Strictly restricted to accredited US investors over 21'));
      });
    });

    describe('P1 — Request ID propagation consistency', () => {
      it('propagates client-supplied x-request-id across response header, controller, service, and timing logs', async () => {
        let loggedTiming: Record<string, unknown> | null = null;
        const originalLog = console.log;
        console.log = (msg: string) => {
          try {
            const parsed = JSON.parse(msg);
            if (parsed.type === 'REVIEW_PIPELINE_TIMING') {
              loggedTiming = parsed;
            }
          } catch {}
          originalLog(msg);
        };

        try {
          const clientRequestId = 'client-req-abc-123';
          const mockService: any = {
            executeReview: async (id: string, options: any, requestId?: string) => {
              assert.equal(requestId, clientRequestId);
              return {
                reviewRun: { id: 'run-1', submissionId: id, overallComplianceScore: 90, totalIssuesCount: 0, summary: {} },
                issues: [],
              };
            },
            rewrite: async (id: string, input: any, requestId?: string) => {
              assert.equal(requestId, clientRequestId);
              return {
                originalText: input.content,
                rewrittenText: 'Rewritten text.',
                action: input.action,
                rationale: 'Applied action.',
              };
            },
          };

          const controller = new ReviewsController(mockService);

          // 1. Audit route
          const mockResAudit: any = {
            headers: {} as Record<string, string>,
            setHeader: (k: string, v: string) => { mockResAudit.headers[k.toLowerCase()] = v; },
            status: () => mockResAudit,
            json: () => mockResAudit,
          };
          await controller.analyze(
            { params: { id: mockSubmissionId }, body: {}, headers: { 'x-request-id': clientRequestId } } as any,
            mockResAudit,
            () => {}
          );
          assert.equal(mockResAudit.headers['x-request-id'], clientRequestId);

          // 2. Rewrite route
          const mockResRewrite: any = {
            headers: {} as Record<string, string>,
            setHeader: (k: string, v: string) => { mockResRewrite.headers[k.toLowerCase()] = v; },
            status: () => mockResRewrite,
            json: () => mockResRewrite,
          };
          await controller.rewrite(
            {
              params: { id: mockSubmissionId },
              body: { action: 'SIMPLIFY', content: 'Testing request id' },
              headers: { 'x-request-id': clientRequestId },
            } as any,
            mockResRewrite,
            () => {}
          );
          assert.equal(mockResRewrite.headers['x-request-id'], clientRequestId);
        } finally {
          console.log = originalLog;
        }
      });

      it('generates consistent requestId when client does not supply x-request-id', async () => {
        let auditServiceRequestId: string | undefined;
        let rewriteServiceRequestId: string | undefined;

        const mockService: any = {
          executeReview: async (id: string, options: any, requestId?: string) => {
            auditServiceRequestId = requestId;
            return {
              reviewRun: { id: 'run-1', submissionId: id, overallComplianceScore: 90, totalIssuesCount: 0, summary: {} },
              issues: [],
            };
          },
          rewrite: async (id: string, input: any, requestId?: string) => {
            rewriteServiceRequestId = requestId;
            return {
              originalText: input.content,
              rewrittenText: 'Rewritten text.',
              action: input.action,
              rationale: 'Applied action.',
            };
          },
        };

        const controller = new ReviewsController(mockService);

        // 1. Audit route without header
        const mockResAudit: any = {
          headers: {} as Record<string, string>,
          setHeader: (k: string, v: string) => { mockResAudit.headers[k.toLowerCase()] = v; },
          status: () => mockResAudit,
          json: () => mockResAudit,
        };
        await controller.analyze(
          { params: { id: mockSubmissionId }, body: {}, headers: {} } as any,
          mockResAudit,
          () => {}
        );
        const generatedAuditId = mockResAudit.headers['x-request-id'];
        assert.ok(generatedAuditId);
        assert.equal(auditServiceRequestId, generatedAuditId);

        // 2. Rewrite route without header
        const mockResRewrite: any = {
          headers: {} as Record<string, string>,
          setHeader: (k: string, v: string) => { mockResRewrite.headers[k.toLowerCase()] = v; },
          status: () => mockResRewrite,
          json: () => mockResRewrite,
        };
        await controller.rewrite(
          {
            params: { id: mockSubmissionId },
            body: { action: 'SIMPLIFY', content: 'Testing request id' },
            headers: {},
          } as any,
          mockResRewrite,
          () => {}
        );
        const generatedRewriteId = mockResRewrite.headers['x-request-id'];
        assert.ok(generatedRewriteId);
        assert.equal(rewriteServiceRequestId, generatedRewriteId);
      });
    });
  });

  describe('sanitizeRequestId Validation', () => {
    it('generates a valid UUID when header is undefined, null, or empty string', () => {
      const id1 = sanitizeRequestId(undefined);
      const id2 = sanitizeRequestId(null);
      const id3 = sanitizeRequestId('');
      const id4 = sanitizeRequestId('   ');

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert.match(id1, uuidRegex);
      assert.match(id2, uuidRegex);
      assert.match(id3, uuidRegex);
      assert.match(id4, uuidRegex);
    });

    it('handles array-valued headers by taking the first candidate if valid', () => {
      const validCandidate = sanitizeRequestId(['req-valid-123', 'req-ignored']);
      assert.equal(validCandidate, 'req-valid-123');

      const invalidArray = sanitizeRequestId(['bad candidate with spaces', 'req-ignored']);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert.match(invalidArray, uuidRegex);
    });

    it('rejects CRLF injection attempts and generates a safe UUID', () => {
      const crlfId = sanitizeRequestId('req-123\r\nSet-Cookie: session=hijacked');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert.match(crlfId, uuidRegex);
      assert.equal(crlfId.includes('\r'), false);
      assert.equal(crlfId.includes('\n'), false);
    });

    it('rejects spaces, HTML tags, special symbols, and characters outside [a-zA-Z0-9_-]', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert.match(sanitizeRequestId('req id with spaces'), uuidRegex);
      assert.match(sanitizeRequestId('<script>alert(1)</script>'), uuidRegex);
      assert.match(sanitizeRequestId('req-id-with-quotes"'), uuidRegex);
      assert.match(sanitizeRequestId('req!@#$%^&*()'), uuidRegex);
    });

    it('rejects tokens exceeding 64 characters and generates a safe UUID', () => {
      const longId = 'a'.repeat(65);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const sanitized = sanitizeRequestId(longId);
      assert.match(sanitized, uuidRegex);
    });

    it('preserves valid alphanumeric tokens within 1-64 characters', () => {
      assert.equal(sanitizeRequestId('client-req-001'), 'client-req-001');
      assert.equal(sanitizeRequestId('trace_ABC-123_test'), 'trace_ABC-123_test');
      assert.equal(sanitizeRequestId('a'.repeat(64)), 'a'.repeat(64));
    });
  });

  describe('Concurrent Request ID Correlation & In-Flight Coalescing', () => {
    it('coalesces simultaneous review executions for identical submission without misattributing request IDs or execution logs', async () => {
      let resolveAudit: ((value: any) => void) | null = null;
      const delayedAuditPromise = new Promise((resolve) => {
        resolveAudit = resolve;
      });

      let executeReviewCount = 0;
      const loggedCoalesced: Array<Record<string, unknown>> = [];
      const loggedTiming: Array<Record<string, unknown>> = [];

      const originalLog = console.log;
      console.log = (msg: string) => {
        try {
          const parsed = JSON.parse(msg);
          if (parsed.type === 'REVIEW_PIPELINE_COALESCED') {
            loggedCoalesced.push(parsed);
          }
          if (parsed.type === 'REVIEW_PIPELINE_TIMING') {
            loggedTiming.push(parsed);
          }
        } catch {}
        originalLog(msg);
      };

      try {
        const mockSubmissionId = 'e2b3c4d5-1234-4567-89ab-cdef01234567';
        const mockSubmission: ContentSubmission = {
          id: mockSubmissionId,
          title: 'Concurrency Test',
          channel: 'WEBSITE',
          rawText: 'Concurrent review test copy.',
          submittedBy: 'Auditor',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const dependencies: ReviewDependencies = {
          submissions: {
            getSubmissionById: async () => mockSubmission,
            updateSubmissionStatus: async () => mockSubmission,
          },
          guidelines: {
            findRelevantRules: async () => [],
          },
          knowledge: {
            findRelevantFacts: async () => [],
          },
          findings: {
            recordFindings: async () => [],
            getFindingsByReviewRunId: async () => [],
          },
          ai: {
            generateEmbedding: async () => Array(768).fill(0.01),
            auditContent: async () => {
              executeReviewCount++;
              await delayedAuditPromise;
              return { issues: [] };
            },
            rewriteContent: async (params) => ({
              rewrittenText: params.content,
              rationale: 'Done',
            }),
          },
        };

        const mockRepo: any = {
          findLatestBySubmissionId: async () => null,
          create: async (data: any) => ({
            id: 'mock-review-run-uuid-1234',
            submissionId: data.submissionId,
            overallComplianceScore: 95,
            totalIssuesCount: 0,
            modelUsed: 'gemini-flash-lite-latest',
            summary: {
              passedChecksCount: 5,
              failedChecksCount: 0,
              criticalCount: 0,
              warningCount: 0,
              infoCount: 0,
              keyStrengths: ['Compliant content'],
              keyRisks: [],
              executiveSummary: 'Executive summary text.',
            },
            createdAt: new Date(),
          }),
          deleteById: async () => {},
        };

        const service = new ReviewService(dependencies, mockRepo);
        const controller = new ReviewsController(service, dependencies.submissions);

        // Prepare request A (primary)
        const resAHeaders: Record<string, string> = {};
        let resABody: any = null;
        const resA: any = {
          headers: resAHeaders,
          setHeader: (k: string, v: string) => { resAHeaders[k.toLowerCase()] = v; },
          status: () => resA,
          json: (body: any) => { resABody = body; return resA; },
        };
        const reqA: any = {
          params: { id: mockSubmissionId },
          body: {},
          headers: { 'x-request-id': 'req-alpha-111' },
        };

        // Prepare request B (secondary, concurrent)
        const resBHeaders: Record<string, string> = {};
        let resBBody: any = null;
        const resB: any = {
          headers: resBHeaders,
          setHeader: (k: string, v: string) => { resBHeaders[k.toLowerCase()] = v; },
          status: () => resB,
          json: (body: any) => { resBBody = body; return resB; },
        };
        const reqB: any = {
          params: { id: mockSubmissionId },
          body: {},
          headers: { 'x-request-id': 'req-beta-222' },
        };

        // Launch both requests simultaneously
        let errA: any = null;
        let errB: any = null;
        const promiseA = controller.analyze(reqA, resA, (err) => { errA = err; });
        const promiseB = controller.analyze(reqB, resB, (err) => { errB = err; });

        // Release the AI audit response
        resolveAudit!({ issues: [] });

        await Promise.all([promiseA, promiseB]);
        if (errA) throw new Error(`reqA failed with: ${errA?.message || errA}`);
        if (errB) throw new Error(`reqB failed with: ${errB?.message || errB}`);

        // 1. Verify response headers preserve distinct request IDs
        assert.equal(resAHeaders['x-request-id'], 'req-alpha-111');
        assert.equal(resBHeaders['x-request-id'], 'req-beta-222');

        // 2. Both received identical review run results
        assert.ok(resABody.reviewRunId);
        assert.equal(resABody.reviewRunId, resBBody.reviewRunId);

        // 3. Underlying AI audit only ran ONCE
        assert.equal(executeReviewCount, 1);

        // 4. Verify correlation telemetry
        assert.equal(loggedCoalesced.length, 1);
        assert.equal(loggedCoalesced[0].requestId, 'req-beta-222');
        assert.equal(loggedCoalesced[0].coalescedWithRequestId, 'req-alpha-111');
        assert.equal(loggedCoalesced[0].action, 'ATTACHED_TO_IN_FLIGHT_EXECUTION');

        assert.equal(loggedTiming.length, 1);
        assert.equal(loggedTiming[0].requestId, 'req-alpha-111');
        const correlated = loggedTiming[0].correlatedRequestIds as string[];
        assert.ok(correlated.includes('req-alpha-111'));
        assert.ok(correlated.includes('req-beta-222'));
      } finally {
        console.log = originalLog;
      }
    });
  });

  describe('Express Error Handling Middleware for Brand Governance', () => {
    it('returns HTTP 503 and sanitized JSON without leaking internal error details on BrandGovernanceRetrievalError', () => {
      const err = new BrandGovernanceRetrievalError(
        'SUMMARIZE',
        new Error('Sensitive internal neon database connection error: postgresql://admin:secret@ep-cool-db.us-east-2.aws.neon.tech/main')
      );

      let capturedStatus = 0;
      let capturedPayload: any = null;

      const mockRes: any = {
        status: (code: number) => {
          capturedStatus = code;
          return mockRes;
        },
        json: (payload: any) => {
          capturedPayload = payload;
          return mockRes;
        },
      };

      errorHandler(err, {} as any, mockRes, () => {});

      assert.equal(capturedStatus, 503);
      assert.deepEqual(capturedPayload, {
        error:
          'Brand governance verification failed: context could not be verified or output violated critical brand guardrails.',
        code: 'BRAND_GOVERNANCE_RETRIEVAL_FAILED',
      });

      // Assert no leakage of internal postgres connection strings, credentials, or internal stacks
      const stringified = JSON.stringify(capturedPayload);
      assert.equal(stringified.includes('postgresql://'), false);
      assert.equal(stringified.includes('secret'), false);
      assert.equal(stringified.includes('neon.tech'), false);
    });
  });
});

