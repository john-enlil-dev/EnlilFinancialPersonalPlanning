import { apiClient } from './client';
import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/api';

export const categoriesApi = {
  list: async (includeArchived = false): Promise<Category[]> => {
    const res = await apiClient.get<Category[]>('/categories', {
      params: { includeArchived },
    });
    return res.data;
  },

  get: async (uid: string): Promise<Category> => {
    const res = await apiClient.get<Category>(`/categories/${uid}`);
    return res.data;
  },

  create: async (request: CreateCategoryRequest): Promise<Category> => {
    const res = await apiClient.post<Category>('/categories', request);
    return res.data;
  },

  update: async (uid: string, request: UpdateCategoryRequest): Promise<Category> => {
    const res = await apiClient.put<Category>(`/categories/${uid}`, request);
    return res.data;
  },
};
