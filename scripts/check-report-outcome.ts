import assert from 'node:assert/strict'
import { reportOutcome } from '../src/domain/report-outcome'
const stats = (betAmount: string | null, payoutAmount: string | null) => ({
  betCount: 1,
  players: 1,
  betAmount,
  payoutAmount
})
assert.deepEqual(reportOutcome(stats('1000.99', '900.01')), { ggr: '100.98', rtp: '89.91%' })
assert.deepEqual(reportOutcome(stats('100', '120')), { ggr: '-20', rtp: '120.00%' })
assert.equal(reportOutcome(stats('0', '0')).rtp, null)
assert.deepEqual(reportOutcome(stats('100', null)), { ggr: null, rtp: null })
assert.equal(
  reportOutcome(stats('9007199254740993.123456', '9007199254740993.000001')).ggr,
  '0.123455'
)
assert.equal(reportOutcome(stats('1000', '500')).rtp, '50.00%')
assert.equal(reportOutcome(stats('1', '0.000001')).ggr, '0.999999')
console.log(
  'PASS report outcomes: exact GGR, negative GGR, weighted RTP, zero denominator and missing data'
)
