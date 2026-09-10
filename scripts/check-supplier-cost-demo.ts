import assert from 'node:assert/strict'
import { supplierCostDemoSeed } from '../src/domain/supplier-cost-demo'
import { supplierCostAt } from '../src/domain/admin-supplier-costs'

const seeded = supplierCostDemoSeed([])
assert.deepEqual(
  seeded.map((r) => r.payable),
  ['5', '6', '7']
)
assert.equal(seeded[2].upstreamId, seeded[1].id)
assert.equal(seeded[1].upstreamCost, '5')
assert.equal(seeded[2].upstreamCost, '6')
assert.deepEqual(supplierCostDemoSeed(seeded), [])
assert.deepEqual(supplierCostDemoSeed([seeded[0]]), [])
assert.deepEqual(supplierCostDemoSeed([{ ...seeded[0], transactionCurrency: undefined }]), [])
assert.equal(supplierCostDemoSeed([{ ...seeded[0], providerId: 'other' }]).length, 3)
assert.equal(
  supplierCostAt(seeded, 'merchant', 'M00001', 'PV00001', '2026-09-08', 'USD'),
  undefined
)
assert.equal(
  supplierCostAt(seeded, 'merchant', 'M00001', 'PV00001', '2026-09-09', 'USD')?.payable,
  '7'
)
console.log(
  'Supplier cost demo: scope protection, repeat initialization, chain and effective date passed'
)
