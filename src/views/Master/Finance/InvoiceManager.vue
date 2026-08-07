<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NButton,
  NCard,
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
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DescriptionOutlined, SearchOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type InvoiceType = 'AGENT_RECEIVABLE' | 'PROVIDER_PAYABLE'
type InvoiceStatus = 'pending' | 'confirmed' | 'paid'

interface InvoiceRow {
  invoice_id: string
  invoice_type: InvoiceType
  target_type: 'AGENT' | 'PROVIDER'
  target_id: string
  target_name: string
  period: string
  settlement_currency: 'USDT'
  final_amount: number
  status: InvoiceStatus
  generated_at: string
  confirmed_at?: string
  paid_at?: string
  remark: string
}

const message = useMessage()
const showDetail = ref(false)
const currentRow = ref<InvoiceRow | null>(null)
const searchQuery = ref('')
const typeFilter = ref<InvoiceType | null>(null)
const statusFilter = ref<InvoiceStatus | null>(null)

const rows = ref<InvoiceRow[]>([
  {
    invoice_id: 'INV-AGT-202607-DIRECT',
    invoice_type: 'AGENT_RECEIVABLE',
    target_type: 'AGENT',
    target_id: 'AGT-DIRECT',
    target_name: '平台直營代理',
    period: '2026-07',
    settlement_currency: 'USDT',
    final_amount: 76100,
    status: 'confirmed',
    generated_at: '2026-07-07T09:20:00.000Z',
    confirmed_at: '2026-07-07T10:00:00.000Z',
    remark: '代理應收帳單，來源為代理帳務日結。'
  },
  {
    invoice_id: 'INV-AGT-202607-SEA',
    invoice_type: 'AGENT_RECEIVABLE',
    target_type: 'AGENT',
    target_id: 'AGT-SEA-001',
    target_name: 'SEA Growth Agent',
    period: '2026-07',
    settlement_currency: 'USDT',
    final_amount: 128900,
    status: 'pending',
    generated_at: '2026-07-07T09:25:00.000Z',
    remark: 'L1 代理應收，含下級代理與直屬商戶明細。'
  },
  {
    invoice_id: 'INV-PROV-202607-PG',
    invoice_type: 'PROVIDER_PAYABLE',
    target_type: 'PROVIDER',
    target_id: 'PROV-PG',
    target_name: 'PG Soft',
    period: '2026-07',
    settlement_currency: 'USDT',
    final_amount: 41200,
    status: 'paid',
    generated_at: '2026-07-07T09:40:00.000Z',
    confirmed_at: '2026-07-07T10:30:00.000Z',
    paid_at: '2026-07-07T11:20:00.000Z',
    remark: '供應商應付帳單，不掛代理或商戶。'
  },
  {
    invoice_id: 'INV-PROV-202607-EVO',
    invoice_type: 'PROVIDER_PAYABLE',
    target_type: 'PROVIDER',
    target_id: 'PROV-EVO',
    target_name: 'Evolution',
    period: '2026-07',
    settlement_currency: 'USDT',
    final_amount: 25800,
    status: 'confirmed',
    generated_at: '2026-07-07T09:45:00.000Z',
    confirmed_at: '2026-07-07T10:35:00.000Z',
    remark: '供應商成本帳，依 provider_id + provider_currency_id + original_currency + settlement_currency + period 產生。'
  }
])

const typeMeta: Record<InvoiceType, { label: string; type: 'success' | 'info' }> = {
  AGENT_RECEIVABLE: { label: '代理應收', type: 'success' },
  PROVIDER_PAYABLE: { label: '供應商應付', type: 'info' }
}

const statusMeta: Record<InvoiceStatus, { label: string; type: 'warning' | 'info' | 'success' }> = {
  pending: { label: '待確認', type: 'warning' },
  confirmed: { label: '已確認', type: 'info' },
  paid: { label: '已付款 / 已收款', type: 'success' }
}

const typeOptions = Object.entries(typeMeta).map(([value, meta]) => ({ label: meta.label, value }))
const statusOptions = Object.entries(statusMeta).map(([value, meta]) => ({ label: meta.label, value }))

const filteredRows = computed(() => {
  const text = searchQuery.value.trim().toLowerCase()
  return rows.value.filter(row => {
    const matchesText = !text
      || row.invoice_id.toLowerCase().includes(text)
      || row.target_name.toLowerCase().includes(text)
      || row.target_id.toLowerCase().includes(text)
    const matchesType = !typeFilter.value || row.invoice_type === typeFilter.value
    const matchesStatus = !statusFilter.value || row.status === statusFilter.value
    return matchesText && matchesType && matchesStatus
  })
})

const summary = computed(() => ({
  total: filteredRows.value.length,
  agentReceivable: filteredRows.value.filter(row => row.invoice_type === 'AGENT_RECEIVABLE').reduce((sum, row) => sum + row.final_amount, 0),
  providerPayable: filteredRows.value.filter(row => row.invoice_type === 'PROVIDER_PAYABLE').reduce((sum, row) => sum + row.final_amount, 0),
  pending: filteredRows.value.filter(row => row.status === 'pending').length
}))

const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-TW') : '-'

const openDetail = (row: InvoiceRow) => {
  currentRow.value = row
  showDetail.value = true
}

const markPaid = (row: InvoiceRow) => {
  row.status = 'paid'
  row.paid_at = new Date().toISOString()
  message.success(`${row.invoice_id} 已更新付款 / 收款狀態`)
}

const columns: DataTableColumns<InvoiceRow> = [
  {
    title: '帳單 ID',
    key: 'invoice_id',
    width: 190,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openDetail(row) }, row.invoice_id)
  },
  { title: '帳單類型', key: 'invoice_type', width: 130, render: row => h(NTag, { type: typeMeta[row.invoice_type].type, bordered: false }, { default: () => typeMeta[row.invoice_type].label }) },
  { title: '對象', key: 'target_name', width: 220, render: row => h('div', {}, [h('div', row.target_name), h('div', { class: 'font-mono text-xs text-slate-500' }, `${row.target_type} / ${row.target_id}`)]) },
  { title: '帳期', key: 'period', width: 100 },
  { title: '幣別', key: 'settlement_currency', width: 90, render: row => h(NTag, { type: 'success', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '金額', key: 'final_amount', width: 150, align: 'right', render: row => h(MoneyText, { value: row.final_amount, currency: row.settlement_currency, compact: true, color: 'text-slate-100' }) },
  { title: '狀態', key: 'status', width: 140, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false }, { default: () => statusMeta[row.status].label }) },
  { title: '產生時間', key: 'generated_at', width: 180, render: row => formatDateTime(row.generated_at) },
  {
    title: '操作',
    key: 'action',
    width: 180,
    fixed: 'right',
    render: row => h(NSpace, { size: 6 }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(NIcon, null, { default: () => h(DescriptionOutlined) }), default: () => '詳情' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.status === 'paid', onClick: () => markPaid(row) }, { default: () => row.invoice_type === 'AGENT_RECEIVABLE' ? '收款' : '付款' })
      ]
    })
  }
]
</script>

<template>
  <div class="space-y-5 p-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">帳單管理</h1>
        <p class="mt-1 text-sm text-slate-500">代理應收與供應商應付分開管理，商戶帳單不列為 MVP 正式帳務主體。</p>
      </div>
      <n-button type="primary" @click="message.info('已建立帳單產生演示')">產生帳單</n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="帳單數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="代理應收"><MoneyText :value="summary.agentReceivable" currency="USDT" compact color="text-slate-100" /></n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="供應商應付"><MoneyText :value="summary.providerPayable" currency="USDT" compact color="text-slate-100" /></n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="待確認" :value="summary.pending" /></div>
    </div>

    <n-card>
      <div class="mb-4 flex flex-wrap gap-3">
        <n-input v-model:value="searchQuery" placeholder="搜尋帳單 / 對象" class="w-72" clearable>
          <template #prefix><n-icon :component="SearchOutlined" /></template>
        </n-input>
        <n-select v-model:value="typeFilter" :options="typeOptions" placeholder="帳單類型" class="w-44" clearable />
        <n-select v-model:value="statusFilter" :options="statusOptions" placeholder="狀態" class="w-44" clearable />
      </div>

      <n-data-table
        :columns="withTableSorters(columns)"
        :data="filteredRows"
        :pagination="DEFAULT_TABLE_PAGINATION"
        striped
        :scroll-x="1380"
      />
    </n-card>

    <n-drawer v-model:show="showDetail" :width="620">
      <n-drawer-content :title="currentRow ? `帳單：${currentRow.invoice_id}` : '帳單詳情'" closable>
        <template v-if="currentRow">
          <n-descriptions bordered :column="1" label-placement="left">
            <n-descriptions-item label="帳單類型">{{ typeMeta[currentRow.invoice_type].label }}</n-descriptions-item>
            <n-descriptions-item label="對象">{{ currentRow.target_name }} / {{ currentRow.target_id }}</n-descriptions-item>
            <n-descriptions-item label="帳期">{{ currentRow.period }}</n-descriptions-item>
            <n-descriptions-item label="正式結算幣別">{{ currentRow.settlement_currency }}</n-descriptions-item>
            <n-descriptions-item label="金額"><MoneyText :value="currentRow.final_amount" currency="USDT" color="text-slate-100" /></n-descriptions-item>
            <n-descriptions-item label="狀態">{{ statusMeta[currentRow.status].label }}</n-descriptions-item>
            <n-descriptions-item label="產生時間">{{ formatDateTime(currentRow.generated_at) }}</n-descriptions-item>
            <n-descriptions-item label="確認時間">{{ formatDateTime(currentRow.confirmed_at) }}</n-descriptions-item>
            <n-descriptions-item label="付款 / 收款時間">{{ formatDateTime(currentRow.paid_at) }}</n-descriptions-item>
            <n-descriptions-item label="備註">{{ currentRow.remark }}</n-descriptions-item>
          </n-descriptions>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
