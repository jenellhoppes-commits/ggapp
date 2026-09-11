<template>
  <section class="agent-reports">
    <AppPageHeader :title="isRates ? '匯率報表' : '代理報表'" />
    <ElAlert
      v-if="!scope.own"
      type="error"
      :closable="false"
      title="缺少有效代理身分，無法查詢。"
    />
    <template v-else>
      <PortalTabs
        v-if="!isRates"
        :model-value="reportTab"
        :tabs="reportTabs.map((t) => ({ value: t.id, label: t.label }))"
        @update:model-value="switchTab"
      />
      <PortalTabs
        v-else
        v-model="rateView"
        :tabs="[
          { value: 'latest', label: '最新適用' },
          { value: 'history', label: '歷史快照' }
        ]"
      />
      <AppFilterForm @submit.prevent="search">
        <ElFormItem label="日期範圍"
          ><ElDatePicker
            v-model="dates"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            :shortcuts="shortcuts"
            :disabled="!timezone"
        /></ElFormItem>
        <ElFormItem label="幣別"
          ><ElSelect v-model="currency" clearable placeholder="全部"
            ><ElOption v-for="c in currencies" :key="c" :label="c" :value="c" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="!isRates" label="商戶"
          ><ElSelect v-model="merchant" clearable filterable placeholder="全部轄下商戶"
            ><ElOption
              v-for="m in scope.merchants"
              :key="m.id"
              :label="`${m.name} (${m.id})`"
              :value="m.id" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="!isRates" label="所屬代理"
          ><ElSelect v-model="agent" clearable placeholder="全授權樹"
            ><ElOption
              v-for="a in [scope.own, ...scope.agents]"
              :key="a.id"
              :label="`${a.name}（${a.id}）`"
              :value="a.id" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="!isRates" label="商戶關係"
          ><ElSelect v-model="relation" clearable placeholder="全部"
            ><ElOption label="直屬商戶" value="direct" /><ElOption
              label="下級代理商戶"
              value="indirect" /></ElSelect
        ></ElFormItem>
        <div class="filter-actions"
          ><ElButton type="primary" @click="search">查詢</ElButton
          ><ElButton @click="reset">重置</ElButton></div
        >
      </AppFilterForm>
      <ElAlert
        v-if="invalidTimeCount && !isRates"
        type="warning"
        :closable="false"
        :title="`${invalidTimeCount} 筆缺少有效下注時間或平台時區，未列入報表。`"
      />
      <template v-if="isRates">
        <p>符合條件 {{ rateRows.length }} 筆</p>
        <ArtTable :data="rateRows.slice((page - 1) * 10, page * 10)" row-key="id">
          <ElTableColumn prop="date" label="適用日期" min-width="140" />
          <ElTableColumn prop="id" label="匯率版本" min-width="180" />
          <ElTableColumn prop="fromCurrency" label="原幣" min-width="100" />
          <ElTableColumn prop="toCurrency" label="目標幣" min-width="100" />
          <ElTableColumn prop="finalRate" label="公布匯率（1 原幣）" min-width="180" />
          <ElTableColumn label="狀態"
            ><template #default="{ row }"
              ><ElTag type="success">{{
                row.status === 'Locked' ? '已鎖定' : '已公布'
              }}</ElTag></template
            ></ElTableColumn
          >
        </ArtTable>
      </template>
      <template v-else>
        <ReportApproxSummary
          :rows="approxRows"
          :metrics="[
            { key: 'bet', label: '投注流水' },
            { key: 'payout', label: '派彩' },
            { key: 'ggr', label: 'GGR' }
          ]"
        />
        <div class="summary"
          ><ElCard shadow="never"
            >注單筆數 <strong>{{ reportRows.length }}</strong></ElCard
          ><ElCard shadow="never"
            >已結算
            <strong>{{ reportRows.filter((r) => r.status === 'Settled').length }}</strong></ElCard
          ><ElCard shadow="never"
            >其他狀態
            <strong>{{ reportRows.filter((r) => r.status !== 'Settled').length }}</strong></ElCard
          ></div
        >
        <ArtTable :data="grouped.slice((page - 1) * 10, page * 10)" row-key="key">
          <ElTableColumn
            prop="name"
            :label="reportTabs.find((t) => t.id === reportTab)?.label"
            min-width="180"
          />
          <ElTableColumn v-if="reportTab !== 'currencies'" prop="id" label="編號" min-width="120" />
          <ElTableColumn prop="currency" label="原幣別" width="100" />
          <ElTableColumn prop="merchants" label="商戶數" width="90" />
          <ElTableColumn prop="lines" label="線路數" width="90" />
          <ElTableColumn prop="rounds" label="局數" width="90" />
          <ElTableColumn prop="count" label="注單數" width="90" />
          <ElTableColumn prop="settled" label="已結算筆數" width="115" />
          <ElTableColumn label="已結算投注" min-width="160"
            ><template #default="{ row }">{{
              money(row.bet, row.currency)
            }}</template></ElTableColumn
          >
          <ElTableColumn label="已結算派彩" min-width="160"
            ><template #default="{ row }">{{
              money(row.payout, row.currency)
            }}</template></ElTableColumn
          >
          <ElTableColumn label="操作" width="110"
            ><template #default="{ row }"
              ><ElButton link type="primary" @click="openDetails(row.key)"
                >注單明細</ElButton
              ></template
            ></ElTableColumn
          >
        </ArtTable>
        <ElDialog
          :model-value="!!detailKey"
          title="查詢範圍內注單明細"
          width="min(1100px, 94vw)"
          class="agent-bet-dialog"
          append-to-body
          @close="detailKey = ''"
        >
          <ElTable
            :data="detailRows.slice((detailPage - 1) * 10, detailPage * 10)"
            row-key="id"
            max-height="52vh"
            scrollbar-always-on
            style="width: 100%"
          >
            <ElTableColumn prop="id" label="注單編號" width="220" show-overflow-tooltip />
            <ElTableColumn prop="merchantName" label="商戶" min-width="160" />
            <ElTableColumn prop="agentId" label="所屬代理" min-width="120" />
            <ElTableColumn prop="gameName" label="遊戲" min-width="160" />
            <ElTableColumn label="下注時間" min-width="190"
              ><template #default="{ row }">{{ timeText(row.betAt) }}</template></ElTableColumn
            >
            <ElTableColumn label="狀態" min-width="100"
              ><template #default="{ row }">{{ statusText(row.status) }}</template></ElTableColumn
            >
            <ElTableColumn label="投注金額" min-width="150"
              ><template #default="{ row }">{{
                money(row.betAmount, row.currency)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="派彩金額" min-width="150"
              ><template #default="{ row }">{{
                row.payoutAmount === null ? '—（未列入）' : money(row.payoutAmount, row.currency)
              }}</template></ElTableColumn
            >
          </ElTable>
          <ElPagination
            v-model:current-page="detailPage"
            :page-size="10"
            :total="detailRows.length"
            layout="prev, pager, next"
          />
          <template #footer><ElButton @click="detailKey = ''">關閉</ElButton></template>
        </ElDialog>
      </template>
      <ElPagination
        v-model:current-page="page"
        :page-size="10"
        :total="isRates ? rateRows.length : grouped.length"
        layout="prev, pager, next"
      />
    </template>
  </section>
</template>
<script setup lang="ts">
  import PortalTabs from '@/components/business/PortalTabs.vue'
  import { filterPortalRates } from '@/domain/portal-rates'
  import { computed, ref, watch } from 'vue'
  import ReportApproxSummary from '@/components/business/ReportApproxSummary.vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useTransactionCenterStore } from '@/store/modules/transactionCenter'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { agentScope } from '@/domain/agent-portal'
  import {
    agentReportRows,
    agentPublishedRates,
    groupAgentReports,
    type AgentReportTab
  } from '@/domain/agent-demo'
  import { platformDate } from '@/domain/report-four-tabs'
  import { createDateRangeShortcuts } from '@/utils/form/date-range-shortcuts'
  import { formatFinancialAmount } from '@/utils/finance/format-money'
  const user = useUserStore(),
    partners = useBusinessPartnerStore(),
    transactions = useTransactionCenterStore(),
    finance = useFinanceSettingsStore(),
    locale = usePlatformLocaleStore(),
    route = useRoute(),
    router = useRouter()
  const actor = computed(() => ({
    roles: user.info.roles || [],
    agentId: user.info.agentId,
    name: user.info.userName || ''
  }))
  const scope = computed(() => agentScope(partners, actor.value))
  const isRates = computed(() => route.name === 'AgentPortalExchangeRates')
  const rateView = ref('latest')
  const reportTabs = [
    { id: 'agents', label: '代理' },
    { id: 'merchants', label: '商戶' },
    { id: 'games', label: '遊戲' },
    { id: 'currencies', label: '幣別' }
  ]
  const reportTab = computed<AgentReportTab>(() =>
    reportTabs.some((t) => t.id === route.query.tab)
      ? (route.query.tab as AgentReportTab)
      : 'agents'
  )
  const switchTab = (tab: string | number) =>
    router.replace({ query: { ...route.query, tab: String(tab) } })
  const agent = ref(''),
    relation = ref(''),
    detailKey = ref(''),
    detailPage = ref(1)
  const timezone = computed(() => locale.defaultTimezone?.id || '')
  const shortcuts = createDateRangeShortcuts(() => timezone.value)
  const dates = ref<[string, string] | null>(null),
    currency = ref(''),
    merchant = ref(''),
    page = ref(1)
  watch(
    () => route.fullPath,
    () => {
      dates.value =
        route.query.from && route.query.to
          ? [String(route.query.from), String(route.query.to)]
          : null
      currency.value = String(route.query.currency || '')
      merchant.value = String(route.query.merchant || '')
      agent.value = String(route.query.agent || '')
      relation.value = String(route.query.relation || '')
      detailKey.value = ''
      page.value = 1
    },
    { immediate: true }
  )
  const search = () =>
    router.replace({
      query: {
        tab: !isRates.value ? reportTab.value : undefined,
        agent: !isRates.value ? agent.value || undefined : undefined,
        relation: !isRates.value ? relation.value || undefined : undefined,
        from: dates.value?.[0],
        to: dates.value?.[1],
        currency: currency.value || undefined,
        merchant: !isRates.value ? merchant.value || undefined : undefined
      }
    })
  const reset = () => {
    dates.value = null
    currency.value = ''
    merchant.value = ''
    agent.value = ''
    relation.value = ''
    search()
  }
  const day = (instant?: string) => {
    if (!instant || !timezone.value || !/(Z|[+-]\d{2}:\d{2})$/.test(instant)) return ''
    try {
      return platformDate(instant, timezone.value)
    } catch {
      return ''
    }
  }
  const inRange = (value: string) =>
    !!value &&
    (!route.query.from || value >= String(route.query.from)) &&
    (!route.query.to || value <= String(route.query.to))
  const bets = computed(() => agentReportRows(partners, actor.value, transactions.bets))
  const rates = computed(() => agentPublishedRates(partners, actor.value, finance.dailyRates))
  const invalidTimeCount = computed(() => bets.value.filter((r) => !day(r.betAt)).length)
  const currencies = computed(() =>
    [
      ...new Set(
        isRates.value
          ? rates.value.flatMap((r) => [r.fromCurrency, r.toCurrency])
          : bets.value.map((r) => r.currency)
      )
    ].sort()
  )
  const reportRows = computed(() =>
    bets.value.filter(
      (r) =>
        inRange(day(r.betAt)) &&
        (!route.query.currency || r.currency === route.query.currency) &&
        (!route.query.agent || r.agentId === route.query.agent) &&
        (!route.query.relation ||
          (route.query.relation === 'direct'
            ? r.agentId === scope.value.own?.id
            : route.query.relation === 'indirect'
              ? r.agentId !== scope.value.own?.id
              : false)) &&
        (!route.query.merchant || r.merchantId === route.query.merchant)
    )
  )
  const rateRows = computed(() =>
    filterPortalRates(rates.value, {
      today: platformDate(new Date(), timezone.value || 'Asia/Taipei'),
      view: rateView.value,
      from: String(route.query.from || ''),
      to: String(route.query.to || ''),
      currency: String(route.query.currency || '')
    })
  )
  const grouped = computed(() => groupAgentReports(reportRows.value, reportTab.value))
  const approxRows = computed(() =>
    groupAgentReports(reportRows.value, 'currencies').map((r) => ({
      currency: r.currency,
      values: { bet: r.bet, payout: r.payout, ggr: r.bet - r.payout }
    }))
  )
  const detailRows = computed(
    () => grouped.value.find((g) => g.key === detailKey.value)?.rows || []
  )
  const openDetails = (key: string) => {
    detailKey.value = key
    detailPage.value = 1
  }
  watch([reportRows, rateRows], () => {
    page.value = 1
  })
  const money = (value: number, code: string) => {
    const precision = finance.currencies.find((c) => c.code === code)?.decimalPlaces
    return precision === undefined
      ? `${code}：未設定顯示精度`
      : formatFinancialAmount(value, code, precision)
  }
  const timeText = (instant: string) =>
    new Intl.DateTimeFormat('zh-TW', {
      timeZone: timezone.value,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    }).format(new Date(instant))
  const statusText = (status: string) =>
    ({
      Settled: '已結算',
      'In Progress': '進行中',
      Cancelled: '已取消',
      Refunded: '已退款',
      Exception: '異常'
    })[status] || status
</script>
<style scoped>
  .agent-reports {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
    align-content: start;
    align-items: start;
    grid-auto-rows: max-content;
  }
  .agent-reports > p {
    margin: 0;
  }
  .agent-reports :deep(.filter-actions) {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
  .agent-reports :deep(.el-pagination) {
    justify-content: flex-end;
  }
  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
    gap: 16px;
  }
  .summary strong {
    margin-left: 12px;
    font-size: 24px;
  }
</style>
<style>
  .agent-bet-dialog {
    margin: 4vh auto !important;
    max-height: 92dvh;
    display: flex;
    flex-direction: column;
  }
  .agent-bet-dialog .el-dialog__body {
    min-height: 0;
    overflow: auto;
    padding-top: 12px;
  }
  .agent-bet-dialog .el-dialog__header,
  .agent-bet-dialog .el-dialog__footer {
    flex-shrink: 0;
  }
  .agent-bet-dialog .el-table .cell {
    white-space: nowrap;
  }
  .agent-bet-dialog .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .agent-bet-dialog .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
