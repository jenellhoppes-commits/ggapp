import { settlementPeriod, type DailyFx } from './daily-settlement'
import type { SupplierCostVersion, CostOwner } from './admin-supplier-costs'
import type { StatementBet } from './supplier-statements'
export const LEDGER_KEY = 'ggap-settlement-ledger-v1'
export type SettlementInput = {
  stream: string
  month: string
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
  const range = bounds(input.month)
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
  if (previous && bounds(previous.input.month).next !== input.month)
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
  if (result.lines.some((l) => l.cycle && l.cycle !== 'Monthly'))
    throw new Error('本入口為月結；日結與週結條件不得以月結單鎖定')
  // Changing policy or basis must not silently discard a previously locked balance.
  for (const [scope, balance] of Object.entries(opening)) {
    if (!balance) continue
    const [, , provider, currency, basis, settlement] = scope.split(':')
    const policy = input.costs
      .filter(
        (c) =>
          c.owner === input.owner &&
          c.ownerId === input.ownerId &&
          c.providerId === provider &&
          (c.scope === 'provider' || c.transactionCurrency === currency) &&
          c.effectiveFrom <= range.end
      )
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]
    if (
      !policy ||
      policy.negativeGgr !== 'carry' ||
      policy.basis !== basis ||
      policy.currency !== settlement
    )
      throw new Error('尚有期初扣抵，政策或幣別變更須先處理餘額，不可直接清除')
  }
  return result
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
  if (
    (!result.lines.length && !result.carry.length) ||
    result.lines.some((l) => l.issue || l.settled === null) ||
    result.carry.some((c) => c.pending)
  )
    throw new Error('資料不完整，不能鎖單')
  const snapshot: LockedStatement = JSON.parse(
    JSON.stringify({
      id: `${input.stream}:${input.month}`,
      input,
      result,
      lockedAt: new Date().toISOString()
    })
  )
  const next: Ledger = { version: 1, statements: [...ledger.statements, snapshot] }
  storage.setItem(LEDGER_KEY, JSON.stringify(next)) // Snapshot and closing balances committed together.
  return next
}
