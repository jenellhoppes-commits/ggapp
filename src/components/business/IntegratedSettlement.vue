<template>
  <section class="integrated">
    <div class="toolbar">
      <h2>{{ title }} · {{ month }} 對帳</h2>
      <ElDatePicker v-model="month" type="month" value-format="YYYY-MM" :clearable="false" />
      <span>結算日期</span>
      <ElDatePicker
        v-model="settlementDate"
        type="date"
        value-format="YYYY-MM-DD"
        :disabled="!!locked"
        :clearable="false"
      />
      <ElButton @click="reload">重新載入帳本</ElButton>
      <ElButton
        type="primary"
        :disabled="
          !canLock ||
          !!locked ||
          !!failure ||
          !result ||
          result.lines.some((l) => !!l.issue) ||
          (!result.lines.length && !result.carry.length)
        "
        @click="lock"
        >{{ locked ? '已鎖定' : '確認並鎖定演示單' }}</ElButton
      >
      <ElButton :disabled="!locked" @click="month = bounds(month).next">前往下一期</ElButton>
    </div>
    <p
      >單號：{{ locked?.id || `${stream}:${month}` }} ·
      {{ locked ? `鎖定時間 ${locked.lockedAt}` : '未鎖定草稿' }}</p
    >
    <ElAlert v-if="failure" type="error" :title="failure" :closable="false" />
    <template v-if="result">
      <div class="metrics">
        <div v-for="s in sums" :key="s.currency"
          ><strong
            >{{ s.currency }} 最終應結：{{
              s.pending ? '待補資料' : format(s.amount, s.digits)
            }}</strong
          ><p>依每日供應商條件計算；調整金額 0</p></div
        >
      </div>
      <ElCard shadow="never">
        <ElTabs v-model="tab">
          <ElTabPane label="對帳摘要" name="summary"
            ><p
              >本期 {{ result.lines.length }} 組每日明細，{{
                games.length
              }}
              筆模擬下注。各分頁共用同一份{{ locked ? '已鎖定快照' : '草稿結果' }}。</p
            ><p
              >時區 {{ effectiveInput.timezone }}；各分組先乘合約費率，再統一使用結算日
              {{ effectiveInput.settlementDate || '舊版每日匯率' }} 的匯率換算、四捨五入並加總。</p
            ></ElTabPane
          >
          <ElTabPane label="每日彙總" name="daily" />
          <ElTabPane label="遊戲彙總" name="games" />
          <ElTabPane label="結算單" name="statement" />
          <ElTabPane label="計算快照" name="snapshot" />
          <ElTabPane label="操作紀錄" name="logs"
            ><p>{{
              locked
                ? `${locked.lockedAt} · 確認並鎖定；快照及期末餘額同步保存`
                : '尚未鎖單，不寫入跨期帳本'
            }}</p></ElTabPane
          >
        </ElTabs>
        <template v-if="['daily', 'games', 'statement', 'snapshot'].includes(tab)">
          <ElSelect v-model="provider" placeholder="全部供應商" clearable class="provider-filter"
            ><ElOption v-for="id in providerIds" :key="id" :value="id" :label="providerName(id)"
          /></ElSelect>
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
            <ElTableColumn label="結算日匯率快照" min-width="190"
              ><template #default="{ row }"
                >{{ row.fxDate || row.date }}<br />{{ row.fxRate || '待補' }} /
                {{ row.fxVersion || '待補' }}</template
              ></ElTableColumn
            >
            <ElTableColumn label="應結" min-width="170"
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
        <h3>結轉餘額（原幣）</h3>
        <p v-for="c in result.carry" :key="c.scope"
          >{{ providerName(c.scope.split(':')[2]) }} {{ c.scope.split(':')[3] }}：期初
          {{ format(c.opening, 2) }}／使用 {{ format(c.used, 2) }}／新增
          {{ format(c.added, 2) }}／期末 {{ c.closing === null ? '待補' : format(c.closing, 2) }}</p
        >
      </ElCard>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
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
    bounds,
    type SettlementInput
  } from '@/domain/settlement-ledger'
  const props = defineProps<{
    kind: 'provider' | 'agent' | 'merchant'
    ownerId: string
    title: string
    providerId?: string
  }>()
  const workspace = usePartnerWorkspaceStore(),
    finance = useFinanceSettingsStore(),
    locale = usePlatformLocaleStore(),
    providers = useProviderDemoStore()
  const user = useUserStore()
  const canLock = computed(() =>
    (user.info.roles || []).some((r) => ['R_ADMIN', 'R_SUPER'].includes(r))
  )
  const month = ref('2026-09'),
    settlementDate = ref('2026-10-01'),
    tab = ref('summary'),
    provider = ref(''),
    raw = ref<string | null>(null),
    failure = ref('')
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
  const stream = computed(() => `${props.kind}-${props.ownerId}-${props.providerId || 'all'}`)
  const ledger = computed(() => {
    try {
      return readLedger(raw.value)
    } catch {
      return { version: 1 as const, statements: [] }
    }
  })
  const locked = computed(() =>
    ledger.value.statements.find(
      (s) => s.input.stream === stream.value && s.input.month === month.value
    )
  )
  watch([month, locked], () => {
    settlementDate.value = locked.value?.input.settlementDate || `${bounds(month.value).next}-01`
  })
  const input = computed<SettlementInput>(() => {
    const owner = props.kind === 'provider' ? 'platform' : props.kind
    const range = bounds(month.value)
    const costs = workspace.costs.filter(
      (c) =>
        c.owner === owner &&
        c.ownerId === props.ownerId &&
        (!props.providerId || c.providerId === props.providerId)
    )
    const scopes = [
      ...new Map(
        costs
          .flatMap((c) =>
            c.scope === 'provider'
              ? providers.state.providers
                  .find((p) => p.id === c.providerId)
                  ?.lines.map((l) => ({ ...c, transactionCurrency: l.currency })) || []
              : c.transactionCurrency
                ? [c]
                : []
          )
          .map((c) => [`${c.providerId}:${c.transactionCurrency}`, c])
      ).values()
    ]
    const bets = scopes.flatMap((c, i) =>
      [15, 18].map((day, j) => ({
        id: `DEMO-${month.value}-${i}-${j}`,
        providerId: c.providerId,
        currency: c.transactionCurrency!,
        time: `${month.value}-${day}T04:00:00Z`,
        game: `${providerName(c.providerId)} 模擬遊戲`,
        bet: 100000,
        valid: 100000,
        payout: j ? 120000 : 80000
      }))
    )
    return {
      stream: stream.value,
      month: month.value,
      settlementDate: settlementDate.value,
      owner,
      ownerId: props.ownerId,
      timezone: locale.defaultTimezone?.id || '',
      costs,
      bets: bets.filter((b) => b.time.slice(0, 10) <= range.end),
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
      return {
        value: locked.value?.result || prepareStatement(ledger.value, input.value),
        error: ''
      }
    } catch (e) {
      return { value: null, error: e instanceof Error ? e.message : String(e) }
    }
  })
  const result = computed(() => calculation.value.value)
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
  const sums = computed(() =>
    [...new Set(result.value?.lines.map((l) => l.settlementCurrency) || [])].map((currency) => {
      const lines = result.value!.lines.filter((l) => l.settlementCurrency === currency)
      return {
        currency,
        digits: lines[0].digits,
        amount: lines.reduce((n, l) => n + (l.settled || 0), 0),
        pending: lines.some((l) => !!l.issue)
      }
    })
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
  .metrics {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }
  .provider-filter {
    width: 220px;
    margin: 12px 0;
  }
</style>
