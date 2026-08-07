<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NGrid,
  NGridItem,
  NRadioButton,
  NRadioGroup,
  NStatistic,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { useSessionStorage } from '@vueuse/core'
import { format } from 'date-fns'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { adminReportService } from '../../../services/admin/reports'
import type { FinancialReportGroupBy, FinancialReportItem } from '../../../types/report'

use([CanvasRenderer, BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent])

const message = useMessage()
const loading = ref(false)
const reportData = ref<FinancialReportItem[]>([])

const filter = useSessionStorage('master-report-center-filter', {
  timeRange: [Date.now() - 30 * 24 * 3600 * 1000, Date.now()] as [number, number],
  groupBy: 'date' as FinancialReportGroupBy
})

const formatUsdt = (value = 0) => `USDT ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
const formatPercent = (value = 0) => `${(value * 100).toFixed(2)}%`

const groupOptions: Array<{ label: string; value: FinancialReportGroupBy }> = [
  { label: '依日期', value: 'date' },
  { label: '依代理', value: 'agent' },
  { label: '依供應商', value: 'provider' },
  { label: '依商戶', value: 'merchant' }
]

const groupLabelMap: Record<FinancialReportGroupBy, string> = {
  date: '日期',
  agent: '代理',
  provider: '供應商',
  merchant: '商戶'
}

const fetchData = async () => {
  loading.value = true
  try {
    const [start, end] = filter.value.timeRange ?? []
    const data = await adminReportService.getFinancialReport({
      timeRange: filter.value.timeRange,
      startTime: start ? format(start, 'yyyy-MM-dd') : undefined,
      endTime: end ? format(end, 'yyyy-MM-dd') : undefined,
      groupBy: filter.value.groupBy
    })
    reportData.value = data.list
  } catch {
    message.error('報表資料載入失敗')
  } finally {
    loading.value = false
  }
}

watch(() => filter.value.groupBy, fetchData)

onMounted(fetchData)

const summary = computed(() => {
  const rows = reportData.value
  const totalBet = rows.reduce((sum, row) => sum + row.total_bet, 0)
  const totalWin = rows.reduce((sum, row) => sum + row.total_win, 0)
  const settlementGgr = rows.reduce((sum, row) => sum + row.settlement_ggr, 0)
  const agentReceivable = rows.reduce((sum, row) => sum + row.agent_receivable, 0)
  const providerPayable = rows.reduce((sum, row) => sum + row.provider_payable, 0)
  const fxServiceFee = rows.reduce((sum, row) => sum + row.fx_service_fee, 0)
  const adjustmentAmount = rows.reduce((sum, row) => sum + row.platform_adjustment, 0)
  const activityCost = rows.reduce((sum, row) => sum + row.activity_cost + row.compensation_cost, 0)
  const platformMargin = rows.reduce((sum, row) => sum + row.platform_margin, 0)

  return {
    totalBet,
    totalWin,
    settlementGgr,
    agentReceivable,
    providerCost: providerPayable,
    fxServiceFee,
    adjustmentAmount,
    activityCost,
    platformMargin,
    marginRate: agentReceivable > 0 ? platformMargin / agentReceivable : 0,
    roundCount: rows.reduce((sum, row) => sum + row.round_count, 0)
  }
})

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: {
    data: ['代理最終應收', '供應商應付', '匯率服務費', '平台毛利'],
    top: 0,
    right: 8,
    textStyle: { color: '#d4d4d8' }
  },
  grid: { left: 56, right: 32, top: 48, bottom: 48 },
  xAxis: {
    type: 'category',
    data: reportData.value.map(row => row.key),
    axisLabel: { color: '#9ca3af', rotate: filter.value.groupBy === 'date' ? 0 : 28 },
    axisLine: { lineStyle: { color: '#3f3f46' } }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9ca3af' },
    splitLine: { lineStyle: { color: '#27272a' } }
  },
  series: [
    {
      name: '代理最終應收',
      type: 'bar',
      data: reportData.value.map(row => row.agent_receivable),
      itemStyle: { color: '#2dd4bf' }
    },
    {
      name: '供應商應付',
      type: 'bar',
      data: reportData.value.map(row => row.provider_payable),
      itemStyle: { color: '#f59e0b' }
    },
    {
      name: '匯率服務費',
      type: 'bar',
      data: reportData.value.map(row => row.fx_service_fee),
      itemStyle: { color: '#38bdf8' }
    },
    {
      name: '平台毛利',
      type: 'line',
      data: reportData.value.map(row => row.platform_margin),
      smooth: true,
      itemStyle: { color: '#22c55e' }
    }
  ]
}))

const columns = computed<DataTableColumns<FinancialReportItem>>(() => [
  {
    title: groupLabelMap[filter.value.groupBy],
    key: 'key',
    minWidth: 150,
    sorter: (a, b) => a.key.localeCompare(b.key)
  },
  {
    title: '正式結算幣別',
    key: 'settlement_currency',
    width: 120,
    render: row => h(NTag, { type: 'success', bordered: false }, { default: () => row.settlement_currency })
  },
  {
    title: '總投注',
    key: 'total_bet',
    align: 'right',
    minWidth: 130,
    sorter: (a, b) => a.total_bet - b.total_bet,
    render: row => row.total_bet.toLocaleString()
  },
  {
    title: '總派彩',
    key: 'total_win',
    align: 'right',
    minWidth: 130,
    sorter: (a, b) => a.total_win - b.total_win,
    render: row => row.total_win.toLocaleString()
  },
  {
    title: '結算 GGR',
    key: 'settlement_ggr',
    align: 'right',
    minWidth: 130,
    sorter: (a, b) => a.settlement_ggr - b.settlement_ggr,
    render: row => formatUsdt(row.settlement_ggr)
  },
  {
    title: '代理最終應收',
    key: 'agent_receivable',
    align: 'right',
    minWidth: 130,
    sorter: (a, b) => a.agent_receivable - b.agent_receivable,
    render: row => formatUsdt(row.agent_receivable)
  },
  {
    title: '供應商應付',
    key: 'provider_payable',
    align: 'right',
    minWidth: 130,
    sorter: (a, b) => a.provider_payable - b.provider_payable,
    render: row => formatUsdt(row.provider_payable)
  },
  {
    title: '匯率服務費',
    key: 'fx_service_fee',
    align: 'right',
    minWidth: 130,
    sorter: (a, b) => a.fx_service_fee - b.fx_service_fee,
    render: row => formatUsdt(row.fx_service_fee)
  },
  {
    title: '調帳',
    key: 'platform_adjustment',
    align: 'right',
    minWidth: 110,
    sorter: (a, b) => a.platform_adjustment - b.platform_adjustment,
    render: row => h('span', { class: row.platform_adjustment >= 0 ? 'text-green-400' : 'text-red-400' }, formatUsdt(row.platform_adjustment))
  },
  {
    title: '活動／補償成本',
    key: 'activity_cost',
    align: 'right',
    minWidth: 140,
    sorter: (a, b) => (a.activity_cost + a.compensation_cost) - (b.activity_cost + b.compensation_cost),
    render: row => formatUsdt(row.activity_cost + row.compensation_cost)
  },
  {
    title: '平台毛利',
    key: 'platform_margin',
    align: 'right',
    minWidth: 130,
    sorter: (a, b) => a.platform_margin - b.platform_margin,
    render: row => h('span', { class: row.platform_margin >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold' }, formatUsdt(row.platform_margin))
  },
  {
    title: '毛利率',
    key: 'margin_rate',
    align: 'center',
    width: 100,
    sorter: (a, b) => a.margin_rate - b.margin_rate,
    render: row => h(NTag, { type: row.margin_rate >= 0.25 ? 'success' : row.margin_rate >= 0.15 ? 'warning' : 'error', bordered: false }, { default: () => formatPercent(row.margin_rate) })
  },
  {
    title: '注單數',
    key: 'round_count',
    align: 'right',
    width: 110,
    sorter: (a, b) => a.round_count - b.round_count,
    render: row => row.round_count.toLocaleString()
  }
])

const handleExport = () => {
  message.success('報表匯出任務已建立')
}
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">報表中心</h1>
        <p class="mt-2 text-sm text-slate-400">
          以 USDT 正式結算口徑查看投注、代理最終應收、供應商應付、匯率服務費與平台毛利。
        </p>
      </div>
      <n-button type="info" dashed @click="handleExport">匯出 CSV</n-button>
    </div>

    <n-alert type="info" :bordered="false">
      供應商結算不掛代理或商戶；代理最終應收與供應商應付只會在平台毛利報表合併分析。
    </n-alert>

    <n-card size="small">
      <div class="flex flex-wrap items-center gap-3">
        <n-radio-group v-model:value="filter.groupBy">
          <n-radio-button v-for="option in groupOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </n-radio-button>
        </n-radio-group>
        <div class="hidden h-6 w-px bg-zinc-700 md:block" />
        <n-date-picker v-model:value="filter.timeRange" type="daterange" clearable />
        <n-button type="primary" :loading="loading" @click="fetchData">分析</n-button>
      </div>
    </n-card>

    <n-grid :cols="4" :x-gap="12" :y-gap="12" responsive="screen">
      <n-grid-item>
        <n-card size="small">
          <n-statistic label="結算 GGR" :value="formatUsdt(summary.settlementGgr)" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card size="small">
          <n-statistic label="代理最終應收" :value="formatUsdt(summary.agentReceivable)" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card size="small">
          <n-statistic label="供應商應付" :value="formatUsdt(summary.providerCost)" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card size="small">
          <n-statistic label="平台毛利" :value="formatUsdt(summary.platformMargin)">
            <template #suffix>
              <span class="text-sm text-slate-400">{{ formatPercent(summary.marginRate) }}</span>
            </template>
          </n-statistic>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-grid :cols="3" :x-gap="12" :y-gap="12" responsive="screen">
      <n-grid-item>
        <n-card size="small">
          <n-statistic label="總投注" :value="summary.totalBet.toLocaleString()" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card size="small">
          <n-statistic label="總派彩" :value="summary.totalWin.toLocaleString()" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card size="small">
          <n-statistic label="匯率服務費" :value="formatUsdt(summary.fxServiceFee)" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card title="平台營收與毛利走勢" size="small">
      <div class="h-[360px] w-full">
        <v-chart :option="chartOption" autoresize />
      </div>
    </n-card>

    <n-card title="報表明細" size="small">
      <n-data-table
        :columns="withTableSorters(columns)"
        :data="reportData"
        :loading="loading"
        :pagination="DEFAULT_TABLE_PAGINATION"
        :scroll-x="1540"
      />
    </n-card>
  </div>
</template>
