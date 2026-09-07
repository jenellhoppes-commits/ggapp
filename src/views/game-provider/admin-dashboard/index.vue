<template>
  <div class="dashboard-page">
    <AppPageHeader
      title="營運儀錶板"
      eyebrow="首頁"
      description="查看平台營運、串接狀態與待處理工作。"
    >
      <template #actions>
        <span class="updated-at">最後更新：{{ dashboardStore.refreshedAt }}</span>
        <ElButton :loading="refreshing" @click="refreshDashboard"
          ><ArtSvgIcon icon="ri:refresh-line" />重新整理</ElButton
        >
      </template>
    </AppPageHeader>

    <ElCard shadow="never" class="filter-card">
      <AppFilterForm class="filter-form" @submit.prevent="applyFilters">
        <ElFormItem label="日期範圍">
          <ElDatePicker
            :shortcuts="dateShortcuts"
            popper-class="report-date-picker"
            v-model="draft.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            value-format="YYYY-MM-DD"
            :clearable="false"
          />
        </ElFormItem>
        <ElFormItem label="原幣別">
          <ElSelect v-model="draft.currency" placeholder="選擇原幣別">
            <ElOption
              v-for="currency in dashboardStore.currencies"
              :key="currency"
              :label="currency"
              :value="currency"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem :label-width="0">
          <ElButton
            class="more-button"
            :aria-expanded="advancedOpen"
            aria-controls="dashboard-advanced-filters"
            @click="advancedOpen = !advancedOpen"
          >
            <ArtSvgIcon icon="ri:filter-3-line" />更多條件{{
              advancedCount ? `（${advancedCount}）` : ''
            }}
            <ArtSvgIcon :icon="advancedOpen ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" />
          </ElButton>
        </ElFormItem>
        <ElFormItem :label-width="0" class="filter-actions"
          ><ElButton type="primary" native-type="submit">查詢</ElButton
          ><ElButton @click="resetFilters">重置</ElButton></ElFormItem
        >
        <div v-if="advancedOpen" id="dashboard-advanced-filters" class="advanced-filters">
          <ElFormItem label="商戶"
            ><ElSelect v-model="draft.merchantId" clearable filterable placeholder="全部商戶"
              ><ElOption
                v-for="option in dashboardStore.merchantOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="供應商"
            ><ElSelect v-model="draft.providerId" clearable filterable placeholder="全部供應商"
              ><ElOption
                v-for="option in dashboardStore.providerOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value" /></ElSelect
          ></ElFormItem>
        </div>
      </AppFilterForm>
    </ElCard>

    <section v-loading="refreshing" class="dashboard-content" aria-live="polite">
      <div class="kpi-grid" aria-label="營運指標">
        <button
          v-for="metric in metrics"
          :key="metric.id"
          type="button"
          class="kpi-card"
          :aria-label="`${metric.label}：${metric.value}，${metric.note}`"
          @click="openMetric(metric.id)"
        >
          <span class="metric-heading"
            ><span>{{ metric.label }}</span
            ><ArtSvgIcon :icon="metric.icon"
          /></span>
          <strong :class="{ unavailable: !summary.available }">{{ metric.value }}</strong
          ><small>{{ metric.note }}</small>
        </button>
      </div>

      <div class="work-grid">
        <ElCard shadow="never" class="task-card">
          <template #header
            ><div class="section-title"
              ><div><strong>待處理工作</strong><span>依影響程度集中作業</span></div
              ><strong class="task-total">{{ pendingTotal }}</strong></div
            ></template
          >
          <div class="task-list">
            <button
              v-for="task in dashboardStore.tasks"
              :key="task.id"
              type="button"
              class="task-row"
              @click="go(task.path)"
            >
              <span class="task-icon" :class="task.tone"><ArtSvgIcon :icon="task.icon" /></span>
              <span class="task-copy"
                ><strong>{{ task.title }}</strong
                ><small>{{ task.note }}</small></span
              ><b :class="task.tone">{{ task.count }}</b
              ><ArtSvgIcon icon="ri:arrow-right-s-line" />
            </button>
          </div>
        </ElCard>

        <ElCard shadow="never" class="status-card">
          <template #header
            ><div class="section-title"
              ><div><strong>平台狀態</strong><span>影響營運判斷的最新狀態</span></div></div
            ></template
          >
          <div class="status-list">
            <div v-for="item in dashboardStore.platformStatuses" :key="item.id" class="status-row">
              <span class="status-icon" :class="item.tone"><ArtSvgIcon :icon="item.icon" /></span>
              <span
                ><small>{{ item.title }}</small
                ><strong>{{ item.value }}</strong
                ><em>{{ item.note }}</em></span
              >
            </div>
          </div>
        </ElCard>
      </div>

      <ElCard shadow="never" class="resource-card">
        <template #header
          ><div class="section-title"
            ><div><strong>聚合器資源摘要</strong><span>目前狀態，不受日期範圍影響</span></div></div
          ></template
        >
        <div class="resource-grid">
          <button
            v-for="resource in dashboardStore.resources"
            :key="resource.id"
            type="button"
            @click="go(resource.path)"
          >
            <span><ArtSvgIcon :icon="resource.icon" />{{ resource.title }}</span
            ><strong>{{ formatNumber(resource.value) }}</strong
            ><small>{{ resource.note }}</small>
          </button>
        </div>
      </ElCard>

      <ElCard shadow="never" class="recent-card">
        <template #header
          ><div class="section-title"
            ><div
              ><strong>最近資料更新與操作</strong
              ><span>最多顯示最近五筆；敏感內容不在儀錶板呈現</span></div
            ></div
          ></template
        >
        <div class="table-region">
          <ArtTable
            :data="dashboardStore.recentActions"
            row-key="id"
            empty-text="尚無可顯示的操作紀錄"
            height="auto"
            empty-height="auto"
            :show-table-header="false"
            style="height: auto"
          >
            <ElTableColumn prop="time" label="時間" min-width="170" /><ElTableColumn
              prop="target"
              label="對象"
              min-width="180"
              show-overflow-tooltip
            /><ElTableColumn
              prop="action"
              label="操作"
              min-width="180"
              show-overflow-tooltip
            /><ElTableColumn
              prop="result"
              label="結果"
              min-width="120"
              show-overflow-tooltip
            /><ElTableColumn prop="operator" label="操作人" min-width="140" />
            <ElTableColumn label="查看" width="82" fixed="right"
              ><template #default="scope"
                ><ElButton link type="primary" @click="go(scope.row.path)">來源</ElButton></template
              ></ElTableColumn
            > </ArtTable
          >>
        </div>
      </ElCard>
    </section>
  </div>
</template>

<script setup lang="ts">
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { ElMessage } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useAdminDashboardStore, type AdminDashboardQuery } from '@/store/modules/adminDashboard'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { createDateRangeShortcuts } from '@/utils/form/date-range-shortcuts'

  defineOptions({ name: 'GameProviderDashboard' })
  const route = useRoute()
  const router = useRouter()
  const dashboardStore = useAdminDashboardStore()
  const financeSettingsStore = useFinanceSettingsStore()
  const localeStore = usePlatformLocaleStore()
  const dateShortcuts = createDateRangeShortcuts(() => localeStore.defaultTimezone!.id)
  const advancedOpen = ref(false)
  const refreshing = ref(false)
  let refreshSequence = 0

  type DraftQuery = AdminDashboardQuery & { dateRange: [string, string] }
  const readRoute = (): DraftQuery => {
    const fallback = dashboardStore.sampleDate
    const from = /^\d{4}-\d{2}-\d{2}$/.test(String(route.query.from || ''))
      ? String(route.query.from)
      : fallback
    const to = /^\d{4}-\d{2}-\d{2}$/.test(String(route.query.to || ''))
      ? String(route.query.to)
      : fallback
    const requestedCurrency = String(route.query.currency || '')
    const currency = dashboardStore.currencies.includes(requestedCurrency)
      ? requestedCurrency
      : dashboardStore.currencies.includes('TWD')
        ? 'TWD'
        : dashboardStore.currencies[0] || ''
    const merchantId = dashboardStore.merchantOptions.some(
      (item) => item.value === route.query.merchant
    )
      ? String(route.query.merchant)
      : ''
    const providerId = dashboardStore.providerOptions.some(
      (item) => item.value === route.query.provider
    )
      ? String(route.query.provider)
      : ''
    return { from, to, currency, merchantId, providerId, dateRange: [from, to] }
  }
  const initial = readRoute()
  const draft = reactive<DraftQuery>({
    ...initial,
    dateRange: [...initial.dateRange] as [string, string]
  })
  const applied = reactive<AdminDashboardQuery>({
    from: initial.from,
    to: initial.to,
    currency: initial.currency,
    merchantId: initial.merchantId,
    providerId: initial.providerId
  })
  watch(
    () => route.fullPath,
    () => {
      if (route.path !== '/dashboard') return
      const next = readRoute()
      Object.assign(draft, next)
      Object.assign(applied, {
        from: next.from,
        to: next.to,
        currency: next.currency,
        merchantId: next.merchantId,
        providerId: next.providerId
      })
      advancedOpen.value = Boolean(next.merchantId || next.providerId)
    }
  )
  advancedOpen.value = Boolean(initial.merchantId || initial.providerId)
  const advancedCount = computed(
    () => Number(Boolean(draft.merchantId)) + Number(Boolean(draft.providerId))
  )
  const summary = computed(() => dashboardStore.getSummary(applied))
  const pendingTotal = computed(() =>
    dashboardStore.tasks.reduce((sum, item) => sum + item.count, 0)
  )
  const currencyPrecision = computed(
    () =>
      financeSettingsStore.currencies.find((item) => item.code === applied.currency)
        ?.decimalPlaces ?? 2
  )
  const metrics = computed(() => {
    const unavailable = !summary.value.available
    const note = summary.value.reason
    return [
      {
        id: 'bets',
        label: '下注筆數',
        value: unavailable ? '資料待確認' : formatNumber(summary.value.betCount),
        note,
        icon: 'ri:file-list-3-line'
      },
      {
        id: 'members',
        label: '投注人數',
        value: unavailable ? '資料待確認' : formatNumber(summary.value.memberCount),
        note,
        icon: 'ri:user-line'
      },
      {
        id: 'bet-amount',
        label: '投注金額',
        value: unavailable ? '資料待確認' : formatMoney(summary.value.betAmount),
        note,
        icon: 'ri:exchange-dollar-line'
      },
      {
        id: 'payout-amount',
        label: '派彩金額',
        value: unavailable ? '資料待確認' : formatMoney(summary.value.payoutAmount),
        note: unavailable ? note : '只計入已完成且關聯明確的派彩',
        icon: 'ri:money-dollar-circle-line'
      }
    ]
  })

  function formatNumber(value: number) {
    return new Intl.NumberFormat('zh-TW').format(value)
  }
  function formatMoney(value: number) {
    return `${new Intl.NumberFormat('zh-TW', { minimumFractionDigits: currencyPrecision.value, maximumFractionDigits: currencyPrecision.value }).format(value)} ${applied.currency}`
  }
  function queryFor(target: 'bets' | 'members' | 'reports') {
    const common: Record<string, string> = { currency: applied.currency }
    if (target !== 'members') Object.assign(common, { from: applied.from, to: applied.to })
    if (applied.merchantId) common.merchantId = applied.merchantId
    if (target === 'reports' && applied.providerId) common.providerId = applied.providerId
    return common
  }
  function openMetric(id: string) {
    if (id === 'bets') return router.push({ path: '/transactions/bets', query: queryFor('bets') })
    if (id === 'members')
      return router.push({ path: '/transactions/members', query: queryFor('members') })
    router.push({ path: '/business/reports', query: { tab: 'operations', ...queryFor('reports') } })
  }
  function go(target: string) {
    const resolved = router.resolve(target)
    router.push({ path: resolved.path, query: resolved.query })
  }
  function applyFilters() {
    const [from, to] = draft.dateRange || []
    if (!from || !to || !draft.currency) return ElMessage.warning('請選擇日期範圍與原幣別')
    if (from > to) return ElMessage.warning('開始日期不得晚於結束日期')
    Object.assign(applied, {
      from,
      to,
      currency: draft.currency,
      merchantId: draft.merchantId || undefined,
      providerId: draft.providerId || undefined
    })
    router.replace({
      path: '/dashboard',
      query: {
        from,
        to,
        currency: draft.currency,
        ...(draft.merchantId ? { merchant: draft.merchantId } : {}),
        ...(draft.providerId ? { provider: draft.providerId } : {})
      }
    })
    ElMessage.success('儀錶板已依條件更新')
  }
  function resetFilters() {
    const date = dashboardStore.sampleDate
    draft.dateRange = [date, date]
    draft.merchantId = ''
    draft.providerId = ''
    applyFilters()
  }
  async function refreshDashboard() {
    const sequence = ++refreshSequence
    refreshing.value = true
    await new Promise((resolve) => setTimeout(resolve, 400))
    if (sequence !== refreshSequence) return
    dashboardStore.refresh()
    refreshing.value = false
    ElMessage.success('儀錶板資料已重新整理')
  }

  onMounted(() => {
    if (!route.query.from || !route.query.to || !route.query.currency) {
      router.replace({
        path: '/dashboard',
        query: { from: applied.from, to: applied.to, currency: applied.currency }
      })
    }
  })
</script>

<style scoped>
  .dashboard-page,
  .dashboard-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .dashboard-page {
    padding-bottom: 24px;
  }
  .updated-at,
  .section-title span,
  .kpi-card small,
  .task-copy small,
  .status-row small,
  .status-row em,
  .resource-grid small {
    color: var(--art-gray-600);
  }
  .filter-form {
    display: grid;
    grid-template-columns: minmax(380px, 1.5fr) minmax(240px, 0.7fr) auto auto;
    gap: 12px;
    align-items: end;
  }
  .filter-form :deep(.el-form-item),
  .advanced-filters :deep(.el-form-item) {
    min-width: 0;
    margin: 0;
  }
  .filter-form :deep(.el-date-editor),
  .filter-form :deep(.el-select),
  .advanced-filters :deep(.el-select) {
    width: 100%;
  }
  .filter-actions :deep(.el-form-item__content) {
    flex-wrap: nowrap;
  }
  .more-button {
    width: 100%;
  }
  .advanced-filters {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding-top: 14px;
    margin-top: 14px;
    border-top: 1px solid var(--art-border-color);
  }
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .kpi-card {
    min-height: 132px;
    padding: 18px;
    overflow: hidden;
    text-align: left;
    cursor: pointer;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    transition:
      border-color 0.15s ease,
      transform 0.15s ease;
  }
  .kpi-card:hover,
  .kpi-card:focus-visible,
  .resource-grid button:hover,
  .resource-grid button:focus-visible {
    border-color: var(--el-color-primary);
    outline: 2px solid transparent;
  }
  .kpi-card:hover {
    transform: translateY(-1px);
  }
  .metric-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--art-gray-600);
  }
  .metric-heading .art-svg-icon {
    font-size: 21px;
    color: var(--el-color-primary);
  }
  .kpi-card > strong {
    display: block;
    margin: 12px 0 7px;
    overflow: hidden;
    font-size: clamp(20px, 2vw, 28px);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .kpi-card > strong.unavailable {
    font-size: 20px;
    color: var(--el-color-warning);
  }
  .work-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
    gap: 16px;
  }
  .section-title {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }
  .section-title strong,
  .section-title span {
    display: block;
  }
  .section-title span {
    margin-top: 4px;
    font-size: 13px;
  }
  .task-total {
    font-size: 24px;
    color: var(--el-color-warning);
  }
  .task-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 20px;
  }
  .task-row {
    display: grid;
    grid-template-columns: 38px minmax(0, 1fr) auto 18px;
    gap: 10px;
    align-items: center;
    min-height: 58px;
    padding: 9px 2px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--art-border-color);
  }
  .task-row:hover .task-copy strong,
  .task-row:focus-visible .task-copy strong {
    color: var(--el-color-primary);
  }
  .task-icon,
  .status-icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    background: var(--art-gray-100);
    border-radius: var(--el-border-radius-base);
  }
  .task-copy strong,
  .task-copy small {
    display: block;
  }
  .task-copy small {
    margin-top: 3px;
  }
  .task-row b {
    font-size: 18px;
  }
  .warning,
  .task-row b.warning {
    color: var(--el-color-warning);
  }
  .danger,
  .task-row b.danger {
    color: var(--el-color-danger);
  }
  .info,
  .task-row b.info {
    color: var(--art-gray-600);
  }
  .status-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  .status-row {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr);
    gap: 11px;
    align-items: start;
  }
  .status-row strong,
  .status-row small,
  .status-row em {
    display: block;
  }
  .status-row strong {
    margin: 3px 0;
    overflow-wrap: anywhere;
  }
  .status-row em {
    font-size: 12px;
    font-style: normal;
  }
  .status-icon.warning {
    color: var(--el-color-warning);
  }
  .resource-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
  }
  .resource-grid button {
    min-height: 112px;
    padding: 14px;
    text-align: left;
    cursor: pointer;
    background: var(--art-gray-100);
    border: 1px solid transparent;
    border-radius: var(--el-border-radius-base);
  }
  .resource-grid span,
  .resource-grid strong,
  .resource-grid small {
    display: block;
  }
  .resource-grid span {
    display: flex;
    gap: 7px;
    align-items: center;
  }
  .resource-grid strong {
    margin: 8px 0 4px;
    font-size: 25px;
  }
  .table-region {
    width: 100%;
    overflow-x: auto;
  }
  @media (width <= 1199px) {
    .filter-form {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .work-grid {
      grid-template-columns: 1fr;
    }
    .resource-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (width <= 767px) {
    .updated-at {
      width: 100%;
    }
    .filter-form,
    .advanced-filters {
      grid-template-columns: 1fr;
    }
    .filter-actions :deep(.el-form-item__content) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .filter-actions :deep(.el-button) {
      width: 100%;
      margin: 0;
    }
    .task-list {
      grid-template-columns: 1fr;
    }
    .task-row {
      min-height: 64px;
    }
  }
  @media (width <= 390px) {
    .kpi-grid,
    .resource-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
