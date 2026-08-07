<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { NButton, NCard, NDataTable, NGrid, NGridItem, NInput, NSelect, NStatistic, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'
import DemoActionModal from '../../../components/Portal/DemoActionModal.vue'
import type { DemoField } from '../../../components/Portal/DemoActionModal.vue'

interface PlayerRow {
  player_id: string
  display_currency: string
  wallet_mode: 'Seamless' | 'Transfer'
  available_balance: number
  locked_balance: number
  today_bet: number
  today_ggr: number
  provider_name: string
  provider_currency_connection_id: string
  provider_bet_group_code: string
  provider_bet_group_name: string
  min_bet: number
  max_bet: number
  limit_source: 'merchant_currency_default' | 'player_override'
  risk_status: 'normal' | 'locked' | 'risk'
  last_bet_at: string
}

const keyword = ref('')
const currency = ref<string | null>(null)
const walletMode = ref<string | null>(null)
const showAction = ref(false)
const selectedPlayer = ref<PlayerRow | null>(null)
const actionMode = ref<'bets' | 'ledger' | 'limit'>('bets')

const players: PlayerRow[] = [
  { player_id: 'P-TWD-10001', display_currency: 'TWD', wallet_mode: 'Seamless', available_balance: 128800, locked_balance: 1200, today_bet: 44200, today_ggr: 3180, provider_name: 'PG Soft', provider_currency_connection_id: 'PC-PG-TWD', provider_bet_group_code: 'PG-TWD-500-5000', provider_bet_group_name: 'TWD 500-5000', min_bet: 500, max_bet: 5000, limit_source: 'player_override', risk_status: 'normal', last_bet_at: '2026/7/8 13:42:10' },
  { player_id: 'P-PHP-10018', display_currency: 'PHP', wallet_mode: 'Transfer', available_balance: 84200, locked_balance: 0, today_bet: 27300, today_ggr: -920, provider_name: 'JILI', provider_currency_connection_id: 'PC-JILI-PHP', provider_bet_group_code: 'JILI-PHP-5-20000', provider_bet_group_name: 'PHP 5-20000', min_bet: 5, max_bet: 20000, limit_source: 'merchant_currency_default', risk_status: 'normal', last_bet_at: '2026/7/8 13:16:44' },
  { player_id: 'P-VND-10037', display_currency: 'VND', wallet_mode: 'Transfer', available_balance: 4280000, locked_balance: 0, today_bet: 0, today_ggr: 0, provider_name: 'Pragmatic Play', provider_currency_connection_id: 'PC-PP-VND', provider_bet_group_code: 'PP-VND-1000-25000000', provider_bet_group_name: 'VND 1000-25000000', min_bet: 1000, max_bet: 25000000, limit_source: 'merchant_currency_default', risk_status: 'locked', last_bet_at: '2026/7/7 23:12:11' },
  { player_id: 'P-THB-10045', display_currency: 'THB', wallet_mode: 'Seamless', available_balance: 21900, locked_balance: 500, today_bet: 12800, today_ggr: 1460, provider_name: 'PG Soft', provider_currency_connection_id: 'PC-PG-THB', provider_bet_group_code: 'PG-THB-20-500', provider_bet_group_name: 'THB 20-500', min_bet: 20, max_bet: 500, limit_source: 'merchant_currency_default', risk_status: 'normal', last_bet_at: '2026/7/8 11:08:55' }
]

const filteredPlayers = computed(() => players.filter((player) => {
  const hitKeyword = !keyword.value || `${player.player_id} ${player.provider_name} ${player.provider_bet_group_name} ${player.provider_bet_group_code}`.toLowerCase().includes(keyword.value.toLowerCase())
  const hitCurrency = !currency.value || player.display_currency === currency.value
  const hitWallet = !walletMode.value || player.wallet_mode === walletMode.value
  return hitKeyword && hitCurrency && hitWallet
}))

const openPlayerAction = (row: PlayerRow, mode: typeof actionMode.value) => {
  selectedPlayer.value = row
  actionMode.value = mode
  showAction.value = true
}

const actionTitle = computed(() => {
  const titleMap = { bets: '會員投注概況', ledger: '會員錢包流水', limit: '會員下注限額' }
  return `${titleMap[actionMode.value]} - ${selectedPlayer.value?.player_id || ''}`
})

const actionFields = computed<DemoField[]>(() => {
  const row = selectedPlayer.value
  if (!row) return []
  if (actionMode.value === 'ledger') {
    return [
      { label: '會員 ID', value: row.player_id },
      { label: '錢包模式', value: row.wallet_mode },
      { label: '交易幣別', value: row.display_currency },
      { label: '可用餘額', value: `${row.display_currency} ${row.available_balance.toLocaleString()}`, tag: 'success' },
      { label: '鎖定餘額', value: `${row.display_currency} ${row.locked_balance.toLocaleString()}` },
      { label: '最近同步', value: row.last_bet_at }
    ]
  }
  if (actionMode.value === 'limit') {
    return [
      { label: '會員 ID', value: row.player_id },
      { label: '供應商 / 幣別線', value: `${row.provider_name} / ${row.provider_currency_connection_id}` },
      { label: '目前方案', value: row.provider_bet_group_name },
      { label: '方案代碼', value: row.provider_bet_group_code },
      { label: '供應商區間', value: `${row.display_currency} ${row.min_bet.toLocaleString()} - ${row.max_bet.toLocaleString()}` },
      { label: '指派來源', value: row.limit_source === 'player_override' ? '特殊會員覆寫' : '商戶幣別預設', tag: row.limit_source === 'player_override' ? 'warning' : 'info' },
      { label: '風控狀態', value: row.risk_status === 'normal' ? '正常' : row.risk_status === 'locked' ? '鎖定' : '風控標記', tag: row.risk_status === 'normal' ? 'success' : 'warning' }
    ]
  }
  return [
    { label: '會員 ID', value: row.player_id },
    { label: '今日投注', value: `${row.display_currency} ${row.today_bet.toLocaleString()}` },
    { label: '今日 GGR', value: `${row.display_currency} ${row.today_ggr.toLocaleString()}`, tag: row.today_ggr >= 0 ? 'success' : 'error' },
    { label: '最近投注', value: row.last_bet_at },
    { label: '下注限額方案', value: `${row.provider_name} / ${row.provider_bet_group_name}` }
  ]
})

const columns: DataTableColumns<PlayerRow> = [
  { title: '商戶會員 ID', key: 'player_id', width: 145, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.player_id) },
  { title: '交易幣別', key: 'display_currency', width: 100 },
  {
    title: '錢包模式',
    key: 'wallet_mode',
    width: 115,
    render: row => h(NTag, { size: 'small', bordered: false, type: row.wallet_mode === 'Transfer' ? 'warning' : 'info' }, { default: () => row.wallet_mode })
  },
  { title: '可用餘額', key: 'available_balance', align: 'right', render: row => `${row.display_currency} ${row.available_balance.toLocaleString()}` },
  { title: '鎖定餘額', key: 'locked_balance', align: 'right', render: row => `${row.display_currency} ${row.locked_balance.toLocaleString()}` },
  { title: '今日投注', key: 'today_bet', align: 'right', render: row => `${row.display_currency} ${row.today_bet.toLocaleString()}` },
  { title: '今日輸贏', key: 'today_ggr', align: 'right', render: row => h('span', { class: row.today_ggr >= 0 ? 'text-emerald-400' : 'text-red-400' }, `${row.display_currency} ${row.today_ggr.toLocaleString()}`) },
  { title: '供應商', key: 'provider_name', width: 135 },
  { title: '幣別線', key: 'provider_currency_connection_id', width: 145, render: row => h('span', { class: 'font-mono text-xs' }, row.provider_currency_connection_id) },
  { title: '下注限額方案', key: 'provider_bet_group_name', minWidth: 170, ellipsis: { tooltip: true } },
  {
    title: '風控',
    key: 'risk_status',
    width: 100,
    render: row => {
      const typeMap = { normal: 'success', locked: 'error', risk: 'warning' } as const
      const labelMap = { normal: '正常', locked: '鎖定', risk: '觀察' }
      return h(NTag, { type: typeMap[row.risk_status], size: 'small', bordered: false }, { default: () => labelMap[row.risk_status] })
    }
  },
  { title: '最後投注時間', key: 'last_bet_at', width: 170 },
  {
    title: '操作',
    key: 'actions',
    width: 210,
    fixed: 'right',
    render: row => h('div', { class: 'flex flex-wrap gap-2' }, [
      h(NButton, { size: 'small', secondary: true, onClick: () => openPlayerAction(row, 'bets') }, { default: () => '投注' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openPlayerAction(row, 'ledger') }, { default: () => '流水' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openPlayerAction(row, 'limit') }, { default: () => '限額' })
    ])
  }
]
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">會員列表</h1>
      <p class="mt-2 text-sm text-gray-500">商戶查看自身會員、多幣別錢包、投注概況、風控與已指派的下注限額方案。</p>
    </header>

    <n-grid cols="1 m:2 l:4" :x-gap="16" :y-gap="16" responsive="screen">
      <n-grid-item><n-card><n-statistic label="會員總數" :value="12846" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="今日活躍" :value="842" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="風控標記" :value="12" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="支援幣別" value="5" /></n-card></n-grid-item>
    </n-grid>

    <n-card>
      <div class="mb-4 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_160px_160px_auto]">
        <n-input v-model:value="keyword" clearable placeholder="搜尋會員 ID / 供應商 / 幣別線 / 限額方案" />
        <n-select v-model:value="currency" clearable placeholder="交易幣別" :options="['TWD', 'PHP', 'IDR', 'VND', 'THB'].map(value => ({ label: value, value }))" />
        <n-select v-model:value="walletMode" clearable placeholder="Wallet 模式" :options="['Seamless', 'Transfer'].map(value => ({ label: value, value }))" />
        <n-button tertiary @click="keyword = ''; currency = null; walletMode = null">重置</n-button>
      </div>
      <n-data-table :columns="withTableSorters(columns)" :data="filteredPlayers" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1700" striped />
    </n-card>

    <demo-action-modal
      v-model:show="showAction"
      :title="actionTitle"
      subtitle="商戶端僅可查看自身會員資料；跨商戶、跨代理資料不會顯示。"
      :fields="actionFields"
      :timeline="['會員錢包識別 merchant_id + player_id + transaction_currency', '交易同步保存 Provider 原幣與 USDT 日結快照', '下注時套用 Provider 幣別線下注限額方案並保存快照']"
    />
  </div>
</template>
