<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
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
  NInputNumber,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getAgentAssignableBetGroups } from '../../mocks/gameLimits'
import { portalMerchantService } from '../../services/portal/merchants'
import type { AgentMerchantProviderRate, AgentMerchantRow } from '../../services/portal/merchants'
import type { MerchantBetLimitAssignment, ProviderCurrencyBetGroup } from '../../types/gameLimit'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../utils/tableSort'

const props = defineProps<{
  show: boolean
  merchant: AgentMerchantRow | null
  initialTab?: 'overview' | 'rates' | 'limits' | 'accounting'
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
  saved: [merchant: AgentMerchantRow]
}>()

const message = useMessage()
const activeTab = ref('overview')
const saving = ref(false)
const defaultMarkupRate = ref(0)
const rateDrafts = ref<AgentMerchantProviderRate[]>([])
const selectedGroupIds = ref<string[]>([])

const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`
const formatAmount = (value: number, currency: string) => `${currency} ${value.toLocaleString()}`

watch(() => props.show, (show) => {
  if (!show || !props.merchant) return
  activeTab.value = props.initialTab || 'overview'
  defaultMarkupRate.value = props.merchant.default_markup_rate
  rateDrafts.value = props.merchant.provider_rates.map(rate => ({ ...rate }))
  selectedGroupIds.value = props.merchant.bet_limit_assignments.map(item => item.provider_bet_group_id)
})

const availableGroups = computed(() => {
  if (!props.merchant) return []
  const providerIds = new Set(props.merchant.provider_rates.map(rate => rate.provider_id))
  return getAgentAssignableBetGroups(props.merchant.owner_agent_code).filter(group =>
    props.merchant?.currencies.includes(group.currency)
    && providerIds.has(group.provider_id)
  )
})

const overrideCount = computed(() => rateDrafts.value.filter(rate => Math.abs(rate.quote_markup_rate - defaultMarkupRate.value) > 0.000001).length)

const rateColumns: DataTableColumns<AgentMerchantProviderRate> = [
  { title: '供應商', key: 'provider_name', width: 150 },
  { title: '代理給商戶費率', key: 'agent_upstream_rate', width: 145, align: 'right', render: row => formatRate(row.agent_upstream_rate) },
  {
    title: '商戶加價', key: 'quote_markup_rate', width: 180, align: 'right',
    render: row => h(NInputNumber, {
      value: row.quote_markup_rate,
      min: 0,
      max: 0.2,
      step: 0.001,
      size: 'small',
      onUpdateValue: (value: number | null) => {
        row.quote_markup_rate = value ?? defaultMarkupRate.value
        row.merchant_quote_rate = Number((row.agent_upstream_rate + row.quote_markup_rate).toFixed(6))
      }
    }, { suffix: () => formatRate(row.quote_markup_rate) })
  },
  { title: '商戶應繳費率', key: 'merchant_quote_rate', width: 145, align: 'right', render: row => formatRate(row.merchant_quote_rate) },
  { title: '目前版本', key: 'rate_version', minWidth: 175 }
]

const buildLimitAssignment = (group: ProviderCurrencyBetGroup): MerchantBetLimitAssignment => ({
  merchant_id: props.merchant?.merchant_id || '',
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
  source: '代理指派',
  status: '啟用'
})

const saveRates = async () => {
  if (!props.merchant) return
  const invalid = rateDrafts.value.find(rate => rate.merchant_quote_rate < rate.agent_upstream_rate)
  if (invalid) {
    message.error(`${invalid.provider_name} 的商戶應繳費率不可低於代理費率`)
    return
  }

  saving.value = true
  try {
    const versionAt = new Date().toISOString()
    const versionSuffix = versionAt.slice(0, 10).replace(/-/g, '')
    const providerRates = rateDrafts.value.map(rate => ({
      ...rate,
      rate_version: `MQR-${props.merchant?.merchant_id}-${rate.provider_id}-${versionSuffix}`,
      effective_at: versionAt
    }))
    const updated = await portalMerchantService.updateMerchant(props.merchant.merchant_id, {
      default_markup_rate: defaultMarkupRate.value,
      provider_rates: providerRates
    })
    emit('saved', updated)
    message.success('商戶費率新版本已建立；歷史注單與已結帳資料不會重算')
  } finally {
    saving.value = false
  }
}

const saveLimits = async () => {
  if (!props.merchant) return
  if (!selectedGroupIds.value.length) {
    message.error('至少需指派一個 Provider 幣別線已開放的下注限額方案')
    return
  }
  saving.value = true
  try {
    const assignments = availableGroups.value
      .filter(group => selectedGroupIds.value.includes(group.provider_bet_group_id))
      .map(buildLimitAssignment)
    const updated = await portalMerchantService.updateMerchant(props.merchant.merchant_id, { bet_limit_assignments: assignments })
    emit('saved', updated)
    message.success('下注限額方案已更新；既有 Session 與注單仍保留原快照')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <n-drawer :show="show" width="min(960px, 100vw)" @update:show="value => emit('update:show', value)">
    <n-drawer-content :title="merchant ? `${merchant.merchant_name} / ${merchant.merchant_id}` : '商戶資料'" closable>
      <template v-if="merchant">
        <n-alert type="info" :show-icon="false" class="mb-4">
          商戶費率用於代理對商戶的應收試算；GGAP 正式帳務仍只向 L1 代理開帳。匯率服務費獨立計算，不併入遊戲費率。
        </n-alert>

        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab-pane name="overview" tab="基本資料">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="商戶代碼">{{ merchant.merchant_id }}</n-descriptions-item>
              <n-descriptions-item label="狀態"><n-tag :type="merchant.status === 'active' ? 'success' : merchant.status === 'maintenance' ? 'warning' : 'error'" :bordered="false">{{ merchant.status === 'active' ? '啟用' : merchant.status === 'maintenance' ? '維護' : '停用' }}</n-tag></n-descriptions-item>
              <n-descriptions-item label="代理路徑" :span="2">{{ merchant.agent_path }}</n-descriptions-item>
              <n-descriptions-item label="錢包模式">{{ merchant.wallet_mode }}</n-descriptions-item>
              <n-descriptions-item label="交易幣別">{{ merchant.currencies.join(' / ') }}</n-descriptions-item>
              <n-descriptions-item label="正式結算幣別"><n-tag type="success" :bordered="false">USDT</n-tag></n-descriptions-item>
              <n-descriptions-item label="匯率服務費">{{ formatRate(merchant.fx_service_fee_rate) }}（獨立計費）</n-descriptions-item>
              <n-descriptions-item label="供應商費率">{{ merchant.provider_rates.length }} 組</n-descriptions-item>
              <n-descriptions-item label="限額方案">{{ merchant.bet_limit_assignments.length }} 個</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="rates" tab="商戶費率">
            <n-alert type="warning" :show-icon="false" class="mb-4">
              未覆寫的供應商使用「代理給商戶費率 + 預設商戶加價」。每次儲存都建立新版本與生效時間，不修改歷史快照。
            </n-alert>
            <div class="mb-4 grid gap-3 md:grid-cols-3">
              <div class="rounded border border-white/10 bg-[#202026] p-4">
                <div class="mb-2 text-sm text-gray-400">預設商戶加價</div>
                <n-input-number v-model:value="defaultMarkupRate" :min="0" :max="0.2" :step="0.001" />
              </div>
              <div class="rounded border border-white/10 bg-[#202026] p-4"><div class="text-sm text-gray-400">供應商覆寫</div><div class="mt-2 text-xl">{{ overrideCount }} 組</div></div>
              <div class="rounded border border-white/10 bg-[#202026] p-4"><div class="text-sm text-gray-400">匯率服務費</div><div class="mt-2 text-xl">{{ formatRate(merchant.fx_service_fee_rate) }}</div><div class="text-xs text-gray-500">不併入商戶報價</div></div>
            </div>
            <n-data-table :columns="withTableSorters(rateColumns)" :data="rateDrafts" :pagination="false" :scroll-x="850" />
            <div class="mt-4 flex justify-end"><n-button type="primary" :loading="saving" @click="saveRates">儲存新費率版本</n-button></div>
          </n-tab-pane>

          <n-tab-pane name="limits" tab="下注限額">
            <n-alert type="info" :show-icon="false" class="mb-4">
              只能勾選 Provider 幣別線已開放、且上級代理可分配的方案。區間由供應商提供，不可在商戶端自行輸入。
            </n-alert>
            <n-checkbox-group v-if="availableGroups.length" v-model:value="selectedGroupIds" class="block space-y-3">
              <label v-for="group in availableGroups" :key="group.provider_bet_group_id" class="flex cursor-pointer items-center justify-between gap-4 rounded border border-white/10 bg-[#202026] p-4">
                <div class="flex min-w-0 items-center gap-3">
                  <n-checkbox :value="group.provider_bet_group_id" />
                  <div>
                    <div class="font-medium">{{ group.provider_bet_group_name }}</div>
                    <div class="mt-1 font-mono text-xs text-gray-500">{{ group.provider_currency_connection_id }} / {{ group.provider_bet_group_code }}</div>
                  </div>
                </div>
                <div class="text-right text-sm">
                  <n-tag size="small" :bordered="false">{{ group.currency }}</n-tag>
                  <div class="mt-1">{{ formatAmount(group.min_bet, group.currency) }} - {{ formatAmount(group.max_bet, group.currency) }}</div>
                </div>
              </label>
            </n-checkbox-group>
            <n-alert v-else type="warning" :show-icon="false">目前商戶交易幣別尚無可由代理分配的下注限額方案，請先由管理者在供應商幣別管理開放。</n-alert>
            <div class="mt-4 flex justify-end"><n-button type="primary" :loading="saving" :disabled="!availableGroups.length" @click="saveLimits">儲存方案指派</n-button></div>
          </n-tab-pane>

          <n-tab-pane name="accounting" tab="帳務參考">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="今日投注">USDT {{ merchant.today_bet_usdt.toLocaleString() }}</n-descriptions-item>
              <n-descriptions-item label="今日 GGR">USDT {{ merchant.today_ggr_usdt.toLocaleString() }}</n-descriptions-item>
              <n-descriptions-item label="代理對商戶應收參考">USDT {{ merchant.receivable_usdt.toLocaleString() }}</n-descriptions-item>
              <n-descriptions-item label="GGAP 正式開帳對象">L1 代理</n-descriptions-item>
              <n-descriptions-item label="交易來源" :span="2">每位會員每一筆下注原幣流水；00:00 關帳、00:05 鎖匯率，00:10 完成 USDT 日結。</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>
        </n-tabs>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>
