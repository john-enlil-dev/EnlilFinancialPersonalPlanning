import { apiClient } from './client';
import type {
  CreateLineItemRequest,
  LineItem,
  LineItemLinkage,
  LineItemQuery,
  UpdateLineItemRequest,
} from '../types/api';

export const lineItemsApi = {
  list: async (query: LineItemQuery = {}): Promise<LineItem[]> => {
    // ASP.NET Core's query-string model binder wants repeated keys for collections
    // (?CategoryUIDs=g1&CategoryUIDs=g2). Build the params explicitly so axios's
    // array-serialization quirks don't matter.
    const params = new URLSearchParams();
    if (query.fromDate) params.append('FromDate', query.fromDate);
    if (query.toDate) params.append('ToDate', query.toDate);
    if (query.direction !== undefined) params.append('Direction', String(query.direction));
    if (query.categoryUIDs) {
      for (const uid of query.categoryUIDs) params.append('CategoryUIDs', uid);
    }
    const res = await apiClient.get<LineItem[]>('/lineitems', { params });
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

  delete: async (uid: string): Promise<void> => {
    await apiClient.delete(`/lineitems/${uid}`);
  },

  getLinkages: async (uid: string): Promise<LineItemLinkage[]> => {
    const res = await apiClient.get<LineItemLinkage[]>(`/lineitems/${uid}/linkages`);
    return res.data;
  },
};
