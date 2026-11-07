import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { env } from '../config/env.js';
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

  it('includes expansion directive and 8192 token limit for MAKE_LONGER', async () => {
    let capturedBody: any;
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async (_url, options) => {
        capturedBody = JSON.parse(options.body as string);
        return createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      rewrittenText:
                        'Detailed, comprehensive, and substantially expanded copy preserving all original facts and structure.',
                      rationale: 'Elaborated explanations and added supporting context without summarizing.',
                    }),
                  },
                ],
              },
            },
          ],
        });
      }
    );

    const originalText = 'Evolyn automates brand compliance.';
    const result = await provider.rewriteContent({
      action: 'MAKE_LONGER',
      content: originalText,
      rules: [{ id: ruleId, statement: 'Be truthful.', severity: 'WARNING' }],
    });

    const promptText = capturedBody.contents[0].parts[0].text;
    assert.ok(promptText.includes('SPECIAL EXPANSION DIRECTIVES FOR MAKE_LONGER'));
    assert.ok(promptText.includes('rewrittenText MUST be longer in length'));
    assert.ok(promptText.includes('NEVER summarize, condense, abbreviate'));
    assert.equal(capturedBody.generationConfig.maxOutputTokens, 8192);

    assert.ok(result.rewrittenText.length > originalText.length);
    assert.ok(result.rationale.includes('Elaborated'));
  });

  it('includes simplification directive for SIMPLIFY', async () => {
    let capturedBody: any;
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async (_url, options) => {
        capturedBody = JSON.parse(options.body as string);
        return createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      rewrittenText: 'Clear and simple copy.',
                      rationale: 'Simplified sentence structure.',
                    }),
                  },
                ],
              },
            },
          ],
        });
      }
    );

    await provider.rewriteContent({
      action: 'SIMPLIFY',
      content: 'Original complex jargon-filled copy.',
    });

    const promptText = capturedBody.contents[0].parts[0].text;
    assert.ok(promptText.includes('SPECIAL CLARITY DIRECTIVES FOR SIMPLIFY'));
    assert.ok(promptText.includes('Replace complex sentence structures'));
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

  it('successfully extracts JSON wrapped in Markdown code fences and ignores thinking parts', async () => {
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
                    text: 'Let me think about how to soften this claim...',
                    thought: true,
                  },
                  {
                    text: '```json\n{\n  "rewrittenText": "Grounded and compliant text.",\n  "rationale": "Softened absolute claim into managed capability."\n}\n```',
                  },
                ],
              },
            },
          ],
        })
    );

    const result = await provider.rewriteContent({
      action: 'IMPROVE_WRITING',
      content: 'Eliminates 100% of risk.',
    });

    assert.equal(result.rewrittenText, 'Grounded and compliant text.');
    assert.equal(result.rationale, 'Softened absolute claim into managed capability.');
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

  it('uses default embedding model from environment configuration', async () => {
    let capturedUrl = '';
    const defaultProvider = new GeminiAIProvider(
      'mock-api-key',
      undefined,
      undefined,
      async (input) => {
        capturedUrl = String(input);
        return createResponse({
          embedding: { values: Array(768).fill(0.1) },
        });
      }
    );

    const vec = await defaultProvider.generateEmbedding('Brand rules');
    assert.ok(capturedUrl.includes(`/models/${env.GEMINI_EMBEDDING_MODEL}:embedContent`));
    assert.equal(vec.length, 768);
  });

  it('uses default generation model for content rewriting and auditing', async () => {
    let capturedUrl = '';
    const defaultProvider = new GeminiAIProvider(
      'mock-api-key',
      undefined,
      undefined,
      async (input) => {
        capturedUrl = String(input);
        return createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      rewrittenText: 'Polished copy.',
                      rationale: 'Cleaned grammar.',
                    }),
                  },
                ],
              },
            },
          ],
        });
      }
    );

    await defaultProvider.rewriteContent({
      action: 'IMPROVE_WRITING',
      content: 'Raw copy.',
    });
    assert.ok(capturedUrl.includes(`/models/${env.GEMINI_MODEL}:generateContent`));
  });

  it('allows explicit model and embedding model overrides via constructor or environment', async () => {
    let capturedRewriteUrl = '';
    let capturedEmbeddingUrl = '';
    const customProvider = new GeminiAIProvider(
      'mock-api-key',
      'custom-generation-model',
      'custom-embedding-model',
      async (input) => {
        const urlStr = String(input);
        if (urlStr.includes(':embedContent')) {
          capturedEmbeddingUrl = urlStr;
          return createResponse({
            embedding: { values: Array(768).fill(0.2) },
          });
        }
        capturedRewriteUrl = urlStr;
        return createResponse({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      rewrittenText: 'Custom rewritten copy.',
                      rationale: 'Custom rationale.',
                    }),
                  },
                ],
              },
            },
          ],
        });
      }
    );

    await customProvider.generateEmbedding('Custom embedding text');
    assert.ok(capturedEmbeddingUrl.includes('/models/custom-embedding-model:embedContent'));

    await customProvider.rewriteContent({
      action: 'SIMPLIFY',
      content: 'Complex text to simplify.',
    });
    assert.ok(capturedRewriteUrl.includes('/models/custom-generation-model:generateContent'));
  });

  it('rejects rewrite and throws error when finishReason is MAX_TOKENS', async () => {
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async () =>
        createResponse({
          candidates: [
            {
              content: {
                parts: [{ text: '{"rewrittenText": "Partial...' }],
              },
              finishReason: 'MAX_TOKENS',
            },
          ],
        })
    );

    await assert.rejects(
      provider.rewriteContent({
        action: 'MAKE_LONGER',
        content: 'Original content.',
      }),
      /Gemini output was truncated due to maximum token limit/
    );
  });

  it('rejects review audit and throws error when finishReason is MAX_TOKENS', async () => {
    const provider = new GeminiAIProvider(
      'test-key',
      'test-model',
      'test-embedding-model',
      async () =>
        createResponse({
          candidates: [
            {
              content: {
                parts: [{ text: '{"issues": [{' }],
              },
              finishReason: 'MAX_TOKENS',
            },
          ],
        })
    );

    await assert.rejects(
      provider.auditContent({
        content: 'Original content to audit.',
        rules: [],
        facts: [],
      }),
      /Gemini output was truncated due to maximum token limit/
    );
  });

  it('rejects incomplete or truncated JSON in rewrite candidate response', async () => {
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
                    text: '{"rewrittenText": "This is an unfinished sentence that cuts off mid-st',
                  },
                ],
              },
            },
          ],
        })
    );

    await assert.rejects(
      provider.rewriteContent({
        action: 'MAKE_LONGER',
        content: 'Original content.',
      }),
      /Gemini returned invalid JSON for the rewrite/
    );
  });

  it('rejects MAKE_LONGER when generated output is shorter than or equal to original content', async () => {
    const originalText =
      'Evolyn is an enterprise AI governance platform that monitors and enforces brand compliance across all generated content and marketing campaigns in real-time.';
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
                      rewrittenText: 'Evolyn enforces brand compliance in real time.',
                      rationale: 'Summarized instead of expanding.',
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
        action: 'MAKE_LONGER',
        content: originalText,
      }),
      /Make Longer failed length enforcement: generated output \(46 chars\) is not longer than original content \(157 chars\)/
    );
  });

  it('accepts MAKE_LONGER when generated output is strictly longer than original content', async () => {
    const originalText =
      'Evolyn is an enterprise AI governance platform that monitors and enforces brand compliance across all generated content and marketing campaigns in real-time.';
    const expandedText =
      'Evolyn is a comprehensive, enterprise-grade AI governance and content auditing platform designed to meticulously monitor, evaluate, and enforce brand compliance and voice consistency across all digital marketing campaigns, customer-facing copy, and automated content workflows in real-time, providing actionable evidence-based findings and automated rewriting tools.';

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
                      rewrittenText: expandedText,
                      rationale: 'Substantially expanded definitions, context, and capabilities.',
                    }),
                  },
                ],
              },
            },
          ],
        })
    );

    const result = await provider.rewriteContent({
      action: 'MAKE_LONGER',
      content: originalText,
    });

    assert.ok(result.rewrittenText.length > originalText.length);
    assert.equal(result.rewrittenText, expandedText);
    assert.equal(
      result.rationale,
      'Substantially expanded definitions, context, and capabilities.'
    );
  });
});
