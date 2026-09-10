import assert from 'node:assert/strict'
import {
  preparePartnerCreation,
  persistPartnerJournal,
  PARTNER_JOURNAL_KEY,
  type PartnerInput,
  type PartnerSource
} from '../src/domain/partner-creation'
import {
  prepareSupplierCost,
  type CostContext,
  type SupplierCostInput
} from '../src/domain/admin-supplier-costs'
import type { AgentRecord } from '../src/types/game-provider'
const context: CostContext & { providerWallets: Record<string, string[]> } = {
  roles: ['R_SUPER'],
  name: 'test',
  today: '2026-09-09',
  timezone: 'Asia/Taipei',
  providers: ['PP'],
  currencies: ['USD'],
  providerCurrencies: { PP: ['USD'] },
  providerWallets: { PP: ['Seamless'] }
}
const term: SupplierCostInput = {
  providerId: 'PP',
  transactionCurrency: 'USD',
  currency: 'USD',
  basis: 'GGR',
  cycle: 'Monthly',
  effectiveFrom: context.today,
  rate: '5',
  meaning: 'payable'
}
const root = prepareSupplierCost([], 'platform', 'platform', '', term, context)
const a = {
  id: 'A0',
  code: 'AG-ROOT',
  name: 'Parent',
  level: 'L1',
  status: 'Active',
  parentAgent: '—',
  childAgentCount: 0,
  merchantCount: 0,
  currency: 'USD',
  contact: 'test',
  createdAt: context.today
} as AgentRecord
const ownCost = prepareSupplierCost([root], 'agent', a.id, '', { ...term, rate: '6' }, context)
const source: PartnerSource = { agents: [a], merchants: [], costs: [root, ownCost], entries: [] }
const input: PartnerInput = {
  kind: 'agent',
  parentId: a.id,
  code: 'NEW-AGENT',
  name: 'New Agent',
  contact: 'Demo',
  contactMethod: 'demo only',
  cooperationStartDate: context.today,
  note: '',
  country: 'TW',
  email: 'demo@example.invalid',
  walletMode: 'Seamless',
  lineCurrency: 'USD',
  terms: [{ ...term, rate: '7' }]
}
const actor = { ...context, roles: ['R_AGENT'], agentId: a.id }
const before = JSON.stringify(source)
const entry = preparePartnerCreation(source, input, actor, 'request-1')
assert.equal(JSON.stringify(source), before, 'prepare must not mutate or partially create')
assert.equal(entry.agent?.level, 'L2')
assert.equal(entry.costs[0].payable, '7')
assert.equal(entry.costs[0].upstreamCost, '6')
assert.throws(
  () => preparePartnerCreation(source, { ...input, terms: [] }, actor, 'missing-terms'),
  /必填/
)
assert.throws(
  () => preparePartnerCreation(source, { ...input, terms: [{ ...term, rate: '5' }] }, actor, 'low'),
  /低於/
)
assert.throws(
  () =>
    preparePartnerCreation(
      source,
      { ...input, terms: [{ ...term, effectiveFrom: '' }] },
      actor,
      'date'
    ),
  /開始日期|有效日期/
)
assert.throws(
  () => preparePartnerCreation(source, { ...input, parentId: '' }, actor, 'wrong-parent'),
  /本人/
)
assert.throws(
  () => preparePartnerCreation(source, input, { ...actor, roles: ['R_MERCHANT'] }, 'role'),
  /本人/
)
assert.throws(
  () =>
    preparePartnerCreation(
      source,
      { ...input, terms: [{ ...term, transactionCurrency: 'TWD' }] },
      actor,
      'currency'
    ),
  /交易幣別/
)
source.entries.push(entry)
source.agents.push(entry.agent!)
source.costs.push(...entry.costs)
assert.equal(
  preparePartnerCreation(source, input, actor, 'request-1'),
  entry,
  'same retry returns same result'
)
assert.throws(
  () => preparePartnerCreation(source, { ...input, name: 'Changed' }, actor, 'request-1'),
  /重送/
)
assert.throws(() => preparePartnerCreation(source, input, actor, 'request-new'), /代碼已存在/)
const l3 = preparePartnerCreation(
  source,
  { ...input, code: 'NEW-L3', parentId: entry.agent!.id, terms: [{ ...term, rate: '8' }] },
  { ...actor, agentId: entry.agent!.id },
  'request-2'
)
assert.equal(l3.agent?.level, 'L3')
source.agents.push(l3.agent!)
source.costs.push(...l3.costs)
source.entries.push(l3)
assert.throws(
  () =>
    preparePartnerCreation(
      source,
      { ...input, code: 'BAD-L4', parentId: l3.agent!.id },
      { ...actor, agentId: l3.agent!.id },
      'request-3'
    ),
  /三級/
)
const merchantInput = {
  ...input,
  kind: 'merchant' as const,
  code: 'MER-NEW',
  parentId: l3.agent!.id,
  terms: [{ ...term, rate: '9' }]
}
const merchantEntry = preparePartnerCreation(
  source,
  merchantInput,
  { ...actor, agentId: l3.agent!.id },
  'request-4'
)
assert.equal(merchantEntry.merchant?.agentId, l3.agent?.id)
assert.equal(merchantEntry.merchant?.lines[0].enabledGames, 0)
assert.equal(merchantEntry.merchant?.lines[0].environments[0].credential, undefined)
assert.equal(merchantEntry.merchant?.status, 'Draft')
assert.throws(
  () =>
    preparePartnerCreation(
      source,
      { ...merchantInput, lineCurrency: 'TWD' },
      { ...actor, agentId: l3.agent!.id },
      'request-5'
    ),
  /有效的初始交易幣別/
)
const sharedTerm = {
  ...term,
  scope: 'provider' as const,
  transactionCurrency: undefined,
  negativeGgr: 'zero' as const
}
const sharedRoot = prepareSupplierCost([], 'platform', 'platform', '', sharedTerm, context)
const sharedAgent = prepareSupplierCost(
  [sharedRoot],
  'agent',
  a.id,
  '',
  { ...sharedTerm, rate: '6' },
  context
)
for (const currency of ['USD', 'TWD']) {
  const created = preparePartnerCreation(
    { agents: [a], merchants: [], costs: [sharedRoot, sharedAgent], entries: [] },
    { ...input, kind: 'merchant', lineCurrency: currency, terms: [{ ...sharedTerm, rate: '7' }] },
    { ...context, currencies: ['USD', 'TWD'], providerWallets: {} },
    `shared-${currency}`
  )
  assert.equal(created.merchant?.lines[0].currency, currency)
  assert.equal(
    created.merchant?.lines[0].enabledGames,
    0,
    'creation does not authorize unavailable games'
  )
  assert.equal(created.costs[0].payable, '7')
}
let stored: string | null = null
const storage = {
  getItem: (_key: string) => stored,
  setItem: (_key: string, value: string) => {
    stored = value
  }
}
const journal = {
  version: 1 as const,
  entries: [entry, l3, merchantEntry],
  costVersions: [root, ownCost]
}
const serialized = persistPartnerJournal(storage, null, journal)
assert.equal(JSON.parse(stored!).entries[2].costs[0].ownerId, merchantEntry.merchant!.id)
assert.throws(() => persistPartnerJournal(storage, null, journal), /其他頁面/)
assert.equal(stored, serialized)
assert.throws(
  () =>
    persistPartnerJournal(
      {
        getItem: () => stored,
        setItem: () => {
          throw new Error('QuotaExceeded')
        }
      },
      serialized,
      { ...journal, entries: [] }
    ),
  /QuotaExceeded/
)
assert.equal(stored, serialized, 'quota failure keeps complete old snapshot')

// Reload the business projection from the single authoritative journal.
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => (key === PARTNER_JOURNAL_KEY ? stored : null),
    setItem: () => {}
  },
  configurable: true
})
const { createPinia, setActivePinia } = await import('pinia')
const { useBusinessPartnerStore } = await import('../src/store/modules/businessPartner')
setActivePinia(createPinia())
const business = useBusinessPartnerStore()
assert.ok(business.findAgent(entry.agent!.id))
assert.ok(business.findMerchant(merchantEntry.merchant!.id))
assert.equal(
  business.getMerchantReconciliations(merchantEntry.merchant!.id).length,
  0,
  'new merchant has no invented historical statements'
)
console.log(
  'Partner creation passed: shared scope, L1/L2/L3, merchant by L3, fee floor, required terms/date, duplicate/retry, atomic write/quota/conflict and reload projection.'
)
