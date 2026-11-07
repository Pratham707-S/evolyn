/**
 * Intelligently cleans, unwraps, and formats raw extracted document text into
 * clean, publication-grade semantic HTML (headings, continuous paragraphs, lists, and metadata).
 */
export function cleanAndFormatPdfToHtml(raw: string): string {
  if (!raw) return '<p>Loading document content...</p>';

  // If already HTML, strip any legacy artifacts and return
  if (
    raw.includes('<p>') ||
    raw.includes('<h1>') ||
    raw.includes('<h2>') ||
    raw.includes('<h3>') ||
    raw.includes('<ul>') ||
    raw.includes('<ol>') ||
    raw.includes('<div>')
  ) {
    return raw
      .replace(/<p[^>]*>Page\s*\d+\s*Reference<\/p>/gi, '')
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      .replace(/<p[^>]*>.*\|\s*[A-Z\s]+Page\s*\d+.*<\/p>/gi, '');
  }

  // 1. Strip raw PDF page markers, running headers, and web-clipping artifacts
  let preprocessed = raw
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
  preprocessed = preprocessed.replace(/^(\d+)[\.]([A-Za-z])/gm, '$1. $2');

  // 3. Separate inline headings concatenated with paragraph body on the same line
  // e.g. "1. Context Ever wondered how websites keep..." -> "1. Context\n\nEver wondered how websites keep..."
  // e.g. "2. The Access Token An access token is the equivalent..." -> "2. The Access Token\n\nAn access token is the equivalent..."
  preprocessed = preprocessed.replace(
    /^(\d+[\.\)]\s+[A-Za-z0-9\s—–-]{2,30})\s+([A-Z][a-z].*)$/gm,
    '$1\n\n$2'
  );

  // 4. Split document into coherent paragraph/section blocks by double newlines (\n\n)
  const rawBlocks = preprocessed
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const finalHtmlBlocks: string[] = [];

  const isHeadingLine = (line: string): boolean => {
    // Numbered sections: "1. Context", "2. The Access Token", "Rule 1.1", etc.
    if (/^\d+[\.\)]\s+[A-Z]/.test(line)) return true;
    if (/^[IVXLCDM]+[\.\)]\s+[A-Z]/.test(line)) return true;
    if (line.startsWith('#')) return true;
    if (
      /^(Brand promise|Document purpose|Personality principles|Logo and visual usage|Voice, claims & evidence|Approved examples|Claims requiring review|Required review process|Sample campaign copy|Campaign headline|Campaign body|Reviewer test checklist|Suggested compliant direction|Approval requirements|Decision definitions|Test document metadata)$/i.test(
        line
      )
    ) {
      return true;
    }
    // Specific standard article sub-headings (short, title-case, no period at end)
    if (
      /^(Context|The Access Token|The Refresh Token|Storage|A Small Problem|In short:|In Short:|Summary|Conclusion|Overview|Background|Next Steps)$/i.test(
        line.trim()
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

  return finalHtmlBlocks.join('\n');
}
