import assert from 'node:assert/strict'
import {
  loadMerchantAccounts,
  saveMerchantAccount,
  findMerchantLogin,
  merchantAccountRoles,
  merchantAccountKey,
  type MerchantAccount
} from '../src/domain/merchant-accounts'
const map = new Map<string, string>()
const storage = {
  get length() {
    return map.size
  },
  key: (i: number) => [...map.keys()][i] || null,
  getItem: (k: string) => map.get(k) || null,
  setItem: (k: string, v: string) => map.set(k, v),
  removeItem: (k: string) => map.delete(k),
  clear: () => map.clear()
} as Storage
const input: MerchantAccount = {
  id: 'test-1',
  merchantId: 'M00001',
  name: '營運測試',
  account: 'test@example.com',
  role: '營運',
  status: '啟用'
}
const owner = 'merchant@ggap.local'
assert.equal(findMerchantLogin(storage, 'merchant')?.role, '商戶管理員')
assert.throws(() => saveMerchantAccount(storage, 'M00001', owner, input, ''))
saveMerchantAccount(storage, 'M00001', owner, input, '測試新增')
assert.equal(loadMerchantAccounts(storage, 'M00001').history.length, 1)
assert.ok(
  merchantAccountRoles(findMerchantLogin(storage, 'test@example.com')).includes(
    'R_MERCHANT_OPERATIONS'
  )
)
assert.throws(() =>
  saveMerchantAccount(storage, 'M00001', input.account, { ...input, id: 'new' }, '越權')
)
assert.throws(() =>
  saveMerchantAccount(
    storage,
    'M00001',
    owner,
    { ...input, id: 'other', account: 'TEST@example.com' },
    '重複'
  )
)
assert.throws(() =>
  saveMerchantAccount(storage, 'M00001', owner, { ...input, merchantId: 'M00002' }, '跨商戶')
)
assert.throws(() =>
  saveMerchantAccount(storage, 'M00001', owner, { ...input, id: 'M00001:owner' }, '自己')
)
saveMerchantAccount(storage, 'M00001', owner, { ...input, status: '停用' }, '測試停用')
assert.deepEqual(merchantAccountRoles(findMerchantLogin(storage, input.account)), [])
assert.equal(loadMerchantAccounts(storage, 'M00001').history[0].before, '營運測試／營運／啟用')
saveMerchantAccount(storage, 'M00001', owner, { ...input, role: '稽核' }, '恢復並變更角色')
assert.ok(
  merchantAccountRoles(findMerchantLogin(storage, input.account)).includes('R_MERCHANT_AUDITOR')
)
assert.deepEqual(loadMerchantAccounts(storage, 'M00002').rows, [])
storage.setItem(merchantAccountKey('M00002'), 'broken')
assert.throws(() => loadMerchantAccounts(storage, 'M00002'))
console.log(
  'Merchant accounts: create, roles, disable/re-enable, scope, self-protection, duplicates, reasons and audit passed'
)
