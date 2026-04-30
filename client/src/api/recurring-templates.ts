import { apiClient } from './client';
import type {
  CreateRecurringTemplateRequest,
  RecurringTemplate,
  UpdateRecurringTemplateRequest,
} from '../types/api';

export const recurringTemplatesApi = {
  list: async (): Promise<RecurringTemplate[]> => {
    const res = await apiClient.get<RecurringTemplate[]>('/recurringtemplates');
    return res.data;
  },

  get: async (uid: string): Promise<RecurringTemplate> => {
    const res = await apiClient.get<RecurringTemplate>(`/recurringtemplates/${uid}`);
    return res.data;
  },

  create: async (request: CreateRecurringTemplateRequest): Promise<RecurringTemplate> => {
    const res = await apiClient.post<RecurringTemplate>('/recurringtemplates', request);
    return res.data;
  },

  update: async (
    uid: string,
    request: UpdateRecurringTemplateRequest,
  ): Promise<RecurringTemplate> => {
    const res = await apiClient.put<RecurringTemplate>(`/recurringtemplates/${uid}`, request);
    return res.data;
  },
};
