import type { FinancialReportGroupBy, FinancialReportItem } from '../types/report'

interface FinancialFact {
  date: string
  agent: string
  provider: string
  merchant: string
  totalBet: number
  totalWin: number
  agentGameCharge: number
  fxServiceFee: number
  agentAdjustment: number
  providerPayable: number
  platformAdjustment: number
  activityCost: number
  compensationCost: number
  roundCount: number
}

const facts: FinancialFact[] = [
  { date: '2026-07-06', agent: '平台直營代理', provider: 'PG Soft', merchant: 'Blue Whale Interactive', totalBet: 3200000, totalWin: 2598750, agentGameCharge: 42087.5, fxServiceFee: 3006.25, agentAdjustment: 0, providerPayable: 24050, platformAdjustment: 0, activityCost: 0, compensationCost: 0, roundCount: 12840 },
  { date: '2026-07-06', agent: '平台直營代理', provider: 'JILI', merchant: 'Royal Ace Group', totalBet: 2100000, totalWin: 1768850, agentGameCharge: 28147.75, fxServiceFee: 1655.75, agentAdjustment: 0, providerPayable: 17219.8, platformAdjustment: -120, activityCost: 0, compensationCost: 0, roundCount: 9320 },
  { date: '2026-07-07', agent: 'SEA Growth Agent', provider: 'PG Soft', merchant: 'NovaPlay Entertainment', totalBet: 2000000, totalWin: 1662500, agentGameCharge: 25312.5, fxServiceFee: 1350, agentAdjustment: 0, providerPayable: 13500, platformAdjustment: 0, activityCost: 0, compensationCost: 0, roundCount: 4180 },
  { date: '2026-07-07', agent: 'SEA Growth Agent', provider: 'Pragmatic Play', merchant: 'Golden Dragon Gaming', totalBet: 2200000, totalWin: 1853300, agentGameCharge: 27042.6, fxServiceFee: 1386.8, agentAdjustment: 1200, providerPayable: 17335, platformAdjustment: 0, activityCost: 0, compensationCost: 0, roundCount: 5270 }
]

const roundMoney = (value: number) => Number(value.toFixed(4))

export const buildFinancialReport = (params: {
  groupBy: FinancialReportGroupBy
  startTime?: string
  endTime?: string
}): FinancialReportItem[] => {
  const filtered = facts.filter(fact => {
    if (params.startTime && fact.date < params.startTime) return false
    if (params.endTime && fact.date > params.endTime) return false
    return true
  })
  const groups = new Map<string, FinancialFact[]>()

  filtered.forEach((fact) => {
    const key = fact[params.groupBy]
    groups.set(key, [...(groups.get(key) || []), fact])
  })

  return Array.from(groups.entries()).map(([key, rows]) => {
    const sum = (selector: (row: FinancialFact) => number) => rows.reduce((total, row) => total + selector(row), 0)
    const totalBet = sum(row => row.totalBet)
    const totalWin = sum(row => row.totalWin)
    const settlementGgr = totalBet - totalWin
    const agentGameCharge = sum(row => row.agentGameCharge)
    const fxServiceFee = sum(row => row.fxServiceFee)
    const agentReceivable = agentGameCharge + fxServiceFee + sum(row => row.agentAdjustment)
    const providerPayable = sum(row => row.providerPayable)
    const platformAdjustment = sum(row => row.platformAdjustment)
    const activityCost = sum(row => row.activityCost)
    const compensationCost = sum(row => row.compensationCost)
    const platformMargin = agentReceivable - providerPayable + platformAdjustment - activityCost - compensationCost

    return {
      key,
      settlement_currency: 'USDT',
      total_bet: roundMoney(totalBet),
      total_win: roundMoney(totalWin),
      settlement_ggr: roundMoney(settlementGgr),
      agent_game_charge: roundMoney(agentGameCharge),
      fx_service_fee: roundMoney(fxServiceFee),
      agent_receivable: roundMoney(agentReceivable),
      provider_payable: roundMoney(providerPayable),
      provider_cost: roundMoney(providerPayable),
      platform_adjustment: roundMoney(platformAdjustment),
      adjustment_amount: roundMoney(platformAdjustment),
      activity_cost: roundMoney(activityCost),
      compensation_cost: roundMoney(compensationCost),
      platform_margin: roundMoney(platformMargin),
      margin_rate: agentReceivable > 0 ? roundMoney(platformMargin / agentReceivable) : 0,
      round_count: sum(row => row.roundCount),
      settlement_status: 'locked',
      settlement_batch_id: params.groupBy === 'date' ? `SET-${key.replace(/-/g, '')}` : `AGG-${params.groupBy.toUpperCase()}-${key}`,
      ggr: roundMoney(settlementGgr),
      rtp: totalBet > 0 ? roundMoney((totalWin / totalBet) * 100) : 0
    }
  })
}
