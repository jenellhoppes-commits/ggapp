import type { GameLimitSource, ProviderBetGroupGame, ProviderCurrencyBetGroup } from '../types/gameLimit'

export interface BetGroupCandidate {
  source: GameLimitSource
  group: ProviderCurrencyBetGroup
  provider_game_id: string
}

export interface ResolvedBetGroup {
  source: GameLimitSource
  provider_bet_group_id: string
  provider_bet_group_code: string
  provider_bet_group_name: string
  provider_bet_group_version: string
  provider_currency_connection_id: string
  provider_game_id: string
  min_bet: number
  max_bet: number
  bet_step: number
}

export interface BetGroupResolutionContext {
  provider_id: string
  provider_currency_connection_id: string
  provider_game_id: string
  group_games: ProviderBetGroupGame[]
}

const sourcePriority: Record<GameLimitSource, number> = {
  player_override: 5,
  merchant_game_assignment: 4,
  merchant_currency_default: 3,
  agent_assignment: 2,
  provider_default: 1
}

export const resolveBetGroup = (candidates: BetGroupCandidate[], context: BetGroupResolutionContext): ResolvedBetGroup | null => {
  const eligible = candidates
    .filter(candidate => candidate.group.status === 'available' && candidate.group.is_selected)
    .filter(candidate => candidate.group.provider_id === context.provider_id)
    .filter(candidate => candidate.group.provider_currency_connection_id === context.provider_currency_connection_id)
    .filter(candidate => candidate.provider_game_id === context.provider_game_id)
    .filter(candidate => context.group_games.some(mapping => (
      mapping.provider_bet_group_id === candidate.group.provider_bet_group_id
      && mapping.provider_game_id === context.provider_game_id
      && mapping.status === 'active'
      && mapping.version === candidate.group.version
    )))
    .sort((left, right) => sourcePriority[right.source] - sourcePriority[left.source])

  const selected = eligible[0]

  if (!selected) return null

  const samePriority = eligible.filter(candidate => sourcePriority[candidate.source] === sourcePriority[selected.source])
  if (new Set(samePriority.map(candidate => candidate.group.provider_bet_group_id)).size > 1) {
    throw new Error(`Conflicting bet groups at source ${selected.source}`)
  }

  return {
    source: selected.source,
    provider_bet_group_id: selected.group.provider_bet_group_id,
    provider_bet_group_code: selected.group.provider_bet_group_code,
    provider_bet_group_name: selected.group.provider_bet_group_name,
    provider_bet_group_version: selected.group.version,
    provider_currency_connection_id: selected.group.provider_currency_connection_id,
    provider_game_id: selected.provider_game_id,
    min_bet: selected.group.min_bet,
    max_bet: selected.group.max_bet,
    bet_step: selected.group.bet_step
  }
}
