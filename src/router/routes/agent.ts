import type { RouteRecordRaw } from 'vue-router'

export const agentRoutes: RouteRecordRaw = {
  path: '/agent',
  component: () => import('../../layouts/UnifiedPortalLayout.vue'),
  redirect: '/agent/dashboard',
  meta: { requiresAuth: true, portal: 'agent', allowedRoles: ['AGENT'] },
  children: [
    { path: 'dashboard', name: 'agent-dashboard', component: () => import('../../views/PortalPrototype/Dashboard.vue'), props: { portal: 'agent' }, meta: { title: '代理總覽', center: '總覽' } },
    { path: 'merchants', name: 'agent-merchants', component: () => import('../../views/PortalPrototype/EntityList.vue'), props: { kind: 'agentMerchants' }, meta: { title: '商戶管理', center: '組織管理' } },
    { path: 'organization/sub-agents', name: 'agent-sub-agents', component: () => import('../../views/PortalPrototype/EntityList.vue'), props: { kind: 'subAgents' }, meta: { title: '下級代理', center: '組織管理' } },
    { path: 'finance/accounting', name: 'agent-accounting', component: () => import('../../views/PortalPrototype/TabbedWorkspace.vue'), props: { kind: 'agentAccounting' }, meta: { title: '對帳與佣金', center: '財務中心' } },
    { path: 'reports', name: 'agent-reports', component: () => import('../../views/PortalPrototype/TabbedWorkspace.vue'), props: { kind: 'agentReports' }, meta: { title: '報表查詢', center: '報表中心' } },

    { path: 'organization/sub-list', redirect: '/agent/organization/sub-agents' },
    { path: 'finance/invoices', redirect: { path: '/agent/finance/accounting', query: { tab: 'platform' } } },
    { path: 'reports/daily', redirect: { path: '/agent/reports', query: { tab: 'merchants' } } },
    { path: 'reports/win-loss', redirect: { path: '/agent/reports', query: { tab: 'sub-agents' } } },
    { path: 'reports/bet-query', redirect: { path: '/agent/reports', query: { tab: 'bets' } } },
    { path: 'reports/merchants', redirect: { path: '/agent/reports', query: { tab: 'merchants' } } },
    { path: 'reports/sub-agents', redirect: { path: '/agent/reports', query: { tab: 'sub-agents' } } },
    { path: 'reports/bet-trace', redirect: { path: '/agent/reports', query: { tab: 'bets' } } },
    { path: 'developer', redirect: '/agent/dashboard' }
  ]
}
