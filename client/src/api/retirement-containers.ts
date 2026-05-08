import { apiClient } from './client';
import type {
  CreateRetirementContainerRequest,
  RetirementContainer,
  UpdateRetirementContainerRequest,
} from '../types/api';

export const retirementContainersApi = {
  list: async (): Promise<RetirementContainer[]> => {
    const res = await apiClient.get<RetirementContainer[]>('/retirementcontainers');
    return res.data;
  },
  create: async (request: CreateRetirementContainerRequest): Promise<RetirementContainer> => {
    const res = await apiClient.post<RetirementContainer>('/retirementcontainers', request);
    return res.data;
  },
  update: async (uid: string, request: UpdateRetirementContainerRequest): Promise<RetirementContainer> => {
    const res = await apiClient.put<RetirementContainer>(`/retirementcontainers/${uid}`, request);
    return res.data;
  },
};
