import { apiClient } from './client';
import type {
  CreateLongTermContainerRequest,
  LongTermContainer,
  UpdateLongTermContainerRequest,
} from '../types/api';

export const longTermContainersApi = {
  list: async (): Promise<LongTermContainer[]> => {
    const res = await apiClient.get<LongTermContainer[]>('/longtermcontainers');
    return res.data;
  },
  get: async (uid: string): Promise<LongTermContainer> => {
    const res = await apiClient.get<LongTermContainer>(`/longtermcontainers/${uid}`);
    return res.data;
  },
  create: async (request: CreateLongTermContainerRequest): Promise<LongTermContainer> => {
    const res = await apiClient.post<LongTermContainer>('/longtermcontainers', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateLongTermContainerRequest): Promise<LongTermContainer> => {
    const res = await apiClient.put<LongTermContainer>(`/longtermcontainers/${uid}`, request);
    return res.data;
  },
};
