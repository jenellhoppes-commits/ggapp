import assert from 'node:assert/strict'
import {
  lockStatement,
  readLedger,
  prepareStatement,
  LEDGER_KEY,
  type SettlementInput
} from '../src/domain/settlement-ledger'
import { statementExample } from '../src/domain/supplier-statements'
const e = statementExample('merchant', 'M', 7)
const input: SettlementInput = {
  stream: 'merchant-M',
  month: '2026-09',
  settlementDate: '2026-10-01',
  owner: 'merchant',
  ownerId: 'M',
  timezone: 'Asia/Taipei',
  costs: e.costs.map((c) => ({ ...c, negativeGgr: 'carry' })),
  bets: [{ ...e.bets[0], payout: 120000 }],
  fx: [],
  precision: { USD: 2 }
}
let raw: string | null = null
const storage = {
  getItem: () => raw,
  setItem: (_: string, value: string) => {
    raw = value
  }
}
const first = lockStatement(storage, null, input)
assert.equal(first.statements[0].result.carry[0].closing, 14000000)
const persisted = raw
assert.throws(() => lockStatement(storage, null, input), /其他頁面/)
assert.throws(() => lockStatement(storage, raw, input), /重複鎖單/)
assert.equal(raw, persisted)
const next = { ...input, month: '2026-10', settlementDate: '2026-11-01', bets: [] }
const second = lockStatement(storage, raw, next)
assert.equal(second.statements[1].result.carry[0].opening, 14000000)
assert.equal(second.statements[1].result.carry[0].closing, 14000000)
assert.throws(
  () => prepareStatement(second, { ...next, month: '2026-12', settlementDate: '2027-01-01' }),
  /跳期/
)
const third = {
  ...input,
  month: '2026-11',
  settlementDate: '2026-12-01',
  bets: [{ ...e.bets[0], time: '2026-11-15T04:00:00Z' }]
}
const final = lockStatement(storage, raw, third)
assert.equal(final.statements[2].result.carry[0].used, 14000000)
assert.equal(final.statements[2].result.carry[0].closing, 0)
input.costs[0].payable = '99'
assert.equal(readLedger(raw).statements[0].input.costs[0].payable, '7')
assert.throws(
  () =>
    prepareStatement(first, {
      ...next,
      costs: input.costs.map((c) => ({ ...c, negativeGgr: 'zero' }))
    }),
  /餘額/
)
const broken = {
  getItem: () => null,
  setItem: () => {
    throw new Error('quota')
  }
}
assert.throws(() => lockStatement(broken, null, input), /quota/)
assert.throws(() => readLedger('{broken'), SyntaxError)
assert.equal(LEDGER_KEY, 'ggap-settlement-ledger-v1')
console.log(
  'Ledger passed: atomic save, reload, immutable snapshot, next-period carry, no-activity carry, consumption, duplicate/stale/skip blocking, policy changes and storage errors'
)
