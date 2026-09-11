import { settlementPeriod, type DailyFx } from './daily-settlement'
import type { SupplierCostVersion, CostOwner } from './admin-supplier-costs'
import type { StatementBet } from './supplier-statements'
import { cycleBounds, type SettlementCycle } from './settlement-cycle'
import { finalMinor, safeMoney } from './settlement-money'
export type SettlementAdjustment = {
  id: string
  originalStatementId: string
  sourceBetId: string
  currency: string
  amountMicros: number
  reason: string
}
export const LEDGER_KEY = 'ggap-settlement-ledger-v1'
export type DeliveryEntry = {
  currency: string
  differenceMicros: number
  paidMinor: number
  defer: boolean
  reason: string
}
export type DeliveryResult = DeliveryEntry & {
  openingMinor: number
  dueMinor: number
  remainingMinor: number
  carriedMinor: number
  digits: number
  status: string
}
export type SettlementInput = {
  stream: string
  month: string
  cycle?: SettlementCycle
  adjustments?: SettlementAdjustment[]
  delivery?: DeliveryEntry[]
  confirmedBy?: string
  settlementDate?: string
  owner: CostOwner
  ownerId: string
  timezone: string
  bets: StatementBet[]
  costs: SupplierCostVersion[]
  fx: DailyFx[]
  precision: Record<string, number>
}
export type LockedStatement = {
  id: string
  input: SettlementInput
  result: ReturnType<typeof settlementPeriod>
  lockedAt: string
  delivery?: DeliveryResult[]
}
export type Ledger = { version: 1; statements: LockedStatement[] }
export function readLedger(raw: string | null): Ledger {
  if (!raw) return { version: 1, statements: [] }
  const value = JSON.parse(raw)
  if (
    value.version !== 1 ||
    !Array.isArray(value.statements) ||
    value.statements.some(
      (s: LockedStatement) =>
        !s.input?.stream || !s.result?.carry || !s.result?.lines || !s.lockedAt
    )
  )
    throw new Error('結轉帳本格式無效，保留原資料，不覆寫')
  return value
}
export function bounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('請選擇有效月份')
  const start = `${month}-01`
  const d = new Date(`${start}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + 1)
  return {
    start,
    end: new Date(d.getTime() - 86400000).toISOString().slice(0, 10),
    next: d.toISOString().slice(0, 7)
  }
}
export function prepareStatement(ledger: Ledger, input: SettlementInput) {
  const range = cycleBounds(input.month, input.cycle)
  const settlementDate = input.settlementDate
  if (
    !settlementDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(settlementDate) ||
    !Number.isFinite(Date.parse(`${settlementDate}T00:00:00Z`)) ||
    new Date(`${settlementDate}T00:00:00Z`).toISOString().slice(0, 10) !== settlementDate ||
    settlementDate <= range.end
  )
    throw new Error('請指定帳期結束後的有效結算日期；所有交易統一套用此日匯率')
  const history = ledger.statements.filter((s) => s.input.stream === input.stream)
  const previous = history.at(-1)
  if (
    previous &&
    (previous.input.owner !== input.owner || previous.input.ownerId !== input.ownerId)
  )
    throw new Error('帳本對象不一致')
  if (previous && (previous.input.cycle || 'Monthly') !== (input.cycle || 'Monthly'))
    throw new Error('同一帳本不可混用結算週期')
  if (
    previous &&
    cycleBounds(previous.input.month, previous.input.cycle).next !==
      (input.cycle === 'Weekly' ? range.start : input.month)
  )
    throw new Error('請依序結算下一期；不可跳期、倒填或重複鎖單')
  const opening = Object.fromEntries(
    (previous?.result.carry || []).map((c) => [c.scope, c.closing!])
  )
  const result = settlementPeriod(
    input.bets,
    input.costs,
    input.owner,
    input.ownerId,
    range.start,
    range.end,
    input.timezone,
    input.fx,
    input.precision,
    opening,
    settlementDate
  )
  if (result.lines.some((l) => l.cycle && l.cycle !== (input.cycle || 'Monthly')))
    throw new Error('所選帳期週期與適用條件不一致，不能鎖定')
  // Changing policy or basis must not silently discard a previously locked balance.
  for (const [scope, balance] of Object.entries(opening)) {
    if (!balance) continue
    const [, , provider, settlement, gameType] = scope.split(':')
    const policy = input.costs
      .filter(
        (c) =>
          c.owner === input.owner &&
          c.ownerId === input.ownerId &&
          c.providerId === provider &&
          c.gameType === gameType &&
          c.effectiveFrom <= range.end
      )
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
    if (!policy || policy.negativeGgr !== 'carry' || policy.currency !== settlement)
      throw new Error('尚有期初扣抵，政策或幣別變更須先處理餘額，不可直接清除')
  }
  const adjustments = input.adjustments || []
  const ids = new Set<string>()
  for (const a of adjustments) {
    const original = history.find((s) => s.id === a.originalStatementId)
    if (
      !a.id.trim() ||
      ids.has(a.id) ||
      history.some((s) => s.input.adjustments?.some((old) => old.id === a.id))
    )
      throw new Error('退款／回調識別重複或未填寫')
    ids.add(a.id)
    if (
      !original ||
      cycleBounds(original.input.month, original.input.cycle).end >= range.start ||
      !original.result.lines.some((l) => l.sources.some((b) => b.id === a.sourceBetId))
    )
      throw new Error('退款／回調必須關聯本對象先前已鎖定單及原交易')
    if (
      !a.reason.trim() ||
      !Number.isSafeInteger(a.amountMicros) ||
      a.amountMicros === 0 ||
      !original.result.lines.some(
        (l) => l.settlementCurrency === a.currency && l.sources.some((b) => b.id === a.sourceBetId)
      )
    )
      throw new Error('請提供有效調整原因、結算幣與六位精度金額')
    let total = result.totals.find((t) => t.currency === a.currency)
    if (!total) {
      total = {
        currency: a.currency,
        micro: 0,
        digits: input.precision[a.currency],
        pending: false,
        amount: 0
      }
      result.totals.push(total)
    }
    total.micro = safeMoney(BigInt(total.micro) + BigInt(a.amountMicros))
    total.amount = total.pending ? null : finalMinor(total.micro, total.digits)
  }
  return result
}
export function prepareDelivery(
  ledger: Ledger,
  input: SettlementInput,
  result = prepareStatement(ledger, input)
): DeliveryResult[] {
  const previous = ledger.statements.filter((s) => s.input.stream === input.stream).at(-1)
  const currencies = new Set([
    ...result.totals.map((t) => t.currency),
    ...(previous?.delivery || []).filter((d) => d.carriedMinor !== 0).map((d) => d.currency)
  ])
  const entries = input.delivery || []
  if (
    new Set(entries.map((d) => d.currency)).size !== entries.length ||
    entries.some((d) => !currencies.has(d.currency))
  )
    throw new Error('交付幣別重複或不屬於本期')
  return [...currencies].map((currency) => {
    const old = previous?.delivery?.find((d) => d.currency === currency)
    const total = result.totals.find((t) => t.currency === currency)
    const digits = total?.digits ?? input.precision[currency]
    if (old && old.carriedMinor && old.digits !== digits)
      throw new Error('結轉幣別精度變更，請先核對餘額')
    const entry = entries.find((d) => d.currency === currency) || {
      currency,
      differenceMicros: 0,
      paidMinor: 0,
      defer: false,
      reason: ''
    }
    if (
      !Number.isSafeInteger(entry.differenceMicros) ||
      !Number.isSafeInteger(entry.paidMinor) ||
      entry.paidMinor < 0
    )
      throw new Error('差異或實收付金額無效')
    if ((entry.differenceMicros !== 0 || entry.defer) && !entry.reason.trim())
      throw new Error('差異調整或結轉下期必須填寫原因')
    if (total?.pending) throw new Error('系統計算資料未齊備，不能交付')
    const openingMinor = old?.carriedMinor || 0
    const dueMinor = safeMoney(
      ((BigInt(total?.micro || 0) +
        BigInt(entry.differenceMicros) +
        (BigInt(openingMinor) * 1000000n) / 10n ** BigInt(digits)) /
        1000000n) *
        10n ** BigInt(digits)
    )
    if (entry.paidMinor > Math.max(0, dueMinor)) throw new Error('實收／實付不可超過調整後應結金額')
    if (entry.paidMinor % 10 ** digits !== 0) throw new Error('實收／實付金額只接受整數，不分幣別')
    const remainingMinor = safeMoney(BigInt(dueMinor) - BigInt(entry.paidMinor))
    return {
      ...entry,
      openingMinor,
      dueMinor,
      remainingMinor,
      carriedMinor: entry.defer ? remainingMinor : 0,
      digits,
      status:
        remainingMinor === 0
          ? dueMinor === 0
            ? '無須收付'
            : '已收付'
          : entry.defer
            ? entry.paidMinor
              ? '部分收付／餘額已結轉下期'
              : '已結轉下期'
            : entry.paidMinor
              ? '部分收付'
              : '未收付'
    }
  })
}
export function lockStatement(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  expected: string | null,
  input: SettlementInput
) {
  if (storage.getItem(LEDGER_KEY) !== expected)
    throw new Error('帳本已由其他頁面更新，請重新載入後再確認')
  const ledger = readLedger(expected)
  const result = prepareStatement(ledger, input)
  const delivery = input.delivery ? prepareDelivery(ledger, input, result) : undefined
  if (delivery?.some((d) => d.remainingMinor !== 0 && !d.defer))
    throw new Error('尚有未收付餘額，請完成收付或選擇累積至下期')
  if (
    (!result.lines.length &&
      !result.carry.length &&
      !input.adjustments?.length &&
      !delivery?.some((d) => d.openingMinor !== 0)) ||
    result.lines.some((l) => l.issue || l.settled === null) ||
    result.carry.some((c) => c.pending) ||
    result.totals.some((t) => t.pending)
  )
    throw new Error('資料不完整，不能鎖單')
  const snapshot: LockedStatement = JSON.parse(
    JSON.stringify({
      id: `${input.stream}:${input.month}`,
      input,
      result,
      delivery,
      lockedAt: new Date().toISOString()
    })
  )
  const next: Ledger = { version: 1, statements: [...ledger.statements, snapshot] }
  storage.setItem(LEDGER_KEY, JSON.stringify(next)) // Snapshot and closing balances committed together.
  return next
}
