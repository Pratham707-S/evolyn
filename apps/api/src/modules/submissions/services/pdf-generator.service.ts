export function generateSimplePdf(title: string, text: string): Buffer {
  const sanitize = (str: string) =>
    str
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

  const cleanText = text || 'No document content available.';
  const rawLines = cleanText.split('\n');
  const formattedLines: string[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      formattedLines.push('');
      continue;
    }
    // Simple line wrapping at 80 characters
    if (trimmed.length > 80) {
      let remaining = trimmed;
      while (remaining.length > 0) {
        formattedLines.push(remaining.substring(0, 80));
        remaining = remaining.substring(80);
      }
    } else {
      formattedLines.push(trimmed);
    }
  }

  const maxLinesPerPage = 38;
  const chunks: string[][] = [];
  for (let i = 0; i < formattedLines.length; i += maxLinesPerPage) {
    chunks.push(formattedLines.slice(i, i + maxLinesPerPage));
  }
  if (chunks.length === 0) chunks.push(['[Empty Document]']);

  let output = '%PDF-1.4\n';
  const offsets: number[] = [];

  const catalogObjNum = 1;
  const pagesObjNum = 2;
  let nextObjNum = 3;

  const pageObjNums: number[] = [];
  const contentObjNums: number[] = [];

  for (let i = 0; i < chunks.length; i++) {
    pageObjNums.push(nextObjNum++);
    contentObjNums.push(nextObjNum++);
  }

  // 1: Catalog
  offsets[catalogObjNum] = output.length;
  output += `${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`;

  // 2: Pages
  offsets[pagesObjNum] = output.length;
  output += `${pagesObjNum} 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => n + ' 0 R').join(' ')}] /Count ${pageObjNums.length} >>\nendobj\n`;

  for (let i = 0; i < chunks.length; i++) {
    const pageNum = pageObjNums[i];
    const contentNum = contentObjNums[i];
    const chunk = chunks[i];

    // Page object
    offsets[pageNum] = output.length;
    output += `${pageNum} 0 obj\n<< /Type /Page /Parent ${pagesObjNum} 0 R /MediaBox [0 0 612 792] /Contents ${contentNum} 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> >>\nendobj\n`;

    // Stream content
    let stream = 'BT\n/F2 13 Tf\n50 740 Td\n(' + sanitize(title) + ') Tj\nET\n';
    stream += 'BT\n/F1 10 Tf\n50 715 Td\n15 TL\n';
    for (const line of chunk) {
      if (line) {
        stream += '(' + sanitize(line) + ") '\n";
      } else {
        stream += "() '\n";
      }
    }
    stream += 'ET\n';

    offsets[contentNum] = output.length;
    output += `${contentNum} 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}endstream\nendobj\n`;
  }

  const startXref = output.length;
  output += `xref\n0 ${nextObjNum}\n0000000000 65535 f \n`;
  for (let i = 1; i < nextObjNum; i++) {
    output += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  output += `trailer\n<< /Size ${nextObjNum} /Root ${catalogObjNum} 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(output, 'utf8');
}
