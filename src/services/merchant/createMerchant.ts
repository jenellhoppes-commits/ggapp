import { shouldUseDemoData } from '../../config/runtime'
import { getAgentAssignableBetGroups, makeMerchantBetLimitAssignments } from '../../mocks/gameLimits'
import type { Merchant, MerchantCurrency, MerchantQuoteRate, MerchantStatus, MerchantWalletMode } from '../../types/merchant'
import { apiClient, mockApiResponse } from '../apiClient'

export type MerchantCreateMode = 'admin' | 'agent'

export interface MerchantCreatePayload {
  mode: MerchantCreateMode
  merchant_name: string
  site_code: string
  manager_account: string
  initial_password?: string
  contact_name?: string
  contact_email?: string
  telegram?: string
  phone?: string
  remarks?: string
  status: MerchantStatus
  agent_id: number
  agent_code: string
  agent_name: string
  agent_path: string
  agent_level: 1 | 2 | 3
  settlement_agent_id: string
  wallet_mode: MerchantWalletMode
  transaction_currencies: MerchantCurrency[]
  default_transaction_currency: MerchantCurrency
  display_currencies?: MerchantCurrency[]
  default_display_currency?: MerchantCurrency
  settlement_currency: 'USDT'
  api_status: 'testing' | 'active' | 'disabled'
  environment: 'sandbox' | 'production'
  sign_method: 'HMAC-SHA256' | 'RSA'
  callback_url?: string
  ip_whitelist: string[]
  timeout_ms: number
  retry_count: number
  allow_negative_balance: boolean
  idempotency_enabled: boolean
  credit_limit: number
  authorized_providers: string[]
  game_package: string
  service_fee_rate: number
  default_merchant_markup_rate: number
  merchant_provider_rates: MerchantQuoteRate[]
}

export interface AgentOption {
  label: string
  value: string
  id: number
  code: string
  name: string
  direct: boolean
  level: 1 | 2 | 3
  parent: string | null
  root: string
  settlement: string
  path: string
  service_fee_rate: number
  rates: Record<string, number>
  provider_currency_access: AgentProviderCurrencyAccess[]
}

export interface AgentProviderCurrencyAccess {
  provider_id: string
  provider_currency_connection_id: string
  transaction_currency: MerchantCurrency
  bet_limit_scheme_ids: string[]
}

export interface ProviderRateOption {
  key: string
  provider_id: string
  provider_name: string
  provider_cost_rate: number
}

export const providerRateOptions: ProviderRateOption[] = [
  { key: 'pg', provider_id: 'PG', provider_name: 'PG Soft', provider_cost_rate: 0.04 },
  { key: 'jili', provider_id: 'JILI', provider_name: 'JILI', provider_cost_rate: 0.05 },
  { key: 'evo', provider_id: 'EVO', provider_name: 'Evolution', provider_cost_rate: 0.06 },
  { key: 'pp', provider_id: 'PP', provider_name: 'Pragmatic Play', provider_cost_rate: 0.05 },
  { key: 'habanero', provider_id: 'HAB', provider_name: 'Habanero', provider_cost_rate: 0.055 }
]

const makeAgentProviderCurrencyAccess = (agentCode: string): AgentProviderCurrencyAccess[] => {
  const accessByConnection = new Map<string, AgentProviderCurrencyAccess>()
  getAgentAssignableBetGroups(agentCode).forEach((group) => {
    const current = accessByConnection.get(group.provider_currency_connection_id)
    if (current) {
      current.bet_limit_scheme_ids.push(group.provider_bet_group_id)
      return
    }
    accessByConnection.set(group.provider_currency_connection_id, {
      provider_id: group.provider_id,
      provider_currency_connection_id: group.provider_currency_connection_id,
      transaction_currency: group.currency as MerchantCurrency,
      bet_limit_scheme_ids: [group.provider_bet_group_id]
    })
  })
  return Array.from(accessByConnection.values())
}

const agentOptions: AgentOption[] = [
  { label: 'L1 平台直營代理', value: '平台直營代理', id: 1, code: 'AGT-DIRECT', name: '平台直營代理', direct: true, level: 1, parent: null, root: 'AGT-DIRECT', settlement: 'AGT-DIRECT', path: 'AGT-DIRECT', service_fee_rate: 0.005, rates: { pg: 0.07, jili: 0.085, evo: 0.1, pp: 0.082, habanero: 0.09 }, provider_currency_access: makeAgentProviderCurrencyAccess('AGT-DIRECT') },
  { label: 'L1 SEA Growth Agent', value: 'SEA Growth Agent', id: 2, code: 'AGT-SEA-001', name: 'SEA Growth Agent', direct: false, level: 1, parent: null, root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001', service_fee_rate: 0.004, rates: { pg: 0.075, jili: 0.09, evo: 0.095, pp: 0.078, habanero: 0.088 }, provider_currency_access: makeAgentProviderCurrencyAccess('AGT-SEA-001') },
  { label: 'L2 SEA Sub Agent 01', value: 'SEA Sub Agent 01', id: 3, code: 'AGT-SEA-SUB01', name: 'SEA Sub Agent 01', direct: false, level: 2, parent: 'AGT-SEA-001', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01', service_fee_rate: 0.004, rates: { pg: 0.088, jili: 0.102, evo: 0.108, pp: 0.092, habanero: 0.1 }, provider_currency_access: makeAgentProviderCurrencyAccess('AGT-SEA-SUB01') },
  { label: 'L3 SEA Local Desk L3', value: 'SEA Local Desk L3', id: 4, code: 'AGT-SEA-SUB01-L3', name: 'SEA Local Desk L3', direct: false, level: 3, parent: 'AGT-SEA-SUB01', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3', service_fee_rate: 0.004, rates: { pg: 0.096, jili: 0.11, evo: 0.116, pp: 0.1, habanero: 0.108 }, provider_currency_access: makeAgentProviderCurrencyAccess('AGT-SEA-SUB01-L3') }
]

export const listAvailableMerchantAgents = async (mode: MerchantCreateMode) => {
  if (shouldUseDemoData()) {
    const filtered = mode === 'admin'
      ? agentOptions
      : agentOptions.filter(agent => agent.code === 'AGT-SEA-001' || agent.root === 'AGT-SEA-001')

    const response = await mockApiResponse(filtered)
    return response.data
  }

  const response = await apiClient.get<AgentOption[]>(mode === 'admin' ? '/api/v2/admin/agents/options' : '/api/v2/agent/merchant-agent-options')
  return response.data
}

export const buildMerchantFromPayload = (payload: MerchantCreatePayload): Merchant => {
  const now = new Date().toISOString()
  const displayId = `OP-${Math.floor(1000 + Math.random() * 9000)}`
  const transactionCurrencies = payload.transaction_currencies
  const defaultTransactionCurrency = payload.default_transaction_currency

  return {
    id: Date.now(),
    display_id: displayId,
    site_code: payload.site_code,
    merchant_name: payload.merchant_name,
    merchant_type: 'merchant',
    account: payload.manager_account,
    name: payload.merchant_name,
    contact_name: payload.contact_name,
    contact_email: payload.contact_email,
    telegram: payload.telegram,
    phone: payload.phone,
    remarks: payload.remarks,
    currency_type: defaultTransactionCurrency,
    multi_currency_enabled: transactionCurrencies.length > 1,
    transaction_currencies: transactionCurrencies,
    display_currencies: transactionCurrencies,
    default_transaction_currency: defaultTransactionCurrency,
    default_display_currency: defaultTransactionCurrency,
    settlement_currency: 'USDT',
    callback_amount_mode: 'transaction_currency',
    service_fee_rate: payload.service_fee_rate,
    default_merchant_markup_rate: payload.default_merchant_markup_rate,
    percent: 0,
    settlement_cycle: 'daily',
    authorized_providers: payload.authorized_providers,
    enabled_provider_count: payload.authorized_providers.length,
    enabled_game_count: 0,
    game_package: payload.game_package,
    state: payload.status === 'active' ? 1 : 0,
    status: payload.status,
    created_at: now,
    updated_at: now,
    walletMode: payload.wallet_mode,
    wallet_mode: payload.wallet_mode,
    api_key: `ak_${displayId.toLowerCase()}`,
    api_secret_masked: 'sk_live_****************',
    callback_url: payload.callback_url,
    ipWhitelist: payload.ip_whitelist,
    ip_whitelist: payload.ip_whitelist,
    sign_method: payload.sign_method,
    api_status: payload.api_status,
    environment: payload.environment,
    timeout_ms: payload.timeout_ms,
    retry_count: payload.retry_count,
    allow_negative_balance: payload.allow_negative_balance,
    idempotency_enabled: payload.idempotency_enabled,
    credit_limit: payload.credit_limit,
    agent_id: payload.agent_id,
    agent_code: payload.agent_code,
    agent_name: payload.agent_name,
    agent_level: payload.agent_level,
    root_agent_code: payload.settlement_agent_id,
    settlement_agent_code: payload.settlement_agent_id,
    agent_path: payload.agent_path,
    settlement_owner_type: 'agent',
    agent_binding: true,
    merchant_quote_rates: payload.merchant_provider_rates,
    bet_limit_assignments: makeMerchantBetLimitAssignments(transactionCurrencies, defaultTransactionCurrency, {
      agentCode: payload.agent_code,
      authorizedProviderIds: providerRateOptions.filter(provider => payload.authorized_providers.includes(provider.key)).map(provider => provider.provider_id)
    }),
    agent_effective_at: now,
    today_bet: 0,
    today_payout: 0,
    today_ggr: 0,
    settlement_today_ggr: 0,
    transaction_success_rate: 100
  }
}

export const createMerchant = async (payload: MerchantCreatePayload) => {
  if (shouldUseDemoData()) {
    const response = await mockApiResponse(buildMerchantFromPayload(payload))
    return response.data
  }

  const endpoint = payload.mode === 'admin' ? '/api/v2/admin/merchants' : '/api/v2/agent/merchants'
  const response = await apiClient.post<Merchant>(endpoint, payload)
  return response.data
}
