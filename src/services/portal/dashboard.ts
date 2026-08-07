import { apiClient } from '../apiClient'
import type { Portal } from '../../stores/auth'

export interface PortalDashboardData {
  wallet: {
    balance: number
    credit_limit: number
    currency: string
    exchange_rate?: number
  }
  today_kpi: {
    total_bet: number
    net_win: number
    active_players: number
    tx_count: number
    comparison: {
      bet_pct: number
      win_pct: number
      player_pct: number
    }
  }
  trend_7d: Array<{
    date: string
    bet: number
    net_win: number
  }>
  alerts: Array<{
    type: string
    message: string
    count: number
  }>
  top_games: Array<{
    name: string
    bet: number
    win: number
  }>
}

export const portalDashboardService = {
  async getStats(portal: Extract<Portal, 'agent' | 'merchant'>) {
    const response = await apiClient.get<PortalDashboardData>(`/api/v2/${portal}/dashboard/stats`)
    return response.data
  }
}
