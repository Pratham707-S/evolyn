import { z } from 'zod';
import {
  brandGovernanceEvaluationResponseSchema,
  type BrandGovernanceEvaluation,
} from '@evolyn/shared';
import { env } from '../../config/env.js';

export class BrandGovernanceAIConfigError extends Error {
  constructor(
    message = 'GEMINI_BRAND_GOVERNANCE_API_KEY is not configured. Brand Governance AI requires a dedicated API key and cannot fall back to GEMINI_API_KEY.'
  ) {
    super(message);
    this.name = 'BrandGovernanceAIConfigError';
  }
}

export interface BrandGovernanceContext {
  brandSetup?: {
    brandName: string;
    description?: string;
    industry?: string;
    voiceTone?: {
      formality?: number;
      boldness?: number;
      accessibility?: number;
      toneDescriptors?: string[];
      dos?: string[];
      donts?: string[];
    };
    governance?: {
      minComplianceScore?: number;
      requireEvidence?: boolean;
      blockCompetitors?: boolean;
      brandGuardianEmail?: string;
    };
  };
  rules: Array<{
    id: string;
    ruleType: string;
    ruleStatement: string;
    severity: string;
    explanation?: string;
  }>;
  facts: Array<{
    id: string;
    topic: string;
    claimStatement: string;
    approvedProofSource: string;
  }>;
}

export interface BrandGovernanceEvaluateParams {
  content: string;
  context: BrandGovernanceContext;
}

type FetchLike = typeof fetch;

export class BrandGovernanceAIProvider {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetcher: FetchLike;

  constructor(
    apiKey?: string,
    model?: string,
    fetcher: FetchLike = fetch
  ) {
    // Isolated key configuration: read strictly from GEMINI_BRAND_GOVERNANCE_API_KEY.
    // ZERO fallback to GEMINI_API_KEY is permitted.
    const resolvedKey = apiKey !== undefined ? apiKey : env.GEMINI_BRAND_GOVERNANCE_API_KEY;
    if (!resolvedKey || !resolvedKey.trim()) {
      throw new BrandGovernanceAIConfigError();
    }
    this.apiKey = resolvedKey.trim();
    this.model = model || env.GEMINI_BRAND_GOVERNANCE_MODEL || 'gemini-3.8-flash';
    this.fetcher = fetcher;
  }

  public getModel(): string {
    return this.model;
  }

  public async evaluateContent(
    params: BrandGovernanceEvaluateParams
  ): Promise<BrandGovernanceEvaluation> {
    const { content, context } = params;

    if (!content || !content.trim()) {
      throw new Error('Content to evaluate cannot be empty');
    }

    const brandVoiceContext = context.brandSetup
      ? `
BRAND SETUP & VOICE IDENTITY:
- Brand Name: ${context.brandSetup.brandName}
- Industry: ${context.brandSetup.industry || 'N/A'}
- Description: ${context.brandSetup.description || 'N/A'}
- Desired Tone: ${context.brandSetup.voiceTone?.toneDescriptors?.join(', ') || 'Authoritative, Clear, Empathetic'}
- Do's: ${context.brandSetup.voiceTone?.dos?.join('; ') || 'N/A'}
- Don'ts: ${context.brandSetup.voiceTone?.donts?.join('; ') || 'N/A'}
`
      : 'BRAND SETUP: None configured (use general brand safety guardrails).';

    const rulesContext =
      context.rules.length > 0
        ? context.rules
            .map(
              (r, idx) =>
                `Rule ${idx + 1} [${r.ruleType}] (Severity: ${r.severity}): "${r.ruleStatement}" - ${r.explanation || ''}`
            )
            .join('\n')
        : 'No specific guideline rules registered.';

    const factsContext =
      context.facts.length > 0
        ? context.facts
            .map(
              (f, idx) =>
                `Fact ${idx + 1} [Topic: ${f.topic}]: Claim: "${f.claimStatement}" (Approved Proof Source: ${f.approvedProofSource})`
            )
            .join('\n')
        : 'No approved ground truth facts registered.';

    const systemPrompt = `You are Evolyn's Dedicated Brand Governance AI.
Your sole mission is to audit marketing copy, external communications, and proposed copy against three grounded pillars:
1. Brand Setup (Brand Voice, Tone, Audience, and Positioning)
2. Brand Rules (Approved active governance rules, mandatory clauses, prohibitions, and restrictions)
3. Knowledge Library (Verified factual claims with documented proof sources)

IMPORTANT INSTRUCTIONS:
- You must return ONLY valid raw JSON conforming strictly to the requested schema.
- Do NOT fabricate proof sources or brand rules. Use only the provided context.
- Keep human approval required: all proposed changes require reviewer sign-off.
- Calculate objective governance scores between 0 and 100 for brandVoiceScore, rulesComplianceScore, factGroundingScore, and overallGovernanceScore.
- Return governanceDecision as 'COMPLIANT' (overall score >= 85 and no critical issues), 'NEEDS_REVISION' (minor/moderate issues), or 'NON_COMPLIANT' (critical rule violations or ungrounded claims).

Expected JSON Structure:
{
  "governanceDecision": "COMPLIANT" | "NEEDS_REVISION" | "NON_COMPLIANT",
  "overallGovernanceScore": number (0-100),
  "brandVoiceScore": number (0-100),
  "rulesComplianceScore": number (0-100),
  "factGroundingScore": number (0-100),
  "findings": [
    {
      "category": "BRAND_VOICE" | "BRAND_RULE" | "FACT_VERIFICATION",
      "severity": "CRITICAL" | "WARNING" | "SUGGESTION",
      "statement": string,
      "sourceEvidence": string,
      "suggestedImprovement": string
    }
  ],
  "summary": string,
  "requiresHumanApproval": true
}`;

    const userPrompt = `
${brandVoiceContext}

APPROVED GOVERNANCE RULES:
${rulesContext}

VERIFIED FACTS & PROOF SOURCES:
${factsContext}

CONTENT UNDER EVALUATION:
"""
${content}
"""

Audit this content against the brand setup, rules, and verified facts. Return structured JSON.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.model
    )}:generateContent`;

    const response = await this.fetcher(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore
      }
      // Never expose the API key in error messages
      const safeError = errorBody.replace(this.apiKey, '[REDACTED_API_KEY]');
      throw new Error(
        `Brand Governance AI Gemini request failed with HTTP ${response.status}: ${safeError}`
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!candidateText) {
      throw new Error('Brand Governance AI returned an empty response');
    }

    // Parse JSON safely
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(candidateText);
    } catch {
      const match = candidateText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (match) {
        parsedJson = JSON.parse(match[1].trim());
      } else {
        throw new Error('Brand Governance AI response was not valid JSON');
      }
    }

    // Enforce requiresHumanApproval and timestamp
    const payload = {
      ...(parsedJson as Record<string, unknown>),
      requiresHumanApproval: true,
      evaluatedAt: new Date().toISOString(),
    };

    const validated = brandGovernanceEvaluationResponseSchema.parse(payload);
    return validated;
  }
}
