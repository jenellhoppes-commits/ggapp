import assert from 'node:assert/strict'
import {
  calculateAgentReceivable,
  calculateFxSettlement,
  calculatePlatformMargin,
  calculateProviderPayable,
  calculateRateSpreadMargin
} from '../src/domain/finance.ts'
import {
  getAgentAssignableBetGroups,
  makeMerchantBetLimitAssignments
} from '../src/mocks/gameLimits.ts'

const closeTo = (actual, expected, message) => {
  assert.ok(Math.abs(actual - expected) <= 0.00000001, `${message}: expected ${expected}, got ${actual}`)
}

const fx = calculateFxSettlement(3200, 31.5, 0.005)
closeTo(fx.baseSettlementGgr, 101.58730159, 'Original currency must convert with the locked base rate')
closeTo(fx.exchangeServiceFee, 0.50793651, 'FX service fee must be calculated separately')

const directAgent = calculateAgentReceivable(601250, 0.07, 0.005)
closeTo(directAgent.agentGameCharge, 42087.5, 'Agent game charge')
closeTo(directAgent.exchangeServiceFee, 3006.25, 'Agent FX service fee pass-through')
closeTo(directAgent.finalAgentReceivable, 45093.75, 'Final agent receivable')

const providerWithCarry = calculateProviderPayable(1000, 0.04, 'carry_forward', 0, 0, 200)
closeTo(providerWithCarry.providerCostBase, 800, 'Carry forward must reduce the next positive GGR base')
closeTo(providerWithCarry.providerPayable, 32, 'Provider payable after carry forward')
closeTo(providerWithCarry.closingCarryForward, 0, 'Applied carry forward must be consumed')

const providerNegative = calculateProviderPayable(-300, 0.04, 'carry_forward', 0, 0, 200)
closeTo(providerNegative.providerPayable, 0, 'Negative GGR must never create a negative invoice')
closeTo(providerNegative.closingCarryForward, 500, 'Negative GGR must increase carry forward')

closeTo(calculateRateSpreadMargin(346700, 0.1, 0.092), 2773.6, 'L2 to L3 rate spread')
closeTo(calculatePlatformMargin(45093.75, 24050), 21043.75, 'Platform margin must not add FX service fee twice')

const l1LimitIds = new Set(getAgentAssignableBetGroups('AGT-SEA-001').map(item => item.provider_bet_group_id))
const l2LimitIds = new Set(getAgentAssignableBetGroups('AGT-SEA-SUB01').map(item => item.provider_bet_group_id))
const l3Limits = getAgentAssignableBetGroups('AGT-SEA-SUB01-L3')
assert.ok([...l2LimitIds].every(id => l1LimitIds.has(id)), 'L2 limits must be a subset of its L1 parent')
assert.ok(l3Limits.every(item => l2LimitIds.has(item.provider_bet_group_id)), 'L3 limits must be a subset of its L2 parent')

const l3MerchantLimits = makeMerchantBetLimitAssignments(['VND', 'TWD'], 'VND', {
  agentCode: 'AGT-SEA-SUB01-L3',
  authorizedProviderIds: ['PP', 'PG']
})
assert.ok(l3MerchantLimits.length > 0, 'L3 merchant must receive at least one authorized limit')
assert.ok(l3MerchantLimits.every(item => item.provider_id === 'PP' && item.transaction_currency === 'VND'), 'Merchant limits must stay within agent, provider, and transaction-currency access')

console.log(JSON.stringify({
  checks: 17,
  status: 'passed',
  rules: [
    'locked FX conversion',
    'separate FX service fee',
    'agent receivable',
    'negative GGR carry forward',
    'three-level rate spread',
    'platform margin without duplicate fee',
    'three-level bet-limit inheritance',
    'merchant provider-currency scope'
  ]
}, null, 2))
