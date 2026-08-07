import type { AgentBetLimitAccess } from './gameLimit'

export type AgentLevel = 1 | 2 | 3
export type AgentStatus = 'active' | 'suspended' | 'disabled'
export type NegativeGgrPolicy = 'carry_forward' | 'zero_out'

export interface AgentProviderRate {
  provider_id: string
  provider_name: string
  upstream_rate: number
  agent_rate: number
  rate_version: string
  effective_at: string
  expired_at?: string
}

export interface AgentAuditLog {
  action: string
  operator: string
  created_at: string
  reason?: string
}

export interface Agent {
  id: string
  agent_code: string
  agent_name: string
  agent_level: AgentLevel
  parent_agent_code: string | null
  root_agent_code: string
  settlement_agent_code: string
  agent_path: string[]
  status: AgentStatus
  settlement_currency: 'USDT'
  fx_service_fee_rate: number
  negative_ggr_policy: NegativeGgrPolicy
  provider_rates: AgentProviderRate[]
  bet_limit_access: AgentBetLimitAccess[]
  child_agent_count: number
  merchant_count: number
  created_at: string
  updated_at: string
  audit_logs: AgentAuditLog[]
}

export interface AgentListResponse {
  code: number
  msg: string
  data: {
    list: Agent[]
    total: number
  }
}
