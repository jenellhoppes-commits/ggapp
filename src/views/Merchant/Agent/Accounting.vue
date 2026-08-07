<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NAlert, NCard, NDataTable, NGrid, NGridItem, NStatistic, NTabPane, NTabs, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { calculateAgentReceivable } from '../../../domain/finance'

interface SettlementRow {
  subject_type: '下級代理' | '商戶'
  subject_id: string
  subject_name: string
  level?: 'L2' | 'L3'
  period: string
  provider_id: string
  provider_name: string
  provider_currency_connection_id: string
  display_currency: string
  settlement_currency: 'USDT'
  settlement_ggr: number
  rate: number
  rate_version: string
  receivable: number
  status: 'open' | 'confirmed' | 'paid'
}

interface PlatformPayableRow {
  bill_id: string
  period: string
  settlement_ggr: number
  agent_rate: number
  service_fee_rate: number
  game_charge: number
  service_fee: number
  payable: number
  paid_amount: number
  status: 'pending' | 'confirmed' | 'partially_paid' | 'paid'
}

const activeTab = ref('summary')

const platformRows: PlatformPayableRow[] = [
  { bill_id: 'AGB-202607-001', period: '2026-07', settlement_ggr: 932400, agent_rate: 7.1, service_fee_rate: 0.5, game_charge: 66200.4, service_fee: 4662, payable: 70862.4, paid_amount: 0, status: 'confirmed' },
  { bill_id: 'AGB-202606-001', period: '2026-06', settlement_ggr: 812100, agent_rate: 6.9, service_fee_rate: 0.5, game_charge: 56034.9, service_fee: 4060.5, payable: 60095.4, paid_amount: 60095.4, status: 'paid' }
]

const rows: SettlementRow[] = [
  { subject_type: '下級代理', subject_id: 'AGT-SEA-SUB01', subject_name: 'SEA Sub Agent 01', level: 'L2', period: '2026-08-05', provider_id: 'PG', provider_name: 'PG Soft', provider_currency_connection_id: 'PC-PG-THB', display_currency: 'THB', settlement_currency: 'USDT', settlement_ggr: 42100, rate: 8.8, rate_version: 'AQR-AGT-SEA-SUB01-PG-20260801', receivable: 3704.8, status: 'open' },
  { subject_type: '下級代理', subject_id: 'AGT-SEA-SUB01-L3', subject_name: 'SEA Local Desk L3', level: 'L3', period: '2026-08-05', provider_id: 'JILI', provider_name: 'JILI', provider_currency_connection_id: 'PC-JILI-PHP', display_currency: 'PHP', settlement_currency: 'USDT', settlement_ggr: 18300, rate: 11, rate_version: 'AQR-AGT-SEA-SUB01-L3-JILI-20260801', receivable: 2013, status: 'confirmed' },
  { subject_type: '商戶', subject_id: 'OP-1001', subject_name: 'Blue Whale Interactive', period: '2026-08-05', provider_id: 'PG', provider_name: 'PG Soft', provider_currency_connection_id: 'PC-PG-TWD', display_currency: 'TWD', settlement_currency: 'USDT', settlement_ggr: 27600, rate: 8.5, rate_version: 'MQR-OP1001-PG-20260801', receivable: 2346, status: 'open' },
  { subject_type: '商戶', subject_id: 'OP-1002', subject_name: 'HyperWin Network', period: '2026-08-05', provider_id: 'PP', provider_name: 'Pragmatic Play', provider_currency_connection_id: 'PC-PP-VND', display_currency: 'VND', settlement_currency: 'USDT', settlement_ggr: 39200, rate: 9.2, rate_version: 'MQR-OP1002-PP-20260801', receivable: 3606.4, status: 'paid' }
]

const childRows = computed(() => rows.filter(row => row.subject_type === '下級代理'))
const merchantRows = computed(() => rows.filter(row => row.subject_type === '商戶'))
const settlementBreakdown = (row: SettlementRow) => calculateAgentReceivable(row.settlement_ggr, row.rate / 100, 0)
const finalSettlementReceivable = (row: SettlementRow) => settlementBreakdown(row).finalAgentReceivable
const agentPayable = computed(() => platformRows.filter(row => row.status !== 'paid').reduce((sum, row) => sum + row.payable - row.paid_amount, 0))
const childReceivable = computed(() => childRows.value.reduce((sum, row) => sum + finalSettlementReceivable(row), 0))
const merchantReceivable = computed(() => merchantRows.value.reduce((sum, row) => sum + finalSettlementReceivable(row), 0))
const totalReceivable = computed(() => childReceivable.value + merchantReceivable.value)

const statusLabel = {
  open: '可開帳',
  confirmed: '已確認',
  paid: '已收款',
  pending: '待確認',
  partially_paid: '部分付款'
}

const platformStatusLabel = {
  pending: '待確認',
  confirmed: '已確認',
  partially_paid: '部分付款',
  paid: '已付款'
}

const statusType = {
  open: 'warning',
  confirmed: 'info',
  paid: 'success',
  pending: 'warning',
  partially_paid: 'warning'
} as const

const settlementColumns: DataTableColumns<SettlementRow> = [
  { title: '結算對象', key: 'subject_type', width: 110, render: row => h(NTag, { type: row.subject_type === '商戶' ? 'success' : 'info', size: 'small', bordered: false }, { default: () => row.subject_type }) },
  { title: '代碼', key: 'subject_id', width: 135, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.subject_id) },
  { title: '名稱', key: 'subject_name', minWidth: 180 },
  { title: '層級', key: 'level', width: 80, render: row => row.level || '-' },
  { title: '帳期', key: 'period', width: 105 },
  { title: '供應商', key: 'provider_name', width: 125 },
  { title: '幣別線', key: 'provider_currency_connection_id', width: 145, render: row => h('span', { class: 'font-mono text-xs' }, row.provider_currency_connection_id) },
  { title: '交易幣別', key: 'display_currency', width: 100 },
  { title: '結算幣別', key: 'settlement_currency', width: 100, render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '結算 GGR', key: 'settlement_ggr', width: 130, align: 'right', render: row => `USDT ${row.settlement_ggr.toLocaleString()}` },
  { title: '供應商對應費率', key: 'rate', width: 135, align: 'right', render: row => `${row.rate}%` },
  { title: '費率版本', key: 'rate_version', width: 220, render: row => h('span', { class: 'font-mono text-xs' }, row.rate_version) },
  { title: '最終應收', key: 'receivable', width: 135, align: 'right', render: row => h('span', { class: 'text-emerald-400' }, `USDT ${finalSettlementReceivable(row).toLocaleString()}`) },
  { title: '狀態', key: 'status', width: 105, render: row => h(NTag, { type: statusType[row.status], size: 'small', bordered: false }, { default: () => statusLabel[row.status] }) }
]

const platformColumns: DataTableColumns<PlatformPayableRow> = [
  { title: '帳單編號', key: 'bill_id', width: 150, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.bill_id) },
  { title: '帳期', key: 'period', width: 105 },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: row => `USDT ${row.settlement_ggr.toLocaleString()}` },
  { title: '代理遊戲費率', key: 'agent_rate', width: 120, align: 'right', render: row => `${row.agent_rate}%` },
  { title: 'GGAP 匯率服務費率', key: 'service_fee_rate', width: 155, align: 'right', render: row => `${row.service_fee_rate}%` },
  { title: '代理遊戲費', key: 'game_charge', align: 'right', render: row => `USDT ${row.game_charge.toLocaleString()}` },
  { title: '匯率服務費', key: 'service_fee', align: 'right', render: row => `USDT ${row.service_fee.toLocaleString()}` },
  { title: '應付 GGAP', key: 'payable', align: 'right', render: row => h('span', { class: 'text-amber-300' }, `USDT ${row.payable.toLocaleString()}`) },
  { title: '已付款', key: 'paid_amount', align: 'right', render: row => `USDT ${row.paid_amount.toLocaleString()}` },
  { title: '未付', key: 'unpaid', align: 'right', render: row => `USDT ${(row.payable - row.paid_amount).toLocaleString()}` },
  { title: '狀態', key: 'status', width: 120, render: row => h(NTag, { type: statusType[row.status], size: 'small', bordered: false }, { default: () => platformStatusLabel[row.status] }) }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">代理帳務</h1>
      <p class="mt-2 text-sm text-gray-500">
        代理查看對 GGAP 的平台應付、下級代理結算與商戶結算；供應商結算不在代理帳務內處理。
      </p>
    </header>

    <n-alert type="info" :show-icon="false" class="!bg-[#14283a]">
      平台正式只對代理收款；代理再依下級代理與商戶報價自行收款。此頁保留下級代理結算與商戶結算，方便後續代理報表直接使用。
    </n-alert>

    <n-grid cols="1 m:2 l:4" :x-gap="16" :y-gap="16" responsive="screen">
      <n-grid-item><n-card><n-statistic label="應付 GGAP" :value="`USDT ${agentPayable.toLocaleString()}`" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="下級代理應收" :value="`USDT ${childReceivable.toLocaleString()}`" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="商戶應收" :value="`USDT ${merchantReceivable.toLocaleString()}`" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="可收總額" :value="`USDT ${totalReceivable.toLocaleString()}`" /></n-card></n-grid-item>
    </n-grid>

    <n-card>
      <n-tabs v-model:value="activeTab" type="line" animated>
        <n-tab-pane name="summary" tab="總覽">
          <div class="grid gap-4 md:grid-cols-3">
            <n-card size="small" title="平台應付">
              <p class="text-sm text-gray-400">本代理需支付 GGAP 的正式帳單金額，以 USDT 結算。</p>
              <p class="mt-3 text-xl font-bold text-amber-300">USDT {{ agentPayable.toLocaleString() }}</p>
            </n-card>
            <n-card size="small" title="下級代理結算">
              <p class="text-sm text-gray-400">下級代理應付給本代理的結算來源。</p>
              <p class="mt-3 text-xl font-bold text-emerald-400">USDT {{ childReceivable.toLocaleString() }}</p>
            </n-card>
            <n-card size="small" title="商戶結算">
              <p class="text-sm text-gray-400">直屬或代理樹商戶應付給代理的參考應收。</p>
              <p class="mt-3 text-xl font-bold text-emerald-400">USDT {{ merchantReceivable.toLocaleString() }}</p>
            </n-card>
          </div>
        </n-tab-pane>

        <n-tab-pane name="platform" tab="平台應付">
          <n-data-table :columns="withTableSorters(platformColumns)" :data="platformRows" :scroll-x="1380" :pagination="DEFAULT_TABLE_PAGINATION" striped />
        </n-tab-pane>

        <n-tab-pane name="children" tab="下級代理結算">
          <n-data-table :columns="withTableSorters(settlementColumns)" :data="childRows" :scroll-x="1780" :pagination="DEFAULT_TABLE_PAGINATION" striped />
        </n-tab-pane>

        <n-tab-pane name="merchants" tab="商戶結算">
          <n-data-table :columns="withTableSorters(settlementColumns)" :data="merchantRows" :scroll-x="1780" :pagination="DEFAULT_TABLE_PAGINATION" striped />
        </n-tab-pane>

        <n-tab-pane name="records" tab="操作紀錄">
          <div class="space-y-3 text-sm text-gray-400">
            <p><span class="text-emerald-400">●</span> 2026/7/7 09:00 產生代理日結來源</p>
            <p><span class="text-emerald-400">●</span> 2026/7/7 09:20 建立平台應付帳單</p>
            <p><span class="text-emerald-400">●</span> 2026/7/7 09:40 更新下級代理與商戶結算摘要</p>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>
