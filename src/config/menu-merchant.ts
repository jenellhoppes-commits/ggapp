import { h } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import {
  AccountBalanceWalletOutlined,
  BarChartOutlined,
  CodeOutlined,
  DashboardOutlined,
  DescriptionOutlined,
  PeopleAltOutlined,
  SportsEsportsOutlined,
  SyncAltOutlined
} from '@vicons/material'

const icon = (component: Component) => () => h(NIcon, null, { default: () => h(component) })
const link = (to: string, label: string) => () => h(RouterLink, { to, title: label }, { default: () => label })

export const merchantMenuOptions = (): MenuOption[] => [
  { type: 'group', label: '總覽', key: 'merchant-overview', children: [
    { label: link('/merchant/dashboard', '商戶總覽'), key: 'merchant-dashboard', icon: icon(DashboardOutlined) }
  ] },
  { type: 'group', label: '營運管理', key: 'merchant-operations', children: [
    { label: link('/merchant/players', '會員查詢'), key: 'merchant-players', icon: icon(PeopleAltOutlined) },
    { label: link('/merchant/games', '我的遊戲'), key: 'merchant-games', icon: icon(SportsEsportsOutlined) }
  ] },
  { type: 'group', label: '交易中心', key: 'merchant-transactions', children: [
    { label: link('/merchant/betting/bets', '注單查詢'), key: 'merchant-betting-bets', icon: icon(DescriptionOutlined) },
    { label: link('/merchant/betting/transactions', '交易流水'), key: 'merchant-betting-transactions', icon: icon(SyncAltOutlined) }
  ] },
  { type: 'group', label: '財務中心', key: 'merchant-finance-group', children: [
    { label: link('/merchant/finance/invoices', '對帳與帳單'), key: 'merchant-finance', icon: icon(AccountBalanceWalletOutlined) }
  ] },
  { type: 'group', label: '報表中心', key: 'merchant-reports-group', children: [
    { label: link('/merchant/reports', '報表查詢'), key: 'merchant-reports', icon: icon(BarChartOutlined) }
  ] },
  { type: 'group', label: '串接中心', key: 'merchant-integration-group', children: [
    { label: link('/merchant/integration', '串接設定'), key: 'merchant-integration', icon: icon(CodeOutlined) }
  ] }
]
