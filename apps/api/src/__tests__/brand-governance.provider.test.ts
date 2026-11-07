import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  BrandGovernanceAIProvider,
  BrandGovernanceAIConfigError,
  type BrandGovernanceContext,
} from '../infrastructure/ai/brand-governance.provider.js';
import { GeminiAIProvider } from '../infrastructure/ai/gemini.provider.js';

describe('BrandGovernanceAIProvider - Isolated Gemini Integration', () => {
  const dummyContext: BrandGovernanceContext = {
    brandSetup: {
      brandName: 'Evolyn',
      industry: 'Brand Safety AI',
      description: 'AI-powered brand governance and compliance assurance.',
      voiceTone: {
        formality: 3,
        boldness: 4,
        accessibility: 4,
        toneDescriptors: ['Authoritative', 'Precise', 'Modern'],
        dos: ['Use active voice', 'Cite proof sources'],
        donts: ['Never make unsubstantiated claims', 'Avoid buzzwords'],
      },
      governance: {
        minComplianceScore: 85,
        requireEvidence: true,
        blockCompetitors: true,
      },
    },
    rules: [
      {
        id: 'r1',
        ruleType: 'PROHIBITED',
        ruleStatement: 'Never use the phrase "risk-free" in external copy.',
        severity: 'CRITICAL',
        explanation: 'Regulatory standard prohibits absolute risk guarantees.',
      },
    ],
    facts: [
      {
        id: 'f1',
        topic: 'Platform Uptime',
        claimStatement: 'Evolyn achieved 99.98% platform uptime in 2025.',
        approvedProofSource: 'SOC 2 Type II Audit Report 2025',
      },
    ],
  };

  it('strictly rejects missing dedicated API key with BrandGovernanceAIConfigError', () => {
    assert.throws(
      () => new BrandGovernanceAIProvider('', 'gemini-1.5-pro'),
      (err: unknown) => {
        assert.ok(err instanceof BrandGovernanceAIConfigError);
        assert.ok(
          (err as Error).message.includes('GEMINI_BRAND_GOVERNANCE_API_KEY')
        );
        return true;
      }
    );
  });

  it('never falls back to GEMINI_API_KEY when dedicated key is omitted or empty', () => {
    // Even if main AI key exists in environment, Brand Governance AI must reject empty string
    assert.throws(
      () => new BrandGovernanceAIProvider('   ', 'gemini-1.5-pro'),
      (err: unknown) => {
        assert.ok(err instanceof BrandGovernanceAIConfigError);
        assert.ok(
          (err as Error).message.includes('cannot fall back to GEMINI_API_KEY')
        );
        return true;
      }
    );
  });

  it('uses configured GEMINI_BRAND_GOVERNANCE_API_KEY and model in requests', async () => {
    let capturedUrl = '';
    let capturedKeyHeader = '';
    const mockFetcher = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedKeyHeader = String((init?.headers as Record<string, string>)?.[`x-goog-api-key`] || '');
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      governanceDecision: 'COMPLIANT',
                      overallGovernanceScore: 92,
                      brandVoiceScore: 95,
                      rulesComplianceScore: 90,
                      factGroundingScore: 91,
                      findings: [],
                      summary: 'Copy strictly satisfies all brand governance rules and tone standards.',
                      requiresHumanApproval: true,
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const dedicatedKey = 'test-dedicated-brand-governance-key-xyz';
    const dedicatedModel = 'gemini-1.5-pro-governance';
    const provider = new BrandGovernanceAIProvider(
      dedicatedKey,
      dedicatedModel,
      mockFetcher as typeof fetch
    );

    const result = await provider.evaluateContent({
      content: 'Evolyn provides robust brand governance with 99.98% verified uptime.',
      context: dummyContext,
    });

    assert.equal(capturedKeyHeader, dedicatedKey);
    assert.ok(capturedUrl.includes(`/models/${dedicatedModel}:generateContent`));
    assert.equal(result.governanceDecision, 'COMPLIANT');
    assert.equal(result.overallGovernanceScore, 92);
    assert.equal(result.requiresHumanApproval, true);
    assert.ok(result.evaluatedAt);
  });

  it('redacts dedicated API key from error output to prevent credential leakage', async () => {
    const dedicatedKey = 'super-secret-brand-governance-key-999';
    const mockFetcher = async () => {
      return new Response(
        `Error 403 Forbidden with key ${dedicatedKey} invalid.`,
        { status: 403 }
      );
    };

    const provider = new BrandGovernanceAIProvider(
      dedicatedKey,
      'gemini-1.5-pro',
      mockFetcher as typeof fetch
    );

    await assert.rejects(
      async () => {
        await provider.evaluateContent({
          content: 'Test content',
          context: dummyContext,
        });
      },
      (err: Error) => {
        assert.ok(!err.message.includes(dedicatedKey));
        assert.ok(err.message.includes('[REDACTED_API_KEY]'));
        return true;
      }
    );
  });

  it('demonstrates strict isolation: Main AI and Brand Governance AI use distinct configurations', async () => {
    let mainAiKeyHeader = '';
    let brandAiKeyHeader = '';

    const mainKey = 'main-gemini-key-111';
    const brandKey = 'dedicated-governance-key-222';

    const mainFetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
      mainAiKeyHeader = String((init?.headers as Record<string, string>)?.[`x-goog-api-key`] || '');
      return new Response(
        JSON.stringify({
          embedding: { values: new Array(768).fill(0.01) },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const brandFetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
      brandAiKeyHeader = String((init?.headers as Record<string, string>)?.[`x-goog-api-key`] || '');
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      governanceDecision: 'NEEDS_REVISION',
                      overallGovernanceScore: 70,
                      brandVoiceScore: 75,
                      rulesComplianceScore: 65,
                      factGroundingScore: 70,
                      findings: [
                        {
                          category: 'BRAND_RULE',
                          severity: 'CRITICAL',
                          statement: 'Content contains prohibited claim.',
                          sourceEvidence: 'Rule 1: Never use risk-free.',
                          suggestedImprovement: 'Remove claim.',
                        },
                      ],
                      summary: 'Violations found.',
                      requiresHumanApproval: true,
                    }),
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    const mainProvider = new GeminiAIProvider(
      mainKey,
      'gemini-flash-lite-latest',
      'gemini-embedding-001',
      mainFetcher as typeof fetch
    );

    const brandProvider = new BrandGovernanceAIProvider(
      brandKey,
      'gemini-1.5-pro',
      brandFetcher as typeof fetch
    );

    // Run both independently
    await mainProvider.generateEmbedding('Brand search text');
    await brandProvider.evaluateContent({
      content: 'Sample text to evaluate',
      context: dummyContext,
    });

    // Verify isolation: each used strictly its own designated key header
    assert.equal(mainAiKeyHeader, mainKey);
    assert.notEqual(mainAiKeyHeader, brandKey);

    assert.equal(brandAiKeyHeader, brandKey);
    assert.notEqual(brandAiKeyHeader, mainKey);
  });
});
