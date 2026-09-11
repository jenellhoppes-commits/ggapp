<template>
  <section class="center">
    <AppPageHeader :title="title" />
    <ElEmpty v-if="!own" description="無法取得有效商戶身分" />
    <template v-else>
      <PortalTabs
        v-if="kind === 'reports'"
        v-model="dimension"
        :tabs="[
          { value: 'daily', label: '每日營運' },
          { value: 'games', label: '依遊戲' },
          { value: 'providers', label: '依供應商' },
          { value: 'currency', label: '依幣別' }
        ]"
      />
      <PortalTabs
        v-if="kind === 'rates'"
        v-model="rateView"
        :tabs="[
          { value: 'latest', label: '最新適用' },
          { value: 'history', label: '歷史快照' }
        ]"
      />
      <AppFilterForm @submit.prevent="search">
        <ElFormItem v-if="kind === 'settlements'" label="期數"
          ><ElSelect v-model="period" clearable placeholder="全部期數"
            ><ElOption v-for="p in periods" :key="p" :value="p" :label="p" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="kind === 'settlements'" label="對帳狀態"
          ><ElSelect v-model="billStatus" clearable placeholder="全部狀態"
            ><ElOption
              v-for="s in ['待確認', '已鎖定', '已取消']"
              :key="s"
              :value="s"
              :label="s" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="kind !== 'settlements'" label="日期範圍"
          ><ElDatePicker
            v-model="dates"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
        /></ElFormItem>
        <ElFormItem label="幣別"
          ><ElSelect v-model="currency" aria-label="幣別" placeholder="全部" clearable
            ><ElOption v-for="c in currencies" :key="c" :label="c" :value="c" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="kind !== 'rates'" label="關鍵字"
          ><ElInput
            v-model="draft"
            placeholder="搜尋日期、期數、名稱或單號"
            clearable
            @keyup.enter="search"
        /></ElFormItem>
        <div class="filter-actions"
          ><ElButton type="primary" @click="search">查詢</ElButton
          ><ElButton @click="reset">重置</ElButton></div
        >
      </AppFilterForm>
      <template v-if="kind === 'reports'">
        <ReportApproxSummary
          :rows="approxRows"
          :metrics="[
            { key: 'bet', label: '投注金額' },
            { key: 'payout', label: '派彩金額' },
            { key: 'ggr', label: 'GGR' }
          ]"
        />
        <div class="metric-grid">
          <ElCard shadow="never"
            ><span>注單筆數</span><strong>{{ format(total('count')) }}</strong></ElCard
          >
          <ElCard shadow="never"
            ><span>已結算筆數</span><strong>{{ format(total('settled')) }}</strong></ElCard
          >
          <ElCard shadow="never"
            ><span>其他狀態</span
            ><strong>{{ format(total('count') - total('settled')) }}</strong></ElCard
          >
        </div>
      </template>
      <ElCard shadow="never">
        <template #header
          ><div class="query-heading"
            ><strong>{{ kind === 'reports' ? '營運明細' : title }}</strong
            ><p>共 {{ filtered.length }} 筆資料</p></div
          ></template
        >
        <ElTable
          :data="paged"
          :scrollbar-always-on="true"
          empty-text="沒有符合條件的資料，請調整查詢或重置"
        >
          <ElTableColumn
            v-for="c in columns"
            :key="c.key"
            :prop="c.key"
            :label="c.label"
            :min-width="c.width || 150"
            :align="c.money || ['count', 'settled'].includes(c.key) ? 'right' : 'left'"
            show-overflow-tooltip
          >
            <template #default="{ row }">{{ c.money ? format(row[c.key]) : row[c.key] }}</template>
          </ElTableColumn>
          <ElTableColumn v-if="kind === 'settlements'" label="操作" width="90" fixed="right"
            ><template #default="{ row }"
              ><ElButton link type="primary" @click="selectedId = row.id">查看</ElButton></template
            ></ElTableColumn
          >
        </ElTable>
        <ElPagination
          v-model:current-page="page"
          :page-size="10"
          :total="filtered.length"
          layout="total, prev, pager, next"
        />
      </ElCard>
      <ElDialog
        :model-value="!!selected"
        title="結算單"
        width="min(900px, calc(100vw - 32px))"
        append-to-body
        @close="selectedId = ''"
      >
        <PortalTabs
          v-model="detailTab"
          :tabs="[
            { value: 'summary', label: '結算摘要' },
            { value: 'snapshot', label: '計算快照' },
            { value: 'delivery', label: '交付結果' }
          ]"
        />
        <ElDescriptions v-if="selected" :column="1" border class="bill-detail">
          <ElDescriptionsItem v-for="item in detailFields" :key="item.label" :label="item.label">{{
            item.value
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <template #footer><ElButton @click="selectedId = ''">關閉</ElButton></template>
      </ElDialog>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { usePortalQueryTab } from '@/composables/usePortalQueryTab'
  import { filterPortalRates } from '@/domain/portal-rates'
  import { merchantSettlementCurrency } from '@/domain/merchant-settlement-view'
  import { merchantDashboardRows, merchantBetDay } from '@/domain/merchant-dashboard'
  import { validDate } from '@/domain/report-four-tabs'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import ReportApproxSummary from '@/components/business/ReportApproxSummary.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import PortalTabs from '@/components/business/PortalTabs.vue'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useTransactionCenterStore } from '@/store/modules/transactionCenter'
  import { useFinanceCenterStore } from '@/store/modules/financeCenter'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  const catalog = useProviderDemoStore()
  const route = useRoute(),
    router = useRouter(),
    user = useUserStore(),
    partners = useBusinessPartnerStore(),
    transactions = useTransactionCenterStore(),
    finance = useFinanceCenterStore(),
    settings = useFinanceSettingsStore()
  const own = computed(() =>
    user.info.roles?.includes('R_MERCHANT')
      ? partners.merchants.find((m) => m.id === user.info.merchantId)
      : undefined
  )
  const kind = computed(() =>
    route.path.endsWith('/reports')
      ? 'reports'
      : route.path.endsWith('/exchange-rates')
        ? 'rates'
        : 'settlements'
  )
  const title = computed(
    () => ({ reports: '報表管理', rates: '匯率報表', settlements: '對帳/結算' })[kind.value]
  )
  const dimension = usePortalQueryTab(['daily', 'games', 'providers', 'currency'], 'daily'),
    draft = ref(''),
    currency = ref(''),
    applied = ref({ q: '', currency: '' }),
    page = ref(1)
  const dates = ref<[string, string] | null>(null),
    appliedDates = ref<[string, string] | null>(null),
    rateView = usePortalQueryTab(['latest', 'history'], 'latest')
  const period = ref(''),
    billStatus = ref(''),
    appliedBill = ref({ period: '', status: '' }),
    selectedId = ref(''),
    detailTab = ref('summary')
  const bills = computed(() =>
    own.value ? finance.merchantReconciliations.filter((r) => r.merchantId === own.value!.id) : []
  )
  const periods = computed(() => [...new Set(bills.value.map((r) => r.period))].sort().reverse())
  const selected = computed(() => bills.value.find((r) => r.id === selectedId.value))
  const deliveryFor = (id: string) =>
    finance.deliveries.find((d) => d.kind === 'merchant' && d.id === id)
  const detailFields = computed(() => {
    const r = selected.value
    if (!r) return []
    const d = deliveryFor(r.id),
      s = r.snapshot
    const fields: [string, unknown][] =
      detailTab.value === 'snapshot'
        ? [
            ['計費基礎', s.settlementBasis],
            ['GGR', format(r.ggr)],
            ['適用商務比例 %', s.ratePercent],
            ['交易幣', s.transactionCurrency],
            ['結算幣', s.settlementCurrency],
            ['匯率', s.exchangeRate],
            ['匯率來源', s.exchangeRateSource],
            ['匯率時間', s.exchangeRateTime],
            ['條件版本', s.reportDimensions?.conditionVersion || '原單未保存'],
            ['供應商', s.reportDimensions?.providerId || '原單未保存'],
            ['遊戲類型', s.reportDimensions?.gameType || '原單未保存'],
            ['計算精度', s.amountPrecision],
            ['計算捨入', s.roundingRule],
            ['計算時間', s.calculatedAt]
          ]
        : detailTab.value === 'delivery'
          ? [
              ['交付紀錄', d ? '已登錄' : '尚未登錄'],
              ['取整後應付', d ? format(d.due) : '未核定'],
              ['上期待交付', d ? format(d.opening) : '未核定'],
              ['本次差異', d ? format(d.difference) : '未核定'],
              ['實際交付', d ? format(d.paid) : '—'],
              ['剩餘待交付', d ? format(d.carry) : '未核定'],
              ['實際收款方', d?.recipient || '未登錄'],
              ['登錄人', d?.operator || '—'],
              ['登錄時間', d?.time || '—'],
              ['備註', d?.reason || '—']
            ]
          : [
              ['單號', r.id],
              ['商戶', r.merchantName],
              ['期間', r.period],
              ['線路', r.lineUid],
              ['交易幣', r.currency],
              ['結算幣', merchantSettlementCurrency(r) || '原單未保存'],
              ['結算金額', format(r.finalSettlementAmount)],
              [
                '收付模式',
                d?.collectionMode === 'AgentCollect'
                  ? '代理統收'
                  : d?.collectionMode === 'PlatformCollect'
                    ? '平台代收'
                    : '原單未保存'
              ],
              [
                '對帳狀態',
                r.status === 'Locked' ? '已鎖定' : r.status === 'Cancelled' ? '已取消' : '待確認'
              ]
            ]
    return fields.map(([label, value]) => ({ label, value: value ?? '—' }))
  })
  const columns = computed<{ key: string; label: string; money?: boolean; width?: number }[]>(() =>
    kind.value === 'reports'
      ? [
          { key: 'name', label: '統計項目' },
          { key: 'currency', label: '原幣' },
          { key: 'count', label: '注單數' },
          { key: 'settled', label: '已結算筆數' },
          { key: 'bet', label: '已結算投注', money: true },
          { key: 'payout', label: '已結算派彩', money: true },
          { key: 'ggr', label: 'GGR', money: true }
        ]
      : kind.value === 'rates'
        ? [
            { key: 'date', label: '適用日期' },
            { key: 'id', label: '匯率版本', width: 220 },
            { key: 'from', label: '原幣' },
            { key: 'currency', label: '目標幣' },
            { key: 'rate', label: '公布匯率（1 原幣）', money: true },
            { key: 'status', label: '狀態' }
          ]
        : [
            { key: 'id', label: '結算單號', width: 210 },
            { key: 'period', label: '期數' },
            { key: 'currency', label: '結算幣' },
            { key: 'amount', label: '結算金額', money: true },
            { key: 'paid', label: '已登錄交付', money: true },
            { key: 'status', label: '對帳狀態' },
            { key: 'payment', label: '收付狀態' }
          ]
  )
  const rows = computed<Record<string, string | number>[]>(() => {
    if (!own.value) return []
    if (kind.value === 'settlements')
      return bills.value
        .map((r) => {
          const d = deliveryFor(r.id)
          return {
            id: r.id,
            period: r.period,
            currency: merchantSettlementCurrency(r) || '原單未保存',
            amount: r.finalSettlementAmount,
            paid: d?.paid || 0,
            status:
              r.status === 'Locked' ? '已鎖定' : r.status === 'Cancelled' ? '已取消' : '待確認',
            payment: !d
              ? '未收付'
              : d.carry > 0
                ? '已結轉下期'
                : d.due === 0
                  ? '無須收付'
                  : d.paid >= d.due
                    ? '已收付'
                    : d.paid > 0
                      ? '部分收付'
                      : '未收付'
          }
        })
        .filter(
          (r) =>
            (!appliedBill.value.period || r.period === appliedBill.value.period) &&
            (!appliedBill.value.status || r.status === appliedBill.value.status)
        )
    if (kind.value === 'rates') {
      const allowed = new Set([
        ...own.value.lines.map((l) => l.currency),
        own.value.settlementCurrency
      ])
      const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date())
      const rates = settings.dailyRates.filter(
        (r) =>
          ['Published', 'Locked'].includes(r.status) && allowed.has(r.toCurrency) && r.date <= today
      )
      return filterPortalRates(rates, {
        today,
        view: rateView.value,
        from: appliedDates.value?.[0],
        to: appliedDates.value?.[1],
        currency: applied.value.currency
      }).map((r) => ({
        id: r.id,
        date: r.date,
        from: r.fromCurrency,
        currency: r.toCurrency,
        rate: r.finalRate,
        status: r.status === 'Locked' ? '已鎖定' : '已公布'
      }))
    }
    const groups = new Map<
      string,
      {
        name: string
        currency: string
        count: number
        settled: number
        bet: number
        payout: number
        ggr: number
      }
    >()
    for (const b of merchantDashboardRows(transactions.bets, own.value.id, appliedDates.value)) {
      const providerId = catalog.state.games.find((g) => g.id === b.gameId)?.providerId
      const name =
        dimension.value === 'games'
          ? b.gameName
          : dimension.value === 'providers'
            ? catalog.state.providers.find((p) => p.id === providerId)?.name || '未識別供應商'
            : dimension.value === 'currency'
              ? b.currency
              : merchantBetDay(b)
      const key = JSON.stringify([name, b.currency])
      const row = groups.get(key) || {
        name,
        currency: b.currency,
        count: 0,
        settled: 0,
        bet: 0,
        payout: 0,
        ggr: 0
      }
      row.count++
      if (
        b.status === 'Settled' &&
        Number.isFinite(b.betAmount) &&
        Number.isFinite(b.payoutAmount)
      ) {
        row.settled++
        row.bet += b.betAmount
        row.payout += b.payoutAmount ?? 0
        row.ggr = row.bet - row.payout
      }
      groups.set(key, row)
    }
    return [...groups.values()]
  })
  const currencies = computed(() =>
    [
      ...new Set(
        own.value
          ? kind.value === 'settlements'
            ? bills.value.map(merchantSettlementCurrency).filter(Boolean)
            : kind.value === 'rates'
              ? settings.dailyRates
                  .filter(
                    (r) =>
                      ['Published', 'Locked'].includes(r.status) &&
                      [
                        ...own.value!.lines.map((l) => l.currency),
                        own.value!.settlementCurrency
                      ].includes(r.toCurrency)
                  )
                  .flatMap((r) => [r.fromCurrency, r.toCurrency])
              : transactions.bets
                  .filter((b) => b.merchantId === own.value!.id)
                  .map((b) => b.currency)
          : []
      )
    ].sort()
  )
  const filtered = computed(() =>
    rows.value.filter(
      (r) =>
        (kind.value === 'rates' ||
          !applied.value.currency ||
          r.currency === applied.value.currency) &&
        Object.values(r).join(' ').toLowerCase().includes(applied.value.q.toLowerCase())
    )
  )
  const paged = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
  const total = (key: string) => filtered.value.reduce((sum, row) => sum + Number(row[key] || 0), 0)
  const approxRows = computed(() =>
    filtered.value.map((r) => ({
      currency: String(r.currency),
      values: { bet: Number(r.bet), payout: Number(r.payout), ggr: Number(r.ggr) }
    }))
  )
  const search = () => {
    applied.value = { q: draft.value.trim(), currency: currency.value }
    appliedBill.value = { period: period.value, status: billStatus.value }
    appliedDates.value = dates.value ? [...dates.value] : null
    page.value = 1
    void router.replace({
      path: route.path,
      query: {
        tab: route.query.tab,
        q: applied.value.q || undefined,
        currency: currency.value || undefined,
        from: dates.value?.[0],
        to: dates.value?.[1],
        period: period.value || undefined,
        status: billStatus.value || undefined
      }
    })
  }
  const reset = () => {
    draft.value = ''
    currency.value = ''
    dates.value = null
    period.value = ''
    billStatus.value = ''
    selectedId.value = ''
    search()
  }
  watch([dimension, rateView], () => {
    page.value = 1
  })
  watch(selectedId, () => {
    detailTab.value = 'summary'
  })
  watch(
    () => route.fullPath,
    () => {
      draft.value = String(route.query.q || '')
      currency.value = typeof route.query.currency === 'string' ? route.query.currency : ''
      dates.value = null
      period.value = String(route.query.period || '')
      billStatus.value =
        route.query.status === 'pending' ? '待確認' : String(route.query.status || '')
      selectedId.value = ''
      const from = String(route.query.from || ''),
        to = String(route.query.to || '')
      if (validDate(from) && validDate(to) && from <= to) dates.value = [from, to]
      applied.value = { q: draft.value, currency: currency.value }
      appliedBill.value = { period: period.value, status: billStatus.value }
      appliedDates.value = dates.value ? [...dates.value] : null
      page.value = 1
    },
    { immediate: true }
  )
  const format = (n: unknown) =>
    typeof n === 'number' && Number.isFinite(n)
      ? n.toLocaleString('en-US', { maximumFractionDigits: 6 })
      : '—'
</script>
<style scoped>
  .center {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: 16px;
    min-width: 0;
  }
  .bill-detail {
    margin-top: 16px;
    max-height: 60vh;
    overflow: auto;
  }
  .bill-detail :deep(.el-descriptions__content) {
    overflow-wrap: anywhere;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  .filters .el-input {
    width: min(100%, 360px);
  }
  .filters .el-select {
    width: 180px;
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
  .actions .el-button {
    margin-left: 0;
  }
  .el-pagination {
    justify-content: flex-end;
    margin-top: 16px;
  }
  .query-heading p {
    margin: 6px 0 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .metric-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .metric-grid span {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .metric-grid strong {
    display: block;
    margin-top: 16px;
    font-size: 26px;
    font-weight: 600;
  }
  .dimension-tabs :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  .filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    grid-column: 1 / -1;
  }
  .filter-actions .el-button {
    margin-left: 0;
  }
  @media (width < 600px) {
    .metric-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
