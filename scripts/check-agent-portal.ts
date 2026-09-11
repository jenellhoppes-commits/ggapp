import assert from 'node:assert/strict'
import { agentContractHistory, merchantContractHistory } from '../src/domain/business-contracts'
import {
  agentScope,
  canEditRate,
  rateAt,
  rateFingerprint,
  savePortalRate,
  type PortalSource
} from '../src/domain/agent-portal'
const fixture = () =>
  ({
    agents: [
      { id: 'A', status: 'Active' },
      { id: 'B', parentAgentId: 'A', status: 'Active' },
      { id: 'C', parentAgentId: 'B', status: 'Active' },
      { id: 'X', status: 'Active' }
    ],
    merchants: [
      { id: 'M', agentId: 'A', status: 'Active' },
      { id: 'N', agentId: 'B', status: 'Active' },
      { id: 'Z', agentId: 'X', status: 'Active' }
    ],
    commercialTerms: ['A', 'B', 'C'].map((agentId, i) => ({
      id: `TERM-${agentId}`,
      agentId,
      version: 1,
      ratePercent: 10 - i * 2,
      effectiveFrom: '2026-09-01',
      status: 'Active',
      settlementBasis: 'GGR',
      settlementCurrency: 'TWD',
      settlementCycle: 'Monthly'
    })),
    merchantCommercialTerms: ['M', 'N'].map((merchantId) => ({
      id: `TERM-${merchantId}`,
      merchantId,
      version: 1,
      merchantTermPercent: 5,
      effectiveFrom: '2026-09-01',
      status: 'Active',
      settlementBasis: 'GGR',
      settlementCurrency: 'TWD',
      settlementCycle: 'Monthly'
    })),
    portalRateVersions: []
  }) as unknown as PortalSource
const actor = { roles: ['R_AGENT', 'R_AGENT_MANAGER'], agentId: 'A', name: 'Test' }
const ctx = { today: '2026-09-07', timezone: 'Asia/Taipei' }
const b = { kind: 'agent' as const, id: 'B' },
  m = { kind: 'merchant' as const, id: 'M' }
const save = (
  s: PortalSource,
  target = b as typeof b | typeof m,
  rate = '10',
  effectiveFrom = '2026-09-07'
) => savePortalRate(s, actor, target, { rate, effectiveFrom, fingerprint: rateFingerprint(s) }, ctx)
let s = fixture()
assert.deepEqual(
  agentScope(s, actor).agents.map((a) => a.id),
  ['B', 'C']
)
assert.deepEqual(
  agentScope(s, actor).merchants.map((a) => a.id),
  ['M', 'N']
)
assert.equal(agentScope(s, { roles: ['R_AGENT'], name: 'Unbound' }).agents.length, 0)
for (const id of ['A', 'C', 'X']) assert.equal(canEditRate(s, actor, { kind: 'agent', id }), false)
assert.equal(canEditRate(s, actor, { kind: 'merchant', id: 'N' }), false)
assert.equal(canEditRate(s, { ...actor, roles: ['R_MERCHANT'] }, b), false)
assert.throws(() => save(s, b, '10.000001'))
for (const rate of ['', '-1', '101', '0.0000001']) assert.throws(() => save(s, m, rate))
for (const date of ['', '2026-02-30', '2026-09-06']) assert.throws(() => save(s, m, '5', date))
assert.equal(s.portalRateVersions.length, 0)
const original = JSON.stringify(s.commercialTerms)
save(s)
assert.equal(rateAt(s, b, '2026-09-06')?.rate, '8')
assert.equal(rateAt(s, b, '2026-09-07')?.rate, '10')
assert.equal(rateAt(s, b, '2030-01-01')?.rate, '10')
assert.equal(JSON.stringify(s.commercialTerms), original)
assert.throws(() => save(s))
assert.equal(s.portalRateVersions[0].actorId, 'A')
save(s, m, '0')
assert.equal(rateAt(JSON.parse(JSON.stringify(s)), m, '2026-09-07')?.rate, '0')
const stale = rateFingerprint(s)
s.agents[1].status = 'Disabled'
assert.throws(() =>
  savePortalRate(s, actor, m, { rate: '5', effectiveFrom: '2026-10-01', fingerprint: stale }, ctx)
)
s = fixture()
assert.throws(() => save(s, b, '5'), /不得高於上級/)
s.commercialTerms.push({
  ...s.commercialTerms[0],
  version: 2,
  effectiveFrom: '2026-10-01',
  ratePercent: 7
})
assert.throws(() => save(s, b, '8'), /2026-10-01/)
s = fixture()
s.commercialTerms[1].settlementBasis = 'Turnover'
assert.throws(() => save(s), /計費基礎不同/)
assert.equal(s.portalRateVersions.length, 0)
console.log(
  'Agent portal: scope, direct-only writes, cap equality, future limits, effective dates, immutable history, zero, stale edits and persistence passed'
)

s = fixture()
const historical = JSON.stringify(s.commercialTerms)
save(s, b, '9', '2026-09-08')
assert.equal(
  agentContractHistory(s, 'B', '2026-09-07').find((t) => t.status === 'Active')?.ratePercent,
  8
)
assert.equal(agentContractHistory(s, 'B', '2026-09-07')[0].status, 'Scheduled')
assert.equal(
  agentContractHistory(s, 'B', '2026-09-08').find((t) => t.status === 'Active')?.ratePercent,
  9
)
assert.equal(agentContractHistory(s, 'B', '2026-09-08')[1].status, 'Expired')
assert.equal(JSON.stringify(s.commercialTerms), historical)
save(s, m, '0', '2026-09-08')
assert.equal(
  merchantContractHistory(s, 'M', '2026-09-08').find((t) => t.status === 'Active')
    ?.merchantTermPercent,
  0
)
s.commercialTerms.push({
  ...s.commercialTerms[1],
  id: 'ADMIN-3',
  version: 3,
  ratePercent: 8.5,
  effectiveFrom: '2026-10-01',
  status: 'Scheduled'
})
assert.equal(rateAt(s, b, '2026-10-01')?.rate, '8.5')
assert.equal(
  agentContractHistory(s, 'B', '2026-10-01').find((t) => t.status === 'Active')?.ratePercent,
  8.5
)
s.commercialTerms.push({
  ...s.commercialTerms[1],
  id: 'DRAFT-4',
  version: 4,
  ratePercent: 7,
  effectiveFrom: '2026-11-01',
  status: 'Draft'
})
save(s, b, '8', '2026-11-02')
assert.equal(s.portalRateVersions.at(-1)?.version, 5)
assert.equal(
  agentContractHistory(s, 'B', '2026-11-02').find((t) => t.status === 'Active')?.ratePercent,
  8
)
s = fixture()
s.commercialTerms.push({
  ...s.commercialTerms[1],
  id: 'ENDED',
  version: 2,
  effectiveFrom: '2026-09-02',
  effectiveTo: '2026-09-03'
})
assert.equal(rateAt(s, b, '2026-09-04'), undefined)
console.log(
  'Shared contracts: both directions, scheduled/current/history, draft exclusion, unique versions, explicit expiry and unchanged source passed'
)
