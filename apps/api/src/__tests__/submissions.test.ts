import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SubmissionService } from '../modules/submissions/submissions.service.js';
import type {
  DecisionRecord,
  ReviewRunRecord,
  SubmissionDetailsRecord,
  SubmissionRepository,
  SubmissionRecord,
} from '../modules/submissions/submissions.repository.js';

const submissionId = 'c0a80123-4567-4890-a123-456789abcdef';
const isZodError = (error: unknown): boolean =>
  error instanceof Error && error.name === 'ZodError';

function createSubmissionRecord(
  overrides: Partial<SubmissionRecord> = {}
): SubmissionRecord {
  const timestamp = new Date('2026-11-04T10:00:00.000Z');
  return {
    id: submissionId,
    title: 'Launch copy',
    channel: 'SOCIAL',
    rawText: 'Review this launch copy please.',
    fileUrl: null,
    submittedBy: 'Ayan',
    status: 'PENDING',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function createRepository(
  overrides: Partial<Pick<SubmissionRepository, 'create' | 'findById' | 'list' | 'updateStatus'>> = {}
): Pick<SubmissionRepository, 'create' | 'findById' | 'list' | 'updateStatus'> {
  return {
    create: async (input) =>
      createSubmissionRecord({
        ...input,
        id: submissionId,
        fileUrl: input.fileUrl ?? null,
        createdAt: new Date('2026-11-04T10:00:00.000Z'),
        updatedAt: new Date('2026-11-04T10:00:00.000Z'),
        status: 'PENDING',
      }),
    findById: async () => null,
    list: async () => [],
    updateStatus: async () => {},
    ...overrides,
  };
}

describe('SubmissionService', () => {
  it('creates validated submissions and applies shared-schema defaults', async () => {
    let receivedInput: Parameters<SubmissionRepository['create']>[0] | undefined;
    const service = new SubmissionService(
      createRepository({
        create: async (input) => {
          receivedInput = input;
          return createSubmissionRecord({
            title: input.title,
            channel: input.channel,
            rawText: input.rawText,
            fileUrl: input.fileUrl ?? null,
            submittedBy: input.submittedBy,
          });
        },
      })
    );

    const submission = await service.createSubmission({
      title: 'Launch copy',
      rawText: 'Review this launch copy please.',
    });

    assert.equal(receivedInput?.channel, 'WEBSITE');
    assert.equal(receivedInput?.submittedBy, 'Judge / Reviewer');
    assert.equal(submission.channel, 'WEBSITE');
    assert.equal(submission.createdAt, '2026-11-04T10:00:00.000Z');
  });

  it('rejects invalid submissions before calling persistence', async () => {
    let createCalled = false;
    const service = new SubmissionService(
      createRepository({
        create: async () => {
          createCalled = true;
          return createSubmissionRecord();
        },
      })
    );

    await assert.rejects(
      service.createSubmission({ title: '', rawText: 'too short' }),
      isZodError
    );
    assert.equal(createCalled, false);
  });

  it('validates filters and returns mapped submissions', async () => {
    const service = new SubmissionService(
      createRepository({ list: async () => [createSubmissionRecord()] })
    );

    const submissions = await service.listSubmissions({
      status: 'PENDING',
      channel: 'SOCIAL',
    });
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].id, submissionId);

    await assert.rejects(service.listSubmissions({ status: 'UNKNOWN' }), isZodError);
  });

  it('returns the submission with its latest review and decision', async () => {
    const timestamp = new Date('2026-11-04T10:00:00.000Z');
    const reviewRun: ReviewRunRecord = {
      id: 'd0a80123-4567-4890-a123-456789abcdef',
      submissionId,
      overallComplianceScore: 80,
      totalIssuesCount: 1,
      modelUsed: 'gemini-test',
      summary: { passedChecksCount: 4, failedChecksCount: 1 },
      createdAt: timestamp,
    };
    const decision: DecisionRecord = {
      id: 'e0a80123-4567-4890-a123-456789abcdef',
      submissionId,
      decision: 'APPROVED',
      reviewerName: 'Ayan',
      comments: 'Approved after review',
      overriddenIssueIds: [],
      createdAt: timestamp,
    };
    const details: SubmissionDetailsRecord = {
      submission: createSubmissionRecord(),
      reviewRun,
      decision,
    };
    const service = new SubmissionService(
      createRepository({ findById: async () => details })
    );

    const result = await service.getSubmissionById(submissionId);
    assert.equal(result?.reviewRun?.id, reviewRun.id);
    assert.equal(result?.decision?.decision, 'APPROVED');
    await assert.rejects(service.getSubmissionById('not-a-uuid'), isZodError);
  });

  it('updates status only for valid IDs and statuses', async () => {
    let updatedStatus = '';
    const service = new SubmissionService(
      createRepository({
        updateStatus: async (_id, status) => {
          updatedStatus = status;
        },
      })
    );

    await service.updateSubmissionStatus(submissionId, 'ANALYZING');
    assert.equal(updatedStatus, 'ANALYZING');
  });
});
