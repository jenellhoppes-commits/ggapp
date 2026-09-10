import assert from 'node:assert/strict'
import { dailySettlement, settlementPeriod } from '../src/domain/daily-settlement'
import { statementExample } from '../src/domain/supplier-statements'
const example = statementExample('merchant', 'M', 7)
const costs = example.costs.map((c) => ({ ...c, currency: 'TWD', negativeGgr: 'carry' as const }))
const fx = ['2026-09-15', '2026-09-16', '2026-09-17'].map((date, i) => ({
  date,
  from: 'USD',
  to: 'TWD',
  rate: String(32 + i),
  version: date
}))
const run = (bets = example.bets, rates = fx, contracts = costs, opening = {}) =>
  dailySettlement(
    bets,
    contracts,
    'merchant',
    'M',
    '2026-09-01',
    '2026-09-30',
    'Asia/Taipei',
    rates,
    { TWD: 2 },
    opening
  )
const rows = run()
assert.ok(
  run(
    example.bets,
    fx.map((r) => ({ ...r, version: ' ' }))
  ).every((r) => r.settled === null && r.issue.includes('版本'))
)
const noActivity = settlementPeriod(
  [],
  costs,
  'merchant',
  'M',
  '2026-09-01',
  '2026-09-30',
  'Asia/Taipei',
  [],
  { TWD: 2 },
  { 'merchant:M:PV00001:USD:GGR:TWD': 25000 }
)
assert.equal(noActivity.lines.length, 0)
assert.equal(noActivity.carry[0].closing, 25000)
assert.equal(noActivity.carry[0].used, 0)
assert.throws(
  () =>
    settlementPeriod(
      [],
      costs,
      'merchant',
      'OTHER',
      '2026-09-01',
      '2026-09-30',
      'Asia/Taipei',
      [],
      { TWD: 2 },
      { 'merchant:M:PV00001:USD:GGR:TWD': 25000 }
    ),
  /不屬於/
)
assert.deepEqual(
  rows.map((r) => r.settled),
  [44800, 52800, 27200]
)
assert.equal(run(example.bets, [])[0].settled, null)
assert.equal(run(example.bets, [...fx, fx[0]])[0].settled, null)
const negative = [{ ...example.bets[0], payout: 120000 }, example.bets[1]]
assert.equal(run(negative)[0].added, 20000)
assert.equal(run(negative)[1].base, 20000) // New negatives belong to NEXT period.
const scope = rows[0].scope
const opening = run(example.bets, fx, costs, { [scope]: 25000 })
assert.equal(opening[0].used, 20000)
assert.equal(opening[1].used, 5000)
assert.equal(opening[1].base, 15000)
assert.equal(opening[2].used, 0) // Never consume another provider's carry.
assert.throws(() => run([example.bets[0], example.bets[0]]), /重複/)
const providerCosts = costs.map((c) => ({
  ...c,
  owner: 'platform' as const,
  ownerId: 'platform',
  payable: '5'
}))
const providerCalc = (policy: 'zero' | 'carry') =>
  dailySettlement(
    negative,
    providerCosts.map((c) => ({ ...c, negativeGgr: policy })),
    'platform',
    'platform',
    '2026-09-01',
    '2026-09-30',
    'Asia/Taipei',
    fx,
    { TWD: 2 }
  )
assert.equal(providerCalc('zero')[0].added, 0)
assert.equal(providerCalc('zero')[0].settled, 0)
assert.equal(providerCalc('carry')[0].added, 20000)
assert.equal(providerCalc('carry')[1].base, 20000)
const tiny = [{ ...example.bets[0], bet: 100, valid: 100, payout: 99 }]
assert.equal(run(tiny)[0].settled, 2) // 0.01 × 7% × 32 = 0.0224; one rounding.
console.log(
  'Daily settlement passed: daily FX, single rounding, missing/conflicting FX, next-period carry, opening scope and duplicates'
)
