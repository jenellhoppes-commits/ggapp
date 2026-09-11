import { platformDate, validDate } from './report-four-tabs'
export type DashboardBet = {
  merchantId: string
  id: string
  time: string
  betAt?: string
  currency: string
  status: string
  betAmount: number
  payoutAmount?: number
  memberId?: string
  roundId?: string
}
export function merchantBetDay(b: Pick<DashboardBet, 'time' | 'betAt'>) {
  const raw = b.betAt || b.time
  // Legacy demo times are platform-local; never interpret them in the browser's timezone.
  const instant = /(Z|[+-]\d{2}:\d{2})$/.test(raw) ? raw : raw.replace(' ', 'T') + '+08:00'
  try {
    return platformDate(instant, 'Asia/Taipei')
  } catch {
    return ''
  }
}
export function merchantDashboardRows<T extends DashboardBet>(
  bets: T[],
  merchantId: string | undefined,
  dates: [string, string] | null,
  currency = ''
) {
  if (!merchantId) return []
  if (dates && (!dates.every(validDate) || dates[0] > dates[1])) return []
  return bets.filter(
    (b) =>
      b.merchantId === merchantId &&
      (!currency || b.currency === currency) &&
      (!dates || (merchantBetDay(b) >= dates[0] && merchantBetDay(b) <= dates[1]))
  )
}
export function merchantDashboardSummary(bets: DashboardBet[]) {
  const groups = new Map<
    string,
    {
      currency: string
      total: number
      count: number
      other: number
      bet: number
      payout: number
      ggr: number
      rtp: number | null
    }
  >()
  for (const b of bets) {
    const r = groups.get(b.currency) || {
      currency: b.currency,
      total: 0,
      count: 0,
      other: 0,
      bet: 0,
      payout: 0,
      ggr: 0,
      rtp: null
    }
    r.total++
    if (b.status === 'Settled' && Number.isFinite(b.betAmount) && Number.isFinite(b.payoutAmount)) {
      r.count++
      r.bet += b.betAmount
      r.payout += b.payoutAmount!
    } else r.other++
    r.ggr = r.bet - r.payout
    r.rtp = r.bet > 0 ? (r.payout / r.bet) * 100 : null
    groups.set(b.currency, r)
  }
  return [...groups.values()].sort((a, b) => a.currency.localeCompare(b.currency))
}
