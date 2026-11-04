/**
 * ============================================================================
 * FEATURE: Guideline Hub & Conflict Cards (apps/web/src/features/guidelines)
 * ----------------------------------------------------------------------------
 * ASSIGNED OWNER        : Pratham Kave (Frontend Lead)
 * BACKEND COUNTERPART   : Mann (Guideline Knowledge Engineer)
 * ----------------------------------------------------------------------------
 * RESPONSIBILITIES & TASKS IN THIS FOLDER:
 * 1. Guideline Upload Modal & Document Ingestion:
 *    - PDF drag-and-drop uploader and Markdown text editor tab.
 * 2. Rule Extraction & Category Explorer:
 *    - Render extracted atomic rules with category badges (TONE, TERMINOLOGY, CLAIMS, LEGAL).
 * 3. Innovation 1 UI — Conflict & Ambiguity Alert Cards:
 *    - Visual card interface displaying detected contradictory rule pairs with explanation badges.
 *
 * API INTEGRATION POINTS:
 * - POST /api/guidelines (Upload / Create)
 * - GET  /api/guidelines (List & Filters)
 * - GET  /api/guidelines/:id (Detail & Rules)
 * - GET  /api/guidelines/conflicts (Cross-Rule Contradictions)
 * ============================================================================
 */

import type { Guideline, GuidelineRule, GuidelineConflict } from '@evolyn/shared';

export interface GuidelineViewState {
  selectedGuidelineId?: string | null;
  activeCategoryFilter?: string;
  isUploadModalOpen: boolean;
}

export type { Guideline, GuidelineRule, GuidelineConflict };
