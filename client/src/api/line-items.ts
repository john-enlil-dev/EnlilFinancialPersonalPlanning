import { apiClient } from './client';
import type {
  CreateLineItemRequest,
  LineItem,
  LineItemQuery,
  UpdateLineItemRequest,
} from '../types/api';

export const lineItemsApi = {
  list: async (query: LineItemQuery = {}): Promise<LineItem[]> => {
    const res = await apiClient.get<LineItem[]>('/lineitems', { params: query });
    return res.data;
  },

  get: async (uid: string): Promise<LineItem> => {
    const res = await apiClient.get<LineItem>(`/lineitems/${uid}`);
    return res.data;
  },

  create: async (request: CreateLineItemRequest): Promise<LineItem> => {
    const res = await apiClient.post<LineItem>('/lineitems', request);
    return res.data;
  },

  update: async (uid: string, request: UpdateLineItemRequest): Promise<LineItem> => {
    const res = await apiClient.put<LineItem>(`/lineitems/${uid}`, request);
    return res.data;
  },
};
