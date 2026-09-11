import assert from 'node:assert/strict'
import { cycleBounds } from '../src/domain/settlement-cycle'
import { prepareSupplierCost, type SupplierCostInput } from '../src/domain/admin-supplier-costs'
import {
  prepareStatement,
  lockStatement,
  readLedger,
  type SettlementInput
} from '../src/domain/settlement-ledger'

const context = {
  roles: ['R_ADMIN'],
  name: 'test',
  today: '2026-09-01',
  timezone: 'Asia/Taipei',
  providers: ['PP'],
  currencies: ['USD'],
  providerCurrencies: { PP: ['USD', 'TWD'] }
}
const contract: SupplierCostInput = {
  scope: 'provider',
  providerId: 'PP',
  basis: 'GGR',
  currency: 'USD',
  cycle: 'Monthly',
  effectiveFrom: '2026-09-01',
  rate: '5',
  meaning: 'payable',
  negativeGgr: 'carry'
}
const cost = prepareSupplierCost([], 'platform', 'platform', '', contract, context)
const empty = { version: 1 as const, statements: [] }
const input: SettlementInput = {
  stream: 'rules',
  month: '2026-09',
  settlementDate: '2026-10-01',
  owner: 'platform',
  ownerId: 'platform',
  timezone: 'Asia/Taipei',
  costs: [cost],
  precision: { USD: 2 },
  bets: [
    {
      id: 'positive',
      providerId: 'PP',
      currency: 'USD',
      time: '2026-09-10T04:00:00Z',
      game: 'g',
      bet: 100000,
      valid: 100000,
      payout: 80000
    },
    {
      id: 'negative',
      providerId: 'PP',
      currency: 'TWD',
      time: '2026-09-20T04:00:00Z',
      game: 'g',
      bet: 100000,
      valid: 100000,
      payout: 120000
    }
  ],
  fx: [{ date: '2026-10-01', from: 'TWD', to: 'USD', rate: '0.03125', version: 'settlement' }]
}
assert.deepEqual(cycleBounds('2026-09-13', 'Weekly'), {
  start: '2026-09-07',
  end: '2026-09-13',
  next: '2026-09-14',
  nextDate: '2026-09-14'
})
assert.equal(cycleBounds('2026-12-31', 'Daily').nextDate, '2027-01-01')
assert.equal(cycleBounds('2028-02').end, '2028-02-29')
assert.throws(() => cycleBounds('2026-02-30', 'Daily'))
const result = prepareStatement(empty, input)
assert.deepEqual(
  result.lines.map((l) => l.settled),
  [10000000, -312500]
)
assert.equal(result.totals[0].amount, 969)
assert.equal(result.carry[0].added, 0, 'different original currencies must net after FX')
assert.equal(result.carry[0].scope, 'platform:platform:PP:USD')
const small = {
  ...input,
  bets: input.bets.map((b, i) => ({
    ...b,
    currency: 'USD',
    bet: 9,
    payout: 0,
    valid: 9,
    id: 'small' + i
  }))
}
assert.equal(
  prepareStatement(empty, small).totals[0].amount,
  1,
  '0.0045 + 0.0045 rounds only once to 0.01'
)
assert.ok(prepareStatement(empty, { ...input, fx: [] }).totals[0].pending)
assert.throws(() => prepareStatement(empty, { ...input, settlementDate: '2026-09-30' }))
let raw: string | null = null
const storage = {
  getItem: () => raw,
  setItem: (_: string, v: string) => {
    raw = v
  }
}
const loss = { ...input, bets: [{ ...input.bets[0], payout: 120000 }] }
lockStatement(storage, raw, loss)
const first = raw
assert.equal(readLedger(raw).statements[0].result.carry[0].closing, 10000000)
const next = {
  ...input,
  month: '2026-10',
  settlementDate: '2026-11-01',
  bets: [{ ...input.bets[0], time: '2026-10-10T04:00:00Z', payout: 70000 }]
}
assert.equal(prepareStatement(readLedger(raw), next).totals[0].amount, 500)
const corrected = {
  ...next,
  adjustments: [
    {
      id: 'callback-1',
      originalStatementId: 'rules:2026-09',
      sourceBetId: 'positive',
      currency: 'USD',
      amountMicros: -1234567,
      reason: 'verified refund'
    }
  ]
}
assert.equal(prepareStatement(readLedger(raw), corrected).totals[0].amount, 377)
assert.throws(() =>
  prepareStatement(readLedger(raw), {
    ...corrected,
    adjustments: [corrected.adjustments[0], corrected.adjustments[0]]
  })
)
assert.throws(() =>
  prepareStatement(readLedger(raw), {
    ...corrected,
    adjustments: [{ ...corrected.adjustments[0], sourceBetId: 'not-in-statement' }]
  })
)
lockStatement(storage, raw, corrected)
assert.equal(
  JSON.stringify(readLedger(raw).statements[0]),
  JSON.stringify(readLedger(first).statements[0])
)
assert.throws(() => lockStatement(storage, first, next), /其他頁面/)
assert.throws(() => prepareStatement(readLedger(raw), corrected), /依序/)
for (const cycle of ['Daily', 'Weekly'] as const) {
  const dated = {
    ...input,
    stream: cycle,
    cycle,
    month: '2026-09-10',
    settlementDate: cycleBounds('2026-09-10', cycle).nextDate,
    costs: [{ ...cost, cycle }],
    bets: [input.bets[0]]
  }
  assert.equal(prepareStatement(empty, dated).totals[0].amount, 1000)
}
console.log(
  'PASS: cycles, FX-before-netting, six-digit amounts, final rounding, carry, corrections, immutable snapshots, duplicate/stale guards'
)
