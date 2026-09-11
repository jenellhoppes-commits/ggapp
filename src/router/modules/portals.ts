import type { AppRouteRecord } from '@/types/router'
import { plannedPage } from './navigation'

export const portalRoutes: AppRouteRecord[] = [
  {
    path: '/agent',
    name: 'AgentPortal',
    component: '/index/index',
    redirect: '/agent/dashboard',
    meta: {
      title: '代理後台',
      icon: 'ri:node-tree',
      menuGroup: '代理作業',
      roles: ['R_AGENT']
    },
    children: [
      {
        path: 'relations/create',
        name: 'AgentPortalCreateAgent',
        component: '/portals/partner-create',
        meta: { title: '新增下級代理', roles: ['R_AGENT'], isHide: true, keepAlive: false }
      },
      {
        path: 'merchants/create',
        name: 'AgentPortalCreateMerchant',
        component: '/portals/partner-create',
        meta: { title: '新增直屬商戶', roles: ['R_AGENT'], isHide: true, keepAlive: false }
      },
      {
        path: 'dashboard',
        name: 'AgentPortalDashboard',
        component: '/portals/agent-dashboard',
        meta: {
          title: '儀錶板',
          icon: 'ri:dashboard-3-line',
          roles: ['R_AGENT'],
          fixedTab: true,
          keepAlive: false
        }
      },
      {
        path: 'relations',
        name: 'AgentPortalRelations',
        component: '/portals/agent-partners',
        meta: { title: '代理關係', icon: 'ri:node-tree', roles: ['R_AGENT'], keepAlive: false }
      },
      {
        path: 'merchants',
        name: 'AgentPortalMerchants',
        component: '/portals/agent-partners',
        meta: {
          title: '商戶管理',
          icon: 'ri:store-2-line',
          roles: ['R_AGENT'],
          keepAlive: false
        }
      },
      {
        path: 'terms',
        name: 'AgentPortalTerms',
        component: '/portals/agent-partners',
        meta: {
          title: '商務條件',
          icon: 'ri:file-list-3-line',
          roles: ['R_AGENT'],
          keepAlive: false
        }
      },
      ...[
        [
          'reports',
          'AgentPortalReports',
          '代理報表',
          'ri:bar-chart-box-line',
          '/portals/agent-reports'
        ],
        [
          'exchange-rates',
          'AgentPortalExchangeRates',
          '匯率報表',
          'ri:exchange-dollar-line',
          '/portals/agent-reports'
        ],
        [
          'settlements',
          'AgentPortalSettlements',
          '對帳／結算',
          'ri:bill-line',
          '/portals/agent-services'
        ],
        [
          'notifications',
          'AgentPortalNotifications',
          '公告通知',
          'ri:notification-3-line',
          '/portals/agent-services'
        ],
        [
          'account',
          'AgentPortalAccount',
          '帳號與權限',
          'ri:shield-user-line',
          '/portals/agent-services'
        ]
      ].map(([path, name, title, icon, component]) => ({
        path,
        name,
        component,
        meta: { title, icon, roles: ['R_AGENT'], keepAlive: false }
      })),
      {
        path: 'merchants/integration',
        name: 'AgentPortalIntegration',
        component: '/portals/agent-integration',
        meta: { title: '商戶串接進度', roles: ['R_AGENT'], isHide: true, keepAlive: false }
      },
      {
        path: 'integration',
        name: 'AgentPortalLegacyIntegration',
        component: '/navigation/planned-page',
        redirect: (to) => ({ path: '/agent/merchants/integration', query: to.query }),
        meta: { title: '串接進度', roles: ['R_AGENT'], isHide: true }
      },
      {
        path: 'commissions',
        name: 'AgentPortalCommissions',
        component: '/navigation/planned-page',
        redirect: (to) => ({
          path: '/agent/settlements',
          query: { ...to.query, tab: 'commissions' }
        }),
        meta: { title: '我的佣金', roles: ['R_AGENT'], isHide: true }
      },
      {
        path: 'payments',
        name: 'AgentPortalPayments',
        component: '/navigation/planned-page',
        redirect: (to) => ({ path: '/agent/settlements', query: { ...to.query, tab: 'payments' } }),
        meta: { title: '付款紀錄', roles: ['R_AGENT'], isHide: true }
      }
    ]
  },
  {
    path: '/merchant',
    name: 'MerchantPortal',
    component: '/index/index',
    redirect: '/merchant/dashboard',
    meta: {
      title: '商戶後台',
      icon: 'ri:store-2-line',
      menuGroup: '商戶入口',
      roles: ['R_MERCHANT']
    },
    children: [
      {
        path: 'dashboard',
        name: 'MerchantPortalDashboard',
        component: '/portals/dashboard',
        meta: {
          title: '商戶總覽',
          icon: 'ri:dashboard-3-line',
          roles: ['R_MERCHANT'],
          fixedTab: true,
          keepAlive: false
        }
      },
      {
        path: 'profile',
        name: 'MerchantPortalProfile',
        component: '/portals/merchant-profile',
        meta: { title: '商戶資料與條件', icon: 'ri:file-list-3-line', roles: ['R_MERCHANT'], keepAlive: false }
      },
      plannedPage(
        'lines',
        'MerchantPortalLines',
        '幣別線管理',
        '管理自身商戶幣別線與同幣別供應商路由。',
        ['R_MERCHANT']
      ),
      plannedPage(
        'integration',
        'MerchantPortalIntegration',
        'API 串接',
        'GGAP 統一 API、錢包、回呼與測試環境測試。',
        ['R_MERCHANT']
      ),
      plannedPage(
        'games',
        'MerchantPortalGames',
        '可用遊戲',
        '查看已授權遊戲及維護狀態，不修改供應商內部數值。',
        ['R_MERCHANT']
      ),
      {
        path: 'demo-links',
        name: 'MerchantDemoLinks',
        component: '/provider-hub/merchant-demo',
        meta: {
          title: '試玩連結',
          icon: 'ri:play-circle-line',
          roles: ['R_MERCHANT'],
          keepAlive: false
        }
      },
      ...(['members', 'bets', 'transactions'] as const).map((path, index) => ({
        path,
        name: ['MerchantPortalMembers', 'MerchantPortalBets', 'MerchantPortalTransactions'][index],
        component: '/portals/merchant-query',
        meta: {
          title: ['會員與錢包', '注單查詢', '交易流水'][index],
          roles: ['R_MERCHANT'],
          keepAlive: false
        }
      })),
      {
        path: 'settlements',
        name: 'MerchantPortalSettlements',
        component: '/portals/merchant-settlements',
        meta: { title: '結算明細', roles: ['R_MERCHANT'], keepAlive: false }
      },
      ...[
        ['reports', 'MerchantPortalReports', '報表中心', '每日營運、依遊戲、依供應商及依幣別報表。', 'ri:bar-chart-box-line'],
        ['notifications', 'MerchantPortalNotifications', '公告通知', '查詢本商戶公告及閱讀狀態。', 'ri:notification-3-line'],
        ['account', 'MerchantPortalAccount', '帳號與權限', '管理本商戶帳號與角色權限。', 'ri:shield-user-line'],
        ['security', 'MerchantPortalSecurity', '安全與操作紀錄', '登入安全、敏感操作與異動紀錄。', 'ri:shield-check-line']
      ].map(([path, name, title, description, icon]) => {
        const route = plannedPage(path, name, title, description, ['R_MERCHANT'])
        return { ...route, meta: { ...route.meta, icon, keepAlive: false } }
      }),
      {
        path: 'invoices',
        name: 'MerchantPortalInvoices',
        component: '/navigation/planned-page',
        redirect: (to) => ({ path: '/merchant/settlements', query: to.query }),
        meta: { title: '帳單與付款', roles: ['R_MERCHANT'], isHide: true }
      }
    ]
  }
]

// The route parent still owns layout/access; only its presentation is flattened.
const merchant = portalRoutes.find((r) => r.name === 'MerchantPortal')!
const merchantMenu = [
  ['dashboard', '儀錶板', 'ri:dashboard-3-line'],
  ['profile', '商務中心', 'ri:briefcase-line'],
  ['games', '遊戲中心', 'ri:gamepad-line'],
  ['members', '會員中心', 'ri:group-line'],
  ['bets', '交易中心', 'ri:exchange-line'],
  ['reports', '報表管理', 'ri:bar-chart-box-line'],
  ['settlements', '對帳/結算', 'ri:bill-line'],
  ['exchange-rates', '匯率報表', 'ri:exchange-dollar-line'],
  ['integration', '串接中心', 'ri:code-box-line'],
  ['notifications', '公告通知', 'ri:notification-3-line'],
  ['account', '帳號與權限', 'ri:shield-user-line'],
  ['security', '操作紀錄', 'ri:history-line']
]
merchant.children!.push(plannedPage('exchange-rates', 'MerchantPortalExchangeRates', '匯率報表', '查看本商戶適用匯率及歷史快照。', ['R_MERCHANT']))
for (const route of merchant.children!) {
  if (['dashboard', 'integration', 'notifications', 'account', 'security'].includes(route.path)) {
    route.component = '/portals/merchant-services'
    delete route.meta.showTextBadge
  }
  if (route.path === 'transactions') route.redirect = (to) => ({path:'/merchant/bets',query:{...to.query,tab:'transactions'}})
  if (['reports', 'settlements', 'exchange-rates'].includes(route.path)) {
    route.component = '/portals/merchant-finance'
    delete route.meta.showTextBadge
  }
  if (['lines', 'demo-links'].includes(route.path)) {
    const tab = route.path
    route.redirect = (to) => ({ path: '/merchant/games', query: { ...to.query, tab } })
  }
  if (['games', 'lines'].includes(route.path)) {
    route.component = '/portals/merchant-games'
    delete route.meta.showTextBadge
  }
  const item = merchantMenu.find(([path]) => path === route.path)
  if (item) {
    route.meta = { ...route.meta, title: item[1], icon: item[2] }
  } else {
    route.meta = { ...route.meta, isHide: true, activePath: route.path === 'transactions' ? '/merchant/bets' : route.path === 'invoices' ? '/merchant/settlements' : '/merchant/games' }
  }
}
merchant.children!.sort((a, b) => {
  const index = (path: string) => {
    const i = merchantMenu.findIndex(([p]) => p === path)
    return i < 0 ? merchantMenu.length : i
  }
  return index(a.path) - index(b.path)
})
