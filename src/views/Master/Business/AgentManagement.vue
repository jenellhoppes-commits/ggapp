<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue'
import {
  NAlert,
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NForm,
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
import { EditOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import MoneyText from '../../../components/Common/MoneyText.vue'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { formatDisplayAmount } from '../../../utils/format'
import { getAgentBetLimitAccess } from '../../../mocks/gameLimits'
import type { AgentBetLimitAccess } from '../../../types/gameLimit'
import { gameLimitStatusLabel } from '../../../types/gameLimit'

type AgentStatus = 'active' | 'disabled' | 'frozen'
type AgentType = 'direct' | 'channel'
type NegativeGgrPolicy = 'carry_forward' | 'zero_out'

interface AgentMerchant {
  merchant_id: string
  merchant_name: string
  provider_code: string
  display_currency: string
  settlement_ggr_usdt: number
  merchant_quote_rate: number
  agent_upstream_rate: number
  status: AgentStatus
}

interface AgentRate {
  provider_id: string
  provider_name: string
  upstream_rate: number
  agent_quote_rate: number
  agent_margin_rate: number
  rate_source: string
  effective_at: string
  status: 'active' | 'draft'
}

interface AgentAuditLog {
  action: string
  operated_at: string
  operator: string
  trace_id: string
}

interface Agent {
  id: number
  agent_code: string
  agent_name: string
  agent_type: AgentType
  agent_level: 1 | 2 | 3
  parent_agent_code: string | null
  root_agent_code: string
  settlement_agent_code: string
  agent_path: string
  can_create_child: boolean
  status: AgentStatus
  contact_name: string
  contact_email: string
  telegram: string
  display_currencies: string[]
  settlement_currency: 'USDT'
  service_fee_rate: number
  merchant_count: number
  child_agent_count: number
  active_player_count: number
  ggap_receivable_usdt: number
  pending_settlement_usdt: number
  settled_usdt: number
  provider_cost_usdt: number
  ggap_margin_usdt: number
  hierarchy_margin_usdt: number
  negative_ggr_policy: NegativeGgrPolicy
  rate_version: string
  is_platform_direct: boolean
  fx_rate_update_time: string
  daily_settlement_time: string
  daily_status: 'locked' | 'pending'
  created_at: string
  updated_at: string
  remarks: string
  rates: AgentRate[]
  bet_limit_access: AgentBetLimitAccess[]
  merchants: AgentMerchant[]
  audit_logs: AgentAuditLog[]
}

interface AgentForm {
  agent_code: string
  agent_name: string
  agent_type: AgentType
  agent_level: 1 | 2 | 3
  parent_agent_code: string | null
  status: AgentStatus
  contact_name: string
  contact_email: string
  telegram: string
  display_currencies: string[]
  service_fee_rate: number
  negative_ggr_policy: NegativeGgrPolicy
  is_platform_direct: boolean
  remarks: string
}

const message = useMessage()
const dialog = useDialog()
const now = new Date().toISOString()

const providerBaseRates = [
  { provider_id: 'PG', provider_name: 'PG Soft', cost_rate: 0.04 },
  { provider_id: 'JILI', provider_name: 'JILI', cost_rate: 0.05 },
  { provider_id: 'EVO', provider_name: 'Evolution', cost_rate: 0.06 },
  { provider_id: 'PP', provider_name: 'Pragmatic Play', cost_rate: 0.05 }
]

const makeRates = (level: 1 | 2 | 3, source: string, overrides: Record<string, number>): AgentRate[] => {
  return providerBaseRates.map(provider => {
    const upstreamRate = level === 1
      ? provider.cost_rate
      : overrides[`${provider.provider_id}_upstream`] ?? provider.cost_rate + 0.03
    const quoteRate = overrides[provider.provider_id] ?? upstreamRate + 0.012

    return {
      provider_id: provider.provider_id,
      provider_name: provider.provider_name,
      upstream_rate: upstreamRate,
      agent_quote_rate: quoteRate,
      agent_margin_rate: Number((quoteRate - upstreamRate).toFixed(6)),
      rate_source: source,
      effective_at: '2026-07-01T01:00:00.000Z',
      status: 'active'
    }
  })
}

const agents = ref<Agent[]>([
  {
    id: 1,
    agent_code: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    agent_type: 'direct',
    agent_level: 1,
    parent_agent_code: null,
    root_agent_code: 'AGT-DIRECT',
    settlement_agent_code: 'AGT-DIRECT',
    agent_path: 'AGT-DIRECT',
    can_create_child: true,
    status: 'active',
    contact_name: 'GGAP Operations',
    contact_email: 'ops@ggap.local',
    telegram: '@ggap_ops',
    display_currencies: ['TWD', 'PHP', 'THB', 'VND', 'IDR'],
    settlement_currency: 'USDT',
    service_fee_rate: 0.005,
    merchant_count: 18,
    child_agent_count: 0,
    active_player_count: 48216,
    ggap_receivable_usdt: 186420.34,
    pending_settlement_usdt: 24810.12,
    settled_usdt: 982440.68,
    provider_cost_usdt: 132740.22,
    ggap_margin_usdt: 53680.12,
    hierarchy_margin_usdt: 0,
    negative_ggr_policy: 'carry_forward',
    rate_version: 'AGT-DIRECT-2026.07',
    is_platform_direct: true,
    fx_rate_update_time: '00:00 Asia/Taipei',
    daily_settlement_time: '00:10 Asia/Taipei',
    daily_status: 'locked',
    created_at: '2025-09-19T01:07:22.000Z',
    updated_at: now,
    remarks: '平台預設直營代理，未指定代理的商戶會歸屬於此代理。',
    rates: makeRates(1, '供應商成本', { PG: 0.07, JILI: 0.085, EVO: 0.1, PP: 0.082 }),
    bet_limit_access: getAgentBetLimitAccess('AGT-DIRECT'),
    merchants: [
      { merchant_id: 'OP-1001', merchant_name: 'Lucky Star Digital', provider_code: 'PG', display_currency: 'VND', settlement_ggr_usdt: 2045.12, agent_upstream_rate: 0.07, merchant_quote_rate: 0.09, status: 'active' }
    ],
    audit_logs: [
      { action: '建立平台直營代理', operated_at: '2025-09-19T01:07:22.000Z', operator: 'System', trace_id: 'trace-direct-agent' },
      { action: '設定 L1 代理費率', operated_at: '2026-07-01T01:00:00.000Z', operator: 'Finance', trace_id: 'trace-rate-direct' }
    ]
  },
  {
    id: 2,
    agent_code: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    agent_type: 'channel',
    agent_level: 1,
    parent_agent_code: null,
    root_agent_code: 'AGT-SEA-001',
    settlement_agent_code: 'AGT-SEA-001',
    agent_path: 'AGT-SEA-001',
    can_create_child: true,
    status: 'active',
    contact_name: 'Mika Chen',
    contact_email: 'mika.chen@sea-growth.example',
    telegram: '@mika_sea',
    display_currencies: ['PHP', 'THB', 'VND'],
    settlement_currency: 'USDT',
    service_fee_rate: 0.004,
    merchant_count: 12,
    child_agent_count: 1,
    active_player_count: 29864,
    ggap_receivable_usdt: 92841.66,
    pending_settlement_usdt: 11204.77,
    settled_usdt: 431802.2,
    provider_cost_usdt: 65408.13,
    ggap_margin_usdt: 27433.53,
    hierarchy_margin_usdt: 6230.7,
    negative_ggr_policy: 'carry_forward',
    rate_version: 'AGT-SEA-2026.07',
    is_platform_direct: false,
    fx_rate_update_time: '00:00 Asia/Taipei',
    daily_settlement_time: '00:10 Asia/Taipei',
    daily_status: 'locked',
    created_at: '2025-11-03T05:12:00.000Z',
    updated_at: now,
    remarks: 'SEA 市場 L1 外部代理，GGAP 正式收款對象。',
    rates: makeRates(1, '供應商成本', { PG: 0.075, JILI: 0.09, EVO: 0.095, PP: 0.078 }),
    bet_limit_access: getAgentBetLimitAccess('AGT-SEA-001'),
    merchants: [
      { merchant_id: 'OP-1002', merchant_name: 'Blue Whale Interactive', provider_code: 'PG', display_currency: 'PHP', settlement_ggr_usdt: 6210.2, agent_upstream_rate: 0.075, merchant_quote_rate: 0.095, status: 'active' }
    ],
    audit_logs: [
      { action: '建立 L1 代理', operated_at: '2025-11-03T05:12:00.000Z', operator: 'Admin', trace_id: 'trace-agent-sea' },
      { action: '設定 GGAP 對 L1 費率', operated_at: '2026-07-01T01:00:00.000Z', operator: 'Finance', trace_id: 'trace-rate-sea' }
    ]
  },
  {
    id: 3,
    agent_code: 'AGT-SEA-SUB01',
    agent_name: 'SEA Sub Agent 01',
    agent_type: 'channel',
    agent_level: 2,
    parent_agent_code: 'AGT-SEA-001',
    root_agent_code: 'AGT-SEA-001',
    settlement_agent_code: 'AGT-SEA-001',
    agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01',
    can_create_child: true,
    status: 'active',
    contact_name: 'Anya Lim',
    contact_email: 'anya.sub@example',
    telegram: '@anya_sub',
    display_currencies: ['THB', 'VND'],
    settlement_currency: 'USDT',
    service_fee_rate: 0.004,
    merchant_count: 5,
    child_agent_count: 1,
    active_player_count: 11820,
    ggap_receivable_usdt: 0,
    pending_settlement_usdt: 0,
    settled_usdt: 0,
    provider_cost_usdt: 0,
    ggap_margin_usdt: 0,
    hierarchy_margin_usdt: 3860.44,
    negative_ggr_policy: 'carry_forward',
    rate_version: 'AGT-SEA-SUB01-2026.07',
    is_platform_direct: false,
    fx_rate_update_time: '00:00 Asia/Taipei',
    daily_settlement_time: '00:10 Asia/Taipei',
    daily_status: 'locked',
    created_at: '2026-02-10T02:20:00.000Z',
    updated_at: now,
    remarks: 'L2 代理只作層級毛利與下層報表，不產生 GGAP 應收帳單。',
    rates: makeRates(2, 'AGT-SEA-001', { PG_upstream: 0.075, JILI_upstream: 0.09, EVO_upstream: 0.095, PP_upstream: 0.078, PG: 0.088, JILI: 0.102, EVO: 0.108, PP: 0.092 }),
    bet_limit_access: getAgentBetLimitAccess('AGT-SEA-SUB01'),
    merchants: [
      { merchant_id: 'OP-1008', merchant_name: 'NovaPlay Entertainment', provider_code: 'PG', display_currency: 'THB', settlement_ggr_usdt: 337500, agent_upstream_rate: 0.088, merchant_quote_rate: 0.1, status: 'active' }
    ],
    audit_logs: [
      { action: '建立 L2 代理', operated_at: '2026-02-10T02:20:00.000Z', operator: 'Admin', trace_id: 'trace-agent-l2' }
    ]
  },
  {
    id: 4,
    agent_code: 'AGT-SEA-SUB01-L3',
    agent_name: 'SEA Local Desk L3',
    agent_type: 'channel',
    agent_level: 3,
    parent_agent_code: 'AGT-SEA-SUB01',
    root_agent_code: 'AGT-SEA-001',
    settlement_agent_code: 'AGT-SEA-001',
    agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3',
    can_create_child: false,
    status: 'active',
    contact_name: 'Krit Phan',
    contact_email: 'krit.local@example',
    telegram: '@krit_local',
    display_currencies: ['THB'],
    settlement_currency: 'USDT',
    service_fee_rate: 0.004,
    merchant_count: 3,
    child_agent_count: 0,
    active_player_count: 6028,
    ggap_receivable_usdt: 0,
    pending_settlement_usdt: 0,
    settled_usdt: 0,
    provider_cost_usdt: 0,
    ggap_margin_usdt: 0,
    hierarchy_margin_usdt: 2210.18,
    negative_ggr_policy: 'zero_out',
    rate_version: 'AGT-SEA-L3-2026.07',
    is_platform_direct: false,
    fx_rate_update_time: '00:00 Asia/Taipei',
    daily_settlement_time: '00:10 Asia/Taipei',
    daily_status: 'pending',
    created_at: '2026-04-18T04:20:00.000Z',
    updated_at: now,
    remarks: 'L3 代理不可再新增子代理，可綁定商戶。',
    rates: makeRates(3, 'AGT-SEA-SUB01', { PG_upstream: 0.088, JILI_upstream: 0.102, EVO_upstream: 0.108, PP_upstream: 0.092, PG: 0.096, JILI: 0.11, EVO: 0.116, PP: 0.1 }),
    bet_limit_access: getAgentBetLimitAccess('AGT-SEA-SUB01-L3', false),
    merchants: [
      { merchant_id: 'OP-1009', merchant_name: 'Golden Dragon Gaming', provider_code: 'PP', display_currency: 'THB', settlement_ggr_usdt: 346700, agent_upstream_rate: 0.1, merchant_quote_rate: 0.112, status: 'active' }
    ],
    audit_logs: [
      { action: '建立 L3 代理', operated_at: '2026-04-18T04:20:00.000Z', operator: 'Admin', trace_id: 'trace-agent-l3' }
    ]
  }
])

const showDetail = ref(false)
const showForm = ref(false)
const editingAgent = ref<Agent | null>(null)
const currentAgent = ref<Agent | null>(agents.value[0] ?? null)
const rateDrafts = ref<AgentRate[]>(agents.value[0]?.rates.map(rate => ({ ...rate })) ?? [])
const searchText = ref('')
const statusFilter = ref<AgentStatus | null>(null)
const levelFilter = ref<1 | 2 | 3 | null>(null)

const defaultForm = (): AgentForm => ({
  agent_code: '',
  agent_name: '',
  agent_type: 'channel',
  agent_level: 1,
  parent_agent_code: null,
  status: 'active',
  contact_name: '',
  contact_email: '',
  telegram: '',
  display_currencies: ['TWD'],
  service_fee_rate: 0.005,
  negative_ggr_policy: 'carry_forward',
  is_platform_direct: false,
  remarks: ''
})

const formValue = reactive<AgentForm>(defaultForm())

const statusOptions = [
  { label: '啟用', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '凍結', value: 'frozen' }
]
const levelOptions = [
  { label: 'L1 代理', value: 1 },
  { label: 'L2 二級代理', value: 2 },
  { label: 'L3 三級代理', value: 3 }
]
const currencyOptions = ['TWD', 'PHP', 'THB', 'VND', 'IDR'].map(value => ({ label: value, value }))
const agentTypeOptions = [
  { label: '平台直營代理', value: 'direct' },
  { label: '外部渠道代理', value: 'channel' }
]
const negativeGgrOptions = [
  { label: '保留到下期', value: 'carry_forward' },
  { label: '清零', value: 'zero_out' }
]

const statusMeta: Record<AgentStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  active: { label: '啟用', type: 'success' },
  disabled: { label: '停用', type: 'warning' },
  frozen: { label: '凍結', type: 'error' }
}

const formatDateTime = (value: string) => new Date(value).toLocaleString()
const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`

const parentAgentOptions = computed(() => {
  const expectedParentLevel = formValue.agent_level - 1
  if (expectedParentLevel < 1) return []
  return agents.value
    .filter(agent => agent.agent_level === expectedParentLevel && agent.can_create_child && agent.status === 'active')
    .map(agent => ({ label: `${agent.agent_name} / ${agent.agent_code}`, value: agent.agent_code }))
})

const rootAgent = (agent: Agent) => agents.value.find(item => item.agent_code === agent.root_agent_code) || agent

const filteredAgents = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return agents.value.filter(agent => {
    const inKeyword = !keyword
      || agent.agent_code.toLowerCase().includes(keyword)
      || agent.agent_name.toLowerCase().includes(keyword)
      || agent.agent_path.toLowerCase().includes(keyword)
    const inStatus = !statusFilter.value || agent.status === statusFilter.value
    const inLevel = !levelFilter.value || agent.agent_level === levelFilter.value
    return inKeyword && inStatus && inLevel
  })
})

const summary = computed(() => ({
  total: agents.value.length,
  l1: agents.value.filter(agent => agent.agent_level === 1).length,
  l2: agents.value.filter(agent => agent.agent_level === 2).length,
  l3: agents.value.filter(agent => agent.agent_level === 3).length,
  merchants: agents.value.reduce((sum, agent) => sum + agent.merchant_count, 0),
  ggapReceivable: agents.value.reduce((sum, agent) => sum + agent.ggap_receivable_usdt, 0),
  ggapMargin: agents.value.reduce((sum, agent) => sum + agent.ggap_margin_usdt, 0)
}))

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = null
  levelFilter.value = null
}

const openDetail = (agent: Agent) => {
  currentAgent.value = agent
  rateDrafts.value = agent.rates.map(rate => ({ ...rate }))
  showDetail.value = true
}

const openCreate = () => {
  editingAgent.value = null
  Object.assign(formValue, defaultForm())
  showForm.value = true
}

const openEdit = (agent: Agent) => {
  editingAgent.value = agent
  Object.assign(formValue, {
    agent_code: agent.agent_code,
    agent_name: agent.agent_name,
    agent_type: agent.agent_type,
    agent_level: agent.agent_level,
    parent_agent_code: agent.parent_agent_code,
    status: agent.status,
    contact_name: agent.contact_name,
    contact_email: agent.contact_email,
    telegram: agent.telegram,
    display_currencies: [...agent.display_currencies],
    service_fee_rate: agent.service_fee_rate,
    negative_ggr_policy: agent.negative_ggr_policy,
    is_platform_direct: agent.is_platform_direct,
    remarks: agent.remarks
  })
  showForm.value = true
}

const syncParentByLevel = () => {
  if (formValue.agent_level === 1) {
    formValue.parent_agent_code = null
    return
  }
  const currentParent = agents.value.find(agent => agent.agent_code === formValue.parent_agent_code)
  if (!currentParent || currentParent.agent_level !== formValue.agent_level - 1) {
    formValue.parent_agent_code = parentAgentOptions.value[0]?.value || null
  }
}

const submitForm = () => {
  syncParentByLevel()
  if (!formValue.agent_code || !formValue.agent_name) {
    message.error('請填寫代理代碼與代理名稱')
    return
  }
  if (formValue.agent_level > 1 && !formValue.parent_agent_code) {
    message.error('請選擇上層代理')
    return
  }
  if (!editingAgent.value && agents.value.some(agent => agent.agent_code === formValue.agent_code.trim())) {
    message.error('代理代碼已存在，請使用唯一代碼')
    return
  }

  const parent = agents.value.find(agent => agent.agent_code === formValue.parent_agent_code)
  const rootCode = formValue.agent_level === 1 ? formValue.agent_code : parent?.root_agent_code || formValue.agent_code
  const path = parent ? `${parent.agent_path} / ${formValue.agent_code}` : formValue.agent_code
  const inheritedBetLimitAccess = (parent
    ? parent.bet_limit_access.filter(access => access.assignable_to_child)
    : getAgentBetLimitAccess('AGT-DIRECT'))
    .filter(access => formValue.display_currencies.includes(access.transaction_currency))
    .map(access => ({ ...access, assignable_to_child: formValue.agent_level < 3, assigned_merchant_count: 0 }))

  if (editingAgent.value) {
    Object.assign(editingAgent.value, {
      ...formValue,
      root_agent_code: rootCode,
      settlement_agent_code: rootCode,
      agent_path: path,
      display_currencies: [...formValue.display_currencies],
      updated_at: new Date().toISOString()
    })
    message.success('代理資料已儲存')
  } else {
    const created: Agent = {
      id: Date.now(),
      ...formValue,
      root_agent_code: rootCode,
      settlement_agent_code: rootCode,
      agent_path: path,
      display_currencies: [...formValue.display_currencies],
      settlement_currency: 'USDT',
      can_create_child: formValue.agent_level < 3,
      merchant_count: 0,
      child_agent_count: 0,
      active_player_count: 0,
      ggap_receivable_usdt: 0,
      pending_settlement_usdt: 0,
      settled_usdt: 0,
      provider_cost_usdt: 0,
      ggap_margin_usdt: 0,
      hierarchy_margin_usdt: 0,
      rate_version: `${formValue.agent_code}-2026.07`,
      fx_rate_update_time: '00:00 Asia/Taipei',
      daily_settlement_time: '00:10 Asia/Taipei',
      daily_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      rates: makeRates(formValue.agent_level, parent?.agent_code || '供應商成本', {}),
      bet_limit_access: inheritedBetLimitAccess,
      merchants: [],
      audit_logs: [
        {
          action: `建立 L${formValue.agent_level} 代理`,
          operated_at: new Date().toISOString(),
          operator: 'Admin',
          trace_id: `trace-agent-${Date.now()}`
        }
      ]
    }
    agents.value.unshift(created)
    if (parent) parent.child_agent_count += 1
    currentAgent.value = created
    rateDrafts.value = created.rates.map(rate => ({ ...rate }))
    showDetail.value = true
    message.success('代理已建立，費率已帶入代理詳情')
  }

  showForm.value = false
}

const saveRateVersion = () => {
  if (!currentAgent.value) return
  const invalid = rateDrafts.value.find(rate => rate.agent_quote_rate < rate.upstream_rate)
  if (invalid) {
    message.error(`${invalid.provider_name} 的下層報價不得低於上游費率`)
    return
  }

  const effectiveAt = new Date().toISOString()
  const versionDate = effectiveAt.slice(0, 10).replace(/-/g, '')
  currentAgent.value.rates = rateDrafts.value.map(rate => ({ ...rate, effective_at: effectiveAt, status: 'active' }))
  currentAgent.value.rate_version = `${currentAgent.value.agent_code}-${versionDate}-${Date.now().toString().slice(-4)}`
  currentAgent.value.updated_at = effectiveAt
  currentAgent.value.audit_logs.unshift({
    action: `建立代理費率版本 ${currentAgent.value.rate_version}`,
    operated_at: effectiveAt,
    operator: 'Admin',
    trace_id: `trace-agent-rate-${Date.now()}`
  })
  rateDrafts.value = currentAgent.value.rates.map(rate => ({ ...rate }))
  message.success('代理費率新版本已建立；歷史注單、Session 與帳單快照不會重算')
}

const viewMerchants = (agent: Agent) => {
  currentAgent.value = agent
  showDetail.value = true
  message.info(`${agent.agent_name} 關聯 ${agent.merchant_count} 個商戶，正式帳務仍彙總至 ${agent.settlement_agent_code}`)
}

const viewRates = (agent: Agent) => {
  currentAgent.value = agent
  showDetail.value = true
  message.info('代理費率可在代理詳情的「代理費率」頁籤調整')
}

const toggleAgentStatus = (agent: Agent) => {
  const nextStatus = agent.status === 'active' ? 'disabled' : 'active'
  const actionLabel = nextStatus === 'active' ? '啟用代理' : '停用代理'
  dialog.warning({
    title: actionLabel,
    content: `${agent.agent_code} · ${agent.agent_name} 執行此操作後，不會影響已鎖定日結帳期；正式環境需輸入原因並寫入操作紀錄。`,
    positiveText: '確認',
    negativeText: '取消',
    onPositiveClick: () => {
      agent.status = nextStatus
      agent.updated_at = new Date().toISOString()
      agent.audit_logs.unshift({
        action: actionLabel,
        operated_at: new Date().toISOString(),
        operator: 'Admin',
        trace_id: `trace-agent-status-${Date.now()}`
      })
      message.success(`${actionLabel}已完成`)
    }
  })
}

const columns = computed<DataTableColumns<Agent>>(() => [
  { title: '#', key: 'index', width: 56, fixed: 'left', render: (_, index) => index + 1 },
  {
    title: '代理',
    key: 'agent_code',
    width: 260,
    fixed: 'left',
    render: row => h('div', { class: 'flex flex-col gap-1' }, [
      h('button', { class: 'text-left font-mono text-cyan-500 hover:text-cyan-300', onClick: () => openDetail(row) }, row.agent_code),
      h('span', { class: 'text-sm font-semibold' }, row.agent_name),
      h('span', { class: 'text-xs text-gray-500' }, row.agent_path)
    ])
  },
  {
    title: '層級',
    key: 'agent_level',
    width: 120,
    align: 'center',
    render: row => h(NTag, { type: row.agent_level === 1 ? 'success' : row.agent_level === 2 ? 'info' : 'warning', bordered: false }, { default: () => `L${row.agent_level}` })
  },
  { title: '上層代理', key: 'parent_agent_code', width: 160, render: row => row.parent_agent_code || 'GGAP' },
  { title: '正式收款對象', key: 'settlement_agent_code', width: 170, render: row => h('span', { class: 'font-mono text-xs' }, row.settlement_agent_code) },
  {
    title: '狀態',
    key: 'status',
    width: 100,
    align: 'center',
    render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false, round: true, size: 'small' }, { default: () => statusMeta[row.status].label })
  },
  { title: '子代理', key: 'child_agent_count', width: 90, align: 'right' },
  { title: '商戶數', key: 'merchant_count', width: 90, align: 'right' },
  {
    title: 'GGAP 代理應收',
    key: 'ggap_receivable_usdt',
    width: 150,
    align: 'right',
    render: row => row.agent_level === 1
      ? h(MoneyText, { value: row.ggap_receivable_usdt, currency: 'USDT', compact: true, color: 'text-slate-100' })
      : h('span', { class: 'text-gray-500' }, '彙總至 L1')
  },
  {
    title: 'GGAP 毛利',
    key: 'ggap_margin_usdt',
    width: 140,
    align: 'right',
    render: row => row.agent_level === 1
      ? h(MoneyText, { value: row.ggap_margin_usdt, currency: 'USDT', compact: true, showSign: true })
      : h('span', { class: 'text-gray-500' }, '不產生 GGAP 毛利')
  },
  {
    title: '層級毛利試算',
    key: 'hierarchy_margin_usdt',
    width: 150,
    align: 'right',
    render: row => h(MoneyText, { value: row.hierarchy_margin_usdt, currency: 'USDT', compact: true, showSign: true })
  },
  {
    title: '操作',
    key: 'actions',
    width: 300,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, {
          icon: () => h(NIcon, null, { default: () => h(VisibilityOutlined) }),
          default: () => '查看'
        }),
        h(NButton, { size: 'small', secondary: true, onClick: () => openEdit(row) }, {
          icon: () => h(NIcon, null, { default: () => h(EditOutlined) }),
          default: () => '編輯'
        }),
        h(NButton, { size: 'small', secondary: true, onClick: () => viewRates(row) }, { default: () => '費率' }),
        h(NButton, {
          size: 'small',
          type: row.status === 'active' ? 'warning' : 'primary',
          secondary: true,
          onClick: () => toggleAgentStatus(row)
        }, { default: () => row.status === 'active' ? '停用' : '啟用' })
      ]
    })
  }
])

const rateColumns: DataTableColumns<AgentRate> = [
  { title: '供應商', key: 'provider_name', width: 150 },
  { title: '上游成本費率', key: 'upstream_rate', align: 'right', render: row => formatRate(row.upstream_rate) },
  {
    title: '下層報價費率',
    key: 'agent_quote_rate',
    align: 'right',
    width: 180,
    render: row => h(NInputNumber, {
      value: row.agent_quote_rate,
      min: row.upstream_rate,
      max: 0.5,
      step: 0.001,
      size: 'small',
      onUpdateValue: (value: number | null) => {
        const nextRate = value ?? row.upstream_rate
        row.agent_quote_rate = nextRate
        row.agent_margin_rate = Number((nextRate - row.upstream_rate).toFixed(6))
      }
    }, {
      suffix: () => formatRate(row.agent_quote_rate)
    })
  },
  { title: '差額', key: 'agent_margin_rate', align: 'right', render: row => formatRate(row.agent_margin_rate) },
  { title: '費率來源', key: 'rate_source' },
  { title: '生效時間', key: 'effective_at', render: row => formatDateTime(row.effective_at) }
]

const merchantColumns = computed<DataTableColumns<AgentMerchant>>(() => [
  { title: '商戶代碼', key: 'merchant_id' },
  { title: '商戶名稱', key: 'merchant_name' },
  { title: '供應商', key: 'provider_code' },
  { title: '交易幣別', key: 'display_currency' },
  { title: '代理成本', key: 'agent_upstream_rate', align: 'right', render: row => formatRate(row.agent_upstream_rate) },
  { title: '商戶報價', key: 'merchant_quote_rate', align: 'right', render: row => formatRate(row.merchant_quote_rate) },
  {
    title: '代理差額',
    key: 'merchant_margin',
    align: 'right',
    render: row => formatRate(row.merchant_quote_rate - row.agent_upstream_rate)
  },
  {
    title: '結算 GGR',
    key: 'settlement_ggr_usdt',
    render: row => h(MoneyText, { value: row.settlement_ggr_usdt, currency: 'USDT', showSign: true })
  }
])

const limitAccessColumns: DataTableColumns<AgentBetLimitAccess> = [
  { title: 'Provider', key: 'provider_name', width: 140 },
  { title: '遊戲類型', key: 'game_type', width: 100 },
  { title: '下注限額方案', key: 'provider_bet_group_name', width: 200, render: row => h('div', {}, [h('div', row.provider_bet_group_name), h('div', { class: 'font-mono text-xs text-gray-500' }, row.provider_bet_group_code)]) },
  { title: '最小投注', key: 'min_bet_display', align: 'right', render: row => formatDisplayAmount(row.min_bet_display, row.display_currency) },
  { title: '最大投注', key: 'max_bet_display', align: 'right', render: row => formatDisplayAmount(row.max_bet_display, row.display_currency) },
  { title: '可下放', key: 'assignable_to_child', width: 95, render: row => h(NTag, { type: row.assignable_to_child ? 'success' : 'warning', size: 'small', bordered: false }, { default: () => row.assignable_to_child ? '是' : '否' }) },
  { title: '套用商戶', key: 'assigned_merchant_count', align: 'right', render: row => `${row.assigned_merchant_count} 家` },
  { title: '狀態', key: 'status', width: 90, render: row => h(NTag, { type: row.status === 'active' ? 'success' : 'warning', size: 'small', bordered: false }, { default: () => gameLimitStatusLabel[row.status] }) }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">代理管理</h1>
        <p class="mt-1 text-sm text-gray-500">
          代理最多三級，商戶可綁定 L1 / L2 / L3；GGAP 正式收款與日結仍只對 L1 代理。
        </p>
      </div>
      <n-button type="primary" @click="openCreate">新增代理</n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-6">
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="代理總數" :value="summary.total" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="L1 / L2 / L3">{{ summary.l1 }} / {{ summary.l2 }} / {{ summary.l3 }}</n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="關聯商戶" :value="summary.merchants" />
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="GGAP 代理應收">
          <MoneyText :value="summary.ggapReceivable" currency="USDT" compact color="text-slate-100" />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="GGAP 毛利">
          <MoneyText :value="summary.ggapMargin" currency="USDT" compact showSign />
        </n-statistic>
      </div>
      <div class="rounded border border-white/10 bg-[#202026] p-4">
        <n-statistic label="結算幣別">USDT</n-statistic>
      </div>
    </div>

    <n-alert type="info" :show-icon="false">
      費率鏈：供應商成本費率 -> GGAP 給 L1 費率 -> L1 給 L2 費率 -> L2 給 L3 費率 -> 所屬代理給商戶報價。L2 / L3 與商戶報價只作層級毛利試算，不產生 GGAP 帳單。
    </n-alert>

    <div class="space-y-3 rounded border border-white/10 bg-[#202026] p-4">
      <div class="flex flex-wrap items-center gap-3">
        <n-input v-model:value="searchText" clearable placeholder="搜尋代理代碼 / 名稱 / 層級路徑" style="width: 300px; max-width: 100%;">
          <template #prefix>
            <n-icon :component="SearchOutlined" class="opacity-60" />
          </template>
        </n-input>
        <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" style="width: 160px;" />
        <n-select v-model:value="levelFilter" clearable placeholder="代理層級" :options="levelOptions" style="width: 180px;" />
        <n-button secondary @click="resetFilters">重置</n-button>
      </div>
      <n-alert type="warning" :show-icon="false">L3 不可再新增子代理。</n-alert>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredAgents"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="2050"
    />

    <n-drawer v-model:show="showDetail" width="min(1120px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentAgent" class="flex flex-wrap items-center gap-3">
            <span class="text-lg font-semibold">{{ currentAgent.agent_name }}</span>
            <span class="font-mono text-sm text-gray-500">{{ currentAgent.agent_code }}</span>
            <n-tag :type="statusMeta[currentAgent.status].type" :bordered="false" round>{{ statusMeta[currentAgent.status].label }}</n-tag>
            <n-tag :bordered="false">L{{ currentAgent.agent_level }}</n-tag>
            <n-tag type="success" :bordered="false">結算 USDT</n-tag>
          </div>
        </template>

        <template v-if="currentAgent">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="GGAP 代理應收">
                <MoneyText :value="currentAgent.ggap_receivable_usdt" currency="USDT" compact color="text-slate-100" />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="GGAP 毛利">
                <MoneyText :value="currentAgent.ggap_margin_usdt" currency="USDT" compact showSign />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="層級毛利試算">
                <MoneyText :value="currentAgent.hierarchy_margin_usdt" currency="USDT" compact showSign />
              </n-statistic>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <n-statistic label="商戶 / 子代理">{{ currentAgent.merchant_count }} / {{ currentAgent.child_agent_count }}</n-statistic>
            </div>
          </div>

          <n-tabs type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="代理代碼">{{ currentAgent.agent_code }}</n-descriptions-item>
                <n-descriptions-item label="代理名稱">{{ currentAgent.agent_name }}</n-descriptions-item>
                <n-descriptions-item label="代理層級">L{{ currentAgent.agent_level }}</n-descriptions-item>
                <n-descriptions-item label="上層代理">{{ currentAgent.parent_agent_code || 'GGAP' }}</n-descriptions-item>
                <n-descriptions-item label="Root L1">{{ currentAgent.root_agent_code }}</n-descriptions-item>
                <n-descriptions-item label="正式收款對象">{{ currentAgent.settlement_agent_code }}</n-descriptions-item>
                <n-descriptions-item label="代理路徑" :span="2">{{ currentAgent.agent_path }}</n-descriptions-item>
                <n-descriptions-item label="聯絡人">{{ currentAgent.contact_name }}</n-descriptions-item>
                <n-descriptions-item label="Email">{{ currentAgent.contact_email }}</n-descriptions-item>
                <n-descriptions-item label="Telegram">{{ currentAgent.telegram }}</n-descriptions-item>
                <n-descriptions-item label="負 GGR 政策">{{ currentAgent.negative_ggr_policy === 'carry_forward' ? '保留到下期' : '清零' }}</n-descriptions-item>
                <n-descriptions-item label="備註" :span="2">{{ currentAgent.remarks }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="rates" tab="代理費率">
              <n-alert type="info" :show-icon="false" class="mb-3">
                可依每個供應商修改下層報價費率。L1 的上游是供應商成本，L2 / L3 的上游是上層代理給下層的報價。
              </n-alert>
              <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                <n-tag type="info" :bordered="false">目前版本 {{ currentAgent.rate_version }}</n-tag>
                <n-button type="primary" secondary @click="saveRateVersion">儲存新費率版本</n-button>
              </div>
              <n-data-table :columns="withTableSorters(rateColumns)" :data="rateDrafts" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="980" />
            </n-tab-pane>

            <n-tab-pane name="merchants" tab="關聯商戶">
              <n-alert type="info" :show-icon="false" class="mb-3">
                商戶報價用來計算代理應向商戶收取多少；GGAP 不直接向商戶開帳，正式帳務仍只看 L1 代理。
              </n-alert>
              <n-data-table :columns="withTableSorters(merchantColumns)" :data="currentAgent.merchants" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1180" />
            </n-tab-pane>

            <n-tab-pane name="bet-limits" tab="下注限額授權">
              <n-alert type="info" :show-icon="false" class="mb-3">
                代理只能把平台已勾選開放的 Provider 幣別線下注限額方案再分配給下級代理或商戶；方案區間不可修改，L3 不可再下放給子代理，但仍可指派給商戶。
              </n-alert>
              <n-data-table :columns="withTableSorters(limitAccessColumns)" :data="currentAgent.bet_limit_access" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1120" />
            </n-tab-pane>

            <n-tab-pane name="settlement" tab="結算邏輯">
              <n-descriptions bordered :column="1" label-placement="left">
                <n-descriptions-item label="GGAP 正式收款">只對 L1 代理：{{ rootAgent(currentAgent).agent_name }} / {{ currentAgent.settlement_agent_code }}</n-descriptions-item>
                <n-descriptions-item label="代理結算主維度">settlement_agent_id + settlement_currency + period</n-descriptions-item>
                <n-descriptions-item label="代理帳務明細">agent_id / agent_level / parent_agent_id / merchant_id / provider_id / display_currency</n-descriptions-item>
                <n-descriptions-item label="平台毛利">僅由 GGAP 對 L1 的費率差、供應商成本與匯率服務費形成。</n-descriptions-item>
                <n-descriptions-item label="非 GGAP 帳務">L1 對 L2、L2 對 L3、代理對商戶的差額只作代理報表與層級毛利試算。</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="audit" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item
                  v-for="log in currentAgent.audit_logs"
                  :key="log.trace_id"
                  type="success"
                  :title="log.action"
                  :time="formatDateTime(log.operated_at)"
                >
                  <div class="text-sm text-gray-500">{{ log.operator }} · {{ log.trace_id }}</div>
                </n-timeline-item>
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <div v-if="currentAgent" class="flex flex-wrap justify-end gap-2">
            <n-button secondary @click="openEdit(currentAgent)">編輯</n-button>
            <n-button secondary @click="viewMerchants(currentAgent)">查看商戶</n-button>
            <n-button secondary @click="viewRates(currentAgent)">查看費率</n-button>
            <n-button type="primary" @click="toggleAgentStatus(currentAgent)">
              {{ currentAgent.status === 'active' ? '停用代理' : '啟用代理' }}
            </n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-drawer v-model:show="showForm" width="min(820px, 100vw)">
      <n-drawer-content closable>
        <template #header>{{ editingAgent ? '編輯代理' : '新增代理' }}</template>
        <n-form label-placement="top">
          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <n-form-item label="代理層級">
              <n-select v-model:value="formValue.agent_level" :options="levelOptions" :disabled="!!editingAgent" @update:value="syncParentByLevel" />
            </n-form-item>
            <n-form-item label="上層代理">
              <n-select
                v-model:value="formValue.parent_agent_code"
                clearable
                :disabled="formValue.agent_level === 1 || !!editingAgent"
                :options="parentAgentOptions"
                :placeholder="formValue.agent_level === 1 ? 'L1 直接對 GGAP' : '請選擇上層代理'"
              />
            </n-form-item>
            <n-form-item label="代理代碼">
              <n-input v-model:value="formValue.agent_code" :disabled="!!editingAgent" placeholder="例：AGT-SEA-002" />
            </n-form-item>
            <n-form-item label="代理名稱">
              <n-input v-model:value="formValue.agent_name" placeholder="例：SEA Partner Agent" />
            </n-form-item>
            <n-form-item label="代理類型">
              <n-select v-model:value="formValue.agent_type" :options="agentTypeOptions" :disabled="!!editingAgent?.is_platform_direct" />
            </n-form-item>
            <n-form-item label="狀態">
              <n-select v-model:value="formValue.status" :options="statusOptions" />
            </n-form-item>
            <n-form-item label="聯絡人"><n-input v-model:value="formValue.contact_name" /></n-form-item>
            <n-form-item label="Email"><n-input v-model:value="formValue.contact_email" /></n-form-item>
            <n-form-item label="Telegram"><n-input v-model:value="formValue.telegram" /></n-form-item>
            <n-form-item label="交易幣別">
              <n-select v-model:value="formValue.display_currencies" multiple :options="currencyOptions" />
            </n-form-item>
            <n-form-item label="匯率服務費率（GGAP）">
              <n-input-number v-model:value="formValue.service_fee_rate" :min="0" :max="0.2" :step="0.001" />
            </n-form-item>
            <n-form-item label="代理負 GGR 政策">
              <n-select v-model:value="formValue.negative_ggr_policy" :options="negativeGgrOptions" />
            </n-form-item>
            <n-form-item label="備註" class="md:col-span-2">
              <n-input v-model:value="formValue.remarks" type="textarea" />
            </n-form-item>
          </div>
        </n-form>
        <n-alert type="info" :show-icon="false">
          代理代碼、層級與上層代理建立後鎖定；如需轉移必須使用獨立轉移流程並檢查未結帳務。費率與下注限額授權可在代理詳情內建立新版本。
        </n-alert>
        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="showForm = false">取消</n-button>
            <n-button type="primary" @click="submitForm">{{ editingAgent ? '儲存' : '建立代理' }}</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
