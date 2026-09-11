import assert from 'node:assert/strict'
import { settlementReportRow, comparableMargin, type ReportBill } from '../src/domain/reconciliation-report'
import { prepareReconciliationDelivery } from '../src/domain/reconciliation-delivery'
import type { AgentReconciliationRecord, MerchantReconciliationRecord } from '../src/types/game-provider'

const bill = {id:'M1',merchantId:'M',merchantName:'商戶',agentId:'A',period:'2026-08',currency:'USD',ggr:10000,initialSettlementAmount:1000.99,finalSettlementAmount:1000.99,status:'Locked',snapshot:{settlementCurrency:'TWD',settlementBasis:'GGR',ratePercent:5,exchangeRate:32,formulaVersion:'v1',calculatedAt:'2026-09-01'}} as MerchantReconciliationRecord
const empty = settlementReportRow(bill, [])
assert.equal(empty.paid, null, 'Locked must not imply paid')
assert.equal(empty.due, null, 'No delivery must not fabricate a posted due')
const paid = prepareReconciliationDelivery([], {id:'M1',kind:'merchant',party:'M',period:'2026-08',currency:'TWD',system:1000.99,difference:0,paid:1000,reason:'',operator:'財務'}, false)
const row = settlementReportRow(bill, [paid])
assert.equal(row.due,1000)
assert.equal(row.discarded,0.99)
assert.equal(row.remaining,0)
assert.equal(row.system,1000.99)
const partial = {...paid,paid:900,carry:100}
const next = {...paid,id:'M2',period:'2026-09',sources:['M1'],carry:0}
assert.equal(settlementReportRow(bill,[partial,next]).outstanding,0)
assert.equal(settlementReportRow(bill,[partial]).outstanding,100)
assert.equal(settlementReportRow({...bill,providerId:'P'} as ReportBill,[paid]).paid,null,'Delivery kind isolation')
const agent = {...bill,id:'A1',agentId:'A',initialSettlementAmount:900,includedMerchantReconciliationIds:['M1']} as unknown as AgentReconciliationRecord
assert.equal(comparableMargin(agent,[bill])?.difference,100.99)
assert.equal(comparableMargin(agent,[]),null)
assert.equal(comparableMargin({...agent,includedMerchantReconciliationIds:['M1','M1']},[bill]),null)
assert.equal(comparableMargin(agent,[{...bill,status:'Cancelled'}]),null)
assert.equal(comparableMargin(agent,[{...bill,snapshot:{...bill.snapshot,settlementCurrency:'USD'}}]),null,'No direct cross currency margin')
console.log('PASS report: lock/payment separation, discarded fractions, consumed carry, kind isolation, margin currency and source checks')
