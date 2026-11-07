import type { DetectedIssue } from '@evolyn/shared';

/**
 * Highlights active/open issues directly in HTML text nodes using <mark class="evolyn-issue-mark">.
 * Preserves existing HTML tags and attributes without unintended replacement.
 */
export function markIssuesInHtml(html: string, issues?: DetectedIssue[]): string {
  if (!html || !issues || issues.length === 0) return html;

  const activeIssues = issues.filter(
    (issue) =>
      issue.status !== 'ACCEPTED' &&
      issue.status !== 'OVERRIDDEN' &&
      issue.flaggedExcerpt &&
      issue.flaggedExcerpt.trim().length > 0
  );

  if (activeIssues.length === 0) return html;

  // Sort longest flaggedExcerpt first so sub-phrases do not preempt longer matches
  const sorted = [...activeIssues].sort(
    (a, b) => (b.flaggedExcerpt?.length || 0) - (a.flaggedExcerpt?.length || 0)
  );

  let result = html;

  for (const issue of sorted) {
    const rawExcerpt = issue.flaggedExcerpt.trim();
    const escaped = rawExcerpt
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/['’]/g, "['’]");
    const startsWithWord = /^\w/.test(rawExcerpt);
    const endsWithWord = /\w$/.test(rawExcerpt);
    const prefix = startsWithWord ? '\\b' : '';
    const suffix = endsWithWord ? '\\b' : '';
    const regex = new RegExp(`${prefix}(${escaped})${suffix}`, 'gi');

    const safeFix = (issue.suggestedFix || '').replace(/"/g, '&quot;');
    const safeExpl = (issue.explanation || '').replace(/"/g, '&quot;');
    const safeType = issue.issueType || 'GRAMMAR_ERROR';
    const issueId = issue.id || '';

    // Replace text in text nodes only, leaving HTML tags and existing <mark> tags untouched
    result = result.replace(/([^<]+)|(<[^>]+>)/g, (match, text, tag) => {
      if (tag) return tag;
      return text.replace(
        regex,
        (matchedText: string) =>
          `<mark class="evolyn-issue-mark" data-issue-id="${issueId}" data-suggested-fix="${safeFix}" data-explanation="${safeExpl}" data-issue-type="${safeType}">${matchedText}</mark>`
      );
    });
  }

  return result;
}

/**
 * Intelligently cleans, unwraps, and formats raw extracted document text into
 * clean, publication-grade semantic HTML (headings, continuous paragraphs, lists, and metadata).
 * Optionally decorates open issues with inline red squiggly error marks.
 */
export function cleanAndFormatPdfToHtml(raw: string, issues?: DetectedIssue[]): string {
  if (!raw) return '<p>Loading document content...</p>';

  // Check if raw is already cleanly structured HTML (multiple paragraphs AND headings without run-on text)
  const pMatches = raw.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  const hMatches = raw.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || [];
  // Only check for run-on numbered sections when glued inside a single <p> tag with preceding text
  const hasRunOnNumberedSections = /<p[^>]*>[^<]*?[a-zA-Z]{2,}[.!?][^\S\r\n]+\d+[\.\)][^\S\r\n]+[A-Z]/i.test(raw);
  const isWellStructuredHtml = pMatches.length >= 3 && hMatches.length >= 2 && !hasRunOnNumberedSections;

  if (isWellStructuredHtml) {
    const cleaned = raw
      .replace(/<p[^>]*>Page\s*\d+\s*Reference<\/p>/gi, '')
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      .replace(/<p[^>]*>.*\|\s*[A-Z\s]+Page\s*\d+.*<\/p>/gi, '');
    return markIssuesInHtml(cleaned, issues);
  }

  // 1. Convert any incoming HTML tags into clean newline breaks
  let preprocessed = raw
    .replace(/<\/?(?:h[1-6]|p|div|section|blockquote)[^>]*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n\n')
    .replace(/---\s*Page\s*(\d+)(?:\s*of\s*\d+)?\s*---/gi, '\n\n')
    .replace(/--\s*Page\s*(\d+)\s*--/gi, '\n\n')
    .replace(/--\s*(\d+)\s*of\s*(\d+)\s*--/gi, '\n\n')
    .replace(/Page\s+(\d+)\s+of\s+(\d+)/gi, '')
    .replace(/^.*\|\s*[A-Z\s]+Page\s*\d+.*$/gim, '')
    .replace(/^Page\s*\d+\s*Reference.*$/gim, '')
    .replace(/Press enter or click to view image in full size/gi, '')
    .trim();

  // 2. Normalize numbered headings without spaces (e.g. "1.Context" -> "1. Context", "2.The Access Token" -> "2. The Access Token")
  preprocessed = preprocessed.replace(/(\d+)[\.]([A-Za-z])/g, '$1. $2');

  // 3. Separate inline numbered headings concatenated with previous sentence on the same line
  // ONLY match when preceded by end of a sentence word ([a-zA-Z]{2,}[.!?]), using horizontal whitespace [^\S\r\n]+
  // e.g. "every page. 1. Context. Web applications" -> "every page.\n\n1. Context\n\nWeb applications"
  preprocessed = preprocessed.replace(
    /([a-zA-Z]{2,}[.!?])[^\S\r\n]+(\d+[\.\)][^\S\r\n]+(?:Context|The Access Token|The Refresh Token|Storage|[A-Za-z0-9—–-]+(?:\s+[A-Za-z0-9—–-]+){0,4})\.?)[^\S\r\n]+([A-Z](?:[a-z]+)?(?:\s+[a-zA-Z0-9,;—–-]+){2,})/g,
    '$1\n\n$2\n\n$3'
  );

  // 4. Separate inline conceptual headings concatenated with previous sentence on the same line
  preprocessed = preprocessed.replace(
    /([a-zA-Z]{2,}[.!?])[^\S\r\n]+((?:Balancing Security and Usability|Potential Usability Challenges|A Small Problem|The Solution|To recap:?|In [Ss]hort:?|Summary|Conclusion|Storage)\.?)[^\S\r\n]+([A-Z](?:[a-z]+)?(?:\s+[a-zA-Z0-9,;—–-]+){2,})/g,
    '$1\n\n$2\n\n$3'
  );

  // 5. Separate inline numbered heading starting a line concatenated with its paragraph body
  // e.g. "1. Context Ever wondered how websites keep..." -> "1. Context\n\nEver wondered how websites keep..."
  // e.g. "2. The Access Token An access token is the equivalent..." -> "2. The Access Token\n\nAn access token is the equivalent..."
  preprocessed = preprocessed.replace(
    /^(\d+[\.\)][^\S\r\n]+(?:Context|The Access Token|The Refresh Token|Storage|[A-Za-z0-9—–-]+(?:\s+[A-Za-z0-9—–-]+){0,4})\.?)[^\S\r\n]+([A-Z](?:[a-z]+)?(?:\s+[a-zA-Z0-9,;—–-]+){3,}.*)$/gm,
    '$1\n\n$2'
  );

  // 6. Split document into coherent paragraph/section blocks by double newlines (\n\n)
  const rawBlocks = preprocessed
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  // Heal any accidentally orphaned numbers (e.g. solitary "1.", "2.", "3.") by re-attaching them to the next block
  for (let i = 0; i < rawBlocks.length - 1; i++) {
    if (/^\d+[\.\)]\s*$/.test(rawBlocks[i])) {
      rawBlocks[i + 1] = rawBlocks[i] + ' ' + rawBlocks[i + 1];
      rawBlocks.splice(i, 1);
      i--;
    }
  }

  // Heal broken multi-word headings where the last word was wrapped onto a separate line (e.g. "3. The Refresh" + "Token")
  for (let i = 0; i < rawBlocks.length - 1; i++) {
    if (
      /^\d+[\.\)]\s+[A-Za-z0-9\s—–-]{1,20}$/.test(rawBlocks[i]) &&
      /^(Token|Storage|Process|Policy|Standard|Requirements|Guide)\b/i.test(rawBlocks[i + 1])
    ) {
      rawBlocks[i] = rawBlocks[i] + ' ' + rawBlocks[i + 1];
      rawBlocks.splice(i + 1, 1);
    }
  }

  const finalHtmlBlocks: string[] = [];

  const isHeadingLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Solitary number like "2." or "3." is NEVER a heading
    if (/^\d+[\.\)]\s*$/.test(trimmed)) return false;

    // Numbered sections: "1. Context", "2. The Access Token", "3. The Refresh Token", "Rule 1.1", etc.
    if (/^\d+[\.\)]\s+[A-Z]/.test(trimmed)) return true;
    if (/^[IVXLCDM]+[\.\)]\s+[A-Z]/.test(trimmed)) return true;
    if (trimmed.startsWith('#')) return true;
    if (
      /^(Brand promise|Document purpose|Personality principles|Logo and visual usage|Voice, claims & evidence|Approved examples|Claims requiring review|Required review process|Sample campaign copy|Campaign headline|Campaign body|Reviewer test checklist|Suggested compliant direction|Approval requirements|Decision definitions|Test document metadata)$/i.test(
        trimmed
      )
    ) {
      return true;
    }
    // Specific standard article sub-headings (short, title-case, no period at end)
    if (
      /^(Context|The Access Token|The Refresh Token|Potential Usability Challenges|Balancing Security and Usability|Storage|A Small Problem|In short:|In Short:|Summary|Conclusion|Overview|Background|Next Steps)$/i.test(
        trimmed
      )
    ) {
      return true;
    }
    // Major all-caps section titles (e.g. BRAND GUIDELINES & GOVERNANCE STANDARD)
    if (
      line === line.toUpperCase() &&
      line.length >= 6 &&
      line.length <= 65 &&
      !line.endsWith('.') &&
      !line.includes('HTTP') &&
      !/^(DELAYS|Page|Date)/i.test(line)
    ) {
      return true;
    }
    // Standalone short title-case line without ending punctuation (< 45 chars)
    if (
      line.length < 45 &&
      /^[A-Z][a-zA-Z0-9\s—–-]{2,44}$/.test(line) &&
      !/[.!?,:;]$/.test(line) &&
      !/^(and|or|but|however|therefore|because|so|if|when|while|as|with|at|from|by|to|for|in|on)\b/i.test(
        line
      )
    ) {
      return true;
    }
    return false;
  };

  for (const block of rawBlocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) continue;

    // Heal solitary orphaned numbers inside a block (e.g. ["2.", "The Access Token"])
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d+[\.\)]\s*$/.test(lines[i])) {
        lines[i + 1] = lines[i] + ' ' + lines[i + 1];
        lines.splice(i, 1);
        i--;
      }
    }

    // Single line block check
    if (lines.length === 1) {
      const line = lines[0];

      // List item
      if (/^[•\-*]\s+/.test(line)) {
        finalHtmlBlocks.push(`<ul><li>${line.replace(/^[•\-*]\s+/, '')}</li></ul>`);
        continue;
      }

      // Standalone Heading
      if (isHeadingLine(line)) {
        const cleanHeading = line.replace(/^#+\s*/, '');
        // Major title vs Subtitle
        if (cleanHeading.length < 25 && /^\d+[\.\)]/i.test(cleanHeading)) {
          finalHtmlBlocks.push(`<h2>${cleanHeading}</h2>`);
        } else if (/^[A-Z\s]{6,}$/.test(cleanHeading)) {
          finalHtmlBlocks.push(`<h2>${cleanHeading}</h2>`);
        } else {
          finalHtmlBlocks.push(`<h3>${cleanHeading}</h3>`);
        }
        continue;
      }

      // Metadata callout
      if (
        /^(Version|Owner|Effective date|Brand|Document type|Prepared|Intended use|Confidentiality):/i.test(
          line
        )
      ) {
        finalHtmlBlocks.push(
          `<p style="margin: 14px 0; padding: 6px 12px; background: #F1EFE8; border-radius: 6px; font-size: 11px; color: #68745D; font-weight: 500;">${line}</p>`
        );
        continue;
      }

      // Standalone Quote
      if (
        (line.startsWith('“') || line.startsWith('"')) &&
        (line.endsWith('”') || line.endsWith('"')) &&
        line.length > 15
      ) {
        finalHtmlBlocks.push(`<blockquote>${line}</blockquote>`);
        continue;
      }

      // Normal single paragraph
      finalHtmlBlocks.push(`<p>${line}</p>`);
      continue;
    }

    // Multiple lines within the same block
    // Check if the block is a list
    const isAllListItems = lines.every((l) => /^[•\-*]\s+/.test(l) || /^\d+\.\s+/.test(l));
    if (isAllListItems) {
      const isNumbered = lines.some((l) => /^\d+\.\s+/.test(l));
      const tag = isNumbered ? 'ol' : 'ul';
      const items = lines
        .map((l) => `<li>${l.replace(/^([•\-*]|\d+\.)\s+/, '')}</li>`)
        .join('');
      finalHtmlBlocks.push(`<${tag}>${items}</${tag}>`);
      continue;
    }

    // Process lines inside this block, separating headings from paragraph body
    let currentPara: string[] = [];

    const flushPara = () => {
      if (currentPara.length > 0) {
        finalHtmlBlocks.push(`<p>${currentPara.join(' ')}</p>`);
        currentPara = [];
      }
    };

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j];

      // If line is a heading inside a block
      if (isHeadingLine(line)) {
        flushPara();
        const cleanHeading = line.replace(/^#+\s*/, '');
        finalHtmlBlocks.push(`<h2>${cleanHeading}</h2>`);
        continue;
      }

      // If line is a list item inside a block
      if (/^[•\-*]\s+/.test(line)) {
        flushPara();
        finalHtmlBlocks.push(`<ul><li>${line.replace(/^[•\-*]\s+/, '')}</li></ul>`);
        continue;
      }

      // Unwrap wrapped sentences inside the paragraph
      currentPara.push(line);
    }

    flushPara();
  }

  return markIssuesInHtml(finalHtmlBlocks.join('\n'), issues);
}
