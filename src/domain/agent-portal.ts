import { permitsAgent } from './agent-access'
import type {
  AgentRecord,
  MerchantRecord,
  AgentCommercialTerm,
  MerchantCommercialTerm
} from '../types/game-provider'

export interface PortalActor {
  roles: string[]
  agentId?: string
  name: string
}
export type RateTarget = { kind: 'agent' | 'merchant'; id: string }
export interface PortalRateVersion extends RateTarget {
  version: number
  rate: string
  effectiveFrom: string
  basis: string
  currency: string
  cycle: string
  actorId: string
  createdBy: string
  createdAt: string
  timezone: string
}
export interface PortalSource {
  agents: AgentRecord[]
  merchants: MerchantRecord[]
  commercialTerms: AgentCommercialTerm[]
  merchantCommercialTerms: MerchantCommercialTerm[]
  portalRateVersions: PortalRateVersion[]
}
export function agentScope(source: PortalSource, actor: PortalActor) {
  const own =
    actor.roles.includes('R_AGENT') && actor.agentId
      ? source.agents.find((a) => a.id === actor.agentId && a.status === 'Active')
      : undefined
  const descendants = new Set<string>()
  const visited = new Set<string>(own ? [own.id] : [])
  const queue = own ? [own.id] : []
  for (let i = 0; i < queue.length; i++) {
    for (const a of source.agents.filter((a) => a.parentAgentId === queue[i])) {
      if (visited.has(a.id)) continue
      visited.add(a.id)
      descendants.add(a.id)
      queue.push(a.id)
    }
  }
  return {
    own,
    agents: source.agents.filter((a) => descendants.has(a.id)),
    merchants: own
      ? source.merchants.filter((m) => m.agentId === own.id || descendants.has(m.agentId))
      : []
  }
}
export function canEditRate(source: PortalSource, actor: PortalActor, target: RateTarget) {
  if (!permitsAgent(actor.roles, 'business')) return false
  if (!['agent', 'merchant'].includes(target.kind)) return false
  const scope = agentScope(source, actor)
  if (!scope.own) return false
  return target.kind === 'agent'
    ? scope.agents.some(
        (a) => a.id === target.id && a.parentAgentId === scope.own!.id && a.status === 'Active'
      )
    : scope.merchants.some(
        (m) => m.id === target.id && m.agentId === scope.own!.id && m.status === 'Active'
      )
}
/** Contract visibility is narrower than the operational descendant tree. */
export function canViewAgentTerms(source: PortalSource, actor: PortalActor, target: RateTarget) {
  const { own } = agentScope(source, actor)
  if (!own) return false
  return target.kind === 'agent'
    ? target.id === own.id ||
        source.agents.some((a) => a.id === target.id && a.parentAgentId === own.id)
    : source.merchants.some((m) => m.id === target.id && m.agentId === own.id)
}
export function rateTimeline(source: PortalSource, target: RateTarget) {
  const base =
    target.kind === 'agent'
      ? source.commercialTerms
          .filter(
            (t) => t.agentId === target.id && ['Active', 'Scheduled', 'Expired'].includes(t.status)
          )
          .map((t) => ({
            key: t.id,
            version: t.version,
            rate: String(t.ratePercent),
            effectiveFrom: t.effectiveFrom,
            basis: t.settlementBasis,
            currency: t.settlementCurrency,
            cycle: t.settlementCycle,
            until: t.effectiveTo
          }))
      : source.merchantCommercialTerms
          .filter(
            (t) =>
              t.merchantId === target.id && ['Active', 'Scheduled', 'Expired'].includes(t.status)
          )
          .map((t) => ({
            key: t.id,
            version: t.version,
            rate: String(t.merchantTermPercent),
            effectiveFrom: t.effectiveFrom,
            basis: t.settlementBasis,
            currency: t.settlementCurrency,
            cycle: t.settlementCycle,
            until: t.effectiveTo
          }))
  const overlay = source.portalRateVersions
    .filter((v) => v.kind === target.kind && v.id === target.id)
    .map((v) => ({
      ...v,
      key: `PORTAL-${v.kind}-${v.id}-${v.version}-${v.effectiveFrom}`,
      until: undefined as string | undefined
    }))
  return [...base, ...overlay].sort(
    (a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom) || a.version - b.version
  )
}
export function rateAt(source: PortalSource, target: RateTarget, date: string) {
  const latest = rateTimeline(source, target)
    .filter((v) => v.effectiveFrom <= date)
    .at(-1)
  return latest && (!latest.until || date < latest.until) ? latest : undefined
}
export const rateFingerprint = (source: PortalSource) =>
  JSON.stringify({
    agents: source.agents.map((a) => [a.id, a.parentAgentId, a.status]),
    merchants: source.merchants.map((m) => [m.id, m.agentId, m.status]),
    terms: source.commercialTerms,
    merchantTerms: source.merchantCommercialTerms,
    versions: source.portalRateVersions
  })
const units = (rate: string) => {
  if (!/^(0|[1-9]\d{0,2})(\.\d{1,6})?$/.test(rate))
    throw new Error('請輸入 0–100 的費率，最多六位小數；空白不等於 0')
  const [whole, fraction = ''] = rate.split('.')
  const value = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, '0'))
  if (value > 100000000n) throw new Error('費率不可超過 100%')
  return value
}
export function savePortalRate(
  source: PortalSource,
  actor: PortalActor,
  target: RateTarget,
  input: { rate: string; effectiveFrom: string; fingerprint: string },
  context: { today: string; timezone: string }
) {
  if (!canEditRate(source, actor, target))
    throw new Error('只能修改直屬且啟用的下一級代理或直屬商戶費率')
  if (input.fingerprint !== rateFingerprint(source))
    throw new Error('條件或歸屬已更新，請取消後重新開啟比對')
  const rate = input.rate.trim()
  units(rate)
  const parsed = new Date(`${input.effectiveFrom}T00:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== input.effectiveFrom
  )
    throw new Error('每次修改都必須填寫有效生效日期')
  if (!context.timezone || !context.today) throw new Error('平台時區未設定')
  if (input.effectiveFrom < context.today) throw new Error('原型不開放追溯生效或改寫歷史對帳單')
  const timeline = rateTimeline(source, target),
    last = timeline.at(-1)
  if (!last || input.effectiveFrom <= last.effectiveFrom)
    throw new Error('請指定晚於目前最後版本的生效日期，不覆蓋既有版本')
  const base = rateAt(source, target, input.effectiveFrom)
  if (!base) throw new Error('對象缺少已核准的計費基礎，不能自行建立或變更其他條件')
  const candidate: PortalRateVersion = {
    kind: target.kind,
    id: target.id,
    version:
      Math.max(
        ...timeline.map((v) => v.version),
        ...(target.kind === 'agent'
          ? source.commercialTerms.filter((t) => t.agentId === target.id)
          : source.merchantCommercialTerms.filter((t) => t.merchantId === target.id)
        ).map((t) => t.version)
      ) + 1,
    rate,
    effectiveFrom: input.effectiveFrom,
    basis: base.basis,
    currency: base.currency,
    cycle: base.cycle,
    actorId: actor.agentId!,
    createdBy: actor.name,
    createdAt: new Date().toISOString(),
    timezone: context.timezone
  }
  const next = { ...source, portalRateVersions: [...source.portalRateVersions, candidate] }
  const edges: { parent: RateTarget; child: RateTarget }[] = [
    { parent: { kind: 'agent', id: actor.agentId! }, child: target }
  ]
  if (target.kind === 'agent') {
    source.agents
      .filter((a) => a.parentAgentId === target.id && a.status === 'Active')
      .forEach((a) => edges.push({ parent: target, child: { kind: 'agent', id: a.id } }))
    source.merchants
      .filter((m) => m.agentId === target.id && m.status === 'Active')
      .forEach((m) => edges.push({ parent: target, child: { kind: 'merchant', id: m.id } }))
  }
  for (const edge of edges) {
    const points = new Set([
      input.effectiveFrom,
      ...[edge.parent, edge.child]
        .flatMap((t) =>
          rateTimeline(next, t).flatMap((v) => [v.effectiveFrom, ...(v.until ? [v.until] : [])])
        )
        .filter((d) => d >= input.effectiveFrom)
    ])
    for (const day of points) {
      const parent = rateAt(next, edge.parent, day),
        child = rateAt(next, edge.child, day)
      if (!parent || !child) throw new Error(`${day} 缺少上下級生效條件，請先由總後台核對`)
      if (parent.basis !== child.basis)
        throw new Error(`${day} 上下級計費基礎不同，不能直接比較費率；請由總後台核對`)
      if (units(child.rate) > units(parent.rate))
        throw new Error(
          `${day}：${edge.child.id} 費率不得高於上級 ${parent.rate}%；請檢查未來版本及直屬費率`
        )
    }
  }
  source.portalRateVersions.push(candidate)
  return candidate
}
