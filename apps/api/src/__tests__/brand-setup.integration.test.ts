import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';
import { app } from '../app.js';
import { brandSetupService } from '../modules/brand-setup/brand-setup.service.js';
import type { IBrandSetupRepository } from '../modules/brand-setup/brand-setup.repository.js';
import type { BrandSetup } from '@evolyn/shared';

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

describe('Brand Setup Integration Tests (Express App E2E)', () => {
  it('GET /api/brand-setup returns 200 with structured brand setup', async () => {
    const res = await dispatch({
      method: 'GET',
      url: '/api/brand-setup',
    });

    assert.equal(res.statusCode, 200);
    assert.ok(res.body);
    assert.ok(res.body.brandName);
    assert.ok(res.body.voiceTone);
    assert.ok(res.body.governance);
  });

  it('POST /api/brand-setup saves and returns 200 with persisted profile', async () => {
    let savedState: BrandSetup | null = null;
    const mockRepo: IBrandSetupRepository = {
      async findActiveSetup() {
        return savedState;
      },
      async saveSetup(setup: BrandSetup) {
        savedState = setup;
        return setup;
      },
    };

    // Inject mock repo for isolated test
    (brandSetupService as unknown as { repository: IBrandSetupRepository }).repository = mockRepo;

    const newSetup = {
      brandName: 'Novara Health',
      industry: 'Healthcare Technology',
      description: 'Patient-centric healthcare compliance and brand governance platform.',
      primaryColor: '#0052CC',
      secondaryColor: '#F4F5F7',
      voiceTone: {
        formality: 4,
        boldness: 3,
        accessibility: 5,
        toneDescriptors: ['Empathetic', 'Rigorous', 'Accessible'],
        dos: ['Anchor all medical claims to peer-reviewed studies'],
        donts: ['Never make unsubstantiated curative claims'],
      },
      governance: {
        approvalStrategy: 'dual',
        requireEvidence: true,
        blockCompetitors: true,
        enforcePalette: true,
        brandGuardianEmail: 'compliance@novarahealth.com',
        minComplianceScore: 90,
      },
    };

    const postRes = await dispatch({
      method: 'POST',
      url: '/api/brand-setup',
      body: newSetup,
    });

    assert.equal(postRes.statusCode, 200);
    assert.equal(postRes.body.brandName, 'Novara Health');
    assert.equal(postRes.body.industry, 'Healthcare Technology');
    assert.equal(postRes.body.governance.minComplianceScore, 90);

    // Verify persistence across subsequent GET request
    const getRes = await dispatch({
      method: 'GET',
      url: '/api/brand-setup',
    });

    assert.equal(getRes.statusCode, 200);
    assert.equal(getRes.body.brandName, 'Novara Health');
    assert.equal(getRes.body.voiceTone.toneDescriptors[0], 'Empathetic');
  });

  it('POST /api/brand-setup rejects invalid payload with missing brandName', async () => {
    const invalidSetup = {
      brandName: '', // empty name
    };

    const res = await dispatch({
      method: 'POST',
      url: '/api/brand-setup',
      body: invalidSetup,
    });

    assert.equal(res.statusCode, 400);
    assert.ok(res.body);
  });
});
