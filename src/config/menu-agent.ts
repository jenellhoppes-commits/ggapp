import { h } from 'vue'
import type { Component } from 'vue'
import { RouterLink } from 'vue-router'
import type { MenuOption } from 'naive-ui'
import { NIcon } from 'naive-ui'
import { AccountBalanceWalletOutlined, BarChartOutlined, DashboardOutlined, PeopleAltOutlined } from '@vicons/material'

const icon = (component: Component) => () => h(NIcon, null, { default: () => h(component) })
const link = (to: string, label: string) => () => h(RouterLink, { to, title: label }, { default: () => label })

export const agentMenuOptions = (): MenuOption[] => [
  { type: 'group', label: '總覽', key: 'agent-overview', children: [
    { label: link('/agent/dashboard', '代理總覽'), key: 'agent-dashboard', icon: icon(DashboardOutlined) }
  ] },
  { type: 'group', label: '組織管理', key: 'agent-organization', children: [
    { label: link('/agent/merchants', '商戶管理'), key: 'agent-merchants', icon: icon(PeopleAltOutlined) },
    { label: link('/agent/organization/sub-agents', '下級代理'), key: 'agent-sub-agents', icon: icon(PeopleAltOutlined) }
  ] },
  { type: 'group', label: '財務中心', key: 'agent-finance', children: [
    { label: link('/agent/finance/accounting', '對帳與佣金'), key: 'agent-accounting', icon: icon(AccountBalanceWalletOutlined) }
  ] },
  { type: 'group', label: '報表中心', key: 'agent-reports-group', children: [
    { label: link('/agent/reports', '報表查詢'), key: 'agent-reports', icon: icon(BarChartOutlined) }
  ] }
]
