import assert from 'node:assert/strict'
import {
  accountRolesFor,
  accountSeeds,
  permitsAgent,
  findLoginAccount,
  loadAgentAccounts,
  accountStorageKey
} from '../src/domain/agent-access'
import { saveAgentAccount } from '../src/domain/agent-accounts'
import { mayDeliver } from '../src/domain/collection-mode'
import { prepareSupplierCost } from '../src/domain/admin-supplier-costs'
const map = new Map<string, string>()
const storage = {
  get length() {
    return map.size
  },
  key: (i: number) => [...map.keys()][i] || null,
  getItem: (k: string) => map.get(k) || null,
  setItem: (k: string, v: string) => {
    map.set(k, v)
  },
  removeItem: (k: string) => {
    map.delete(k)
  },
  clear: () => map.clear()
} as Storage
const rows = accountSeeds()
assert.equal(findLoginAccount(storage, 'agent')?.role, '代理管理員')
assert.equal(findLoginAccount(storage, 'unknown'), undefined)
for (const row of rows) {
  const roles = accountRolesFor(row)
  assert.equal(permitsAgent(roles, 'read'), true)
  assert.equal(permitsAgent(roles, 'accounts'), row.role === '代理管理員')
  assert.equal(permitsAgent(roles, 'business'), row.role === '代理管理員')
  assert.equal(
    mayDeliver(roles, 'A', 'merchant', 'A', 'AgentCollect'),
    ['代理管理員', '財務'].includes(row.role)
  )
  assert.equal(mayDeliver(roles, 'A', 'merchant', 'A', 'PlatformCollect'), false)
  assert.equal(mayDeliver(roles, 'A', 'merchant', 'B', 'AgentCollect'), false)
  assert.equal(mayDeliver(roles, 'A', 'provider', 'A', 'AgentCollect'), false)
  assert.deepEqual(accountRolesFor({ ...row, status: '停用' }), [])
  if (row.role !== '代理管理員')
    assert.throws(
      () =>
        prepareSupplierCost(
          [],
          'merchant',
          'M',
          'A',
          {
            providerId: 'P',
            basis: 'GGR',
            currency: 'USD',
            cycle: 'Monthly',
            effectiveFrom: '2026-09-10',
            rate: '5',
            meaning: 'payable'
          },
          {
            roles,
            agentId: 'A',
            editableTargets: ['merchant:M'],
            name: 'test',
            today: '2026-09-10',
            timezone: 'Asia/Taipei',
            providers: ['P'],
            currencies: ['USD']
          }
        ),
      /權限/
    )
}
assert.equal(permitsAgent(['R_AGENT'], 'accounts'), false)
assert.equal(mayDeliver(['R_AGENT'], 'A', 'merchant', 'A', 'AgentCollect'), false)
const disabled = saveAgentAccount(rows, rows[0].id, { ...rows[1], status: '停用' }, '停用測試')
storage.setItem(
  accountStorageKey('A00001'),
  JSON.stringify({ rows: [rows[0], disabled, ...rows.slice(2)], history: [] })
)
assert.deepEqual(accountRolesFor(findLoginAccount(storage, rows[1].account)), [])
assert.equal(loadAgentAccounts(storage, 'A00001').rows[1].status, '停用')
const changed = { ...rows[2], role: '財務' as const }
storage.setItem(
  accountStorageKey('A00001'),
  JSON.stringify({ rows: [rows[0], disabled, changed, rows[3]], history: [] })
)
assert.equal(
  permitsAgent(accountRolesFor(findLoginAccount(storage, changed.account)), 'delivery'),
  true
)
assert.equal(
  permitsAgent(accountRolesFor(findLoginAccount(storage, changed.account)), 'business'),
  false
)
storage.setItem(accountStorageKey('A00001'), '{broken')
assert.throws(() => findLoginAccount(storage, 'agent'))
console.log(
  'Four-role access passed: account resolution, disabled/changed roles, business write denial, scoped finance, unknown identity and corrupt storage fail closed.'
)
