import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Socket } from 'net';

import { app } from '../app.js';
import { submissionRepository } from '../modules/submissions/submissions.repository.js';
import type {
  DecisionRecord,
  ReviewRunRecord,
  SubmissionDetailsRecord,
  SubmissionRecord,
} from '../modules/submissions/submissions.repository.js';

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
 * without binding to network ports.
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

const validUuid = 'c0a80123-4567-4890-a123-456789abcdef';
const mockDate = new Date('2026-11-04T10:00:00.000Z');

function createSampleSubmission(overrides: Partial<SubmissionRecord> = {}): SubmissionRecord {
  return {
    id: validUuid,
    title: 'Q3 Brand Campaign Announcement',
    channel: 'SOCIAL',
    rawText: 'Evolyn sets a new benchmark in automated brand governance.',
    fileUrl: null,
    submittedBy: 'Ayan',
    status: 'PENDING',
    createdAt: mockDate,
    updatedAt: mockDate,
    ...overrides,
  };
}

describe('Submissions Integration Tests (Express App E2E)', () => {
  const originalCreate = submissionRepository.create;
  const originalFindById = submissionRepository.findById;
  const originalList = submissionRepository.list;
  const originalUpdateStatus = submissionRepository.updateStatus;

  function restoreRepositoryMocks() {
    submissionRepository.create = originalCreate;
    submissionRepository.findById = originalFindById;
    submissionRepository.list = originalList;
    submissionRepository.updateStatus = originalUpdateStatus;
  }

  beforeEach(() => {
    restoreRepositoryMocks();
  });

  afterEach(() => {
    restoreRepositoryMocks();
  });

  // -------------------------------------------------------------
  // POST /api/submissions
  // -------------------------------------------------------------
  describe('POST /api/submissions', () => {
    it('creates a submission and returns 201 with CreateSubmissionResponse shape', async () => {
      let capturedInput: Parameters<typeof submissionRepository.create>[0] | undefined;

      submissionRepository.create = async (input) => {
        capturedInput = input;
        return createSampleSubmission({
          title: input.title,
          channel: input.channel,
          rawText: input.rawText,
          fileUrl: input.fileUrl ?? null,
          submittedBy: input.submittedBy,
        });
      };

      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions',
        body: {
          title: 'Q3 Brand Campaign Announcement',
          channel: 'SOCIAL',
          rawText: 'Evolyn sets a new benchmark in automated brand governance.',
          submittedBy: 'Ayan',
        },
      });

      assert.equal(res.statusCode, 201);
      assert.ok(res.body.submission);
      assert.equal(res.body.submission.id, validUuid);
      assert.equal(res.body.submission.title, 'Q3 Brand Campaign Announcement');
      assert.equal(res.body.submission.channel, 'SOCIAL');
      assert.equal(res.body.submission.status, 'PENDING');
      assert.equal(res.body.submission.createdAt, mockDate.toISOString());
      assert.equal(capturedInput?.title, 'Q3 Brand Campaign Announcement');
    });

    it('applies default channel (WEBSITE) and submittedBy when omitted', async () => {
      let capturedInput: Parameters<typeof submissionRepository.create>[0] | undefined;

      submissionRepository.create = async (input) => {
        capturedInput = input;
        return createSampleSubmission({
          title: input.title,
          channel: input.channel,
          rawText: input.rawText,
          fileUrl: input.fileUrl ?? null,
          submittedBy: input.submittedBy,
        });
      };

      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions',
        body: {
          title: 'Website Hero Copy',
          rawText: 'Evolyn safeguards your marketing claims automatically.',
        },
      });

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.submission.channel, 'WEBSITE');
      assert.equal(res.body.submission.submittedBy, 'Judge / Reviewer');
      assert.equal(capturedInput?.channel, 'WEBSITE');
      assert.equal(capturedInput?.submittedBy, 'Judge / Reviewer');
    });

    it('returns 400 when title is missing or empty', async () => {
      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions',
        body: {
          title: '',
          rawText: 'Valid content that has enough length.',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      assert.ok(Array.isArray(res.body.details));
      const titleError = res.body.details.find((d: any) => d.field === 'title');
      assert.ok(titleError, 'Expected title error in validation details');
    });

    it('returns 400 when rawText is shorter than 10 characters', async () => {
      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions',
        body: {
          title: 'Valid Title',
          rawText: 'Too short',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      const textError = res.body.details.find((d: any) => d.field === 'rawText');
      assert.ok(textError, 'Expected rawText error in validation details');
    });

    it('returns 400 when channel is invalid', async () => {
      const res = await dispatch({
        method: 'POST',
        url: '/api/submissions',
        body: {
          title: 'Valid Title',
          rawText: 'Valid content with enough characters.',
          channel: 'TELEVISION_BROADCAST',
        },
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      const channelError = res.body.details.find((d: any) => d.field === 'channel');
      assert.ok(channelError, 'Expected channel error in validation details');
    });
  });

  // -------------------------------------------------------------
  // GET /api/submissions
  // -------------------------------------------------------------
  describe('GET /api/submissions', () => {
    it('returns 200 with all submissions and total count', async () => {
      const sample = createSampleSubmission();
      submissionRepository.list = async () => [sample];

      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions',
      });

      assert.equal(res.statusCode, 200);
      assert.ok(Array.isArray(res.body.submissions));
      assert.equal(res.body.total, 1);
      assert.equal(res.body.submissions[0].id, validUuid);
    });

    it('filters submissions by valid status and channel', async () => {
      let capturedFilter: Parameters<typeof submissionRepository.list>[0] | undefined;

      submissionRepository.list = async (filter) => {
        capturedFilter = filter;
        return [createSampleSubmission({ status: 'PENDING', channel: 'SOCIAL' })];
      };

      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions?status=PENDING&channel=SOCIAL',
      });

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.total, 1);
      assert.equal(capturedFilter?.status, 'PENDING');
      assert.equal(capturedFilter?.channel, 'SOCIAL');
    });

    it('returns 400 when status query parameter is invalid', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions?status=INVALID_STATUS',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      const statusError = res.body.details.find((d: any) => d.field === 'status');
      assert.ok(statusError, 'Expected status error in validation details');
    });

    it('returns 400 when channel query parameter is invalid', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions?channel=INVALID_CHANNEL',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      const channelError = res.body.details.find((d: any) => d.field === 'channel');
      assert.ok(channelError, 'Expected channel error in validation details');
    });
  });

  // -------------------------------------------------------------
  // GET /api/submissions/:id
  // -------------------------------------------------------------
  describe('GET /api/submissions/:id', () => {
    it('returns 200 with submission details including reviewRun and decision', async () => {
      const reviewRun: ReviewRunRecord = {
        id: 'd0a80123-4567-4890-a123-456789abcdef',
        submissionId: validUuid,
        overallComplianceScore: 92,
        totalIssuesCount: 1,
        modelUsed: 'gemini-2.0-flash',
        summary: { passedChecksCount: 5, failedChecksCount: 1 },
        createdAt: mockDate,
      };

      const decision: DecisionRecord = {
        id: 'e0a80123-4567-4890-a123-456789abcdef',
        submissionId: validUuid,
        decision: 'APPROVED',
        reviewerName: 'Ayan',
        comments: 'Verified against all active guidelines.',
        overriddenIssueIds: [],
        createdAt: mockDate,
      };

      const details: SubmissionDetailsRecord = {
        submission: createSampleSubmission(),
        reviewRun,
        decision,
      };

      submissionRepository.findById = async () => details;

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validUuid}`,
      });

      assert.equal(res.statusCode, 200);
      assert.ok(res.body.submission);
      assert.equal(res.body.submission.id, validUuid);
      assert.equal(res.body.submission.reviewRun.id, reviewRun.id);
      assert.equal(res.body.submission.decision.decision, 'APPROVED');
    });

    it('returns 404 when submission does not exist', async () => {
      submissionRepository.findById = async () => null;

      const res = await dispatch({
        method: 'GET',
        url: `/api/submissions/${validUuid}`,
      });

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'Submission not found');
    });

    it('returns 400 when :id is not a valid UUID', async () => {
      const res = await dispatch({
        method: 'GET',
        url: '/api/submissions/not-a-valid-uuid',
      });

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'Validation failed');
      const idError = res.body.details.find((d: any) => d.field === 'id');
      assert.ok(idError, 'Expected id error in validation details');
    });
  });

  // -------------------------------------------------------------
  // Error handling: unexpected database errors
  // -------------------------------------------------------------
  describe('Error handling & 500 safety', () => {
    it('returns 500 without leaking stack traces on repository create failure', async () => {
      const originalConsoleError = console.error;
      console.error = () => {};

      try {
        submissionRepository.create = async () => {
          throw new Error('Database connection timed out');
        };

        const res = await dispatch({
          method: 'POST',
          url: '/api/submissions',
          body: {
            title: 'Q3 Product Update',
            rawText: 'Evolyn brand compliance engine.',
          },
        });

        assert.equal(res.statusCode, 500);
        assert.equal(res.body.error, 'Database connection timed out');
        assert.equal(res.body.stack, undefined, 'Stack trace must not be exposed in HTTP response');
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('returns 500 without leaking stack traces on repository findById failure', async () => {
      const originalConsoleError = console.error;
      console.error = () => {};

      try {
        submissionRepository.findById = async () => {
          throw new Error('Unexpected database query error');
        };

        const res = await dispatch({
          method: 'GET',
          url: `/api/submissions/${validUuid}`,
        });

        assert.equal(res.statusCode, 500);
        assert.equal(res.body.error, 'Unexpected database query error');
        assert.equal(res.body.stack, undefined, 'Stack trace must not be exposed in HTTP response');
      } finally {
        console.error = originalConsoleError;
      }
    });
  });
});

