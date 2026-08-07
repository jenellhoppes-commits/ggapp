<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import {
  NAlert,
  NButton,
  NDataTable,
  NDatePicker,
  NDropdown,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NTag,
  useDialog,
  useMessage
} from 'naive-ui'
import { useDebounceFn } from '@vueuse/core'
import {
  ContentCopyRound,
  DescriptionOutlined,
  SearchOutlined,
  SettingsOutlined,
  SportsEsportsOutlined
} from '@vicons/material'
import type { DataTableColumns, DropdownOption } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import type { Merchant, MerchantCurrency, MerchantStatus, MerchantWalletMode } from '../../../types/merchant'
import { useMerchantList } from '../../../composables/useMerchantList'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import MerchantCreateDrawer from '../../../components/Merchant/MerchantCreateDrawer.vue'
import ConfigMerchantDrawer from './components/ConfigMerchantDrawer.vue'
import MerchantDetailDrawer from './components/MerchantDetailDrawer.vue'
import MerchantGameSettingsDrawer from './components/MerchantGameSettingsDrawer.vue'
import MoneyText from '../../../components/Common/MoneyText.vue'

const { list, loading, error, fetchList } = useMerchantList()
const route = useRoute()
const router = useRouter()
const dialog = useDialog()
const message = useMessage()

const showCreate = ref(false)
const showConfig = ref(false)
const showDetail = ref(false)
const showGameSettings = ref(false)
const currentMerchant = ref<Merchant | null>(null)

const searchText = ref('')
const statusFilter = ref<MerchantStatus | null>(null)
const walletFilter = ref<MerchantWalletMode | null>(null)
const currencyFilter = ref<MerchantCurrency | null>(null)
const agentFilter = ref<string | null>(null)
const createdRange = ref<[number, number] | null>(null)

const statusMap: Record<MerchantStatus, { label: string; type: 'success' | 'warning' | 'error' | 'default' }> = {
  active: { label: '啟用', type: 'success' },
  disabled: { label: '停用', type: 'warning' },
  frozen: { label: '凍結', type: 'error' },
  archived: { label: '封存', type: 'default' }
}

const statusOptions = [
  { label: '啟用', value: 'active' },
  { label: '停用', value: 'disabled' },
  { label: '凍結', value: 'frozen' },
  { label: '封存', value: 'archived' }
]

const walletOptions = [
  { label: 'Seamless', value: 'seamless' },
  { label: 'Transfer', value: 'transfer' }
]

const currencyOptions = [
  { label: 'TWD', value: 'TWD' },
  { label: 'PHP', value: 'PHP' },
  { label: 'THB', value: 'THB' },
  { label: 'VND', value: 'VND' },
  { label: 'IDR', value: 'IDR' }
]

const getMerchantName = (row: Merchant) => row.merchant_name || row.name || '-'
const getWalletMode = (row: Merchant): MerchantWalletMode => row.walletMode || row.wallet_mode || 'seamless'
const getStatus = (row: Merchant): MerchantStatus => row.status || (row.state === 1 ? 'active' : 'disabled')
const getDisplayCurrencies = (row: Merchant) => (
  row.display_currencies || row.supported_currencies || [row.currency_type]
) as MerchantCurrency[]
const getDisplayCurrency = (row: Merchant) => row.default_display_currency || row.currency_type || 'TWD'
const getAgentName = (row: Merchant) => row.agent_name || row.parent_agent || '平台直營代理'

const agentOptions = computed(() => {
  const agents = Array.from(new Set(['平台直營代理', ...list.value.map(getAgentName)]))
  return agents.map(agent => ({ label: agent, value: agent }))
})

const debouncedFetch = useDebounceFn((search: string) => {
  fetchList({ search })
}, 400)

watch(searchText, (value) => {
  debouncedFetch(value)
})

const syncCreateDrawerFromRoute = () => {
  if (route.query.create === '1') showCreate.value = true
}

onMounted(() => {
  fetchList()
  syncCreateDrawerFromRoute()
})

watch(() => route.query.create, () => {
  syncCreateDrawerFromRoute()
})

watch(showCreate, (show) => {
  if (show || route.query.create !== '1') return
  const query = { ...route.query }
  delete query.create
  router.replace({ name: 'merchant-list', query })
})

const filteredList = computed(() => {
  return list.value.filter((row) => {
    const keyword = searchText.value.trim().toLowerCase()
    const inKeyword = !keyword
      || row.display_id?.toLowerCase().includes(keyword)
      || getMerchantName(row).toLowerCase().includes(keyword)
      || row.site_code?.toLowerCase().includes(keyword)

    const inStatus = !statusFilter.value || getStatus(row) === statusFilter.value
    const inWallet = !walletFilter.value || getWalletMode(row) === walletFilter.value
    const inCurrency = !currencyFilter.value || getDisplayCurrencies(row).includes(currencyFilter.value)
    const inAgent = !agentFilter.value || getAgentName(row) === agentFilter.value
    const createdAt = new Date(row.created_at).getTime()
    const inDate = !createdRange.value || (createdAt >= createdRange.value[0] && createdAt <= createdRange.value[1])

    return inKeyword && inStatus && inWallet && inCurrency && inAgent && inDate
  })
})

const resetFilters = () => {
  searchText.value = ''
  statusFilter.value = null
  walletFilter.value = null
  currencyFilter.value = null
  agentFilter.value = null
  createdRange.value = null
  fetchList()
}

const setCurrentMerchant = (row: Merchant) => {
  currentMerchant.value = row
}

const handleView = (row: Merchant) => {
  setCurrentMerchant(row)
  showDetail.value = true
}

const handleConfig = (row: Merchant) => {
  setCurrentMerchant(row)
  showConfig.value = true
}

const handleGameSettings = (row: Merchant) => {
  setCurrentMerchant(row)
  showGameSettings.value = true
}

const handleMerchantCreated = (merchant: Merchant) => {
  list.value.unshift(merchant)
  currentMerchant.value = merchant
  showDetail.value = true
}

const actionLabels: Record<string, string> = {
  enable: '啟用商戶',
  disable: '停用商戶',
  freeze: '凍結商戶',
  unfreeze: '解除凍結',
  archive: '封存商戶',
  'reset-secret': '重置 API Secret',
  'test-callback': '測試 Callback URL',
  rate: '商戶報價費率',
  agent: '綁定 / 轉移代理',
  account: '建立商戶後台帳號',
  audit: '操作紀錄',
  export: '匯出商戶資料'
}

const confirmAction = (action: string, row: Merchant) => {
  const label = actionLabels[action] || action

  if (action === 'test-callback') {
    row.audit_logs = [{ audit_no: `AUD-${Date.now()}`, operated_at: new Date().toISOString(), operator: 'Admin', action: '測試 Callback URL', target: row.display_id, ip_address: '127.0.0.1', trace_id: `trace-callback-${Date.now()}`, result: 'success' }, ...(row.audit_logs || [])]
    message.success(`${row.display_id} Callback 測試成功，已產生 mock trace id`)
    return
  }

  if (['rate', 'agent'].includes(action)) {
    handleConfig(row)
    return
  }

  if (action === 'audit') {
    handleView(row)
    return
  }

  if (['account', 'export'].includes(action)) {
    message.info(`${label}為演示入口：商戶報價以代理費率為基礎，僅呈現在代理帳務明細，不產生 GGAP 對商戶應收。`)
    return
  }

  dialog.warning({
    title: label,
    content: `${row.display_id} · ${getMerchantName(row)} 執行此操作後，會影響 Launch Game、交易 API 與商戶後台狀態。正式環境需輸入原因並寫入操作紀錄。`,
    positiveText: '確認',
    negativeText: '取消',
    onPositiveClick: () => {
      if (action === 'enable') {
        row.status = 'active'
        row.state = 1
      }
      if (action === 'disable') {
        row.status = 'disabled'
        row.state = 0
      }
      if (action === 'freeze') {
        row.status = 'frozen'
        row.state = 0
      }
      if (action === 'unfreeze') {
        row.status = 'active'
        row.state = 1
      }
      if (action === 'archive') {
        row.status = 'archived'
        row.state = 0
      }
      message.success(`${label}已完成`)
    }
  })
}

const moreOptions = (row: Merchant): DropdownOption[] => {
  const status = getStatus(row)
  return [
    { label: status === 'active' ? '停用商戶' : '啟用商戶', key: status === 'active' ? 'disable' : 'enable' },
    { label: status === 'frozen' ? '解除凍結' : '凍結商戶', key: status === 'frozen' ? 'unfreeze' : 'freeze' },
    { label: '重置 API Secret', key: 'reset-secret' },
    { label: '測試 Callback URL', key: 'test-callback' },
    { label: '商戶報價費率', key: 'rate' },
    { label: '綁定 / 轉移代理', key: 'agent' },
    { label: '建立商戶後台帳號', key: 'account' },
    { label: '操作紀錄', key: 'audit' },
    { label: '封存商戶', key: 'archive' }
  ]
}

const copyMerchantCode = async (row: Merchant) => {
  await navigator.clipboard.writeText(row.display_id || '')
  message.success('商戶代碼已複製')
}

const exportCurrentView = () => {
  message.success(`已依目前查詢條件建立匯出任務，共 ${filteredList.value.length} 筆`)
}

const columns = computed<DataTableColumns<Merchant>>(() => [
  {
    title: '#',
    key: 'index',
    width: 64,
    fixed: 'left',
    render: (_, index) => index + 1
  },
  {
    title: '商戶代碼',
    key: 'display_id',
    width: 150,
    fixed: 'left',
    render: (row) => h('div', { class: 'flex items-center gap-2' }, [
      h('button', {
        class: 'font-mono text-cyan-600 hover:text-cyan-500',
        onClick: () => handleView(row)
      }, row.display_id),
      h(NButton, {
        text: true,
        size: 'tiny',
        onClick: () => copyMerchantCode(row)
      }, { icon: () => h(NIcon, null, { default: () => h(ContentCopyRound) }) })
    ])
  },
  {
    title: '商戶名稱',
    key: 'merchant_name',
    width: 220,
    render: (row) => h('button', {
      class: 'font-semibold text-left hover:text-cyan-600',
      onClick: () => handleView(row)
    }, getMerchantName(row))
  },
  {
    title: '狀態',
    key: 'status',
    width: 110,
    align: 'center',
    render: (row) => {
      const meta = statusMap[getStatus(row)]
      return h(NTag, { type: meta.type, bordered: false, round: true, size: 'small' }, { default: () => meta.label })
    }
  },
  {
    title: '錢包模式',
    key: 'walletMode',
    width: 130,
    render: (row) => h(NTag, {
      type: getWalletMode(row) === 'seamless' ? 'info' : 'default',
      bordered: false,
      size: 'small'
    }, { default: () => getWalletMode(row) === 'seamless' ? 'Seamless' : 'Transfer' })
  },
  {
    title: '可用交易幣別',
    key: 'display_currencies',
    width: 170,
    render: (row) => h(NSpace, { size: 4 }, {
      default: () => getDisplayCurrencies(row).slice(0, 3).map(currency =>
        h(NTag, { size: 'small', bordered: false }, { default: () => currency })
      )
    })
  },
  {
    title: '官方結算幣別',
    key: 'settlement_currency',
    width: 140,
    align: 'center',
    render: (row) => h(NTag, { type: 'success', bordered: false, size: 'small' }, { default: () => row.settlement_currency || 'USDT' })
  },
  {
    title: '供應商',
    key: 'enabled_provider_count',
    width: 100,
    align: 'right',
    render: (row) => row.enabled_provider_count || 0
  },
  {
    title: '遊戲數',
    key: 'enabled_game_count',
    width: 110,
    align: 'right',
    render: (row) => (row.enabled_game_count || 0).toLocaleString()
  },
  {
    title: '今日投注額',
    key: 'today_bet',
    width: 150,
    align: 'right',
    render: (row) => h(MoneyText, { value: row.today_bet || 0, currency: getDisplayCurrency(row), compact: true, color: 'text-slate-100' })
  },
  {
    title: '今日派彩',
    key: 'today_payout',
    width: 150,
    align: 'right',
    render: (row) => h(MoneyText, { value: row.today_payout || 0, currency: getDisplayCurrency(row), compact: true, color: 'text-slate-100' })
  },
  {
    title: '今日 GGR（顯示幣）',
    key: 'today_ggr',
    width: 160,
    align: 'right',
    render: (row) => h(MoneyText, { value: row.today_ggr || 0, currency: getDisplayCurrency(row), compact: true, showSign: true })
  },
  {
    title: '結算 GGR（USDT）',
    key: 'settlement_today_ggr',
    width: 160,
    align: 'right',
    render: (row) => h(MoneyText, { value: row.settlement_today_ggr || 0, currency: row.settlement_currency || 'USDT', compact: true, showSign: true })
  },
  {
    title: '日結狀態',
    key: 'daily_settlement_status',
    width: 130,
    align: 'center',
    render: (row) => h(NTag, { type: row.rate_locked_at ? 'success' : 'warning', bordered: false, size: 'small' }, {
      default: () => row.rate_locked_at ? '已鎖定' : '待日結'
    })
  },
  {
    title: '上層代理',
    key: 'parent_agent',
    width: 190,
    render: (row) => h('div', { class: 'flex flex-col gap-1' }, [
      h('span', getAgentName(row)),
      row.is_direct_agent
        ? h(NTag, { size: 'small', type: 'info', bordered: false }, { default: () => '平台直營' })
        : null
    ])
  },
  {
    title: '建立時間',
    key: 'created_at',
    width: 180,
    render: (row) => new Date(row.created_at).toLocaleString()
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    fixed: 'right',
    render: (row) => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, {
          size: 'small',
          secondary: true,
          onClick: () => handleView(row)
        }, { icon: () => h(NIcon, null, { default: () => h(DescriptionOutlined) }), default: () => '查看' }),
        h(NButton, {
          size: 'small',
          secondary: true,
          onClick: () => handleConfig(row)
        }, { icon: () => h(NIcon, null, { default: () => h(SettingsOutlined) }), default: () => '編輯' }),
        h(NButton, {
          size: 'small',
          secondary: true,
          onClick: () => handleGameSettings(row)
        }, { icon: () => h(NIcon, null, { default: () => h(SportsEsportsOutlined) }), default: () => '遊戲' }),
        h(NDropdown, {
          trigger: 'click',
          options: moreOptions(row),
          onSelect: (key: string) => confirmAction(key, row)
        }, {
          default: () => h(NButton, { size: 'small', tertiary: true }, { default: () => '更多' })
        })
      ]
    })
  }
])
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">商戶管理</h1>
        <p class="mt-1 text-sm text-gray-500">
          管理商戶資料、API 串接、錢包設定、交易幣別、遊戲權限與所屬代理。
        </p>
      </div>
      <div class="flex gap-2">
        <n-button secondary @click="exportCurrentView">匯出</n-button>
        <n-button type="primary" @click="showCreate = true">新增商戶</n-button>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 rounded border border-white/10 bg-[#202026] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <n-input v-model:value="searchText" clearable placeholder="搜尋商戶代碼 / 名稱 / Site Code" style="width: 320px; max-width: 100%;">
        <template #prefix>
          <n-icon :component="SearchOutlined" class="opacity-60" />
        </template>
      </n-input>
      <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" style="width: 120px;" />
      <n-select v-model:value="walletFilter" clearable placeholder="錢包模式" :options="walletOptions" style="width: 140px;" />
      <n-select v-model:value="currencyFilter" clearable placeholder="交易幣別" :options="currencyOptions" style="width: 120px;" />
      <n-select v-model:value="agentFilter" clearable filterable placeholder="上層代理" :options="agentOptions" style="width: 180px;" />
      <div class="flex items-center gap-2">
        <n-date-picker v-model:value="createdRange" type="daterange" clearable style="width: 240px;" />
        <n-button secondary @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-alert type="error" v-if="error" title="資料載入失敗">
      {{ error }}
    </n-alert>

    <n-data-table
      :columns="withTableSorters(columns)"
      :data="filteredList"
      :loading="loading"
      :pagination="DEFAULT_TABLE_PAGINATION"
      :scroll-x="2380"
      class="mt-4"
    />

    <merchant-create-drawer
      v-model:show="showCreate"
      mode="admin"
      @refresh="fetchList"
      @created="handleMerchantCreated"
    />

    <config-merchant-drawer
      v-model:show="showConfig"
      :merchant="currentMerchant"
      @refresh="fetchList"
    />

    <merchant-detail-drawer
      v-model:show="showDetail"
      :merchant="currentMerchant"
      @edit="handleConfig"
      @games="handleGameSettings"
      @action="confirmAction"
    />

    <merchant-game-settings-drawer
      v-model:show="showGameSettings"
      :merchant="currentMerchant"
      @refresh="fetchList"
    />
  </div>
</template>
