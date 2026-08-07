import type {
  AgentBetLimitAccess,
  BetLimitSnapshot,
  MerchantBetLimitAssignment,
  PlayerBetLimit,
  ProviderBetGroupGame,
  ProviderCurrencyBetGroup
} from '../types/gameLimit'

const syncedAt = '2026-08-05T00:15:00.000+08:00'

export const providerCurrencyBetGroups: ProviderCurrencyBetGroup[] = [
  { provider_bet_group_id: 'PBG-PG-TWD-001', provider_bet_group_code: 'PG-TWD-50-500', provider_bet_group_name: 'TWD 50-500', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-TWD', provider_currency_id: 'PG-CUR-TWD-01', currency: 'TWD', wallet_mode: 'seamless', min_bet: 50, max_bet: 500, bet_step: 10, supported_game_count: 42, is_selected: true, is_default: true, status: 'available', version: 'PG-TWD-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-TWD-002', provider_bet_group_code: 'PG-TWD-500-5000', provider_bet_group_name: 'TWD 500-5000', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-TWD', provider_currency_id: 'PG-CUR-TWD-01', currency: 'TWD', wallet_mode: 'seamless', min_bet: 500, max_bet: 5000, bet_step: 100, supported_game_count: 42, is_selected: true, is_default: false, status: 'available', version: 'PG-TWD-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-TWD-003', provider_bet_group_code: 'PG-TWD-5000-10000', provider_bet_group_name: 'TWD 5000-10000', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-TWD', provider_currency_id: 'PG-CUR-TWD-01', currency: 'TWD', wallet_mode: 'seamless', min_bet: 5000, max_bet: 10000, bet_step: 500, supported_game_count: 36, is_selected: false, is_default: false, status: 'available', version: 'PG-TWD-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-THB-001', provider_bet_group_code: 'PG-THB-20-500', provider_bet_group_name: 'THB 20-500', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-THB', provider_currency_id: 'PG-CUR-THB-01', currency: 'THB', wallet_mode: 'seamless', min_bet: 20, max_bet: 500, bet_step: 10, supported_game_count: 42, is_selected: true, is_default: true, status: 'available', version: 'PG-THB-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-THB-002', provider_bet_group_code: 'PG-THB-500-5000', provider_bet_group_name: 'THB 500-5000', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-THB', provider_currency_id: 'PG-CUR-THB-01', currency: 'THB', wallet_mode: 'seamless', min_bet: 500, max_bet: 5000, bet_step: 100, supported_game_count: 40, is_selected: true, is_default: false, status: 'available', version: 'PG-THB-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-THB-003', provider_bet_group_code: 'PG-THB-5000-50000', provider_bet_group_name: 'THB 5000-50000', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-THB', provider_currency_id: 'PG-CUR-THB-01', currency: 'THB', wallet_mode: 'seamless', min_bet: 5000, max_bet: 50000, bet_step: 500, supported_game_count: 30, is_selected: false, is_default: false, status: 'available', version: 'PG-THB-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-USDT-001', provider_bet_group_code: 'PG-USDT-1-50', provider_bet_group_name: 'USDT 1-50', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-USDT', provider_currency_id: 'PG-CUR-USDT-01', currency: 'USDT', wallet_mode: 'transfer', min_bet: 1, max_bet: 50, bet_step: 0.1, supported_game_count: 42, is_selected: true, is_default: true, status: 'available', version: 'PG-USDT-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-USDT-002', provider_bet_group_code: 'PG-USDT-50-200', provider_bet_group_name: 'USDT 50-200', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-USDT', provider_currency_id: 'PG-CUR-USDT-01', currency: 'USDT', wallet_mode: 'transfer', min_bet: 50, max_bet: 200, bet_step: 1, supported_game_count: 38, is_selected: false, is_default: false, status: 'available', version: 'PG-USDT-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PG-USDT-003', provider_bet_group_code: 'PG-USDT-200-500', provider_bet_group_name: 'USDT 200-500', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-USDT', provider_currency_id: 'PG-CUR-USDT-01', currency: 'USDT', wallet_mode: 'transfer', min_bet: 200, max_bet: 500, bet_step: 5, supported_game_count: 24, is_selected: false, is_default: false, status: 'deprecated', version: 'PG-USDT-2026.07', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-EVO-TWD-001', provider_bet_group_code: 'EVO-TWD-100-5000', provider_bet_group_name: 'TWD 100-5000', provider_id: 'EVO', provider_currency_connection_id: 'PC-EVO-TWD', provider_currency_id: 'EVO-CUR-TWD-01', currency: 'TWD', wallet_mode: 'seamless', min_bet: 100, max_bet: 5000, bet_step: 100, supported_game_count: 18, is_selected: true, is_default: true, status: 'available', version: 'EVO-TWD-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-EVO-TWD-002', provider_bet_group_code: 'EVO-TWD-5000-50000', provider_bet_group_name: 'TWD 5000-50000', provider_id: 'EVO', provider_currency_connection_id: 'PC-EVO-TWD', provider_currency_id: 'EVO-CUR-TWD-01', currency: 'TWD', wallet_mode: 'seamless', min_bet: 5000, max_bet: 50000, bet_step: 500, supported_game_count: 12, is_selected: false, is_default: false, status: 'available', version: 'EVO-TWD-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PP-VND-001', provider_bet_group_code: 'PP-VND-1000-25000000', provider_bet_group_name: 'VND 1000-25000000', provider_id: 'PP', provider_currency_connection_id: 'PC-PP-VND', provider_currency_id: 'PP-CUR-VND-01', currency: 'VND', wallet_mode: 'transfer', min_bet: 1000, max_bet: 25000000, bet_step: 1000, supported_game_count: 28, is_selected: true, is_default: true, status: 'available', version: 'PP-VND-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-PP-VND-002', provider_bet_group_code: 'PP-VND-25000000-100000000', provider_bet_group_name: 'VND 25000000-100000000', provider_id: 'PP', provider_currency_connection_id: 'PC-PP-VND', provider_currency_id: 'PP-CUR-VND-01', currency: 'VND', wallet_mode: 'transfer', min_bet: 25000000, max_bet: 100000000, bet_step: 100000, supported_game_count: 16, is_selected: false, is_default: false, status: 'available', version: 'PP-VND-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-JILI-PHP-001', provider_bet_group_code: 'JILI-PHP-5-20000', provider_bet_group_name: 'PHP 5-20000', provider_id: 'JILI', provider_currency_connection_id: 'PC-JILI-PHP', provider_currency_id: 'JILI-CUR-PHP-01', currency: 'PHP', wallet_mode: 'seamless', min_bet: 5, max_bet: 20000, bet_step: 5, supported_game_count: 31, is_selected: true, is_default: true, status: 'available', version: 'JILI-PHP-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-JILI-PHP-002', provider_bet_group_code: 'JILI-PHP-20000-100000', provider_bet_group_name: 'PHP 20000-100000', provider_id: 'JILI', provider_currency_connection_id: 'PC-JILI-PHP', provider_currency_id: 'JILI-CUR-PHP-01', currency: 'PHP', wallet_mode: 'seamless', min_bet: 20000, max_bet: 100000, bet_step: 100, supported_game_count: 20, is_selected: false, is_default: false, status: 'available', version: 'JILI-PHP-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-JILI-IDR-001', provider_bet_group_code: 'JILI-IDR-50000-500000', provider_bet_group_name: 'IDR 50000-500000', provider_id: 'JILI', provider_currency_connection_id: 'PC-JILI-IDR', provider_currency_id: 'JILI-CUR-IDR-01', currency: 'IDR', wallet_mode: 'transfer', min_bet: 50000, max_bet: 500000, bet_step: 10000, supported_game_count: 31, is_selected: true, is_default: true, status: 'available', version: 'JILI-IDR-2026.08', synced_at: syncedAt },
  { provider_bet_group_id: 'PBG-EVO-PHP-001', provider_bet_group_code: 'EVO-PHP-100-5000', provider_bet_group_name: 'PHP 100-5000', provider_id: 'EVO', provider_currency_connection_id: 'PC-EVO-PHP', provider_currency_id: 'EVO-CUR-PHP-01', currency: 'PHP', wallet_mode: 'seamless', min_bet: 100, max_bet: 5000, bet_step: 100, supported_game_count: 18, is_selected: true, is_default: true, status: 'available', version: 'EVO-PHP-2026.08', synced_at: syncedAt }
]

export const getProviderCurrencyBetGroups = (providerId: string) => providerCurrencyBetGroups.filter(group => group.provider_id === providerId)

export const providerBetGroupGames: ProviderBetGroupGame[] = [
  { provider_bet_group_id: 'PBG-PG-TWD-001', provider_game_id: 'PG-MAHJONG-WAYS-2', provider_game_name: 'Mahjong Ways 2', game_type: 'Slot', status: 'active', version: 'PG-TWD-2026.08' },
  { provider_bet_group_id: 'PBG-PG-TWD-002', provider_game_id: 'PG-MAHJONG-WAYS-2', provider_game_name: 'Mahjong Ways 2', game_type: 'Slot', status: 'active', version: 'PG-TWD-2026.08' },
  { provider_bet_group_id: 'PBG-PG-TWD-003', provider_game_id: 'PG-MAHJONG-WAYS-2', provider_game_name: 'Mahjong Ways 2', game_type: 'Slot', status: 'active', version: 'PG-TWD-2026.08' },
  { provider_bet_group_id: 'PBG-PG-THB-001', provider_game_id: 'PG-LUCKY-NEKO', provider_game_name: 'Lucky Neko', game_type: 'Slot', status: 'active', version: 'PG-THB-2026.08' },
  { provider_bet_group_id: 'PBG-PG-THB-002', provider_game_id: 'PG-LUCKY-NEKO', provider_game_name: 'Lucky Neko', game_type: 'Slot', status: 'active', version: 'PG-THB-2026.08' },
  { provider_bet_group_id: 'PBG-EVO-TWD-001', provider_game_id: 'EVO-BACCARAT-A', provider_game_name: 'Baccarat A', game_type: 'Live', status: 'active', version: 'EVO-TWD-2026.08' }
]

export const getProviderBetGroupGames = (groupId: string) => providerBetGroupGames.filter(item => item.provider_bet_group_id === groupId)

const agentAssignableGroupIds: Record<string, string[]> = {
  'AGT-DIRECT': providerCurrencyBetGroups.filter(group => group.is_selected && group.status === 'available').map(group => group.provider_bet_group_id),
  'AGT-SEA-001': ['PBG-PG-TWD-001', 'PBG-PG-TWD-002', 'PBG-PG-THB-001', 'PBG-PG-THB-002', 'PBG-JILI-PHP-001', 'PBG-JILI-IDR-001', 'PBG-EVO-PHP-001', 'PBG-PP-VND-001'],
  'AGT-SEA-SUB01': ['PBG-PG-THB-001', 'PBG-JILI-PHP-001', 'PBG-JILI-IDR-001', 'PBG-PP-VND-001'],
  'AGT-SEA-SUB01-L3': ['PBG-PP-VND-001']
}

export const getAgentAssignableBetGroups = (agentCode: string) => {
  const allowedIds = new Set(agentAssignableGroupIds[agentCode] ?? [])
  return providerCurrencyBetGroups.filter(group => allowedIds.has(group.provider_bet_group_id) && group.is_selected && group.status === 'available')
}

export const getAgentBetLimitAccess = (agentCode: string, childAssignable = true): AgentBetLimitAccess[] => {
  const providerNames: Record<string, string> = { PG: 'PG Soft', JILI: 'JILI', EVO: 'Evolution', PP: 'Pragmatic Play' }
  return getAgentAssignableBetGroups(agentCode).map((group, index) => {
    const games = providerBetGroupGames.filter(game => game.provider_bet_group_id === group.provider_bet_group_id)
    return {
      provider_id: group.provider_id,
      provider_name: providerNames[group.provider_id] || group.provider_id,
      provider_currency_connection_id: group.provider_currency_connection_id,
      provider_bet_group_id: group.provider_bet_group_id,
      provider_game_ids: games.map(game => game.provider_game_id),
      game_type: games[0]?.game_type || '供應商遊戲',
      provider_bet_group_code: group.provider_bet_group_code,
      provider_bet_group_name: group.provider_bet_group_name,
      min_bet_display: group.min_bet,
      max_bet_display: group.max_bet,
      transaction_currency: group.currency,
      display_currency: group.currency,
      assignable_to_child: childAssignable,
      assigned_merchant_count: Math.max(0, 8 - index),
      status: 'active'
    }
  })
}

export const makeAgentLimitAccess = (currency: string, childAssignable = true): AgentBetLimitAccess[] => {
  const providerNames: Record<string, string> = { PG: 'PG Soft', JILI: 'JILI', EVO: 'Evolution', PP: 'Pragmatic Play' }
  return providerCurrencyBetGroups
    .filter(group => group.currency === currency && group.is_selected && group.status === 'available')
    .map((group, index) => {
      const games = providerBetGroupGames.filter(game => game.provider_bet_group_id === group.provider_bet_group_id)
      return {
        provider_id: group.provider_id,
        provider_name: providerNames[group.provider_id] || group.provider_id,
        provider_currency_connection_id: group.provider_currency_connection_id,
        provider_bet_group_id: group.provider_bet_group_id,
        provider_game_ids: games.map(game => game.provider_game_id),
        game_type: games[0]?.game_type || '供應商遊戲',
        provider_bet_group_code: group.provider_bet_group_code,
        provider_bet_group_name: group.provider_bet_group_name,
        min_bet_display: group.min_bet,
        max_bet_display: group.max_bet,
        transaction_currency: group.currency,
        display_currency: group.currency,
        assignable_to_child: childAssignable,
        assigned_merchant_count: Math.max(0, 8 - index * 3),
        status: 'active'
      }
    })
}

export const makeMerchantBetLimitAssignments = (
  currencies: string[],
  fallbackCurrency: string,
  options: { agentCode?: string; authorizedProviderIds?: string[] } = {}
): MerchantBetLimitAssignment[] => {
  const enabledCurrencies = currencies.length ? currencies : [fallbackCurrency]
  const agentAllowedIds = options.agentCode
    ? new Set(getAgentAssignableBetGroups(options.agentCode).map(group => group.provider_bet_group_id))
    : null
  const authorizedProviderIds = options.authorizedProviderIds?.length ? new Set(options.authorizedProviderIds) : null
  const providerNames: Record<string, string> = { PG: 'PG Soft', JILI: 'JILI', EVO: 'Evolution', PP: 'Pragmatic Play' }
  return providerCurrencyBetGroups
    .filter(group => enabledCurrencies.includes(group.currency)
      && group.is_selected
      && group.is_default
      && group.status === 'available'
      && (!agentAllowedIds || agentAllowedIds.has(group.provider_bet_group_id))
      && (!authorizedProviderIds || authorizedProviderIds.has(group.provider_id)))
    .map(group => ({
      merchant_id: 'OP-1001',
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
      source: '商戶幣別預設',
      status: '啟用'
    }))
}

export const playerBetLimitsByWalletId: Record<string, PlayerBetLimit[]> = {
  'PW-OP1001-mem_8842-TWD': [
    { player_wallet_id: 'PW-OP1001-mem_8842-TWD', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-TWD', provider_bet_group_id: 'PBG-PG-TWD-002', provider_bet_group_code: 'PG-TWD-500-5000', provider_game_id: 'PG-MAHJONG-WAYS-2', game_type: 'Slot', provider_bet_group_name: 'TWD 500-5000', transaction_currency: 'TWD', display_currency: 'TWD', min_bet: 500, max_bet: 5000, source: 'player_override', effective_at: '2026-07-01T01:00:00.000Z', status: 'active' },
    { player_wallet_id: 'PW-OP1001-mem_8842-TWD', provider_id: 'EVO', provider_currency_connection_id: 'PC-EVO-TWD', provider_bet_group_id: 'PBG-EVO-TWD-001', provider_bet_group_code: 'EVO-TWD-100-5000', provider_game_id: '*', game_type: 'Live', provider_bet_group_name: 'TWD 100-5000', transaction_currency: 'TWD', display_currency: 'TWD', min_bet: 100, max_bet: 5000, source: 'merchant_currency_default', effective_at: '2026-07-01T01:00:00.000Z', status: 'active' }
  ],
  'PW-OP1001-mem_8842-PHP': [{ player_wallet_id: 'PW-OP1001-mem_8842-PHP', provider_id: 'JILI', provider_currency_connection_id: 'PC-JILI-PHP', provider_bet_group_id: 'PBG-JILI-PHP-001', provider_bet_group_code: 'JILI-PHP-5-20000', provider_game_id: '*', game_type: 'Slot', provider_bet_group_name: 'PHP 5-20000', transaction_currency: 'PHP', display_currency: 'PHP', min_bet: 5, max_bet: 20000, source: 'merchant_currency_default', effective_at: '2026-07-01T01:00:00.000Z', status: 'active' }],
  'PW-OP1008-nova_7711-THB': [{ player_wallet_id: 'PW-OP1008-nova_7711-THB', provider_id: 'PG', provider_currency_connection_id: 'PC-PG-THB', provider_bet_group_id: 'PBG-PG-THB-003', provider_bet_group_code: 'PG-THB-5000-50000', provider_game_id: 'PG-LUCKY-NEKO', game_type: 'Slot', provider_bet_group_name: 'THB 5000-50000', transaction_currency: 'THB', display_currency: 'THB', min_bet: 5000, max_bet: 50000, source: 'player_override', effective_at: '2026-07-02T01:00:00.000Z', status: 'active' }],
  'PW-OP1009-dragon_9255-VND': [{ player_wallet_id: 'PW-OP1009-dragon_9255-VND', provider_id: 'PP', provider_currency_connection_id: 'PC-PP-VND', provider_bet_group_id: 'PBG-PP-VND-001', provider_bet_group_code: 'PP-VND-1000-25000000', provider_game_id: '*', game_type: 'Slot', provider_bet_group_name: 'VND 1000-25000000', transaction_currency: 'VND', display_currency: 'VND', min_bet: 1000, max_bet: 25000000, source: 'merchant_currency_default', effective_at: '2026-07-01T01:00:00.000Z', status: 'disabled' }]
}

export const getPlayerBetLimits = (playerWalletId: string) => playerBetLimitsByWalletId[playerWalletId] ?? []

export const betLimitSnapshotsByBetId: Record<string, BetLimitSnapshot> = {
  'BET-20260707-000884': { session_id: 'SES-OP1001-TWD-8842', provider_currency_connection_id: 'PC-PG-TWD', provider_game_id: 'PG-MAHJONG-WAYS-2', provider_bet_group_id: 'PBG-PG-TWD-002', provider_bet_group_code: 'PG-TWD-500-5000', provider_bet_group_name: 'TWD 500-5000', provider_bet_group_version: 'PG-TWD-2026.08', limit_source: 'player_override', transaction_currency: 'TWD', display_currency: 'TWD', min_bet_display: 500, max_bet_display: 5000, bet_step_display: 100, provider_limit_code: 'PG-TWD-500-5000', check_result: 'passed', checked_at: '2026-07-07T08:31:22.000Z' },
  'BET-20260707-000771': { session_id: 'SES-OP1008-THB-7711', provider_currency_connection_id: 'PC-PG-THB', provider_game_id: 'PG-LUCKY-NEKO', provider_bet_group_id: 'PBG-PG-THB-001', provider_bet_group_code: 'PG-THB-20-500', provider_bet_group_name: 'THB 20-500', provider_bet_group_version: 'PG-THB-2026.08', limit_source: 'merchant_currency_default', transaction_currency: 'THB', display_currency: 'THB', min_bet_display: 20, max_bet_display: 500, bet_step_display: 10, provider_limit_code: 'PG-THB-20-500', check_result: 'passed', checked_at: '2026-07-07T09:02:18.000Z' },
  'BET-20260707-000552': { session_id: 'SES-OP1006-PHP-5520', provider_currency_connection_id: 'PC-JILI-PHP', provider_game_id: 'JILI-FORTUNE-GEMS', provider_bet_group_id: 'PBG-JILI-PHP-001', provider_bet_group_code: 'JILI-PHP-5-20000', provider_bet_group_name: 'PHP 5-20000', provider_bet_group_version: 'JILI-PHP-2026.08', limit_source: 'merchant_currency_default', transaction_currency: 'PHP', display_currency: 'PHP', min_bet_display: 5, max_bet_display: 20000, bet_step_display: 5, provider_limit_code: 'JILI-PHP-5-20000', check_result: 'passed', checked_at: '2026-07-07T10:06:18.000Z' },
  'BET-20260706-000925': { session_id: 'SES-OP1009-VND-9255', provider_currency_connection_id: 'PC-PP-VND', provider_game_id: 'PP-GATES-OLYMPUS', provider_bet_group_id: 'PBG-PP-VND-001', provider_bet_group_code: 'PP-VND-1000-25000000', provider_bet_group_name: 'VND 1000-25000000', provider_bet_group_version: 'PP-VND-2026.08', limit_source: 'merchant_currency_default', transaction_currency: 'VND', display_currency: 'VND', min_bet_display: 1000, max_bet_display: 25000000, bet_step_display: 1000, provider_limit_code: 'PP-VND-1000-25000000', check_result: 'manual_review', checked_at: '2026-07-06T14:18:00.000Z' }
}

export const getBetLimitSnapshot = (betId: string): BetLimitSnapshot => betLimitSnapshotsByBetId[betId] ?? {
  session_id: '-', provider_currency_connection_id: '-', provider_game_id: '-', provider_bet_group_id: '-', provider_bet_group_code: '-', provider_bet_group_name: '未保存下注限額方案快照', provider_bet_group_version: '-', limit_source: 'provider_default', transaction_currency: 'USDT', display_currency: 'USDT', min_bet_display: 0, max_bet_display: 0, bet_step_display: 0, provider_limit_code: '-', check_result: 'manual_review', checked_at: '-'
}
