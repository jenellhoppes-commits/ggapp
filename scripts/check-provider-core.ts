import assert from 'node:assert/strict'
import {
  createDemoState,
  createDemoLink,
  launchDemo,
  capabilityError
} from '../src/domain/provider-demo'
import {
  ensureProviderCore,
  saveProvider,
  saveLine,
  blankLine,
  resetDemoCredential,
  testLine,
  activationChecks,
  changeLineStatus,
  changeProviderStatus,
  lineErrors
} from '../src/domain/provider-core'
import { listPage } from '../src/domain/list-query'

const actor = { roles: ['R_SUPER'], name: '核心演示測試' }
const denied = { roles: ['R_MERCHANT'], name: '商戶' }
const state = createDemoState()
state.providers[0].initialCredit = true // Explicit capability for this test adapter only.
const oldIds = state.providers.flatMap((p) => p.lines.map((l) => l.id))
ensureProviderCore(state)
assert.deepEqual(
  state.providers.flatMap((p) => p.lines.map((l) => l.id)),
  oldIds
)
const snapshot = JSON.stringify(state)
ensureProviderCore(state)
assert.equal(JSON.stringify(state), snapshot, 'Migration is idempotent')
const p = state.providers[0]
const line = p.lines[0]
const profile = {
  code: p.profile!.code,
  name: '測試名稱',
  contact: 'demo@example.invalid',
  note: ''
}
assert.throws(() => saveProvider(state, p.id, profile, p.profile!.version, denied), /權限/)
saveProvider(state, p.id, profile, p.profile!.version, actor)
assert.equal(p.name, '測試名稱')
assert.throws(() => saveProvider(state, p.id, profile, 1, actor), /版本衝突/)
assert.throws(() => saveProvider(state, undefined, profile, 0, actor), /代碼已存在/)
assert.throws(
  () => saveProvider(state, p.id, { ...profile, code: 'OTHER' }, p.profile!.version, actor),
  /不可修改/
)
const newProvider = saveProvider(
  state,
  undefined,
  { code: 'QA_NEW', name: '新供應商', contact: '', note: '' },
  0,
  actor
)
assert.equal(newProvider.available, false)
assert.equal(newProvider.mode, undefined, 'Do not invent supplier capabilities')
assert.throws(
  () => changeProviderStatus(state, newProvider.id, 'active', 1, '測試啟用', actor),
  /尚無啟用線路/
)

const link = createDemoLink(
  state,
  {
    name: '歷史保留',
    providerId: p.id,
    gameId: state.games[0].id,
    lineId: line.id,
    purpose: 'internal',
    initialCredit: 100,
    locale: 'zh-TW',
    expiresAt: new Date(Date.now() + 60000).toISOString()
  },
  { role: 'admin', name: '管理者' }
)
const session = launchDemo(state, link.token)
assert.equal(line.config!.used, true)
const history = JSON.stringify(state.sessions)
changeLineStatus(state, p.id, line.id, 'disabled', line.config!.version, '測試停用', actor)
assert.throws(() => launchDemo(state, link.token), /不可用/)
assert.equal(JSON.stringify(state.sessions), history, 'Disabling does not delete sessions')
assert.equal(state.sessions[0].id, session.id)
changeLineStatus(state, p.id, line.id, 'active', line.config!.version, '恢復演示', actor)
changeProviderStatus(state, p.id, 'maintenance', p.profile!.version, '維護演示', actor)
assert.throws(() => launchDemo(state, link.token), /不可用/)
assert.equal(JSON.stringify(state.sessions), history)
changeProviderStatus(state, p.id, 'active', p.profile!.version, '恢復', actor)

const config = { ...line.config!, currency: line.currency }
assert.throws(
  () => saveLine(state, p.id, line.id, { ...config, currency: 'JPY' }, line.config!.version, actor),
  /不能修改/
)
assert.throws(() => saveLine(state, p.id, undefined, config, 0, actor), /已有線路/)
assert.ok(lineErrors({ ...config, minUnit: '0.001', scale: 2 }).length)
assert.ok(lineErrors({ ...config, minUnit: '0' }).length)
assert.ok(lineErrors({ ...config, apiUrl: 'https://user:secret@example.invalid' }).length)
assert.ok(lineErrors({ ...config, apiUrl: 'https://example.invalid?key=secret' }).length)
assert.ok(lineErrors({ ...config, scale: 2.5 }).length)
assert.equal(lineErrors({ ...config, currency: 'JPY', minUnit: '1', scale: 0 }).length, 0)
const production = saveLine(
  state,
  p.id,
  undefined,
  { ...config, environment: 'production' },
  0,
  actor
)
assert.equal(production.available, false)
resetDemoCredential(state, p.id, production.id, production.config!.version, '建立示範識別', actor)
testLine(state, p.id, production.id, production.config!.version, false, actor)
assert.equal(production.config!.check!.result, 'passed')
assert.ok(activationChecks(state, p, production).some((c) => !c.passed))
assert.throws(
  () =>
    changeLineStatus(
      state,
      p.id,
      production.id,
      'active',
      production.config!.version,
      '不可正式啟用',
      actor
    ),
  /正式啟用/
)
assert.ok(capabilityError(state, { ...link, lineId: production.id }))

resetDemoCredential(state, p.id, line.id, line.config!.version, '重設演示', actor)
assert.equal(line.available, false)
assert.equal(line.config!.check, undefined)
assert.ok(!JSON.stringify(line.config!.credential).includes('secret'))
assert.throws(
  () => changeLineStatus(state, p.id, line.id, 'active', line.config!.version, '測試', actor),
  /不可啟用/
)
testLine(state, p.id, line.id, line.config!.version, true, actor)
assert.equal(line.config!.check!.result, 'failed')
assert.equal(line.available, false)
testLine(state, p.id, line.id, line.config!.version, false, actor)
assert.equal(line.available, false, 'A passed test is not activation')
changeLineStatus(state, p.id, line.id, 'active', line.config!.version, '人工啟用演示', actor)
const version = line.config!.version
saveLine(state, p.id, line.id, { ...config, accountId: 'DEMO-UPDATED' }, version, actor)
assert.equal(line.config!.check, undefined)
assert.equal(line.available, false)
assert.throws(() => resetDemoCredential(state, p.id, line.id, version, '衝突', actor), /版本衝突/)
assert.throws(() => testLine(state, p.id, line.id, line.config!.version, false, denied), /權限/)
assert.throws(() => saveLine(state, p.id, undefined, { ...blankLine(), currency: 'JPY' }, 0, actor))

const numbers = Array.from({ length: 51 }, (_, i) => 51 - i)
assert.deepEqual(listPage(numbers, 1, 10, (a, b) => a - b).items, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
assert.equal(numbers[0], 51, 'Query does not mutate source')
assert.equal(listPage(numbers, 99, 20).page, 3)
assert.equal(listPage(numbers, 1, 50).items.length, 50)
assert.equal(listPage(numbers, -1, 999).size, 10)
assert.deepEqual(listPage([], 2, 20).items, [])
console.log(
  'Provider core simulation checks passed: migration, permission gates, version conflicts, settings validation, credential metadata, activation gates, historical sessions, original-value pagination.'
)
