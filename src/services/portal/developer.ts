import { apiClient } from '../apiClient'
import type { Portal } from '../../stores/auth'

export interface PortalCredentials {
  merchant_code: string
  secret_key: string
  whitelist: string[]
}

export const portalDeveloperService = {
  async getCredentials(portal: Extract<Portal, 'agent' | 'merchant'>) {
    const response = await apiClient.get<PortalCredentials>(`/api/v2/${portal}/credentials`)
    return response.data
  },

  async updateWhitelist(portal: Extract<Portal, 'agent' | 'merchant'>, whitelist: string[]) {
    const response = await apiClient.post(`/api/v2/${portal}/whitelist`, { whitelist })
    return response.data
  }
}
