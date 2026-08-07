<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NCard, NDataTable, NInput, NSelect, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type LedgerType = 'Bet' | 'Win' | 'Refund' | 'Cancel' | 'Transfer In' | 'Transfer Out' | 'Balance Sync'

interface LedgerRow {
  tx_id: string
  player_id: string
  round_id: string
  type: LedgerType
  display_currency: string
  display_amount: number
  provider_currency_id: string
  provider_merchant_id: string
  provider_currency: string
  provider_amount: number
  settlement_amount: number | null
  settlement_status: 'pending_daily' | 'locked'
  settlement_batch_id: string
  wallet_mode: 'Seamless' | 'Transfer'
  provider_tx_id: string
  callback_status: 'success' | 'retrying' | 'failed' | 'not_required'
  idempotency_key: string
  status: 'success' | 'pending' | 'failed'
  created_at: string
}

const keyword = ref('')
const txType = ref<string | null>(null)
const walletMode = ref<string | null>(null)

const rows: LedgerRow[] = [
  { tx_id: 'TX-20260708-0001', player_id: 'P-TWD-10001', round_id: 'R-20260708-8811', type: 'Bet', display_currency: 'TWD', display_amount: -1200, provider_currency_id: 'PG-CUR-TWD-01', provider_merchant_id: 'PG-MCH-YOTA-TWD', provider_currency: 'TWD', provider_amount: -1200, settlement_amount: -37.21, settlement_status: 'locked', settlement_batch_id: 'SET-20260709-0001', wallet_mode: 'Seamless', provider_tx_id: 'PG-TX-99801', callback_status: 'success', idempotency_key: 'idem-bet-8811', status: 'success', created_at: '2026/7/8 13:41:10' },
  { tx_id: 'TX-20260708-0002', player_id: 'P-TWD-10001', round_id: 'R-20260708-8811', type: 'Win', display_currency: 'TWD', display_amount: 860, provider_currency_id: 'PG-CUR-TWD-01', provider_merchant_id: 'PG-MCH-YOTA-TWD', provider_currency: 'TWD', provider_amount: 860, settlement_amount: 26.67, settlement_status: 'locked', settlement_batch_id: 'SET-20260709-0001', wallet_mode: 'Seamless', provider_tx_id: 'PG-TX-99802', callback_status: 'success', idempotency_key: 'idem-win-8811', status: 'success', created_at: '2026/7/8 13:41:35' },
  { tx_id: 'TX-20260708-0003', player_id: 'P-PHP-10018', round_id: 'R-20260708-8813', type: 'Transfer In', display_currency: 'PHP', display_amount: 5000, provider_currency_id: 'EVO-CUR-PHP-01', provider_merchant_id: 'EVO-MCH-PHP', provider_currency: 'PHP', provider_amount: 5000, settlement_amount: null, settlement_status: 'pending_daily', settlement_batch_id: '-', wallet_mode: 'Transfer', provider_tx_id: 'GGAP-LEDGER-7781', callback_status: 'not_required', idempotency_key: 'idem-transfer-in-7781', status: 'pending', created_at: '2026/7/8 13:12:02' },
  { tx_id: 'TX-20260708-0004', player_id: 'P-IDR-10022', round_id: 'R-20260708-8812', type: 'Refund', display_currency: 'IDR', display_amount: 300000, provider_currency_id: 'JILI-CUR-IDR-01', provider_merchant_id: 'JILI-MCH-IDR', provider_currency: 'IDR', provider_amount: 300000, settlement_amount: null, settlement_status: 'pending_daily', settlement_batch_id: '-', wallet_mode: 'Seamless', provider_tx_id: 'JL-TX-19381', callback_status: 'retrying', idempotency_key: 'idem-refund-8812', status: 'failed', created_at: '2026/7/8 12:55:47' },
  { tx_id: 'TX-20260708-0005', player_id: 'P-VND-10044', round_id: 'R-20260708-8814', type: 'Balance Sync', display_currency: 'VND', display_amount: 0, provider_currency_id: 'PP-CUR-VND-01', provider_merchant_id: 'PP-MCH-VND', provider_currency: 'VND', provider_amount: 0, settlement_amount: null, settlement_status: 'pending_daily', settlement_batch_id: '-', wallet_mode: 'Seamless', provider_tx_id: 'SYNC-11890', callback_status: 'success', idempotency_key: 'idem-sync-11890', status: 'success', created_at: '2026/7/8 10:02:12' }
]

const filteredRows = computed(() => rows.filter((row) => {
  const text = `${row.tx_id} ${row.player_id} ${row.round_id} ${row.provider_tx_id} ${row.idempotency_key}`.toLowerCase()
  return (!keyword.value || text.includes(keyword.value.toLowerCase())) &&
    (!txType.value || row.type === txType.value) &&
    (!walletMode.value || row.wallet_mode === walletMode.value)
}))

const typeOptions = ['Bet', 'Win', 'Refund', 'Cancel', 'Transfer In', 'Transfer Out', 'Balance Sync'].map(value => ({ label: value, value }))
const walletOptions = ['Seamless', 'Transfer'].map(value => ({ label: value, value }))

const columns: DataTableColumns<LedgerRow> = [
  { title: '交易 ID', key: 'tx_id', width: 155, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.tx_id) },
  { title: '會員 ID', key: 'player_id', width: 130, render: row => h('span', { class: 'font-mono' }, row.player_id) },
  { title: 'Round ID', key: 'round_id', width: 150, render: row => h('span', { class: 'font-mono text-xs' }, row.round_id) },
  {
    title: '類型',
    key: 'type',
    width: 120,
    render: row => h(NTag, { size: 'small', bordered: false, type: row.type === 'Win' ? 'success' : row.type.includes('Transfer') ? 'info' : row.type === 'Refund' ? 'warning' : 'default' }, { default: () => row.type })
  },
  { title: 'Provider 幣別線', key: 'provider_currency_id', width: 155, render: row => h('div', {}, [h(NTag, { size: 'small', bordered: false, type: 'info' }, { default: () => row.provider_currency }), h('div', { class: 'mt-1 font-mono text-xs text-gray-500' }, row.provider_currency_id)]) },
  { title: 'Provider 原幣金額', key: 'provider_amount', width: 155, align: 'right', render: row => `${row.provider_currency} ${row.provider_amount.toLocaleString()}` },
  { title: 'USDT 日結金額', key: 'settlement_amount', width: 145, align: 'right', render: row => row.settlement_amount === null ? h('span', { class: 'text-amber-300' }, '待 00:10 日結') : h('span', { class: row.settlement_amount >= 0 ? 'text-emerald-400' : 'text-red-400' }, `USDT ${row.settlement_amount.toLocaleString()}`) },
  { title: '日結批次', key: 'settlement_batch_id', width: 155, render: row => h('span', { class: 'font-mono text-xs' }, row.settlement_batch_id) },
  { title: 'Wallet 模式', key: 'wallet_mode', width: 120 },
  { title: 'Provider Tx ID', key: 'provider_tx_id', width: 145, render: row => h('span', { class: 'font-mono text-xs' }, row.provider_tx_id) },
  {
    title: 'Callback',
    key: 'callback_status',
    width: 120,
    render: row => {
      const typeMap = { success: 'success', retrying: 'warning', failed: 'error', not_required: 'default' } as const
      const labelMap = { success: '成功', retrying: '重試中', failed: '失敗', not_required: '不需要' }
      return h(NTag, { type: typeMap[row.callback_status], size: 'small', bordered: false }, { default: () => labelMap[row.callback_status] })
    }
  },
  { title: 'Idempotency Key', key: 'idempotency_key', width: 180, ellipsis: { tooltip: true }, render: row => h('span', { class: 'font-mono text-xs' }, row.idempotency_key) },
  {
    title: '狀態',
    key: 'status',
    width: 100,
    render: row => {
      const typeMap = { success: 'success', pending: 'warning', failed: 'error' } as const
      const labelMap = { success: '成功', pending: '待處理', failed: '失敗' }
      return h(NTag, { type: typeMap[row.status], size: 'small', bordered: false }, { default: () => labelMap[row.status] })
    }
  },
  { title: '時間', key: 'created_at', width: 170 }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">交易流水</h1>
      <p class="mt-2 text-sm text-gray-500">
        商戶查看會員逐筆 Bet / Win / Refund / Cancel、Provider 原幣、幣別線、Transfer Wallet 與 USDT 日結快照。
      </p>
    </header>

    <n-card>
      <div class="mb-4 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_160px_auto]">
        <n-input v-model:value="keyword" clearable placeholder="搜尋交易 ID / 會員 / Round ID / Provider Tx ID / Idempotency Key" />
        <n-select v-model:value="txType" clearable placeholder="交易類型" :options="typeOptions" />
        <n-select v-model:value="walletMode" clearable placeholder="Wallet 模式" :options="walletOptions" />
        <n-button tertiary @click="keyword = ''; txType = null; walletMode = null">重置</n-button>
      </div>
      <n-data-table :columns="withTableSorters(columns)" :data="filteredRows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="2020" striped />
    </n-card>
  </div>
</template>
