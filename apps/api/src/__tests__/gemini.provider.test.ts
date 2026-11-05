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
});
