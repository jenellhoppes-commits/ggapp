<template>
  <div class="report-page">
    <AppPageHeader
      :title="props.embeddedMode ? copy.title : String(route.meta.title || copy.title)"
      :eyebrow="'業務查詢'"
      :description="copy.description"
    >
      <template #actions>
        <ElButton v-if="!props.embeddedMode" @click="returnToModule"
          >返回{{ returnLabel }}</ElButton
        >
        <ElButton @click="definitionVisible = true">指標說明</ElButton>
        <ElButton type="primary" @click="exportRows">匯出報表</ElButton>
      </template>
    </AppPageHeader>

    <ElAlert
      title="既有示範彙總，非正式統計或結算"
      :description="
        route.meta.transition
          ? '此為過渡查詢與匯出頁，保留原功能；尚未完成目的模組的完整資料整合。'
          : '沿用範本既有資料來源與口徑；不跨原幣加總，也不產生正式結算。'
      "
      type="warning"
      :closable="false"
    />
    <div class="summary-grid">
      <button
        v-for="card in summaryCards"
        :key="card.label"
        type="button"
        @click="card.filter && applySummaryFilter(card.filter)"
      >
        <span>{{ card.label }}</span>
        <strong :class="card.tone">{{ card.value }}</strong>
        <small>{{ card.note }}</small>
      </button>
    </div>

    <ElAlert :title="modeAlert" type="info" :closable="false" show-icon />

    <ElCard shadow="never" class="filter-card">
      <ElForm inline label-position="left" @submit.prevent="applyFilters">
        <ElFormItem label="樣本日期（未支援篩選）">
          <ElDatePicker
            v-model="filters.dateRange"
            disabled
            type="daterange"
            range-separator="至"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            value-format="YYYY-MM-DD"
            :clearable="false"
          />
        </ElFormItem>
        <ElFormItem label="交易幣別">
          <ElSelect
            v-model="filters.currency"
            clearable
            placeholder="全部幣別"
            class="filter-select"
          >
            <ElOption
              v-for="currency in currencies"
              :key="currency"
              :label="currency"
              :value="currency"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="showAgentFilter" label="代理">
          <ElSelect
            v-model="filters.agentId"
            clearable
            filterable
            placeholder="全部代理"
            class="filter-select"
          >
            <ElOption
              v-for="agent in businessStore.agents"
              :key="agent.id"
              :label="`${agent.name}｜${agent.code}`"
              :value="agent.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="showMerchantFilter" label="商戶">
          <ElSelect
            v-model="filters.merchantId"
            clearable
            filterable
            placeholder="全部商戶"
            class="filter-select"
          >
            <ElOption
              v-for="merchant in merchantOptions"
              :key="merchant.id"
              :label="`${merchant.name}｜${merchant.code}`"
              :value="merchant.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="showGameFilter" label="遊戲">
          <ElSelect
            v-model="filters.gameId"
            clearable
            filterable
            placeholder="全部遊戲"
            class="filter-select"
          >
            <ElOption
              v-for="game in gameStore.games"
              :key="game.id"
              :label="`${game.displayName}｜${game.code}`"
              :value="game.id"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="mode === 'merchant-line'" label="線路識別"
          ><ElInput v-model="filters.lineUid" clearable placeholder="精確線路識別"
        /></ElFormItem>
        <ElFormItem label="關鍵字">
          <ElInput v-model="filters.keyword" clearable :placeholder="copy.keywordPlaceholder" />
        </ElFormItem>
        <ElFormItem :label="mode === 'member' ? '排除測試資料' : '測試資料排除（此彙總未支援）'">
          <ElSwitch
            :model-value="mode === 'member' && filters.excludeTest"
            :disabled="mode !== 'member'"
            aria-label="排除測試資料"
            @update:model-value="(value) => (filters.excludeTest = Boolean(value))"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" native-type="submit">查詢</ElButton>
          <ElButton @click="resetFilters">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <p class="query-note"
      >已套用條件：{{
        appliedDescription
      }}。日期僅保留原網址內容，既有彙總沒有可用事件日期，未套用日期篩選。</p
    >
    <ElCard shadow="never" class="table-card">
      <div class="table-toolbar">
        <div>
          <strong>{{ copy.tableTitle }}</strong>
          <span>共 {{ filteredRows.length }} 筆</span>
          <small>最後更新：{{ reportStore.reportTime }}</small>
        </div>
        <div class="display-controls">
          <ElRadioGroup v-model="displayMode" size="small">
            <ElRadioButton value="Original">原幣</ElRadioButton>
            <ElRadioButton value="Reference">參考換算</ElRadioButton>
          </ElRadioGroup>
          <ElSelect
            v-if="displayMode === 'Reference'"
            v-model="referenceCurrency"
            class="reference-select"
            aria-label="參考換算幣別"
          >
            <ElOption
              v-for="currency in currencies"
              :key="currency"
              :label="currency"
              :value="currency"
            />
          </ElSelect>
        </div>
      </div>

      <ElTable :data="pagedRows" border row-key="id" empty-text="目前篩選條件沒有資料">
        <ElTableColumn label="項目" min-width="220" :fixed="isMobile ? undefined : 'left'">
          <template #default="scope">
            <button class="entity-link" type="button" @click="openSource(scope.row)">
              <strong>{{ scope.row.primary }}</strong>
              <small>{{ scope.row.secondary || scope.row.id }}</small>
            </button>
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-for="column in copy.columns"
          :key="column.key"
          :label="column.label"
          :min-width="column.minWidth || 130"
          :align="column.align || 'left'"
        >
          <template #default="scope">
            <ElTag
              v-if="column.kind === 'status'"
              :type="statusType(scope.row.status)"
              effect="plain"
            >
              {{ statusLabel(scope.row.status) }}
            </ElTag>
            <span v-else :class="{ 'negative-value': isNegative(scope.row, column.key) }">
              {{ formatCell(scope.row, column) }}
            </span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="更新時間" min-width="160" prop="updatedAt" />
        <ElTableColumn v-if="!isMobile" label="操作" width="110" fixed="right">
          <template #default="scope">
            <ElButton link type="primary" @click="openSource(scope.row)">查看來源</ElButton>
          </template>
        </ElTableColumn>
      </ElTable>

      <div class="pagination-row">
        <ElPagination
          :current-page="pageResult.page"
          :page-size="pageResult.size"
          @current-change="(page: number) => changePage(page, pageResult.size)"
          @size-change="(size: number) => changePage(1, size)"
          :page-sizes="[10, 20, 50]"
          :total="filteredRows.length"
          layout="total, sizes, prev, pager, next"
          background
        />
      </div>
    </ElCard>

    <ElDrawer v-model="definitionVisible" title="報表口徑與指標說明" size="min(520px, 100%)">
      <ElAlert
        title="報表數值為前端 Mock Data；正式串接後須由資料倉儲提供可追溯的計算版本。"
        type="warning"
        :closable="false"
        show-icon
      />
      <ElDescriptions class="definition-list" :column="1" border>
        <ElDescriptionsItem label="投注金額">已接受且未取消的原始投注金額。</ElDescriptionsItem>
        <ElDescriptionsItem label="有效投注"
          >依遊戲與結算規則排除無效或取消注單後的金額。</ElDescriptionsItem
        >
        <ElDescriptionsItem label="遊戲商輸贏"
          >投注金額－派彩金額，不含後續人工調整。</ElDescriptionsItem
        >
        <ElDescriptionsItem label="實際 RTP">派彩金額 ÷ 投注金額 × 100%。</ElDescriptionsItem>
        <ElDescriptionsItem label="參考換算"
          >依目前平台匯率換算，僅供營運比較，不可作為正式結算依據。</ElDescriptionsItem
        >
        <ElDescriptionsItem label="測試資料"
          >只有會員統計具備測試會員識別並支援排除；其他既有彙總未提供此能力，開關停用。</ElDescriptionsItem
        >
      </ElDescriptions>
      <div class="drawer-note">
        <strong>目前報表</strong>
        <p>{{ copy.title }}｜{{ copy.description }}</p>
      </div>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import {
    readReportFilters,
    filterReportRows,
    reportFilterQuery,
    reportCsvCell,
    type ReportFilters
  } from '@/domain/report-query'
  import { listPage } from '@/domain/list-query'
  import { useWindowSize } from '@vueuse/core'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useGameCatalogStore } from '@/store/modules/gameCatalog'
  import { useReportCenterStore } from '@/store/modules/reportCenter'
  import type { ReportMetricRow, ReportMode, ReportRowStatus } from '@/types/game-provider'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'

  defineOptions({ name: 'ReportCenter' })
  const props = defineProps<{ embeddedMode?: ReportMode }>()

  type DisplayMode = 'Original' | 'Reference'
  type ColumnKind = 'text' | 'integer' | 'amount' | 'percent' | 'status'
  type ColumnKey = keyof ReportMetricRow

  interface ReportColumn {
    key: ColumnKey
    label: string
    kind: ColumnKind
    minWidth?: number
    align?: 'left' | 'center' | 'right'
  }

  interface ReportCopy {
    title: string
    eyebrow: string
    description: string
    tableTitle: string
    keywordPlaceholder: string
    columns: ReportColumn[]
  }

  interface SummaryCard {
    label: string
    value: string
    note: string
    tone?: string
    filter?: ReportRowStatus
  }

  const amountColumn = (key: ColumnKey, label: string): ReportColumn => ({
    key,
    label,
    kind: 'amount',
    minWidth: 150,
    align: 'right'
  })
  const integerColumn = (key: ColumnKey, label: string): ReportColumn => ({
    key,
    label,
    kind: 'integer',
    minWidth: 115,
    align: 'right'
  })
  const percentColumn = (key: ColumnKey, label: string): ReportColumn => ({
    key,
    label,
    kind: 'percent',
    minWidth: 115,
    align: 'right'
  })
  const textColumn = (key: ColumnKey, label: string, minWidth = 140): ReportColumn => ({
    key,
    label,
    kind: 'text',
    minWidth
  })
  const statusColumn: ReportColumn = {
    key: 'status',
    label: '狀態',
    kind: 'status',
    minWidth: 105
  }

  const reportCopies: Record<ReportMode, ReportCopy> = {
    overview: {
      title: '營運總覽',
      eyebrow: '報表中心',
      description: '依交易幣別查看投注、派彩、遊戲商輸贏、RTP 與活躍會員。',
      tableTitle: '交易幣別營運彙總',
      keywordPlaceholder: '搜尋幣別或彙總項目',
      columns: [
        textColumn('period', '資料期間', 190),
        textColumn('currency', '交易幣別', 110),
        integerColumn('activeMembers', '活躍會員'),
        integerColumn('betCount', '注單數'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('payoutAmount', '派彩金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        percentColumn('actualRtp', '實際 RTP'),
        statusColumn
      ]
    },
    'game-performance': {
      title: '遊戲表現',
      eyebrow: '報表中心 · 遊戲報表',
      description: '比較遊戲投注、派彩、活躍會員、商戶覆蓋及營運表現。',
      tableTitle: '遊戲表現明細',
      keywordPlaceholder: '搜尋遊戲代碼或名稱',
      columns: [
        textColumn('currency', '交易幣別', 110),
        integerColumn('merchantCount', '商戶數'),
        integerColumn('activeMembers', '活躍會員'),
        integerColumn('rounds', '遊戲局數'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('payoutAmount', '派彩金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        percentColumn('actualRtp', '實際 RTP'),
        statusColumn
      ]
    },
    rtp: {
      title: 'RTP',
      eyebrow: '報表中心 · 遊戲報表',
      description: '監控理論 RTP、實際 RTP、樣本量與偏移狀況。',
      tableTitle: 'RTP 偏移監控',
      keywordPlaceholder: '搜尋遊戲代碼或名稱',
      columns: [
        textColumn('currency', '交易幣別', 110),
        integerColumn('rounds', '樣本局數'),
        amountColumn('betAmount', '樣本投注'),
        percentColumn('theoreticalRtp', '理論 RTP'),
        percentColumn('actualRtp', '實際 RTP'),
        percentColumn('rtpDeviation', '偏移'),
        statusColumn
      ]
    },
    merchant: {
      title: '商戶',
      eyebrow: '報表中心 · 商戶報表',
      description: '彙整商戶營運規模、交易成功率與遊戲商輸贏。',
      tableTitle: '商戶營運報表',
      keywordPlaceholder: '搜尋商戶代碼或名稱',
      columns: [
        textColumn('agentName', '所屬代理', 160),
        textColumn('currency', '結算幣別', 110),
        integerColumn('activeMembers', '活躍會員'),
        integerColumn('rounds', '遊戲局數'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        percentColumn('successRate', '交易成功率'),
        statusColumn
      ]
    },
    'merchant-line': {
      title: '商戶線路',
      eyebrow: '報表中心 · 商戶報表',
      description: '依商戶線路與交易幣別追蹤投注、RTP 與串接品質。',
      tableTitle: '商戶線路表現',
      keywordPlaceholder: '搜尋線路識別或商戶',
      columns: [
        textColumn('merchantName', '商戶', 160),
        textColumn('currency', '交易幣別', 110),
        textColumn('category', '環境', 110),
        integerColumn('activeMembers', '活躍會員'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        percentColumn('actualRtp', '實際 RTP'),
        percentColumn('successRate', '成功率'),
        statusColumn
      ]
    },
    agent: {
      title: '代理',
      eyebrow: '報表中心 · 代理報表',
      description: '依代理層級彙整旗下商戶、活躍會員、投注與收益表現。',
      tableTitle: '代理營運報表',
      keywordPlaceholder: '搜尋代理代碼或名稱',
      columns: [
        textColumn('category', '上級代理', 160),
        textColumn('currency', '結算幣別', 110),
        integerColumn('merchantCount', '商戶數'),
        integerColumn('activeMembers', '活躍會員'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        percentColumn('actualRtp', '實際 RTP'),
        statusColumn
      ]
    },
    'agent-merchant': {
      title: '旗下商戶',
      eyebrow: '報表中心 · 代理報表',
      description: '比較代理旗下各商戶的交易規模與收益貢獻。',
      tableTitle: '代理旗下商戶表現',
      keywordPlaceholder: '搜尋代理或商戶',
      columns: [
        textColumn('agentName', '所屬代理', 160),
        textColumn('currency', '結算幣別', 110),
        integerColumn('activeMembers', '活躍會員'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('payoutAmount', '派彩金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        percentColumn('actualRtp', '實際 RTP'),
        statusColumn
      ]
    },
    member: {
      title: '會員報表',
      eyebrow: '報表中心',
      description: '查詢既有會員活躍、投注、派彩及示範統計。',
      tableTitle: '會員營運報表',
      keywordPlaceholder: '搜尋會員識別碼或商戶',
      columns: [
        textColumn('merchantName', '商戶', 160),
        textColumn('lineUid', '商戶線路', 170),
        textColumn('currency', '交易幣別', 110),
        textColumn('category', '會員類型', 110),
        integerColumn('rounds', '遊戲局數'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('payoutAmount', '派彩金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        statusColumn
      ]
    },
    bet: {
      title: '注單統計',
      eyebrow: '報表中心 · 交易報表',
      description: '依遊戲與交易幣別彙整注單數、投注、派彩與 RTP。',
      tableTitle: '注單統計明細',
      keywordPlaceholder: '搜尋遊戲或交易幣別',
      columns: [
        textColumn('category', '遊戲類型', 120),
        textColumn('currency', '交易幣別', 110),
        integerColumn('betCount', '注單數'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('validBetAmount', '有效投注'),
        amountColumn('payoutAmount', '派彩金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        percentColumn('actualRtp', '實際 RTP'),
        statusColumn
      ]
    },
    transaction: {
      title: '交易統計',
      eyebrow: '報表中心 · 交易報表',
      description: '依交易類型與幣別檢視交易量、金額、成功率與異常。',
      tableTitle: '交易統計明細',
      keywordPlaceholder: '搜尋交易類型或幣別',
      columns: [
        textColumn('category', '交易類型', 130),
        textColumn('currency', '交易幣別', 110),
        integerColumn('transactionCount', '交易筆數'),
        amountColumn('betAmount', '交易金額'),
        percentColumn('successRate', '成功率'),
        statusColumn
      ]
    },
    jackpot: {
      title: '獎池報表',
      eyebrow: '報表中心',
      description: '檢視各幣別獎池水位、累積、派發與事件筆數。',
      tableTitle: '獎池營運報表',
      keywordPlaceholder: '搜尋獎池代碼或名稱',
      columns: [
        textColumn('category', '獎池類型', 130),
        textColumn('currency', '交易幣別', 110),
        integerColumn('transactionCount', '流水筆數'),
        amountColumn('jackpotContribution', '累積金額'),
        amountColumn('jackpotPayout', '派發金額'),
        amountColumn('currentBalance', '目前水位'),
        statusColumn
      ]
    },
    'merchant-settlement': {
      title: '商戶結算',
      eyebrow: '報表中心 · 結算報表',
      description: '使用正式條件與匯率快照呈現商戶結算結果。',
      tableTitle: '商戶結算報表',
      keywordPlaceholder: '搜尋商戶、線路或對帳單',
      columns: [
        textColumn('period', '結算期間', 120),
        textColumn('lineUid', '商戶線路', 180),
        textColumn('currency', '原始幣別', 110),
        amountColumn('betAmount', '投注金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        amountColumn('adjustmentAmount', '調整金額'),
        amountColumn('settlementAmount', '結算金額'),
        statusColumn
      ]
    },
    'agent-settlement': {
      title: '代理結算',
      eyebrow: '報表中心 · 結算報表',
      description: '依代理條件、旗下商戶對帳與匯率快照呈現代理結算。',
      tableTitle: '代理結算報表',
      keywordPlaceholder: '搜尋代理或對帳單',
      columns: [
        textColumn('period', '結算期間', 120),
        textColumn('currency', '原始幣別', 110),
        integerColumn('merchantCount', '商戶數'),
        amountColumn('betAmount', '投注金額'),
        amountColumn('ggr', '遊戲商輸贏'),
        amountColumn('adjustmentAmount', '調整金額'),
        amountColumn('settlementAmount', '結算金額'),
        statusColumn
      ]
    }
  }

  const route = useRoute()
  const router = useRouter()
  const businessStore = useBusinessPartnerStore()
  const gameStore = useGameCatalogStore()
  const reportStore = useReportCenterStore()
  const { width } = useWindowSize()
  const isMobile = computed(() => width.value <= 680)

  const routeModeMap: Record<string, ReportMode> = {
    ReportOverview: 'overview',
    GamePerformanceReport: 'game-performance',
    RtpReport: 'rtp',
    MerchantReport: 'merchant',
    MerchantLineReport: 'merchant-line',
    AgentReport: 'agent',
    AgentMerchantReport: 'agent-merchant',
    MemberReports: 'member',
    BetStatisticsReport: 'bet',
    TransactionStatisticsReport: 'transaction',
    JackpotReports: 'jackpot',
    MerchantSettlementReport: 'merchant-settlement',
    AgentSettlementReport: 'agent-settlement'
  }

  const mode = computed<ReportMode>(
    () => props.embeddedMode || routeModeMap[String(route.name)] || 'overview'
  )
  const copy = computed(() => reportCopies[mode.value])
  const displayMode = ref<DisplayMode>('Original')
  const referenceCurrency = ref('USD')
  const definitionVisible = ref(false)
  const pagination = reactive({ current: 1, size: 10 })

  const defaultFilters = () => readReportFilters()
  const filters = reactive<ReportFilters>(defaultFilters())
  const appliedFilters = ref<ReportFilters>(defaultFilters())

  const currencies = computed(() => [
    ...new Set(reportStore.getRows(mode.value).map((row) => row.currency))
  ])
  const showAgentFilter = computed(() =>
    [
      'merchant',
      'merchant-line',
      'agent',
      'agent-merchant',
      'member',
      'merchant-settlement',
      'agent-settlement'
    ].includes(mode.value)
  )
  const showMerchantFilter = computed(() =>
    ['merchant', 'merchant-line', 'agent-merchant', 'member', 'merchant-settlement'].includes(
      mode.value
    )
  )
  const showGameFilter = computed(() =>
    ['game-performance', 'rtp', 'member', 'bet', 'jackpot'].includes(mode.value)
  )
  const merchantOptions = computed(() =>
    filters.agentId
      ? businessStore.merchants.filter((merchant) => merchant.agentId === filters.agentId)
      : businessStore.merchants
  )

  const sourceRows = computed(() => reportStore.getRows(mode.value))
  const filteredRows = computed(() => filterReportRows(sourceRows.value, appliedFilters.value))
  const pageResult = computed(() =>
    listPage(filteredRows.value, pagination.current, pagination.size)
  )
  const pagedRows = computed(() => pageResult.value.items)
  const appliedDescription = computed(
    () =>
      Object.entries(appliedFilters.value)
        .filter(([key, value]) => key !== 'dateRange' && value !== '' && key !== 'excludeTest')
        .map(
          ([key, value]) =>
            `${({ currency: '幣別', merchantId: '商戶', agentId: '代理', gameId: '遊戲', lineUid: '線路', keyword: '關鍵字', status: '狀態' } as Record<string, string>)[key]}：${value}`
        )
        .join('；') || '全部資料'
  )
  const returnLabel = computed(() =>
    appliedFilters.value.merchantId
      ? '商戶詳情'
      : route.meta.activePath === '/dashboard'
        ? '總覽'
        : '所屬列表'
  )
  const returnToModule = () =>
    router.push(
      appliedFilters.value.merchantId
        ? { path: `/business/merchants/${encodeURIComponent(appliedFilters.value.merchantId)}` }
        : String(route.meta.activePath || '/dashboard')
    )
  const changePage = (page: number, size: number) =>
    router.push({ query: { ...route.query, page: String(page), size: String(size) } })

  const modeAlert = computed(() => {
    if (['merchant-settlement', 'agent-settlement'].includes(mode.value)) {
      return '既有範本示範資料；未確認正式費用與佣金規則，不作正式結算依據。'
    }
    if (displayMode.value === 'Reference') {
      return `目前以 ${referenceCurrency.value} 進行參考換算；此數值只供跨幣別比較，不可作為正式結算依據。`
    }
    return '原幣模式不跨幣別加總；請使用交易幣別篩選，或切換「參考換算」進行趨勢比較。'
  })

  const formatNumber = (value: number, digits = 0) =>
    new Intl.NumberFormat('zh-TW', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value)

  const displayAmount = (row: ReportMetricRow, value: number) => {
    const amount =
      displayMode.value === 'Reference'
        ? reportStore.convertAmount(value, row.currency, referenceCurrency.value)
        : value
    const currency = displayMode.value === 'Reference' ? referenceCurrency.value : row.currency
    return `${formatNumber(amount, 2)} ${currency}`
  }

  const formatCell = (row: ReportMetricRow, column: ReportColumn) => {
    const value = row[column.key]
    if (value === undefined || value === null || value === '') return '—'
    if (column.kind === 'amount') return displayAmount(row, Number(value))
    if (column.kind === 'integer') return formatNumber(Number(value))
    if (column.kind === 'percent') {
      const prefix = column.key === 'rtpDeviation' && Number(value) > 0 ? '+' : ''
      return `${prefix}${formatNumber(Number(value), 2)}%`
    }
    return String(value)
  }

  const summarizeAmount = (key: ColumnKey) => {
    const rows = filteredRows.value.filter((row) => typeof row[key] === 'number')
    const currencySet = new Set(rows.map((row) => row.currency))
    if (!rows.length) return { value: '—', note: '目前沒有可計算資料' }
    if (displayMode.value === 'Original' && currencySet.size > 1) {
      return { value: '多幣別', note: '選擇交易幣別後顯示合計' }
    }
    const currency = displayMode.value === 'Reference' ? referenceCurrency.value : rows[0].currency
    const total = rows.reduce((sum, row) => {
      const value = Number(row[key] || 0)
      return (
        sum +
        (displayMode.value === 'Reference'
          ? reportStore.convertAmount(value, row.currency, referenceCurrency.value)
          : value)
      )
    }, 0)
    return { value: formatNumber(total, 2), note: `${currency}｜目前篩選範圍` }
  }

  const summaryCards = computed<SummaryCard[]>(() => {
    if (mode.value === 'transaction') {
      const transactionCount = filteredRows.value.reduce(
        (total, row) => total + (row.transactionCount || 0),
        0
      )
      const averageSuccess = filteredRows.value.length
        ? filteredRows.value.reduce((total, row) => total + (row.successRate || 0), 0) /
          filteredRows.value.length
        : 0
      return [
        { label: '交易筆數', value: formatNumber(transactionCount), note: '目前篩選範圍' },
        { label: '交易金額', ...summarizeAmount('betAmount') },
        {
          label: '平均成功率',
          value: `${formatNumber(averageSuccess, 2)}%`,
          note: '依交易類型平均'
        },
        {
          label: '需注意',
          value: String(filteredRows.value.filter((row) => row.status === 'Attention').length),
          note: '可點擊縮小範圍',
          tone: 'danger',
          filter: 'Attention' as ReportRowStatus
        }
      ]
    }
    if (mode.value === 'jackpot') {
      return [
        { label: '獎池數', value: String(filteredRows.value.length), note: '目前篩選範圍' },
        { label: '目前水位', ...summarizeAmount('currentBalance') },
        { label: '累積金額', ...summarizeAmount('jackpotContribution') },
        { label: '派發金額', ...summarizeAmount('jackpotPayout'), tone: 'warning' }
      ]
    }
    if (['merchant-settlement', 'agent-settlement'].includes(mode.value)) {
      return [
        { label: '報表筆數', value: String(filteredRows.value.length), note: '依期間與對象' },
        { label: '遊戲商輸贏', ...summarizeAmount('ggr') },
        { label: '調整金額', ...summarizeAmount('adjustmentAmount'), tone: 'warning' },
        { label: '結算金額', ...summarizeAmount('settlementAmount') }
      ]
    }
    const rtpRows = filteredRows.value.filter((row) => typeof row.actualRtp === 'number')
    const averageRtp = rtpRows.length
      ? rtpRows.reduce((total, row) => total + (row.actualRtp || 0), 0) / rtpRows.length
      : 0
    return [
      { label: '投注金額', ...summarizeAmount('betAmount') },
      { label: '派彩金額', ...summarizeAmount('payoutAmount') },
      { label: '遊戲商輸贏', ...summarizeAmount('ggr') },
      { label: '平均實際 RTP', value: `${formatNumber(averageRtp, 2)}%`, note: '依目前列平均' }
    ]
  })

  const statusLabel = (status: ReportRowStatus) =>
    ({ Normal: '正常', Attention: '需注意', Pending: '待確認', Completed: '已完成' })[status]
  const statusType = (status: ReportRowStatus) =>
    ({ Normal: 'success', Attention: 'danger', Pending: 'warning', Completed: 'info' })[status] as
      | 'success'
      | 'danger'
      | 'warning'
      | 'info'

  const isNegative = (row: ReportMetricRow, key: ColumnKey) =>
    ['ggr', 'adjustmentAmount', 'settlementAmount'].includes(key) && Number(row[key] || 0) < 0

  const applyFilters = () =>
    router.push({ query: { ...route.query, ...reportFilterQuery(filters), page: '1' } })
  const resetFilters = () =>
    router.push({ path: route.path, query: { summary: props.embeddedMode } })
  const applySummaryFilter = (status: ReportRowStatus) => {
    filters.status = status
    applyFilters()
  }

  const resolveSourcePath = (row: ReportMetricRow) => {
    if (row.gameId) return `/admin/providers/games?game=${encodeURIComponent(row.gameId)}`
    if (row.lineUid && row.merchantId)
      return `/business/merchants/${row.merchantId}/lines/${row.lineUid}`
    if (row.memberId) return `/transactions/members/${row.memberId}`
    if (row.merchantId) return `/business/merchants/${row.merchantId}`
    if (row.agentId) return `/business/agents/${row.agentId}`
    if (mode.value === 'jackpot') return `/jackpots/${row.id.replace('JACKPOT-', '')}`
    if (mode.value === 'bet') return '/transactions/bets'
    if (mode.value === 'transaction') return '/transactions/records'
    if (mode.value === 'merchant-settlement') return '/finance/reconciliation/merchants'
    if (mode.value === 'agent-settlement') return '/finance/reconciliation/agents'
    return '/dashboard'
  }
  const openSource = (row: ReportMetricRow) => router.push(resolveSourcePath(row))

  const exportRows = () => {
    const columns = copy.value.columns.filter((column) => column.kind !== 'status')
    const header = [
      '項目',
      '補充資訊',
      ...columns.map((column) => column.label),
      '狀態',
      '更新時間'
    ]
    const data = filteredRows.value.map((row) => [
      row.primary,
      row.secondary || '',
      ...columns.map((column) => formatCell(row, column)),
      statusLabel(row.status),
      row.updatedAt
    ])
    const csv = [header, ...data].map((cells) => cells.map(reportCsvCell).join(',')).join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    link.download = `${mode.value}-sample-query.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success(`已匯出 ${filteredRows.value.length} 筆報表資料`)
  }

  watch(
    () => route.fullPath,
    () => {
      const next = readReportFilters(route.query)
      Object.assign(filters, next)
      appliedFilters.value = next
      pagination.current = Number(route.query.page || 1)
      pagination.size = Number(route.query.size || 10)
    },
    { immediate: true }
  )
  watch(
    () => filters.agentId,
    () => {
      if (!merchantOptions.value.some((merchant) => merchant.id === filters.merchantId)) {
        filters.merchantId = ''
      }
    }
  )
</script>

<style scoped>
  .query-note {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
  .pagination-row {
    max-width: 100%;
    overflow-x: auto;
  }
  .report-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 24px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-grid button {
    padding: 18px 20px;
    text-align: left;
    cursor: pointer;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: 10px;
  }

  .summary-grid button:hover {
    border-color: var(--el-color-primary);
  }

  .summary-grid span,
  .summary-grid small {
    display: block;
    color: var(--art-gray-600);
  }

  .summary-grid strong {
    display: block;
    margin: 8px 0 4px;
    overflow: hidden;
    font-size: 24px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .summary-grid .warning {
    color: var(--el-color-warning);
  }

  .summary-grid .danger,
  .negative-value {
    color: var(--el-color-danger);
  }

  .filter-card :deep(.el-card__body) {
    padding-bottom: 2px;
  }

  .filter-select {
    width: 180px;
  }

  .table-toolbar {
    display: flex;
    gap: 18px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .table-toolbar > div:first-child {
    display: flex;
    gap: 12px;
    align-items: baseline;
  }

  .table-toolbar strong {
    font-size: 16px;
  }

  .table-toolbar span,
  .table-toolbar small {
    color: var(--art-gray-600);
  }

  .display-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .reference-select {
    width: 100px;
  }

  .entity-link {
    padding: 0;
    color: var(--el-color-primary);
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .entity-link strong,
  .entity-link small {
    display: block;
  }

  .entity-link small {
    margin-top: 3px;
    color: var(--art-gray-600);
  }

  .pagination-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 18px;
  }

  .definition-list {
    margin-top: 18px;
  }

  .drawer-note {
    padding: 16px;
    margin-top: 18px;
    background: var(--art-gray-100);
    border-radius: 8px;
  }

  .drawer-note p {
    margin: 8px 0 0;
    color: var(--art-gray-600);
  }

  @media (width <= 1000px) {
    .summary-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (width <= 680px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .summary-grid button {
      padding: 14px;
    }

    .summary-grid strong {
      font-size: 20px;
    }

    .table-toolbar,
    .table-toolbar > div:first-child {
      align-items: flex-start;
    }

    .table-toolbar {
      flex-direction: column;
    }

    .table-toolbar > div:first-child {
      flex-wrap: wrap;
    }
  }
</style>
