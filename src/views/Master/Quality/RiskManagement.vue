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
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NStatistic,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { EditOutlined, PlayArrowOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type RiskType = 'member' | 'bet' | 'transaction' | 'merchant' | 'agent' | 'api' | 'device'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
type RiskStatus = 'enabled' | 'disabled' | 'review'
type RiskAction = 'log' | 'alert' | 'block_bet' | 'limit_api' | 'suspend_member' | 'suspend_merchant' | 'manual_review'

interface RiskHit {
  hit_id: string
  time: string
  target: string
  source: string
  trace_id: string
  status: 'blocked' | 'reviewed' | 'ignored'
}

interface RiskRule {
  rule_id: string
  name: string
  type: RiskType
  level: RiskLevel
  target_scope: string
  condition: string
  threshold: string
  window: string
  currency_basis: 'settlement_currency' | 'display_currency' | 'both'
  action: RiskAction
  notify: boolean
  manual_review: boolean
  hits_today: number
  status: RiskStatus
  updated_at: string
  owner: string
  hits: RiskHit[]
  logs: Array<{ action: string; operator: string; time: string; trace_id: string }>
}

const message = useMessage()
const keyword = ref('')
const typeFilter = ref<RiskType | null>(null)
const levelFilter = ref<RiskLevel | null>(null)
const statusFilter = ref<RiskStatus | null>(null)
const showDetail = ref(false)
const showEditor = ref(false)
const editorMode = ref<'create' | 'edit'>('create')
const currentRule = ref<RiskRule | null>(null)
const form = ref({
  rule_id: '',
  name: '',
  type: 'api' as RiskType,
  level: 'medium' as RiskLevel,
  target_scope: '商戶',
  condition: '',
  threshold: '',
  window: '10 分鐘',
  currency_basis: 'settlement_currency' as RiskRule['currency_basis'],
  action: 'alert' as RiskAction,
  notify: true,
  manual_review: false,
  status: 'enabled' as RiskStatus
})

const rules = ref<RiskRule[]>([
  {
    rule_id: 'RISK-API-001',
    name: 'Callback Timeout 過高',
    type: 'api',
    level: 'high',
    target_scope: '商戶',
    condition: '10 分鐘內 Callback Timeout >= 20 筆',
    threshold: '20 筆',
    window: '10 分鐘',
    currency_basis: 'settlement_currency',
    action: 'limit_api',
    notify: true,
    manual_review: true,
    hits_today: 26,
    status: 'enabled',
    updated_at: '2026-07-07T10:40:00+08:00',
    owner: 'Risk Team',
    hits: [
      { hit_id: 'RH-20260707-001', time: '2026-07-07T10:38:00+08:00', target: 'OP-1001', source: 'Callback Service', trace_id: 'trace-cb-timeout-op1001', status: 'blocked' },
      { hit_id: 'RH-20260707-002', time: '2026-07-07T10:31:00+08:00', target: 'OP-1006', source: 'Callback Service', trace_id: 'trace-cb-timeout-op1006', status: 'reviewed' }
    ],
    logs: [
      { action: '觸發風控告警', operator: 'System', time: '2026-07-07T10:38:00+08:00', trace_id: 'trace-cb-timeout-op1001' },
      { action: '更新規則條件', operator: 'admin', time: '2026-07-06T16:20:00+08:00', trace_id: 'trace-risk-api-update' }
    ]
  },
  {
    rule_id: 'RISK-BET-002',
    name: '會員短時間下注頻率過高',
    type: 'bet',
    level: 'medium',
    target_scope: '會員',
    condition: '5 分鐘內下注筆數 >= 120',
    threshold: '120 筆',
    window: '5 分鐘',
    currency_basis: 'display_currency',
    action: 'alert',
    notify: true,
    manual_review: false,
    hits_today: 12,
    status: 'enabled',
    updated_at: '2026-07-07T09:20:00+08:00',
    owner: 'Operations',
    hits: [
      { hit_id: 'RH-20260707-003', time: '2026-07-07T09:18:00+08:00', target: 'mem_8842 / TWD', source: 'Bet Monitor', trace_id: 'trace-bet-frequency-8842', status: 'reviewed' }
    ],
    logs: [
      { action: '測試規則成功', operator: 'ops02', time: '2026-07-07T09:10:00+08:00', trace_id: 'trace-risk-bet-test' }
    ]
  },
  {
    rule_id: 'RISK-MER-003',
    name: '商戶負 GGR 異常波動',
    type: 'merchant',
    level: 'high',
    target_scope: '商戶',
    condition: '單日 settlement_ggr 低於近七日均值 80%',
    threshold: '80%',
    window: '日結帳期',
    currency_basis: 'settlement_currency',
    action: 'manual_review',
    notify: true,
    manual_review: true,
    hits_today: 3,
    status: 'review',
    updated_at: '2026-07-07T01:30:00+08:00',
    owner: 'Finance + Risk',
    hits: [
      { hit_id: 'RH-20260707-004', time: '2026-07-07T01:28:00+08:00', target: 'OP-1008', source: 'Settlement Engine', trace_id: 'trace-negative-ggr-op1008', status: 'blocked' }
    ],
    logs: [
      { action: '進入人工覆核', operator: 'System', time: '2026-07-07T01:30:00+08:00', trace_id: 'trace-negative-ggr-op1008' }
    ]
  },
  {
    rule_id: 'RISK-DEV-004',
    name: '同 IP 多會員登入',
    type: 'device',
    level: 'low',
    target_scope: '會員 / IP',
    condition: '30 分鐘內同 IP 登入會員 >= 25',
    threshold: '25 會員',
    window: '30 分鐘',
    currency_basis: 'both',
    action: 'log',
    notify: false,
    manual_review: false,
    hits_today: 7,
    status: 'disabled',
    updated_at: '2026-07-05T12:10:00+08:00',
    owner: 'Risk Team',
    hits: [],
    logs: [
      { action: '停用規則', operator: 'admin', time: '2026-07-05T12:10:00+08:00', trace_id: 'trace-risk-device-disable' }
    ]
  }
])

const typeOptions = [
  { label: '會員風控', value: 'member' },
  { label: '下注風控', value: 'bet' },
  { label: '交易風控', value: 'transaction' },
  { label: '商戶風控', value: 'merchant' },
  { label: '代理風控', value: 'agent' },
  { label: 'API 風控', value: 'api' },
  { label: 'IP / 裝置風控', value: 'device' }
]
const levelOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' }
]
const statusOptions = [
  { label: '啟用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
  { label: '覆核中', value: 'review' }
]
const actionOptions = [
  { label: '只記錄', value: 'log' },
  { label: '告警通知', value: 'alert' },
  { label: '阻擋下注', value: 'block_bet' },
  { label: '限制 API', value: 'limit_api' },
  { label: '停權會員', value: 'suspend_member' },
  { label: '停權商戶', value: 'suspend_merchant' },
  { label: '人工覆核', value: 'manual_review' }
]
const currencyBasisOptions = [
  { label: 'USDT 結算幣別', value: 'settlement_currency' },
  { label: '交易幣別', value: 'display_currency' },
  { label: '雙幣別', value: 'both' }
]

const typeLabel = (value: RiskType) => typeOptions.find(option => option.value === value)?.label || value
const actionLabel = (value: RiskAction) => actionOptions.find(option => option.value === value)?.label || value
const formatDateTime = (value: string) => new Date(value).toLocaleString()

const levelMeta: Record<RiskLevel, { label: string; type: 'success' | 'info' | 'warning' | 'error' }> = {
  low: { label: 'Low', type: 'success' },
  medium: { label: 'Medium', type: 'info' },
  high: { label: 'High', type: 'warning' },
  critical: { label: 'Critical', type: 'error' }
}

const statusMeta: Record<RiskStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  enabled: { label: '啟用', type: 'success' },
  disabled: { label: '停用', type: 'warning' },
  review: { label: '覆核中', type: 'error' }
}

const filteredRules = computed(() => rules.value.filter((rule) => {
  const text = keyword.value.trim().toLowerCase()
  const matchesKeyword = !text
    || rule.rule_id.toLowerCase().includes(text)
    || rule.name.toLowerCase().includes(text)
    || rule.target_scope.toLowerCase().includes(text)
    || rule.condition.toLowerCase().includes(text)
  const matchesType = !typeFilter.value || rule.type === typeFilter.value
  const matchesLevel = !levelFilter.value || rule.level === levelFilter.value
  const matchesStatus = !statusFilter.value || rule.status === statusFilter.value
  return matchesKeyword && matchesType && matchesLevel && matchesStatus
}))

const summary = computed(() => ({
  enabled: rules.value.filter(rule => rule.status === 'enabled').length,
  hits: rules.value.reduce((sum, rule) => sum + rule.hits_today, 0),
  high: rules.value.filter(rule => ['high', 'critical'].includes(rule.level)).length,
  pending: rules.value.flatMap(rule => rule.hits).filter(hit => hit.status === 'blocked').length
}))

const openDetail = (row: RiskRule) => {
  currentRule.value = row
  showDetail.value = true
}

const openCreate = () => {
  editorMode.value = 'create'
  form.value = {
    rule_id: `RISK-${Date.now().toString().slice(-4)}`,
    name: '',
    type: 'api',
    level: 'medium',
    target_scope: '商戶',
    condition: '',
    threshold: '',
    window: '10 分鐘',
    currency_basis: 'settlement_currency',
    action: 'alert',
    notify: true,
    manual_review: false,
    status: 'enabled'
  }
  showEditor.value = true
}

const openEdit = (row: RiskRule) => {
  editorMode.value = 'edit'
  currentRule.value = row
  form.value = {
    rule_id: row.rule_id,
    name: row.name,
    type: row.type,
    level: row.level,
    target_scope: row.target_scope,
    condition: row.condition,
    threshold: row.threshold,
    window: row.window,
    currency_basis: row.currency_basis,
    action: row.action,
    notify: row.notify,
    manual_review: row.manual_review,
    status: row.status
  }
  showEditor.value = true
}

const saveRule = () => {
  if (!form.value.name || !form.value.condition || !form.value.threshold) {
    message.warning('請填寫規則名稱、條件與門檻')
    return
  }
  if (editorMode.value === 'create') {
    rules.value.unshift({
      ...form.value,
      hits_today: 0,
      updated_at: new Date().toISOString(),
      owner: 'Risk Team',
      hits: [],
      logs: [{ action: '新增風控規則', operator: 'admin', time: new Date().toISOString(), trace_id: `trace-risk-create-${Date.now()}` }]
    })
    message.success('規則已建立')
  } else {
    const row = rules.value.find(rule => rule.rule_id === form.value.rule_id)
    if (row) {
      Object.assign(row, form.value, { updated_at: new Date().toISOString() })
      row.logs.unshift({ action: '更新風控規則', operator: 'admin', time: new Date().toISOString(), trace_id: `trace-risk-update-${Date.now()}` })
      message.success('規則已更新')
    }
  }
  showEditor.value = false
}

const toggleRule = (row: RiskRule) => {
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
  row.updated_at = new Date().toISOString()
  row.logs.unshift({ action: row.status === 'enabled' ? '啟用風控規則' : '停用風控規則', operator: 'admin', time: new Date().toISOString(), trace_id: `trace-risk-toggle-${Date.now()}` })
  message.success(`${row.name}：${statusMeta[row.status].label}`)
}

const testRule = (row: RiskRule) => {
  row.logs.unshift({ action: '執行規則測試', operator: 'admin', time: new Date().toISOString(), trace_id: `trace-risk-test-${Date.now()}` })
  message.info(`${row.rule_id} 測試完成，未影響正式資料`)
}

const exportHits = () => {
  message.success('已匯出命中紀錄')
}

const resetFilters = () => {
  keyword.value = ''
  typeFilter.value = null
  levelFilter.value = null
  statusFilter.value = null
}

const hitColumns: DataTableColumns<RiskHit> = [
  { title: '命中時間', key: 'time', render: row => formatDateTime(row.time) },
  { title: '對象', key: 'target' },
  { title: '來源', key: 'source' },
  { title: 'Trace ID', key: 'trace_id' },
  { title: '狀態', key: 'status' }
]

const columns: DataTableColumns<RiskRule> = [
  {
    title: '規則',
    key: 'rule_id',
    width: 230,
    fixed: 'left',
    render: row => h('button', { class: 'text-left text-cyan-500 hover:text-cyan-400', onClick: () => openDetail(row) }, [
      h('div', { class: 'font-mono text-xs' }, row.rule_id),
      h('div', { class: 'font-semibold' }, row.name)
    ])
  },
  { title: '類型', key: 'type', width: 130, render: row => typeLabel(row.type) },
  { title: '等級', key: 'level', width: 90, render: row => h(NTag, { type: levelMeta[row.level].type, bordered: false, size: 'small' }, { default: () => levelMeta[row.level].label }) },
  { title: '套用對象', key: 'target_scope', width: 120 },
  { title: '觸發條件', key: 'condition', minWidth: 260, ellipsis: { tooltip: true } },
  { title: '動作', key: 'action', width: 130, render: row => actionLabel(row.action) },
  { title: '今日命中', key: 'hits_today', width: 100, align: 'right' },
  { title: '狀態', key: 'status', width: 100, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false, size: 'small' }, { default: () => statusMeta[row.status].label }) },
  { title: '更新時間', key: 'updated_at', width: 180, render: row => formatDateTime(row.updated_at) },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(VisibilityOutlined), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => openEdit(row) }, { icon: () => h(EditOutlined), default: () => '編輯' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => testRule(row) }, { icon: () => h(PlayArrowOutlined), default: () => '測試' }),
        h(NButton, { size: 'small', type: row.status === 'enabled' ? 'warning' : 'primary', secondary: true, onClick: () => toggleRule(row) }, { default: () => row.status === 'enabled' ? '停用' : '啟用' })
      ]
    })
  }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">風控管理</h1>
        <p class="mt-1 text-sm text-gray-500">
          管理會員、下注、交易、商戶、代理、API 與裝置規則，記錄命中、測試與操作紀錄。
        </p>
      </div>
      <div class="flex gap-2">
        <n-button secondary @click="exportHits">匯出命中紀錄</n-button>
        <n-button type="primary" @click="openCreate">新增規則</n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="啟用規則" :value="summary.enabled" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="今日命中" :value="summary.hits" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="高風險規則" :value="summary.high" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="待處理命中" :value="summary.pending" /></div>
    </div>

    <n-alert type="info" :show-icon="false">
      風控規則只負責告警、限制、阻擋或人工覆核；若需補單、帳務調整或商戶狀態變更，需由對應模組執行。
    </n-alert>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="keyword" clearable placeholder="搜尋規則名稱 / 規則 ID / 對象 / 條件" class="xl:col-span-4">
          <template #prefix><n-icon :component="SearchOutlined" /></template>
        </n-input>
        <n-select v-model:value="typeFilter" clearable placeholder="風控類型" :options="typeOptions" class="xl:col-span-2" />
        <n-select v-model:value="levelFilter" clearable placeholder="風險等級" :options="levelOptions" class="xl:col-span-2" />
        <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-data-table :columns="withTableSorters(columns)" :data="filteredRules" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1640" />

    <n-drawer v-model:show="showDetail" width="min(980px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRule" class="flex items-center gap-3">
            <span class="font-mono font-semibold">{{ currentRule.rule_id }}</span>
            <span>{{ currentRule.name }}</span>
            <n-tag :type="levelMeta[currentRule.level].type" :bordered="false">{{ levelMeta[currentRule.level].label }}</n-tag>
            <n-tag :type="statusMeta[currentRule.status].type" :bordered="false">{{ statusMeta[currentRule.status].label }}</n-tag>
          </div>
        </template>

        <template v-if="currentRule">
          <n-tabs type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="風控類型">{{ typeLabel(currentRule.type) }}</n-descriptions-item>
                <n-descriptions-item label="套用對象">{{ currentRule.target_scope }}</n-descriptions-item>
                <n-descriptions-item label="觀察窗口">{{ currentRule.window }}</n-descriptions-item>
                <n-descriptions-item label="門檻">{{ currentRule.threshold }}</n-descriptions-item>
                <n-descriptions-item label="幣別基準">{{ currentRule.currency_basis }}</n-descriptions-item>
                <n-descriptions-item label="負責人">{{ currentRule.owner }}</n-descriptions-item>
                <n-descriptions-item label="觸發條件" :span="2">{{ currentRule.condition }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>
            <n-tab-pane name="action" tab="動作設定">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="執行動作">{{ actionLabel(currentRule.action) }}</n-descriptions-item>
                <n-descriptions-item label="通知">{{ currentRule.notify ? '通知風控 / 維運' : '不通知' }}</n-descriptions-item>
                <n-descriptions-item label="人工覆核">{{ currentRule.manual_review ? '需要' : '不需要' }}</n-descriptions-item>
                <n-descriptions-item label="操作">啟用、停用、測試、編輯規則</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>
            <n-tab-pane name="hits" tab="命中紀錄">
              <n-data-table :columns="withTableSorters(hitColumns)" :data="currentRule.hits" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>
            <n-tab-pane name="logs" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item
                  v-for="log in currentRule.logs"
                  :key="log.trace_id"
                  type="success"
                  :title="log.action"
                  :content="`${log.operator} / ${log.trace_id}`"
                  :time="formatDateTime(log.time)"
                />
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>
        <template #footer>
          <div v-if="currentRule" class="flex justify-end gap-2">
            <n-button secondary @click="testRule(currentRule)">執行測試</n-button>
            <n-button type="primary" secondary @click="openEdit(currentRule)">編輯規則</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showEditor" preset="card" :title="editorMode === 'create' ? '新增風控規則' : '編輯風控規則'" style="width: min(760px, 94vw);">
      <n-form label-placement="left" label-width="110">
        <n-form-item label="規則 ID">
          <n-input v-model:value="form.rule_id" disabled />
        </n-form-item>
        <n-form-item label="規則名稱">
          <n-input v-model:value="form.name" placeholder="請輸入規則名稱" />
        </n-form-item>
        <n-form-item label="類型 / 等級">
          <div class="grid w-full grid-cols-2 gap-3">
            <n-select v-model:value="form.type" :options="typeOptions" />
            <n-select v-model:value="form.level" :options="levelOptions" />
          </div>
        </n-form-item>
        <n-form-item label="套用對象">
          <n-input v-model:value="form.target_scope" />
        </n-form-item>
        <n-form-item label="條件">
          <n-input v-model:value="form.condition" type="textarea" />
        </n-form-item>
        <n-form-item label="門檻 / 窗口">
          <div class="grid w-full grid-cols-2 gap-3">
            <n-input v-model:value="form.threshold" />
            <n-input v-model:value="form.window" />
          </div>
        </n-form-item>
        <n-form-item label="幣別基準">
          <n-select v-model:value="form.currency_basis" :options="currencyBasisOptions" />
        </n-form-item>
        <n-form-item label="動作">
          <n-select v-model:value="form.action" :options="actionOptions" />
        </n-form-item>
        <n-form-item label="通知 / 覆核">
          <div class="flex gap-6">
            <span class="flex items-center gap-2"><n-switch v-model:value="form.notify" /> 通知</span>
            <span class="flex items-center gap-2"><n-switch v-model:value="form.manual_review" /> 人工覆核</span>
          </div>
        </n-form-item>
        <n-form-item label="狀態">
          <n-select v-model:value="form.status" :options="statusOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button secondary @click="showEditor = false">取消</n-button>
          <n-button type="primary" @click="saveRule">儲存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>
