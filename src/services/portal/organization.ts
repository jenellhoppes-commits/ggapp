import { apiClient } from '../apiClient'
import type { Agent, AgentProviderRate } from '../../types/agent'

export interface CreateSubAgentPayload {
  agent_code: string
  agent_name: string
  agent_level: 2 | 3
  parent_agent_code: string
  status: Agent['status']
  settlement_currency: 'USDT'
  fx_service_fee_rate: number
  negative_ggr_policy: Agent['negative_ggr_policy']
  provider_rates: AgentProviderRate[]
  provider_bet_group_ids: string[]
}

export const portalOrganizationService = {
  async tree() {
    const response = await apiClient.get<{ list: Agent[]; total: number }>('/api/v2/agent/tree')
    return response.data
  },

  async create(payload: CreateSubAgentPayload) {
    const response = await apiClient.post<Agent>('/api/v2/agent/sub-agents', payload)
    return response.data
  },

  async update(agentId: string, payload: Partial<Pick<Agent, 'agent_name' | 'status' | 'fx_service_fee_rate' | 'negative_ggr_policy'>>) {
    const response = await apiClient.put<Agent>(`/api/v2/agent/sub-agents/${agentId}`, payload)
    return response.data
  },

  async createRateVersion(agentId: string, rates: AgentProviderRate[]) {
    const response = await apiClient.post<AgentProviderRate[]>(`/api/v2/agent/sub-agents/${agentId}/rate-versions`, { rates })
    return response.data
  },

  async updateBetGroupAccess(agentId: string, providerBetGroupIds: string[]) {
    const response = await apiClient.put<Agent>(`/api/v2/agent/sub-agents/${agentId}/bet-group-access`, {
      provider_bet_group_ids: providerBetGroupIds
    })
    return response.data
  },

  async transfer(agentId: string, parentAgentCode: string, effectiveAt: string, reason: string) {
    const response = await apiClient.post<Agent>(`/api/v2/agent/sub-agents/${agentId}/transfer`, {
      parent_agent_code: parentAgentCode,
      effective_at: effectiveAt,
      reason
    })
    return response.data
  }
}
