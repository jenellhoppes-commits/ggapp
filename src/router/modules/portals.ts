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
      menuGroup: '代理入口',
      roles: ['R_AGENT']
    },
    children: [
      {
        path: 'dashboard',
        name: 'AgentPortalDashboard',
        component: '/portals/dashboard',
        meta: {
          title: '代理總覽',
          icon: 'ri:dashboard-3-line',
          roles: ['R_AGENT'],
          fixedTab: true,
          keepAlive: false
        }
      },
      {
        path: 'merchants',
        name: 'AgentPortalMerchants',
        component: '/portals/agent-partners',
        meta: {
          title: '下級代理與商戶',
          icon: 'ri:node-tree',
          roles: ['R_AGENT'],
          keepAlive: false
        }
      },
      plannedPage(
        'integration',
        'AgentPortalIntegration',
        '串接進度',
        '查看推廣商戶的測試環境測試及審核進度。',
        ['R_AGENT']
      ),
      plannedPage(
        'reports',
        'AgentPortalReports',
        '營運摘要',
        '查看自身推廣商戶的營運摘要，不顯示供應商成本或平台毛利。',
        ['R_AGENT']
      ),
      plannedPage(
        'commissions',
        'AgentPortalCommissions',
        '我的佣金',
        '只查看自身佣金及引用的已確認商戶結算。',
        ['R_AGENT']
      ),
      plannedPage(
        'payments',
        'AgentPortalPayments',
        '佣金付款紀錄',
        '查看自身佣金付款狀態，不向商戶代收款。',
        ['R_AGENT']
      )
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
      plannedPage(
        'settlements',
        'MerchantPortalSettlements',
        '結算明細',
        '查看原幣結果、帳期、鎖定匯率與正式結算。',
        ['R_MERCHANT']
      ),
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
