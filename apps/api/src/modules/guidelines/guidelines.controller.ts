import type { Request, Response, NextFunction } from 'express';

import type { IGuidelineService } from './index.js';
import { guidelinesService } from './guidelines.service.js';

type GuidelinesControllerService = Pick<
  IGuidelineService,
  'createGuideline' | 'getGuidelines' | 'getGuidelineById'
>;

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
      const { category, status } = req.query;

      if (
        (category !== undefined && typeof category !== 'string') ||
        (status !== undefined && typeof status !== 'string')
      ) {
        return res.status(400).json({
          error: 'Invalid query parameters',
        });
      }

      const guidelines = await service.getGuidelines({
        ...(category !== undefined ? { category } : {}),
        ...(status !== undefined ? { status } : {}),
      });

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
