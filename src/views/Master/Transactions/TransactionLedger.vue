<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
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
import { ContentCopyRound, ReceiptLongOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { adminTransactionService } from '../../../services/admin/transactions'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type WalletMode = 'seamless' | 'transfer'
type TransactionType = 'Balance' | 'Bet' | 'Win' | 'Refund' | 'Rollback' | 'Adjustment'
type TransactionStatus = 'success' | 'pending' | 'failed' | 'callback_failed' | 'provider_pending' | 'amount_mismatch' | 'repaired' | 'voided' | 'manual_review'
type FlowStatus = 'success' | 'pending' | 'failed' | 'skipped'
type TransferAction = 'Transfer In' | 'Transfer Out' | 'Lock' | 'Unlock' | 'Manual Adjust'

interface FlowStep {
  name: string
  status: FlowStatus
  time: string
  trace_id: string
  note: string
}

interface TransferRecord {
  transfer_id: string
  ledger_id: string
  action: TransferAction
  display_currency: string
  display_amount: number
  settlement_currency: 'USDT'
  settlement_amount: number
  before_balance: number
  after_balance: number
  locked_balance: number
  status: TransactionStatus
  idempotency_key: string
  created_at: string
}

interface RepairRecord {
  repair_id: string
  reason: string
  status: 'created' | 'processing' | 'done'
  operator: string
  created_at: string
}

interface TransactionRow {
  transaction_id: string
  bet_id: string
  round_id: string
  provider_tx_id: string
  type: TransactionType
  status: TransactionStatus
  merchant_id: string
  merchant_name: string
  agent_id: string
  agent_name: string
  merchant_player_id: string
  player_wallet_id: string
  provider_id: string
  provider_name: string
  provider_currency_line_id: string
  provider_currency_id: string
  provider_merchant_id: string
  provider_currency: string
  provider_amount: number
  game_code: string
  game_name: string
  wallet_mode: WalletMode
  display_currency: string
  display_amount: number
  settlement_currency: 'USDT'
  settlement_amount: number
  settlement_status: 'pending_daily' | 'settled' | 'locked'
  settlement_batch_id: string
  exchange_rate_id: string
  exchange_rate: number
  exchange_fee_rate: number
  rate_locked_at: string
  has_difference: boolean
  repairable: boolean
  idempotency_key: string
  merchant_callback_url: string
  callback_status: FlowStatus
  provider_status_code: string
  provider_returned_at: string
  request_payload: string
  response_payload: string
  provider_request_payload: string
  provider_response_payload: string
  created_at: string
  completed_at?: string
  flow_steps: FlowStep[]
  transfer_records: TransferRecord[]
  repair_records: RepairRecord[]
}

const message = useMessage()
const showDetail = ref(false)
const currentRow = ref<TransactionRow | null>(null)
const loading = ref(false)
const detailTab = ref('basic')
const searchText = ref('')
const merchantFilter = ref<string | null>(null)
const agentFilter = ref<string | null>(null)
const providerFilter = ref<string | null>(null)
const typeFilter = ref<TransactionType | null>(null)
const statusFilter = ref<TransactionStatus | null>(null)
const walletFilter = ref<WalletMode | null>(null)
const currencyFilter = ref<string | null>(null)
const differenceFilter = ref<string | null>(null)

const rows = ref<TransactionRow[]>([
  {
    transaction_id: 'TX-20260707-000184',
    bet_id: 'BET-20260707-000884',
    round_id: 'R-PG-8842-78231',
    provider_tx_id: 'PG-TX-78231-BET',
    type: 'Bet',
    status: 'success',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    merchant_player_id: 'mem_8842',
    player_wallet_id: 'PW-OP1001-mem_8842-TWD',
    provider_id: 'PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-TWD',
    provider_currency_id: 'PG-CUR-TWD-01',
    provider_merchant_id: 'PG-MCH-YOTA-TWD',
    provider_currency: 'TWD',
    provider_amount: -3200,
    game_code: 'PG-FORTUNE-TIGER',
    game_name: 'Fortune Tiger',
    wallet_mode: 'seamless',
    display_currency: 'TWD',
    display_amount: -3200,
    settlement_currency: 'USDT',
    settlement_amount: -100.38,
    settlement_status: 'locked',
    settlement_batch_id: 'SET-20260708-0001',
    exchange_rate_id: 'FX-20260707-TWD',
    exchange_rate: 31.8786,
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-07T00:00:00.000Z',
    has_difference: false,
    repairable: false,
    idempotency_key: 'idem-op1001-bet-78231',
    merchant_callback_url: 'https://bluewhale.example/wallet/bet',
    callback_status: 'success',
    provider_status_code: '200 / OK',
    provider_returned_at: '2026-07-07T09:18:13.000Z',
    request_payload: '{"merchant_player_id":"mem_8842","amount":3200,"currency":"TWD","round_id":"R-PG-8842-78231"}',
    response_payload: '{"code":0,"balance":125200,"tx_id":"MCH-78231"}',
    provider_request_payload: '{"player":"GGAP-mem_8842","providerCurrencyId":"PG-CUR-TWD-01","providerMerchantId":"PG-MCH-YOTA-TWD","amount":"3200.00","currency":"TWD","game":"PG-FORTUNE-TIGER"}',
    provider_response_payload: '{"status":"SUCCESS","provider_tx_id":"PG-TX-78231-BET"}',
    created_at: '2026-07-07T09:18:12.000Z',
    completed_at: '2026-07-07T09:18:14.000Z',
    flow_steps: [
      { name: '建立交易快照', status: 'success', time: '2026-07-07T09:18:12.000Z', trace_id: 'trace-create-78231', note: '已鎖定交易、會員與匯率快照' },
      { name: '商戶 Seamless Callback', status: 'success', time: '2026-07-07T09:18:12.500Z', trace_id: 'trace-callback-78231', note: '商戶扣款成功' },
      { name: 'Provider Bet', status: 'success', time: '2026-07-07T09:18:13.000Z', trace_id: 'trace-provider-78231', note: 'Provider 回傳成功' },
      { name: '完成交易', status: 'success', time: '2026-07-07T09:18:14.000Z', trace_id: 'trace-done-78231', note: '寫入交易流水與結算金額' }
    ],
    transfer_records: [],
    repair_records: []
  },
  {
    transaction_id: 'TX-20260707-000185',
    bet_id: 'BET-20260707-000884',
    round_id: 'R-PG-8842-78231',
    provider_tx_id: 'PG-TX-78231-WIN',
    type: 'Win',
    status: 'success',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    merchant_player_id: 'mem_8842',
    player_wallet_id: 'PW-OP1001-mem_8842-TWD',
    provider_id: 'PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-TWD',
    provider_currency_id: 'PG-CUR-TWD-01',
    provider_merchant_id: 'PG-MCH-YOTA-TWD',
    provider_currency: 'TWD',
    provider_amount: 2850,
    game_code: 'PG-FORTUNE-TIGER',
    game_name: 'Fortune Tiger',
    wallet_mode: 'seamless',
    display_currency: 'TWD',
    display_amount: 2850,
    settlement_currency: 'USDT',
    settlement_amount: 89.4,
    settlement_status: 'locked',
    settlement_batch_id: 'SET-20260708-0001',
    exchange_rate_id: 'FX-20260707-TWD',
    exchange_rate: 31.8786,
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-07T00:00:00.000Z',
    has_difference: false,
    repairable: false,
    idempotency_key: 'idem-op1001-win-78231',
    merchant_callback_url: 'https://bluewhale.example/wallet/win',
    callback_status: 'success',
    provider_status_code: '200 / OK',
    provider_returned_at: '2026-07-07T09:19:02.000Z',
    request_payload: '{"merchant_player_id":"mem_8842","amount":2850,"currency":"TWD","round_id":"R-PG-8842-78231"}',
    response_payload: '{"code":0,"balance":128050,"tx_id":"MCH-78232"}',
    provider_request_payload: '{"player":"GGAP-mem_8842","providerCurrencyId":"PG-CUR-TWD-01","providerMerchantId":"PG-MCH-YOTA-TWD","amount":"2850.00","currency":"TWD","game":"PG-FORTUNE-TIGER"}',
    provider_response_payload: '{"status":"SUCCESS","provider_tx_id":"PG-TX-78231-WIN"}',
    created_at: '2026-07-07T09:19:01.000Z',
    completed_at: '2026-07-07T09:19:03.000Z',
    flow_steps: [
      { name: '建立交易快照', status: 'success', time: '2026-07-07T09:19:01.000Z', trace_id: 'trace-create-78232', note: '沿用 Round 匯率快照' },
      { name: 'Provider Win', status: 'success', time: '2026-07-07T09:19:02.000Z', trace_id: 'trace-provider-78232', note: 'Provider 派彩成功' },
      { name: '商戶 Seamless Callback', status: 'success', time: '2026-07-07T09:19:02.500Z', trace_id: 'trace-callback-78232', note: '商戶加款成功' },
      { name: '完成交易', status: 'success', time: '2026-07-07T09:19:03.000Z', trace_id: 'trace-done-78232', note: '交易流水已鎖定' }
    ],
    transfer_records: [],
    repair_records: []
  },
  {
    transaction_id: 'TX-20260706-000774',
    bet_id: 'BET-20260706-000925',
    round_id: 'R-PP-9255-77410',
    provider_tx_id: 'PP-TX-77410-BET',
    type: 'Bet',
    status: 'amount_mismatch',
    merchant_id: 'OP-1007',
    merchant_name: 'Golden Dragon Gaming',
    agent_id: 'AGT-L1-SEA',
    agent_name: 'SEA Master',
    merchant_player_id: 'dragon_9255',
    player_wallet_id: 'PW-OP1007-dragon_9255-VND',
    provider_id: 'PP',
    provider_name: 'Pragmatic Play',
    provider_currency_line_id: 'PC-PP-VND',
    provider_currency_id: 'PP-CUR-VND-01',
    provider_merchant_id: 'PP-MCH-VND',
    provider_currency: 'VND',
    provider_amount: -1200000,
    game_code: 'PP-GATES-OLYMPUS',
    game_name: 'Gates of Olympus',
    wallet_mode: 'transfer',
    display_currency: 'VND',
    display_amount: -1200000,
    settlement_currency: 'USDT',
    settlement_amount: -45.36,
    settlement_status: 'pending_daily',
    settlement_batch_id: '-',
    exchange_rate_id: 'FX-20260706-VND',
    exchange_rate: 26455.2,
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-06T00:00:00.000Z',
    has_difference: true,
    repairable: true,
    idempotency_key: 'idem-ledger-out-77410',
    merchant_callback_url: 'https://goldendragon.example/transfer/out',
    callback_status: 'skipped',
    provider_status_code: '200 / OK',
    provider_returned_at: '2026-07-06T14:15:44.700Z',
    request_payload: '{"ledger_id":"LED-9255-0003","action":"Transfer Out","amount":1200000,"currency":"VND"}',
    response_payload: '{"ledger_status":"FAILED","reason":"balance frozen"}',
    provider_request_payload: '{"player":"GGAP-dragon_9255","providerCurrencyId":"PP-CUR-VND-01","providerMerchantId":"PP-MCH-VND","amount":"1200000","currency":"VND","game":"PP-GATES-OLYMPUS"}',
    provider_response_payload: '{"status":"SUCCESS","amount":"45.34","provider_tx_id":"PP-TX-77410-BET"}',
    created_at: '2026-07-06T14:15:44.000Z',
    flow_steps: [
      { name: '建立交易快照', status: 'success', time: '2026-07-06T14:15:44.000Z', trace_id: 'trace-create-77410', note: '交易快照已建立' },
      { name: 'Ledger Transfer Out', status: 'failed', time: '2026-07-06T14:15:44.500Z', trace_id: 'trace-ledger-77410', note: 'Transfer 錢包扣點失敗，會員餘額凍結' },
      { name: 'Provider Bet', status: 'success', time: '2026-07-06T14:15:44.700Z', trace_id: 'trace-provider-77410', note: 'Provider 已回傳成功，金額差異 0.02 USDT' },
      { name: '等待人工補單', status: 'pending', time: '2026-07-06T14:18:00.000Z', trace_id: 'trace-manual-77410', note: '需由補單流程校正 Provider 與內部帳本' }
    ],
    transfer_records: [
      {
        transfer_id: 'TR-20260706-000219',
        ledger_id: 'LED-9255-0003',
        action: 'Transfer Out',
        display_currency: 'VND',
        display_amount: -1200000,
        settlement_currency: 'USDT',
        settlement_amount: -45.36,
        before_balance: 0,
        after_balance: 0,
        locked_balance: 0,
        status: 'failed',
        idempotency_key: 'idem-ledger-out-77410',
        created_at: '2026-07-06T14:15:44.500Z'
      }
    ],
    repair_records: [
      { repair_id: 'RP-20260706-000032', reason: 'Amount mismatch + frozen wallet', status: 'processing', operator: 'Risk', created_at: '2026-07-06T14:18:00.000Z' }
    ]
  }
])

const typeOptions = ['Balance', 'Bet', 'Win', 'Refund', 'Rollback', 'Adjustment'].map(value => ({ label: value, value }))
const walletOptions = [
  { label: 'Seamless', value: 'seamless' },
  { label: 'Transfer', value: 'transfer' }
]
const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '處理中', value: 'pending' },
  { label: '失敗', value: 'failed' },
  { label: 'Callback 失敗', value: 'callback_failed' },
  { label: 'Provider Pending', value: 'provider_pending' },
  { label: '金額差異', value: 'amount_mismatch' },
  { label: '已補正', value: 'repaired' },
  { label: '已作廢', value: 'voided' },
  { label: '人工覆核', value: 'manual_review' }
]
const differenceOptions = [
  { label: '有差異', value: 'yes' },
  { label: '無差異', value: 'no' },
  { label: '可補單', value: 'repairable' }
]

const statusMeta: Record<TransactionStatus, { label: string; type: 'success' | 'warning' | 'error' | 'info' | 'default' }> = {
  success: { label: '成功', type: 'success' },
  pending: { label: '處理中', type: 'warning' },
  failed: { label: '失敗', type: 'error' },
  callback_failed: { label: 'Callback 失敗', type: 'error' },
  provider_pending: { label: 'Provider Pending', type: 'warning' },
  amount_mismatch: { label: '金額差異', type: 'error' },
  repaired: { label: '已補正', type: 'success' },
  voided: { label: '已作廢', type: 'default' },
  manual_review: { label: '人工覆核', type: 'info' }
}
const flowMeta: Record<FlowStatus, 'success' | 'warning' | 'error' | 'default'> = {
  success: 'success',
  pending: 'warning',
  failed: 'error',
  skipped: 'default'
}

const merchantOptions = computed(() => Array.from(new Set(rows.value.map(row => row.merchant_name))).map(value => ({ label: value, value })))
const agentOptions = computed(() => Array.from(new Set(rows.value.map(row => row.agent_name))).map(value => ({ label: value, value })))
const providerOptions = computed(() => Array.from(new Set(rows.value.map(row => row.provider_name))).map(value => ({ label: value, value })))
const currencyOptions = computed(() => Array.from(new Set(rows.value.map(row => row.display_currency))).map(value => ({ label: value, value })))

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'
const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`
const walletModeLabel = (mode: WalletMode) => mode === 'seamless' ? 'Seamless' : 'Transfer'

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const inKeyword = !keyword
      || row.transaction_id.toLowerCase().includes(keyword)
      || row.round_id.toLowerCase().includes(keyword)
      || row.provider_tx_id.toLowerCase().includes(keyword)
      || row.merchant_player_id.toLowerCase().includes(keyword)
      || row.merchant_id.toLowerCase().includes(keyword)
      || row.player_wallet_id.toLowerCase().includes(keyword)
    const inMerchant = !merchantFilter.value || row.merchant_name === merchantFilter.value
    const inAgent = !agentFilter.value || row.agent_name === agentFilter.value
    const inProvider = !providerFilter.value || row.provider_name === providerFilter.value
    const inType = !typeFilter.value || row.type === typeFilter.value
    const inStatus = !statusFilter.value || row.status === statusFilter.value
    const inWallet = !walletFilter.value || row.wallet_mode === walletFilter.value
    const inCurrency = !currencyFilter.value || row.display_currency === currencyFilter.value
    const inDifference = !differenceFilter.value
      || (differenceFilter.value === 'yes' && row.has_difference)
      || (differenceFilter.value === 'no' && !row.has_difference)
      || (differenceFilter.value === 'repairable' && row.repairable)
    return inKeyword && inMerchant && inAgent && inProvider && inType && inStatus && inWallet && inCurrency && inDifference
  })
})

const summary = computed(() => ({
  total: filteredRows.value.length,
  success: filteredRows.value.filter(row => row.status === 'success').length,
  abnormal: filteredRows.value.filter(row => row.status !== 'success').length,
  repairable: filteredRows.value.filter(row => row.repairable).length,
  transfer: filteredRows.value.filter(row => row.wallet_mode === 'transfer').length,
  settlementAbs: filteredRows.value.reduce((sum, row) => sum + Math.abs(row.settlement_amount), 0)
}))

const normalizeRows = (items: unknown): TransactionRow[] | null => {
  if (!Array.isArray(items)) return null
  return items.filter((item): item is TransactionRow => !!item && typeof item === 'object' && 'transaction_id' in item)
}

const loadRows = async () => {
  loading.value = true
  try {
    const response = await adminTransactionService.listTransactions()
    const nextRows = normalizeRows(response.data.items)
    if (nextRows?.length) rows.value = nextRows
  } catch {
    message.error('交易流水讀取失敗，已保留展示資料')
  } finally {
    loading.value = false
  }
}

const openDetail = async (row: TransactionRow) => {
  detailTab.value = 'basic'
  try {
    const response = await adminTransactionService.getTransactionDetail(row.transaction_id)
    currentRow.value = (response.data || row) as TransactionRow
  } catch {
    currentRow.value = row
    message.warning('詳細資料 API 尚未回傳，使用列表資料展示')
  } finally {
    showDetail.value = true
  }
}

onMounted(loadRows)

const resetFilters = () => {
  searchText.value = ''
  merchantFilter.value = null
  agentFilter.value = null
  providerFilter.value = null
  typeFilter.value = null
  statusFilter.value = null
  walletFilter.value = null
  currencyFilter.value = null
  differenceFilter.value = null
}

const actionMessage = (action: string, row: TransactionRow) => {
  message.info(`${action}：${row.transaction_id}，展示模式已記錄操作`)
}

const copyTransactionId = async (row: TransactionRow) => {
  await navigator.clipboard.writeText(row.transaction_id)
  message.success(`已複製 ${row.transaction_id}`)
}

const columns: DataTableColumns<TransactionRow> = [
  {
    title: '交易 ID',
    key: 'transaction_id',
    width: 190,
    fixed: 'left',
    render: row => h('button', {
      class: 'font-mono text-cyan-500 hover:text-cyan-300',
      onClick: () => openDetail(row)
    }, row.transaction_id)
  },
  { title: '注單 ID', key: 'bet_id', width: 185, render: row => h('span', { class: 'font-mono text-xs' }, row.bet_id) },
  { title: 'Round ID', key: 'round_id', width: 170, render: row => h('span', { class: 'font-mono text-xs' }, row.round_id) },
  { title: '類型', key: 'type', width: 105, render: row => h(NTag, { bordered: false }, { default: () => row.type }) },
  { title: '狀態', key: 'status', width: 140, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false }, { default: () => statusMeta[row.status].label }) },
  {
    title: '商戶',
    key: 'merchant_name',
    width: 220,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'font-semibold' }, row.merchant_name),
      h('span', { class: 'font-mono text-xs text-gray-500' }, row.merchant_id)
    ])
  },
  { title: '會員', key: 'merchant_player_id', width: 150, render: row => h('span', { class: 'font-mono' }, row.merchant_player_id) },
  { title: '供應商', key: 'provider_name', width: 145 },
  { title: 'Provider 幣別線', key: 'provider_currency_id', width: 165, render: row => h('div', {}, [h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => row.provider_currency }), h('div', { class: 'mt-1 font-mono text-xs text-gray-500' }, row.provider_currency_id)]) },
  { title: '遊戲', key: 'game_name', width: 180 },
  { title: 'Wallet 模式', key: 'wallet_mode', width: 120, render: row => h(NTag, { type: row.wallet_mode === 'transfer' ? 'warning' : 'info', bordered: false }, { default: () => walletModeLabel(row.wallet_mode) }) },
  { title: 'Provider 原幣', key: 'provider_amount', width: 150, align: 'right', render: row => h(MoneyText, { value: row.provider_amount, currency: row.provider_currency, compact: true, showSign: true }) },
  { title: 'USDT 日結', key: 'settlement_amount', width: 150, align: 'right', render: row => h(MoneyText, { value: row.settlement_amount, currency: row.settlement_currency, compact: true, showSign: true }) },
  { title: '日結批次', key: 'settlement_batch_id', width: 160, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.settlement_batch_id) },
  { title: '匯率快照', key: 'exchange_rate_id', width: 160, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.exchange_rate_id) },
  { title: '差異', key: 'has_difference', width: 95, render: row => h(NTag, { type: row.has_difference ? 'error' : 'success', bordered: false }, { default: () => row.has_difference ? '有差異' : '正常' }) },
  { title: '建立時間', key: 'created_at', width: 180, render: row => formatDateTime(row.created_at) },
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
        h(NButton, { size: 'small', secondary: true, disabled: row.wallet_mode !== 'seamless' || row.callback_status !== 'failed', onClick: () => actionMessage('重送 Callback', row) }, { default: () => '重送 Callback' }),
        h(NButton, { size: 'small', secondary: true, type: row.repairable ? 'warning' : 'default', disabled: !row.repairable, onClick: () => actionMessage('建立補單', row) }, { default: () => '建立補單' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => copyTransactionId(row) }, {
          icon: () => h(NIcon, null, { default: () => h(ContentCopyRound) })
        })
      ]
    })
  }
]

const transferColumns: DataTableColumns<TransferRecord> = [
  { title: '轉點 ID', key: 'transfer_id', width: 170, render: row => h('span', { class: 'font-mono text-xs' }, row.transfer_id) },
  { title: 'Ledger ID', key: 'ledger_id', width: 150, render: row => h('span', { class: 'font-mono text-xs' }, row.ledger_id) },
  { title: '操作', key: 'action', width: 120 },
  { title: '原幣金額', key: 'display_amount', width: 140, align: 'right', render: row => h(MoneyText, { value: row.display_amount, currency: row.display_currency, compact: true, showSign: true }) },
  { title: '結算金額', key: 'settlement_amount', width: 140, align: 'right', render: row => h(MoneyText, { value: row.settlement_amount, currency: row.settlement_currency, compact: true, showSign: true }) },
  { title: '異動前', key: 'before_balance', width: 120, align: 'right', render: row => h(MoneyText, { value: row.before_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '異動後', key: 'after_balance', width: 120, align: 'right', render: row => h(MoneyText, { value: row.after_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '鎖定金額', key: 'locked_balance', width: 120, align: 'right', render: row => h(MoneyText, { value: row.locked_balance, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '狀態', key: 'status', width: 120, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false }, { default: () => statusMeta[row.status].label }) },
  { title: 'Idempotency Key', key: 'idempotency_key', width: 220, render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.idempotency_key) }
]

const repairColumns: DataTableColumns<RepairRecord> = [
  { title: '補單 ID', key: 'repair_id', render: row => h('span', { class: 'font-mono text-xs' }, row.repair_id) },
  { title: '原因', key: 'reason' },
  { title: '狀態', key: 'status', render: row => h(NTag, { bordered: false, type: row.status === 'done' ? 'success' : row.status === 'processing' ? 'warning' : 'default' }, { default: () => row.status }) },
  { title: '操作人員', key: 'operator' },
  { title: '建立時間', key: 'created_at', render: row => formatDateTime(row.created_at) }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">交易流水</h1>
        <p class="mt-1 text-sm text-gray-500">
          查詢每筆 Bet、Win、Refund、Rollback 與 Adjustment 的 Provider 原幣、幣別線、USDT 日結、Wallet 與補單紀錄。
        </p>
      </div>
      <n-button type="primary" secondary>
        <template #icon>
          <n-icon><ReceiptLongOutlined /></n-icon>
        </template>
        匯出流水
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="交易總數" :value="summary.total" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="成功" :value="summary.success" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="待處理 / 異常" :value="summary.abnormal" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="可補單" :value="summary.repairable" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="Transfer 筆數" :value="summary.transfer" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="USDT 結算量">
          <MoneyText :value="summary.settlementAbs" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
    </div>

    <n-alert type="info" :show-icon="false">
      每筆流水保留 Provider 幣別線、原幣金額、逐筆注單關聯與不可變 Payload；平台於 00:00 關帳、00:05 鎖定公告匯率，並於 00:10 產生 USDT 日結金額，正式帳單仍由各帳務模組彙總。
    </n-alert>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="searchText" clearable placeholder="搜尋交易 ID / Round ID / 會員 / Wallet / Provider Tx" class="xl:col-span-4">
          <template #prefix>
            <n-icon :component="SearchOutlined" class="opacity-60" />
          </template>
        </n-input>
        <n-select v-model:value="merchantFilter" clearable filterable placeholder="商戶" :options="merchantOptions" class="xl:col-span-2" />
        <n-select v-model:value="agentFilter" clearable filterable placeholder="代理" :options="agentOptions" class="xl:col-span-2" />
        <n-select v-model:value="providerFilter" clearable filterable placeholder="供應商" :options="providerOptions" class="xl:col-span-2" />
        <n-select v-model:value="typeFilter" clearable placeholder="交易類型" :options="typeOptions" class="xl:col-span-1" />
        <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" class="xl:col-span-1" />
        <n-select v-model:value="walletFilter" clearable placeholder="Wallet 模式" :options="walletOptions" class="xl:col-span-2" />
        <n-select v-model:value="currencyFilter" clearable placeholder="Provider 幣別" :options="currencyOptions" class="xl:col-span-2" />
        <n-select v-model:value="differenceFilter" clearable placeholder="差異 / 補單" :options="differenceOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :loading="loading"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="2830"
    />

    <n-drawer v-model:show="showDetail" width="min(1180px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold">{{ currentRow.transaction_id }}</span>
            <span class="font-mono text-sm text-gray-500">{{ currentRow.round_id }}</span>
            <n-tag :bordered="false">{{ currentRow.type }}</n-tag>
            <n-tag :type="statusMeta[currentRow.status].type" :bordered="false">{{ statusMeta[currentRow.status].label }}</n-tag>
            <n-tag :type="currentRow.wallet_mode === 'transfer' ? 'warning' : 'info'" :bordered="false">{{ walletModeLabel(currentRow.wallet_mode) }}</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="Provider 原幣">
                <MoneyText :value="currentRow.provider_amount" :currency="currentRow.provider_currency" compact show-sign />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="結算金額">
                <MoneyText :value="currentRow.settlement_amount" currency="USDT" compact show-sign />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="匯率快照">{{ currentRow.exchange_rate_id }}</n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="補單狀態">{{ currentRow.repairable ? '可建立補單' : '不需補單' }}</n-statistic>
            </div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="交易 ID">{{ currentRow.transaction_id }}</n-descriptions-item>
                <n-descriptions-item label="注單 ID">{{ currentRow.bet_id }}</n-descriptions-item>
                <n-descriptions-item label="Provider Tx">{{ currentRow.provider_tx_id }}</n-descriptions-item>
                <n-descriptions-item label="商戶">{{ currentRow.merchant_name }} / {{ currentRow.merchant_id }}</n-descriptions-item>
                <n-descriptions-item label="代理">{{ currentRow.agent_name }} / {{ currentRow.agent_id }}</n-descriptions-item>
                <n-descriptions-item label="會員">{{ currentRow.merchant_player_id }}</n-descriptions-item>
                <n-descriptions-item label="會員錢包">{{ currentRow.player_wallet_id }}</n-descriptions-item>
                <n-descriptions-item label="供應商">{{ currentRow.provider_name }} / {{ currentRow.provider_id }}</n-descriptions-item>
                <n-descriptions-item label="遊戲">{{ currentRow.game_name }} / {{ currentRow.game_code }}</n-descriptions-item>
                <n-descriptions-item label="Provider 幣別 ID">{{ currentRow.provider_currency_id }}</n-descriptions-item>
                <n-descriptions-item label="Provider 廠商 ID">{{ currentRow.provider_merchant_id }}</n-descriptions-item>
                <n-descriptions-item label="建立時間">{{ formatDateTime(currentRow.created_at) }}</n-descriptions-item>
                <n-descriptions-item label="完成時間">{{ formatDateTime(currentRow.completed_at) }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="amount" tab="金額 / 匯率">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="Provider 交易幣別">{{ currentRow.provider_currency }}</n-descriptions-item>
                <n-descriptions-item label="Provider 原幣金額">
                  <MoneyText :value="currentRow.provider_amount" :currency="currentRow.provider_currency" compact show-sign />
                </n-descriptions-item>
                <n-descriptions-item label="結算幣別">{{ currentRow.settlement_currency }}</n-descriptions-item>
                <n-descriptions-item label="結算金額">
                  <MoneyText :value="currentRow.settlement_amount" :currency="currentRow.settlement_currency" compact show-sign />
                </n-descriptions-item>
                <n-descriptions-item label="日結狀態">{{ currentRow.settlement_status }}</n-descriptions-item>
                <n-descriptions-item label="日結批次">{{ currentRow.settlement_batch_id }}</n-descriptions-item>
                <n-descriptions-item label="匯率 ID">{{ currentRow.exchange_rate_id }}</n-descriptions-item>
                <n-descriptions-item label="公告匯率">{{ currentRow.exchange_rate }}</n-descriptions-item>
                <n-descriptions-item label="匯率服務費">{{ formatPercent(currentRow.exchange_fee_rate) }}</n-descriptions-item>
                <n-descriptions-item label="鎖定時間">{{ formatDateTime(currentRow.rate_locked_at) }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="wallet" tab="Wallet / Callback">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="Wallet 模式">{{ walletModeLabel(currentRow.wallet_mode) }}</n-descriptions-item>
                <n-descriptions-item label="Callback 狀態">
                  <n-tag :type="flowMeta[currentRow.callback_status]" :bordered="false">{{ currentRow.callback_status }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="商戶 Callback URL">{{ currentRow.merchant_callback_url }}</n-descriptions-item>
                <n-descriptions-item label="Idempotency Key">{{ currentRow.idempotency_key }}</n-descriptions-item>
                <n-descriptions-item label="商戶 Request">
                  <pre class="whitespace-pre-wrap text-xs">{{ currentRow.request_payload }}</pre>
                </n-descriptions-item>
                <n-descriptions-item label="商戶 Response">
                  <pre class="whitespace-pre-wrap text-xs">{{ currentRow.response_payload }}</pre>
                </n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="provider" tab="Provider">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="Provider 回傳">{{ currentRow.provider_status_code }}</n-descriptions-item>
                <n-descriptions-item label="回傳時間">{{ formatDateTime(currentRow.provider_returned_at) }}</n-descriptions-item>
                <n-descriptions-item label="Provider Request">
                  <pre class="whitespace-pre-wrap text-xs">{{ currentRow.provider_request_payload }}</pre>
                </n-descriptions-item>
                <n-descriptions-item label="Provider Response">
                  <pre class="whitespace-pre-wrap text-xs">{{ currentRow.provider_response_payload }}</pre>
                </n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="timeline" tab="流程紀錄">
              <n-timeline>
                <n-timeline-item
                  v-for="step in currentRow.flow_steps"
                  :key="step.trace_id"
                  :type="flowMeta[step.status]"
                  :title="step.name"
                  :content="step.note"
                  :time="`${formatDateTime(step.time)} / ${step.trace_id}`"
                />
              </n-timeline>
            </n-tab-pane>

            <n-tab-pane name="transfer" tab="轉點紀錄">
              <n-data-table
                :columns="withTableSorters(transferColumns)"
                :data="currentRow.transfer_records"
                :pagination="DEFAULT_TABLE_PAGINATION"
                :scroll-x="1460"
              />
            </n-tab-pane>

            <n-tab-pane name="repair" tab="補單紀錄">
              <n-data-table
                :columns="withTableSorters(repairColumns)"
                :data="currentRow.repair_records"
                :pagination="DEFAULT_TABLE_PAGINATION"
              />
            </n-tab-pane>
          </n-tabs>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
