<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NAlert,
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NInput,
  NSelect,
  NSpace,
  NStatistic,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type RateStatus = 'published' | 'confirmed' | 'locked' | 'warning' | 'failed'

interface RateSnapshot {
  snapshot_id: string
  merchant_id: string
  display_currency: string
  display_amount: number
  settlement_amount: number
  locked_at: string
}

interface OperationLog {
  action: string
  operator: string
  operated_at: string
  trace_id: string
  note: string
}

interface ExchangeRateRow {
  rate_id: string
  rate_date: string
  display_currency: string
  settlement_currency: 'USDT'
  base_rate: number
  previous_base_rate: number
  service_fee_rate: number
  source: string
  fetched_at: string
  confirmed_at?: string
  confirmed_by?: string
  locked_at?: string
  locked_by?: string
  status: RateStatus
  transaction_count: number
  version: number
  alert?: string
  snapshots: RateSnapshot[]
  logs: OperationLog[]
}

const message = useMessage()
const searchText = ref('')
const statusFilter = ref<RateStatus | null>(null)
const showDetail = ref(false)
const activeTab = ref('basic')
const currentRow = ref<ExchangeRateRow | null>(null)

const nowIso = () => new Date().toISOString()
const buildLog = (action: string, note: string): OperationLog => ({
  action,
  operator: 'Finance',
  operated_at: nowIso(),
  trace_id: `trace-fx-${Date.now()}`,
  note
})

const rows = ref<ExchangeRateRow[]>([
  {
    rate_id: 'FX-20260706-TWD',
    rate_date: '2026-07-06',
    display_currency: 'TWD',
    settlement_currency: 'USDT',
    base_rate: 31.72,
    previous_base_rate: 31.66,
    service_fee_rate: 0.005,
    source: 'Third Party FX API',
    fetched_at: '2026-07-06T00:00:04+08:00',
    confirmed_at: '2026-07-06T00:18:00+08:00',
    confirmed_by: 'System',
    locked_at: '2026-07-07T00:05:00+08:00',
    locked_by: 'Settlement Engine',
    status: 'locked',
    transaction_count: 12840,
    version: 1,
    snapshots: [
      { snapshot_id: 'FXS-TWD-0001', merchant_id: 'OP-1001', display_currency: 'TWD', display_amount: 3200, settlement_amount: 100.8827, locked_at: '2026-07-07T00:05:00+08:00' },
      { snapshot_id: 'FXS-TWD-0002', merchant_id: 'OP-1008', display_currency: 'TWD', display_amount: 5400, settlement_amount: 170.2396, locked_at: '2026-07-07T00:05:00+08:00' }
    ],
    logs: [
      { action: '取得公告匯率', operator: 'System', operated_at: '2026-07-06T00:00:04+08:00', trace_id: 'trace-fx-twd-fetch', note: 'base_rate = 31.72' },
      { action: '日結鎖定匯率', operator: 'Settlement Engine', operated_at: '2026-07-07T00:05:00+08:00', trace_id: 'trace-fx-twd-lock', note: '鎖定交易快照' }
    ]
  },
  {
    rate_id: 'FX-20260706-PHP',
    rate_date: '2026-07-06',
    display_currency: 'PHP',
    settlement_currency: 'USDT',
    base_rate: 58.64,
    previous_base_rate: 58.52,
    service_fee_rate: 0.005,
    source: 'Third Party FX API',
    fetched_at: '2026-07-06T00:00:05+08:00',
    locked_at: '2026-07-07T00:05:00+08:00',
    locked_by: 'Settlement Engine',
    status: 'locked',
    transaction_count: 9320,
    version: 1,
    snapshots: [
      { snapshot_id: 'FXS-PHP-0001', merchant_id: 'OP-1006', display_currency: 'PHP', display_amount: 1800, settlement_amount: 30.6958, locked_at: '2026-07-07T00:05:00+08:00' }
    ],
    logs: [
      { action: '取得公告匯率', operator: 'System', operated_at: '2026-07-06T00:00:05+08:00', trace_id: 'trace-fx-php-fetch', note: 'base_rate = 58.64' },
      { action: '日結鎖定匯率', operator: 'Settlement Engine', operated_at: '2026-07-07T00:05:00+08:00', trace_id: 'trace-fx-php-lock', note: '鎖定交易快照' }
    ]
  },
  {
    rate_id: 'FX-20260707-THB',
    rate_date: '2026-07-07',
    display_currency: 'THB',
    settlement_currency: 'USDT',
    base_rate: 36.41,
    previous_base_rate: 36.32,
    service_fee_rate: 0.005,
    source: 'Third Party FX API',
    fetched_at: '2026-07-07T00:00:03+08:00',
    status: 'published',
    transaction_count: 4180,
    version: 1,
    snapshots: [
      { snapshot_id: 'FXS-THB-0001', merchant_id: 'OP-1008', display_currency: 'THB', display_amount: 3200, settlement_amount: 87.45, locked_at: 'Session rate_locked_at' }
    ],
    logs: [
      { action: '取得公告匯率', operator: 'System', operated_at: '2026-07-07T00:00:03+08:00', trace_id: 'trace-fx-thb-fetch', note: '等待確認與日結鎖定' }
    ]
  },
  {
    rate_id: 'FX-20260707-VND',
    rate_date: '2026-07-07',
    display_currency: 'VND',
    settlement_currency: 'USDT',
    base_rate: 26320,
    previous_base_rate: 25100,
    service_fee_rate: 0.005,
    source: 'Third Party FX API',
    fetched_at: '2026-07-07T00:00:08+08:00',
    status: 'warning',
    transaction_count: 0,
    version: 1,
    alert: '較前一日波動超過 3%',
    snapshots: [],
    logs: [
      { action: '取得公告匯率', operator: 'System', operated_at: '2026-07-07T00:00:08+08:00', trace_id: 'trace-fx-vnd-fetch', note: '觸發波動告警' }
    ]
  },
  {
    rate_id: 'FX-20260707-IDR',
    rate_date: '2026-07-07',
    display_currency: 'IDR',
    settlement_currency: 'USDT',
    base_rate: 16320,
    previous_base_rate: 16295,
    service_fee_rate: 0.005,
    source: 'Third Party FX API',
    fetched_at: '2026-07-07T00:00:11+08:00',
    status: 'failed',
    transaction_count: 0,
    version: 1,
    alert: '第三方 API 回傳校驗失敗',
    snapshots: [],
    logs: [
      { action: '取得公告匯率失敗', operator: 'System', operated_at: '2026-07-07T00:00:11+08:00', trace_id: 'trace-fx-idr-failed', note: '等待重抓' }
    ]
  }
])

const statusOptions = [
  { label: '已公告', value: 'published' },
  { label: '已確認', value: 'confirmed' },
  { label: '已鎖定', value: 'locked' },
  { label: '異常告警', value: 'warning' },
  { label: '抓取失敗', value: 'failed' }
]

const statusMeta: Record<RateStatus, { label: string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  published: { label: '已公告', type: 'info' },
  confirmed: { label: '已確認', type: 'success' },
  locked: { label: '已鎖定', type: 'success' },
  warning: { label: '異常告警', type: 'warning' },
  failed: { label: '抓取失敗', type: 'error' }
}

const formatRate = (value: number, currency: string) => {
  if (currency === 'VND' || currency === 'IDR') return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
  return value.toFixed(4)
}
const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'
const variationPercent = (row: ExchangeRateRow) => row.previous_base_rate ? (row.base_rate - row.previous_base_rate) / row.previous_base_rate : 0

const filteredRows = computed(() => rows.value.filter((row) => {
  const keyword = searchText.value.trim().toLowerCase()
  const inKeyword = !keyword
    || row.rate_id.toLowerCase().includes(keyword)
    || row.display_currency.toLowerCase().includes(keyword)
    || row.source.toLowerCase().includes(keyword)
  const inStatus = !statusFilter.value || row.status === statusFilter.value
  return inKeyword && inStatus
}))

const summary = computed(() => ({
  total: filteredRows.value.length,
  locked: filteredRows.value.filter(row => row.status === 'locked').length,
  warning: filteredRows.value.filter(row => row.status === 'warning').length,
  failed: filteredRows.value.filter(row => row.status === 'failed').length
}))

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = null
}

const openDetail = (row: ExchangeRateRow, tab = 'basic') => {
  currentRow.value = row
  activeTab.value = tab
  showDetail.value = true
}

const confirmWarning = (row: ExchangeRateRow) => {
  if (row.status !== 'warning') return
  row.status = 'confirmed'
  row.confirmed_at = nowIso()
  row.confirmed_by = 'Finance Manager'
  row.alert = '已人工確認波動，允許後續日結鎖定'
  row.logs.unshift(buildLog('人工確認匯率告警', '確認波動合理'))
  message.success(`${row.rate_id} 已確認`)
}

const retryFailedRate = (row: ExchangeRateRow) => {
  if (row.status !== 'failed') return
  row.previous_base_rate = row.base_rate
  row.base_rate = Number((row.base_rate * 1.0008).toFixed(6))
  row.fetched_at = nowIso()
  row.version += 1
  row.status = 'published'
  row.alert = undefined
  row.logs.unshift(buildLog('重抓公告匯率', 'API 回傳成功'))
  message.success(`${row.rate_id} 已重抓成功`)
}

const lockRate = (row: ExchangeRateRow) => {
  if (row.status === 'locked') {
    message.info(`${row.rate_id} 已鎖定`)
    return
  }
  if (row.status === 'warning' || row.status === 'failed') {
    message.warning('異常或失敗匯率不可鎖定')
    return
  }
  row.status = 'locked'
  row.locked_at = nowIso()
  row.locked_by = 'Finance'
  row.logs.unshift(buildLog('鎖定匯率', 'base_rate 與交易快照已鎖定；服務費獨立計算'))
  message.success(`${row.rate_id} 已鎖定`)
}

const refreshRates = () => {
  const unlockedRows = rows.value.filter(row => row.status !== 'locked')
  unlockedRows.forEach((row, index) => {
    if (row.status === 'failed') return
    row.previous_base_rate = row.base_rate
    row.base_rate = Number((row.base_rate * (1 + (index + 1) * 0.0004)).toFixed(6))
    row.fetched_at = nowIso()
    row.version += 1
    row.status = Math.abs(variationPercent(row)) > 0.03 ? 'warning' : 'published'
    row.alert = row.status === 'warning' ? '匯率波動超過 3%，需人工確認' : undefined
    row.logs.unshift(buildLog('重抓公告匯率', `從 v${row.version - 1} 更新至 v${row.version}`))
  })
  message.success(`已更新 ${unlockedRows.length} 筆未鎖定匯率`)
}

const exportRates = () => {
  message.success(`已匯出 ${filteredRows.value.length} 筆匯率資料`)
}

const snapshotColumns: DataTableColumns<RateSnapshot> = [
  { title: '快照 ID', key: 'snapshot_id', width: 150 },
  { title: '商戶', key: 'merchant_id', width: 110 },
  { title: '交易原幣', key: 'display_currency', width: 100 },
  { title: '原幣金額', key: 'display_amount', align: 'right', render: row => row.display_amount.toLocaleString() },
  { title: 'USDT 金額', key: 'settlement_amount', align: 'right', render: row => h(MoneyText, { value: row.settlement_amount, currency: 'USDT', color: 'text-slate-100' }) },
  { title: '鎖定時間', key: 'locked_at', width: 180, render: row => formatDateTime(row.locked_at) }
]

const columns: DataTableColumns<ExchangeRateRow> = [
  {
    title: '匯率 ID',
    key: 'rate_id',
    width: 180,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-400', onClick: () => openDetail(row) }, row.rate_id)
  },
  { title: '日期', key: 'rate_date', width: 120 },
  { title: '交易原幣', key: 'display_currency', width: 110, render: row => h(NTag, { bordered: false }, { default: () => row.display_currency }) },
  { title: '結算幣別', key: 'settlement_currency', width: 110, render: row => h(NTag, { type: 'success', bordered: false }, { default: () => row.settlement_currency }) },
  { title: 'base_rate', key: 'base_rate', width: 130, align: 'right', render: row => formatRate(row.base_rate, row.display_currency) },
  { title: '波動', key: 'variation', width: 110, align: 'right', render: row => h('span', { class: Math.abs(variationPercent(row)) > 0.03 ? 'text-amber-400' : 'text-slate-300' }, formatPercent(variationPercent(row))) },
  { title: '服務費快照', key: 'service_fee_rate', width: 130, align: 'right', render: row => formatPercent(row.service_fee_rate) },
  { title: '交易數', key: 'transaction_count', width: 110, align: 'right', render: row => row.transaction_count.toLocaleString() },
  { title: '版本', key: 'version', width: 80, align: 'center', render: row => `v${row.version}` },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false, size: 'small' }, { default: () => statusMeta[row.status].label }) },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { default: () => '查看' }),
        row.status === 'warning' ? h(NButton, { size: 'small', type: 'warning', secondary: true, onClick: () => confirmWarning(row) }, { default: () => '確認' }) : null,
        row.status === 'failed' ? h(NButton, { size: 'small', type: 'primary', secondary: true, onClick: () => retryFailedRate(row) }, { default: () => '重抓' }) : null,
        row.status !== 'locked' ? h(NButton, { size: 'small', type: 'primary', secondary: true, disabled: row.status === 'warning' || row.status === 'failed', onClick: () => lockRate(row) }, { default: () => '鎖定' }) : null,
        h(NButton, { size: 'small', tertiary: true, onClick: () => openDetail(row, 'logs') }, { default: () => '紀錄' })
      ].filter(Boolean)
    })
  }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">匯率管理</h1>
        <p class="mt-1 text-sm text-gray-500">
          Asia/Taipei 00:00 關帳、00:05 鎖定交易日公告匯率、00:10 執行前一日帳期日結；歷史交易不因後續匯率更新重算。
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <n-button secondary @click="exportRates">匯出</n-button>
        <n-button type="primary" @click="refreshRates">重抓公告匯率</n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="匯率總數" :value="summary.total" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="已鎖定" :value="summary.locked" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="異常告警" :value="summary.warning" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="抓取失敗" :value="summary.failed" />
      </div>
    </div>

    <n-alert type="info" :show-icon="false">
      USDT 換算只使用 base_rate；服務費另列於代理帳務，不得藏入匯率或重複計收。交易原幣保留於逐筆流水，正式平台帳務使用 settlement_currency = USDT。
    </n-alert>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="searchText" clearable placeholder="搜尋匯率 ID / 幣別 / 來源" class="xl:col-span-4" />
        <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="1540"
    />

    <n-drawer v-model:show="showDetail" width="min(980px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex items-center gap-3">
            <span class="font-semibold">{{ currentRow.rate_id }}</span>
            <n-tag :bordered="false">{{ currentRow.display_currency }}</n-tag>
            <n-tag type="success" :bordered="false">USDT</n-tag>
            <n-tag :type="statusMeta[currentRow.status].type" :bordered="false">{{ statusMeta[currentRow.status].label }}</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <n-tabs v-model:value="activeTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="日期">{{ currentRow.rate_date }}</n-descriptions-item>
                <n-descriptions-item label="來源">{{ currentRow.source }}</n-descriptions-item>
                <n-descriptions-item label="交易原幣">{{ currentRow.display_currency }}</n-descriptions-item>
                <n-descriptions-item label="結算幣別">{{ currentRow.settlement_currency }}</n-descriptions-item>
                <n-descriptions-item label="base_rate">{{ formatRate(currentRow.base_rate, currentRow.display_currency) }}</n-descriptions-item>
                <n-descriptions-item label="previous_base_rate">{{ formatRate(currentRow.previous_base_rate, currentRow.display_currency) }}</n-descriptions-item>
                <n-descriptions-item label="服務費率快照">{{ formatPercent(currentRow.service_fee_rate) }}</n-descriptions-item>
                <n-descriptions-item label="波動">{{ formatPercent(variationPercent(currentRow)) }}</n-descriptions-item>
                <n-descriptions-item label="版本">v{{ currentRow.version }}</n-descriptions-item>
                <n-descriptions-item label="抓取時間">{{ formatDateTime(currentRow.fetched_at) }}</n-descriptions-item>
                <n-descriptions-item label="確認時間">{{ formatDateTime(currentRow.confirmed_at) }}</n-descriptions-item>
                <n-descriptions-item label="確認人">{{ currentRow.confirmed_by || '-' }}</n-descriptions-item>
                <n-descriptions-item label="鎖定人">{{ currentRow.locked_by || '-' }}</n-descriptions-item>
                <n-descriptions-item label="鎖定時間">{{ formatDateTime(currentRow.locked_at) }}</n-descriptions-item>
                <n-descriptions-item label="交易數">{{ currentRow.transaction_count.toLocaleString() }}</n-descriptions-item>
                <n-descriptions-item label="告警" :span="2">{{ currentRow.alert || '-' }}</n-descriptions-item>
                <n-descriptions-item label="不可重算規則" :span="2">
                  匯率鎖定後，交易流水保存 exchange_rate_id、exchange_rate、service_fee_rate 與 rate_locked_at。service_fee_rate 僅為系統預設或代理合約在交易時套用的稽核快照，不可在匯率管理內修改。
                </n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="snapshots" tab="交易快照">
              <n-alert type="info" :show-icon="false" class="mb-4">
                交易快照是日結與流水追溯依據；正式財務仍由代理帳務、供應商帳務與平台毛利各自彙總。
              </n-alert>
              <n-data-table :columns="withTableSorters(snapshotColumns)" :data="currentRow.snapshots" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="860" />
            </n-tab-pane>

            <n-tab-pane name="logs" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item
                  v-for="log in currentRow.logs"
                  :key="log.trace_id"
                  type="success"
                  :title="log.action"
                  :content="`${log.operator} / ${log.trace_id} / ${log.note}`"
                  :time="formatDateTime(log.operated_at)"
                />
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <div v-if="currentRow" class="flex flex-wrap justify-end gap-2">
            <n-button secondary @click="openDetail(currentRow, 'snapshots')">查看交易快照</n-button>
            <n-button v-if="currentRow.status === 'warning'" type="warning" secondary @click="confirmWarning(currentRow)">確認告警</n-button>
            <n-button v-if="currentRow.status === 'failed'" type="primary" secondary @click="retryFailedRate(currentRow)">重抓匯率</n-button>
            <n-button type="primary" secondary :disabled="currentRow.status === 'locked' || currentRow.status === 'warning' || currentRow.status === 'failed'" @click="lockRate(currentRow)">鎖定匯率</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

  </div>
</template>
