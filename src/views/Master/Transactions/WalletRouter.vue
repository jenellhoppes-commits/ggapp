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

type WalletMode = 'seamless' | 'transfer'
type RouterStatus = 'success' | 'pending' | 'failed' | 'manual_review'
type TransferAction = 'Transfer In' | 'Transfer Out' | 'Lock' | 'Unlock' | 'Manual Adjust'
type CallbackType = 'Balance' | 'Bet' | 'Win' | 'Refund' | 'Transfer In' | 'Transfer Out'
type CallbackStatus = RouterStatus | 'duplicated' | 'skipped'
type LedgerStatus = 'active' | 'locked' | 'frozen'
type DrawerKind = 'route' | 'transfer' | 'ledger' | 'callback'
type StatusTagType = 'success' | 'warning' | 'error' | 'info' | 'default'

interface TimelineStep {
  title: string
  status: RouterStatus
  time: string
  trace_id: string
  note: string
}

interface RouteRecord {
  route_id: string
  merchant_id: string
  merchant_name: string
  agent_name: string
  merchant_player_id: string
  display_currency: string
  wallet_mode: WalletMode
  route_target: string
  trigger: string
  idempotency_key: string
  status: RouterStatus
  latency_ms: number
  related_transaction_id: string
  related_round_id: string
  created_at: string
  request_payload: string
  response_payload: string
  steps: TimelineStep[]
}

interface TransferRecord {
  transfer_id: string
  ledger_id: string
  merchant_id: string
  merchant_name: string
  agent_name: string
  merchant_player_id: string
  player_wallet_id: string
  display_currency: string
  action: TransferAction
  display_amount: number
  settlement_currency: 'USDT'
  settlement_amount: number
  before_balance: number
  after_balance: number
  locked_balance: number
  status: RouterStatus
  idempotency_key: string
  related_transaction_id: string
  related_round_id: string
  created_at: string
  completed_at?: string
  request_payload: string
  response_payload: string
}

interface LedgerWallet {
  ledger_id: string
  player_wallet_id: string
  merchant_id: string
  merchant_name: string
  agent_name: string
  merchant_player_id: string
  display_currency: string
  settlement_currency: 'USDT'
  available_balance: number
  locked_balance: number
  ledger_status: LedgerStatus
  last_action: TransferAction
  last_transfer_id: string
  last_changed_at: string
}

interface CallbackRecord {
  callback_id: string
  callback_type: CallbackType
  merchant_id: string
  merchant_name: string
  wallet_mode: WalletMode
  endpoint: string
  idempotency_key: string
  status: CallbackStatus
  retry_count: number
  related_transaction_id: string
  related_transfer_id: string
  created_at: string
  last_attempt_at: string
  request_payload: string
  response_payload: string
}

const message = useMessage()
const activeTab = ref('routes')
const showDetail = ref(false)
const drawerKind = ref<DrawerKind>('route')
const currentRoute = ref<RouteRecord | null>(null)
const currentTransfer = ref<TransferRecord | null>(null)
const currentLedger = ref<LedgerWallet | null>(null)
const currentCallback = ref<CallbackRecord | null>(null)

const searchText = ref('')
const merchantFilter = ref<string | null>(null)
const walletFilter = ref<WalletMode | null>(null)
const statusFilter = ref<string | null>(null)
const currencyFilter = ref<string | null>(null)

const routeRows = ref<RouteRecord[]>([
  {
    route_id: 'WR-20260707-000018',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_name: '平台直營代理',
    merchant_player_id: 'mem_8842',
    display_currency: 'TWD',
    wallet_mode: 'seamless',
    route_target: 'Merchant Callback',
    trigger: 'Bet',
    idempotency_key: 'idem-op1001-bet-78231',
    status: 'success',
    latency_ms: 184,
    related_transaction_id: 'TX-20260707-000184',
    related_round_id: 'R-PG-8842-78231',
    created_at: '2026-07-07T09:18:12.000Z',
    request_payload: '{"wallet_mode":"seamless","trigger":"Bet","display_currency":"TWD"}',
    response_payload: '{"route_target":"merchant_callback","callback_status":"success"}',
    steps: [
      { title: '讀取商戶錢包設定', status: 'success', time: '2026-07-07T09:18:12.000Z', trace_id: 'trace-route-config-78231', note: '商戶設定為 Seamless Wallet' },
      { title: '建立 idempotency key', status: 'success', time: '2026-07-07T09:18:12.050Z', trace_id: 'trace-idem-78231', note: '防止重複請求' },
      { title: '送出商戶 Callback', status: 'success', time: '2026-07-07T09:18:12.180Z', trace_id: 'trace-callback-78231', note: '商戶 Callback 回覆成功' }
    ]
  },
  {
    route_id: 'WR-20260707-000041',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_name: 'SEA Sub Agent 01',
    merchant_player_id: 'nova_7711',
    display_currency: 'THB',
    wallet_mode: 'transfer',
    route_target: 'Transfer Wallet Ledger',
    trigger: 'Bet Lock',
    idempotency_key: 'idem-ledger-lock-99820',
    status: 'pending',
    latency_ms: 96,
    related_transaction_id: 'TX-20260707-000241',
    related_round_id: 'R-PG-7711-99820',
    created_at: '2026-07-07T08:49:28.000Z',
    request_payload: '{"wallet_mode":"transfer","action":"Lock","amount":3200,"currency":"THB"}',
    response_payload: '{"ledger_status":"LOCKED","locked_balance":3200}',
    steps: [
      { title: '讀取商戶錢包設定', status: 'success', time: '2026-07-07T08:49:28.000Z', trace_id: 'trace-route-config-99820', note: '商戶設定為 Transfer Wallet' },
      { title: '寫入 Ledger Lock', status: 'success', time: '2026-07-07T08:49:28.300Z', trace_id: 'trace-ledger-lock-99820', note: '鎖定 THB 3,200' },
      { title: '等待 Provider 回覆', status: 'pending', time: '2026-07-07T08:49:29.000Z', trace_id: 'trace-provider-99820', note: 'Provider 回覆 PROCESSING' }
    ]
  },
  {
    route_id: 'WR-20260707-000052',
    merchant_id: 'OP-1006',
    merchant_name: 'Lucky Panda Studio',
    agent_name: 'SEA Growth Agent',
    merchant_player_id: 'panda_5520',
    display_currency: 'PHP',
    wallet_mode: 'seamless',
    route_target: 'Merchant Callback',
    trigger: 'Refund',
    idempotency_key: 'idem-op1006-refund-14002',
    status: 'failed',
    latency_ms: 3000,
    related_transaction_id: 'TX-20260707-000266',
    related_round_id: 'R-JILI-5520-14002',
    created_at: '2026-07-07T10:06:10.000Z',
    request_payload: '{"wallet_mode":"seamless","trigger":"Refund","amount":1800,"currency":"PHP"}',
    response_payload: '{"code":504,"message":"merchant timeout"}',
    steps: [
      { title: '讀取商戶錢包設定', status: 'success', time: '2026-07-07T10:06:10.000Z', trace_id: 'trace-route-config-14002', note: '商戶設定為 Seamless Wallet' },
      { title: '送出 Refund Callback', status: 'failed', time: '2026-07-07T10:06:12.000Z', trace_id: 'trace-callback-14002', note: '商戶 timeout，可重新送出 Callback' }
    ]
  }
])

const transferRows = ref<TransferRecord[]>([
  {
    transfer_id: 'TR-20260707-000070',
    ledger_id: 'LED-7711-0008',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_name: 'SEA Sub Agent 01',
    merchant_player_id: 'nova_7711',
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    display_currency: 'THB',
    action: 'Transfer In',
    display_amount: 50000,
    settlement_currency: 'USDT',
    settlement_amount: 1366.42,
    before_balance: 41620,
    after_balance: 91620,
    locked_balance: 0,
    status: 'success',
    idempotency_key: 'idem-ledger-in-7711-001',
    related_transaction_id: '-',
    related_round_id: '-',
    created_at: '2026-07-07T08:10:30.000Z',
    completed_at: '2026-07-07T08:10:31.000Z',
    request_payload: '{"action":"Transfer In","amount":50000,"currency":"THB"}',
    response_payload: '{"before_balance":41620,"after_balance":91620,"status":"SUCCESS"}'
  },
  {
    transfer_id: 'TR-20260707-000077',
    ledger_id: 'LED-7711-0008',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_name: 'SEA Sub Agent 01',
    merchant_player_id: 'nova_7711',
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    display_currency: 'THB',
    action: 'Lock',
    display_amount: -3200,
    settlement_currency: 'USDT',
    settlement_amount: -87.45,
    before_balance: 91620,
    after_balance: 88420,
    locked_balance: 3200,
    status: 'pending',
    idempotency_key: 'idem-ledger-lock-99820',
    related_transaction_id: 'TX-20260707-000241',
    related_round_id: 'R-PG-7711-99820',
    created_at: '2026-07-07T08:49:28.300Z',
    request_payload: '{"action":"Lock","amount":3200,"currency":"THB","round_id":"R-PG-7711-99820"}',
    response_payload: '{"before_balance":91620,"after_balance":88420,"locked_balance":3200}'
  },
  {
    transfer_id: 'TR-20260706-000219',
    ledger_id: 'LED-9255-0003',
    merchant_id: 'OP-1009',
    merchant_name: 'Golden Dragon Gaming',
    agent_name: 'SEA Local Desk L3',
    merchant_player_id: 'dragon_9255',
    player_wallet_id: 'PW-OP1009-dragon_9255-VND',
    display_currency: 'VND',
    action: 'Transfer Out',
    display_amount: -1200000,
    settlement_currency: 'USDT',
    settlement_amount: -45.36,
    before_balance: 1200000,
    after_balance: 0,
    locked_balance: 0,
    status: 'failed',
    idempotency_key: 'idem-ledger-out-77410',
    related_transaction_id: 'TX-20260706-000921',
    related_round_id: 'R-PP-9255-77410',
    created_at: '2026-07-06T14:15:44.500Z',
    request_payload: '{"action":"Transfer Out","amount":1200000,"currency":"VND"}',
    response_payload: '{"status":"FAILED","reason":"wallet frozen"}'
  }
])

const ledgerRows = ref<LedgerWallet[]>([
  {
    ledger_id: 'LED-7711-0008',
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_name: 'SEA Sub Agent 01',
    merchant_player_id: 'nova_7711',
    display_currency: 'THB',
    settlement_currency: 'USDT',
    available_balance: 88420,
    locked_balance: 3200,
    ledger_status: 'active',
    last_action: 'Lock',
    last_transfer_id: 'TR-20260707-000077',
    last_changed_at: '2026-07-07T08:49:28.300Z'
  },
  {
    ledger_id: 'LED-9255-0003',
    player_wallet_id: 'PW-OP1009-dragon_9255-VND',
    merchant_id: 'OP-1009',
    merchant_name: 'Golden Dragon Gaming',
    agent_name: 'SEA Local Desk L3',
    merchant_player_id: 'dragon_9255',
    display_currency: 'VND',
    settlement_currency: 'USDT',
    available_balance: 0,
    locked_balance: 0,
    ledger_status: 'frozen',
    last_action: 'Transfer Out',
    last_transfer_id: 'TR-20260706-000219',
    last_changed_at: '2026-07-06T14:18:00.000Z'
  }
])

const callbackRows = ref<CallbackRecord[]>([
  {
    callback_id: 'CB-20260707-000184',
    callback_type: 'Bet',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    wallet_mode: 'seamless',
    endpoint: 'https://bluewhale.example/wallet/bet',
    idempotency_key: 'idem-op1001-bet-78231',
    status: 'success',
    retry_count: 0,
    related_transaction_id: 'TX-20260707-000184',
    related_transfer_id: '-',
    created_at: '2026-07-07T09:18:12.000Z',
    last_attempt_at: '2026-07-07T09:18:12.180Z',
    request_payload: '{"type":"Bet","amount":3200,"currency":"TWD"}',
    response_payload: '{"code":0,"balance":125200}'
  },
  {
    callback_id: 'CB-20260707-000266',
    callback_type: 'Refund',
    merchant_id: 'OP-1006',
    merchant_name: 'Lucky Panda Studio',
    wallet_mode: 'seamless',
    endpoint: 'https://luckypanda.example/wallet/refund',
    idempotency_key: 'idem-op1006-refund-14002',
    status: 'failed',
    retry_count: 2,
    related_transaction_id: 'TX-20260707-000266',
    related_transfer_id: '-',
    created_at: '2026-07-07T10:06:10.000Z',
    last_attempt_at: '2026-07-07T10:10:12.000Z',
    request_payload: '{"type":"Refund","amount":1800,"currency":"PHP"}',
    response_payload: '{"code":504,"message":"merchant timeout"}'
  },
  {
    callback_id: 'CB-20260707-000077',
    callback_type: 'Transfer In',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    wallet_mode: 'transfer',
    endpoint: 'Transfer Wallet Ledger',
    idempotency_key: 'idem-ledger-in-7711-001',
    status: 'duplicated',
    retry_count: 1,
    related_transaction_id: '-',
    related_transfer_id: 'TR-20260707-000070',
    created_at: '2026-07-07T08:10:30.000Z',
    last_attempt_at: '2026-07-07T08:10:35.000Z',
    request_payload: '{"type":"Transfer In","amount":50000,"currency":"THB"}',
    response_payload: '{"duplicated":true,"original_transfer_id":"TR-20260707-000070"}'
  }
])

const walletOptions = [
  { label: 'Seamless', value: 'seamless' },
  { label: 'Transfer', value: 'transfer' }
]

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '處理中', value: 'pending' },
  { label: '失敗', value: 'failed' },
  { label: '人工覆核', value: 'manual_review' },
  { label: '重複請求', value: 'duplicated' },
  { label: '已略過', value: 'skipped' },
  { label: '啟用', value: 'active' },
  { label: '鎖定', value: 'locked' },
  { label: '凍結', value: 'frozen' }
]

const statusMeta: Record<string, { label: string; type: StatusTagType }> = {
  success: { label: '成功', type: 'success' },
  pending: { label: '處理中', type: 'warning' },
  failed: { label: '失敗', type: 'error' },
  manual_review: { label: '人工覆核', type: 'info' },
  duplicated: { label: '重複請求', type: 'warning' },
  skipped: { label: '已略過', type: 'default' },
  active: { label: '啟用', type: 'success' },
  locked: { label: '鎖定', type: 'warning' },
  frozen: { label: '凍結', type: 'error' }
}

const allMerchants = computed(() => Array.from(new Set([
  ...routeRows.value.map(row => row.merchant_name),
  ...transferRows.value.map(row => row.merchant_name),
  ...ledgerRows.value.map(row => row.merchant_name),
  ...callbackRows.value.map(row => row.merchant_name)
])).map(value => ({ label: value, value })))

const allCurrencies = computed(() => Array.from(new Set([
  ...routeRows.value.map(row => row.display_currency),
  ...transferRows.value.map(row => row.display_currency),
  ...ledgerRows.value.map(row => row.display_currency)
])).map(value => ({ label: value, value })))

const statusOf = (status: string) => statusMeta[status] ?? { label: status, type: 'default' as StatusTagType }
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-TW') : '-'
const walletModeLabel = (mode: WalletMode) => mode === 'seamless' ? 'Seamless' : 'Transfer'
const drawerTitle = computed(() => {
  if (drawerKind.value === 'route') return '錢包路由詳情'
  if (drawerKind.value === 'transfer') return '會員轉點詳情'
  if (drawerKind.value === 'ledger') return 'Transfer Wallet Ledger'
  return 'Callback / Idempotency 詳情'
})

const keywordMatch = (...values: string[]) => {
  const keyword = searchText.value.trim().toLowerCase()
  return !keyword || values.some(value => value.toLowerCase().includes(keyword))
}

const routeData = computed(() => routeRows.value.filter(row => {
  const inKeyword = keywordMatch(row.route_id, row.merchant_id, row.merchant_name, row.merchant_player_id, row.idempotency_key, row.related_transaction_id)
  const inMerchant = !merchantFilter.value || row.merchant_name === merchantFilter.value
  const inWallet = !walletFilter.value || row.wallet_mode === walletFilter.value
  const inStatus = !statusFilter.value || row.status === statusFilter.value
  const inCurrency = !currencyFilter.value || row.display_currency === currencyFilter.value
  return inKeyword && inMerchant && inWallet && inStatus && inCurrency
}))

const transferData = computed(() => transferRows.value.filter(row => {
  const inKeyword = keywordMatch(row.transfer_id, row.ledger_id, row.merchant_id, row.merchant_name, row.merchant_player_id, row.idempotency_key, row.related_transaction_id)
  const inMerchant = !merchantFilter.value || row.merchant_name === merchantFilter.value
  const inWallet = !walletFilter.value || walletFilter.value === 'transfer'
  const inStatus = !statusFilter.value || row.status === statusFilter.value
  const inCurrency = !currencyFilter.value || row.display_currency === currencyFilter.value
  return inKeyword && inMerchant && inWallet && inStatus && inCurrency
}))

const ledgerData = computed(() => ledgerRows.value.filter(row => {
  const inKeyword = keywordMatch(row.ledger_id, row.player_wallet_id, row.merchant_id, row.merchant_name, row.merchant_player_id, row.last_transfer_id)
  const inMerchant = !merchantFilter.value || row.merchant_name === merchantFilter.value
  const inWallet = !walletFilter.value || walletFilter.value === 'transfer'
  const inStatus = !statusFilter.value || row.ledger_status === statusFilter.value
  const inCurrency = !currencyFilter.value || row.display_currency === currencyFilter.value
  return inKeyword && inMerchant && inWallet && inStatus && inCurrency
}))

const callbackData = computed(() => callbackRows.value.filter(row => {
  const inKeyword = keywordMatch(row.callback_id, row.merchant_id, row.merchant_name, row.idempotency_key, row.related_transaction_id, row.related_transfer_id)
  const inMerchant = !merchantFilter.value || row.merchant_name === merchantFilter.value
  const inWallet = !walletFilter.value || row.wallet_mode === walletFilter.value
  const inStatus = !statusFilter.value || row.status === statusFilter.value
  return inKeyword && inMerchant && inWallet && inStatus
}))

const summary = computed(() => ({
  routes: routeRows.value.length,
  seamless: routeRows.value.filter(row => row.wallet_mode === 'seamless').length,
  transfer: routeRows.value.filter(row => row.wallet_mode === 'transfer').length,
  transferAmount: transferRows.value.reduce((sum, row) => sum + Math.abs(row.settlement_amount), 0),
  callbackFailed: callbackRows.value.filter(row => row.status === 'failed').length,
  duplicated: callbackRows.value.filter(row => row.status === 'duplicated').length
}))

const resetFilters = () => {
  searchText.value = ''
  merchantFilter.value = null
  walletFilter.value = null
  statusFilter.value = null
  currencyFilter.value = null
}

const openRoute = (row: RouteRecord) => {
  drawerKind.value = 'route'
  currentRoute.value = row
  showDetail.value = true
}

const openTransfer = (row: TransferRecord) => {
  drawerKind.value = 'transfer'
  currentTransfer.value = row
  showDetail.value = true
}

const openLedger = (row: LedgerWallet) => {
  drawerKind.value = 'ledger'
  currentLedger.value = row
  showDetail.value = true
}

const openCallback = (row: CallbackRecord) => {
  drawerKind.value = 'callback'
  currentCallback.value = row
  showDetail.value = true
}

const actionMessage = (action: string, refId: string) => {
  message.info(`${action} 已建立演示操作：${refId}`)
}

const routeColumns: DataTableColumns<RouteRecord> = [
  {
    title: '路由編號',
    key: 'route_id',
    width: 170,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openRoute(row) }, row.route_id)
  },
  {
    title: '商戶',
    key: 'merchant_name',
    width: 220,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'font-semibold' }, row.merchant_name),
      h('span', { class: 'font-mono text-xs text-gray-500' }, row.merchant_id)
    ])
  },
  { title: '代理', key: 'agent_name', width: 160 },
  { title: '會員', key: 'merchant_player_id', width: 140, render: row => h('span', { class: 'font-mono' }, row.merchant_player_id) },
  { title: '交易幣別', key: 'display_currency', width: 110 },
  {
    title: '錢包模式',
    key: 'wallet_mode',
    width: 120,
    render: row => h(NTag, { type: row.wallet_mode === 'transfer' ? 'warning' : 'info', bordered: false }, { default: () => walletModeLabel(row.wallet_mode) })
  },
  { title: '路由目標', key: 'route_target', width: 180 },
  { title: '觸發事件', key: 'trigger', width: 120 },
  {
    title: '狀態',
    key: 'status',
    width: 120,
    render: row => h(NTag, { type: statusOf(row.status).type, bordered: false }, { default: () => statusOf(row.status).label })
  },
  { title: '延遲', key: 'latency_ms', width: 100, align: 'right', render: row => `${row.latency_ms} ms` },
  { title: '關聯交易', key: 'related_transaction_id', width: 180, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.related_transaction_id) },
  { title: 'Idempotency Key', key: 'idempotency_key', width: 230, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.idempotency_key) },
  { title: '建立時間', key: 'created_at', width: 180, render: row => formatDateTime(row.created_at) },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: row => h(NButton, { size: 'small', secondary: true, onClick: () => openRoute(row) }, {
      icon: () => h(NIcon, null, { default: () => h(VisibilityOutlined) }),
      default: () => '查看'
    })
  }
]

const transferColumns: DataTableColumns<TransferRecord> = [
  {
    title: '轉點編號',
    key: 'transfer_id',
    width: 170,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openTransfer(row) }, row.transfer_id)
  },
  { title: 'Ledger ID', key: 'ledger_id', width: 150, render: row => h('span', { class: 'font-mono text-xs' }, row.ledger_id) },
  { title: '商戶', key: 'merchant_name', width: 210 },
  { title: '會員', key: 'merchant_player_id', width: 140, render: row => h('span', { class: 'font-mono' }, row.merchant_player_id) },
  { title: '動作', key: 'action', width: 130 },
  { title: '原幣金額', key: 'display_amount', width: 140, align: 'right', render: row => h(MoneyText, { value: row.display_amount, currency: row.display_currency, compact: true, showSign: true }) },
  { title: 'USDT 金額', key: 'settlement_amount', width: 140, align: 'right', render: row => h(MoneyText, { value: row.settlement_amount, currency: row.settlement_currency, compact: true, showSign: true }) },
  { title: '轉點前', key: 'before_balance', width: 120, align: 'right', render: row => h(MoneyText, { value: row.before_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '轉點後', key: 'after_balance', width: 120, align: 'right', render: row => h(MoneyText, { value: row.after_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '鎖定金額', key: 'locked_balance', width: 120, align: 'right', render: row => h(MoneyText, { value: row.locked_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusOf(row.status).type, bordered: false }, { default: () => statusOf(row.status).label }) },
  { title: '關聯交易', key: 'related_transaction_id', width: 180, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.related_transaction_id) },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: row => h(NButton, { size: 'small', secondary: true, onClick: () => openTransfer(row) }, { default: () => '查看' })
  }
]

const ledgerColumns: DataTableColumns<LedgerWallet> = [
  {
    title: 'Ledger ID',
    key: 'ledger_id',
    width: 150,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openLedger(row) }, row.ledger_id)
  },
  { title: '會員錢包', key: 'player_wallet_id', width: 230, render: row => h('span', { class: 'font-mono text-xs' }, row.player_wallet_id) },
  { title: '商戶', key: 'merchant_name', width: 210 },
  { title: '會員', key: 'merchant_player_id', width: 140 },
  { title: '交易幣別', key: 'display_currency', width: 110 },
  { title: '可用餘額', key: 'available_balance', width: 140, align: 'right', render: row => h(MoneyText, { value: row.available_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '鎖定餘額', key: 'locked_balance', width: 140, align: 'right', render: row => h(MoneyText, { value: row.locked_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '狀態', key: 'ledger_status', width: 110, render: row => h(NTag, { type: statusOf(row.ledger_status).type, bordered: false }, { default: () => statusOf(row.ledger_status).label }) },
  { title: '最後動作', key: 'last_action', width: 130 },
  { title: '最後更新', key: 'last_changed_at', width: 180, render: row => formatDateTime(row.last_changed_at) },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    fixed: 'right',
    render: row => h(NButton, { size: 'small', secondary: true, onClick: () => openLedger(row) }, { default: () => '查看' })
  }
]

const callbackColumns: DataTableColumns<CallbackRecord> = [
  {
    title: 'Callback 編號',
    key: 'callback_id',
    width: 170,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openCallback(row) }, row.callback_id)
  },
  { title: '類型', key: 'callback_type', width: 120 },
  { title: '商戶', key: 'merchant_name', width: 220 },
  {
    title: '錢包模式',
    key: 'wallet_mode',
    width: 120,
    render: row => h(NTag, { type: row.wallet_mode === 'transfer' ? 'warning' : 'info', bordered: false }, { default: () => walletModeLabel(row.wallet_mode) })
  },
  { title: '狀態', key: 'status', width: 120, render: row => h(NTag, { type: statusOf(row.status).type, bordered: false }, { default: () => statusOf(row.status).label }) },
  { title: '重試次數', key: 'retry_count', width: 100, align: 'right' },
  { title: 'Endpoint', key: 'endpoint', width: 260 },
  { title: 'Idempotency Key', key: 'idempotency_key', width: 230, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.idempotency_key) },
  { title: '最後嘗試', key: 'last_attempt_at', width: 180, render: row => formatDateTime(row.last_attempt_at) },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openCallback(row) }, { default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.status !== 'failed', onClick: () => actionMessage('重送 Callback', row.callback_id) }, { default: () => '重送' })
      ]
    })
  }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">錢包路由 / 轉帳錢包</h1>
        <p class="mt-1 text-sm text-gray-500">
          檢視 Seamless / Transfer Wallet 路由、轉帳錢包 Ledger、Callback 與 Idempotency 紀錄。
        </p>
      </div>
      <n-button type="primary" secondary @click="actionMessage('匯出錢包紀錄', 'wallet-router')">
        <template #icon><n-icon><AccountBalanceWalletOutlined /></n-icon></template>
        匯出錢包紀錄
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="路由請求" :value="summary.routes" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="Seamless" :value="summary.seamless" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="Transfer" :value="summary.transfer" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="轉帳錢包 USDT 金額">
          <MoneyText :value="summary.transferAmount" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="Callback 失敗" :value="summary.callbackFailed" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="重複請求" :value="summary.duplicated" />
      </div>
    </div>

    <n-alert type="info" :show-icon="false">
      Provider 側依會員交易幣別路由至對應的供應商幣別線；每條幣別線可獨立使用單一錢包或轉帳錢包。商戶側仍可使用 Seamless 或 Transfer Wallet，兩側錢包模式分開設定。
    </n-alert>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#202026] p-4">
      <n-input v-model:value="searchText" clearable placeholder="搜尋路由 / 轉帳 / Ledger / Callback / idempotency" style="width: 340px; max-width: 100%;">
        <template #prefix><n-icon :component="SearchOutlined" class="opacity-60" /></template>
      </n-input>
      <n-select v-model:value="merchantFilter" clearable filterable placeholder="商戶" :options="allMerchants" style="width: 180px;" />
      <n-select v-model:value="walletFilter" clearable placeholder="錢包模式" :options="walletOptions" style="width: 140px;" />
      <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" style="width: 140px;" />
      <n-select v-model:value="currencyFilter" clearable placeholder="交易幣別" :options="allCurrencies" style="width: 130px;" />
      <n-button secondary @click="resetFilters">重置</n-button>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="routes" tab="錢包路由總覽">
        <n-data-table :columns="withTableSorters(routeColumns)" :data="routeData" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="2220" />
      </n-tab-pane>
      <n-tab-pane name="transfers" tab="會員轉點紀錄">
        <n-data-table :columns="withTableSorters(transferColumns)" :data="transferData" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1760" />
      </n-tab-pane>
      <n-tab-pane name="ledger" tab="Transfer Wallet Ledger">
        <n-data-table :columns="withTableSorters(ledgerColumns)" :data="ledgerData" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1660" />
      </n-tab-pane>
      <n-tab-pane name="callbacks" tab="Callback / Idempotency">
        <n-data-table :columns="withTableSorters(callbackColumns)" :data="callbackData" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1820" />
      </n-tab-pane>
    </n-tabs>

    <n-drawer v-model:show="showDetail" width="min(980px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-lg font-semibold">{{ drawerTitle }}</span>
            <span v-if="drawerKind === 'route' && currentRoute" class="font-mono text-sm text-gray-400">{{ currentRoute.route_id }}</span>
            <span v-if="drawerKind === 'transfer' && currentTransfer" class="font-mono text-sm text-gray-400">{{ currentTransfer.transfer_id }}</span>
            <span v-if="drawerKind === 'ledger' && currentLedger" class="font-mono text-sm text-gray-400">{{ currentLedger.ledger_id }}</span>
            <span v-if="drawerKind === 'callback' && currentCallback" class="font-mono text-sm text-gray-400">{{ currentCallback.callback_id }}</span>
          </div>
        </template>

        <template v-if="drawerKind === 'route' && currentRoute">
          <n-descriptions bordered :column="2" label-placement="left" class="mb-4">
            <n-descriptions-item label="商戶">{{ currentRoute.merchant_name }} / {{ currentRoute.merchant_id }}</n-descriptions-item>
            <n-descriptions-item label="代理">{{ currentRoute.agent_name }}</n-descriptions-item>
            <n-descriptions-item label="會員">{{ currentRoute.merchant_player_id }}</n-descriptions-item>
            <n-descriptions-item label="錢包模式">{{ walletModeLabel(currentRoute.wallet_mode) }}</n-descriptions-item>
            <n-descriptions-item label="路由目標">{{ currentRoute.route_target }}</n-descriptions-item>
            <n-descriptions-item label="觸發事件">{{ currentRoute.trigger }}</n-descriptions-item>
            <n-descriptions-item label="關聯交易">{{ currentRoute.related_transaction_id }}</n-descriptions-item>
            <n-descriptions-item label="Round ID">{{ currentRoute.related_round_id }}</n-descriptions-item>
            <n-descriptions-item label="Request" :span="2"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentRoute.request_payload }}</pre></n-descriptions-item>
            <n-descriptions-item label="Response" :span="2"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentRoute.response_payload }}</pre></n-descriptions-item>
          </n-descriptions>
          <n-timeline>
            <n-timeline-item v-for="step in currentRoute.steps" :key="step.trace_id" :type="statusOf(step.status).type" :title="step.title" :time="formatDateTime(step.time)">
              <div class="text-sm text-gray-500">{{ step.note }}</div>
              <div class="mt-1 font-mono text-xs text-gray-600">{{ step.trace_id }}</div>
            </n-timeline-item>
          </n-timeline>
        </template>

        <template v-if="drawerKind === 'transfer' && currentTransfer">
          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="Ledger ID">{{ currentTransfer.ledger_id }}</n-descriptions-item>
            <n-descriptions-item label="動作">{{ currentTransfer.action }}</n-descriptions-item>
            <n-descriptions-item label="商戶">{{ currentTransfer.merchant_name }} / {{ currentTransfer.merchant_id }}</n-descriptions-item>
            <n-descriptions-item label="會員">{{ currentTransfer.merchant_player_id }}</n-descriptions-item>
            <n-descriptions-item label="原幣金額"><MoneyText :value="currentTransfer.display_amount" :currency="currentTransfer.display_currency" show-sign /></n-descriptions-item>
            <n-descriptions-item label="USDT 金額"><MoneyText :value="currentTransfer.settlement_amount" currency="USDT" show-sign /></n-descriptions-item>
            <n-descriptions-item label="轉點前"><MoneyText :value="currentTransfer.before_balance" :currency="currentTransfer.display_currency" color="text-slate-100" /></n-descriptions-item>
            <n-descriptions-item label="轉點後"><MoneyText :value="currentTransfer.after_balance" :currency="currentTransfer.display_currency" color="text-slate-100" /></n-descriptions-item>
            <n-descriptions-item label="鎖定餘額"><MoneyText :value="currentTransfer.locked_balance" :currency="currentTransfer.display_currency" color="text-slate-100" /></n-descriptions-item>
            <n-descriptions-item label="狀態"><n-tag :type="statusOf(currentTransfer.status).type" :bordered="false">{{ statusOf(currentTransfer.status).label }}</n-tag></n-descriptions-item>
            <n-descriptions-item label="關聯交易">{{ currentTransfer.related_transaction_id }}</n-descriptions-item>
            <n-descriptions-item label="Round ID">{{ currentTransfer.related_round_id }}</n-descriptions-item>
            <n-descriptions-item label="Idempotency Key" :span="2">{{ currentTransfer.idempotency_key }}</n-descriptions-item>
            <n-descriptions-item label="Request" :span="2"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentTransfer.request_payload }}</pre></n-descriptions-item>
            <n-descriptions-item label="Response" :span="2"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentTransfer.response_payload }}</pre></n-descriptions-item>
          </n-descriptions>
        </template>

        <template v-if="drawerKind === 'ledger' && currentLedger">
          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="會員錢包">{{ currentLedger.player_wallet_id }}</n-descriptions-item>
            <n-descriptions-item label="Ledger 狀態"><n-tag :type="statusOf(currentLedger.ledger_status).type" :bordered="false">{{ statusOf(currentLedger.ledger_status).label }}</n-tag></n-descriptions-item>
            <n-descriptions-item label="商戶">{{ currentLedger.merchant_name }} / {{ currentLedger.merchant_id }}</n-descriptions-item>
            <n-descriptions-item label="會員">{{ currentLedger.merchant_player_id }}</n-descriptions-item>
            <n-descriptions-item label="可用餘額"><MoneyText :value="currentLedger.available_balance" :currency="currentLedger.display_currency" color="text-slate-100" /></n-descriptions-item>
            <n-descriptions-item label="鎖定餘額"><MoneyText :value="currentLedger.locked_balance" :currency="currentLedger.display_currency" color="text-slate-100" /></n-descriptions-item>
            <n-descriptions-item label="最後動作">{{ currentLedger.last_action }}</n-descriptions-item>
            <n-descriptions-item label="最後轉點">{{ currentLedger.last_transfer_id }}</n-descriptions-item>
          </n-descriptions>
        </template>

        <template v-if="drawerKind === 'callback' && currentCallback">
          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="商戶">{{ currentCallback.merchant_name }} / {{ currentCallback.merchant_id }}</n-descriptions-item>
            <n-descriptions-item label="類型">{{ currentCallback.callback_type }}</n-descriptions-item>
            <n-descriptions-item label="錢包模式">{{ walletModeLabel(currentCallback.wallet_mode) }}</n-descriptions-item>
            <n-descriptions-item label="狀態"><n-tag :type="statusOf(currentCallback.status).type" :bordered="false">{{ statusOf(currentCallback.status).label }}</n-tag></n-descriptions-item>
            <n-descriptions-item label="Endpoint" :span="2">{{ currentCallback.endpoint }}</n-descriptions-item>
            <n-descriptions-item label="Idempotency Key" :span="2">{{ currentCallback.idempotency_key }}</n-descriptions-item>
            <n-descriptions-item label="關聯交易">{{ currentCallback.related_transaction_id }}</n-descriptions-item>
            <n-descriptions-item label="關聯轉點">{{ currentCallback.related_transfer_id }}</n-descriptions-item>
            <n-descriptions-item label="Request" :span="2"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentCallback.request_payload }}</pre></n-descriptions-item>
            <n-descriptions-item label="Response" :span="2"><pre class="overflow-auto rounded bg-black/30 p-3 text-xs text-gray-300">{{ currentCallback.response_payload }}</pre></n-descriptions-item>
          </n-descriptions>
        </template>

        <template #footer>
          <div class="flex flex-wrap justify-end gap-2">
            <n-button secondary @click="actionMessage('查看關聯交易', drawerKind)">查看關聯交易</n-button>
            <n-button secondary @click="actionMessage('檢查 Idempotency', drawerKind)">檢查 Idempotency</n-button>
            <n-button type="primary" secondary @click="actionMessage('建立補單', drawerKind)">建立補單</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
