import { apiClient } from './client';
import type {
  CreateMortgageDebtRequest,
  CreateMortgagePaymentRequest,
  MortgageBalanceSnapshot,
  MortgageDebt,
  MortgagePayment,
  UpdateMortgageDebtRequest,
} from '../types/api';

export const mortgageDebtsApi = {
  list: async (): Promise<MortgageDebt[]> => {
    const res = await apiClient.get<MortgageDebt[]>('/mortgagedebts');
    return res.data;
  },
  get: async (uid: string): Promise<MortgageDebt> => {
    const res = await apiClient.get<MortgageDebt>(`/mortgagedebts/${uid}`);
    return res.data;
  },
  create: async (request: CreateMortgageDebtRequest): Promise<MortgageDebt> => {
    const res = await apiClient.post<MortgageDebt>('/mortgagedebts', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateMortgageDebtRequest): Promise<MortgageDebt> => {
    const res = await apiClient.put<MortgageDebt>(`/mortgagedebts/${uid}`, request);
    return res.data;
  },
  listPayments: async (uid: string): Promise<MortgagePayment[]> => {
    const res = await apiClient.get<MortgagePayment[]>(`/mortgagedebts/${uid}/payments`);
    return res.data;
  },
  createPayment: async (uid: string, request: CreateMortgagePaymentRequest): Promise<MortgagePayment> => {
    const res = await apiClient.post<MortgagePayment>(`/mortgagedebts/${uid}/payments`, request);
    return res.data;
  },
  updatePayment: async (
    uid: string,
    lineItemUid: string,
    request: CreateMortgagePaymentRequest,
  ): Promise<MortgagePayment> => {
    const res = await apiClient.put<MortgagePayment>(
      `/mortgagedebts/${uid}/payments/${lineItemUid}`,
      request,
    );
    return res.data;
  },
  listSnapshots: async (uid: string): Promise<MortgageBalanceSnapshot[]> => {
    const res = await apiClient.get<MortgageBalanceSnapshot[]>(`/mortgagedebts/${uid}/snapshots`);
    return res.data;
  },
};
