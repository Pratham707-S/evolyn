import { apiClient } from '@/lib/api/client';
import type { Guideline, GuidelineRule } from '@evolyn/shared';

export interface BackendGuidelineWithRules extends Guideline {
  rules?: GuidelineRule[];
}

export async function fetchAllGuidelines(): Promise<BackendGuidelineWithRules[]> {
  const data = await apiClient.get<BackendGuidelineWithRules[]>('/api/guidelines');
  return Array.isArray(data) ? data : [];
}

export async function fetchGuidelineDetails(
  id: string
): Promise<BackendGuidelineWithRules | null> {
  try {
    return await apiClient.get<BackendGuidelineWithRules>(`/api/guidelines/${id}`);
  } catch (error) {
    console.error(`Failed to fetch guideline ${id} details:`, error);
    return null;
  }
}

export async function createGuideline(payload: {
  title: string;
  category: string;
  rawContent: string;
  version?: string;
}): Promise<BackendGuidelineWithRules> {
  return apiClient.post<BackendGuidelineWithRules>('/api/guidelines', payload);
}

export async function updateGuideline(
  id: string,
  payload: {
    title?: string;
    category?: string;
    rawContent?: string;
    version?: string;
    status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  }
): Promise<BackendGuidelineWithRules> {
  return apiClient.put<BackendGuidelineWithRules>(`/api/guidelines/${id}`, payload);
}

export async function deleteGuideline(id: string): Promise<boolean> {
  await apiClient.delete(`/api/guidelines/${id}`);
  return true;
}

