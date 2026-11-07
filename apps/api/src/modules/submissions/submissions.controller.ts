import {
  submissionChannelSchema,
  submissionStatusSchema,
  uuidSchema,
} from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import type { ISubmissionService } from './index.js';
import { SubmissionService, submissionService } from './submissions.service.js';
import { localStorageProvider } from '../../infrastructure/storage/local.storage.js';
import { pdfExtractorService } from './services/pdf-extractor.service.js';
import { urlExtractorService } from './services/url-extractor.service.js';

const listSubmissionsQuerySchema = z.object({
  status: submissionStatusSchema.optional(),
  channel: submissionChannelSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(10),
});

const submissionParamsSchema = z.object({
  id: uuidSchema,
});

const extractUrlSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  channel: submissionChannelSchema.default('WEBSITE'),
  submittedBy: z.string().default('web-importer'),
});

export class SubmissionController {
  constructor(private readonly service: ISubmissionService = submissionService) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submission = await this.service.createSubmission(req.body);
      res.status(201).json({ submission });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = listSubmissionsQuerySchema.parse(req.query);
      const allSubmissions = await this.service.listSubmissions({
        status: query.status,
        channel: query.channel,
      });

      // Filter by search query if provided
      let filtered = allSubmissions;
      if (query.search && query.search.trim().length > 0) {
        const searchLower = query.search.toLowerCase().trim();
        filtered = allSubmissions.filter(
          (s) =>
            s.title.toLowerCase().includes(searchLower) ||
            s.rawText.toLowerCase().includes(searchLower) ||
            s.channel.toLowerCase().includes(searchLower)
        );
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
      const startIndex = (query.page - 1) * query.pageSize;
      const paginated = filtered.slice(startIndex, startIndex + query.pageSize);

      res.status(200).json({
        submissions: paginated,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = submissionParamsSchema.parse(req.params);
      const submission = await this.service.getSubmissionById(id);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      res.status(200).json({ submission });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = submissionParamsSchema.parse(req.params);
      const { rawText, title, status } = req.body || {};
      if (typeof this.service.updateSubmission !== 'function') {
        res.status(501).json({ error: 'Update not supported by service implementation' });
        return;
      }
      const submission = await this.service.updateSubmission(id, {
        rawText,
        title,
        status,
      });
      res.status(200).json({ submission });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (process.env.DISABLE_SUBMISSION_DELETION === 'true') {
        res.status(403).json({
          error: 'Submission deletion is disabled by administrative policy.',
        });
        return;
      }
      const { id } = submissionParamsSchema.parse(req.params);
      if (typeof this.service.deleteSubmission !== 'function') {
        res.status(501).json({ error: 'Delete not supported by service implementation' });
        return;
      }
      const deleted = await this.service.deleteSubmission(id);
      if (!deleted) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      res.status(200).json({ success: true, message: 'Submission deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  deleteMany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (process.env.DISABLE_SUBMISSION_DELETION === 'true') {
        res.status(403).json({
          error: 'Submission deletion is disabled by administrative policy.',
        });
        return;
      }
      const bodySchema = z.object({
        ids: z.array(uuidSchema).min(1, 'At least one submission ID is required for bulk delete'),
      });
      const { ids } = bodySchema.parse(req.body);
      if (typeof this.service.deleteSubmissions !== 'function') {
        res.status(501).json({ error: 'Bulk delete not supported by service implementation' });
        return;
      }
      const deletedCount = await this.service.deleteSubmissions(ids);
      res.status(200).json({
        success: true,
        deletedCount,
        message: `Successfully deleted ${deletedCount} submission(s)`,
      });
    } catch (error) {
      next(error);
    }
  };

  getFile = async (req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = submissionParamsSchema.parse(req.params);
      const submission = await this.service.getSubmissionById(id);
      if (!submission || !submission.fileUrl) {
        res.status(404).json({ error: 'No PDF file associated with this submission' });
        return;
      }

      if (submission.fileUrl.startsWith('data:')) {
        const [header, base64Data] = submission.fileUrl.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const contentType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const buffer = Buffer.from(base64Data, 'base64');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `inline; filename="${submission.title || 'document'}.pdf"`);
        res.send(buffer);
        return;
      }

      res.redirect(submission.fileUrl);
    } catch (error) {
      next(error);
    }
  };

  uploadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No file uploaded. Please upload a PDF file.' });
        return;
      }

      if (file.mimetype !== 'application/pdf') {
        res.status(400).json({ error: 'Invalid file type. Only PDF documents are supported.' });
        return;
      }

      const title = req.body.title || file.originalname.replace(/\.pdf$/i, '');
      const parsedChannel = submissionChannelSchema.safeParse(req.body.channel);
      const channel = parsedChannel.success ? parsedChannel.data : 'WEBSITE';
      const submittedBy = req.body.submittedBy || 'pdf-uploader';

      // 1. Save original PDF
      const uniqueFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const fileUrl = await localStorageProvider.uploadFile(file.buffer, uniqueFilename, {
        filename: uniqueFilename,
        contentType: 'application/pdf',
      });

      // 2. Extract text from PDF
      const extracted = await pdfExtractorService.extractText(file.buffer);

      if (!extracted.text || extracted.text.trim().length === 0) {
        res.status(400).json({
          error: 'PDF contains no readable text or is image-only. Please provide a text-based PDF.',
        });
        return;
      }

      // 3. Create persistent Content Submission
      const submission = await this.service.createSubmission({
        title,
        channel,
        rawText: extracted.text,
        fileUrl,
        submittedBy,
      });

      res.status(201).json({
        submission,
        extractedText: extracted.text,
        numPages: extracted.numPages,
        fileUrl,
        metadata: extracted.metadata,
      });
    } catch (error) {
      next(error);
    }
  };

  extractUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = extractUrlSchema.parse(req.body);

      // Extract web page content with SSRF checks
      const extracted = await urlExtractorService.extractContent(input.url);

      const title = input.title && input.title.trim().length > 0 ? input.title : extracted.title;

      // Create persistent Content Submission
      const submission = await this.service.createSubmission({
        title,
        channel: input.channel,
        rawText: extracted.content,
        fileUrl: input.url,
        submittedBy: input.submittedBy,
      });

      res.status(201).json({
        submission,
        extracted: {
          url: extracted.url,
          title: extracted.title,
          contentLength: extracted.content.length,
        },
      });
    } catch (error: any) {
      if (error.message && (error.message.includes('restricted') || error.message.includes('blocked'))) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}

export const submissionController = new SubmissionController(submissionService);
