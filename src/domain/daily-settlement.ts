import { calculateStatement, type StatementBet } from './supplier-statements'
import { costUnits, type CostOwner, type SupplierCostVersion } from './admin-supplier-costs'
import { platformDate } from './report-four-tabs'
import { divideRounded, safeMoney, finalMinor } from './settlement-money'

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
  calculateStatement(bets, costs, owner, ownerId, from, to, timezone)
  if (Object.values(opening).some((v) => !Number.isSafeInteger(v) || v < 0))
    throw new Error('期初扣抵餘額無效')
  const days = [...new Set(bets.map((b) => platformDate(new Date(b.time), timezone)))].sort()
  return days
    .filter((d) => d >= from && d <= to)
    .flatMap((date) =>
      calculateStatement(bets, costs, owner, ownerId, date, date, timezone).map((line) => {
        const contract = costs.find(
          (c) => c.id === line.version && c.owner === owner && c.ownerId === ownerId
        )
        const scope = [
          owner,
          ownerId,
          line.providerId,
          line.settlementCurrency,
          ...(line.gameType ? [line.gameType] : [])
        ].join(':')
        const base = line.basis === 'GGR' ? line.ggr : line.valid
        let issue = !contract
          ? '缺少適用條件'
          : !contract.negativeGgr
            ? '負 GGR 政策待設定'
            : line.sources.some((b) => b.validConfirmed === false) && line.basis !== 'GGR'
              ? '交易來源未提供有效投注'
              : ''
        const matches = fx.filter(
          (r) =>
            r.date === settlementDate &&
            r.from === line.currency &&
            r.to === line.settlementCurrency
        )
        const rate =
          line.currency === line.settlementCurrency
            ? '1'
            : matches.length === 1
              ? matches[0].rate
              : ''
        const finalDigits = precision[line.settlementCurrency]
        if (!settlementDate) issue ||= '請指定結算日期或預估匯率日期'
        if (!Number.isInteger(finalDigits) || finalDigits < 0 || finalDigits > 6)
          issue ||= '結算幣別精度待設定'
        if (!/^(0|[1-9]\d*)(\.\d{1,8})?$/.test(rate) || Number(rate) <= 0)
          issue ||= '結算日匯率缺漏或衝突'
        if (line.currency !== line.settlementCurrency && !matches[0]?.version?.trim())
          issue ||= '缺少匯率版本識別'
        let settled: number | null = null
        if (!issue) {
          const [whole, decimals = ''] = rate.split('.')
          const fxUnits = BigInt(whole) * 100000000n + BigInt(decimals.padEnd(8, '0'))
          // Convert each source fee to millionths; round to currency minor units only in totals.
          settled = safeMoney(
            line.sources.reduce((sum, b) => {
              const value = line.basis === 'GGR' ? b.bet - b.payout : b.valid
              return (
                sum +
                divideRounded(
                  BigInt(value) * costUnits(line.rate) * fxUnits * 1000000n,
                  100n * 100000000n * 100000000n
                )
              )
            }, 0n)
          )
        }
        return {
          ...line,
          amount: null,
          date,
          scope,
          base,
          issue,
          settled,
          digits: 6,
          finalDigits,
          fxRate: rate,
          fxDate: settlementDate || '',
          fxVersion:
            line.currency === line.settlementCurrency ? '同幣 1:1' : matches[0]?.version || '',
          negativeGgr: contract?.negativeGgr,
          opening: opening[scope] || 0,
          used: 0,
          added: 0,
          remaining: opening[scope] || 0
        }
      })
    )
}
export function settlementPeriod(...args: Parameters<typeof dailySettlement>) {
  const lines = dailySettlement(...args)
  const [, costs, owner, ownerId, , to, , , precision, opening = {}] = args
  if (
    Object.keys(opening).some(
      (key) =>
        !key.startsWith(owner + ':' + ownerId + ':') || ![4, 5].includes(key.split(':').length)
    )
  )
    throw new Error('期初餘額不是本對象的結算幣餘額；舊原幣帳本須先核對轉入')
  const scopes = new Set([...Object.keys(opening), ...lines.map((l) => l.scope)])
  const carry = [...scopes].map((scope) => {
    const group = lines.filter((l) => l.scope === scope)
    const [, , providerId, currency, gameType] = scope.split(':')
    const policies = new Set(group.map((l) => l.negativeGgr))
    const fallback = costs
      .filter(
        (c) =>
          c.owner === owner &&
          c.ownerId === ownerId &&
          c.providerId === providerId &&
          c.gameType === gameType &&
          c.currency === currency &&
          c.effectiveFrom <= to
      )
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
    const policy = group.length ? group[0].negativeGgr : fallback?.negativeGgr
    const start = opening[scope] || 0
    const pending =
      group.some((l) => !!l.issue) ||
      policies.size > 1 ||
      !policy ||
      (start > 0 && policy !== 'carry')
    if (pending)
      group.forEach((l) => {
        l.issue ||= '結轉政策缺漏、期中不一致或尚有待處理餘額'
      })
    const net = safeMoney(group.reduce((n, l) => n + BigInt(l.settled || 0), 0n))
    const used = policy === 'carry' ? Math.min(start, Math.max(0, net)) : 0
    const added = policy === 'carry' ? Math.max(0, -net) : 0
    const closing = safeMoney(BigInt(start) - BigInt(used) + BigInt(added))
    const payable = Math.max(0, net - used)
    return {
      scope,
      currency,
      opening: start,
      used,
      added,
      closing: pending ? null : closing,
      pending,
      payable,
      net
    }
  })
  const totals = [...new Set(carry.map((c) => c.currency))].map((currency) => {
    const groups = carry.filter((c) => c.currency === currency)
    const micro = safeMoney(groups.reduce((n, c) => n + BigInt(c.payable), 0n))
    const digits = precision[currency]
    const pending = groups.some((c) => c.pending) || !Number.isInteger(digits)
    return { currency, micro, digits, pending, amount: pending ? null : finalMinor(micro, digits) }
  })
  return { lines, carry, totals }
}
