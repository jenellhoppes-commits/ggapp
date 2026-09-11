import assert from 'node:assert/strict'
import { providerReconciliationSamples } from '../src/domain/provider-reconciliation-samples'
import type { ProviderReconciliationRecord } from '../src/types/game-provider'
const games = [
  {id:'g1',providerId:'p1',name:'一',code:'ONE'},
  {id:'g2',providerId:'p1',name:'二',code:'TWO'},
  {id:'g3',providerId:'p2',name:'三',code:'THREE'}
]
for (const period of ['2026-07','2026-08']) {
  const bill = {providerId:'p1',period,betCount:3745,betAmount:2736500,validBet:2512107,payoutAmount:2536735.5,initialSettlementAmount:5495.234,snapshot:{amountPrecision:3}} as ProviderReconciliationRecord
  const rows = providerReconciliationSamples(bill,games)
  assert.equal(rows.length,2)
  for (const key of ['betCount','betAmount','validBet','payoutAmount'] as const)
    assert.ok(Math.abs(rows.reduce((sum,row)=>sum+row[key],0)-bill[key])<.000001)
  assert.ok(Math.abs(rows.reduce((sum,row)=>sum+row.settlementAmount,0)-bill.initialSettlementAmount)<.000001)
  assert.equal(rows.reduce((sum,row)=>sum+row.ggr,0),bill.betAmount-bill.payoutAmount)
  assert.deepEqual(providerReconciliationSamples(bill,games),rows)
}
console.log('PASS provider fixtures: provider isolation, period totals, GGR, settlement precision, repeatable rows')
