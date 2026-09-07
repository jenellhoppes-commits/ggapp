<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NSelect,
  NTabPane,
  NTabs,
  NTag
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import PageFilterBar from '../../../components/Common/PageFilterBar.vue'
import PageState from '../../../components/Common/PageState.vue'
import ResponsiveDataTable from '../../../components/Common/ResponsiveDataTable.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type ReconciliationStatus = 'draft' | 'difference' | 'ready' | 'confirmed'

interface MerchantReconciliation {
  id: string
  merchantId: string
  merchantName: string
  period: string
  originalCurrency: string
  settlementCurrency: string
  cycle: string
  transactionCount: number
  status: ReconciliationStatus
  differenceCount: number
  updatedAt: string
}

const route = useRoute()
const router = useRouter()

const rows: MerchantReconciliation[] = [
  { id: 'MR-202609-0001', merchantId: 'OP-1001', merchantName: 'Blue Whale Interactive', period: '2026-09-01～2026-09-04', originalCurrency: 'TWD', settlementCurrency: 'TWD', cycle: '每月', transactionCount: 286, status: 'difference', differenceCount: 2, updatedAt: '2026-09-04 18:25' },
  { id: 'MR-202609-0002', merchantId: 'OP-1002', merchantName: 'Royal Ace Group', period: '2026-09-01～2026-09-04', originalCurrency: 'TWD', settlementCurrency: 'USD', cycle: '每月', transactionCount: 164, status: 'ready', differenceCount: 0, updatedAt: '2026-09-04 18:18' },
  { id: 'MR-202609-0003', merchantId: 'OP-1008', merchantName: 'NovaPlay Entertainment', period: '2026-09-01～2026-09-04', originalCurrency: 'THB', settlementCurrency: 'USD', cycle: '每週', transactionCount: 92, status: 'draft', differenceCount: 0, updatedAt: '2026-09-04 17:52' }
]

const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const status = ref(typeof route.query.status === 'string' ? route.query.status : null)
const currency = ref(typeof route.query.currency === 'string' ? route.query.currency : null)
const applied = ref({ keyword: keyword.value, status: status.value, currency: currency.value })
const activeRow = ref<MerchantReconciliation | null>(null)

const statusOptions = [
  { label: '全部狀態', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '有差異', value: 'difference' },
  { label: '待確認', value: 'ready' },
  { label: '已確認', value: 'confirmed' }
]
const currencyOptions = [{ label: '全部原幣別', value: '' }, { label: 'TWD', value: 'TWD' }, { label: 'THB', value: 'THB' }]

const statusMeta: Record<ReconciliationStatus, { label: string; type: 'default' | 'error' | 'warning' | 'success' }> = {
  draft: { label: '草稿', type: 'default' },
  difference: { label: '有差異', type: 'error' },
  ready: { label: '待確認', type: 'warning' },
  confirmed: { label: '已確認', type: 'success' }
}

const filteredRows = computed(() => rows.filter(row => {
  const normalized = applied.value.keyword.trim().toLocaleLowerCase()
  const matchesKeyword = !normalized || `${row.id} ${row.merchantId} ${row.merchantName}`.toLocaleLowerCase().includes(normalized)
  const matchesStatus = !applied.value.status || row.status === applied.value.status
  const matchesCurrency = !applied.value.currency || row.originalCurrency === applied.value.currency
  return matchesKeyword && matchesStatus && matchesCurrency
}))

const activeSummary = computed(() => {
  const values = []
  if (applied.value.keyword) values.push(`關鍵字 ${applied.value.keyword}`)
  if (applied.value.status) values.push(statusMeta[applied.value.status as ReconciliationStatus]?.label || applied.value.status)
  if (applied.value.currency) values.push(applied.value.currency)
  return values.join('、')
})

const openRow = (row: MerchantReconciliation) => {
  activeRow.value = row
  void router.replace({ query: { ...route.query, id: row.id } })
}

const closeDrawer = () => {
  activeRow.value = null
  const nextQuery = { ...route.query }
  delete nextQuery.id
  void router.replace({ query: nextQuery })
}

const applyFilters = () => {
  applied.value = { keyword: keyword.value, status: status.value, currency: currency.value }
  void router.replace({ query: { q: keyword.value || undefined, status: status.value || undefined, currency: currency.value || undefined } })
}

const resetFilters = () => {
  keyword.value = ''
  status.value = null
  currency.value = null
  applyFilters()
}

const columns: DataTableColumns<MerchantReconciliation> = withTableSorters([
  { title: '對帳編號', key: 'id', width: 165 },
  { title: '商戶', key: 'merchantName', minWidth: 220, render: row => h('div', [h('strong', row.merchantName), h('div', { class: 'text-xs text-gray-500' }, row.merchantId)]) },
  { title: '對帳期間', key: 'period', width: 205 },
  { title: '交易幣別', key: 'originalCurrency', width: 110 },
  { title: '結算幣別', key: 'settlementCurrency', width: 110 },
  { title: '週期', key: 'cycle', width: 90 },
  { title: '交易筆數', key: 'transactionCount', width: 110, align: 'right' },
  {
    title: '狀態',
    key: 'status',
    width: 110,
    render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false, size: 'small' }, { default: () => statusMeta[row.status].label })
  },
  {
    title: '操作',
    key: 'actions',
    width: 90,
    fixed: 'right',
    render: row => h(NButton, { size: 'small', secondary: true, 'aria-label': `查看 ${row.id}`, onClick: () => openRow(row) }, { default: () => '查看' })
  }
])

watch(() => route.query.id, id => {
  activeRow.value = typeof id === 'string' ? rows.find(row => row.id === id) || null : null
}, { immediate: true })
</script>

<template>
  <div class="page-stack">
    <header class="page-heading">
      <div><p class="page-eyebrow">財務中心</p><h1>商戶對帳</h1><p>依商戶既定週期核對原幣交易；結算幣別與正式計算須依合約與鎖定匯率。</p></div>
    </header>

    <PageFilterBar
      v-model:search-value="keyword"
      search-placeholder="商戶、代碼或對帳編號"
      :active-filter-summary="activeSummary"
      @search="applyFilters"
      @reset="resetFilters"
    >
      <template #filters>
        <label class="filter-field"><span>狀態</span><n-select v-model:value="status" :options="statusOptions" clearable /></label>
        <label class="filter-field"><span>交易幣別</span><n-select v-model:value="currency" :options="currencyOptions" clearable /></label>
      </template>
    </PageFilterBar>

    <section class="dashboard-section" aria-labelledby="merchant-reconciliation-heading">
      <div class="section-heading"><div><h2 id="merchant-reconciliation-heading">商戶對帳清單</h2><p>共 {{ filteredRows.length }} 筆；交易幣別與結算幣別分開顯示。</p></div></div>
      <PageState v-if="!filteredRows.length" kind="empty" description="沒有符合目前條件的商戶對帳" compact />
      <ResponsiveDataTable
        v-else
        :columns="columns"
        :data="filteredRows"
        :pagination="DEFAULT_TABLE_PAGINATION"
        :scroll-x="1220"
        :row-key="row => row.id"
      />
    </section>

    <n-drawer :show="Boolean(activeRow)" width="min(720px, calc(100vw - 16px))" @update:show="value => !value && closeDrawer()">
      <n-drawer-content :title="activeRow ? `商戶對帳 ${activeRow.id}` : '商戶對帳'" closable>
        <n-tabs v-if="activeRow" type="line" animated>
          <n-tab-pane name="summary" tab="對帳摘要">
            <n-descriptions bordered label-placement="left" :column="1">
              <n-descriptions-item label="商戶">{{ activeRow.merchantName }}（{{ activeRow.merchantId }}）</n-descriptions-item>
              <n-descriptions-item label="對帳期間">{{ activeRow.period }}</n-descriptions-item>
              <n-descriptions-item label="交易／結算幣別">{{ activeRow.originalCurrency }}／{{ activeRow.settlementCurrency }}</n-descriptions-item>
              <n-descriptions-item label="結算週期">{{ activeRow.cycle }}</n-descriptions-item>
              <n-descriptions-item label="交易筆數">{{ activeRow.transactionCount }}</n-descriptions-item>
              <n-descriptions-item label="差異筆數">{{ activeRow.differenceCount }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>
          <n-tab-pane name="differences" tab="差異處理">
            <PageState v-if="activeRow.differenceCount === 0" kind="empty" description="目前沒有待處理差異" compact />
            <n-alert v-else type="warning" :show-icon="true">尚有 {{ activeRow.differenceCount }} 筆差異；完成差異處理後才能進入正式確認。</n-alert>
          </n-tab-pane>
          <n-tab-pane name="settlement" tab="結算單">
            <n-alert type="info" :show-icon="true">本頁只顯示對帳來源。正式金額須在合約條件與當期匯率均已核准後才可產生。</n-alert>
          </n-tab-pane>
          <n-tab-pane name="logs" tab="操作紀錄">
            <PageState kind="empty" description="目前尚無操作紀錄" compact />
          </n-tab-pane>
        </n-tabs>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
