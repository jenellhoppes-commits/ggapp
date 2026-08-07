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
import type { Merchant, MerchantCurrency, MerchantStatus, MerchantWalletMode } from '../../types/merchant'
import {
  createMerchant,
  listAvailableMerchantAgents,
  providerRateOptions
} from '../../services/merchant/createMerchant'
import type { AgentOption, MerchantCreateMode, MerchantCreatePayload } from '../../services/merchant/createMerchant'

const props = withDefaults(defineProps<{
  show: boolean
  mode?: MerchantCreateMode
}>(), {
  mode: 'admin'
})

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'refresh'): void
  (e: 'created', merchant: Merchant): void
}>()

interface MerchantCreateForm {
  merchant_name: string
  site_code: string
  manager_account: string
  initial_password: string
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
  wallet_mode: MerchantWalletMode
  timeout_ms: number
  retry_count: number
  allow_negative_balance: boolean
  idempotency_enabled: boolean
  credit_limit: number
  display_currencies: MerchantCurrency[]
  default_display_currency: MerchantCurrency
  settlement_currency: 'USDT'
  service_fee_rate: number
  default_merchant_markup_rate: number
  authorized_providers: string[]
  game_package: string
  agent_value: string
  merchant_quote_markups: Record<string, number | null>
}

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)
const currentStep = ref(1)
const agentOptions = ref<AgentOption[]>([])

const defaultForm = (): MerchantCreateForm => ({
  merchant_name: '',
  site_code: '',
  manager_account: '',
  initial_password: '',
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
  wallet_mode: 'seamless',
  timeout_ms: 5000,
  retry_count: 2,
  allow_negative_balance: false,
  idempotency_enabled: true,
  credit_limit: 0,
  display_currencies: ['TWD'],
  default_display_currency: 'TWD',
  settlement_currency: 'USDT',
  service_fee_rate: 0.005,
  default_merchant_markup_rate: 0.01,
  authorized_providers: ['pg'],
  game_package: 'Default Global Pack',
  agent_value: '',
  merchant_quote_markups: {}
})

const formValue = reactive<MerchantCreateForm>(defaultForm())

const steps = ['基本資料', '代理歸屬', 'API 設定', '錢包與幣別', '遊戲權限', '商戶報價', '確認送出']

const allProviderOptions = providerRateOptions.map(provider => ({
  label: provider.provider_name,
  value: provider.key,
  provider_id: provider.provider_id
}))

const gamePackageOptions = [
  { label: 'Default Global Pack', value: 'Default Global Pack' },
  { label: 'SEA Market Pack', value: 'SEA Market Pack' },
  { label: 'Live Casino Pack', value: 'Live Casino Pack' },
  { label: 'VIP Slot Pack', value: 'VIP Slot Pack' }
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

const selectedAgent = computed(() => agentOptions.value.find(agent => agent.value === formValue.agent_value) || agentOptions.value[0])
const allowedProviderIds = computed(() => new Set((selectedAgent.value?.provider_currency_access || []).map(access => access.provider_id)))
const providerOptions = computed(() => allProviderOptions.filter(provider => allowedProviderIds.value.has(provider.provider_id)))
const selectedProviderIds = computed(() => new Set(providerRateOptions
  .filter(provider => formValue.authorized_providers.includes(provider.key))
  .map(provider => provider.provider_id)))
const displayCurrencyOptions = computed(() => Array.from(new Set((selectedAgent.value?.provider_currency_access || [])
  .filter(access => selectedProviderIds.value.has(access.provider_id))
  .map(access => access.transaction_currency)))
  .map(value => ({ label: value, value })))
const serviceFeePercent = computed(() => `${(formValue.service_fee_rate * 100).toFixed(2)}%`)
const merchantMarkupPercent = computed(() => `${(formValue.default_merchant_markup_rate * 100).toFixed(2)}%`)

watch(() => formValue.agent_value, () => {
  formValue.service_fee_rate = selectedAgent.value?.service_fee_rate ?? 0.005
  const availableProviderKeys = new Set(providerOptions.value.map(provider => provider.value))
  formValue.authorized_providers = formValue.authorized_providers.filter(provider => availableProviderKeys.has(provider))
  if (!formValue.authorized_providers.length && providerOptions.value[0]) formValue.authorized_providers = [providerOptions.value[0].value]
})
watch([() => formValue.agent_value, () => [...formValue.authorized_providers]], () => {
  const availableCurrencies = new Set(displayCurrencyOptions.value.map(option => option.value))
  formValue.display_currencies = formValue.display_currencies.filter(currency => availableCurrencies.has(currency))
  if (!formValue.display_currencies.length && displayCurrencyOptions.value[0]) formValue.display_currencies = [displayCurrencyOptions.value[0].value]
  if (!formValue.display_currencies.includes(formValue.default_display_currency)) {
    formValue.default_display_currency = formValue.display_currencies[0] || 'TWD'
  }
})
const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`
const fallbackProvider = providerRateOptions[0]!

const quotePreview = computed(() => formValue.authorized_providers.map((providerKey) => {
  const provider = providerRateOptions.find(item => item.key === providerKey) || fallbackProvider
  const agentRate = selectedAgent.value?.rates[providerKey] ?? (provider.provider_cost_rate + 0.03)
  const overrideMarkup = formValue.merchant_quote_markups[providerKey]
  const quoteMarkup = typeof overrideMarkup === 'number' ? overrideMarkup : formValue.default_merchant_markup_rate
  const quoteRate = agentRate + quoteMarkup

  return {
    provider_key: providerKey,
    provider_id: provider.provider_id,
    provider_name: provider.provider_name,
    provider_cost_rate_snapshot: provider.provider_cost_rate,
    agent_upstream_rate: agentRate,
    quote_markup_rate: quoteMarkup,
    quote_markup_source: typeof overrideMarkup === 'number' ? 'provider_override' as const : 'merchant_default' as const,
    merchant_quote_rate: quoteRate,
    merchant_margin_rate: quoteRate - agentRate,
    rate_source_agent_id: selectedAgent.value?.code || '',
    rate_source_agent_level: selectedAgent.value?.level || 1,
    effective_at: new Date().toISOString(),
    status: 'active' as const
  }
}))

const rules: FormRules = {
  merchant_name: { required: true, message: '請輸入商戶名稱', trigger: 'blur' },
  site_code: { required: true, message: '請輸入 Site Code', trigger: 'blur' },
  manager_account: { required: true, message: '請輸入管理帳號', trigger: 'blur' },
  agent_value: { required: true, message: '請選擇所屬代理', trigger: 'change' },
  contact_email: { type: 'email', message: 'Email 格式不正確', trigger: 'blur' }
}

const resetForm = async () => {
  Object.assign(formValue, defaultForm())
  currentStep.value = 1
  agentOptions.value = await listAvailableMerchantAgents(props.mode)
  formValue.agent_value = agentOptions.value[0]?.value || ''
}

watch(() => props.show, (show) => {
  if (show) resetForm()
})

const closeDrawer = () => emit('update:show', false)
const nextStep = () => { if (currentStep.value < steps.length) currentStep.value += 1 }
const prevStep = () => { if (currentStep.value > 1) currentStep.value -= 1 }

const buildPayload = (): MerchantCreatePayload => {
  const agent = selectedAgent.value

  if (!agent) throw new Error('請選擇所屬代理')

  return {
    mode: props.mode,
    merchant_name: formValue.merchant_name,
    site_code: formValue.site_code,
    manager_account: formValue.manager_account,
    initial_password: formValue.initial_password,
    contact_name: formValue.contact_name,
    contact_email: formValue.contact_email,
    telegram: formValue.telegram,
    phone: formValue.phone,
    remarks: formValue.remarks,
    status: formValue.status,
    agent_id: agent.id,
    agent_code: agent.code,
    agent_name: agent.name,
    agent_path: agent.path,
    agent_level: agent.level,
    settlement_agent_id: agent.settlement,
    wallet_mode: formValue.wallet_mode,
    transaction_currencies: formValue.display_currencies,
    default_transaction_currency: formValue.default_display_currency,
    display_currencies: formValue.display_currencies,
    default_display_currency: formValue.default_display_currency,
    settlement_currency: 'USDT',
    api_status: formValue.api_status,
    environment: formValue.environment,
    sign_method: formValue.sign_method,
    callback_url: formValue.callback_url,
    ip_whitelist: formValue.ipWhitelistText.split('\n').map(ip => ip.trim()).filter(Boolean),
    timeout_ms: formValue.timeout_ms,
    retry_count: formValue.retry_count,
    allow_negative_balance: formValue.allow_negative_balance,
    idempotency_enabled: formValue.idempotency_enabled,
    credit_limit: formValue.credit_limit,
    authorized_providers: formValue.authorized_providers,
    game_package: formValue.game_package,
    service_fee_rate: formValue.service_fee_rate,
    default_merchant_markup_rate: formValue.default_merchant_markup_rate,
    merchant_provider_rates: quotePreview.value
  }
}

const handleCreate = async () => {
  await formRef.value?.validate()
  if (!formValue.authorized_providers.length || !formValue.display_currencies.length) {
    message.warning('所屬代理目前沒有可供商戶使用的 Provider 幣別線')
    return
  }
  loading.value = true
  try {
    const merchant = await createMerchant(buildPayload())
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
    <n-drawer-content :title="mode === 'admin' ? '新增商戶' : '代理新增商戶'" closable>
      <n-alert :type="mode === 'admin' ? 'info' : 'warning'" :show-icon="false" class="mb-4">
        <template v-if="mode === 'admin'">
          商戶必須綁定代理；未指定時預設歸屬平台直營代理。交易依 Provider 幣別線使用原幣，正式日結幣別固定 USDT。
        </template>
        <template v-else>
          代理只能建立自己代理樹底下的商戶；GGAP 不直接向商戶收款，商戶應繳金額屬代理帳務明細。
        </template>
      </n-alert>

      <n-steps :current="currentStep" size="small" class="mb-5">
        <n-step v-for="step in steps" :key="step" :title="step" />
      </n-steps>

      <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="left" label-width="130">
        <template v-if="currentStep === 1">
          <n-form-item label="商戶名稱" path="merchant_name"><n-input v-model:value="formValue.merchant_name" /></n-form-item>
          <n-form-item label="Site Code" path="site_code"><n-input v-model:value="formValue.site_code" /></n-form-item>
          <n-form-item label="管理帳號" path="manager_account"><n-input v-model:value="formValue.manager_account" /></n-form-item>
          <n-form-item label="初始密碼"><n-input v-model:value="formValue.initial_password" type="password" show-password-on="click" /></n-form-item>
          <n-form-item label="狀態"><n-select v-model:value="formValue.status" :options="statusOptions" /></n-form-item>
          <n-form-item label="聯絡人"><n-input v-model:value="formValue.contact_name" /></n-form-item>
          <n-form-item label="Email" path="contact_email"><n-input v-model:value="formValue.contact_email" /></n-form-item>
          <n-form-item label="Telegram"><n-input v-model:value="formValue.telegram" /></n-form-item>
          <n-form-item label="電話"><n-input v-model:value="formValue.phone" /></n-form-item>
          <n-form-item label="備註"><n-input v-model:value="formValue.remarks" type="textarea" /></n-form-item>
        </template>

        <template v-else-if="currentStep === 2">
          <n-form-item label="所屬代理" path="agent_value"><n-select v-model:value="formValue.agent_value" :options="agentOptions" /></n-form-item>
          <n-descriptions v-if="selectedAgent" bordered :column="2" label-placement="left">
            <n-descriptions-item label="代理代碼">{{ selectedAgent.code }}</n-descriptions-item>
            <n-descriptions-item label="代理層級">L{{ selectedAgent.level }}</n-descriptions-item>
            <n-descriptions-item label="正式收款對象">{{ selectedAgent.settlement }}</n-descriptions-item>
            <n-descriptions-item label="代理路徑">{{ selectedAgent.path }}</n-descriptions-item>
          </n-descriptions>
        </template>

        <template v-else-if="currentStep === 3">
          <n-form-item label="環境"><n-select v-model:value="formValue.environment" :options="environmentOptions" /></n-form-item>
          <n-form-item label="API 狀態"><n-select v-model:value="formValue.api_status" :options="apiStatusOptions" /></n-form-item>
          <n-form-item label="簽名方式"><n-select v-model:value="formValue.sign_method" :options="signMethodOptions" /></n-form-item>
          <n-form-item label="Callback URL"><n-input v-model:value="formValue.callback_url" placeholder="https://merchant.example.com/callback" /></n-form-item>
          <n-form-item label="IP 白名單"><n-input v-model:value="formValue.ipWhitelistText" type="textarea" placeholder="每行一個 IP" /></n-form-item>
        </template>

        <template v-else-if="currentStep === 4">
          <n-form-item label="錢包模式"><n-select v-model:value="formValue.wallet_mode" :options="walletOptions" /></n-form-item>
          <n-form-item label="Timeout"><n-input-number v-model:value="formValue.timeout_ms" :min="1000" :step="500" /></n-form-item>
          <n-form-item label="Retry"><n-input-number v-model:value="formValue.retry_count" :min="0" :max="5" /></n-form-item>
          <n-form-item label="允許負餘額"><n-switch v-model:value="formValue.allow_negative_balance" /></n-form-item>
          <n-form-item label="冪等控制"><n-switch v-model:value="formValue.idempotency_enabled" /></n-form-item>
          <n-form-item label="信用額度"><n-input-number v-model:value="formValue.credit_limit" :min="0" /></n-form-item>
          <n-form-item label="可用交易幣別"><n-select v-model:value="formValue.display_currencies" multiple :options="displayCurrencyOptions" /></n-form-item>
          <n-form-item label="預設交易／錢包幣別"><n-select v-model:value="formValue.default_display_currency" :options="displayCurrencyOptions" /></n-form-item>
          <n-form-item label="正式結算幣別"><n-tag type="success" :bordered="false">USDT</n-tag></n-form-item>
        </template>

        <template v-else-if="currentStep === 5">
          <n-form-item label="授權供應商"><n-select v-model:value="formValue.authorized_providers" multiple :options="providerOptions" /></n-form-item>
          <n-form-item label="預設遊戲包"><n-select v-model:value="formValue.game_package" :options="gamePackageOptions" /></n-form-item>
        </template>

        <template v-else-if="currentStep === 6">
          <n-form-item label="匯率服務費（繼承）"><n-input :value="serviceFeePercent" readonly /></n-form-item>
          <n-form-item label="預設商戶加價"><n-input-number v-model:value="formValue.default_merchant_markup_rate" :min="0" :max="0.2" :step="0.001" /></n-form-item>
          <n-alert type="warning" :show-icon="false" class="mb-4">
            未指定供應商加價時套用預設商戶加價 {{ merchantMarkupPercent }}；匯率服務費 {{ serviceFeePercent }} 由 GGAP 另行計算。
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
            <n-descriptions-item label="所屬代理">{{ selectedAgent?.name }}</n-descriptions-item>
            <n-descriptions-item label="錢包模式">{{ formValue.wallet_mode }}</n-descriptions-item>
            <n-descriptions-item label="交易幣別">{{ formValue.display_currencies.join(', ') }}</n-descriptions-item>
            <n-descriptions-item label="正式結算幣別">USDT</n-descriptions-item>
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
