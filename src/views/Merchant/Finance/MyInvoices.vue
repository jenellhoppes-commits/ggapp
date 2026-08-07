<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NAlert, NButton, NCard, NDataTable, NGrid, NGridItem, NStatistic, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import DemoActionModal from '../../../components/Portal/DemoActionModal.vue'
import type { DemoField, DemoSection } from '../../../components/Portal/DemoActionModal.vue'

interface AgentInvoiceRow {
  invoice_id: string
  period: string
  settlement_currency: 'USDT'
  settlement_ggr: number
  ggap_receivable: number
  paid_amount: number
  unpaid_amount: number
  status: 'pending' | 'confirmed' | 'partial' | 'paid'
}

interface MerchantAccountingRow {
  period: string
  provider_id: string
  provider_name: string
  provider_currency_connection_id: string
  display_currency: string
  display_ggr: number
  settlement_currency: 'USDT'
  settlement_ggr: number
  merchant_quote_rate: number
  rate_version: string
  payable_to_agent: number
  status: 'open' | 'confirmed' | 'paid'
}

const route = useRoute()
const isAgentPortal = computed(() => route.path.startsWith('/agent'))
const showDetail = ref(false)
const detailType = ref<'agent' | 'merchant'>('agent')
const selectedAgentInvoice = ref<AgentInvoiceRow | null>(null)
const selectedMerchantAccounting = ref<MerchantAccountingRow | null>(null)

const agentRows: AgentInvoiceRow[] = [
  { invoice_id: 'AGB-202607-001', period: '2026-07', settlement_currency: 'USDT', settlement_ggr: 932400, ggap_receivable: 71400, paid_amount: 0, unpaid_amount: 71400, status: 'confirmed' },
  { invoice_id: 'AGB-202606-001', period: '2026-06', settlement_currency: 'USDT', settlement_ggr: 812100, ggap_receivable: 60000, paid_amount: 30000, unpaid_amount: 30000, status: 'partial' },
  { invoice_id: 'AGB-202605-001', period: '2026-05', settlement_currency: 'USDT', settlement_ggr: 774000, ggap_receivable: 57000, paid_amount: 57000, unpaid_amount: 0, status: 'paid' }
]

const merchantRows: MerchantAccountingRow[] = [
  { period: '2026-08-05', provider_id: 'PG', provider_name: 'PG Soft', provider_currency_connection_id: 'PC-PG-TWD', display_currency: 'TWD', display_ggr: 318000, settlement_currency: 'USDT', settlement_ggr: 9820, merchant_quote_rate: 8.5, rate_version: 'MQR-OP1001-PG-20260801', payable_to_agent: 834.7, status: 'open' },
  { period: '2026-08-05', provider_id: 'JILI', provider_name: 'JILI', provider_currency_connection_id: 'PC-JILI-PHP', display_currency: 'PHP', display_ggr: 142000, settlement_currency: 'USDT', settlement_ggr: 2420, merchant_quote_rate: 10.2, rate_version: 'MQR-OP1001-JILI-20260801', payable_to_agent: 246.84, status: 'confirmed' },
  { period: '2026-08-04', provider_id: 'PP', provider_name: 'Pragmatic Play', provider_currency_connection_id: 'PC-PP-VND', display_currency: 'VND', display_ggr: -2200000, settlement_currency: 'USDT', settlement_ggr: -134.2, merchant_quote_rate: 9.0, rate_version: 'MQR-OP1001-PP-20260801', payable_to_agent: 0, status: 'paid' }
]

const statusLabel = {
  pending: '待確認',
  confirmed: '已確認',
  partial: '部分收款',
  paid: '已收款',
  open: '可開帳'
}

const statusType = {
  pending: 'warning',
  confirmed: 'info',
  partial: 'warning',
  paid: 'success',
  open: 'warning'
} as const

const agentUnpaid = computed(() => agentRows.reduce((sum, row) => sum + row.unpaid_amount, 0))
const agentReceivable = computed(() => agentRows.reduce((sum, row) => sum + row.ggap_receivable, 0))
const merchantPayable = computed(() => merchantRows.reduce((sum, row) => sum + row.payable_to_agent, 0))
const merchantSettlementGgr = computed(() => merchantRows.reduce((sum, row) => sum + row.settlement_ggr, 0))

const openAgentInvoice = (row: AgentInvoiceRow) => {
  selectedAgentInvoice.value = row
  selectedMerchantAccounting.value = null
  detailType.value = 'agent'
  showDetail.value = true
}

const openMerchantAccounting = (row: MerchantAccountingRow) => {
  selectedMerchantAccounting.value = row
  selectedAgentInvoice.value = null
  detailType.value = 'merchant'
  showDetail.value = true
}

const detailTitle = computed(() => detailType.value === 'agent'
  ? `平台帳單詳情 - ${selectedAgentInvoice.value?.invoice_id || ''}`
  : `帳務參考詳情 - ${selectedMerchantAccounting.value?.period || ''}`)

const detailSubtitle = computed(() => detailType.value === 'agent'
  ? '代理查看 GGAP 對代理開立的正式應收帳單、收款狀態與結算依據。'
  : '商戶端僅展示自身營運帳務參考，正式收款與帳單由代理自行處理。')

const detailFields = computed<DemoField[]>(() => {
  if (detailType.value === 'agent' && selectedAgentInvoice.value) {
    const row = selectedAgentInvoice.value
    return [
      { label: '帳單編號', value: row.invoice_id },
      { label: '帳期', value: row.period },
      { label: '正式幣別', value: row.settlement_currency, tag: 'success' },
      { label: '結算 GGR', value: `USDT ${row.settlement_ggr.toLocaleString()}` },
      { label: 'GGAP 應收', value: `USDT ${row.ggap_receivable.toLocaleString()}`, tag: 'warning' },
      { label: '已收金額', value: `USDT ${row.paid_amount.toLocaleString()}` },
      { label: '未收金額', value: `USDT ${row.unpaid_amount.toLocaleString()}`, tag: row.unpaid_amount > 0 ? 'error' : 'success' },
      { label: '狀態', value: statusLabel[row.status], tag: statusType[row.status] }
    ]
  }

  if (selectedMerchantAccounting.value) {
    const row = selectedMerchantAccounting.value
    return [
      { label: '帳期', value: row.period },
      { label: '供應商', value: `${row.provider_name} / ${row.provider_id}` },
      { label: '供應商幣別線', value: row.provider_currency_connection_id },
      { label: '交易幣別', value: row.display_currency },
      { label: '原幣 GGR', value: `${row.display_currency} ${row.display_ggr.toLocaleString()}` },
      { label: '正式幣別', value: row.settlement_currency, tag: 'success' },
      { label: 'USDT 結算 GGR', value: `USDT ${row.settlement_ggr.toLocaleString()}` },
      { label: '商戶應繳費率', value: `${row.merchant_quote_rate}%` },
      { label: '費率版本', value: row.rate_version },
      { label: '對代理應付參考', value: `USDT ${row.payable_to_agent.toLocaleString()}`, tag: 'warning' },
      { label: '狀態', value: statusLabel[row.status], tag: statusType[row.status] }
    ]
  }

  return []
})

const detailSections = computed<DemoSection[]>(() => detailType.value === 'agent'
  ? [{
      title: '帳單拆分',
      fields: [
        { label: '代理應收來源', value: '代理底下商戶日結彙總' },
        { label: '供應商帳單', value: '不在代理帳單內處理', tag: 'info' },
        { label: '正式收款對象', value: '代理', tag: 'success' },
        { label: '匯率服務費', value: '已併入代理應收明細' }
      ]
    }]
  : [{
      title: '商戶端帳務定位',
      fields: [
        { label: 'GGAP 正式開帳', value: '否', tag: 'warning' },
        { label: '代理對商戶收款', value: '由代理自行處理' },
        { label: '本頁用途', value: '營運對帳與金額參考' },
        { label: '正式結算幣別', value: 'USDT', tag: 'success' }
      ]
    }])

const agentColumns: DataTableColumns<AgentInvoiceRow> = [
  { title: '帳單編號', key: 'invoice_id', width: 150, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.invoice_id) },
  { title: '帳期', key: 'period', width: 110 },
  { title: '結算幣別', key: 'settlement_currency', width: 100, render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: row => `USDT ${row.settlement_ggr.toLocaleString()}` },
  { title: 'GGAP 應收', key: 'ggap_receivable', align: 'right', render: row => h('span', { class: 'text-amber-300' }, `USDT ${row.ggap_receivable.toLocaleString()}`) },
  { title: '已收金額', key: 'paid_amount', align: 'right', render: row => `USDT ${row.paid_amount.toLocaleString()}` },
  { title: '未收金額', key: 'unpaid_amount', align: 'right', render: row => h('span', { class: row.unpaid_amount > 0 ? 'text-red-300' : 'text-emerald-400' }, `USDT ${row.unpaid_amount.toLocaleString()}`) },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusType[row.status], size: 'small', bordered: false }, { default: () => statusLabel[row.status] }) },
  { title: '操作', key: 'actions', width: 140, render: row => h(NButton, { size: 'small', secondary: true, onClick: () => openAgentInvoice(row) }, { default: () => '查看詳情' }) }
]

const merchantColumns: DataTableColumns<MerchantAccountingRow> = [
  { title: '帳期', key: 'period', width: 120 },
  { title: '供應商', key: 'provider_name', width: 135 },
  { title: '幣別線', key: 'provider_currency_connection_id', width: 145, render: row => h('span', { class: 'font-mono text-xs' }, row.provider_currency_connection_id) },
  { title: '交易幣別', key: 'display_currency', width: 100 },
  { title: '原幣 GGR', key: 'display_ggr', align: 'right', render: row => `${row.display_currency} ${row.display_ggr.toLocaleString()}` },
  { title: '結算幣別', key: 'settlement_currency', width: 100, render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency }) },
  { title: 'USDT 結算 GGR', key: 'settlement_ggr', align: 'right', render: row => h('span', { class: row.settlement_ggr >= 0 ? 'text-emerald-400' : 'text-red-400' }, `USDT ${row.settlement_ggr.toLocaleString()}`) },
  { title: '商戶應繳費率', key: 'merchant_quote_rate', width: 130, align: 'right', render: row => `${row.merchant_quote_rate}%` },
  { title: '費率版本', key: 'rate_version', width: 205, render: row => h('span', { class: 'font-mono text-xs' }, row.rate_version) },
  { title: '對代理應付參考', key: 'payable_to_agent', align: 'right', render: row => h('span', { class: 'text-amber-300' }, `USDT ${row.payable_to_agent.toLocaleString()}`) },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusType[row.status], size: 'small', bordered: false }, { default: () => statusLabel[row.status] }) },
  { title: '操作', key: 'actions', width: 130, fixed: 'right', render: row => h(NButton, { size: 'small', secondary: true, onClick: () => openMerchantAccounting(row) }, { default: () => '查看詳情' }) }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">{{ isAgentPortal ? '平台帳單' : '錢包與帳務參考' }}</h1>
      <p class="mt-2 text-sm text-gray-500">
        <template v-if="isAgentPortal">代理查看 GGAP 對自己的正式應收帳單與收款狀態，正式結算幣別為 USDT。</template>
        <template v-else>商戶查看自身錢包模式、交易日結與對代理應付參考；商戶不是 GGAP 正式開帳對象。</template>
      </p>
    </header>

    <n-alert v-if="!isAgentPortal" type="warning" :show-icon="false" class="!bg-[#3a2b14]">
      商戶端金額僅作營運與對代理帳務參考；GGAP 正式收款對象為代理，商戶正式帳單由代理自行對商戶處理。
    </n-alert>
    <n-alert v-else type="info" :show-icon="false" class="!bg-[#14283a]">
      供應商帳單不會出現在代理端；供應商結算由 GGAP 平台自行處理。
    </n-alert>

    <template v-if="isAgentPortal">
      <n-grid cols="1 m:2 l:4" :x-gap="16" :y-gap="16" responsive="screen">
        <n-grid-item><n-card><n-statistic label="帳單總額" :value="`USDT ${agentReceivable.toLocaleString()}`" /></n-card></n-grid-item>
        <n-grid-item><n-card><n-statistic label="未收金額" :value="`USDT ${agentUnpaid.toLocaleString()}`" /></n-card></n-grid-item>
        <n-grid-item><n-card><n-statistic label="正式幣別" value="USDT" /></n-card></n-grid-item>
        <n-grid-item><n-card><n-statistic label="帳單數" :value="agentRows.length" /></n-card></n-grid-item>
      </n-grid>

      <n-card title="平台帳單">
        <n-data-table :columns="withTableSorters(agentColumns)" :data="agentRows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1180" striped />
      </n-card>
    </template>

    <template v-else>
      <n-grid cols="1 m:2 l:4" :x-gap="16" :y-gap="16" responsive="screen">
        <n-grid-item><n-card><n-statistic label="錢包模式" value="Seamless / Transfer" /></n-card></n-grid-item>
        <n-grid-item><n-card><n-statistic label="USDT 結算 GGR" :value="`USDT ${merchantSettlementGgr.toLocaleString()}`" /></n-card></n-grid-item>
        <n-grid-item><n-card><n-statistic label="對代理應付參考" :value="`USDT ${merchantPayable.toLocaleString()}`" /></n-card></n-grid-item>
        <n-grid-item><n-card><n-statistic label="正式開帳對象" value="代理" /></n-card></n-grid-item>
      </n-grid>

      <n-card title="交易日結摘要">
        <n-data-table :columns="withTableSorters(merchantColumns)" :data="merchantRows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1580" striped />
      </n-card>
    </template>
    <demo-action-modal
      v-model:show="showDetail"
      :title="detailTitle"
      :subtitle="detailSubtitle"
      :fields="detailFields"
      :sections="detailSections"
      :notice="detailType === 'agent' ? '供應商帳單由 GGAP 與供應商自行處理，不會掛在代理帳單底下。' : '商戶端金額不是 GGAP 正式應收，只作代理與商戶溝通參考。'"
      :timeline="detailType === 'agent' ? ['產生日結來源', '建立代理應收帳單', '等待代理收款或部分收款'] : ['交易日結鎖定', '換算 USDT 參考金額', '代理可依商戶報價收款']"
    />
  </div>
</template>
