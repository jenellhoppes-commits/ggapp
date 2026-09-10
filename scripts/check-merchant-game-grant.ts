import assert from 'node:assert/strict'
import { createDemoState } from '../src/domain/provider-demo'
import { merchantRecords } from '../src/mock/game-provider'
import { resolveMerchantGameGrant } from '../src/domain/merchant-game-grant'
import { prepareSupplierCost } from '../src/domain/admin-supplier-costs'
const state = createDemoState()
const merchant = structuredClone(merchantRecords[0])
const line = merchant.lines[0]
merchant.status = 'Active'
line.status = 'Testing'
line.environments[0].environment = 'Sandbox'
line.environments[0].status = 'Testing'
const game = state.games[0]
const input = {
  providerId: game.providerId,
  transactionCurrency: line.currency,
  currency: 'USD',
  basis: 'GGR' as const,
  cycle: 'Monthly' as const,
  rate: '5',
  meaning: 'payable' as const,
  effectiveFrom: '2026-09-08'
}
const context = {
  roles: ['R_SUPER'],
  name: 'test',
  today: input.effectiveFrom,
  timezone: 'Asia/Taipei',
  providers: [game.providerId],
  currencies: ['USD'],
  providerCurrencies: { [game.providerId]: ['USD', 'TWD'] }
}
const costs = [prepareSupplierCost([], 'platform', 'platform', '', input, context)]
costs.push(
  prepareSupplierCost(costs, 'agent', merchant.agentId, '', { ...input, rate: '6' }, context)
)
costs.push(
  prepareSupplierCost(
    costs,
    'merchant',
    merchant.id,
    merchant.agentId,
    { ...input, rate: '7' },
    context
  )
)
const resolve = () =>
  resolveMerchantGameGrant(state, merchant, line.uid, game.id, costs, context.today)
assert.equal(resolve().providerConnectionId, `${game.providerId}-${line.currency}`)
assert.throws(
  () => resolveMerchantGameGrant(state, merchant, line.uid, game.id, [], context.today),
  /條件/
)
const currency = line.currency
line.currency = 'JPY'
assert.throws(resolve, /同幣別/)
line.currency = currency
const connection = state.providers[0].lines.find((l) => l.currency === currency)!
connection.config!.environment = 'production'
assert.throws(resolve, /同幣別/)
connection.config!.environment = 'sandbox'
connection.available = false
assert.throws(resolve, /同幣別/)
connection.available = true
merchant.agentId = 'another-agent'
assert.throws(resolve, /條件/)
console.log(
  'Merchant grant checks passed: exact currency/connection/environment, upstream terms, missing terms and changed parent rejected.'
)
