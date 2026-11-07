import type { PdfTheme } from '../constants/pdf-themes';

export interface ExportStyledPdfOptions {
  title: string;
  contentHtml: string;
  channel?: string;
  theme: PdfTheme;
  includeComplianceBadge?: boolean;
  includeCoverHeader?: boolean;
  complianceScore?: number;
}

export function exportStyledPdf({
  title,
  contentHtml,
  channel = 'Document',
  theme,
  includeComplianceBadge = true,
  includeCoverHeader = true,
  complianceScore = 100,
}: ExportStyledPdfOptions): void {
  const cleanTitle = title || 'Brand Document';
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate approximate word count
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = contentHtml;
  const rawText = tempDiv.textContent || tempDiv.innerText || '';
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${cleanTitle} - Evolyn Export</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background-color: ${theme.paperBg};
      color: ${theme.textPrimary};
      font-family: ${theme.bodyFont};
      font-size: 11pt;
      line-height: 1.65;
    }
    .document-wrapper {
      max-width: 100%;
      margin: 0 auto;
    }
    .document-header {
      padding-bottom: 20px;
      margin-bottom: 24px;
      border-bottom: 1.5px solid ${theme.borderColor};
    }
    .top-meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 8.5pt;
      color: ${theme.textMuted};
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .badges-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 9999px;
      background-color: ${theme.badgeBg};
      color: ${theme.badgeText};
      font-size: 8pt;
      font-weight: 600;
      letter-spacing: 0.04em;
    }
    .compliance-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 6px;
      background-color: ${theme.badgeBg};
      color: ${theme.badgeText};
      font-size: 8.5pt;
      font-weight: 600;
      border: 1px solid ${theme.borderColor};
    }
    .document-title {
      font-family: ${theme.headingFont};
      font-size: 24pt;
      font-weight: 700;
      color: ${theme.accentColor};
      margin: 6px 0 10px;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }
    .sub-meta {
      font-size: 9pt;
      color: ${theme.textMuted};
      display: flex;
      gap: 16px;
    }
    /* Main Prose Styling */
    .content-body {
      color: ${theme.textPrimary};
    }
    .content-body h1, .content-body h2, .content-body h3 {
      font-family: ${theme.headingFont};
      color: ${theme.accentColor};
      font-weight: 700;
      page-break-after: avoid;
      break-after: avoid;
    }
    .content-body h1 {
      font-size: 18pt;
      margin-top: 24px;
      margin-bottom: 12px;
      border-bottom: 1px solid ${theme.borderColor};
      padding-bottom: 6px;
    }
    .content-body h2 {
      font-size: 14pt;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .content-body h3 {
      font-size: 12pt;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .content-body p {
      margin-top: 0;
      margin-bottom: 14px;
      text-align: justify;
    }
    .content-body ul, .content-body ol {
      margin-top: 0;
      margin-bottom: 14px;
      padding-left: 22px;
    }
    .content-body li {
      margin-bottom: 6px;
    }
    .content-body blockquote {
      margin: 16px 0;
      padding: 10px 16px;
      border-left: 3px solid ${theme.accentColor};
      background: ${theme.badgeBg};
      color: ${theme.textPrimary};
      font-style: italic;
    }
    /* Footer */
    .document-footer {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 1px solid ${theme.borderColor};
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 8pt;
      color: ${theme.textMuted};
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="document-wrapper">
    ${
      includeCoverHeader
        ? `
      <header class="document-header">
        <div class="top-meta-row">
          <span>Evolyn Brand Governance System</span>
          <div class="badges-group">
            <span class="badge">${channel.toUpperCase()}</span>
            ${
              includeComplianceBadge
                ? `<span class="compliance-badge">&#10003; ${complianceScore}% Brand Compliant</span>`
                : ''
            }
          </div>
        </div>
        <h1 class="document-title">${cleanTitle}</h1>
        <div class="sub-meta">
          <span>Date: ${formattedDate}</span>
          <span>Length: ${wordCount} words</span>
          <span>Status: Verified & Approved</span>
        </div>
      </header>
    `
        : ''
    }

    <main class="content-body">
      ${contentHtml}
    </main>

    <footer class="document-footer">
      <span>Verified & formatted by Evolyn Brand Governance Platform</span>
      <span>${cleanTitle} &bull; ${formattedDate}</span>
    </footer>
  </div>
</body>
</html>`;

  // Render via a hidden iframe for seamless vector PDF printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error invoking print dialog', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    }, 400);
  };
}
