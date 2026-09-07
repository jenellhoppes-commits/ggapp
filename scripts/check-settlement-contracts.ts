import assert from 'node:assert/strict'
import {
  settlementContractCoverage,
  referenceTransactions
} from '../src/domain/settlement-contracts'
import type { PortalSource } from '../src/domain/agent-portal'
const source = {
  agents: [],
  merchants: [],
  merchantCommercialTerms: [],
  portalRateVersions: [],
  commercialTerms: [
    {
      id: 'T1',
      agentId: 'A',
      version: 1,
      status: 'Active',
      effectiveFrom: '2026-09-01',
      ratePercent: 5,
      settlementBasis: 'GGR',
      settlementCurrency: 'TWD',
      settlementCycle: 'Monthly'
    },
    {
      id: 'T2',
      agentId: 'A',
      version: 2,
      status: 'Scheduled',
      effectiveFrom: '2026-09-08',
      ratePercent: 4,
      settlementBasis: 'GGR',
      settlementCurrency: 'TWD',
      settlementCycle: 'Monthly'
    }
  ]
} as unknown as PortalSource
const target = { kind: 'agent' as const, id: 'A' }
const ctx = {
  timezone: 'Asia/Taipei',
  timeBasis: 'settledAt' as const,
  from: '2026-09-01',
  toExclusive: '2026-10-01'
}
const before = JSON.stringify(source)
const coverage = settlementContractCoverage(source, target, ctx.from, ctx.toExclusive)
assert.equal(coverage.length, 2)
assert.equal(coverage[0].toExclusive, '2026-09-08')
assert.equal(coverage[1].reference?.version, 2)
const refs = referenceTransactions(
  source,
  target,
  [
    { id: '1', settledAt: '2026-09-07T15:59:59Z' },
    { id: '2', settledAt: '2026-09-07T16:00:00Z' }
  ],
  ctx
)
assert.deepEqual(
  refs.map((r) => r.contract.version),
  [1, 2]
)
assert.equal(JSON.stringify(source), before)
source.commercialTerms[1].ratePercent = 3
assert.equal(refs[1].contract.rate, '4')
assert.throws(() => referenceTransactions(source, target, [], ctx))
assert.throws(() =>
  referenceTransactions(source, target, [{ id: '1', settledAt: '2026-09-08 01:00:00' }], ctx)
)
assert.throws(() =>
  referenceTransactions(source, target, [{ id: '1', settledAt: '2026-08-31T00:00:00Z' }], ctx)
)
assert.throws(() =>
  referenceTransactions(
    source,
    target,
    [
      { id: '1', settledAt: '2026-09-08T00:00:00Z' },
      { id: '1', settledAt: '2026-09-08T00:00:00Z' }
    ],
    ctx
  )
)
assert.throws(() => settlementContractCoverage(source, target, '2026-02-30', '2026-03-01'))
assert.ok(settlementContractCoverage(source, target, '2026-08-01', '2026-10-01')[0].error)
console.log(
  'Settlement references: date boundaries, timezone, version copies, coverage gaps, missing details and duplicates passed'
)
