<template>
  <div class="page">
    <ElTabs class="module-tabs" :model-value="activeTab" @tab-change="openTab">
      <ElTabPane label="匯率設定" name="settings" />
      <ElTabPane label="匯率歷史" name="history" />
    </ElTabs>
    <AppPageHeader
      :title="isHistory ? '匯率歷史' : '匯率設定'"
      eyebrow="系統管理 · 匯率管理"
      :description="
        isHistory
          ? '依日期追溯每日取得、調整並鎖定的結算匯率。'
          : '以 USDT 為統一基準，設定各幣別的取得方式、調整規則與生效版本。'
      "
    >
      <template #actions>
        <ElButton v-if="isHistory" disabled>匯出紀錄（未開放）</ElButton>
        <ElButton v-else type="primary" @click="openCreate">新增匯率設定</ElButton>
      </template>
    </AppPageHeader>

    <ElAlert
      :title="
        isHistory
          ? '歷史紀錄為每日鎖定快照；已被結算引用的紀錄不可覆寫，只能建立更正版本。'
          : '目前為前端演示：每日抓取與鎖定以模擬操作呈現，尚未連接外部匯率來源或正式結算排程。'
      "
      :type="isHistory ? 'info' : 'warning'"
      :closable="false"
      show-icon
    />

    <div class="summary-grid">
      <div
        ><span>{{ isHistory ? '歷史快照' : '匯率幣別' }}</span
        ><strong>{{ isHistory ? lockedHistoryCount : store.rateSettings.length }}</strong
        ><small>{{ isHistory ? '包含已鎖定每日紀錄' : '只使用已建立且啟用的幣別' }}</small></div
      >
      <div
        ><span>{{ isHistory ? '今日已鎖定' : '啟用設定' }}</span
        ><strong>{{ isHistory ? todayLockedCount : activeSettingCount }}</strong
        ><small>{{ isHistory ? today : '等待每日排程執行' }}</small></div
      >
      <div
        ><span>啟用匯率來源</span><strong>{{ activeSources.length }}</strong
        ><small>來源異常時不可假造匯率</small></div
      >
      <div
        ><span>{{ isHistory ? '已被結算引用' : '可用幣別' }}</span
        ><strong>{{ isHistory ? settlementUsageTotal : store.enabledCurrencies.length }}</strong
        ><small>{{ isHistory ? '引用後保留快照 ID' : '來自系統幣別主檔' }}</small></div
      >
    </div>

    <ElCard shadow="never" class="filter-card">
      <AppFilterForm class="filter-grid">
        <ElFormItem label="幣別"
          ><ElInput v-model="filters.keyword" clearable placeholder="例如 TWD、ASGU"
        /></ElFormItem>
        <ElFormItem v-if="isHistory" label="匯率日期">
          <ElDatePicker
            v-model="filters.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="開始日期"
            end-placeholder="結束日期"
            class="full"
          />
        </ElFormItem>
        <ElFormItem v-else label="狀態">
          <ElSelect v-model="filters.status" clearable placeholder="全部狀態"
            ><ElOption label="啟用" value="Active" /><ElOption label="停用" value="Inactive"
          /></ElSelect>
        </ElFormItem>
        <ElFormItem label="匯率來源">
          <ElSelect v-model="filters.sourceId" clearable placeholder="全部來源"
            ><ElOption
              v-for="source in store.sources"
              :key="source.id"
              :label="source.name"
              :value="source.id"
          /></ElSelect>
        </ElFormItem>
        <div class="filter-actions"
          ><ElButton type="primary" @click="applyFilters">查詢</ElButton
          ><ElButton @click="resetFilters">重置</ElButton></div
        >
      </AppFilterForm>
    </ElCard>

    <ElCard shadow="never" class="table-card">
      <div class="table-heading">
        <div
          ><strong>{{ isHistory ? '每日匯率歷史' : '匯率設定清單' }}</strong
          ><span>共 {{ filteredRows.length }} 筆</span></div
        >
        <span v-if="!isHistory">調整單位第一版以百分比演示，正式契約確認後再固定</span>
      </div>

      <ArtTable
        v-if="!mobile"
        :data="pagedRows"
        row-key="id"
        height="auto"
        empty-height="auto"
        empty-text="暫無資料"
        :show-table-header="false"
        style="height: auto"
      >
        <template v-if="!isHistory">
          <ElTableColumn label="幣別" min-width="145" fixed="left"
            ><template #default="scope"
              ><strong>{{ scope.row.currency }}</strong
              ><br /><small>{{ scope.row.id }}</small></template
            ></ElTableColumn
          >
          <ElTableColumn label="匯率類型" min-width="120"
            ><template #default="scope">{{
              rateModeLabel(scope.row.rateMode)
            }}</template></ElTableColumn
          >
          <ElTableColumn label="每日取得" min-width="155"
            ><template #default="scope"
              >{{ scope.row.fetchTime }}<br /><small>{{ scope.row.timezone }}</small></template
            ></ElTableColumn
          >
          <ElTableColumn label="匯率來源" min-width="170"
            ><template #default="scope">{{
              sourceName(scope.row.sourceId)
            }}</template></ElTableColumn
          >
          <ElTableColumn label="調整" min-width="115" align="right"
            ><template #default="scope">{{ adjustmentLabel(scope.row) }}</template></ElTableColumn
          >
          <ElTableColumn label="今日鎖定匯率" min-width="185" align="right"
            ><template #default="scope"
              ><strong
                >1 USDT = {{ scope.row.todayRate ? formatRate(scope.row.todayRate) : '—' }}
                {{ scope.row.currency }}</strong
              ><br /><small>{{ scope.row.todayRateDate || '尚無紀錄' }}</small></template
            ></ElTableColumn
          >
          <ElTableColumn label="版本／生效日" min-width="140"
            ><template #default="scope"
              >v{{ scope.row.version }}<br /><small>{{ scope.row.effectiveFrom }}</small></template
            ></ElTableColumn
          >
          <ElTableColumn label="狀態" width="90"
            ><template #default="scope"
              ><ElTag :type="scope.row.status === 'Active' ? 'success' : 'info'">{{
                scope.row.status === 'Active' ? '啟用' : '停用'
              }}</ElTag></template
            ></ElTableColumn
          >
          <ElTableColumn label="操作" width="210" fixed="right"
            ><template #default="scope"
              ><ElButton link type="primary" @click="openEdit(scope.row)">編輯</ElButton
              ><ElButton link type="primary" @click="lockToday(scope.row)">模擬鎖定</ElButton
              ><ElButton link @click="goHistory(scope.row)">歷史</ElButton></template
            ></ElTableColumn
          >
        </template>
        <template v-else>
          <ElTableColumn prop="date" label="匯率日期" width="120" fixed="left" />
          <ElTableColumn label="幣別" min-width="135"
            ><template #default="scope"
              ><strong>{{ scope.row.toCurrency }}</strong
              ><br /><small>基準 USDT · {{ scope.row.id }}</small></template
            ></ElTableColumn
          >
          <ElTableColumn label="來源匯率" min-width="125" align="right"
            ><template #default="scope">{{
              `1 USDT = ${formatRate(scope.row.baseRate)}`
            }}</template></ElTableColumn
          >
          <ElTableColumn label="調整" width="95" align="right"
            ><template #default="scope">{{
              signedPercent(scope.row.adjustmentPercent)
            }}</template></ElTableColumn
          >
          <ElTableColumn label="最終鎖定匯率" min-width="145" align="right"
            ><template #default="scope"
              ><strong>1 USDT = {{ formatRate(scope.row.finalRate) }}</strong></template
            ></ElTableColumn
          >
          <ElTableColumn label="取得／鎖定時間" min-width="185"
            ><template #default="scope"
              >{{ scope.row.fetchedAt || scope.row.publishedAt || scope.row.updatedAt
              }}<br /><small>{{ scope.row.lockedAt || '—' }}</small></template
            ></ElTableColumn
          >
          <ElTableColumn label="設定版本" width="100" align="center"
            ><template #default="scope"
              >v{{ scope.row.settingVersion || 1 }}</template
            ></ElTableColumn
          >
          <ElTableColumn label="結算引用" width="100" align="right"
            ><template #default="scope">{{
              scope.row.settlementUsageCount || 0
            }}</template></ElTableColumn
          >
          <ElTableColumn label="操作" width="90" fixed="right"
            ><template #default="scope"
              ><ElButton link type="primary" @click="openHistory(scope.row)"
                >查看</ElButton
              ></template
            ></ElTableColumn
          >
        </template>
      </ArtTable>

      <div v-else-if="!isHistory" class="mobile-list">
        <article v-for="row in pagedSettingRows" :key="row.id" class="mobile-card">
          <div class="mobile-card__heading">
            <div
              ><strong>{{ row.currency }}</strong
              ><small>{{ row.id }}</small></div
            >
            <ElTag :type="row.status === 'Active' ? 'success' : 'info'">{{
              row.status === 'Active' ? '啟用' : '停用'
            }}</ElTag>
          </div>
          <dl
            ><div
              ><dt>來源</dt><dd>{{ sourceName(row.sourceId) }}</dd></div
            ><div
              ><dt>類型</dt><dd>{{ rateModeLabel(row.rateMode) }}</dd></div
            ><div
              ><dt>每日取得</dt><dd>{{ row.fetchTime }} · {{ row.timezone }}</dd></div
            ><div
              ><dt>調整</dt><dd>{{ adjustmentLabel(row) }}</dd></div
            ><div
              ><dt>今日匯率</dt
              ><dd
                >1 USDT = {{ row.todayRate ? formatRate(row.todayRate) : '—' }}
                {{ row.currency }}</dd
              ></div
            ></dl
          >
          <div class="mobile-actions"
            ><ElButton size="small" @click="openEdit(row)">編輯</ElButton
            ><ElButton size="small" type="primary" plain @click="lockToday(row)">模擬鎖定</ElButton
            ><ElButton size="small" @click="goHistory(row)">歷史</ElButton></div
          >
        </article>
      </div>
      <div v-else class="mobile-list">
        <article v-for="row in pagedHistoryRows" :key="row.id" class="mobile-card">
          <div class="mobile-card__heading"
            ><div
              ><strong>{{ row.toCurrency }}</strong
              ><small>{{ row.date }} · {{ row.id }}</small></div
            ><ElTag type="info">已鎖定</ElTag></div
          >
          <dl
            ><div
              ><dt>來源匯率</dt><dd>1 USDT = {{ formatRate(row.baseRate) }}</dd></div
            ><div
              ><dt>調整</dt><dd>{{ signedPercent(row.adjustmentPercent) }}</dd></div
            ><div
              ><dt>最終匯率</dt><dd>1 USDT = {{ formatRate(row.finalRate) }}</dd></div
            ><div
              ><dt>結算引用</dt><dd>{{ row.settlementUsageCount || 0 }}</dd></div
            ></dl
          >
          <div class="mobile-actions"
            ><ElButton size="small" type="primary" plain @click="openHistory(row)"
              >查看詳情</ElButton
            ></div
          >
        </article>
      </div>

      <div class="pagination-row"
        ><ElPagination
          v-model:current-page="pageNumber"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredRows.length"
          layout="total, sizes, prev, pager, next"
      /></div>
    </ElCard>

    <ElDrawer
      v-model="settingDrawer"
      :title="editingId ? '編輯匯率設定' : '新增匯率設定'"
      size="min(620px, 100vw)"
    >
      <ElAlert
        title="每個幣別只維護一條對 USDT 的匯率。儲存修改會建立新版本，不回寫既有歷史快照。"
        type="info"
        :closable="false"
        show-icon
      />
      <ElForm label-position="top" class="drawer-form">
        <div class="anchor-card">
          <div><span>基準幣別</span><strong>USDT</strong></div>
          <p>所有匯率統一表示為「1 USDT 等於多少該幣別」。</p>
        </div>
        <ElFormItem label="幣別" required
          ><ElSelect v-model="form.currency" class="full" :disabled="Boolean(editingId)"
            ><ElOption
              v-for="item in availableRateCurrencies"
              :key="item.code"
              :label="`${item.code}｜${item.name}`"
              :value="item.code" /></ElSelect
        ></ElFormItem>
        <div class="form-grid">
          <ElFormItem label="匯率類型" required
            ><ElSelect v-model="form.rateMode" class="full"
              ><ElOption label="市場匯率" value="Market" /><ElOption
                label="固定錨定"
                value="Pegged" /><ElOption label="人工匯率" value="Manual" /></ElSelect
          ></ElFormItem>
          <ElFormItem
            v-if="form.rateMode !== 'Market'"
            :label="form.rateMode === 'Pegged' ? '固定錨定匯率' : '人工來源匯率'"
            required
            ><ElInputNumber
              v-model="form.fixedRate"
              :min="0.00000001"
              :precision="8"
              class="full" /></ElFormItem
          ><ElFormItem v-else label="匯率方向"
            ><ElInput model-value="1 USDT = ? 目標幣別" disabled
          /></ElFormItem>
        </div>
        <ElFormItem label="匯率來源" required
          ><ElSelect v-model="form.sourceId" class="full" :disabled="form.rateMode === 'Pegged'"
            ><ElOption
              v-for="item in activeSources"
              :key="item.id"
              :label="item.name"
              :value="item.id" /></ElSelect
        ></ElFormItem>
        <div class="form-grid"
          ><ElFormItem label="每日取得時間" required
            ><ElTimePicker
              v-model="form.fetchTime"
              value-format="HH:mm"
              format="HH:mm"
              class="full" /></ElFormItem
          ><ElFormItem label="時區" required
            ><ElSelect v-model="form.timezone" class="full"
              ><ElOption label="Asia/Taipei (UTC+8)" value="Asia/Taipei" /><ElOption
                label="UTC"
                value="UTC" /></ElSelect></ElFormItem
        ></div>
        <div class="form-grid"
          ><ElFormItem label="加減設定" required
            ><ElSelect
              v-model="form.adjustmentDirection"
              class="full"
              :disabled="form.rateMode === 'Pegged'"
              ><ElOption label="不調整" value="None" /><ElOption label="加" value="Plus" /><ElOption
                label="減"
                value="Minus" /></ElSelect></ElFormItem
          ><ElFormItem label="調整值（百分比演示）" :required="form.adjustmentDirection !== 'None'"
            ><ElInputNumber
              v-model="form.adjustmentPercent"
              :min="0"
              :max="20"
              :precision="4"
              :disabled="form.adjustmentDirection === 'None' || form.rateMode === 'Pegged'"
              class="full" /></ElFormItem
        ></div>
        <div class="form-grid"
          ><ElFormItem label="小數精度" required
            ><ElSelect v-model="form.precision" class="full"
              ><ElOption
                v-for="value in [2, 4, 6, 8]"
                :key="value"
                :label="`${value} 位`"
                :value="value" /></ElSelect></ElFormItem
          ><ElFormItem label="捨入規則" required
            ><ElSelect v-model="form.roundingRule" class="full"
              ><ElOption
                v-for="rule in roundingRules"
                :key="rule"
                :label="rule"
                :value="rule" /></ElSelect></ElFormItem
        ></div>
        <div class="form-grid"
          ><ElFormItem label="生效日期" required
            ><ElDatePicker
              v-model="form.effectiveFrom"
              value-format="YYYY-MM-DD"
              class="full" /></ElFormItem
          ><ElFormItem label="狀態" required
            ><ElSelect v-model="form.status" class="full"
              ><ElOption label="啟用" value="Active" /><ElOption
                label="停用"
                value="Inactive" /></ElSelect></ElFormItem
        ></div>
      </ElForm>
      <template #footer
        ><ElButton @click="settingDrawer = false">取消</ElButton
        ><ElButton type="primary" @click="saveSetting">儲存設定</ElButton></template
      >
    </ElDrawer>

    <ElDrawer v-model="historyDrawer" title="匯率快照詳情" size="min(560px, 100vw)">
      <template v-if="selectedHistory"
        ><ElAlert
          title="此快照只供查詢與結算引用；如需修正，應建立更正版本並保留原紀錄。"
          type="warning"
          :closable="false"
          show-icon
        /><ElDescriptions :column="1" border class="history-detail"
          ><ElDescriptionsItem label="快照 ID">{{ selectedHistory.id }}</ElDescriptionsItem
          ><ElDescriptionsItem label="匯率日期">{{ selectedHistory.date }}</ElDescriptionsItem
          ><ElDescriptionsItem label="基準幣別">USDT</ElDescriptionsItem
          ><ElDescriptionsItem label="幣別">{{ selectedHistory.toCurrency }}</ElDescriptionsItem
          ><ElDescriptionsItem label="匯率類型">{{
            rateModeLabel(selectedHistory.rateMode || 'Market')
          }}</ElDescriptionsItem
          ><ElDescriptionsItem label="匯率來源">{{
            sourceName(selectedHistory.sourceId)
          }}</ElDescriptionsItem
          ><ElDescriptionsItem label="來源匯率">{{
            `1 USDT = ${formatRate(selectedHistory.baseRate)} ${selectedHistory.toCurrency}`
          }}</ElDescriptionsItem
          ><ElDescriptionsItem label="加減調整">{{
            signedPercent(selectedHistory.adjustmentPercent)
          }}</ElDescriptionsItem
          ><ElDescriptionsItem label="最終鎖定匯率">{{
            `1 USDT = ${formatRate(selectedHistory.finalRate)} ${selectedHistory.toCurrency}`
          }}</ElDescriptionsItem
          ><ElDescriptionsItem label="取得時間">{{
            selectedHistory.fetchedAt || selectedHistory.publishedAt || selectedHistory.updatedAt
          }}</ElDescriptionsItem
          ><ElDescriptionsItem label="鎖定時間">{{
            selectedHistory.lockedAt || '—'
          }}</ElDescriptionsItem
          ><ElDescriptionsItem label="設定版本"
            >v{{ selectedHistory.settingVersion || 1 }}</ElDescriptionsItem
          ><ElDescriptionsItem label="結算引用次數">{{
            selectedHistory.settlementUsageCount || 0
          }}</ElDescriptionsItem></ElDescriptions
        ></template
      >
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { ElMessage } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import type {
    DailyExchangeRateRecord,
    ExchangeRateSettingRecord,
    FinanceRoundingRule
  } from '@/types/game-provider'

  defineOptions({ name: 'SystemExchangeRateManagement' })
  const route = useRoute()
  const router = useRouter()
  const store = useFinanceSettingsStore()
  const activeTab = computed(() => (route.query.tab === 'history' ? 'history' : 'settings'))
  const isHistory = computed(() => activeTab.value === 'history')
  const today = new Date().toLocaleDateString('sv-SE')
  const mobile = ref(window.innerWidth <= 720)
  const pageNumber = ref(1)
  const pageSize = ref(10)
  const filters = reactive<{
    keyword: string
    status: string
    sourceId: string
    dateRange: string[]
  }>({
    keyword: String(route.query.currency || route.query.pair || '').replace(/^USDT\//, ''),
    status: '',
    sourceId: '',
    dateRange: []
  })
  const settingDrawer = ref(false)
  const historyDrawer = ref(false)
  const editingId = ref('')
  const selectedHistory = ref<DailyExchangeRateRecord>()
  const roundingRules: FinanceRoundingRule[] = [
    '四捨五入',
    '無條件捨去',
    '無條件進位',
    '銀行家捨入'
  ]
  const emptyForm = () => ({
    currency: '',
    baseCurrency: 'USDT' as const,
    rateMode: 'Market' as ExchangeRateSettingRecord['rateMode'],
    fixedRate: undefined as number | undefined,
    sourceId: 'FXS-002',
    fetchTime: '02:00',
    timezone: 'Asia/Taipei',
    adjustmentDirection: 'None' as ExchangeRateSettingRecord['adjustmentDirection'],
    adjustmentPercent: 0,
    precision: 6,
    roundingRule: '四捨五入' as FinanceRoundingRule,
    effectiveFrom: today,
    status: 'Active' as ExchangeRateSettingRecord['status'],
    todayRate: undefined as number | undefined,
    todayRateDate: undefined as string | undefined
  })
  const form = reactive(emptyForm())
  const activeSources = computed(() => store.sources.filter((item) => item.status === 'Active'))
  const availableRateCurrencies = computed(() =>
    store.enabledCurrencies.filter(
      (item) =>
        item.code !== 'USDT' &&
        (item.code === form.currency ||
          !store.rateSettings.some((setting) => setting.currency === item.code))
    )
  )
  const activeSettingCount = computed(
    () => store.rateSettings.filter((item) => item.status === 'Active').length
  )
  const todayLockedCount = computed(
    () => store.dailyRates.filter((item) => item.date === today && item.status === 'Locked').length
  )
  const lockedHistoryCount = computed(
    () => store.dailyRates.filter((item) => item.status === 'Locked').length
  )
  const settlementUsageTotal = computed(() =>
    store.dailyRates.reduce((sum, item) => sum + (item.settlementUsageCount || 0), 0)
  )
  const filteredRows = computed(() => {
    const rows = isHistory.value
      ? store.dailyRates.filter((item) => item.status === 'Locked')
      : store.rateSettings
    return rows.filter((row) => {
      const currency = isHistory.value
        ? (row as DailyExchangeRateRecord).toCurrency
        : (row as ExchangeRateSettingRecord).currency
      const currencyName = store.currencies.find((item) => item.code === currency)?.name || ''
      const searchText = `${currency} ${currencyName}`.toLowerCase()
      if (
        filters.keyword &&
        !searchText.includes(filters.keyword.replaceAll(' ', '').toLowerCase())
      )
        return false
      if (filters.sourceId && row.sourceId !== filters.sourceId) return false
      if (!isHistory.value && filters.status && row.status !== filters.status) return false
      if (isHistory.value && filters.dateRange.length === 2) {
        const history = row as DailyExchangeRateRecord
        if (history.date < filters.dateRange[0] || history.date > filters.dateRange[1]) return false
      }
      return true
    })
  })
  const pagedRows = computed(() =>
    filteredRows.value.slice(
      (pageNumber.value - 1) * pageSize.value,
      pageNumber.value * pageSize.value
    )
  )
  const pagedSettingRows = computed(() =>
    store.rateSettings
      .filter((row) => filteredRows.value.includes(row))
      .slice((pageNumber.value - 1) * pageSize.value, pageNumber.value * pageSize.value)
  )
  const pagedHistoryRows = computed(() =>
    store.dailyRates
      .filter((row) => filteredRows.value.includes(row))
      .slice((pageNumber.value - 1) * pageSize.value, pageNumber.value * pageSize.value)
  )
  const sourceName = (id: string) => store.sources.find((item) => item.id === id)?.name || id
  const formatRate = (value: number) =>
    value.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
  const signedPercent = (value: number) => `${value > 0 ? '+' : ''}${value}%`
  const rateModeLabel = (mode: ExchangeRateSettingRecord['rateMode']) =>
    ({ Market: '市場匯率', Pegged: '固定錨定', Manual: '人工匯率' })[mode]
  const adjustmentLabel = (row: ExchangeRateSettingRecord) =>
    row.adjustmentDirection === 'None'
      ? '不調整'
      : `${row.adjustmentDirection === 'Plus' ? '+' : '-'}${row.adjustmentPercent}%`
  const applyFilters = () => {
    pageNumber.value = 1
    ElMessage.success('已更新查詢結果')
  }
  const openTab = (tab: string | number) =>
    router.replace({
      path: '/platform/exchange-rates',
      query: tab === 'history' ? { tab: 'history' } : {}
    })
  const resetFilters = () => {
    Object.assign(filters, { keyword: '', status: '', sourceId: '', dateRange: [] })
    pageNumber.value = 1
  }
  const openCreate = () => {
    editingId.value = ''
    Object.assign(form, emptyForm())
    settingDrawer.value = true
  }
  const openEdit = (row: ExchangeRateSettingRecord) => {
    editingId.value = row.id
    Object.assign(form, {
      currency: row.currency,
      baseCurrency: row.baseCurrency,
      rateMode: row.rateMode,
      fixedRate: row.fixedRate,
      sourceId: row.sourceId,
      fetchTime: row.fetchTime,
      timezone: row.timezone,
      adjustmentDirection: row.adjustmentDirection,
      adjustmentPercent: row.adjustmentPercent,
      precision: row.precision,
      roundingRule: row.roundingRule,
      effectiveFrom: row.effectiveFrom,
      status: row.status,
      todayRate: row.todayRate,
      todayRateDate: row.todayRateDate
    })
    settingDrawer.value = true
  }
  const saveSetting = () => {
    if (!form.currency || !form.sourceId || !form.fetchTime || !form.effectiveFrom)
      return ElMessage.warning('請完成所有必填欄位')
    if (form.rateMode !== 'Market' && (!form.fixedRate || form.fixedRate <= 0))
      return ElMessage.warning('請輸入大於 0 的固定或人工匯率')
    const duplicate = store.rateSettings.some(
      (item) => item.id !== editingId.value && item.currency === form.currency
    )
    if (duplicate) return ElMessage.warning('此幣別已建立匯率設定，請直接編輯原設定')
    if (form.adjustmentDirection === 'None' || form.rateMode === 'Pegged')
      form.adjustmentPercent = 0
    store.saveRateSetting({ ...form }, editingId.value || undefined)
    settingDrawer.value = false
    ElMessage.success(editingId.value ? '匯率設定已建立新版本' : '匯率設定已新增')
  }
  const lockToday = (row: ExchangeRateSettingRecord) => {
    const result = store.simulateDailyLock(row.id)
    if (!result.ok) return ElMessage.warning(result.reason)
    ElMessage.success('今日匯率已模擬抓取並鎖定')
  }
  const goHistory = (row: ExchangeRateSettingRecord) =>
    router.push({
      path: '/platform/exchange-rates',
      query: { tab: 'history', currency: row.currency }
    })
  const openHistory = (row: DailyExchangeRateRecord) => {
    selectedHistory.value = row
    historyDrawer.value = true
  }
  const onResize = () => (mobile.value = window.innerWidth <= 720)
  onMounted(() => window.addEventListener('resize', onResize))
  onBeforeUnmount(() => window.removeEventListener('resize', onResize))
  watch(
    () => [route.query.tab, route.query.currency, route.query.pair],
    () => {
      filters.keyword = String(route.query.currency || route.query.pair || '').replace(
        /^USDT\//,
        ''
      )
      pageNumber.value = 1
    }
  )
  watch(
    () => form.rateMode,
    (mode) => {
      if (mode === 'Pegged') {
        form.sourceId = 'FXS-001'
        form.adjustmentDirection = 'None'
        form.adjustmentPercent = 0
        if (!form.fixedRate) form.fixedRate = 1
      } else if (mode === 'Manual') {
        form.sourceId = 'FXS-003'
      } else {
        form.sourceId = 'FXS-002'
        form.fixedRate = undefined
      }
    }
  )
</script>

<style scoped lang="scss">
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 24px;
    min-width: 0;
  }
  .module-tabs :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .summary-grid > div {
    padding: 18px 20px;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
    min-width: 0;
  }
  .summary-grid span,
  .summary-grid small {
    display: block;
    color: var(--art-gray-600);
  }
  .summary-grid strong {
    display: block;
    margin: 8px 0 4px;
    font-size: 26px;
  }
  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
    gap: 12px;
    align-items: end;
  }
  .filter-grid :deep(.el-form-item) {
    margin: 0;
  }
  .filter-actions {
    display: flex;
    padding-bottom: 1px;
  }
  .full {
    width: 100%;
  }
  .table-heading {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: baseline;
    margin-bottom: 16px;
    color: var(--art-gray-600);
  }
  .table-heading > div {
    display: flex;
    gap: 12px;
    align-items: baseline;
  }
  .table-heading strong {
    color: var(--art-text-gray-900);
    font-size: 16px;
  }
  small {
    color: var(--art-gray-600);
  }
  .pagination-row {
    display: flex;
    justify-content: flex-end;
    padding-top: 16px;
    overflow-x: auto;
  }
  .drawer-form {
    margin-top: 20px;
  }
  .anchor-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    margin-bottom: 18px;
    border: 1px solid var(--el-color-primary-light-5);
    border-radius: var(--el-border-radius-base);
    background: var(--el-color-primary-light-9);
  }
  .anchor-card span {
    display: block;
    color: var(--art-gray-600);
    font-size: 12px;
  }
  .anchor-card strong {
    display: block;
    margin-top: 3px;
    color: var(--el-color-primary);
    font-size: 20px;
  }
  .anchor-card p {
    margin: 0;
    color: var(--art-gray-600);
    text-align: right;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .history-detail {
    margin-top: 20px;
  }
  .mobile-list {
    display: grid;
    gap: 12px;
  }
  .mobile-card {
    padding: 14px;
    border: 1px solid var(--art-border-color);
    border-radius: var(--el-border-radius-base);
    background: var(--art-main-bg-color);
  }
  .mobile-card__heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: flex-start;
  }
  .mobile-card__heading small {
    display: block;
    margin-top: 4px;
  }
  dl {
    display: grid;
    gap: 8px;
    margin: 14px 0;
  }
  dl > div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
  }
  dt {
    color: var(--art-gray-600);
  }
  dd {
    margin: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .mobile-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--art-border-color);
  }
  .mobile-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  @media (width <= 1080px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .filter-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (width <= 720px) {
    .summary-grid,
    .filter-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }
    .table-heading {
      flex-direction: column;
      align-items: flex-start;
    }
    .filter-actions {
      width: 100%;
    }
    .filter-actions :deep(.el-button) {
      flex: 1;
    }
    .pagination-row {
      justify-content: flex-start;
    }
    .anchor-card {
      align-items: flex-start;
      flex-direction: column;
    }
    .anchor-card p {
      text-align: left;
    }
  }
</style>
