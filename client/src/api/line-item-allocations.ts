import { apiClient } from './client';
import type {
  CreateLineItemAllocationRequest,
  LineItemAllocation,
  UpdateLineItemAllocationRequest,
} from '../types/api';

export const lineItemAllocationsApi = {
  listByLineItem: async (lineItemUid: string): Promise<LineItemAllocation[]> => {
    const res = await apiClient.get<LineItemAllocation[]>('/lineitemallocations', {
      params: { lineItemUid },
    });
    return res.data;
  },
  create: async (request: CreateLineItemAllocationRequest): Promise<LineItemAllocation> => {
    const res = await apiClient.post<LineItemAllocation>('/lineitemallocations', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateLineItemAllocationRequest): Promise<LineItemAllocation> => {
    const res = await apiClient.put<LineItemAllocation>(`/lineitemallocations/${uid}`, request);
    return res.data;
  },
};
