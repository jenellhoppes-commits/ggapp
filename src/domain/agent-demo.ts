import { agentScope, type PortalActor, type PortalSource } from './agent-portal'
import type { BetCenterRecord, DailyExchangeRateRecord } from '../types/game-provider'

/** Explicit projections: never pass raw transactions or finance settings to portal tables. */
export function agentReportRows(source: PortalSource, actor: PortalActor, bets: BetCenterRecord[]) {
  const scope = agentScope(source, actor)
  const merchants = new Map(scope.merchants.map((m) => [m.id, m]))
  return bets.flatMap((bet) => {
    const merchant = merchants.get(bet.merchantId)
    if (
      !merchant ||
      !merchant.lines.some((l) => l.uid === bet.lineUid && l.currency === bet.currency)
    )
      return []
    return [
      {
        id: bet.id,
        merchantId: merchant.id,
        merchantName: merchant.name,
        agentId: merchant.agentId,
        agentName: source.agents.find((a) => a.id === merchant.agentId)?.name || merchant.agentId,
        gameId: bet.gameId,
        lineUid: bet.lineUid,
        roundId: bet.roundId,
        currency: bet.currency,
        gameName: bet.gameName,
        betAt: bet.betAt,
        status: bet.status,
        betAmount: bet.betAmount,
        payoutAmount: bet.status === 'Settled' ? bet.payoutAmount : null
      }
    ]
  })
}

export type AgentReportTab = 'agents' | 'merchants' | 'games' | 'currencies'
export type AgentReportRow = ReturnType<typeof agentReportRows>[number]
export function groupAgentReports(rows: AgentReportRow[], tab: AgentReportTab) {
  const groups = new Map<
    string,
    { id: string; name: string; currency: string; rows: AgentReportRow[] }
  >()
  const seen = new Set<string>()
  for (const row of rows) {
    const identity = `${row.merchantId}:${row.lineUid}:${row.id}`
    if (seen.has(identity)) continue
    seen.add(identity)
    const id =
      tab === 'agents'
        ? row.agentId
        : tab === 'merchants'
          ? row.merchantId
          : tab === 'games'
            ? row.gameId
            : row.currency
    const name =
      tab === 'agents'
        ? row.agentName
        : tab === 'merchants'
          ? row.merchantName
          : tab === 'games'
            ? row.gameName
            : row.currency
    const key = JSON.stringify([id, row.currency])
    if (!groups.has(key)) groups.set(key, { id, name, currency: row.currency, rows: [] })
    groups.get(key)!.rows.push(row)
  }
  return [...groups.entries()].map(([key, group]) => ({
    ...group,
    key,
    merchants: new Set(group.rows.map((r) => r.merchantId)).size,
    lines: new Set(group.rows.map((r) => `${r.merchantId}:${r.lineUid}`)).size,
    rounds: new Set(
      group.rows
        .filter((r) => r.roundId)
        .map((r) => JSON.stringify([r.merchantId, r.lineUid, r.gameId, r.roundId]))
    ).size,
    count: group.rows.length,
    settled: group.rows.filter((r) => r.status === 'Settled').length,
    bet: group.rows.filter((r) => r.status === 'Settled').reduce((n, r) => n + r.betAmount, 0),
    payout: group.rows
      .filter((r) => r.status === 'Settled')
      .reduce((n, r) => n + (r.payoutAmount ?? 0), 0)
  }))
}

export function agentPublishedRates(
  source: PortalSource,
  actor: PortalActor,
  rates: DailyExchangeRateRecord[]
) {
  const scope = agentScope(source, actor)
  if (!scope.own) return []
  const currencies = new Set([
    scope.own.currency,
    ...scope.merchants.flatMap((m) => m.lines.map((l) => l.currency))
  ])
  return rates
    .filter(
      (r) =>
        r.status === 'Published' && (currencies.has(r.fromCurrency) || currencies.has(r.toCurrency))
    )
    .map((r) => ({
      id: r.id,
      date: r.date,
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      finalRate: r.finalRate
    }))
}

export const agentDemoNotices = [
  {
    id: 'demo-guide',
    title: '代理作業操作導覽（演示）',
    category: '操作說明',
    content:
      '從代理關係及商戶管理查看授權範圍，透過商務條件調整直屬下級代理或直屬商戶的費率。此公告為介面演示，並非平台正式投遞。'
  },
  {
    id: 'demo-rates',
    title: '費率生效規則說明（演示）',
    category: '商務條件',
    content:
      '新費率須填寫生效日期，依平台時區及下注時間選取版本；未修改時沿用原費率。下級費率不得高於自身取得費率，可以相同。不回寫既有對帳單。'
  },
  {
    id: 'demo-settlement',
    title: '對帳服務開放範圍（演示）',
    category: '服務說明',
    content:
      '目前僅演示對帳頁面與異議草稿，沒有正式帳單、佣金計算或付款服務。草稿只保存在此瀏覽器，不會送出。'
  }
] as const

export const agentPermissionRows = [
  { item: '自身與轄下代理／商戶資料', scope: '自身、全部下級及轄下商戶', action: '唯讀查詢' },
  { item: '合約費率', scope: '直屬下級代理、直屬商戶', action: '新增生效版本；不得高於自身費率' },
  { item: '自身取得費率、間接下級費率', scope: '授權範圍內', action: '唯讀，不可修改' },
  { item: '組織、技術及串接設定', scope: '授權範圍內', action: '僅查詢可見欄位，不可修改' },
  { item: '對帳單與付款', scope: '自身帳務', action: '不可強制改帳、出帳或付款' },
  { item: '帳號授權', scope: '本人', action: '不可自行擴權或建立子帳號' }
]
