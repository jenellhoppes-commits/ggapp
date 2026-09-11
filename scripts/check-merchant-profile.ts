import assert from 'node:assert/strict'
import { merchantProfile, merchantConditions } from '../src/domain/merchant-profile'
import type { MerchantRecord } from '../src/types/game-provider'
import type { SupplierCostVersion } from '../src/domain/admin-supplier-costs'
const merchants = [
  { id: 'M1', agentTermPercent: 2, note: 'private' },
  { id: 'M2' }
] as MerchantRecord[]
const actor = { roles: ['R_MERCHANT'], merchantId: 'M1' }
const base = {
  owner: 'merchant',
  ownerId: 'M1',
  providerId: 'P',
  gameType: 'SLOT',
  scope: 'provider',
  basis: 'GGR',
  payable: '5',
  upstreamCost: '2',
  createdAt: '2026-01-01'
}
const rows = [
  { ...base, id: 'old', effectiveFrom: '2026-01-01' },
  { ...base, id: 'current', effectiveFrom: '2026-09-01' },
  { ...base, id: 'future', effectiveFrom: '2027-01-01' },
  { ...base, id: 'legacy', gameType: undefined, effectiveFrom: '2026-01-01' },
  { ...base, id: 'foreign', ownerId: 'M2', effectiveFrom: '2026-01-01' },
  { ...base, id: 'agent', owner: 'agent', effectiveFrom: '2026-01-01' }
] as SupplierCostVersion[]
assert.equal('agentTermPercent' in merchantProfile(merchants, actor)!, false)
assert.equal('note' in merchantProfile(merchants, actor)!, false)
assert.equal(merchantProfile(merchants, { roles: ['R_AGENT'], merchantId: 'M1' }), undefined)
assert.equal(merchantProfile(merchants, { roles: ['R_MERCHANT'] }), undefined)
const before = JSON.stringify(rows)
const result = merchantConditions(merchants, rows, actor, '2026-09-10')
assert.equal(result.length, 4)
assert.equal(result.find((r) => r.id === 'current')?.state, '目前有效')
assert.equal(result.find((r) => r.id === 'old')?.state, '歷史版本')
assert.equal(result.find((r) => r.id === 'future')?.state, '未來生效')
assert.equal(result.find((r) => r.id === 'legacy')?.state, '待補完整')
assert.ok(result.every((r) => !('upstreamCost' in r)))
assert.equal(JSON.stringify(rows), before)
console.log(
  'Merchant profile: own-only projection, cost privacy, effective/history/future/legacy versions passed'
)
