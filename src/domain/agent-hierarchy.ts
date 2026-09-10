import type { AgentRecord, AgentLevel } from '../types/game-provider'

export function newAgentLevel(agents: AgentRecord[], parentId?: string): AgentLevel {
  if (!parentId) return 'L1'
  const parent = agents.find((a) => a.id === parentId)
  if (!parent || parent.status !== 'Active') throw new Error('上級代理不存在或尚未啟用')
  if (parent.level === 'L1') return 'L2'
  if (parent.level === 'L2') return 'L3'
  throw new Error('代理最多三級，L3 不可建立下級代理')
}
