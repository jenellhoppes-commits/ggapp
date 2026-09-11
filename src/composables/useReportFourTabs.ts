import { computed, reactive, watchEffect } from 'vue'
import { twdReportExamples } from '@/domain/report-twd-examples'
import { useUserStore } from '@/store/modules/user'
import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
import type { ReportScope, ReportSource } from '@/domain/report-four-tabs'
import { useSettlementActivity } from './useSettlementActivity'
import { usePlatformAccessStore } from '@/store/modules/platformAccess'
import { hasFinancialView } from '@/domain/report-financial-summary'

/** Demo-only policy; production must receive server-enforced grants and data scope. */
export function useReportFourTabs() {
  const user = useUserStore(),
    locale = usePlatformLocaleStore(),
    finance = useFinanceSettingsStore(),
    access = usePlatformAccessStore()
  const activity = useSettlementActivity()
  const source = reactive<ReportSource>({
    version: 'transaction-center-v1',
    cutoff: '',
    bets: [],
    events: [],
    complete: true
  })
  watchEffect(() => {
    const rows = activity.rows.value.filter((r) => r.production)
    source.complete = rows.every((r) => !!r.providerId)
    source.bets = rows.map((r) => ({
      source: 'transaction-center',
      id: r.original.id,
      environment: 'production',
      merchantId: r.original.merchantId,
      merchantCode: r.original.merchantId,
      merchantName: r.original.merchantName,
      memberId: r.original.memberId,
      providerId: r.providerId || 'unknown',
      providerName: r.providerId || '供應商待對應',
      gameId: r.original.gameId,
      gameCode: r.original.gameCode,
      gameName: r.original.gameName,
      agent: r.original.agentId
        ? { id: r.original.agentId, code: r.original.agentId, name: r.original.agentName }
        : null,
      accepted: r.original.status !== 'Cancelled',
      time: r.original.betAt || r.original.time,
      currency: r.original.currency,
      amount: String(r.original.betAmount),
      roundId: r.original.roundId,
      payoutComplete: r.original.status === 'Settled'
    }))
    source.events = rows
      .filter((r) => r.original.status === 'Settled')
      .map((r) => ({
        source: 'transaction-center',
        id: r.original.id + '-payout',
        environment: 'production',
        merchantId: r.original.merchantId,
        providerId: r.providerId || 'unknown',
        type: 'payout',
        success: true,
        time: r.original.settledAt || r.original.betAt || r.original.time,
        currency: r.original.currency,
        amount: String(r.original.payoutAmount),
        betKeys: [
          JSON.stringify(['transaction-center', 'production', r.original.merchantId, r.original.id])
        ],
        relationComplete: true,
        roundId: r.original.roundId
      }))
    const examples = twdReportExamples(source.bets, source.events)
    source.bets.push(...examples.bets)
    source.events.push(...examples.events)
    source.cutoff = new Date().toISOString()
  })
  const scope = computed<ReportScope>(() => {
    const allowed =
      user.isLogin && !!user.info.roles?.some((role) => ['R_SUPER', 'R_ADMIN'].includes(role))
    return {
      canView: allowed,
      canExport: allowed,
      canViewBets: allowed,
      environment: 'production',
      merchantIds: allowed ? [...new Set(source.bets.map((b) => b.merchantId))] : [],
      timezone: locale.defaultTimezone?.id || '',
      currencies: Object.fromEntries(
        finance.currencies
          .filter((c) => c.status === 'Active' && c.transactionEnabled)
          .map((c) => [c.code, c.decimalPlaces])
      )
    }
  })
  const currencyKey = computed(() => `ggap-r4t-currency-${String(user.info.userId || 'unknown')}`)
  const lastCurrency = () => {
    try {
      const value = localStorage.getItem(currencyKey.value) || ''
      return value in scope.value.currencies ? value : ''
    } catch {
      return ''
    }
  }
  const rememberCurrency = (value: string) => {
    if (value in scope.value.currencies)
      try {
        localStorage.setItem(currencyKey.value, value)
      } catch {
        /* Storage optional. */
      }
  }
  const canViewFinancial = computed(
    () =>
      scope.value.canView &&
      hasFinancialView(user.info.roles || [], access.roles, access.permissions)
  )
  return { scope, source, lastCurrency, rememberCurrency, canViewFinancial }
}
