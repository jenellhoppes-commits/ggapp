import type { AdminDashboardData } from '../admin/dashboard'

export const adminDashboardDemo: AdminDashboardData = {
  updated_at: '2026-07-07T21:00:00+08:00',
  operation_kpis: [
    { label: '今日登入會員', value: '18,420', note: '較昨日 +8.7%', tone: 'success', tag: '活躍提升' },
    { label: '今日交易筆數', value: '42,906', note: 'Bet / Win / Refund / Rollback', tone: 'info', tag: 'USDT 快照' },
    { label: '錢包路由請求', value: '7,284', note: 'Seamless / Transfer Wallet', tone: 'default', tag: '雙錢包' },
    { label: '啟用商戶', value: 47, note: '含平台直營與代理商戶', tone: 'success', tag: '商戶' }
  ],
  finance_kpis: [
    { label: '代理應收', value: 279300, note: '正式收款對象為 L1 代理', tone: 'success', money: true },
    { label: '供應商應付', value: 162800, note: '供應商成本帳，與代理帳務分離', tone: 'warning', money: true },
    { label: '平台毛利', value: 81100, note: '代理最終應收 - 供應商應付 + 平台調整 - 其他成本', tone: 'success', money: true },
    { label: '匯率服務費', value: 3860, note: 'MVP 預設 0.5%', tone: 'info', money: true }
  ],
  trend_7d: [
    { date: '07/01', agent_receivable: 188200, provider_payable: 112400, platform_margin: 48200 },
    { date: '07/02', agent_receivable: 203100, provider_payable: 126900, platform_margin: 52100 },
    { date: '07/03', agent_receivable: 196500, provider_payable: 119800, platform_margin: 49800 },
    { date: '07/04', agent_receivable: 224800, provider_payable: 138200, platform_margin: 61200 },
    { date: '07/05', agent_receivable: 238400, provider_payable: 145700, platform_margin: 66800 },
    { date: '07/06', agent_receivable: 251900, provider_payable: 154600, platform_margin: 73600 },
    { date: '07/07', agent_receivable: 279300, provider_payable: 162800, platform_margin: 81100 }
  ],
  margin_breakdown: [
    { name: '代理與供應商差額', value: 77240 },
    { name: '匯率服務費', value: 3860 },
    { name: '調帳差異', value: -720 }
  ],
  action_items: [
    {
      id: 'RP-20260707-000011',
      source: '交易中心',
      type: 'Provider Pending',
      impact: 'USDT 87.45',
      owner: 'Ops',
      status: '待處理',
      route: '/admin/transactions/repairs'
    },
    {
      id: 'FX-20260707-THB',
      source: '財務中心',
      type: '匯率異常',
      impact: 'THB base_rate 波動 1.1%',
      owner: 'Finance',
      status: '需確認',
      route: '/admin/finance/exchange-rates'
    },
    {
      id: 'AS-202607-DIRECT',
      source: '代理帳務',
      type: '代理日結差異',
      impact: 'USDT 312.20',
      owner: 'Finance',
      status: '待覆核',
      route: '/admin/finance/agent-accounting'
    }
  ],
  provider_health: [
    { provider: 'PG Soft', status: 'healthy', latency_ms: 148, success_rate: 99.8 },
    { provider: 'Evolution', status: 'healthy', latency_ms: 221, success_rate: 99.4 },
    { provider: 'JILI Gaming', status: 'warning', latency_ms: 386, success_rate: 98.7 },
    { provider: 'Pragmatic Play', status: 'error', latency_ms: 920, success_rate: 96.9 }
  ],
  accounting_progress: [
    { module: '供應商帳務', pending: 3, difference: 1, locked: 4, done: 2 },
    { module: '代理帳務', pending: 2, difference: 1, locked: 5, done: 3 },
    { module: '平台毛利', pending: 1, difference: 0, locked: 3, done: 3 },
    { module: '匯率管理', pending: 2, difference: 1, locked: 5, done: 5 }
  ],
  quality_summary: {
    risk_events: 14,
    monitoring_alerts: 6,
    operation_anomalies: 2
  }
}
