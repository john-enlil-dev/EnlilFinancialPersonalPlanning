import { apiClient } from './client';
import type {
  CreateCreditCardDebtRequest,
  CreateCreditCardTransactionRequest,
  CreditCardBalanceAnchor,
  CreditCardDebt,
  CreditCardTransaction,
  ReconcileCreditCardDebtRequest,
  UpdateCreditCardDebtRequest,
} from '../types/api';

export const creditCardDebtsApi = {
  list: async (): Promise<CreditCardDebt[]> => {
    const res = await apiClient.get<CreditCardDebt[]>('/creditcarddebts');
    return res.data;
  },
  get: async (uid: string): Promise<CreditCardDebt> => {
    const res = await apiClient.get<CreditCardDebt>(`/creditcarddebts/${uid}`);
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
  listTransactions: async (uid: string): Promise<CreditCardTransaction[]> => {
    const res = await apiClient.get<CreditCardTransaction[]>(`/creditcarddebts/${uid}/transactions`);
    return res.data;
  },
  createTransaction: async (
    uid: string,
    request: CreateCreditCardTransactionRequest,
  ): Promise<CreditCardTransaction> => {
    const res = await apiClient.post<CreditCardTransaction>(
      `/creditcarddebts/${uid}/transactions`,
      request,
    );
    return res.data;
  },
  updateTransaction: async (
    uid: string,
    lineItemUid: string,
    request: CreateCreditCardTransactionRequest,
  ): Promise<CreditCardTransaction> => {
    const res = await apiClient.put<CreditCardTransaction>(
      `/creditcarddebts/${uid}/transactions/${lineItemUid}`,
      request,
    );
    return res.data;
  },
  deleteTransaction: async (uid: string, lineItemUid: string): Promise<void> => {
    await apiClient.delete(`/creditcarddebts/${uid}/transactions/${lineItemUid}`);
  },
  listAnchors: async (uid: string): Promise<CreditCardBalanceAnchor[]> => {
    const res = await apiClient.get<CreditCardBalanceAnchor[]>(`/creditcarddebts/${uid}/anchors`);
    return res.data;
  },
  reconcile: async (
    uid: string,
    request: ReconcileCreditCardDebtRequest,
  ): Promise<CreditCardDebt> => {
    const res = await apiClient.post<CreditCardDebt>(`/creditcarddebts/${uid}/reconcile`, request);
    return res.data;
  },
  deleteAnchor: async (uid: string, anchorUid: string): Promise<void> => {
    await apiClient.delete(`/creditcarddebts/${uid}/anchors/${anchorUid}`);
  },
};
