import type { DemoProvider, DemoState } from './provider-demo'
import { providerMockData } from '../mock/game-provider'

export type LineStatus = 'draft' | 'testing' | 'active' | 'maintenance' | 'disabled'
export type Environment = 'sandbox' | 'production'
export type Wallet = 'Seamless' | 'Transfer'
export interface ProviderProfile {
  code: string
  contact: string
  note: string
  status: 'active' | 'maintenance' | 'disabled'
  version: number
  updatedAt: string
}
export interface LineConfig {
  environment: Environment
  accountId: string
  currencyId: string
  apiUrl: string
  wallet: Wallet
  scale: number
  minUnit: string
  status: LineStatus
  credential?: { id: string; mask: string; updatedAt: string }
  check?: { result: 'passed' | 'failed'; at: string; traceId: string; message: string }
  version: number
  used: boolean
  updatedAt: string
}
export interface ProviderLine {
  id: string
  currency: string
  available: boolean
  config?: LineConfig
}
export interface CoreActor {
  roles: string[]
  name: string
}
export const lineLabels: Record<LineStatus, string> = {
  draft: '待設定',
  testing: '測試中',
  active: '啟用',
  maintenance: '維護',
  disabled: '停用'
}
export const providerLabels = { active: '啟用', maintenance: '維護', disabled: '停用' }
export const environmentLabels = { sandbox: '測試環境', production: '正式設定（未串接）' }
// Fixture dictionary only; production comes from the platform currency API.
export const coreCurrencies = ['TWD', 'USD', 'USDT', 'PHP', 'JPY']
export const canManageProviders = (actor: CoreActor) =>
  actor.roles.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r))
const authorize = (actor: CoreActor) => {
  if (!canManageProviders(actor)) throw new Error('沒有供應商設定權限')
}
const now = () => new Date().toISOString()
const conflict = (actual: number, expected: number) => {
  if (actual !== expected) throw new Error('版本衝突：資料已變更，請保留輸入並重新載入比對')
}
function log(state: DemoState, providerId: string, action: string, actor: CoreActor) {
  state.audit.unshift({ at: now(), providerId, action, actor: actor.name })
}
export const blankLine = (): LineConfig => ({
  environment: 'sandbox',
  accountId: '',
  currencyId: '',
  apiUrl: '',
  wallet: 'Seamless',
  scale: 2,
  minUnit: '0.01',
  status: 'draft',
  version: 1,
  used: false,
  updatedAt: now()
})
/** Add metadata without changing IDs, existing links, sessions or fixture availability. */
export function ensureProviderCore(state: DemoState) {
  for (const p of state.providers) {
    // Only the known mock adapter has this general capability. Demo support is unrelated.
    if (providerMockData.some((fixture) => fixture.id === p.id))
      p.integration ??= { currencies: ['TWD', 'USD'], wallets: ['Seamless'] }
    p.profile ??= {
      code: p.id,
      contact: '',
      note: '',
      status: p.available ? 'active' : 'maintenance',
      version: 1,
      updatedAt: '2026-09-04T00:00:00.000Z'
    }
    for (const line of p.lines) {
      line.config ??= {
        ...blankLine(),
        accountId: `DEMO-${p.id}`,
        currencyId: line.currency,
        apiUrl: 'https://provider.example.invalid/api',
        status: line.available ? 'active' : 'disabled',
        credential: {
          id: `DEMO-CRED-${line.id}`,
          mask: '示範識別，無真實密鑰',
          updatedAt: '2026-09-04T00:00:00.000Z'
        },
        check: {
          result: 'passed',
          at: '2026-09-04T00:00:00.000Z',
          traceId: `FIXTURE-${line.id}`,
          message: '既有測試線種子情境，非實際連線測試'
        },
        used: state.links.some(
          (link) => link.lineId === line.id && state.sessions.some((s) => s.linkId === link.id)
        )
      }
    }
  }
}
function provider(state: DemoState, id: string) {
  const p = state.providers.find((p) => p.id === id)
  if (!p?.profile) throw new Error('供應商不存在')
  return p as DemoProvider & { profile: ProviderProfile }
}
function lineOf(state: DemoState, id: string, lineId: string) {
  const p = provider(state, id)
  const line = p.lines.find((l) => l.id === lineId)
  if (!line?.config) throw new Error('幣別線不存在')
  return { p, line: line as ProviderLine & { config: LineConfig } }
}
export function saveProvider(
  state: DemoState,
  id: string | undefined,
  input: { code: string; name: string; contact: string; note: string },
  expected: number,
  actor: CoreActor
) {
  authorize(actor)
  const code = input.code.trim().toUpperCase()
  if (!/^[A-Z0-9_-]{2,32}$/.test(code)) throw new Error('代碼須為 2–32 位英數字、底線或連字號')
  if (!input.name.trim() || input.name.trim().length > 80) throw new Error('名稱必填，最多 80 字')
  if (input.contact.length > 160 || input.note.length > 500)
    throw new Error('聯絡資訊最多 160 字，備註最多 500 字')
  if (state.providers.some((p) => p.id !== id && p.profile?.code.toUpperCase() === code))
    throw new Error('供應商代碼已存在')
  let p: DemoProvider
  if (id) {
    p = provider(state, id)
    conflict(p.profile!.version, expected)
    if (p.profile!.code !== code) throw new Error('建立後不可修改供應商代碼')
  } else {
    const next = Math.max(0, ...state.providers.map((p) => Number(p.id.slice(2)) || 0)) + 1
    p = {
      id: `PV${String(next).padStart(5, '0')}`,
      name: '',
      available: false,
      billingExcluded: false,
      initialCredit: false,
      terminateSession: false,
      lines: []
    }
    state.providers.push(p)
  }
  p.name = input.name.trim()
  p.profile = {
    code,
    contact: input.contact.trim(),
    note: input.note.trim(),
    status: p.profile?.status || 'disabled',
    version: (p.profile?.version || 0) + 1,
    updatedAt: now()
  }
  log(state, p.id, id ? '更新供應商基本資料' : '新增供應商草稿（尚未核准任何能力）', actor)
  return p
}
export function changeProviderStatus(
  state: DemoState,
  id: string,
  status: ProviderProfile['status'],
  expected: number,
  reason: string,
  actor: CoreActor
) {
  authorize(actor)
  if (!reason.trim()) throw new Error('請填寫操作原因')
  const p = provider(state, id)
  conflict(p.profile.version, expected)
  if (status === 'active' && !p.lines.some((l) => l.available && l.config?.status === 'active'))
    throw new Error('尚無啟用線路，請先完成線路檢核')
  p.profile.status = status
  p.available = status === 'active'
  p.profile.version++
  p.profile.updatedAt = now()
  log(
    state,
    id,
    `供應商${providerLabels[status]}：${reason.trim()}；僅影響新啟動，不刪除歷史事件`,
    actor
  )
}
export type LineInput = Pick<
  LineConfig,
  'environment' | 'accountId' | 'currencyId' | 'apiUrl' | 'wallet' | 'scale' | 'minUnit'
> & { currency: string }
export function lineErrors(input: LineInput) {
  const errors: string[] = []
  if (!coreCurrencies.includes(input.currency)) errors.push('請選擇平台幣別')
  if (!['sandbox', 'production'].includes(input.environment)) errors.push('請選擇環境')
  if (!['Seamless', 'Transfer'].includes(input.wallet)) errors.push('請選擇錢包模式')
  if (!input.accountId.trim() || !input.currencyId.trim()) errors.push('供應商帳號與幣別識別必填')
  try {
    const u = new URL(input.apiUrl)
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash) throw new Error()
  } catch {
    errors.push('請填 HTTPS API URL，不含帳密、查詢或片段參數')
  }
  if (!Number.isInteger(input.scale) || input.scale < 0 || input.scale > 8)
    errors.push('演示精度須為 0–8 位整數')
  if (
    !/^\d+(\.\d+)?$/.test(input.minUnit) ||
    !/[1-9]/.test(input.minUnit) ||
    (input.minUnit.split('.')[1]?.length || 0) > input.scale
  )
    errors.push('最小單位須為正十進位字串，且不超過精度')
  return errors
}
export function saveLine(
  state: DemoState,
  id: string,
  lineId: string | undefined,
  input: LineInput,
  expected: number,
  actor: CoreActor
) {
  authorize(actor)
  const p = provider(state, id)
  const errors = lineErrors(input)
  if (errors.length) throw new Error(errors.join('；'))
  const previous = lineId ? lineOf(state, id, lineId).line : undefined
  if (previous) {
    conflict(previous.config.version, expected)
    if (
      (previous.config.used || state.links.some((l) => l.lineId === lineId)) &&
      (previous.currency !== input.currency ||
        previous.config.environment !== input.environment ||
        previous.config.wallet !== input.wallet)
    )
      throw new Error('已被使用或綁定的線路不能修改幣別、環境或錢包模式，請另建線路')
  }
  if (
    p.lines.some(
      (l) =>
        l.id !== lineId &&
        l.currency === input.currency &&
        l.config?.environment === input.environment
    )
  )
    throw new Error('此供應商、幣別與環境已有線路；重複帳號政策待 D08，不自動選線')
  const line: ProviderLine = previous || {
    id: `PL-${crypto.randomUUID()}`,
    currency: input.currency,
    available: false
  }
  line.currency = input.currency
  line.available = false
  // Whitelist configuration fields: never accept credentials or status from a form DTO.
  line.config = {
    ...blankLine(),
    environment: input.environment,
    accountId: input.accountId.trim(),
    currencyId: input.currencyId.trim(),
    apiUrl: input.apiUrl.trim(),
    wallet: input.wallet,
    scale: input.scale,
    minUnit: input.minUnit,
    credential: previous?.config.credential,
    used: previous?.config.used || false,
    version: (previous?.config.version || 0) + 1
  }
  if (!previous) p.lines.push(line)
  log(state, id, `儲存線路 ${line.id}；設定改變，清除舊測試結果並停止新啟動`, actor)
  return line
}
export function resetDemoCredential(
  state: DemoState,
  id: string,
  lineId: string,
  expected: number,
  reason: string,
  actor: CoreActor
) {
  authorize(actor)
  if (!reason.trim()) throw new Error('請填寫重設原因')
  const { line } = lineOf(state, id, lineId)
  conflict(line.config.version, expected)
  line.config.credential = {
    id: `DEMO-CRED-${crypto.randomUUID()}`,
    mask: '示範識別，無真實密鑰',
    updatedAt: now()
  }
  line.config.check = undefined
  line.config.status = 'draft'
  line.available = false
  line.config.version++
  line.config.updatedAt = now()
  log(state, id, `重設線路 ${lineId} 的示範憑證識別：${reason.trim()}；舊測試失效`, actor)
}
export function testLine(
  state: DemoState,
  id: string,
  lineId: string,
  expected: number,
  failure: boolean,
  actor: CoreActor
) {
  authorize(actor)
  const { line } = lineOf(state, id, lineId)
  conflict(line.config.version, expected)
  const errors = lineErrors({ ...line.config, currency: line.currency })
  if (!line.config.credential) errors.push('尚未建立示範憑證識別')
  line.config.check = {
    result: failure || errors.length ? 'failed' : 'passed',
    at: now(),
    traceId: `SIM-${crypto.randomUUID()}`,
    message:
      errors.join('；') ||
      (failure
        ? '模擬連線逾時，未發出網路請求'
        : '設定格式模擬通過；精度、查單、Wallet 與合約仍須驗證')
  }
  line.config.status = 'testing'
  line.available = false
  line.config.version++
  line.config.updatedAt = now()
  log(
    state,
    id,
    `線路 ${lineId} 模擬測試：${line.config.check.result}｜${line.config.check.traceId}`,
    actor
  )
}
export function activationChecks(state: DemoState, p: DemoProvider, line: ProviderLine) {
  const c = line.config!
  return [
    {
      label: '設定與示範憑證',
      passed: !lineErrors({ ...c, currency: line.currency }).length && !!c.credential
    },
    { label: '連線設定測試（模擬）', passed: c.check?.result === 'passed' },
    {
      label: '幣別／精度與錢包相容（既有種子能力，非供應商認證）',
      passed:
        !!p.integration?.currencies.includes(line.currency) &&
        !!p.integration?.wallets.includes(c.wallet) &&
        c.scale === 2 &&
        c.minUnit === '0.01'
    },
    {
      label: '同幣別遊戲來源',
      passed: state.games.some((g) => g.providerId === p.id && g.currencies.includes(line.currency))
    },
    {
      label: '僅限測試線演示；正式啟用須完成 Adapter、D01／D07 及合約驗證',
      passed: c.environment === 'sandbox'
    }
  ]
}
export function changeLineStatus(
  state: DemoState,
  id: string,
  lineId: string,
  status: 'active' | 'maintenance' | 'disabled',
  expected: number,
  reason: string,
  actor: CoreActor
) {
  authorize(actor)
  if (!reason.trim()) throw new Error('請填寫操作原因')
  const { p, line } = lineOf(state, id, lineId)
  conflict(line.config.version, expected)
  if (status === 'active') {
    const missing = activationChecks(state, p, line).filter((c) => !c.passed)
    if (missing.length) throw new Error(`不可啟用：${missing.map((c) => c.label).join('；')}`)
  }
  line.config.status = status
  line.available = status === 'active'
  line.config.version++
  line.config.updatedAt = now()
  log(
    state,
    id,
    `線路 ${lineId} ${lineLabels[status]}：${reason.trim()}；保留既有 Session 與事件`,
    actor
  )
}
