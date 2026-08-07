<script setup lang="ts">
import { h } from 'vue'
import { NCard, NDataTable, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

interface ApiDocRow {
  name: string
  method: 'GET' | 'POST'
  path: string
  description: string
  scope: string
}

const rows: ApiDocRow[] = [
  { name: 'Launch Game', method: 'POST', path: '/api/v2/game/launch', description: '建立遊戲入口，帶入 transaction_currency，並鎖定 Provider 幣別線與下注限額方案版本。', scope: '商戶' },
  { name: 'Get Balance', method: 'POST', path: '/api/v2/wallet/balance', description: 'Seamless Wallet 查詢會員餘額。', scope: '商戶' },
  { name: 'Bet Callback', method: 'POST', path: '/callback/bet', description: '投注扣款 Callback，需支援冪等。', scope: '商戶' },
  { name: 'Win Callback', method: 'POST', path: '/callback/win', description: '派彩入款 Callback，保留 display 與 settlement 金額。', scope: '商戶' },
  { name: 'Refund / Cancel', method: 'POST', path: '/callback/refund', description: '退款或取消注單處理。', scope: '商戶' },
  { name: 'Transfer Ledger', method: 'GET', path: '/api/v2/transfer/ledger', description: 'Transfer Wallet 轉點流水查詢。', scope: '商戶' },
  { name: 'Callback Logs', method: 'GET', path: '/api/v2/callback/logs', description: '查詢 Callback 發送、重試與 HTTP 回應紀錄。', scope: '商戶' }
]

const columns: DataTableColumns<ApiDocRow> = [
  { title: '文件名稱', key: 'name', minWidth: 150 },
  {
    title: 'Method',
    key: 'method',
    width: 100,
    render: row => h(NTag, { type: row.method === 'POST' ? 'success' : 'info', size: 'small', bordered: false }, { default: () => row.method })
  },
  { title: 'Endpoint', key: 'path', minWidth: 210, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.path) },
  { title: '說明', key: 'description', minWidth: 280 },
  { title: '可見範圍', key: 'scope', width: 110 }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">API 文件</h1>
      <p class="mt-2 text-sm text-gray-500">商戶串接 GGAP 遊戲、錢包、Transfer Wallet 與 Callback 的文件入口。</p>
    </header>

    <n-card>
      <n-data-table :columns="withTableSorters(columns)" :data="rows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="900" striped />
    </n-card>
  </div>
</template>
