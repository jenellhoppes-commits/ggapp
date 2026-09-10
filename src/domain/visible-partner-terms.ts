import type { SupplierCostVersion } from './admin-supplier-costs'

/** Presentation projection only; production APIs must enforce the same policy server-side. */
export function visiblePartnerTerms(
  rows: SupplierCostVersion[],
  actor: {
    roles: string[]
    agentId?: string
    merchantId?: string
  }
) {
  if (actor.roles.some((r) => ['R_ADMIN', 'R_SUPER'].includes(r))) return rows
  return rows
    .filter(
      (r) =>
        (actor.roles.includes('R_AGENT') &&
          !!actor.agentId &&
          ((r.owner === 'agent' && r.ownerId === actor.agentId) ||
            (r.owner !== 'platform' && r.parentId === actor.agentId))) ||
        (actor.roles.includes('R_MERCHANT') &&
          !!actor.merchantId &&
          r.owner === 'merchant' &&
          r.ownerId === actor.merchantId)
    )
    .map((r) => {
      // Never return the parent's purchase cost/version with one's own contract.
      if (
        (r.owner === 'agent' && r.ownerId === actor.agentId) ||
        (r.owner === 'merchant' && r.ownerId === actor.merchantId)
      ) {
        const own = { ...r }
        delete own.upstreamCost
        delete own.upstreamId
        return own
      }
      return r
    })
}
