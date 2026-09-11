import type { ReportBet, ReportEvent } from './report-four-tabs'

/** Report-only examples: no wallet, line permissions or financial bills are created. */
export function twdReportExamples(bets: ReportBet[], events: ReportEvent[]) {
  const selected = bets.filter((b) => b.id.startsWith('RPT-') && b.currency === 'USD')
  const keys = new Map<string, string>()
  const examples = selected.map((b) => {
    const next = {
      ...b,
      source: 'report-example',
      id: `TWD-${b.id}`,
      currency: 'TWD',
      roundId: `TWD-${b.roundId}`
    }
    keys.set(
      JSON.stringify([b.source, b.environment, b.merchantId, b.id]),
      JSON.stringify([next.source, next.environment, next.merchantId, next.id])
    )
    return next
  })
  const payouts = events
    .filter((e) => e.betKeys.length > 0 && e.betKeys.every((k) => keys.has(k)))
    .map((e) => ({
      ...e,
      source: 'report-example',
      id: `TWD-${e.id}`,
      currency: 'TWD',
      roundId: `TWD-${e.roundId}`,
      betKeys: e.betKeys.map((k) => keys.get(k)!)
    }))
  return { bets: examples, events: payouts }
}
