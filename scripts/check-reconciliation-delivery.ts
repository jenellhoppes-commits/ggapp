import assert from 'node:assert/strict'
import { prepareReconciliationDelivery as prepare } from '../src/domain/reconciliation-delivery'
const target = {
  id: 'M1',
  kind: 'merchant' as const,
  party: 'MER1',
  period: '2026-08',
  currency: 'TWD',
  system: 101580.22,
  difference: 0,
  paid: 101580,
  reason: '部分款項結轉',
  operator: 'Finance'
}
const complete = prepare([], target, false)
for (const currency of ['TWD', 'USD', 'USDT', 'JPY']) {
  const paid = prepare([], {...target, currency, system:1000.99, paid:1000}, false)
  assert.equal(paid.due,1000)
  assert.equal(paid.carry,0)
  assert.equal(paid.system,1000.99)
  assert.equal(prepare([], {...target,currency,system:1000.99,paid:900},true).carry,100)
}
assert.equal(complete.carry, 0)
assert.equal(complete.due, 101580)
const first = prepare([], { ...target, paid: 101480 }, true)
assert.equal(first.carry, 100)
assert.throws(() => prepare([], { ...target, paid: 1.5 }, true))
assert.throws(() => prepare([], { ...target, paid: 101480 }, false))
assert.throws(() => prepare([first], target, true))
assert.throws(() => prepare([], { ...target, paid: 101581 }, true))
const second = prepare(
  [first],
  { ...target, id: 'M2', period: '2026-09', system: 100, paid: 200, difference: 0 },
  false
)
assert.equal(second.opening, 100)
assert.equal(second.carry, 0)
const third = prepare(
  [first, second],
  { ...target, id: 'M3', period: '2026-10', system: 10, paid: 10 },
  false
)
assert.equal(third.opening, 0)
assert.equal(first.system, 101580.22)
assert.throws(() => prepare([], { ...target, system: -10, paid: 0 }, true))
console.log(
  'PASS: original bill delivery, integer payment, remainder, duplicate lock, carry consumed once'
)
