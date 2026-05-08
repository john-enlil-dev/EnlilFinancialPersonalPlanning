import { apiClient } from './client';
import type {
  CreateHoldingRequest,
  Holding,
  UpdateHoldingRequest,
} from '../types/api';

export const holdingsApi = {
  listByContainer: async (containerUid: string): Promise<Holding[]> => {
    const res = await apiClient.get<Holding[]>('/holdings', {
      params: { containerUid },
    });
    return res.data;
  },
  create: async (request: CreateHoldingRequest): Promise<Holding> => {
    const res = await apiClient.post<Holding>('/holdings', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateHoldingRequest): Promise<Holding> => {
    const res = await apiClient.put<Holding>(`/holdings/${uid}`, request);
    return res.data;
  },
};
