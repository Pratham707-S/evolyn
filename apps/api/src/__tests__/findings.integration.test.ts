import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';
import { detectedIssueSchema } from '@evolyn/shared';

import { app } from '../app.js';
import { findingsRepository } from '../modules/findings/findings.repository.js';
import type { DetectedIssueRecord } from '../modules/findings/findings.repository.js';

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
 * In-Memory Express Request Dispatcher
 * Exercises complete Express routing, middleware, and error-handling
 * without requiring live network ports or external databases.
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

const validReviewRunId = 'c0a80123-4567-4890-a123-456789abcdef';
const validIssueId = 'e0a80123-4567-4890-a123-456789abcdef';
const validRuleId = 'd0a80123-4567-4890-a123-456789abcdef';
const mockCreatedAt = new Date('2026-11-04T10:00:00.000Z');

function createSampleFinding(overrides: Partial<DetectedIssueRecord> = {}): DetectedIssueRecord {
  return {
    id: validIssueId,
    reviewRunId: validReviewRunId,
    ruleId: validRuleId,
    factId: null,
    issueType: 'PROHIBITED_PHRASE',
    flaggedExcerpt: 'Guaranteed risk-free compliance',
    charStart: 12,
    charEnd: 43,
    explanation: 'Regulatory rules prohibit absolute risk-free guarantees.',
    suggestedFix: 'Verified enterprise compliance guardrails',
    sourceQuote: 'Never use the phrase guaranteed risk-free in copy.',
    confidenceScore: 0.98,
    evidenceStrengthScore: 0.0,
    status: 'OPEN',
    createdAt: mockCreatedAt,
    ...overrides,
  };
}

describe('Findings Integration Tests (Express App HTTP)', () => {
  const originalListByReviewRunId = findingsRepository.listByReviewRunId;
  const originalReviewRunExists = findingsRepository.reviewRunExists;
  const originalFindCanonicalSource = findingsRepository.findCanonicalSource;

  function restoreRepositoryMocks() {
    findingsRepository.listByReviewRunId = originalListByReviewRunId;
    findingsRepository.reviewRunExists = originalReviewRunExists;
    findingsRepository.findCanonicalSource = originalFindCanonicalSource;
  }

  beforeEach(() => {
    restoreRepositoryMocks();
  });

  afterEach(() => {
    restoreRepositoryMocks();
  });

  describe('GET /api/review-runs/:reviewRunId/findings', () => {
    it('returns 200 with findings and matches the shared API contract', async () => {
      const sampleFinding = createSampleFinding();

      findingsRepository.reviewRunExists = async (runId) => runId === validReviewRunId;
      findingsRepository.listByReviewRunId = async (runId) => {
        if (runId === validReviewRunId) {
          return [sampleFinding];
        }
        return [];
      };

      const res = await dispatch({
        method: 'GET',
        url: `/api/review-runs/${validReviewRunId}/findings`,
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.reviewRunId, validReviewRunId);
      assert.equal(res.body.total, 1);
      assert.ok(Array.isArray(res.body.findings));
      assert.equal(res.body.findings.length, 1);

      // Validate response items match shared detectedIssueSchema contract
      const issue = res.body.findings[0];
      const validated = detectedIssueSchema.parse(issue);
      assert.equal(validated.id, validIssueId);
      assert.equal(validated.issueType, 'PROHIBITED_PHRASE');
      assert.equal(validated.flaggedExcerpt, 'Guaranteed risk-free compliance');
      assert.equal(validated.sourceQuote, 'Never use the phrase guaranteed risk-free in copy.');
      assert.equal(validated.charStart, 12);
      assert.equal(validated.charEnd, 43);
      assert.equal(validated.status, 'OPEN');
    });

    it('returns 200 with empty list when review run exists but has 0 findings', async () => {
      findingsRepository.reviewRunExists = async () => true;
      findingsRepository.listByReviewRunId = async () => [];

      const res = await dispatch({
        method: 'GET',
        url: `/api/review-runs/${validReviewRunId}/findings`,
      });

      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, {
        reviewRunId: validReviewRunId,
        findings: [],
        total: 0,
      });
    });

    it('returns 404 when the review run does not exist', async () => {
      findingsRepository.reviewRunExists = async () => false;

      const nonExistentRunId = 'b0a80123-4567-4890-a123-456789abcdef';
      const res = await dispatch({
        method: 'GET',
        url: `/api/review-runs/${nonExistentRunId}/findings`,
      });

      assert.equal(res.statusCode, 404);
      assert.deepEqual(res.body, {
        error: 'Review run not found',
      });
    });

    it('returns 400 with structured validation details when reviewRunId is an invalid UUID', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/review-runs/not-a-valid-uuid/findings',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(Array.isArray(res.body.details));
      assert.ok(res.body.details.length > 0);
      assert.equal(res.body.details[0].field, 'reviewRunId');
      assert.match(res.body.details[0].message, /Invalid uuid/i);
    });

    it('returns 500 without leaking stack traces on unexpected repository failure', async () => {
      findingsRepository.reviewRunExists = async () => {
        throw new Error('Database connection terminated unexpectedly');
      };

      const res = await dispatch({
        method: 'GET',
        url: `/api/review-runs/${validReviewRunId}/findings`,
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Database connection terminated unexpectedly');
      // Must not leak stack traces or internal filenames to client
      assert.equal(res.body.stack, undefined);
    });

    it('returns 500 without leaking stack traces when listByReviewRunId fails', async () => {
      findingsRepository.reviewRunExists = async () => true;
      findingsRepository.listByReviewRunId = async () => {
        throw new Error('Query execution timeout');
      };

      const res = await dispatch({
        method: 'GET',
        url: `/api/review-runs/${validReviewRunId}/findings`,
      });

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'Query execution timeout');
      assert.equal(res.body.stack, undefined);
    });
  });
});

