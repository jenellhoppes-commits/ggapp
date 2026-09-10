import assert from 'node:assert/strict'
import { createDemoState, capabilityError } from '../src/domain/provider-demo'
import { ensureProviderCore, saveProvider } from '../src/domain/provider-core'

const state = createDemoState()
const p = state.providers[1]
const g = state.games.find((g) => g.providerId === p.id)!
g.active = true
const input = {
  name: 'Trial flag check',
  purpose: 'internal' as const,
  providerId: p.id,
  gameId: g.id,
  lineId: p.lines[0].id,
  locale: g.locales[0],
  expiresAt: '2099-01-01',
  initialCredit: 100
}
assert.equal(capabilityError(state, input), '')
const actor = { roles: ['R_ADMIN'], name: 'Trial flag test' }
const update = (offersTrial: boolean) =>
  saveProvider(
    state,
    p.id,
    {
      code: p.profile!.code,
      name: p.name,
      contact: p.profile!.contact,
      note: p.profile!.note,
      offersTrial
    },
    p.profile!.version,
    actor
  )
update(false)
assert.equal(capabilityError(state, input), '供應商未提供試玩')
const restored = JSON.parse(JSON.stringify(state))
ensureProviderCore(restored)
assert.equal(restored.providers[1].profile.offersTrial, false)
assert.equal(capabilityError(restored, input), '供應商未提供試玩')
update(true)
assert.equal(capabilityError(state, input), '')
assert.ok(state.audit.some((a) => a.action === '是否提供試玩：是 → 否'))
assert.ok(state.audit.some((a) => a.action === '是否提供試玩：否 → 是'))
const fresh = saveProvider(
  state,
  undefined,
  { code: 'TRIAL_NEW', name: 'New', contact: '', note: '' },
  0,
  actor
)
assert.equal(fresh.profile!.offersTrial, false)
// A technically configured test mode may use the provider's default credit.
saveProvider(
  state,
  p.id,
  {
    code: p.profile!.code,
    name: p.name,
    contact: '',
    note: '',
    offersTrial: true,
    trialMode: 'sandbox'
  },
  p.profile!.version,
  actor
)
p.initialCredit = false
p.billingExcluded = false
assert.equal(p.mode, 'sandbox')
assert.equal(capabilityError(state, { ...input, initialCredit: undefined }), '')
p.lines[0].config!.environment = 'production'
assert.notEqual(capabilityError(state, input), '')
console.log(
  'Trial flag checks passed: off/on, serialization, migration, audit, new-provider default.'
)
