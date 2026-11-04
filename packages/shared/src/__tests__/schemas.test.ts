import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGuidelineSchema,
  createSubmissionSchema,
  detectedIssueSchema,
  submitDecisionSchema,
  createApprovedFactSchema,
} from '../schemas.js';

describe('Shared Zod Schemas Validation', () => {
  describe('createGuidelineSchema', () => {
    it('accepts valid guideline payload', () => {
      const valid = {
        title: 'Evolyn Tone & Terminology Standard',
        category: 'TONE',
        version: '1.0',
        rawContent: 'All communications must be empathetic, direct, and authoritative.',
      };
      const result = createGuidelineSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('rejects guideline payload with missing title', () => {
      const invalid = {
        title: '',
        rawContent: 'Short content',
      };
      const result = createGuidelineSchema.safeParse(invalid);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.path.includes('title')));
      }
    });

    it('rejects guideline content shorter than 10 characters', () => {
      const invalid = {
        title: 'Brand Rules',
        rawContent: 'Too short',
      };
      const result = createGuidelineSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe('createSubmissionSchema', () => {
    it('applies default channel and submitter when omitted', () => {
      const payload = {
        title: 'Q4 Product Launch',
        rawText: 'This is the complete text for review exceeding ten chars.',
      };
      const result = createSubmissionSchema.safeParse(payload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.channel, 'WEBSITE');
        assert.equal(result.data.submittedBy, 'Judge / Reviewer');
      }
    });
  });

  describe('detectedIssueSchema', () => {
    it('requires verbatim sourceQuote to prevent AI hallucination', () => {
      const valid = {
        reviewRunId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        issueType: 'PROHIBITED_PHRASE',
        flaggedExcerpt: '100% risk-free',
        explanation: 'Guarantees of zero risk are prohibited by regulatory standards.',
        sourceQuote: 'Never use the phrase "risk-free" in external copy.',
        evidenceStrengthScore: 0.1,
      };
      const result = detectedIssueSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('rejects issue when sourceQuote is missing', () => {
      const invalid = {
        reviewRunId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        issueType: 'PROHIBITED_PHRASE',
        flaggedExcerpt: '100% risk-free',
        explanation: 'No quote provided',
      };
      const result = detectedIssueSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });

  describe('submitDecisionSchema', () => {
    it('accepts APPROVED, REJECTED, and CHANGES_REQUESTED', () => {
      for (const decision of ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'] as const) {
        const payload = {
          submissionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          decision,
          reviewerName: 'Lead Judge',
          comments: `Decision recorded as ${decision}`,
        };
        const result = submitDecisionSchema.safeParse(payload);
        assert.equal(result.success, true);
      }
    });

    it('rejects invalid decision strings', () => {
      const payload = {
        submissionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        decision: 'AUTO_APPROVE',
        reviewerName: 'Bot',
        comments: 'Invalid',
      };
      const result = submitDecisionSchema.safeParse(payload);
      assert.equal(result.success, false);
    });
  });

  describe('createApprovedFactSchema', () => {
    it('requires proof source for all factual claims', () => {
      const valid = {
        topic: 'Uptime',
        claimStatement: 'Platform has 99.98% uptime.',
        approvedProofSource: 'SOC 2 Type II Audit Report 2025, Page 14',
      };
      const result = createApprovedFactSchema.safeParse(valid);
      assert.equal(result.success, true);
    });

    it('rejects facts without an approved proof source', () => {
      const invalid = {
        topic: 'Uptime',
        claimStatement: 'Platform has 99.98% uptime.',
        approvedProofSource: '',
      };
      const result = createApprovedFactSchema.safeParse(invalid);
      assert.equal(result.success, false);
    });
  });
});
