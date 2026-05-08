import { apiClient } from './client';
import type {
  CreateSavingsRequest,
  Savings,
  UpdateSavingsRequest,
} from '../types/api';

export const savingsApi = {
  list: async (): Promise<Savings[]> => {
    const res = await apiClient.get<Savings[]>('/savings');
    return res.data;
  },
  create: async (request: CreateSavingsRequest): Promise<Savings> => {
    const res = await apiClient.post<Savings>('/savings', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateSavingsRequest): Promise<Savings> => {
    const res = await apiClient.put<Savings>(`/savings/${uid}`, request);
    return res.data;
  },
};
