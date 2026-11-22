import type { Request, Response, NextFunction } from 'express';
import { insightsService, InsightsService } from './insights.service.js';

export class InsightsController {
  constructor(private readonly service: InsightsService = insightsService) {}

  listMistakes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.query;
      const mistakes = await this.service.listRecurringMistakes(status as string | undefined);
      return res.status(200).json({ mistakes, total: mistakes.length });
    } catch (error) {
      return next(error);
    }
  };

  getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await this.service.getAnalytics();
      return res.status(200).json(summary);
    } catch (error) {
      return next(error);
    }
  };

  refineRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleId } = req.params;
      const suggestion = await this.service.generateRefinement(ruleId);
      return res.status(200).json(suggestion);
    } catch (error) {
      return next(error);
    }
  };

  applyRefinement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleId } = req.params;
      const { newStatement } = req.body;
      await this.service.applyRefinement(ruleId, newStatement);
      return res.status(200).json({ success: true, message: 'Guideline rule updated and refinement marked as applied' });
    } catch (error) {
      return next(error);
    }
  };

  dismissMistake = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleId } = req.params;
      await this.service.dismissMistake(ruleId);
      return res.status(200).json({ success: true, message: 'Recurring mistake dismissed' });
    } catch (error) {
      return next(error);
    }
  };

  seedDemo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mistakes = await this.service.seedDemoRecurringMistakes();
      return res.status(201).json({ message: 'Demo recurring mistakes seeded successfully', mistakes, total: mistakes.length });
    } catch (error) {
      return next(error);
    }
  };
}

export const insightsController = new InsightsController();
