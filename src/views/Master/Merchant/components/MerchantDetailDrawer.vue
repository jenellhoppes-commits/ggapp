<script setup lang="ts">
import { computed } from 'vue'
import {
  NAlert,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NIcon,
  NStatistic,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui'
import { ContentCopyRound } from '@vicons/material'
import type { Merchant, MerchantStatus } from '../../../../types/merchant'
import MoneyText from '../../../../components/Common/MoneyText.vue'
import { formatDisplayAmount } from '../../../../utils/format'
import { makeMerchantBetLimitAssignments } from '../../../../mocks/gameLimits'

const props = defineProps<{
  show: boolean
  merchant: Merchant | null
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'edit', merchant: Merchant): void
  (e: 'games', merchant: Merchant): void
  (e: 'action', action: string, merchant: Merchant): void
}>()

const statusMeta: Record<MerchantStatus, { label: string; type: 'success' | 'warning' | 'error' | 'default' }> = {
  active: { label: '啟用', type: 'success' },
  disabled: { label: '停用', type: 'warning' },
  frozen: { label: '凍結', type: 'error' },
  archived: { label: '封存', type: 'default' }
}

const merchantStatus = computed(() => {
  const status = props.merchant?.status || (props.merchant?.state === 1 ? 'active' : 'disabled')
  return statusMeta[status] || statusMeta.disabled
})

const merchantName = computed(() => props.merchant?.merchant_name || props.merchant?.name || '-')
const walletMode = computed(() => props.merchant?.walletMode || props.merchant?.wallet_mode || 'seamless')
const walletLabel = computed(() => walletMode.value === 'seamless' ? 'Seamless Wallet' : 'Transfer Wallet')
const transactionCurrency = computed(() => props.merchant?.default_transaction_currency || props.merchant?.default_display_currency || props.merchant?.currency_type || 'TWD')
const settlementCurrency = computed(() => props.merchant?.settlement_currency || 'USDT')
const callbackAmountModeLabel = computed(() => props.merchant?.callback_amount_mode === 'settlement_currency'
  ? '正式結算幣別（僅 USDT 錢包）'
  : '交易／錢包原幣')
const transactionCurrencies = computed(() => props.merchant?.transaction_currencies || props.merchant?.display_currencies || props.merchant?.supported_currencies || [transactionCurrency.value])
const serviceFeeRate = computed(() => props.merchant?.service_fee_rate ?? props.merchant?.exchange_fee_rate)
const quoteRates = computed(() => props.merchant?.merchant_quote_rates || [])
const agentName = computed(() => props.merchant?.agent_name || props.merchant?.parent_agent || '平台直營代理')
const playerWalletKey = computed(() => `${props.merchant?.display_id || 'merchant_id'} + merchant_player_id + transaction_currency`)
const merchantBetLimitAssignments = computed(() => props.merchant?.bet_limit_assignments?.length
  ? props.merchant.bet_limit_assignments
  : makeMerchantBetLimitAssignments(transactionCurrencies.value, transactionCurrency.value, {
      agentCode: props.merchant?.agent_code,
      authorizedProviderIds: quoteRates.value.map(rate => rate.provider_id)
    }))

const formatDateTime = (value?: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString()
}

const formatRate = (value?: number) => {
  if (value === undefined) return '-'
  return `${(value * 100).toFixed(2)}%`
}

const copyText = async (value?: string) => {
  if (!value) return
  await navigator.clipboard.writeText(value)
}

const runAction = (action: string) => {
  if (!props.merchant) return
  emit('action', action, props.merchant)
}
</script>

<template>
  <n-drawer :show="show" :width="1040" @update:show="(v) => emit('update:show', v)">
    <n-drawer-content closable>
      <template #header>
        <div v-if="merchant" class="flex flex-wrap items-center gap-3">
          <span class="text-lg font-semibold">{{ merchantName }}</span>
          <span class="font-mono text-sm text-gray-500">{{ merchant.display_id }}</span>
          <n-tag :type="merchantStatus.type" :bordered="false" round>{{ merchantStatus.label }}</n-tag>
          <n-tag :bordered="false">{{ walletLabel }}</n-tag>
          <n-tag type="success" :bordered="false">結算 {{ settlementCurrency }}</n-tag>
        </div>
        <span v-else>商戶詳情</span>
      </template>

      <template v-if="merchant">
        <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div class="rounded border border-white/10 bg-[#202026] p-4">
            <n-statistic label="今日投注額">
              <MoneyText :value="merchant.today_bet || 0" :currency="transactionCurrency" compact color="text-slate-100" />
            </n-statistic>
          </div>
          <div class="rounded border border-white/10 bg-[#202026] p-4">
            <n-statistic label="今日派彩">
              <MoneyText :value="merchant.today_payout || 0" :currency="transactionCurrency" compact color="text-slate-100" />
            </n-statistic>
          </div>
          <div class="rounded border border-white/10 bg-[#202026] p-4">
            <n-statistic label="結算 GGR">
              <MoneyText :value="merchant.settlement_today_ggr || 0" :currency="settlementCurrency" compact showSign />
            </n-statistic>
          </div>
          <div class="rounded border border-white/10 bg-[#202026] p-4">
            <n-statistic label="交易成功率">
              <span class="font-mono text-slate-100">{{ merchant.transaction_success_rate?.toFixed(2) || '0.00' }}%</span>
            </n-statistic>
          </div>
        </div>

        <n-tabs type="line" animated>
          <n-tab-pane name="basic" tab="基本資料">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="商戶代碼">{{ merchant.display_id }}</n-descriptions-item>
              <n-descriptions-item label="商戶名稱">{{ merchantName }}</n-descriptions-item>
              <n-descriptions-item label="商戶類型">商戶</n-descriptions-item>
              <n-descriptions-item label="狀態">
                <n-tag :type="merchantStatus.type" :bordered="false">{{ merchantStatus.label }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="聯絡人">{{ merchant.contact_name || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Email">{{ merchant.contact_email || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Telegram">{{ merchant.telegram || '-' }}</n-descriptions-item>
              <n-descriptions-item label="電話">{{ merchant.phone || '-' }}</n-descriptions-item>
              <n-descriptions-item label="建立時間">{{ formatDateTime(merchant.created_at) }}</n-descriptions-item>
              <n-descriptions-item label="更新時間">{{ formatDateTime(merchant.updated_at) }}</n-descriptions-item>
              <n-descriptions-item label="備註" :span="2">{{ merchant.remarks || '-' }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="api" tab="API 設定">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="API Key">
                <span class="font-mono">{{ merchant.api_key || '-' }}</span>
                <n-button class="ml-2" text size="tiny" @click="copyText(merchant.api_key)">
                  <template #icon><n-icon><ContentCopyRound /></n-icon></template>
                </n-button>
              </n-descriptions-item>
              <n-descriptions-item label="API Secret">{{ merchant.api_secret_masked || 'sk_live_****************' }}</n-descriptions-item>
              <n-descriptions-item label="Callback URL">{{ merchant.callback_url || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Callback 金額模式">{{ callbackAmountModeLabel }}</n-descriptions-item>
              <n-descriptions-item label="簽名方式">{{ merchant.sign_method || '-' }}</n-descriptions-item>
              <n-descriptions-item label="環境">{{ merchant.environment === 'production' ? 'Production' : 'Sandbox' }}</n-descriptions-item>
              <n-descriptions-item label="API 狀態">{{ merchant.api_status || '-' }}</n-descriptions-item>
              <n-descriptions-item label="IP 白名單" :span="2">
                <div class="flex flex-wrap gap-1">
                  <n-tag v-for="ip in merchant.ipWhitelist || merchant.ip_whitelist || []" :key="ip" size="small" :bordered="false">
                    {{ ip }}
                  </n-tag>
                </div>
              </n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="wallet" tab="錢包設定">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="錢包模式">{{ walletLabel }}</n-descriptions-item>
              <n-descriptions-item label="Timeout">{{ merchant.timeout_ms || 0 }} ms</n-descriptions-item>
              <n-descriptions-item label="Retry">{{ merchant.retry_count || 0 }} 次</n-descriptions-item>
              <n-descriptions-item label="冪等控制">{{ merchant.idempotency_enabled ? '啟用' : '停用' }}</n-descriptions-item>
              <n-descriptions-item label="允許負餘額">{{ merchant.allow_negative_balance ? '允許' : '不允許' }}</n-descriptions-item>
              <n-descriptions-item label="信用額度">
                <MoneyText :value="merchant.credit_limit || 0" :currency="settlementCurrency" color="text-slate-100" />
              </n-descriptions-item>
              <n-descriptions-item label="會員錢包鍵" :span="2">
                <span class="font-mono">{{ playerWalletKey }}</span>
              </n-descriptions-item>
              <n-descriptions-item label="Transfer Ledger" :span="2">
                {{ walletMode === 'transfer'
                  ? 'GGAP 內部帳本記錄 Transfer In / Out、Bet、Win、Rollback 與餘額快照。'
                  : 'Seamless Wallet 由商戶 Callback 即時處理餘額；Launch Game 時依會員幣別路由至對應的 Provider 幣別線。' }}
              </n-descriptions-item>
              <n-descriptions-item label="Balance URL" :span="2">{{ merchant.balance_url || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Bet URL" :span="2">{{ merchant.bet_url || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Win URL" :span="2">{{ merchant.win_url || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Rollback URL" :span="2">{{ merchant.rollback_url || '-' }}</n-descriptions-item>
              <n-descriptions-item label="Refund URL" :span="2">{{ merchant.refund_url || '-' }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="currency" tab="幣別設定">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="多交易幣別">{{ merchant.multi_currency_enabled ? '啟用' : '停用' }}</n-descriptions-item>
              <n-descriptions-item label="預設交易幣別">{{ transactionCurrency }}</n-descriptions-item>
              <n-descriptions-item label="可用交易幣別">
                <div class="flex flex-wrap gap-1">
                  <n-tag v-for="currency in transactionCurrencies" :key="currency" size="small" :bordered="false">
                    {{ currency }}
                  </n-tag>
                </div>
              </n-descriptions-item>
              <n-descriptions-item label="正式結算幣別">
                <n-tag type="success" :bordered="false">{{ settlementCurrency }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="日結排程">00:00 關帳 / 00:05 鎖匯率 / 00:10 完成</n-descriptions-item>
              <n-descriptions-item label="匯率規則">按交易日公告匯率建立不可變快照</n-descriptions-item>
              <n-descriptions-item label="Provider 即時交易">使用幣別線原幣，不於遊戲 Session 轉換 USDT</n-descriptions-item>
              <n-descriptions-item label="結算服務費率">{{ formatRate(serviceFeeRate) }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="games" tab="遊戲權限">
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="啟用供應商">{{ merchant.enabled_provider_count || 0 }}</n-descriptions-item>
              <n-descriptions-item label="啟用遊戲">{{ merchant.enabled_game_count || 0 }}</n-descriptions-item>
              <n-descriptions-item label="停用遊戲">{{ merchant.disabled_game_count || 0 }}</n-descriptions-item>
              <n-descriptions-item label="預設遊戲包">{{ merchant.game_package || '-' }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="limits" tab="下注限額">
            <n-alert type="info" :show-icon="false" class="mb-4">
              商戶只可使用所屬代理已開放的 Provider 幣別線下注限額方案；特殊會員只能改指派其他已開放方案，不可自行輸入區間，交易時會保存方案快照。
            </n-alert>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div v-for="limit in merchantBetLimitAssignments" :key="`${limit.provider_name}-${limit.provider_bet_group_name}-${limit.transaction_currency}`" class="rounded border border-white/10 bg-[#202026] p-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div class="font-semibold">{{ limit.provider_bet_group_name }}</div>
                    <div class="text-xs text-gray-500">{{ limit.provider_name }} / {{ limit.game_type }}</div>
                  </div>
                  <n-tag type="success" size="small" :bordered="false">{{ limit.status }}</n-tag>
                </div>
                <div class="space-y-2 text-sm">
                  <div class="flex justify-between gap-3"><span class="text-gray-500">投注區間</span><span>{{ formatDisplayAmount(limit.min_bet, limit.transaction_currency) }} - {{ formatDisplayAmount(limit.max_bet, limit.transaction_currency) }}</span></div>
                  <div class="flex justify-between gap-3"><span class="text-gray-500">來源</span><span>{{ limit.source }}</span></div>
                </div>
              </div>
            </div>
          </n-tab-pane>

          <n-tab-pane name="agent" tab="代理歸屬">
            <n-alert type="info" :show-icon="false" class="mb-4">
              商戶必須綁定代理；GGAP 正式收款與日結只對 L1 代理，商戶報價僅作為代理帳務明細與展示。
            </n-alert>
            <n-descriptions bordered :column="2" label-placement="left">
              <n-descriptions-item label="所屬代理">{{ agentName }}</n-descriptions-item>
              <n-descriptions-item label="代理代碼">{{ merchant.agent_code || '-' }}</n-descriptions-item>
              <n-descriptions-item label="代理層級">L{{ merchant.agent_level || 1 }}</n-descriptions-item>
              <n-descriptions-item label="上層代理">{{ merchant.parent_agent_code || 'GGAP' }}</n-descriptions-item>
              <n-descriptions-item label="Root L1">{{ merchant.root_agent_code || merchant.agent_code || '-' }}</n-descriptions-item>
              <n-descriptions-item label="正式收款對象">{{ merchant.settlement_agent_code || merchant.root_agent_code || merchant.agent_code || '-' }}</n-descriptions-item>
              <n-descriptions-item label="代理路徑" :span="2">{{ merchant.agent_path || agentName }}</n-descriptions-item>
              <n-descriptions-item label="平台直營">{{ merchant.is_direct_agent ? '是' : '否' }}</n-descriptions-item>
              <n-descriptions-item label="綁定時間">{{ formatDateTime(merchant.agent_effective_at) }}</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>

          <n-tab-pane name="quote" tab="商戶報價">
            <n-alert type="warning" :show-icon="false" class="mb-4">
              商戶報價為代理向商戶收費的展示資料；GGAP 不直接向商戶收款，也不把商戶作為正式結算主體。
            </n-alert>
            <div v-if="quoteRates.length" class="space-y-3">
              <div v-for="rate in quoteRates" :key="rate.provider_id" class="rounded border border-white/10 bg-[#202026] p-4">
                <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="font-semibold">{{ rate.provider_name }}</div>
                    <div class="font-mono text-xs text-gray-500">{{ rate.provider_id }} / L{{ rate.rate_source_agent_level }} {{ rate.rate_source_agent_id }}</div>
                  </div>
                  <n-tag :type="rate.status === 'active' ? 'success' : 'warning'" :bordered="false">{{ rate.status }}</n-tag>
                </div>
                <div class="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                  <div><span class="text-gray-500">供應商成本</span><div>{{ formatRate(rate.provider_cost_rate_snapshot) }}</div></div>
                  <div><span class="text-gray-500">代理成本</span><div>{{ formatRate(rate.agent_upstream_rate) }}</div></div>
                  <div><span class="text-gray-500">商戶加成</span><div>{{ formatRate(rate.quote_markup_rate) }}</div></div>
                  <div><span class="text-gray-500">商戶報價</span><div>{{ formatRate(rate.merchant_quote_rate) }}</div></div>
                  <div><span class="text-gray-500">生效時間</span><div>{{ formatDateTime(rate.effective_at) }}</div></div>
                </div>
              </div>
            </div>
            <n-empty v-else description="尚未設定商戶報價" />
          </n-tab-pane>

          <n-tab-pane name="audit" tab="操作紀錄">
            <n-timeline v-if="merchant.audit_logs?.length">
              <n-timeline-item
                v-for="item in merchant.audit_logs"
                :key="item.audit_no || item.trace_id"
                type="success"
                :title="item.action"
                :content="`${item.operator} · ${item.trace_id}`"
                :time="formatDateTime(item.operated_at)"
              />
            </n-timeline>
            <n-empty v-else description="尚無操作紀錄" />
          </n-tab-pane>
        </n-tabs>
      </template>

      <template #footer>
        <div v-if="merchant" class="flex justify-end gap-2">
          <n-button secondary @click="emit('games', merchant)">遊戲權限</n-button>
          <n-button secondary @click="runAction('test-callback')">測試 Callback</n-button>
          <n-button secondary @click="runAction('reset-secret')">重置 Secret</n-button>
          <n-button type="warning" secondary @click="runAction('disable')">停用商戶</n-button>
          <n-button type="primary" @click="emit('edit', merchant)">編輯</n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>
