import { h } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
    AccountBalanceWalletOutlined,
    AdminPanelSettingsOutlined,
    AttachMoneyOutlined,
    BarChartOutlined,
    CasinoOutlined,
    DashboardOutlined,
    DescriptionOutlined,
    PeopleAltOutlined,
    SecurityOutlined,
    SettingsOutlined
} from '@vicons/material'

const renderIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) })
const renderLink = (to: string, label: string) => () => h(RouterLink, { to }, { default: () => label })

export const expandedMasterMenuKeys = [
    'overview-group',
    'business-group',
    'content-group',
    'transaction-group',
    'finance-group',
    'quality-group',
    'system-group',
    'staff-permission-group'
]

export const masterMenuOptions = (_t: (key: string) => string): MenuOption[] => [
    {
        label: '總覽',
        key: 'overview-group',
        icon: renderIcon(DashboardOutlined),
        children: [
            { label: renderLink('/admin/dashboard', '儀錶板'), key: 'admin-dashboard', icon: renderIcon(DashboardOutlined) },
            { label: renderLink('/admin/reports', '報表中心'), key: 'ReportCenter', icon: renderIcon(BarChartOutlined) }
        ]
    },
    {
        label: '商務管理',
        key: 'business-group',
        icon: renderIcon(PeopleAltOutlined),
        children: [
            { label: renderLink('/admin/merchant/list', '商戶管理'), key: 'merchant-list', icon: renderIcon(PeopleAltOutlined) },
            { label: renderLink('/admin/business/agents', '代理管理'), key: 'AgentManagement', icon: renderIcon(PeopleAltOutlined) }
        ]
    },
    {
        label: '內容管理',
        key: 'content-group',
        icon: renderIcon(CasinoOutlined),
        children: [
            { label: renderLink('/admin/game-center/providers', '供應商管理'), key: 'provider-list', icon: renderIcon(CasinoOutlined) },
            { label: renderLink('/admin/game-center/list', '遊戲管理'), key: 'game-center', icon: renderIcon(CasinoOutlined) },
            { label: renderLink('/admin/content/campaigns', '獎池與活動'), key: 'Campaigns', icon: renderIcon(CasinoOutlined) }
        ]
    },
    {
        label: '交易中心',
        key: 'transaction-group',
        icon: renderIcon(BarChartOutlined),
        children: [
            { label: renderLink('/admin/transactions/players', '會員管理'), key: 'PlayerManagement', icon: renderIcon(PeopleAltOutlined) },
            { label: renderLink('/admin/transactions/wallet-router', '錢包路由 / 轉帳錢包'), key: 'WalletRouter', icon: renderIcon(AccountBalanceWalletOutlined) },
            { label: renderLink('/admin/transactions/bets', '注單管理'), key: 'BetLog', icon: renderIcon(BarChartOutlined) },
            { label: renderLink('/admin/transactions/ledger', '交易流水'), key: 'TransactionLedger', icon: renderIcon(AccountBalanceWalletOutlined) },
            { label: renderLink('/admin/transactions/repairs', '補單 / 重送'), key: 'RepairJobs', icon: renderIcon(SecurityOutlined) }
        ]
    },
    {
        label: '財務中心',
        key: 'finance-group',
        icon: renderIcon(AccountBalanceWalletOutlined),
        children: [
            { label: renderLink('/admin/finance/provider-accounting', '供應商帳務'), key: 'ProviderAccounting', icon: renderIcon(AccountBalanceWalletOutlined) },
            { label: renderLink('/admin/finance/agent-accounting', '代理帳務'), key: 'AgentAccounting', icon: renderIcon(AttachMoneyOutlined) },
            { label: renderLink('/admin/finance/platform-margin', '平台毛利'), key: 'PlatformMargin', icon: renderIcon(DescriptionOutlined) },
            { label: renderLink('/admin/finance/adjustments', '調帳紀錄'), key: 'Adjustments', icon: renderIcon(AttachMoneyOutlined) },
            { label: renderLink('/admin/finance/exchange-rates', '匯率管理'), key: 'ExchangeRateManagement', icon: renderIcon(AttachMoneyOutlined) }
        ]
    },
    {
        label: '品質中心',
        key: 'quality-group',
        icon: renderIcon(SecurityOutlined),
        children: [
            { label: renderLink('/admin/quality/risk', '風控管理'), key: 'RiskManagement', icon: renderIcon(SecurityOutlined) },
            { label: renderLink('/admin/quality/monitoring', '監控告警'), key: 'MonitoringAlerts', icon: renderIcon(SecurityOutlined) },
            { label: renderLink('/admin/quality/audit-logs', '操作紀錄'), key: 'AuditLogs', icon: renderIcon(BarChartOutlined) }
        ]
    },
    {
        label: '系統管理',
        key: 'system-group',
        icon: renderIcon(SettingsOutlined),
        children: [
            { label: renderLink('/admin/system/developer', '開發者中心'), key: 'AdminDeveloperCenter', icon: renderIcon(DescriptionOutlined) },
            { label: renderLink('/admin/system/settings', '系統設定'), key: 'SystemSettings', icon: renderIcon(SettingsOutlined) },
            {
                label: '人員與權限',
                key: 'staff-permission-group',
                icon: renderIcon(AdminPanelSettingsOutlined),
                children: [
                    { label: renderLink('/admin/system/staff', '人員管理'), key: 'StaffList' },
                    { label: renderLink('/admin/system/roles', '角色權限'), key: 'JobLevelList' }
                ]
            }
        ]
    }
]
