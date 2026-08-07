import type { RouteRecordRaw } from 'vue-router'

export const merchantRoutes: RouteRecordRaw = {
  path: '/merchant',
  component: () => import('../../layouts/MerchantLayout.vue'),
  redirect: '/merchant/dashboard',
  meta: { requiresAuth: true, portal: 'merchant', allowedRoles: ['MERCHANT'] },
  children: [
    { path: 'dashboard', name: 'merchant-dashboard', component: () => import('../../views/Merchant/Dashboard/Index.vue'), meta: { title: '商戶總覽' } },
    { path: 'players', name: 'merchant-players', component: () => import('../../views/Merchant/Players/Index.vue'), meta: { title: '會員管理' } },
    { path: 'games', name: 'merchant-games', component: () => import('../../views/Merchant/Game/MyGames.vue'), meta: { title: '我的遊戲' } },
    { path: 'reports/daily', redirect: '/merchant/betting/bets' },
    { path: 'reports/bet-query', redirect: '/merchant/betting/bets' },
    { path: 'betting/bets', name: 'merchant-betting-bets', component: () => import('../../views/Merchant/Reports/BetQuery.vue'), meta: { title: '注單查詢' } },
    { path: 'betting/transactions', name: 'merchant-betting-transactions', component: () => import('../../views/Merchant/Betting/TransactionLedger.vue'), meta: { title: '交易流水' } },
    { path: 'betting/repairs', name: 'merchant-betting-repairs', component: () => import('../../views/Merchant/Betting/RepairJobs.vue'), meta: { title: '補單／重送' } },
    { path: 'finance/invoices', name: 'merchant-finance', component: () => import('../../views/Merchant/Finance/MyInvoices.vue'), meta: { title: '對代理帳務明細' } },
    { path: 'developer', redirect: '/merchant/developer/credentials' },
    { path: 'developer/docs', name: 'merchant-developer-docs', component: () => import('../../views/Merchant/Developer/ApiDocs.vue'), meta: { title: 'API 文件' } },
    { path: 'developer/credentials', name: 'DeveloperCenter', component: () => import('../../views/Merchant/Developer/Index.vue'), meta: { title: 'API 憑證／白名單' } },
    { path: 'developer/callback-test', name: 'merchant-callback-test', component: () => import('../../views/Merchant/Developer/CallbackTest.vue'), meta: { title: 'Callback 測試' } },
    { path: 'developer/callback-logs', name: 'merchant-callback-logs', component: () => import('../../views/Merchant/Developer/CallbackLogs.vue'), meta: { title: 'Callback 紀錄' } }
  ]
}
