import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import type {
  ContentSubmission,
  Decision,
  DecisionType,
  DetectedIssue,
  ReviewRun,
} from '@evolyn/shared';
import {
  fetchApprovalQueue,
  fetchAllSubmissions,
  fetchSubmissionReview,
  submitHumanDecision,
  fetchLatestDecision,
  fetchDecisionHistory,
  type SubmitDecisionPayload,
} from '../api/decisions-api';
import { ApiClientError } from '../../../lib/api/client';

describe('Decisions API Client & Governance Workflow Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockSubmission: ContentSubmission = {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    title: 'Q3 Product Launch Copy',
    channel: 'SOCIAL',
    rawText: 'Introducing our revolutionary AI-powered platform with 99.9% verified uptime.',
    submittedBy: 'Brand Strategist',
    status: 'REVIEWED',
    createdAt: '2026-11-06T00:00:00.000Z',
    updatedAt: '2026-11-06T00:00:00.000Z',
  };

  const mockReviewRun: ReviewRun = {
    id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
    submissionId: mockSubmission.id,
    overallComplianceScore: 82,
    totalIssuesCount: 1,
    modelUsed: 'gemini-2.0-flash',
    summary: {
      passedChecksCount: 4,
      failedChecksCount: 1,
      notes: 'Hyperbolic marketing claim flagged.',
    },
    createdAt: '2026-11-06T00:05:00.000Z',
  };

  const mockIssue: DetectedIssue = {
    id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
    reviewRunId: mockReviewRun.id,
    issueType: 'UNSUBSTANTIATED_CLAIM',
    flaggedExcerpt: '99.9% verified uptime',
    sourceQuote: 'All uptime metrics must cite the official quarterly infrastructure audit.',
    explanation: 'No proof source was linked for the uptime statistic.',
    suggestedFix: 'Cite the Q2 infrastructure report or omit specific percentages.',
    confidenceScore: 0.95,
    evidenceStrengthScore: 0.9,
    status: 'OPEN',
  };

  const mockDecision: Decision = {
    id: 'd1e2f3a4-58cc-4372-a567-0e02b2c3d479',
    submissionId: mockSubmission.id,
    decision: 'APPROVED',
    reviewerName: 'Sarah Jenkins',
    comments: 'Uptime claim confirmed against internal engineering report.',
    overriddenIssueIds: [mockIssue.id!],
    createdAt: '2026-11-06T00:15:00.000Z',
  };

  describe('fetchApprovalQueue', () => {
    it('fetches queue with status=REVIEWED by default', async () => {
      let requestedUrl = '';
      globalThis.fetch = async (input: RequestInfo | URL) => {
        requestedUrl = String(input);
        return new Response(
          JSON.stringify({ submissions: [mockSubmission], total: 1 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await fetchApprovalQueue();
      assert.ok(requestedUrl.includes('/api/submissions?status=REVIEWED'));
      assert.equal(result.submissions.length, 1);
      assert.equal(result.submissions[0].id, mockSubmission.id);
      assert.equal(result.total, 1);
    });

    it('fetches all submissions via fetchAllSubmissions without status query', async () => {
      let requestedUrl = '';
      globalThis.fetch = async (input: RequestInfo | URL) => {
        requestedUrl = String(input);
        return new Response(
          JSON.stringify({ submissions: [mockSubmission], total: 1 }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await fetchAllSubmissions();
      assert.ok(requestedUrl.endsWith('/api/submissions'));
      assert.equal(result.submissions.length, 1);
    });
  });

  describe('fetchSubmissionReview', () => {
    it('retrieves submission details, review run, and issues for the detail view', async () => {
      let requestedUrl = '';
      globalThis.fetch = async (input: RequestInfo | URL) => {
        requestedUrl = String(input);
        return new Response(
          JSON.stringify({
            submission: mockSubmission,
            reviewRun: mockReviewRun,
            issues: [mockIssue],
            decision: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await fetchSubmissionReview(mockSubmission.id);
      assert.ok(requestedUrl.includes(`/api/submissions/${mockSubmission.id}/review`));
      assert.equal(result.submission.id, mockSubmission.id);
      assert.equal(result.reviewRun.overallComplianceScore, 82);
      assert.equal(result.issues.length, 1);
      assert.equal(result.issues[0].id, mockIssue.id);
      assert.equal(result.decision, null);
    });
  });

  describe('submitHumanDecision', () => {
    it('posts authentic human decision payload with overridden issue IDs', async () => {
      let requestedUrl = '';
      let requestMethod = '';
      let requestBody: any = null;

      globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        requestedUrl = String(input);
        requestMethod = init?.method || 'GET';
        requestBody = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            decision: mockDecision,
            updatedSubmissionStatus: 'APPROVED',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const payload: SubmitDecisionPayload = {
        decision: 'APPROVED',
        reviewerName: 'Sarah Jenkins',
        comments: 'Uptime claim confirmed against internal engineering report.',
        overriddenIssueIds: [mockIssue.id!],
      };

      const result = await submitHumanDecision(mockSubmission.id, payload);

      assert.ok(requestedUrl.includes(`/api/submissions/${mockSubmission.id}/decision`));
      assert.equal(requestMethod, 'POST');
      assert.equal(requestBody.decision, 'APPROVED');
      assert.equal(requestBody.reviewerName, 'Sarah Jenkins');
      assert.deepEqual(requestBody.overriddenIssueIds, [mockIssue.id]);
      assert.equal(result.decision.id, mockDecision.id);
      assert.equal(result.updatedSubmissionStatus, 'APPROVED');
    });

    it('throws ApiClientError when backend rejects invalid input (400)', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ error: 'Reviewer name is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      };

      await assert.rejects(
        async () => {
          await submitHumanDecision(mockSubmission.id, {
            decision: 'APPROVED',
            reviewerName: '',
            comments: 'Approved',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.equal(err.status, 400);
          return true;
        }
      );
    });

    it('throws ApiClientError on 409 conflict when decision already exists', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ error: 'A final decision has already been recorded for this submission' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      };

      await assert.rejects(
        async () => {
          await submitHumanDecision(mockSubmission.id, {
            decision: 'APPROVED',
            reviewerName: 'Sarah Jenkins',
            comments: 'Second attempt',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiClientError);
          assert.equal(err.status, 409);
          return true;
        }
      );
    });
  });

  describe('fetchLatestDecision', () => {
    it('returns decision when present (200)', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ decision: mockDecision }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await fetchLatestDecision(mockSubmission.id);
      assert.ok(result);
      assert.equal(result.id, mockDecision.id);
      assert.equal(result.decision, 'APPROVED');
    });

    it('returns null cleanly when no decision exists (404)', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ error: 'Decision not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await fetchLatestDecision(mockSubmission.id);
      assert.equal(result, null);
    });
  });

  describe('fetchDecisionHistory', () => {
    it('retrieves chronological decision history for audit trail', async () => {
      let requestedUrl = '';
      globalThis.fetch = async (input: RequestInfo | URL) => {
        requestedUrl = String(input);
        return new Response(
          JSON.stringify({
            submissionId: mockSubmission.id,
            decisions: [
              {
                ...mockDecision,
                id: 'dec-1',
                decision: 'CHANGES_REQUESTED',
                comments: 'Please verify uptime stat.',
                createdAt: '2026-11-06T00:10:00.000Z',
              },
              {
                ...mockDecision,
                id: 'dec-2',
                decision: 'APPROVED',
                comments: 'Stat verified with proof source.',
                createdAt: '2026-11-06T00:30:00.000Z',
              },
            ],
            total: 2,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      };

      const result = await fetchDecisionHistory(mockSubmission.id);
      assert.ok(requestedUrl.includes(`/api/submissions/${mockSubmission.id}/decisions`));
      assert.equal(result.total, 2);
      assert.equal(result.decisions[0].decision, 'CHANGES_REQUESTED');
      assert.equal(result.decisions[1].decision, 'APPROVED');
    });
  });

  describe('Business Rules & State Guards', () => {
    it('identifies terminal statuses (APPROVED and REJECTED) vs active (REVIEWED)', () => {
      const isTerminal = (status: string) => status === 'APPROVED' || status === 'REJECTED';

      assert.equal(isTerminal('APPROVED'), true);
      assert.equal(isTerminal('REJECTED'), true);
      assert.equal(isTerminal('REVIEWED'), false);
      assert.equal(isTerminal('PENDING'), false);
    });

    it('manages issue override toggling idempotently', () => {
      let overrides: string[] = [];

      const toggle = (id: string) => {
        overrides = overrides.includes(id)
          ? overrides.filter((i) => i !== id)
          : [...overrides, id];
      };

      toggle('issue-1');
      assert.deepEqual(overrides, ['issue-1']);

      toggle('issue-2');
      assert.deepEqual(overrides, ['issue-1', 'issue-2']);

      toggle('issue-1');
      assert.deepEqual(overrides, ['issue-2']);
    });
  });
});
