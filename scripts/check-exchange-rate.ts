import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useFinanceSettingsStore } from '../src/store/modules/financeSettings'

setActivePinia(createPinia())
const store = useFinanceSettingsStore()

const asgu = store.currencies.find((currency) => currency.code === 'ASGU')
assert.ok(asgu && asgu.status === 'Active' && asgu.settlementEnabled)
assert.ok(store.dailyRates.every((rate) => rate.fromCurrency === 'USDT'))

const asguSetting = store.rateSettings.find((setting) => setting.currency === 'ASGU')!
assert.equal(asguSetting.baseCurrency, 'USDT')
assert.equal(asguSetting.rateMode, 'Pegged')
assert.equal(asguSetting.fixedRate, 1)
assert.equal(store.getExchangeRate('USDT', 'ASGU'), 1)

const twdToAsgu = store.getExchangeRate('TWD', 'ASGU')
const asguToTwd = store.getExchangeRate('ASGU', 'TWD')
assert.ok(Math.abs(twdToAsgu * asguToTwd - 1) < 0.000001)

const version = asguSetting.version
store.saveRateSetting({ ...asguSetting, fixedRate: 1.01 }, asguSetting.id)
assert.equal(asguSetting.version, version + 1)
assert.equal(
  store.dailyRates.some(
    (rate) => rate.settingId === asguSetting.id && rate.settingVersion === asguSetting.version
  ),
  false
)

const locked = store.simulateDailyLock(asguSetting.id)
assert.equal(locked.ok, true)
const snapshot = store.dailyRates.find((rate) => rate.id === locked.id)!
assert.equal(snapshot.fromCurrency, 'USDT')
assert.equal(snapshot.toCurrency, 'ASGU')
assert.equal(snapshot.settingVersion, asguSetting.version)
assert.equal(snapshot.finalRate, 1.01)
assert.equal(store.simulateDailyLock(asguSetting.id).ok, false)

console.log(
  'Exchange-rate checks passed: USDT anchor, ASGU peg, cross-rate derivation, versioning and daily snapshot guard.'
)
