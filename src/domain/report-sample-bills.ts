import type {
  BetCenterRecord,
  MerchantReconciliationRecord,
  AgentReconciliationRecord,
  ProviderReconciliationRecord,
  FinanceCalculationSnapshot
} from '../types/game-provider'

/** One immutable source set for the seven prototype reports. Existing bills are not rewritten. */
export function reportSampleBills(
  bets: BetCenterRecord[],
  games: { id: string; providerId: string; name: string; code: string }[]
) {
  const groups = new Map<string, BetCenterRecord[]>()
  for (const b of bets.filter(
    (b) =>
      b.id.startsWith('RPT-202609-') ||
      b.id.startsWith('RPT-EXTRA-202609-') ||
      b.id.startsWith('TWD-RPT-')
  )) {
    const game = games.find((g) => g.id === b.gameId)
    if (!game) continue
    const key = [
      b.id.startsWith('RPT-EXTRA-') ? 'extra' : 'original',
      b.merchantId,
      b.lineUid,
      b.currency,
      game.providerId,
      b.gameType
    ].join('|')
    groups.set(key, [...(groups.get(key) || []), b])
  }
  const merchants: MerchantReconciliationRecord[] = [],
    agents: AgentReconciliationRecord[] = [],
    providers: ProviderReconciliationRecord[] = []
  const activity: Record<string, BetCenterRecord[]> = {}
  let index = 0
  for (const rows of groups.values()) {
    index++
    const b = rows[0],
      game = games.find((g) => g.id === b.gameId)!
    const sum = (key: 'betAmount' | 'payoutAmount') => rows.reduce((n, b) => n + b[key], 0)
    const ggr = sum('betAmount') - sum('payoutAmount')
    const snapshot = (rate: number): FinanceCalculationSnapshot => ({
      settlementBasis: 'GGR',
      ratePercent: rate,
      transactionCurrency: b.currency,
      settlementCurrency: b.currency,
      exchangeRate: 1,
      exchangeRateSource: '同幣別',
      exchangeRateTime: '2026-09-10 12:00:00',
      amountPrecision: 6,
      roundingRule: '四捨五入',
      formulaVersion: 'GGR-REPORT-V1',
      calculatedAt: '2026-09-10 12:00:00',
      reportDimensions: {
        providerId: game.providerId,
        gameType: b.gameType,
        conditionVersion: 'RPT-202609-V1',
        sourceBetIds: rows.map((b) => b.id)
      }
    })
    const common = {
      period: '2026-09',
      periodStart: '2026-09-01 00:00:00',
      periodEnd: '2026-09-10 23:59:59',
      currency: b.currency,
      memberCount: new Set(rows.map((b) => b.memberId)).size,
      betCount: rows.length,
      betAmount: sum('betAmount'),
      validBet: sum('betAmount'),
      payoutAmount: sum('payoutAmount'),
      jackpotContribution: 0,
      jackpotPayout: 0,
      cancelledAmount: 0,
      refundAmount: 0,
      ggr,
      adjustmentAmount: 0,
      differenceCount: 0,
      unresolvedDifferenceCount: 0,
      status: 'Pending Confirmation' as const,
      createdAt: '2026-09-10 12:00:00',
      updatedAt: '2026-09-10 12:00:00'
    }
    const amount = (rate: number) => Number(((Math.max(0, ggr) * rate) / 100).toFixed(6))
    const m: MerchantReconciliationRecord = {
      ...common,
      id: `MRC-RPT-202609-${index}`,
      merchantId: b.merchantId,
      merchantCode: b.merchantId,
      merchantName: b.merchantName,
      agentId: b.agentId,
      agentName: b.agentName,
      lineUid: b.lineUid,
      initialSettlementAmount: amount(6),
      finalSettlementAmount: amount(6),
      snapshot: snapshot(6)
    }
    const a: AgentReconciliationRecord = {
      ...common,
      id: `ARC-RPT-202609-${index}`,
      agentId: b.agentId,
      agentCode: b.agentId,
      agentName: b.agentName,
      merchantCount: 1,
      includedMerchantReconciliationIds: [m.id],
      initialSettlementAmount: amount(5),
      finalSettlementAmount: amount(5),
      snapshot: snapshot(5)
    }
    const p: ProviderReconciliationRecord = {
      ...common,
      id: `PRC-RPT-202609-${index}`,
      providerId: game.providerId,
      providerCode: game.providerId,
      providerName: game.providerId,
      initialSettlementAmount: amount(4),
      finalSettlementAmount: amount(4),
      snapshot: snapshot(4)
    }
    merchants.push(m)
    agents.push(a)
    providers.push(p)
    for (const record of [m, a, p]) activity[record.id] = rows
  }
  return { merchants, agents, providers, activity }
}
