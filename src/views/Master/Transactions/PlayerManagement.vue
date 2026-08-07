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
import { AccountBalanceWalletOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { formatDisplayAmount } from '../../../utils/format'
import { getPlayerBetLimits } from '../../../mocks/gameLimits'
import type { PlayerBetLimit } from '../../../types/gameLimit'
import { gameLimitSourceLabel, gameLimitStatusLabel } from '../../../types/gameLimit'

type WalletMode = 'seamless' | 'transfer'
type SessionStatus = 'online' | 'idle' | 'expired'
type RiskStatus = 'normal' | 'watchlist' | 'frozen'
type TransactionStatus = 'success' | 'pending' | 'failed'

interface PlayerSession {
  session_id: string
  provider_id: string
  game_code: string
  transaction_currency: string
  provider_currency_connection_id: string
  provider_bet_group_id: string
  settlement_currency: 'USDT'
  wallet_mode: WalletMode
  status: SessionStatus
  launched_at: string
  last_active_at: string
  expired_at: string
}

interface PlayerTransaction {
  transaction_id: string
  type: 'Bet' | 'Win' | 'Refund' | 'Rollback' | 'Transfer In' | 'Transfer Out'
  provider_id: string
  game_code: string
  display_currency: string
  display_amount: number
  settlement_currency: 'USDT'
  settlement_amount: number
  exchange_rate_id: string
  exchange_rate: number
  rate_locked_at: string
  wallet_mode: WalletMode
  status: TransactionStatus
  created_at: string
}

interface RiskLog {
  rule: string
  level: 'info' | 'warning' | 'error'
  hit_at: string
  note: string
}

interface AuditLog {
  action: string
  operator: string
  operated_at: string
  trace_id: string
}

interface PlayerWallet {
  player_wallet_id: string
  merchant_id: string
  merchant_name: string
  merchant_player_id: string
  display_currency: string
  settlement_currency: 'USDT'
  wallet_identity: string
  wallet_mode: WalletMode
  agent_id: string
  agent_name: string
  settlement_agent_id: string
  settlement_agent_name: string
  available_balance: number | null
  locked_balance: number | null
  last_callback_balance?: number
  session_status: SessionStatus
  risk_status: RiskStatus
  daily_bet_limit: number
  single_bet_limit: number
  bet_limits: PlayerBetLimit[]
  abnormal_count: number
  created_at: string
  last_login_at: string
  last_transaction_at: string
  sessions: PlayerSession[]
  transactions: PlayerTransaction[]
  risk_logs: RiskLog[]
  audit_logs: AuditLog[]
}

const message = useMessage()
const showDetail = ref(false)
const currentRow = ref<PlayerWallet | null>(null)
const detailTab = ref('basic')
const searchText = ref('')
const merchantFilter = ref<string | null>(null)
const agentFilter = ref<string | null>(null)
const currencyFilter = ref<string | null>(null)
const walletFilter = ref<WalletMode | null>(null)
const sessionFilter = ref<SessionStatus | null>(null)
const riskFilter = ref<RiskStatus | null>(null)

const rows = ref<PlayerWallet[]>([
  {
    player_wallet_id: 'PW-OP1001-mem_8842-TWD',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    merchant_player_id: 'mem_8842',
    display_currency: 'TWD',
    settlement_currency: 'USDT',
    wallet_identity: 'OP-1001 + mem_8842 + TWD',
    wallet_mode: 'seamless',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    settlement_agent_id: 'AGT-DIRECT',
    settlement_agent_name: '平台直營代理',
    available_balance: null,
    locked_balance: null,
    last_callback_balance: 128400,
    session_status: 'online',
    risk_status: 'normal',
    daily_bet_limit: 500000,
    single_bet_limit: 50000,
    bet_limits: getPlayerBetLimits('PW-OP1001-mem_8842-TWD'),
    abnormal_count: 0,
    created_at: '2026-06-18T05:20:00.000Z',
    last_login_at: '2026-07-07T09:10:00.000Z',
    last_transaction_at: '2026-07-07T09:22:12.000Z',
    sessions: [
      { session_id: 'SES-OP1001-TWD-8842', provider_id: 'PG', game_code: 'PG-FORTUNE-TIGER', transaction_currency: 'TWD', provider_currency_connection_id: 'PC-PG-TWD', provider_bet_group_id: 'PBG-PG-TWD-002', settlement_currency: 'USDT', wallet_mode: 'seamless', status: 'online', launched_at: '2026-07-07T09:02:00.000Z', last_active_at: '2026-07-07T09:22:12.000Z', expired_at: '2026-07-07T11:02:00.000Z' }
    ],
    transactions: [
      { transaction_id: 'TX-8842-0001', type: 'Bet', provider_id: 'PG', game_code: 'PG-FORTUNE-TIGER', display_currency: 'TWD', display_amount: -3200, settlement_currency: 'USDT', settlement_amount: -100.38, exchange_rate_id: 'FX-20260707-TWD', exchange_rate: 31.8786, rate_locked_at: '2026-07-07T00:00:00.000Z', wallet_mode: 'seamless', status: 'success', created_at: '2026-07-07T09:18:12.000Z' },
      { transaction_id: 'TX-8842-0002', type: 'Win', provider_id: 'PG', game_code: 'PG-FORTUNE-TIGER', display_currency: 'TWD', display_amount: 5400, settlement_currency: 'USDT', settlement_amount: 169.39, exchange_rate_id: 'FX-20260707-TWD', exchange_rate: 31.8786, rate_locked_at: '2026-07-07T00:00:00.000Z', wallet_mode: 'seamless', status: 'success', created_at: '2026-07-07T09:19:01.000Z' }
    ],
    risk_logs: [
      { rule: '短時間連續投注', level: 'info', hit_at: '2026-07-07T09:20:00.000Z', note: '低風險提示，未限制會員操作。' }
    ],
    audit_logs: [
      { action: 'Launch Game 建立 Session', operator: 'System', operated_at: '2026-07-07T09:02:00.000Z', trace_id: 'trace-session-8842' }
    ]
  },
  {
    player_wallet_id: 'PW-OP1001-mem_8842-PHP',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    merchant_player_id: 'mem_8842',
    display_currency: 'PHP',
    settlement_currency: 'USDT',
    wallet_identity: 'OP-1001 + mem_8842 + PHP',
    wallet_mode: 'seamless',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    settlement_agent_id: 'AGT-DIRECT',
    settlement_agent_name: '平台直營代理',
    available_balance: null,
    locked_balance: null,
    last_callback_balance: 24500,
    session_status: 'expired',
    risk_status: 'normal',
    daily_bet_limit: 250000,
    single_bet_limit: 20000,
    bet_limits: getPlayerBetLimits('PW-OP1001-mem_8842-PHP'),
    abnormal_count: 0,
    created_at: '2026-06-22T07:00:00.000Z',
    last_login_at: '2026-07-06T21:32:00.000Z',
    last_transaction_at: '2026-07-06T21:47:30.000Z',
    sessions: [
      { session_id: 'SES-OP1001-PHP-8842', provider_id: 'JILI', game_code: 'JILI-SUPER-ACE', transaction_currency: 'PHP', provider_currency_connection_id: 'PC-JILI-PHP', provider_bet_group_id: 'PBG-JILI-PHP-001', settlement_currency: 'USDT', wallet_mode: 'seamless', status: 'expired', launched_at: '2026-07-06T21:20:00.000Z', last_active_at: '2026-07-06T21:47:30.000Z', expired_at: '2026-07-06T23:20:00.000Z' }
    ],
    transactions: [
      { transaction_id: 'TX-8842-PHP-0001', type: 'Bet', provider_id: 'JILI', game_code: 'JILI-SUPER-ACE', display_currency: 'PHP', display_amount: -1800, settlement_currency: 'USDT', settlement_amount: -30.54, exchange_rate_id: 'FX-20260706-PHP', exchange_rate: 58.9332, rate_locked_at: '2026-07-07T00:00:00.000Z', wallet_mode: 'seamless', status: 'success', created_at: '2026-07-06T21:40:12.000Z' }
    ],
    risk_logs: [],
    audit_logs: [
      { action: 'Session 自動過期', operator: 'System', operated_at: '2026-07-06T23:20:00.000Z', trace_id: 'trace-session-expired-8842' }
    ]
  },
  {
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    merchant_player_id: 'nova_7711',
    display_currency: 'THB',
    settlement_currency: 'USDT',
    wallet_identity: 'OP-1008 + nova_7711 + THB',
    wallet_mode: 'transfer',
    agent_id: 'AGT-SEA-SUB01',
    agent_name: 'SEA Sub Agent 01',
    settlement_agent_id: 'AGT-SEA-001',
    settlement_agent_name: 'SEA Growth Agent',
    available_balance: 88420,
    locked_balance: 3200,
    session_status: 'idle',
    risk_status: 'watchlist',
    daily_bet_limit: 600000,
    single_bet_limit: 60000,
    bet_limits: getPlayerBetLimits('PW-OP1008-nova_7711-THB'),
    abnormal_count: 2,
    created_at: '2026-06-28T03:12:00.000Z',
    last_login_at: '2026-07-07T08:15:00.000Z',
    last_transaction_at: '2026-07-07T08:49:28.000Z',
    sessions: [
      { session_id: 'SES-OP1008-THB-7711', provider_id: 'PG', game_code: 'PG-MAHJONG-WAYS', transaction_currency: 'THB', provider_currency_connection_id: 'PC-PG-THB', provider_bet_group_id: 'PBG-PG-THB-001', settlement_currency: 'USDT', wallet_mode: 'transfer', status: 'idle', launched_at: '2026-07-07T08:11:00.000Z', last_active_at: '2026-07-07T08:49:28.000Z', expired_at: '2026-07-07T10:11:00.000Z' }
    ],
    transactions: [
      { transaction_id: 'TX-7711-0001', type: 'Transfer In', provider_id: 'GGAP', game_code: '-', display_currency: 'THB', display_amount: 50000, settlement_currency: 'USDT', settlement_amount: 1366.42, exchange_rate_id: 'FX-20260707-THB', exchange_rate: 36.5921, rate_locked_at: '2026-07-07T00:00:00.000Z', wallet_mode: 'transfer', status: 'success', created_at: '2026-07-07T08:10:30.000Z' },
      { transaction_id: 'TX-7711-0002', type: 'Bet', provider_id: 'PG', game_code: 'PG-MAHJONG-WAYS', display_currency: 'THB', display_amount: -3200, settlement_currency: 'USDT', settlement_amount: -87.45, exchange_rate_id: 'FX-20260707-THB', exchange_rate: 36.5921, rate_locked_at: '2026-07-07T00:00:00.000Z', wallet_mode: 'transfer', status: 'pending', created_at: '2026-07-07T08:49:28.000Z' }
    ],
    risk_logs: [
      { rule: '大額 Transfer In', level: 'warning', hit_at: '2026-07-07T08:12:00.000Z', note: '已加入觀察名單，未凍結錢包。' }
    ],
    audit_logs: [
      { action: 'Transfer Wallet Ledger 入帳', operator: 'System', operated_at: '2026-07-07T08:10:30.000Z', trace_id: 'trace-transfer-in-7711' }
    ]
  },
  {
    player_wallet_id: 'PW-OP1009-dragon_9255-VND',
    merchant_id: 'OP-1009',
    merchant_name: 'Golden Dragon Gaming',
    merchant_player_id: 'dragon_9255',
    display_currency: 'VND',
    settlement_currency: 'USDT',
    wallet_identity: 'OP-1009 + dragon_9255 + VND',
    wallet_mode: 'transfer',
    agent_id: 'AGT-SEA-SUB01-L3',
    agent_name: 'SEA Local Desk L3',
    settlement_agent_id: 'AGT-SEA-001',
    settlement_agent_name: 'SEA Growth Agent',
    available_balance: 0,
    locked_balance: 0,
    session_status: 'expired',
    risk_status: 'frozen',
    daily_bet_limit: 0,
    single_bet_limit: 0,
    bet_limits: getPlayerBetLimits('PW-OP1009-dragon_9255-VND'),
    abnormal_count: 6,
    created_at: '2026-07-01T06:30:00.000Z',
    last_login_at: '2026-07-06T14:10:00.000Z',
    last_transaction_at: '2026-07-06T14:15:44.000Z',
    sessions: [
      { session_id: 'SES-OP1009-VND-9255', provider_id: 'PP', game_code: 'PP-GATES-OLYMPUS', transaction_currency: 'VND', provider_currency_connection_id: 'PC-PP-VND', provider_bet_group_id: 'PBG-PP-VND-001', settlement_currency: 'USDT', wallet_mode: 'transfer', status: 'expired', launched_at: '2026-07-06T14:00:00.000Z', last_active_at: '2026-07-06T14:15:44.000Z', expired_at: '2026-07-06T16:00:00.000Z' }
    ],
    transactions: [
      { transaction_id: 'TX-9255-0001', type: 'Bet', provider_id: 'PP', game_code: 'PP-GATES-OLYMPUS', display_currency: 'VND', display_amount: -1200000, settlement_currency: 'USDT', settlement_amount: -45.36, exchange_rate_id: 'FX-20260706-VND', exchange_rate: 26451.6, rate_locked_at: '2026-07-07T00:00:00.000Z', wallet_mode: 'transfer', status: 'failed', created_at: '2026-07-06T14:15:44.000Z' }
    ],
    risk_logs: [
      { rule: '異常失敗交易', level: 'error', hit_at: '2026-07-06T14:16:00.000Z', note: '連續失敗且 Ledger 狀態異常，已凍結會員錢包。' }
    ],
    audit_logs: [
      { action: '凍結會員錢包', operator: 'Risk', operated_at: '2026-07-06T14:18:00.000Z', trace_id: 'trace-freeze-9255' }
    ]
  }
])

const walletOptions = [
  { label: 'Seamless', value: 'seamless' },
  { label: 'Transfer', value: 'transfer' }
]
const sessionOptions = [
  { label: '在線', value: 'online' },
  { label: '閒置', value: 'idle' },
  { label: '已過期', value: 'expired' }
]
const riskOptions = [
  { label: '正常', value: 'normal' },
  { label: '觀察', value: 'watchlist' },
  { label: '凍結', value: 'frozen' }
]
const currencyOptions = ['TWD', 'PHP', 'THB', 'VND', 'IDR'].map(value => ({ label: value, value }))
const merchantOptions = computed(() => Array.from(new Set(rows.value.map(row => row.merchant_name))).map(value => ({ label: value, value })))
const agentOptions = computed(() => Array.from(new Set(rows.value.map(row => row.agent_name))).map(value => ({ label: value, value })))

const sessionMeta: Record<SessionStatus, { label: string; type: 'success' | 'warning' | 'default' }> = {
  online: { label: '在線', type: 'success' },
  idle: { label: '閒置', type: 'warning' },
  expired: { label: '已過期', type: 'default' }
}
const riskMeta: Record<RiskStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  normal: { label: '正常', type: 'success' },
  watchlist: { label: '觀察', type: 'warning' },
  frozen: { label: '凍結', type: 'error' }
}
const txStatusMeta: Record<TransactionStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  success: { label: '成功', type: 'success' },
  pending: { label: '處理中', type: 'warning' },
  failed: { label: '失敗', type: 'error' }
}

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-TW') : '-'
const walletModeLabel = (mode: WalletMode) => mode === 'seamless' ? 'Seamless' : 'Transfer'

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const inKeyword = !keyword
      || row.player_wallet_id.toLowerCase().includes(keyword)
      || row.merchant_player_id.toLowerCase().includes(keyword)
      || row.merchant_name.toLowerCase().includes(keyword)
      || row.wallet_identity.toLowerCase().includes(keyword)
    const inMerchant = !merchantFilter.value || row.merchant_name === merchantFilter.value
    const inAgent = !agentFilter.value || row.agent_name === agentFilter.value
    const inCurrency = !currencyFilter.value || row.display_currency === currencyFilter.value
    const inWallet = !walletFilter.value || row.wallet_mode === walletFilter.value
    const inSession = !sessionFilter.value || row.session_status === sessionFilter.value
    const inRisk = !riskFilter.value || row.risk_status === riskFilter.value
    return inKeyword && inMerchant && inAgent && inCurrency && inWallet && inSession && inRisk
  })
})

const summary = computed(() => ({
  total: filteredRows.value.length,
  transfer: filteredRows.value.filter(row => row.wallet_mode === 'transfer').length,
  seamless: filteredRows.value.filter(row => row.wallet_mode === 'seamless').length,
  online: filteredRows.value.filter(row => row.session_status === 'online').length,
  frozen: filteredRows.value.filter(row => row.risk_status === 'frozen').length,
  lockedBalance: filteredRows.value.reduce((sum, row) => sum + (row.locked_balance || 0), 0)
}))

const resetFilters = () => {
  searchText.value = ''
  merchantFilter.value = null
  agentFilter.value = null
  currencyFilter.value = null
  walletFilter.value = null
  sessionFilter.value = null
  riskFilter.value = null
}

const openDetail = (row: PlayerWallet) => {
  currentRow.value = row
  detailTab.value = 'basic'
  showDetail.value = true
}

const actionMessage = (action: string, row: PlayerWallet) => {
  message.info(`${action} 已建立演示操作：${row.wallet_identity}`)
}

const columns: DataTableColumns<PlayerWallet> = [
  {
    title: '會員錢包 ID',
    key: 'player_wallet_id',
    width: 230,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openDetail(row) }, row.player_wallet_id)
  },
  { title: '商戶會員 ID', key: 'merchant_player_id', width: 150, render: row => h('span', { class: 'font-mono' }, row.merchant_player_id) },
  {
    title: '商戶',
    key: 'merchant_name',
    width: 220,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'font-semibold' }, row.merchant_name),
      h('span', { class: 'font-mono text-xs text-gray-500' }, row.merchant_id)
    ])
  },
  {
    title: '代理',
    key: 'agent_name',
    width: 220,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'font-semibold' }, row.agent_name),
      h('span', { class: 'font-mono text-xs text-gray-500' }, `L1: ${row.settlement_agent_id}`)
    ])
  },
  { title: '交易幣別', key: 'display_currency', width: 110, render: row => h(NTag, { bordered: false }, { default: () => row.display_currency }) },
  { title: '結算幣別', key: 'settlement_currency', width: 110, render: row => h(NTag, { type: 'success', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '錢包模式', key: 'wallet_mode', width: 120, render: row => h(NTag, { type: row.wallet_mode === 'transfer' ? 'warning' : 'info', bordered: false }, { default: () => walletModeLabel(row.wallet_mode) }) },
  { title: '可用餘額', key: 'available_balance', width: 140, align: 'right', render: row => row.wallet_mode === 'transfer'
    ? h(MoneyText, { value: row.available_balance || 0, currency: row.display_currency, compact: true, color: 'text-slate-100' })
    : h('span', { class: 'text-xs text-gray-500' }, 'Callback 查詢') },
  { title: '鎖定餘額', key: 'locked_balance', width: 140, align: 'right', render: row => row.wallet_mode === 'transfer'
    ? h(MoneyText, { value: row.locked_balance || 0, currency: row.display_currency, compact: true, color: 'text-slate-100' })
    : h('span', { class: 'text-xs text-gray-500' }, '-') },
  { title: 'Session', key: 'session_status', width: 110, render: row => h(NTag, { type: sessionMeta[row.session_status].type, bordered: false }, { default: () => sessionMeta[row.session_status].label }) },
  { title: '風控', key: 'risk_status', width: 110, render: row => h(NTag, { type: riskMeta[row.risk_status].type, bordered: false }, { default: () => riskMeta[row.risk_status].label }) },
  { title: '最後交易', key: 'last_transaction_at', width: 180, render: row => formatDateTime(row.last_transaction_at) },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, {
          icon: () => h(NIcon, null, { default: () => h(VisibilityOutlined) }),
          default: () => '查看'
        }),
        h(NButton, { size: 'small', secondary: true, onClick: () => actionMessage('重送錢包 Callback', row) }, { default: () => '重送 Callback' }),
        h(NButton, { size: 'small', secondary: true, type: row.risk_status === 'frozen' ? 'success' : 'warning', onClick: () => actionMessage(row.risk_status === 'frozen' ? '解除凍結' : '凍結會員錢包', row) }, { default: () => row.risk_status === 'frozen' ? '解凍' : '凍結' })
      ]
    })
  }
]

const sessionColumns: DataTableColumns<PlayerSession> = [
  { title: 'Session ID', key: 'session_id', width: 210, render: row => h('span', { class: 'font-mono text-xs' }, row.session_id) },
  { title: 'Provider', key: 'provider_id', width: 110 },
  { title: '遊戲', key: 'game_code', width: 180 },
  { title: '交易幣別', key: 'transaction_currency', width: 100 },
  { title: 'Provider 幣別線', key: 'provider_currency_connection_id', width: 180, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.provider_currency_connection_id) },
  { title: '下注限額方案', key: 'provider_bet_group_id', width: 180, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.provider_bet_group_id) },
  { title: '錢包模式', key: 'wallet_mode', width: 120, render: row => walletModeLabel(row.wallet_mode) },
  { title: '狀態', key: 'status', width: 100, render: row => h(NTag, { type: sessionMeta[row.status].type, bordered: false }, { default: () => sessionMeta[row.status].label }) },
  { title: '最後活躍', key: 'last_active_at', width: 180, render: row => formatDateTime(row.last_active_at) }
]

const limitColumns: DataTableColumns<PlayerBetLimit> = [
  { title: 'Provider', key: 'provider_id', width: 100 },
  { title: '遊戲類型', key: 'game_type', width: 100 },
  { title: '下注限額方案', key: 'provider_bet_group_name', width: 200 },
  { title: '最小投注', key: 'min_bet', align: 'right', render: row => formatDisplayAmount(row.min_bet, row.display_currency) },
  { title: '最大投注', key: 'max_bet', align: 'right', render: row => formatDisplayAmount(row.max_bet, row.display_currency) },
  { title: '來源', key: 'source', width: 130, render: row => h(NTag, { type: row.source === 'player_override' ? 'warning' : 'success', size: 'small', bordered: false }, { default: () => gameLimitSourceLabel[row.source] }) },
  { title: '生效時間', key: 'effective_at', width: 175, render: row => formatDateTime(row.effective_at) },
  { title: '狀態', key: 'status', width: 90, render: row => h(NTag, { type: row.status === 'active' ? 'success' : 'error', size: 'small', bordered: false }, { default: () => gameLimitStatusLabel[row.status] }) }
]

const transactionColumns: DataTableColumns<PlayerTransaction> = [
  { title: '交易 ID', key: 'transaction_id', width: 170, render: row => h('span', { class: 'font-mono text-xs' }, row.transaction_id) },
  { title: '類型', key: 'type', width: 110 },
  { title: 'Provider', key: 'provider_id', width: 100 },
  { title: '遊戲', key: 'game_code', width: 180 },
  { title: '原幣金額', key: 'display_amount', width: 150, align: 'right', render: row => h(MoneyText, { value: row.display_amount, currency: row.display_currency, compact: true, showSign: true }) },
  { title: 'USDT 金額', key: 'settlement_amount', width: 150, align: 'right', render: row => h(MoneyText, { value: row.settlement_amount, currency: row.settlement_currency, compact: true, showSign: true }) },
  { title: '匯率 ID', key: 'exchange_rate_id', width: 160, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.exchange_rate_id) },
  { title: '匯率', key: 'exchange_rate', width: 120, align: 'right', render: row => row.exchange_rate.toLocaleString() },
  { title: '鎖定時間', key: 'rate_locked_at', width: 180, render: row => formatDateTime(row.rate_locked_at) },
  { title: '狀態', key: 'status', width: 100, render: row => h(NTag, { type: txStatusMeta[row.status].type, bordered: false }, { default: () => txStatusMeta[row.status].label }) },
  { title: '建立時間', key: 'created_at', width: 180, render: row => formatDateTime(row.created_at) }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">會員管理</h1>
        <p class="mt-1 text-sm text-gray-500">
          以 merchant_id + merchant_player_id + transaction_currency 識別會員錢包，檢視 Session、交易快照與風控紀錄。
        </p>
      </div>
      <n-button type="primary" secondary @click="message.info('已匯出會員錢包演示資料')">
        <template #icon><n-icon><AccountBalanceWalletOutlined /></n-icon></template>
        匯出會員錢包
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="會員錢包總數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Seamless" :value="summary.seamless" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Transfer" :value="summary.transfer" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="在線 Session" :value="summary.online" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="凍結會員" :value="summary.frozen" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Transfer 鎖定餘額"><MoneyText :value="summary.lockedBalance" currency="USDT" compact color="text-slate-100" /></n-statistic></div>
    </div>

    <n-alert type="info" :show-icon="false">
      會員管理只做營運追蹤、Session、交易快照與風控稽核；會員不會成為 GGAP 正式帳務主體。
    </n-alert>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#202026] p-4">
      <n-input v-model:value="searchText" clearable placeholder="搜尋會員錢包 / 商戶會員 / 商戶" style="width: 320px; max-width: 100%;">
        <template #prefix><n-icon :component="SearchOutlined" class="opacity-60" /></template>
      </n-input>
      <n-select v-model:value="merchantFilter" clearable filterable placeholder="商戶" :options="merchantOptions" style="width: 180px;" />
      <n-select v-model:value="agentFilter" clearable filterable placeholder="所屬代理" :options="agentOptions" style="width: 170px;" />
      <n-select v-model:value="currencyFilter" clearable placeholder="交易幣別" :options="currencyOptions" style="width: 130px;" />
      <n-select v-model:value="walletFilter" clearable placeholder="錢包模式" :options="walletOptions" style="width: 140px;" />
      <n-select v-model:value="sessionFilter" clearable placeholder="Session" :options="sessionOptions" style="width: 130px;" />
      <n-select v-model:value="riskFilter" clearable placeholder="風控狀態" :options="riskOptions" style="width: 130px;" />
      <n-button secondary @click="resetFilters">重置</n-button>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="2100"
    />

    <n-drawer v-model:show="showDetail" width="min(1120px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold">{{ currentRow.player_wallet_id }}</span>
            <span class="text-sm text-gray-500">{{ currentRow.merchant_name }} / {{ currentRow.merchant_player_id }}</span>
            <n-tag :bordered="false">{{ currentRow.display_currency }}</n-tag>
            <n-tag type="success" :bordered="false">{{ currentRow.settlement_currency }}</n-tag>
            <n-tag :type="riskMeta[currentRow.risk_status].type" :bordered="false">{{ riskMeta[currentRow.risk_status].label }}</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="錢包模式">{{ walletModeLabel(currentRow.wallet_mode) }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="可用餘額"><MoneyText :value="currentRow.available_balance ?? currentRow.last_callback_balance ?? 0" :currency="currentRow.display_currency" compact color="text-slate-100" /></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="鎖定餘額"><MoneyText :value="currentRow.locked_balance || 0" :currency="currentRow.display_currency" compact color="text-slate-100" /></n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="異常次數" :value="currentRow.abnormal_count" /></div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="Wallet Identity" :span="2">{{ currentRow.wallet_identity }}</n-descriptions-item>
                <n-descriptions-item label="商戶">{{ currentRow.merchant_name }} / {{ currentRow.merchant_id }}</n-descriptions-item>
                <n-descriptions-item label="商戶會員 ID">{{ currentRow.merchant_player_id }}</n-descriptions-item>
                <n-descriptions-item label="所屬代理">{{ currentRow.agent_name }} / {{ currentRow.agent_id }}</n-descriptions-item>
                <n-descriptions-item label="L1 結算代理">{{ currentRow.settlement_agent_name }} / {{ currentRow.settlement_agent_id }}</n-descriptions-item>
                <n-descriptions-item label="交易幣別">{{ currentRow.display_currency }}</n-descriptions-item>
                <n-descriptions-item label="正式結算幣別">{{ currentRow.settlement_currency }}</n-descriptions-item>
                <n-descriptions-item label="建立時間">{{ formatDateTime(currentRow.created_at) }}</n-descriptions-item>
                <n-descriptions-item label="最後登入">{{ formatDateTime(currentRow.last_login_at) }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="wallet" tab="錢包模式">
              <n-alert :type="currentRow.wallet_mode === 'transfer' ? 'warning' : 'info'" :show-icon="false" class="mb-4">
                <template v-if="currentRow.wallet_mode === 'transfer'">
                  Transfer Wallet 由 GGAP 內部 Ledger 維護餘額；進入遊戲時依會員幣別選擇對應的 Provider 幣別線與錢包設定。
                </template>
                <template v-else>
                  Seamless Wallet 透過商戶 Callback 查詢與扣款；GGAP 僅保留 request / response 與交易快照。
                </template>
              </n-alert>
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="wallet_mode">{{ walletModeLabel(currentRow.wallet_mode) }}</n-descriptions-item>
                <n-descriptions-item label="transaction_currency">{{ currentRow.display_currency }}</n-descriptions-item>
                <n-descriptions-item label="available_balance"><MoneyText :value="currentRow.available_balance ?? currentRow.last_callback_balance ?? 0" :currency="currentRow.display_currency" color="text-slate-100" /></n-descriptions-item>
                <n-descriptions-item label="locked_balance"><MoneyText :value="currentRow.locked_balance || 0" :currency="currentRow.display_currency" color="text-slate-100" /></n-descriptions-item>
                <n-descriptions-item label="帳務說明" :span="2">會員錢包只作營運與交易追溯，不作 GGAP 對代理或供應商的正式帳務主體。</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="sessions" tab="Session">
              <n-alert type="info" :show-icon="false" class="mb-4">
                Launch Game 帶入 transaction_currency，Session 鎖定 Provider 幣別線與下注限額方案；交易先以 Provider 原幣入帳，日結後再建立 USDT 帳務快照。
              </n-alert>
              <n-data-table :columns="withTableSorters(sessionColumns)" :data="currentRow.sessions" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1140" />
            </n-tab-pane>

            <n-tab-pane name="limits" tab="下注限額方案">
              <n-alert type="info" :show-icon="false" class="mb-4">
                套用順序：特殊會員覆寫 > 商戶指定方案 > 代理可用方案 > 供應商預設方案。正式注單會保存當次 Session 的限額快照。
              </n-alert>
              <n-data-table :columns="withTableSorters(limitColumns)" :data="currentRow.bet_limits" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1080" />
            </n-tab-pane>

            <n-tab-pane name="transactions" tab="交易流水">
              <n-data-table :columns="withTableSorters(transactionColumns)" :data="currentRow.transactions" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1660" />
            </n-tab-pane>

            <n-tab-pane name="risk" tab="風控紀錄">
              <n-descriptions bordered :column="2" label-placement="left" class="mb-4">
                <n-descriptions-item label="風控狀態"><n-tag :type="riskMeta[currentRow.risk_status].type" :bordered="false">{{ riskMeta[currentRow.risk_status].label }}</n-tag></n-descriptions-item>
                <n-descriptions-item label="異常交易次數">{{ currentRow.abnormal_count }}</n-descriptions-item>
                <n-descriptions-item label="單筆上限"><MoneyText :value="currentRow.single_bet_limit" :currency="currentRow.display_currency" color="text-slate-100" /></n-descriptions-item>
                <n-descriptions-item label="每日限額"><MoneyText :value="currentRow.daily_bet_limit" :currency="currentRow.display_currency" color="text-slate-100" /></n-descriptions-item>
              </n-descriptions>
              <n-timeline>
                <n-timeline-item v-for="log in currentRow.risk_logs" :key="`${log.rule}-${log.hit_at}`" :type="log.level === 'error' ? 'error' : log.level === 'warning' ? 'warning' : 'info'" :title="log.rule" :time="formatDateTime(log.hit_at)">
                  <div class="text-sm text-gray-500">{{ log.note }}</div>
                </n-timeline-item>
              </n-timeline>
            </n-tab-pane>

            <n-tab-pane name="logs" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item v-for="log in currentRow.audit_logs" :key="log.trace_id" type="success" :title="log.action" :time="formatDateTime(log.operated_at)">
                  <div class="text-sm text-gray-500">{{ log.operator }} / {{ log.trace_id }}</div>
                </n-timeline-item>
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <div v-if="currentRow" class="flex flex-wrap justify-end gap-2">
            <n-button secondary @click="actionMessage('查看交易', currentRow)">查看交易</n-button>
            <n-button secondary @click="actionMessage('查看 Session', currentRow)">查看 Session</n-button>
            <n-button secondary @click="actionMessage('重送 Callback', currentRow)">重送 Callback</n-button>
            <n-button type="primary" secondary :disabled="currentRow.risk_status === 'frozen'" @click="actionMessage('凍結會員錢包', currentRow)">凍結會員錢包</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
