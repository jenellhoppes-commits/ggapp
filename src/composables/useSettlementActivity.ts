import { computed } from 'vue'
import { useTransactionCenterStore } from '@/store/modules/transactionCenter'
import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
import { useProviderDemoStore } from '@/store/modules/providerDemo'
import { useMemberCenterStore } from '@/store/modules/memberCenter'
import type { CostOwner } from '@/domain/admin-supplier-costs'
import type { StatementBet } from '@/domain/supplier-statements'
import { commercialGameType } from '@/domain/game-types'

/** Read the same records as the transaction center; never manufacture period activity. */
export function useSettlementActivity() {
  const transactions = useTransactionCenterStore(),
    business = useBusinessPartnerStore(),
    providers = useProviderDemoStore(),
    members = useMemberCenterStore()
  const rows = computed(() =>
    transactions.bets.map((b) => {
      const merchant = business.merchants.find((m) => m.id === b.merchantId)
      const line = merchant?.lines.find((l) => l.uid === b.lineUid)
      const game = providers.state.games.find((g) => g.id === b.gameId)
      const cents = (value: number) => {
        const amount = Math.round(value * 100)
        if (!Number.isSafeInteger(amount) || Math.abs(value * 100 - amount) > 0.000001)
          throw new Error('原始交易金額精度待確認')
        return amount
      }
      return {
        original: b,
        production:
          line?.environment === 'Production' &&
          !members.members.find((m) => m.id === b.memberId)?.tags.includes('Test'),
        providerId: game?.providerId,
        toBet: (): StatementBet => ({
          id: b.id,
          providerId: game?.providerId || '',
          currency: b.currency,
          time: b.betAt || b.time,
          game: b.gameName,
          gameType: commercialGameType(b.gameType) || 'UNCLASSIFIED',
          bet: cents(b.betAmount),
          valid: 0,
          validConfirmed: false,
          payout: cents(b.payoutAmount)
        })
      }
    })
  )
  function select(owner: CostOwner, ownerId: string, providerId?: string) {
    const descendants = new Set([ownerId])
    if (owner === 'agent') {
      for (let n = 0; n < business.agents.length; n++)
        for (const a of business.agents)
          if (a.parentAgentId && descendants.has(a.parentAgentId)) descendants.add(a.id)
    }
    return rows.value
      .filter(
        (r) =>
          r.production &&
          r.original.status === 'Settled' &&
          (owner === 'platform' ||
            (owner === 'merchant' && r.original.merchantId === ownerId) ||
            (owner === 'agent' && descendants.has(r.original.agentId))) &&
          (!providerId || r.providerId === providerId)
      )
      .map((r) => r.toBet())
  }
  return { rows, select }
}
