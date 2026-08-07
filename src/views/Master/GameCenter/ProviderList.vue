<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCheckbox,
  NCheckboxGroup,
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
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { AddOutlined, SearchOutlined, SettingsOutlined, SportsEsportsOutlined, VisibilityOutlined } from '@vicons/material'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import { getProviderBetGroupGames, getProviderCurrencyBetGroups } from '../../../mocks/gameLimits'
import type { ProviderCurrencyBetGroup } from '../../../types/gameLimit'

type ProviderStatus = 'active' | 'maintenance' | 'disabled'
type ApiStatus = 'connected' | 'testing' | 'disabled'
type NegativeGgrPolicy = 'carry_forward' | 'zero_out'
type WalletMode = 'seamless' | 'transfer'

interface ProviderCurrencyLine {
  connection_id: string
  provider_currency_id: string
  provider_merchant_id: string
  currency: string
  accounting_currency?: 'USDT'
  invoice_currency?: string
  payment_currency?: string
  wallet_mode: WalletMode
  api_base_url: string
  api_key_mask: string
  credential_mask: string
  callback_url: string
  amount_precision: number
  status: ApiStatus
  is_default: boolean
  last_tested_at: string
}

interface ProviderGame {
  game_id: string
  game_name: string
  game_type: string
  status: ProviderStatus
}

interface ProviderCostRate {
  version: string
  provider_cost_rate: number
  negative_ggr_policy: NegativeGgrPolicy
  effective_at: string
  changed_by: string
  note: string
}

interface ProviderLog {
  action: string
  operator: string
  operated_at: string
  trace_id: string
}

interface ProviderRecord {
  provider_id: string
  provider_code: string
  provider_name: string
  provider_type: string
  status: ProviderStatus
  api_status: ApiStatus
  platform_accounting_currency: 'USDT'
  provider_cost_rate: number
  cost_rate_version: string
  negative_ggr_policy: NegativeGgrPolicy
  game_count: number
  enabled_game_count: number
  api_base_url: string
  callback_ip_whitelist: string[]
  secret_mask: string
  maintenance_window: string
  remark: string
  updated_at: string
  games: ProviderGame[]
  rates: ProviderCostRate[]
  logs: ProviderLog[]
  currency_connections: ProviderCurrencyLine[]
  bet_groups: ProviderCurrencyBetGroup[]
}

const message = useMessage()
const showDetail = ref(false)
const currentRow = ref<ProviderRecord | null>(null)
const detailTab = ref('basic')
const showCurrencyEditor = ref(false)
const showBetGroupManager = ref(false)
const editingCurrencyIndex = ref<number | null>(null)
const selectedCurrencyLine = ref<ProviderCurrencyLine | null>(null)
const selectedBetGroupIds = ref<string[]>([])
const currencyForm = ref<ProviderCurrencyLine>({
  connection_id: '',
  provider_currency_id: '',
  provider_merchant_id: '',
  currency: 'TWD',
  accounting_currency: 'USDT',
  invoice_currency: 'TWD',
  payment_currency: 'TWD',
  wallet_mode: 'seamless',
  api_base_url: '',
  api_key_mask: '',
  credential_mask: '',
  callback_url: '',
  amount_precision: 2,
  status: 'testing',
  is_default: false,
  last_tested_at: '-'
})
const searchText = ref('')
const statusFilter = ref<ProviderStatus | null>(null)
const typeFilter = ref<string | null>(null)
const apiFilter = ref<ApiStatus | null>(null)

const rows = ref<ProviderRecord[]>([
  {
    provider_id: 'PROV-PG',
    provider_code: 'PG',
    provider_name: 'PG Soft',
    provider_type: 'Slot',
    status: 'active',
    api_status: 'connected',
    platform_accounting_currency: 'USDT',
    provider_cost_rate: 0.04,
    cost_rate_version: 'PG-COST-2026.07',
    negative_ggr_policy: 'carry_forward',
    game_count: 42,
    enabled_game_count: 40,
    api_base_url: 'https://api.pg.example',
    callback_ip_whitelist: ['34.120.18.10', '34.120.18.11'],
    secret_mask: 'pg_live_********',
    maintenance_window: '每週三 05:00-05:30',
    remark: '各幣別線以原幣交易與供應商請款；平台另保存 USDT 日結帳務鏡像。',
    updated_at: '2026-07-07T08:20:00.000Z',
    games: [
      { game_id: 'PG-001', game_name: 'Mahjong Ways', game_type: 'Slot', status: 'active' },
      { game_id: 'PG-002', game_name: 'Mahjong Ways', game_type: 'Slot', status: 'active' }
    ],
    rates: [
      { version: 'PG-COST-2026.07', provider_cost_rate: 0.04, negative_ggr_policy: 'carry_forward', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', note: 'MVP 統一 USDT 成本費率。' },
      { version: 'PG-COST-2026.06', provider_cost_rate: 0.045, negative_ggr_policy: 'carry_forward', effective_at: '2026-06-01T00:00:00.000Z', changed_by: 'Finance', note: '前一版成本費率。' }
    ],
    logs: [
      { action: '測試 Provider USDT Wallet API', operator: 'System', operated_at: '2026-07-07T08:20:00.000Z', trace_id: 'trace-provider-pg-wallet' }
    ],
    currency_connections: [
      { connection_id: 'PC-PG-TWD', provider_currency_id: 'PG-CUR-TWD-01', provider_merchant_id: 'PG-MCH-YOTA-TWD', currency: 'TWD', wallet_mode: 'seamless', api_base_url: 'https://twd-api.pg.example', api_key_mask: 'pg_twd_********', credential_mask: 'cert_pg_twd_********', callback_url: 'https://api.ggap.example/provider/pg/twd/callback', amount_precision: 2, status: 'connected', is_default: true, last_tested_at: '2026-08-05T09:12:00.000Z' },
      { connection_id: 'PC-PG-THB', provider_currency_id: 'PG-CUR-THB-01', provider_merchant_id: 'PG-MCH-SEA-THB', currency: 'THB', wallet_mode: 'seamless', api_base_url: 'https://thb-api.pg.example', api_key_mask: 'pg_thb_********', credential_mask: 'cert_pg_thb_********', callback_url: 'https://api.ggap.example/provider/pg/thb/callback', amount_precision: 2, status: 'connected', is_default: false, last_tested_at: '2026-08-05T09:10:00.000Z' },
      { connection_id: 'PC-PG-USDT', provider_currency_id: 'PG-CUR-USDT-01', provider_merchant_id: 'PG-MCH-GGAP-USDT', currency: 'USDT', wallet_mode: 'transfer', api_base_url: 'https://usdt-api.pg.example', api_key_mask: 'pg_usdt_********', credential_mask: 'cert_pg_usdt_********', callback_url: 'https://api.ggap.example/provider/pg/usdt/callback', amount_precision: 2, status: 'testing', is_default: false, last_tested_at: '2026-08-05T08:45:00.000Z' }
    ],
    bet_groups: getProviderCurrencyBetGroups('PG')
  },
  {
    provider_id: 'PROV-EVO',
    provider_code: 'EVO',
    provider_name: 'Evolution',
    provider_type: 'Live',
    status: 'active',
    api_status: 'connected',
    platform_accounting_currency: 'USDT',
    provider_cost_rate: 0.06,
    cost_rate_version: 'EVO-COST-2026.07',
    negative_ggr_policy: 'carry_forward',
    game_count: 18,
    enabled_game_count: 18,
    api_base_url: 'https://api.evo.example',
    callback_ip_whitelist: ['35.201.18.42'],
    secret_mask: 'evo_live_********',
    maintenance_window: '未設定',
    remark: '真人供應商，接入時已設定成本費率。',
    updated_at: '2026-07-07T07:40:00.000Z',
    games: [
      { game_id: 'EVO-001', game_name: 'Baccarat A', game_type: 'Live', status: 'active' }
    ],
    rates: [
      { version: 'EVO-COST-2026.07', provider_cost_rate: 0.06, negative_ggr_policy: 'carry_forward', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', note: '真人遊戲成本費率。' }
    ],
    logs: [
      { action: 'Provider API 連線成功', operator: 'System', operated_at: '2026-07-07T07:40:00.000Z', trace_id: 'trace-provider-evo-api' }
    ],
    currency_connections: [
      { connection_id: 'PC-EVO-TWD', provider_currency_id: 'EVO-CUR-TWD-01', provider_merchant_id: 'EVO-MCH-TWD', currency: 'TWD', wallet_mode: 'seamless', api_base_url: 'https://twd-api.evo.example', api_key_mask: 'evo_twd_********', credential_mask: 'cert_evo_twd_********', callback_url: 'https://api.ggap.example/provider/evo/twd/callback', amount_precision: 2, status: 'connected', is_default: true, last_tested_at: '2026-08-05T07:40:00.000Z' },
      { connection_id: 'PC-EVO-PHP', provider_currency_id: 'EVO-CUR-PHP-01', provider_merchant_id: 'EVO-MCH-PHP', currency: 'PHP', wallet_mode: 'seamless', api_base_url: 'https://php-api.evo.example', api_key_mask: 'evo_php_********', credential_mask: 'cert_evo_php_********', callback_url: 'https://api.ggap.example/provider/evo/php/callback', amount_precision: 2, status: 'testing', is_default: false, last_tested_at: '2026-08-05T07:35:00.000Z' }
    ],
    bet_groups: getProviderCurrencyBetGroups('EVO')
  },
  {
    provider_id: 'PROV-PP',
    provider_code: 'PP',
    provider_name: 'Pragmatic Play',
    provider_type: 'Slot',
    status: 'maintenance',
    api_status: 'testing',
    platform_accounting_currency: 'USDT',
    provider_cost_rate: 0.05,
    cost_rate_version: 'PP-COST-2026.07',
    negative_ggr_policy: 'zero_out',
    game_count: 35,
    enabled_game_count: 31,
    api_base_url: 'https://api.pp.example',
    callback_ip_whitelist: ['35.241.88.90'],
    secret_mask: 'pp_live_********',
    maintenance_window: '每月第 1 個週日 04:00-05:00',
    remark: '負 GGR 依合約清零。',
    updated_at: '2026-07-06T04:10:00.000Z',
    games: [
      { game_id: 'PP-001', game_name: 'Gates of Olympus', game_type: 'Slot', status: 'maintenance' }
    ],
    rates: [
      { version: 'PP-COST-2026.07', provider_cost_rate: 0.05, negative_ggr_policy: 'zero_out', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', note: '負 GGR 清零。' }
    ],
    logs: [
      { action: '設定負 GGR 清零', operator: 'Finance', operated_at: '2026-06-24T04:10:00.000Z', trace_id: 'trace-provider-pp-ggr' }
    ],
    currency_connections: [
      { connection_id: 'PC-PP-VND', provider_currency_id: 'PP-CUR-VND-01', provider_merchant_id: 'PP-MCH-VND', currency: 'VND', wallet_mode: 'transfer', api_base_url: 'https://vnd-api.pp.example', api_key_mask: 'pp_vnd_********', credential_mask: 'cert_pp_vnd_********', callback_url: 'https://api.ggap.example/provider/pp/vnd/callback', amount_precision: 0, status: 'testing', is_default: true, last_tested_at: '2026-08-05T06:20:00.000Z' }
    ],
    bet_groups: getProviderCurrencyBetGroups('PP')
  },
  {
    provider_id: 'PROV-JILI',
    provider_code: 'JILI',
    provider_name: 'JILI Gaming',
    provider_type: 'Slot',
    status: 'disabled',
    api_status: 'disabled',
    platform_accounting_currency: 'USDT',
    provider_cost_rate: 0.052,
    cost_rate_version: 'JILI-COST-2026.07',
    negative_ggr_policy: 'zero_out',
    game_count: 21,
    enabled_game_count: 0,
    api_base_url: 'https://api.jili.example',
    callback_ip_whitelist: [],
    secret_mask: 'jili_live_********',
    maintenance_window: '未設定',
    remark: '暫停接入測試。',
    updated_at: '2026-07-07T10:12:00.000Z',
    games: [
      { game_id: 'JILI-001', game_name: 'Super Ace', game_type: 'Slot', status: 'disabled' }
    ],
    rates: [
      { version: 'JILI-COST-2026.07', provider_cost_rate: 0.052, negative_ggr_policy: 'zero_out', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', note: '維持 5.2% 成本。' }
    ],
    logs: [
      { action: '切換維護模式', operator: 'Ops', operated_at: '2026-07-07T10:12:00.000Z', trace_id: 'trace-provider-jili-maintenance' }
    ],
    currency_connections: [
      { connection_id: 'PC-JILI-PHP', provider_currency_id: 'JILI-CUR-PHP-01', provider_merchant_id: 'JILI-MCH-PHP', currency: 'PHP', wallet_mode: 'seamless', api_base_url: 'https://php-api.jili.example', api_key_mask: 'jili_php_********', credential_mask: 'cert_jili_php_********', callback_url: 'https://api.ggap.example/provider/jili/php/callback', amount_precision: 2, status: 'disabled', is_default: true, last_tested_at: '2026-08-04T10:12:00.000Z' },
      { connection_id: 'PC-JILI-IDR', provider_currency_id: 'JILI-CUR-IDR-01', provider_merchant_id: 'JILI-MCH-IDR', currency: 'IDR', wallet_mode: 'transfer', api_base_url: 'https://idr-api.jili.example', api_key_mask: 'jili_idr_********', credential_mask: 'cert_jili_idr_********', callback_url: 'https://api.ggap.example/provider/jili/idr/callback', amount_precision: 0, status: 'testing', is_default: false, last_tested_at: '2026-08-04T10:08:00.000Z' }
    ],
    bet_groups: getProviderCurrencyBetGroups('JILI')
  }
])

const statusMeta: Record<ProviderStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  active: { label: '啟用', type: 'success' },
  maintenance: { label: '維護中', type: 'warning' },
  disabled: { label: '停用', type: 'error' }
}
const apiMeta: Record<ApiStatus, { label: string; type: 'success' | 'warning' | 'default' }> = {
  connected: { label: '已連線', type: 'success' },
  testing: { label: '測試中', type: 'warning' },
  disabled: { label: '未啟用', type: 'default' }
}
const negativeGgrMeta: Record<NegativeGgrPolicy, string> = {
  carry_forward: '保留到下期',
  zero_out: '清零'
}

const statusOptions = [
  { label: '啟用', value: 'active' },
  { label: '維護中', value: 'maintenance' },
  { label: '停用', value: 'disabled' }
]
const apiOptions = [
  { label: '已連線', value: 'connected' },
  { label: '測試中', value: 'testing' },
  { label: '未啟用', value: 'disabled' }
]
const typeOptions = computed(() => Array.from(new Set(rows.value.map(row => row.provider_type))).map(value => ({ label: value, value })))

const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`
const formatDateTime = (value?: string) => value ? new Date(value).toLocaleString('zh-TW') : '-'

const filteredRows = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  return rows.value.filter(row => {
    const inKeyword = !keyword
      || row.provider_code.toLowerCase().includes(keyword)
      || row.provider_name.toLowerCase().includes(keyword)
      || row.provider_id.toLowerCase().includes(keyword)
    const inStatus = !statusFilter.value || row.status === statusFilter.value
    const inType = !typeFilter.value || row.provider_type === typeFilter.value
    const inApi = !apiFilter.value || row.api_status === apiFilter.value
    return inKeyword && inStatus && inType && inApi
  })
})

const summary = computed(() => ({
  total: rows.value.length,
  active: rows.value.filter(row => row.status === 'active').length,
  maintenance: rows.value.filter(row => row.status === 'maintenance').length,
  games: rows.value.reduce((sum, row) => sum + row.game_count, 0),
  enabledGames: rows.value.reduce((sum, row) => sum + row.enabled_game_count, 0),
  currencyLines: rows.value.reduce((sum, row) => sum + row.currency_connections.length, 0),
  suppliedBetGroups: rows.value.reduce((sum, row) => sum + row.bet_groups.length, 0),
  selectedBetGroups: rows.value.reduce((sum, row) => sum + row.bet_groups.filter(group => group.is_selected).length, 0)
}))

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = null
  typeFilter.value = null
  apiFilter.value = null
}

const openDetail = (row: ProviderRecord) => {
  currentRow.value = row
  detailTab.value = 'basic'
  showDetail.value = true
}

const openCurrencyManager = (row: ProviderRecord) => {
  currentRow.value = row
  detailTab.value = 'currencies'
  showDetail.value = true
}

const resetCurrencyForm = (row: ProviderRecord): ProviderCurrencyLine => ({
  connection_id: `PC-${row.provider_code}-${Date.now()}`,
  provider_currency_id: '',
  provider_merchant_id: '',
  currency: 'TWD',
  wallet_mode: 'seamless',
  api_base_url: '',
  api_key_mask: '',
  credential_mask: '',
  callback_url: `https://api.ggap.example/provider/${row.provider_code.toLowerCase()}/callback`,
  amount_precision: 2,
  status: 'testing',
  is_default: false,
  last_tested_at: '-'
})

const createCurrencyLine = () => {
  if (!currentRow.value) return
  editingCurrencyIndex.value = null
  currencyForm.value = resetCurrencyForm(currentRow.value)
  showCurrencyEditor.value = true
}

const editCurrencyLine = (line: ProviderCurrencyLine) => {
  if (!currentRow.value) return
  editingCurrencyIndex.value = currentRow.value.currency_connections.indexOf(line)
  currencyForm.value = {
    ...line,
    accounting_currency: 'USDT',
    invoice_currency: line.invoice_currency || line.currency,
    payment_currency: line.payment_currency || line.invoice_currency || line.currency
  }
  showCurrencyEditor.value = true
}

const saveCurrencyLine = () => {
  if (!currentRow.value || !currencyForm.value.provider_currency_id || !currencyForm.value.provider_merchant_id || !currencyForm.value.api_base_url) {
    message.warning('請填寫幣別 ID、廠商 ID 與 API URL。')
    return
  }
  const next = {
    ...currencyForm.value,
    accounting_currency: 'USDT' as const,
    invoice_currency: currencyForm.value.invoice_currency || currencyForm.value.currency,
    payment_currency: currencyForm.value.payment_currency || currencyForm.value.invoice_currency || currencyForm.value.currency
  }
  if (next.is_default) currentRow.value.currency_connections.forEach(line => { line.is_default = false })
  if (editingCurrencyIndex.value === null) currentRow.value.currency_connections.push(next)
  else currentRow.value.currency_connections.splice(editingCurrencyIndex.value, 1, next)
  currentRow.value.updated_at = new Date().toISOString()
  showCurrencyEditor.value = false
  message.success(editingCurrencyIndex.value === null ? '已新增幣別串接演示。' : '已更新幣別串接演示。')
}

const currencyBetGroups = computed(() => {
  if (!currentRow.value || !selectedCurrencyLine.value) return []
  return currentRow.value.bet_groups.filter(group => group.provider_currency_connection_id === selectedCurrencyLine.value?.connection_id)
})

const openBetGroupManager = (line: ProviderCurrencyLine) => {
  if (!currentRow.value) return
  selectedCurrencyLine.value = line
  selectedBetGroupIds.value = currentRow.value.bet_groups
    .filter(group => group.provider_currency_connection_id === line.connection_id && group.is_selected)
    .map(group => group.provider_bet_group_id)
  showBetGroupManager.value = true
}

const syncBetGroups = () => {
  message.success(`已重新同步 ${selectedCurrencyLine.value?.currency || ''} 的下注限額方案。`)
}

const betGroupGameNames = (groupId: string) => {
  const games = getProviderBetGroupGames(groupId)
  return games.length ? games.map(game => game.provider_game_name).join('、') : '等待 Provider 遊戲映射'
}

const saveBetGroupSelection = () => {
  if (!currentRow.value || !selectedCurrencyLine.value) return
  if (selectedCurrencyLine.value.status === 'connected' && selectedBetGroupIds.value.length === 0) {
    message.warning('已連線的幣別線至少需開放一個下注限額方案。')
    return
  }
  const selected = new Set(selectedBetGroupIds.value)
  currentRow.value.bet_groups.forEach(group => {
    if (group.provider_currency_connection_id === selectedCurrencyLine.value?.connection_id) {
      group.is_selected = group.status === 'available' && selected.has(group.provider_bet_group_id)
    }
  })
  currentRow.value.updated_at = new Date().toISOString()
  showBetGroupManager.value = false
  message.success(`已更新 ${selectedCurrencyLine.value.currency} 的下注限額方案。`)
}

const actionMessage = (label: string, row?: ProviderRecord) => {
  message.info(`${label}${row ? `：${row.provider_name}` : ''}，演示操作已保留。`)
}

const columns: DataTableColumns<ProviderRecord> = [
  {
    title: '供應商',
    key: 'provider_name',
    width: 230,
    fixed: 'left',
    render: row => h('button', { class: 'text-left hover:text-cyan-300', onClick: () => openDetail(row) }, [
      h('div', { class: 'font-semibold' }, row.provider_name),
      h('div', { class: 'font-mono text-xs text-slate-500' }, `${row.provider_code} / ${row.provider_id}`)
    ])
  },
  { title: '類型', key: 'provider_type', width: 90, render: row => h(NTag, { size: 'small', bordered: false }, { default: () => row.provider_type }) },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false }, { default: () => statusMeta[row.status].label }) },
  { title: 'API 狀態', key: 'api_status', width: 110, render: row => h(NTag, { type: apiMeta[row.api_status].type, bordered: false }, { default: () => apiMeta[row.api_status].label }) },
  {
    title: '幣別線',
    key: 'currency_connections',
    width: 190,
    sorter: (a, b) => a.currency_connections.length - b.currency_connections.length,
    render: row => h(NSpace, { size: 4, wrap: false }, {
      default: () => row.currency_connections.slice(0, 3).map(line => h(NTag, { size: 'small', bordered: false, type: line.status === 'connected' ? 'success' : line.status === 'testing' ? 'warning' : 'default' }, { default: () => line.currency }))
    })
  },
  { title: '限額方案', key: 'bet_groups', width: 120, align: 'right', sorter: (a, b) => a.bet_groups.filter(group => group.is_selected).length - b.bet_groups.filter(group => group.is_selected).length, render: row => `${row.bet_groups.filter(group => group.is_selected).length}/${row.bet_groups.length} 個` },
  { title: '平台帳務幣別', key: 'platform_accounting_currency', width: 130, render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.platform_accounting_currency }) },
  { title: '成本費率', key: 'provider_cost_rate', width: 110, align: 'right', sorter: (a, b) => a.provider_cost_rate - b.provider_cost_rate, render: row => formatRate(row.provider_cost_rate) },
  { title: '負 GGR', key: 'negative_ggr_policy', width: 120, render: row => negativeGgrMeta[row.negative_ggr_policy] },
  { title: '費率版本', key: 'cost_rate_version', width: 150, render: row => h('span', { class: 'font-mono text-xs text-slate-400' }, row.cost_rate_version) },
  { title: '遊戲數', key: 'game_count', width: 100, align: 'right', render: row => `${row.enabled_game_count}/${row.game_count}` },
  { title: '更新時間', key: 'updated_at', width: 175, render: row => formatDateTime(row.updated_at) },
  {
    title: '操作',
    key: 'actions',
    width: 330,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(NIcon, { component: VisibilityOutlined }), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => openCurrencyManager(row) }, { default: () => '幣別' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => actionMessage('測試 API', row) }, { default: () => '測試' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => actionMessage('同步遊戲', row) }, { icon: () => h(NIcon, { component: SportsEsportsOutlined }), default: () => '同步' })
      ]
    })
  }
]

const gameColumns: DataTableColumns<ProviderGame> = [
  { title: '遊戲 ID', key: 'game_id', width: 120 },
  { title: '遊戲名稱', key: 'game_name' },
  { title: '類型', key: 'game_type', width: 100 },
  { title: '狀態', key: 'status', width: 120, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false }, { default: () => statusMeta[row.status].label }) }
]

const rateColumns: DataTableColumns<ProviderCostRate> = [
  { title: '版本', key: 'version', width: 150 },
  { title: '成本費率', key: 'provider_cost_rate', width: 120, render: row => formatRate(row.provider_cost_rate) },
  { title: '負 GGR', key: 'negative_ggr_policy', width: 130, render: row => negativeGgrMeta[row.negative_ggr_policy] },
  { title: '生效時間', key: 'effective_at', width: 175, render: row => formatDateTime(row.effective_at) },
  { title: '異動人', key: 'changed_by', width: 100 },
  { title: '備註', key: 'note' }
]

const currencyColumns: DataTableColumns<ProviderCurrencyLine> = [
  { title: '幣別', key: 'currency', width: 100, fixed: 'left', render: row => h(NTag, { type: row.is_default ? 'success' : 'default', bordered: false }, { default: () => `${row.currency}${row.is_default ? ' 預設' : ''}` }) },
  { title: '幣別線 ID', key: 'connection_id', width: 150, render: row => h('span', { class: 'font-mono text-xs text-cyan-300' }, row.connection_id) },
  { title: '幣別 ID', key: 'provider_currency_id', width: 165, render: row => h('span', { class: 'font-mono text-xs' }, row.provider_currency_id) },
  { title: '廠商 ID', key: 'provider_merchant_id', width: 175, render: row => h('span', { class: 'font-mono text-xs' }, row.provider_merchant_id) },
  { title: '錢包種類', key: 'wallet_mode', width: 120, render: row => h(NTag, { bordered: false, type: row.wallet_mode === 'seamless' ? 'info' : 'warning' }, { default: () => row.wallet_mode === 'seamless' ? '單一錢包' : '轉帳錢包' }) },
  { title: '帳務幣別', key: 'accounting_currency', width: 105, render: () => 'USDT' },
  { title: '請款／付款', key: 'invoice_currency', width: 130, render: row => `${row.invoice_currency || row.currency} / ${row.payment_currency || row.invoice_currency || row.currency}` },
  { title: 'API URL', key: 'api_base_url', width: 230, ellipsis: { tooltip: true } },
  { title: '金額精度', key: 'amount_precision', width: 100, align: 'right', render: row => `${row.amount_precision} 位` },
  { title: '供應商群組', key: 'supplied_bet_groups', width: 110, align: 'right', render: row => `${currentRow.value?.bet_groups.filter(group => group.provider_currency_connection_id === row.connection_id).length || 0} 組` },
  { title: '已開放', key: 'selected_bet_groups', width: 90, align: 'right', render: row => `${currentRow.value?.bet_groups.filter(group => group.provider_currency_connection_id === row.connection_id && group.is_selected).length || 0} 組` },
  { title: '狀態', key: 'status', width: 105, render: row => h(NTag, { type: apiMeta[row.status].type, bordered: false }, { default: () => apiMeta[row.status].label }) },
  { title: '測試時間', key: 'last_tested_at', width: 175, render: row => formatDateTime(row.last_tested_at) },
  { title: '操作', key: 'actions', width: 190, fixed: 'right', render: row => h(NSpace, { size: 6, wrap: false }, { default: () => [
    h(NButton, { size: 'small', type: 'primary', secondary: true, onClick: () => openBetGroupManager(row) }, { default: () => '限額方案' }),
    h(NButton, { size: 'small', secondary: true, onClick: () => editCurrencyLine(row) }, { default: () => '編輯' })
  ] }) }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">供應商管理</h1>
        <p class="mt-1 text-sm text-gray-500">
          管理 Provider 主檔、多幣別串接線、各幣別憑證、錢包種類、成本費率、遊戲同步與下注限額方案。
        </p>
      </div>
      <n-button type="primary" @click="actionMessage('新增供應商')">
        <template #icon><n-icon><AddOutlined /></n-icon></template>
        新增供應商
      </n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4 2xl:grid-cols-8">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="供應商總數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="啟用" :value="summary.active" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="維護中" :value="summary.maintenance" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="遊戲總數" :value="summary.games" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="啟用遊戲" :value="summary.enabledGames" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="幣別串接線" :value="summary.currencyLines" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="供應商限額方案" :value="summary.suppliedBetGroups" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="已開放方案" :value="summary.selectedBetGroups" /></div>
    </div>

    <n-alert type="info" :show-icon="false">
      每條供應商幣別線都有獨立憑證、錢包種類與下注限額方案。方案與投注區間由 Provider 提供，GGAP 只勾選要開放的方案，不可自行修改上下限。
    </n-alert>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#202026] p-4">
      <n-input v-model:value="searchText" clearable placeholder="搜尋供應商代碼 / 名稱 / ID" style="width: 320px; max-width: 100%;">
        <template #prefix><n-icon :component="SearchOutlined" class="opacity-60" /></template>
      </n-input>
      <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" style="width: 140px;" />
      <n-select v-model:value="typeFilter" clearable placeholder="類型" :options="typeOptions" style="width: 140px;" />
      <n-select v-model:value="apiFilter" clearable placeholder="API 狀態" :options="apiOptions" style="width: 150px;" />
      <n-button secondary @click="resetFilters">重置</n-button>
    </div>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredRows"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="2140"
    />

    <n-drawer v-model:show="showDetail" width="min(1040px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentRow" class="flex flex-wrap items-center gap-3">
            <span class="text-lg font-semibold">{{ currentRow.provider_name }}</span>
            <span class="font-mono text-sm text-slate-500">{{ currentRow.provider_code }}</span>
            <n-tag :type="statusMeta[currentRow.status].type" :bordered="false">{{ statusMeta[currentRow.status].label }}</n-tag>
            <n-tag type="success" :bordered="false">{{ currentRow.currency_connections.length }} 條幣別線</n-tag>
          </div>
        </template>

        <template v-if="currentRow">
          <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="成本費率">{{ formatRate(currentRow.provider_cost_rate) }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="啟用遊戲">{{ currentRow.enabled_game_count }} / {{ currentRow.game_count }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="負 GGR">{{ negativeGgrMeta[currentRow.negative_ggr_policy] }}</n-statistic></div>
            <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="費率版本">{{ currentRow.cost_rate_version }}</n-statistic></div>
          </div>

          <n-tabs v-model:value="detailTab" type="line" animated>
            <n-tab-pane name="basic" tab="基本資料">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="供應商 ID">{{ currentRow.provider_id }}</n-descriptions-item>
                <n-descriptions-item label="供應商代碼">{{ currentRow.provider_code }}</n-descriptions-item>
                <n-descriptions-item label="類型">{{ currentRow.provider_type }}</n-descriptions-item>
                <n-descriptions-item label="狀態">{{ statusMeta[currentRow.status].label }}</n-descriptions-item>
                <n-descriptions-item label="維護時段">{{ currentRow.maintenance_window }}</n-descriptions-item>
                <n-descriptions-item label="更新時間">{{ formatDateTime(currentRow.updated_at) }}</n-descriptions-item>
                <n-descriptions-item label="備註" :span="2">{{ currentRow.remark }}</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="api" tab="API 設定">
              <n-descriptions bordered :column="2" label-placement="left">
                <n-descriptions-item label="API 狀態"><n-tag :type="apiMeta[currentRow.api_status].type" :bordered="false">{{ apiMeta[currentRow.api_status].label }}</n-tag></n-descriptions-item>
                <n-descriptions-item label="共用 API Base URL">{{ currentRow.api_base_url }}</n-descriptions-item>
                <n-descriptions-item label="共用 Secret">{{ currentRow.secret_mask }}</n-descriptions-item>
                <n-descriptions-item label="正式結算幣別">USDT</n-descriptions-item>
                <n-descriptions-item label="IP 白名單" :span="2">{{ currentRow.callback_ip_whitelist.join(', ') || '未設定' }}</n-descriptions-item>
                <n-descriptions-item label="個別串接設定" :span="2">API Key、憑證、URL、Provider 幣別 ID 與廠商 ID 改由「幣別管理」逐線維護。</n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="currencies" tab="幣別管理">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <n-alert type="info" :show-icon="false" class="min-w-0 flex-1">
                  Provider 交易必須命中一條啟用中的幣別線；每條線都有獨立憑證、錢包模式與供應商提供的下注限額方案，請由列內「限額方案」勾選開放。
                </n-alert>
                <n-button type="primary" @click="createCurrencyLine">
                  <template #icon><n-icon><AddOutlined /></n-icon></template>
                  新增幣別
                </n-button>
              </div>
              <n-data-table :columns="withTableSorters(currencyColumns)" :data="currentRow.currency_connections" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1810" />
            </n-tab-pane>

            <n-tab-pane name="rates" tab="成本費率">
              <n-data-table :columns="withTableSorters(rateColumns)" :data="currentRow.rates" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="900" />
            </n-tab-pane>

            <n-tab-pane name="games" tab="遊戲清單">
              <n-data-table :columns="withTableSorters(gameColumns)" :data="currentRow.games" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="620" />
            </n-tab-pane>

            <n-tab-pane name="logs" tab="操作紀錄">
              <n-timeline>
                <n-timeline-item v-for="log in currentRow.logs" :key="log.trace_id" type="success" :title="log.action" :time="formatDateTime(log.operated_at)">
                  <div class="text-sm text-gray-500">{{ log.operator }} / {{ log.trace_id }}</div>
                </n-timeline-item>
              </n-timeline>
            </n-tab-pane>
          </n-tabs>
        </template>

        <template #footer>
          <div v-if="currentRow" class="flex flex-wrap justify-end gap-2">
            <n-button secondary @click="actionMessage('測試 API', currentRow)">
              <template #icon><n-icon><SettingsOutlined /></n-icon></template>
              測試 API
            </n-button>
            <n-button secondary @click="actionMessage('同步遊戲', currentRow)">同步遊戲</n-button>
            <n-button secondary @click="openCurrencyManager(currentRow)">幣別管理</n-button>
            <n-button type="primary" secondary @click="actionMessage('更新成本費率', currentRow)">更新成本費率</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-drawer v-model:show="showCurrencyEditor" width="min(620px, 100vw)" placement="right">
      <n-drawer-content :title="editingCurrencyIndex === null ? '新增供應商幣別' : '編輯供應商幣別'" closable>
        <n-alert type="warning" :show-icon="false" class="mb-5">
          API Key 與憑證正式環境只允許後端加密保存；前端讀取時只能取得遮罩值。
        </n-alert>
        <n-form label-placement="top">
          <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <n-form-item label="幣別" required><n-select v-model:value="currencyForm.currency" :options="['TWD','THB','PHP','VND','IDR','USD','USDT'].map(value => ({ label: value, value }))" /></n-form-item>
            <n-form-item label="錢包種類" required><n-select v-model:value="currencyForm.wallet_mode" :options="[{ label: '單一錢包', value: 'seamless' }, { label: '轉帳錢包', value: 'transfer' }]" /></n-form-item>
            <n-form-item label="平台帳務幣別"><n-input value="USDT" readonly /></n-form-item>
            <n-form-item label="供應商請款幣別"><n-select v-model:value="currencyForm.invoice_currency" :options="['TWD','THB','PHP','VND','IDR','USD','USDT'].map(value => ({ label: value, value }))" /></n-form-item>
            <n-form-item label="實際付款幣別"><n-select v-model:value="currencyForm.payment_currency" :options="['TWD','THB','PHP','VND','IDR','USD','USDT'].map(value => ({ label: value, value }))" /></n-form-item>
            <n-form-item label="Provider 幣別 ID" required><n-input v-model:value="currencyForm.provider_currency_id" placeholder="例如 PG-CUR-TWD-01" /></n-form-item>
            <n-form-item label="Provider 廠商 ID" required><n-input v-model:value="currencyForm.provider_merchant_id" placeholder="例如 PG-MCH-YOTA-TWD" /></n-form-item>
            <n-form-item label="API Key" required><n-input v-model:value="currencyForm.api_key_mask" type="password" show-password-on="click" placeholder="由後端加密保存" /></n-form-item>
            <n-form-item label="憑證 / Secret" required><n-input v-model:value="currencyForm.credential_mask" type="password" show-password-on="click" placeholder="憑證內容或 Secret" /></n-form-item>
            <n-form-item label="API URL" required class="md:col-span-2"><n-input v-model:value="currencyForm.api_base_url" placeholder="https://api.provider.example" /></n-form-item>
            <n-form-item label="Callback URL" class="md:col-span-2"><n-input v-model:value="currencyForm.callback_url" /></n-form-item>
            <n-form-item label="金額小數位"><n-input-number v-model:value="currencyForm.amount_precision" :min="0" :max="8" /></n-form-item>
            <n-form-item label="連線狀態"><n-select v-model:value="currencyForm.status" :options="apiOptions" /></n-form-item>
            <n-form-item label="預設幣別線"><n-switch v-model:value="currencyForm.is_default" /></n-form-item>
          </div>
        </n-form>
        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="showCurrencyEditor = false">取消</n-button>
            <n-button type="primary" @click="saveCurrencyLine">儲存演示</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>

    <n-drawer v-model:show="showBetGroupManager" width="min(720px, 100vw)" placement="right">
      <n-drawer-content :title="`${selectedCurrencyLine?.currency || ''} 下注限額方案`" closable>
        <n-alert type="info" :show-icon="false" class="mb-5">
          下列方案由 Provider 依此幣別線提供。GGAP 只能勾選開放，方案代碼、上下限、跳動單位與支援遊戲數皆不可修改。
        </n-alert>
        <n-checkbox-group v-model:value="selectedBetGroupIds">
          <div class="space-y-3">
            <label
              v-for="group in currencyBetGroups"
              :key="group.provider_bet_group_id"
              class="block cursor-pointer rounded border border-white/10 bg-[#202026] p-4"
              :class="group.status === 'deprecated' ? 'cursor-not-allowed opacity-55' : 'hover:border-emerald-400/50'"
            >
              <div class="flex items-start justify-between gap-4">
                <n-checkbox :value="group.provider_bet_group_id" :disabled="group.status === 'deprecated'">
                  <span class="font-semibold">{{ group.provider_bet_group_name }}</span>
                </n-checkbox>
                <div class="flex flex-wrap justify-end gap-2">
                  <n-tag v-if="group.is_default" type="success" size="small" :bordered="false">Provider 預設</n-tag>
                  <n-tag :type="group.status === 'available' ? 'info' : 'default'" size="small" :bordered="false">
                    {{ group.status === 'available' ? '可用' : '已淘汰' }}
                  </n-tag>
                </div>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div><div class="text-xs text-gray-500">投注區間</div><div class="mt-1 font-mono">{{ group.currency }} {{ group.min_bet.toLocaleString() }} - {{ group.max_bet.toLocaleString() }}</div></div>
                <div><div class="text-xs text-gray-500">跳動單位</div><div class="mt-1 font-mono">{{ group.bet_step.toLocaleString() }}</div></div>
                <div>
                  <div class="text-xs text-gray-500">支援遊戲</div>
                  <div class="mt-1">{{ group.supported_game_count }} 款</div>
                  <div class="mt-1 text-xs text-gray-500">{{ betGroupGameNames(group.provider_bet_group_id) }}</div>
                </div>
                <div><div class="text-xs text-gray-500">版本</div><div class="mt-1 font-mono text-xs">{{ group.version }}</div></div>
              </div>
              <div class="mt-3 font-mono text-xs text-gray-500">{{ group.provider_bet_group_code }}</div>
            </label>
          </div>
        </n-checkbox-group>
        <n-alert v-if="currencyBetGroups.length === 0" type="warning" :show-icon="false">
          此幣別線尚未同步到供應商下注限額方案。
        </n-alert>
        <template #footer>
          <div class="flex flex-wrap justify-end gap-2">
            <n-button secondary @click="syncBetGroups">同步供應商群組</n-button>
            <n-button @click="showBetGroupManager = false">取消</n-button>
            <n-button type="primary" @click="saveBetGroupSelection">儲存開放群組</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
