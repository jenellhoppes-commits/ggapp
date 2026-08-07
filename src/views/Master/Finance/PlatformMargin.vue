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
  NIcon,
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
import { AssessmentOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { calculatePlatformMargin } from '../../../domain/finance'

type MarginStatus = 'preview' | 'ready' | 'locked'

interface MarginSource {
  source_type: 'AGENT_RECEIVABLE' | 'PROVIDER_PAYABLE' | 'FX_SERVICE_FEE' | 'ADJUSTMENT'
  target_type: 'AGENT' | 'PROVIDER' | 'PLATFORM'
  target_id: string
  amount: number
  ref_no: string
  description: string
}

interface MarginDetail {
  merchant_id: string
  merchant_name: string
  display_currency: string
  settlement_ggr: number
  agent_receivable: number
  provider_cost: number
  fx_service_fee: number
  agent_adjustment: number
  platform_adjustment: number
  activity_cost: number
  platform_margin: number
}

interface MarginLog {
  action: string
  operated_at: string
  operator: string
  trace_id: string
}

interface PlatformMarginRow {
  margin_id: string
  period: string
  settlement_currency: 'USDT'
  agent_id: string
  agent_name: string
  provider_id: string
  provider_name: string
  agent_receivable: number
  provider_cost: number
  fx_service_fee: number
  agent_adjustment: number
  platform_adjustment: number
  activity_cost: number
  platform_margin: number
  margin_rate: number
  status: MarginStatus
  updated_at: string
  sources: MarginSource[]
  details: MarginDetail[]
  logs: MarginLog[]
}

const message = useMessage()

const rows = ref<PlatformMarginRow[]>([
  {
    margin_id: 'PM-202607-DIRECT-PG',
    period: '2026-07',
    settlement_currency: 'USDT',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    provider_id: 'PG',
    provider_name: 'PG Soft',
    agent_receivable: 42087.5,
    provider_cost: 24050,
    fx_service_fee: 3006.25,
    agent_adjustment: 0,
    platform_adjustment: 0,
    activity_cost: 0,
    platform_margin: 21043.75,
    margin_rate: 0.035,
    status: 'ready',
    updated_at: '2026-07-07T02:00:00.000Z',
    sources: [
      { source_type: 'AGENT_RECEIVABLE', target_type: 'AGENT', target_id: 'AGT-DIRECT', amount: 42087.5, ref_no: 'AINV-202607-DIRECT', description: '代理應收帳單來源' },
      { source_type: 'PROVIDER_PAYABLE', target_type: 'PROVIDER', target_id: 'PROV-PG', amount: -24050, ref_no: 'PINV-202607-PG', description: '供應商應付成本' },
      { source_type: 'FX_SERVICE_FEE', target_type: 'PLATFORM', target_id: 'GGAP', amount: 3006.25, ref_no: 'FX-202607-PG', description: '匯率服務費' }
    ],
    details: [
      { merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', display_currency: 'TWD', settlement_ggr: 601250, agent_receivable: 42087.5, provider_cost: 24050, fx_service_fee: 3006.25, agent_adjustment: 0, platform_adjustment: 0, activity_cost: 0, platform_margin: 21043.75 }
    ],
    logs: [
      { action: '產生平台毛利快照', operated_at: '2026-07-07T02:00:00.000Z', operator: 'System', trace_id: 'trace-margin-direct-pg' }
    ]
  },
  {
    margin_id: 'PM-202607-DIRECT-JILI',
    period: '2026-07',
    settlement_currency: 'USDT',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    provider_id: 'JILI',
    provider_name: 'JILI',
    agent_receivable: 28147.75,
    provider_cost: 17219.8,
    fx_service_fee: 1655.75,
    agent_adjustment: 0,
    platform_adjustment: -120,
    activity_cost: 0,
    platform_margin: 12463.7,
    margin_rate: 0.0376,
    status: 'preview',
    updated_at: '2026-07-07T02:04:00.000Z',
    sources: [
      { source_type: 'AGENT_RECEIVABLE', target_type: 'AGENT', target_id: 'AGT-DIRECT', amount: 28147.75, ref_no: 'AINV-202607-DIRECT', description: '代理應收帳單來源' },
      { source_type: 'PROVIDER_PAYABLE', target_type: 'PROVIDER', target_id: 'PROV-JILI', amount: -17219.8, ref_no: 'PS-202607-JILI', description: '供應商成本試算' },
      { source_type: 'FX_SERVICE_FEE', target_type: 'PLATFORM', target_id: 'GGAP', amount: 1655.75, ref_no: 'FX-202607-JILI', description: '匯率服務費' },
      { source_type: 'ADJUSTMENT', target_type: 'PLATFORM', target_id: 'GGAP', amount: -120, ref_no: 'ADJ-202607-JILI', description: '差異調整' }
    ],
    details: [
      { merchant_id: 'OP-1002', merchant_name: 'Royal Ace Group', display_currency: 'PHP', settlement_ggr: 331150, agent_receivable: 28147.75, provider_cost: 17219.8, fx_service_fee: 1655.75, agent_adjustment: 0, platform_adjustment: -120, activity_cost: 0, platform_margin: 12463.7 }
    ],
    logs: [
      { action: '建立毛利預覽', operated_at: '2026-07-07T02:04:00.000Z', operator: 'System', trace_id: 'trace-margin-direct-jili' }
    ]
  },
  {
    margin_id: 'PM-202607-SEA-PP',
    period: '2026-07',
    settlement_currency: 'USDT',
    agent_id: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    provider_id: 'PP',
    provider_name: 'Pragmatic Play',
    agent_receivable: 27042.6,
    provider_cost: 17335,
    fx_service_fee: 1386.8,
    agent_adjustment: 1200,
    platform_adjustment: 0,
    activity_cost: 0,
    platform_margin: 12294.4,
    margin_rate: 0.0355,
    status: 'locked',
    updated_at: '2026-07-07T04:05:00.000Z',
    sources: [
      { source_type: 'AGENT_RECEIVABLE', target_type: 'AGENT', target_id: 'AGT-SEA-001', amount: 27042.6, ref_no: 'AINV-202607-SEA', description: '代理應收帳單來源' },
      { source_type: 'PROVIDER_PAYABLE', target_type: 'PROVIDER', target_id: 'PROV-PP', amount: -17335, ref_no: 'PINV-202607-PP', description: '供應商應付成本' },
      { source_type: 'FX_SERVICE_FEE', target_type: 'PLATFORM', target_id: 'GGAP', amount: 1386.8, ref_no: 'FX-202607-PP', description: '匯率服務費' },
      { source_type: 'ADJUSTMENT', target_type: 'AGENT', target_id: 'AGT-SEA-001', amount: 1200, ref_no: 'ADJ-202607-SEA', description: '代理應收調整' }
    ],
    details: [
      { merchant_id: 'OP-1009', merchant_name: 'Golden Dragon Gaming', display_currency: 'VND', settlement_ggr: 346700, agent_receivable: 27042.6, provider_cost: 17335, fx_service_fee: 1386.8, agent_adjustment: 1200, platform_adjustment: 0, activity_cost: 0, platform_margin: 12294.4 }
    ],
    logs: [
      { action: '鎖定平台毛利快照', operated_at: '2026-07-07T04:05:00.000Z', operator: 'Finance', trace_id: 'trace-margin-sea-pp-lock' }
    ]
  },
  {
    margin_id: 'PM-202607-SEA-PG',
    period: '2026-07',
    settlement_currency: 'USDT',
    agent_id: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    provider_id: 'PG',
    provider_name: 'PG Soft',
    agent_receivable: 25312.5,
    provider_cost: 13500,
    fx_service_fee: 1350,
    agent_adjustment: 0,
    platform_adjustment: 0,
    activity_cost: 0,
    platform_margin: 13162.5,
    margin_rate: 0.039,
    status: 'ready',
    updated_at: '2026-07-07T02:18:00.000Z',
    sources: [
      { source_type: 'AGENT_RECEIVABLE', target_type: 'AGENT', target_id: 'AGT-SEA-001', amount: 25312.5, ref_no: 'AINV-202607-SEA', description: '代理應收帳單來源' },
      { source_type: 'PROVIDER_PAYABLE', target_type: 'PROVIDER', target_id: 'PROV-PG', amount: -13500, ref_no: 'PINV-202607-PG', description: '供應商應付成本' },
      { source_type: 'FX_SERVICE_FEE', target_type: 'PLATFORM', target_id: 'GGAP', amount: 1350, ref_no: 'FX-202607-PG', description: '匯率服務費' }
    ],
    details: [
      { merchant_id: 'OP-1008', merchant_name: 'NovaPlay Entertainment', display_currency: 'THB', settlement_ggr: 337500, agent_receivable: 25312.5, provider_cost: 13500, fx_service_fee: 1350, agent_adjustment: 0, platform_adjustment: 0, activity_cost: 0, platform_margin: 13162.5 }
    ],
    logs: [
      { action: '完成毛利試算', operated_at: '2026-07-07T02:18:00.000Z', operator: 'System', trace_id: 'trace-margin-sea-pg' }
    ]
  }
])

const finalAgentReceivable = (row: PlatformMarginRow) => row.agent_receivable + row.fx_service_fee + row.agent_adjustment

rows.value.forEach((row) => {
  row.platform_margin = calculatePlatformMargin(
    finalAgentReceivable(row),
    row.provider_cost,
    row.platform_adjustment,
    row.activity_cost
  )
})

const showDetail = ref(false)
const currentRow = ref<PlatformMarginRow | null>(rows.value[0] ?? null)
const detailTab = ref('summary')
const searchText = ref('')
const statusFilter = ref<MarginStatus | null>(null)
const periodFilter = ref('2026-07')

const statusOptions = [
  { label: '預覽', value: 'preview' },
  { label: '可鎖定', value: 'ready' },
  { label: '已鎖定', value: 'locked' }
]

const statusMeta: Record<MarginStatus, { label: string; type: 'success' | 'warning' | 'info' }> = {
  preview: { label: '預覽', type: 'info' },
  ready: { label: '可鎖定', type: 'success' },
  locked: { label: '已鎖定', type: 'warning' }
}

const sourceMeta: Record<MarginSource['source_type'], { label: string; type: 'success' | 'warning' | 'info' | 'default' }> = {
  AGENT_RECEIVABLE: { label: '代理應收', type: 'success' },
  PROVIDER_PAYABLE: { label: '供應商應付', type: 'warning' },
  FX_SERVICE_FEE: { label: '匯率服務費', type: 'info' },
  ADJUSTMENT: { label: '調整', type: 'default' }
}

const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const inKeyword = !keyword
      || row.margin_id.toLowerCase().includes(keyword)
      || row.agent_name.toLowerCase().includes(keyword)
      || row.provider_name.toLowerCase().includes(keyword)
    const inStatus = !statusFilter.value || row.status === statusFilter.value
    const inPeriod = !periodFilter.value || row.period === periodFilter.value
    return inKeyword && inStatus && inPeriod
  })
})

const summary = computed(() => {
  const base = filteredRows.value
  return {
    agentReceivable: base.reduce((sum, row) => sum + finalAgentReceivable(row), 0),
    providerCost: base.reduce((sum, row) => sum + row.provider_cost, 0),
    fxServiceFee: base.reduce((sum, row) => sum + row.fx_service_fee, 0),
    adjustment: base.reduce((sum, row) => sum + row.agent_adjustment + row.platform_adjustment, 0),
    activityCost: base.reduce((sum, row) => sum + row.activity_cost, 0),
    platformMargin: base.reduce((sum, row) => sum + row.platform_margin, 0)
  }
})

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = null
  periodFilter.value = ''
}

const generateMarginSnapshot = () => {
  message.success('已產生平台毛利快照展示資料')
}

const openDetail = (row: PlatformMarginRow) => {
  currentRow.value = row
  detailTab.value = 'summary'
  showDetail.value = true
}

const lockMargin = (row: PlatformMarginRow) => {
  row.status = 'locked'
  row.updated_at = new Date().toISOString()
  row.logs.unshift({
    action: '鎖定平台毛利快照',
    operated_at: row.updated_at,
    operator: 'Finance',
    trace_id: `trace-margin-lock-${Date.now()}`
  })
  message.success(`${row.margin_id} 已鎖定`)
}

const exportMarginDetail = (row?: PlatformMarginRow) => {
  message.success(row ? `${row.margin_id} 明細匯出完成` : `已匯出 ${filteredRows.value.length} 筆平台毛利`)
}

const columns = computed<DataTableColumns<PlatformMarginRow>>(() => [
  {
    title: '毛利批次',
    key: 'margin_id',
    width: 190,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openDetail(row) }, row.margin_id)
  },
  {
    title: '代理',
    key: 'agent_name',
    width: 190,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.agent_name), h('span', { class: 'font-mono text-xs text-gray-500' }, row.agent_id)])
  },
  {
    title: '供應商',
    key: 'provider_name',
    width: 170,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.provider_name), h('span', { class: 'font-mono text-xs text-gray-500' }, row.provider_id)])
  },
  { title: '帳期', key: 'period', width: 110 },
  { title: '幣別', key: 'settlement_currency', width: 95, align: 'center', render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '代理最終應收', key: 'agent_receivable', width: 155, align: 'right', render: row => h(MoneyText, { value: finalAgentReceivable(row), currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '供應商應付', key: 'provider_cost', width: 145, align: 'right', render: row => h(MoneyText, { value: row.provider_cost, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '匯率服務費', key: 'fx_service_fee', width: 135, align: 'right', render: row => h(MoneyText, { value: row.fx_service_fee, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '代理調整', key: 'agent_adjustment', width: 115, align: 'right', render: row => h(MoneyText, { value: row.agent_adjustment, currency: 'USDT', compact: true, showSign: true }) },
  { title: '平台調整', key: 'platform_adjustment', width: 115, align: 'right', render: row => h(MoneyText, { value: row.platform_adjustment, currency: 'USDT', compact: true, showSign: true }) },
  { title: '活動成本', key: 'activity_cost', width: 125, align: 'right', render: row => h(MoneyText, { value: row.activity_cost, currency: 'USDT', compact: true, color: 'text-amber-300' }) },
  { title: '平台毛利', key: 'platform_margin', width: 145, align: 'right', render: row => h(MoneyText, { value: row.platform_margin, currency: 'USDT', compact: true, showSign: true }) },
  { title: '毛利率', key: 'margin_rate', width: 110, align: 'right', render: row => formatRate(row.margin_rate) },
  { title: '狀態', key: 'status', width: 105, align: 'center', render: row => h(NTag, { type: statusMeta[row.status].type, size: 'small', bordered: false }, { default: () => statusMeta[row.status].label }) },
  {
    title: '操作',
    key: 'actions',
    width: 210,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, {
          icon: () => h(NIcon, null, { default: () => h(VisibilityOutlined) }),
          default: () => '查看'
        }),
        h(NButton, { size: 'small', secondary: true, disabled: row.status === 'locked', onClick: () => lockMargin(row) }, { default: () => '鎖定' })
      ]
    })
  }
])

const sourceColumns: DataTableColumns<MarginSource> = [
  { title: '來源類型', key: 'source_type', width: 150, render: row => h(NTag, { type: sourceMeta[row.source_type].type, bordered: false, size: 'small' }, { default: () => sourceMeta[row.source_type].label }) },
  { title: 'Target', key: 'target_type', width: 130, render: row => `${row.target_type} / ${row.target_id}` },
  { title: '來源單號', key: 'ref_no', render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.ref_no) },
  { title: '金額', key: 'amount', align: 'right', render: row => h(MoneyText, { value: row.amount, currency: 'USDT', showSign: true }) },
  { title: '說明', key: 'description' }
]

const detailColumns: DataTableColumns<MarginDetail> = [
  { title: '商戶', key: 'merchant_name', width: 210, render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.merchant_name), h('span', { class: 'font-mono text-xs text-gray-500' }, row.merchant_id)]) },
  { title: '交易幣別', key: 'display_currency', width: 100 },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: row => h(MoneyText, { value: row.settlement_ggr, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '代理遊戲費', key: 'agent_receivable', align: 'right', render: row => h(MoneyText, { value: row.agent_receivable, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '供應商應付', key: 'provider_cost', align: 'right', render: row => h(MoneyText, { value: row.provider_cost, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '匯率服務費', key: 'fx_service_fee', align: 'right', render: row => h(MoneyText, { value: row.fx_service_fee, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '代理調整', key: 'agent_adjustment', align: 'right', render: row => h(MoneyText, { value: row.agent_adjustment, currency: 'USDT', compact: true, showSign: true }) },
  { title: '平台調整', key: 'platform_adjustment', align: 'right', render: row => h(MoneyText, { value: row.platform_adjustment, currency: 'USDT', compact: true, showSign: true }) },
  { title: '平台毛利', key: 'platform_margin', align: 'right', render: row => h(MoneyText, { value: row.platform_margin, currency: 'USDT', compact: true, showSign: true }) }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">平台毛利</h1>
        <p class="mt-1 text-sm text-gray-500">
          管理報表彙整代理最終應收、供應商應付、平台調整及其他成本，不改動供應商或代理帳務主體。
        </p>
      </div>
      <n-button type="primary" secondary @click="generateMarginSnapshot">
        <template #icon>
          <n-icon><AssessmentOutlined /></n-icon>
        </template>
        產生毛利快照
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="代理最終應收">
          <MoneyText :value="summary.agentReceivable" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="供應商應付">
          <MoneyText :value="summary.providerCost" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="匯率服務費">
          <MoneyText :value="summary.fxServiceFee" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="調整">
          <MoneyText :value="summary.adjustment" currency="USDT" compact show-sign />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="活動成本">
          <MoneyText :value="summary.activityCost" currency="USDT" compact color="text-amber-300" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="平台毛利">
          <MoneyText :value="summary.platformMargin" currency="USDT" compact show-sign />
        </n-statistic>
      </div>
    </div>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="searchText" clearable placeholder="搜尋代理 / 供應商 / 批次" class="xl:col-span-4">
          <template #prefix>
            <n-icon :component="SearchOutlined" class="opacity-60" />
          </template>
        </n-input>
        <n-input v-model:value="periodFilter" placeholder="帳期 YYYY-MM" class="xl:col-span-2" />
        <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-alert type="info" :show-icon="false">
      平台毛利 = 代理最終應收 - 供應商應付 + 平台調整 - 活動成本 - 補償成本；代理最終應收已包含匯率服務費，不可重複加計。此頁只作平台內部管理分析，供應商帳單與代理帳單仍保持獨立。
    </n-alert>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="1980"
    />

    <n-drawer v-model:show="showDetail" width="min(1120px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold">{{ currentRow.margin_id }}</span>
            <span class="text-sm text-gray-500">{{ currentRow.agent_name }} / {{ currentRow.provider_name }} / {{ currentRow.period }}</span>
            <n-tag type="success" :bordered="false">{{ currentRow.settlement_currency }}</n-tag>
            <n-tag :type="statusMeta[currentRow.status].type" :bordered="false" round>
              {{ statusMeta[currentRow.status].label }}
            </n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="代理最終應收">
                <MoneyText :value="finalAgentReceivable(currentRow)" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="供應商應付">
                <MoneyText :value="currentRow.provider_cost" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="匯率服務費">
                <MoneyText :value="currentRow.fx_service_fee" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="平台毛利">
                <MoneyText :value="currentRow.platform_margin" currency="USDT" compact show-sign />
              </n-statistic>
            </div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="summary" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="代理">{{ currentRow.agent_name }} / {{ currentRow.agent_id }}</n-descriptions-item>
                <n-descriptions-item label="供應商">{{ currentRow.provider_name }} / {{ currentRow.provider_id }}</n-descriptions-item>
                <n-descriptions-item label="帳期">{{ currentRow.period }}</n-descriptions-item>
                <n-descriptions-item label="結算幣別">
                  <n-tag type="success" :bordered="false">{{ currentRow.settlement_currency }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="分析維度">period + agent_id + provider_id + settlement_currency</n-descriptions-item>
                <n-descriptions-item label="毛利率">{{ formatRate(currentRow.margin_rate) }}</n-descriptions-item>
                <n-descriptions-item label="資料來源" :span="2">代理帳單、供應商帳務、匯率服務費、調整紀錄</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="sources" tab="來源拆解">
              <n-data-table :columns="withTableSorters(sourceColumns)" :data="currentRow.sources" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="980" />
            </n-tab-pane>

            <n-tab-pane name="details" tab="商戶明細">
              <n-data-table :columns="withTableSorters(detailColumns)" :data="currentRow.details" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1260" />
            </n-tab-pane>

            <n-tab-pane name="boundary" tab="帳務邊界">
              <n-descriptions bordered :column="1" label-placement="left">
                <n-descriptions-item label="供應商帳務">平台自行對供應商成本與應付帳單負責。</n-descriptions-item>
                <n-descriptions-item label="代理帳務">平台只對 L1 代理建立正式應收帳。</n-descriptions-item>
                <n-descriptions-item label="平台毛利">只做內部分析，不代表供應商與代理直接掛鉤。</n-descriptions-item>
                <n-descriptions-item label="主要利潤">供應商成本與代理費率差額，加上匯率服務費。</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="logs" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item
                  v-for="log in currentRow.logs"
                  :key="log.trace_id"
                  type="info"
                  :title="log.action"
                  :content="`${log.operator} / ${log.trace_id}`"
                  :time="formatDateTime(log.operated_at)"
                />
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <n-space v-if="currentRow" justify="end">
            <n-button secondary @click="exportMarginDetail(currentRow)">匯出明細</n-button>
            <n-button type="primary" secondary :disabled="currentRow.status === 'locked'" @click="lockMargin(currentRow)">鎖定毛利</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
