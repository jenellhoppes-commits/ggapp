import assert from 'node:assert/strict'
import { statementExample } from '../src/domain/supplier-statements'
import {
  lockStatement,
  readLedger,
  prepareDelivery,
  type SettlementInput
} from '../src/domain/settlement-ledger'
const e = statementExample('merchant', 'M', 7)
const input: SettlementInput = {
  stream: 'delivery-test',
  month: '2026-09',
  settlementDate: '2026-10-01',
  owner: 'merchant',
  ownerId: 'M',
  timezone: 'Asia/Taipei',
  costs: e.costs.map((c) => ({ ...c, negativeGgr: 'carry' })),
  bets: [e.bets[0]],
  fx: [],
  precision: { USD: 2 },
  delivery: [
    {
      currency: 'USD',
      differenceMicros: 1000000,
      paidMinor: 500,
      defer: true,
      reason: '財務核對差異 1；剩餘下期收款'
    }
  ]
}
let raw: string | null = null
const storage = {
  getItem: () => raw,
  setItem: (_: string, v: string) => {
    raw = v
  }
}
const first = lockStatement(storage, raw, input)
assert.equal(first.statements[0].delivery![0].dueMinor, 1500)
assert.equal(first.statements[0].delivery![0].carriedMinor, 1000)
assert.equal(first.statements[0].delivery![0].status, '部分收付／餘額已結轉下期')
assert.equal(first.statements[0].result.carry[0].closing, 0)
const snapshot = JSON.stringify(first.statements[0])
assert.throws(() => lockStatement(storage, raw, input), /依序/)
const next = {
  ...input,
  month: '2026-10',
  settlementDate: '2026-11-01',
  bets: [],
  delivery: [{ currency: 'USD', differenceMicros: 0, paidMinor: 1000, defer: false, reason: '' }]
}
const second = lockStatement(storage, raw, next)
assert.equal(second.statements[1].delivery![0].openingMinor, 1000)
assert.equal(second.statements[1].delivery![0].carriedMinor, 0)
assert.equal(second.statements[1].delivery![0].status, '已收付')
assert.equal(JSON.stringify(readLedger(raw).statements[0]), snapshot)
const empty = { version: 1 as const, statements: [] }
assert.throws(
  () => prepareDelivery(empty, { ...input, delivery: [{ ...input.delivery![0], paidMinor: 501 }] }),
  /只接受整數/
)
const fractional = prepareDelivery(empty, {
  ...input,
  delivery: [{ ...input.delivery![0], differenceMicros: 10000, paidMinor: 1400 }]
})
assert.equal(
  fractional[0].carriedMinor,
  0,
  'fractional receivable is discarded and must not carry forward'
)
assert.throws(
  () => prepareDelivery(empty, { ...input, delivery: [{ ...input.delivery![0], reason: '' }] }),
  /原因/
)
assert.throws(
  () =>
    prepareDelivery(empty, { ...input, delivery: [{ ...input.delivery![0], paidMinor: 99999 }] }),
  /不可超過/
)
assert.throws(
  () =>
    lockStatement({ getItem: () => null, setItem: () => {} }, null, {
      ...input,
      delivery: [{ ...input.delivery![0], defer: false }]
    }),
  /未收付/
)
const negative = {
  ...input,
  bets: [{ ...e.bets[0], payout: 120000 }],
  delivery: [{ currency: 'USD', differenceMicros: 0, paidMinor: 0, defer: false, reason: '' }]
}
const loss = lockStatement({ getItem: () => null, setItem: () => {} }, null, negative).statements[0]
assert.equal(loss.result.carry[0].closing, 14000000)
assert.equal(loss.delivery![0].dueMinor, 0)
assert.equal(loss.delivery![0].carriedMinor, 0)
assert.equal(loss.delivery![0].status, '無須收付')
console.log(
  'PASS delivery: manual difference, reason required, partial receipt, unpaid carry, next period collection, no duplicate, immutable snapshot, separate negative GGR'
)
