import assert from 'node:assert/strict'
import { merchantSettlementCurrency } from '../src/domain/merchant-settlement-view'
const bill = {
  currency: 'USD',
  finalSettlementAmount: 101881.49,
  snapshot: { settlementCurrency: 'TWD' }
}
const before = JSON.stringify(bill)
assert.equal(merchantSettlementCurrency(bill), 'TWD')
assert.equal(merchantSettlementCurrency({ snapshot: {} }), '')
assert.equal(merchantSettlementCurrency({}), '')
assert.equal(JSON.stringify(bill), before)
console.log(
  'merchant settlement: uses immutable settlement snapshot, not transaction currency; missing snapshot fails closed'
)
