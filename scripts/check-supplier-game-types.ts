import assert from 'node:assert/strict'
import {
  prepareSupplierCost,
  supplierCostAt,
  type SupplierCostInput,
  type SupplierCostVersion
} from '../src/domain/admin-supplier-costs'
import { calculateStatement } from '../src/domain/supplier-statements'
import { typedPartnerSamples, sharedPartnerSample } from '../src/domain/supplier-cost-demo'
import { commercialGameType } from '../src/domain/game-types'
const ctx = {
  roles: ['R_ADMIN'],
  name: 'QA',
  today: '2026-09-10',
  timezone: 'Asia/Taipei',
  providers: ['PP'],
  currencies: ['USD']
}
const input: SupplierCostInput = {
  providerId: 'PP',
  gameType: 'SLOT',
  scope: 'provider',
  basis: 'GGR',
  currency: 'USD',
  cycle: 'Monthly',
  effectiveFrom: '2026-09-10',
  rate: '5',
  meaning: 'payable',
  negativeGgr: 'zero'
}
const rows: SupplierCostVersion[] = []
for (const [gameType, rate] of [
  ['SLOT', '5'],
  ['LIVE', '8']
])
  rows.push(
    prepareSupplierCost(rows, 'platform', 'platform', '', { ...input, gameType, rate }, ctx)
  )
assert.notEqual(rows[0].id, rows[1].id)
for (const [gameType, rate] of [
  ['SLOT', '6'],
  ['LIVE', '9']
])
  rows.push(prepareSupplierCost(rows, 'agent', 'A', '', { ...input, gameType, rate }, ctx))
assert.throws(
  () =>
    prepareSupplierCost(rows, 'merchant', 'M', 'A', { ...input, gameType: 'LIVE', rate: '8' }, ctx),
  /低於/
)
assert.throws(
  () =>
    prepareSupplierCost(
      rows,
      'merchant',
      'M',
      'A',
      { ...input, gameType: 'SPORT', rate: '10' },
      ctx
    ),
  /缺少/
)
assert.throws(
  () => prepareSupplierCost(rows, 'platform', 'platform', '', { ...input, basis: 'ValidBet' }, ctx),
  /GGR/
)
assert.equal(supplierCostAt(rows, 'agent', 'A', 'PP', '2026-09-10', 'USD'), undefined)
const before = JSON.stringify(rows)
const agent = {
  ...ctx,
  roles: ['R_AGENT', 'R_AGENT_MANAGER'],
  agentId: 'A',
  editableTargets: ['merchant:M']
}
rows.push(prepareSupplierCost(rows, 'merchant', 'M', 'A', { ...input, rate: '7' }, agent))
assert.throws(
  () => prepareSupplierCost(rows, 'merchant', 'N', 'A', { ...input, rate: '7' }, agent),
  /權限/
)
const bets = ['SLOT', 'LIVE'].map((gameType, i) => ({
  id: String(i),
  providerId: 'PP',
  gameType,
  currency: 'USD',
  time: '2026-09-10T04:00:00Z',
  game: 'G',
  bet: 100000,
  valid: 100000,
  payout: 0
}))
const lines = calculateStatement(
  bets,
  rows,
  'agent',
  'A',
  '2026-09-10',
  '2026-09-10',
  'Asia/Taipei'
)
assert.deepEqual(
  lines.map((l) => l.amount),
  [6000, 9000]
)
assert.equal(JSON.stringify(rows.slice(0, 4)), before)
rows.push(
  prepareSupplierCost(
    rows,
    'agent',
    'A',
    '',
    { ...input, rate: '6.5', effectiveFrom: '2026-09-11' },
    ctx
  )
)
assert.equal(supplierCostAt(rows, 'agent', 'A', 'PP', '2026-09-10', 'USD', 'SLOT')?.payable, '6')
assert.equal(supplierCostAt(rows, 'agent', 'A', 'PP', '2026-09-11', 'USD', 'SLOT')?.payable, '6.5')
assert.equal(supplierCostAt(rows, 'agent', 'A', 'PP', '2026-09-11', 'USD', 'LIVE')?.payable, '9')
console.log(
  'PASS supplier game types: separate costs, authorization, GGR, version isolation and statement grouping'
)
assert.equal(commercialGameType('電子遊戲'), 'SLOT')
assert.equal(commercialGameType('真人娛樂'), 'LIVE')
assert.equal(commercialGameType('未分類'), undefined)
const originalSamples = sharedPartnerSample([])
const snapshot = JSON.stringify(originalSamples)
const typed = typedPartnerSamples(originalSamples)
assert.ok(typed.some((r) => r.gameType === 'SLOT'))
assert.ok(typed.some((r) => r.gameType === 'LIVE'))
assert.equal(typedPartnerSamples([...originalSamples, ...typed]).length, 0)
assert.equal(JSON.stringify(originalSamples), snapshot)
