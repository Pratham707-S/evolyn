import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';

import { app } from '../app.js';
import { guidelinesRepository } from '../modules/guidelines/guidelines.repository.js';
import type { GuidelineRecord, GuidelineRuleRecord } from '../modules/guidelines/guidelines.repository.js';

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

/**
 * Reliable In-Memory Express Request Dispatcher
 * Exercises the complete Express app stack (middlewares, routing, error-handlers)
 * without requiring ephemeral TCP port binding (immune to sandbox/network restrictions).
 */
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
          // Keep raw string if non-JSON payload
        }
        resolve({
          statusCode: res.statusCode,
          body: parsed,
          headers: res.getHeaders(),
        });
        return this;
      };

      app(req, res);

      process.nextTick(() => {
        if (payload !== null) {
          req.push(payload);
        }
        req.push(null);
      });
    } catch (err) {
      reject(err);
    }
  });
}

const mockDate = new Date('2026-11-04T10:00:00.000Z');

const sampleRecord: GuidelineRecord = {
  id: 'g-test-1',
  title: 'Global Brand Guidelines',
  category: 'TONE',
  version: '1.0',
  rawContent: 'Always maintain a professional, trustworthy, and empathetic tone.',
  s3Url: null,
  status: 'ACTIVE',
  createdAt: mockDate,
  updatedAt: mockDate,
};

const sampleRule: GuidelineRuleRecord = {
  id: 'r-test-1',
  guidelineId: 'g-test-1',
  ruleType: 'MANDATORY',
  ruleStatement: 'Always write brand name as Evolyn.',
  explanation: 'Brand identity consistency.',
  severity: 'CRITICAL',
  embedding: null,
  metadata: {},
  createdAt: mockDate,
};

describe('Guidelines Integration Tests (Express App E2E)', () => {
  // Capture original repository methods to guarantee restoration and prevent state leakage
  const originalCreate = guidelinesRepository.create;
  const originalFindMany = guidelinesRepository.findMany;
  const originalFindById = guidelinesRepository.findById;
  const originalFindRules = guidelinesRepository.findRulesByGuidelineId;

  function restoreRepositoryMocks() {
    guidelinesRepository.create = originalCreate;
    guidelinesRepository.findMany = originalFindMany;
    guidelinesRepository.findById = originalFindById;
    guidelinesRepository.findRulesByGuidelineId = originalFindRules;
  }

  beforeEach(() => {
    restoreRepositoryMocks();
  });

  afterEach(() => {
    restoreRepositoryMocks();
  });

  it('mounts guidelinesRouter and handles GET /api/guidelines', async () => {
    guidelinesRepository.findMany = async () => [sampleRecord];

    const res = await dispatch({
      method: 'GET',
      url: '/api/guidelines',
    });

    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body));
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].id, 'g-test-1');
    assert.equal(res.body[0].title, 'Global Brand Guidelines');
    assert.equal(res.body[0].category, 'TONE');
  });

  it('filters guidelines with valid query parameters GET /api/guidelines?category=TONE&status=ACTIVE', async () => {
    let capturedFilter: any;
    guidelinesRepository.findMany = async (filter) => {
      capturedFilter = filter;
      return [sampleRecord];
    };

    const res = await dispatch({
      method: 'GET',
      url: '/api/guidelines?category=TONE&status=ACTIVE',
    });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(capturedFilter, {
      category: 'TONE',
      status: 'ACTIVE',
    });
  });

  it('rejects invalid query parameters with 400 and validation error details', async () => {
    const res = await dispatch({
      method: 'GET',
      url: '/api/guidelines?category=INVALID_CATEGORY',
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(Array.isArray(res.body.details));
    assert.equal(res.body.details[0].field, 'category');
  });

  it('rejects invalid status query parameter with 400 and validation error details', async () => {
    const res = await dispatch({
      method: 'GET',
      url: '/api/guidelines?status=NON_EXISTENT_STATUS',
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(Array.isArray(res.body.details));
    assert.equal(res.body.details[0].field, 'status');
  });

  it('creates guideline via POST /api/guidelines with 201', async () => {
    guidelinesRepository.create = async (input) => ({
      ...sampleRecord,
      title: input.title,
      category: input.category,
      rawContent: input.rawContent,
    });

    const res = await dispatch({
      method: 'POST',
      url: '/api/guidelines',
      body: {
        title: 'New Guideline Policy',
        category: 'LEGAL',
        version: '2.0',
        rawContent: 'This is a valid legal guideline that meets the length threshold.',
      },
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.title, 'New Guideline Policy');
    assert.equal(res.body.category, 'LEGAL');
  });

  it('rejects invalid body on POST /api/guidelines with 400 validation error', async () => {
    const res = await dispatch({
      method: 'POST',
      url: '/api/guidelines',
      body: {
        title: '',
        rawContent: 'too short',
      },
    });

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'Validation failed');
    assert.ok(Array.isArray(res.body.details));
    const fields = res.body.details.map((d: any) => d.field);
    assert.ok(fields.includes('title'));
    assert.ok(fields.includes('rawContent'));
  });

  it('retrieves single guideline with rules via GET /api/guidelines/:id', async () => {
    guidelinesRepository.findById = async (id) => (id === 'g-test-1' ? sampleRecord : null);
    guidelinesRepository.findRulesByGuidelineId = async () => [sampleRule];

    const res = await dispatch({
      method: 'GET',
      url: '/api/guidelines/g-test-1',
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 'g-test-1');
    assert.ok(Array.isArray(res.body.rules));
    assert.equal(res.body.rules.length, 1);
    assert.equal(res.body.rules[0].id, 'r-test-1');
    assert.equal(res.body.rules[0].ruleStatement, 'Always write brand name as Evolyn.');
  });

  it('returns 404 for missing guideline on GET /api/guidelines/:id', async () => {
    guidelinesRepository.findById = async () => null;

    const res = await dispatch({
      method: 'GET',
      url: '/api/guidelines/non-existent-guideline-id',
    });

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Guideline not found' });
  });

  it('returns 404 for unmounted routes on Express app', async () => {
    const res = await dispatch({
      method: 'GET',
      url: '/api/unknown-module-endpoint',
    });

    assert.equal(res.statusCode, 404);
    assert.ok(res.body.error.includes('Route not found'));
  });
});
