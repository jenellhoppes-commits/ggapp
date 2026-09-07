import type {
  BetCenterRecord,
  TransactionCenterRecord,
  MemberRecord,
  MerchantRecord
} from '../types/game-provider'
export type MerchantQueryKind = 'bets' | 'transactions' | 'members'
export interface MerchantQueryRow {
  id: string
  memberId: string
  currency: string
  lineUid: string
  status: string
  time: string
  amount: number
  relatedId: string
  description: string
}
export function merchantQueryRows(
  source: {
    merchants: MerchantRecord[]
    bets: BetCenterRecord[]
    transactions: TransactionCenterRecord[]
    members: MemberRecord[]
  },
  actor: { roles: string[]; merchantId?: string },
  kind: MerchantQueryKind
): MerchantQueryRow[] {
  if (
    !actor.roles.includes('R_MERCHANT') ||
    !actor.merchantId ||
    !source.merchants.some((m) => m.id === actor.merchantId)
  )
    return []
  const own = <T extends { merchantId: string }>(items: T[]) =>
    items.filter((r) => r.merchantId === actor.merchantId)
  // Explicit projections: no supplier cost, risk notes, raw provider payload or upstream conditions.
  if (kind === 'bets')
    return own(source.bets).map((b) => ({
      id: b.id,
      memberId: b.memberId,
      currency: b.currency,
      lineUid: b.lineUid,
      status: b.status,
      time: b.time,
      amount: b.betAmount,
      relatedId: b.roundId,
      description: b.gameName
    }))
  if (kind === 'transactions')
    return own(source.transactions).map((t) => ({
      id: t.id,
      memberId: t.memberId,
      currency: t.currency,
      lineUid: t.lineUid,
      status: t.status,
      time: t.time,
      amount: t.amount,
      relatedId: t.betId || t.roundId || '',
      description: t.type
    }))
  if (kind === 'members')
    return own(source.members).map((m) => ({
      id: m.id,
      memberId: m.externalId,
      currency: m.currency,
      lineUid: m.lineUid,
      status: m.merchantStatus,
      time: m.wallet.updatedAt,
      amount: m.wallet.balance,
      relatedId: '',
      description: m.walletMode
    }))
  return []
}
