<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NCard, NDataTable, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import DemoActionModal from '../../../components/Portal/DemoActionModal.vue'
import type { DemoField, DemoSection } from '../../../components/Portal/DemoActionModal.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

interface CallbackLogRow {
  callback_id: string
  event_type: 'Bet' | 'Win' | 'Refund'
  round_id: string
  player_id: string
  url: string
  http_status: number
  retry_count: number
  status: 'success' | 'failed' | 'retrying'
  transaction_currency: string
  transaction_amount: number
  original_trade_date: string
  accounting_date: string
  late_accounting_status: 'on_time' | 'next_period_adjustment'
  adjustment_batch_id?: string
  last_sent_at: string
}

const message = useMessage()
const showDetail = ref(false)
const selectedRow = ref<CallbackLogRow | null>(null)

const rows: CallbackLogRow[] = [
  { callback_id: 'CB-0001', event_type: 'Bet', round_id: 'R-20260708-8811', player_id: 'P-TWD-10001', url: 'https://merchant.example.com/callback', http_status: 200, retry_count: 0, status: 'success', transaction_currency: 'TWD', transaction_amount: 3200, original_trade_date: '2026-07-08', accounting_date: '2026-07-08', late_accounting_status: 'on_time', last_sent_at: '2026/7/8 13:41:12' },
  { callback_id: 'CB-0002', event_type: 'Win', round_id: 'R-20260708-8811', player_id: 'P-TWD-10001', url: 'https://merchant.example.com/callback', http_status: 504, retry_count: 2, status: 'retrying', transaction_currency: 'TWD', transaction_amount: 5400, original_trade_date: '2026-07-08', accounting_date: '2026-07-08', late_accounting_status: 'on_time', last_sent_at: '2026/7/8 13:43:20' },
  { callback_id: 'CB-0003', event_type: 'Refund', round_id: 'R-20260707-8813', player_id: 'P-PHP-10018', url: 'https://merchant.example.com/callback', http_status: 500, retry_count: 5, status: 'failed', transaction_currency: 'PHP', transaction_amount: 1800, original_trade_date: '2026-07-07', accounting_date: '2026-07-08', late_accounting_status: 'next_period_adjustment', adjustment_batch_id: 'ADJ-20260708-LATE-001', last_sent_at: '2026/7/8 11:21:08' }
]

const statusTypeMap = { success: 'success', failed: 'error', retrying: 'warning' } as const
const statusLabelMap = { success: '成功', failed: '失敗', retrying: '重送中' }

const openDetail = (row: CallbackLogRow) => {
  selectedRow.value = row
  showDetail.value = true
}

const handleRetry = (row: CallbackLogRow) => {
  selectedRow.value = row
  showDetail.value = true
  message.info(`演示：已排入 ${row.callback_id} 重送佇列。`)
}

const detailFields = computed<DemoField[]>(() => {
  if (!selectedRow.value) return []
  return [
    { label: 'Callback ID', value: selectedRow.value.callback_id },
    { label: '事件類型', value: selectedRow.value.event_type },
    { label: 'Round ID', value: selectedRow.value.round_id },
    { label: '會員 ID', value: selectedRow.value.player_id },
    { label: '交易原幣金額', value: `${selectedRow.value.transaction_currency} ${selectedRow.value.transaction_amount.toLocaleString()}` },
    { label: 'HTTP', value: selectedRow.value.http_status },
    { label: '狀態', value: statusLabelMap[selectedRow.value.status], tag: statusTypeMap[selectedRow.value.status] }
  ]
})

const detailSections = computed<DemoSection[]>(() => {
  if (!selectedRow.value) return []
  return [
    {
      title: 'Callback 目標',
      fields: [
        { label: 'URL', value: selectedRow.value.url },
        { label: '重試次數', value: selectedRow.value.retry_count },
        { label: '最後送出', value: selectedRow.value.last_sent_at },
        { label: '冪等鍵', value: `callback_${selectedRow.value.callback_id}` }
      ]
    },
    {
      title: 'Payload 摘要',
      fields: [
        { label: 'amount_mode', value: 'transaction_currency' },
        { label: 'transaction_currency', value: selectedRow.value.transaction_currency },
        { label: 'transaction_amount', value: selectedRow.value.transaction_amount },
        { label: 'signature', value: 'HMAC-SHA256' }
      ]
    },
    {
      title: '帳期歸屬',
      fields: [
        { label: '原交易日', value: selectedRow.value.original_trade_date },
        { label: '入帳日', value: selectedRow.value.accounting_date },
        { label: '延遲處理', value: selectedRow.value.late_accounting_status },
        { label: '調整批次', value: selectedRow.value.adjustment_batch_id || '-' }
      ]
    }
  ]
})

const columns: DataTableColumns<CallbackLogRow> = [
  { title: 'Callback ID', key: 'callback_id', width: 130, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.callback_id) },
  { title: '事件', key: 'event_type', width: 100 },
  { title: 'Round ID', key: 'round_id', width: 150, render: row => h('span', { class: 'font-mono' }, row.round_id) },
  { title: '會員 ID', key: 'player_id', width: 130, render: row => h('span', { class: 'font-mono' }, row.player_id) },
  { title: 'URL', key: 'url', minWidth: 250, ellipsis: { tooltip: true } },
  { title: 'HTTP', key: 'http_status', width: 90, align: 'right' },
  { title: '重試', key: 'retry_count', width: 90, align: 'right' },
  {
    title: '狀態',
    key: 'status',
    width: 110,
    render: row => h(NTag, { type: statusTypeMap[row.status], size: 'small', bordered: false }, { default: () => statusLabelMap[row.status] })
  },
  { title: '最後送出', key: 'last_sent_at', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 170,
    fixed: 'right',
    render: row => h('div', { class: 'flex flex-wrap gap-2' }, [
      h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { default: () => '查看' }),
      h(NButton, { size: 'small', secondary: true, disabled: row.status === 'success', onClick: () => handleRetry(row) }, { default: () => '重送' })
    ])
  }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">Callback 紀錄</h1>
      <p class="mt-2 text-sm text-gray-500">查詢商戶 Callback 送出狀態、HTTP 回應、重試次數與最後送出時間。</p>
    </header>

    <n-card>
      <n-data-table :columns="withTableSorters(columns)" :data="rows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1220" striped />
    </n-card>

    <demo-action-modal
      v-model:show="showDetail"
      :title="`Callback 詳情 - ${selectedRow?.callback_id || ''}`"
      subtitle="展示 Callback 原幣金額、重送狀態與帳期歸屬。"
      notice="Callback 使用會員與 Provider 幣別線的交易原幣；帳期鎖定後才收到的事件不自動重開，改以次期調整批次入帳。"
      :fields="detailFields"
      :sections="detailSections"
      :timeline="['建立 Callback 任務', '送出至商戶 URL', '記錄 HTTP 回應', '失敗時進入重送佇列']"
    />
  </div>
</template>
