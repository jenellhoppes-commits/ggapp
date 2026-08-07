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
import {
  ContentCopyOutlined,
  DescriptionOutlined,
  ReplayOutlined,
  SearchOutlined,
  VisibilityOutlined
} from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { formatDisplayAmount } from '../../../utils/format'
import { getBetLimitSnapshot } from '../../../mocks/gameLimits'
import type { BetLimitSnapshot } from '../../../types/gameLimit'
import { gameLimitCheckResultLabel, gameLimitSourceLabel } from '../../../types/gameLimit'

type BetStatus = 'settled' | 'unsettled' | 'cancelled' | 'provider_pending' | 'repairing' | 'abnormal'
type WalletMode = 'seamless' | 'transfer'
type GameType = 'Slot' | 'Live' | 'Fishing' | 'Sports'

interface FlowRecord {
  flow_id: string
  flow_type: 'Balance' | 'Bet' | 'Win' | 'Refund' | 'Rollback'
  status: 'success' | 'pending' | 'failed'
  amount: number
  currency: string
  created_at: string
}

interface RepairRecord {
  repair_id: string
  reason: string
  status: 'created' | 'processing' | 'done' | 'failed'
  operator: string
  created_at: string
}

interface OperationLog {
  action: string
  operator: string
  operated_at: string
  trace_id: string
}

interface BetRow {
  bet_id: string
  round_id: string
  transaction_id: string
  merchant_id: string
  merchant_name: string
  agent_name: string
  player_id: string
  merchant_player_id: string
  wallet_mode: WalletMode
  provider_id: string
  provider_name: string
  provider_currency_line_id: string
  provider_currency_id: string
  provider_merchant_id: string
  provider_currency: string
  game_id: string
  game_name: string
  game_type: GameType
  status: BetStatus
  transaction_currency: string
  transaction_bet_amount: number
  transaction_payout_amount: number | null
  payout_scope: 'bet' | 'round' | 'unallocated'
  round_settlement_id: string | null
  display_currency: string
  display_bet_amount: number
  display_payout_amount: number | null
  display_ggr: number | null
  provider_bet_amount: number
  provider_payout_amount: number | null
  settlement_currency: 'USDT'
  settlement_bet_amount: number | null
  settlement_payout_amount: number | null
  settlement_ggr: number | null
  settlement_status: 'pending_daily' | 'settled' | 'locked'
  settlement_batch_id: string
  settlement_rate_date: string
  exchange_rate: number
  exchange_rate_id: string
  exchange_fee_rate: number
  rate_locked_at: string
  provider_tx_id: string
  provider_round_status: string
  created_at: string
  settled_at: string
  provider_payload: string
  wallet_payload: string
  bet_limit_snapshot: BetLimitSnapshot
  transaction_flows: FlowRecord[]
  repair_records: RepairRecord[]
  logs: OperationLog[]
}

const message = useMessage()
const showDetail = ref(false)
const currentRow = ref<BetRow | null>(null)
const loading = ref(false)
const detailTab = ref('basic')
const keyword = ref('')
const merchantFilter = ref<string | null>(null)
const agentFilter = ref<string | null>(null)
const providerFilter = ref<string | null>(null)
const typeFilter = ref<GameType | null>(null)
const statusFilter = ref<BetStatus | null>(null)
const walletFilter = ref<WalletMode | null>(null)
const currencyFilter = ref<string | null>(null)

const rows = ref<BetRow[]>([
  {
    bet_id: 'BET-20260707-000884',
    round_id: 'R-PG-8842-78231',
    transaction_id: 'TX-20260707-000188',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_name: '平台直營代理',
    player_id: 'GGAP-P-8842',
    merchant_player_id: 'mem_8842',
    wallet_mode: 'seamless',
    provider_id: 'PROV-PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-TWD',
    provider_currency_id: 'PG-CUR-TWD-01',
    provider_merchant_id: 'PG-MCH-YOTA-TWD',
    provider_currency: 'TWD',
    game_id: 'PG-001',
    game_name: 'Mahjong Ways 2',
    game_type: 'Slot',
    status: 'settled',
    transaction_currency: 'TWD',
    transaction_bet_amount: 3200,
    transaction_payout_amount: 5400,
    payout_scope: 'bet',
    round_settlement_id: null,
    display_currency: 'TWD',
    display_bet_amount: 3200,
    display_payout_amount: 5400,
    display_ggr: -2200,
    provider_bet_amount: 3200,
    provider_payout_amount: 5400,
    settlement_currency: 'USDT',
    settlement_bet_amount: 101.59,
    settlement_payout_amount: 171.43,
    settlement_ggr: -69.84,
    settlement_status: 'locked',
    settlement_batch_id: 'SET-20260708-0001',
    settlement_rate_date: '2026-07-07',
    exchange_rate: 31.5,
    exchange_rate_id: 'FX-20260707-TWD',
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-07T00:00:00.000+08:00',
    provider_tx_id: 'PG-TX-8842-78231',
    provider_round_status: 'SETTLED',
    created_at: '2026-07-07T08:31:22.000Z',
    settled_at: '2026-07-07T08:32:06.000Z',
    provider_payload: '{"roundId":"R-PG-8842-78231","bet":3200,"win":5400,"currency":"TWD","status":"SETTLED"}',
    wallet_payload: '{"callback":"seamless","debit":3200,"credit":5400,"idempotency_key":"idem-op1001-pg-8842"}',
    bet_limit_snapshot: getBetLimitSnapshot('BET-20260707-000884'),
    transaction_flows: [
      { flow_id: 'TX-20260707-000188', flow_type: 'Bet', status: 'success', amount: -3200, currency: 'TWD', created_at: '2026-07-07T08:31:22.000Z' },
      { flow_id: 'TX-20260707-000189', flow_type: 'Win', status: 'success', amount: 5400, currency: 'TWD', created_at: '2026-07-07T08:32:06.000Z' }
    ],
    repair_records: [],
    logs: [
      { action: 'Provider 回傳 Bet', operator: 'System', operated_at: '2026-07-07T08:31:22.000Z', trace_id: 'trace-bet-pg-8842' },
      { action: 'Provider 回傳 Win 並完成 Round', operator: 'System', operated_at: '2026-07-07T08:32:06.000Z', trace_id: 'trace-win-pg-8842' }
    ]
  },
  {
    bet_id: 'BET-20260707-000771',
    round_id: 'R-PG-7711-99820',
    transaction_id: 'TX-20260707-000241',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_name: 'SEA Sub Agent 01',
    player_id: 'GGAP-P-7711',
    merchant_player_id: 'nova_7711',
    wallet_mode: 'transfer',
    provider_id: 'PROV-PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-THB',
    provider_currency_id: 'PG-CUR-THB-01',
    provider_merchant_id: 'PG-MCH-SEA-THB',
    provider_currency: 'THB',
    game_id: 'PG-002',
    game_name: 'Lucky Neko',
    game_type: 'Slot',
    status: 'provider_pending',
    transaction_currency: 'THB',
    transaction_bet_amount: 3200,
    transaction_payout_amount: null,
    payout_scope: 'unallocated',
    round_settlement_id: null,
    display_currency: 'THB',
    display_bet_amount: 3200,
    display_payout_amount: null,
    display_ggr: null,
    provider_bet_amount: 3200,
    provider_payout_amount: null,
    settlement_currency: 'USDT',
    settlement_bet_amount: null,
    settlement_payout_amount: null,
    settlement_ggr: null,
    settlement_status: 'pending_daily',
    settlement_batch_id: '-',
    settlement_rate_date: '2026-07-07',
    exchange_rate: 36.59,
    exchange_rate_id: 'FX-20260707-THB',
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-07T00:00:00.000+08:00',
    provider_tx_id: 'PG-TX-7711-PENDING',
    provider_round_status: 'PENDING',
    created_at: '2026-07-07T09:02:18.000Z',
    settled_at: '-',
    provider_payload: '{"roundId":"R-PG-7711-99820","bet":3200,"currency":"THB","status":"PENDING"}',
    wallet_payload: '{"wallet_mode":"transfer","ledger_id":"TR-20260707-000077","lock":3200}',
    bet_limit_snapshot: getBetLimitSnapshot('BET-20260707-000771'),
    transaction_flows: [
      { flow_id: 'TX-20260707-000241', flow_type: 'Bet', status: 'pending', amount: -3200, currency: 'THB', created_at: '2026-07-07T09:02:18.000Z' }
    ],
    repair_records: [
      { repair_id: 'RP-20260707-000011', reason: 'Provider Pending 注單', status: 'processing', operator: 'System', created_at: '2026-07-07T09:05:00.000Z' }
    ],
    logs: [
      { action: 'Provider 回傳 Pending', operator: 'System', operated_at: '2026-07-07T09:02:18.000Z', trace_id: 'trace-bet-pg-7711' },
      { action: '建立補單 / Provider 查單', operator: 'System', operated_at: '2026-07-07T09:05:00.000Z', trace_id: 'trace-repair-pg-7711' }
    ]
  },
  {
    bet_id: 'BET-20260707-000552',
    round_id: 'R-JILI-5520-14002',
    transaction_id: 'TX-20260707-000266',
    merchant_id: 'OP-1006',
    merchant_name: 'Lucky Panda Studio',
    agent_name: 'SEA Growth Agent',
    player_id: 'GGAP-P-5520',
    merchant_player_id: 'panda_5520',
    wallet_mode: 'seamless',
    provider_id: 'PROV-JILI',
    provider_name: 'JILI Gaming',
    provider_currency_line_id: 'PC-JILI-PHP',
    provider_currency_id: 'JILI-CUR-PHP-01',
    provider_merchant_id: 'JILI-MCH-PHP',
    provider_currency: 'PHP',
    game_id: 'JILI-001',
    game_name: 'Boxing King',
    game_type: 'Slot',
    status: 'repairing',
    transaction_currency: 'PHP',
    transaction_bet_amount: 1800,
    transaction_payout_amount: 1800,
    payout_scope: 'bet',
    round_settlement_id: null,
    display_currency: 'PHP',
    display_bet_amount: 1800,
    display_payout_amount: 1800,
    display_ggr: 0,
    provider_bet_amount: 1800,
    provider_payout_amount: 1800,
    settlement_currency: 'USDT',
    settlement_bet_amount: 30.54,
    settlement_payout_amount: 30.54,
    settlement_ggr: 0,
    settlement_status: 'settled',
    settlement_batch_id: 'SET-20260708-0002',
    settlement_rate_date: '2026-07-07',
    exchange_rate: 58.94,
    exchange_rate_id: 'FX-20260707-PHP',
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-07T00:00:00.000+08:00',
    provider_tx_id: 'JILI-TX-14002-REFUND',
    provider_round_status: 'REFUND_SUCCESS',
    created_at: '2026-07-07T10:06:18.000Z',
    settled_at: '2026-07-07T10:08:00.000Z',
    provider_payload: '{"roundId":"R-JILI-5520-14002","bet":1800,"refund":1800,"status":"REFUND_SUCCESS"}',
    wallet_payload: '{"callback":"refund","amount":1800,"status":"timeout","idempotency_key":"idem-op1006-refund-14002"}',
    bet_limit_snapshot: getBetLimitSnapshot('BET-20260707-000552'),
    transaction_flows: [
      { flow_id: 'TX-20260707-000266', flow_type: 'Refund', status: 'failed', amount: 1800, currency: 'PHP', created_at: '2026-07-07T10:08:00.000Z' }
    ],
    repair_records: [
      { repair_id: 'RP-20260707-000014', reason: '商戶 Callback timeout', status: 'created', operator: 'Ops', created_at: '2026-07-07T10:08:00.000Z' }
    ],
    logs: [
      { action: '建立 Refund Callback', operator: 'System', operated_at: '2026-07-07T10:08:00.000Z', trace_id: 'trace-jili-refund' },
      { action: '商戶 Callback timeout', operator: 'System', operated_at: '2026-07-07T10:10:12.000Z', trace_id: 'trace-jili-callback-timeout' }
    ]
  },
  {
    bet_id: 'BET-20260706-000925',
    round_id: 'R-PP-9255-77410',
    transaction_id: 'TX-20260706-000921',
    merchant_id: 'OP-1009',
    merchant_name: 'Golden Dragon Gaming',
    agent_name: 'SEA Local Desk L3',
    player_id: 'GGAP-P-9255',
    merchant_player_id: 'dragon_9255',
    wallet_mode: 'transfer',
    provider_id: 'PROV-PP',
    provider_name: 'Pragmatic Play',
    provider_currency_line_id: 'PC-PP-VND',
    provider_currency_id: 'PP-CUR-VND-01',
    provider_merchant_id: 'PP-MCH-VND',
    provider_currency: 'VND',
    game_id: 'PP-001',
    game_name: 'Sweet Bonanza',
    game_type: 'Slot',
    status: 'abnormal',
    transaction_currency: 'VND',
    transaction_bet_amount: 1200000,
    transaction_payout_amount: null,
    payout_scope: 'unallocated',
    round_settlement_id: null,
    display_currency: 'VND',
    display_bet_amount: 1200000,
    display_payout_amount: null,
    display_ggr: null,
    provider_bet_amount: 1200000,
    provider_payout_amount: null,
    settlement_currency: 'USDT',
    settlement_bet_amount: null,
    settlement_payout_amount: null,
    settlement_ggr: null,
    settlement_status: 'pending_daily',
    settlement_batch_id: '-',
    settlement_rate_date: '2026-07-06',
    exchange_rate: 26455.2,
    exchange_rate_id: 'FX-20260706-VND',
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-06T00:00:00.000+08:00',
    provider_tx_id: 'PP-TX-77410',
    provider_round_status: 'AMOUNT_MISMATCH',
    created_at: '2026-07-06T14:18:00.000Z',
    settled_at: '-',
    provider_payload: '{"roundId":"R-PP-9255-77410","bet":1200000,"currency":"VND","status":"AMOUNT_MISMATCH"}',
    wallet_payload: '{"wallet_mode":"transfer","ledger_id":"TR-20260706-000219","amount":1200000,"diff":45000}',
    bet_limit_snapshot: getBetLimitSnapshot('BET-20260706-000925'),
    transaction_flows: [
      { flow_id: 'TX-20260706-000921', flow_type: 'Bet', status: 'failed', amount: -1200000, currency: 'VND', created_at: '2026-07-06T14:18:00.000Z' }
    ],
    repair_records: [
      { repair_id: 'RP-20260706-000032', reason: 'Provider Amount Mismatch', status: 'processing', operator: 'Ops', created_at: '2026-07-06T14:20:00.000Z' }
    ],
    logs: [
      { action: '偵測金額差異', operator: 'System', operated_at: '2026-07-06T14:18:00.000Z', trace_id: 'trace-pp-mismatch' }
    ]
  }
])

// 同一會員在同一 Round 內的第二次下注仍保留為獨立注單，不以 Round 彙總覆蓋。
rows.value.splice(1, 0, {
  ...rows.value[0]!,
  bet_id: 'BET-20260707-000885',
  transaction_id: 'TX-20260707-000190',
  transaction_bet_amount: 600,
  transaction_payout_amount: 0,
  display_bet_amount: 600,
  display_payout_amount: 0,
  display_ggr: 600,
  provider_bet_amount: 600,
  provider_payout_amount: 0,
  settlement_bet_amount: 19.05,
  settlement_payout_amount: 0,
  settlement_ggr: 19.05,
  provider_tx_id: 'PG-TX-8842-78232',
  created_at: '2026-07-07T08:31:40.000Z',
  settled_at: '2026-07-07T08:32:06.000Z',
  provider_payload: '{"roundId":"R-PG-8842-78231","betId":"BET-20260707-000885","bet":600,"win":0,"currency":"TWD","status":"SETTLED"}',
  wallet_payload: '{"callback":"seamless","debit":600,"credit":0,"idempotency_key":"idem-op1001-pg-8842-2"}',
  bet_limit_snapshot: getBetLimitSnapshot('BET-20260707-000884'),
  transaction_flows: [
    { flow_id: 'TX-20260707-000190', flow_type: 'Bet', status: 'success', amount: -600, currency: 'TWD', created_at: '2026-07-07T08:31:40.000Z' }
  ],
  repair_records: [],
  logs: [
    { action: 'Provider 回傳同 Round 第二筆 Bet', operator: 'System', operated_at: '2026-07-07T08:31:40.000Z', trace_id: 'trace-bet-pg-8842-2' }
  ]
})

const statusMeta: Record<BetStatus, { label: string; type: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  settled: { label: '已結算', type: 'success' },
  unsettled: { label: '未結算', type: 'warning' },
  cancelled: { label: '已取消', type: 'default' },
  provider_pending: { label: 'Provider Pending', type: 'warning' },
  repairing: { label: '補單中', type: 'info' },
  abnormal: { label: '異常', type: 'error' }
}

const walletMeta: Record<WalletMode, { label: string; type: 'success' | 'info' }> = {
  seamless: { label: 'Seamless', type: 'success' },
  transfer: { label: 'Transfer', type: 'info' }
}

const payoutScopeLabel = {
  bet: '單筆派彩',
  round: 'Round 級派彩',
  unallocated: '尚未分配'
} as const

const providerOptions = computed(() => Array.from(new Set(rows.value.map(row => row.provider_name))).map(value => ({ label: value, value })))
const merchantOptions = computed(() => Array.from(new Map(rows.value.map(row => [row.merchant_id, `${row.merchant_name} / ${row.merchant_id}`]))).map(([value, label]) => ({ label, value })))
const agentOptions = computed(() => Array.from(new Set(rows.value.map(row => row.agent_name))).map(value => ({ label: value, value })))
const currencyOptions = computed(() => Array.from(new Set(rows.value.map(row => row.display_currency))).map(value => ({ label: value, value })))
const typeOptions = ['Slot', 'Live', 'Fishing', 'Sports'].map(value => ({ label: value, value }))
const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ label: meta.label, value }))
const walletOptions = Object.entries(walletMeta).map(([value, meta]) => ({ label: meta.label, value }))

const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  return rows.value.filter(row => {
    const matchesText = !text || [
      row.bet_id,
      row.round_id,
      row.transaction_id,
      row.provider_tx_id,
      row.player_id,
      row.merchant_player_id,
      row.game_name
    ].some(value => value.toLowerCase().includes(text))
    return matchesText
      && (!merchantFilter.value || row.merchant_id === merchantFilter.value)
      && (!agentFilter.value || row.agent_name === agentFilter.value)
      && (!providerFilter.value || row.provider_name === providerFilter.value)
      && (!typeFilter.value || row.game_type === typeFilter.value)
      && (!statusFilter.value || row.status === statusFilter.value)
      && (!walletFilter.value || row.wallet_mode === walletFilter.value)
      && (!currencyFilter.value || row.display_currency === currencyFilter.value)
  })
})

const summary = computed(() => ({
  total: rows.value.length,
  settled: rows.value.filter(row => row.status === 'settled').length,
  pending: rows.value.filter(row => ['provider_pending', 'repairing', 'abnormal'].includes(row.status)).length,
  settlementBet: rows.value.reduce((sum, row) => sum + (row.settlement_bet_amount ?? 0), 0),
  settlementGgr: rows.value.reduce((sum, row) => sum + (row.settlement_ggr ?? 0), 0)
}))

const formatDateTime = (value: string) => value === '-' ? '-' : new Date(value).toLocaleString()
const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`

const resetFilters = () => {
  keyword.value = ''
  merchantFilter.value = null
  agentFilter.value = null
  providerFilter.value = null
  typeFilter.value = null
  statusFilter.value = null
  walletFilter.value = null
  currencyFilter.value = null
}

const openDetail = (row: BetRow) => {
  currentRow.value = row
  detailTab.value = 'basic'
  showDetail.value = true
}

const copyText = async (text: string) => {
  await navigator.clipboard.writeText(text)
  message.success('已複製')
}

const actionMessage = (label: string, row?: BetRow) => {
  message.info(`${label}${row ? `：${row.round_id}` : ''}，演示操作已保留 trace 與查詢條件。`)
}

const columns: DataTableColumns<BetRow> = [
  { title: '注單 ID', key: 'bet_id', width: 185, fixed: 'left', render: row => h(NButton, { text: true, type: 'primary', onClick: () => openDetail(row) }, { default: () => row.bet_id }) },
  {
    title: 'Round ID',
    key: 'round_id',
    width: 185,
    render: row => h('span', { class: 'font-mono text-xs' }, row.round_id)
  },
  {
    title: '商戶 / 代理',
    key: 'merchant',
    width: 230,
    render: row => h('div', {}, [
      h('div', { class: 'font-semibold text-slate-100' }, row.merchant_name),
      h('div', { class: 'text-xs text-slate-500' }, `${row.merchant_id} / ${row.agent_name}`)
    ])
  },
  {
    title: '會員',
    key: 'player',
    width: 175,
    render: row => h('div', {}, [
      h('div', { class: 'font-mono text-xs text-cyan-300' }, row.player_id),
      h('div', { class: 'font-mono text-xs text-slate-500' }, row.merchant_player_id)
    ])
  },
  {
    title: 'Provider / 遊戲',
    key: 'game',
    width: 230,
    render: row => h('div', {}, [
      h('div', { class: 'font-semibold' }, row.game_name),
      h('div', { class: 'text-xs text-slate-500' }, `${row.provider_name} / ${row.game_type}`)
    ])
  },
  {
    title: '狀態',
    key: 'status',
    width: 135,
    render: row => h(NTag, { type: statusMeta[row.status].type, size: 'small', bordered: false }, { default: () => statusMeta[row.status].label })
  },
  {
    title: 'Wallet',
    key: 'wallet_mode',
    width: 110,
    render: row => h(NTag, { type: walletMeta[row.wallet_mode].type, size: 'small', bordered: false }, { default: () => walletMeta[row.wallet_mode].label })
  },
  { title: 'Provider 幣別線', key: 'provider_currency_id', width: 155, render: row => h('div', {}, [h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => row.provider_currency }), h('div', { class: 'mt-1 font-mono text-xs text-slate-500' }, row.provider_currency_id)]) },
  { title: '原幣投注', key: 'provider_bet_amount', width: 130, align: 'right', render: row => h(MoneyText, { value: row.provider_bet_amount, currency: row.provider_currency, compact: true, color: 'text-slate-100' }) },
  { title: '派彩歸屬', key: 'payout_scope', width: 120, render: row => h(NTag, { size: 'small', bordered: false, type: row.payout_scope === 'unallocated' ? 'warning' : 'info' }, { default: () => payoutScopeLabel[row.payout_scope] }) },
  { title: '原幣派彩', key: 'provider_payout_amount', width: 130, align: 'right', render: row => row.provider_payout_amount === null ? '-' : h(MoneyText, { value: row.provider_payout_amount, currency: row.provider_currency, compact: true, color: 'text-slate-100' }) },
  { title: '原幣 GGR', key: 'display_ggr', width: 125, align: 'right', render: row => row.display_ggr === null ? '-' : h(MoneyText, { value: row.display_ggr, currency: row.provider_currency, compact: true, showSign: true }) },
  { title: '結算 GGR', key: 'settlement_ggr', width: 130, align: 'right', render: row => h(MoneyText, { value: row.settlement_ggr, currency: 'USDT', compact: true, showSign: true }) },
  { title: '日結批次', key: 'settlement_batch_id', width: 155, render: row => h('span', { class: 'font-mono text-xs text-slate-400' }, row.settlement_batch_id) },
  { title: '建立時間', key: 'created_at', width: 175, render: row => formatDateTime(row.created_at) },
  { title: '結算時間', key: 'settled_at', width: 175, render: row => formatDateTime(row.settled_at) },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'right',
    render: row => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(NIcon, { component: VisibilityOutlined }), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => actionMessage('查看交易流水', row) }, { icon: () => h(NIcon, { component: DescriptionOutlined }), default: () => '流水' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => actionMessage('建立補單', row) }, { icon: () => h(NIcon, { component: ReplayOutlined }), default: () => '補單' })
      ]
    })
  }
]

const flowColumns: DataTableColumns<FlowRecord> = [
  { title: '流水 ID', key: 'flow_id', width: 170 },
  { title: '類型', key: 'flow_type', width: 100 },
  { title: '狀態', key: 'status', width: 100, render: row => h(NTag, { type: row.status === 'success' ? 'success' : row.status === 'failed' ? 'error' : 'warning', size: 'small', bordered: false }, { default: () => row.status }) },
  { title: '金額', key: 'amount', align: 'right', render: row => h(MoneyText, { value: row.amount, currency: row.currency, showSign: true }) },
  { title: '時間', key: 'created_at', width: 175, render: row => formatDateTime(row.created_at) }
]

const repairColumns: DataTableColumns<RepairRecord> = [
  { title: '補單 ID', key: 'repair_id', width: 180 },
  { title: '原因', key: 'reason' },
  { title: '狀態', key: 'status', width: 110 },
  { title: '操作人', key: 'operator', width: 110 },
  { title: '建立時間', key: 'created_at', width: 175, render: row => formatDateTime(row.created_at) }
]
</script>

<template>
  <div class="space-y-5 p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">注單管理</h1>
        <p class="mt-1 text-sm text-slate-500">逐筆查詢每位會員的下注、原幣 Provider 金額、USDT 日結快照、Wallet、流水與補單紀錄。</p>
      </div>
      <div class="flex gap-2">
        <n-button secondary @click="actionMessage('匯出注單')">匯出</n-button>
        <n-button type="primary" @click="actionMessage('Provider 查單')">
          <template #icon><n-icon :component="ReplayOutlined" /></template>
          Provider 查單
        </n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-5">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="注單總數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="已結算" :value="summary.settled" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="待處理 / 異常" :value="summary.pending" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="結算投注"><MoneyText :value="summary.settlementBet" currency="USDT" compact /></n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="結算 GGR"><MoneyText :value="summary.settlementGgr" currency="USDT" compact show-sign /></n-statistic></div>
    </div>

    <n-alert type="info" :show-icon="false">每一列只代表一位會員的一筆下注；同一 Round 內多次下注會有不同 bet_id 並分列保存。Provider 以幣別線原幣交易；平台於 00:00 關帳、00:05 鎖定公告匯率，並於 00:10 將前一日注單換算為 USDT 後鎖定日結批次。</n-alert>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#18181c] p-4">
      <n-input v-model:value="keyword" clearable placeholder="搜尋 Round ID / 注單 ID / 交易 ID / Provider Tx / 會員 / 遊戲" style="width: 360px; max-width: 100%;">
        <template #prefix><n-icon :component="SearchOutlined" /></template>
      </n-input>
      <n-select v-model:value="merchantFilter" clearable filterable :options="merchantOptions" placeholder="商戶" style="width: 140px;" />
      <n-select v-model:value="agentFilter" clearable :options="agentOptions" placeholder="代理" style="width: 130px;" />
      <n-select v-model:value="providerFilter" clearable :options="providerOptions" placeholder="Provider" style="width: 140px;" />
      <n-select v-model:value="typeFilter" clearable :options="typeOptions" placeholder="遊戲類型" style="width: 120px;" />
      <n-select v-model:value="statusFilter" clearable :options="statusOptions" placeholder="注單狀態" style="width: 140px;" />
      <n-select v-model:value="walletFilter" clearable :options="walletOptions" placeholder="Wallet 模式" style="width: 130px;" />
      <n-select v-model:value="currencyFilter" clearable :options="currencyOptions" placeholder="Provider 幣別" style="width: 130px;" />
      <n-button secondary @click="resetFilters">重置</n-button>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :loading="loading"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :bordered="false"
      :scroll-x="2570"
      striped
    />

    <n-drawer v-model:show="showDetail" width="min(1080px, calc(100vw - 16px))">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold">{{ currentRow.bet_id }}</span>
            <span class="font-mono text-sm text-slate-500">{{ currentRow.round_id }}</span>
            <n-tag size="small" :type="statusMeta[currentRow.status].type" :bordered="false">{{ statusMeta[currentRow.status].label }}</n-tag>
            <n-tag size="small" :type="walletMeta[currentRow.wallet_mode].type" :bordered="false">{{ walletMeta[currentRow.wallet_mode].label }}</n-tag>
            <n-tag size="small" type="info" :bordered="false">{{ currentRow.provider_currency }}</n-tag>
            <n-tag size="small" type="success" :bordered="false">USDT 日結</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="原幣投注"><MoneyText :value="currentRow.provider_bet_amount" :currency="currentRow.provider_currency" compact color="text-slate-100" /></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="原幣派彩"><MoneyText v-if="currentRow.provider_payout_amount !== null" :value="currentRow.provider_payout_amount" :currency="currentRow.provider_currency" compact color="text-slate-100" /><span v-else>-</span></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="原幣 GGR"><MoneyText v-if="currentRow.display_ggr !== null" :value="currentRow.display_ggr" :currency="currentRow.provider_currency" compact show-sign /><span v-else>-</span></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="結算 GGR"><MoneyText :value="currentRow.settlement_ggr" currency="USDT" compact show-sign /></n-statistic></div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="Round ID">{{ currentRow.round_id }}</n-descriptions-item>
                <n-descriptions-item label="注單 ID">{{ currentRow.bet_id }}</n-descriptions-item>
                <n-descriptions-item label="交易 ID">{{ currentRow.transaction_id }}</n-descriptions-item>
                <n-descriptions-item label="Provider Tx ID">{{ currentRow.provider_tx_id }}</n-descriptions-item>
                <n-descriptions-item label="派彩歸屬">{{ payoutScopeLabel[currentRow.payout_scope] }}</n-descriptions-item>
                <n-descriptions-item label="Round 結算 ID">{{ currentRow.round_settlement_id || '-' }}</n-descriptions-item>
                <n-descriptions-item label="商戶">{{ currentRow.merchant_name }} / {{ currentRow.merchant_id }}</n-descriptions-item>
                <n-descriptions-item label="代理">{{ currentRow.agent_name }}</n-descriptions-item>
                <n-descriptions-item label="會員">{{ currentRow.player_id }} / {{ currentRow.merchant_player_id }}</n-descriptions-item>
                <n-descriptions-item label="Wallet 模式">{{ walletMeta[currentRow.wallet_mode].label }}</n-descriptions-item>
                <n-descriptions-item label="Provider / 遊戲">{{ currentRow.provider_name }} / {{ currentRow.game_name }}</n-descriptions-item>
                <n-descriptions-item label="遊戲類型">{{ currentRow.game_type }}</n-descriptions-item>
                <n-descriptions-item label="Provider 幣別 ID">{{ currentRow.provider_currency_id }}</n-descriptions-item>
                <n-descriptions-item label="Provider 廠商 ID">{{ currentRow.provider_merchant_id }}</n-descriptions-item>
                <n-descriptions-item label="建立時間">{{ formatDateTime(currentRow.created_at) }}</n-descriptions-item>
                <n-descriptions-item label="結算時間">{{ formatDateTime(currentRow.settled_at) }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="amount" tab="金額 / 匯率">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="Provider 交易幣別">{{ currentRow.provider_currency }}</n-descriptions-item>
                <n-descriptions-item label="結算幣別">{{ currentRow.settlement_currency }}</n-descriptions-item>
                <n-descriptions-item label="Provider 原幣投注"><MoneyText :value="currentRow.provider_bet_amount" :currency="currentRow.provider_currency" compact /></n-descriptions-item>
                <n-descriptions-item label="投注結算金額"><MoneyText :value="currentRow.settlement_bet_amount" currency="USDT" compact /></n-descriptions-item>
                <n-descriptions-item label="Provider 原幣派彩"><MoneyText v-if="currentRow.provider_payout_amount !== null" :value="currentRow.provider_payout_amount" :currency="currentRow.provider_currency" compact /><span v-else>-</span></n-descriptions-item>
                <n-descriptions-item label="派彩結算金額"><MoneyText :value="currentRow.settlement_payout_amount" currency="USDT" compact /></n-descriptions-item>
                <n-descriptions-item label="日結狀態">{{ currentRow.settlement_status }}</n-descriptions-item>
                <n-descriptions-item label="日結批次">{{ currentRow.settlement_batch_id }}</n-descriptions-item>
                <n-descriptions-item label="匯率日期">{{ currentRow.settlement_rate_date }}</n-descriptions-item>
                <n-descriptions-item label="匯率 ID">{{ currentRow.exchange_rate_id }}</n-descriptions-item>
                <n-descriptions-item label="匯率">{{ currentRow.exchange_rate }}</n-descriptions-item>
                <n-descriptions-item label="匯率服務費率">{{ formatRate(currentRow.exchange_fee_rate) }}</n-descriptions-item>
                <n-descriptions-item label="鎖定時間">{{ formatDateTime(currentRow.rate_locked_at) }}</n-descriptions-item>
              </n-descriptions>
              <n-alert v-if="currentRow.payout_scope === 'round' || currentRow.payout_scope === 'unallocated'" type="warning" :show-icon="false" class="mt-4">
                Provider 未提供單筆派彩時，單筆 payout 與 GGR 保持空值；Round 派彩另存 round_settlement，不得平均分配回各筆注單。
              </n-alert>
              <n-alert type="warning" :show-icon="false" class="mt-4">歷史交易使用交易日公告匯率與當下快照，日結鎖定後不會因匯率更新重算。</n-alert>
            </n-tab-pane>

            <n-tab-pane name="limit" tab="下注限額方案快照">
              <n-alert type="info" :show-icon="false" class="mb-4">
                下注 request 會以 Session 當下的 Provider 幣別線下注限額方案快照驗證；後續修改商戶或會員方案指派，不會回寫歷史注單。
              </n-alert>
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="Session ID">{{ currentRow.bet_limit_snapshot.session_id }}</n-descriptions-item>
                <n-descriptions-item label="檢查結果">
                  <n-tag :type="currentRow.bet_limit_snapshot.check_result === 'passed' ? 'success' : currentRow.bet_limit_snapshot.check_result === 'blocked' ? 'error' : 'warning'" :bordered="false">
                    {{ gameLimitCheckResultLabel[currentRow.bet_limit_snapshot.check_result] }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="限額方案">{{ currentRow.bet_limit_snapshot.provider_bet_group_name }}</n-descriptions-item>
                <n-descriptions-item label="群組代碼">{{ currentRow.bet_limit_snapshot.provider_bet_group_code }}</n-descriptions-item>
                <n-descriptions-item label="來源">{{ gameLimitSourceLabel[currentRow.bet_limit_snapshot.limit_source] }}</n-descriptions-item>
                <n-descriptions-item label="Provider 上限代碼">{{ currentRow.bet_limit_snapshot.provider_limit_code }}</n-descriptions-item>
                <n-descriptions-item label="最小投注">{{ formatDisplayAmount(currentRow.bet_limit_snapshot.min_bet_display, currentRow.bet_limit_snapshot.display_currency) }}</n-descriptions-item>
                <n-descriptions-item label="最大投注">{{ formatDisplayAmount(currentRow.bet_limit_snapshot.max_bet_display, currentRow.bet_limit_snapshot.display_currency) }}</n-descriptions-item>
                <n-descriptions-item label="跳動單位">{{ formatDisplayAmount(currentRow.bet_limit_snapshot.bet_step_display, currentRow.bet_limit_snapshot.display_currency) }}</n-descriptions-item>
                <n-descriptions-item label="檢查時間">{{ formatDateTime(currentRow.bet_limit_snapshot.checked_at) }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="payload" tab="Provider / Wallet">
              <n-descriptions bordered :column="1" label-placement="top">
                <n-descriptions-item label="Provider Payload"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-slate-300">{{ currentRow.provider_payload }}</pre></n-descriptions-item>
                <n-descriptions-item label="Wallet Payload"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-slate-300">{{ currentRow.wallet_payload }}</pre></n-descriptions-item>
                <n-descriptions-item label="Provider Round Status">{{ currentRow.provider_round_status }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="flows" tab="交易流水">
              <n-data-table :columns="withTableSorters(flowColumns)" :data="currentRow.transaction_flows" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>

            <n-tab-pane name="repairs" tab="補單紀錄">
              <n-alert v-if="currentRow.repair_records.length === 0" type="success" :show-icon="false">此注單尚無補單紀錄。</n-alert>
              <n-data-table v-else :columns="withTableSorters(repairColumns)" :data="currentRow.repair_records" :pagination="DEFAULT_TABLE_PAGINATION" />
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
            <n-button secondary @click="copyText(currentRow.round_id)">
              <template #icon><n-icon :component="ContentCopyOutlined" /></template>
              複製 Round ID
            </n-button>
            <n-button secondary @click="actionMessage('查看交易流水', currentRow)">查看交易流水</n-button>
            <n-button secondary @click="actionMessage('Provider 查單', currentRow)">Provider 查單</n-button>
            <n-button type="primary" secondary @click="actionMessage('建立補單', currentRow)">建立補單</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
