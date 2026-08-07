<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NAlert,
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NStatistic,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem,
  useDialog,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { ReceiptLongOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { calculateProviderPayable } from '../../../domain/finance'
import type { NegativeGgrPolicy } from '../../../domain/finance'

type AccountingStatus = 'draft' | 'matched' | 'difference' | 'locked'
type InvoiceStatus = 'none' | 'pending' | 'confirmed' | 'voided'
type PaymentStatus = 'unpaid' | 'partial' | 'paid'

interface ProviderReconcileItem {
  source: string
  provider_bet: number
  provider_win: number
  provider_ggr: number
  platform_bet: number
  platform_win: number
  platform_ggr: number
  diff_amount: number
  status: 'matched' | 'difference' | 'resolved'
}

interface ProviderDifferenceResolution {
  resolution_id: string
  original_diff_amount: number
  cost_adjustment_amount: number
  reason: string
  operator: string
  resolved_at: string
  trace_id: string
}

interface ProviderPayment {
  payment_no: string
  paid_at: string
  amount_original: number
  original_currency: string
  amount_usdt: number
  tx_hash: string
  operator: string
}

interface ProviderAccountingLog {
  action: string
  operated_at: string
  operator: string
  trace_id: string
}

interface ProviderAccountingRow {
  settlement_id: string
  provider_id: string
  provider_code: string
  provider_name: string
  provider_currency_connection_id: string
  provider_currency_id: string
  original_currency: string
  provider_report_ggr_original: number
  exchange_rate_id: string
  exchange_rate: number
  settlement_batch_id: string
  period: string
  settlement_currency: 'USDT'
  invoice_currency: string
  payment_currency: string
  provider_rate_version: string
  provider_cost_rate: number
  negative_ggr_policy: NegativeGgrPolicy
  opening_carry_forward: number
  applied_carry_forward: number
  closing_carry_forward: number
  fixed_fee: number
  provider_report_ggr_usdt: number
  platform_snapshot_ggr_usdt: number
  diff_amount: number
  adjustment_amount: number
  provider_cost: number
  payable_amount: number
  paid_amount: number
  accounting_status: AccountingStatus
  invoice_no?: string
  invoice_amount_usdt?: number
  invoice_amount_original?: number
  invoice_exchange_rate?: number
  invoice_created_at?: string
  invoice_status: InvoiceStatus
  payment_status: PaymentStatus
  locked_at?: string
  updated_at: string
  reconcile_items: ProviderReconcileItem[]
  difference_resolutions?: ProviderDifferenceResolution[]
  payments: ProviderPayment[]
  logs: ProviderAccountingLog[]
}

const message = useMessage()
const dialog = useDialog()
const PAYMENT_TOLERANCE_USDT = 0.00000001

const rows = ref<ProviderAccountingRow[]>([
  {
    settlement_id: 'PS-202607-PG',
    provider_id: 'PROV-PG',
    provider_code: 'PG',
    provider_name: 'PG Soft',
    provider_currency_connection_id: 'PC-PG-TWD',
    provider_currency_id: 'PG-CUR-TWD-01',
    original_currency: 'TWD',
    provider_report_ggr_original: 26532450,
    exchange_rate_id: 'FX-202607-TWD',
    exchange_rate: 31.5,
    settlement_batch_id: 'SET-20260707-0001',
    period: '2026-07',
    settlement_currency: 'USDT',
    invoice_currency: 'TWD',
    payment_currency: 'TWD',
    provider_rate_version: 'PG-COST-2026.07',
    provider_cost_rate: 0.04,
    negative_ggr_policy: 'carry_forward',
    opening_carry_forward: 0,
    applied_carry_forward: 0,
    closing_carry_forward: 0,
    fixed_fee: 0,
    provider_report_ggr_usdt: 842300,
    platform_snapshot_ggr_usdt: 842180,
    diff_amount: -120,
    adjustment_amount: 0,
    provider_cost: 33692,
    payable_amount: 33692,
    paid_amount: 0,
    accounting_status: 'difference',
    invoice_no: 'PINV-202607-PG',
    invoice_status: 'pending',
    payment_status: 'unpaid',
    updated_at: '2026-07-07T01:20:00.000Z',
    reconcile_items: [
      { source: 'Slot', provider_bet: 3200000, provider_win: 2461000, provider_ggr: 739000, platform_bet: 3200000, platform_win: 2461120, platform_ggr: 738880, diff_amount: -120, status: 'difference' },
      { source: 'Promotion Refund', provider_bet: 0, provider_win: -103300, provider_ggr: 103300, platform_bet: 0, platform_win: -103300, platform_ggr: 103300, diff_amount: 0, status: 'matched' }
    ],
    payments: [],
    logs: [
      { action: '匯入供應商報表', operated_at: '2026-07-07T00:42:00.000Z', operator: 'Finance', trace_id: 'trace-pg-import' },
      { action: '完成供應商對帳', operated_at: '2026-07-07T01:20:00.000Z', operator: 'Finance', trace_id: 'trace-pg-reconcile' }
    ]
  },
  {
    settlement_id: 'PS-202607-EVO',
    provider_id: 'PROV-EVO',
    provider_code: 'EVO',
    provider_name: 'Evolution',
    provider_currency_connection_id: 'PC-EVO-TWD',
    provider_currency_id: 'EVO-CUR-TWD-01',
    original_currency: 'TWD',
    provider_report_ggr_original: 16083900,
    exchange_rate_id: 'FX-202607-TWD',
    exchange_rate: 31.5031,
    settlement_batch_id: 'SET-20260707-0001',
    period: '2026-07',
    settlement_currency: 'USDT',
    invoice_currency: 'TWD',
    payment_currency: 'TWD',
    provider_rate_version: 'EVO-COST-2026.07',
    provider_cost_rate: 0.06,
    negative_ggr_policy: 'carry_forward',
    opening_carry_forward: 0,
    applied_carry_forward: 0,
    closing_carry_forward: 0,
    fixed_fee: 0,
    provider_report_ggr_usdt: 510600,
    platform_snapshot_ggr_usdt: 510600,
    diff_amount: 0,
    adjustment_amount: 250,
    provider_cost: 30636,
    payable_amount: 30886,
    paid_amount: 30886,
    accounting_status: 'locked',
    invoice_no: 'PINV-202607-EVO',
    invoice_status: 'confirmed',
    payment_status: 'paid',
    locked_at: '2026-07-07T01:35:00.000Z',
    updated_at: '2026-07-07T03:10:00.000Z',
    reconcile_items: [
      { source: 'Live Casino', provider_bet: 2250000, provider_win: 1739400, provider_ggr: 510600, platform_bet: 2250000, platform_win: 1739400, platform_ggr: 510600, diff_amount: 0, status: 'matched' }
    ],
    payments: [
      { payment_no: 'PAY-202607-EVO-001', paid_at: '2026-07-07T03:10:00.000Z', amount_original: 973004.7466, original_currency: 'TWD', amount_usdt: 30886, tx_hash: '0x87a1...evo', operator: 'Finance' }
    ],
    logs: [
      { action: '建立供應商帳單', operated_at: '2026-07-07T01:35:00.000Z', operator: 'Finance', trace_id: 'trace-evo-invoice' },
      { action: '登記供應商付款', operated_at: '2026-07-07T03:10:00.000Z', operator: 'Finance', trace_id: 'trace-evo-payment' }
    ]
  },
  {
    settlement_id: 'PS-202607-JILI',
    provider_id: 'PROV-JILI',
    provider_code: 'JILI',
    provider_name: 'JILI',
    provider_currency_connection_id: 'PC-JILI-PHP',
    provider_currency_id: 'JILI-CUR-PHP-01',
    original_currency: 'PHP',
    provider_report_ggr_original: 17517100,
    exchange_rate_id: 'FX-202607-PHP',
    exchange_rate: 59,
    settlement_batch_id: 'SET-20260707-0001',
    period: '2026-07',
    settlement_currency: 'USDT',
    invoice_currency: 'PHP',
    payment_currency: 'PHP',
    provider_rate_version: 'JILI-COST-2026.07',
    provider_cost_rate: 0.052,
    negative_ggr_policy: 'zero_out',
    opening_carry_forward: 0,
    applied_carry_forward: 0,
    closing_carry_forward: 0,
    fixed_fee: 0,
    provider_report_ggr_usdt: 296900,
    platform_snapshot_ggr_usdt: 301240,
    diff_amount: 4340,
    adjustment_amount: 0,
    provider_cost: 15438.8,
    payable_amount: 15438.8,
    paid_amount: 0,
    accounting_status: 'difference',
    invoice_status: 'none',
    payment_status: 'unpaid',
    updated_at: '2026-07-07T01:12:00.000Z',
    reconcile_items: [
      { source: 'Slot', provider_bet: 1260000, provider_win: 963100, provider_ggr: 296900, platform_bet: 1270000, platform_win: 968760, platform_ggr: 301240, diff_amount: 4340, status: 'difference' }
    ],
    payments: [],
    logs: [
      { action: '產生供應商差異', operated_at: '2026-07-07T01:12:00.000Z', operator: 'System', trace_id: 'trace-jili-diff' }
    ]
  },
  {
    settlement_id: 'PS-202607-PP',
    provider_id: 'PROV-PP',
    provider_code: 'PP',
    provider_name: 'Pragmatic Play',
    provider_currency_connection_id: 'PC-PP-VND',
    provider_currency_id: 'PP-CUR-VND-01',
    original_currency: 'VND',
    provider_report_ggr_original: 10528809000,
    exchange_rate_id: 'FX-202607-VND',
    exchange_rate: 26454.294,
    settlement_batch_id: 'SET-20260707-0001',
    period: '2026-07',
    settlement_currency: 'USDT',
    invoice_currency: 'VND',
    payment_currency: 'VND',
    provider_rate_version: 'PP-COST-2026.07',
    provider_cost_rate: 0.05,
    negative_ggr_policy: 'zero_out',
    opening_carry_forward: 0,
    applied_carry_forward: 0,
    closing_carry_forward: 0,
    fixed_fee: 0,
    provider_report_ggr_usdt: 398000,
    platform_snapshot_ggr_usdt: 398000,
    diff_amount: 0,
    adjustment_amount: -100,
    provider_cost: 19900,
    payable_amount: 19800,
    paid_amount: 9900,
    accounting_status: 'locked',
    invoice_no: 'PINV-202607-PP',
    invoice_status: 'confirmed',
    payment_status: 'partial',
    locked_at: '2026-07-07T02:00:00.000Z',
    updated_at: '2026-07-07T02:50:00.000Z',
    reconcile_items: [
      { source: 'Slot', provider_bet: 1900000, provider_win: 1502000, provider_ggr: 398000, platform_bet: 1900000, platform_win: 1502000, platform_ggr: 398000, diff_amount: 0, status: 'matched' }
    ],
    payments: [
      { payment_no: 'PAY-202607-PP-001', paid_at: '2026-07-07T02:50:00.000Z', amount_original: 261897510.6, original_currency: 'VND', amount_usdt: 9900, tx_hash: '0xa924...pp', operator: 'Finance' }
    ],
    logs: [
      { action: '建立折讓調整', operated_at: '2026-07-07T01:50:00.000Z', operator: 'Finance', trace_id: 'trace-pp-adjust' },
      { action: '登記部分付款', operated_at: '2026-07-07T02:50:00.000Z', operator: 'Finance', trace_id: 'trace-pp-partial' }
    ]
  }
])

rows.value.splice(1, 0, {
  ...rows.value[0]!,
  settlement_id: 'PS-202607-PG-THB',
  provider_currency_connection_id: 'PC-PG-THB',
  provider_currency_id: 'PG-CUR-THB-01',
  original_currency: 'THB',
  provider_report_ggr_original: 8232750,
  exchange_rate_id: 'FX-202607-THB',
  exchange_rate: 36.59,
  invoice_currency: 'THB',
  payment_currency: 'THB',
  provider_report_ggr_usdt: 225000,
  platform_snapshot_ggr_usdt: 224920,
  diff_amount: -80,
  adjustment_amount: 0,
  provider_cost: 9000,
  payable_amount: 9000,
  paid_amount: 0,
  invoice_no: undefined,
  accounting_status: 'difference',
  invoice_status: 'none',
  payment_status: 'unpaid',
  reconcile_items: [],
  payments: [],
  logs: [{ action: '建立 PG Soft THB 幣別線對帳', operated_at: '2026-07-07T01:24:00.000Z', operator: 'System', trace_id: 'trace-pg-thb-reconcile' }]
})

rows.value.forEach((row) => {
  if (row.invoice_status === 'none') return
  row.invoice_amount_usdt = row.invoice_amount_usdt ?? row.payable_amount
  row.invoice_exchange_rate = row.invoice_exchange_rate ?? row.exchange_rate
  row.invoice_amount_original = row.invoice_amount_original
    ?? Number((row.invoice_amount_usdt * row.invoice_exchange_rate).toFixed(8))
  row.invoice_created_at = row.invoice_created_at || row.updated_at
})

const showDetail = ref(false)
const currentRow = ref<ProviderAccountingRow | null>(rows.value[0] ?? null)
const detailTab = ref('summary')
const searchText = ref('')
const statusFilter = ref<AccountingStatus | null>(null)
const paymentFilter = ref<PaymentStatus | null>(null)
const periodFilter = ref('2026-07')
const paymentOriginalAmount = ref(0)

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '已對帳', value: 'matched' },
  { label: '有差異', value: 'difference' },
  { label: '已鎖定', value: 'locked' }
]

const paymentOptions = [
  { label: '未付款', value: 'unpaid' },
  { label: '部分付款', value: 'partial' },
  { label: '已付款', value: 'paid' }
]

const statusMeta: Record<AccountingStatus, { label: string; type: 'success' | 'warning' | 'error' | 'info' }> = {
  draft: { label: '草稿', type: 'info' },
  matched: { label: '已對帳', type: 'success' },
  difference: { label: '有差異', type: 'error' },
  locked: { label: '已鎖定', type: 'warning' }
}

const invoiceMeta: Record<InvoiceStatus, { label: string; type: 'success' | 'warning' | 'default' | 'error' }> = {
  none: { label: '未建立', type: 'default' },
  pending: { label: '待確認', type: 'warning' },
  confirmed: { label: '已確認', type: 'success' },
  voided: { label: '已作廢', type: 'error' }
}

const paymentMeta: Record<PaymentStatus, { label: string; type: 'success' | 'warning' | 'default' }> = {
  unpaid: { label: '未付款', type: 'default' },
  partial: { label: '部分付款', type: 'warning' },
  paid: { label: '已付款', type: 'success' }
}

const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'
const nowTrace = (prefix: string) => `${prefix}-${Date.now()}`

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const inKeyword = !keyword
      || row.provider_name.toLowerCase().includes(keyword)
      || row.provider_code.toLowerCase().includes(keyword)
      || row.settlement_id.toLowerCase().includes(keyword)
      || (row.invoice_no || '').toLowerCase().includes(keyword)
    const inStatus = !statusFilter.value || row.accounting_status === statusFilter.value
    const inPayment = !paymentFilter.value || row.payment_status === paymentFilter.value
    const inPeriod = !periodFilter.value || row.period === periodFilter.value
    return inKeyword && inStatus && inPayment && inPeriod
  })
})

const summary = computed(() => {
  const base = filteredRows.value
  return {
    totalPayable: base.reduce((sum, row) => sum + row.payable_amount, 0),
    paid: base.reduce((sum, row) => sum + row.paid_amount, 0),
    unpaid: base.reduce((sum, row) => sum + Math.max(row.payable_amount - row.paid_amount, 0), 0),
    differences: base.filter(row => row.accounting_status === 'difference').length
  }
})

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = null
  paymentFilter.value = null
  periodFilter.value = ''
}

const importProviderReport = () => {
  message.success('已匯入供應商報表展示資料')
}

const openDetail = (row: ProviderAccountingRow) => {
  currentRow.value = row
  detailTab.value = 'summary'
  const invoiceAmountUsdt = row.invoice_amount_usdt ?? row.payable_amount
  const invoiceRate = row.invoice_exchange_rate ?? row.exchange_rate
  paymentOriginalAmount.value = Number((Math.max(invoiceAmountUsdt - row.paid_amount, 0) * invoiceRate).toFixed(4))
  showDetail.value = true
}

const createInvoice = (row: ProviderAccountingRow) => {
  if (row.accounting_status === 'difference') {
    message.warning('尚有對帳差異，請先完成差異處理後再建立帳單')
    return
  }
  row.invoice_no = row.invoice_no || `PINV-${row.period.replace('-', '')}-${row.provider_code}`
  row.invoice_amount_usdt = row.invoice_amount_usdt ?? row.payable_amount
  row.invoice_exchange_rate = row.invoice_exchange_rate ?? row.exchange_rate
  row.invoice_amount_original = row.invoice_amount_original
    ?? Number((row.invoice_amount_usdt * row.invoice_exchange_rate).toFixed(8))
  row.invoice_created_at = row.invoice_created_at || new Date().toISOString()
  row.invoice_status = 'pending'
  row.logs.unshift({
    action: '建立供應商應付帳單',
    operated_at: new Date().toISOString(),
    operator: 'Finance',
    trace_id: nowTrace('trace-provider-invoice')
  })
  message.success(`${row.invoice_no} 已建立`)
}

const lockSettlement = (row: ProviderAccountingRow) => {
  if (row.accounting_status === 'difference') {
    message.warning('尚有差異不可鎖定')
    return
  }
  row.accounting_status = 'locked'
  row.locked_at = new Date().toISOString()
  row.logs.unshift({
    action: '鎖定供應商帳務',
    operated_at: row.locked_at,
    operator: 'Finance',
    trace_id: nowTrace('trace-provider-lock')
  })
  message.success('供應商帳務已鎖定')
}

const confirmInvoice = (row: ProviderAccountingRow) => {
  if (row.invoice_status === 'none') {
    message.warning('尚未建立帳單')
    return
  }
  row.invoice_status = 'confirmed'
  row.logs.unshift({
    action: '確認供應商應付帳單',
    operated_at: new Date().toISOString(),
    operator: 'Finance',
    trace_id: nowTrace('trace-provider-confirm')
  })
  message.success('帳單已確認')
}

const registerPayment = (row: ProviderAccountingRow) => {
  const invoiceAmountUsdt = row.invoice_amount_usdt ?? row.payable_amount
  const invoiceRate = row.invoice_exchange_rate ?? row.exchange_rate
  const remainingUsdt = Math.max(invoiceAmountUsdt - row.paid_amount, 0)
  const remainingOriginal = remainingUsdt * invoiceRate
  if (row.invoice_status !== 'confirmed') {
    message.warning('請先確認帳單')
    return
  }
  if (paymentOriginalAmount.value <= 0) {
    message.warning('付款金額需大於 0')
    return
  }
  const amountOriginal = Math.min(paymentOriginalAmount.value, remainingOriginal)
  const amountUsdt = Number((amountOriginal / invoiceRate).toFixed(8))
  row.paid_amount = Number((row.paid_amount + amountUsdt).toFixed(8))
  if (Math.abs(invoiceAmountUsdt - row.paid_amount) <= PAYMENT_TOLERANCE_USDT) {
    row.paid_amount = invoiceAmountUsdt
  }
  row.payment_status = row.paid_amount + PAYMENT_TOLERANCE_USDT >= invoiceAmountUsdt ? 'paid' : 'partial'
  row.payments.unshift({
    payment_no: `PAY-${row.period.replace('-', '')}-${row.provider_code}-${row.payments.length + 1}`,
    paid_at: new Date().toISOString(),
    amount_original: amountOriginal,
    original_currency: row.payment_currency,
    amount_usdt: amountUsdt,
    tx_hash: `0x${row.provider_code.toLowerCase()}...demo`,
    operator: 'Finance'
  })
  row.logs.unshift({
    action: row.payment_status === 'paid' ? '完成供應商付款' : '登記部分付款',
    operated_at: new Date().toISOString(),
    operator: 'Finance',
    trace_id: nowTrace('trace-provider-payment')
  })
  paymentOriginalAmount.value = Number((Math.max(invoiceAmountUsdt - row.paid_amount, 0) * invoiceRate).toFixed(4))
  message.success('付款紀錄已建立')
}

const resolveDifference = (row: ProviderAccountingRow) => {
  const costAdjustment = Number((row.diff_amount * row.provider_cost_rate).toFixed(8))
  const originalDiffAmount = row.diff_amount
  dialog.warning({
    title: '確認差異調整',
    content: `${row.provider_name} 的 GGR 差異 ${row.diff_amount.toFixed(2)} USDT，依成本費率換算為應付調整 ${costAdjustment.toFixed(2)} USDT；此操作只影響供應商帳務。`,
    positiveText: '確認調整',
    negativeText: '取消',
    onPositiveClick: () => {
      const resolvedAt = new Date().toISOString()
      const traceId = nowTrace('trace-provider-diff')
      row.adjustment_amount = Number((row.adjustment_amount + costAdjustment).toFixed(8))
      const result = calculateProviderPayable(
        row.provider_report_ggr_usdt,
        row.provider_cost_rate,
        row.negative_ggr_policy,
        row.fixed_fee,
        row.adjustment_amount,
        row.opening_carry_forward
      )
      row.provider_cost = result.providerGameCost
      row.payable_amount = result.providerPayable
      row.applied_carry_forward = result.appliedCarryForward
      row.closing_carry_forward = result.closingCarryForward
      row.difference_resolutions = row.difference_resolutions || []
      row.difference_resolutions.unshift({
        resolution_id: `PDR-${Date.now()}`,
        original_diff_amount: originalDiffAmount,
        cost_adjustment_amount: costAdjustment,
        reason: '依供應商合約成本費率轉入應付調整',
        operator: 'Finance',
        resolved_at: resolvedAt,
        trace_id: traceId
      })
      row.diff_amount = 0
      row.accounting_status = 'matched'
      row.reconcile_items = row.reconcile_items.map(item => item.diff_amount !== 0 ? { ...item, status: 'resolved' } : item)
      row.logs.unshift({
        action: '差異轉入調整金額',
        operated_at: resolvedAt,
        operator: 'Finance',
        trace_id: traceId
      })
      message.success('差異已處理')
    }
  })
}

const columns = computed<DataTableColumns<ProviderAccountingRow>>(() => [
  {
    title: '結算批次',
    key: 'settlement_id',
    width: 170,
    fixed: 'left',
    render: row => h('button', {
      class: 'font-mono text-cyan-500 hover:text-cyan-300',
      onClick: () => openDetail(row)
    }, row.settlement_id)
  },
  {
    title: '供應商',
    key: 'provider_name',
    width: 190,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'font-semibold' }, row.provider_name),
      h('span', { class: 'font-mono text-xs text-gray-500' }, row.provider_code)
    ])
  },
  { title: 'Provider 幣別線', key: 'provider_currency_id', width: 165, render: row => h('div', {}, [h(NTag, { type: 'info', size: 'small', bordered: false }, { default: () => row.original_currency }), h('div', { class: 'mt-1 font-mono text-xs text-gray-500' }, row.provider_currency_id)]) },
  { title: '供應商原幣 GGR', key: 'provider_report_ggr_original', width: 165, align: 'right', render: row => h(MoneyText, { value: row.provider_report_ggr_original, currency: row.original_currency, compact: true, color: 'text-slate-100' }) },
  { title: '帳期', key: 'period', width: 110 },
  {
    title: '結算幣別',
    key: 'settlement_currency',
    width: 110,
    align: 'center',
    render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency })
  },
  { title: '成本費率', key: 'provider_cost_rate', width: 110, align: 'right', render: row => formatRate(row.provider_cost_rate) },
  {
    title: 'USDT GGR',
    key: 'provider_report_ggr_usdt',
    width: 145,
    align: 'right',
    render: row => h(MoneyText, { value: row.provider_report_ggr_usdt, currency: 'USDT', compact: true, color: 'text-slate-100' })
  },
  {
    title: '差異',
    key: 'diff_amount',
    width: 120,
    align: 'right',
    render: row => h(MoneyText, { value: row.diff_amount, currency: 'USDT', compact: true, showSign: true })
  },
  {
    title: '應付金額',
    key: 'payable_amount',
    width: 145,
    align: 'right',
    render: row => h(MoneyText, { value: row.payable_amount, currency: 'USDT', compact: true, color: 'text-slate-100' })
  },
  {
    title: '對帳狀態',
    key: 'accounting_status',
    width: 115,
    align: 'center',
    render: row => h(NTag, { type: statusMeta[row.accounting_status].type, bordered: false, size: 'small' }, {
      default: () => statusMeta[row.accounting_status].label
    })
  },
  {
    title: '帳單',
    key: 'invoice_status',
    width: 115,
    align: 'center',
    render: row => h(NTag, { type: invoiceMeta[row.invoice_status].type, bordered: false, size: 'small' }, {
      default: () => invoiceMeta[row.invoice_status].label
    })
  },
  {
    title: '付款',
    key: 'payment_status',
    width: 115,
    align: 'center',
    render: row => h(NTag, { type: paymentMeta[row.payment_status].type, bordered: false, size: 'small' }, {
      default: () => paymentMeta[row.payment_status].label
    })
  },
  {
    title: '操作',
    key: 'actions',
    width: 390,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, {
          icon: () => h(NIcon, null, { default: () => h(VisibilityOutlined) }),
          default: () => '查看'
        }),
        h(NButton, { size: 'small', secondary: true, disabled: row.accounting_status !== 'difference', onClick: () => resolveDifference(row) }, {
          default: () => '處理差異'
        }),
        h(NButton, { size: 'small', secondary: true, disabled: row.accounting_status === 'difference' || row.invoice_status !== 'none', onClick: () => createInvoice(row) }, {
          default: () => '建立帳單'
        }),
        h(NButton, { size: 'small', secondary: true, disabled: row.accounting_status === 'locked' || row.accounting_status === 'difference', onClick: () => lockSettlement(row) }, {
          default: () => '鎖定'
        })
      ]
    })
  }
])

const reconcileColumns: DataTableColumns<ProviderReconcileItem> = [
  { title: '來源', key: 'source', width: 150 },
  { title: 'Provider 投注', key: 'provider_bet', align: 'right', render: row => h(MoneyText, { value: row.provider_bet, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: 'Provider 派彩', key: 'provider_win', align: 'right', render: row => h(MoneyText, { value: row.provider_win, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: 'Provider GGR', key: 'provider_ggr', align: 'right', render: row => h(MoneyText, { value: row.provider_ggr, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '平台快照 GGR', key: 'platform_ggr', align: 'right', render: row => h(MoneyText, { value: row.platform_ggr, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '差異', key: 'diff_amount', align: 'right', render: row => h(MoneyText, { value: row.diff_amount, currency: 'USDT', compact: true, showSign: true }) },
  { title: '狀態', key: 'status', align: 'center', render: row => h(NTag, { type: row.status === 'matched' ? 'success' : row.status === 'resolved' ? 'warning' : 'error', bordered: false, size: 'small' }, { default: () => row.status === 'matched' ? '已對上' : row.status === 'resolved' ? '已處理（保留原值）' : '有差異' }) }
]

const differenceResolutionColumns: DataTableColumns<ProviderDifferenceResolution> = [
  { title: '處理單號', key: 'resolution_id', render: row => h('span', { class: 'font-mono text-xs' }, row.resolution_id) },
  { title: '原始差異', key: 'original_diff_amount', align: 'right', render: row => h(MoneyText, { value: row.original_diff_amount, currency: 'USDT', showSign: true }) },
  { title: '應付調整', key: 'cost_adjustment_amount', align: 'right', render: row => h(MoneyText, { value: row.cost_adjustment_amount, currency: 'USDT', showSign: true }) },
  { title: '原因', key: 'reason' },
  { title: '操作人員', key: 'operator' },
  { title: '處理時間', key: 'resolved_at', render: row => formatDateTime(row.resolved_at) },
  { title: 'Trace ID', key: 'trace_id', render: row => h('span', { class: 'font-mono text-xs' }, row.trace_id) }
]

const paymentColumns: DataTableColumns<ProviderPayment> = [
  { title: '付款單號', key: 'payment_no' },
  { title: '付款時間', key: 'paid_at', render: row => formatDateTime(row.paid_at) },
  { title: '實際付款原幣', key: 'amount_original', align: 'right', render: row => h(MoneyText, { value: row.amount_original, currency: row.original_currency, color: 'text-slate-100' }) },
  { title: 'USDT 帳務鏡像', key: 'amount_usdt', align: 'right', render: row => h(MoneyText, { value: row.amount_usdt, currency: 'USDT', color: 'text-slate-100' }) },
  { title: 'Tx Hash', key: 'tx_hash', render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.tx_hash) },
  { title: '操作人員', key: 'operator' }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">供應商帳務</h1>
        <p class="mt-1 text-sm text-gray-500">
          平台依 Provider 幣別線分別保存原幣對帳，再統一換算 USDT；主維度為 provider_id + provider_currency_connection_id + provider_currency_id + original_currency + settlement_currency + period。
        </p>
      </div>
      <n-button type="primary" secondary @click="importProviderReport">
        <template #icon>
          <n-icon><ReceiptLongOutlined /></n-icon>
        </template>
        匯入供應商報表
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="供應商應付">
          <MoneyText :value="summary.totalPayable" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="已付款">
          <MoneyText :value="summary.paid" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="未付款">
          <MoneyText :value="summary.unpaid" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="差異批次" :value="summary.differences" />
      </div>
    </div>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="searchText" clearable placeholder="搜尋供應商 / 批次 / 帳單" class="xl:col-span-4">
          <template #prefix>
            <n-icon :component="SearchOutlined" class="opacity-60" />
          </template>
        </n-input>
        <n-input v-model:value="periodFilter" placeholder="帳期 YYYY-MM" class="xl:col-span-2" />
        <n-select v-model:value="statusFilter" clearable placeholder="對帳狀態" :options="statusOptions" class="xl:col-span-2" />
        <n-select v-model:value="paymentFilter" clearable placeholder="付款狀態" :options="paymentOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-alert type="info" :show-icon="false">
      供應商帳務來源為各幣別線原幣報表、逐筆 Provider 交易快照、日結匯率、供應商成本費率與調整金額；不直接使用代理日結來源，也不以代理或商戶作為帳單主體。
    </n-alert>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="1760"
    />

    <n-drawer v-model:show="showDetail" width="min(1120px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold">{{ currentRow.settlement_id }}</span>
            <span class="text-gray-500">{{ currentRow.provider_name }} / {{ currentRow.period }}</span>
            <n-tag type="success" :bordered="false">{{ currentRow.settlement_currency }}</n-tag>
            <n-tag :type="statusMeta[currentRow.accounting_status].type" :bordered="false" round>
              {{ statusMeta[currentRow.accounting_status].label }}
            </n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="供應商 GGR（USDT 鏡像）">
                <MoneyText :value="currentRow.provider_report_ggr_usdt" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="成本費率">{{ formatRate(currentRow.provider_cost_rate) }}</n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="應付金額">
                <MoneyText :value="currentRow.payable_amount" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="未付金額">
                <MoneyText :value="Math.max(currentRow.payable_amount - currentRow.paid_amount, 0)" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="summary" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="供應商">{{ currentRow.provider_name }} / {{ currentRow.provider_code }}</n-descriptions-item>
                <n-descriptions-item label="帳期">{{ currentRow.period }}</n-descriptions-item>
                <n-descriptions-item label="結算幣別">
                  <n-tag type="success" :bordered="false">{{ currentRow.settlement_currency }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="成本費率版本">{{ currentRow.provider_rate_version }}</n-descriptions-item>
                <n-descriptions-item label="供應商成本">{{ formatRate(currentRow.provider_cost_rate) }}</n-descriptions-item>
                <n-descriptions-item label="帳單類型">PROVIDER_PAYABLE</n-descriptions-item>
                <n-descriptions-item label="帳單對象">target_type = PROVIDER / {{ currentRow.provider_id }}</n-descriptions-item>
                <n-descriptions-item label="鎖定時間">{{ formatDateTime(currentRow.locked_at) }}</n-descriptions-item>
                <n-descriptions-item label="Provider 幣別 ID">{{ currentRow.provider_currency_id }}</n-descriptions-item>
                <n-descriptions-item label="供應商原幣 GGR"><MoneyText :value="currentRow.provider_report_ggr_original" :currency="currentRow.original_currency" compact /></n-descriptions-item>
                <n-descriptions-item label="USDT GGR 鏡像"><MoneyText :value="currentRow.provider_report_ggr_usdt" currency="USDT" compact /></n-descriptions-item>
                <n-descriptions-item label="匯率快照">{{ currentRow.exchange_rate_id }}</n-descriptions-item>
                <n-descriptions-item label="鎖定匯率">1 USDT = {{ currentRow.exchange_rate }} {{ currentRow.original_currency }}</n-descriptions-item>
                <n-descriptions-item label="主維度">provider_id + provider_currency_connection_id + provider_currency_id + original_currency + settlement_currency + period</n-descriptions-item>
                <n-descriptions-item label="幣別線 ID">{{ currentRow.provider_currency_connection_id }}</n-descriptions-item>
                <n-descriptions-item label="日結批次">{{ currentRow.settlement_batch_id }}</n-descriptions-item>
                <n-descriptions-item label="負 GGR 政策">{{ currentRow.negative_ggr_policy === 'carry_forward' ? '保留至下期' : '清零' }}</n-descriptions-item>
                <n-descriptions-item label="期初負 GGR 結轉"><MoneyText :value="currentRow.opening_carry_forward" currency="USDT" compact /></n-descriptions-item>
                <n-descriptions-item label="本期已抵扣"><MoneyText :value="currentRow.applied_carry_forward" currency="USDT" compact /></n-descriptions-item>
                <n-descriptions-item label="期末負 GGR 結轉"><MoneyText :value="currentRow.closing_carry_forward" currency="USDT" compact /></n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="reconcile" tab="對帳明細">
              <n-data-table :columns="withTableSorters(reconcileColumns)" :data="currentRow.reconcile_items" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1100" />
            </n-tab-pane>

            <n-tab-pane name="difference-resolution" tab="差異處理紀錄">
              <n-alert type="info" :show-icon="false" class="mb-4">原始對帳差異不可覆蓋；完成處理後另存調整金額、原因、操作人員與 Trace ID。</n-alert>
              <n-data-table :columns="withTableSorters(differenceResolutionColumns)" :data="currentRow.difference_resolutions || []" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1280" />
            </n-tab-pane>

            <n-tab-pane name="invoice" tab="帳單">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="帳單類型">PROVIDER_PAYABLE</n-descriptions-item>
                <n-descriptions-item label="帳單對象">PROVIDER / {{ currentRow.provider_id }}</n-descriptions-item>
                <n-descriptions-item label="帳單號">{{ currentRow.invoice_no || '-' }}</n-descriptions-item>
                <n-descriptions-item label="供應商請款幣別">{{ currentRow.invoice_currency }}</n-descriptions-item>
                <n-descriptions-item label="帳單建立時間">{{ currentRow.invoice_created_at ? formatDateTime(currentRow.invoice_created_at) : '-' }}</n-descriptions-item>
                <n-descriptions-item label="帳單匯率快照">{{ currentRow.invoice_exchange_rate ?? currentRow.exchange_rate }}</n-descriptions-item>
                <n-descriptions-item label="帳單狀態">
                  <n-tag :type="invoiceMeta[currentRow.invoice_status].type" :bordered="false">{{ invoiceMeta[currentRow.invoice_status].label }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="供應商成本">
                  <MoneyText :value="currentRow.provider_cost" currency="USDT" color="text-slate-100" />
                </n-descriptions-item>
                <n-descriptions-item label="調整金額">
                  <MoneyText :value="currentRow.adjustment_amount" currency="USDT" show-sign />
                </n-descriptions-item>
                <n-descriptions-item label="應付金額（USDT 帳務鏡像）">
                  <MoneyText :value="currentRow.invoice_amount_usdt ?? currentRow.payable_amount" currency="USDT" color="text-slate-100" />
                </n-descriptions-item>
                <n-descriptions-item label="實際應付原幣">
                  <MoneyText :value="currentRow.invoice_amount_original ?? currentRow.payable_amount * currentRow.exchange_rate" :currency="currentRow.invoice_currency" color="text-slate-100" />
                </n-descriptions-item>
                <n-descriptions-item label="已付金額（USDT 鏡像）">
                  <MoneyText :value="currentRow.paid_amount" currency="USDT" color="text-slate-100" />
                </n-descriptions-item>
              </n-descriptions>
              <n-alert type="warning" :show-icon="false" class="mt-4">
                供應商帳務對象以 target_type = PROVIDER、target_id = provider_id 表示，不使用 agent_id 作帳務主體。
              </n-alert>
            </n-tab-pane>

            <n-tab-pane name="payment" tab="付款紀錄">
              <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
                <n-form-item :label="`實際付款金額（${currentRow.payment_currency}）`">
                  <n-input-number v-model:value="paymentOriginalAmount" :min="0" :step="100" class="w-full">
                    <template #prefix>{{ currentRow.payment_currency }}</template>
                  </n-input-number>
                </n-form-item>
                <n-form-item label=" ">
                  <n-button type="primary" class="w-full" @click="registerPayment(currentRow)">登記付款</n-button>
                </n-form-item>
              </div>
              <n-data-table :columns="withTableSorters(paymentColumns)" :data="currentRow.payments" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>

            <n-tab-pane name="boundary" tab="帳務邊界">
              <n-descriptions bordered :column="1" label-placement="left">
                <n-descriptions-item label="帳務對象">GGAP 平台 與 供應商</n-descriptions-item>
                <n-descriptions-item label="主維度">provider_id + provider_currency_connection_id + provider_currency_id + original_currency + settlement_currency + period</n-descriptions-item>
                <n-descriptions-item label="可選細分">game_type / provider_rate_version</n-descriptions-item>
                <n-descriptions-item label="不是主維度">agent_id / merchant_id</n-descriptions-item>
                <n-descriptions-item label="與代理帳務關係">只在平台毛利報表交會，供應商帳單不直接綁定代理。</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="logs" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item
                  v-for="log in currentRow.logs"
                  :key="log.trace_id"
                  type="info"
                  :title="log.action"
                  :content="`${log.operator} / ${log.trace_id}`"
                  :time="formatDateTime(log.operated_at)"
                />
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <n-space v-if="currentRow" justify="end">
            <n-button secondary :disabled="currentRow.accounting_status !== 'difference'" @click="resolveDifference(currentRow)">處理差異</n-button>
            <n-button secondary :disabled="currentRow.accounting_status === 'difference' || currentRow.invoice_status !== 'none'" @click="createInvoice(currentRow)">建立帳單</n-button>
            <n-button secondary :disabled="currentRow.invoice_status !== 'pending'" @click="confirmInvoice(currentRow)">確認帳單</n-button>
            <n-button type="primary" secondary :disabled="currentRow.accounting_status === 'locked' || currentRow.accounting_status === 'difference'" @click="lockSettlement(currentRow)">鎖定帳務</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
