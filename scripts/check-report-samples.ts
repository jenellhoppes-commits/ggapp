import assert from 'node:assert/strict'
import { reportSampleActivity } from '../src/domain/report-sample-activity'
import { reportSampleBills } from '../src/domain/report-sample-bills'
import { comparableMargin, settlementReportRow } from '../src/domain/reconciliation-report'
import { prepareReconciliationDelivery } from '../src/domain/reconciliation-delivery'
import type { BetCenterRecord, MerchantRecord } from '../src/types/game-provider'
const bet = {
  id: 'original',
  merchantId: 'M',
  merchantName: 'Merchant',
  agentId: 'A',
  agentName: 'Agent',
  lineUid: 'L',
  currency: 'USD',
  gameId: 'G',
  gameName: 'Game',
  gameCode: 'GAME',
  gameType: 'SLOT',
  memberId: 'U',
  result: { version: {} }
} as BetCenterRecord
const merchant = { id: 'M', lines: [{ uid: 'L', environment: 'Production' }] } as MerchantRecord
const samples = reportSampleActivity([bet], [merchant])
assert.equal(samples.length, 10)
assert.equal(bet.id, 'original')
assert.equal(new Set(samples.map((b) => b.id)).size, 10)
assert(samples.some((b) => b.playerNet > 0))
const bills = reportSampleBills(samples, [
  { id: 'G', providerId: 'PP', name: 'Game', code: 'GAME' }
])
const m = bills.merchants[0],
  a = bills.agents[0],
  p = bills.providers[0]
assert.equal(
  m.betAmount,
  samples.reduce((n, b) => n + b.betAmount, 0)
)
assert.equal(m.ggr, m.betAmount - m.payoutAmount)
assert.equal(a.ggr, m.ggr)
assert.equal(p.ggr, m.ggr)
assert.equal(comparableMargin(a, [m])?.difference, 85)
assert.equal(m.initialSettlementAmount, 510)
assert.equal(a.initialSettlementAmount, 425)
assert.equal(p.initialSettlementAmount, 340)
const delivery = prepareReconciliationDelivery(
  [],
  {
    id: m.id,
    kind: 'merchant',
    party: m.merchantId,
    period: m.period,
    currency: m.currency,
    system: m.finalSettlementAmount,
    difference: 0,
    paid: 400,
    reason: '部分收款，餘款下期',
    operator: 'Finance'
  },
  true
)
const row = settlementReportRow(m, [delivery])
assert.equal(row.remaining, 110)
assert.equal(row.provider, 'PP')
assert.equal(row.gameType, 'SLOT')
assert.equal(row.conditionVersion, 'RPT-202609-V1')
assert.equal(reportSampleBills(samples, []).merchants.length, 0)
assert.equal(reportSampleActivity([bet], [{ ...merchant, lines: [] }]).length, 0)
console.log('PASS shared report fixtures: volume, payout, GGR, margin, delivery, source isolation')
const expanded = reportSampleActivity([bet, {...bet, id:'second',gameId:'G2',gameCode:'GAME2'}],[merchant])
assert.equal(expanded.length,20)
assert.deepEqual(expanded.slice(0,10),samples,'Existing report activity must remain unchanged')
const expandedBills = reportSampleBills(expanded,[{id:'G',providerId:'PP',name:'Game',code:'GAME'},{id:'G2',providerId:'PP',name:'Game 2',code:'GAME2'}])
assert.deepEqual(expandedBills.merchants[0],m,'Additional samples must not change an existing report bill')
assert.equal(expandedBills.merchants.length,2)
assert.equal(new Set(expanded.map(b=>b.id)).size,20)
console.log('PASS additive fixtures preserve original activity and bills')
const withTwd=reportSampleBills([...samples,...samples.map(b=>({...b,id:`TWD-${b.id}`,currency:'TWD',lineUid:`REPORT-TWD-${b.lineUid}`}))],[{id:'G',providerId:'PP',name:'Game',code:'GAME'}])
assert.deepEqual(withTwd.merchants[0],m)
assert.equal(withTwd.merchants[1].currency,'TWD')
assert.equal(withTwd.merchants[1].ggr,m.ggr)
assert.equal(comparableMargin(withTwd.agents[1],withTwd.merchants)?.difference,85)
console.log('PASS TWD bill projection: original unchanged, GGR and margin agree')
