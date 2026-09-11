import type { MerchantRecord } from '../types/game-provider'
import type { SupplierCostVersion } from './admin-supplier-costs'

export interface MerchantActor {
  roles: string[]
  merchantId?: string
}

export function merchantProfile(merchants: MerchantRecord[], actor: MerchantActor) {
  if (!actor.roles.includes('R_MERCHANT') || !actor.merchantId) return undefined
  const row = merchants.find((m) => m.id === actor.merchantId)
  if (!row) return undefined
  // Explicit public projection: never expose agentTermPercent, notes or credentials.
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    agentName: row.agentName,
    contact: row.contact,
    email: row.email,
    status: row.status,
    settlementCurrency: row.settlementCurrency,
    settlementCycle: row.settlementCycle,
    collectionMode: row.collectionMode,
    cooperationStartDate: row.cooperationStartDate
  }
}

export function merchantConditions(
  merchants: MerchantRecord[],
  costs: SupplierCostVersion[],
  actor: MerchantActor,
  date: string
) {
  const merchant = merchantProfile(merchants, actor)
  if (!merchant) return []
  const own = costs.filter((r) => r.owner === 'merchant' && r.ownerId === merchant.id)
  const key = (r: SupplierCostVersion) =>
    JSON.stringify([r.providerId, r.gameType, r.scope === 'provider' ? '*' : r.transactionCurrency])
  return own
    .map((r) => {
      const complete =
        !!r.gameType && r.basis === 'GGR' && (r.scope === 'provider' || !!r.transactionCurrency)
      const latest = own
        .filter((v) => key(v) === key(r) && v.effectiveFrom <= date)
        .sort(
          (a, b) =>
            b.effectiveFrom.localeCompare(a.effectiveFrom) || b.createdAt.localeCompare(a.createdAt)
        )[0]
      return {
        id: r.id,
        providerId: r.providerId,
        gameType: r.gameType || '未設定',
        percent: r.payable,
        currency: r.currency,
        transactionCurrency:
          r.scope === 'provider' ? '供應商全部幣別線路' : r.transactionCurrency || '未設定',
        effectiveFrom: r.effectiveFrom,
        cycle: r.cycle,
        negativeGgr:
          r.negativeGgr === 'carry' ? '累積' : r.negativeGgr === 'zero' ? '清零' : '未設定',
        state: !complete
          ? '待補完整'
          : r.effectiveFrom > date
            ? '未來生效'
            : latest?.id === r.id
              ? '目前有效'
              : '歷史版本'
      }
    })
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))
}
