import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { guidelineCategorySchema, guidelineStatusSchema } from '@evolyn/shared';

import type { IGuidelineService } from './index.js';
import { guidelinesService } from './guidelines.service.js';

export const guidelineQuerySchema = z.object({
  category: guidelineCategorySchema.optional(),
  status: guidelineStatusSchema.optional(),
});

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

  return {
    createGuideline,
    getGuidelines,
    getGuidelineById,
  };
}

export const guidelinesController = createGuidelinesController();
