import assert from 'node:assert/strict'
import { agentReportRows, agentPublishedRates, groupAgentReports } from '../src/domain/agent-demo'
import type { PortalSource } from '../src/domain/agent-portal'
import type { BetCenterRecord, DailyExchangeRateRecord } from '../src/types/game-provider'
const source = {
  agents: [
    { id: 'A', status: 'Active', currency: 'TWD' },
    { id: 'B', parentAgentId: 'A', status: 'Active' },
    { id: 'X', status: 'Active' }
  ],
  merchants: [
    { id: 'M', name: 'Own', agentId: 'A', lines: [{ uid: 'L', currency: 'TWD' }] },
    { id: 'N', name: 'Child', agentId: 'B', lines: [{ uid: 'NL', currency: 'USD' }] },
    { id: 'X', name: 'Outside', agentId: 'X', lines: [{ uid: 'XL', currency: 'JPY' }] }
  ],
  commercialTerms: [],
  merchantCommercialTerms: [],
  portalRateVersions: []
} as unknown as PortalSource
const actor = { roles: ['R_AGENT'], agentId: 'A', name: 'Agent' }
const bets = [
  {
    id: '1',
    merchantId: 'M',
    lineUid: 'L',
    currency: 'TWD',
    agentId: 'spoof',
    status: 'Settled',
    payoutAmount: 30,
    result: { secret: 'SECRET' }
  },
  {
    id: '2',
    merchantId: 'N',
    lineUid: 'NL',
    currency: 'USD',
    status: 'In Progress',
    payoutAmount: 20
  },
  { id: '3', merchantId: 'X', lineUid: 'XL', currency: 'JPY' },
  { id: '4', merchantId: 'M', lineUid: 'XL', currency: 'TWD' },
  { id: '5', merchantId: 'M', lineUid: 'L', currency: 'USD' }
] as BetCenterRecord[]
const rows = agentReportRows(source, actor, bets)
for (const tab of ['agents', 'merchants', 'games', 'currencies'] as const) {
  const groups = groupAgentReports([...rows, rows[0]], tab)
  assert.equal(
    groups.reduce((n, g) => n + g.count, 0),
    2
  )
  assert.equal(
    groups.reduce((n, g) => n + g.settled, 0),
    1
  )
  assert.equal(
    groups.reduce((n, g) => n + g.payout, 0),
    30
  )
  assert.ok(groups.every((g) => g.rows.every((r) => r.currency === g.currency)))
}
assert.deepEqual(
  rows.map((r) => r.id),
  ['1', '2']
)
assert.equal(rows[0].agentId, 'A')
assert.equal(rows[0].payoutAmount, 30)
assert.equal(rows[1].payoutAmount, null)
assert.ok(!JSON.stringify(rows).includes('SECRET'))
for (const invalid of [
  { ...actor, roles: ['R_MERCHANT'] },
  { ...actor, agentId: 'missing' }
]) {
  assert.deepEqual(agentReportRows(source, invalid, bets), [])
  assert.deepEqual(agentPublishedRates(source, invalid, []), [])
}
const rates = [
  {
    id: '1',
    fromCurrency: 'TWD',
    toCurrency: 'USDT',
    status: 'Published',
    finalRate: 0.03,
    adjustmentPercent: 'SECRET'
  },
  { id: '2', fromCurrency: 'USD', toCurrency: 'USDT', status: 'Draft' },
  { id: '3', fromCurrency: 'JPY', toCurrency: 'EUR', status: 'Published' },
  { id: '4', fromCurrency: 'USD', toCurrency: 'USDT', status: 'Published' }
] as unknown as DailyExchangeRateRecord[]
const published = agentPublishedRates(source, actor, rates)
assert.deepEqual(
  published.map((r) => r.id),
  ['1', '4']
)
assert.ok(!JSON.stringify(published).includes('SECRET'))
source.agents[0].status = 'Suspended'
assert.deepEqual(agentReportRows(source, actor, bets), [])
assert.deepEqual(agentPublishedRates(source, actor, rates), [])
console.log(
  'Agent demo projections passed: direct/descendant scope, line/currency validation, deny-by-default, field whitelist and published rates.'
)
