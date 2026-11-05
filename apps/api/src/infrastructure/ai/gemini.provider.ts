import { z } from 'zod';
import { env } from '../../config/env.js';
import type { AIEmbeddingOptions, AIProvider } from './index.js';

const EMBEDDING_DIMENSIONS = 768;

const auditIssueSchema = z.object({
  ruleId: z.string().uuid().optional().nullable(),
  factId: z.string().uuid().optional().nullable(),
  issueType: z.enum([
    'TERMINOLOGY_VIOLATION',
    'UNSUBSTANTIATED_CLAIM',
    'TONE_MISMATCH',
    'PROHIBITED_PHRASE',
    'COMPLIANCE_RISK',
  ]),
  flaggedExcerpt: z.string().min(1),
  explanation: z.string(),
  suggestedFix: z.string(),
  sourceQuote: z.string().min(1),
  confidenceScore: z.number().min(0).max(1),
  evidenceStrengthScore: z.number().min(0).max(1),
});

const auditResponseSchema = z.object({
  issues: z.array(auditIssueSchema),
});

type FetchLike = typeof fetch;

export class GeminiAIProvider implements AIProvider {
  constructor(
    private readonly apiKey = env.GEMINI_API_KEY,
    private readonly model = env.GEMINI_MODEL,
    private readonly embeddingModel = env.GEMINI_EMBEDDING_MODEL,
    private readonly fetcher: FetchLike = fetch
  ) {}

  async generateEmbedding(
    text: string,
    options: AIEmbeddingOptions = {}
  ): Promise<number[]> {
    if (!text.trim()) {
      throw new Error('Cannot generate an embedding for empty text');
    }

    const dimensions = options.dimensions ?? EMBEDDING_DIMENSIONS;
    const payload = await this.request(
      `${this.embeddingModel}:embedContent`,
      {
        model: `models/${this.embeddingModel}`,
        content: { parts: [{ text }] },
        outputDimensionality: dimensions,
      }
    );
    const values = z
      .object({
        embedding: z.object({
          values: z.array(z.number().finite()).length(dimensions),
        }),
      })
      .parse(payload).embedding.values;

    return values;
  }

  async auditContent(params: Parameters<AIProvider['auditContent']>[0]) {
    const prompt = [
      'Audit the submitted content only against the supplied brand rules and verified facts.',
      'Return issues only when there is a specific, supportable violation or unsupported claim.',
      'Every sourceQuote must be an exact, non-empty substring of the cited rule statement or fact source.',
      'Use ruleId for rule-based findings and factId for fact-based findings; do not invent IDs.',
      'flaggedExcerpt must be an exact substring of the submitted content.',
      'Scores must be numbers from 0 to 1. Do not make approval or rejection decisions.',
      `Submitted content:\n${params.content}`,
      `Brand rules:\n${JSON.stringify(params.rules)}`,
      `Verified facts:\n${JSON.stringify(params.facts)}`,
    ].join('\n\n');

    const payload = await this.request(`${this.model}:generateContent`, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            issues: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  ruleId: { type: 'STRING', nullable: true },
                  factId: { type: 'STRING', nullable: true },
                  issueType: {
                    type: 'STRING',
                    enum: [
                      'TERMINOLOGY_VIOLATION',
                      'UNSUBSTANTIATED_CLAIM',
                      'TONE_MISMATCH',
                      'PROHIBITED_PHRASE',
                      'COMPLIANCE_RISK',
                    ],
                  },
                  flaggedExcerpt: { type: 'STRING' },
                  explanation: { type: 'STRING' },
                  suggestedFix: { type: 'STRING' },
                  sourceQuote: { type: 'STRING' },
                  confidenceScore: { type: 'NUMBER' },
                  evidenceStrengthScore: { type: 'NUMBER' },
                },
                required: [
                  'ruleId',
                  'factId',
                  'issueType',
                  'flaggedExcerpt',
                  'explanation',
                  'suggestedFix',
                  'sourceQuote',
                  'confidenceScore',
                  'evidenceStrengthScore',
                ],
              },
            },
          },
          required: ['issues'],
        },
      },
    });

    const text = z
      .object({
        candidates: z.array(
          z.object({
            content: z.object({
              parts: z.array(z.object({ text: z.string() })),
            }),
          })
        ).min(1),
      })
      .parse(payload)
      .candidates[0]
      .content.parts.map((part) => part.text)
      .join('');

    let response: unknown;
    try {
      response = JSON.parse(text);
    } catch {
      throw new Error('Gemini returned invalid JSON for the review audit');
    }

    return auditResponseSchema.parse(response);
  }

  private async request(
    method: string,
    body: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('Gemini API is not configured: GEMINI_API_KEY is missing');
    }

    const response = await this.fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${method}`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini request failed with HTTP ${response.status}`);
    }

    return response.json();
  }
}
