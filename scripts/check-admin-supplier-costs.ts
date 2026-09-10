import assert from 'node:assert/strict'
import {
  prepareSupplierCost,
  payableRate,
  supplierCostAt,
  type SupplierCostInput,
  type SupplierCostVersion
} from '../src/domain/admin-supplier-costs'
const context = {
  roles: ['R_SUPER'],
  name: 'test',
  today: '2026-09-08',
  timezone: 'Asia/Taipei',
  providers: ['PP', 'OTHER'],
  currencies: ['TWD', 'USD'],
  providerCurrencies: { PP: ['USD', 'TWD'], OTHER: ['USD'] }
}
const input: SupplierCostInput = {
  providerId: 'PP',
  transactionCurrency: 'USD',
  basis: 'GGR',
  currency: 'TWD',
  cycle: 'Monthly',
  effectiveFrom: '2026-09-08',
  rate: '95',
  meaning: 'retained'
}
const rows: SupplierCostVersion[] = []
rows.push(prepareSupplierCost(rows, 'platform', 'platform', '', input, context))
assert.equal(rows[0].payable, '5')
assert.equal(payableRate({ rate: '100', meaning: 'retained' }), '0')
assert.throws(() => payableRate({ rate: '', meaning: 'payable' }))
const charge = { ...input, meaning: 'payable' as const, rate: '6' }
rows.push(prepareSupplierCost(rows, 'agent', 'A', '', charge, context))
assert.equal(rows[1].upstreamCost, '5')
rows.push(prepareSupplierCost(rows, 'merchant', 'M', 'A', { ...charge, rate: '7' }, context))
assert.equal(rows[2].upstreamCost, '6')
assert.throws(
  () => prepareSupplierCost(rows, 'merchant', 'N', 'A', { ...charge, rate: '5.999999' }, context),
  /低於/
)
assert.equal(prepareSupplierCost(rows, 'merchant', 'N', 'A', charge, context).payable, '6')
assert.throws(
  () => prepareSupplierCost(rows, 'agent', 'B', '', { ...charge, providerId: 'OTHER' }, context),
  /缺少/
)
assert.throws(() => prepareSupplierCost(rows, 'merchant', 'N', 'UNKNOWN', charge, context), /缺少/)
assert.throws(
  () => prepareSupplierCost(rows, 'merchant', 'N', 'A', { ...charge, currency: 'USD' }, context),
  /不一致/
)
assert.throws(
  () =>
    prepareSupplierCost(
      rows,
      'platform',
      'platform',
      '',
      { ...input, rate: '92', effectiveFrom: '2026-10-01' },
      context
    ),
  /下級/
)
assert.throws(() => prepareSupplierCost(rows, 'agent', 'A', '', charge, context), /晚於/)
assert.throws(
  () => prepareSupplierCost(rows, 'agent', 'B', '', charge, { ...context, roles: ['R_AGENT'] }),
  /總後台/
)
const rootFuture = prepareSupplierCost(
  [],
  'platform',
  'platform',
  '',
  { ...input, effectiveFrom: '2026-10-01', rate: '94' },
  context
)
assert.throws(
  () =>
    prepareSupplierCost(
      [rows[0], rootFuture],
      'agent',
      'B',
      '',
      { ...charge, rate: '5.5' },
      context
    ),
  /低於/
)
assert.equal(
  supplierCostAt([rows[0], rootFuture], 'platform', 'platform', 'PP', '2026-09-30', 'USD')?.payable,
  '5'
)
assert.equal(
  supplierCostAt([rows[0], rootFuture], 'platform', 'platform', 'PP', '2026-10-01', 'USD')?.payable,
  '6'
)
assert.throws(
  () =>
    prepareSupplierCost(
      rows,
      'merchant',
      'N',
      'A',
      { ...charge, effectiveFrom: '2026-02-30' },
      context
    ),
  /有效日期/
)
assert.throws(
  () =>
    prepareSupplierCost(rows, 'agent', 'B', '', { ...charge, transactionCurrency: 'TWD' }, context),
  /缺少/
)
assert.throws(
  () =>
    prepareSupplierCost(
      rows,
      'agent',
      'B',
      '',
      { ...charge, transactionCurrency: undefined },
      context
    ),
  /交易幣別/
)
assert.throws(
  () =>
    prepareSupplierCost(
      rows,
      'platform',
      'platform',
      '',
      { ...input, transactionCurrency: 'JPY' },
      context
    ),
  /交易幣別/
)
assert.equal(supplierCostAt(rows, 'platform', 'platform', 'PP', '2026-09-08', 'TWD'), undefined)
console.log(
  'Admin supplier costs passed: 95→5, downstream floor, equality, provider isolation, dates, future parent/child conflicts, roles and history.'
)
