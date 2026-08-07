import type { RouteRecordRaw } from 'vue-router'

export const adminRoutes: RouteRecordRaw = {
    path: '/admin',
    component: () => import('../../layouts/MasterLayout.vue'),
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, portal: 'admin', allowedRoles: ['MASTER'] },
    children: [
        { path: 'dashboard', name: 'admin-dashboard', component: () => import('../../views/Master/Dashboard/Overview.vue'), meta: { title: '儀錶板', center: '總覽' } },
        { path: 'reports', name: 'ReportCenter', component: () => import('../../views/Master/DataCenter/Report.vue'), meta: { title: '報表中心', center: '總覽' } },
        { path: 'data-center/report', redirect: '/admin/reports' },
        { path: 'merchant/list', name: 'merchant-list', component: () => import('../../views/Master/Merchant/List.vue'), meta: { title: '商戶管理', center: '商務管理' } },
        { path: 'merchant/create', redirect: { name: 'merchant-list', query: { create: '1' } } },
        {
            path: 'business/agents',
            name: 'AgentManagement',
            component: () => import('../../views/Master/Business/AgentManagement.vue'),
            meta: {
                title: '代理管理',
                center: '商務管理',
                description: '管理 L1 / L2 / L3 代理、商戶歸屬、代理費率與正式收款對象。'
            }
        },
        { path: 'business/contracts', redirect: '/admin/business/agents' },
        { path: 'game-center/providers', name: 'provider-list', component: () => import('../../views/Master/GameCenter/ProviderList.vue'), meta: { title: '供應商管理', center: '內容管理' } },
        { path: 'game-center/list', name: 'game-center', component: () => import('../../views/Master/GameCenter/GameList.vue'), meta: { title: '遊戲管理', center: '內容管理' } },
        { path: 'content/campaigns', name: 'Campaigns', component: () => import('../../views/Master/GameCenter/Campaigns.vue'), meta: { title: '獎池與活動', center: '內容管理' } },
        { path: 'transactions/players', name: 'PlayerManagement', component: () => import('../../views/Master/Transactions/PlayerManagement.vue'), meta: { title: '會員管理', center: '交易中心' } },
        { path: 'transactions/wallet-router', name: 'WalletRouter', component: () => import('../../views/Master/Transactions/WalletRouter.vue'), meta: { title: '錢包路由 / 轉帳錢包', center: '交易中心' } },
        { path: 'data-center/bet-log', redirect: '/admin/transactions/bets' },
        { path: 'transactions/bets', name: 'BetLog', component: () => import('../../views/Master/DataCenter/BetLog.vue'), meta: { title: '注單管理', center: '交易中心' } },
        { path: 'transactions/ledger', name: 'TransactionLedger', component: () => import('../../views/Master/Transactions/TransactionLedger.vue'), meta: { title: '交易流水', center: '交易中心' } },
        { path: 'transactions/repairs', name: 'RepairJobs', component: () => import('../../views/Master/Transactions/RepairJobs.vue'), meta: { title: '補單 / 重送', center: '交易中心' } },
        { path: 'finance/provider-accounting', name: 'ProviderAccounting', component: () => import('../../views/Master/Finance/ProviderAccounting.vue'), meta: { title: '供應商帳務', center: '財務中心' } },
        { path: 'finance/agent-accounting', name: 'AgentAccounting', component: () => import('../../views/Master/Finance/AgentAccounting.vue'), meta: { title: '代理帳務', center: '財務中心' } },
        { path: 'finance/platform-margin', name: 'PlatformMargin', component: () => import('../../views/Master/Finance/PlatformMargin.vue'), meta: { title: '平台毛利', center: '財務中心' } },
        { path: 'finance/funds', redirect: '/admin/finance/provider-accounting' },
        { path: 'finance/reconciliation', redirect: '/admin/finance/agent-accounting' },
        { path: 'finance/invoices', name: 'InvoiceManager', component: () => import('../../views/Master/Finance/InvoiceManager.vue'), meta: { title: '帳單管理', center: '財務中心' } },
        { path: 'finance/adjustments', name: 'Adjustments', component: () => import('../../views/Master/Finance/AdjustmentRecords.vue'), meta: { title: '調帳紀錄', center: '財務中心' } },
        { path: 'finance/exchange-rates', name: 'ExchangeRateManagement', component: () => import('../../views/Master/Finance/ExchangeRateManagement.vue'), meta: { title: '匯率管理', center: '財務中心' } },
        { path: 'quality/risk', name: 'RiskManagement', component: () => import('../../views/Master/Quality/RiskManagement.vue'), meta: { title: '風控管理', center: '品質中心' } },
        { path: 'quality/monitoring', name: 'MonitoringAlerts', component: () => import('../../views/Master/Quality/MonitoringAlerts.vue'), meta: { title: '監控告警', center: '品質中心' } },
        { path: 'quality/audit-logs', name: 'AuditLogs', component: () => import('../../views/Master/System/AuditLogs.vue'), meta: { title: '操作紀錄', center: '品質中心' } },
        { path: 'system/audit-logs', redirect: '/admin/quality/audit-logs' },
        { path: 'system/developer', name: 'AdminDeveloperCenter', component: () => import('../../views/Master/System/DeveloperCenter.vue'), meta: { title: '開發者中心', center: '系統管理' } },
        { path: 'system/settings', name: 'SystemSettings', component: () => import('../../views/Master/System/Settings.vue'), meta: { title: '系統設定', center: '系統管理' } },
        { path: 'system/staff', name: 'StaffList', component: () => import('../../views/Master/System/StaffList.vue'), meta: { title: '人員管理', center: '系統管理' } },
        { path: 'system/roles', name: 'JobLevelList', component: () => import('../../views/Master/System/JobLevelList.vue'), meta: { title: '角色權限', center: '系統管理' } },
        { path: 'system/job-levels', redirect: '/admin/system/roles' }
    ]
}
