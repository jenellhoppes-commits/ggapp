<template>
  <section class="settlement-reports">
    <ElEmpty v-if="!allowed" description="無財務報表查看權限" />
    <template v-else>
      <ElCard shadow="never" class="filter-card">
        <template #header
          ><div class="section-heading"
            ><div><h2>查詢條件</h2><p>依結算期間、對帳對象及幣別查詢</p></div
            ><ElButton @click="resetFilters">重置條件</ElButton></div
          ></template
        >
        <ElForm label-position="top" class="filters">
          <ElFormItem label="結算期間"
            ><ElDatePicker v-model="period" type="month" value-format="YYYY-MM" clearable
          /></ElFormItem>
          <ElFormItem v-if="view !== 'margin'" label="對帳關係"
            ><ElSelect v-model="kind" style="width: 150px"
              ><ElOption label="商戶對帳" value="merchant" /><ElOption
                label="代理對帳"
                value="agent" /><ElOption label="供應商對帳" value="provider" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="結算幣別"
            ><ElSelect v-model="currency" clearable placeholder="全部幣別" style="width: 150px"
              ><ElOption v-for="c in currencies" :key="c" :label="c" :value="c" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="單號／對象"><ElInput v-model="search" clearable /></ElFormItem>
          <ElFormItem label="供應商"
            ><ElSelect v-model="provider" clearable placeholder="全部供應商"
              ><ElOption
                v-for="item in providerOptions"
                :key="item"
                :value="item"
                :label="item" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="遊戲類型"
            ><ElSelect v-model="gameType" clearable placeholder="全部類型"
              ><ElOption
                v-for="item in typeOptions"
                :key="item"
                :value="item"
                :label="item" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="對帳狀態"
            ><ElSelect v-model="status" clearable style="width: 150px"
              ><ElOption
                v-for="s in ['待確認', '已鎖定']"
                :key="s"
                :label="s"
                :value="s" /></ElSelect
          ></ElFormItem>
          <ElFormItem v-if="view === 'payments'" label="交付日期"
            ><ElDatePicker v-model="deliveryDates" type="daterange" value-format="YYYY-MM-DD"
          /></ElFormItem>
        </ElForm>
      </ElCard>
      <ReportApproxSummary
        v-if="view !== 'margin'"
        :rows="
          totals.map((group) => ({
            currency: group.currency,
            values: {
              pending: group.pending,
              locked: group.locked,
              paid: group.paid,
              outstanding: group.outstanding
            }
          }))
        "
        :metrics="
          view === 'settlements'
            ? [
                { key: 'pending', label: '待確認應結' },
                { key: 'locked', label: '已鎖定計算金額' }
              ]
            : [
                { key: 'paid', label: '已登錄交付' },
                { key: 'outstanding', label: '未承接結轉' }
              ]
        "
      />
      <ElCard shadow="never" class="detail-card">
        <template #header
          ><div class="section-heading"
            ><div
              ><h2>{{
                view === 'settlements'
                  ? '結算明細'
                  : view === 'payments'
                    ? '收付明細'
                    : '商務差額明細'
              }}</h2
              ><p>共 {{ rows.length }} 筆資料</p></div
            ><ElButton type="primary" @click="exportRows">匯出報表</ElButton></div
          ></template
        >
        <ElTable :data="pageRows" stripe row-key="id" style="width: 100%" max-height="620">
          <ElTableColumn label="結算單號" min-width="210" fixed="left"
            ><template #default="{ row }"
              ><RouterLink :to="row.href">{{ row.id }}</RouterLink></template
            ></ElTableColumn
          >
          <ElTableColumn prop="name" label="對象" min-width="160" />
          <ElTableColumn prop="period" label="結算期間" width="110" />
          <ElTableColumn prop="currency" label="結算幣" width="90" />
          <ElTableColumn prop="provider" label="供應商" min-width="120" />
          <ElTableColumn prop="gameType" label="遊戲類型" min-width="110" />
          <ElTableColumn prop="conditionVersion" label="條件版本" min-width="160" />
          <template v-if="view === 'settlements'">
            <ElTableColumn prop="basis" label="原單計算基礎" min-width="130" />
            <ElTableColumn prop="transactionCurrency" label="交易幣" width="90" />
            <ElTableColumn label="GGR（交易幣）" min-width="160" align="right"
              ><template #default="{ row }">{{ money(row.ggr) }}</template></ElTableColumn
            >
            <ElTableColumn label="商務比例" width="100" align="right"
              ><template #default="{ row }">{{ row.rate }}%</template></ElTableColumn
            >
            <ElTableColumn
              v-for="column in settlementColumns"
              :key="column.key"
              :label="column.label"
              min-width="160"
              align="right"
              ><template #default="{ row }">{{ money(row[column.key]) }}</template></ElTableColumn
            >
            <ElTableColumn prop="exchangeRate" label="原單匯率" min-width="160" />
            <ElTableColumn prop="formula" label="公式版本" min-width="160" />
            <ElTableColumn prop="calculatedAt" label="計算時間" min-width="180" />
          </template>
          <template v-else-if="view === 'payments'">
            <ElTableColumn
              v-for="column in paymentColumns"
              :key="column.key"
              :label="column.label"
              min-width="155"
              align="right"
              ><template #default="{ row }">{{ money(row[column.key]) }}</template></ElTableColumn
            >
            <ElTableColumn label="收付模式" min-width="130"
              ><template #default="{ row }">{{
                row.mode === 'AgentCollect'
                  ? '代理統收'
                  : row.mode === 'PlatformCollect'
                    ? '平台代收'
                    : '—'
              }}</template></ElTableColumn
            >
            <ElTableColumn prop="recipient" label="實際收款方" min-width="150" />
            <ElTableColumn prop="operator" label="登錄人" min-width="120" />
            <ElTableColumn prop="deliveredAt" label="交付時間" min-width="220" />
            <ElTableColumn prop="paymentStatus" label="收付狀態" min-width="120" />
          </template>
          <template v-else>
            <ElTableColumn
              v-for="column in marginColumns"
              :key="column.key"
              :label="column.label"
              min-width="170"
              align="right"
              ><template #default="{ row }">{{
                money(row.margin?.[column.key])
              }}</template></ElTableColumn
            >
          </template>
          <ElTableColumn prop="status" label="對帳狀態" width="110"
            ><template #default="{ row }"
              ><ElTag
                :type="
                  row.status === '已鎖定' ? 'success' : row.status === '待確認' ? 'warning' : 'info'
                "
                effect="light"
                >{{ row.status }}</ElTag
              ></template
            ></ElTableColumn
          >
        </ElTable>
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="rows.length"
          layout="total, sizes, prev, pager, next"
          style="margin-top: 20px"
        />
      </ElCard>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import ReportApproxSummary from './ReportApproxSummary.vue'
  import { platformDate } from '@/domain/report-four-tabs'
  import { useFinanceCenterStore } from '@/store/modules/financeCenter'
  import { useReportFourTabs } from '@/composables/useReportFourTabs'
  import { settlementReportRow, comparableMargin } from '@/domain/reconciliation-report'
  const props = defineProps<{ view: 'settlements' | 'payments' | 'margin' }>()
  const store = useFinanceCenterStore()
  const { canViewFinancial } = useReportFourTabs()
  const allowed = canViewFinancial
  const period = ref(''),
    currency = ref(''),
    search = ref(''),
    status = ref(''),
    kind = ref('merchant')
  const deliveryDates = ref<string[]>([])
  const provider = ref(''),
    gameType = ref('')
  const providerOptions = computed(() => [
    ...new Set(
      source.value
        .map(
          (r) => r.snapshot.reportDimensions?.providerId ?? ('providerId' in r ? r.providerId : '')
        )
        .filter(Boolean)
    )
  ])
  const typeOptions = computed(() => [
    ...new Set(
      source.value.map((r) => r.snapshot.reportDimensions?.gameType).filter((v): v is string => !!v)
    )
  ])
  const page = ref(1),
    pageSize = ref(20)
  function resetFilters() {
    period.value = ''
    currency.value = ''
    search.value = ''
    status.value = ''
    kind.value = 'merchant'
    provider.value = ''
    gameType.value = ''
    deliveryDates.value = []
  }
  const source = computed(() =>
    props.view === 'margin' || kind.value === 'agent'
      ? store.agentReconciliations
      : kind.value === 'provider'
        ? store.providerReconciliations
        : store.merchantReconciliations
  )
  const currencies = computed(() => [
    ...new Set(source.value.map((r) => r.snapshot.settlementCurrency))
  ])
  const rows = computed(() =>
    !allowed.value
      ? []
      : source.value
          .map((record) => ({
            ...settlementReportRow(record, store.deliveries),
            margin:
              'includedMerchantReconciliationIds' in record
                ? comparableMargin(record, store.merchantReconciliations)
                : null
          }))
          .filter(
            (r) =>
              (!period.value || r.period === period.value) &&
              (!provider.value || r.provider === provider.value) &&
              (!gameType.value || r.gameType === gameType.value) &&
              (!currency.value || r.currency === currency.value) &&
              (!status.value || r.status === status.value) &&
              (!search.value ||
                `${r.id} ${r.name}`.toLowerCase().includes(search.value.toLowerCase())) &&
              (props.view !== 'payments' ||
                !deliveryDates.value?.length ||
                (r.deliveredAt &&
                  platformDate(r.deliveredAt, 'Asia/Taipei') >= deliveryDates.value[0] &&
                  platformDate(r.deliveredAt, 'Asia/Taipei') <= deliveryDates.value[1]))
          )
  )
  watch([rows, pageSize], () => {
    page.value = 1
  })
  const pageRows = computed(() =>
    rows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
  )
  const totals = computed(() =>
    [...new Set(rows.value.map((r) => r.currency))].map((currency) => {
      const group = rows.value.filter((r) => r.currency === currency && r.status !== '已取消')
      return {
        currency,
        pending: group.filter((r) => r.status === '待確認').reduce((s, r) => s + r.system, 0),
        locked: group.filter((r) => r.status === '已鎖定').reduce((s, r) => s + r.system, 0),
        paid: group.reduce((s, r) => s + (r.paid ?? 0), 0),
        outstanding: group.reduce((s, r) => s + (r.outstanding ?? 0), 0)
      }
    })
  )
  const settlementColumns = [
    { key: 'base', label: '本期計算應結' },
    { key: 'system', label: '原單應結' }
  ]
  const paymentColumns = [
    { key: 'system', label: '系統應結' },
    { key: 'opening', label: '上期待交付（已承接）' },
    { key: 'difference', label: '本次人工調整' },
    { key: 'calculated', label: '調整後計算金額' },
    { key: 'discarded', label: '尾數捨去' },
    { key: 'due', label: '整數應收／應付' },
    { key: 'paid', label: '本期實收／實付' },
    { key: 'remaining', label: '本單結轉下期' }
  ]
  const marginColumns = [
    { key: 'downstream', label: '向下計算應收' },
    { key: 'upstream', label: '自身計算成本' },
    { key: 'difference', label: '商務條件差額' }
  ]
  const money = (n: number | null | undefined) =>
    n == null ? '—' : n.toLocaleString('en-US', { maximumFractionDigits: 6 })
  function exportRows() {
    if (!allowed.value) return
    const amountColumns =
      props.view === 'payments'
        ? paymentColumns
        : props.view === 'margin'
          ? marginColumns
          : settlementColumns
    const columns = [
      { key: 'provider', label: '供應商' },
      { key: 'gameType', label: '遊戲類型' },
      { key: 'conditionVersion', label: '條件版本' },
      ...amountColumns,
      ...(props.view === 'settlements'
        ? [
            { key: 'transactionCurrency', label: '交易幣' },
            { key: 'basis', label: '原單計算基礎' },
            { key: 'ggr', label: 'GGR（交易幣）' },
            { key: 'rate', label: '商務比例（%）' },
            { key: 'exchangeRate', label: '原單匯率' },
            { key: 'formula', label: '公式版本' },
            { key: 'calculatedAt', label: '計算時間' }
          ]
        : props.view === 'payments'
          ? [
              { key: 'mode', label: '收付模式' },
              { key: 'recipient', label: '實際收款方' },
              { key: 'operator', label: '登錄人' },
              { key: 'deliveredAt', label: '交付時間' },
              { key: 'paymentStatus', label: '收付狀態' }
            ]
          : [])
    ]
    const header = ['單號', '對象', '期間', '結算幣', '對帳狀態', ...columns.map((c) => c.label)]
    const records = rows.value.map((r) => [
      r.id,
      r.name,
      r.period,
      r.currency,
      r.status,
      ...columns.map((c) =>
        props.view === 'margin' && marginColumns.some((column) => column.key === c.key)
          ? (r.margin?.[c.key as keyof NonNullable<typeof r.margin>] ?? '')
          : (r[c.key as keyof typeof r] ?? '')
      )
    ])
    const escape = (value: unknown) =>
      '"' +
      String(value)
        .replace(/^[=+@-]/, "'$&")
        .replace(/"/g, '""') +
      '"'
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + [header, ...records].map((r) => r.map(escape).join(',')).join('\r\n')], {
        type: 'text/csv;charset=utf-8'
      })
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.view}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
</script>
<style scoped>
  .filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px 24px;
  }
  .settlement-reports {
    display: grid;
    gap: 20px;
    min-width: 0;
  }
  .settlement-reports > * {
    min-width: 0;
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .section-heading h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: var(--el-text-color-primary);
  }
  .section-heading p {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin: 6px 0 0;
  }
  .filters :deep(.el-form-item) {
    margin: 0;
    min-width: 0;
  }
  .filters :deep(.el-select),
  .filters :deep(.el-date-editor) {
    width: 100% !important;
    min-width: 0;
    max-width: 100%;
  }
  .filters :deep(.el-form-item__label) {
    line-height: 20px;
    margin-bottom: 8px;
    color: var(--el-text-color-regular);
  }
  .settlement-reports :deep(.el-card) {
    border-radius: 8px;
    border-color: var(--el-border-color-lighter);
  }
  .settlement-reports :deep(.el-card__header) {
    padding: 20px 24px;
  }
  .filter-card :deep(.el-card__body) {
    padding: 24px;
  }
  .detail-card :deep(.el-card__body) {
    padding: 0 20px 20px;
  }
  .detail-card :deep(th.el-table__cell) {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-secondary);
    font-weight: 500;
    height: 48px;
  }
  .detail-card :deep(td.el-table__cell) {
    height: 54px;
    font-variant-numeric: tabular-nums;
  }
  .detail-card :deep(a) {
    color: var(--el-color-primary);
    font-weight: 500;
  }
  .currency-summary {
    padding: 20px 24px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color);
  }
  .currency-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .currency-values {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    margin-top: 22px;
  }
  .currency-values > div {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .currency-values span {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .currency-values strong {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: -0.5px;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }
  @media (min-width: 1400px) {
    .filters {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
  @media (max-width: 720px) {
    .filters {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .currency-values strong {
      font-size: 20px;
    }
  }
  @media (max-width: 480px) {
    .filters {
      grid-template-columns: minmax(0, 1fr);
    }
    .currency-values {
      gap: 12px;
    }
    .filter-card :deep(.el-card__body) {
      padding: 16px;
    }
  }
  .totals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
    gap: 16px;
  }
</style>
