import { gameRecords, providerMockData } from '../mock/game-provider'
import type { DemoState, DemoGame } from './provider-demo'
import { canManageProviders, type CoreActor } from './provider-core'
import { gameTypes } from './game-types'
export { gameTypes } from './game-types'

export type SyncScenario = 'success' | 'partial' | 'failed'
export interface GameSyncRun {
  id: string
  providerId: string
  status: 'running' | SyncScenario
  startedAt: string
  finishedAt?: string
  added: number
  updated: number
  unavailable: number
  failed: number
  events: { gameId?: string; code: string; message: string }[]
}
export const syncLabels = {
  running: '同步中',
  success: '成功',
  partial: '部分失敗',
  failed: '失敗'
}
export function ensureGameCatalog(state: DemoState) {
  state.syncRuns ??= []
  for (const g of state.games) {
    g.version ??= 1
    g.sourceName ??=
      gameRecords.find((fixture) => fixture.code === g.code)?.displayName || '尚未同步'
    g.sourceAvailable ??= true
    g.typeOverridden ??= !!g.type && g.type !== '未分類'
    g.type ??=
      state.providers.find((p) => p.id === g.providerId)?.profile?.defaultGameType || '未分類'
  }
}
function authorized(actor: CoreActor) {
  if (!canManageProviders(actor)) throw new Error('沒有遊戲管理權限')
}
export function saveGameDisplay(
  state: DemoState,
  id: string,
  edit: Pick<DemoGame, 'name' | 'tags' | 'active'> & { type?: string; status?: DemoGame['status'] },
  expected: number,
  actor: CoreActor
) {
  authorized(actor)
  if (edit.status !== undefined && !['active', 'disabled', 'integrating'].includes(edit.status))
    throw new Error('請選擇有效遊戲狀態')
  const g = state.games.find((g) => g.id === id)
  if (!g) throw new Error('遊戲不存在')
  if (g.version !== expected) throw new Error('版本衝突：資料已更新，請保留輸入並重新載入比對')
  if (
    !edit.name.trim() ||
    edit.name.trim().length > 80 ||
    edit.tags.length > 8 ||
    edit.tags.some((t) => !t.trim() || t.length > 20)
  )
    throw new Error('名稱須為 1–80 字；標籤最多 8 個，每個 1–20 字')
  if (edit.type !== undefined && edit.type !== '__inherit' && !gameTypes.includes(edit.type))
    throw new Error('請選擇有效遊戲類型')
  g.name = edit.name.trim()
  if (edit.type !== undefined) {
    g.typeOverridden = edit.type !== '__inherit'
    g.type = g.typeOverridden
      ? edit.type
      : state.providers.find((p) => p.id === g.providerId)?.profile?.defaultGameType || '未分類'
  }
  g.tags = [...new Set(edit.tags.map((t) => t.trim()))]
  g.status = edit.status ?? (edit.active ? 'active' : 'disabled')
  g.active = g.status === 'active'
  g.version++
  state.audit.unshift({
    at: new Date().toISOString(),
    providerId: g.providerId,
    action: `更新遊戲顯示資料：${g.id}（停用只阻擋新啟動）`,
    actor: actor.name
  })
}
export function startGameSync(state: DemoState, providerId: string, actor: CoreActor) {
  authorized(actor)
  ensureGameCatalog(state)
  if (!providerMockData.some((p) => p.id === providerId))
    throw new Error('此供應商沒有固定模擬同步契約')
  // Recover an interrupted local mock job without modifying any catalog record.
  for (const previous of state.syncRuns!) {
    if (
      previous.providerId === providerId &&
      previous.status === 'running' &&
      Date.now() - Date.parse(previous.startedAt) > 30000
    ) {
      previous.status = 'failed'
      previous.finishedAt = new Date().toISOString()
      previous.failed++
      previous.events.push({
        code: 'MOCK_INTERRUPTED',
        message: '模擬工作已中斷或逾時；保留全部既有遊戲資料'
      })
    }
  }
  if (state.syncRuns!.some((r) => r.providerId === providerId && r.status === 'running'))
    throw new Error('此供應商正在同步，請勿重複提交')
  const run: GameSyncRun = {
    id: crypto.randomUUID(),
    providerId,
    status: 'running',
    startedAt: new Date().toISOString(),
    added: 0,
    updated: 0,
    unavailable: 0,
    failed: 0,
    events: []
  }
  state.syncRuns!.unshift(run)
  return run.id
}
export function finishGameSync(
  state: DemoState,
  id: string,
  scenario: SyncScenario,
  actor: CoreActor
) {
  authorized(actor)
  const run = state.syncRuns?.find((r) => r.id === id)
  if (!run || run.status !== 'running') throw new Error('同步工作已結束或不存在')
  const source = gameRecords
    .filter((_, i) => providerMockData[i % providerMockData.length].id === run.providerId)
    .map((g, i) => ({ code: g.code, name: g.displayName, available: i !== 1 }))
  source.push({
    code: `MOCK-${run.providerId}-NEW`,
    name: '新增示範遊戲（待上架）',
    available: true
  })
  const now = new Date().toISOString()
  for (const [index, item] of source.entries()) {
    if (scenario === 'failed' || (scenario === 'partial' && index > 0)) {
      run.failed++
      run.events.push({ code: item.code, message: '模擬取得失敗；保留既有狀態' })
      continue
    }
    let game = state.games.find((g) => g.providerId === run.providerId && g.code === item.code)
    if (!game) {
      game = {
        id: crypto.randomUUID(),
        providerId: run.providerId,
        code: item.code,
        name: item.name,
        active: false,
        status: 'integrating',
        demoSupported: true,
        currencies: ['TWD', 'USD'],
        locales: ['zh-TW', 'en-US'],
        tags: [],
        typeOverridden: false,
        version: 1
      }
      state.games.push(game)
      run.added++
    } else {
      run.updated++
      game.version = (game.version || 1) + 1
    }
    // Source fields only: never change platform display name, publication or merchant grants.
    game.sourceName = item.name
    game.sourceAvailable = item.available
    if (!game.typeOverridden)
      game.type =
        state.providers.find((p) => p.id === run.providerId)?.profile?.defaultGameType ||
        game.type ||
        '未分類'
    game.syncedAt = now
    if (!item.available) run.unavailable++
    run.events.push({
      gameId: game.id,
      code: item.code,
      message: item.available
        ? '來源資料已更新；展示設定及授權保留'
        : '來源明確回報不可用；歷史保留'
    })
  }
  run.status = scenario
  run.finishedAt = now
  state.audit.unshift({
    at: now,
    providerId: run.providerId,
    action: `固定模擬同步 ${run.id}：${syncLabels[scenario]}`,
    actor: actor.name
  })
}
