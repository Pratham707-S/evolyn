import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ContentSubmission, DetectedIssue } from '@evolyn/shared';
import {
  applyDecisionToItems,
  configuredReviewerName,
  decisionPayload,
  filterApprovalQueue,
  mapIssuesToChanges,
  mapQueueSubmission,
} from '../lib/queue-mapping';

const baseSubmission: ContentSubmission = {
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  title: 'Q3 Product Launch Copy',
  channel: 'SOCIAL',
  rawText: 'Introducing our new AI-powered brand governance platform for marketing teams.',
  submittedBy: 'Jordan the Submitter',
  status: 'REVIEWED',
  createdAt: '2026-11-06T10:00:00.000Z',
  updatedAt: '2026-11-06T10:00:00.000Z',
};

describe('filterApprovalQueue', () => {
  it('keeps only REVIEWED submissions (queue excludes non-REVIEWED rows)', () => {
    const queue = filterApprovalQueue([
      baseSubmission,
      { ...baseSubmission, id: 'a', status: 'PENDING' },
      { ...baseSubmission, id: 'b', status: 'ANALYZING' },
      { ...baseSubmission, id: 'c', status: 'APPROVED' },
      { ...baseSubmission, id: 'd', status: 'REJECTED' },
    ]);
    assert.equal(queue.length, 1);
    assert.equal(queue[0].status, 'REVIEWED');
  });

  it('returns an empty list for empty input', () => {
    assert.deepEqual(filterApprovalQueue([]), []);
  });
});

describe('mapQueueSubmission', () => {
  it('never renders fabricated records for a live submission', () => {
    const item = mapQueueSubmission(baseSubmission);
    assert.equal(item.id, baseSubmission.id);
    assert.equal(item.title, baseSubmission.title);
    assert.equal(item.content, baseSubmission.rawText);
    // reviewer is NOT the submitter and NOT a hardcoded persona
    assert.equal(item.reviewerName, '—');
    assert.notEqual(item.reviewerName, baseSubmission.submittedBy);
    // review id is derived from the real server id
    assert.equal(item.reviewId, `Sub #${baseSubmission.id.slice(0, 8)}`);
  });

  it('maps REVIEWED to Pending, never to "Changes Requested"', () => {
    assert.equal(mapQueueSubmission(baseSubmission).decision, 'Pending');
  });

  it('maps APPROVED and REJECTED faithfully', () => {
    assert.equal(mapQueueSubmission({ ...baseSubmission, status: 'APPROVED' }).decision, 'Approved');
    assert.equal(mapQueueSubmission({ ...baseSubmission, status: 'REJECTED' }).decision, 'Rejected');
  });

  it('uses the real review run findings count and synthesizes nothing', () => {
    const item = mapQueueSubmission(baseSubmission, {
      id: 'rr-1',
      submissionId: baseSubmission.id,
      overallComplianceScore: 80,
      totalIssuesCount: 4,
      modelUsed: 'gemini',
      summary: { passedChecksCount: 10, failedChecksCount: 4 },
      createdAt: '2026-11-06T10:05:00.000Z',
    });
    assert.equal(item.findingsCount, 4);
    assert.equal(item.changes, undefined);
  });

  it('defaults findingsCount to 0 when no review run exists', () => {
    assert.equal(mapQueueSubmission(baseSubmission).findingsCount, 0);
  });
});

describe('mapIssuesToChanges', () => {
  const issue: DetectedIssue = {
    reviewRunId: 'rr-1',
    issueType: 'TERMINOLOGY_VIOLATION',
    flaggedExcerpt: 'eliminates 100% of risk',
    explanation: 'Absolute guarantee without evidence.',
    suggestedFix: 'helps reduce risk',
    sourceQuote: 'Grounded performance rule',
    confidenceScore: 0.9,
    evidenceStrengthScore: 0.5,
    status: 'OPEN',
  };

  it('uses the real flagged excerpt and suggested fix as the diff', () => {
    const [change] = mapIssuesToChanges([issue]);
    assert.equal(change.before, 'eliminates 100% of risk');
    assert.equal(change.after, 'helps reduce risk');
    assert.equal(change.description, 'Absolute guarantee without evidence.');
    assert.equal(change.title, 'TERMINOLOGY_VIOLATION');
  });

  it('marks only ACCEPTED issues as approved in review', () => {
    assert.equal(mapIssuesToChanges([issue])[0].isApproved, false);
    assert.equal(mapIssuesToChanges([{ ...issue, status: 'ACCEPTED' }])[0].isApproved, true);
    assert.equal(mapIssuesToChanges([{ ...issue, status: 'OVERRIDDEN' }])[0].isApproved, false);
  });

  it('does not invent an after value when no fix was suggested', () => {
    const [change] = mapIssuesToChanges([{ ...issue, suggestedFix: '' }]);
    assert.equal(change.after, undefined);
  });
});

describe('applyDecisionToItems', () => {
  const items = [mapQueueSubmission(baseSubmission), mapQueueSubmission({ ...baseSubmission, id: 'other-uuid' })];

  it('updates only the target item after a successful decision', () => {
    const next = applyDecisionToItems(items, baseSubmission.id, 'Approved', 'Ada R.', 'Just now');
    assert.equal(next[0].decision, 'Approved');
    assert.equal(next[0].reviewerName, 'Ada R.');
    assert.equal(next[0].date, 'Just now');
    // untouched row keeps its previous state
    assert.equal(next[1].decision, 'Pending');
    assert.equal(next[1].reviewerName, '—');
  });

  it('does not mutate the previous state array', () => {
    const snapshot = items.map((i) => ({ ...i }));
    applyDecisionToItems(items, baseSubmission.id, 'Rejected', 'Ada R.', 'Just now');
    assert.deepEqual(items, snapshot);
  });
});

describe('decisionPayload', () => {
  it('maps UI labels to API decision types', () => {
    assert.equal(decisionPayload('Approved', '', 'Ada').decision, 'APPROVED');
    assert.equal(decisionPayload('Rejected', '', 'Ada').decision, 'REJECTED');
    assert.equal(decisionPayload('Changes Requested', '', 'Ada').decision, 'CHANGES_REQUESTED');
  });

  it('always sends a non-empty comment as the API requires', () => {
    assert.equal(decisionPayload('Approved', 'looks good', 'Ada').comments, 'looks good');
    assert.equal(
      decisionPayload('Approved', '', 'Ada').comments,
      'Reviewed and recorded as Approved'
    );
  });
});

describe('configuredReviewerName', () => {
  it('falls back to a neutral configured identity, never a persona', () => {
    const name = configuredReviewerName();
    assert.equal(typeof name, 'string');
    assert.ok(name.length > 0);
  });
});
