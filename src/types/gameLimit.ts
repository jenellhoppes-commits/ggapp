export type GameLimitLevel = 'GENERAL' | 'HIGH' | 'VIP'
export type GameLimitStatus = 'active' | 'draft' | 'disabled'
export type GameLimitSource = 'provider_default' | 'agent_assignment' | 'merchant_currency_default' | 'merchant_game_assignment' | 'player_override'
export type GameLimitCheckResult = 'passed' | 'blocked' | 'manual_review'

export type ProviderBetGroupStatus = 'available' | 'deprecated'

export interface ProviderCurrencyBetGroup {
  provider_bet_group_id: string
  provider_bet_group_code: string
  provider_bet_group_name: string
  provider_id: string
  provider_currency_connection_id: string
  provider_currency_id: string
  currency: string
  wallet_mode: 'seamless' | 'transfer'
  min_bet: number
  max_bet: number
  bet_step: number
  supported_game_count: number
  is_selected: boolean
  is_default: boolean
  status: ProviderBetGroupStatus
  version: string
  synced_at: string
}

export interface ProviderBetGroupGame {
  provider_bet_group_id: string
  provider_game_id: string
  provider_game_name: string
  game_type: string
  status: 'active' | 'disabled'
  version: string
}

export interface AgentBetLimitAccess {
  provider_id: string
  provider_name: string
  provider_currency_connection_id: string
  provider_bet_group_id: string
  provider_game_ids: string[]
  game_type: string
  provider_bet_group_code: string
  provider_bet_group_name: string
  min_bet_display: number
  max_bet_display: number
  transaction_currency: string
  /** @deprecated Use transaction_currency. */
  display_currency: string
  assignable_to_child: boolean
  assigned_merchant_count: number
  status: Extract<GameLimitStatus, 'active' | 'disabled'>
}

export interface MerchantBetLimitAssignment {
  merchant_id: string
  provider_id: string
  provider_name: string
  provider_currency_connection_id: string
  provider_bet_group_id: string
  provider_bet_group_code: string
  provider_game_id: string | '*'
  game_type: string
  provider_bet_group_name: string
  transaction_currency: string
  /** @deprecated Use transaction_currency. */
  display_currency: string
  min_bet: number
  max_bet: number
  source: string
  status: string
}

export interface PlayerBetLimit {
  player_wallet_id: string
  provider_id: string
  provider_currency_connection_id: string
  provider_bet_group_id: string
  provider_bet_group_code: string
  provider_game_id: string | '*'
  game_type: string
  provider_bet_group_name: string
  transaction_currency: string
  /** @deprecated Use transaction_currency. */
  display_currency: string
  min_bet: number
  max_bet: number
  source: GameLimitSource
  effective_at: string
  status: Extract<GameLimitStatus, 'active' | 'disabled'>
}

export interface BetLimitSnapshot {
  session_id: string
  provider_currency_connection_id: string
  provider_game_id: string
  provider_bet_group_id: string
  provider_bet_group_code: string
  provider_bet_group_name: string
  limit_source: GameLimitSource
  transaction_currency: string
  /** @deprecated Use transaction_currency. */
  display_currency: string
  min_bet_display: number
  max_bet_display: number
  bet_step_display: number
  provider_limit_code: string
  provider_bet_group_version: string
  check_result: GameLimitCheckResult
  checked_at: string
}

export interface GameSessionBetGroupSnapshot {
  session_id: string
  merchant_id: string
  player_wallet_id: string
  provider_id: string
  provider_game_id: string
  provider_currency_connection_id: string
  provider_bet_group_id: string
  provider_bet_group_code: string
  provider_bet_group_name: string
  provider_bet_group_version: string
  limit_source: GameLimitSource
  min_bet: number
  max_bet: number
  bet_step: number
  locked_at: string
}

export const gameLimitLevelLabel: Record<GameLimitLevel, string> = {
  GENERAL: '一般',
  HIGH: '高額',
  VIP: 'VIP'
}

export const gameLimitStatusLabel: Record<GameLimitStatus, string> = {
  active: '啟用',
  draft: '草稿',
  disabled: '停用'
}

export const gameLimitSourceLabel: Record<GameLimitSource, string> = {
  provider_default: '供應商預設',
  agent_assignment: '代理授權',
  merchant_currency_default: '商戶幣別預設',
  merchant_game_assignment: '商戶遊戲指派',
  player_override: '會員特殊額度'
}

export const gameLimitCheckResultLabel: Record<GameLimitCheckResult, string> = {
  passed: '檢查通過',
  blocked: '已攔截',
  manual_review: '人工審核'
}
