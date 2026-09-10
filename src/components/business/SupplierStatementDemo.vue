<template>
  <section class="supplier-statement-demo">
    <AppFilterForm>
      <ElFormItem label="交易對象"
        ><ElSelect v-model="selected" :disabled="options.length < 2"
          ><ElOption v-for="o in options" :key="o.key" :label="o.label" :value="o.key" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="資料來源"
        ><ElSelect v-model="mode"
          ><ElOption label="目前條件＋模擬下注" value="current" /><ElOption
            label="跨版本驗收範例（獨立假資料）"
            value="example" /><ElOption label="缺條件／匯率驗收範例" value="missing" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="帳期起"
        ><ElDatePicker v-model="from" value-format="YYYY-MM-DD" :disabled="mode !== 'current'"
      /></ElFormItem>
      <ElFormItem label="帳期迄"
        ><ElDatePicker v-model="to" value-format="YYYY-MM-DD" :disabled="mode !== 'current'"
      /></ElFormItem>
    </AppFilterForm>
    <ElAlert v-if="!subject" title="無有效交易對象或檢視權限" type="error" :closable="false" />
    <template v-else>
      <ElDescriptions :column="columns" border>
        <ElDescriptionsItem label="單號">{{ snapshot?.id || '未鎖定演示草稿' }}</ElDescriptionsItem>
        <ElDescriptionsItem label="收付方向">{{ subject.label }}</ElDescriptionsItem>
        <ElDescriptionsItem label="帳期">{{ periodFrom }} ～ {{ periodTo }}</ElDescriptionsItem>
        <ElDescriptionsItem label="平台時區">{{
          snapshot?.timezone || timezone
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="狀態">{{
          snapshot
            ? '已鎖定本地快照'
            : !lines.length
              ? '尚無可試算資料，請確認條件及帳期'
              : issues
                ? '待補資料，不能鎖定'
                : '演示試算完成'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="資料截止">{{
          snapshot?.createdAt || '依所選帳期模擬，非即時交易'
        }}</ElDescriptionsItem>
      </ElDescriptions>
      <p class="muted"
        >以下注時間選版；同供應商跨版本分段。金額以兩位小數演示，每段四捨五入至分；正式精度政策另行確認。無額外費用／調整，不代表淨利。</p
      >
      <ElAlert v-if="failure" :title="failure" type="error" :closable="false" />
      <ElCard shadow="never">
        <template #header
          ><div class="toolbar"
            ><strong>供應商計費明細</strong
            ><ElButton
              :disabled="!!snapshot || !lines.length || !!issues || !!failure"
              @click="lock"
              >鎖定演示快照</ElButton
            ></div
          ></template
        >
        <ArtTable
          :data="lines"
          height="auto"
          empty-height="auto"
          style="height: auto"
          :show-table-header="false"
        >
          <ElTableColumn label="供應商／原幣" min-width="160"
            ><template #default="{ row }"
              >{{ providerName(row.providerId) }}<br />{{ row.currency }}</template
            ></ElTableColumn
          >
          <ElTableColumn label="版本／適用區間" min-width="230"
            ><template #default="{ row }"
              ><span class="version">{{ row.version }}</span
              ><br />{{ row.effectiveFrom }} ～ {{ row.effectiveTo }}</template
            ></ElTableColumn
          >
          <ElTableColumn label="投注／有效投注／派彩" min-width="200"
            ><template #default="{ row }"
              >{{ money(row.bet) }}／{{ money(row.valid) }}／{{ money(row.payout) }}</template
            ></ElTableColumn
          >
          <ElTableColumn label="GGR" min-width="100"
            ><template #default="{ row }">{{ money(row.ggr) }}</template></ElTableColumn
          >
          <ElTableColumn label="計費基礎 × 費率" min-width="165"
            ><template #default="{ row }"
              >{{ row.basis }}<br />{{ row.basis === '待補' ? '待補' : money(row.base) }} ×
              {{ row.rate || '待補' }}%</template
            ></ElTableColumn
          >
          <ElTableColumn label="結算幣／週期" min-width="130"
            ><template #default="{ row }"
              >{{ row.settlementCurrency || '待補' }}／{{ cycle(row.cycle) }}</template
            ></ElTableColumn
          >
          <ElTableColumn label="應收／應付" min-width="140"
            ><template #default="{ row }"
              >{{ row.amount === null ? '待補，未計算' : money(row.amount) }}<br />{{
                row.issue
              }}</template
            ></ElTableColumn
          >
          <ElTableColumn label="匯率依據" min-width="160"
            ><template #default="{ row }">{{
              !row.settlementCurrency
                ? '結算幣待補'
                : row.currency === row.settlementCurrency
                  ? '同幣 1:1，不需換算'
                  : '缺少匯率版本／來源'
            }}</template></ElTableColumn
          >
          <ElTableColumn label="來源" width="100"
            ><template #default="{ row }"
              ><ElButton link @click="detail = row"
                >{{ row.sources.length }} 筆下注</ElButton
              ></template
            ></ElTableColumn
          >
        </ArtTable>
      </ElCard>
      <ElCard shadow="never"
        ><template #header>分供應商／分幣小計</template>
        <div v-for="total in totals" :key="total.key" class="subtotal"
          >{{ total.label }}：<strong>{{
            total.incomplete ? '資料待補，不提供完整小計' : money(total.amount)
          }}</strong></div
        >
        <p>不跨幣直接加總；不同收付對象分單呈現。商戶只能看到對自己的售價，不含平台與代理成本。</p>
      </ElCard>
    </template>
    <ElDialog
      :model-value="!!detail"
      title="來源下注與條件追溯（演示）"
      width="min(94vw, 850px)"
      @close="detail = null"
    >
      <p>{{ detail?.version }} · {{ detail?.effectiveFrom }} ～ {{ detail?.effectiveTo }}</p>
      <ArtTable
        :data="detail?.sources || []"
        height="auto"
        empty-height="auto"
        style="height: auto"
        :show-table-header="false"
        ><ElTableColumn prop="id" label="演示注單" min-width="180" /><ElTableColumn
          prop="game"
          label="遊戲"
          min-width="160" /><ElTableColumn
          prop="time"
          label="下注時間（UTC）"
          min-width="220" /><ElTableColumn prop="currency" label="原幣" width="80"
      /></ArtTable>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useLocalStorage, useWindowSize } from '@vueuse/core'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import {
    calculateStatement,
    statementExample,
    type StatementLine,
    type StatementBet
  } from '@/domain/supplier-statements'
  import type { CostOwner } from '@/domain/admin-supplier-costs'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  const props = defineProps<{ kind?: 'provider' | 'agent' | 'merchant' }>()
  const user = useUserStore(),
    business = useBusinessPartnerStore(),
    workspace = usePartnerWorkspaceStore(),
    providers = useProviderDemoStore(),
    locale = usePlatformLocaleStore()
  const { width } = useWindowSize()
  const columns = computed(() => (width.value < 700 ? 1 : 3))
  const timezone = computed(() => locale.defaultTimezone?.id || '')
  type Subject = { key: string; label: string; owner: CostOwner; id: string; provider?: string }
  const options = computed<Subject[]>(() => {
    const roles = user.info.roles || []
    if (roles.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r))) {
      if (props.kind === 'provider')
        return providers.state.providers.map((p) => ({
          key: p.id,
          label: `平台應付 ${p.name}`,
          owner: 'platform',
          id: 'platform',
          provider: p.id
        }))
      if (props.kind === 'agent')
        return business.agents.map((a) => ({
          key: a.id,
          label: `上級應收 ${a.name}`,
          owner: 'agent',
          id: a.id
        }))
      return business.merchants.map((m) => ({
        key: m.id,
        label: `代理應收 ${m.name}`,
        owner: 'merchant',
        id: m.id
      }))
    }
    if (roles.includes('R_AGENT')) {
      const own = business.agents.find((a) => a.id === user.info.agentId && a.status === 'Active')
      if (!own) return []
      return [
        { key: own.id, label: `${own.name} 應付直接上級`, owner: 'agent', id: own.id },
        ...business.agents
          .filter((a) => a.parentAgentId === own.id)
          .map((a) => ({
            key: a.id,
            label: `應收直屬代理 ${a.name}`,
            owner: 'agent' as const,
            id: a.id
          })),
        ...business.merchants
          .filter((m) => m.agentId === own.id)
          .map((m) => ({
            key: m.id,
            label: `應收直屬商戶 ${m.name}`,
            owner: 'merchant' as const,
            id: m.id
          }))
      ]
    }
    if (roles.includes('R_MERCHANT')) {
      const own = business.merchants.find((m) => m.id === user.info.merchantId)
      return own
        ? [{ key: own.id, label: `${own.name} 應付直接代理`, owner: 'merchant', id: own.id }]
        : []
    }
    return []
  })
  const selected = ref(''),
    mode = ref('current'),
    from = ref('2026-09-01'),
    to = ref('2026-09-30'),
    detail = ref<StatementLine | null>(null),
    failure = ref('')
  watch(
    options,
    (os) => {
      if (!os.some((o) => o.key === selected.value)) selected.value = os[0]?.key || ''
    },
    { immediate: true }
  )
  const subject = computed(() => options.value.find((o) => o.key === selected.value))
  const periodFrom = computed(() => (mode.value === 'current' ? from.value : '2026-09-01')),
    periodTo = computed(() => (mode.value === 'current' ? to.value : '2026-09-30'))
  const draftLines = computed(() => {
    if (!subject.value) return []
    const s = subject.value
    const example = statementExample(
      s.owner,
      s.id,
      s.owner === 'platform' ? 5 : s.owner === 'agent' ? 6 : 7
    )
    let costs = mode.value === 'current' ? workspace.costs : example.costs
    let bets: StatementBet[] = example.bets
    if (mode.value === 'current') {
      const keys = new Map(
        costs
          .filter(
            (c) =>
              c.owner === s.owner &&
              c.ownerId === s.id &&
              c.transactionCurrency &&
              (!s.provider || c.providerId === s.provider)
          )
          .map((c) => [`${c.providerId}:${c.transactionCurrency}`, c])
      )
      bets = [...keys.values()].flatMap((c, i) =>
        [periodFrom.value, periodTo.value].map((d, j) => ({
          id: `DEMO-${s.id}-${i}-${j}`,
          providerId: c.providerId,
          currency: c.transactionCurrency!,
          time: `${d}T00:00:00Z`,
          game: '目前条件模擬下注',
          bet: 100000,
          valid: 100000,
          payout: 80000
        }))
      )
    } else if (mode.value === 'missing') {
      costs = example.costs.map((c) => ({ ...c, currency: 'TWD' }))
      bets = [...bets, { ...example.bets[0], id: 'DEMO-MISSING', currency: 'TWD' }]
    }
    if (s.provider) bets = bets.filter((b) => b.providerId === s.provider)
    try {
      return calculateStatement(
        bets,
        costs,
        s.owner,
        s.id,
        periodFrom.value,
        periodTo.value,
        timezone.value
      )
    } catch {
      return []
    }
  })
  type Snapshot = { id: string; createdAt: string; timezone: string; lines: StatementLine[] }
  const saved = useLocalStorage<Record<string, Snapshot>>(
    'ggap-supplier-statement-demo-v1',
    {},
    { writeDefaults: false }
  )
  const snapshotKey = computed(() =>
    JSON.stringify([
      user.info.userId || user.info.userName,
      user.info.agentId,
      user.info.merchantId,
      props.kind,
      selected.value,
      mode.value,
      periodFrom.value,
      periodTo.value
    ])
  )
  const snapshot = computed(() => (subject.value ? saved.value[snapshotKey.value] : undefined))
  const lines = computed(() => snapshot.value?.lines || draftLines.value)
  const issues = computed(() => lines.value.filter((l) => l.issue).length)
  const totals = computed(() => {
    const map = new Map<
      string,
      { key: string; label: string; amount: number; incomplete: boolean }
    >()
    for (const l of lines.value) {
      const key = `${l.providerId}:${l.currency}:${l.settlementCurrency}`
      const t = map.get(key) || {
        key,
        label: `${providerName(l.providerId)} · 原幣 ${l.currency}／結算 ${l.settlementCurrency || '待補'}`,
        amount: 0,
        incomplete: false
      }
      t.amount += l.amount || 0
      t.incomplete ||= l.amount === null
      map.set(key, t)
    }
    return [...map.values()]
  })
  function lock() {
    if (!subject.value || snapshot.value || !lines.value.length || issues.value) return
    try {
      const value = {
        ...saved.value,
        [snapshotKey.value]: {
          id: `DEMO-ST-${Date.now()}`,
          createdAt: new Date().toISOString(),
          timezone: timezone.value,
          lines: JSON.parse(JSON.stringify(lines.value))
        }
      }
      localStorage.setItem('ggap-supplier-statement-demo-v1', JSON.stringify(value))
      saved.value = value
      failure.value = ''
    } catch {
      failure.value = '本地保存失敗，未鎖定；請保留目前資料'
    }
  }
  watch([selected, mode, from, to], () => {
    failure.value = ''
    detail.value = null
  })
  function providerName(id: string) {
    return providers.state.providers.find((p) => p.id === id)?.name || id
  }
  const money = (n: number) =>
    (n / 100).toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const cycle = (c: string) => ({ Monthly: '月結', Weekly: '週結', Daily: '日結' })[c] || '待補'
</script>
<style scoped>
  .supplier-statement-demo {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .toolbar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .muted {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .version {
    overflow-wrap: anywhere;
  }
  .subtotal {
    margin: 8px 0;
  }
</style>
