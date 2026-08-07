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
  NModal,
  NSelect,
  NSpace,
  NStatistic,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { AssignmentTurnedInOutlined, BuildOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type AlertSource = 'api_gateway' | 'wallet_router' | 'provider_adapter' | 'callback' | 'settlement' | 'fx_rate' | 'transfer_ledger' | 'admin_portal' | 'queue'
type AlertLevel = 'info' | 'warning' | 'critical'
type AlertStatus = 'triggered' | 'acknowledged' | 'processing' | 'recovered' | 'ignored'

interface AlertSample {
  time: string
  value: string
  trace_id: string
}

interface AlertRow {
  alert_id: string
  name: string
  source: AlertSource
  affected_target: string
  level: AlertLevel
  metric: string
  current_value: string
  threshold: string
  status: AlertStatus
  first_seen: string
  last_seen: string
  owner: string
  impact: {
    providers: string[]
    merchants: string[]
    agents: string[]
    transactions: number
    amount_usdt: number
  }
  samples: AlertSample[]
  logs: Array<{ action: string; operator: string; time: string; trace_id: string }>
}

const message = useMessage()
const keyword = ref('')
const sourceFilter = ref<AlertSource | null>(null)
const levelFilter = ref<AlertLevel | null>(null)
const statusFilter = ref<AlertStatus | null>(null)
const showDetail = ref(false)
const showAssign = ref(false)
const assignee = ref('ops02')
const currentAlert = ref<AlertRow | null>(null)

const alerts = ref<AlertRow[]>([
  {
    alert_id: 'ALERT-CB-001',
    name: '商戶 Callback Timeout 升高',
    source: 'callback',
    affected_target: 'OP-1001 / Seamless Wallet',
    level: 'critical',
    metric: 'Timeout Rate',
    current_value: '18.6%',
    threshold: '5%',
    status: 'triggered',
    first_seen: '2026-07-07T10:10:00+08:00',
    last_seen: '2026-07-07T10:42:00+08:00',
    owner: '未指派',
    impact: {
      providers: ['PROV-PG'],
      merchants: ['OP-1001'],
      agents: ['AGT-DIRECT'],
      transactions: 236,
      amount_usdt: 12840.6
    },
    samples: [
      { time: '2026-07-07T10:42:00+08:00', value: '18.6%', trace_id: 'trace-cb-timeout-op1001' },
      { time: '2026-07-07T10:35:00+08:00', value: '15.2%', trace_id: 'trace-cb-timeout-op1001-2' }
    ],
    logs: [
      { action: '觸發告警', operator: 'System', time: '2026-07-07T10:10:00+08:00', trace_id: 'trace-cb-timeout-op1001' }
    ]
  },
  {
    alert_id: 'ALERT-PROV-002',
    name: 'Provider Adapter 延遲升高',
    source: 'provider_adapter',
    affected_target: 'PROV-PG / Launch Game',
    level: 'warning',
    metric: 'P95 Latency',
    current_value: '3200 ms',
    threshold: '1500 ms',
    status: 'processing',
    first_seen: '2026-07-07T09:50:00+08:00',
    last_seen: '2026-07-07T10:25:00+08:00',
    owner: 'ops02',
    impact: {
      providers: ['PROV-PG'],
      merchants: ['OP-1001', 'OP-1008'],
      agents: ['AGT-DIRECT', 'AGT-SEA-001'],
      transactions: 88,
      amount_usdt: 0
    },
    samples: [
      { time: '2026-07-07T10:25:00+08:00', value: '3200 ms', trace_id: 'trace-prov-pg-latency' },
      { time: '2026-07-07T10:15:00+08:00', value: '2840 ms', trace_id: 'trace-prov-pg-latency-2' }
    ],
    logs: [
      { action: '指派處理人', operator: 'admin', time: '2026-07-07T10:05:00+08:00', trace_id: 'trace-alert-assign-pg' },
      { action: '標記處理中', operator: 'ops02', time: '2026-07-07T10:08:00+08:00', trace_id: 'trace-alert-processing-pg' }
    ]
  },
  {
    alert_id: 'ALERT-FX-003',
    name: '匯率日波動異常',
    source: 'fx_rate',
    affected_target: 'VND / 2026-07-07',
    level: 'warning',
    metric: 'Daily Variation',
    current_value: '+4.86%',
    threshold: '3%',
    status: 'acknowledged',
    first_seen: '2026-07-07T00:18:00+08:00',
    last_seen: '2026-07-07T00:18:00+08:00',
    owner: 'Finance Manager',
    impact: {
      providers: [],
      merchants: ['VND 交易幣別商戶'],
      agents: ['SEA Growth Agent'],
      transactions: 0,
      amount_usdt: 0
    },
    samples: [
      { time: '2026-07-07T00:18:00+08:00', value: '+4.86%', trace_id: 'trace-fx-vnd-confirm' }
    ],
    logs: [
      { action: '確認告警', operator: 'Finance Manager', time: '2026-07-07T00:20:00+08:00', trace_id: 'trace-fx-vnd-confirm' }
    ]
  },
  {
    alert_id: 'ALERT-SETTLE-004',
    name: '日結批次完成',
    source: 'settlement',
    affected_target: '2026-07-06 帳期',
    level: 'info',
    metric: 'Batch Status',
    current_value: 'Success',
    threshold: '01:00 完成',
    status: 'recovered',
    first_seen: '2026-07-07T01:00:00+08:00',
    last_seen: '2026-07-07T01:18:00+08:00',
    owner: 'System',
    impact: {
      providers: ['ALL'],
      merchants: ['ALL'],
      agents: ['ALL'],
      transactions: 18420,
      amount_usdt: 932400
    },
    samples: [
      { time: '2026-07-07T01:18:00+08:00', value: 'Success', trace_id: 'trace-daily-settle-20260706' }
    ],
    logs: [
      { action: '批次完成', operator: 'System', time: '2026-07-07T01:18:00+08:00', trace_id: 'trace-daily-settle-20260706' }
    ]
  }
])

const sourceOptions = [
  { label: 'API Gateway', value: 'api_gateway' },
  { label: 'Wallet Router', value: 'wallet_router' },
  { label: 'Provider Adapter', value: 'provider_adapter' },
  { label: 'Callback Service', value: 'callback' },
  { label: 'Settlement Engine', value: 'settlement' },
  { label: 'FX Rate Service', value: 'fx_rate' },
  { label: 'Transfer Wallet Ledger', value: 'transfer_ledger' },
  { label: 'Admin Portal', value: 'admin_portal' },
  { label: 'Queue', value: 'queue' }
]
const levelOptions = [
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Critical', value: 'critical' }
]
const statusOptions = [
  { label: '已觸發', value: 'triggered' },
  { label: '已確認', value: 'acknowledged' },
  { label: '處理中', value: 'processing' },
  { label: '已恢復', value: 'recovered' },
  { label: '已忽略', value: 'ignored' }
]
const assigneeOptions = [
  { label: 'ops02', value: 'ops02' },
  { label: 'finance01', value: 'finance01' },
  { label: 'Risk Team', value: 'Risk Team' },
  { label: 'DevOps', value: 'DevOps' }
]

const sourceLabel = (value: AlertSource) => sourceOptions.find(option => option.value === value)?.label || value
const formatDateTime = (value: string) => new Date(value).toLocaleString()

const levelMeta: Record<AlertLevel, { label: string; type: 'success' | 'warning' | 'error' }> = {
  info: { label: 'Info', type: 'success' },
  warning: { label: 'Warning', type: 'warning' },
  critical: { label: 'Critical', type: 'error' }
}

const statusMeta: Record<AlertStatus, { label: string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  triggered: { label: '已觸發', type: 'error' },
  acknowledged: { label: '已確認', type: 'warning' },
  processing: { label: '處理中', type: 'info' },
  recovered: { label: '已恢復', type: 'success' },
  ignored: { label: '已忽略', type: 'warning' }
}

const filteredAlerts = computed(() => alerts.value.filter((alert) => {
  const text = keyword.value.trim().toLowerCase()
  const matchesKeyword = !text
    || alert.alert_id.toLowerCase().includes(text)
    || alert.name.toLowerCase().includes(text)
    || alert.affected_target.toLowerCase().includes(text)
    || alert.owner.toLowerCase().includes(text)
    || alert.samples.some(sample => sample.trace_id.toLowerCase().includes(text))
  const matchesSource = !sourceFilter.value || alert.source === sourceFilter.value
  const matchesLevel = !levelFilter.value || alert.level === levelFilter.value
  const matchesStatus = !statusFilter.value || alert.status === statusFilter.value
  return matchesKeyword && matchesSource && matchesLevel && matchesStatus
}))

const summary = computed(() => ({
  active: alerts.value.filter(alert => ['triggered', 'acknowledged', 'processing'].includes(alert.status)).length,
  critical: alerts.value.filter(alert => alert.level === 'critical' && alert.status !== 'recovered').length,
  avgLatency: '2727 ms',
  callbackRate: '81.4%',
  providerTimeout: alerts.value.find(alert => alert.alert_id === 'ALERT-PROV-002')?.current_value || '-',
  settlement: alerts.value.find(alert => alert.source === 'settlement')?.current_value || '-'
}))

const openDetail = (row: AlertRow) => {
  currentAlert.value = row
  showDetail.value = true
}

const appendLog = (row: AlertRow, action: string) => {
  row.logs.unshift({ action, operator: 'admin', time: new Date().toISOString(), trace_id: `trace-alert-${Date.now()}` })
}

const acknowledge = (row: AlertRow) => {
  row.status = 'acknowledged'
  appendLog(row, '確認告警')
  message.success(`${row.alert_id} 已確認`)
}

const markProcessing = (row: AlertRow) => {
  row.status = 'processing'
  appendLog(row, '標記處理中')
  message.success(`${row.alert_id} 已標記處理中`)
}

const resolveAlert = (row: AlertRow) => {
  row.status = 'recovered'
  appendLog(row, '標記已恢復')
  message.success(`${row.alert_id} 已恢復`)
}

const openAssign = (row: AlertRow) => {
  currentAlert.value = row
  assignee.value = row.owner === '未指派' ? 'ops02' : row.owner
  showAssign.value = true
}

const saveAssign = () => {
  if (!currentAlert.value) return
  currentAlert.value.owner = assignee.value
  appendLog(currentAlert.value, `指派處理人：${assignee.value}`)
  showAssign.value = false
  message.success('已更新處理人')
}

const createRepairJob = (row: AlertRow) => {
  appendLog(row, '建立補單 / 維運工單')
  message.info(`${row.alert_id} 已建立補單 / 維運工單展示`)
}

const resetFilters = () => {
  keyword.value = ''
  sourceFilter.value = null
  levelFilter.value = null
  statusFilter.value = null
}

const sampleColumns: DataTableColumns<AlertSample> = [
  { title: '時間', key: 'time', render: row => formatDateTime(row.time) },
  { title: '值', key: 'value' },
  { title: 'Trace ID', key: 'trace_id' }
]

const columns: DataTableColumns<AlertRow> = [
  {
    title: '告警',
    key: 'alert_id',
    width: 240,
    fixed: 'left',
    render: row => h('button', { class: 'text-left text-cyan-500 hover:text-cyan-400', onClick: () => openDetail(row) }, [
      h('div', { class: 'font-mono text-xs' }, row.alert_id),
      h('div', { class: 'font-semibold' }, row.name)
    ])
  },
  { title: '來源服務', key: 'source', width: 160, render: row => sourceLabel(row.source) },
  { title: '影響對象', key: 'affected_target', minWidth: 220 },
  { title: '等級', key: 'level', width: 100, render: row => h(NTag, { type: levelMeta[row.level].type, bordered: false, size: 'small' }, { default: () => levelMeta[row.level].label }) },
  { title: '目前值', key: 'current_value', width: 130, render: row => h('span', { class: row.level === 'critical' ? 'font-mono text-red-300' : 'font-mono' }, row.current_value) },
  { title: '門檻', key: 'threshold', width: 130 },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false, size: 'small' }, { default: () => statusMeta[row.status].label }) },
  { title: '最後發生', key: 'last_seen', width: 180, render: row => formatDateTime(row.last_seen) },
  { title: '處理人', key: 'owner', width: 120 },
  {
    title: '操作',
    key: 'actions',
    width: 360,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(VisibilityOutlined), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.status === 'recovered', onClick: () => acknowledge(row) }, { icon: () => h(AssignmentTurnedInOutlined), default: () => '確認' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => openAssign(row) }, { default: () => '指派' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.status === 'recovered', onClick: () => markProcessing(row) }, { default: () => '處理中' }),
        h(NButton, { size: 'small', type: 'primary', secondary: true, disabled: row.status === 'recovered', onClick: () => resolveAlert(row) }, { default: () => '恢復' })
      ]
    })
  }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">監控告警</h1>
        <p class="mt-1 text-sm text-gray-500">
          監控 API Gateway、Wallet Router、Provider、Callback、日結與匯率服務，提供確認、指派、工單與恢復流程。
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="活躍告警" :value="summary.active" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Critical" :value="summary.critical" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="平均 API 延遲">{{ summary.avgLatency }}</n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Callback 成功率">{{ summary.callbackRate }}</n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Provider P95">{{ summary.providerTimeout }}</n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="日結狀態">{{ summary.settlement }}</n-statistic></div>
    </div>

    <n-alert type="warning" :show-icon="false">
      告警不直接修改帳務資料；若影響交易、Callback 或 Transfer Ledger，需建立補單或維運工單後再由對應模組處理。
    </n-alert>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="keyword" clearable placeholder="搜尋告警 ID / 名稱 / Provider / 商戶 / Trace ID" class="xl:col-span-4">
          <template #prefix><n-icon :component="SearchOutlined" /></template>
        </n-input>
        <n-select v-model:value="sourceFilter" clearable placeholder="來源服務" :options="sourceOptions" class="xl:col-span-2" />
        <n-select v-model:value="levelFilter" clearable placeholder="等級" :options="levelOptions" class="xl:col-span-2" />
        <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-data-table :columns="withTableSorters(columns)" :data="filteredAlerts" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1760" />

    <n-drawer v-model:show="showDetail" width="min(980px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentAlert" class="flex items-center gap-3">
            <span class="font-mono font-semibold">{{ currentAlert.alert_id }}</span>
            <span>{{ currentAlert.name }}</span>
            <n-tag :type="levelMeta[currentAlert.level].type" :bordered="false">{{ levelMeta[currentAlert.level].label }}</n-tag>
            <n-tag :type="statusMeta[currentAlert.status].type" :bordered="false">{{ statusMeta[currentAlert.status].label }}</n-tag>
          </div>
        </template>

        <template v-if="currentAlert">
          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="來源服務">{{ sourceLabel(currentAlert.source) }}</n-descriptions-item>
            <n-descriptions-item label="影響對象">{{ currentAlert.affected_target }}</n-descriptions-item>
            <n-descriptions-item label="指標">{{ currentAlert.metric }}</n-descriptions-item>
            <n-descriptions-item label="目前值 / 門檻">{{ currentAlert.current_value }} / {{ currentAlert.threshold }}</n-descriptions-item>
            <n-descriptions-item label="首次發生">{{ formatDateTime(currentAlert.first_seen) }}</n-descriptions-item>
            <n-descriptions-item label="最後發生">{{ formatDateTime(currentAlert.last_seen) }}</n-descriptions-item>
            <n-descriptions-item label="處理人">{{ currentAlert.owner }}</n-descriptions-item>
            <n-descriptions-item label="影響交易">{{ currentAlert.impact.transactions }} 筆 / USDT {{ currentAlert.impact.amount_usdt.toLocaleString() }}</n-descriptions-item>
          </n-descriptions>

          <div class="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <h3 class="mb-3 font-semibold">樣本資料</h3>
              <n-data-table
                :columns="withTableSorters(sampleColumns)"
                :data="currentAlert.samples"
                :pagination="DEFAULT_TABLE_PAGINATION"
              />
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <h3 class="mb-3 font-semibold">操作紀錄</h3>
              <n-timeline>
                <n-timeline-item
                  v-for="log in currentAlert.logs"
                  :key="log.trace_id"
                  type="success"
                  :title="log.action"
                  :content="`${log.operator} / ${log.trace_id}`"
                  :time="formatDateTime(log.time)"
                />
              </n-timeline>
            </div>
          </div>
        </template>
        <template #footer>
          <div v-if="currentAlert" class="flex justify-end gap-2">
            <n-button secondary @click="openAssign(currentAlert)">指派處理人</n-button>
            <n-button secondary @click="createRepairJob(currentAlert)">
              <template #icon><n-icon :component="BuildOutlined" /></template>
              建立工單
            </n-button>
            <n-button type="primary" secondary @click="resolveAlert(currentAlert)">標記恢復</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showAssign" preset="card" title="指派處理人" style="width: min(480px, 92vw);">
      <n-space vertical>
        <n-alert type="info" :show-icon="false">指派後會寫入操作紀錄，實際通知可由後端串接 Telegram / Email / Webhook。</n-alert>
        <n-select v-model:value="assignee" :options="assigneeOptions" />
      </n-space>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showAssign = false">取消</n-button>
          <n-button type="primary" @click="saveAssign">確認指派</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
