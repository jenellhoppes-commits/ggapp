export const accountRoles = ['代理管理員', '營運', '財務', '稽核'] as const
export type AccountRole = (typeof accountRoles)[number]
export type AgentAccount = {
  id: string
  agentId: string
  name: string
  account: string
  role: AccountRole
  status: '啟用' | '停用'
}
export type AccountChange = {
  target: string
  before: string
  after: string
  reason: string
  operator: string
  time: string
}
export const rolePermissions = [
  {
    role: '代理管理員',
    business: '直屬代理及商戶、商務條件管理',
    finance: '直屬代理統收商戶核帳／交付',
    accounts: '本代理帳號管理'
  },
  { role: '營運', business: '合作資料與報表查詢', finance: '唯讀', accounts: '本人唯讀' },
  {
    role: '財務',
    business: '報表與條件唯讀',
    finance: '直屬代理統收商戶核帳／交付',
    accounts: '本人唯讀'
  },
  { role: '稽核', business: '授權範圍唯讀', finance: '唯讀', accounts: '本人唯讀' }
]
export function saveAgentAccount(
  rows: AgentAccount[],
  actorId: string,
  input: AgentAccount,
  reason: string
): AgentAccount {
  const actor = rows.find((r) => r.id === actorId)
  if (!actor || actor.status !== '啟用' || actor.role !== '代理管理員')
    throw new Error('只有啟用的代理管理員可以管理帳號')
  if (input.agentId !== actor.agentId) throw new Error('不可管理其他代理的帳號')
  const old = rows.find((r) => r.id === input.id)
  if (old && old.agentId !== actor.agentId) throw new Error('不可管理其他代理的帳號')
  if (input.id === actorId) throw new Error('不可修改或停用自己的帳號')
  if (!accountRoles.includes(input.role) || !['啟用', '停用'].includes(input.status))
    throw new Error('請選擇有效角色及狀態')
  if (!input.name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.account.trim()))
    throw new Error('請填寫姓名與有效電子郵件帳號')
  if (old && input.account !== old.account) throw new Error('既有帳號不可修改')
  if (
    rows.some(
      (r) => r.id !== input.id && r.account.toLowerCase() === input.account.trim().toLowerCase()
    )
  )
    throw new Error('帳號已存在')
  if (!reason.trim()) throw new Error('請填寫變更原因')
  return { ...input, name: input.name.trim(), account: input.account.trim().toLowerCase() }
}
