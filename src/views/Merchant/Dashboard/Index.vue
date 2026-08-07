<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NList, NListItem, NSkeleton } from 'naive-ui'
import VChart from 'vue-echarts'
import MoneyText from '../../../components/Common/MoneyText.vue'
import TrendValue from '../../../components/Common/TrendValue.vue'
import { portalDashboardService } from '../../../services/portal/dashboard'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const loadingAlerts = ref(true)
const stats = ref<any>({
  wallet: { balance: 0, credit_limit: 0, currency: 'USDT' },
  today_kpi: {
    total_bet: 0,
    net_win: 0,
    active_players: 0,
    tx_count: 0,
    comparison: { bet_pct: 0, win_pct: 0, player_pct: 0 }
  },
  trend_7d: [],
  alerts: [],
  top_games: []
})

const isAgentPortal = computed(() => route.path.startsWith('/agent'))
const pageTitle = computed(() => isAgentPortal.value ? '代理總覽' : '商戶總覽')
const pageDescription = computed(() => isAgentPortal.value
  ? '查看代理樹範圍內的投注、GGR、商戶與待處理帳務。'
  : '查看自身商戶的會員、投注、遊戲與串接告警。')

const kpiLabels = computed(() => isAgentPortal.value
  ? ['今日投注額', '今日 GGR', '活躍會員', '交易筆數']
  : ['今日投注額', '今日輸贏', '活躍會員', '交易筆數'])

const alerts = computed(() => isAgentPortal.value
  ? [
      { type: 'invoice', message: '有 1 張平台帳單待確認', action: '處理' },
      { type: 'merchant', message: '2 個商戶 Callback 異常需要追蹤', action: '查看' }
    ]
  : [
      { type: 'callback', message: 'Callback 重送佇列有 2 筆待處理', action: '查看' },
      { type: 'game', message: '1 款遊戲進入平台維護', action: '查看' }
    ])

const chartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: stats.value.trend_7d.map((item: any) => item.date) },
  yAxis: { type: 'value' },
  series: [
    { name: '投注額', type: 'line', smooth: true, data: stats.value.trend_7d.map((item: any) => item.bet) },
    { name: 'GGR', type: 'line', smooth: true, data: stats.value.trend_7d.map((item: any) => item.net_win) }
  ]
}))

function onProcessAlert(alert: any) {
  if (alert.type === 'invoice') {
    router.push('/agent/finance/invoices')
    return
  }

  if (alert.type === 'callback') {
    router.push('/merchant/developer/callback-logs')
    return
  }

  router.push(isAgentPortal.value ? '/agent/reports/bet-trace' : '/merchant/games')
}

onMounted(async () => {
  try {
    stats.value = await portalDashboardService.getStats(isAgentPortal.value ? 'agent' : 'merchant')
  } finally {
    loading.value = false
    loadingAlerts.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">{{ pageTitle }}</h1>
      <p class="mt-2 text-sm text-gray-500">{{ pageDescription }}</p>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <n-card class="border-l-4 border-green-500">
        <div class="mb-1 text-sm text-gray-400">{{ kpiLabels[0] }}</div>
        <div class="text-2xl font-bold">
          <MoneyText :value="stats.today_kpi.total_bet" :currency="stats.wallet.currency" />
        </div>
        <TrendValue :value="stats.today_kpi.comparison.bet_pct" class="mt-1" />
      </n-card>
      <n-card class="border-l-4 border-red-500">
        <div class="mb-1 text-sm text-gray-400">{{ kpiLabels[1] }}</div>
        <div class="text-2xl font-bold">
          <MoneyText :value="stats.today_kpi.net_win" :currency="stats.wallet.currency" />
        </div>
        <TrendValue :value="stats.today_kpi.comparison.win_pct" class="mt-1" />
      </n-card>
      <n-card class="border-l-4 border-purple-500">
        <div class="mb-1 text-sm text-gray-400">{{ kpiLabels[2] }}</div>
        <div class="text-2xl font-bold">{{ stats.today_kpi.active_players.toLocaleString() }}</div>
        <TrendValue :value="stats.today_kpi.comparison.player_pct" class="mt-1" />
      </n-card>
      <n-card class="border-l-4 border-amber-500">
        <div class="mb-1 text-sm text-gray-400">{{ kpiLabels[3] }}</div>
        <div class="text-2xl font-bold">{{ stats.today_kpi.tx_count.toLocaleString() }}</div>
      </n-card>
    </div>

    <n-card title="營收趨勢">
      <div class="h-[280px] md:h-[350px]">
        <v-chart :option="chartOption" theme="dark" autoresize />
      </div>
    </n-card>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <n-card title="待處理事項">
        <div v-if="loadingAlerts" class="space-y-2">
          <n-skeleton text :repeat="3" />
        </div>
        <div v-else>
          <n-alert
            v-for="alert in alerts"
            :key="alert.type"
            :type="alert.type === 'invoice' ? 'warning' : 'error'"
            class="mb-2"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <span>{{ alert.message }}</span>
              <n-button text size="small" @click="onProcessAlert(alert)">{{ alert.action }}</n-button>
            </div>
          </n-alert>
        </div>
      </n-card>

      <n-card title="熱門遊戲">
        <div class="flex items-center justify-between rounded-t border-b border-gray-700 bg-gray-800 px-4 py-2 text-xs font-medium text-gray-400">
          <div>遊戲名稱</div>
          <div>投注額 / 派彩金額</div>
        </div>
        <n-list>
          <n-list-item v-for="game in stats.top_games" :key="game.name">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="font-medium">{{ game.name }}</div>
              <div class="text-sm">
                <MoneyText :value="game.bet" :currency="stats.wallet.currency" />
                <span class="mx-1 text-gray-600">/</span>
                <MoneyText :value="game.win" :currency="stats.wallet.currency" />
              </div>
            </div>
          </n-list-item>
        </n-list>
      </n-card>
    </div>
  </div>
</template>
