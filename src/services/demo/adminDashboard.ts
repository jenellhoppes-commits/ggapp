import type { AdminDashboardData, AdminDashboardQuery } from '../admin/dashboard'

const SAMPLE_DATE = '2026-09-04'

export const createAdminDashboardDemo = (query: AdminDashboardQuery): AdminDashboardData => {
  const hasSample = query.from <= SAMPLE_DATE && query.to >= SAMPLE_DATE && query.currency === 'TWD'
  const scoped = Boolean(query.merchantId || query.providerId)

  return {
    version: 'DEMO-20260904-01',
    cutoffAt: '2026-09-04T18:29:00+08:00',
    updatedAt: '2026-09-04T18:30:00+08:00',
    timezone: 'Asia/Taipei',
    environment: 'demo',
    currency: query.currency,
    operationSummary: [
      { key: 'bet_count', label: '下注筆數', value: hasSample ? (scoped ? 18 : 126) : 0, note: hasSample ? '已成功受理且去重' : '本範圍無交易', route: '/admin/transactions/bets', sectionState: 'ok' },
      { key: 'player_count', label: '投注人數', value: hasSample ? (scoped ? 9 : 74) : 0, note: hasSample ? '依商戶與會員識別去重' : '本範圍無交易', route: '/admin/transactions/players', sectionState: 'ok' },
      { key: 'bet_amount', label: '投注金額', value: hasSample ? (scoped ? 32840 : 268420) : 0, note: hasSample ? '原幣金額，不跨幣別加總' : '本範圍無交易', route: '/admin/reports', money: true, sectionState: 'ok' },
      { key: 'payout_amount', label: '派彩金額', value: hasSample ? (scoped ? 21760 : 193840) : 0, note: hasSample ? '已成功且關聯明確的派彩' : '本範圍無交易', route: '/admin/reports', money: true, sectionState: 'ok' }
    ],
    pendingItems: [
      { id: 'provider-lines', label: '供應商線路待完成', count: 2, reason: '2 條測試線路尚未完成必要設定', urgency: 'high', route: '/admin/game-center/providers?lineStatus=pending' },
      { id: 'game-sync', label: '遊戲同步需處理', count: 1, reason: '最近同步有 1 個來源部分失敗', urgency: 'medium', route: '/admin/game-center/list?syncStatus=partial' },
      { id: 'merchant-integration', label: '商戶串接待完成', count: 3, reason: '商戶線路尚未通過啟用條件', urgency: 'high', route: '/admin/merchant/list?integrationStatus=pending' },
      { id: 'transactions', label: '待處理交易', count: 4, reason: '技術狀態需人工確認，非風控判斷', urgency: 'medium', route: '/admin/transactions/ledger?status=pending' },
      { id: 'reconciliation', label: '對帳差異', count: 2, reason: '差異尚未完成處理', urgency: 'high', route: '/admin/finance/provider-accounting?status=difference' },
      { id: 'exchange-rate', label: '今日匯率未完成', count: null, reason: '匯率來源尚未接入；不可沿用昨日結果', urgency: 'medium', route: '/admin/finance/provider-accounting?pane=exchange-rate' }
    ],
    platformStatus: [
      { key: 'cutoff', label: '交易資料截止時間', value: '2026-09-04 18:29', note: '與本頁 KPI 共用資料版本', tone: 'info' },
      { key: 'sync', label: '最近一次遊戲同步', value: '部分成功', note: '2026-09-04 17:48，需查看 1 個失敗來源', tone: 'warning' },
      { key: 'fx', label: '今日匯率取得／鎖定', value: '尚未驗證', note: '正式來源未接入', tone: 'warning' },
      { key: 'maintenance', label: '平台維護狀態', value: '未啟用', note: 'MVP 只支援立即開啟或解除維護', tone: 'success' }
    ],
    resourceSummary: [
      { key: 'providers', label: '啟用供應商', value: 7, note: '目前狀態', route: '/admin/game-center/providers?status=active' },
      { key: 'provider-lines', label: '可用供應商線路', value: 14, note: '一般串接能力，不要求試玩', route: '/admin/game-center/providers?lineStatus=available' },
      { key: 'merchants', label: '啟用商戶', value: 10, note: '目前狀態', route: '/admin/merchant/list?status=active' },
      { key: 'merchant-lines', label: '啟用商戶線路', value: 19, note: '具有至少一個授權交集', route: '/admin/merchant/list?lineStatus=available' },
      { key: 'games', label: '可用遊戲', value: 82, note: '遊戲、線路與授權均可用', route: '/admin/game-center/list?status=available' }
    ],
    recentActions: [
      { id: 'AUD-0904-018', operatedAt: '2026-09-04 18:12', target: 'Pragmatic Play / TWD', action: '更新線路狀態', result: '完成', operator: 'Operations One', route: '/admin/system/audit-logs' },
      { id: 'AUD-0904-017', operatedAt: '2026-09-04 17:48', target: '遊戲同步工作 SYNC-0904', action: '完成模擬同步', result: '部分成功', operator: 'System', route: '/admin/system/audit-logs' },
      { id: 'AUD-0904-016', operatedAt: '2026-09-04 16:35', target: 'Blue Whale / TWD', action: '啟用商戶線路', result: '完成', operator: 'Platform Owner', route: '/admin/system/audit-logs' },
      { id: 'AUD-0904-015', operatedAt: '2026-09-04 15:20', target: 'PR-202609-001', action: '確認供應商對帳', result: '完成', operator: 'Finance One', route: '/admin/system/audit-logs' },
      { id: 'AUD-0904-014', operatedAt: '2026-09-04 14:05', target: '平台維護模式', action: '解除維護', result: '完成', operator: 'Super Admin', route: '/admin/system/audit-logs' }
    ],
    sectionStatuses: [
      { key: 'operation', state: 'ok' },
      { key: 'pending', state: 'ok' },
      { key: 'platform', state: 'incomplete', reason: '匯率正式來源尚未接入' },
      { key: 'resources', state: 'ok' },
      { key: 'actions', state: 'ok' }
    ]
  }
}
