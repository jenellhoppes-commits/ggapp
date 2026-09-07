import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useBusinessPartnerStore } from './businessPartner'
import { useFinanceCenterStore } from './financeCenter'
import { useFinanceSettingsStore } from './financeSettings'
import { usePlatformOperationsStore } from './platformOperations'
import { useProviderDemoStore } from './providerDemo'
import { useTransactionCenterStore } from './transactionCenter'

export interface AdminDashboardQuery {
  from: string
  to: string
  currency: string
  merchantId?: string
  providerId?: string
}

export interface AdminDashboardSummary {
  available: boolean
  reason: string
  betCount: number
  memberCount: number
  betAmount: number
  payoutAmount: number
}

export interface AdminDashboardTask {
  id: string
  title: string
  count: number
  note: string
  tone: 'info' | 'warning' | 'danger'
  icon: string
  path: string
}

export interface AdminDashboardStatus {
  id: string
  title: string
  value: string
  note: string
  tone: 'normal' | 'warning'
  icon: string
}

export interface AdminDashboardResource {
  id: string
  title: string
  value: number
  note: string
  icon: string
  path: string
}

export interface AdminDashboardAction {
  id: string
  time: string
  target: string
  action: string
  result: string
  operator: string
  path: string
}

const DEMO_TODAY = '2026-09-05'
const DASHBOARD_VERSION = 'DEMO-20260905-01'
const round = (value: number) => Number(value.toFixed(2))
const displayTime = (value?: string) =>
  value
    ?.replace('T', ' ')
    .replace(/\.\d{3}Z$/, '')
    .replace(/Z$/, '') || '尚未提供'

export const useAdminDashboardStore = defineStore('adminDashboardStore', () => {
  const transactionStore = useTransactionCenterStore()
  const businessStore = useBusinessPartnerStore()
  const providerStore = useProviderDemoStore()
  const financeStore = useFinanceCenterStore()
  const financeSettingsStore = useFinanceSettingsStore()
  const platformOperationsStore = usePlatformOperationsStore()

  const refreshedAt = ref('2026-09-05 04:30')
  const version = ref(DASHBOARD_VERSION)
  const timezone = 'Asia/Taipei (UTC+8)'
  const environment = '開發演示'

  const currencies = computed(() =>
    [...new Set(transactionStore.bets.map((record) => record.currency))].sort()
  )
  const sampleDate = computed(
    () =>
      transactionStore.bets
        .map((record) => record.time.slice(0, 10))
        .sort()
        .at(-1) || DEMO_TODAY
  )
  const cutoffAt = computed(
    () =>
      transactionStore.bets
        .map((record) => record.time)
        .sort()
        .at(-1) || '尚未提供'
  )
  const merchantOptions = computed(() =>
    businessStore.merchants.map((merchant) => ({
      value: merchant.id,
      label: `${merchant.name}｜${merchant.code}`
    }))
  )
  const providerOptions = computed(() =>
    providerStore.state.providers.map((provider) => ({ value: provider.id, label: provider.name }))
  )

  const getSummary = (query: AdminDashboardQuery): AdminDashboardSummary => {
    const currencyRows = transactionStore.bets.filter(
      (record) => record.currency === query.currency
    )
    const coveredDates = currencyRows.map((record) => record.time.slice(0, 10))
    const firstDate = coveredDates.sort()[0]
    const lastDate = coveredDates.sort().at(-1)
    const available = Boolean(
      firstDate && lastDate && query.from <= lastDate! && query.to >= firstDate
    )
    if (!available)
      return {
        available: false,
        reason: `${query.currency} 的演示交易來源僅涵蓋 ${firstDate || '未知'} 至 ${lastDate || '未知'}`,
        betCount: 0,
        memberCount: 0,
        betAmount: 0,
        payoutAmount: 0
      }

    const providerByGame = new Map(
      providerStore.state.games.map((game) => [game.id, game.providerId] as const)
    )
    const rows = currencyRows.filter((record) => {
      const date = record.time.slice(0, 10)
      return (
        date >= query.from &&
        date <= query.to &&
        (!query.merchantId || record.merchantId === query.merchantId) &&
        (!query.providerId || providerByGame.get(record.gameId) === query.providerId) &&
        ['Settled', 'In Progress'].includes(record.status)
      )
    })
    const settledRows = rows.filter((record) => record.status === 'Settled')
    return {
      available: true,
      reason: rows.length ? '目前篩選範圍' : '本範圍無交易',
      betCount: new Set(rows.map((record) => record.id)).size,
      memberCount: new Set(rows.map((record) => `${record.merchantId}:${record.memberId}`)).size,
      betAmount: round(rows.reduce((total, record) => total + record.betAmount, 0)),
      payoutAmount: round(settledRows.reduce((total, record) => total + record.payoutAmount, 0))
    }
  }

  const tasks = computed<AdminDashboardTask[]>(() => {
    const state = providerStore.state
    const providerLineCount = state.providers.reduce(
      (total, provider) =>
        total +
        provider.lines.filter(
          (line) =>
            ['draft', 'testing', 'maintenance'].includes(line.config?.status || 'draft') ||
            provider.profile?.status === 'maintenance'
        ).length,
      0
    )
    const failedSyncs = (state.syncRuns || []).filter((run) =>
      ['partial', 'failed'].includes(run.status)
    ).length
    const merchantLines = businessStore.merchants.flatMap((merchant) => merchant.lines)
    const merchantIntegration = merchantLines.filter((line) => line.status !== 'Active').length
    const pendingTransactions = transactionStore.transactions.filter((record) =>
      ['Processing', 'Exception'].includes(record.status)
    ).length
    const pendingReconciliations = [
      ...financeStore.providerReconciliations,
      ...financeStore.merchantReconciliations,
      ...financeStore.agentReconciliations
    ].filter((record) => record.status === 'Pending Confirmation').length
    const missingRates = financeSettingsStore.rateSettings.filter(
      (setting) =>
        setting.status === 'Active' &&
        !financeSettingsStore.dailyRates.some(
          (rate) =>
            rate.date === DEMO_TODAY &&
            rate.toCurrency === setting.currency &&
            ['Published', 'Locked'].includes(rate.status)
        )
    ).length
    const dayStart = Date.parse(`${DEMO_TODAY}T00:00:00+08:00`)
    const maintenanceSoon = platformOperationsStore.maintenanceWindows.filter((item) => {
      const start = Date.parse(item.startAt.replace(' ', 'T') + '+08:00')
      return item.status === 'Scheduled' && start >= dayStart && start <= dayStart + 86400000
    }).length

    return [
      {
        id: 'provider-lines',
        title: '供應商線路待完成',
        count: providerLineCount,
        note: providerLineCount ? '待設定、測試中或維護中的線路' : '目前沒有待完成線路',
        tone: providerLineCount ? 'warning' : 'info',
        icon: 'ri:server-line',
        path: '/admin/providers'
      },
      {
        id: 'game-sync',
        title: '遊戲同步需處理',
        count: failedSyncs,
        note: failedSyncs ? '最近同步為部分失敗或失敗' : '目前沒有失敗同步',
        tone: failedSyncs ? 'danger' : 'info',
        icon: 'ri:refresh-line',
        path: '/admin/providers/games'
      },
      {
        id: 'integration',
        title: '商戶串接待完成',
        count: merchantIntegration,
        note: merchantIntegration ? '尚未符合啟用條件的商戶線路' : '所有商戶線路均已完成',
        tone: merchantIntegration ? 'warning' : 'info',
        icon: 'ri:links-line',
        path: '/business/merchants'
      },
      {
        id: 'transactions',
        title: '待處理交易',
        count: pendingTransactions,
        note: pendingTransactions ? '處理中或技術異常的交易' : '目前沒有待人工確認交易',
        tone: pendingTransactions ? 'danger' : 'info',
        icon: 'ri:file-warning-line',
        path: '/transactions/records'
      },
      {
        id: 'differences',
        title: '對帳差異',
        count: financeStore.unresolvedDifferences.length,
        note: financeStore.unresolvedDifferences.length ? '差異尚未完成處理' : '目前沒有未結差異',
        tone: financeStore.unresolvedDifferences.length ? 'danger' : 'info',
        icon: 'ri:scales-3-line',
        path: '/finance/reconciliation/differences'
      },
      {
        id: 'reconciliations',
        title: '待確認對帳',
        count: pendingReconciliations,
        note: pendingReconciliations ? '資料已具備，等待財務確認' : '目前沒有待確認對帳',
        tone: pendingReconciliations ? 'warning' : 'info',
        icon: 'ri:file-list-3-line',
        path: '/finance/reconciliation/providers'
      },
      {
        id: 'exchange-rates',
        title: '今日匯率未完成',
        count: missingRates,
        note: missingRates ? `${DEMO_TODAY} 尚未取得或鎖定` : '今日匯率已完成',
        tone: missingRates ? 'danger' : 'info',
        icon: 'ri:exchange-funds-line',
        path: '/platform/exchange-rates'
      },
      {
        id: 'maintenance',
        title: '即將維護',
        count: maintenanceSoon,
        note: maintenanceSoon ? '24 小時內有有效維護排程' : '24 小時內沒有維護排程',
        tone: maintenanceSoon ? 'warning' : 'info',
        icon: 'ri:tools-line',
        path: '/platform/maintenance'
      }
    ]
  })

  const platformStatuses = computed<AdminDashboardStatus[]>(() => {
    const latestSync = [...(providerStore.state.syncRuns || [])].sort((a, b) =>
      (b.finishedAt || b.startedAt).localeCompare(a.finishedAt || a.startedAt)
    )[0]
    const todayRates = financeSettingsStore.dailyRates.filter((rate) => rate.date === DEMO_TODAY)
    const nextMaintenance = platformOperationsStore.maintenanceWindows
      .filter((item) => item.status === 'Scheduled' && item.startAt.slice(0, 10) >= DEMO_TODAY)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))[0]
    return [
      {
        id: 'cutoff',
        title: '交易資料截止時間',
        value: cutoffAt.value,
        note: `資料版本 ${version.value}`,
        tone: 'normal',
        icon: 'ri:time-line'
      },
      {
        id: 'sync',
        title: '最近一次遊戲同步',
        value: latestSync
          ? ({ success: '成功', partial: '部分失敗', failed: '失敗', running: '同步中' } as const)[
              latestSync.status
            ]
          : '尚無同步紀錄',
        note: latestSync
          ? displayTime(latestSync.finishedAt || latestSync.startedAt)
          : '可由遊戲管理執行模擬同步',
        tone:
          latestSync && ['partial', 'failed'].includes(latestSync.status) ? 'warning' : 'normal',
        icon: 'ri:refresh-line'
      },
      {
        id: 'rate',
        title: '今日匯率取得／鎖定',
        value: todayRates.length ? `${todayRates.length} 個幣別已記錄` : '尚未完成',
        note: todayRates.length ? DEMO_TODAY : '不得沿用昨日匯率冒充今日結果',
        tone: todayRates.length ? 'normal' : 'warning',
        icon: 'ri:exchange-funds-line'
      },
      {
        id: 'maintenance',
        title: '下一個維護排程',
        value: nextMaintenance?.name || '目前沒有排程',
        note: nextMaintenance
          ? `${nextMaintenance.startAt} 至 ${nextMaintenance.endAt}`
          : '平台正常',
        tone: nextMaintenance ? 'warning' : 'normal',
        icon: 'ri:tools-line'
      }
    ]
  })

  const resources = computed<AdminDashboardResource[]>(() => {
    const state = providerStore.state
    const activeProviders = state.providers.filter(
      (provider) => provider.profile?.status === 'active'
    )
    const availableProviderLines = activeProviders.flatMap((provider) =>
      provider.lines.filter(
        (line) =>
          line.available &&
          line.config?.status === 'active' &&
          provider.integration?.currencies.includes(line.currency) &&
          provider.integration?.wallets.includes(line.config.wallet)
      )
    ).length
    const activeMerchants = businessStore.merchants.filter(
      (merchant) => merchant.status === 'Active'
    )
    const activeMerchantLines = (state.merchants || []).flatMap((merchant) =>
      merchant.active ? merchant.lines.filter((line) => line.active && line.games.length > 0) : []
    ).length
    const availableGames = state.games.filter((game) => {
      if (!game.active || game.sourceAvailable === false) return false
      const provider = activeProviders.find((item) => item.id === game.providerId)
      const providerLineReady = provider?.lines.some(
        (line) =>
          line.available &&
          line.config?.status === 'active' &&
          game.currencies.includes(line.currency)
      )
      const merchantGranted = (state.merchants || []).some(
        (merchant) =>
          merchant.active &&
          merchant.lines.some((line) => line.active && line.games.includes(game.id))
      )
      return providerLineReady && merchantGranted
    }).length
    return [
      {
        id: 'providers',
        title: '啟用供應商',
        value: activeProviders.length,
        note: '目前狀態',
        icon: 'ri:server-line',
        path: '/admin/providers'
      },
      {
        id: 'provider-lines',
        title: '可用供應商線路',
        value: availableProviderLines,
        note: '一般串接能力，不要求試玩',
        icon: 'ri:links-line',
        path: '/admin/providers'
      },
      {
        id: 'merchants',
        title: '啟用商戶',
        value: activeMerchants.length,
        note: '目前狀態',
        icon: 'ri:store-2-line',
        path: '/business/merchants'
      },
      {
        id: 'merchant-lines',
        title: '啟用商戶線路',
        value: activeMerchantLines,
        note: '具有授權交集',
        icon: 'ri:git-branch-line',
        path: '/business/merchants'
      },
      {
        id: 'games',
        title: '可用遊戲',
        value: availableGames,
        note: '遊戲、線路與授權均可用',
        icon: 'ri:gamepad-line',
        path: '/admin/providers/games'
      }
    ]
  })

  const recentActions = computed<AdminDashboardAction[]>(() => {
    const providers = providerStore.state.audit
      .filter((item) => /供應商|線路|同步/.test(item.action))
      .map((item, index) => ({
        id: `PROVIDER-${index}-${item.at}`,
        time: displayTime(item.at),
        target:
          providerStore.state.providers.find((provider) => provider.id === item.providerId)?.name ||
          item.providerId,
        action: item.action,
        result: item.action.includes('部分失敗')
          ? '部分失敗'
          : item.action.includes('失敗')
            ? '失敗'
            : '成功',
        operator: item.actor,
        path: '/admin/providers'
      }))
    const finance = financeStore.actionLogs
      .filter((item) => /對帳|結算|匯率/.test(item.action))
      .map((item) => ({
        id: item.id,
        time: item.time,
        target: item.entityId,
        action: item.action,
        result: item.after,
        operator: item.operator,
        path: '/finance/reconciliation/logs'
      }))
    const rates = financeSettingsStore.logs.map((item) => ({
      id: item.id,
      time: item.createdAt,
      target: item.target,
      action: item.action,
      result: item.afterValue,
      operator: item.operator,
      path: '/platform/exchange-rates?tab=history'
    }))
    const maintenance = platformOperationsStore.logs
      .filter((item) => item.module === 'Maintenance')
      .map((item) => ({
        id: item.id,
        time: item.createdAt,
        target: item.detail,
        action: item.action,
        result: '完成',
        operator: item.operator,
        path: '/platform/maintenance?tab=logs'
      }))
    return [...providers, ...finance, ...rates, ...maintenance]
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 5)
  })

  const refresh = () => {
    const now = new Date()
    refreshedAt.value = now
      .toLocaleString('sv-SE', { hour12: false })
      .replace('T', ' ')
      .slice(0, 16)
    version.value = `DEMO-${now.getTime()}`
  }

  return {
    environment,
    timezone,
    refreshedAt,
    version,
    currencies,
    sampleDate,
    cutoffAt,
    merchantOptions,
    providerOptions,
    tasks,
    platformStatuses,
    resources,
    recentActions,
    getSummary,
    refresh
  }
})
