import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';
import { app } from '../app.js';
import { brandGovernanceService } from '../modules/brand-governance/brand-governance.service.js';
import { BrandGovernanceAIProvider } from '../infrastructure/ai/brand-governance.provider.js';

interface DispatchOptions {
  method: string;
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
}

interface DispatchResult {
  statusCode: number;
  body: any;
  headers: Record<string, any>;
}

function dispatch(options: DispatchOptions): Promise<DispatchResult> {
  return new Promise((resolve, reject) => {
    try {
      const socket = new Socket();
      const req = new http.IncomingMessage(socket);
      req.method = options.method;
      req.url = options.url;

      const payload = options.body !== undefined ? JSON.stringify(options.body) : null;
      req.headers = {
        host: 'localhost',
        ...(options.headers || {}),
        ...(payload !== null
          ? {
              'content-type': 'application/json',
              'content-length': String(Buffer.byteLength(payload)),
            }
          : {}),
      };

      const res = new http.ServerResponse(req);
      let rawOutput = '';

      res.write = function (chunk: any) {
        if (chunk) rawOutput += chunk;
        return true;
      };

      res.end = function (chunk: any) {
        if (chunk) rawOutput += chunk;
        let parsed: any = rawOutput;
        try {
          parsed = JSON.parse(rawOutput);
        } catch {
          // keep as string
        }
        resolve({
          statusCode: res.statusCode,
          body: parsed,
          headers: res.getHeaders(),
        });
        return res;
      };

      app.handle(req, res, (err: any) => {
        if (err) reject(err);
      });

      if (payload) {
        req.push(payload);
      }
      req.push(null);
    } catch (err) {
      reject(err);
    }
  });
}

describe('Brand Governance Integration Tests (Express App E2E)', () => {
  it('GET /api/brand-governance/context returns bounded context from database', async () => {
    const res = await dispatch({
      method: 'GET',
      url: '/api/brand-governance/context',
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.body);
    assert.ok(res.body.brandSetup);
    assert.ok(Array.isArray(res.body.rules));
    assert.ok(Array.isArray(res.body.facts));
  });

  it('POST /api/brand-governance/evaluate returns structured evaluation using dedicated AI', async () => {
    let capturedPrompt = '';
    const mockFetcher = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body || '{}'));
      capturedPrompt = body.contents?.[0]?.parts?.[0]?.text || '';
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      governanceDecision: 'NEEDS_REVISION',
                      overallGovernanceScore: 75,
                      brandVoiceScore: 80,
                      rulesComplianceScore: 70,
                      factGroundingScore: 75,
                      findings: [
                        {
                          category: 'BRAND_RULE',
                          severity: 'CRITICAL',
                          statement: 'Content contains prohibited phrase "100% risk-free".',
                          sourceEvidence: 'Global Governance Rule 2: Absolute guarantees prohibited.',
                          suggestedImprovement: 'Replace with grounded uptime statistic.',
                        },
                      ],
                      summary: 'Evaluation completed against live brand rules and fact library.',
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

    const dedicatedProvider = new BrandGovernanceAIProvider(
      'dedicated-eval-test-key',
      'gemini-1.5-pro',
      mockFetcher as typeof fetch
    );

    // Inject mock AI provider
    (brandGovernanceService as unknown as { aiProvider: BrandGovernanceAIProvider }).aiProvider = dedicatedProvider;

    const res = await dispatch({
      method: 'POST',
      url: '/api/brand-governance/evaluate',
      body: {
        content: 'Evolyn offers a guaranteed 100% risk-free enterprise experience.',
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.governanceDecision, 'NEEDS_REVISION');
    assert.equal(res.body.overallGovernanceScore, 75);
    assert.equal(res.body.requiresHumanApproval, true);
    assert.equal(res.body.findings.length, 1);
    assert.equal(res.body.findings[0].category, 'BRAND_RULE');

    // Verify bounded prompt received brand context
    assert.ok(capturedPrompt.includes('BRAND SETUP & VOICE IDENTITY'));
    assert.ok(capturedPrompt.includes('CONTENT UNDER EVALUATION'));
  });

  it('POST /api/brand-governance/evaluate rejects empty content with 400', async () => {
    const res = await dispatch({
      method: 'POST',
      url: '/api/brand-governance/evaluate',
      body: { content: '' },
    });

    assert.equal(res.statusCode, 400);
    assert.ok(res.body);
  });
});
