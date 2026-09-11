import assert from 'node:assert/strict'
import { collectionModeAt, mayDeliver, type CollectionVersion } from '../src/domain/collection-mode'
const versions: CollectionVersion[] = [
  {
    merchantId: 'M1',
    mode: 'PlatformCollect',
    effectiveFrom: '2026-09-01',
    version: 1,
    reason: '調整',
    actor: '平台',
    createdAt: '2026-08-20'
  }
]
assert.equal(collectionModeAt(versions, 'M1', '2026-08-01'), 'AgentCollect')
assert.equal(collectionModeAt(versions, 'M1', '2026-09-01'), 'PlatformCollect')
assert.equal(collectionModeAt(versions, 'M2', '2026-09-01'), 'AgentCollect')
assert.equal(
  mayDeliver(['R_AGENT', 'R_AGENT_FINANCE'], 'A1', 'merchant', 'A1', 'AgentCollect'),
  true
)
assert.equal(mayDeliver(['R_AGENT'], 'A1', 'merchant', 'A1', 'PlatformCollect'), false)
assert.equal(mayDeliver(['R_AGENT'], 'A2', 'merchant', 'A1', 'AgentCollect'), false)
assert.equal(mayDeliver(['R_AGENT'], 'A1', 'provider', undefined, 'AgentCollect'), false)
assert.equal(mayDeliver(['R_MERCHANT'], undefined, 'merchant', 'A1', 'AgentCollect'), false)
assert.equal(mayDeliver(['R_ADMIN'], undefined, 'provider', undefined, 'PlatformCollect'), true)
assert.equal(mayDeliver([], undefined, 'merchant', 'A1', 'AgentCollect'), false)
console.log(
  'PASS collection mode: effective dates, merchant isolation, agent collect, platform read-only, denied unrelated roles'
)
