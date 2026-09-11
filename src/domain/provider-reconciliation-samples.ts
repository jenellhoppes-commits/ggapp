import type { ProviderReconciliationRecord } from '@/types/game-provider'

// Presentation fixtures: allocate the existing bill totals without changing its accounting data.
export function providerReconciliationSamples(
  bill: ProviderReconciliationRecord,
  games: { id: string; providerId: string; name: string; code: string }[]
) {
  const selected = games.filter((game) => game.providerId === bill.providerId)
  const weights = selected.map((_, i) => selected.length - i)
  const weightTotal = weights.reduce((a, b) => a + b, 0)
  const split = (total: number, digits: number) => {
    let remaining = Math.round(total * 10 ** digits)
    return weights.map((weight, index) => {
      const amount =
        index === weights.length - 1
          ? remaining
          : Math.round((total * 10 ** digits * weight) / weightTotal)
      remaining -= amount
      return amount / 10 ** digits
    })
  }
  const count = split(bill.betCount, 0)
  const bets = split(bill.betAmount, 2)
  const valid = split(bill.validBet, 2)
  const payout = split(bill.payoutAmount, 2)
  const settlement = split(bill.initialSettlementAmount, bill.snapshot.amountPrecision)
  return selected.map((game, i) => ({
    gameId: game.id,
    gameName: game.name,
    gameCode: game.code,
    betCount: count[i],
    betAmount: bets[i],
    validBet: valid[i],
    payoutAmount: payout[i],
    ggr: Number((bets[i] - payout[i]).toFixed(2)),
    settlementAmount: settlement[i]
  }))
}
