import { computed } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
import { reportDemoSource } from '@/mock/game-provider/report-four-tabs'
import type { ReportScope } from '@/domain/report-four-tabs'
import { usePlatformAccessStore } from '@/store/modules/platformAccess'
import { hasFinancialView } from '@/domain/report-financial-summary'

/** Demo-only policy; production must receive server-enforced grants and data scope. */
export function useReportFourTabs() {
  const user = useUserStore(),
    locale = usePlatformLocaleStore(),
    finance = useFinanceSettingsStore(),
    access = usePlatformAccessStore()
  const scope = computed<ReportScope>(() => {
    const allowed =
      user.isLogin && !!user.info.roles?.some((role) => ['R_SUPER', 'R_ADMIN'].includes(role))
    return {
      canView: allowed,
      canExport: allowed,
      canViewBets: allowed,
      environment: 'report-demo',
      merchantIds: allowed ? ['M1', 'M2'] : [],
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
  return { scope, source: reportDemoSource, lastCurrency, rememberCurrency, canViewFinancial }
}
