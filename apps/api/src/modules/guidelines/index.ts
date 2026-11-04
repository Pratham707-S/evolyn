import type { Guideline, GuidelineRule, CreateGuidelineInput } from '@evolyn/shared';

export interface GuidelineWithRules extends Guideline {
  rules: GuidelineRule[];
}

export interface IGuidelineService {
  createGuideline(input: CreateGuidelineInput): Promise<Guideline>;
  getGuidelines(filter?: { status?: string; category?: string }): Promise<Guideline[]>;
  getGuidelineById(id: string): Promise<GuidelineWithRules | null>;
  findSimilarRules(queryVector: number[], limit?: number): Promise<GuidelineRule[]>;
}

// Module boundary re-exports
export * from './guidelines.types.js';
