import type { DemoState } from './provider-demo'
import type { MerchantRecord } from '../types/game-provider'
import { gameAvailabilityError } from './game-availability'
import { supplierCostAt, type SupplierCostVersion } from './admin-supplier-costs'
import { commercialGameType } from './game-types'

/** Prototype gate only. A production launch must repeat these checks on the backend. */
export function resolveMerchantGameGrant(
  state: DemoState,
  merchant: MerchantRecord,
  lineUid: string,
  gameId: string,
  costs: SupplierCostVersion[],
  date: string
) {
  if (merchant.status !== 'Active') throw new Error('商戶尚未啟用')
  const line = merchant.lines.find((l) => l.uid === lineUid)
  if (!line || !['Active', 'Testing'].includes(line.status)) throw new Error('商戶線路未啟用')
  if (
    !line.environments.some(
      (e) => e.environment === 'Sandbox' && ['Active', 'Testing'].includes(e.status)
    )
  )
    throw new Error('沒有可用測試環境；原型不開放正式 API')
  const game = state.games.find((g) => g.id === gameId)
  if (!game) throw new Error('遊戲不存在')
  if (!commercialGameType(game.type)) throw new Error('遊戲類型尚未確認，不能套用其他類型授權')
  const provider = state.providers.find((p) => p.id === game.providerId)
  const candidates =
    provider?.lines.filter(
      (l) =>
        l.currency === line.currency &&
        !gameAvailabilityError(state, game, l.id) &&
        l.config?.wallet === merchant.walletMode
    ) || []
  if (!candidates.length) throw new Error('沒有同幣別、環境及錢包相容的供應商接入')
  if (candidates.length !== 1) throw new Error('有多條供應商接入，須先明確指定路由，不能自動猜測')
  const term = supplierCostAt(
    costs,
    'merchant',
    merchant.id,
    game.providerId,
    date,
    line.currency,
    commercialGameType(game.type)
  )
  const upstream = supplierCostAt(
    costs,
    'agent',
    merchant.agentId,
    game.providerId,
    date,
    line.currency,
    commercialGameType(game.type)
  )
  if (!term || !upstream || term.parentId !== merchant.agentId || !term.upstreamId)
    throw new Error('缺少該供應商與交易幣別的有效上下游條件')
  if (
    term.basis !== upstream.basis ||
    (term.scope !== 'provider' &&
      (term.currency !== upstream.currency || term.cycle !== upstream.cycle)) ||
    Number(term.payable) < Number(upstream.payable)
  )
    throw new Error('上下游條件不相容或低於成本')
  return { providerConnectionId: candidates[0].id, supplierCostVersionId: term.id }
}
