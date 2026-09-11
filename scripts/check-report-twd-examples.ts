import assert from 'node:assert/strict'
import {twdReportExamples} from '../src/domain/report-twd-examples'
import type {ReportBet,ReportEvent} from '../src/domain/report-four-tabs'
const bet={source:'transaction-center',id:'RPT-1',currency:'USD',environment:'production',merchantId:'M',roundId:'R',amount:'100'} as ReportBet
const key=JSON.stringify([bet.source,bet.environment,bet.merchantId,bet.id])
const event={id:'P',source:bet.source,currency:'USD',roundId:'R',betKeys:[key],amount:'90'} as ReportEvent
const result=twdReportExamples([bet],[event])
assert.equal(result.bets.length,1)
assert.equal(result.bets[0].currency,'TWD')
assert.equal(result.events[0].currency,'TWD')
assert.equal(result.events[0].betKeys[0],JSON.stringify(['report-example','production','M','TWD-RPT-1']))
assert.equal(bet.currency,'USD')
assert.equal(twdReportExamples(result.bets,result.events).bets.length,0)
console.log('PASS TWD report examples: coherent keys, currencies, immutable originals, no recursive duplication')
