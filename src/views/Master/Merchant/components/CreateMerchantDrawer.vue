<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import {
  NAlert,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NStep,
  NSteps,
  NSwitch,
  NTag,
  useMessage
} from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import type { Merchant, MerchantCurrency, MerchantStatus, MerchantWalletMode } from '../../../../types/merchant'

const props = defineProps<{ show: boolean }>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'refresh'): void
  (e: 'created', merchant: Merchant): void
}>()

interface MerchantCreateForm {
  merchant_name: string
  site_code: string
  account: string
  password: string
  contact_name: string
  contact_email: string
  telegram: string
  phone: string
  remarks: string
  status: MerchantStatus
  environment: 'sandbox' | 'production'
  api_status: 'testing' | 'active' | 'disabled'
  sign_method: 'HMAC-SHA256' | 'RSA'
  callback_url: string
  ipWhitelistText: string
  walletMode: MerchantWalletMode
  timeout_ms: number
  retry_count: number
  allow_negative_balance: boolean
  idempotency_enabled: boolean
  credit_limit: number
  multi_currency_enabled: boolean
  display_currencies: MerchantCurrency[]
  default_display_currency: MerchantCurrency
  settlement_currency: 'USDT'
  service_fee_rate: number
  default_merchant_markup_rate: number
  authorized_providers: string[]
  game_package: string
  agent_name: string
  merchant_quote_markups: Record<string, number | null>
}

interface AgentMeta {
  id: number
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
const loading = ref(false)
const currentStep = ref(1)

const defaultForm = (): MerchantCreateForm => ({
  merchant_name: '',
  site_code: '',
  account: '',
  password: '',
  contact_name: '',
  contact_email: '',
  telegram: '',
  phone: '',
  remarks: '',
  status: 'active',
  environment: 'sandbox',
  api_status: 'testing',
  sign_method: 'HMAC-SHA256',
  callback_url: '',
  ipWhitelistText: '',
  walletMode: 'seamless',
  timeout_ms: 5000,
  retry_count: 2,
  allow_negative_balance: false,
  idempotency_enabled: true,
  credit_limit: 0,
  multi_currency_enabled: true,
  display_currencies: ['TWD'],
  default_display_currency: 'TWD',
  settlement_currency: 'USDT',
  service_fee_rate: 0.005,
  default_merchant_markup_rate: 0.01,
  authorized_providers: ['pg'],
  game_package: 'Default Global Pack',
  agent_name: '平台直營代理',
  merchant_quote_markups: {}
})

const formValue = reactive<MerchantCreateForm>(defaultForm())

const resetForm = () => {
  Object.assign(formValue, defaultForm())
  currentStep.value = 1
}

watch(() => props.show, (show) => {
  if (show) resetForm()
})

const steps = ['基本資料', 'API 設定', '錢包設定', '幣別設定', '遊戲權限', '代理與報價', '確認送出']

const providerOptions = [
  { label: 'PG Soft', value: 'pg' },
  { label: 'Evolution', value: 'evo' },
  { label: 'Pragmatic Play', value: 'pp' },
  { label: 'JILI', value: 'jili' },
  { label: 'Habanero', value: 'habanero' }
]

const gamePackageOptions = [
  { label: 'Default Global Pack', value: 'Default Global Pack' },
  { label: 'SEA Market Pack', value: 'SEA Market Pack' },
  { label: 'Live Casino Pack', value: 'Live Casino Pack' },
  { label: 'VIP Slot Pack', value: 'VIP Slot Pack' }
]

const displayCurrencyOptions = [
  { label: 'TWD', value: 'TWD' },
  { label: 'PHP', value: 'PHP' },
  { label: 'THB', value: 'THB' },
  { label: 'VND', value: 'VND' },
  { label: 'IDR', value: 'IDR' }
]

const statusOptions = [
  { label: '啟用', value: 'active' },
  { label: '停用', value: 'disabled' }
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
  { label: '測試中', value: 'testing' },
  { label: '啟用', value: 'active' },
  { label: '停用', value: 'disabled' }
]

const signMethodOptions = [
  { label: 'HMAC-SHA256', value: 'HMAC-SHA256' },
  { label: 'RSA', value: 'RSA' }
]

const agentOptions = [
  { label: 'L1 平台直營代理', value: '平台直營代理' },
  { label: 'L1 SEA Growth Agent', value: 'SEA Growth Agent' },
  { label: 'L2 SEA Sub Agent 01', value: 'SEA Sub Agent 01' },
  { label: 'L3 SEA Local Desk L3', value: 'SEA Local Desk L3' }
]

const agentMeta: Record<string, AgentMeta> = {
  '平台直營代理': { id: 1, code: 'AGT-DIRECT', direct: true, level: 1, parent: null, root: 'AGT-DIRECT', settlement: 'AGT-DIRECT', path: 'AGT-DIRECT', service_fee_rate: 0.005, rates: { pg: 0.07, jili: 0.085, evo: 0.1, pp: 0.082, habanero: 0.09 } },
  'SEA Growth Agent': { id: 2, code: 'AGT-SEA-001', direct: false, level: 1, parent: null, root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001', service_fee_rate: 0.004, rates: { pg: 0.075, jili: 0.09, evo: 0.095, pp: 0.078, habanero: 0.088 } },
  'SEA Sub Agent 01': { id: 3, code: 'AGT-SEA-SUB01', direct: false, level: 2, parent: 'AGT-SEA-001', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01', service_fee_rate: 0.004, rates: { pg: 0.088, jili: 0.102, evo: 0.108, pp: 0.092, habanero: 0.1 } },
  'SEA Local Desk L3': { id: 4, code: 'AGT-SEA-SUB01-L3', direct: false, level: 3, parent: 'AGT-SEA-SUB01', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3', service_fee_rate: 0.004, rates: { pg: 0.096, jili: 0.11, evo: 0.116, pp: 0.1, habanero: 0.108 } }
}

const providerCostMeta: Record<string, ProviderCostMeta> = {
  pg: { id: 'PG', name: 'PG Soft', cost: 0.04 },
  jili: { id: 'JILI', name: 'JILI', cost: 0.05 },
  evo: { id: 'EVO', name: 'Evolution', cost: 0.06 },
  pp: { id: 'PP', name: 'Pragmatic Play', cost: 0.05 },
  habanero: { id: 'HAB', name: 'Habanero', cost: 0.055 }
}

const defaultAgent = agentMeta['平台直營代理'] as AgentMeta
const defaultProvider = providerCostMeta.pg as ProviderCostMeta
const selectedAgent = computed<AgentMeta>(() => agentMeta[formValue.agent_name] ?? defaultAgent)
const serviceFeePercent = computed(() => `${(formValue.service_fee_rate * 100).toFixed(2)}%`)
const merchantMarkupPercent = computed(() => `${(formValue.default_merchant_markup_rate * 100).toFixed(2)}%`)
watch(() => formValue.agent_name, () => {
  formValue.service_fee_rate = selectedAgent.value.service_fee_rate
})
const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`

const quotePreview = computed(() => formValue.authorized_providers.map((providerKey) => {
  const provider = providerCostMeta[providerKey] ?? defaultProvider
  const upstreamRate = selectedAgent.value.rates[providerKey] ?? provider.cost + 0.03
  const overrideMarkup = formValue.merchant_quote_markups[providerKey]
  const quoteMarkup = typeof overrideMarkup === 'number' ? overrideMarkup : formValue.default_merchant_markup_rate
  const quoteRate = upstreamRate + quoteMarkup
  return {
    provider_key: providerKey,
    provider_id: provider.id,
    provider_name: provider.name,
    provider_cost_rate_snapshot: provider.cost,
    agent_upstream_rate: upstreamRate,
    quote_markup_rate: quoteMarkup,
    quote_markup_source: typeof overrideMarkup === 'number' ? 'provider_override' as const : 'merchant_default' as const,
    merchant_quote_rate: quoteRate,
    merchant_margin_rate: quoteRate - upstreamRate,
    rate_source_agent_id: selectedAgent.value.code,
    rate_source_agent_level: selectedAgent.value.level,
    effective_at: new Date().toISOString(),
    status: 'active' as const
  }
}))

const rules: FormRules = {
  merchant_name: { required: true, message: '請輸入商戶名稱', trigger: 'blur' },
  site_code: { required: true, message: '請輸入 Site Code', trigger: 'blur' },
  account: { required: true, message: '請輸入管理帳號', trigger: 'blur' },
  password: { required: true, message: '請輸入初始密碼', trigger: 'blur' },
  contact_email: { type: 'email', message: 'Email 格式不正確', trigger: 'blur' }
}

const closeDrawer = () => emit('update:show', false)
const nextStep = () => { if (currentStep.value < steps.length) currentStep.value += 1 }
const prevStep = () => { if (currentStep.value > 1) currentStep.value -= 1 }

const handleCreate = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const agent = selectedAgent.value
    const now = new Date().toISOString()
    const displayId = `OP-${Math.floor(1000 + Math.random() * 9000)}`
    const merchant: Merchant = {
      id: Date.now(),
      display_id: displayId,
      site_code: formValue.site_code,
      merchant_name: formValue.merchant_name,
      merchant_type: 'merchant',
      account: formValue.account,
      name: formValue.merchant_name,
      contact_name: formValue.contact_name,
      contact_email: formValue.contact_email,
      telegram: formValue.telegram,
      phone: formValue.phone,
      remarks: formValue.remarks,
      currency_type: formValue.default_display_currency,
      multi_currency_enabled: formValue.multi_currency_enabled,
      transaction_currencies: formValue.display_currencies,
      display_currencies: formValue.display_currencies,
      default_transaction_currency: formValue.default_display_currency,
      default_display_currency: formValue.default_display_currency,
      settlement_currency: 'USDT',
      callback_amount_mode: 'transaction_currency',
      service_fee_rate: formValue.service_fee_rate,
      default_merchant_markup_rate: formValue.default_merchant_markup_rate,
      percent: 0,
      settlement_cycle: 'daily',
      authorized_providers: formValue.authorized_providers,
      enabled_provider_count: formValue.authorized_providers.length,
      enabled_game_count: 0,
      game_package: formValue.game_package,
      state: formValue.status === 'active' ? 1 : 0,
      status: formValue.status,
      created_at: now,
      updated_at: now,
      walletMode: formValue.walletMode,
      wallet_mode: formValue.walletMode,
      api_key: `ak_${displayId.toLowerCase()}`,
      api_secret_masked: 'sk_live_****************',
      callback_url: formValue.callback_url,
      ipWhitelist: formValue.ipWhitelistText.split('\n').map(ip => ip.trim()).filter(Boolean),
      sign_method: formValue.sign_method,
      api_status: formValue.api_status,
      environment: formValue.environment,
      timeout_ms: formValue.timeout_ms,
      retry_count: formValue.retry_count,
      allow_negative_balance: formValue.allow_negative_balance,
      idempotency_enabled: formValue.idempotency_enabled,
      credit_limit: formValue.credit_limit,
      agent_id: agent.id,
      agent_code: agent.code,
      agent_name: formValue.agent_name,
      agent_level: agent.level,
      parent_agent_code: agent.parent,
      root_agent_code: agent.root,
      settlement_agent_code: agent.settlement,
      agent_path: agent.path,
      is_direct_agent: agent.direct,
      settlement_owner_type: 'agent',
      agent_binding: true,
      merchant_quote_rates: quotePreview.value,
      agent_effective_at: now,
      today_bet: 0,
      today_payout: 0,
      today_ggr: 0,
      settlement_today_ggr: 0,
      transaction_success_rate: 100
    }
    emit('created', merchant)
    emit('refresh')
    message.success('商戶已建立')
    closeDrawer()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <n-drawer :show="show" :width="920" @update:show="(v) => emit('update:show', v)">
    <n-drawer-content title="新增商戶" closable>
      <n-alert type="info" :show-icon="false" class="mb-4">
        商戶必須綁定代理；未指定時預設歸屬平台直營代理。交易依 Provider 幣別線使用原幣，正式日結幣別固定 USDT。
      </n-alert>

      <n-steps :current="currentStep" size="small" class="mb-5">
        <n-step v-for="step in steps" :key="step" :title="step" />
      </n-steps>

      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="left" label-width="130">
        <template v-if="currentStep === 1">
          <n-form-item label="商戶名稱" path="merchant_name"><n-input v-model:value="formValue.merchant_name" /></n-form-item>
          <n-form-item label="Site Code" path="site_code"><n-input v-model:value="formValue.site_code" /></n-form-item>
          <n-form-item label="管理帳號" path="account"><n-input v-model:value="formValue.account" /></n-form-item>
          <n-form-item label="初始密碼" path="password"><n-input v-model:value="formValue.password" type="password" show-password-on="click" /></n-form-item>
          <n-form-item label="狀態"><n-select v-model:value="formValue.status" :options="statusOptions" /></n-form-item>
          <n-form-item label="聯絡人"><n-input v-model:value="formValue.contact_name" /></n-form-item>
          <n-form-item label="Email" path="contact_email"><n-input v-model:value="formValue.contact_email" /></n-form-item>
          <n-form-item label="Telegram"><n-input v-model:value="formValue.telegram" /></n-form-item>
          <n-form-item label="電話"><n-input v-model:value="formValue.phone" /></n-form-item>
          <n-form-item label="備註"><n-input v-model:value="formValue.remarks" type="textarea" /></n-form-item>
        </template>

        <template v-else-if="currentStep === 2">
          <n-form-item label="環境"><n-select v-model:value="formValue.environment" :options="environmentOptions" /></n-form-item>
          <n-form-item label="API 狀態"><n-select v-model:value="formValue.api_status" :options="apiStatusOptions" /></n-form-item>
          <n-form-item label="簽名方式"><n-select v-model:value="formValue.sign_method" :options="signMethodOptions" /></n-form-item>
          <n-form-item label="Callback URL"><n-input v-model:value="formValue.callback_url" placeholder="https://merchant.example.com/callback" /></n-form-item>
          <n-form-item label="IP 白名單"><n-input v-model:value="formValue.ipWhitelistText" type="textarea" placeholder="每行一個 IP" /></n-form-item>
        </template>

        <template v-else-if="currentStep === 3">
          <n-form-item label="錢包模式"><n-select v-model:value="formValue.walletMode" :options="walletOptions" /></n-form-item>
          <n-form-item label="Timeout"><n-input-number v-model:value="formValue.timeout_ms" :min="1000" :step="500" /></n-form-item>
          <n-form-item label="Retry"><n-input-number v-model:value="formValue.retry_count" :min="0" :max="5" /></n-form-item>
          <n-form-item label="允許負餘額"><n-switch v-model:value="formValue.allow_negative_balance" /></n-form-item>
          <n-form-item label="冪等控制"><n-switch v-model:value="formValue.idempotency_enabled" /></n-form-item>
          <n-form-item label="信用額度"><n-input-number v-model:value="formValue.credit_limit" :min="0" /></n-form-item>
        </template>

        <template v-else-if="currentStep === 4">
          <n-form-item label="多交易幣別"><n-switch v-model:value="formValue.multi_currency_enabled" /></n-form-item>
          <n-form-item label="可用交易幣別"><n-select v-model:value="formValue.display_currencies" multiple :options="displayCurrencyOptions" /></n-form-item>
          <n-form-item label="預設交易／錢包幣別"><n-select v-model:value="formValue.default_display_currency" :options="displayCurrencyOptions" /></n-form-item>
          <n-form-item label="正式結算幣別"><n-tag type="success" :bordered="false">USDT</n-tag></n-form-item>
          <n-form-item label="匯率服務費（繼承）"><n-input :value="serviceFeePercent" readonly /></n-form-item>
          <n-alert type="info" :show-icon="false">匯率服務費由 GGAP 獨立計收，不會自動併入商戶報價。</n-alert>
        </template>

        <template v-else-if="currentStep === 5">
          <n-form-item label="授權供應商"><n-select v-model:value="formValue.authorized_providers" multiple :options="providerOptions" /></n-form-item>
          <n-form-item label="預設遊戲包"><n-select v-model:value="formValue.game_package" :options="gamePackageOptions" /></n-form-item>
        </template>

        <template v-else-if="currentStep === 6">
          <n-form-item label="所屬代理"><n-select v-model:value="formValue.agent_name" :options="agentOptions" /></n-form-item>
          <n-form-item label="預設商戶加價"><n-input-number v-model:value="formValue.default_merchant_markup_rate" :min="0" :max="0.2" :step="0.001" /></n-form-item>
          <n-alert type="warning" :show-icon="false" class="mb-4">
            代理費率會先帶入商戶報價；若單一供應商未指定加成，套用預設商戶加價 {{ merchantMarkupPercent }}。匯率服務費 {{ serviceFeePercent }} 另行計算。
          </n-alert>
          <div class="space-y-3">
            <div v-for="rate in quotePreview" :key="rate.provider_id" class="rounded border border-white/10 bg-[#202026] p-4">
              <div class="mb-2 flex items-center justify-between">
                <strong>{{ rate.provider_name }}</strong>
                <n-tag :bordered="false">{{ rate.quote_markup_source === 'provider_override' ? '供應商指定' : '商戶預設' }}</n-tag>
              </div>
              <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <span>供應商成本 {{ formatRate(rate.provider_cost_rate_snapshot) }}</span>
                <span>代理費率 {{ formatRate(rate.agent_upstream_rate) }}</span>
                <span>商戶加成 {{ formatRate(rate.quote_markup_rate) }}</span>
                <span>商戶報價 {{ formatRate(rate.merchant_quote_rate) }}</span>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="商戶名稱">{{ formValue.merchant_name }}</n-descriptions-item>
            <n-descriptions-item label="Site Code">{{ formValue.site_code }}</n-descriptions-item>
            <n-descriptions-item label="錢包模式">{{ formValue.walletMode }}</n-descriptions-item>
            <n-descriptions-item label="交易幣別">{{ formValue.display_currencies.join(', ') }}</n-descriptions-item>
            <n-descriptions-item label="正式結算幣別">USDT</n-descriptions-item>
            <n-descriptions-item label="所屬代理">{{ formValue.agent_name }}</n-descriptions-item>
            <n-descriptions-item label="商戶報價" :span="2">{{ quotePreview.length }} 組供應商費率將同步建立</n-descriptions-item>
          </n-descriptions>
        </template>
      </n-form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="closeDrawer">取消</n-button>
          <n-button v-if="currentStep > 1" secondary @click="prevStep">上一步</n-button>
          <n-button v-if="currentStep < steps.length" type="primary" @click="nextStep">下一步</n-button>
          <n-button v-else type="primary" :loading="loading" @click="handleCreate">建立商戶</n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>
