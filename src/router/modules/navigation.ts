import type { AppRouteRecord } from '@/types/router'
import { reportDestinations, retiredReportPaths } from '@/domain/report-navigation'

const adminRoles = ['R_SUPER', 'R_ADMIN']

export const plannedPage = (
  path: string,
  name: string,
  title: string,
  description: string,
  roles = adminRoles
): AppRouteRecord => ({
  path,
  name,
  component: '/navigation/planned-page',
  meta: {
    title,
    description,
    roles,
    icon: 'ri:file-list-3-line',
    showTextBadge: '待開發',
    keepAlive: false
  }
})

const group = (
  path: string,
  name: string,
  title: string,
  children: AppRouteRecord[],
  icon = 'ri:folder-line'
): AppRouteRecord => ({
  path,
  name,
  component: '',
  meta: { title, icon, roles: adminRoles },
  children
})

export const flattenRoutes = (routes: AppRouteRecord[], parent = ''): AppRouteRecord[] =>
  routes.flatMap((route) => {
    const path = route.path.startsWith('/') ? route.path : `${parent}/${route.path}`
    return [{ ...route, path }, ...flattenRoutes(route.children || [], path)]
  })

/** Keep template implementations intact while exposing only the GGAP v2 navigation contract. */
export function organizeAdminRoutes(template: AppRouteRecord[]) {
  const original = flattenRoutes(template)
  const clone = (route: AppRouteRecord): AppRouteRecord => ({
    ...route,
    meta: { ...route.meta },
    children: route.children?.map(clone)
  })
  const find = (name: string): AppRouteRecord => {
    const route = original.find((item) => item.name === name)
    if (!route) throw new Error(`Missing template route: ${name}`)
    return clone(route)
  }
  const section = (name: string, path: string, title?: string): AppRouteRecord => {
    const route = find(name)
    route.path = path
    delete route.alias
    delete route.redirect
    if (route.children?.length) route.component = ''
    if (title) route.meta.title = title
    return route
  }

  const business = find('BusinessCenter')
  business.meta.title = '商務管理'
  business.children?.sort(
    (a, b) => Number(!a.path.startsWith('agents')) - Number(!b.path.startsWith('agents'))
  )
  business.redirect = '/business/agents'
  const overview = group('/overview', 'OverviewSection', '總覽', [
    {
      path: '/dashboard',
      name: 'GameProviderDashboard',
      component: '/game-provider/admin-dashboard/index',
      meta: { title: '儀錶板', icon: 'ri:dashboard-line', keepAlive: false }
    }
  ])
  overview.component = '/index/index'
  const reports = group('/report-center', 'ReportQuerySection', '報表中心', [
    {
      path: '/business/reports',
      name: 'ReportsFourTabs',
      component: '/game-provider/report-query/index',
      meta: { title: '報表查詢', icon: 'ri:bar-chart-box-line', keepAlive: false }
    }
  ])
  reports.component = '/index/index'
  const providerPage = (
    path: string,
    name: string,
    title: string,
    isHide = true
  ): AppRouteRecord => ({
    path,
    name,
    component: '/provider-hub/index',
    meta: {
      title,
      isHide,
      icon: 'ri:server-line',
      activePath: '/admin/providers',
      keepAlive: false
    }
  })
  const content = group(
    '/content',
    'ContentManagement',
    '廠商管理',
    [
      providerPage('/admin/providers', 'ProvidersList', '供應商管理', false),
      {
        ...providerPage('/admin/providers/games', 'GamesList', '遊戲管理', false),
        meta: {
          title: '遊戲管理',
          icon: 'ri:gamepad-line',
          activePath: '/admin/providers/games',
          keepAlive: false
        }
      },
      providerPage('/admin/providers/detail/:id(PV[0-9]+)', 'ProviderDetail', '供應商詳情'),
      {
        ...providerPage('/admin/providers/games/:id(G[0-9]+)', 'GameDetail', '遊戲詳情'),
        meta: { title: '遊戲詳情', isHide: true, activePath: '/admin/providers/games' }
      },
      {
        path: '/trials/links',
        name: 'TrialLinks',
        component: '/provider-hub/trial-management',
        meta: { title: '試玩管理', icon: 'ri:play-circle-line', keepAlive: false }
      }
    ],
    'ri:apps-line'
  )
  content.component = '/index/index'
  content.redirect = '/admin/providers'

  const members = section('MembersList', '/transactions/members', '會員與錢包')
  members.meta.isHide = false
  const memberDetail = section('MemberDetail', '/transactions/members/:id(P[0-9]+)')
  const transactions = find('TransactionCenter')
  business.children!.push(members, memberDetail)
  const records = transactions.children!.find((item) => item.name === 'GameTransactions')!
  records.meta.title = '交易流水'

  const finance = group(
    '/finance',
    'FinanceCenter',
    '財務中心',
    [
      {
        path: '/finance/reconciliation/providers',
        name: 'ProviderReconciliation',
        component: '/game-provider/finance/reconciliation/index',
        meta: { title: '供應商對帳', icon: 'ri:server-line', keepAlive: false }
      },
      {
        path: '/finance/reconciliation/providers/:id',
        name: 'ProviderReconciliationDetail',
        component: '/game-provider/finance/reconciliation/detail',
        meta: {
          title: '供應商對帳詳細',
          isHide: true,
          activePath: '/finance/reconciliation/providers'
        }
      },
      {
        path: '/finance/reconciliation/agents',
        name: 'AgentReconciliation',
        component: '/game-provider/finance/reconciliation/index',
        meta: { title: '代理對帳', icon: 'ri:node-tree', keepAlive: false }
      },
      {
        path: '/finance/reconciliation/agents/:id',
        name: 'AgentReconciliationDetail',
        component: '/game-provider/finance/reconciliation/detail',
        meta: {
          title: '代理對帳詳細',
          isHide: true,
          activePath: '/finance/reconciliation/agents'
        }
      },
      {
        path: '/finance/reconciliation/merchants',
        name: 'MerchantReconciliation',
        component: '/game-provider/finance/reconciliation/index',
        meta: { title: '商戶對帳', icon: 'ri:store-2-line', keepAlive: false }
      },
      {
        path: '/finance/reconciliation/merchants/:id',
        name: 'MerchantReconciliationDetail',
        component: '/game-provider/finance/reconciliation/detail',
        meta: {
          title: '商戶對帳詳細',
          isHide: true,
          activePath: '/finance/reconciliation/merchants'
        }
      },
      {
        path: '/finance/reconciliation/differences',
        name: 'ReconciliationDifferences',
        component: '/game-provider/finance/reconciliation/differences',
        meta: { title: '差異處理', icon: 'ri:file-warning-line', keepAlive: false }
      },
      {
        path: '/finance/reconciliation/logs',
        name: 'SettlementChangeLogs',
        component: '/game-provider/finance/settlement/logs/index',
        meta: { title: '異動紀錄', icon: 'ri:file-history-line', keepAlive: false }
      }
    ],
    'ri:calculator-line'
  )
  finance.component = '/index/index'
  finance.redirect = '/finance/reconciliation/providers'

  const systemPages = [
    ...flattenRoutes([section('AccessManagement', '/platform/access')])
      .filter((r) => !r.children?.length)
      .map((r) => ({
        r,
        workspace: /\/(accounts|roles|logs)$/.test(r.path) ? 'access' : 'access-detail'
      })),
    ...['CurrencyManagement', 'LocaleManagement', 'ParameterManagement'].flatMap((name) => {
      const paths: Record<string, string> = {
        CurrencyManagement: '/platform/currencies',
        LocaleManagement: '/platform/locales',
        ParameterManagement: '/platform/parameters'
      }
      return flattenRoutes([section(name, paths[name])])
        .filter((r) => !r.children?.length)
        .map((r) => ({ r, workspace: 'settings' }))
    }),
    ...flattenRoutes([section('SystemLogManagement', '/platform/logs')])
      .filter((r) => !r.children?.length)
      .map((r) => ({ r, workspace: 'settings' }))
  ]
  const workspaceRoots: Record<string, string> = {
    access: '/platform/access/accounts',
    'access-detail': '/platform/access/accounts',
    settings: '/platform/developers'
  }
  const workspaceTitles: Record<string, string> = {
    access: '人員與權限',
    settings: '開發者中心'
  }
  const system = group(
    '/platform',
    'SystemManagement',
    '系統管理',
    systemPages.map(({ r, workspace }) => ({
      ...r,
      children: undefined,
      component: '/navigation/system-workspace',
      meta: {
        ...r.meta,
        sourceComponent: r.component,
        workspace,
        tabTitle: r.meta.title,
        title: r.path === workspaceRoots[workspace] ? workspaceTitles[workspace] : r.meta.title,
        activePath: workspaceRoots[workspace],
        isHide: r.path !== workspaceRoots[workspace]
      }
    })),
    'ri:settings-3-line'
  )
  const exchangeRates: AppRouteRecord = {
    path: '/platform/exchange-rates',
    name: 'ExchangeRateManagement',
    component: '/game-provider/finance-settings/exchange-rates/index',
    meta: {
      title: '匯率管理',
      icon: 'ri:exchange-funds-line',
      keepAlive: false
    }
  }
  const developerCenter: AppRouteRecord = {
    path: '/platform/developers',
    name: 'DeveloperCenter',
    component: '/game-provider/platform/developers/index',
    meta: {
      title: '開發者中心',
      description: '集中提供 GGAP 串接資訊與完整 API 文件。',
      icon: 'ri:code-box-line',
      keepAlive: false
    }
  }
  system.children!.push(
    developerCenter,
    {
      path: '/platform/maintenance',
      name: 'PlatformMaintenance',
      component: '/game-provider/platform/maintenance/index',
      meta: {
        title: '維護設定',
        description: '管理緊急維護、預定排程、影響範圍與異動紀錄。',
        icon: 'ri:tools-line',
        keepAlive: false
      }
    },
    {
      path: '/platform/network-lists',
      name: 'PlatformNetworkLists',
      component: '/game-provider/platform/network-lists/index',
      meta: {
        title: '白名單／黑名單',
        description: '管理後台與 API 的 IP、CIDR 及網域來源規則。',
        icon: 'ri:list-check-3',
        keepAlive: false
      }
    },
    exchangeRates
  )
  const systemOrder = [
    '/platform/developers',
    '/platform/maintenance',
    '/platform/exchange-rates',
    '/platform/network-lists',
    '/platform/access/accounts'
  ]
  system.children!.sort(
    (a, b) =>
      (systemOrder.indexOf(a.path) < 0 ? 99 : systemOrder.indexOf(a.path)) -
      (systemOrder.indexOf(b.path) < 0 ? 99 : systemOrder.indexOf(b.path))
  )
  system.component = '/index/index'
  system.redirect = '/platform/developers'
  system.children!.push({
    path: '/retired/reports/:kind(rtp|jackpot|providers|quality|activity|manual|payments|configuration)',
    name: 'RetiredReportStatus',
    component: '/navigation/retired-reports',
    meta: {
      title: '功能停用說明',
      isHide: true,
      isHideTab: true,
      activePath: '/platform/developers'
    }
  })

  const routes = [overview, business, content, transactions, finance, reports, system]
  const current = flattenRoutes(routes)
  const byName = new Map(current.map((route) => [route.name, route.path]))
  const removedTargets: Record<string, string> = {
    ProviderCenter: '/admin/providers',
    ReportCenter: '/business/reports?tab=operations',
    GameReportGroup: '/business/reports?tab=games',
    MerchantReportGroup: '/business/merchants/summary',
    AgentReportGroup: '/business/agents/summary',
    TransactionReportGroup: '/transactions/bet-statistics',
    SettlementReportGroup: '/finance/reconciliation/providers',
    MerchantSettlementReport: '/finance/reconciliation/merchants',
    ProviderPayableReport: '/finance/reconciliation/providers',
    AgentCommissionReport: '/finance/reconciliation/agents',
    RtpReport: '/retired/reports/rtp',
    GameCenter: '/admin/providers/games',
    GameTaxonomy: '/admin/providers/games',
    GameMarketingTags: '/retired/reports/activity',
    GameCreate: '/admin/providers/games',
    GameTypes: '/admin/providers/games',
    GameFeatureTags: '/admin/providers/games',
    MemberCenter: '/transactions/members',
    FinanceSettings: '/platform/currencies/data',
    ReconciliationManagement: '/finance/reconciliation/merchants',
    MerchantReconciliation: '/finance/reconciliation/merchants',
    MerchantReconciliationDetail: '/finance/reconciliation/merchants',
    AgentReconciliation: '/finance/reconciliation/agents',
    AgentReconciliationDetail: '/finance/reconciliation/agents',
    ReconciliationDifferences: '/finance/reconciliation/differences',
    SettlementManagement: '/finance/reconciliation/providers',
    SettlementBatches: '/finance/reconciliation/providers',
    SettlementBatchDetail: '/finance/reconciliation/providers',
    MerchantSettlementStatements: '/finance/reconciliation/merchants',
    AgentSettlementStatements: '/finance/reconciliation/agents',
    SettlementExchangeSnapshots: '/platform/exchange-rates?tab=history',
    SettlementAdjustments: '/retired/reports/manual',
    SettlementChangeLogs: '/finance/reconciliation/logs',
    SettlementSettings: '/finance/reconciliation/merchants',
    DefaultSettlementCurrency: '/finance/reconciliation/merchants',
    SettlementCycles: '/finance/reconciliation/merchants',
    SettlementRateRules: '/finance/reconciliation/merchants',
    SettlementPrecision: '/platform/currencies/precision',
    SettlementRounding: '/platform/currencies/precision',
    DailyExchangeRates: '/platform/exchange-rates',
    ExchangeRateHistory: '/platform/exchange-rates?tab=history',
    ExchangeRateSources: '/platform/exchange-rates',
    ExchangeRateAdjustments: '/platform/exchange-rates',
    ExchangeRateAlerts: '/platform/exchange-rates',
    ExchangeRateLogs: '/platform/exchange-rates'
  }

  const summaryTargets: Record<string, string> = {
    ReportOverview: '/business/reports?tab=operations',
    GamePerformanceReport: '/business/reports?tab=games',
    MerchantReport: '/business/reports?tab=merchants',
    MerchantLineReport: '/business/reports?tab=merchants',
    AgentReport: '/business/reports?tab=agents',
    AgentMerchantReport: '/business/reports?tab=merchants',
    MemberReports: '/transactions/members',
    BetStatisticsReport: '/transactions/bets',
    TransactionStatisticsReport: '/transactions/records'
  }
  Object.assign(removedTargets, summaryTargets, {
    AccessManagement: '/platform/access/accounts',
    CurrencyManagement: '/platform/currencies/data',
    LocaleManagement: '/platform/locales/languages',
    ParameterManagement: '/platform/parameters/basic',
    SystemLogManagement: '/platform/access/logs',
    NotificationManagement: '/retired/reports/configuration',
    PlatformNotificationRules: '/retired/reports/configuration',
    PlatformNotificationLogs: '/platform/access/logs',
    ApprovalCenter: '/platform/logs/approvals',
    ApprovalPending: '/retired/reports/manual',
    ApprovalApproved: '/platform/logs/approvals',
    ApprovalRejected: '/platform/logs/approvals',
    ApprovalLogs: '/platform/logs/approvals'
  })

  const redirects = original.flatMap((old) => {
    const target =
      old.path === '/risk' || old.path.startsWith('/risk/')
        ? '/retired/reports/quality'
        : byName.get(old.name) || removedTargets[String(old.name)]
    if (!target || target === old.path) return []
    return [{ path: old.path, name: `GgapLegacy${String(old.name)}`, target }]
  })
  for (const [path, target] of Object.entries(retiredReportPaths)) {
    if (!redirects.some((r) => r.path === path))
      redirects.push({ path, name: 'ReportRetired' + path.replace(/[^a-z]/gi, ''), target })
  }
  for (const entry of reportDestinations) {
    redirects.push({
      path: entry.path,
      name: 'R03Legacy' + entry.name,
      target: summaryTargets[entry.name]
    })
  }
  const aliases: Record<string, string> = {
    '/admin': '/admin/providers',
    '/trials': '/trials/links',
    '/finance/overview': '/finance/reconciliation/providers',
    '/finance/merchants': '/finance/reconciliation/merchants',
    '/finance/merchants/settlements': '/finance/reconciliation/merchants',
    '/finance/merchants/invoices': '/finance/reconciliation/merchants',
    '/finance/merchants/receipts': '/retired/reports/payments',
    '/finance/providers': '/finance/reconciliation/providers',
    '/finance/providers/reconciliation': '/finance/reconciliation/providers',
    '/finance/providers/payables': '/finance/reconciliation/providers',
    '/finance/providers/payments': '/retired/reports/payments',
    '/finance/agents': '/finance/reconciliation/agents',
    '/finance/agents/commissions': '/finance/reconciliation/agents',
    '/finance/agents/payments': '/retired/reports/payments',
    '/finance/adjustments': '/retired/reports/payments',
    '/finance/exchange-rates': '/platform/exchange-rates',
    '/finance/exchange-rates/daily': '/platform/exchange-rates',
    '/finance/exchange-rates/sources': '/platform/exchange-rates',
    '/finance/exchange-rates/adjustments': '/platform/exchange-rates',
    '/finance/exchange-rates/history': '/platform/exchange-rates?tab=history',
    '/finance/exchange-rates/alerts': '/platform/exchange-rates',
    '/finance/exchange-rates/logs': '/platform/exchange-rates',
    '/insights': '/business/reports',
    '/platform/exchange-rates/settings': '/platform/exchange-rates',
    '/platform/exchange-rates/daily': '/platform/exchange-rates',
    '/platform/exchange-rates/sources': '/platform/exchange-rates',
    '/platform/exchange-rates/adjustments': '/platform/exchange-rates',
    '/platform/exchange-rates/history': '/platform/exchange-rates?tab=history',
    '/platform/exchange-rates/alerts': '/platform/exchange-rates',
    '/platform/exchange-rates/logs': '/platform/exchange-rates',
    '/transactions/rounds': '/transactions/bets?focus=round',
    '/transactions/transfers': '/transactions/records?tab=transfers',
    '/transactions/supplements': '/retired/reports/manual',
    '/transactions/manual': '/retired/reports/manual'
  }
  aliases['/admin/providers/demo-links'] = '/trials/links'
  for (const [path, target] of Object.entries(aliases)) {
    if (!current.some((r) => r.path === path) && !redirects.some((r) => r.path === path))
      redirects.push({ path, name: 'MvpLegacy' + path.replace(/[^a-z]/gi, ''), target })
  }
  const remap = (path: string) =>
    (redirects.find((item) => item.path === path)?.target || path).split('?')[0]
  const decorate = (items: AppRouteRecord[], parent = ''): AppRouteRecord[] =>
    items.map((item) => {
      const path = item.path.startsWith('/') ? item.path : `${parent}/${item.path}`
      const children = item.children ? decorate(item.children, path) : undefined
      const meta: AppRouteRecord['meta'] = { ...item.meta, roles: adminRoles }
      // Reorganize menu ownership without renaming canonical URLs (Vue supports absolute children).
      if (parent && item.path.startsWith('/')) meta.preserveCanonicalPath = true
      delete meta.menuGroup
      if (meta.activePath) meta.activePath = remap(meta.activePath)
      if (item.name === 'MemberDetail') meta.activePath = '/transactions/members'
      if (item.name === 'MembersList') delete meta.activePath
      const redirect = typeof item.redirect === 'string' ? remap(item.redirect) : item.redirect
      const first = children?.find((child) => !child.meta.isHide)
      return {
        ...item,
        meta,
        children,
        redirect:
          redirect ||
          (first ? (first.path.startsWith('/') ? first.path : `${path}/${first.path}`) : undefined)
      }
    })
  return { routes: decorate(routes), redirects }
}
