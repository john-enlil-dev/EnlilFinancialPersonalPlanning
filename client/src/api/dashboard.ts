import { apiClient } from './client';
import type {
  DashboardCategoryVarianceResponse,
  DashboardTilesResponse,
  DashboardTimelineResponse,
} from '../types/api';

export const dashboardApi = {
  tiles: async (): Promise<DashboardTilesResponse> => {
    const res = await apiClient.get<DashboardTilesResponse>('/dashboard/tiles');
    return res.data;
  },

  timeline: async (): Promise<DashboardTimelineResponse> => {
    const res = await apiClient.get<DashboardTimelineResponse>('/dashboard/timeline');
    return res.data;
  },

  categoryVariance: async (): Promise<DashboardCategoryVarianceResponse> => {
    const res = await apiClient.get<DashboardCategoryVarianceResponse>('/dashboard/category-variance');
    return res.data;
  },
};
