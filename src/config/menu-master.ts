import { h } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
  AccountBalanceWalletOutlined,
  AdminPanelSettingsOutlined,
  BarChartOutlined,
  CasinoOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  PeopleAltOutlined,
  ReceiptLongOutlined,
  SettingsOutlined
} from '@vicons/material'

const renderIcon = (icon: Component) => () => h(NIcon, null, { default: () => h(icon) })
const renderLink = (to: string, label: string) => () => h(RouterLink, { to }, { default: () => label })

export const expandedMasterMenuKeys = [
  'business-group',
  'vendor-group',
  'transaction-group',
  'finance-group',
  'system-group',
  'staff-permission-group'
]

/**
 * 管理者總後台的唯一主導航。
 * MVP 決議要求：品質中心不進入第一版；財務中心只保留三種對帳入口。
 */
export const masterMenuOptions = (_t: (key: string) => string): MenuOption[] => [
  {
    label: renderLink('/admin/dashboard', '儀錶板'),
    key: 'admin-dashboard',
    icon: renderIcon(DashboardOutlined)
  },
  {
    label: '商務管理',
    key: 'business-group',
    icon: renderIcon(PeopleAltOutlined),
    children: [
      { label: renderLink('/admin/business/agents', '代理管理'), key: 'AgentManagement', icon: renderIcon(PeopleAltOutlined) },
      { label: renderLink('/admin/merchant/list', '商戶管理'), key: 'merchant-list', icon: renderIcon(PeopleAltOutlined) },
      { label: renderLink('/admin/transactions/players', '會員與錢包'), key: 'PlayerManagement', icon: renderIcon(AccountBalanceWalletOutlined) }
    ]
  },
  {
    label: '廠商管理',
    key: 'vendor-group',
    icon: renderIcon(CasinoOutlined),
    children: [
      { label: renderLink('/admin/game-center/providers', '供應商管理'), key: 'provider-list', icon: renderIcon(CasinoOutlined) },
      { label: renderLink('/admin/game-center/list', '遊戲管理'), key: 'game-center', icon: renderIcon(CasinoOutlined) }
    ]
  },
  {
    label: '交易中心',
    key: 'transaction-group',
    icon: renderIcon(BarChartOutlined),
    children: [
      { label: renderLink('/admin/transactions/bets', '注單管理'), key: 'BetLog', icon: renderIcon(DescriptionOutlined) },
      { label: renderLink('/admin/transactions/ledger', '交易流水'), key: 'TransactionLedger', icon: renderIcon(AccountBalanceWalletOutlined) }
    ]
  },
  {
    label: '財務中心',
    key: 'finance-group',
    icon: renderIcon(ReceiptLongOutlined),
    children: [
      { label: renderLink('/admin/finance/provider-accounting', '供應商對帳'), key: 'ProviderAccounting', icon: renderIcon(ReceiptLongOutlined) },
      { label: renderLink('/admin/finance/agent-accounting', '代理對帳'), key: 'AgentAccounting', icon: renderIcon(ReceiptLongOutlined) },
      { label: renderLink('/admin/finance/merchant-accounting', '商戶對帳'), key: 'MerchantAccounting', icon: renderIcon(ReceiptLongOutlined) }
    ]
  },
  {
    label: renderLink('/admin/reports', '報表查詢'),
    key: 'ReportCenter',
    icon: renderIcon(BarChartOutlined)
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
          { label: renderLink('/platform/access/accounts', '後台帳號'), key: 'AccessAccounts' },
          { label: renderLink('/platform/access/roles', '角色管理'), key: 'AccessRoles' },
          { label: renderLink('/platform/access/logs', '操作紀錄'), key: 'AccessLogs' }
        ]
      }
    ]
  }
]
