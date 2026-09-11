<template>
  <section class="integrated">
    <div class="toolbar">
      <h2>{{ title }} · {{ month }} 對帳</h2>
      <ElSelect v-model="cycle" aria-label="結算週期" style="width: 120px">
        <ElOption label="日結" value="Daily" /><ElOption label="週結" value="Weekly" /><ElOption
          label="月結"
          value="Monthly"
        />
      </ElSelect>
      <ElDatePicker
        v-model="month"
        :type="cycle === 'Monthly' ? 'month' : 'date'"
        :value-format="cycle === 'Monthly' ? 'YYYY-MM' : 'YYYY-MM-DD'"
        :clearable="false"
        aria-label="帳期"
      />
      <span>結算日期</span>
      <ElDatePicker
        v-model="settlementDate"
        type="date"
        value-format="YYYY-MM-DD"
        :disabled="!!locked || cycle === 'Monthly'"
        :clearable="false"
        aria-label="結算日期"
      />
      <small class="settlement-date-source" :class="{ 'is-error': !!contractSettlement.issue }">{{
        settlementDateSource
      }}</small>
      <ElButton @click="reload">重新載入帳本</ElButton>
      <ElButton
        type="primary"
        :disabled="
          !canLock ||
          !!locked ||
          !!failure ||
          !result ||
          result.lines.some((l) => !!l.issue) ||
          (!result.lines.length && !result.carry.length && !adjustments.length && !openingPayment)
        "
        @click="openDelivery"
        >{{ locked ? '已鎖定' : '交付作業' }}</ElButton
      >
      <ElButton :disabled="!locked" @click="month = cycleBounds(month, cycle).next"
        >前往下一期</ElButton
      >
    </div>
    <p
      >單號：{{ locked?.id || `${stream}:${input.month}` }} ·
      {{ locked ? `鎖定時間 ${locked.lockedAt}` : '未鎖定草稿' }}</p
    >
    <ElAlert v-if="failure" type="error" :title="failure" :closable="false" />
    <p v-if="!locked"
      >上期未收／未付結轉（不含負 GGR）：{{
        previousDelivery
          .filter((d) => d.carriedMinor !== 0)
          .map((d) => `${d.currency} ${format(d.carriedMinor, d.digits)}`)
          .join('、') || '無'
      }}</p
    >
    <ElCard v-if="locked?.delivery" shadow="never">
      <template #header>交付結果 · 已鎖定 · {{ locked.input.confirmedBy || '—' }}</template>
      <p v-for="d in locked.delivery" :key="d.currency"
        >{{ d.currency }} · {{ d.status }}｜上期未收／未付結轉
        {{ format(d.openingMinor, d.digits) }}｜差異調整
        {{ format(d.differenceMicros, 6) }}｜調整後應結 {{ format(d.dueMinor, d.digits) }}｜{{
          paymentLabel
        }}
        {{ format(d.paidMinor, d.digits) }}｜結轉下期 {{ format(d.carriedMinor, d.digits)
        }}<br />原因：{{ d.reason || '—' }}</p
      >
    </ElCard>
    <ElDialog
      v-model="deliveryOpen"
      title="財務核帳／交付"
      width="min(96vw, 960px)"
      :close-on-click-modal="false"
    >
      <p
        >核對系統金額後填寫差異及{{
          paymentLabel
        }}。確認交付將鎖定本期；剩餘未收付可累積至下期，與負 GGR 扣抵分開保存。</p
      >
      <ElCard v-for="d in deliveryEntries" :key="d.currency" shadow="never" class="delivery-card">
        <template #header
          >{{ d.currency }} · 系統本期應結（含上期回調）
          {{
            format(
              result?.totals.find((t) => t.currency === d.currency)?.amount || 0,
              input.precision[d.currency]
            )
          }}</template
        >
        <p
          >上期未收／未付結轉：{{
            format(
              previousDelivery.find((p) => p.currency === d.currency)?.carriedMinor || 0,
              input.precision[d.currency]
            )
          }}</p
        >
        <div class="adjustment-row">
          <label
            >差異調整金額（正加／負減）<ElInputNumber
              v-model="d.difference"
              :precision="6"
              aria-label="差異調整金額"
          /></label>
          <label
            >{{ paymentLabel
            }}<ElInputNumber v-model="d.paid" :min="0" :precision="0" :aria-label="paymentLabel"
          /></label>
          <label
            >差異／結轉原因<ElInput
              v-model="d.reason"
              aria-label="交付原因"
              placeholder="有差異或結轉時必填"
          /></label>
        </div>
        <ElButton :type="d.defer ? 'primary' : 'default'" @click="d.defer = !d.defer">{{
          d.defer ? '已選擇累積至下期（點擊取消）' : '累積至下期'
        }}</ElButton>
        <p v-if="deliveryPreview.rows.find((p) => p.currency === d.currency)"
          >調整後應結
          {{
            format(
              deliveryPreview.rows.find((p) => p.currency === d.currency)!.dueMinor,
              input.precision[d.currency]
            )
          }}
          · 剩餘未收付
          {{
            format(
              deliveryPreview.rows.find((p) => p.currency === d.currency)!.remainingMinor,
              input.precision[d.currency]
            )
          }}</p
        >
      </ElCard>
      <ElAlert
        v-if="deliveryPreview.error"
        :title="deliveryPreview.error"
        type="warning"
        :closable="false"
      />
      <template #footer
        ><ElButton @click="deliveryOpen = false">取消</ElButton
        ><ElButton
          type="primary"
          :disabled="
            !!deliveryPreview.error ||
            deliveryPreview.rows.some((d) => d.remainingMinor !== 0 && !d.defer)
          "
          @click="lock"
          >確認交付並鎖定</ElButton
        ></template
      >
    </ElDialog>
    <ElCard shadow="never">
      <template #header>上期退款／回調</template>
      <p>填入已核對的結算幣調整金額：正數增加應結、負數減少應結。原已鎖定單不回改。</p>
      <div v-for="(a, index) in adjustments" :key="index" class="adjustment-row">
        <ElInput v-model="a.id" placeholder="回調識別" aria-label="回調識別" :disabled="!!locked" />
        <ElInput
          v-model="a.originalStatementId"
          placeholder="原已鎖定單號"
          aria-label="原已鎖定單號"
          :disabled="!!locked"
        />
        <ElInput
          v-model="a.sourceBetId"
          placeholder="原交易編號"
          aria-label="原交易編號"
          :disabled="!!locked"
        />
        <ElInput
          v-model="a.currency"
          placeholder="結算幣"
          aria-label="回調結算幣"
          :disabled="!!locked"
        />
        <ElInputNumber
          v-model="a.amount"
          :precision="6"
          aria-label="回調金額"
          :disabled="!!locked"
        />
        <ElInput
          v-model="a.reason"
          placeholder="退款／回調原因"
          aria-label="回調原因"
          :disabled="!!locked"
        />
        <ElButton v-if="!locked" @click="adjustments.splice(index, 1)">移除</ElButton>
      </div>
      <ElButton
        v-if="!locked && canLock"
        @click="
          adjustments.push({
            id: '',
            originalStatementId: '',
            sourceBetId: '',
            currency: '',
            amount: 0,
            reason: ''
          })
        "
        >新增回調</ElButton
      >
      <p v-for="a in locked?.input.adjustments || []" :key="a.id"
        >{{ a.id }} · {{ a.currency }} {{ format(a.amountMicros, 6) }} · 原單
        {{ a.originalStatementId }}／{{ a.sourceBetId }} · {{ a.reason }}</p
      >
    </ElCard>
    <template v-if="result">
      <div class="metrics">
        <div v-for="s in sums" :key="s.currency"
          ><strong
            >{{ s.currency }} 最終應結：{{
              s.pending ? '待補資料' : format(s.amount, s.digits)
            }}</strong
          ><p>換為結算幣扣抵，加上上期退款／回調後，最後總額四捨五入</p></div
        >
      </div>
      <ElCard shadow="never">
        <ElTabs v-model="tab">
          <ElTabPane label="對帳摘要" name="summary"
            ><p
              >本期 {{ result.lines.length }} 組每日明細，{{
                games.length
              }}
              筆交易中心下注。各分頁共用同一份{{ locked ? '已鎖定快照' : '草稿結果' }}。</p
            ><p
              >時區 {{ effectiveInput.timezone }}；各分組先乘合約費率，再統一使用結算日
              {{ effectiveInput.settlementDate || '舊版每日匯率' }}
              的匯率換算，逐筆保留六位，加總扣抵後才按結算幣精度取位。帳期
              {{ periodRange.start }} 至 {{ periodRange.end }}，假日照算。</p
            ></ElTabPane
          >
          <ElTabPane label="每日彙總" name="daily" />
          <ElTabPane label="遊戲彙總" name="games" />
          <ElTabPane label="結算單" name="statement" />
          <ElTabPane label="操作紀錄" name="logs"
            ><p>{{
              locked
                ? `${locked.lockedAt} · 確認並鎖定；快照及期末餘額同步保存`
                : '尚未鎖單，不寫入跨期帳本'
            }}</p></ElTabPane
          >
        </ElTabs>
        <template v-if="tab === 'statement'">
          <h3>商務條件與計算依據</h3>
          <p
            >下表列出本期各供應商適用的計費基礎、費率、版本、負 GGR
            政策及結算日匯率；鎖定後保留當時快照。</p
          >
          <p
            >結算週期：{{
              effectiveInput.cycle === 'Daily'
                ? '日結'
                : effectiveInput.cycle === 'Weekly'
                  ? '週結'
                  : '月結'
            }}
            · 結算日期：{{ effectiveInput.settlementDate }} ·
            計算保留六位，最終總額依幣別精度四捨五入。</p
          >
          <ElDescriptions v-if="archive" :column="1" border>
            <ElDescriptionsItem label="原始單據"
              >{{ archive.id }} ·
              {{ archive.period }}（保留原始快照，不以目前條件覆寫）</ElDescriptionsItem
            >
            <ElDescriptionsItem
              v-for="key in [
                'settlementBasis',
                'ratePercent',
                'transactionCurrency',
                'settlementCurrency',
                'exchangeRate',
                'exchangeRateTime',
                'formulaVersion'
              ]"
              :key="key"
              :label="archiveLabels[key]"
              >{{ archive.snapshot[key] ?? '未保存' }}</ElDescriptionsItem
            >
          </ElDescriptions>
        </template>
        <template v-if="['daily', 'games', 'statement'].includes(tab)">
          <ElSelect v-model="provider" placeholder="全部供應商" clearable class="provider-filter"
            ><ElOption v-for="id in providerIds" :key="id" :value="id" :label="providerName(id)"
          /></ElSelect>
          <p class="table-scroll-hint" role="note">
            ↔ 表格可左右捲動；結算日匯率與應結金額固定顯示在右側。
          </p>
          <ArtTable :data="visible" height="auto" style="height: auto" :show-table-header="false">
            <ElTableColumn prop="date" label="日期" width="115" />
            <ElTableColumn label="供應商" min-width="150"
              ><template #default="{ row }">{{
                providerName(row.providerId)
              }}</template></ElTableColumn
            >
            <ElTableColumn v-if="tab === 'games'" label="遊戲／來源" min-width="220"
              ><template #default="{ row }"
                >{{ row.sources.map((b: any) => b.game).join('、') }}<br />{{
                  row.sources.length
                }}
                筆</template
              ></ElTableColumn
            >
            <ElTableColumn prop="currency" label="原幣" width="85" />
            <ElTableColumn label="投注／有效投注／派彩" min-width="190"
              ><template #default="{ row }"
                >{{ format(row.bet, 2) }} / {{ format(row.valid, 2) }} /
                {{ format(row.payout, 2) }}</template
              ></ElTableColumn
            >
            <ElTableColumn label="GGR／計費基數" min-width="150"
              ><template #default="{ row }"
                >{{ format(row.ggr, 2) }} / {{ format(row.base, 2) }}</template
              ></ElTableColumn
            >
            <ElTableColumn label="條件／政策" min-width="210"
              ><template #default="{ row }"
                >{{ row.basis }} × {{ row.rate }}% ·
                {{
                  row.negativeGgr === 'carry'
                    ? '累積'
                    : row.negativeGgr === 'zero'
                      ? '清零'
                      : '待確認'
                }}<br />{{ row.version }}</template
              ></ElTableColumn
            >
            <ElTableColumn label="結算日匯率快照" width="190" fixed="right"
              ><template #default="{ row }"
                >{{ row.fxDate || row.date }}<br />{{ row.fxRate || '待補' }} /
                {{ row.fxVersion || '待補' }}</template
              ></ElTableColumn
            >
            <ElTableColumn label="應結" width="170" fixed="right"
              ><template #default="{ row }"
                >{{ row.settlementCurrency }}
                {{ row.settled === null ? '未計算' : format(row.settled, row.digits) }}<br />{{
                  row.issue
                }}</template
              ></ElTableColumn
            >
          </ArtTable>
          <p v-if="tab === 'games'"
            >依每日計費分組列出遊戲來源，應結金額屬整組，不逐遊戲重複計費。</p
          >
        </template>
        <h3>負 GGR 扣抵／結轉（結算幣，六位精度）</h3>
        <p v-for="c in result.carry" :key="c.scope"
          >{{ providerName(c.scope.split(':')[2]) }}
          {{ c.scope.split(':')[3] }}：本期費率換算後正負金額 {{ format(c.net, 6) }}｜上期結轉
          {{ format(c.opening, 6) }}／本期使用扣抵 {{ format(c.used, 6) }}／本期新增結轉
          {{ format(c.added, 6) }}／結轉下期
          {{ c.closing === null ? '待補' : format(c.closing, 6) }}
          {{ c.net < 0 && c.added === 0 && !c.pending ? '（本期負值依合約清零）' : '' }}</p
        >
      </ElCard>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useSettlementActivity } from '@/composables/useSettlementActivity'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { useUserStore } from '@/store/modules/user'
  import {
    LEDGER_KEY,
    readLedger,
    prepareStatement,
    lockStatement,
    prepareDelivery,
    type SettlementInput
  } from '@/domain/settlement-ledger'
  import { cycleBounds, type SettlementCycle } from '@/domain/settlement-cycle'
  import { monthlySettlementDate } from '@/domain/admin-supplier-costs'
  const props = defineProps<{
    kind: 'provider' | 'agent' | 'merchant'
    ownerId: string
    title: string
    providerId?: string
    archive?: { id: string; period: string; snapshot: Record<string, unknown> }
  }>()
  const workspace = usePartnerWorkspaceStore(),
    finance = useFinanceSettingsStore(),
    locale = usePlatformLocaleStore(),
    providers = useProviderDemoStore()
  const archiveLabels: Record<string, string> = {
    settlementBasis: '原單計費基礎',
    ratePercent: '原單費率 %',
    transactionCurrency: '原單交易幣別',
    settlementCurrency: '原單結算幣別',
    exchangeRate: '原單匯率',
    exchangeRateTime: '原單匯率時間',
    formulaVersion: '原單公式版本'
  }
  const user = useUserStore()
  const activity = useSettlementActivity()
  const canLock = computed(() =>
    (user.info.roles || []).some((r) => ['R_ADMIN', 'R_SUPER'].includes(r))
  )
  const month = ref('2026-09'),
    settlementDate = ref('2026-10-01'),
    tab = ref('summary'),
    provider = ref(''),
    raw = ref<string | null>(null),
    failure = ref('')
  const cycle = ref<SettlementCycle>('Monthly')
  const deliveryOpen = ref(false)
  const deliveryEntries = ref<
    { currency: string; difference: number; paid: number; defer: boolean; reason: string }[]
  >([])
  const paymentLabel = computed(() => (props.kind === 'provider' ? '實付金額' : '實收金額'))
  const adjustments = ref<
    {
      id: string
      originalStatementId: string
      sourceBetId: string
      currency: string
      amount: number
      reason: string
    }[]
  >([])
  watch(cycle, (value) => {
    month.value = value === 'Monthly' ? month.value.slice(0, 7) : `${month.value.slice(0, 7)}-01`
  })
  const periodRange = computed(() => cycleBounds(month.value, cycle.value))
  function reload() {
    try {
      raw.value = localStorage.getItem(LEDGER_KEY)
      readLedger(raw.value)
      failure.value = ''
    } catch (e) {
      failure.value = String(e)
    }
  }
  reload()
  const stream = computed(
    () => `${props.kind}-${props.ownerId}-${props.providerId || 'all'}-${cycle.value}-v2`
  )
  const ledger = computed(() => {
    try {
      return readLedger(raw.value)
    } catch {
      return { version: 1 as const, statements: [] }
    }
  })
  const locked = computed(() =>
    ledger.value.statements.find(
      (s) =>
        s.input.stream === stream.value &&
        s.input.month === (cycle.value === 'Weekly' ? periodRange.value.start : month.value)
    )
  )
  const previousDelivery = computed(
    () =>
      ledger.value.statements
        .filter(
          (s) =>
            s.input.stream === stream.value &&
            s.input.month < (cycle.value === 'Weekly' ? periodRange.value.start : month.value)
        )
        .at(-1)?.delivery || []
  )
  const openingPayment = computed(() => previousDelivery.value.some((d) => d.carriedMinor !== 0))
  const owner = computed(() => (props.kind === 'provider' ? 'platform' : props.kind))
  const contractCosts = computed(() =>
    workspace.costs.filter(
      (c) =>
        c.owner === owner.value &&
        c.ownerId === props.ownerId &&
        (!props.providerId || c.providerId === props.providerId)
    )
  )
  const contractSettlement = computed(() => {
    if (cycle.value !== 'Monthly') return { date: periodRange.value.nextDate, day: null, issue: '' }
    const latest = [
      ...new Map(
        contractCosts.value
          .filter(
            (cost) =>
              cost.scope === 'provider' &&
              cost.cycle === 'Monthly' &&
              cost.effectiveFrom <= periodRange.value.end
          )
          .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
          .map((cost) => [`${cost.providerId}:${cost.gameType || 'legacy'}`, cost])
      ).values()
    ]
    if (!latest.length)
      return { date: '', day: null, issue: '缺少適用的供應商月結合約，不能決定結算日' }
    if (latest.some((cost) => cost.settlementDay === undefined))
      return { date: '', day: null, issue: '適用合約仍有舊版本未確認結算日，請先建立新版本' }
    const days = [...new Set(latest.map((cost) => cost.settlementDay!))]
    if (days.length !== 1)
      return { date: '', day: null, issue: '同一張對帳單的適用合約結算日不一致' }
    return { date: monthlySettlementDate(month.value, days[0]), day: days[0], issue: '' }
  })
  const settlementDateSource = computed(() => {
    if (locked.value) return `已鎖定快照：${locked.value.input.settlementDate}`
    if (cycle.value !== 'Monthly') return '日結／週結可依帳期後日期調整。'
    if (contractSettlement.value.issue) return contractSettlement.value.issue
    return `由適用合約決定：次月 ${contractSettlement.value.day} 日（${contractSettlement.value.date}）`
  })
  watch(
    [month, cycle, locked, () => contractSettlement.value.date],
    () => {
      adjustments.value = []
      deliveryEntries.value = []
      deliveryOpen.value = false
      settlementDate.value =
        locked.value?.input.settlementDate ||
        (cycle.value === 'Monthly' ? contractSettlement.value.date : periodRange.value.nextDate)
    },
    { immediate: true }
  )
  const input = computed<SettlementInput>(() => {
    const range = periodRange.value
    const bets = activity.select(owner.value, props.ownerId, props.providerId)
    return {
      stream: stream.value,
      month: cycle.value === 'Weekly' ? range.start : month.value,
      cycle: cycle.value,
      confirmedBy: user.info.userName || String(user.info.userId || '管理者'),
      delivery: deliveryEntries.value.map((d) => ({
        currency: d.currency,
        differenceMicros: Math.round(d.difference * 1000000),
        paidMinor: Math.round(
          d.paid * 10 ** (finance.currencies.find((c) => c.code === d.currency)?.decimalPlaces ?? 2)
        ),
        defer: d.defer,
        reason: d.reason
      })),
      adjustments: adjustments.value.map((a) => ({
        ...a,
        amountMicros: Math.round(a.amount * 1000000)
      })),
      settlementDate: settlementDate.value,
      owner: owner.value,
      ownerId: props.ownerId,
      timezone: locale.defaultTimezone?.id || '',
      costs: contractCosts.value,
      bets,
      fx: finance.dailyRates
        .filter((r) => r.status === 'Locked')
        .map((r) => ({
          date: r.date,
          from: r.fromCurrency,
          to: r.toCurrency,
          rate: String(r.finalRate),
          version: r.id
        })),
      precision: Object.fromEntries(
        finance.currencies
          .filter((c) => c.status === 'Active')
          .map((c) => [c.code, c.decimalPlaces])
      )
    }
  })
  const calculation = computed(() => {
    try {
      if (cycle.value === 'Monthly' && contractSettlement.value.issue)
        throw new Error(contractSettlement.value.issue)
      return {
        value: locked.value?.result || prepareStatement(ledger.value, input.value),
        error: ''
      }
    } catch (e) {
      return { value: null, error: e instanceof Error ? e.message : String(e) }
    }
  })
  const result = computed(() => calculation.value.value)
  const deliveryPreview = computed(() => {
    try {
      return {
        rows: result.value ? prepareDelivery(ledger.value, input.value, result.value) : [],
        error: ''
      }
    } catch (e) {
      return { rows: [], error: e instanceof Error ? e.message : String(e) }
    }
  })
  function openDelivery() {
    if (!result.value || locked.value || !canLock.value) return
    const currencies = new Set([
      ...result.value.totals.map((t) => t.currency),
      ...previousDelivery.value.filter((d) => d.carriedMinor !== 0).map((d) => d.currency)
    ])
    deliveryEntries.value = [...currencies].map((currency) => ({
      currency,
      difference: 0,
      paid: 0,
      defer: false,
      reason: ''
    }))
    deliveryOpen.value = true
  }
  watch(
    () => calculation.value.error,
    (e) => {
      failure.value = e
    },
    { immediate: true }
  )
  const effectiveInput = computed(() => locked.value?.input || input.value)
  const providerIds = computed(() => [
    ...new Set(result.value?.lines.map((l) => l.providerId) || [])
  ])
  const visible = computed(
    () =>
      result.value?.lines.filter((l) => !provider.value || l.providerId === provider.value) || []
  )
  const games = computed(() => result.value?.lines.flatMap((l) => l.sources) || [])
  const sums = computed(
    () => result.value?.totals.map((t) => ({ ...t, amount: t.amount || 0 })) || []
  )
  function lock() {
    if (!canLock.value) return
    try {
      const next = lockStatement(localStorage, raw.value, input.value)
      raw.value = JSON.stringify(next)
      failure.value = ''
    } catch (e) {
      failure.value = e instanceof Error ? e.message : String(e)
    }
  }
  function providerName(id: string) {
    return providers.state.providers.find((p) => p.id === id)?.name || id
  }
  const format = (n: number, digits: number) =>
    Number.isFinite(digits) ? (n / 10 ** digits).toFixed(digits) : '待補'
</script>
<style scoped>
  .integrated {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .settlement-date-source {
    color: var(--el-text-color-secondary);
  }
  .settlement-date-source.is-error {
    color: var(--el-color-danger);
  }
  .table-scroll-hint {
    margin: 0 0 8px;
    color: var(--el-color-primary);
    font-size: 13px;
  }
  .metrics {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }
  .adjustment-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin: 16px 0;
  }
  .provider-filter {
    width: 220px;
    margin: 12px 0;
  }
  .delivery-card {
    margin: 16px 0;
  }
  .adjustment-row label {
    display: grid;
    gap: 8px;
  }
</style>
