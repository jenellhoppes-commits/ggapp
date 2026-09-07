import { gameRecords, providerMockData } from '../mock/game-provider'
import type { ProviderProfile, ProviderLine } from './provider-core'
import { ensureProviderCore } from './provider-core'
import { gameAvailabilityError, type MerchantAccess } from './game-availability'
import type { GameSyncRun } from './game-sync'

// These capabilities are fixtures, NOT verified supplier capabilities.
export type DemoMode = 'native' | 'sandbox'
export type DemoActor = { role: 'admin' | 'merchant' | 'denied'; name: string; merchantId?: string }
export interface DemoProvider {
  integration?: { currencies: string[]; wallets: string[] }
  profile?: ProviderProfile
  id: string
  name: string
  available: boolean
  mode?: DemoMode
  billingExcluded: boolean
  initialCredit: boolean
  terminateSession: boolean
  lines: ProviderLine[]
}
export interface DemoGame {
  version?: number
  sourceName?: string
  sourceAvailable?: boolean
  type?: string
  syncedAt?: string
  id: string
  providerId: string
  name: string
  code: string
  active: boolean
  demoSupported: boolean
  currencies: string[]
  locales: string[]
  tags: string[]
  rtp?: number
}
export interface DemoInput {
  name: string
  purpose: 'internal' | 'merchant'
  merchantId?: string
  providerId: string
  gameId: string
  lineId: string
  locale: string
  expiresAt: string
  maxStarts?: number
  initialCredit?: number
}
export interface DemoLink extends DemoInput {
  replacesId?: string
  replacedById?: string
  id: string
  token: string
  mode: DemoMode
  disabled: boolean
  starts: number
  createdBy: string
  createdAt: string
}
export interface DemoSession {
  id: string
  linkId: string
  gameId: string
  createdAt: string
  mode: DemoMode
  environment: 'demo'
  accounting: 'excluded'
}
export interface DemoState {
  merchants?: MerchantAccess[]
  syncRuns?: GameSyncRun[]
  providers: DemoProvider[]
  games: DemoGame[]
  links: DemoLink[]
  sessions: DemoSession[]
  audit: { at: string; providerId: string; action: string; actor: string }[]
}
export const modeLabel = (mode?: DemoMode) =>
  mode === 'native' ? '原生試玩' : mode === 'sandbox' ? '核准測試帳號' : '不支援試玩'

export function createDemoState(): DemoState {
  const state: DemoState = {
    providers: providerMockData.map((provider, index) => ({
      id: provider.id,
      name: provider.name,
      available: index !== 4,
      mode: index === 2 ? undefined : index === 1 ? 'sandbox' : 'native',
      billingExcluded: index !== 2,
      initialCredit: index === 1,
      terminateSession: false,
      lines: ['TWD', 'USD'].map((currency) => ({
        id: `${provider.id}-${currency}`,
        currency,
        available: true
      }))
    })),
    games: gameRecords.map((game, index) => ({
      id: game.id,
      providerId: providerMockData[index % providerMockData.length].id,
      name: game.displayName,
      code: game.code,
      active: game.status === 'Active',
      demoSupported: true,
      currencies: ['TWD', 'USD'],
      locales: index % 3 === 1 ? ['en-US'] : ['zh-TW', 'en-US'],
      tags: [],
      rtp: game.defaultRtp
    })),
    links: [],
    sessions: [],
    audit: []
  }
  ensureProviderCore(state)
  return state
}
export function visibleLinks(state: DemoState, actor: DemoActor) {
  if (actor.role === 'admin') return state.links
  if (actor.role === 'merchant' && actor.merchantId)
    return state.links.filter(
      (link) => link.purpose === 'merchant' && link.merchantId === actor.merchantId
    )
  return []
}
export function capabilityError(state: DemoState, input: DemoInput): string {
  const provider = state.providers.find((item) => item.id === input.providerId)
  const game = state.games.find((item) => item.id === input.gameId)
  const line = provider?.lines.find((item) => item.id === input.lineId)
  if (!provider || game?.providerId !== provider.id) return '供應商與遊戲不一致'
  const availability = gameAvailabilityError(state, game, input.lineId, input.merchantId)
  if (availability) return availability
  if (!provider.mode || !provider.billingExcluded) return '未核准試玩方式或尚未確認排除供應商計費'
  if (!game || game.providerId !== provider.id || !game.active || !game.demoSupported)
    return '遊戲未啟用或不支援試玩'
  if (!line?.available || !game.currencies.includes(line.currency))
    return '幣別線不可用或遊戲不支援該幣別'
  if (line.config && (line.config.environment !== 'sandbox' || line.config.status !== 'active'))
    return '此線路尚未開放測試啟動；正式設定不可用於演示試玩'
  if (!game.locales.includes(input.locale)) return '遊戲不支援此語系'
  if (input.purpose === 'merchant' && !input.merchantId) return '商戶試玩必須綁定商戶'
  if (
    input.initialCredit !== undefined &&
    (!provider.initialCredit || !Number.isFinite(input.initialCredit) || input.initialCredit <= 0)
  )
    return '供應商不支援此初始試玩額度'
  return ''
}
export function validateDemoInput(
  state: DemoState,
  input: DemoInput,
  actor: DemoActor,
  now = Date.now()
) {
  if (actor.role === 'denied') throw new Error('沒有建立試玩連結的權限')
  if (
    actor.role === 'merchant' &&
    (!actor.merchantId || input.merchantId !== actor.merchantId || input.purpose !== 'merchant')
  )
    throw new Error('商戶只能建立綁定自身的商戶試玩連結')
  if (!['internal', 'merchant'].includes(input.purpose)) throw new Error('用途無效')
  if (!input.name.trim() || input.name.trim().length > 80) throw new Error('請填寫 1 至 80 字名稱')
  if (!Number.isFinite(Date.parse(input.expiresAt)) || Date.parse(input.expiresAt) <= now)
    throw new Error('到期時間必須晚於現在')
  if (
    input.maxStarts !== undefined &&
    (!Number.isSafeInteger(input.maxStarts) || input.maxStarts < 1)
  )
    throw new Error('啟動次數上限必須為正整數')
  const error = capabilityError(state, input)
  if (error) throw new Error(error)
}
export function linkStatus(state: DemoState, link: DemoLink, now = Date.now()) {
  if (link.replacedById) return '已替換'
  if (link.disabled) return '已停用'
  if (!Number.isFinite(Date.parse(link.expiresAt)) || Date.parse(link.expiresAt) <= now)
    return '已到期'
  if (link.maxStarts !== undefined && link.starts >= link.maxStarts) return '次數已用盡'
  if (capabilityError(state, link)) return '不可用'
  return '有效'
}
function audit(state: DemoState, link: DemoLink, action: string, actor: string) {
  state.audit.unshift({
    at: new Date().toISOString(),
    providerId: link.providerId,
    action: `${action}：${link.name}`,
    actor
  })
}
export function createDemoLink(state: DemoState, input: DemoInput, actor: DemoActor): DemoLink {
  validateDemoInput(state, input, actor)
  const link: DemoLink = {
    name: input.name.trim(),
    purpose: input.purpose,
    merchantId: input.merchantId,
    providerId: input.providerId,
    gameId: input.gameId,
    lineId: input.lineId,
    locale: input.locale,
    expiresAt: input.expiresAt,
    maxStarts: input.maxStarts,
    initialCredit: input.initialCredit,
    id: crypto.randomUUID(),
    token: crypto.randomUUID(),
    mode: state.providers.find((item) => item.id === input.providerId)!.mode!,
    disabled: false,
    starts: 0,
    createdBy: actor.name,
    createdAt: new Date().toISOString()
  }
  state.links.unshift(link)
  audit(state, link, '建立模擬連結', actor.name)
  return link
}
export function manageDemoLink(
  state: DemoState,
  id: string,
  actor: DemoActor,
  action: 'disable' | 'regenerate',
  expiresAt?: string
) {
  const link = visibleLinks(state, actor).find((item) => item.id === id)
  if (!link) throw new Error('找不到連結或沒有操作權限')
  if (action === 'disable') link.disabled = true
  else {
    if (link.replacedById) throw new Error('此連結已替換，請從最新版本重新產生')
    const updated = { ...link, expiresAt: expiresAt || link.expiresAt }
    validateDemoInput(state, updated, actor)
    const replacement = createDemoLink(state, updated, actor)
    replacement.replacesId = link.id
    link.replacedById = replacement.id
    link.disabled = true
    audit(state, link, `重新產生連結（新版本 ${replacement.id}，原歷史保留）`, actor.name)
    return replacement
  }
  audit(
    state,
    link,
    action === 'disable' ? '停用連結（僅禁止新啟動）' : '重新產生連結（舊連結失效）',
    actor.name
  )
  return link
}
export function launchDemo(state: DemoState, token: string, simulateFailure = false): DemoSession {
  const link = state.links.find((item) => item.token === token)
  if (!link) throw new Error('連結不存在、已重新產生，或不屬於此瀏覽器的演示資料')
  const status = linkStatus(state, link)
  if (status !== '有效') throw new Error(`無法啟動：${status}`)
  if (simulateFailure) throw new Error('模擬供應商啟動失敗；未計入成功次數')
  const session: DemoSession = {
    id: crypto.randomUUID(),
    linkId: link.id,
    gameId: link.gameId,
    createdAt: new Date().toISOString(),
    mode: link.mode,
    environment: 'demo',
    accounting: 'excluded'
  }
  state.sessions.unshift(session)
  const line = state.providers
    .find((p) => p.id === link.providerId)
    ?.lines.find((l) => l.id === link.lineId)
  if (line?.config) line.config.used = true
  link.starts += 1
  audit(state, link, '建立獨立模擬試玩連線', '演示啟動器')
  return session
}
