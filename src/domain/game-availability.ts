import type { DemoState, DemoGame, DemoProvider } from './provider-demo'
import type { ProviderLine } from './provider-core'
import { activationChecks } from './provider-core'
import type {
  MerchantRecord,
  MerchantGameConfiguration,
  MerchantLineGameConfiguration
} from '../types/game-provider'

// A sanitized projection of the existing business store, never an independent grant list.
export interface MerchantAccess {
  id: string
  name: string
  active: boolean
  wallet: string
  lines: { id: string; currency: string; active: boolean; sandbox: boolean; games: string[] }[]
}
export function projectMerchantAccess(
  merchants: MerchantRecord[],
  games: MerchantGameConfiguration[],
  lines: Record<string, MerchantLineGameConfiguration[]>
): MerchantAccess[] {
  return merchants.map((m) => ({
    id: m.id,
    name: m.name,
    active: m.status === 'Active',
    wallet: m.walletMode,
    lines: m.lines.map((l) => ({
      id: l.uid,
      currency: l.currency,
      active: ['Active', 'Testing'].includes(l.status),
      sandbox: l.environments.some(
        (e) => e.environment === 'Sandbox' && ['Active', 'Testing'].includes(e.status)
      ),
      games: (lines[l.uid] || [])
        .filter(
          (g) =>
            g.enabled &&
            games.some((mg) => mg.merchantId === m.id && mg.gameId === g.gameId && mg.enabled)
        )
        .map((g) => g.gameId)
    }))
  }))
}
export function generalLineError(
  p: DemoProvider | undefined,
  line: ProviderLine | undefined,
  state?: DemoState
) {
  if (!p?.available || (p.profile && p.profile.status !== 'active')) return '供應商目前不可用'
  if (!line?.available || line.config?.status !== 'active') return '供應商線路未啟用'
  if (line.config.environment !== 'sandbox') return '正式設定不可用於前端演示'
  const ability = p.integration
  if (
    !ability ||
    !ability.currencies.includes(line.currency) ||
    !ability.wallets.includes(line.config.wallet) ||
    line.config.scale !== 2 ||
    line.config.minUnit !== '0.01'
  )
    return '未知或不相容的線路能力'
  if (state) {
    const failed = activationChecks(state, p, line).filter((check) => !check.passed)
    if (failed.length) return failed.map((check) => check.label).join('；')
  }
  return ''
}
export function gameAvailabilityError(
  state: DemoState,
  game: DemoGame | undefined,
  lineId: string,
  merchantId?: string
) {
  if (!game) return '遊戲不存在'
  const p = state.providers.find((p) => p.id === game.providerId)
  const line = p?.lines.find((l) => l.id === lineId)
  const error = generalLineError(p, line, state)
  if (error) return error
  if (!game.active || game.sourceAvailable === false) return '遊戲未上架或供應商已明確標示不可用'
  if (!game.currencies.includes(line!.currency)) return '遊戲不支援此幣別'
  if (!merchantId) return ''
  const m = state.merchants?.find((m) => m.id === merchantId)
  if (!m?.active) return '商戶不存在或未啟用'
  const candidates = m.lines.filter((l) => l.currency === line!.currency)
  if (!candidates.length) return '商戶沒有同幣別線路'
  if (!candidates.some((l) => l.active && l.sandbox)) return '商戶線路或測試環境未啟用'
  if (!candidates.some((l) => l.active && l.sandbox && l.games.includes(game.id)))
    return '商戶線路未明確授權此遊戲'
  if (m.wallet !== line!.config!.wallet) return '商戶錢包與供應商線路不相容'
  return ''
}
