import { apiClient } from './client';
import type {
  CreateCreditCardDebtRequest,
  CreditCardDebt,
  UpdateCreditCardDebtRequest,
} from '../types/api';

export const creditCardDebtsApi = {
  list: async (): Promise<CreditCardDebt[]> => {
    const res = await apiClient.get<CreditCardDebt[]>('/creditcarddebts');
    return res.data;
  },
  create: async (request: CreateCreditCardDebtRequest): Promise<CreditCardDebt> => {
    const res = await apiClient.post<CreditCardDebt>('/creditcarddebts', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateCreditCardDebtRequest): Promise<CreditCardDebt> => {
    const res = await apiClient.put<CreditCardDebt>(`/creditcarddebts/${uid}`, request);
    return res.data;
  },
};
