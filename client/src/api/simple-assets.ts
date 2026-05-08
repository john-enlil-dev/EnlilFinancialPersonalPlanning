import { apiClient } from './client';
import type {
  CreateSimpleAssetRequest,
  SimpleAsset,
  UpdateSimpleAssetRequest,
} from '../types/api';

export const simpleAssetsApi = {
  list: async (): Promise<SimpleAsset[]> => {
    const res = await apiClient.get<SimpleAsset[]>('/simpleassets');
    return res.data;
  },
  create: async (request: CreateSimpleAssetRequest): Promise<SimpleAsset> => {
    const res = await apiClient.post<SimpleAsset>('/simpleassets', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateSimpleAssetRequest): Promise<SimpleAsset> => {
    const res = await apiClient.put<SimpleAsset>(`/simpleassets/${uid}`, request);
    return res.data;
  },
};
