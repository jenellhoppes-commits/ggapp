<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  NAlert,
  NButton,
  NCheckbox,
  NCheckboxGroup,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui'
import type { FormInst } from 'naive-ui'
import type { Merchant, MerchantCallbackAmountMode, MerchantCurrency, MerchantStatus, MerchantWalletMode } from '../../../../types/merchant'
import { getAgentAssignableBetGroups } from '../../../../mocks/gameLimits'
import type { MerchantBetLimitAssignment, ProviderCurrencyBetGroup } from '../../../../types/gameLimit'

const props = defineProps<{
  show: boolean
  merchant: Merchant | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'refresh'): void
}>()

interface MerchantQuoteRateForm {
  provider_key: string
  provider_id: string
  provider_name: string
  provider_cost_rate_snapshot: number
  agent_upstream_rate: number
  quote_markup_rate: number | null
  effective_at: string
  status: 'active' | 'draft' | 'expired'
}

interface MerchantEditForm {
  merchant_name: string
  site_code: string
  contact_name: string
  contact_email: string
  telegram: string
  phone: string
  status: MerchantStatus
  walletMode: MerchantWalletMode
  environment: 'sandbox' | 'production'
  api_status: 'active' | 'disabled' | 'testing'
  sign_method: 'HMAC-SHA256' | 'RSA'
  callback_url: string
  ipWhitelistText: string
  timeout_ms: number
  retry_count: number
  allow_negative_balance: boolean
  idempotency_enabled: boolean
  multi_currency_enabled: boolean
  display_currencies: MerchantCurrency[]
  default_display_currency: MerchantCurrency
  settlement_currency: 'USDT'
  callback_amount_mode: MerchantCallbackAmountMode
  service_fee_rate: number
  default_merchant_markup_rate: number
  agent_name: string
  agent_effective_at: string
  merchant_quote_rates: MerchantQuoteRateForm[]
  credit_limit: number
  remarks: string
}

interface AgentMeta {
  code: string
  direct: boolean
  level: 1 | 2 | 3
  parent: string | null
  root: string
  settlement: string
  path: string
  service_fee_rate: number
  rates: Record<string, number>
}

interface ProviderCostMeta {
  id: string
  name: string
  cost: number
}

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const saving = ref(false)
const originalAgentName = ref('')
const transferReason = ref('')
const selectedLimitIds = ref<string[]>([])

const formValue = reactive<MerchantEditForm>({
  merchant_name: '',
  site_code: '',
  contact_name: '',
  contact_email: '',
  telegram: '',
  phone: '',
  status: 'active',
  walletMode: 'seamless',
  environment: 'sandbox',
  api_status: 'testing',
  sign_method: 'HMAC-SHA256',
  callback_url: '',
  ipWhitelistText: '',
  timeout_ms: 5000,
  retry_count: 2,
  allow_negative_balance: false,
  idempotency_enabled: true,
  multi_currency_enabled: true,
  display_currencies: ['TWD'],
  default_display_currency: 'TWD',
  settlement_currency: 'USDT',
  callback_amount_mode: 'transaction_currency',
  service_fee_rate: 0.005,
  default_merchant_markup_rate: 0.01,
  agent_name: '平台直營代理',
  agent_effective_at: '',
  merchant_quote_rates: [],
  credit_limit: 0,
  remarks: ''
})

const statusOptions = [
  { label: '啟用', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '凍結', value: 'frozen' },
  { label: '封存', value: 'archived' }
]

const walletOptions = [
  { label: 'Seamless Wallet', value: 'seamless' },
  { label: 'Transfer Wallet', value: 'transfer' }
]

const environmentOptions = [
  { label: 'Sandbox', value: 'sandbox' },
  { label: 'Production', value: 'production' }
]

const apiStatusOptions = [
  { label: '啟用', value: 'active' },
  { label: '測試中', value: 'testing' },
  { label: '停用', value: 'disabled' }
]

const signMethodOptions = [
  { label: 'HMAC-SHA256', value: 'HMAC-SHA256' },
  { label: 'RSA', value: 'RSA' }
]

const callbackAmountModeOptions = [
  { label: '交易／錢包原幣（預設）', value: 'transaction_currency' },
  { label: '正式結算幣別（僅限 USDT 錢包商戶）', value: 'settlement_currency' }
]

const agentOptions = [
  { label: 'L1 平台直營代理', value: '平台直營代理' },
  { label: 'L1 SEA Growth Agent', value: 'SEA Growth Agent' },
  { label: 'L2 SEA Sub Agent 01', value: 'SEA Sub Agent 01' },
  { label: 'L3 SEA Local Desk L3', value: 'SEA Local Desk L3' }
]

const agentMeta: Record<string, AgentMeta> = {
  '平台直營代理': { code: 'AGT-DIRECT', direct: true, level: 1, parent: null, root: 'AGT-DIRECT', settlement: 'AGT-DIRECT', path: 'AGT-DIRECT', service_fee_rate: 0.005, rates: { pg: 0.07, jili: 0.085, evo: 0.1, pp: 0.082 } },
  'SEA Growth Agent': { code: 'AGT-SEA-001', direct: false, level: 1, parent: null, root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001', service_fee_rate: 0.004, rates: { pg: 0.075, jili: 0.09, evo: 0.095, pp: 0.078 } },
  'SEA Sub Agent 01': { code: 'AGT-SEA-SUB01', direct: false, level: 2, parent: 'AGT-SEA-001', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01', service_fee_rate: 0.004, rates: { pg: 0.088, jili: 0.102, evo: 0.108, pp: 0.092 } },
  'SEA Local Desk L3': { code: 'AGT-SEA-SUB01-L3', direct: false, level: 3, parent: 'AGT-SEA-SUB01', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3', service_fee_rate: 0.004, rates: { pg: 0.096, jili: 0.11, evo: 0.116, pp: 0.1 } }
}

const providerCostMeta: Record<string, ProviderCostMeta> = {
  pg: { id: 'PG', name: 'PG Soft', cost: 0.04 },
  jili: { id: 'JILI', name: 'JILI', cost: 0.05 },
  evo: { id: 'EVO', name: 'Evolution', cost: 0.06 },
  pp: { id: 'PP', name: 'Pragmatic Play', cost: 0.05 }
}

const defaultAgent = agentMeta['平台直營代理'] as AgentMeta
const selectedAgent = computed<AgentMeta>(() => agentMeta[formValue.agent_name] ?? defaultAgent)
const agentChanged = computed(() => !!originalAgentName.value && originalAgentName.value !== formValue.agent_name)
const authorizedProviderIds = computed(() => new Set(formValue.merchant_quote_rates.map(rate => rate.provider_id)))
const agentBetGroups = computed(() => getAgentAssignableBetGroups(selectedAgent.value.code)
  .filter(group => authorizedProviderIds.value.has(group.provider_id)))
const displayCurrencyOptions = computed(() => Array.from(new Set(agentBetGroups.value.map(group => group.currency)))
  .map(value => ({ label: value as MerchantCurrency, value: value as MerchantCurrency })))
const availableBetGroups = computed(() => agentBetGroups.value.filter(group =>
  formValue.display_currencies.includes(group.currency as MerchantCurrency)
))
const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`

const buildQuoteRates = (merchant?: Merchant): MerchantQuoteRateForm[] => {
  const existingByProvider = new Map((merchant?.merchant_quote_rates || []).map(rate => [rate.provider_id.toLowerCase(), rate]))
  return Object.entries(providerCostMeta).map(([providerKey, provider]) => {
    const existing = existingByProvider.get(provider.id.toLowerCase())
    const upstreamRate = selectedAgent.value.rates[providerKey] ?? provider.cost + 0.03
    const existingMarkup = existing?.quote_markup_source === 'provider_override'
      ? existing.quote_markup_rate ?? existing.merchant_quote_rate - existing.agent_upstream_rate
      : null
    return {
      provider_key: providerKey,
      provider_id: provider.id,
      provider_name: provider.name,
      provider_cost_rate_snapshot: existing?.provider_cost_rate_snapshot ?? provider.cost,
      agent_upstream_rate: upstreamRate,
      quote_markup_rate: existingMarkup,
      effective_at: existing?.effective_at ?? new Date().toISOString(),
      status: existing?.status ?? 'active'
    }
  })
}

const quoteRows = computed(() => formValue.merchant_quote_rates.map((rate) => {
  const markupRate = typeof rate.quote_markup_rate === 'number' ? rate.quote_markup_rate : formValue.default_merchant_markup_rate
  return {
    ...rate,
    quote_markup_rate: markupRate,
    quote_markup_source: typeof rate.quote_markup_rate === 'number' ? 'provider_override' as const : 'merchant_default' as const,
    merchant_quote_rate: rate.agent_upstream_rate + markupRate,
    merchant_margin_rate: markupRate,
    rate_source_agent_id: selectedAgent.value.code,
    rate_source_agent_level: selectedAgent.value.level
  }
}))

const quoteRowAt = (index: number) => quoteRows.value[index] ?? {
  merchant_quote_rate: 0,
  quote_markup_source: 'merchant_default'
}

watch(() => props.show, (show) => {
  if (!show || !props.merchant) return
  const merchant = props.merchant
  formValue.merchant_name = merchant.merchant_name || merchant.name || ''
  formValue.site_code = merchant.site_code || ''
  formValue.contact_name = merchant.contact_name || ''
  formValue.contact_email = merchant.contact_email || ''
  formValue.telegram = merchant.telegram || ''
  formValue.phone = merchant.phone || ''
  formValue.status = merchant.status || (merchant.state === 1 ? 'active' : 'disabled')
  formValue.walletMode = merchant.walletMode || merchant.wallet_mode || 'seamless'
  formValue.environment = merchant.environment || 'sandbox'
  formValue.api_status = merchant.api_status || 'testing'
  formValue.sign_method = merchant.sign_method || 'HMAC-SHA256'
  formValue.callback_url = merchant.callback_url || ''
  formValue.ipWhitelistText = (merchant.ipWhitelist || merchant.ip_whitelist || []).join('\n')
  formValue.timeout_ms = merchant.timeout_ms || 5000
  formValue.retry_count = merchant.retry_count || 2
  formValue.allow_negative_balance = !!merchant.allow_negative_balance
  formValue.idempotency_enabled = merchant.idempotency_enabled !== false
  formValue.multi_currency_enabled = merchant.multi_currency_enabled !== false
  formValue.display_currencies = merchant.transaction_currencies || merchant.display_currencies || [merchant.default_transaction_currency || merchant.default_display_currency || merchant.currency_type || 'TWD']
  formValue.default_display_currency = merchant.default_transaction_currency || merchant.default_display_currency || merchant.currency_type || 'TWD'
  formValue.settlement_currency = 'USDT'
  formValue.callback_amount_mode = merchant.callback_amount_mode || 'transaction_currency'
  formValue.service_fee_rate = merchant.service_fee_rate ?? 0.005
  formValue.default_merchant_markup_rate = merchant.default_merchant_markup_rate ?? 0.01
  formValue.agent_name = merchant.agent_name || merchant.parent_agent || '平台直營代理'
  originalAgentName.value = formValue.agent_name
  transferReason.value = ''
  formValue.agent_effective_at = merchant.agent_effective_at || new Date().toISOString()
  formValue.credit_limit = merchant.credit_limit || 0
  formValue.remarks = merchant.remarks || ''
  formValue.merchant_quote_rates = buildQuoteRates(merchant)
  selectedLimitIds.value = merchant.bet_limit_assignments?.length
    ? merchant.bet_limit_assignments.map(item => item.provider_bet_group_id)
    : availableBetGroups.value.filter(group => group.is_default).map(group => group.provider_bet_group_id)
})

watch(() => formValue.agent_name, () => {
  if (!props.show) return
  formValue.service_fee_rate = selectedAgent.value.service_fee_rate
  formValue.merchant_quote_rates = buildQuoteRates(props.merchant || undefined)
  const availableCurrencies = new Set(displayCurrencyOptions.value.map(option => option.value))
  formValue.display_currencies = formValue.display_currencies.filter(currency => availableCurrencies.has(currency))
  if (!formValue.display_currencies.length && displayCurrencyOptions.value[0]) formValue.display_currencies = [displayCurrencyOptions.value[0].value]
  if (!formValue.display_currencies.includes(formValue.default_display_currency)) {
    formValue.default_display_currency = formValue.display_currencies[0] || 'TWD'
  }
})

watch(() => [...formValue.display_currencies], () => {
  if (!props.show) return
  const availableIds = new Set(availableBetGroups.value.map(group => group.provider_bet_group_id))
  selectedLimitIds.value = selectedLimitIds.value.filter(id => availableIds.has(id))
  if (!selectedLimitIds.value.length) {
    selectedLimitIds.value = availableBetGroups.value.filter(group => group.is_default).map(group => group.provider_bet_group_id)
  }
})

const closeDrawer = () => emit('update:show', false)

const buildLimitAssignment = (group: ProviderCurrencyBetGroup): MerchantBetLimitAssignment => ({
  merchant_id: props.merchant?.display_id || '',
  provider_id: group.provider_id,
  provider_name: ({ PG: 'PG Soft', JILI: 'JILI', EVO: 'Evolution', PP: 'Pragmatic Play' } as Record<string, string>)[group.provider_id] || group.provider_id,
  provider_currency_connection_id: group.provider_currency_connection_id,
  provider_bet_group_id: group.provider_bet_group_id,
  provider_bet_group_code: group.provider_bet_group_code,
  provider_game_id: '*',
  game_type: '供應商遊戲',
  provider_bet_group_name: group.provider_bet_group_name,
  transaction_currency: group.currency,
  display_currency: group.currency,
  min_bet: group.min_bet,
  max_bet: group.max_bet,
  source: '管理者指派',
  status: '啟用'
})

const handleSave = async () => {
  saving.value = true
  try {
    const wasAgentChanged = agentChanged.value
    if (!formValue.display_currencies.length) {
      message.warning('請至少選擇一個交易／錢包幣別')
      return
    }
    if (!formValue.display_currencies.includes(formValue.default_display_currency)) {
      message.warning('預設交易／錢包幣別必須包含在可用幣別內')
      return
    }
    if (formValue.callback_amount_mode === 'settlement_currency'
      && (formValue.display_currencies.some(currency => currency !== 'USDT') || formValue.default_display_currency !== 'USDT')) {
      message.warning('正式結算幣別 Callback 僅適用於交易／錢包幣別全部為 USDT 的商戶')
      return
    }
    if (wasAgentChanged && !transferReason.value.trim()) {
      message.warning('轉移代理時必須填寫原因')
      return
    }
    if (availableBetGroups.value.length && !selectedLimitIds.value.some(id => availableBetGroups.value.some(group => group.provider_bet_group_id === id))) {
      message.warning('請至少指派一個供應商幣別線已開放的下注限額方案')
      return
    }
    await new Promise(resolve => setTimeout(resolve, 500))
    if (props.merchant) {
      const operatedAt = new Date().toISOString()
      const previousAgentName = originalAgentName.value
      props.merchant.merchant_name = formValue.merchant_name
      props.merchant.site_code = formValue.site_code
      props.merchant.contact_name = formValue.contact_name
      props.merchant.contact_email = formValue.contact_email
      props.merchant.telegram = formValue.telegram
      props.merchant.phone = formValue.phone
      props.merchant.status = formValue.status
      props.merchant.state = formValue.status === 'active' ? 1 : 0
      props.merchant.walletMode = formValue.walletMode
      props.merchant.wallet_mode = formValue.walletMode
      props.merchant.callback_url = formValue.callback_url
      props.merchant.ipWhitelist = formValue.ipWhitelistText.split('\n').map(ip => ip.trim()).filter(Boolean)
      props.merchant.multi_currency_enabled = formValue.multi_currency_enabled
      props.merchant.transaction_currencies = formValue.display_currencies
      props.merchant.display_currencies = formValue.display_currencies
      props.merchant.default_transaction_currency = formValue.default_display_currency
      props.merchant.default_display_currency = formValue.default_display_currency
      props.merchant.callback_amount_mode = formValue.callback_amount_mode
      props.merchant.service_fee_rate = formValue.service_fee_rate
      props.merchant.default_merchant_markup_rate = formValue.default_merchant_markup_rate
      props.merchant.agent_name = formValue.agent_name
      props.merchant.agent_code = selectedAgent.value.code
      props.merchant.agent_level = selectedAgent.value.level
      props.merchant.parent_agent_code = selectedAgent.value.parent
      props.merchant.root_agent_code = selectedAgent.value.root
      props.merchant.settlement_agent_code = selectedAgent.value.settlement
      props.merchant.agent_path = selectedAgent.value.path
      props.merchant.is_direct_agent = selectedAgent.value.direct
      props.merchant.merchant_quote_rates = quoteRows.value.map(rate => ({
        ...rate,
        effective_at: operatedAt,
        rate_version: `MQR-${props.merchant?.display_id}-${rate.provider_id}-${operatedAt.slice(0, 10).replace(/-/g, '')}`
      }))
      props.merchant.bet_limit_assignments = availableBetGroups.value
        .filter(group => selectedLimitIds.value.includes(group.provider_bet_group_id))
        .map(buildLimitAssignment)
      if (wasAgentChanged) {
        props.merchant.agent_effective_at = operatedAt
        props.merchant.agent_transfer_logs = [
          {
            transfer_no: `MAT-${Date.now()}`,
            from_agent: previousAgentName,
            to_agent: formValue.agent_name,
            effective_at: operatedAt,
            operator: 'Admin',
            reason: transferReason.value.trim()
          },
          ...(props.merchant.agent_transfer_logs || [])
        ]
        originalAgentName.value = formValue.agent_name
      }
      props.merchant.audit_logs = [
        {
          audit_no: `AUD-${Date.now()}`,
          operated_at: operatedAt,
          operator: 'Admin',
          action: wasAgentChanged ? '轉移商戶代理並建立新費率版本' : '更新商戶設定並建立新費率版本',
          target: props.merchant.display_id,
          ip_address: '127.0.0.1',
          trace_id: `trace-merchant-${Date.now()}`,
          result: 'success'
        },
        ...(props.merchant.audit_logs || [])
      ]
      props.merchant.updated_at = operatedAt
    }
    message.success('商戶設定已儲存')
    emit('refresh')
    closeDrawer()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <n-drawer :show="show" width="min(920px, 100vw)" @update:show="(v) => emit('update:show', v)">
    <n-drawer-content :title="merchant ? `編輯商戶：${merchant.merchant_name || merchant.name}` : '編輯商戶'" closable>
      <n-form ref="formRef" :model="formValue" label-placement="left" label-width="130">
        <n-tabs type="line" animated>
          <n-tab-pane name="basic" tab="基本資料">
            <n-form-item label="商戶名稱"><n-input v-model:value="formValue.merchant_name" /></n-form-item>
            <n-form-item label="Site Code"><n-input v-model:value="formValue.site_code" /></n-form-item>
            <n-form-item label="狀態"><n-select v-model:value="formValue.status" :options="statusOptions" /></n-form-item>
            <n-form-item label="聯絡人"><n-input v-model:value="formValue.contact_name" /></n-form-item>
            <n-form-item label="Email"><n-input v-model:value="formValue.contact_email" /></n-form-item>
            <n-form-item label="Telegram"><n-input v-model:value="formValue.telegram" /></n-form-item>
            <n-form-item label="電話"><n-input v-model:value="formValue.phone" /></n-form-item>
            <n-form-item label="備註"><n-input v-model:value="formValue.remarks" type="textarea" /></n-form-item>
          </n-tab-pane>

          <n-tab-pane name="api" tab="API 設定">
            <n-form-item label="環境"><n-select v-model:value="formValue.environment" :options="environmentOptions" /></n-form-item>
            <n-form-item label="API 狀態"><n-select v-model:value="formValue.api_status" :options="apiStatusOptions" /></n-form-item>
            <n-form-item label="簽名方式"><n-select v-model:value="formValue.sign_method" :options="signMethodOptions" /></n-form-item>
            <n-form-item label="Callback URL"><n-input v-model:value="formValue.callback_url" /></n-form-item>
            <n-form-item label="Callback 金額"><n-select v-model:value="formValue.callback_amount_mode" :options="callbackAmountModeOptions" /></n-form-item>
            <n-form-item label="IP 白名單"><n-input v-model:value="formValue.ipWhitelistText" type="textarea" /></n-form-item>
          </n-tab-pane>

          <n-tab-pane name="wallet" tab="錢包設定">
            <n-form-item label="錢包模式"><n-select v-model:value="formValue.walletMode" :options="walletOptions" /></n-form-item>
            <n-form-item label="Timeout"><n-input-number v-model:value="formValue.timeout_ms" :min="1000" :step="500" /></n-form-item>
            <n-form-item label="Retry"><n-input-number v-model:value="formValue.retry_count" :min="0" :max="5" /></n-form-item>
            <n-form-item label="允許負餘額"><n-switch v-model:value="formValue.allow_negative_balance" /></n-form-item>
            <n-form-item label="冪等控制"><n-switch v-model:value="formValue.idempotency_enabled" /></n-form-item>
            <n-form-item label="信用額度"><n-input-number v-model:value="formValue.credit_limit" :min="0" /></n-form-item>
          </n-tab-pane>

          <n-tab-pane name="currency" tab="幣別設定">
            <n-form-item label="多交易幣別"><n-switch v-model:value="formValue.multi_currency_enabled" /></n-form-item>
            <n-form-item label="可用交易幣別"><n-select v-model:value="formValue.display_currencies" multiple :options="displayCurrencyOptions" /></n-form-item>
            <n-form-item label="預設交易／錢包幣別"><n-select v-model:value="formValue.default_display_currency" :options="displayCurrencyOptions" /></n-form-item>
            <n-form-item label="正式結算幣別"><n-tag type="success" :bordered="false">USDT</n-tag></n-form-item>
            <n-form-item label="匯率服務費（繼承）"><n-input :value="formatRate(formValue.service_fee_rate)" readonly /></n-form-item>
            <n-alert type="info" :show-icon="false">匯率服務費由 GGAP 獨立計收，不會自動併入商戶報價。</n-alert>
          </n-tab-pane>

          <n-tab-pane name="agent" tab="代理與報價">
            <n-alert type="warning" :show-icon="false" class="mb-4">
              商戶綁定代理時會帶入代理費率；商戶報價可依供應商單獨調整，未指定則套用預設商戶加價。匯率服務費另行計算。
            </n-alert>
            <n-form-item label="所屬代理"><n-select v-model:value="formValue.agent_name" :options="agentOptions" /></n-form-item>
            <n-alert v-if="agentChanged" type="error" :show-icon="false" class="mb-4">
              代理轉移只影響生效時間之後的新 Session、注單與日結；歷史資料仍保留原代理與費率快照。
            </n-alert>
            <n-form-item v-if="agentChanged" label="轉移原因" required><n-input v-model:value="transferReason" type="textarea" placeholder="請說明轉移原因與核准依據" /></n-form-item>
            <n-form-item label="預設商戶加價"><n-input-number v-model:value="formValue.default_merchant_markup_rate" :min="0" :max="0.2" :step="0.001" /></n-form-item>
            <n-descriptions bordered :column="2" label-placement="left" class="mb-4">
              <n-descriptions-item label="代理代碼">{{ selectedAgent.code }}</n-descriptions-item>
              <n-descriptions-item label="代理層級">L{{ selectedAgent.level }}</n-descriptions-item>
              <n-descriptions-item label="正式收款對象">{{ selectedAgent.settlement }}</n-descriptions-item>
              <n-descriptions-item label="代理路徑">{{ selectedAgent.path }}</n-descriptions-item>
            </n-descriptions>
            <div class="space-y-3">
              <div v-for="(rate, index) in formValue.merchant_quote_rates" :key="rate.provider_id" class="rounded border border-white/10 bg-[#202026] p-4">
                <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <strong>{{ rate.provider_name }}</strong>
                  <span class="text-sm text-gray-400">供應商成本 {{ formatRate(rate.provider_cost_rate_snapshot) }} / 代理費率 {{ formatRate(rate.agent_upstream_rate) }}</span>
                </div>
                <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <n-form-item label="商戶加成">
                    <n-input-number v-model:value="rate.quote_markup_rate" :min="0" :max="0.2" :step="0.001" clearable placeholder="空白則套用預設商戶加價" />
                  </n-form-item>
                  <n-form-item label="商戶報價">
                    <n-tag :bordered="false">{{ formatRate(quoteRowAt(index).merchant_quote_rate) }}</n-tag>
                  </n-form-item>
                  <n-form-item label="來源">
                    <n-tag :bordered="false">{{ quoteRowAt(index).quote_markup_source === 'provider_override' ? '供應商指定' : '商戶預設' }}</n-tag>
                  </n-form-item>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="limits" tab="下注限額">
            <n-alert type="info" :show-icon="false" class="mb-4">
              下注限額方案由 Provider 依串接幣別線提供。商戶只能勾選平台已開放且符合商戶交易幣別的方案，不可自行輸入投注上下限。
            </n-alert>
            <n-checkbox-group v-model:value="selectedLimitIds" class="block space-y-3">
              <label v-for="group in availableBetGroups" :key="group.provider_bet_group_id" class="flex cursor-pointer items-center justify-between gap-4 rounded border border-white/10 bg-[#202026] p-4">
                <div class="flex items-center gap-3">
                  <n-checkbox :value="group.provider_bet_group_id" />
                  <div><div>{{ group.provider_bet_group_name }}</div><div class="mt-1 font-mono text-xs text-gray-500">{{ group.provider_currency_connection_id }} / {{ group.provider_bet_group_code }}</div></div>
                </div>
                <div class="text-right text-sm"><n-tag size="small" :bordered="false">{{ group.currency }}</n-tag><div class="mt-1">{{ group.min_bet.toLocaleString() }} - {{ group.max_bet.toLocaleString() }}</div></div>
              </label>
            </n-checkbox-group>
            <n-alert v-if="!availableBetGroups.length" type="warning" :show-icon="false">目前交易幣別沒有可用方案，請先至供應商管理的幣別線開放下注限額方案。</n-alert>
          </n-tab-pane>
        </n-tabs>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="closeDrawer">取消</n-button>
          <n-button type="primary" :loading="saving" @click="handleSave">儲存設定</n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>
