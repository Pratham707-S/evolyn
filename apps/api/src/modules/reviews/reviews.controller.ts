import { randomUUID } from 'node:crypto';
import { rewriteContentSchema, uuidSchema } from '@evolyn/shared';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import type { ISubmissionService } from '../submissions/index.js';
import type { IReviewService } from './index.js';

export function sanitizeRequestId(rawHeader: unknown): string {
  if (!rawHeader) {
    return randomUUID();
  }

  const candidate = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

  if (typeof candidate !== 'string') {
    return randomUUID();
  }

  const trimmed = candidate.trim();
  // Safe token format: 1-64 chars of alphanumeric, hyphen, or underscore
  // Rejects CRLF newlines, control characters, spaces, HTML, and excessively long strings
  const SAFE_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
  if (!SAFE_ID_REGEX.test(trimmed)) {
    return randomUUID();
  }

  return trimmed;
}

const analyzeBodySchema = z
  .object({
    content: z.string().trim().min(1).optional(),
    force: z.boolean({
      invalid_type_error: 'force parameter must be a strict boolean (true or false)',
    }).optional(),
  })
  .passthrough();

export class ReviewsController {
  constructor(
    private readonly reviews: IReviewService,
    private readonly submissions: Pick<ISubmissionService, 'getSubmissionById'>
  ) {}

  analyze = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const requestId = sanitizeRequestId(
      req.headers ? req.headers['x-request-id'] : undefined
    );
    if (typeof res.setHeader === 'function') {
      res.setHeader('x-request-id', requestId);
    }

    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const parsedBody =
        req.body !== undefined && req.body !== null
          ? analyzeBodySchema.parse(req.body)
          : undefined;
      const content = parsedBody?.content;
      const force = parsedBody?.force;
      const reviewOptions =
        content !== undefined || force !== undefined
          ? {
              ...(content !== undefined ? { content } : {}),
              ...(force !== undefined ? { force } : {}),
            }
          : undefined;
      const result = await this.reviews.executeReview(submissionId, reviewOptions, requestId);
      res.status(200).json({
        reviewRunId: result.reviewRun.id,
        submissionId: result.reviewRun.submissionId,
        overallComplianceScore: result.reviewRun.overallComplianceScore,
        totalIssuesCount: result.reviewRun.totalIssuesCount,
        summary: result.reviewRun.summary,
        issues: result.issues,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Submission not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (
        error instanceof Error &&
        error.message.includes('cannot be analyzed in status')
      ) {
        res.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  getBySubmissionId = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const [submission, result] = await Promise.all([
        this.submissions.getSubmissionById(submissionId),
        this.reviews.getReviewBySubmissionId(submissionId),
      ]);

      if (!submission || !result) {
        res.status(404).json({ error: 'Review not found' });
        return;
      }

      res.status(200).json({
        submission,
        reviewRun: result.reviewRun,
        issues: result.issues,
        decision: submission.decision ?? null,
      });
    } catch (error) {
      next(error);
    }
  };

  getHistoryBySubmissionId = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const submission = await this.submissions.getSubmissionById(submissionId);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const reviews = this.reviews.getReviewHistory
        ? await this.reviews.getReviewHistory(submissionId)
        : [];

      res.status(200).json({
        submissionId,
        reviews,
        total: reviews.length,
      });
    } catch (error) {
      next(error);
    }
  };

  rewrite = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const requestId = sanitizeRequestId(
      req.headers ? req.headers['x-request-id'] : undefined
    );
    if (typeof res.setHeader === 'function') {
      res.setHeader('x-request-id', requestId);
    }
    const startMs = Date.now();

    try {
      const submissionId = uuidSchema.parse(req.params.id);
      const input = rewriteContentSchema.parse(req.body);
      const validationMs = Date.now() - startMs;

      if (!this.reviews.rewrite) {
        throw new Error('Review service does not support rewrite');
      }

      const rewriteStartMs = Date.now();
      const result = await this.reviews.rewrite(submissionId, input, requestId);
      const serviceMs = Date.now() - rewriteStartMs;
      const totalMs = Date.now() - startMs;

      // Structured Telemetry Log (Never log sensitive content or API keys)
      console.log(
        JSON.stringify({
          type: 'REWRITE_TELEMETRY',
          requestId,
          operation: input.action,
          modelId: env.GEMINI_MODEL,
          durations: {
            validationMs,
            serviceMs,
            totalMs,
          },
          httpStatus: 200,
          outcome: 'SUCCESS',
        })
      );

      res.status(200).json(result);
    } catch (error) {
      const totalMs = Date.now() - startMs;
      console.error(
        JSON.stringify({
          type: 'REWRITE_TELEMETRY',
          requestId,
          modelId: env.GEMINI_MODEL,
          durations: { totalMs },
          httpStatus: error instanceof Error && error.message.includes('not found') ? 404 : 500,
          outcome: 'FAILURE',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
      );

      if (
        error instanceof Error &&
        (error.message === 'Submission not found' ||
          error.message.startsWith('Submission not found:'))
      ) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      next(error);
    }
  };
}
