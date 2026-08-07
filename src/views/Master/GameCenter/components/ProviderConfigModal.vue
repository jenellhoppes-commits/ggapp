<script setup lang="ts">
import { ref, watch } from 'vue'
import {
    NAlert,
    NButton,
    NCard,
    NDatePicker,
    NForm,
    NFormItem,
    NIcon,
    NInput,
    NInputNumber,
    NModal,
    NSelect,
    NSwitch,
    NTabPane,
    NTabs,
    NTag,
    NTooltip,
    useMessage
} from 'naive-ui'
import { InfoOutlined, SettingsOutlined } from '@vicons/material'
import { useI18n } from 'vue-i18n'
import type { Provider } from '../../../../types/provider'
import MaintenanceSettingsModal from './MaintenanceSettingsModal.vue'
import { adminContentService } from '../../../../services/admin/content'

const props = withDefaults(defineProps<{
    show: boolean
    provider?: Provider | null
    mode?: 'create' | 'edit'
}>(), {
    mode: 'edit',
    provider: null
})

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'refresh'): void
}>()

const { t } = useI18n()
const message = useMessage()
const loading = ref(false)
const showMaintenance = ref(false)

const defaultProvider = (): Partial<Provider> => ({
    name: '',
    code: '',
    status: 'active',
    type: 'Slot',
    apiConfig: {},
    contract: {
        costPercent: 0,
        expiryDate: Date.now()
    },
    platform_accounting_currency: 'USDT',
    provider_wallet_currency: 'TWD',
    cost_billing_mode: 'GGR',
    provider_cost_rate: 0.04,
    negative_ggr_policy: 'carry_forward',
    cost_rate_version: 'COST-2026.07',
    cost_rate_effective_at: '2026-07-01T00:00',
    contractConfig: {
        accounting_currency: 'USDT',
        rules: {
            slot_free_spin: { enabled: false, provider_share: 0 },
            live_tip: { enabled: false, provider_share: 0 },
            card_fee: { enabled: false, provider_share: 0 }
        }
    }
})

const formModel = ref<Partial<Provider>>(defaultProvider())

watch(() => props.show, (newVal) => {
    if (!newVal) return

    if (props.mode === 'create') {
        formModel.value = defaultProvider()
        return
    }

    if (props.provider) {
        formModel.value = JSON.parse(JSON.stringify(props.provider))
    }

    if (!formModel.value.apiConfig) formModel.value.apiConfig = {}
    if (!formModel.value.contract) formModel.value.contract = { costPercent: 0, expiryDate: Date.now() }
    formModel.value.platform_accounting_currency = 'USDT'
    formModel.value.cost_billing_mode = 'GGR'
    formModel.value.provider_cost_rate = formModel.value.provider_cost_rate ?? 0.04
    formModel.value.negative_ggr_policy = formModel.value.negative_ggr_policy ?? 'carry_forward'
    formModel.value.cost_rate_version = formModel.value.cost_rate_version || `${formModel.value.code?.toUpperCase() || 'PROVIDER'}-COST-2026.07`
    formModel.value.cost_rate_effective_at = formModel.value.cost_rate_effective_at || '2026-07-01T00:00'
    if (!formModel.value.contractConfig) {
        formModel.value.contractConfig = defaultProvider().contractConfig
    }
})

const currencyOptions = [
    { label: 'TWD', value: 'TWD' },
    { label: 'THB', value: 'THB' },
    { label: 'PHP', value: 'PHP' },
    { label: 'VND', value: 'VND' },
    { label: 'IDR', value: 'IDR' },
    { label: 'USD', value: 'USD' },
    { label: 'USDT', value: 'USDT' }
]

const negativeGgrOptions = [
    { label: '保留到下期', value: 'carry_forward' },
    { label: '清零', value: 'zero_out' }
]

const handleClose = () => {
    emit('update:show', false)
}

const handleSave = async () => {
    loading.value = true
    try {
        await adminContentService.saveProvider(formModel.value, props.mode)
        message.success(props.mode === 'create' ? t('provider.createSuccess') : t('merchantConfig.saveSuccess'))
        handleClose()
        emit('refresh')
    } catch (error) {
        const messageText = error instanceof Error ? error.message : 'Error saving provider config'
        message.error(messageText)
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <n-modal
        :show="show"
        @update:show="$emit('update:show', $event)"
        class="w-[600px]"
        preset="card"
        :title="mode === 'create' ? t('provider.addProvider') : `${t('provider.config')} - ${provider?.name}`"
        :bordered="false"
        size="huge"
    >
        <template #header-extra>
            <n-button v-if="mode === 'edit'" size="small" secondary type="warning" @click="showMaintenance = true">
                <template #icon>
                    <n-icon :component="SettingsOutlined" />
                </template>
                {{ t('provider.maintenanceSchedule') }}
            </n-button>
        </template>

        <n-tabs type="line" animated>
            <n-tab-pane name="integration" :tab="t('provider.integration')">
                <n-form label-placement="left" label-width="160" require-mark-placement="right-hanging" class="mt-4">
                    <n-form-item :label="t('provider.name')" required>
                        <n-input v-model:value="formModel.name" :placeholder="t('provider.namePlaceholder')" />
                    </n-form-item>
                    <n-form-item :label="t('provider.code')" required>
                        <n-input v-model:value="formModel.code" :disabled="mode === 'edit'" :placeholder="t('provider.codePlaceholder')" />
                    </n-form-item>
                    <n-form-item :label="t('provider.apiUrl')">
                        <n-input v-model:value="formModel.apiConfig!.apiUrl" placeholder="https://api.provider.com" />
                    </n-form-item>
                    <n-form-item :label="t('provider.merchantCode')">
                        <n-input v-model:value="formModel.apiConfig!.merchantCode" />
                    </n-form-item>
                    <n-form-item :label="t('provider.secretKey')">
                        <n-input v-model:value="formModel.apiConfig!.secretKey" type="password" show-password-on="click" />
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <n-tab-pane name="wallet" tab="錢包 / 結算">
                <n-form label-placement="left" label-width="160" require-mark-placement="right-hanging" class="mt-4">
                    <n-alert type="info" :show-icon="false" class="mb-4">
                        此處只設定供應商預設值；儲存供應商後，請至供應商詳情的「幣別管理」逐一設定幣別 ID、廠商 ID、API Key、憑證、URL 與錢包種類。
                    </n-alert>
                    <n-form-item label="Provider 串接錢包">
                        <n-tag type="info" :bordered="false">依幣別線分別設定</n-tag>
                    </n-form-item>
                    <n-form-item label="平台帳務幣別">
                        <n-select v-model:value="formModel.platform_accounting_currency" :options="currencyOptions" disabled />
                    </n-form-item>
                    <n-form-item label="Provider Wallet 幣別">
                        <n-select v-model:value="formModel.provider_wallet_currency" :options="currencyOptions" />
                    </n-form-item>
                    <n-form-item label="供應商帳務維度">
                        <n-input value="provider_id + provider_currency_connection_id + provider_currency_id + original_currency + settlement_currency + period" readonly />
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <n-tab-pane name="cost" tab="成本費率">
                <n-form label-placement="left" label-width="160" require-mark-placement="right-hanging" class="mt-4">
                    <n-alert type="warning" :show-icon="false" class="mb-4">
                        供應商成本費率只屬於平台與供應商之間的成本帳，可作為代理報價參考，但不代表代理與供應商存在直接結算關係。
                    </n-alert>
                    <n-form-item label="計費模式">
                        <n-select v-model:value="formModel.cost_billing_mode" disabled :options="[{ label: 'GGR', value: 'GGR' }]" />
                    </n-form-item>
                    <n-form-item label="供應商成本費率">
                        <n-input-number v-model:value="formModel.provider_cost_rate" :min="0" :max="1" :step="0.001">
                            <template #suffix>%</template>
                        </n-input-number>
                    </n-form-item>
                    <n-form-item label="負 GGR 處理">
                        <n-select v-model:value="formModel.negative_ggr_policy" :options="negativeGgrOptions" />
                    </n-form-item>
                    <n-form-item label="費率版本">
                        <n-input v-model:value="formModel.cost_rate_version" placeholder="例如 PG-COST-2026.07" />
                    </n-form-item>
                    <n-form-item label="生效時間">
                        <n-input v-model:value="formModel.cost_rate_effective_at" placeholder="YYYY-MM-DDTHH:mm" />
                    </n-form-item>
                </n-form>
            </n-tab-pane>

            <n-tab-pane name="rules" :tab="t('provider.contract')">
                <n-form label-placement="left" label-width="160" require-mark-placement="right-hanging" class="mt-4">
                    <n-form-item label="平台成本帳務幣別">
                        <n-select v-model:value="formModel.contractConfig!.accounting_currency" :options="currencyOptions" disabled />
                    </n-form-item>

                    <n-card :title="t('provider.advancedRules')" size="small" class="mt-4 bg-gray-50 border-gray-200">
                        <div class="mb-4 border-b border-gray-200 pb-4">
                            <div class="mb-2 flex items-center justify-between">
                                <div class="flex items-center gap-2 font-medium">
                                    {{ t('provider.rules.slotFreeSpin') }}
                                    <n-tooltip trigger="hover">
                                        <template #trigger><n-icon :component="InfoOutlined" class="text-gray-400 cursor-pointer" /></template>
                                        {{ t('provider.rules.slotHelp') }}
                                    </n-tooltip>
                                </div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.slot_free_spin.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.slot_free_spin.enabled" class="flex items-center gap-4 pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.slot_free_spin.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-sm text-gray-500">
                                    {{ t('provider.rules.aggregatorShare') }}:
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.slot_free_spin.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>

                        <div class="mb-4 border-b border-gray-200 pb-4">
                            <div class="mb-2 flex items-center justify-between">
                                <div class="font-medium">{{ t('provider.rules.liveTip') }}</div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.live_tip.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.live_tip.enabled" class="flex items-center gap-4 pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.live_tip.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-sm text-gray-500">
                                    {{ t('provider.rules.aggregatorShare') }}:
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.live_tip.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div class="mb-2 flex items-center justify-between">
                                <div class="font-medium">{{ t('provider.rules.cardFee') }}</div>
                                <n-switch v-model:value="formModel.contractConfig!.rules.card_fee.enabled" />
                            </div>
                            <div v-if="formModel.contractConfig!.rules.card_fee.enabled" class="flex items-center gap-4 pl-6">
                                <n-form-item :label="t('provider.rules.providerShare')" label-placement="left" class="mb-0">
                                    <n-input-number v-model:value="formModel.contractConfig!.rules.card_fee.provider_share" :min="0" :max="100" size="small">
                                        <template #suffix>%</template>
                                    </n-input-number>
                                </n-form-item>
                                <div class="text-sm text-gray-500">
                                    {{ t('provider.rules.aggregatorShare') }}:
                                    <span class="font-bold text-primary">{{ 100 - (formModel.contractConfig?.rules.card_fee.provider_share || 0) }}%</span>
                                </div>
                            </div>
                        </div>
                    </n-card>

                    <n-form-item :label="t('provider.expiryDate')" class="mt-4">
                        <n-date-picker v-model:value="formModel.contract!.expiryDate as number" type="date" class="w-full" />
                    </n-form-item>
                </n-form>
            </n-tab-pane>
        </n-tabs>

        <div class="mt-6 flex justify-end gap-3 border-t border-gray-700 pt-4">
            <n-button :disabled="loading" @click="handleClose">{{ t('common.cancel') }}</n-button>
            <n-button type="primary" :loading="loading" @click="handleSave">{{ t('common.save') }}</n-button>
        </div>

        <maintenance-settings-modal
            v-model:show="showMaintenance"
            :provider="provider"
            @refresh="$emit('refresh')"
        />
    </n-modal>
</template>
