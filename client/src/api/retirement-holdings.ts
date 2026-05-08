import { apiClient } from './client';
import type {
  CreateRetirementHoldingRequest,
  RetirementHolding,
  UpdateRetirementHoldingRequest,
} from '../types/api';

export const retirementHoldingsApi = {
  listByContainer: async (containerUid: string): Promise<RetirementHolding[]> => {
    const res = await apiClient.get<RetirementHolding[]>('/retirementholdings', {
      params: { containerUid },
    });
    return res.data;
  },
  create: async (request: CreateRetirementHoldingRequest): Promise<RetirementHolding> => {
    const res = await apiClient.post<RetirementHolding>('/retirementholdings', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateRetirementHoldingRequest): Promise<RetirementHolding> => {
    const res = await apiClient.put<RetirementHolding>(`/retirementholdings/${uid}`, request);
    return res.data;
  },
};
