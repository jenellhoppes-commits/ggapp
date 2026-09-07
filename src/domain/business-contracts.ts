import { rateAt, type PortalSource, type RateTarget } from './agent-portal'
import type { AgentCommercialTerm, MerchantCommercialTerm } from '../types/game-provider'

/** Shared read model. Raw drafts stay editable; effective versions are derived, never rewritten. */
export function contractHistory(source: PortalSource, target: RateTarget, date: string) {
  const originals =
    target.kind === 'agent'
      ? source.commercialTerms.filter((t) => t.agentId === target.id)
      : source.merchantCommercialTerms.filter((t) => t.merchantId === target.id)
  const versions = source.portalRateVersions.filter(
    (v) => v.kind === target.kind && v.id === target.id
  )
  const projected = versions
    .map((v) => {
      const base = [...originals]
        .filter(
          (t) =>
            t.effectiveFrom <= v.effectiveFrom && t.status !== 'Draft' && t.status !== 'Disabled'
        )
        .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom) || a.version - b.version)
        .at(-1)
      if (!base) return undefined
      return {
        ...base,
        id: `PORTAL-${v.kind}-${v.id}-${v.version}-${v.effectiveFrom}`,
        version: v.version,
        ...(target.kind === 'agent'
          ? { ratePercent: Number(v.rate) }
          : { merchantTermPercent: Number(v.rate) }),
        settlementBasis: v.basis as AgentCommercialTerm['settlementBasis'],
        settlementCurrency: v.currency,
        settlementCycle: v.cycle as AgentCommercialTerm['settlementCycle'],
        effectiveFrom: v.effectiveFrom,
        effectiveTo: undefined,
        status: 'Scheduled' as const,
        reason: `代理 ${v.actorId} 調整費率（免審核）`,
        createdBy: v.createdBy,
        createdAt: v.createdAt
      }
    })
    .filter((v): v is NonNullable<typeof v> => !!v)
  const current = rateAt(source, target, date)
  return [...originals, ...projected]
    .map((t) => {
      if (t.status === 'Draft' || t.status === 'Disabled') return t
      const status: AgentCommercialTerm['status'] =
        t.effectiveFrom > date ? 'Scheduled' : t.id === current?.key ? 'Active' : 'Expired'
      return { ...t, status }
    })
    .sort((a, b) => b.version - a.version || b.effectiveFrom.localeCompare(a.effectiveFrom))
}
export const agentContractHistory = (source: PortalSource, id: string, date: string) =>
  contractHistory(source, { kind: 'agent', id }, date) as AgentCommercialTerm[]
export const merchantContractHistory = (source: PortalSource, id: string, date: string) =>
  contractHistory(source, { kind: 'merchant', id }, date) as MerchantCommercialTerm[]
