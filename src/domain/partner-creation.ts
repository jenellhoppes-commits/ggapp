import type { AgentRecord, MerchantRecord } from '../types/game-provider'
import { permitsAgent } from './agent-access'
import { newAgentLevel } from './agent-hierarchy'
import {
  prepareSupplierCost,
  type SupplierCostInput,
  type SupplierCostVersion,
  type CostContext
} from './admin-supplier-costs'

export interface PartnerInput {
  collectionMode?: 'AgentCollect' | 'PlatformCollect'
  kind: 'agent' | 'merchant'
  code: string
  name: string
  parentId: string
  contact: string
  contactMethod: string
  cooperationStartDate: string
  note: string
  country: string
  email: string
  walletMode: 'Seamless' | 'Transfer'
  lineCurrency: string
  terms: SupplierCostInput[]
}
export interface CreationEntry {
  requestId: string
  fingerprint: string
  actorKey: string
  agent?: AgentRecord
  merchant?: MerchantRecord
  costs: SupplierCostVersion[]
  createdAt: string
  createdBy: string
}
export interface PartnerSource {
  agents: AgentRecord[]
  merchants: MerchantRecord[]
  costs: SupplierCostVersion[]
  entries: CreationEntry[]
}
export interface CreationContext extends CostContext {
  providerWallets?: Record<string, string[]>
}
export function preparePartnerCreation(
  source: PartnerSource,
  input: PartnerInput,
  context: CreationContext,
  requestId: string
): CreationEntry {
  const admin = context.roles.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r))
  const actorKey = admin ? `admin:${context.name}` : `agent:${context.agentId}`
  if (!admin) {
    const actor = source.agents.find((a) => a.id === context.agentId && a.status === 'Active')
    if (!permitsAgent(context.roles, 'business') || !actor || input.parentId !== actor.id)
      throw new Error('代理只能在本人名下建立直屬代理或商戶')
  }
  if (!['agent', 'merchant'].includes(input.kind) || !requestId) throw new Error('建立請求無效')
  const fingerprint = JSON.stringify(input)
  const previous = source.entries.find((e) => e.requestId === requestId)
  if (previous) {
    if (previous.actorKey !== actorKey || previous.fingerprint !== fingerprint)
      throw new Error('重送內容與原請求不同，請重新開啟新增表單')
    return previous
  }
  const code = input.code.trim().toUpperCase()
  if (!/^[A-Z0-9][A-Z0-9_-]{2,31}$/.test(code))
    throw new Error('代碼須為 3–32 位英數、底線或連字號')
  const records = input.kind === 'agent' ? source.agents : source.merchants
  if (records.some((r) => r.code.toUpperCase() === code))
    throw new Error('代碼已存在，請使用其他代碼')
  if (!input.name.trim() || !input.contact.trim() || !input.contactMethod.trim())
    throw new Error('請填寫名稱、聯絡人及聯絡方式')
  const date = new Date(`${input.cooperationStartDate}T00:00:00Z`)
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.cooperationStartDate
  )
    throw new Error('請填寫有效合作開始日期')
  if (!input.terms.length) throw new Error('至少一組供應商初版結算條件必填')
  const keys = input.terms.map(
    (t) => `${t.providerId}:${t.gameType || 'legacy'}:${t.transactionCurrency}`
  )
  if (new Set(keys).size !== keys.length)
    throw new Error('同供應商、遊戲類型與交易幣別只能有一組初版條件')
  if (input.terms.some((t) => t.effectiveFrom < input.cooperationStartDate))
    throw new Error('結算條件不能早於合作開始日期')
  const parent = source.agents.find((a) => a.id === input.parentId)
  const level =
    input.kind === 'agent' ? newAgentLevel(source.agents, input.parentId || undefined) : undefined
  if (input.kind === 'merchant') {
    if (input.collectionMode && !['AgentCollect', 'PlatformCollect'].includes(input.collectionMode))
      throw new Error('請選擇有效收付模式')
    if (!parent || parent.status !== 'Active') throw new Error('請指定已啟用的所屬代理')
    if (!input.country.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
      throw new Error('請填寫商戶國家／地區及有效 Email')
    if (!['Seamless', 'Transfer'].includes(input.walletMode)) throw new Error('錢包模式無效')
    // A draft merchant line is not a provider/game grant. Availability belongs to
    // the game authorization gate, not the commercial contract's currency.
    if (!input.lineCurrency || !context.currencies.includes(input.lineCurrency))
      throw new Error('請選擇有效的初始交易幣別')
  }
  const id = `${input.kind === 'agent' ? 'A' : 'M'}-DEMO-${requestId}`
  const now = new Date().toISOString()
  const costs: SupplierCostVersion[] = []
  for (const term of input.terms)
    costs.push(
      prepareSupplierCost([...source.costs, ...costs], input.kind, id, input.parentId, term, {
        ...context,
        editableTargets: [`${input.kind}:${id}`]
      })
    )
  const first = costs[0]
  const entry: CreationEntry = {
    requestId,
    fingerprint,
    actorKey,
    costs,
    createdAt: now,
    createdBy: context.name
  }
  if (input.kind === 'agent')
    entry.agent = {
      id,
      code,
      name: input.name.trim(),
      level: level!,
      parentAgentId: parent?.id,
      parentAgent: parent?.name || '—',
      childAgentCount: 0,
      merchantCount: 0,
      currency: first.currency,
      contact: input.contact.trim(),
      contactMethod: input.contactMethod.trim(),
      cooperationStartDate: input.cooperationStartDate,
      note: input.note,
      status: 'Active',
      createdAt: now,
      updatedAt: now
    }
  else
    entry.merchant = {
      collectionMode: input.collectionMode || 'AgentCollect',
      id,
      code,
      name: input.name.trim(),
      agentId: parent!.id,
      agentName: parent!.name,
      country: input.country.trim(),
      timezone: context.timezone,
      contact: input.contact.trim(),
      email: input.email.trim(),
      cooperationStartDate: input.cooperationStartDate,
      note: input.note,
      walletMode: input.walletMode,
      status: 'Draft',
      agentTermPercent: Number(first.upstreamCost),
      merchantTermPercent: Number(first.payable),
      settlementCurrency: first.currency,
      settlementCycle: first.cycle,
      createdAt: now,
      updatedAt: now,
      lines: [
        {
          uid: `${id}-${input.lineCurrency}`,
          merchantId: id,
          currency: input.lineCurrency,
          walletMode: input.walletMode,
          enabledGames: 0,
          limitPlanCount: 0,
          jackpotMode: 'Excluded',
          environment: 'Sandbox',
          credentialStatus: 'Not Issued',
          status: 'Draft',
          updatedAt: now,
          environments: [
            {
              id: `${id}-sandbox`,
              environment: 'Sandbox',
              endpoint: '',
              callbackUrl: '',
              ipWhitelist: [],
              status: 'Not Configured',
              updatedAt: now
            }
          ]
        }
      ]
    }
  return entry
}

export interface PartnerJournal {
  version: 1
  entries: CreationEntry[]
  costVersions: SupplierCostVersion[]
}
export const PARTNER_JOURNAL_KEY = 'ggap-partner-workspace-v2'
export function persistPartnerJournal(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  expected: string | null,
  journal: PartnerJournal
) {
  if (storage.getItem(PARTNER_JOURNAL_KEY) !== expected)
    throw new Error('其他頁面已更新資料，請重新整理後再保存')
  const serialized = JSON.stringify(journal)
  storage.setItem(PARTNER_JOURNAL_KEY, serialized)
  return serialized
}
