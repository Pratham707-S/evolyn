import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GeminiAIProvider } from '../infrastructure/ai/gemini.provider.js';

const ruleId = 'c0a80123-4567-4890-a123-456789abcdef';

function createResponse(payload: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => payload,
  } as Response;
}

describe('GeminiAIProvider', () => {
  it('requests a 768-dimensional embedding and validates the response shape', async () => {
    let requestUrl = '';
    let requestBody: Record<string, unknown> | undefined;
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async (input, init) => {
        requestUrl = String(input);
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return createResponse({
          embedding: { values: Array(768).fill(0.125) },
        });
      }
    );

    const embedding = await provider.generateEmbedding('Brand copy');

    assert.equal(requestUrl, 'https://generativelanguage.googleapis.com/v1beta/models/test-embedding-model:embedContent');
    assert.equal((requestBody as { outputDimensionality: number }).outputDimensionality, 768);
    assert.equal(embedding.length, 768);
    assert.equal(embedding[0], 0.125);
  });

  it('parses structured audit output and omits nullable reference IDs', async () => {
    let requestBody: Record<string, unknown> | undefined;
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async (_input, init) => {
        requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      issues: [
                        {
                          ruleId,
                          factId: null,
                          issueType: 'PROHIBITED_PHRASE',
                          flaggedExcerpt: 'guaranteed',
                          explanation: 'Avoid guarantees.',
                          suggestedFix: 'Use qualified wording.',
                          sourceQuote: 'Do not use guaranteed.',
                          confidenceScore: 0.9,
                          evidenceStrengthScore: 1,
                        },
                      ],
                    }),
                  },
                ],
              },
            },
          ],
        });
      }
    );

    const result = await provider.auditContent({
      content: 'guaranteed results',
      rules: [{ id: ruleId, statement: 'Do not use guaranteed.', severity: 'CRITICAL' }],
      facts: [],
    });

    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].ruleId, ruleId);
    assert.equal('factId' in result.issues[0], false);
    assert.equal(
      (
        requestBody?.generationConfig as {
          responseMimeType: string;
        }
      ).responseMimeType,
      'application/json'
    );
  });

  it('surfaces provider HTTP errors and rejects missing credentials', async () => {
    const failingProvider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async () => createResponse({}, false, 429)
    );
    await assert.rejects(
      failingProvider.generateEmbedding('copy'),
      /Gemini request failed with HTTP 429/
    );

    const unconfiguredProvider = new GeminiAIProvider(
      '',
      'test-model',
      'test-embedding-model',
      async () => {
        throw new Error('Fetch must not be called without credentials');
      }
    );
    await assert.rejects(
      unconfiguredProvider.generateEmbedding('copy'),
      /GEMINI_API_KEY is missing/
    );
  });

  it('requests structured rewrite output, enforces token budget, and incorporates guidelines, facts, and instructions', async () => {
    let requestUrl = '';
    let capturedBody: any;

    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async (input, init) => {
        requestUrl = String(input);
        capturedBody = JSON.parse(String(init?.body));
        return createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      rewrittenText: 'Concise launch copy.',
                      rationale: 'Trimmed fluff and preserved key facts.',
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
      action: 'MAKE_SHORTER',
      content: 'Here is very long and unnecessary marketing copy for our brand.',
      instructions: 'Keep voice authoritative and clean.',
      rules: [{ id: ruleId, statement: 'Be concise.', severity: 'WARNING' }],
      facts: [{ id: 'fact-1', claim: 'SOC2 certified', source: 'SOC2 Report' }],
      options: { maxOutputTokens: 1024 },
    });

    assert.equal(
      requestUrl,
      'https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent'
    );
    assert.equal(capturedBody.generationConfig.maxOutputTokens, 1024);
    assert.equal(capturedBody.generationConfig.responseMimeType, 'application/json');

    const promptText = capturedBody.contents[0].parts[0].text;
    assert.ok(promptText.includes('MAKE_SHORTER'));
    assert.ok(promptText.includes('Be concise.'));
    assert.ok(promptText.includes('SOC2 certified'));
    assert.ok(promptText.includes('Keep voice authoritative and clean.'));
    assert.ok(promptText.includes('Here is very long and unnecessary marketing copy'));

    assert.deepEqual(result, {
      rewrittenText: 'Concise launch copy.',
      rationale: 'Trimmed fluff and preserved key facts.',
    });
  });

  it('rejects empty rewritten output from Gemini', async () => {
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async () =>
        createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      rewrittenText: '   ',
                      rationale: 'Emptied content.',
                    }),
                  },
                ],
              },
            },
          ],
        })
    );

    await assert.rejects(
      provider.rewriteContent({
        action: 'SIMPLIFY',
        content: 'Original copy.',
      }),
      /Gemini returned empty rewritten text/
    );
  });

  it('rejects malformed JSON from Gemini', async () => {
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async () =>
        createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Not a JSON document',
                  },
                ],
              },
            },
          ],
        })
    );

    await assert.rejects(
      provider.rewriteContent({
        action: 'HUMANIZE',
        content: 'Original copy.',
      }),
      /Gemini returned invalid JSON for the rewrite/
    );
  });

  it('retries on transient errors and succeeds when retry resolves', async () => {
    let callCount = 0;
    const provider = new GeminiAIProvider(
      'test-secret-key-123',
      'test-model',
      'test-embedding-model',
      async () => {
        callCount++;
        if (callCount === 1) {
          return createResponse({}, false, 503);
        }
        return createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      rewrittenText: 'Rewritten on retry.',
                      rationale: 'Success after retry.',
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
      content: 'Some draft copy.',
    });

    assert.equal(callCount, 2);
    assert.equal(result.rewrittenText, 'Rewritten on retry.');
  });

  it('fails safely without exposing API keys when persistent provider errors occur', async () => {
    const secretKey = 'super-secret-key-abc';
    const failingProvider = new GeminiAIProvider(
      secretKey,
      'test-model',
      'test-embedding-model',
      async () => createResponse({}, false, 500)
    );

    try {
      await failingProvider.rewriteContent({
        action: 'GRAMMAR_SPELLING',
        content: 'Copy with grammar mistake.',
      });
      assert.fail('Expected provider to throw');
    } catch (error) {
      assert.ok(error instanceof Error);
      assert.ok(error.message.includes('Gemini request failed with HTTP 500'));
      assert.ok(!error.message.includes(secretKey));
    }
  });
});
