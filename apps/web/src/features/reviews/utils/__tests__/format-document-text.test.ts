import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanAndFormatPdfToHtml } from '../format-document-text';

describe('cleanAndFormatPdfToHtml', () => {
  it('correctly normalizes numbered headings without spaces like 1.Context into clean headings', () => {
    const input = `
Understanding how access and refresh tokens work

1.Context

Ever wondered how websites keep you logged in without asking for your password on every page?

Let me give you an analogy. Imagine going to a very strict school.

2.The Access Token

An access token is the equivalent of the day-pass I mentioned earlier.
    `;

    const html = cleanAndFormatPdfToHtml(input);

    assert.ok(html.includes('<h2>1. Context</h2>'), 'Should contain <h2>1. Context</h2>');
    assert.ok(html.includes('<h2>2. The Access Token</h2>'), 'Should contain <h2>2. The Access Token</h2>');
    assert.ok(
      html.includes('<p>Ever wondered how websites keep you logged in without asking for your password on every page?</p>'),
      'Should have separate paragraph'
    );
    assert.ok(
      html.includes('<p>Let me give you an analogy. Imagine going to a very strict school.</p>'),
      'Should have separate paragraph'
    );
  });

  it('separates inline headings that were concatenated with paragraph body on the same line', () => {
    const input = `1.Context Ever wondered how websites keep you logged in without asking for your password on every page?
2.The Access Token An access token is the equivalent of the day-pass I mentioned earlier.`;

    const html = cleanAndFormatPdfToHtml(input);

    assert.ok(html.includes('<h2>1. Context</h2>'), 'Should extract 1. Context heading');
    assert.ok(
      html.includes('<p>Ever wondered how websites keep you logged in without asking for your password on every page?</p>'),
      'Should separate paragraph'
    );
    assert.ok(html.includes('<h2>2. The Access Token</h2>'), 'Should extract 2. The Access Token heading');
  });

  it('preserves clean paragraph breaks without joining paragraphs together', () => {
    const input = `Paragraph one.

Paragraph two.

Paragraph three.`;

    const html = cleanAndFormatPdfToHtml(input);
    assert.equal(
      html,
      '<p>Paragraph one.</p>\n<p>Paragraph two.</p>\n<p>Paragraph three.</p>'
    );
  });

  it('marks open detected issues with .evolyn-issue-mark tags in the generated HTML', () => {
    const input = 'The clients machine is stored securely. But it\'s key was lost.';
    const issues = [
      {
        id: 'issue-1',
        reviewRunId: 'run-1',
        issueType: 'GRAMMAR_ERROR' as const,
        flaggedExcerpt: 'clients',
        suggestedFix: "client's",
        sourceQuote: 'Grammar rule',
        explanation: 'Missing possessive apostrophe',
        confidenceScore: 1,
        evidenceStrengthScore: 0,
        status: 'OPEN' as const,
      },
      {
        id: 'issue-2',
        reviewRunId: 'run-1',
        issueType: 'GRAMMAR_ERROR' as const,
        flaggedExcerpt: "it's",
        suggestedFix: 'its',
        sourceQuote: 'Grammar rule',
        explanation: 'Incorrect possessive form',
        confidenceScore: 1,
        evidenceStrengthScore: 0,
        status: 'OPEN' as const,
      },
      {
        id: 'issue-3',
        reviewRunId: 'run-1',
        issueType: 'GRAMMAR_ERROR' as const,
        flaggedExcerpt: 'key',
        suggestedFix: 'keys',
        sourceQuote: 'Grammar rule',
        explanation: 'Already resolved',
        confidenceScore: 1,
        evidenceStrengthScore: 0,
        status: 'ACCEPTED' as const,
      },
    ];

    const html = cleanAndFormatPdfToHtml(input, issues);
    assert.ok(html.includes('<mark class="evolyn-issue-mark" data-issue-id="issue-1" data-suggested-fix="client\'s" data-explanation="Missing possessive apostrophe" data-issue-type="GRAMMAR_ERROR">clients</mark>'));
    assert.ok(html.includes('<mark class="evolyn-issue-mark" data-issue-id="issue-2" data-suggested-fix="its" data-explanation="Incorrect possessive form" data-issue-type="GRAMMAR_ERROR">it\'s</mark>'));
    // Accepted issue-3 should NOT be marked
    assert.ok(!html.includes('data-issue-id="issue-3"'));
  });

  it('keeps multi-word numbered headings together and heals orphaned numbers', () => {
    const input = `The solution involves combining access tokens with refresh tokens.

3. The Refresh Token
A refresh token is a long-lived credential stored securely on the client machine.

2.

The Access Token
An access token is the equivalent of the day-pass I mentioned earlier.`;

    const html = cleanAndFormatPdfToHtml(input);

    assert.ok(html.includes('<h2>3. The Refresh Token</h2>'), 'Should contain <h2>3. The Refresh Token</h2>');
    assert.ok(html.includes('<h2>2. The Access Token</h2>'), 'Should heal orphaned 2. into <h2>2. The Access Token</h2>');
    assert.ok(!html.includes('<p>3.</p>'), 'Should never create isolated <p>3.</p>');
    assert.ok(!html.includes('<p>2.</p>'), 'Should never create isolated <p>2.</p>');
  });
});

