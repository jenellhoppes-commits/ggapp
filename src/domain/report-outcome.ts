import type { ReportStats } from './report-four-tabs'

/** Derived only from the same scoped original-currency totals; no settlement or payment writes. */
export function reportOutcome(stats: ReportStats) {
  const values = [stats.betAmount, stats.payoutAmount]
  if (values.some((v) => v === null || !/^-?\d+(\.\d+)?$/.test(v))) return { ggr: null, rtp: null }
  const precision = Math.max(...values.map((v) => v!.split('.')[1]?.length ?? 0))
  const units = (value: string) => {
    const negative = value.startsWith('-')
    const [whole, part = ''] = (negative ? value.slice(1) : value).split('.')
    return BigInt(whole + part.padEnd(precision, '0')) * (negative ? -1n : 1n)
  }
  const bet = units(stats.betAmount!),
    payout = units(stats.payoutAmount!)
  const difference = bet - payout
  const digits = (difference < 0n ? -difference : difference)
    .toString()
    .padStart(precision + 1, '0')
  const ggr = `${difference < 0n ? '-' : ''}${precision ? digits.slice(0, -precision) + '.' + digits.slice(-precision) : digits}`
  // Weighted actual RTP is total payout / total bet, not average row RTP.
  const ratio = bet > 0n && payout >= 0n ? (payout * 10000n + bet / 2n) / bet : null
  const rtp =
    ratio === null ? null : `${ratio / 100n}.${(ratio % 100n).toString().padStart(2, '0')}%`
  return { ggr, rtp }
}
