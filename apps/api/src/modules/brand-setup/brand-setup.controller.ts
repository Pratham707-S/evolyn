import type { Request, Response, NextFunction } from 'express';
import { brandSetupService, type IBrandSetupService } from './brand-setup.service.js';

export function createBrandSetupController(
  service: IBrandSetupService = brandSetupService
) {
  const getBrandSetup = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await service.getBrandSetup();
      return res.status(200).json(data);
    } catch (error) {
      return next(error);
    }
  };

  const saveBrandSetup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const saved = await service.saveBrandSetup(req.body);
      return res.status(200).json(saved);
    } catch (error) {
      return next(error);
    }
  };

  return {
    getBrandSetup,
    saveBrandSetup,
  };
}

export const brandSetupController = createBrandSetupController();

