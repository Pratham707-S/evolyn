import type { Request, Response, NextFunction } from 'express';
import {
  brandGovernanceService,
  type IBrandGovernanceService,
} from './brand-governance.service.js';

export function createBrandGovernanceController(
  service: IBrandGovernanceService = brandGovernanceService
) {
  const getContext = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const context = await service.getGovernanceContext();
      return res.status(200).json(context);
    } catch (error) {
      return next(error);
    }
  };

  const evaluate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await service.evaluateContent(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  return {
    getContext,
    evaluate,
  };
}

export const brandGovernanceController = createBrandGovernanceController();

