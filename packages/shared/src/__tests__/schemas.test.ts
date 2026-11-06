import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGuidelineSchema,
  createSubmissionSchema,
  detectedIssueSchema,
  submitDecisionSchema,
  createApprovedFactSchema,
  rewriteContentSchema,
  rewriteResponseSchema,
} from '../schemas.js';
import { REWRITE_ACTIONS } from '../constants.js';

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

  describe('rewriteContentSchema', () => {
    it('accepts valid input for all eight supported actions', () => {
      for (const action of REWRITE_ACTIONS) {
        const payload = {
          action,
          content: 'This is authentic brand content to be edited and improved.',
          instructions: 'Keep voice authoritative and concise.',
        };
        const result = rewriteContentSchema.safeParse(payload);
        assert.equal(result.success, true);
      }
    });

    it('rejects invalid action strings', () => {
      const payload = {
        action: 'MAKE_FUNNY',
        content: 'Valid content that has enough length.',
      };
      const result = rewriteContentSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.path.includes('action')));
      }
    });

    it('rejects missing content', () => {
      const payload = {
        action: 'MAKE_SHORTER',
      };
      const result = rewriteContentSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.path.includes('content')));
      }
    });

    it('rejects empty content and whitespace-only content', () => {
      assert.equal(
        rewriteContentSchema.safeParse({ action: 'SIMPLIFY', content: '' }).success,
        false
      );
      assert.equal(
        rewriteContentSchema.safeParse({ action: 'SIMPLIFY', content: '   \n\t  ' }).success,
        false
      );
    });

    it('rejects content exceeding length limit', () => {
      const payload = {
        action: 'HUMANIZE',
        content: 'x'.repeat(50001),
      };
      const result = rewriteContentSchema.safeParse(payload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(result.error.errors.some((e) => e.path.includes('content')));
      }
    });

    it('rejects instructions exceeding 1000 characters', () => {
      const payload = {
        action: 'CHANGE_TONE',
        content: 'Valid content.',
        instructions: 'a'.repeat(1001),
      };
      const result = rewriteContentSchema.safeParse(payload);
      assert.equal(result.success, false);
    });
  });

  describe('rewriteResponseSchema', () => {
    it('accepts valid rewrite responses', () => {
      const payload = {
        originalText: 'Raw input content.',
        rewrittenText: 'Polished brand-compliant copy.',
        action: 'IMPROVE_WRITING',
        rationale: 'Enhanced sentence structure and removed ambiguous qualifiers.',
      };
      const result = rewriteResponseSchema.safeParse(payload);
      assert.equal(result.success, true);
    });

    it('rejects empty rewrittenText or rationale', () => {
      assert.equal(
        rewriteResponseSchema.safeParse({
          originalText: 'Original',
          rewrittenText: '',
          action: 'IMPROVE_WRITING',
          rationale: 'Valid rationale',
        }).success,
        false
      );
      assert.equal(
        rewriteResponseSchema.safeParse({
          originalText: 'Original',
          rewrittenText: 'Valid rewritten',
          action: 'IMPROVE_WRITING',
          rationale: '',
        }).success,
        false
      );
    });
  });
});
