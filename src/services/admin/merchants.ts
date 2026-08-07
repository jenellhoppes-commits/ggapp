import { apiClient } from '../apiClient'
import type { QueryParams } from '../apiClient'
import type { Merchant, MerchantDetail } from '../../types/merchant'

export interface AdminMerchantListParams extends QueryParams {
  agent_id?: string
  parent_id?: number
  search?: string
}

export const adminMerchantService = {
  async list(params: AdminMerchantListParams = {}) {
    const response = await apiClient.get<{ list: Merchant[]; total: number }>('/api/v2/admin/merchants', params)
    return response.data
  },

  async detail(id: number | string) {
    const response = await apiClient.get<MerchantDetail>(`/api/v2/admin/merchants/${id}`)
    return response.data
  },

  async create(payload: Record<string, unknown>) {
    const response = await apiClient.post<MerchantDetail>('/api/v2/admin/merchants', payload)
    return response.data
  },

  async update(id: number | string, payload: Partial<MerchantDetail>) {
    const response = await apiClient.put<MerchantDetail>(`/api/v2/admin/merchants/${id}`, payload)
    return response.data
  }
}
