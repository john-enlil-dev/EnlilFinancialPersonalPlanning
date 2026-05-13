import { apiClient } from './client';
import type { LedgerReportResponse } from '../types/api';

export const ledgerReportsApi = {
  get: async (from: string, to: string): Promise<LedgerReportResponse> => {
    const res = await apiClient.get<LedgerReportResponse>('/ledgerreports', {
      params: { from, to },
    });
    return res.data;
  },
};
