import { rateAt, rateTimeline, type PortalSource, type RateTarget } from './agent-portal'
import { platformDate } from './report-four-tabs'
import type { BetCenterRecord } from '../types/game-provider'

export const SETTLEMENT_RATE_TIME_BASIS = 'betAt' as const

export interface SettlementContractReference {
  targetKind: RateTarget['kind']
  targetId: string
  contractKey: string
  version: number
  effectiveFrom: string
  rate: string
  basis: string
  currency: string
  cycle: string
}
export function contractReference(
  source: PortalSource,
  target: RateTarget,
  date: string
): SettlementContractReference {
  if (!validDate(date)) throw new Error('合約引用日期無效')
  const term = rateAt(source, target, date)
  if (!term?.key) throw new Error(`${date} 缺少可追溯的生效合約，禁止以目前費率補算`)
  return {
    targetKind: target.kind,
    targetId: target.id,
    contractKey: term.key,
    version: term.version,
    effectiveFrom: term.effectiveFrom,
    rate: term.rate,
    basis: term.basis,
    currency: term.currency,
    cycle: term.cycle
  }
}
function validDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`)
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  )
}
/** Half-open date intervals. This is contract coverage, not monetary calculation. */
export function settlementContractCoverage(
  source: PortalSource,
  target: RateTarget,
  from: string,
  toExclusive: string
) {
  if (!validDate(from) || !validDate(toExclusive) || from >= toExclusive)
    throw new Error('結算期間無效')
  const boundaries = [
    ...new Set([
      from,
      toExclusive,
      ...rateTimeline(source, target)
        .flatMap((t) => [t.effectiveFrom, ...(t.until ? [t.until] : [])])
        .filter((d) => d > from && d < toExclusive)
    ])
  ].sort()
  return boundaries.slice(0, -1).map((start, i) => {
    try {
      return {
        from: start,
        toExclusive: boundaries[i + 1],
        reference: contractReference(source, target, start),
        error: ''
      }
    } catch (e) {
      return {
        from: start,
        toExclusive: boundaries[i + 1],
        reference: undefined,
        error: e instanceof Error ? e.message : '合約缺失'
      }
    }
  })
}
export function referenceTransactions(
  source: PortalSource,
  target: RateTarget,
  items: { id: string; betAt?: string; settledAt?: string }[],
  context: { timezone: string; timeBasis: 'betAt' | 'settledAt'; from: string; toExclusive: string }
) {
  if (!['betAt', 'settledAt'].includes(context.timeBasis))
    throw new Error('尚未確認費率適用時間口徑')
  if (
    !context.timezone ||
    !validDate(context.from) ||
    !validDate(context.toExclusive) ||
    context.from >= context.toExclusive
  )
    throw new Error('時區或期間無效')
  if (!items.length) throw new Error('缺少逐筆結算明細，不可由彙總金額推算')
  const ids = new Set<string>()
  return items.map((item) => {
    if (!item.id || ids.has(item.id)) throw new Error('交易識別缺失或重複')
    ids.add(item.id)
    const timestamp = item[context.timeBasis]
    if (
      !timestamp ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(timestamp) ||
      !Number.isFinite(Date.parse(timestamp))
    )
      throw new Error(`${item.id} 缺少含時區的適用時間`)
    const date = platformDate(new Date(timestamp), context.timezone)
    if (date < context.from || date >= context.toExclusive)
      throw new Error(`${item.id} 不在結算期間`)
    return {
      transactionId: item.id,
      timestamp,
      date,
      timeBasis: context.timeBasis,
      timezone: context.timezone,
      contract: contractReference(source, target, date)
    }
  })
}

/** Read-only preparation. No aggregate allocation and no changes to existing statements. */
export function prepareMerchantBetReferences(
  source: PortalSource,
  bets: BetCenterRecord[],
  query: {
    merchantId: string
    lineUid: string
    currency: string
    timezone: string
    from: string
    toExclusive: string
  }
) {
  if (!validDate(query.from) || !validDate(query.toExclusive) || query.from >= query.toExclusive)
    throw new Error('結算期間無效')
  new Intl.DateTimeFormat('en', { timeZone: query.timezone }).format(new Date())
  const merchant = source.merchants.find((m) => m.id === query.merchantId)
  if (!merchant?.lines.some((l) => l.uid === query.lineUid && l.currency === query.currency))
    throw new Error('商戶、線路或幣別關聯不符')
  const references: ReturnType<typeof referenceTransactions> = []
  const issues: { betId: string; reason: string }[] = []
  const excluded: { betId: string; reason: string }[] = []
  const seen = new Set<string>()
  for (const bet of bets.filter(
    (b) =>
      b.merchantId === query.merchantId &&
      b.lineUid === query.lineUid &&
      b.currency === query.currency
  )) {
    if (
      !bet.betAt ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(bet.betAt) ||
      !Number.isFinite(Date.parse(bet.betAt))
    ) {
      issues.push({ betId: bet.id, reason: '缺少含時區的下注時間，禁止改用結算时间或畫面文字' })
      continue
    }
    const date = platformDate(new Date(bet.betAt), query.timezone)
    if (date < query.from || date >= query.toExclusive) continue
    if (!bet.id || seen.has(bet.id)) {
      issues.push({ betId: bet.id, reason: '注單識別缺失或重複' })
      continue
    }
    seen.add(bet.id)
    if (bet.status !== 'Settled') {
      excluded.push({
        betId: bet.id,
        reason: `${bet.status}：未納入一般已結算注單，取消／退款另依後續規則處理`
      })
      continue
    }
    try {
      references.push(
        ...referenceTransactions(
          source,
          { kind: 'merchant', id: query.merchantId },
          [{ id: bet.id, betAt: bet.betAt }],
          { ...query, timeBasis: SETTLEMENT_RATE_TIME_BASIS }
        )
      )
    } catch (e) {
      issues.push({ betId: bet.id, reason: e instanceof Error ? e.message : '無法引用合約' })
    }
  }
  return {
    timeBasis: SETTLEMENT_RATE_TIME_BASIS,
    timezone: query.timezone,
    references,
    issues,
    excluded,
    matchedCount: seen.size,
    canCalculate: false as const
  }
}
