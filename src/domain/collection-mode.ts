import { permitsAgent } from './agent-access'
export type CollectionMode = 'AgentCollect' | 'PlatformCollect'
export interface CollectionVersion {
  merchantId: string
  mode: CollectionMode
  effectiveFrom: string
  version: number
  reason: string
  actor: string
  createdAt: string
}
export function collectionModeAt(
  versions: CollectionVersion[],
  merchantId: string,
  date: string,
  initial: CollectionMode = 'AgentCollect'
) {
  return (
    [...versions]
      .filter((v) => v.merchantId === merchantId && v.effectiveFrom <= date)
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.version - a.version)[0]
      ?.mode || initial
  )
}
export function mayDeliver(
  roles: string[],
  actorAgentId: string | undefined,
  kind: string,
  ownerAgentId: string | undefined,
  mode: CollectionMode
) {
  if (roles.some((role) => ['R_SUPER', 'R_ADMIN'].includes(role))) return true
  return (
    kind === 'merchant' &&
    permitsAgent(roles, 'delivery') &&
    !!ownerAgentId &&
    actorAgentId === ownerAgentId &&
    mode === 'AgentCollect'
  )
}
