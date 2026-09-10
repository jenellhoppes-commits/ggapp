import { calculateStatement, type StatementBet } from './supplier-statements'
import { costUnits, type CostOwner, type SupplierCostVersion } from './admin-supplier-costs'
import { platformDate } from './report-four-tabs'

export type DailyFx = { date: string; from: string; to: string; rate: string; version: string }
export function dailySettlement(
  bets: StatementBet[],
  costs: SupplierCostVersion[],
  owner: CostOwner,
  ownerId: string,
  from: string,
  to: string,
  timezone: string,
  fx: DailyFx[],
  precision: Record<string, number>,
  opening: Record<string, number> = {},
  settlementDate?: string
) {
  // Validate all sources and duplicates before daily partitioning.
  calculateStatement(bets, costs, owner, ownerId, from, to, timezone)
  const remaining = { ...opening }
  if (Object.values(remaining).some((v) => !Number.isSafeInteger(v) || v < 0))
    throw new Error('期初扣抵餘額無效')
  const days = [...new Set(bets.map((b) => platformDate(new Date(b.time), timezone)))].sort()
  return days
    .filter((d) => d >= from && d <= to)
    .flatMap((date) =>
      calculateStatement(bets, costs, owner, ownerId, date, date, timezone).map((line) => {
        const contract = costs.find(
          (c) => c.id === line.version && c.owner === owner && c.ownerId === ownerId
        )
        const scope = `${owner}:${ownerId}:${line.providerId}:${line.currency}:${line.basis}:${line.settlementCurrency}`
        const start = remaining[scope] || 0
        const used =
          contract?.negativeGgr === 'carry' && line.basis === 'GGR'
            ? Math.min(start, Math.max(0, line.ggr))
            : 0
        const added =
          contract?.negativeGgr === 'carry' && line.basis === 'GGR' ? Math.max(0, -line.ggr) : 0
        // New negatives are carried to NEXT period, never consumed later in this period.
        const base = line.basis === 'GGR' ? Math.max(0, line.ggr - used) : line.valid
        let issue = !contract
          ? '缺少適用條件'
          : line.basis === 'GGR' && !contract.negativeGgr
            ? '負 GGR 政策待設定'
            : ''
        const matches = fx.filter(
          (r) =>
            r.date === (settlementDate || date) &&
            r.from === line.currency &&
            r.to === line.settlementCurrency
        )
        const rate =
          line.currency === line.settlementCurrency
            ? '1'
            : matches.length === 1
              ? matches[0].rate
              : ''
        const digits = precision[line.settlementCurrency]
        let settled: number | null = null
        if (!Number.isInteger(digits) || digits < 0 || digits > 6) issue ||= '結算幣別精度待設定'
        if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(rate) || Number(rate) <= 0)
          issue ||= '當日匯率缺漏或衝突'
        if (line.currency !== line.settlementCurrency && !matches[0]?.version?.trim())
          issue ||= '缺少當日匯率版本識別'
        if (!Number.isSafeInteger(base)) issue ||= '金額超出安全範圍'
        if (!issue) {
          const [whole, decimals = ''] = rate.split('.')
          const fxUnits = BigInt(whole) * 100000000n + BigInt(decimals.padEnd(8, '0'))
          // Source cents → fee → FX → settlement minor units. Round once, half up.
          const numerator = BigInt(base) * costUnits(line.rate) * fxUnits * 10n ** BigInt(digits)
          const denominator = 100n * 100000000n * 100000000n
          settled = Number((numerator + denominator / 2n) / denominator)
          if (!Number.isSafeInteger(settled)) {
            settled = null
            issue = '金額超出安全範圍'
          }
        }
        if (!issue) remaining[scope] = start - used
        return {
          ...line,
          amount: null,
          date,
          scope,
          base,
          issue,
          settled,
          digits,
          fxRate: rate,
          fxDate: settlementDate || date,
          fxVersion:
            line.currency === line.settlementCurrency ? '同幣 1:1' : matches[0]?.version || '',
          negativeGgr: contract?.negativeGgr,
          opening: start,
          used: issue ? 0 : used,
          added: issue ? 0 : added,
          remaining: issue ? start : start - used
        }
      })
    )
}

/** Period carry summary exists even when no bets occurred. Never writes or locks a ledger. */
export function settlementPeriod(...args: Parameters<typeof dailySettlement>) {
  const lines = dailySettlement(...args)
  const [, , owner, ownerId, , , , , , opening = {}] = args
  const prefix = `${owner}:${ownerId}:`
  if (Object.keys(opening).some((key) => !key.startsWith(prefix)))
    throw new Error('期初扣抵不屬於本對帳對象')
  const scopes = new Set([...Object.keys(opening), ...lines.map((l) => l.scope)])
  const carry = [...scopes].map((scope) => {
    const group = lines.filter((l) => l.scope === scope)
    const start = opening[scope] || 0
    const used = group.reduce((n, l) => n + l.used, 0)
    const added = group.reduce((n, l) => n + l.added, 0)
    const pending = group.some((l) => !!l.issue)
    const closing = start - used + added
    if (!Number.isSafeInteger(closing)) throw new Error('結轉金額超出安全範圍')
    return { scope, opening: start, used, added, closing: pending ? null : closing, pending }
  })
  return { lines, carry }
}
