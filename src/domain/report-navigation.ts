import type { LocationQuery, LocationQueryRaw } from 'vue-router'

/** Legacy route inventory; current reports use the single four-tab page. */
export const reportDestinations = [
  {
    name: 'ReportOverview',
    path: '/dashboard/operations',
    title: '營運摘要查詢',
    activePath: '/dashboard',
    area: '總覽',
    note: '原幣彙總與既有匯出',
    transition: false
  },
  {
    name: 'GamePerformanceReport',
    path: '/dashboard/games',
    title: '遊戲表現查詢',
    activePath: '/dashboard',
    area: '總覽',
    note: '沿用固定示範排行，不是正式統計',
    transition: false
  },
  {
    name: 'MerchantReport',
    path: '/business/merchants/summary',
    title: '商戶摘要查詢',
    activePath: '/business/merchants',
    area: '商務管理',
    note: '商戶詳情可帶入商戶，保留過渡查詢／匯出',
    transition: true
  },
  {
    name: 'MerchantLineReport',
    path: '/business/merchants/line-summary',
    title: '商戶線路摘要查詢',
    activePath: '/business/merchants',
    area: '商務管理',
    note: '沿用示範線路資料，保留過渡查詢／匯出',
    transition: true
  },
  {
    name: 'AgentReport',
    path: '/business/agents/summary',
    title: '代理營運摘要查詢',
    activePath: '/business/agents',
    area: '商務管理',
    note: '只保留既有營運摘要，不當作佣金',
    transition: true
  },
  {
    name: 'AgentMerchantReport',
    path: '/business/agents/merchant-summary',
    title: '代理商戶摘要查詢',
    activePath: '/business/agents',
    area: '商務管理',
    note: '保留既有摘要，不改代理權限或歸屬',
    transition: true
  },
  {
    name: 'MemberReports',
    path: '/transactions/member-statistics',
    title: '會員統計查詢',
    activePath: '/transactions/members',
    area: '交易中心',
    note: '會員列表可達，保留既有統計匯出',
    transition: true
  },
  {
    name: 'BetStatisticsReport',
    path: '/transactions/bet-statistics',
    title: '注單統計查詢',
    activePath: '/transactions/bets',
    area: '交易中心',
    note: '彙總與逐筆注單分開，不拆造下注',
    transition: true
  },
  {
    name: 'TransactionStatisticsReport',
    path: '/transactions/record-statistics',
    title: '交易統計查詢',
    activePath: '/transactions/records',
    area: '交易中心',
    note: '交易列表可達，保留既有統計匯出',
    transition: true
  }
] as const

export const retiredReportPaths: Record<string, string> = {
  '/reports/games/rtp': '/retired/reports/rtp',
  '/reports/rtp': '/retired/reports/rtp',
  '/reports/jackpots': '/retired/reports/jackpot',
  '/reports/providers': '/retired/reports/providers'
}

export const settlementDestinations = [
  { title: '商戶對帳', path: '/finance/reconciliation/merchants' },
  { title: '供應商對帳', path: '/finance/reconciliation/providers' },
  { title: '代理對帳', path: '/finance/reconciliation/agents' }
]

/** Transitional embedded-summary bookmarks now point to the sole approved report page. */
export function legacySummaryTarget(path: string, query: LocationQuery) {
  const allowed: Record<string, Record<string, string>> = {
    '/business/merchants': {
      overview: 'operations',
      merchant: 'merchants',
      'merchant-line': 'merchants'
    },
    '/business/agents': { agent: 'agents', 'agent-merchant': 'merchants' },
    '/admin/providers/games': { 'game-performance': 'games' }
  }
  const tab = allowed[path]?.[String(query.summary || '')]
  if (!tab) return undefined
  const targetQuery: LocationQueryRaw = { ...query, summary: undefined, tab }
  return { path: '/business/reports', query: targetQuery }
}
