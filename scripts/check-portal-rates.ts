import assert from 'node:assert/strict'
import { filterPortalRates } from '../src/domain/portal-rates'
const source = [
  { id: 'old', date: '2026-09-01', fromCurrency: 'USDT', toCurrency: 'TWD', status: 'Published' },
  { id: 'current', date: '2026-09-04', fromCurrency: 'USDT', toCurrency: 'TWD', status: 'Locked' },
  {
    id: 'future',
    date: '2026-09-11',
    fromCurrency: 'USDT',
    toCurrency: 'TWD',
    status: 'Published'
  },
  { id: 'draft', date: '2026-09-05', fromCurrency: 'USDT', toCurrency: 'TWD', status: 'Draft' },
  { id: 'usd', date: '2026-09-04', fromCurrency: 'USDT', toCurrency: 'USD', status: 'Published' }
]
const q = { today: '2026-09-10', view: 'latest' }
assert.deepEqual(
  filterPortalRates(source, q).map((r) => r.id),
  ['current', 'usd']
)
assert.deepEqual(
  filterPortalRates(source, { ...q, currency: 'TWD' }).map((r) => r.id),
  ['current']
)
assert.equal(filterPortalRates(source, { ...q, currency: 'USDT' }).length, 2)
assert.deepEqual(
  filterPortalRates(source, { ...q, view: 'history', to: '2026-09-01' }).map((r) => r.id),
  ['old']
)
assert.equal(filterPortalRates(source, { ...q, from: '2026-09-05' }).length, 0)
assert.equal(filterPortalRates([], q).length, 0)
assert.equal(
  filterPortalRates(
    source.filter((r) => r.toCurrency === 'TWD'),
    q
  ).some((r) => r.toCurrency === 'USD'),
  false
)
console.log(
  'portal rates: published/locked, latest/history, date/currency and scoped-source checks passed'
)
