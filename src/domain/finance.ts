import Big from 'big.js'

export type DecimalInput = string | number
export type DailySettlementStatus = 'pending_daily' | 'processing' | 'locked' | 'failed' | 'reopened'
export type NegativeGgrPolicy = 'carry_forward' | 'zero_out'

export interface FxSettlementResult {
  baseSettlementGgr: number
  exchangeServiceFee: number
}

export interface AgentReceivableResult {
  agentGameCharge: number
  exchangeServiceFee: number
  finalAgentReceivable: number
}

export interface ProviderPayableResult {
  providerCostBase: number
  providerGameCost: number
  providerPayable: number
  openingCarryForward: number
  currentNegativeGgr: number
  appliedCarryForward: number
  closingCarryForward: number
}

const value = (input: DecimalInput | null | undefined) => new Big(input || 0)
const uiNumber = (input: Big) => Number(input.toFixed(8))
const positive = (input: DecimalInput | Big) => {
  const amount = input instanceof Big ? input : value(input)
  return amount.gt(0) ? amount : new Big(0)
}

export const calculateFxSettlement = (
  originalGgr: DecimalInput,
  baseRate: DecimalInput,
  serviceFeeRate: DecimalInput
): FxSettlementResult => {
  const rate = value(baseRate)
  if (rate.lte(0)) throw new Error('base_rate must be greater than zero')

  const baseSettlementGgr = value(originalGgr).div(rate)
  const exchangeServiceFee = positive(baseSettlementGgr).times(value(serviceFeeRate))

  return {
    baseSettlementGgr: uiNumber(baseSettlementGgr),
    exchangeServiceFee: uiNumber(exchangeServiceFee)
  }
}

export const calculateAgentReceivable = (
  settlementGgr: DecimalInput,
  agentRate: DecimalInput,
  serviceFeeRate: DecimalInput,
  adjustment: DecimalInput = 0
): AgentReceivableResult => {
  const chargeBase = positive(settlementGgr)
  const agentGameCharge = chargeBase.times(value(agentRate))
  const exchangeServiceFee = chargeBase.times(value(serviceFeeRate))
  const finalAgentReceivable = agentGameCharge.plus(exchangeServiceFee).plus(value(adjustment))

  return {
    agentGameCharge: uiNumber(agentGameCharge),
    exchangeServiceFee: uiNumber(exchangeServiceFee),
    finalAgentReceivable: uiNumber(finalAgentReceivable)
  }
}

export const calculateProviderPayable = (
  providerGgr: DecimalInput,
  providerCostRate: DecimalInput,
  negativePolicy: NegativeGgrPolicy,
  fixedFee: DecimalInput = 0,
  adjustment: DecimalInput = 0,
  openingCarryForward: DecimalInput = 0
): ProviderPayableResult => {
  const rawGgr = value(providerGgr)
  const openingCarry = negativePolicy === 'carry_forward' ? positive(openingCarryForward) : new Big(0)
  const currentNegativeGgr = negativePolicy === 'carry_forward' && rawGgr.lt(0) ? rawGgr.abs() : new Big(0)
  const positiveGgr = positive(rawGgr)
  const appliedCarryForward = negativePolicy === 'carry_forward'
    ? (positiveGgr.lt(openingCarry) ? positiveGgr : openingCarry)
    : new Big(0)
  const providerCostBase = positiveGgr.minus(appliedCarryForward)
  const closingCarryForward = openingCarry
    .minus(appliedCarryForward)
    .plus(currentNegativeGgr)
  const providerGameCost = providerCostBase.times(value(providerCostRate))
  const providerPayable = positive(providerGameCost.plus(value(fixedFee)).plus(value(adjustment)))

  return {
    providerCostBase: uiNumber(providerCostBase),
    providerGameCost: uiNumber(providerGameCost),
    providerPayable: uiNumber(providerPayable),
    openingCarryForward: uiNumber(openingCarry),
    currentNegativeGgr: uiNumber(currentNegativeGgr),
    appliedCarryForward: uiNumber(appliedCarryForward),
    closingCarryForward: uiNumber(closingCarryForward)
  }
}

export const calculatePlatformMargin = (
  finalAgentReceivable: DecimalInput,
  providerPayable: DecimalInput,
  platformAdjustment: DecimalInput = 0,
  activityCost: DecimalInput = 0,
  compensationCost: DecimalInput = 0
) => uiNumber(
  value(finalAgentReceivable)
    .minus(value(providerPayable))
    .plus(value(platformAdjustment))
    .minus(value(activityCost))
    .minus(value(compensationCost))
)

export const calculateRateSpreadMargin = (
  settlementGgr: DecimalInput,
  downstreamRate: DecimalInput,
  upstreamRate: DecimalInput
) => uiNumber(positive(settlementGgr).times(value(downstreamRate).minus(value(upstreamRate))))
