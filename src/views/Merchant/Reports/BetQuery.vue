<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NCard, NDataTable, NInput, NSelect, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import DemoActionModal from '../../../components/Portal/DemoActionModal.vue'
import type { DemoField, DemoSection } from '../../../components/Portal/DemoActionModal.vue'
import { useAuthStore } from '../../../stores/auth'

interface BetTraceRow {
  round_id: string
  bet_id: string
  transaction_id: string
  agent_path: string
  merchant_id: string
  merchant_name: string
  player_id: string
  provider: string
  provider_currency_id: string
  provider_merchant_id: string
  provider_currency: string
  game_name: string
  display_currency: string
  display_bet: number
  display_win: number
  settlement_currency: 'USDT'
  settlement_bet: number | null
  settlement_ggr: number | null
  settlement_status: 'pending_daily' | 'settled' | 'locked'
  settlement_batch_id: string
  wallet_mode: 'Seamless' | 'Transfer'
  provider_tx_id: string
  provider_bet_group_name: string
  status: 'settled' | 'pending' | 'voided' | 'abnormal'
  created_at: string
  settled_at: string
}

const route = useRoute()
const authStore = useAuthStore()
const isAgentPortal = computed(() => route.path.startsWith('/agent'))
const keyword = ref('')
const status = ref<string | null>(null)
const walletMode = ref<string | null>(null)
const showAction = ref(false)
const selectedBet = ref<BetTraceRow | null>(null)
const actionMode = ref<'detail' | 'ledger'>('detail')

const rows: BetTraceRow[] = [
  { round_id: 'R-20260708-8811', bet_id: 'BET-0001', transaction_id: 'TX-BET-0001', agent_path: 'AGT-SEA-001', merchant_id: 'OP-1007', merchant_name: 'Golden Dragon', player_id: 'P-TWD-10001', provider: 'PG Soft', provider_currency_id: 'PG-CUR-TWD-01', provider_merchant_id: 'PG-MCH-YOTA-TWD', provider_currency: 'TWD', game_name: 'Mahjong Ways', display_currency: 'TWD', display_bet: 1200, display_win: 860, settlement_currency: 'USDT', settlement_bet: 37.21, settlement_ggr: 10.54, settlement_status: 'locked', settlement_batch_id: 'SET-20260709-0001', wallet_mode: 'Seamless', provider_tx_id: 'PG-TX-99801', provider_bet_group_name: 'TWD 500-5000', status: 'settled', created_at: '2026/7/8 13:41:10', settled_at: '2026/7/9 00:10:35' },
  { round_id: 'R-20260708-8811', bet_id: 'BET-0001-02', transaction_id: 'TX-BET-0001-02', agent_path: 'AGT-SEA-001', merchant_id: 'OP-1007', merchant_name: 'Golden Dragon', player_id: 'P-TWD-10001', provider: 'PG Soft', provider_currency_id: 'PG-CUR-TWD-01', provider_merchant_id: 'PG-MCH-YOTA-TWD', provider_currency: 'TWD', game_name: 'Mahjong Ways', display_currency: 'TWD', display_bet: 300, display_win: 0, settlement_currency: 'USDT', settlement_bet: 9.3, settlement_ggr: 9.3, settlement_status: 'locked', settlement_batch_id: 'SET-20260709-0001', wallet_mode: 'Seamless', provider_tx_id: 'PG-TX-99801-02', provider_bet_group_name: 'TWD 50-500', status: 'settled', created_at: '2026/7/8 13:41:18', settled_at: '2026/7/9 00:10:35' },
  { round_id: 'R-20260708-8812', bet_id: 'BET-0002', transaction_id: 'TX-BET-0002', agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01', merchant_id: 'OP-1002', merchant_name: 'HyperWin Network', player_id: 'P-IDR-10022', provider: 'JILI', provider_currency_id: 'JILI-CUR-IDR-01', provider_merchant_id: 'JILI-MCH-IDR', provider_currency: 'IDR', game_name: 'Super Ace', display_currency: 'IDR', display_bet: 300000, display_win: 0, settlement_currency: 'USDT', settlement_bet: 18.24, settlement_ggr: 18.24, settlement_status: 'locked', settlement_batch_id: 'SET-20260709-0002', wallet_mode: 'Transfer', provider_tx_id: 'JL-TX-19381', provider_bet_group_name: 'IDR 50000-500000', status: 'settled', created_at: '2026/7/8 12:55:47', settled_at: '2026/7/9 00:10:44' },
  { round_id: 'R-20260708-8813', bet_id: 'BET-0003', transaction_id: 'TX-BET-0003', agent_path: 'AGT-DIRECT', merchant_id: 'OP-1003', merchant_name: 'Lucky Star Digital', player_id: 'P-PHP-10018', provider: 'Evolution', provider_currency_id: 'EVO-CUR-PHP-01', provider_merchant_id: 'EVO-MCH-PHP', provider_currency: 'PHP', game_name: 'Baccarat A', display_currency: 'PHP', display_bet: 5000, display_win: 7250, settlement_currency: 'USDT', settlement_bet: null, settlement_ggr: null, settlement_status: 'pending_daily', settlement_batch_id: '-', wallet_mode: 'Seamless', provider_tx_id: 'EV-TX-77001', provider_bet_group_name: 'PHP 100-5000', status: 'pending', created_at: '2026/7/8 11:20:33', settled_at: '-' },
  { round_id: 'R-20260708-8814', bet_id: 'BET-0004', transaction_id: 'TX-BET-0004', agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3', merchant_id: 'OP-1004', merchant_name: 'NovaPlay Entertainment', player_id: 'P-VND-10044', provider: 'Pragmatic Play', provider_currency_id: 'PP-CUR-VND-01', provider_merchant_id: 'PP-MCH-VND', provider_currency: 'VND', game_name: 'Lucky Fishing', display_currency: 'VND', display_bet: 2200000, display_win: 0, settlement_currency: 'USDT', settlement_bet: null, settlement_ggr: null, settlement_status: 'pending_daily', settlement_batch_id: '-', wallet_mode: 'Transfer', provider_tx_id: 'PP-TX-11890', provider_bet_group_name: 'VND 1000-25000000', status: 'abnormal', created_at: '2026/7/8 10:02:12', settled_at: '-' }
]

const formatSettlementAmount = (value: number | null) => value === null ? '待日結' : `USDT ${value.toLocaleString()}`

const visibleRows = computed(() => rows.filter((row) => {
  const inDataScope = isAgentPortal.value
    ? !!authStore.userInfo?.agentId && (row.agent_path === authStore.userInfo.agentId || row.agent_path.startsWith(`${authStore.userInfo.agentId} /`))
    : !!authStore.userInfo?.merchantId && row.merchant_id === authStore.userInfo.merchantId
  const text = `${row.round_id} ${row.bet_id} ${row.transaction_id} ${row.merchant_id} ${row.merchant_name} ${row.player_id} ${row.provider_tx_id} ${row.game_name}`.toLowerCase()
  return inDataScope && (!keyword.value || text.includes(keyword.value.toLowerCase())) &&
    (!status.value || row.status === status.value) &&
    (!walletMode.value || row.wallet_mode === walletMode.value)
}))

const openBetAction = (row: BetTraceRow, mode: typeof actionMode.value) => {
  selectedBet.value = row
  actionMode.value = mode
  showAction.value = true
}

const actionTitle = computed(() => `${actionMode.value === 'detail' ? '注單詳情' : '錢包流水'} - ${selectedBet.value?.bet_id || ''}`)

const actionFields = computed<DemoField[]>(() => {
  const row = selectedBet.value
  if (!row) return []
  if (actionMode.value === 'ledger') {
    return [
      { label: 'Round ID', value: row.round_id },
      { label: 'Wallet 模式', value: row.wallet_mode },
      { label: 'Provider Tx', value: row.provider_tx_id },
      { label: 'Provider 原幣投注', value: `${row.provider_currency} ${row.display_bet.toLocaleString()}` },
      { label: 'Provider 原幣派彩', value: `${row.provider_currency} ${row.display_win.toLocaleString()}` },
      { label: 'USDT 日結投注', value: formatSettlementAmount(row.settlement_bet) },
      { label: 'USDT GGR', value: formatSettlementAmount(row.settlement_ggr), tag: row.settlement_ggr === null ? 'warning' : row.settlement_ggr >= 0 ? 'success' : 'error' }
    ]
  }
  return [
    { label: 'Round ID', value: row.round_id },
    { label: '注單 ID', value: row.bet_id },
    { label: '交易 ID', value: row.transaction_id },
    { label: '商戶', value: `${row.merchant_id} ${row.merchant_name}` },
    { label: '會員', value: row.player_id },
    { label: 'Provider / 遊戲', value: `${row.provider} / ${row.game_name}` },
    { label: 'Provider 幣別 ID', value: row.provider_currency_id },
    { label: 'Provider 廠商 ID', value: row.provider_merchant_id },
    { label: '狀態', value: statusOptions.find(item => item.value === row.status)?.label || row.status, tag: row.status === 'settled' ? 'success' : row.status === 'abnormal' ? 'error' : 'warning' },
    { label: '建立時間', value: row.created_at },
    { label: '結算時間', value: row.settled_at }
  ]
})

const actionSections = computed<DemoSection[]>(() => selectedBet.value ? [{
  title: '快照資訊',
  fields: [
    { label: '代理路徑', value: selectedBet.value.agent_path },
    { label: '下注限額方案快照', value: selectedBet.value.provider_bet_group_name },
    { label: '正式結算幣別', value: selectedBet.value.settlement_currency, tag: 'success' },
    { label: '日結狀態', value: selectedBet.value.settlement_status },
    { label: '日結批次', value: selectedBet.value.settlement_batch_id },
    { label: '資料範圍', value: isAgentPortal.value ? '代理樹' : '商戶自身' }
  ]
}] : [])

const statusOptions = [
  { label: '已結算', value: 'settled' },
  { label: '待處理', value: 'pending' },
  { label: '作廢', value: 'voided' },
  { label: '異常', value: 'abnormal' }
]

const walletOptions = [
  { label: 'Seamless', value: 'Seamless' },
  { label: 'Transfer', value: 'Transfer' }
]

const columns = computed<DataTableColumns<BetTraceRow>>(() => [
  { title: '注單 ID', key: 'bet_id', width: 135, fixed: 'left', render: row => h('span', { class: 'font-mono text-cyan-300' }, row.bet_id) },
  { title: 'Round ID', key: 'round_id', width: 150, render: row => h('span', { class: 'font-mono text-xs' }, row.round_id) },
  ...(isAgentPortal.value ? [
    { title: '商戶 / 代理', key: 'merchant_name', minWidth: 220, render: (row: BetTraceRow) => h('div', {}, [
      h('div', { class: 'font-medium' }, row.merchant_name),
      h('div', { class: 'text-xs text-gray-500' }, row.agent_path)
    ]) }
  ] : []),
  { title: '會員', key: 'player_id', width: 130, render: row => h('span', { class: 'font-mono' }, row.player_id) },
  { title: 'Provider / 遊戲', key: 'game_name', minWidth: 180, render: row => h('div', {}, [h('div', row.provider), h('div', { class: 'text-xs text-gray-500' }, row.game_name)]) },
  { title: 'Provider 幣別線', key: 'provider_currency_id', width: 150, render: row => h('div', {}, [h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => row.provider_currency }), h('div', { class: 'mt-1 font-mono text-xs text-gray-500' }, row.provider_currency_id)]) },
  { title: '原幣投注', key: 'display_bet', width: 130, align: 'right', render: row => `${row.provider_currency} ${row.display_bet.toLocaleString()}` },
  { title: '原幣派彩', key: 'display_win', width: 130, align: 'right', render: row => `${row.provider_currency} ${row.display_win.toLocaleString()}` },
  { title: 'USDT 日結投注', key: 'settlement_bet', width: 140, align: 'right', render: row => h('span', { class: row.settlement_bet === null ? 'text-amber-300' : '' }, formatSettlementAmount(row.settlement_bet)) },
  { title: 'USDT GGR', key: 'settlement_ggr', width: 120, align: 'right', render: row => h('span', { class: row.settlement_ggr === null ? 'text-amber-300' : row.settlement_ggr >= 0 ? 'text-emerald-400' : 'text-red-400' }, formatSettlementAmount(row.settlement_ggr)) },
  { title: 'Wallet', key: 'wallet_mode', width: 105 },
  { title: 'Provider Tx', key: 'provider_tx_id', width: 140, render: row => h('span', { class: 'font-mono text-xs' }, row.provider_tx_id) },
  { title: '日結批次', key: 'settlement_batch_id', width: 155, render: row => h('span', { class: 'font-mono text-xs' }, row.settlement_batch_id) },
  { title: '下注限額方案快照', key: 'provider_bet_group_name', width: 180, ellipsis: { tooltip: true } },
  {
    title: '狀態',
    key: 'status',
    width: 100,
    render: row => {
      const typeMap = { settled: 'success', pending: 'warning', voided: 'default', abnormal: 'error' } as const
      const labelMap = { settled: '已結算', pending: '待處理', voided: '作廢', abnormal: '異常' }
      return h(NTag, { type: typeMap[row.status], size: 'small', bordered: false }, { default: () => labelMap[row.status] })
    }
  },
  { title: '建立時間', key: 'created_at', width: 160 },
  { title: '結算時間', key: 'settled_at', width: 160 },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    fixed: 'right',
    render: row => h('div', { class: 'flex flex-wrap gap-2' }, [
      h(NButton, { size: 'small', secondary: true, onClick: () => openBetAction(row, 'detail') }, { default: () => '詳情' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openBetAction(row, 'ledger') }, { default: () => '流水' })
    ])
  }
])
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">{{ isAgentPortal ? '注單追蹤' : '注單查詢' }}</h1>
      <p class="mt-2 text-sm text-gray-500">
        {{ isAgentPortal ? '代理僅可逐筆查看自身代理樹內每位會員的原幣注單與 USDT 日結結果。' : '商戶僅可逐筆查看自身會員注單、Provider 原幣、USDT 日結、Wallet 與下注限額方案快照。' }}
      </p>
    </header>

    <n-card>
      <div class="mb-4 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_160px_auto]">
        <n-input v-model:value="keyword" clearable placeholder="搜尋 Round ID / 注單 ID / 會員 / Provider Tx / 遊戲" />
        <n-select v-model:value="status" clearable placeholder="注單狀態" :options="statusOptions" />
        <n-select v-model:value="walletMode" clearable placeholder="Wallet 模式" :options="walletOptions" />
        <n-button tertiary @click="keyword = ''; status = null; walletMode = null">重置</n-button>
      </div>
      <n-data-table :columns="withTableSorters(columns)" :data="visibleRows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="isAgentPortal ? 2250 : 2050" striped />
    </n-card>

    <demo-action-modal
      v-model:show="showAction"
      :title="actionTitle"
      :subtitle="actionMode === 'detail' ? '展示單筆注單、遊戲、會員與結算快照。' : '展示 Bet / Win / Refund / Cancel 對應的錢包流水關係。'"
      :fields="actionFields"
      :sections="actionSections"
      :timeline="['Launch Game 依會員幣別選擇 Provider 幣別線', 'Provider 使用該線原幣進行 Bet / Win', '每位會員每筆下注以 bet_id 獨立保存', '00:00 關帳、00:05 鎖匯率、00:10 完成 USDT 日結']"
    />
  </div>
</template>
