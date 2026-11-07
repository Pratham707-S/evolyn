/**
 * Intelligently cleans, unwraps, and formats raw extracted document text into
 * clean, publication-grade semantic HTML (headings, continuous paragraphs, lists, and metadata).
 */
export function cleanAndFormatPdfToHtml(raw: string): string {
  if (!raw) return '<p>Loading document content...</p>';

  // If already HTML, strip any legacy "Page X Reference" badges, empty paragraphs, and return
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

  // 1. Strip raw PDF page markers and running headers
  const cleaned = raw
    .replace(/\f/g, '\n\n')
    .replace(/---\s*Page\s*(\d+)(?:\s*of\s*\d+)?\s*---/gi, '\n\n')
    .replace(/--\s*Page\s*(\d+)\s*--/gi, '\n\n')
    .replace(/--\s*(\d+)\s*of\s*(\d+)\s*--/gi, '\n\n')
    .replace(/Page\s+(\d+)\s+of\s+(\d+)/gi, '')
    // Strip repetitive running headers like "NOVARA | BRAND GOVERNANCE TEST DOCUMENT Page 1"
    .replace(/^.*\|\s*[A-Z\s]+Page\s*\d+.*$/gim, '')
    .replace(/^Page\s*\d+\s*Reference.*$/gim, '')
    .trim();

  const lines = cleaned
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const blocks: string[] = [];
  let currentPara: string[] = [];
  let currentList: string[] = [];
  let listType: 'ul' | 'ol' = 'ul';

  const flushList = () => {
    if (currentList.length > 0) {
      const tag = listType;
      blocks.push(`<${tag}>${currentList.map((li) => `<li>${li}</li>`).join('')}</${tag}>`);
      currentList = [];
    }
  };

  const flushPara = () => {
    if (currentPara.length > 0) {
      blocks.push(`<p>${currentPara.join(' ')}</p>`);
      currentPara = [];
    }
  };

  const isHeading = (l: string): boolean => {
    if (/^\d+\.\s+[A-Z]/.test(l)) return true;
    if (
      /^(Brand promise|Document purpose|Personality principles|Logo and visual usage|Voice, claims & evidence|Approved examples|Claims requiring review|Required review process|Sample campaign copy|Campaign headline|Campaign body|Reviewer test checklist|Suggested compliant direction|Approval requirements|Decision definitions|Test document metadata)$/i.test(
        l
      )
    )
      return true;
    if (l.startsWith('#')) return true;
    // Major all-caps section titles (e.g. BRAND GUIDELINES & GOVERNANCE STANDARD)
    if (
      l === l.toUpperCase() &&
      l.length >= 8 &&
      l.length <= 65 &&
      !l.endsWith('.') &&
      !l.includes('HTTP') &&
      !/^(DELAYS|Page|Date)/i.test(l)
    )
      return true;
    return false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Bullet list items
    if (/^[•\-*]\s+/.test(line)) {
      flushPara();
      if (listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(line.replace(/^[•\-*]\s+/, ''));
      continue;
    }

    // 2. Numbered list items (e.g. 1. Identify..., 2. Locate...)
    const numListMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numListMatch && !isHeading(line)) {
      flushPara();
      if (listType !== 'ol') flushList();
      listType = 'ol';
      currentList.push(numListMatch[2]);
      continue;
    }

    // 3. Headings
    if (isHeading(line)) {
      flushList();
      flushPara();
      const cleanHeading = line.replace(/^#+\s*/, '');
      blocks.push(`<h2>${cleanHeading}</h2>`);
      continue;
    }

    // 4. Standalone metadata line (e.g. Version: 1.2 Owner: Brand Operations)
    if (/^(Version|Owner|Effective date|Brand|Document type|Prepared|Intended use|Confidentiality):/i.test(line)) {
      flushList();
      flushPara();
      blocks.push(
        `<p style="margin: 12px 0; padding: 6px 12px; background: #F1EFE8; border-radius: 6px; font-size: 11px; color: #68745D; font-weight: 500;">${line}</p>`
      );
      continue;
    }

    // 5. Standalone quotes
    if (
      (line.startsWith('“') || line.startsWith('"')) &&
      (line.endsWith('”') || line.endsWith('"')) &&
      line.length > 15
    ) {
      flushList();
      flushPara();
      blocks.push(`<blockquote>${line}</blockquote>`);
      continue;
    }

    flushList();

    // 6. Sentence healing & Paragraph unwrapping
    if (currentPara.length > 0) {
      const prev = currentPara[currentPara.length - 1];
      const prevEndsSentence = /[.?!:]$/.test(prev);
      const isNextTitleCase = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)+$/.test(line) && line.length < 35;

      if (!prevEndsSentence && !isNextTitleCase) {
        // Line continuation of current sentence - join smoothly with single space
        currentPara.push(line);
      } else {
        // Complete sentence boundary or distinct idea
        flushPara();
        currentPara.push(line);
      }
    } else {
      currentPara.push(line);
    }
  }

  flushList();
  flushPara();

  return blocks.join('\n');
}

