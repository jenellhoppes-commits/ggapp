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
import { calculateAgentReceivable } from '../../../domain/finance'

type SettlementStatus = 'draft' | 'ready' | 'difference' | 'locked'
type InvoiceStatus = 'none' | 'pending' | 'confirmed' | 'voided'
type ReceiptStatus = 'unpaid' | 'partial' | 'received' | 'overpaid'

interface AgentSettlementDetail {
  merchant_id: string
  merchant_name: string
  provider_id: string
  provider_name: string
  display_currency: string
  display_ggr: number
  settlement_ggr: number
  agent_ggr_rate: number
  agent_receivable: number
  service_fee_amount: number
  service_fee_rate?: number
  service_fee_source?: 'system_default' | 'contract_override'
  service_fee_version?: string
  status: 'included' | 'excluded'
}

interface SubAgentSettlement {
  parent_agent_id: string
  parent_agent_name: string
  child_agent_id: string
  child_agent_name: string
  child_level: 2 | 3
  provider_id: string
  provider_name: string
  settlement_ggr: number
  upstream_rate: number
  downstream_rate: number
  payable_to_parent: number
  service_fee_amount: number
  service_fee_rate?: number
  service_fee_source?: 'system_default' | 'contract_override'
  service_fee_version?: string
  adjustment_amount: number
  margin_amount: number
}

interface MerchantPayableSettlement {
  merchant_id: string
  merchant_name: string
  agent_id: string
  agent_name: string
  agent_level: 1 | 2 | 3
  provider_id: string
  provider_name: string
  display_currency: string
  settlement_ggr: number
  merchant_quote_rate: number
  payable_to_agent: number
  service_fee_amount: number
  service_fee_rate?: number
  service_fee_source?: 'system_default' | 'contract_override'
  service_fee_version?: string
  adjustment_amount: number
  agent_margin_amount: number
}

interface AgentReceipt {
  receipt_no: string
  received_at: string
  amount: number
  tx_hash: string
  operator: string
}

interface AgentAccountingLog {
  action: string
  operated_at: string
  operator: string
  trace_id: string
}

interface AgentAccountingRow {
  settlement_id: string
  agent_id: string
  agent_code: string
  agent_name: string
  period: string
  settlement_currency: 'USDT'
  rate_plan_version: string
  settlement_ggr: number
  agent_receivable: number
  exchange_service_fee: number
  adjustment_amount: number
  final_receivable: number
  received_amount: number
  overpayment_amount?: number
  difference_amount: number
  settlement_status: SettlementStatus
  invoice_no?: string
  invoice_amount_usdt?: number
  invoice_created_at?: string
  invoice_status: InvoiceStatus
  receipt_status: ReceiptStatus
  locked_at?: string
  updated_at: string
  details: AgentSettlementDetail[]
  sub_agent_settlements: SubAgentSettlement[]
  merchant_settlements: MerchantPayableSettlement[]
  receipts: AgentReceipt[]
  logs: AgentAccountingLog[]
}

const message = useMessage()
const dialog = useDialog()
const RECEIPT_TOLERANCE_USDT = 0.00000001

const rows = ref<AgentAccountingRow[]>([
  {
    settlement_id: 'AS-202607-DIRECT',
    agent_id: 'AGT-DIRECT',
    agent_code: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    period: '2026-07',
    settlement_currency: 'USDT',
    rate_plan_version: 'AGT-DIRECT-2026.07',
    settlement_ggr: 932400,
    agent_receivable: 71420,
    exchange_service_fee: 4662,
    adjustment_amount: 0,
    final_receivable: 76082,
    received_amount: 0,
    difference_amount: 0,
    settlement_status: 'ready',
    invoice_no: 'AINV-202607-DIRECT',
    invoice_status: 'pending',
    receipt_status: 'unpaid',
    updated_at: '2026-07-07T01:20:00.000Z',
    details: [
      { merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', provider_id: 'PG', provider_name: 'PG Soft', display_currency: 'TWD', display_ggr: 19240000, settlement_ggr: 601250, agent_ggr_rate: 0.07, agent_receivable: 42087.5, service_fee_amount: 3006.25, status: 'included' },
      { merchant_id: 'OP-1002', merchant_name: 'Royal Ace Group', provider_id: 'JILI', provider_name: 'JILI', display_currency: 'PHP', display_ggr: 19206700, settlement_ggr: 331150, agent_ggr_rate: 0.085, agent_receivable: 28147.75, service_fee_amount: 1655.75, status: 'included' }
    ],
    sub_agent_settlements: [],
    merchant_settlements: [
      { merchant_id: 'OP-1001', merchant_name: 'Blue Whale Interactive', agent_id: 'AGT-DIRECT', agent_name: '平台直營代理', agent_level: 1, provider_id: 'PG', provider_name: 'PG Soft', display_currency: 'TWD', settlement_ggr: 601250, merchant_quote_rate: 0.092, payable_to_agent: 55292.5, service_fee_amount: 3006.25, adjustment_amount: 0, agent_margin_amount: 13205 },
      { merchant_id: 'OP-1002', merchant_name: 'Royal Ace Group', agent_id: 'AGT-DIRECT', agent_name: '平台直營代理', agent_level: 1, provider_id: 'JILI', provider_name: 'JILI', display_currency: 'PHP', settlement_ggr: 331150, merchant_quote_rate: 0.105, payable_to_agent: 34770.75, service_fee_amount: 1655.75, adjustment_amount: 0, agent_margin_amount: 6623 }
    ],
    receipts: [],
    logs: [
      { action: '產生代理日結來源', operated_at: '2026-07-07T00:10:00+08:00', operator: 'System', trace_id: 'trace-agent-direct-settle' },
      { action: '建立代理應收帳單', operated_at: '2026-07-07T01:20:00.000Z', operator: 'Finance', trace_id: 'trace-agent-direct-invoice' }
    ]
  },
  {
    settlement_id: 'AS-202607-SEA',
    agent_id: 'AGT-SEA-001',
    agent_code: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    period: '2026-07',
    settlement_currency: 'USDT',
    rate_plan_version: 'AGT-SEA-2026.07',
    settlement_ggr: 684200,
    agent_receivable: 55266,
    exchange_service_fee: 2736.8,
    adjustment_amount: 1200,
    final_receivable: 59202.8,
    received_amount: 59202.8,
    difference_amount: 0,
    settlement_status: 'locked',
    invoice_no: 'AINV-202607-SEA',
    invoice_status: 'confirmed',
    receipt_status: 'received',
    locked_at: '2026-07-07T01:42:00.000Z',
    updated_at: '2026-07-07T04:00:00.000Z',
    details: [
      { merchant_id: 'OP-1008', merchant_name: 'NovaPlay Entertainment', provider_id: 'PG', provider_name: 'PG Soft', display_currency: 'THB', display_ggr: 12150000, settlement_ggr: 337500, agent_ggr_rate: 0.075, agent_receivable: 25312.5, service_fee_amount: 1350, status: 'included' },
      { merchant_id: 'OP-1009', merchant_name: 'Golden Dragon Gaming', provider_id: 'PP', provider_name: 'Pragmatic Play', display_currency: 'VND', display_ggr: 8847500000, settlement_ggr: 346700, agent_ggr_rate: 0.078, agent_receivable: 27042.6, service_fee_amount: 1386.8, status: 'included' }
    ],
    sub_agent_settlements: [
      { parent_agent_id: 'AGT-SEA-001', parent_agent_name: 'SEA Growth Agent', child_agent_id: 'AGT-SEA-SUB01', child_agent_name: 'SEA Sub Agent 01', child_level: 2, provider_id: 'PG', provider_name: 'PG Soft', settlement_ggr: 337500, upstream_rate: 0.075, downstream_rate: 0.088, payable_to_parent: 29700, service_fee_amount: 1350, adjustment_amount: 0, margin_amount: 4387.5 },
      { parent_agent_id: 'AGT-SEA-001', parent_agent_name: 'SEA Growth Agent', child_agent_id: 'AGT-SEA-SUB01', child_agent_name: 'SEA Sub Agent 01', child_level: 2, provider_id: 'PP', provider_name: 'Pragmatic Play', settlement_ggr: 346700, upstream_rate: 0.078, downstream_rate: 0.092, payable_to_parent: 31896.4, service_fee_amount: 1386.8, adjustment_amount: 0, margin_amount: 4853.8 },
      { parent_agent_id: 'AGT-SEA-SUB01', parent_agent_name: 'SEA Sub Agent 01', child_agent_id: 'AGT-SEA-SUB01-L3', child_agent_name: 'SEA Local Desk L3', child_level: 3, provider_id: 'PP', provider_name: 'Pragmatic Play', settlement_ggr: 346700, upstream_rate: 0.092, downstream_rate: 0.1, payable_to_parent: 34670, service_fee_amount: 1386.8, adjustment_amount: 0, margin_amount: 2773.6 }
    ],
    merchant_settlements: [
      { merchant_id: 'OP-1008', merchant_name: 'NovaPlay Entertainment', agent_id: 'AGT-SEA-SUB01', agent_name: 'SEA Sub Agent 01', agent_level: 2, provider_id: 'PG', provider_name: 'PG Soft', display_currency: 'THB', settlement_ggr: 337500, merchant_quote_rate: 0.1, payable_to_agent: 33750, service_fee_amount: 1350, adjustment_amount: 0, agent_margin_amount: 4050 },
      { merchant_id: 'OP-1009', merchant_name: 'Golden Dragon Gaming', agent_id: 'AGT-SEA-SUB01-L3', agent_name: 'SEA Local Desk L3', agent_level: 3, provider_id: 'PP', provider_name: 'Pragmatic Play', display_currency: 'VND', settlement_ggr: 346700, merchant_quote_rate: 0.112, payable_to_agent: 38830.4, service_fee_amount: 1386.8, adjustment_amount: 0, agent_margin_amount: 4160.4 }
    ],
    receipts: [
      { receipt_no: 'RCV-202607-SEA-001', received_at: '2026-07-07T04:00:00.000Z', amount: 59202.8, tx_hash: '0xsea...rcv', operator: 'Finance' }
    ],
    logs: [
      { action: '確認代理應收帳單', operated_at: '2026-07-07T01:42:00.000Z', operator: 'Finance', trace_id: 'trace-sea-confirm' },
      { action: '登記代理收款', operated_at: '2026-07-07T04:00:00.000Z', operator: 'Finance', trace_id: 'trace-sea-receipt' }
    ]
  },
  {
    settlement_id: 'AS-202607-VIP',
    agent_id: 'AGT-VIP-018',
    agent_code: 'AGT-VIP-018',
    agent_name: 'VIP Channel Agent',
    period: '2026-07',
    settlement_currency: 'USDT',
    rate_plan_version: 'AGT-VIP-2026.07',
    settlement_ggr: 248900,
    agent_receivable: 22842,
    exchange_service_fee: 995.6,
    adjustment_amount: 0,
    final_receivable: 23837.6,
    received_amount: 5000,
    difference_amount: 240,
    settlement_status: 'difference',
    invoice_status: 'none',
    receipt_status: 'partial',
    updated_at: '2026-07-07T01:16:00.000Z',
    details: [
      { merchant_id: 'OP-1018', merchant_name: 'HyperWin Network', provider_id: 'EVO', provider_name: 'Evolution', display_currency: 'IDR', display_ggr: 4032180000, settlement_ggr: 248900, agent_ggr_rate: 0.092, agent_receivable: 22898.8, service_fee_amount: 995.6, status: 'included' }
    ],
    sub_agent_settlements: [],
    merchant_settlements: [
      { merchant_id: 'OP-1018', merchant_name: 'HyperWin Network', agent_id: 'AGT-VIP-018', agent_name: 'VIP Channel Agent', agent_level: 1, provider_id: 'EVO', provider_name: 'Evolution', display_currency: 'IDR', settlement_ggr: 248900, merchant_quote_rate: 0.11, payable_to_agent: 27379, service_fee_amount: 995.6, adjustment_amount: 0, agent_margin_amount: 4480.2 }
    ],
    receipts: [
      { receipt_no: 'RCV-202607-VIP-001', received_at: '2026-07-07T03:20:00.000Z', amount: 5000, tx_hash: '0xvip...partial', operator: 'Finance' }
    ],
    logs: [
      { action: '代理結算資料有差異', operated_at: '2026-07-07T01:16:00.000Z', operator: 'System', trace_id: 'trace-vip-diff' }
    ]
  }
])

// The detail snapshots are authoritative. Header totals are derived so the
// game charge, FX service fee and final receivable cannot drift apart.
rows.value.forEach((row) => {
  row.agent_receivable = Number(row.details.reduce((sum, item) => sum + item.agent_receivable, 0).toFixed(4))
  row.exchange_service_fee = Number(row.details.reduce((sum, item) => sum + item.service_fee_amount, 0).toFixed(4))
  const result = calculateAgentReceivable(row.settlement_ggr, 0, 0, row.adjustment_amount)
  row.final_receivable = Number((row.agent_receivable + row.exchange_service_fee + result.finalAgentReceivable).toFixed(4))
  if (row.invoice_status !== 'none') {
    row.invoice_amount_usdt = row.invoice_amount_usdt ?? row.final_receivable
    row.invoice_created_at = row.invoice_created_at || row.updated_at
  }
  const receiptTarget = row.invoice_amount_usdt ?? row.final_receivable
  row.overpayment_amount = Number(Math.max(row.received_amount - receiptTarget, 0).toFixed(4))
  row.receipt_status = row.overpayment_amount > 0
    ? 'overpaid'
    : row.received_amount + RECEIPT_TOLERANCE_USDT >= receiptTarget
      ? 'received'
      : row.received_amount > 0
        ? 'partial'
        : 'unpaid'

  const applyFeeAudit = (item: { settlement_ggr: number; service_fee_amount: number; service_fee_rate?: number; service_fee_source?: 'system_default' | 'contract_override'; service_fee_version?: string }) => {
    item.service_fee_rate = item.settlement_ggr > 0 ? Number((item.service_fee_amount / item.settlement_ggr).toFixed(6)) : 0
    item.service_fee_source = item.service_fee_rate === 0.005 ? 'system_default' : 'contract_override'
    item.service_fee_version = `${row.rate_plan_version}-FX`
  }
  row.details.forEach(applyFeeAudit)
  row.sub_agent_settlements.forEach(applyFeeAudit)
  row.merchant_settlements.forEach(applyFeeAudit)
})

const showDetail = ref(false)
const currentRow = ref<AgentAccountingRow | null>(rows.value[0] ?? null)
const detailTab = ref('summary')
const searchText = ref('')
const statusFilter = ref<SettlementStatus | null>(null)
const receiptFilter = ref<ReceiptStatus | null>(null)
const periodFilter = ref('2026-07')
const receiptAmount = ref(0)

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '可開帳', value: 'ready' },
  { label: '有差異', value: 'difference' },
  { label: '已鎖定', value: 'locked' }
]
const receiptOptions = [
  { label: '未收款', value: 'unpaid' },
  { label: '部分收款', value: 'partial' },
  { label: '已收款', value: 'received' },
  { label: '溢收待處理', value: 'overpaid' }
]
const statusMeta: Record<SettlementStatus, { label: string; type: 'success' | 'warning' | 'error' | 'info' }> = {
  draft: { label: '草稿', type: 'info' },
  ready: { label: '可開帳', type: 'success' },
  difference: { label: '有差異', type: 'error' },
  locked: { label: '已鎖定', type: 'warning' }
}
const invoiceMeta: Record<InvoiceStatus, { label: string; type: 'success' | 'warning' | 'default' | 'error' }> = {
  none: { label: '未建立', type: 'default' },
  pending: { label: '待確認', type: 'warning' },
  confirmed: { label: '已確認', type: 'success' },
  voided: { label: '已作廢', type: 'error' }
}
const receiptMeta: Record<ReceiptStatus, { label: string; type: 'success' | 'warning' | 'default' | 'error' }> = {
  unpaid: { label: '未收款', type: 'default' },
  partial: { label: '部分收款', type: 'warning' },
  received: { label: '已收款', type: 'success' },
  overpaid: { label: '溢收待處理', type: 'error' }
}

const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString() : '-'
const nowTrace = (prefix: string) => `${prefix}-${Date.now()}`
const subAgentPayableTotal = (row: AgentAccountingRow) => row.sub_agent_settlements.reduce((sum, item) => sum + item.payable_to_parent + item.service_fee_amount + item.adjustment_amount, 0)
const merchantPayableTotal = (row: AgentAccountingRow) => row.merchant_settlements.reduce((sum, item) => sum + item.payable_to_agent + item.service_fee_amount + item.adjustment_amount, 0)
const agentTreeMarginTotal = (row: AgentAccountingRow) =>
  row.sub_agent_settlements.reduce((sum, item) => sum + item.margin_amount, 0)
  + row.merchant_settlements.reduce((sum, item) => sum + item.agent_margin_amount, 0)

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const inKeyword = !keyword
      || row.agent_name.toLowerCase().includes(keyword)
      || row.agent_code.toLowerCase().includes(keyword)
      || row.settlement_id.toLowerCase().includes(keyword)
      || (row.invoice_no || '').toLowerCase().includes(keyword)
    const inStatus = !statusFilter.value || row.settlement_status === statusFilter.value
    const inReceipt = !receiptFilter.value || row.receipt_status === receiptFilter.value
    const inPeriod = !periodFilter.value || row.period === periodFilter.value
    return inKeyword && inStatus && inReceipt && inPeriod
  })
})

const summary = computed(() => {
  const base = filteredRows.value
  return {
    totalReceivable: base.reduce((sum, row) => sum + row.final_receivable, 0),
    subAgentPayable: base.reduce((sum, row) => sum + subAgentPayableTotal(row), 0),
    merchantPayable: base.reduce((sum, row) => sum + merchantPayableTotal(row), 0),
    agentTreeMargin: base.reduce((sum, row) => sum + agentTreeMarginTotal(row), 0),
    received: base.reduce((sum, row) => sum + row.received_amount, 0),
    unreceived: base.reduce((sum, row) => sum + Math.max(row.final_receivable - row.received_amount, 0), 0),
    differences: base.filter(row => row.settlement_status === 'difference').length
  }
})

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = null
  receiptFilter.value = null
  periodFilter.value = ''
}

const generateAgentSettlement = () => {
  message.success('已產生代理帳務展示資料')
}

const openDetail = (row: AgentAccountingRow) => {
  currentRow.value = row
  detailTab.value = 'summary'
  receiptAmount.value = Math.max((row.invoice_amount_usdt ?? row.final_receivable) - row.received_amount, 0)
  showDetail.value = true
}

const createInvoice = (row: AgentAccountingRow) => {
  if (row.settlement_status === 'difference') {
    message.warning('尚有差異，請先完成差異處理')
    return
  }
  row.invoice_no = row.invoice_no || `AINV-${row.period.replace('-', '')}-${row.agent_code.replace('AGT-', '')}`
  row.invoice_amount_usdt = row.invoice_amount_usdt ?? row.final_receivable
  row.invoice_created_at = row.invoice_created_at || new Date().toISOString()
  row.invoice_status = 'pending'
  row.logs.unshift({
    action: '建立代理應收帳單',
    operated_at: new Date().toISOString(),
    operator: 'Finance',
    trace_id: nowTrace('trace-agent-invoice')
  })
  message.success(`${row.invoice_no} 已建立`)
}

const confirmInvoice = (row: AgentAccountingRow) => {
  if (row.invoice_status === 'none') {
    message.warning('請先建立代理應收帳單')
    return
  }
  row.invoice_status = 'confirmed'
  row.logs.unshift({
    action: '確認代理應收帳單',
    operated_at: new Date().toISOString(),
    operator: 'Finance',
    trace_id: nowTrace('trace-agent-confirm')
  })
  message.success('代理帳單已確認')
}

const lockSettlement = (row: AgentAccountingRow) => {
  if (row.settlement_status === 'difference') {
    message.warning('尚有差異不可鎖定')
    return
  }
  row.settlement_status = 'locked'
  row.locked_at = new Date().toISOString()
  row.logs.unshift({
    action: '鎖定代理帳期',
    operated_at: row.locked_at,
    operator: 'Finance',
    trace_id: nowTrace('trace-agent-lock')
  })
  message.success('代理帳期已鎖定')
}

const registerReceipt = (row: AgentAccountingRow) => {
  const receiptTarget = row.invoice_amount_usdt ?? row.final_receivable
  const remaining = Math.max(receiptTarget - row.received_amount, 0)
  if (row.invoice_status !== 'confirmed') {
    message.warning('請先確認帳單')
    return
  }
  if (receiptAmount.value <= 0) {
    message.warning('收款金額需大於 0')
    return
  }
  const amount = Math.min(receiptAmount.value, remaining)
  row.received_amount = Number((row.received_amount + amount).toFixed(4))
  if (Math.abs(receiptTarget - row.received_amount) <= RECEIPT_TOLERANCE_USDT) row.received_amount = receiptTarget
  row.overpayment_amount = Number(Math.max(row.received_amount - receiptTarget, 0).toFixed(4))
  row.receipt_status = row.overpayment_amount > 0 ? 'overpaid' : row.received_amount + RECEIPT_TOLERANCE_USDT >= receiptTarget ? 'received' : 'partial'
  row.receipts.unshift({
    receipt_no: `RCV-${row.period.replace('-', '')}-${row.agent_code.replace('AGT-', '')}-${row.receipts.length + 1}`,
    received_at: new Date().toISOString(),
    amount,
    tx_hash: `0x${row.agent_code.toLowerCase()}...demo`,
    operator: 'Finance'
  })
  row.logs.unshift({
    action: row.receipt_status === 'received' ? '完成代理收款' : '登記部分收款',
    operated_at: new Date().toISOString(),
    operator: 'Finance',
    trace_id: nowTrace('trace-agent-receipt')
  })
  receiptAmount.value = Math.max(receiptTarget - row.received_amount, 0)
  message.success('收款紀錄已建立')
}

const resolveDifference = (row: AgentAccountingRow) => {
  dialog.warning({
    title: '確認代理差異調整',
    content: `${row.agent_name} 差異 ${row.difference_amount.toFixed(2)} USDT 將轉為調整金額；此操作只影響代理帳務，不回寫供應商帳務。`,
    positiveText: '確認調整',
    negativeText: '取消',
    onPositiveClick: () => {
      row.adjustment_amount = Number((row.adjustment_amount + row.difference_amount).toFixed(4))
      const result = calculateAgentReceivable(row.settlement_ggr, 0, 0, row.adjustment_amount)
      row.final_receivable = Number((row.agent_receivable + row.exchange_service_fee + result.finalAgentReceivable).toFixed(4))
      row.difference_amount = 0
      row.settlement_status = 'ready'
      row.logs.unshift({
        action: '差異轉入代理調整金額',
        operated_at: new Date().toISOString(),
        operator: 'Finance',
        trace_id: nowTrace('trace-agent-diff')
      })
      message.success('差異已處理')
    }
  })
}

const columns = computed<DataTableColumns<AgentAccountingRow>>(() => [
  {
    title: '結算批次',
    key: 'settlement_id',
    width: 175,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openDetail(row) }, row.settlement_id)
  },
  {
    title: '代理',
    key: 'agent_name',
    width: 210,
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', { class: 'font-semibold' }, row.agent_name),
      h('span', { class: 'font-mono text-xs text-gray-500' }, row.agent_code)
    ])
  },
  { title: '帳期', key: 'period', width: 110 },
  { title: '結算幣別', key: 'settlement_currency', width: 110, align: 'center', render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '結算 GGR', key: 'settlement_ggr', width: 145, align: 'right', render: row => h(MoneyText, { value: row.settlement_ggr, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '代理遊戲費', key: 'agent_receivable', width: 145, align: 'right', render: row => h(MoneyText, { value: row.agent_receivable, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '匯率服務費', key: 'exchange_service_fee', width: 125, align: 'right', render: row => h(MoneyText, { value: row.exchange_service_fee, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '最終應收', key: 'final_receivable', width: 145, align: 'right', render: row => h(MoneyText, { value: row.final_receivable, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '代理樹流轉總額', key: 'sub_agent_payable', width: 175, align: 'right', render: row => h(MoneyText, { value: subAgentPayableTotal(row), currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '商戶樹應收參考', key: 'merchant_payable', width: 175, align: 'right', render: row => h(MoneyText, { value: merchantPayableTotal(row), currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '代理層毛利', key: 'agent_tree_margin', width: 160, align: 'right', render: row => h(MoneyText, { value: agentTreeMarginTotal(row), currency: 'USDT', compact: true, showSign: true }) },
  { title: '結算狀態', key: 'settlement_status', width: 115, align: 'center', render: row => h(NTag, { type: statusMeta[row.settlement_status].type, bordered: false, size: 'small' }, { default: () => statusMeta[row.settlement_status].label }) },
  { title: '帳單', key: 'invoice_status', width: 115, align: 'center', render: row => h(NTag, { type: invoiceMeta[row.invoice_status].type, bordered: false, size: 'small' }, { default: () => invoiceMeta[row.invoice_status].label }) },
  { title: '收款', key: 'receipt_status', width: 115, align: 'center', render: row => h(NTag, { type: receiptMeta[row.receipt_status].type, bordered: false, size: 'small' }, { default: () => receiptMeta[row.receipt_status].label }) },
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
        h(NButton, { size: 'small', secondary: true, disabled: row.settlement_status !== 'difference', onClick: () => resolveDifference(row) }, { default: () => '處理差異' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.settlement_status === 'difference' || row.invoice_status !== 'none', onClick: () => createInvoice(row) }, { default: () => '建立帳單' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.settlement_status === 'locked' || row.settlement_status === 'difference', onClick: () => lockSettlement(row) }, { default: () => '鎖定' })
      ]
    })
  }
])

const detailColumns: DataTableColumns<AgentSettlementDetail> = [
  { title: '商戶', key: 'merchant_name', width: 210, render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.merchant_name), h('span', { class: 'font-mono text-xs text-gray-500' }, row.merchant_id)]) },
  { title: 'Provider', key: 'provider_name', width: 150 },
  { title: '交易幣別', key: 'display_currency', width: 100 },
  { title: '原幣 GGR', key: 'display_ggr', align: 'right', render: row => h(MoneyText, { value: row.display_ggr, currency: row.display_currency, compact: true, color: 'text-slate-100' }) },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: row => h(MoneyText, { value: row.settlement_ggr, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '代理費率', key: 'agent_ggr_rate', align: 'right', render: row => formatRate(row.agent_ggr_rate) },
  { title: '代理遊戲費', key: 'agent_receivable', align: 'right', render: row => h(MoneyText, { value: row.agent_receivable, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '服務費率', key: 'service_fee_rate', align: 'right', render: row => formatRate(row.service_fee_rate || 0) },
  { title: '費率來源', key: 'service_fee_source', width: 130, render: row => row.service_fee_source === 'contract_override' ? '合約覆寫' : '系統預設' },
  { title: '服務費', key: 'service_fee_amount', align: 'right', render: row => h(MoneyText, { value: row.service_fee_amount, currency: 'USDT', compact: true, color: 'text-slate-100' }) }
]

const subAgentColumns: DataTableColumns<SubAgentSettlement> = [
  { title: '上層代理', key: 'parent_agent_name', width: 210, render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.parent_agent_name), h('span', { class: 'font-mono text-xs text-gray-500' }, row.parent_agent_id)]) },
  { title: '下級代理', key: 'child_agent_name', width: 230, render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.child_agent_name), h('span', { class: 'font-mono text-xs text-gray-500' }, `${row.child_agent_id} / L${row.child_level}`)]) },
  { title: 'Provider', key: 'provider_name', width: 150 },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: row => h(MoneyText, { value: row.settlement_ggr, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '上層費率', key: 'upstream_rate', align: 'right', render: row => formatRate(row.upstream_rate) },
  { title: '下級費率', key: 'downstream_rate', align: 'right', render: row => formatRate(row.downstream_rate) },
  { title: '應付上層', key: 'payable_to_parent', align: 'right', render: row => h(MoneyText, { value: row.payable_to_parent, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '平台服務費穿透', key: 'service_fee_amount', align: 'right', render: row => h(MoneyText, { value: row.service_fee_amount, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '調整', key: 'adjustment_amount', align: 'right', render: row => h(MoneyText, { value: row.adjustment_amount, currency: 'USDT', compact: true, showSign: true }) },
  { title: '層級毛利', key: 'margin_amount', align: 'right', render: row => h(MoneyText, { value: row.margin_amount, currency: 'USDT', compact: true, showSign: true }) }
]

const merchantSettlementColumns: DataTableColumns<MerchantPayableSettlement> = [
  { title: '商戶', key: 'merchant_name', width: 230, render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.merchant_name), h('span', { class: 'font-mono text-xs text-gray-500' }, row.merchant_id)]) },
  { title: '所屬代理', key: 'agent_name', width: 230, render: row => h('div', { class: 'flex flex-col gap-1' }, [h('span', { class: 'font-semibold' }, row.agent_name), h('span', { class: 'font-mono text-xs text-gray-500' }, `${row.agent_id} / L${row.agent_level}`)]) },
  { title: 'Provider', key: 'provider_name', width: 150 },
  { title: '交易幣別', key: 'display_currency', width: 100 },
  { title: '結算 GGR', key: 'settlement_ggr', align: 'right', render: row => h(MoneyText, { value: row.settlement_ggr, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '商戶報價費率', key: 'merchant_quote_rate', align: 'right', render: row => formatRate(row.merchant_quote_rate) },
  { title: '應付代理', key: 'payable_to_agent', align: 'right', render: row => h(MoneyText, { value: row.payable_to_agent, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '服務費', key: 'service_fee_amount', align: 'right', render: row => h(MoneyText, { value: row.service_fee_amount, currency: 'USDT', compact: true, color: 'text-slate-100' }) },
  { title: '調整', key: 'adjustment_amount', align: 'right', render: row => h(MoneyText, { value: row.adjustment_amount, currency: 'USDT', compact: true, showSign: true }) },
  { title: '代理毛利', key: 'agent_margin_amount', align: 'right', render: row => h(MoneyText, { value: row.agent_margin_amount, currency: 'USDT', compact: true, showSign: true }) }
]

const receiptColumns: DataTableColumns<AgentReceipt> = [
  { title: '收款單號', key: 'receipt_no' },
  { title: '收款時間', key: 'received_at', render: row => formatDateTime(row.received_at) },
  { title: '收款金額', key: 'amount', align: 'right', render: row => h(MoneyText, { value: row.amount, currency: 'USDT', color: 'text-slate-100' }) },
  { title: 'Tx Hash', key: 'tx_hash', render: row => h('span', { class: 'font-mono text-xs text-gray-400' }, row.tx_hash) },
  { title: '操作人員', key: 'operator' }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">代理帳務</h1>
        <p class="mt-1 text-sm text-gray-500">
          GGAP 只對 L1 代理正式收款；下級代理與商戶結算作為代理帳務明細，支援後續代理報表直接引用。
        </p>
      </div>
      <n-button type="primary" secondary @click="generateAgentSettlement">
        <template #icon>
          <n-icon><ReceiptLongOutlined /></n-icon>
        </template>
        產生代理日結
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="GGAP 代理應收">
          <MoneyText :value="summary.totalReceivable" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="下級代理結算">
          <MoneyText :value="summary.subAgentPayable" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="商戶結算">
          <MoneyText :value="summary.merchantPayable" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="代理層毛利">
          <MoneyText :value="summary.agentTreeMargin" currency="USDT" compact show-sign />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="已收款">
          <MoneyText :value="summary.received" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="未收款">
          <MoneyText :value="summary.unreceived" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="差異批次" :value="summary.differences" />
      </div>
    </div>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="searchText" clearable placeholder="搜尋代理 / 批次 / 帳單" class="xl:col-span-4">
          <template #prefix>
            <n-icon :component="SearchOutlined" class="opacity-60" />
          </template>
        </n-input>
        <n-input v-model:value="periodFilter" placeholder="帳期 YYYY-MM" class="xl:col-span-2" />
        <n-select v-model:value="statusFilter" clearable placeholder="結算狀態" :options="statusOptions" class="xl:col-span-2" />
        <n-select v-model:value="receiptFilter" clearable placeholder="收款狀態" :options="receiptOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-alert type="info" :show-icon="false">
      代理帳務以 L1 代理作為正式應收對象。L2 / L3 下級代理與商戶結算只作為代理帳務明細與報表來源，不產生 GGAP 對商戶的正式應收帳。
    </n-alert>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="2580"
    />

    <n-drawer v-model:show="showDetail" width="min(1120px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-lg font-semibold">{{ currentRow.settlement_id }}</span>
            <span class="text-sm text-gray-500">{{ currentRow.agent_name }} / {{ currentRow.period }}</span>
            <n-tag type="success" :bordered="false">{{ currentRow.settlement_currency }}</n-tag>
            <n-tag :type="statusMeta[currentRow.settlement_status].type" :bordered="false" round>
              {{ statusMeta[currentRow.settlement_status].label }}
            </n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="結算 GGR">
                <MoneyText :value="currentRow.settlement_ggr" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="GGAP 應收">
                <MoneyText :value="currentRow.agent_receivable" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="最終應收">
                <MoneyText :value="currentRow.final_receivable" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="代理樹流轉總額">
                <MoneyText :value="subAgentPayableTotal(currentRow)" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="商戶樹應收參考">
                <MoneyText :value="merchantPayableTotal(currentRow)" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="代理層毛利">
                <MoneyText :value="agentTreeMarginTotal(currentRow)" currency="USDT" compact show-sign />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic :label="currentRow.overpayment_amount ? '溢收待處理' : '未收款'">
                <MoneyText :value="currentRow.overpayment_amount || Math.max(currentRow.final_receivable - currentRow.received_amount, 0)" currency="USDT" compact :color="currentRow.overpayment_amount ? 'text-red-300' : 'text-slate-100'" />
              </n-statistic>
            </div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="summary" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="代理">{{ currentRow.agent_name }} / {{ currentRow.agent_code }}</n-descriptions-item>
                <n-descriptions-item label="帳期">{{ currentRow.period }}</n-descriptions-item>
                <n-descriptions-item label="結算幣別">
                  <n-tag type="success" :bordered="false">{{ currentRow.settlement_currency }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="費率版本">{{ currentRow.rate_plan_version }}</n-descriptions-item>
                <n-descriptions-item label="帳單類型">AGENT_RECEIVABLE</n-descriptions-item>
                <n-descriptions-item label="帳單對象">target_type = AGENT / {{ currentRow.agent_id }}</n-descriptions-item>
                <n-descriptions-item label="正式主維度">agent_id + settlement_currency + period</n-descriptions-item>
                <n-descriptions-item label="鎖定時間">{{ formatDateTime(currentRow.locked_at) }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="daily" tab="日結明細">
              <n-data-table :columns="withTableSorters(detailColumns)" :data="currentRow.details" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1260" />
            </n-tab-pane>

            <n-tab-pane name="sub-agents" tab="下級代理結算">
              <n-alert type="info" :show-icon="false" class="mb-4">
                下級代理結算逐層列示 L1 → L2、L2 → L3 的流轉；表內服務費為同一筆平台費用穿透，不得把不同層級再次加總為 GGAP 收入。
              </n-alert>
              <n-data-table :columns="withTableSorters(subAgentColumns)" :data="currentRow.sub_agent_settlements" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1420" />
            </n-tab-pane>

            <n-tab-pane name="merchants" tab="商戶結算">
              <n-alert type="warning" :show-icon="false" class="mb-4">
                商戶結算為代理向商戶收款的計算參考，由代理帳務保存明細；GGAP 不直接對商戶開立正式應收帳。
              </n-alert>
              <n-data-table :columns="withTableSorters(merchantSettlementColumns)" :data="currentRow.merchant_settlements" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1580" />
            </n-tab-pane>

            <n-tab-pane name="invoice" tab="帳單">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="帳單類型">AGENT_RECEIVABLE</n-descriptions-item>
                <n-descriptions-item label="帳單對象">AGENT / {{ currentRow.agent_id }}</n-descriptions-item>
                <n-descriptions-item label="帳單號">{{ currentRow.invoice_no || '-' }}</n-descriptions-item>
                <n-descriptions-item label="帳單建立時間">{{ currentRow.invoice_created_at ? formatDateTime(currentRow.invoice_created_at) : '-' }}</n-descriptions-item>
                <n-descriptions-item label="帳單狀態">
                  <n-tag :type="invoiceMeta[currentRow.invoice_status].type" :bordered="false">{{ invoiceMeta[currentRow.invoice_status].label }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="代理 GGR 應收">
                  <MoneyText :value="currentRow.agent_receivable" currency="USDT" color="text-slate-100" />
                </n-descriptions-item>
                <n-descriptions-item label="匯率服務費">
                  <MoneyText :value="currentRow.exchange_service_fee" currency="USDT" color="text-slate-100" />
                </n-descriptions-item>
                <n-descriptions-item label="調整金額">
                  <MoneyText :value="currentRow.adjustment_amount" currency="USDT" show-sign />
                </n-descriptions-item>
                <n-descriptions-item label="帳單應收快照">
                  <MoneyText :value="currentRow.invoice_amount_usdt ?? currentRow.final_receivable" currency="USDT" color="text-slate-100" />
                </n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="receipts" tab="收款紀錄">
              <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
                <n-form-item label="收款金額">
                  <n-input-number v-model:value="receiptAmount" :min="0" :step="100" class="w-full">
                    <template #prefix>USDT</template>
                  </n-input-number>
                </n-form-item>
                <n-form-item label=" ">
                  <n-button type="primary" class="w-full" @click="registerReceipt(currentRow)">登記收款</n-button>
                </n-form-item>
              </div>
              <n-data-table :columns="withTableSorters(receiptColumns)" :data="currentRow.receipts" :pagination="DEFAULT_TABLE_PAGINATION" />
            </n-tab-pane>

            <n-tab-pane name="boundary" tab="帳務邊界">
              <n-descriptions bordered :column="1" label-placement="left">
                <n-descriptions-item label="GGAP 正式應收">只對 L1 代理建立 AGENT_RECEIVABLE。</n-descriptions-item>
                <n-descriptions-item label="下級代理結算">保存在代理帳務明細，用於代理樹內部報表與層級毛利。</n-descriptions-item>
                <n-descriptions-item label="商戶結算">保存在代理帳務明細，讓代理知道應向商戶收多少。</n-descriptions-item>
                <n-descriptions-item label="供應商帳務">獨立於代理帳務，僅在平台毛利報表交會。</n-descriptions-item>
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
            <n-button secondary :disabled="currentRow.settlement_status !== 'difference'" @click="resolveDifference(currentRow)">處理差異</n-button>
            <n-button secondary :disabled="currentRow.settlement_status === 'difference' || currentRow.invoice_status !== 'none'" @click="createInvoice(currentRow)">建立帳單</n-button>
            <n-button secondary :disabled="currentRow.invoice_status !== 'pending'" @click="confirmInvoice(currentRow)">確認帳單</n-button>
            <n-button type="primary" secondary :disabled="currentRow.settlement_status === 'locked' || currentRow.settlement_status === 'difference'" @click="lockSettlement(currentRow)">鎖定帳期</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
