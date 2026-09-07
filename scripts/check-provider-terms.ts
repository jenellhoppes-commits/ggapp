import assert from 'node:assert/strict'
import { createDemoState } from '../src/domain/provider-demo'
import { saveProviderTerms, termsAt, type ProviderTermsInput } from '../src/domain/provider-terms'
const state = createDemoState(),
  id = state.providers[0].id
const actor = { roles: ['R_ADMIN'], name: 'Test' }
const context = { today: '2026-09-07', timezone: 'Asia/Taipei', currencies: ['TWD'] }
const input: ProviderTermsInput = {
  basis: 'GGR',
  rate: '12.5',
  currency: 'TWD',
  cycle: 'Monthly',
  effectiveFrom: '2026-09-07',
  note: '虛構測試'
}
const save = (patch = {}, version = 0) =>
  saveProviderTerms(state, id, { ...input, ...patch }, version, actor, context)
assert.throws(() => save({ rate: '' }))
assert.throws(() => save({ effectiveFrom: '' }))
assert.throws(() => save({ effectiveFrom: '2026-09-06' }))
assert.throws(() => save({ effectiveFrom: '2026-02-30' }))
assert.throws(() => save({ rate: '101' }))
assert.throws(() => save({ currency: 'XXX' }))
assert.throws(() => saveProviderTerms(state, id, input, 0, { roles: [], name: 'denied' }, context))
save()
const old = JSON.stringify(state.providers[0].terms![0])
assert.throws(() => save({ effectiveFrom: '2026-10-01' }, 0))
assert.throws(() => save({}, 1))
save({ rate: '0', effectiveFrom: '2026-10-01' }, 1)
const versions = state.providers[0].terms!
assert.equal(JSON.stringify(versions[0]), old)
assert.equal(termsAt(versions, '2026-09-06'), undefined)
assert.equal(termsAt(versions, '2026-09-30')?.rate, '12.5')
assert.equal(termsAt(versions, '2026-10-01')?.rate, '0')
assert.equal(termsAt(versions, '2027-12-01')?.rate, '0')
assert.equal(versions.length, 2)
assert.equal(state.audit[0].actor, 'Test')
console.log(
  'Provider terms: validation, permissions, version conflicts, effective dates and immutable history passed'
)
