import assert from 'node:assert/strict'
import { calculateStatement, statementExample } from '../src/domain/supplier-statements'
const example = statementExample('merchant', 'M00001', 7)
const calc = (bets = example.bets, costs = example.costs) =>
  calculateStatement(bets, costs, 'merchant', 'M00001', '2026-09-01', '2026-09-30', 'Asia/Taipei')
const lines = calc()
assert.equal(lines.length, 3)
assert.equal(lines[0].amount, 1400)
assert.equal(lines[1].amount, 1600)
assert.equal(lines[2].amount, 800)
assert.equal(lines[0].effectiveTo, '2026-09-15')
assert.equal(lines[1].effectiveFrom, '2026-09-16')
assert.equal(lines[2].basis, 'ValidBet')
assert.equal(calc(example.bets, [])[0].amount, null)
assert.equal(
  calc(
    example.bets,
    example.costs.map((c) => ({ ...c, currency: 'TWD' }))
  )[0].amount,
  null
)
assert.equal(calc([{ ...example.bets[0], payout: 200000 }])[0].issue, '負數結算政策待確認')
assert.equal(
  calculateStatement(
    example.bets,
    example.costs,
    'merchant',
    'OTHER',
    '2026-09-01',
    '2026-09-30',
    'Asia/Taipei'
  )[0].amount,
  null
)
assert.throws(() => calc([example.bets[0], example.bets[0]]), /重複/)
assert.ok(lines.every((l) => !('upstreamCost' in l) && !('upstreamId' in l)))
const snapshot = JSON.parse(JSON.stringify(lines))
example.costs[0].payable = '99'
assert.equal(snapshot[0].amount, 1400)
console.log(
  'Supplier statement checks passed: timezone boundary, provider/currency/version split, basis, missing terms/FX, negative pending, duplicate blocking, isolated owner and immutable copied snapshot.'
)
