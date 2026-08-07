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
import { BuildOutlined, ReplayOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type RepairType = 'Callback Failed' | 'Provider Pending' | 'Ledger Failed' | 'Amount Mismatch' | 'Rollback Required'
type RepairStatus = 'new' | 'processing' | 'waiting' | 'done' | 'failed' | 'manual_review'
type RepairPriority = 'high' | 'medium' | 'low'
type RepairAction = 'resend_callback' | 'query_provider' | 'repair_ledger' | 'create_rollback' | 'manual_review'
type WalletMode = 'seamless' | 'transfer'
type StatusTagType = 'success' | 'warning' | 'error' | 'info' | 'default'

interface RepairStep {
  step: string
  action: RepairAction
  status: RepairStatus
  operator: string
  operated_at: string
  trace_id: string
  note: string
}

interface RepairLog {
  action: string
  operator: string
  operated_at: string
  result: string
}

interface RepairJob {
  repair_id: string
  repair_type: RepairType
  status: RepairStatus
  priority: RepairPriority
  merchant_id: string
  merchant_name: string
  agent_name: string
  merchant_player_id: string
  wallet_mode: WalletMode
  provider_name: string
  transaction_id: string
  round_id: string
  transfer_id: string
  callback_id: string
  display_currency: string
  display_amount: number
  settlement_currency: 'USDT'
  settlement_amount: number
  reason: string
  current_blocker: string
  suggested_action: RepairAction
  idempotency_key: string
  retry_count: number
  max_retry: number
  created_at: string
  updated_at: string
  request_payload: string
  response_payload: string
  provider_payload: string
  ledger_payload: string
  steps: RepairStep[]
  logs: RepairLog[]
}

const message = useMessage()
const showDetail = ref(false)
const currentRow = ref<RepairJob | null>(null)
const detailTab = ref('basic')
const searchText = ref('')
const merchantFilter = ref<string | null>(null)
const typeFilter = ref<RepairType | null>(null)
const statusFilter = ref<RepairStatus | null>(null)
const priorityFilter = ref<RepairPriority | null>(null)
const walletFilter = ref<WalletMode | null>(null)

const rows = ref<RepairJob[]>([
  {
    repair_id: 'RP-20260707-000014',
    repair_type: 'Callback Failed',
    status: 'new',
    priority: 'high',
    merchant_id: 'OP-1006',
    merchant_name: 'Lucky Panda Studio',
    agent_name: 'SEA Growth Agent',
    merchant_player_id: 'panda_5520',
    wallet_mode: 'seamless',
    provider_name: 'JILI Gaming',
    transaction_id: 'TX-20260707-000266',
    round_id: 'R-JILI-5520-14002',
    transfer_id: '-',
    callback_id: 'CB-20260707-000266',
    display_currency: 'PHP',
    display_amount: 1800,
    settlement_currency: 'USDT',
    settlement_amount: 30.54,
    reason: '商戶 Refund Callback timeout，Provider 已確認退款成功。',
    current_blocker: '商戶 Callback endpoint 回覆 504 timeout',
    suggested_action: 'resend_callback',
    idempotency_key: 'idem-op1006-refund-14002',
    retry_count: 2,
    max_retry: 5,
    created_at: '2026-07-07T10:08:00.000Z',
    updated_at: '2026-07-07T10:10:12.000Z',
    request_payload: '{"type":"Refund","amount":1800,"currency":"PHP","transaction_id":"TX-20260707-000266"}',
    response_payload: '{"code":504,"message":"merchant timeout"}',
    provider_payload: '{"status":"SUCCESS","provider_tx_id":"JILI-TX-14002-REFUND"}',
    ledger_payload: '-',
    steps: [
      { step: '建立補單', action: 'manual_review', status: 'done', operator: 'System', operated_at: '2026-07-07T10:08:00.000Z', trace_id: 'trace-rp-14002-create', note: '系統偵測 Callback failed 後建立補單' },
      { step: '重送 Callback', action: 'resend_callback', status: 'failed', operator: 'System', operated_at: '2026-07-07T10:10:12.000Z', trace_id: 'trace-rp-14002-retry-2', note: '第二次重送仍 timeout' },
      { step: '等待人工確認', action: 'manual_review', status: 'waiting', operator: 'Ops', operated_at: '2026-07-07T10:12:00.000Z', trace_id: 'trace-rp-14002-wait', note: '確認商戶 endpoint 是否恢復' }
    ],
    logs: [
      { action: '自動建立補單', operator: 'System', operated_at: '2026-07-07T10:08:00.000Z', result: 'created' },
      { action: '重送 Callback', operator: 'System', operated_at: '2026-07-07T10:10:12.000Z', result: 'timeout' }
    ]
  },
  {
    repair_id: 'RP-20260707-000011',
    repair_type: 'Provider Pending',
    status: 'processing',
    priority: 'medium',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_name: 'SEA Sub Agent 01',
    merchant_player_id: 'nova_7711',
    wallet_mode: 'transfer',
    provider_name: 'PG Soft',
    transaction_id: 'TX-20260707-000241',
    round_id: 'R-PG-7711-99820',
    transfer_id: 'TR-20260707-000077',
    callback_id: '-',
    display_currency: 'THB',
    display_amount: -3200,
    settlement_currency: 'USDT',
    settlement_amount: -87.45,
    reason: 'Provider 回覆 PROCESSING，需查詢最終注單結果再決定 Ledger 狀態。',
    current_blocker: 'Provider 尚未回覆最終狀態',
    suggested_action: 'query_provider',
    idempotency_key: 'idem-ledger-lock-99820',
    retry_count: 1,
    max_retry: 3,
    created_at: '2026-07-07T08:55:00.000Z',
    updated_at: '2026-07-07T09:05:00.000Z',
    request_payload: '{"query":"provider_round","round_id":"R-PG-7711-99820"}',
    response_payload: '{"status":"PROCESSING"}',
    provider_payload: '{"provider_status":"PROCESSING","provider_tx_id":"PG-TX-99820-BET"}',
    ledger_payload: '{"ledger_id":"LED-7711-0008","locked_balance":3200}',
    steps: [
      { step: '建立補單', action: 'query_provider', status: 'done', operator: 'System', operated_at: '2026-07-07T08:55:00.000Z', trace_id: 'trace-rp-99820-create', note: 'Provider Pending 超過門檻後建立查詢任務' },
      { step: 'Provider 查單', action: 'query_provider', status: 'processing', operator: 'System', operated_at: '2026-07-07T09:05:00.000Z', trace_id: 'trace-rp-99820-query', note: '等待 Provider 回覆最終狀態' },
      { step: 'Ledger 修復', action: 'repair_ledger', status: 'waiting', operator: 'System', operated_at: '2026-07-07T09:05:00.000Z', trace_id: 'trace-rp-99820-ledger', note: '查單完成後決定扣款或解鎖' }
    ],
    logs: [
      { action: 'Provider 查單', operator: 'System', operated_at: '2026-07-07T09:05:00.000Z', result: 'PROCESSING' }
    ]
  },
  {
    repair_id: 'RP-20260706-000032',
    repair_type: 'Amount Mismatch',
    status: 'manual_review',
    priority: 'high',
    merchant_id: 'OP-1009',
    merchant_name: 'Golden Dragon Gaming',
    agent_name: 'SEA Local Desk L3',
    merchant_player_id: 'dragon_9255',
    wallet_mode: 'transfer',
    provider_name: 'Pragmatic Play',
    transaction_id: 'TX-20260706-000921',
    round_id: 'R-PP-9255-77410',
    transfer_id: 'TR-20260706-000219',
    callback_id: '-',
    display_currency: 'VND',
    display_amount: -1200000,
    settlement_currency: 'USDT',
    settlement_amount: -45.36,
    reason: 'Provider 金額與平台換算快照有差異，需由風控確認。',
    current_blocker: 'Provider 金額差異 0.02 USDT',
    suggested_action: 'manual_review',
    idempotency_key: 'idem-ledger-out-77410',
    retry_count: 0,
    max_retry: 0,
    created_at: '2026-07-06T14:18:00.000Z',
    updated_at: '2026-07-06T14:18:00.000Z',
    request_payload: '{"transaction_id":"TX-20260706-000921","expected_amount":"45.36"}',
    response_payload: '{"provider_amount":"45.34","diff":"0.02"}',
    provider_payload: '{"status":"SUCCESS","amount":"45.34"}',
    ledger_payload: '{"status":"FAILED","reason":"wallet frozen"}',
    steps: [
      { step: '建立補單', action: 'manual_review', status: 'done', operator: 'Risk', operated_at: '2026-07-06T14:18:00.000Z', trace_id: 'trace-rp-77410-create', note: '金額差異進入人工判斷' },
      { step: '人工審核', action: 'manual_review', status: 'manual_review', operator: 'Risk', operated_at: '2026-07-06T14:18:00.000Z', trace_id: 'trace-rp-77410-review', note: '等待風控確認調整方式' }
    ],
    logs: [
      { action: '標記人工審核', operator: 'Risk', operated_at: '2026-07-06T14:18:00.000Z', result: 'manual_review' }
    ]
  },
  {
    repair_id: 'RP-20260707-000021',
    repair_type: 'Ledger Failed',
    status: 'failed',
    priority: 'medium',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_name: 'SEA Sub Agent 01',
    merchant_player_id: 'nova_7711',
    wallet_mode: 'transfer',
    provider_name: 'GGAP Ledger',
    transaction_id: '-',
    round_id: '-',
    transfer_id: 'TR-20260707-000089',
    callback_id: '-',
    display_currency: 'THB',
    display_amount: -5000,
    settlement_currency: 'USDT',
    settlement_amount: -136.64,
    reason: 'Transfer Wallet 轉出使用相同 idempotency key，但 payload 金額不同。',
    current_blocker: 'Idempotency payload mismatch',
    suggested_action: 'manual_review',
    idempotency_key: 'idem-ledger-out-7711-duplicate',
    retry_count: 1,
    max_retry: 1,
    created_at: '2026-07-07T11:02:00.000Z',
    updated_at: '2026-07-07T11:03:00.000Z',
    request_payload: '{"action":"Transfer Out","amount":5000,"currency":"THB"}',
    response_payload: '{"error":"IDEMPOTENCY_PAYLOAD_MISMATCH"}',
    provider_payload: '-',
    ledger_payload: '{"original_amount":3000,"new_amount":5000}',
    steps: [
      { step: '建立補單', action: 'repair_ledger', status: 'done', operator: 'System', operated_at: '2026-07-07T11:02:00.000Z', trace_id: 'trace-rp-dup-create', note: '偵測 idempotency payload mismatch' },
      { step: '檢查 Idempotency', action: 'manual_review', status: 'failed', operator: 'System', operated_at: '2026-07-07T11:03:00.000Z', trace_id: 'trace-rp-dup-check', note: '不允許自動重送，轉人工確認' }
    ],
    logs: [
      { action: '檢查 Idempotency', operator: 'System', operated_at: '2026-07-07T11:03:00.000Z', result: 'payload_mismatch' }
    ]
  }
])

const typeOptions = ['Callback Failed', 'Provider Pending', 'Ledger Failed', 'Amount Mismatch', 'Rollback Required'].map(value => ({ label: value, value }))
const statusOptions = [
  { label: '新建', value: 'new' },
  { label: '處理中', value: 'processing' },
  { label: '等待中', value: 'waiting' },
  { label: '已完成', value: 'done' },
  { label: '失敗', value: 'failed' },
  { label: '人工審核', value: 'manual_review' }
]
const priorityOptions = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]
const walletOptions = [
  { label: 'Seamless', value: 'seamless' },
  { label: 'Transfer', value: 'transfer' }
]

const statusMeta: Record<RepairStatus, { label: string; type: StatusTagType }> = {
  new: { label: '新建', type: 'info' },
  processing: { label: '處理中', type: 'warning' },
  waiting: { label: '等待中', type: 'default' },
  done: { label: '已完成', type: 'success' },
  failed: { label: '失敗', type: 'error' },
  manual_review: { label: '人工審核', type: 'warning' }
}

const priorityMeta: Record<RepairPriority, { label: string; type: 'success' | 'warning' | 'error' }> = {
  high: { label: '高', type: 'error' },
  medium: { label: '中', type: 'warning' },
  low: { label: '低', type: 'success' }
}

const actionLabel: Record<RepairAction, string> = {
  resend_callback: '重送 Callback',
  query_provider: 'Provider 查單',
  repair_ledger: '修復 Ledger',
  create_rollback: '建立 Rollback',
  manual_review: '人工審核'
}

const merchantOptions = computed(() => Array.from(new Set(rows.value.map(row => row.merchant_name))).map(value => ({ label: value, value })))
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-TW') : '-'
const walletModeLabel = (mode: WalletMode) => mode === 'seamless' ? 'Seamless' : 'Transfer'

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const inKeyword = !keyword
      || row.repair_id.toLowerCase().includes(keyword)
      || row.transaction_id.toLowerCase().includes(keyword)
      || row.round_id.toLowerCase().includes(keyword)
      || row.transfer_id.toLowerCase().includes(keyword)
      || row.callback_id.toLowerCase().includes(keyword)
      || row.idempotency_key.toLowerCase().includes(keyword)
      || row.merchant_player_id.toLowerCase().includes(keyword)
    const inMerchant = !merchantFilter.value || row.merchant_name === merchantFilter.value
    const inType = !typeFilter.value || row.repair_type === typeFilter.value
    const inStatus = !statusFilter.value || row.status === statusFilter.value
    const inPriority = !priorityFilter.value || row.priority === priorityFilter.value
    const inWallet = !walletFilter.value || row.wallet_mode === walletFilter.value
    return inKeyword && inMerchant && inType && inStatus && inPriority && inWallet
  })
})

const summary = computed(() => ({
  total: filteredRows.value.length,
  high: filteredRows.value.filter(row => row.priority === 'high').length,
  processing: filteredRows.value.filter(row => row.status === 'processing').length,
  waiting: filteredRows.value.filter(row => row.status === 'waiting' || row.status === 'manual_review').length,
  failed: filteredRows.value.filter(row => row.status === 'failed').length,
  retry: filteredRows.value.reduce((sum, row) => sum + row.retry_count, 0)
}))

const resetFilters = () => {
  searchText.value = ''
  merchantFilter.value = null
  typeFilter.value = null
  statusFilter.value = null
  priorityFilter.value = null
  walletFilter.value = null
}

const openDetail = (row: RepairJob) => {
  detailTab.value = 'basic'
  currentRow.value = row
  showDetail.value = true
}

const actionMessage = (action: string, row: RepairJob) => {
  message.info(`${action} 已建立演示操作：${row.repair_id}`)
}

const columns: DataTableColumns<RepairJob> = [
  {
    title: '補單編號',
    key: 'repair_id',
    width: 170,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openDetail(row) }, row.repair_id)
  },
  { title: '類型', key: 'repair_type', width: 160 },
  { title: '狀態', key: 'status', width: 120, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false }, { default: () => statusMeta[row.status].label }) },
  { title: '優先級', key: 'priority', width: 100, render: row => h(NTag, { type: priorityMeta[row.priority].type, bordered: false }, { default: () => priorityMeta[row.priority].label }) },
  {
    title: '商戶',
    key: 'merchant_name',
    width: 220,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'font-semibold' }, row.merchant_name),
      h('span', { class: 'font-mono text-xs text-gray-500' }, row.merchant_id)
    ])
  },
  { title: '會員', key: 'merchant_player_id', width: 140, render: row => h('span', { class: 'font-mono' }, row.merchant_player_id) },
  { title: '錢包模式', key: 'wallet_mode', width: 120, render: row => h(NTag, { type: row.wallet_mode === 'transfer' ? 'warning' : 'info', bordered: false }, { default: () => walletModeLabel(row.wallet_mode) }) },
  { title: 'Provider', key: 'provider_name', width: 150 },
  { title: '交易 / 轉點', key: 'refs', width: 230, render: row => h('div', { class: 'flex flex-col gap-1 font-mono text-xs text-gray-400' }, [h('span', row.transaction_id), h('span', row.transfer_id)]) },
  { title: 'USDT 金額', key: 'settlement_amount', width: 140, align: 'right', render: row => h(MoneyText, { value: row.settlement_amount, currency: 'USDT', compact: true, showSign: true }) },
  { title: '建議操作', key: 'suggested_action', width: 150, render: row => actionLabel[row.suggested_action] },
  { title: '重試', key: 'retry_count', width: 90, align: 'right', render: row => `${row.retry_count}/${row.max_retry}` },
  { title: '更新時間', key: 'updated_at', width: 180, render: row => formatDateTime(row.updated_at) },
  {
    title: '操作',
    key: 'actions',
    width: 330,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, {
          icon: () => h(NIcon, null, { default: () => h(VisibilityOutlined) }),
          default: () => '查看'
        }),
        h(NButton, { size: 'small', secondary: true, disabled: row.suggested_action !== 'resend_callback', onClick: () => actionMessage('重送 Callback', row) }, {
          icon: () => h(NIcon, null, { default: () => h(ReplayOutlined) }),
          default: () => '重送'
        }),
        h(NButton, { size: 'small', secondary: true, disabled: row.suggested_action !== 'query_provider', onClick: () => actionMessage('Provider 查單', row) }, { default: () => '查單' }),
        h(NButton, { size: 'small', secondary: true, type: 'warning', onClick: () => actionMessage('標記人工審核', row) }, { default: () => '人工' })
      ]
    })
  }
]

const stepColumns: DataTableColumns<RepairStep> = [
  { title: '步驟', key: 'step', width: 150 },
  { title: '操作', key: 'action', width: 150, render: row => actionLabel[row.action] },
  { title: '狀態', key: 'status', width: 120, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false }, { default: () => statusMeta[row.status].label }) },
  { title: '操作人', key: 'operator', width: 110 },
  { title: 'Trace ID', key: 'trace_id', width: 210, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.trace_id) },
  { title: '說明', key: 'note', minWidth: 260 },
  { title: '操作時間', key: 'operated_at', width: 180, render: row => formatDateTime(row.operated_at) }
]

const logColumns: DataTableColumns<RepairLog> = [
  { title: '操作', key: 'action' },
  { title: '操作人', key: 'operator', width: 120 },
  { title: '結果', key: 'result', width: 160 },
  { title: '操作時間', key: 'operated_at', width: 180, render: row => formatDateTime(row.operated_at) }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">補單 / 重送</h1>
        <p class="mt-1 text-sm text-gray-500">
          處理 Callback failed、Provider pending、Transfer Ledger failed、金額差異與人工補單流程。
        </p>
      </div>
      <n-button type="primary" secondary @click="message.info('已建立補單演示')">
        <template #icon><n-icon><BuildOutlined /></n-icon></template>
        建立補單
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="補單總數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="高優先級" :value="summary.high" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="處理中" :value="summary.processing" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="等待 / 人工" :value="summary.waiting" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="失敗" :value="summary.failed" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="重送次數" :value="summary.retry" /></div>
    </div>

    <n-alert type="warning" :show-icon="false">
      補單 / 重送必須保留 idempotency、trace_id 與原始 request / response。禁止直接覆蓋歷史交易，只能追加修復紀錄。
    </n-alert>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#202026] p-4">
      <n-input v-model:value="searchText" clearable placeholder="搜尋補單 / 交易 / Round / 轉點 / Callback / idempotency" style="width: 340px; max-width: 100%;">
        <template #prefix><n-icon :component="SearchOutlined" class="opacity-60" /></template>
      </n-input>
      <n-select v-model:value="merchantFilter" clearable filterable placeholder="商戶" :options="merchantOptions" style="width: 180px;" />
      <n-select v-model:value="typeFilter" clearable placeholder="補單類型" :options="typeOptions" style="width: 160px;" />
      <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" style="width: 140px;" />
      <n-select v-model:value="priorityFilter" clearable placeholder="優先級" :options="priorityOptions" style="width: 120px;" />
      <n-select v-model:value="walletFilter" clearable placeholder="錢包模式" :options="walletOptions" style="width: 140px;" />
      <n-button secondary @click="resetFilters">重置</n-button>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="2460"
    />

    <n-drawer v-model:show="showDetail" width="min(1120px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold">{{ currentRow.repair_id }}</span>
            <n-tag :type="priorityMeta[currentRow.priority].type" :bordered="false">優先級 {{ priorityMeta[currentRow.priority].label }}</n-tag>
            <n-tag :type="statusMeta[currentRow.status].type" :bordered="false">{{ statusMeta[currentRow.status].label }}</n-tag>
            <n-tag :bordered="false">{{ currentRow.repair_type }}</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="建議操作">{{ actionLabel[currentRow.suggested_action] }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="重試次數">{{ currentRow.retry_count }} / {{ currentRow.max_retry }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="原幣金額"><MoneyText :value="currentRow.display_amount" :currency="currentRow.display_currency" compact show-sign /></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="USDT 金額"><MoneyText :value="currentRow.settlement_amount" currency="USDT" compact show-sign /></n-statistic></div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="商戶">{{ currentRow.merchant_name }} / {{ currentRow.merchant_id }}</n-descriptions-item>
                <n-descriptions-item label="代理">{{ currentRow.agent_name }}</n-descriptions-item>
                <n-descriptions-item label="會員">{{ currentRow.merchant_player_id }}</n-descriptions-item>
                <n-descriptions-item label="錢包模式">{{ walletModeLabel(currentRow.wallet_mode) }}</n-descriptions-item>
                <n-descriptions-item label="Provider">{{ currentRow.provider_name }}</n-descriptions-item>
                <n-descriptions-item label="目前阻塞">{{ currentRow.current_blocker }}</n-descriptions-item>
                <n-descriptions-item label="交易 ID">{{ currentRow.transaction_id }}</n-descriptions-item>
                <n-descriptions-item label="Round ID">{{ currentRow.round_id }}</n-descriptions-item>
                <n-descriptions-item label="Transfer ID">{{ currentRow.transfer_id }}</n-descriptions-item>
                <n-descriptions-item label="Callback ID">{{ currentRow.callback_id }}</n-descriptions-item>
                <n-descriptions-item label="Idempotency Key" :span="2">{{ currentRow.idempotency_key }}</n-descriptions-item>
                <n-descriptions-item label="原因" :span="2">{{ currentRow.reason }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="payload" tab="Request / Response">
              <n-descriptions bordered :column="1" label-placement="top">
                <n-descriptions-item label="Repair Request"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentRow.request_payload }}</pre></n-descriptions-item>
                <n-descriptions-item label="Repair Response"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentRow.response_payload }}</pre></n-descriptions-item>
                <n-descriptions-item label="Provider Payload"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentRow.provider_payload }}</pre></n-descriptions-item>
                <n-descriptions-item label="Ledger Payload"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentRow.ledger_payload }}</pre></n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="steps" tab="修復步驟">
              <n-data-table :columns="withTableSorters(stepColumns)" :data="currentRow.steps" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1170" />
            </n-tab-pane>

            <n-tab-pane name="timeline" tab="時間軸">
              <n-timeline>
                <n-timeline-item v-for="step in currentRow.steps" :key="step.trace_id" :type="statusMeta[step.status].type" :title="step.step" :time="formatDateTime(step.operated_at)">
                  <div class="text-sm text-gray-500">{{ step.note }}</div>
                  <div class="mt-1 font-mono text-xs text-gray-600">{{ step.trace_id }}</div>
                </n-timeline-item>
              </n-timeline>
            </n-tab-pane>

            <n-tab-pane name="logs" tab="操作紀錄">
              <n-data-table :columns="withTableSorters(logColumns)" :data="currentRow.logs" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <div v-if="currentRow" class="flex flex-wrap justify-end gap-2">
            <n-button secondary :disabled="currentRow.suggested_action !== 'resend_callback'" @click="actionMessage('重送 Callback', currentRow)">重送 Callback</n-button>
            <n-button secondary :disabled="currentRow.suggested_action !== 'query_provider'" @click="actionMessage('Provider 查單', currentRow)">Provider 查單</n-button>
            <n-button secondary :disabled="currentRow.suggested_action !== 'repair_ledger'" @click="actionMessage('修復 Ledger', currentRow)">修復 Ledger</n-button>
            <n-button secondary :disabled="currentRow.suggested_action !== 'create_rollback'" @click="actionMessage('建立 Rollback', currentRow)">建立 Rollback</n-button>
            <n-button type="primary" secondary @click="actionMessage('送交審核', currentRow)">送交審核</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
