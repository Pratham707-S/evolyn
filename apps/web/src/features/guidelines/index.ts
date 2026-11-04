import type { Guideline, GuidelineRule, GuidelineConflict } from '@evolyn/shared';

export interface GuidelineViewState {
  selectedGuidelineId?: string | null;
  activeCategoryFilter?: string;
  isUploadModalOpen: boolean;
}

export type { Guideline, GuidelineRule, GuidelineConflict };
