import api from './axios';

// ── Response types ─────────────────────────────────────────────────────────

export interface AIProvider {
  id: number;
  provider_key: 'groq' | 'claude' | 'openai' | 'gemini' | 'ollama' | 'custom';
  display_name: string;
  base_url: string;
  model_name: string;
  is_active: boolean;
  has_key: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIFeature {
  id: number;
  feature_key: string;
  display_name: string;
  primary_provider: number | null;
  primary_provider_name: string | null;
  fallback_provider: number | null;
  fallback_provider_name: string | null;
  is_enabled: boolean;
  max_tokens: number;
  custom_prompt_template: string;
  updated_at: string;
}

export interface AIUsage {
  total: number;
  by_provider: { provider_key: string; count: number }[];
  by_feature: { feature_key: string; count: number }[];
}

export interface AIFeatureUpdate {
  id: number;
  primary_provider?: number | null;
  fallback_provider?: number | null;
  is_enabled?: boolean;
  max_tokens?: number;
}

export type AIProviderCreate = Omit<AIProvider, 'id' | 'has_key' | 'created_at' | 'updated_at'> & { api_key?: string };

// ── Feature calls ──────────────────────────────────────────────────────────

export const aiSpellCheck = (text: string, task_id?: number) =>
  api.post<{ success: boolean; data: { corrected: string } }>(
    '/ai/spell-check/', { text, task_id }
  );

export const aiSentenceMaker = (text: string, task_id?: number) =>
  api.post<{ success: boolean; data: { improved: string } }>(
    '/ai/sentence-maker/', { text, task_id }
  );

export const aiActionPlan = (job: string, task_id?: number) =>
  api.post<{ success: boolean; data: { action_plan: string } }>(
    '/ai/action-plan/', { job, task_id }
  );

export const aiDetectPriority = (job: string, task_id?: number) =>
  api.post<{ success: boolean; data: { priority: 'High' | 'Medium' | 'Low' } }>(
    '/ai/detect-priority/', { job, task_id }
  );

export const aiDailySummary = (payload: {
  report_id?: number;
  tasks?: { job: string; status: string }[];
}) =>
  api.post<{ success: boolean; data: { summary: string } }>(
    '/ai/daily-summary/', payload
  );

export const aiTaskBreakdown = (job: string, task_id?: number) =>
  api.post<{ success: boolean; data: { subtasks: string[] } }>(
    '/ai/task-breakdown/', { job, task_id }
  );

export const aiTeamInsights = (date_from: string, date_to: string) =>
  api.post<{ success: boolean; data: { insights: string } }>(
    '/ai/team-insights/', { date_from, date_to }
  );

// ── Admin calls (CEO only) ─────────────────────────────────────────────────

export const aiAdminGetProviders = () =>
  api.get<{ success: boolean; data: AIProvider[] }>('/ai/admin/providers/');

export const aiAdminCreateProvider = (data: AIProviderCreate) =>
  api.post<{ success: boolean; data: AIProvider }>('/ai/admin/providers/', data);

export const aiAdminUpdateProvider = (
  id: number,
  data: Partial<AIProvider> & { api_key?: string }
) =>
  api.patch<{ success: boolean; data: AIProvider }>(`/ai/admin/providers/${id}/`, data);

export const aiAdminDeleteProvider = (id: number) =>
  api.delete<{ success: boolean }>(`/ai/admin/providers/${id}/`);

export const aiAdminTestProvider = (id: number) =>
  api.post<{ success: boolean; message: string }>(`/ai/admin/providers/${id}/test/`);

export const aiAdminGetFeatures = () =>
  api.get<{ success: boolean; data: AIFeature[] }>('/ai/admin/features/');

export const aiAdminUpdateFeatures = (updates: AIFeatureUpdate[]) =>
  api.patch<{ success: boolean; data: AIFeature[]; errors: { id: number | null; error: string | Record<string, string[]> }[] }>(
    '/ai/admin/features/', updates
  );

export const aiAdminGetUsage = () =>
  api.get<{ success: boolean; data: AIUsage }>('/ai/admin/usage/');
