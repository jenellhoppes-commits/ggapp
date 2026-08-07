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
import { AddOutlined, ContentCopyOutlined, EditOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type CampaignType = 'jackpot' | 'free_spin' | 'tournament' | 'mission' | 'display'
type CampaignStatus = 'draft' | 'pending' | 'running' | 'paused' | 'ended' | 'disabled'

interface AppliedGame {
  game_id: string
  game_name: string
  provider_name: string
  status: 'active' | 'disabled'
  applied_at: string
}

interface AppliedMerchant {
  merchant_id: string
  merchant_name: string
  agent_name: string
  status: 'applied' | 'paused'
  applied_at: string
  override_sort: boolean
}

interface RewardSetting {
  key: string
  label: string
  value: string
}

interface CampaignMetrics {
  player_count: number
  merchant_count: number
  bet_amount: number
  ggr: number
  reward_issued: number
  budget_usage_rate: number
  conversion_rate: number
}

interface OperationLog {
  action: string
  operator: string
  operated_at: string
  trace_id: string
}

interface CampaignRow {
  campaign_id: string
  campaign_code: string
  campaign_name: string
  campaign_type: CampaignType
  status: CampaignStatus
  currency: 'USDT'
  budget_amount: number
  prize_pool_amount: number
  issued_amount: number
  participant_count: number
  frontend_title: string
  display_sort: number
  start_at: string
  end_at: string
  schedule_mode: 'one_time' | 'weekly' | 'monthly'
  applied_game_count: number
  applied_merchant_count: number
  description: string
  remark: string
  updated_at: string
  games: AppliedGame[]
  merchants: AppliedMerchant[]
  reward_settings: RewardSetting[]
  metrics: CampaignMetrics
  logs: OperationLog[]
}

const message = useMessage()
const showDetail = ref(false)
const showEditor = ref(false)
const detailTab = ref('basic')
const editorMode = ref<'create' | 'edit'>('create')
const currentRow = ref<CampaignRow | null>(null)
const keyword = ref('')
const typeFilter = ref<CampaignType | null>(null)
const statusFilter = ref<CampaignStatus | null>(null)

const blankCampaign = (): CampaignRow => ({
  campaign_id: `CMP-${Date.now()}`,
  campaign_code: '',
  campaign_name: '',
  campaign_type: 'display',
  status: 'draft',
  currency: 'USDT',
  budget_amount: 0,
  prize_pool_amount: 0,
  issued_amount: 0,
  participant_count: 0,
  frontend_title: '',
  display_sort: 100,
  start_at: '2026-07-08T00:00:00.000+08:00',
  end_at: '2026-07-31T23:59:59.000+08:00',
  schedule_mode: 'one_time',
  applied_game_count: 0,
  applied_merchant_count: 0,
  description: '',
  remark: '',
  updated_at: new Date().toISOString(),
  games: [],
  merchants: [],
  reward_settings: [],
  metrics: {
    player_count: 0,
    merchant_count: 0,
    bet_amount: 0,
    ggr: 0,
    reward_issued: 0,
    budget_usage_rate: 0,
    conversion_rate: 0
  },
  logs: []
})

const formValue = ref<CampaignRow>(blankCampaign())

const rows = ref<CampaignRow[]>([
  {
    campaign_id: 'CMP-JP-202607',
    campaign_code: 'JACKPOT_JULY',
    campaign_name: '七月累積獎池',
    campaign_type: 'jackpot',
    status: 'running',
    currency: 'USDT',
    budget_amount: 50000,
    prize_pool_amount: 38200,
    issued_amount: 11800,
    participant_count: 18420,
    frontend_title: 'July Mega Jackpot',
    display_sort: 1,
    start_at: '2026-07-01T00:00:00.000+08:00',
    end_at: '2026-07-31T23:59:59.000+08:00',
    schedule_mode: 'one_time',
    applied_game_count: 3,
    applied_merchant_count: 12,
    description: '直接指定三款遊戲計算累積獎池。',
    remark: '獎池支出僅作活動報表與營運統計，不影響代理正式結算。',
    updated_at: '2026-07-07T10:20:00.000Z',
    games: [
      { game_id: 'PG-001', game_name: 'Mahjong Ways', provider_name: 'PG Soft', status: 'active', applied_at: '2026-07-01T00:00:00.000+08:00' },
      { game_id: 'PG-002', game_name: 'Fortune Tiger', provider_name: 'PG Soft', status: 'active', applied_at: '2026-07-01T00:00:00.000+08:00' },
      { game_id: 'PP-001', game_name: 'Gates of Olympus', provider_name: 'Pragmatic Play', status: 'active', applied_at: '2026-07-01T00:00:00.000+08:00' }
    ],
    merchants: [
      { merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', agent_name: '平台直營代理', status: 'applied', applied_at: '2026-07-01T09:00:00.000+08:00', override_sort: false },
      { merchant_id: 'OP-1006', merchant_name: 'Lucky Panda Studio', agent_name: 'SEA Growth Agent', status: 'applied', applied_at: '2026-07-02T12:00:00.000+08:00', override_sort: true }
    ],
    reward_settings: [
      { key: 'initial_pool', label: '初始獎池', value: 'USDT 20,000' },
      { key: 'accumulate_rule', label: '累積規則', value: '活動 GGR 1.5%' },
      { key: 'min_payout', label: '最低派彩', value: 'USDT 500' }
    ],
    metrics: {
      player_count: 18420,
      merchant_count: 12,
      bet_amount: 820000,
      ggr: 96800,
      reward_issued: 11800,
      budget_usage_rate: 0.236,
      conversion_rate: 0.128
    },
    logs: [
      { action: '建立 Jackpot 活動', operator: 'Marketing', operated_at: '2026-06-28T09:00:00.000Z', trace_id: 'trace-cmp-jp-create' },
      { action: '啟用活動', operator: 'Admin', operated_at: '2026-07-01T00:00:00.000Z', trace_id: 'trace-cmp-jp-start' }
    ]
  },
  {
    campaign_id: 'CMP-FS-PG-202607',
    campaign_code: 'PG_FREE_SPIN',
    campaign_name: 'PG 免費旋轉週',
    campaign_type: 'free_spin',
    status: 'pending',
    currency: 'USDT',
    budget_amount: 12000,
    prize_pool_amount: 12000,
    issued_amount: 0,
    participant_count: 0,
    frontend_title: 'PG Free Spin Week',
    display_sort: 8,
    start_at: '2026-07-10T00:00:00.000+08:00',
    end_at: '2026-07-17T23:59:59.000+08:00',
    schedule_mode: 'one_time',
    applied_game_count: 2,
    applied_merchant_count: 8,
    description: '直接指定 PG 遊戲，展示 Free Spin 活動設定。',
    remark: '待審核後啟用。',
    updated_at: '2026-07-07T09:30:00.000Z',
    games: [
      { game_id: 'PG-001', game_name: 'Mahjong Ways', provider_name: 'PG Soft', status: 'active', applied_at: '2026-07-07T09:30:00.000+08:00' },
      { game_id: 'PG-002', game_name: 'Fortune Tiger', provider_name: 'PG Soft', status: 'active', applied_at: '2026-07-07T09:30:00.000+08:00' }
    ],
    merchants: [
      { merchant_id: 'OP-1008', merchant_name: 'NovaPlay Entertainment', agent_name: 'L2 Asia Agent', status: 'applied', applied_at: '2026-07-07T09:35:00.000+08:00', override_sort: false }
    ],
    reward_settings: [
      { key: 'spin_count', label: '免費旋轉次數', value: '10 次' },
      { key: 'valid_days', label: '有效天數', value: '3 天' },
      { key: 'target_games', label: '指定遊戲', value: 'Mahjong Ways 2 / Lucky Neko' }
    ],
    metrics: {
      player_count: 0,
      merchant_count: 8,
      bet_amount: 0,
      ggr: 0,
      reward_issued: 0,
      budget_usage_rate: 0,
      conversion_rate: 0
    },
    logs: [
      { action: '建立 Free Spin 活動', operator: 'Marketing', operated_at: '2026-07-07T09:30:00.000Z', trace_id: 'trace-cmp-fs-create' }
    ]
  },
  {
    campaign_id: 'CMP-TOUR-202607',
    campaign_code: 'LIVE_TOURNAMENT',
    campaign_name: '真人排行榜賽',
    campaign_type: 'tournament',
    status: 'paused',
    currency: 'USDT',
    budget_amount: 25000,
    prize_pool_amount: 25000,
    issued_amount: 3400,
    participant_count: 3200,
    frontend_title: 'Live Casino Challenge',
    display_sort: 5,
    start_at: '2026-07-03T00:00:00.000+08:00',
    end_at: '2026-07-20T23:59:59.000+08:00',
    schedule_mode: 'weekly',
    applied_game_count: 1,
    applied_merchant_count: 6,
    description: '真人遊戲排行榜活動。',
    remark: '暫停中，等待調整排行規則。',
    updated_at: '2026-07-07T08:40:00.000Z',
    games: [
      { game_id: 'EVO-001', game_name: 'Baccarat A', provider_name: 'Evolution', status: 'active', applied_at: '2026-07-03T00:00:00.000+08:00' }
    ],
    merchants: [
      { merchant_id: 'OP-1009', merchant_name: 'Golden Dragon Gaming', agent_name: 'L3 Growth Team', status: 'paused', applied_at: '2026-07-03T10:00:00.000+08:00', override_sort: false }
    ],
    reward_settings: [
      { key: 'ranking_basis', label: '排行依據', value: '活動投注額' },
      { key: 'cycle', label: '榜單週期', value: '每週一 00:00 重置' },
      { key: 'rank_reward', label: '名次獎勵', value: 'Top 10 固定獎勵' }
    ],
    metrics: {
      player_count: 3200,
      merchant_count: 6,
      bet_amount: 210000,
      ggr: 18200,
      reward_issued: 3400,
      budget_usage_rate: 0.136,
      conversion_rate: 0.092
    },
    logs: [
      { action: '建立 Tournament 活動', operator: 'Marketing', operated_at: '2026-07-02T11:00:00.000Z', trace_id: 'trace-cmp-tour-create' },
      { action: '暫停活動', operator: 'Ops', operated_at: '2026-07-07T08:40:00.000Z', trace_id: 'trace-cmp-tour-pause' }
    ]
  },
  {
    campaign_id: 'CMP-DISPLAY-JILI',
    campaign_code: 'JILI_NOTICE',
    campaign_name: 'JILI 維護公告',
    campaign_type: 'display',
    status: 'draft',
    currency: 'USDT',
    budget_amount: 0,
    prize_pool_amount: 0,
    issued_amount: 0,
    participant_count: 0,
    frontend_title: 'JILI Maintenance Notice',
    display_sort: 99,
    start_at: '2026-07-08T00:00:00.000+08:00',
    end_at: '2026-07-15T23:59:59.000+08:00',
    schedule_mode: 'one_time',
    applied_game_count: 1,
    applied_merchant_count: 0,
    description: '展示型公告，不發放獎勵。',
    remark: '草稿待確認。',
    updated_at: '2026-07-07T10:12:00.000Z',
    games: [
      { game_id: 'JILI-001', game_name: 'Super Ace', provider_name: 'JILI Gaming', status: 'disabled', applied_at: '2026-07-07T10:12:00.000+08:00' }
    ],
    merchants: [],
    reward_settings: [
      { key: 'banner', label: '展示位置', value: '商戶前台活動入口' },
      { key: 'link', label: '活動連結', value: '/campaign/jili-maintenance' }
    ],
    metrics: {
      player_count: 0,
      merchant_count: 0,
      bet_amount: 0,
      ggr: 0,
      reward_issued: 0,
      budget_usage_rate: 0,
      conversion_rate: 0
    },
    logs: [
      { action: '建立草稿', operator: 'Ops', operated_at: '2026-07-07T10:12:00.000Z', trace_id: 'trace-cmp-jili-draft' }
    ]
  }
])

const campaignTypeMeta: Record<CampaignType, { label: string; type: 'success' | 'info' | 'warning' | 'default' }> = {
  jackpot: { label: 'Jackpot', type: 'success' },
  free_spin: { label: 'Free Spin', type: 'info' },
  tournament: { label: 'Tournament', type: 'warning' },
  mission: { label: '任務活動', type: 'default' },
  display: { label: '展示公告', type: 'default' }
}

const statusMeta: Record<CampaignStatus, { label: string; type: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  draft: { label: '草稿', type: 'default' },
  pending: { label: '待審核', type: 'info' },
  running: { label: '進行中', type: 'success' },
  paused: { label: '暫停', type: 'warning' },
  ended: { label: '已結束', type: 'default' },
  disabled: { label: '停用', type: 'error' }
}

const typeOptions = Object.entries(campaignTypeMeta).map(([value, meta]) => ({ label: meta.label, value }))
const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ label: meta.label, value }))
const scheduleOptions = [
  { label: '單次活動', value: 'one_time' },
  { label: '每週週期', value: 'weekly' },
  { label: '每月週期', value: 'monthly' }
]

const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return rows.value.filter(row => {
    const matchesText = !text || [row.campaign_code, row.campaign_name, row.frontend_title, row.description]
      .some(value => value.toLowerCase().includes(text))
    const matchesType = !typeFilter.value || row.campaign_type === typeFilter.value
    const matchesStatus = !statusFilter.value || row.status === statusFilter.value
    return matchesText && matchesType && matchesStatus
  })
})

const summary = computed(() => ({
  total: rows.value.length,
  running: rows.value.filter(row => row.status === 'running').length,
  budget: rows.value.reduce((sum, row) => sum + row.budget_amount, 0),
  issued: rows.value.reduce((sum, row) => sum + row.issued_amount, 0),
  participants: rows.value.reduce((sum, row) => sum + row.participant_count, 0)
}))

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-TW') : '-'
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`
const scheduleLabel = (mode: CampaignRow['schedule_mode']) => {
  if (mode === 'weekly') return '每週週期'
  if (mode === 'monthly') return '每月週期'
  return '單次活動'
}

const resetFilters = () => {
  keyword.value = ''
  typeFilter.value = null
  statusFilter.value = null
}

const openDetail = (row: CampaignRow) => {
  currentRow.value = row
  detailTab.value = 'basic'
  showDetail.value = true
}

const openEditor = (mode: 'create' | 'edit', row?: CampaignRow) => {
  editorMode.value = mode
  formValue.value = row ? JSON.parse(JSON.stringify(row)) : blankCampaign()
  showEditor.value = true
}

const saveCampaign = () => {
  if (!formValue.value.campaign_code || !formValue.value.campaign_name) {
    message.warning('請填寫活動代碼與活動名稱')
    return
  }

  const next: CampaignRow = {
    ...formValue.value,
    campaign_code: formValue.value.campaign_code.toUpperCase(),
    updated_at: new Date().toISOString()
  }

  if (editorMode.value === 'create') {
    rows.value.unshift({
      ...next,
      campaign_id: `CMP-${next.campaign_code}`,
      logs: [
        { action: '建立活動', operator: 'Marketing', operated_at: new Date().toISOString(), trace_id: `trace-cmp-${next.campaign_code.toLowerCase()}-create` }
      ]
    })
    message.success('活動已建立')
  } else {
    const index = rows.value.findIndex(row => row.campaign_id === next.campaign_id)
    if (index >= 0) {
      rows.value[index] = next
      message.success('活動已更新')
    }
  }

  showEditor.value = false
}

const copyCampaign = (row: CampaignRow) => {
  const copy = JSON.parse(JSON.stringify(row)) as CampaignRow
  copy.campaign_id = `CMP-${row.campaign_code}-COPY`
  copy.campaign_code = `${row.campaign_code}_COPY`
  copy.campaign_name = `${row.campaign_name} 複製`
  copy.status = 'draft'
  copy.updated_at = new Date().toISOString()
  copy.logs = [
    { action: `複製自 ${row.campaign_name}`, operator: 'Marketing', operated_at: new Date().toISOString(), trace_id: `trace-cmp-${row.campaign_code.toLowerCase()}-copy` }
  ]
  rows.value.unshift(copy)
  message.success('活動已複製')
}

const toggleCampaign = (row: CampaignRow) => {
  row.status = row.status === 'running' ? 'paused' : 'running'
  row.updated_at = new Date().toISOString()
  row.logs.unshift({
    action: row.status === 'running' ? '啟用活動' : '暫停活動',
    operator: 'Admin',
    operated_at: new Date().toISOString(),
    trace_id: `trace-cmp-${row.campaign_code.toLowerCase()}-${Date.now()}`
  })
  message.success(`${row.campaign_name} 已${row.status === 'running' ? '啟用' : '暫停'}`)
}

const actionMessage = (label: string, row?: CampaignRow) => {
  message.info(`${label}${row ? `：${row.campaign_name}` : ''}，演示操作已保留。`)
}

const columns: DataTableColumns<CampaignRow> = [
  {
    title: '活動',
    key: 'campaign_name',
    width: 260,
    fixed: 'left',
    render: row => h('button', { class: 'text-left hover:text-cyan-300', onClick: () => openDetail(row) }, [
      h('div', { class: 'font-semibold text-slate-100' }, row.campaign_name),
      h('div', { class: 'mt-1 font-mono text-xs text-slate-500' }, row.campaign_code)
    ])
  },
  { title: '類型', key: 'campaign_type', width: 120, render: row => h(NTag, { type: campaignTypeMeta[row.campaign_type].type, size: 'small', bordered: false }, { default: () => campaignTypeMeta[row.campaign_type].label }) },
  { title: '狀態', key: 'status', width: 105, render: row => h(NTag, { type: statusMeta[row.status].type, size: 'small', bordered: false }, { default: () => statusMeta[row.status].label }) },
  { title: '指定遊戲', key: 'applied_game_count', width: 110, align: 'right', render: row => `${row.applied_game_count} 款` },
  { title: '套用商戶', key: 'applied_merchant_count', width: 110, align: 'right', render: row => `${row.applied_merchant_count} 家` },
  { title: '期間', key: 'period', width: 230, render: row => h('div', { class: 'text-xs' }, [h('div', formatDateTime(row.start_at)), h('div', { class: 'text-slate-500' }, formatDateTime(row.end_at))]) },
  { title: '預算 / 獎池', key: 'budget_amount', width: 150, align: 'right', render: row => h('div', {}, [h(MoneyText, { value: row.budget_amount, currency: 'USDT', compact: true }), h('div', { class: 'text-xs text-slate-500' }, `獎池 ${row.prize_pool_amount.toLocaleString()}`)]) },
  { title: '參與 / 發放', key: 'participant_count', width: 140, align: 'right', render: row => h('div', {}, [h('div', `${row.participant_count.toLocaleString()} 人`), h('div', { class: 'text-xs text-slate-500' }, `已發 ${row.issued_amount.toLocaleString()} USDT`)]) },
  { title: '更新時間', key: 'updated_at', width: 175, render: row => formatDateTime(row.updated_at) },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'right',
    render: row => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(NIcon, { component: VisibilityOutlined }), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => openEditor('edit', row) }, { icon: () => h(NIcon, { component: EditOutlined }), default: () => '編輯' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => toggleCampaign(row) }, { default: () => row.status === 'running' ? '暫停' : '啟用' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => copyCampaign(row) }, { icon: () => h(NIcon, { component: ContentCopyOutlined }), default: () => '複製' })
      ]
    })
  }
]

const gameColumns: DataTableColumns<AppliedGame> = [
  { title: '遊戲 ID', key: 'game_id', width: 130, render: row => h('span', { class: 'font-mono text-xs' }, row.game_id) },
  { title: '遊戲名稱', key: 'game_name' },
  { title: '供應商', key: 'provider_name', width: 160 },
  { title: '狀態', key: 'status', width: 100, render: row => h(NTag, { type: row.status === 'active' ? 'success' : 'default', size: 'small', bordered: false }, { default: () => row.status === 'active' ? '啟用' : '停用' }) },
  { title: '套用時間', key: 'applied_at', width: 175, render: row => formatDateTime(row.applied_at) }
]

const merchantColumns: DataTableColumns<AppliedMerchant> = [
  { title: '商戶', key: 'merchant_name', render: row => h('div', {}, [h('div', row.merchant_name), h('div', { class: 'text-xs text-slate-500' }, row.merchant_id)]) },
  { title: '代理', key: 'agent_name' },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: row.status === 'applied' ? 'success' : 'warning', size: 'small', bordered: false }, { default: () => row.status === 'applied' ? '已套用' : '暫停' }) },
  { title: '覆蓋排序', key: 'override_sort', width: 110, render: row => row.override_sort ? '是' : '否' },
  { title: '套用時間', key: 'applied_at', width: 175, render: row => formatDateTime(row.applied_at) }
]

const rewardColumns: DataTableColumns<RewardSetting> = [
  { title: '設定', key: 'label', width: 180 },
  { title: '值', key: 'value' }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">獎池與活動</h1>
        <p class="mt-1 text-sm text-slate-500">
          管理 Jackpot、Free Spin、Tournament、任務活動與前台展示公告。
        </p>
      </div>
      <n-button type="primary" @click="openEditor('create')">
        <template #icon><n-icon :component="AddOutlined" /></template>
        新增活動
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-5">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="活動總數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="進行中" :value="summary.running" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="總預算"><MoneyText :value="summary.budget" currency="USDT" compact /></n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="已發放"><MoneyText :value="summary.issued" currency="USDT" compact /></n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="參與人次" :value="summary.participants" /></div>
    </div>

    <n-alert type="info" :show-icon="false">
      活動只影響內容展示、獎勵設定與活動統計；活動成本屬營運報表，不直接改變供應商或代理正式帳務。
    </n-alert>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#18181c] p-4">
      <n-input v-model:value="keyword" clearable placeholder="搜尋活動名稱 / 活動代碼 / 前台標題" style="width: 320px; max-width: 100%;">
        <template #prefix><n-icon :component="SearchOutlined" /></template>
      </n-input>
      <n-select v-model:value="typeFilter" clearable :options="typeOptions" placeholder="活動類型" style="width: 150px;" />
      <n-select v-model:value="statusFilter" clearable :options="statusOptions" placeholder="狀態" style="width: 130px;" />
      <n-button secondary @click="resetFilters">重置</n-button>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :bordered="false"
      :scroll-x="1680"
      striped
    />

    <n-drawer v-model:show="showDetail" :width="1080">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="text-lg font-semibold">{{ currentRow.campaign_name }}</span>
            <n-tag size="small" :bordered="false">{{ currentRow.campaign_code }}</n-tag>
            <n-tag size="small" :type="campaignTypeMeta[currentRow.campaign_type].type" :bordered="false">{{ campaignTypeMeta[currentRow.campaign_type].label }}</n-tag>
            <n-tag size="small" :type="statusMeta[currentRow.status].type" :bordered="false">{{ statusMeta[currentRow.status].label }}</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="預算"><MoneyText :value="currentRow.budget_amount" currency="USDT" compact /></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="已發放"><MoneyText :value="currentRow.issued_amount" currency="USDT" compact /></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="參與人次" :value="currentRow.participant_count" /></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="預算使用率">{{ formatPercent(currentRow.metrics.budget_usage_rate) }}</n-statistic></div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="活動代碼">{{ currentRow.campaign_code }}</n-descriptions-item>
                <n-descriptions-item label="活動名稱">{{ currentRow.campaign_name }}</n-descriptions-item>
                <n-descriptions-item label="活動類型">{{ campaignTypeMeta[currentRow.campaign_type].label }}</n-descriptions-item>
                <n-descriptions-item label="狀態">{{ statusMeta[currentRow.status].label }}</n-descriptions-item>
                <n-descriptions-item label="前台標題">{{ currentRow.frontend_title }}</n-descriptions-item>
                <n-descriptions-item label="展示排序">{{ currentRow.display_sort }}</n-descriptions-item>
                <n-descriptions-item label="幣別">{{ currentRow.currency }}</n-descriptions-item>
                <n-descriptions-item label="週期">{{ scheduleLabel(currentRow.schedule_mode) }}</n-descriptions-item>
                <n-descriptions-item label="活動期間" :span="2">{{ formatDateTime(currentRow.start_at) }} - {{ formatDateTime(currentRow.end_at) }}</n-descriptions-item>
                <n-descriptions-item label="描述" :span="2">{{ currentRow.description }}</n-descriptions-item>
                <n-descriptions-item label="備註" :span="2">{{ currentRow.remark }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="games" tab="指定遊戲">
              <n-alert type="info" :show-icon="false" class="mb-3">活動直接指定遊戲清單，變更只影響活動展示與參與範圍。</n-alert>
              <n-data-table :columns="withTableSorters(gameColumns)" :data="currentRow.games" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>

            <n-tab-pane name="merchants" tab="套用商戶">
              <n-data-table :columns="withTableSorters(merchantColumns)" :data="currentRow.merchants" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>

            <n-tab-pane name="reward" tab="獎勵設定">
              <n-data-table :columns="withTableSorters(rewardColumns)" :data="currentRow.reward_settings" :pagination="DEFAULT_TABLE_PAGINATION" />
              <n-alert type="warning" :show-icon="false" class="mt-4">
                MVP 僅展示活動獎勵設定與發放統計；實際派發與風控規則需由後端服務落地。
              </n-alert>
            </n-tab-pane>

            <n-tab-pane name="schedule" tab="時間設定">
              <n-descriptions bordered :column="1" label-placement="left">
                <n-descriptions-item label="開始時間">{{ formatDateTime(currentRow.start_at) }}</n-descriptions-item>
                <n-descriptions-item label="結束時間">{{ formatDateTime(currentRow.end_at) }}</n-descriptions-item>
                <n-descriptions-item label="週期">{{ scheduleLabel(currentRow.schedule_mode) }}</n-descriptions-item>
                <n-descriptions-item label="說明">活動期間用於前台展示與活動統計，不改寫歷史交易資料。</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="metrics" tab="活動成效">
              <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
                <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="參與會員" :value="currentRow.metrics.player_count" /></div>
                <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="活動投注"><MoneyText :value="currentRow.metrics.bet_amount" currency="USDT" compact /></n-statistic></div>
                <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="活動 GGR"><MoneyText :value="currentRow.metrics.ggr" currency="USDT" compact show-sign /></n-statistic></div>
                <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="轉換率">{{ formatPercent(currentRow.metrics.conversion_rate) }}</n-statistic></div>
              </div>
              <n-alert type="info" :show-icon="false" class="mt-4">
                活動成效是營運分析資料，不直接作為代理或供應商結算依據。
              </n-alert>
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
            <n-button secondary @click="openEditor('edit', currentRow)">編輯活動</n-button>
            <n-button secondary @click="actionMessage('套用商戶', currentRow)">套用商戶</n-button>
            <n-button secondary @click="actionMessage('選擇活動遊戲', currentRow)">選擇遊戲</n-button>
            <n-button secondary @click="toggleCampaign(currentRow)">{{ currentRow.status === 'running' ? '暫停活動' : '啟用活動' }}</n-button>
            <n-button type="primary" secondary @click="copyCampaign(currentRow)">複製活動</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-modal v-model:show="showEditor" preset="card" :title="editorMode === 'create' ? '新增活動' : '編輯活動'" class="max-w-[760px]" :bordered="false">
      <n-form label-placement="left" label-width="140">
        <n-form-item label="活動代碼" required><n-input v-model:value="formValue.campaign_code" :disabled="editorMode === 'edit'" placeholder="例如 JULY_CAMPAIGN" /></n-form-item>
        <n-form-item label="活動名稱" required><n-input v-model:value="formValue.campaign_name" placeholder="例如 七月累積獎池" /></n-form-item>
        <n-form-item label="活動類型"><n-select v-model:value="formValue.campaign_type" :options="typeOptions" /></n-form-item>
        <n-form-item label="狀態"><n-select v-model:value="formValue.status" :options="statusOptions" /></n-form-item>
        <n-form-item label="週期"><n-select v-model:value="formValue.schedule_mode" :options="scheduleOptions" /></n-form-item>
        <n-form-item label="開始時間"><n-input v-model:value="formValue.start_at" placeholder="2026-07-08T00:00:00.000+08:00" /></n-form-item>
        <n-form-item label="結束時間"><n-input v-model:value="formValue.end_at" placeholder="2026-07-31T23:59:59.000+08:00" /></n-form-item>
        <n-form-item label="預算">
          <n-input-number v-model:value="formValue.budget_amount" :min="0" :step="100">
            <template #suffix>USDT</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="獎池">
          <n-input-number v-model:value="formValue.prize_pool_amount" :min="0" :step="100">
            <template #suffix>USDT</template>
          </n-input-number>
        </n-form-item>
        <n-form-item label="前台標題"><n-input v-model:value="formValue.frontend_title" /></n-form-item>
        <n-form-item label="展示排序"><n-input-number v-model:value="formValue.display_sort" :min="1" :step="1" /></n-form-item>
        <n-form-item label="活動描述"><n-input v-model:value="formValue.description" type="textarea" /></n-form-item>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showEditor = false">取消</n-button>
          <n-button type="primary" @click="saveCampaign">儲存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
