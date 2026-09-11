import assert from 'node:assert/strict'
import {
  prepareSupplierCost,
  supplierCostAt,
  monthlySettlementDate,
  type SupplierCostInput
} from '../src/domain/admin-supplier-costs'
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
  settlementDay: 1,
  effectiveFrom: '2026-09-01',
  rate: '5',
  meaning: 'payable',
  negativeGgr: 'zero'
}
const cost = prepareSupplierCost([], 'platform', 'platform', '', contract, context)
assert.equal(monthlySettlementDate('2026-09', cost.settlementDay!), '2026-10-01')
assert.throws(() => monthlySettlementDate('2026-09', 29), /1–28/)
assert.equal(supplierCostAt([cost], 'platform', 'platform', 'PP', '2026-09-15', 'USD')?.id, cost.id)
assert.equal(supplierCostAt([cost], 'platform', 'platform', 'PP', '2026-09-15', 'TWD')?.id, cost.id)
assert.throws(() =>
  prepareSupplierCost(
    [cost],
    'platform',
    'platform',
    '',
    { ...contract, effectiveFrom: '2026-10-01', transactionCurrency: 'USD' },
    context
  )
)
const agent = prepareSupplierCost([cost], 'agent', 'A', '', { ...contract, rate: '6' }, context)
assert.equal(agent.upstreamCost, '5')
assert.throws(
  () => prepareSupplierCost([cost], 'agent', 'B', '', { ...contract, rate: '4' }, context),
  /低於/
)
const input: SettlementInput = {
  stream: 'test',
  month: '2026-09',
  settlementDate: monthlySettlementDate('2026-09', cost.settlementDay!),
  owner: 'platform',
  ownerId: 'platform',
  timezone: 'Asia/Taipei',
  costs: [cost],
  precision: { USD: 2 },
  bets: ['USD', 'TWD'].map((currency, i) => ({
    id: String(i),
    providerId: 'PP',
    currency,
    time: `2026-09-${i ? '20' : '10'}T04:00:00Z`,
    game: 'demo',
    bet: 100000,
    valid: 100000,
    payout: 80000
  })),
  fx: [
    { date: '2026-09-20', from: 'TWD', to: 'USD', rate: '9', version: 'do-not-use' },
    { date: '2026-10-01', from: 'TWD', to: 'USD', rate: '0.03125', version: 'settlement-day' }
  ]
}
const empty = { version: 1 as const, statements: [] }
const merchant = prepareSupplierCost(
  [cost, agent],
  'merchant',
  'M',
  'A',
  { ...contract, rate: '7' },
  context
)
const merchantInput = { ...input, owner: 'merchant' as const, ownerId: 'M', costs: [merchant] }
const merchantResult = prepareStatement(empty, merchantInput)
assert.deepEqual(
  merchantResult.lines.map((l) => l.settled),
  [14000000, 437500]
)
assert.deepEqual(
  prepareStatement(empty, {
    ...merchantInput,
    costs: [merchant, { ...cost, payable: '99' }, { ...agent, payable: '88' }]
  }),
  merchantResult,
  'merchant settlement uses only the rate assigned to merchant; upstream acquisition costs are irrelevant'
)
assert.ok(
  prepareStatement(empty, { ...merchantInput, costs: [cost, agent] }).lines.every((l) => l.issue),
  'missing merchant rate must not fall back to provider or agent acquisition cost'
)
const result = prepareStatement(empty, input)
assert.deepEqual(
  result.lines.map((l) => l.settled),
  [10000000, 312500]
)
assert.ok(result.lines.every((l) => l.fxDate === '2026-10-01'))
assert.equal(result.lines[1].fxVersion, 'settlement-day')
assert.ok(prepareStatement(empty, { ...input, fx: input.fx.slice(0, 1) }).lines[1].issue)
assert.throws(() => prepareStatement(empty, { ...input, settlementDate: undefined }), /結算日期/)
assert.throws(() => prepareStatement(empty, { ...input, settlementDate: '2026-09-30' }), /結算日期/)
let raw: string | null = null
const storage = {
  getItem: () => raw,
  setItem: (_: string, v: string) => {
    raw = v
  }
}
lockStatement(storage, raw, input)
input.fx[1].rate = '99'
assert.equal(readLedger(raw).statements[0].result.lines[1].settled, 312500)
assert.equal(readLedger(raw).statements[0].input.fx[1].rate, '0.03125')
console.log(
  'Passed: shared provider contract, downstream floor, settlement-date FX, no daily fallback, date validation and immutable snapshot'
)
