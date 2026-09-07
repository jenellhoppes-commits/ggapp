import assert from 'node:assert/strict'
import { merchantQueryRows } from '../src/domain/merchant-portal'
import { prepareMerchantBetReferences } from '../src/domain/settlement-contracts'
import type { PortalSource } from '../src/domain/agent-portal'
import type { BetCenterRecord } from '../src/types/game-provider'
const source = {
  merchants: [{ id: 'M', lines: [{ uid: 'L', currency: 'TWD' }] }],
  agents: [],
  commercialTerms: [],
  portalRateVersions: [],
  merchantCommercialTerms: [
    {
      id: 'OLD',
      merchantId: 'M',
      version: 1,
      status: 'Active',
      effectiveFrom: '2026-01-01',
      merchantTermPercent: 5,
      settlementBasis: 'GGR',
      settlementCurrency: 'TWD',
      settlementCycle: 'Monthly'
    },
    {
      id: 'NEW',
      merchantId: 'M',
      version: 2,
      status: 'Scheduled',
      effectiveFrom: '2027-01-01',
      merchantTermPercent: 4,
      settlementBasis: 'GGR',
      settlementCurrency: 'TWD',
      settlementCycle: 'Monthly'
    }
  ]
} as unknown as PortalSource
const bet = {
  id: 'B1',
  merchantId: 'M',
  lineUid: 'L',
  currency: 'TWD',
  status: 'Settled',
  betAt: '2026-12-31T23:59:59+08:00',
  settledAt: '2027-01-03T02:00:00+08:00',
  memberId: 'P1',
  time: '2026-12-31 23:59',
  gameName: 'Test',
  roundId: 'R1',
  betAmount: 100,
  riskStatus: 'Exception'
} as BetCenterRecord
const bets = [
  bet,
  { ...bet, id: 'B2', betAt: '2027-01-01T00:00:00+08:00' },
  { ...bet, id: 'FOREIGN', merchantId: 'X' }
]
const query = {
  merchantId: 'M',
  lineUid: 'L',
  currency: 'TWD',
  timezone: 'Asia/Taipei',
  from: '2026-12-01',
  toExclusive: '2027-02-01'
}
const frozen = JSON.stringify(source)
const manifest = prepareMerchantBetReferences(source, bets, query)
assert.deepEqual(
  manifest.references.map((r) => r.contract.version),
  [1, 2]
)
assert.equal(manifest.timeBasis, 'betAt')
assert.equal(manifest.matchedCount, 2)
assert.equal(manifest.canCalculate, false)
assert.equal(JSON.stringify(source), frozen)
assert.ok(prepareMerchantBetReferences(source, [{ ...bet, betAt: undefined }], query).issues.length)
assert.ok(prepareMerchantBetReferences(source, [bet, bet], query).issues.length)
assert.equal(
  prepareMerchantBetReferences(source, [{ ...bet, status: 'Refunded' }], query).excluded.length,
  1
)
assert.throws(() => prepareMerchantBetReferences(source, bets, { ...query, lineUid: 'OTHER' }))
const readSource = { merchants: source.merchants, bets, transactions: [], members: [] }
const actor = { roles: ['R_MERCHANT'], merchantId: 'M' }
const rows = merchantQueryRows(readSource, actor, 'bets')
assert.deepEqual(
  rows.map((r) => r.id),
  ['B1', 'B2']
)
assert.equal('riskStatus' in rows[0], false)
assert.equal('merchantId' in rows[0], false)
assert.equal(
  merchantQueryRows(readSource, { roles: ['R_AGENT'], merchantId: 'M' }, 'bets').length,
  0
)
assert.equal(merchantQueryRows(readSource, { roles: ['R_MERCHANT'] }, 'bets').length, 0)
assert.equal(merchantQueryRows(readSource, { ...actor, merchantId: 'UNKNOWN' }, 'bets').length, 0)
console.log(
  'Merchant portal: scoped whitelist, missing identities, foreign records, bet-time year boundary, late settlement, exclusions and immutable reference preparation passed'
)
