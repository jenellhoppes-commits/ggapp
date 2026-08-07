import { apiClient } from '../apiClient'
import type { RevenueReportRow, TransactionDetailRow } from '../../types/table'
import type { BetLog as SharedBetLog } from '../../types/report'

export interface DailyReportSummary {
  total_bet: number
  total_payout: number
  net_win: number
  tx_count: number
  active_players: number
  rtp: number
}

export type BetLog = SharedBetLog

export interface WinLossRow {
  id: string
  time: string
  game_name: string
  bet: number
  win: number
  status: 'win' | 'loss'
}

export const portalReportService = {
  async getDailyReport(startDate: string, endDate: string) {
    const response = await apiClient.get<{ items: RevenueReportRow[]; summary: DailyReportSummary }>('/api/v2/merchant/reports/daily', {
      startDate,
      endDate
    })
    return response.data
  },

  async listTransactions(params: { startDate?: string; endDate?: string; date?: string; all?: boolean }) {
    const response = await apiClient.get<{ list: TransactionDetailRow[]; total: number }>('/api/v2/merchant/reports/transactions', params)
    return response.data
  },

  async listBetLogs(params: {
    date_start?: string
    date_end?: string
    player_id?: string
    bet_id?: string
    round_id?: string
    cursor?: string
    page_size?: number
  }) {
    const response = await apiClient.post<{ list: BetLog[]; total: number }>('/api/v2/merchant/reports/bet-logs', params)
    return response.data
  },

  async getWinLossReport(params: { date_start?: number; date_end?: number }) {
    const response = await apiClient.post<{ list: WinLossRow[]; total: number }>('/api/v2/agent/report/win-loss', params)
    return response.data
  }
}
