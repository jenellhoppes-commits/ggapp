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
      plannedPage(
        'invoices',
        'MerchantPortalInvoices',
        '帳單與付款',
        '查看自身帳單、調整及付款狀態。',
        ['R_MERCHANT']
      )
    ]
  }
]
