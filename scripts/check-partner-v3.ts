import assert from 'node:assert/strict'
import { prepareSupplierCost, type SupplierCostInput } from '../src/domain/admin-supplier-costs'
import { visiblePartnerTerms } from '../src/domain/visible-partner-terms'
const context = {
  roles: ['R_ADMIN'],
  name: 'test',
  today: '2026-09-09',
  timezone: 'Asia/Taipei',
  providers: ['PP'],
  currencies: ['USD', 'TWD']
}
const input: SupplierCostInput = {
  scope: 'provider',
  providerId: 'PP',
  rate: '2',
  meaning: 'payable',
  basis: 'GGR',
  cycle: 'Monthly',
  currency: 'USD',
  effectiveFrom: context.today,
  negativeGgr: 'zero'
}
const root = prepareSupplierCost([], 'platform', 'platform', '', input, context)
const l1 = prepareSupplierCost(
  [root],
  'agent',
  'L1',
  '',
  { ...input, currency: 'TWD', cycle: 'Weekly' },
  context
)
const l2 = prepareSupplierCost([root, l1], 'agent', 'L2', 'L1', { ...input, rate: '3' }, context)
const l3 = prepareSupplierCost(
  [root, l1, l2],
  'agent',
  'L3',
  'L2',
  { ...input, rate: '4' },
  context
)
const merchant = prepareSupplierCost(
  [root, l1, l2, l3],
  'merchant',
  'M',
  'L3',
  { ...input, rate: '5' },
  context
)
const rows = [root, l1, l2, l3, merchant]
for (const [id, own, child] of [
  ['L1', l1, l2],
  ['L2', l2, l3],
  ['L3', l3, merchant]
] as const) {
  const visible = visiblePartnerTerms(rows, { roles: ['R_AGENT'], agentId: id })
  assert.deepEqual(
    visible.map((r) => r.id),
    [own.id, child.id]
  )
  assert.equal(visible[0].upstreamCost, undefined)
  assert.equal(visible[0].upstreamId, undefined)
  assert.equal(visible[1].upstreamCost, own.payable)
}
const mine = visiblePartnerTerms(rows, { roles: ['R_MERCHANT'], merchantId: 'M' })
assert.equal(mine.length, 1)
assert.equal(mine[0].payable, '5')
assert.equal(mine[0].upstreamCost, undefined)
assert.equal(visiblePartnerTerms(rows, { roles: [] }).length, 0)
assert.equal(visiblePartnerTerms(rows, context).length, 5)
assert.throws(
  () => prepareSupplierCost([root], 'agent', 'bad', '', { ...input, rate: '1.99' }, context),
  /低於/
)
assert.throws(() =>
  prepareSupplierCost([root], 'agent', 'empty', '', { ...input, rate: '' }, context)
)
assert.equal(l1.payable, '2', 'equality allowed')
assert.equal(l1.currency, 'TWD', 'settlement currency independent')
assert.equal(l1.cycle, 'Weekly', 'settlement cycle independent')
console.log(
  'V3 passed: rate floor/equality/empty, independent settlement settings, L1-L3/merchant visibility and upstream metadata redaction'
)
