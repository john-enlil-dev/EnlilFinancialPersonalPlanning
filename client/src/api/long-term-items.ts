import { apiClient } from './client';
import type {
  CreateLongTermItemRequest,
  LongTermItem,
  UpdateLongTermItemRequest,
} from '../types/api';

export const longTermItemsApi = {
  list: async (): Promise<LongTermItem[]> => {
    const res = await apiClient.get<LongTermItem[]>('/longtermitems');
    return res.data;
  },
  create: async (request: CreateLongTermItemRequest): Promise<LongTermItem> => {
    const res = await apiClient.post<LongTermItem>('/longtermitems', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateLongTermItemRequest): Promise<LongTermItem> => {
    const res = await apiClient.put<LongTermItem>(`/longtermitems/${uid}`, request);
    return res.data;
  },
};
