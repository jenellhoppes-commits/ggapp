<script setup lang="ts">
import { h } from 'vue'
import { NCard, NDataTable, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

interface Row {
  agent_id: string
  agent_name: string
  level: 'L2' | 'L3'
  merchant_count: number
  total_bet: number
  settlement_ggr: number
  receivable: number
  status: 'normal' | 'attention'
}

const rows: Row[] = [
  { agent_id: 'AGT-SEA-SUB01', agent_name: 'SEA Sub Agent 01', level: 'L2', merchant_count: 5, total_bet: 98200, settlement_ggr: 6210, receivable: 546.48, status: 'normal' },
  { agent_id: 'AGT-SEA-SUB01-L3', agent_name: 'SEA Local Desk L3', level: 'L3', merchant_count: 3, total_bet: 38400, settlement_ggr: 1830, receivable: 201.3, status: 'normal' }
]

const columns: DataTableColumns<Row> = [
  { title: '代理 ID', key: 'agent_id', render: (row) => h('span', { class: 'font-mono text-cyan-300' }, row.agent_id) },
  { title: '代理名稱', key: 'agent_name' },
  { title: '層級', key: 'level', width: 90 },
  { title: '商戶數', key: 'merchant_count', width: 100, align: 'right' },
  { title: '總投注額', key: 'total_bet', align: 'right', render: (row) => `USDT ${row.total_bet.toLocaleString()}` },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: (row) => `USDT ${row.settlement_ggr.toLocaleString()}` },
  { title: '應收', key: 'receivable', align: 'right', render: (row) => `USDT ${row.receivable.toLocaleString()}` },
  {
    title: '狀態',
    key: 'status',
    width: 110,
    render: (row) => h(NTag, { type: row.status === 'normal' ? 'success' : 'warning', size: 'small', bordered: false }, { default: () => row.status === 'normal' ? '正常' : '注意' })
  }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">下級代理報表</h1>
      <p class="mt-2 text-sm text-gray-500">查看下級代理的商戶數、投注額、結算 GGR 與代理應收。</p>
    </header>

    <n-card>
      <n-data-table :columns="withTableSorters(columns)" :data="rows" :pagination="DEFAULT_TABLE_PAGINATION" striped />
    </n-card>
  </div>
</template>
