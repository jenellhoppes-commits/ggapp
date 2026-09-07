<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NDatePicker,
  NIcon,
  NSelect,
  NSkeleton,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  ArrowForwardRound,
  CheckCircleOutlined,
  RefreshRound,
  WarningAmberOutlined
} from '@vicons/material'
import PageFilterBar from '../../../components/Common/PageFilterBar.vue'
import PageState from '../../../components/Common/PageState.vue'
import ResponsiveDataTable from '../../../components/Common/ResponsiveDataTable.vue'
import { adminDashboardService } from '../../../services/admin/dashboard'
import type {
  AdminDashboardData,
  AdminDashboardQuery,
  DashboardRecentAction,
  DashboardSectionState,
  DashboardTone
} from '../../../services/admin/dashboard'

const DEMO_DATE = '2026-09-04'
const route = useRoute()
const router = useRouter()
const message = useMessage()

const dateToTimestamp = (date: string) => Date.parse(`${date}T00:00:00+08:00`)
const timestampToDate = (timestamp: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date(timestamp))
const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)

const initialFrom = validDate(route.query.from) ? String(route.query.from) : DEMO_DATE
const initialTo = validDate(route.query.to) ? String(route.query.to) : DEMO_DATE

const draftRange = ref<[number, number]>([dateToTimestamp(initialFrom), dateToTimestamp(initialTo)])
const draftCurrency = ref(typeof route.query.currency === 'string' ? route.query.currency : 'TWD')
const draftMerchant = ref(typeof route.query.merchantId === 'string' ? route.query.merchantId : null)
const draftProvider = ref(typeof route.query.providerId === 'string' ? route.query.providerId : null)
const appliedQuery = ref<AdminDashboardQuery>({
  from: initialFrom,
  to: initialTo,
  currency: draftCurrency.value,
  merchantId: draftMerchant.value || undefined,
  providerId: draftProvider.value || undefined
})

const moreExpanded = ref(Boolean(draftMerchant.value || draftProvider.value))
const loading = ref(true)
const dashboard = ref<AdminDashboardData | null>(null)
const error = ref<{ message: string; traceId: string } | null>(null)
let requestSequence = 0

const currencyOptions = [{ label: 'TWD－新臺幣', value: 'TWD' }]
const merchantOptions = [
  { label: '全部商戶', value: '' },
  { label: 'Blue Whale（OP-1001）', value: 'OP-1001' },
  { label: 'Royal Ace（OP-1002）', value: 'OP-1002' }
]
const providerOptions = [
  { label: '全部供應商', value: '' },
  { label: 'Pragmatic Play（PV00001）', value: 'PV00001' },
  { label: 'Evolution（PV00002）', value: 'PV00002' }
]

const activeFilterSummary = computed(() => {
  const parts = [
    `${appliedQuery.value.from}～${appliedQuery.value.to}`,
    appliedQuery.value.currency
  ]
  if (appliedQuery.value.merchantId) parts.push(`商戶 ${appliedQuery.value.merchantId}`)
  if (appliedQuery.value.providerId) parts.push(`供應商 ${appliedQuery.value.providerId}`)
  return parts.join('、')
})

const sectionState = (key: string): DashboardSectionState => (
  dashboard.value?.sectionStatuses.find(item => item.key === key)?.state || 'unavailable'
)

const sectionReason = (key: string) => dashboard.value?.sectionStatuses.find(item => item.key === key)?.reason || ''

const formatMetric = (value: number | null, money = false) => {
  if (value == null) return '資料待確認'
  const formatted = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: money ? 2 : 0 }).format(value)
  return money ? `${formatted} ${appliedQuery.value.currency}` : formatted
}

const toneTagType = (tone: DashboardTone) => {
  if (tone === 'default') return 'default'
  return tone
}

const urgencyLabel = (urgency: 'high' | 'medium' | 'normal') => {
  if (urgency === 'high') return '優先'
  if (urgency === 'medium') return '注意'
  return '一般'
}

const urgencyType = (urgency: 'high' | 'medium' | 'normal') => {
  if (urgency === 'high') return 'error'
  if (urgency === 'medium') return 'warning'
  return 'info'
}

const commonTargetQuery = () => ({
  from: appliedQuery.value.from,
  to: appliedQuery.value.to,
  currency: appliedQuery.value.currency,
  ...(appliedQuery.value.merchantId ? { merchantId: appliedQuery.value.merchantId } : {}),
  ...(appliedQuery.value.providerId ? { providerId: appliedQuery.value.providerId } : {})
})

const openTarget = (target: string) => {
  const resolved = router.resolve(target)
  void router.push({ path: resolved.path, query: { ...resolved.query, ...commonTargetQuery() } })
}

const recentColumns: DataTableColumns<DashboardRecentAction> = [
  { title: '時間', key: 'operatedAt', width: 155 },
  { title: '對象', key: 'target', minWidth: 210 },
  { title: '操作', key: 'action', minWidth: 150 },
  {
    title: '結果',
    key: 'result',
    width: 110,
    render: row => h(NTag, { size: 'small', bordered: false, type: row.result === '完成' ? 'success' : 'warning' }, { default: () => row.result })
  },
  { title: '操作人', key: 'operator', width: 145 },
  {
    title: '操作',
    key: 'actions',
    width: 92,
    fixed: 'right',
    render: row => h(NButton, {
      size: 'small',
      secondary: true,
      'aria-label': `查看 ${row.target} 的操作來源`,
      onClick: () => openTarget(row.route)
    }, { default: () => '查看' })
  }
]

const syncUrl = () => router.replace({
  query: {
    ...route.query,
    from: appliedQuery.value.from,
    to: appliedQuery.value.to,
    currency: appliedQuery.value.currency,
    merchantId: appliedQuery.value.merchantId || undefined,
    providerId: appliedQuery.value.providerId || undefined
  }
})

const loadDashboard = async (announce = false) => {
  const requestId = ++requestSequence
  loading.value = true
  error.value = null

  try {
    if (route.query.ui === 'error') throw new Error('DEMO-DASHBOARD-ERROR')
    const response = await adminDashboardService.getOverview(appliedQuery.value)
    if (requestId !== requestSequence) return
    dashboard.value = response.data
    if (announce) message.success('儀錶板已更新')
  } catch {
    if (requestId !== requestSequence) return
    dashboard.value = null
    error.value = { message: '無法取得儀錶板資料，已保留目前查詢條件。', traceId: `DASH-${Date.now()}` }
  } finally {
    if (requestId === requestSequence) loading.value = false
  }
}

const applyFilters = async () => {
  const [from, to] = draftRange.value
  appliedQuery.value = {
    from: timestampToDate(from),
    to: timestampToDate(to),
    currency: draftCurrency.value,
    merchantId: draftMerchant.value || undefined,
    providerId: draftProvider.value || undefined
  }
  await syncUrl()
  await loadDashboard()
}

const resetFilters = async () => {
  draftRange.value = [dateToTimestamp(DEMO_DATE), dateToTimestamp(DEMO_DATE)]
  draftCurrency.value = 'TWD'
  draftMerchant.value = null
  draftProvider.value = null
  moreExpanded.value = false
  await applyFilters()
}

onMounted(async () => {
  await syncUrl()
  await loadDashboard()
})
</script>

<template>
  <div class="admin-dashboard page-stack">
    <header class="page-heading">
      <div>
        <p class="page-eyebrow">總覽</p>
        <h1>營運儀錶板</h1>
        <p>查看平台營運、串接狀態與待處理工作。</p>
      </div>
      <n-button type="primary" :loading="loading" aria-label="重新整理儀錶板" @click="loadDashboard(true)">
        <template #icon><n-icon :component="RefreshRound" /></template>
        重新整理
      </n-button>
    </header>

    <div class="dashboard-context" aria-label="儀錶板資料資訊">
      <n-tag type="warning" size="small" :bordered="false">開發演示</n-tag>
      <span>Asia/Taipei（UTC+8）</span>
      <span v-if="dashboard">資料版本 {{ dashboard.version }}</span>
      <span v-if="dashboard">截止 {{ new Date(dashboard.cutoffAt).toLocaleString('zh-TW') }}</span>
    </div>

    <PageFilterBar
      :show-search="false"
      show-more
      :more-expanded="moreExpanded"
      :active-filter-summary="activeFilterSummary"
      :loading="loading"
      @update:more-expanded="moreExpanded = $event"
      @search="applyFilters"
      @reset="resetFilters"
    >
      <template #filters>
        <label class="filter-field filter-field--wide">
          <span>日期範圍</span>
          <n-date-picker v-model:value="draftRange" type="daterange" :clearable="false" aria-label="日期範圍" />
        </label>
        <label class="filter-field">
          <span>原幣別</span>
          <n-select v-model:value="draftCurrency" :options="currencyOptions" aria-label="原幣別" />
        </label>
      </template>
      <template #more>
        <label class="filter-field">
          <span>商戶</span>
          <n-select v-model:value="draftMerchant" :options="merchantOptions" clearable aria-label="商戶" />
        </label>
        <label class="filter-field">
          <span>供應商</span>
          <n-select v-model:value="draftProvider" :options="providerOptions" clearable aria-label="供應商" />
        </label>
      </template>
    </PageFilterBar>

    <PageState
      v-if="error"
      kind="error"
      title="儀錶板載入失敗"
      :description="error.message"
      :trace-id="error.traceId"
      @retry="loadDashboard"
    />

    <template v-else>
      <section aria-labelledby="operation-heading">
        <div class="section-heading">
          <div><h2 id="operation-heading">營運指標</h2><p>同一資料版本、單一原幣別。</p></div>
        </div>
        <div class="dashboard-kpi-grid">
          <template v-if="loading && !dashboard">
            <n-card v-for="index in 4" :key="index" size="small"><n-skeleton text :repeat="3" /></n-card>
          </template>
          <button
            v-for="item in dashboard?.operationSummary || []"
            v-else
            :key="item.key"
            type="button"
            class="metric-card"
            :aria-label="`${item.label}：${formatMetric(item.value, item.money)}，前往查看`"
            @click="openTarget(item.route)"
          >
            <span class="metric-card__label">{{ item.label }}</span>
            <strong :class="{ 'metric-card__pending': item.value == null }">{{ formatMetric(item.value, item.money) }}</strong>
            <span>{{ item.note }}</span>
            <n-icon class="metric-card__arrow" :component="ArrowForwardRound" aria-hidden="true" />
          </button>
        </div>
      </section>

      <div class="dashboard-primary-grid">
        <section class="dashboard-section" aria-labelledby="pending-heading">
          <div class="section-heading">
            <div><h2 id="pending-heading">待處理工作</h2><p>依影響程度集中作業。</p></div>
          </div>
          <PageState v-if="loading && !dashboard" kind="loading" />
          <PageState v-else-if="!dashboard?.pendingItems.length" kind="empty" description="目前沒有待處理工作" compact />
          <div v-else class="task-list">
            <button
              v-for="item in dashboard.pendingItems"
              :key="item.id"
              type="button"
              class="task-row"
              :aria-label="`${item.label}，${item.count == null ? '尚未接入' : `${item.count} 項`}，${item.reason}`"
              @click="openTarget(item.route)"
            >
              <n-icon :component="item.urgency === 'normal' ? CheckCircleOutlined : WarningAmberOutlined" aria-hidden="true" />
              <span class="task-row__copy"><strong>{{ item.label }}</strong><small>{{ item.reason }}</small></span>
              <n-tag :type="urgencyType(item.urgency)" size="small" :bordered="false">{{ urgencyLabel(item.urgency) }}</n-tag>
              <span class="task-row__count">{{ item.count == null ? '尚未接入' : item.count }}</span>
              <n-icon :component="ArrowForwardRound" aria-hidden="true" />
            </button>
          </div>
        </section>

        <section class="dashboard-section" aria-labelledby="platform-heading">
          <div class="section-heading">
            <div><h2 id="platform-heading">平台狀態</h2><p>影響營運判斷的最新狀態。</p></div>
          </div>
          <n-alert v-if="sectionState('platform') === 'incomplete'" type="warning" :show-icon="true" class="mb-3">
            部分資料待確認：{{ sectionReason('platform') }}
          </n-alert>
          <PageState v-if="loading && !dashboard" kind="loading" />
          <dl v-else class="status-list">
            <div v-for="item in dashboard?.platformStatus || []" :key="item.key">
              <dt>{{ item.label }}</dt>
              <dd><n-tag :type="toneTagType(item.tone)" size="small" :bordered="false">{{ item.value }}</n-tag></dd>
              <small>{{ item.note }}</small>
            </div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="resource-heading">
        <div class="section-heading">
          <div><h2 id="resource-heading">聚合器資源摘要</h2><p>目前狀態，不受日期範圍影響。</p></div>
        </div>
        <div class="resource-grid">
          <button
            v-for="item in dashboard?.resourceSummary || []"
            :key="item.key"
            type="button"
            class="resource-card"
            :aria-label="`${item.label}：${item.value == null ? '尚未接入' : item.value}，前往查看`"
            @click="openTarget(item.route)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value == null ? '尚未接入' : item.value }}</strong>
            <small>{{ item.note }}</small>
          </button>
        </div>
      </section>

      <section class="dashboard-section" aria-labelledby="recent-heading">
        <div class="section-heading">
          <div><h2 id="recent-heading">最近資料更新與操作</h2><p>最多五筆；敏感內容不在儀錶板呈現。</p></div>
          <n-button text type="primary" @click="openTarget('/admin/system/audit-logs')">查看全部操作紀錄</n-button>
        </div>
        <PageState v-if="loading && !dashboard" kind="loading" />
        <template v-else>
          <ResponsiveDataTable
            class="recent-table"
            :columns="recentColumns"
            :data="dashboard?.recentActions || []"
            :scroll-x="900"
            :row-key="row => row.id"
          />
          <div class="recent-list">
            <button v-for="item in dashboard?.recentActions || []" :key="item.id" type="button" @click="openTarget(item.route)">
              <span><strong>{{ item.action }}</strong><small>{{ item.target }}</small></span>
              <span><n-tag size="small" :type="item.result === '完成' ? 'success' : 'warning'" :bordered="false">{{ item.result }}</n-tag><small>{{ item.operatedAt }}</small></span>
            </button>
          </div>
        </template>
      </section>
    </template>
  </div>
</template>
