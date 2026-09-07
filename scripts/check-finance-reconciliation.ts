import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useFinanceCenterStore } from '../src/store/modules/financeCenter'

setActivePinia(createPinia())
const store = useFinanceCenterStore()

assert.ok(store.providerReconciliations.length > 0, 'Provider reconciliation data exists')
assert.ok(store.agentReconciliations.length > 0, 'Agent reconciliation data exists')
assert.ok(store.merchantReconciliations.length > 0, 'Merchant reconciliation data exists')

const blockedProvider = store.providerReconciliations.find(
  (record) => record.unresolvedDifferenceCount > 0
)
assert.ok(blockedProvider, 'Provider difference scenario exists')
assert.equal(
  store.confirmProvider(blockedProvider.id, blockedProvider.finalSettlementAmount),
  false,
  'Unresolved differences block confirmation'
)

const provider = store.providerReconciliations.find(
  (record) => record.status === 'Pending Confirmation' && record.unresolvedDifferenceCount === 0
)
assert.ok(provider, 'Confirmable provider record exists')
const expected = provider.finalSettlementAmount
const actual = Number((expected - 0.07).toFixed(2))
assert.equal(store.confirmProvider(provider.id, actual, '測試尾差'), true)
assert.equal(provider.status, 'Confirmed')
assert.equal(provider.finalSettlementAmount, actual)
assert.equal(provider.confirmedSettlementAmount, actual)
assert.equal(provider.confirmationAdjustmentAmount, Number((actual - expected).toFixed(2)))
assert.ok(
  store.actionLogs.some((log) => log.entityId === provider.id && log.action === '確認對帳金額'),
  'Confirmation adjustment is auditable'
)

console.log(
  'Finance reconciliation checks passed: three subjects, difference guard, actual amount adjustment and audit log.'
)
