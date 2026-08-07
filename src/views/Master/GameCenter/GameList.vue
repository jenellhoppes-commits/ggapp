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
  NInputNumber,
  NModal,
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
import { ReplayOutlined, SearchOutlined, SettingsOutlined, VisibilityOutlined } from '@vicons/material'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type GameStatus = 'active' | 'maintenance' | 'disabled'
type GameType = 'Slot' | 'Live' | 'Fishing' | 'Sports'
type DeviceType = 'Desktop' | 'Mobile' | 'H5'
type MaintenanceScheduleType = 'none' | 'weekly' | 'monthly'

interface MerchantAuthorization {
  merchant_id: string
  merchant_name: string
  agent_name: string
  status: 'enabled' | 'disabled'
  custom_sort: number
}

interface OperationLog {
  action: string
  operator: string
  operated_at: string
  trace_id: string
}

interface GameRow {
  game_id: string
  provider_id: string
  provider_name: string
  provider_game_code: string
  game_name: string
  game_name_zh: string
  game_type: GameType
  status: GameStatus
  rtp: number
  volatility: 'Low' | 'Medium' | 'High'
  supported_devices: DeviceType[]
  supported_display_currencies: string[]
  settlement_currency: 'USDT'
  merchant_enabled_count: number
  last_synced_at: string
  maintenance_reason: string
  maintenance_schedule_type: MaintenanceScheduleType
  maintenance_weekday?: number
  maintenance_month_day?: number
  maintenance_time?: string
  maintenance_duration_minutes?: number
  next_maintenance_at?: string
  thumbnail_text: string
  authorizations: MerchantAuthorization[]
  logs: OperationLog[]
}

const message = useMessage()
const showDetail = ref(false)
const showScheduleEditor = ref(false)
const detailTab = ref('basic')
const currentRow = ref<GameRow | null>(null)
const scheduleTarget = ref<GameRow | null>(null)
const scheduleForm = ref({
  maintenance_schedule_type: 'none' as MaintenanceScheduleType,
  maintenance_weekday: 2,
  maintenance_month_day: 1,
  maintenance_time: '05:00',
  maintenance_duration_minutes: 30,
  next_maintenance_at: ''
})
const keyword = ref('')
const providerFilter = ref<string | null>(null)
const typeFilter = ref<GameType | null>(null)
const statusFilter = ref<GameStatus | null>(null)

const rows = ref<GameRow[]>([
  {
    game_id: 'PG-001',
    provider_id: 'PROV-PG',
    provider_name: 'PG Soft',
    provider_game_code: 'pg_mahjong_ways_2',
    game_name: 'Mahjong Ways 2',
    game_name_zh: '麻將胡了 2',
    game_type: 'Slot',
    status: 'active',
    rtp: 96.95,
    volatility: 'Medium',
    supported_devices: ['Desktop', 'Mobile', 'H5'],
    supported_display_currencies: ['TWD', 'PHP', 'THB', 'VND', 'IDR'],
    settlement_currency: 'USDT',
    merchant_enabled_count: 18,
    last_synced_at: '2026-07-07T08:30:00.000Z',
    maintenance_reason: '-',
    maintenance_schedule_type: 'weekly',
    maintenance_weekday: 2,
    maintenance_time: '05:00',
    maintenance_duration_minutes: 30,
    next_maintenance_at: '2026-07-14T05:00:00.000+08:00',
    thumbnail_text: 'MW2',
    authorizations: [
      { merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', agent_name: '平台直營代理', status: 'enabled', custom_sort: 1 },
      { merchant_id: 'OP-1006', merchant_name: 'Lucky Panda Studio', agent_name: 'SEA Growth Agent', status: 'enabled', custom_sort: 3 }
    ],
    logs: [
      { action: 'Provider 同步遊戲', operator: 'System', operated_at: '2026-07-07T08:30:00.000Z', trace_id: 'trace-game-pg001-sync' },
      { action: '設定熱門排序', operator: 'Content', operated_at: '2026-07-07T09:00:00.000Z', trace_id: 'trace-game-pg001-sort' }
    ]
  },
  {
    game_id: 'PG-002',
    provider_id: 'PROV-PG',
    provider_name: 'PG Soft',
    provider_game_code: 'pg_lucky_neko',
    game_name: 'Lucky Neko',
    game_name_zh: '幸運招財貓',
    game_type: 'Slot',
    status: 'active',
    rtp: 96.73,
    volatility: 'High',
    supported_devices: ['Desktop', 'Mobile', 'H5'],
    supported_display_currencies: ['TWD', 'PHP', 'THB'],
    settlement_currency: 'USDT',
    merchant_enabled_count: 15,
    last_synced_at: '2026-07-07T08:30:00.000Z',
    maintenance_reason: '-',
    maintenance_schedule_type: 'weekly',
    maintenance_weekday: 2,
    maintenance_time: '05:00',
    maintenance_duration_minutes: 30,
    next_maintenance_at: '2026-07-14T05:00:00.000+08:00',
    thumbnail_text: 'NEKO',
    authorizations: [
      { merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', agent_name: '平台直營代理', status: 'enabled', custom_sort: 2 }
    ],
    logs: [
      { action: 'Provider 同步遊戲', operator: 'System', operated_at: '2026-07-07T08:30:00.000Z', trace_id: 'trace-game-pg002-sync' }
    ]
  },
  {
    game_id: 'EVO-001',
    provider_id: 'PROV-EVO',
    provider_name: 'Evolution',
    provider_game_code: 'evo_crazy_time',
    game_name: 'Crazy Time',
    game_name_zh: '瘋狂時刻',
    game_type: 'Live',
    status: 'active',
    rtp: 96.08,
    volatility: 'Medium',
    supported_devices: ['Desktop', 'Mobile'],
    supported_display_currencies: ['TWD', 'PHP', 'THB', 'VND'],
    settlement_currency: 'USDT',
    merchant_enabled_count: 11,
    last_synced_at: '2026-07-07T07:40:00.000Z',
    maintenance_reason: '-',
    maintenance_schedule_type: 'monthly',
    maintenance_month_day: 1,
    maintenance_time: '04:00',
    maintenance_duration_minutes: 60,
    next_maintenance_at: '2026-08-01T04:00:00.000+08:00',
    thumbnail_text: 'LIVE',
    authorizations: [
      { merchant_id: 'OP-1008', merchant_name: 'NovaPlay Entertainment', agent_name: 'L2 Asia Agent', status: 'enabled', custom_sort: 1 }
    ],
    logs: [
      { action: 'Provider 同步遊戲', operator: 'System', operated_at: '2026-07-07T07:40:00.000Z', trace_id: 'trace-game-evo001-sync' }
    ]
  },
  {
    game_id: 'PP-001',
    provider_id: 'PROV-PP',
    provider_name: 'Pragmatic Play',
    provider_game_code: 'pp_sweet_bonanza',
    game_name: 'Sweet Bonanza',
    game_name_zh: '甜蜜寶藏',
    game_type: 'Slot',
    status: 'active',
    rtp: 96.51,
    volatility: 'High',
    supported_devices: ['Desktop', 'Mobile', 'H5'],
    supported_display_currencies: ['PHP', 'THB', 'VND', 'IDR'],
    settlement_currency: 'USDT',
    merchant_enabled_count: 20,
    last_synced_at: '2026-07-07T06:58:00.000Z',
    maintenance_reason: '-',
    maintenance_schedule_type: 'monthly',
    maintenance_month_day: 1,
    maintenance_time: '04:00',
    maintenance_duration_minutes: 60,
    next_maintenance_at: '2026-08-01T04:00:00.000+08:00',
    thumbnail_text: 'SB',
    authorizations: [
      { merchant_id: 'OP-1009', merchant_name: 'Golden Dragon Gaming', agent_name: 'L3 Growth Team', status: 'enabled', custom_sort: 4 }
    ],
    logs: [
      { action: '設定活動曝光', operator: 'Content', operated_at: '2026-07-07T09:15:00.000Z', trace_id: 'trace-game-pp001-campaign' }
    ]
  },
  {
    game_id: 'JILI-001',
    provider_id: 'PROV-JILI',
    provider_name: 'JILI Gaming',
    provider_game_code: 'jili_boxing_king',
    game_name: 'Boxing King',
    game_name_zh: '拳王',
    game_type: 'Slot',
    status: 'maintenance',
    rtp: 97.2,
    volatility: 'Medium',
    supported_devices: ['Mobile', 'H5'],
    supported_display_currencies: ['PHP', 'VND', 'IDR'],
    settlement_currency: 'USDT',
    merchant_enabled_count: 7,
    last_synced_at: '2026-07-07T10:12:00.000Z',
    maintenance_reason: 'Provider API 測試中',
    maintenance_schedule_type: 'none',
    maintenance_time: '05:00',
    maintenance_duration_minutes: 30,
    thumbnail_text: 'JILI',
    authorizations: [
      { merchant_id: 'OP-1006', merchant_name: 'Lucky Panda Studio', agent_name: 'SEA Growth Agent', status: 'disabled', custom_sort: 9 }
    ],
    logs: [
      { action: '設為維護', operator: 'Ops', operated_at: '2026-07-07T10:12:00.000Z', trace_id: 'trace-game-jili001-maintenance' }
    ]
  }
])

const statusMeta: Record<GameStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  active: { label: '啟用', type: 'success' },
  maintenance: { label: '維護中', type: 'warning' },
  disabled: { label: '停用', type: 'error' }
}

const providerOptions = computed(() => Array.from(new Set(rows.value.map(row => row.provider_name))).map(value => ({ label: value, value })))
const typeOptions = ['Slot', 'Live', 'Fishing', 'Sports'].map(value => ({ label: value, value }))
const statusOptions = [
  { label: '啟用', value: 'active' },
  { label: '維護中', value: 'maintenance' },
  { label: '停用', value: 'disabled' }
]
const maintenanceScheduleOptions = [
  { label: '不設定', value: 'none' },
  { label: '每週固定維護', value: 'weekly' },
  { label: '每月固定維護', value: 'monthly' }
]
const weekdayOptions = [
  { label: '週一', value: 1 },
  { label: '週二', value: 2 },
  { label: '週三', value: 3 },
  { label: '週四', value: 4 },
  { label: '週五', value: 5 },
  { label: '週六', value: 6 },
  { label: '週日', value: 0 }
]
const weekdayLabel: Record<number, string> = {
  0: '週日',
  1: '週一',
  2: '週二',
  3: '週三',
  4: '週四',
  5: '週五',
  6: '週六'
}
const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return rows.value.filter(row => {
    const matchesText = !text || [row.game_id, row.game_name, row.game_name_zh, row.provider_game_code, row.provider_name]
      .some(value => value.toLowerCase().includes(text))
    const matchesProvider = !providerFilter.value || row.provider_name === providerFilter.value
    const matchesType = !typeFilter.value || row.game_type === typeFilter.value
    const matchesStatus = !statusFilter.value || row.status === statusFilter.value
    return matchesText && matchesProvider && matchesType && matchesStatus
  })
})

const summary = computed(() => ({
  total: rows.value.length,
  active: rows.value.filter(row => row.status === 'active').length,
  maintenance: rows.value.filter(row => row.status === 'maintenance').length,
  providers: new Set(rows.value.map(row => row.provider_id)).size
}))

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-TW') : '-'
const maintenanceScheduleLabel = (row: GameRow) => {
  if (!row.maintenance_schedule_type || row.maintenance_schedule_type === 'none') return '未設定'
  const time = row.maintenance_time || '05:00'
  const duration = row.maintenance_duration_minutes || 30
  if (row.maintenance_schedule_type === 'weekly') {
    return `每週${weekdayLabel[row.maintenance_weekday ?? 1]} ${time} / ${duration} 分鐘`
  }
  return `每月 ${row.maintenance_month_day || 1} 日 ${time} / ${duration} 分鐘`
}

const resetFilters = () => {
  keyword.value = ''
  providerFilter.value = null
  typeFilter.value = null
  statusFilter.value = null
}

const openDetail = (row: GameRow) => {
  currentRow.value = row
  detailTab.value = 'basic'
  showDetail.value = true
}

const toggleMaintenance = (row: GameRow) => {
  row.status = row.status === 'maintenance' ? 'active' : 'maintenance'
  row.maintenance_reason = row.status === 'maintenance' ? '人工設定維護演示' : '-'
  row.logs.unshift({
    action: row.status === 'maintenance' ? '設為維護' : '解除維護',
    operator: 'Admin',
    operated_at: new Date().toISOString(),
    trace_id: `trace-game-${row.game_id.toLowerCase()}-${Date.now()}`
  })
  message.success(`${row.game_name} 已${row.status === 'maintenance' ? '設為維護' : '解除維護'}`)
}

const openScheduleEditor = (row: GameRow) => {
  scheduleTarget.value = row
  scheduleForm.value = {
    maintenance_schedule_type: row.maintenance_schedule_type || 'none',
    maintenance_weekday: row.maintenance_weekday ?? 2,
    maintenance_month_day: row.maintenance_month_day ?? 1,
    maintenance_time: row.maintenance_time || '05:00',
    maintenance_duration_minutes: row.maintenance_duration_minutes || 30,
    next_maintenance_at: row.next_maintenance_at || ''
  }
  showScheduleEditor.value = true
}

const saveMaintenanceSchedule = () => {
  if (!scheduleTarget.value) return
  scheduleTarget.value.maintenance_schedule_type = scheduleForm.value.maintenance_schedule_type
  scheduleTarget.value.maintenance_weekday = scheduleForm.value.maintenance_weekday
  scheduleTarget.value.maintenance_month_day = scheduleForm.value.maintenance_month_day
  scheduleTarget.value.maintenance_time = scheduleForm.value.maintenance_time
  scheduleTarget.value.maintenance_duration_minutes = scheduleForm.value.maintenance_duration_minutes
  scheduleTarget.value.next_maintenance_at = scheduleForm.value.next_maintenance_at
  scheduleTarget.value.logs.unshift({
    action: '更新固定維護排程',
    operator: 'Admin',
    operated_at: new Date().toISOString(),
    trace_id: `trace-game-${scheduleTarget.value.game_id.toLowerCase()}-schedule-${Date.now()}`
  })
  message.success(`${scheduleTarget.value.game_name} 固定維護排程已更新`)
  showScheduleEditor.value = false
}

const actionMessage = (label: string, row?: GameRow) => {
  message.info(`${label}${row ? `：${row.game_name}` : ''}，演示操作已保留。`)
}

const columns: DataTableColumns<GameRow> = [
  {
    title: '遊戲',
    key: 'game_name',
    width: 280,
    fixed: 'left',
    render: row => h('div', { class: 'flex items-center gap-3' }, [
      h('div', { class: 'flex h-12 w-12 shrink-0 items-center justify-center rounded bg-[#2c2c34] text-xs font-bold text-emerald-300' }, row.thumbnail_text),
      h('div', {}, [
        h('div', { class: 'font-semibold text-slate-100' }, row.game_name),
        h('div', { class: 'text-xs text-slate-500' }, `${row.game_name_zh} / ${row.game_id}`)
      ])
    ])
  },
  { title: '供應商', key: 'provider_name', width: 150, render: row => h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => row.provider_name }) },
  { title: '類型', key: 'game_type', width: 90, render: row => h(NTag, { size: 'small', bordered: false }, { default: () => row.game_type }) },
  { title: 'RTP', key: 'rtp', width: 90, align: 'right', render: row => `${row.rtp.toFixed(2)}%` },
  { title: '狀態', key: 'status', width: 105, render: row => h(NTag, { type: statusMeta[row.status].type, size: 'small', bordered: false }, { default: () => statusMeta[row.status].label }) },
  {
    title: '維護排程',
    key: 'maintenance_schedule',
    width: 210,
    render: row => h('div', { class: 'text-xs text-slate-300' }, [
      h('div', maintenanceScheduleLabel(row)),
      row.next_maintenance_at ? h('div', { class: 'mt-1 text-slate-500' }, `下次 ${formatDateTime(row.next_maintenance_at)}`) : null
    ])
  },
  { title: '商戶啟用', key: 'merchant_enabled_count', width: 110, align: 'right', render: row => `${row.merchant_enabled_count} 家` },
  { title: '裝置', key: 'supported_devices', width: 160, render: row => row.supported_devices.join(' / ') },
  { title: '結算幣別', key: 'settlement_currency', width: 110, render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '同步時間', key: 'last_synced_at', width: 175, render: row => formatDateTime(row.last_synced_at) },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right',
    render: row => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(NIcon, { component: VisibilityOutlined }), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => toggleMaintenance(row) }, { icon: () => h(NIcon, { component: SettingsOutlined }), default: () => row.status === 'maintenance' ? '解除' : '維護' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => openScheduleEditor(row) }, { default: () => '排程' })
      ]
    })
  }
]

const authColumns: DataTableColumns<MerchantAuthorization> = [
  { title: '商戶', key: 'merchant_name', render: row => h('div', {}, [h('div', row.merchant_name), h('div', { class: 'text-xs text-slate-500' }, row.merchant_id)]) },
  { title: '代理', key: 'agent_name' },
  { title: '狀態', key: 'status', render: row => h(NTag, { type: row.status === 'enabled' ? 'success' : 'warning', size: 'small', bordered: false }, { default: () => row.status === 'enabled' ? '啟用' : '停用' }) },
  { title: '排序', key: 'custom_sort', align: 'right' }
]

</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">遊戲管理</h1>
        <p class="mt-1 text-sm text-slate-500">
          管理供應商遊戲、類型、RTP、裝置、商戶授權與每週 / 每月固定維護；下注限額方案統一由供應商幣別管理維護。
        </p>
      </div>
      <n-button type="primary" @click="actionMessage('重新同步供應商遊戲')">
        <template #icon><n-icon :component="ReplayOutlined" /></template>
        重新同步遊戲
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="遊戲總數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="啟用遊戲" :value="summary.active" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="維護中" :value="summary.maintenance" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="供應商數" :value="summary.providers" /></div>
    </div>

    <n-alert type="info" :show-icon="false">
      遊戲管理只影響內容展示、商戶授權與維護狀態；不改變 Provider API、不影響交易流水，也不產生帳務。
    </n-alert>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#18181c] p-4">
      <n-input v-model:value="keyword" clearable placeholder="搜尋遊戲 / 遊戲 ID / Provider Game Code / 供應商" style="width: 340px; max-width: 100%;">
        <template #prefix><n-icon :component="SearchOutlined" /></template>
      </n-input>
      <n-select v-model:value="providerFilter" clearable :options="providerOptions" placeholder="供應商" style="width: 150px;" />
      <n-select v-model:value="typeFilter" clearable :options="typeOptions" placeholder="類型" style="width: 120px;" />
      <n-select v-model:value="statusFilter" clearable :options="statusOptions" placeholder="狀態" style="width: 120px;" />
      <n-button secondary @click="resetFilters">重置</n-button>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :bordered="false"
      :scroll-x="1340"
    />

    <n-drawer v-model:show="showDetail" width="1040">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex items-center gap-3">
            <span>{{ currentRow.game_name }}</span>
            <n-tag size="small" type="info" :bordered="false">{{ currentRow.provider_name }}</n-tag>
            <n-tag size="small" :type="statusMeta[currentRow.status].type" :bordered="false">{{ statusMeta[currentRow.status].label }}</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="RTP">{{ currentRow.rtp.toFixed(2) }}%</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="啟用商戶">{{ currentRow.merchant_enabled_count }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="維護排程">{{ maintenanceScheduleLabel(currentRow) }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="結算幣別">{{ currentRow.settlement_currency }}</n-statistic></div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="遊戲 ID">{{ currentRow.game_id }}</n-descriptions-item>
                <n-descriptions-item label="Provider Game Code">{{ currentRow.provider_game_code }}</n-descriptions-item>
                <n-descriptions-item label="遊戲名稱">{{ currentRow.game_name }}</n-descriptions-item>
                <n-descriptions-item label="中文名稱">{{ currentRow.game_name_zh }}</n-descriptions-item>
                <n-descriptions-item label="遊戲類型">{{ currentRow.game_type }}</n-descriptions-item>
                <n-descriptions-item label="波動率">{{ currentRow.volatility }}</n-descriptions-item>
                <n-descriptions-item label="支援裝置">{{ currentRow.supported_devices.join(' / ') }}</n-descriptions-item>
                <n-descriptions-item label="下注限額方案">請至供應商管理的幣別線勾選 Provider 提供的方案</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="provider" tab="供應商資訊">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="供應商">{{ currentRow.provider_name }}</n-descriptions-item>
                <n-descriptions-item label="供應商 ID">{{ currentRow.provider_id }}</n-descriptions-item>
                <n-descriptions-item label="正式結算幣別">{{ currentRow.settlement_currency }}</n-descriptions-item>
                <n-descriptions-item label="最後同步">{{ formatDateTime(currentRow.last_synced_at) }}</n-descriptions-item>
                <n-descriptions-item label="交易幣別" :span="2">{{ currentRow.supported_display_currencies.join(' / ') }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="auth" tab="商戶授權">
              <n-data-table :columns="withTableSorters(authColumns)" :data="currentRow.authorizations" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>

            <n-tab-pane name="maintenance" tab="維護設定">
              <n-descriptions bordered :column="1" label-placement="left">
                <n-descriptions-item label="目前狀態">{{ statusMeta[currentRow.status].label }}</n-descriptions-item>
                <n-descriptions-item label="維護原因">{{ currentRow.maintenance_reason }}</n-descriptions-item>
                <n-descriptions-item label="維護排程">{{ maintenanceScheduleLabel(currentRow) }}</n-descriptions-item>
                <n-descriptions-item label="下次維護">{{ currentRow.next_maintenance_at ? formatDateTime(currentRow.next_maintenance_at) : '未設定' }}</n-descriptions-item>
                <n-descriptions-item label="影響範圍">商戶無法 Launch Game，後台仍保留歷史紀錄與維護操作紀錄。</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="logs" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item v-for="log in currentRow.logs" :key="log.trace_id" type="success" :title="log.action" :time="formatDateTime(log.operated_at)">
                  <div class="text-sm text-slate-500">{{ log.operator }} / {{ log.trace_id }}</div>
                </n-timeline-item>
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <div v-if="currentRow" class="flex flex-wrap justify-end gap-2">
            <n-button secondary @click="toggleMaintenance(currentRow)">{{ currentRow.status === 'maintenance' ? '解除維護' : '設為維護' }}</n-button>
            <n-button secondary @click="openScheduleEditor(currentRow)">維護排程</n-button>
            <n-button type="primary" secondary @click="actionMessage('重置遊戲排序', currentRow)">重置遊戲排序</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showScheduleEditor" preset="card" title="維護排程" class="max-w-[640px]" :bordered="false">
      <n-form label-placement="left" label-width="140">
        <n-form-item label="維護模式">
          <n-select v-model:value="scheduleForm.maintenance_schedule_type" :options="maintenanceScheduleOptions" />
        </n-form-item>
        <n-form-item v-if="scheduleForm.maintenance_schedule_type === 'weekly'" label="每週維護日">
          <n-select v-model:value="scheduleForm.maintenance_weekday" :options="weekdayOptions" />
        </n-form-item>
        <n-form-item v-if="scheduleForm.maintenance_schedule_type === 'monthly'" label="每月維護日">
          <n-input-number v-model:value="scheduleForm.maintenance_month_day" :min="1" :max="31" :step="1" />
        </n-form-item>
        <n-form-item v-if="scheduleForm.maintenance_schedule_type !== 'none'" label="維護開始時間">
          <n-input v-model:value="scheduleForm.maintenance_time" placeholder="HH:mm，例如 05:00" />
        </n-form-item>
        <n-form-item v-if="scheduleForm.maintenance_schedule_type !== 'none'" label="維護時長">
          <n-input-number v-model:value="scheduleForm.maintenance_duration_minutes" :min="5" :max="720" :step="5">
            <template #suffix>分鐘</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="下次維護">
          <n-input v-model:value="scheduleForm.next_maintenance_at" placeholder="2026-07-14T05:00:00.000+08:00" />
        </n-form-item>
        <n-alert type="info" :show-icon="false">
          設定維護期間後，商戶不可 Launch Game，但系統仍會保留維護排程與操作紀錄。
        </n-alert>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showScheduleEditor = false">取消</n-button>
          <n-button type="primary" @click="saveMaintenanceSchedule">儲存排程</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
