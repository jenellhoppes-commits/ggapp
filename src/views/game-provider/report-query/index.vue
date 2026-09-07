<template>
  <section class="four-reports">
    <AppPageHeader
      :title="overview ? '儀錶板' : '報表查詢'"
      :eyebrow="overview ? '總覽' : '報表中心'"
      description="隔離演示資料 · 非正式交易、結算或佣金。"
    />
    <ElTabs v-if="!overview" :model-value="current.tab" @tab-change="changeTab"
      ><ElTabPane v-for="tab in reportTabs" :key="tab" :name="tab" :label="reportTabLabels[tab]"
    /></ElTabs>
    <ElCard shadow="never">
      <ElForm label-position="top" class="report-filters" @submit.prevent="submit">
        <ElFormItem label="日期範圍" :error="errors.date" class="dates"
          ><ElDatePicker
            v-model="range"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
        /></ElFormItem>
        <ElFormItem label="原幣別" :error="errors.currency"
          ><ElSelect v-model="draft.currency" placeholder="請選擇單一原幣別" aria-label="原幣別"
            ><ElOption
              v-for="currency in Object.keys(scope.currencies)"
              :key="currency"
              :value="currency"
              :label="currency" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="!overview && current.tab === 'agents'" label="代理"
          ><ElSelect v-model="draft.agent" clearable placeholder="全部授權範圍" aria-label="代理"
            ><ElOption
              v-for="item in agents"
              :key="item.id"
              :value="item.id"
              :label="item.label" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="!overview && current.tab === 'merchants'" label="商戶"
          ><ElSelect v-model="draft.merchant" clearable placeholder="全部授權範圍" aria-label="商戶"
            ><ElOption
              v-for="item in merchants"
              :key="item.id"
              :value="item.id"
              :label="item.label" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="!overview && current.tab === 'games'" label="供應商"
          ><ElSelect
            v-model="draft.provider"
            clearable
            placeholder="全部授權範圍"
            aria-label="供應商"
            ><ElOption
              v-for="item in providers"
              :key="item.id"
              :value="item.id"
              :label="item.label" /></ElSelect
        ></ElFormItem>
        <ElFormItem v-if="!overview && current.tab === 'games'" label="遊戲名稱／代碼"
          ><ElInput v-model="draft.game" clearable placeholder="遊戲名稱或代碼"
        /></ElFormItem>
        <details class="more-filters">
          <summary
            >更多條件<span v-if="extraFilterCount">（已選擇 {{ extraFilterCount }}）</span></summary
          >
          <div class="extra-filter-grid">
            <ElFormItem v-if="overview || current.tab !== 'agents'" label="代理"
              ><ElSelect
                v-model="draft.agent"
                clearable
                placeholder="全部授權範圍"
                aria-label="代理"
                ><ElOption
                  v-for="item in agents"
                  :key="item.id"
                  :value="item.id"
                  :label="item.label" /></ElSelect
            ></ElFormItem>
            <ElFormItem v-if="overview || current.tab !== 'merchants'" label="商戶"
              ><ElSelect
                v-model="draft.merchant"
                clearable
                placeholder="全部授權範圍"
                aria-label="商戶"
                ><ElOption
                  v-for="item in merchants"
                  :key="item.id"
                  :value="item.id"
                  :label="item.label" /></ElSelect
            ></ElFormItem>
            <ElFormItem v-if="overview || current.tab !== 'games'" label="供應商"
              ><ElSelect
                v-model="draft.provider"
                clearable
                placeholder="全部授權範圍"
                aria-label="供應商"
                ><ElOption
                  v-for="item in providers"
                  :key="item.id"
                  :value="item.id"
                  :label="item.label" /></ElSelect
            ></ElFormItem>
            <ElFormItem v-if="overview || current.tab !== 'games'" label="遊戲名稱／代碼"
              ><ElInput v-model="draft.game" clearable placeholder="遊戲名稱或代碼"
            /></ElFormItem>
          </div>
        </details>
        <div class="form-actions"
          ><ElButton type="primary" native-type="submit" :disabled="!scope.canView">查詢</ElButton
          ><ElButton @click="reset">重置</ElButton></div
        >
      </ElForm>
      <p class="context"
        >平台時區：{{ scope.timezone || '缺設定' }} · 固定演示樣本日期 {{ reportSampleDate }} ·
        {{
          result
            ? `已套用 ${result.query.from} 至 ${result.query.to}／${result.query.currency} · 資料更新 ${result.cutoff}`
            : '請完成必填條件'
        }}
        <span v-if="appliedFilters"> · 限定範圍：{{ appliedFilters }}（可按重置清除）</span></p
      >
    </ElCard>
    <ElAlert v-if="!scope.canView" title="無報表查看權限" type="error" :closable="false" />
    <ElAlert v-else-if="failure" :title="failure" type="error" :closable="false"
      ><ElButton @click="load">重新查詢</ElButton></ElAlert
    >
    <ElAlert
      v-if="result?.issues.length"
      :title="result.issues.join('；')"
      type="warning"
      :closable="false"
    />
    <div v-loading="loading" class="result-area">
      <template v-if="result && !failure && scope.canView">
        <template v-if="!overview && result.query.tab === 'operations'">
          <ReportFinancialSummary v-if="canViewFinancial" :result="result" />
          <ElAlert
            v-else
            title="無財務資料查看權限；仍可查詢已授權營運資料"
            type="info"
            :closable="false"
          />
          <details class="operational-totals"
            ><summary>查看營運統計</summary
            ><ReportOperationalMetrics :stats="result.totals" :currency="result.query.currency"
          /></details>
        </template>
        <ReportOperationalMetrics v-else :stats="result.totals" :currency="result.query.currency" />
        <p v-if="!overview && result.query.tab === 'agents'" class="context">
          本頁僅呈現代理歸屬的原幣營運資料；正式核對與結算由財務中心管理。
          <RouterLink v-if="canViewFinancial" to="/finance/reconciliation/agents"
            >前往代理對帳</RouterLink
          >
          <span v-else>目前無財務資料查看權限。</span>
        </p>
        <p v-if="!overview && result.query.tab === 'merchants'" class="context"
          >隔離樣本商戶尚未與商務主檔建立核對關聯，因此暫不提供商戶詳情連結，避免開啟錯誤商戶；精確注單仍可查詢。</p
        >
        <template v-if="overview">
          <div class="overview-links"
            ><ElButton type="primary" @click="openReport">查看同範圍報表</ElButton></div
          >
          <p class="context"
            >目前待辦：尚未接入可核對的待辦狀態來源，因此不顯示待辦數字。營運指標僅計入上方已套用範圍。</p
          >
        </template>
        <template v-else>
          <div class="table-tools"
            ><span
              >共 {{ display(result.rows.length) }} 列 ·
              {{ reportTabLabels[result.query.tab] }}</span
            ><ElButton v-if="scope.canExport" :disabled="loading" @click="download"
              >匯出 CSV</ElButton
            ></div
          >
          <div class="table-region"
            ><ElTable
              :key="result.query.tab"
              :data="page.items"
              row-key="key"
              border
              empty-text="本範圍沒有可呈現明細；若有來源缺項，請以上方警示及合計狀態為準"
            >
              <ElTableColumn
                v-if="result.query.tab === 'operations'"
                prop="date"
                label="日期"
                min-width="150"
                ><template #header
                  ><button
                    type="button"
                    class="sort-control"
                    :aria-label="sortLabel('date', '日期')"
                    @click="sort('date')"
                    >日期 <span>{{ sortState('date') }}</span></button
                  ></template
                ><template #default="{ row }">{{ row.label }}</template></ElTableColumn
              >
              <ElTableColumn v-else :label="dimensionLabel" min-width="220"
                ><template #default="{ row }"
                  ><div class="identity"
                    ><strong>{{ row.code || row.key }}</strong
                    ><span>{{ row.label }}</span></div
                  ></template
                ></ElTableColumn
              >
              <ElTableColumn
                v-if="result.query.tab === 'games'"
                prop="provider"
                label="供應商"
                min-width="180"
              />
              <ElTableColumn
                v-for="metric in metrics"
                :key="metric.key"
                :prop="metric.key"
                :label="metric.label"
                min-width="155"
                align="right"
                ><template #header
                  ><button
                    type="button"
                    class="sort-control"
                    :aria-label="sortLabel(metric.key, metric.label)"
                    @click="sort(metric.key)"
                    >{{ metric.label }} <span>{{ sortState(metric.key) }}</span></button
                  ></template
                ><template #default="{ row }"
                  ><span class="metric-value"
                    >{{ display(row[metric.key], metric.amount)
                    }}<small v-if="metric.amount"> {{ result.query.currency }}</small></span
                  ></template
                ></ElTableColumn
              >
              <ElTableColumn label="操作" width="115"
                ><template #default="{ row }"
                  ><ElButton
                    v-if="scope.canViewBets"
                    link
                    type="primary"
                    :disabled="loading"
                    @click="drill(row)"
                    >查看注單</ElButton
                  ><span v-else>無權限</span></template
                ></ElTableColumn
              >
            </ElTable></div
          >
          <div class="pagination"
            ><ElPagination
              :current-page="page.page"
              :page-size="page.size"
              :total="page.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @current-change="pageChange"
              @size-change="sizeChange"
          /></div>
        </template>
      </template>
      <ElEmpty
        v-else-if="!loading && !failure && scope.canView"
        description="尚未查詢：請選擇日期及單一原幣別"
      />
    </div>
  </section>
</template>
<script setup lang="ts">
  import { computed, nextTick, reactive, ref, watch, onBeforeUnmount } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import ReportFinancialSummary from '@/components/business/ReportFinancialSummary.vue'
  import ReportOperationalMetrics from '@/components/business/ReportOperationalMetrics.vue'
  import {
    formatReportMetric,
    reportMetrics as metrics,
    nextReportSort,
    reportSortState
  } from '@/domain/report-presentation'
  import { useReportFourTabs } from '@/composables/useReportFourTabs'
  import { reportSampleDate } from '@/mock/game-provider/report-four-tabs'
  import {
    reportTabs,
    reportTabLabels,
    platformDate,
    parseFourQuery,
    validateFourQuery,
    fourQueryUrl,
    switchFourTab,
    queryFourReports,
    fourCsv,
    reportDrilldown,
    latestRequestGate,
    type FourQuery,
    type FourResult,
    type FourRow,
    type ReportTab
  } from '@/domain/report-four-tabs'
  import { listPage } from '@/domain/list-query'
  const props = defineProps<{ overview?: boolean }>()
  const route = useRoute(),
    router = useRouter(),
    { scope, source, lastCurrency, rememberCurrency, canViewFinancial } = useReportFourTabs()
  const today = () => {
    try {
      return platformDate(new Date(), scope.value.timezone)
    } catch {
      return ''
    }
  }
  const readQuery = () =>
    parseFourQuery(
      props.overview ? { ...route.query, tab: 'operations' } : route.query,
      today(),
      lastCurrency()
    )
  const current = ref(readQuery())
  const draft = reactive<FourQuery>({ ...current.value }),
    errors = ref<Record<string, string>>({}),
    result = ref<FourResult>(),
    failure = ref(''),
    loading = ref(false),
    gate = latestRequestGate()
  const range = computed({
    get: () => [draft.from, draft.to] as [string, string],
    set: (value: [string, string] | null) => {
      draft.from = value?.[0] || ''
      draft.to = value?.[1] || ''
    }
  })
  const extraFilterCount = computed(() => {
    const q = draft
    return [
      (props.overview || q.tab !== 'agents') && q.agent,
      (props.overview || q.tab !== 'merchants') && q.merchant,
      (props.overview || q.tab !== 'games') && q.provider,
      (props.overview || q.tab !== 'games') && q.game
    ].filter(Boolean).length
  })
  const display = formatReportMetric
  const appliedFilters = computed(() => {
    const q = result.value?.query
    if (!q) return ''
    return [
      q.agent && `代理 ${q.agent}`,
      q.merchant && `商戶 ${q.merchant}`,
      q.provider && `供應商 ${q.provider}`,
      q.game && `遊戲 ${q.game}`
    ]
      .filter(Boolean)
      .join('／')
  })
  const authorizedBets = computed(() =>
    source.bets.filter(
      (b) =>
        b.environment === scope.value.environment && scope.value.merchantIds.includes(b.merchantId)
    )
  )
  const merchants = computed(() => [
    ...new Map(
      authorizedBets.value.map((b) => [
        b.merchantId,
        { id: b.merchantId, label: `${b.merchantCode}／${b.merchantName}` }
      ])
    ).values()
  ])
  const providers = computed(() => [
    ...new Map(
      authorizedBets.value.map((b) => [b.providerId, { id: b.providerId, label: b.providerName }])
    ).values()
  ])
  const agents = computed(() => [
    ...new Map(
      authorizedBets.value.map((b) =>
        b.agent === null
          ? ['unassigned', { id: 'unassigned', label: '未歸屬' }]
          : b.agent === 'unknown'
            ? ['unknown', { id: 'unknown', label: '歸屬待確認' }]
            : [b.agent.id, { id: b.agent.id, label: `${b.agent.code}／${b.agent.name}` }]
      ) as [string, { id: string; label: string }][]
    ).values()
  ])
  const page = computed(() =>
    listPage(result.value?.rows || [], current.value.page, current.value.size)
  )
  const dimensionLabel = computed(
    () =>
      ({
        agents: '代理代碼／名稱',
        merchants: '商戶代碼／名稱',
        games: '遊戲代碼／名稱',
        operations: '日期'
      })[current.value.tab]
  )
  const unsupportedLegacy = computed(() =>
    ['lineUid', 'status', 'keyword', 'q'].filter((key) => route.query[key])
  )
  const publish = async (q: FourQuery) => {
    const target = {
      path: props.overview ? '/dashboard' : '/business/reports',
      query: fourQueryUrl(q)
    }
    if (router.resolve(target).fullPath === route.fullPath) await load()
    else await router.push(target)
  }
  const submit = () => {
    if (unsupportedLegacy.value.length) {
      failure.value =
        '舊查詢包含本來源未支援的條件：' +
        unsupportedLegacy.value.join('、') +
        '。請先核對並按重置，不會擅自擴大範圍。'
      return
    }
    errors.value = validateFourQuery(draft, scope.value)
    if (Object.keys(errors.value).length) return
    rememberCurrency(draft.currency)
    const q = { ...draft, page: 1 }
    if (JSON.stringify(fourQueryUrl(q)) === JSON.stringify(route.query)) load()
    else publish(q)
  }
  const changeTab = (value: string | number) => {
    const tab = String(value) as ReportTab
    if (reportTabs.includes(tab)) publish(switchFourTab(result.value?.query || current.value, tab))
  }
  const reset = () => {
    const base = result.value?.query || current.value
    const date = today()
    publish(
      parseFourQuery(
        {
          tab: current.value.tab,
          from: date,
          to: date,
          currency: base.currency in scope.value.currencies ? base.currency : '',
          size: base.size
        },
        date
      )
    )
  }
  const pageChange = (page: number) => publish({ ...current.value, page })
  const sizeChange = (size: number) => publish({ ...current.value, size, page: 1 })
  const sortState = (key: string) => reportSortState(current.value, key)
  const sortLabel = (key: string, label: string) =>
    `${label}排序，目前${sortState(key)}；啟動切換為${nextReportSort(current.value, key).order === 'asc' ? '升冪' : '降冪'}`
  const sort = async (key: string) => {
    const control = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await publish(nextReportSort(current.value, key))
    await nextTick()
    // The template's global navigation guard scrolls every URL change to the top.
    // Keep this local query action's still-focused control visible after that guard.
    if (control?.isConnected && control.classList.contains('sort-control')) {
      control.focus({ preventScroll: true })
      control.scrollIntoView({ block: 'center', inline: 'nearest' })
    }
  }
  const openReport = () =>
    result.value &&
    router.push({ path: '/business/reports', query: fourQueryUrl(result.value.query) })
  async function load() {
    const request = gate.next(),
      q = readQuery()
    current.value = q
    Object.assign(draft, q)
    errors.value = validateFourQuery(q, scope.value)
    failure.value = ''
    // Retain the table for valid refreshes so keyboard sort focus is not destroyed.
    loading.value = false
    if (unsupportedLegacy.value.length) {
      result.value = undefined
      failure.value =
        '舊查詢包含本來源未支援的條件：' +
        unsupportedLegacy.value.join('、') +
        '。請先核對並按重置，不會擅自擴大範圍。'
      return
    }
    if (!scope.value.canView || Object.keys(errors.value).length) {
      result.value = undefined
      return
    }
    loading.value = true
    try {
      await Promise.resolve()
      const next = queryFourReports(source, q, scope.value)
      if (!gate.isCurrent(request)) return
      result.value = next
      rememberCurrency(q.currency)
      const actual = listPage(next.rows, q.page, q.size).page
      if (actual !== q.page) {
        current.value = { ...q, page: actual }
        await router.replace({ path: route.path, query: fourQueryUrl(current.value) })
      }
    } catch (error) {
      if (gate.isCurrent(request))
        failure.value = error instanceof Error ? error.message : '查詢失敗'
    } finally {
      if (gate.isCurrent(request)) loading.value = false
    }
  }
  function download() {
    if (!result.value || loading.value) return
    try {
      const csv = fourCsv(result.value, scope.value),
        q = result.value.query,
        link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      link.download = `${reportTabLabels[q.tab]}_${q.from}_${q.to}_${q.currency}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '匯出失敗')
    }
  }
  function drill(row: FourRow) {
    if (result.value && !loading.value)
      try {
        router.push(reportDrilldown(result.value, row, scope.value))
      } catch (e) {
        ElMessage.error(e instanceof Error ? e.message : '無權限')
      }
  }
  watch(() => [route.fullPath, scope.value], load, { immediate: true })
  onBeforeUnmount(() => gate.next())
</script>
<style scoped>
  .four-reports {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
  }
  .four-reports > * {
    min-width: 0;
  }
  .report-filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }
  .report-filters :deep(.el-form-item) {
    margin-bottom: 10px;
    min-width: 0;
  }
  .report-filters :deep(.el-date-editor),
  .report-filters :deep(.el-select) {
    width: 100%;
    max-width: 100%;
  }
  .form-actions {
    display: flex;
    gap: 8px;
    align-self: center;
    grid-column: 1 / -1;
  }
  .context {
    font-size: 12px;
    line-height: 1.8;
    color: var(--el-text-color-secondary);
    overflow-wrap: anywhere;
  }
  .more-filters {
    grid-column: 1 / -1;
  }
  summary {
    cursor: pointer;
    padding: 10px 0;
    color: var(--el-color-primary);
  }
  summary:focus-visible,
  .sort-control:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
  .extra-filter-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    padding-top: 8px;
  }
  .operational-totals {
    margin-top: 12px;
  }
  .overview-links {
    margin-top: 20px;
  }
  .sort-control {
    cursor: pointer;
    font: inherit;
    color: inherit;
    padding: 6px 2px;
    background: transparent;
  }
  .sort-control span {
    font-size: 11px;
    display: block;
    color: var(--el-text-color-secondary);
  }
  .result-area {
    min-height: 180px;
    min-width: 0;
  }
  .table-tools {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin: 16px 0;
  }
  .table-region {
    max-width: 100%;
    min-width: 0;
    overflow: auto;
  }
  .identity {
    display: grid;
    gap: 5px;
    overflow-wrap: anywhere;
  }
  .metric-value small {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }
  .pagination {
    max-width: 100%;
    overflow: auto;
    padding: 16px 0;
  }
  @media (max-width: 900px) {
    .report-filters {
      grid-template-columns: 1fr 1fr;
    }
    .dates {
      grid-column: 1/-1;
    }
  }
  @media (max-width: 720px) {
    .report-filters {
      grid-template-columns: minmax(0, 1fr);
    }
    .extra-filter-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .form-actions,
    .table-tools {
      align-items: stretch;
    }
    .form-actions :deep(.el-button) {
      flex: 1;
      margin-left: 0;
    }
    .table-tools :deep(.el-button) {
      width: 100%;
      margin-left: 0;
    }
  }
</style>
