<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue'
import { NAlert, NButton, NCard, NDataTable, NInput, NSelect, NTag, NTooltip, useMessage } from 'naive-ui'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import StatusSwitch from '../../../components/Common/StatusSwitch.vue'
import { portalGameService } from '../../../services/portal/games'
import type { PortalGame } from '../../../services/portal/games'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import DemoActionModal from '../../../components/Portal/DemoActionModal.vue'
import type { DemoField } from '../../../components/Portal/DemoActionModal.vue'
import { providerCurrencyBetGroups } from '../../../mocks/gameLimits'
import type { ProviderCurrencyBetGroup } from '../../../types/gameLimit'

interface MerchantGame extends PortalGame {
  bet_groups: ProviderCurrencyBetGroup[]
  supported_currencies?: string[]
  maintenance_rule?: string
}

const message = useMessage()
const loading = ref(false)
const games = ref<MerchantGame[]>([])
const searchValue = ref('')
const typeFilter = ref('all')
const providerFilter = ref('all')
const checkedRowKeys = ref<DataTableRowKey[]>([])
const switchStates = ref<Record<string, boolean>>({})
const showAction = ref(false)
const selectedGame = ref<MerchantGame | null>(null)
const actionMode = ref<'limit' | 'maintenance'>('limit')

const currencyPool = [['TWD', 'PHP'], ['IDR', 'VND'], ['THB'], ['PHP', 'VND']]
const maintenancePool = ['無固定維護', '每週二 03:00-04:00', '每月 1 日 02:00-05:00']

const typeOptions = [
  { label: '所有類型', value: 'all' },
  { label: 'Slot', value: 'Slot' },
  { label: 'Live', value: 'Live' },
  { label: 'Fishing', value: 'Fishing' }
]

const providerOptions = computed(() => {
  const providers = Array.from(new Set(games.value.map(g => g.provider)))
  return [
    { label: '全部供應商', value: 'all' },
    ...providers.map(p => ({ label: p, value: p }))
  ]
})

const fetchGames = async () => {
  loading.value = true
  try {
    const data = await portalGameService.listGames()
    games.value = (data.list || []).map((game, index) => {
      const supportedCurrencies = currencyPool[index % currencyPool.length] || ['TWD']
      const providerId = ({ 'PG Soft': 'PG', JILI: 'JILI', Evolution: 'EVO', 'Pragmatic Play': 'PP' } as Record<string, string>)[game.provider] || game.provider
      return {
        ...game,
        bet_groups: providerCurrencyBetGroups.filter(group => group.provider_id === providerId && supportedCurrencies.includes(group.currency) && group.is_selected && group.status === 'available'),
        supported_currencies: supportedCurrencies,
        maintenance_rule: game.admin_status === 'maintenance' ? '平台臨時維護' : maintenancePool[index % maintenancePool.length]
      }
    })
    games.value.forEach(g => {
      switchStates.value[g.game_id] = g.merchant_enabled
    })
  } catch {
    message.error('遊戲資料載入失敗')
  } finally {
    loading.value = false
  }
}

const handleToggle = async (row: MerchantGame, newVal: boolean) => {
  if (newVal && !row.master_enabled) {
    message.warning('平台已停用的遊戲無法由商戶啟用')
    return
  }

  switchStates.value[row.game_id] = newVal
  row.merchant_enabled = newVal

  try {
    await portalGameService.toggleGame(row.game_id, newVal)
    message.success(newVal ? '遊戲已啟用' : '遊戲已停用')
  } catch {
    switchStates.value[row.game_id] = !newVal
    row.merchant_enabled = !newVal
    message.error('遊戲狀態更新失敗')
  }
}

const handleBatchAction = async (enable: boolean) => {
  const selectedIds = checkedRowKeys.value as string[]
  if (selectedIds.length === 0) return

  loading.value = true
  try {
    selectedIds.forEach(id => {
      const game = games.value.find(g => g.game_id === id)
      if (!game || (enable && !game.master_enabled)) return
      game.merchant_enabled = enable
      switchStates.value[id] = enable
    })

    await new Promise(resolve => setTimeout(resolve, 500))
    message.success('批次更新完成')
    checkedRowKeys.value = []
  } catch {
    message.error('批次更新失敗')
    await fetchGames()
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  searchValue.value = ''
  typeFilter.value = 'all'
  providerFilter.value = 'all'
}

const openGameAction = (row: MerchantGame, mode: typeof actionMode.value) => {
  selectedGame.value = row
  actionMode.value = mode
  showAction.value = true
}

const actionTitle = computed(() => `${actionMode.value === 'limit' ? '遊戲限額' : '維護設定'} - ${selectedGame.value?.name_zh || selectedGame.value?.name_en || ''}`)

const actionFields = computed<DemoField[]>(() => {
  const row = selectedGame.value
  if (!row) return []
  if (actionMode.value === 'maintenance') {
    return [
      { label: '遊戲代碼', value: row.game_code },
      { label: '供應商', value: row.provider },
      { label: '平台狀態', value: row.admin_status === 'active' ? '可用' : row.admin_status === 'maintenance' ? '維護中' : '平台停用', tag: row.admin_status === 'active' ? 'success' : 'warning' },
      { label: '商戶狀態', value: row.merchant_enabled ? '啟用' : '停用', tag: row.merchant_enabled ? 'success' : 'default' },
      { label: '維護規則', value: row.maintenance_rule || '-' },
      { label: '固定週期', value: '支援每週 / 每月維護演示' }
    ]
  }
  return [
    { label: '遊戲代碼', value: row.game_code },
    { label: '供應商', value: row.provider },
    { label: '遊戲類型', value: row.type },
    { label: '已指派群組', value: `${row.bet_groups.length} 組` },
    { label: '供應商幣別線', value: row.bet_groups[0]?.provider_currency_connection_id || '尚未指派' },
    { label: '目前限額方案', value: row.bet_groups[0]?.provider_bet_group_name || '尚未指派' },
    { label: 'Provider 區間', value: row.bet_groups[0] ? `${row.bet_groups[0].currency} ${row.bet_groups[0].min_bet.toLocaleString()} - ${row.bet_groups[0].max_bet.toLocaleString()}` : '-' }
  ]
})

const filteredGames = computed(() => games.value.filter(g => {
  const matchesSearch = !searchValue.value ||
    g.name_en.toLowerCase().includes(searchValue.value.toLowerCase()) ||
    g.game_code.toLowerCase().includes(searchValue.value.toLowerCase()) ||
    g.bet_groups.some(group => `${group.provider_bet_group_name} ${group.provider_bet_group_code}`.toLowerCase().includes(searchValue.value.toLowerCase()))
  const matchesType = typeFilter.value === 'all' || g.type === typeFilter.value
  const matchesProvider = providerFilter.value === 'all' || g.provider === providerFilter.value
  return matchesSearch && matchesType && matchesProvider
}))

const columns: DataTableColumns<MerchantGame> = [
  { type: 'selection' },
  {
    title: '遊戲',
    key: 'name_en',
    width: 250,
    render: row => h('div', { class: 'flex items-center gap-3' }, [
      h('img', {
        src: row.thumbnail || 'https://placehold.co/60x60?text=Game',
        class: 'h-10 w-10 rounded object-cover bg-gray-800',
        onError: (event: Event) => {
          ;(event.target as HTMLImageElement).src = 'https://placehold.co/60x60?text=Game'
        }
      }),
      h('div', {}, [
        h('div', { class: 'font-medium text-sm' }, row.name_zh || row.name_en),
        h('div', { class: 'text-xs text-gray-400 font-mono' }, row.game_code)
      ])
    ])
  },
  { title: '供應商', key: 'provider', width: 120, render: row => h(NTag, { size: 'small', bordered: false }, { default: () => row.provider }) },
  { title: '類型', key: 'type', width: 100 },
  { title: 'RTP', key: 'rtp', width: 80, align: 'right', render: row => `${row.rtp}%` },
  {
    title: '支援幣別',
    key: 'supported_currencies',
    width: 150,
    render: row => h('div', { class: 'flex flex-wrap gap-1' }, (row.supported_currencies || []).map(currency => h(NTag, { size: 'small', bordered: false }, { default: () => currency })))
  },
  { title: '下注限額方案', key: 'bet_groups', minWidth: 190, render: row => row.bet_groups.length ? h('div', {}, [h('div', row.bet_groups[0]?.provider_bet_group_name), h('div', { class: 'font-mono text-xs text-gray-500' }, `${row.bet_groups[0]?.provider_currency_connection_id}${row.bet_groups.length > 1 ? ` +${row.bet_groups.length - 1}` : ''}`)]) : h(NTag, { type: 'warning', size: 'small', bordered: false }, { default: () => '未指派' }) },
  { title: '維護狀態', key: 'maintenance_rule', minWidth: 170, ellipsis: { tooltip: true } },
  {
    title: '平台狀態',
    key: 'admin_status',
    width: 120,
    render: row => {
      const type = row.admin_status === 'active' ? 'success' : row.admin_status === 'maintenance' ? 'warning' : 'error'
      const label = row.admin_status === 'active' ? '可用' : row.admin_status === 'maintenance' ? '維護中' : '平台停用'
      return h(NTag, { type, size: 'small', bordered: false }, { default: () => label })
    }
  },
  {
    title: '我的狀態',
    key: 'merchant_enabled',
    width: 130,
    render: row => {
      const switchComp = h(StatusSwitch, {
        value: switchStates.value[row.game_id] ?? row.merchant_enabled,
        disabled: !row.master_enabled,
        'onUpdate:value': (val: boolean) => {
          if (row.master_enabled) switchStates.value[row.game_id] = val
        },
        onConfirm: (val: boolean) => handleToggle(row, val)
      }, {
        checked: () => '已啟用',
        unchecked: () => '已停用'
      })

      if (!row.master_enabled) {
        return h(NTooltip, null, {
          trigger: () => h('div', { class: 'inline-block cursor-not-allowed opacity-60' }, [switchComp]),
          default: () => '平台已停用的遊戲無法由商戶啟用'
        })
      }

      return switchComp
    }
  },
  { title: '操作', key: 'actions', width: 150, fixed: 'right', render: row => h('div', { class: 'flex gap-2' }, [
    h(NButton, { size: 'small', secondary: true, onClick: () => openGameAction(row, 'limit') }, { default: () => '限額' }),
    h(NButton, { size: 'small', secondary: true, onClick: () => openGameAction(row, 'maintenance') }, { default: () => '維護' })
  ]) }
]

onMounted(fetchGames)
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">我的遊戲</h1>
      <p class="mt-2 text-sm text-gray-500">商戶查看已授權遊戲、交易幣別、Provider 下注限額方案與維護狀態；平台停用遊戲不可自行啟用。</p>
    </header>

    <n-alert type="info" :bordered="false" class="!bg-[#14283a]">
      下注限額方案由 Provider 依幣別線提供，再由 GGAP 與上級代理逐層開放給商戶；商戶不可自行修改區間。
    </n-alert>

    <n-card>
      <div class="mb-4 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_180px_auto]">
        <n-input v-model:value="searchValue" clearable placeholder="搜尋遊戲名稱 / 代碼 / 限額方案" />
        <n-select v-model:value="typeFilter" :options="typeOptions" placeholder="遊戲類型" />
        <n-select v-model:value="providerFilter" :options="providerOptions" placeholder="供應商" />
        <n-button tertiary @click="handleReset">重置</n-button>
      </div>

      <div v-if="checkedRowKeys.length > 0" class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded border border-gray-700 bg-gray-800 p-3">
        <span class="text-sm text-gray-200">已選擇 {{ checkedRowKeys.length }} 款遊戲</span>
        <div class="flex gap-2">
          <n-button size="small" type="error" ghost @click="handleBatchAction(false)">停用所選</n-button>
          <n-button size="small" type="primary" @click="handleBatchAction(true)">啟用所選</n-button>
        </div>
      </div>

      <n-data-table
        v-model:checked-row-keys="checkedRowKeys"
        :columns="withTableSorters(columns)"
        :data="filteredGames"
        :loading="loading"
        :pagination="DEFAULT_TABLE_PAGINATION"
        :row-key="row => row.game_id"
        :scroll-x="1540"
        striped
      />
    </n-card>

    <demo-action-modal
      v-model:show="showAction"
      :title="actionTitle"
      :subtitle="actionMode === 'limit' ? '商戶可查看目前套用限額；實際可調整範圍由 GGAP 或上級代理開放。' : '維護設定支援固定每週或每月規則，平台停用時商戶不可自行啟用。'"
      :fields="actionFields"
      :timeline="actionMode === 'limit' ? ['讀取 Provider 幣別線已開放方案', '套用商戶方案指派', 'Launch Session 鎖定方案版本', '逐筆注單保存限額方案快照'] : ['建立維護週期', '維護前顯示告警', '維護完成恢復可用']"
    />
  </div>
</template>
