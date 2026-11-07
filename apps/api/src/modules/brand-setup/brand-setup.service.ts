import {
  brandSetupSchema,
  type BrandSetup,
} from '@evolyn/shared';
import {
  brandSetupRepository,
  DEFAULT_BRAND_SETUP,
  type IBrandSetupRepository,
} from './brand-setup.repository.js';

export interface IBrandSetupService {
  getBrandSetup(): Promise<BrandSetup>;
  saveBrandSetup(input: unknown): Promise<BrandSetup>;
}

export class BrandSetupService implements IBrandSetupService {
  constructor(
    private readonly repository: IBrandSetupRepository = brandSetupRepository
  ) {}

  async getBrandSetup(): Promise<BrandSetup> {
    const persisted = await this.repository.findActiveSetup();
    if (persisted) {
      return persisted;
    }
    return DEFAULT_BRAND_SETUP;
  }

  async saveBrandSetup(input: unknown): Promise<BrandSetup> {
    const validated = brandSetupSchema.parse(input);
    return await this.repository.saveSetup(validated);
  }
}

export const brandSetupService = new BrandSetupService();

