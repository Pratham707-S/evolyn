import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { guidelineCategorySchema, guidelineStatusSchema, uuidSchema } from '@evolyn/shared';

import type { IGuidelineService } from './index.js';
import { guidelinesService } from './guidelines.service.js';

export const guidelineQuerySchema = z.object({
  category: guidelineCategorySchema.optional(),
  status: guidelineStatusSchema.optional(),
});

export const extractRulesParamsSchema = z.object({
  id: uuidSchema,
});

export const extractRulesBodySchema = z
  .object({})
  .strict({ message: 'Request body must not contain fields. Rule extraction strictly uses stored canonical guideline content.' });

type GuidelinesControllerService = IGuidelineService;

export function createGuidelinesController(
  service: GuidelinesControllerService = guidelinesService,
) {
  // POST: Create a new guideline
  const createGuideline = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const guideline = await service.createGuideline(req.body);

      return res.status(201).json(guideline);
    } catch (error) {
      return next(error);
    }
  };

  // GET: Retrieve all guidelines with optional filters
  const getGuidelines = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const validatedQuery = guidelineQuerySchema.parse(req.query);

      const guidelines = await service.getGuidelines(validatedQuery);

      return res.status(200).json(guidelines);
    } catch (error) {
      return next(error);
    }
  };

  // GET: Retrieve one guideline with associated rules
  const getGuidelineById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const guideline = await service.getGuidelineById(req.params.id);

      if (!guideline) {
        return res.status(404).json({
          error: 'Guideline not found',
        });
      }

      return res.status(200).json(guideline);
    } catch (error) {
      return next(error);
    }
  };

  // POST: Extract and persist atomic rules for a guideline from canonical stored content
  const extractRules = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { id } = extractRulesParamsSchema.parse(req.params);

      // Disallow arbitrary caller-provided request body (rawContent overrides)
      if (req.body && Object.keys(req.body).length > 0) {
        extractRulesBodySchema.parse(req.body);
      }

      const rules = await service.extractAndSaveRules(id);

      return res.status(200).json({
        guidelineId: id,
        rules,
        total: rules.length,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Guideline not found') {
        return res.status(404).json({
          error: 'Guideline not found',
        });
      }

      if (
        error instanceof Error &&
        (error.message === 'Guideline content cannot be empty' ||
          error.message === 'No atomic rules could be extracted from the guideline content')
      ) {
        return res.status(400).json({
          error: error.message,
        });
      }

      return next(error);
    }
  };

  return {
    createGuideline,
    getGuidelines,
    getGuidelineById,
    extractRules,
  };
}

export const guidelinesController = createGuidelinesController();
