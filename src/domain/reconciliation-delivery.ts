export type ReconciliationDelivery = {
  id: string
  kind: 'provider' | 'agent' | 'merchant'
  party: string
  period: string
  currency: string
  system: number
  difference: number
  opening: number
  due: number
  paid: number
  carry: number
  sources: string[]
  reason: string
  operator: string
  time: string
  source?: Record<string, unknown>
  collectionMode?: 'AgentCollect' | 'PlatformCollect'
  recipient?: string
}
export const RECONCILIATION_DELIVERY_KEY = 'ggap-reconciliation-delivery-v1'
const micro = (n: number) => {
  const v = Math.round(n * 1e6)
  if (!Number.isFinite(n) || !Number.isSafeInteger(v)) throw new Error('金額無效或超出安全範圍')
  return v
}
export function prepareReconciliationDelivery(
  history: ReconciliationDelivery[],
  target: Omit<ReconciliationDelivery, 'opening' | 'due' | 'carry' | 'sources' | 'time'>,
  defer: boolean
): ReconciliationDelivery {
  if (history.some((d) => d.id === target.id)) throw new Error('本單已交付鎖定，不可重複')
  if (!Number.isSafeInteger(target.paid) || target.paid < 0)
    throw new Error('實收／實付只能輸入非負整數')
  if ((target.difference !== 0 || defer) && !target.reason.trim())
    throw new Error('差異或結轉必須填寫原因')
  const related = history.filter(
    (d) => d.kind === target.kind && d.party === target.party && d.currency === target.currency
  )
  if (related.some((d) => d.period > target.period)) throw new Error('已有較晚帳期交付，不能倒填')
  const consumed = new Set(history.flatMap((d) => d.sources))
  const previous = related.filter(
    (d) => d.period < target.period && d.carry !== 0 && !consumed.has(d.id)
  )
  const opening = Number(previous.reduce((v, d) => v + BigInt(micro(d.carry)), 0n))
  if (!Number.isSafeInteger(opening)) throw new Error('結轉金額超出安全範圍')
  const sum = Number(
    BigInt(micro(target.system)) + BigInt(micro(target.difference)) + BigInt(opening)
  )
  if (!Number.isSafeInteger(sum)) throw new Error('應結金額超出安全範圍')
  if (sum < 0) throw new Error('負值須依負 GGR 政策處理，不可作為實收付')
  const due = Math.trunc(sum / 1e6)
  micro(due)
  if (due < 0) throw new Error('負值須先確認原單負 GGR 政策與扣抵餘額，不能當作實收付')
  if (micro(target.paid) > micro(due)) throw new Error('實收／實付不可超過調整後應結')
  const remaining = (micro(due) - micro(target.paid)) / 1e6
  if (remaining && !defer) throw new Error('剩餘未收付請選擇累積至下期，或調整差異後收清')
  return {
    ...target,
    opening: opening / 1e6,
    due,
    carry: remaining,
    sources: previous.map((d) => d.id),
    time: new Date().toISOString()
  }
}
