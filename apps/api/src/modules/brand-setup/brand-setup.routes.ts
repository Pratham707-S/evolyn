import { Router } from 'express';
import { brandSetupController } from './brand-setup.controller.js';

export const brandSetupRouter = Router();

brandSetupRouter.get('/', brandSetupController.getBrandSetup);
brandSetupRouter.post('/', brandSetupController.saveBrandSetup);
brandSetupRouter.put('/', brandSetupController.saveBrandSetup);
