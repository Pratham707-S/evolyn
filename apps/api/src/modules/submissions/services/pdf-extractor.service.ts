import { PDFParse } from 'pdf-parse';

export interface ExtractedPdfResult {
  text: string;
  numPages: number;
  metadata?: {
    title?: string;
    author?: string;
    producer?: string;
  };
}

export class PdfExtractorService {
  async extractText(buffer: Buffer): Promise<ExtractedPdfResult> {
    try {
      const parser = new PDFParse({ data: buffer });
      const [textData, infoData] = await Promise.all([
        parser.getText(),
        parser.getInfo().catch(() => null),
      ]);

      const text = (textData.text || '').trim();
      const numPages = textData.total || 1;

      return {
        text,
        numPages,
        metadata: {
          title: infoData?.info?.Title,
          author: infoData?.info?.Author,
          producer: infoData?.info?.Producer,
        },
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const pdfExtractorService = new PdfExtractorService();
