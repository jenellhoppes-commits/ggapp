import assert from 'node:assert/strict'
import {
  merchantBetDay,
  merchantDashboardRows,
  merchantDashboardSummary,
  type DashboardBet
} from '../src/domain/merchant-dashboard'
const base: DashboardBet = {
  merchantId: 'M1',
  id: '1',
  time: '2026-09-01 00:00:00',
  currency: 'USD',
  status: 'Settled',
  betAmount: 100,
  payoutAmount: 80
}
const data = [
  base,
  { ...base, id: '2', status: 'Pending', betAmount: 900 },
  { ...base, id: '3', currency: 'TWD', betAmount: 1000, payoutAmount: 1100 },
  { ...base, id: '4', merchantId: 'M2' },
  { ...base, id: '5', time: '2026-08-31 23:00:00' }
]
assert.equal(merchantBetDay({ ...base, betAt: '2026-08-31T16:00:00Z' }), '2026-09-01')
assert.equal(merchantBetDay(base), '2026-09-01')
assert.deepEqual(merchantDashboardRows(data, undefined, null), [])
const scoped = merchantDashboardRows(data, 'M1', ['2026-09-01', '2026-09-01'])
assert.equal(scoped.length, 3)
const rows = merchantDashboardSummary(scoped),
  usd = rows.find((r) => r.currency === 'USD')!
assert.equal(usd.total, 2)
assert.equal(usd.count, 1)
assert.equal(usd.bet, 100)
assert.equal(usd.ggr, 20)
assert.equal(usd.rtp, 80)
assert.equal(rows.find((r) => r.currency === 'TWD')?.ggr, -100)
assert.equal(merchantDashboardRows(data, 'M1', null, 'TWD').length, 1)
assert.deepEqual(merchantDashboardRows(data, 'M1', ['2026-09-02', '2026-09-01']), [])
assert.deepEqual(merchantDashboardRows(data, 'M1', ['2026-02-30', '2026-09-01']), [])
assert.equal(merchantDashboardSummary([{ ...base, betAmount: 0, payoutAmount: 0 }])[0].rtp, null)
assert.equal(merchantDashboardSummary([{ ...base, payoutAmount: undefined }])[0].count, 0)
console.log(
  'Merchant dashboard: scope, timezone, dates, currency isolation, pending exclusion, missing amounts and RTP passed'
)
