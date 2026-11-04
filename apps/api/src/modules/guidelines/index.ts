import type { Guideline, GuidelineRule, CreateGuidelineInput } from '@evolyn/shared';
import type { GuidelineQueryFilter } from './guidelines.types.js';

export interface GuidelineWithRules extends Guideline {
  rules: GuidelineRule[];
}

export interface IGuidelineService {
  createGuideline(input: CreateGuidelineInput): Promise<Guideline>;
  getGuidelines(filter?: GuidelineQueryFilter): Promise<Guideline[]>;
  getGuidelineById(id: string): Promise<GuidelineWithRules | null>;
}

// Module boundary re-exports
export * from './guidelines.types.js';
