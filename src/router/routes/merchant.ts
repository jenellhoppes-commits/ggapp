import type { RouteRecordRaw } from 'vue-router'

export const merchantRoutes: RouteRecordRaw = {
  path: '/merchant',
  component: () => import('../../layouts/UnifiedPortalLayout.vue'),
  redirect: '/merchant/dashboard',
  meta: { requiresAuth: true, portal: 'merchant', allowedRoles: ['MERCHANT'] },
  children: [
    { path: 'dashboard', name: 'merchant-dashboard', component: () => import('../../views/PortalPrototype/Dashboard.vue'), props: { portal: 'merchant' }, meta: { title: '商戶總覽', center: '總覽' } },
    { path: 'players', name: 'merchant-players', component: () => import('../../views/PortalPrototype/EntityList.vue'), props: { kind: 'players' }, meta: { title: '會員查詢', center: '營運管理' } },
    { path: 'games', name: 'merchant-games', component: () => import('../../views/PortalPrototype/EntityList.vue'), props: { kind: 'games' }, meta: { title: '我的遊戲', center: '營運管理' } },
    { path: 'betting/bets', name: 'merchant-betting-bets', component: () => import('../../views/PortalPrototype/EntityList.vue'), props: { kind: 'bets' }, meta: { title: '注單查詢', center: '交易中心' } },
    { path: 'betting/transactions', name: 'merchant-betting-transactions', component: () => import('../../views/PortalPrototype/EntityList.vue'), props: { kind: 'transactions' }, meta: { title: '交易流水', center: '交易中心' } },
    { path: 'finance/invoices', name: 'merchant-finance', component: () => import('../../views/PortalPrototype/TabbedWorkspace.vue'), props: { kind: 'merchantFinance' }, meta: { title: '對帳與帳單', center: '財務中心' } },
    { path: 'reports', name: 'merchant-reports', component: () => import('../../views/PortalPrototype/TabbedWorkspace.vue'), props: { kind: 'merchantReports' }, meta: { title: '報表查詢', center: '報表中心' } },
    { path: 'integration', name: 'merchant-integration', component: () => import('../../views/PortalPrototype/TabbedWorkspace.vue'), props: { kind: 'integration' }, meta: { title: '串接設定', center: '串接中心' } },

    { path: 'reports/daily', redirect: { path: '/merchant/reports', query: { tab: 'operations' } } },
    { path: 'reports/bet-query', redirect: '/merchant/betting/bets' },
    { path: 'betting/repairs', redirect: { path: '/merchant/betting/transactions', query: { status: 'exception' } } },
    { path: 'developer', redirect: { path: '/merchant/integration', query: { tab: 'api' } } },
    { path: 'developer/docs', redirect: { path: '/merchant/integration', query: { tab: 'api' } } },
    { path: 'developer/credentials', redirect: { path: '/merchant/integration', query: { tab: 'credentials' } } },
    { path: 'developer/callback-test', redirect: { path: '/merchant/integration', query: { tab: 'callbacks' } } },
    { path: 'developer/callback-logs', redirect: { path: '/merchant/integration', query: { tab: 'callbacks' } } }
  ]
}
