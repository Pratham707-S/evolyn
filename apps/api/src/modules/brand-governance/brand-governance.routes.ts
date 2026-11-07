import { Router } from 'express';
import { brandGovernanceController } from './brand-governance.controller.js';

export const brandGovernanceRouter = Router();

brandGovernanceRouter.get('/context', brandGovernanceController.getContext);
brandGovernanceRouter.post('/evaluate', brandGovernanceController.evaluate);
