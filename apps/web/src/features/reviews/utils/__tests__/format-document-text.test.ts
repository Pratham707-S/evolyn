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
});
