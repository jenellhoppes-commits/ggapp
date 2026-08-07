<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { NAlert, NButton, NCard, NDataTable, NGrid, NGridItem, NInput, NSelect, NStatistic, NTag, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import MerchantCreateDrawer from '../../../components/Merchant/MerchantCreateDrawer.vue'
import AgentMerchantDrawer from '../../../components/Portal/AgentMerchantDrawer.vue'
import { portalMerchantService } from '../../../services/portal/merchants'
import type { AgentMerchantProviderRate, AgentMerchantRow } from '../../../services/portal/merchants'
import type { Merchant } from '../../../types/merchant'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

const message = useMessage()
const keyword = ref('')
const status = ref<string | null>(null)
const showCreate = ref(false)
const showDrawer = ref(false)
const drawerTab = ref<'overview' | 'rates' | 'limits' | 'accounting'>('overview')
const selectedMerchant = ref<AgentMerchantRow | null>(null)
const loading = ref(false)
const rows = ref<AgentMerchantRow[]>([])

const totalBetUsdt = computed(() => rows.value.reduce((sum, row) => sum + row.today_bet_usdt, 0))
const totalGgrUsdt = computed(() => rows.value.reduce((sum, row) => sum + row.today_ggr_usdt, 0))
const totalReceivableUsdt = computed(() => rows.value.reduce((sum, row) => sum + row.receivable_usdt, 0))
const activeMerchantCount = computed(() => rows.value.filter(row => row.status === 'active').length)

const loadMerchants = async () => {
  loading.value = true
  try {
    rows.value = await portalMerchantService.listMerchants({ keyword: keyword.value, status: status.value })
  } finally {
    loading.value = false
  }
}

const merchantToAgentRow = (merchant: Merchant): AgentMerchantRow => {
  const providerRates: AgentMerchantProviderRate[] = (merchant.merchant_quote_rates || []).map(rate => ({
    provider_id: rate.provider_id,
    provider_name: rate.provider_name,
    agent_upstream_rate: rate.agent_upstream_rate,
    quote_markup_rate: rate.quote_markup_rate ?? merchant.default_merchant_markup_rate ?? 0,
    merchant_quote_rate: rate.merchant_quote_rate,
    rate_version: `MQR-${merchant.display_id}-${rate.provider_id}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    effective_at: rate.effective_at
  }))

  return {
    merchant_id: merchant.display_id,
    merchant_name: merchant.merchant_name || merchant.name || '-',
    owner_agent_code: merchant.agent_code || 'AGT-SEA-001',
    agent_path: merchant.agent_path || merchant.agent_name || 'SEA Growth Agent',
    status: merchant.status === 'active' ? 'active' : merchant.status === 'disabled' ? 'disabled' : 'maintenance',
    wallet_mode: (merchant.wallet_mode || merchant.walletMode) === 'transfer' ? 'Transfer' : 'Seamless',
    currencies: merchant.display_currencies || [merchant.default_display_currency || merchant.currency_type || 'TWD'],
    settlement_currency: 'USDT',
    fx_service_fee_rate: merchant.service_fee_rate ?? 0.004,
    default_markup_rate: merchant.default_merchant_markup_rate ?? 0.01,
    provider_rates: providerRates,
    bet_limit_assignments: merchant.bet_limit_assignments || [],
    today_bet_usdt: merchant.settlement_today_bet || 0,
    today_ggr_usdt: merchant.settlement_today_ggr || 0,
    receivable_usdt: merchant.receivable_amount || 0,
    updated_at: merchant.updated_at || merchant.created_at
  }
}

const handleMerchantCreated = (merchant: Merchant) => {
  rows.value.unshift(merchantToAgentRow(merchant))
  message.success('商戶已建立，可依供應商調整報價並指派該幣別線已開放的下注限額方案。')
}

const openDrawer = (row: AgentMerchantRow, tab: typeof drawerTab.value) => {
  selectedMerchant.value = row
  drawerTab.value = tab
  showDrawer.value = true
}

const handleMerchantSaved = (updated: AgentMerchantRow) => {
  const index = rows.value.findIndex(row => row.merchant_id === updated.merchant_id)
  if (index >= 0) rows.value.splice(index, 1, updated)
  selectedMerchant.value = updated
}

watch([keyword, status], loadMerchants)
onMounted(loadMerchants)

const statusOptions = [
  { label: '啟用', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '維護', value: 'maintenance' }
]

const columns: DataTableColumns<AgentMerchantRow> = [
  { title: '商戶代碼', key: 'merchant_id', width: 130, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.merchant_id) },
  { title: '商戶名稱', key: 'merchant_name', minWidth: 180 },
  { title: '代理路徑', key: 'agent_path', minWidth: 220, ellipsis: { tooltip: true } },
  {
    title: '狀態', key: 'status', width: 95,
    render: row => {
      const typeMap = { active: 'success', disabled: 'error', maintenance: 'warning' } as const
      const labelMap = { active: '啟用', disabled: '停用', maintenance: '維護' }
      return h(NTag, { type: typeMap[row.status], size: 'small', bordered: false }, { default: () => labelMap[row.status] })
    }
  },
  { title: '錢包模式', key: 'wallet_mode', width: 110 },
  { title: '交易幣別', key: 'currencies', minWidth: 150, render: row => h('div', { class: 'flex flex-wrap gap-1' }, row.currencies.map(item => h(NTag, { size: 'small', bordered: false }, { default: () => item }))) },
  { title: '結算幣別', key: 'settlement_currency', width: 100, render: row => h(NTag, { type: 'success', size: 'small', bordered: false }, { default: () => row.settlement_currency }) },
  { title: '預設商戶加價', key: 'default_markup_rate', width: 135, align: 'right', render: row => `${(row.default_markup_rate * 100).toFixed(2)}%` },
  { title: '供應商費率', key: 'provider_rates', width: 115, align: 'right', render: row => `${row.provider_rates.length} 組` },
  { title: '限額方案', key: 'bet_limit_assignments', width: 110, align: 'right', render: row => `${row.bet_limit_assignments.length} 個` },
  { title: '今日投注', key: 'today_bet_usdt', width: 130, align: 'right', render: row => `USDT ${row.today_bet_usdt.toLocaleString()}` },
  { title: '今日 GGR', key: 'today_ggr_usdt', width: 120, align: 'right', render: row => h('span', { class: row.today_ggr_usdt >= 0 ? 'text-emerald-400' : 'text-red-400' }, `USDT ${row.today_ggr_usdt.toLocaleString()}`) },
  { title: '商戶應收參考', key: 'receivable_usdt', width: 145, align: 'right', render: row => h('span', { class: 'text-emerald-400' }, `USDT ${row.receivable_usdt.toLocaleString()}`) },
  {
    title: '操作', key: 'actions', width: 230, fixed: 'right',
    render: row => h('div', { class: 'flex flex-wrap gap-2' }, [
      h(NButton, { size: 'small', secondary: true, onClick: () => openDrawer(row, 'overview') }, { default: () => '查看' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openDrawer(row, 'rates') }, { default: () => '費率' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openDrawer(row, 'limits') }, { default: () => '限額' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openDrawer(row, 'accounting') }, { default: () => '帳務' })
    ])
  }
]
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-white">商戶管理</h1>
        <p class="mt-2 text-sm text-gray-500">代理可下開商戶；商戶掛在本代理樹內，費率依供應商設定，下注限額方案依 Provider 幣別線指派。</p>
      </div>
      <n-button type="primary" @click="showCreate = true">新增商戶</n-button>
    </header>

    <n-alert type="info" :show-icon="false" class="!bg-[#14283a]">
      商戶報價 = 代理給商戶費率 + 商戶加價；未覆寫供應商時使用預設商戶加價。匯率服務費獨立計算，下注限額只能選擇 Provider 已提供且上級已開放的方案。
    </n-alert>

    <n-grid cols="1 s:2 m:3 l:5" :x-gap="16" :y-gap="16" responsive="screen">
      <n-grid-item><n-card size="small"><n-statistic label="商戶總數" :value="rows.length" /></n-card></n-grid-item>
      <n-grid-item><n-card size="small"><n-statistic label="啟用商戶" :value="activeMerchantCount" /></n-card></n-grid-item>
      <n-grid-item><n-card size="small"><n-statistic label="今日投注" :value="`USDT ${totalBetUsdt.toLocaleString()}`" /></n-card></n-grid-item>
      <n-grid-item><n-card size="small"><n-statistic label="今日 GGR" :value="`USDT ${totalGgrUsdt.toLocaleString()}`" /></n-card></n-grid-item>
      <n-grid-item><n-card size="small"><n-statistic label="商戶應收參考" :value="`USDT ${totalReceivableUsdt.toLocaleString()}`" /></n-card></n-grid-item>
    </n-grid>

    <n-card>
      <div class="mb-4 grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_auto]">
        <n-input v-model:value="keyword" clearable placeholder="搜尋商戶代碼 / 名稱 / 代理路徑 / 限額方案" />
        <n-select v-model:value="status" clearable placeholder="狀態" :options="statusOptions" />
        <n-button tertiary @click="keyword = ''; status = null">重置</n-button>
      </div>
      <n-data-table :loading="loading" :columns="withTableSorters(columns)" :data="rows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1880" striped />
    </n-card>

    <merchant-create-drawer v-model:show="showCreate" mode="agent" @created="handleMerchantCreated" />
    <agent-merchant-drawer v-model:show="showDrawer" :merchant="selectedMerchant" :initial-tab="drawerTab" @saved="handleMerchantSaved" />
  </div>
</template>
