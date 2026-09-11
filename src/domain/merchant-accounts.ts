import { findLoginAccount } from './agent-access'
export const merchantRoles = ['商戶管理員', '營運', '財務', '技術', '稽核'] as const
export type MerchantRole = (typeof merchantRoles)[number]
export type MerchantAccount = {
  id: string
  merchantId: string
  name: string
  account: string
  role: MerchantRole
  status: '啟用' | '停用'
}
export type MerchantAudit = {
  id: string
  time: string
  operator: string
  action: string
  target: string
  before: string
  after: string
  reason: string
}
export const merchantAccountKey = (id: string) => `ggap-merchant-accounts-v1:${id}`
export const merchantRoleCodes: Record<MerchantRole, string> = {
  商戶管理員: 'R_MERCHANT_MANAGER',
  營運: 'R_MERCHANT_OPERATIONS',
  財務: 'R_MERCHANT_FINANCE',
  技術: 'R_MERCHANT_TECH',
  稽核: 'R_MERCHANT_AUDITOR'
}
export function loadMerchantAccounts(
  storage: Pick<Storage, 'getItem'>,
  id: string
): { rows: MerchantAccount[]; history: MerchantAudit[] } {
  const raw = storage.getItem(merchantAccountKey(id))
  if (!raw)
    return {
      rows:
        id === 'M00001'
          ? [
              {
                id: 'M00001:owner',
                merchantId: id,
                name: '商戶管理員',
                account: 'merchant@ggap.local',
                role: '商戶管理員',
                status: '啟用'
              }
            ]
          : [],
      history: []
    }
  const data = JSON.parse(raw)
  if (!Array.isArray(data.rows) || !Array.isArray(data.history)) throw new Error('帳號資料讀取失敗')
  return {
    rows: data.rows.filter((r: MerchantAccount) => r.merchantId === id),
    history: data.history
  }
}
export function findMerchantLogin(storage: Storage, login: string) {
  const ids = new Set(['M00001'])
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith('ggap-merchant-accounts-v1:'))
      ids.add(key.slice('ggap-merchant-accounts-v1:'.length))
  }
  const email = login.trim().toLowerCase()
  const matches = [...ids]
    .flatMap((id) => loadMerchantAccounts(storage, id).rows)
    .filter(
      (r) => r.account.toLowerCase() === email || (email === 'merchant' && r.id === 'M00001:owner')
    )
  return matches.length === 1 ? matches[0] : undefined
}
export function merchantAccountRoles(account?: MerchantAccount) {
  return account?.status === '啟用' && merchantRoleCodes[account.role]
    ? ['R_MERCHANT', merchantRoleCodes[account.role]]
    : []
}
export function saveMerchantAccount(
  storage: Storage,
  merchantId: string,
  login: string,
  input: MerchantAccount,
  reason: string
) {
  const data = loadMerchantAccounts(storage, merchantId),
    actor = data.rows.find((r) => r.account.toLowerCase() === login.toLowerCase())
  if (!actor || actor.status !== '啟用' || actor.role !== '商戶管理員')
    throw new Error('只有啟用的商戶管理員可以管理帳號')
  if (input.merchantId !== merchantId) throw new Error('不可管理其他商戶帳號')
  if (input.id === actor.id) throw new Error('不可修改自己的帳號')
  if (input.id === 'M00001:owner') throw new Error('主要管理員帳號不可修改')
  if (!merchantRoles.includes(input.role) || !['啟用', '停用'].includes(input.status))
    throw new Error('角色或狀態無效')
  const name = input.name.trim(),
    account = input.account.trim().toLowerCase()
  if (
    !name ||
    name.length > 60 ||
    account.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account)
  )
    throw new Error('請填寫姓名與有效電子郵件')
  if (!reason.trim() || reason.length > 500) throw new Error('請填寫變更原因（500 字內）')
  const old = data.rows.find((r) => r.id === input.id)
  if (old && old.account !== account) throw new Error('既有帳號不可修改')
  const existing = findMerchantLogin(storage, account)
  if (existing && existing.id !== input.id) throw new Error('帳號已存在')
  if (findLoginAccount(storage, account)) throw new Error('帳號已被使用')
  if (['admin@ggap.local', 'agent@ggap.local'].includes(account)) throw new Error('帳號已被使用')
  const next = { ...input, name, account }
  data.rows = old ? data.rows.map((r) => (r.id === next.id ? next : r)) : [...data.rows, next]
  const describe = (r: MerchantAccount) => `${r.name}／${r.role}／${r.status}`
  data.history.unshift({
    id: crypto.randomUUID(),
    time: new Date().toISOString(),
    operator: actor.account,
    action: old ? (old.status !== next.status ? next.status + '帳號' : '編輯帳號') : '新增帳號',
    target: account,
    before: old ? describe(old) : '—',
    after: describe(next),
    reason: reason.trim()
  })
  storage.setItem(merchantAccountKey(merchantId), JSON.stringify(data))
  return data
}
