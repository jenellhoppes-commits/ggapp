import type { BetCenterRecord, MerchantRecord } from '../types/game-provider'

/** Additive September fixtures; never replace existing transactions or provision production access. */
export function reportSampleActivity(templates: BetCenterRecord[], merchants: MerchantRecord[]) {
  const chosen = new Map<string, BetCenterRecord>()
  for (const bet of templates) {
    const merchant = merchants.find((m) => m.id === bet.merchantId)
    if (
      merchant?.lines.some((l) => l.uid === bet.lineUid && l.environment === 'Production') &&
      !chosen.has(bet.merchantId)
    )
      chosen.set(bet.merchantId, bet)
    if (chosen.size === 3) break
  }
  const key = (bet: BetCenterRecord) => [bet.merchantId, bet.lineUid, bet.gameId].join('|')
  const extra = new Map<string, BetCenterRecord>()
  const originalKeys = new Set([...chosen.values()].map(key))
  for (const bet of templates) {
    if (bet.id.startsWith('RPT-') || originalKeys.has(key(bet))) continue
    if (
      !merchants
        .find((m) => m.id === bet.merchantId)
        ?.lines.some((l) => l.uid === bet.lineUid && l.environment === 'Production')
    )
      continue
    if (!extra.has(key(bet))) extra.set(key(bet), bet)
    if (extra.size >= 24) break
  }
  // Ensure every available production currency has a sample, without altering existing samples.
  const represented = new Set([...chosen.values(), ...extra.values()].map((b) => b.currency))
  for (const bet of templates) {
    if (bet.id.startsWith('RPT-') || represented.has(bet.currency)) continue
    if (
      !merchants
        .find((m) => m.id === bet.merchantId)
        ?.lines.some((l) => l.uid === bet.lineUid && l.environment === 'Production')
    )
      continue
    extra.set(key(bet), bet)
    represented.add(bet.currency)
  }
  return [...chosen.values(), ...extra.values()].flatMap((template, merchantIndex) =>
    Array.from({ length: 10 }, (_, dayIndex) => {
      const day = String(dayIndex + 1).padStart(2, '0')
      const betAmount = 10000 + merchantIndex * 2000 + dayIndex * 100
      const payoutAmount = dayIndex === 2 ? betAmount + 500 : betAmount - 1000 - merchantIndex * 100
      const time = `2026-09-${day} 12:00:00`
      const id =
        merchantIndex < chosen.size
          ? `RPT-202609-${merchantIndex + 1}-${day}`
          : `RPT-EXTRA-202609-${encodeURIComponent(key(template))}-${day}`
      return {
        ...template,
        id,
        roundId: `ROUND-${id}`,
        betAmount,
        payoutAmount,
        playerNet: payoutAmount - betAmount,
        status: 'Settled' as const,
        time,
        betAt: time.replace(' ', 'T') + '+08:00',
        settledAt: time.replace(' ', 'T') + '+08:00',
        transactionIds: [],
        riskStatus: 'Normal' as const,
        result: {
          ...template.result,
          resultType: payoutAmount > betAmount ? ('Win' as const) : ('Loss' as const),
          outcome: payoutAmount > betAmount ? '玩家淨贏' : '玩家淨輸',
          multiplier: payoutAmount / betAmount,
          feature: '一般遊戲',
          resultCode: id,
          jackpotAmount: 0,
          summary: `投注 ${betAmount}，派彩 ${payoutAmount}`,
          rawPayload: JSON.stringify({ id, betAmount, payoutAmount }),
          replay: {
            status: 'Unsupported' as const,
            supportsBoardDisplay: false,
            supportsResultReplay: false,
            supportsEventReplay: false,
            stages: [],
            events: []
          }
        }
      }
    })
  )
}
