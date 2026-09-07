import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { useFinanceSettingsStore } from '../src/store/modules/financeSettings'
import { useFinanceCenterStore } from '../src/store/modules/financeCenter'
import { useFinanceMoney } from '../src/hooks/business/useFinanceMoney'
import { formatFinancialAmount, legacyAmountPrecision } from '../src/utils/finance/format-money'
import { headerBarConfig } from '../src/config/modules/headerBar'
import { globalComponentsConfig } from '../src/config/modules/component'

for (const precision of [0, 2, 4, 8]) {
  setActivePinia(createPinia())
  const settings = useFinanceSettingsStore()
  settings.settlementRule.amountPrecision = precision
  const finance = useFinanceCenterStore()
  const formatter = useFinanceMoney()
  const statement = finance.merchantStatements[0]
  const agent = finance.agentStatements[0]
  const batch = finance.settlementBatches[0]
  const adjustment = finance.settlementAdjustments[0]
  for (const value of [0, 1234.12345678, -1234.12345678]) {
    const expected = formatFinancialAmount(value, statement.settlementCurrency, precision)
    assert.equal(formatter.statementMoney(value, statement), expected)
    assert.equal(
      formatter.statementMoney(value, agent),
      formatFinancialAmount(value, agent.settlementCurrency, precision)
    )
    assert.equal(
      formatter.batchMoney(value, batch),
      formatFinancialAmount(value, batch.settlementCurrency, precision)
    )
    assert.equal(
      formatter.adjustmentMoney(value, adjustment),
      formatFinancialAmount(value, adjustment.currency, precision)
    )
    settings.settlementRule.amountPrecision = precision === 8 ? 0 : 8
    assert.equal(
      formatter.statementMoney(value, statement),
      expected,
      'Historical precision must not follow current settings'
    )
    assert.equal(
      formatter.batchMoney(value, batch),
      formatFinancialAmount(value, batch.settlementCurrency, precision)
    )
    assert.equal(
      formatter.adjustmentMoney(value, adjustment),
      formatFinancialAmount(value, adjustment.currency, precision)
    )
  }
  const legacy = { ...statement, amountPrecision: undefined }
  assert.equal(
    formatter.statementMoney(1.23456789, legacy),
    formatFinancialAmount(1.23456789, legacy.settlementCurrency, precision),
    'Legacy statement uses reconciliation snapshot'
  )
}

assert.equal(formatFinancialAmount(1.2345, 'TWD', 4), 'TWD 1.2345')
assert.equal(formatFinancialAmount(-1.2345, 'TWD', 4), 'TWD -1.2345')
assert.equal(formatFinancialAmount(1, 'TWD', 0), 'TWD 1')
assert.equal(legacyAmountPrecision(1e-8), 8)
assert.equal(legacyAmountPrecision(123.4567), 4)
assert.equal(legacyAmountPrecision(100), 2)

setActivePinia(createPinia())
const settings = useFinanceSettingsStore()
const finance = useFinanceCenterStore()
const formatter = useFinanceMoney()
const source = finance.merchantReconciliations.find((row) => row.period === '2026-08')!
source.status = 'Confirmed'
source.unresolvedDifferenceCount = 0
settings.settlementRule.amountPrecision = 4
const created = finance.createSettlementBatch({
  name: 'Precision regression',
  period: source.period,
  cycle: 'Monthly',
  settlementCurrency: source.snapshot.settlementCurrency
})
assert.ok(created.ok && created.batch)
assert.equal(created.batch.amountPrecision, 4)
const statement = finance.merchantStatements.find((row) => row.batchId === created.batch!.id)!
assert.equal(statement.amountPrecision, source.snapshot.amountPrecision)
const adjustment = finance.createSettlementAdjustment({
  statementId: statement.id,
  targetType: 'Merchant',
  type: 'Manual',
  direction: 'Credit',
  amount: 1.2345,
  reason: 'Precision regression'
})!
assert.equal(adjustment.amountPrecision, 4)
assert.equal(adjustment.amount, 1.2345)
assert.equal(finance.reviewSettlementAdjustment(adjustment.id, true), true)
assert.equal(statement.amountPrecision, 4, 'Applied higher-precision adjustment remains visible')
const displayed = formatter.statementMoney(statement.finalAmount, statement)
settings.settlementRule.amountPrecision = 0
assert.equal(formatter.statementMoney(statement.finalAmount, statement), displayed)

for (const [feature, component] of [
  ['globalSearch', 'global-search'],
  ['chat', 'chat-window']
] as const) {
  const config = headerBarConfig[feature]
  assert.equal(config.visible, false, 'Requested header entries stay hidden')
  const mounted = globalComponentsConfig.find((item) => item.key === component)!
  const original = config.enabled
  try {
    config.enabled = false
    assert.equal(mounted.enabled, false, 'One enable flag also controls mounting')
    config.enabled = true
    assert.equal(mounted.enabled, true)
  } finally {
    config.enabled = original
  }
}

// Source-contract checks complement (not replace) browser lifecycle/keyboard tests.
for (const [file, event] of [
  ['src/components/core/layouts/art-global-search/index.vue', 'openSearchDialog'],
  ['src/components/core/layouts/art-screen-lock/index.vue', 'openLockScreen'],
  ['src/components/core/layouts/art-settings-panel/composables/useSettingsPanel.ts', 'openSetting']
]) {
  const source = readFileSync(file, 'utf8')
  assert.ok(source.includes(`mittBus.on('${event}', ${event})`))
  assert.ok(source.includes(`mittBus.off('${event}', ${event})`))
}
const iconButton = readFileSync('src/components/core/widget/art-icon-button/index.vue', 'utf8')
assert.match(iconButton, /<button[\s\S]*?type="button"/)
const table = readFileSync('src/views/game-provider/finance/reconciliation/index.vue', 'utf8')
assert.match(table, /<ArtTable\s/)
assert.equal((table.match(/<ElPagination\s/g) || []).length, 1)
console.log(
  'Global consistency checks passed: precision snapshots, legacy formats, feature flags, event cleanup contracts, button semantics and one pagination control.'
)
