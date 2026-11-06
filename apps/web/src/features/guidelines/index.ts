import type { Guideline, GuidelineRule, GuidelineConflict } from '@evolyn/shared';

export interface GuidelineViewState {
  selectedGuidelineId?: string | null;
  activeCategoryFilter?: string;
  isUploadModalOpen: boolean;
}

export type { Guideline, GuidelineRule, GuidelineConflict };

export * from './data/guidelines-data';
export * from './components';
export * from './api/guidelines-api';
