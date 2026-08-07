import { shouldUseDemoData } from '../../config/runtime'
import { getAgentAssignableBetGroups } from '../../mocks/gameLimits'
import type { MerchantBetLimitAssignment } from '../../types/gameLimit'
import { apiClient, mockApiResponse } from '../apiClient'

export interface AgentMerchantProviderRate {
  provider_id: string
  provider_name: string
  agent_upstream_rate: number
  quote_markup_rate: number
  merchant_quote_rate: number
  rate_version: string
  effective_at: string
}

export interface AgentMerchantRow {
  merchant_id: string
  merchant_name: string
  owner_agent_code: string
  agent_path: string
  status: 'active' | 'disabled' | 'maintenance'
  wallet_mode: 'Seamless' | 'Transfer'
  currencies: string[]
  settlement_currency: 'USDT'
  fx_service_fee_rate: number
  default_markup_rate: number
  provider_rates: AgentMerchantProviderRate[]
  bet_limit_assignments: MerchantBetLimitAssignment[]
  today_bet_usdt: number
  today_ggr_usdt: number
  receivable_usdt: number
  updated_at: string
}

export interface AgentMerchantCreatePayload {
  merchant_name: string
  site_code: string
  manager_account: string
  callback_url?: string
  agent_path: string
  wallet_mode: AgentMerchantRow['wallet_mode']
  currencies: string[]
  service_fee_rate: number
  provider_rate_mode: string
  status: AgentMerchantRow['status']
}

export interface AgentMerchantListParams {
  keyword?: string
  status?: string | null
}

const effectiveAt = '2026-08-01T00:00:00.000+08:00'

const makeRates = (markup: number, overrides: Record<string, number> = {}): AgentMerchantProviderRate[] => {
  const upstream = [
    { provider_id: 'PG', provider_name: 'PG Soft', rate: 0.075 },
    { provider_id: 'JILI', provider_name: 'JILI', rate: 0.09 },
    { provider_id: 'EVO', provider_name: 'Evolution', rate: 0.095 },
    { provider_id: 'PP', provider_name: 'Pragmatic Play', rate: 0.078 }
  ]

  return upstream.map((provider) => {
    const quoteMarkup = overrides[provider.provider_id] ?? markup
    return {
      provider_id: provider.provider_id,
      provider_name: provider.provider_name,
      agent_upstream_rate: provider.rate,
      quote_markup_rate: quoteMarkup,
      merchant_quote_rate: Number((provider.rate + quoteMarkup).toFixed(6)),
      rate_version: `MQR-${provider.provider_id}-2026.08`,
      effective_at: effectiveAt
    }
  })
}

const providerNames: Record<string, string> = { PG: 'PG Soft', JILI: 'JILI', EVO: 'Evolution', PP: 'Pragmatic Play' }

const makeLimits = (merchantId: string, ownerAgentCode: string, currencies: string[], providerRates: AgentMerchantProviderRate[]): MerchantBetLimitAssignment[] => {
  const providerIds = new Set(providerRates.map(rate => rate.provider_id))
  return getAgentAssignableBetGroups(ownerAgentCode)
    .filter(group => currencies.includes(group.currency) && providerIds.has(group.provider_id))
    .map(group => ({
      merchant_id: merchantId,
      provider_id: group.provider_id,
      provider_name: providerNames[group.provider_id] || group.provider_id,
      provider_currency_connection_id: group.provider_currency_connection_id,
      provider_bet_group_id: group.provider_bet_group_id,
      provider_bet_group_code: group.provider_bet_group_code,
      provider_game_id: '*',
      game_type: '供應商遊戲',
      provider_bet_group_name: group.provider_bet_group_name,
      transaction_currency: group.currency,
      display_currency: group.currency,
      min_bet: group.min_bet,
      max_bet: group.max_bet,
      source: '代理指派',
      status: '啟用'
    }))
}

const demoRows: AgentMerchantRow[] = [
  {
    merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', owner_agent_code: 'AGT-SEA-001', agent_path: 'AGT-SEA-001', status: 'active', wallet_mode: 'Seamless',
    currencies: ['TWD', 'PHP'], settlement_currency: 'USDT', fx_service_fee_rate: 0.004, default_markup_rate: 0.01,
    provider_rates: makeRates(0.01, { JILI: 0.012 }), bet_limit_assignments: [],
    today_bet_usdt: 42100, today_ggr_usdt: 3180, receivable_usdt: 270.3, updated_at: effectiveAt
  },
  {
    merchant_id: 'OP-1002', merchant_name: 'HyperWin Network', owner_agent_code: 'AGT-SEA-SUB01', agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01', status: 'active', wallet_mode: 'Transfer',
    currencies: ['IDR', 'VND'], settlement_currency: 'USDT', fx_service_fee_rate: 0.004, default_markup_rate: 0.012,
    provider_rates: makeRates(0.012, { PG: 0.015, PP: 0.014 }), bet_limit_assignments: [],
    today_bet_usdt: 58200, today_ggr_usdt: 4960, receivable_usdt: 456.3, updated_at: effectiveAt
  },
  {
    merchant_id: 'OP-1003', merchant_name: 'Lucky Star Digital', owner_agent_code: 'AGT-SEA-SUB01', agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01', status: 'maintenance', wallet_mode: 'Seamless',
    currencies: ['THB'], settlement_currency: 'USDT', fx_service_fee_rate: 0.004, default_markup_rate: 0.008,
    provider_rates: makeRates(0.008), bet_limit_assignments: [],
    today_bet_usdt: 12800, today_ggr_usdt: -430, receivable_usdt: 0, updated_at: effectiveAt
  },
  {
    merchant_id: 'OP-1004', merchant_name: 'NovaPlay Entertainment', owner_agent_code: 'AGT-SEA-SUB01-L3', agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3', status: 'disabled', wallet_mode: 'Transfer',
    currencies: ['VND'], settlement_currency: 'USDT', fx_service_fee_rate: 0.004, default_markup_rate: 0.016,
    provider_rates: makeRates(0.016, { PG: 0.018 }), bet_limit_assignments: [],
    today_bet_usdt: 0, today_ggr_usdt: 0, receivable_usdt: 0, updated_at: effectiveAt
  }
]

demoRows.forEach((merchant) => {
  merchant.bet_limit_assignments = makeLimits(merchant.merchant_id, merchant.owner_agent_code, merchant.currencies, merchant.provider_rates)
})

let demoStore = [...demoRows]

const filterRows = (rows: AgentMerchantRow[], params: AgentMerchantListParams = {}) => rows.filter((row) => {
  const limitText = row.bet_limit_assignments.map(item => `${item.provider_name} ${item.provider_bet_group_name}`).join(' ')
  const text = `${row.merchant_id} ${row.merchant_name} ${row.agent_path} ${limitText}`.toLowerCase()
  const keyword = params.keyword?.toLowerCase()
  return (!keyword || text.includes(keyword)) && (!params.status || row.status === params.status)
})

export const portalMerchantService = {
  async listMerchants(params: AgentMerchantListParams = {}) {
    if (shouldUseDemoData()) {
      const response = await mockApiResponse(filterRows(demoStore, params))
      return response.data
    }

    const response = await apiClient.get<AgentMerchantRow[]>('/api/v2/agent/merchants', {
      keyword: params.keyword,
      status: params.status || undefined
    })
    return response.data
  },

  async updateMerchant(merchantId: string, patch: Partial<AgentMerchantRow>) {
    if (shouldUseDemoData()) {
      const index = demoStore.findIndex(item => item.merchant_id === merchantId)
      if (index < 0) throw new Error('找不到商戶')
      const current = demoStore[index] as AgentMerchantRow
      const updated = { ...current, ...patch, updated_at: new Date().toISOString() }
      demoStore.splice(index, 1, updated)
      return (await mockApiResponse(updated)).data
    }

    const response = await apiClient.put<AgentMerchantRow>(`/api/v2/agent/merchants/${merchantId}`, patch)
    return response.data
  }
}
