import type { AccountRole, AgentAccount } from './agent-accounts'
export type AgentAction = 'read' | 'business' | 'delivery' | 'accounts'
export const agentRoleCodes: Record<AccountRole, string> = {
  代理管理員: 'R_AGENT_MANAGER',
  營運: 'R_AGENT_OPERATIONS',
  財務: 'R_AGENT_FINANCE',
  稽核: 'R_AGENT_AUDITOR'
}
export function permitsAgent(roles: string[], action: AgentAction) {
  if (!roles.includes('R_AGENT')) return false
  if (action === 'read') return Object.values(agentRoleCodes).some((r) => roles.includes(r))
  if (action === 'delivery')
    return roles.includes('R_AGENT_MANAGER') || roles.includes('R_AGENT_FINANCE')
  return roles.includes('R_AGENT_MANAGER')
}
export const accountStorageKey = (id: string) => `ggap-agent-accounts-v1:${id}`
export function accountSeeds(agentId = 'A00001'): AgentAccount[] {
  return [
    {
      id: `${agentId}:owner`,
      agentId,
      name: '代理管理員',
      account: 'agent@ggap.local',
      role: '代理管理員',
      status: '啟用'
    },
    ...(['財務', '營運', '稽核'] as const).map((role, i) => ({
      id: `${agentId}:sample-${i}`,
      agentId,
      name: ['Finance Team', 'Operations Team', 'Audit Team'][i],
      account: `${['finance', 'operations', 'audit'][i]}.${agentId.toLowerCase()}@example.com`,
      role,
      status: '啟用' as const
    }))
  ]
}
export function loadAgentAccounts(storage: Pick<Storage, 'getItem'>, agentId: string) {
  const raw = storage.getItem(accountStorageKey(agentId))
  if (!raw) return { rows: agentId === 'A00001' ? accountSeeds() : [], history: [] }
  const data = JSON.parse(raw)
  if (!Array.isArray(data.rows) || !Array.isArray(data.history)) throw new Error('帳號資料無法讀取')
  return {
    rows: data.rows.filter((r: AgentAccount) => r.agentId === agentId) as AgentAccount[],
    history: data.history
  }
}
export function accountRolesFor(account?: AgentAccount) {
  return account?.status === '啟用' && agentRoleCodes[account.role]
    ? ['R_AGENT', agentRoleCodes[account.role]]
    : []
}
export function findLoginAccount(storage: Storage, login: string) {
  const keys = new Set(['A00001'])
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key?.startsWith('ggap-agent-accounts-v1:'))
      keys.add(key.slice('ggap-agent-accounts-v1:'.length))
  }
  const matches = [...keys]
    .flatMap((id) => loadAgentAccounts(storage, id).rows)
    .filter(
      (r) =>
        r.account.toLowerCase() === login.toLowerCase() ||
        (login === 'agent' && r.id === 'A00001:owner')
    )
  return matches.length === 1 ? matches[0] : undefined
}
