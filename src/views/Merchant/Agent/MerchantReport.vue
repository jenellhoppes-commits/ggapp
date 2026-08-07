<script setup lang="ts">
import { h } from 'vue'
import { NCard, NDataTable, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

interface Row {
  merchant_id: string
  merchant_name: string
  display_currency: string
  total_bet: number
  settlement_ggr: number
  receivable: number
  status: 'normal' | 'watch'
}

const rows: Row[] = [
  { merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', display_currency: 'TWD', total_bet: 42100, settlement_ggr: 3180, receivable: 270.3, status: 'normal' },
  { merchant_id: 'OP-1002', merchant_name: 'HyperWin Network', display_currency: 'IDR', total_bet: 58200, settlement_ggr: 4960, receivable: 456.3, status: 'normal' },
  { merchant_id: 'OP-1003', merchant_name: 'Lucky Star Digital', display_currency: 'THB', total_bet: 12800, settlement_ggr: -430, receivable: 0, status: 'watch' }
]

const columns: DataTableColumns<Row> = [
  { title: '商戶代碼', key: 'merchant_id', render: (row) => h('span', { class: 'font-mono text-cyan-300' }, row.merchant_id) },
  { title: '商戶名稱', key: 'merchant_name' },
  { title: '交易幣別', key: 'display_currency', width: 110 },
  { title: '總投注額', key: 'total_bet', align: 'right', render: (row) => `USDT ${row.total_bet.toLocaleString()}` },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: (row) => `USDT ${row.settlement_ggr.toLocaleString()}` },
  { title: '代理應收', key: 'receivable', align: 'right', render: (row) => `USDT ${row.receivable.toLocaleString()}` },
  {
    title: '狀態',
    key: 'status',
    width: 100,
    render: (row) => h(NTag, { type: row.status === 'normal' ? 'success' : 'warning', size: 'small', bordered: false }, { default: () => row.status === 'normal' ? '正常' : '觀察' })
  }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">商戶報表</h1>
      <p class="mt-2 text-sm text-gray-500">查看代理底下商戶的投注額、結算 GGR 與代理應收明細。</p>
    </header>

    <n-card>
      <n-data-table :columns="withTableSorters(columns)" :data="rows" :pagination="DEFAULT_TABLE_PAGINATION" striped />
    </n-card>
  </div>
</template>
