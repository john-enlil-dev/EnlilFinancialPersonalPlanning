import { apiClient } from './client';
import type {
  CreateSavingsRequest,
  CreateSavingsTransactionRequest,
  RepairLedgerPolarityReport,
  Savings,
  SavingsTransaction,
  UpdateSavingsRequest,
} from '../types/api';

export const savingsApi = {
  list: async (): Promise<Savings[]> => {
    const res = await apiClient.get<Savings[]>('/savings');
    return res.data;
  },
  get: async (uid: string): Promise<Savings> => {
    const res = await apiClient.get<Savings>(`/savings/${uid}`);
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
  listTransactions: async (uid: string): Promise<SavingsTransaction[]> => {
    const res = await apiClient.get<SavingsTransaction[]>(`/savings/${uid}/transactions`);
    return res.data;
  },
  createTransaction: async (
    uid: string,
    request: CreateSavingsTransactionRequest,
  ): Promise<SavingsTransaction> => {
    const res = await apiClient.post<SavingsTransaction>(`/savings/${uid}/transactions`, request);
    return res.data;
  },
  updateTransaction: async (
    uid: string,
    lineItemUid: string,
    request: CreateSavingsTransactionRequest,
  ): Promise<SavingsTransaction> => {
    const res = await apiClient.put<SavingsTransaction>(
      `/savings/${uid}/transactions/${lineItemUid}`,
      request,
    );
    return res.data;
  },
  repairLedgerPolarity: async (dryRun: boolean): Promise<RepairLedgerPolarityReport> => {
    const res = await apiClient.post<RepairLedgerPolarityReport>(
      `/savings/repair-ledger-polarity?dryRun=${dryRun}`,
    );
    return res.data;
  },
};
