<template>
  <section class="daily-preview">
    <ElAlert
      title="新規則驗收範例（2026-09）：與上方歷史單據分離，不改寫原單金額。匯率與下注均為假資料。"
      :closable="false"
    />
    <div class="filters">
      <label
        >供應商
        <ElSelect v-model="provider"
          ><ElOption label="全部" value="" /><ElOption
            label="Pragmatic Play"
            value="PV00001" /><ElOption label="Evolution" value="PV00002" /></ElSelect
      ></label>
      <label
        >負 GGR 範例
        <ElSelect v-model="policy"
          ><ElOption label="清零" value="zero" /><ElOption
            label="累積至下期扣抵"
            value="carry" /></ElSelect
      ></label>
      <label
        >匯率案例
        <ElSelect v-model="missing"
          ><ElOption label="每日匯率齊全" :value="false" /><ElOption
            label="缺少一天匯率"
            :value="true" /></ElSelect
      ></label>
    </div>
    <ElCheckbox v-model="noBets">無下注、有期初扣抵驗收（USD 250）</ElCheckbox>
    <p
      >每日依供應商、原幣、條件版本計算；換算後四捨五入至結算幣精度，期末加總。新負 GGR
      僅結轉下期，不於本期使用。</p
    >
    <ArtTable :data="visible" height="auto" style="height: auto" :show-table-header="false">
      <ElTableColumn prop="date" label="日期" width="115" />
      <ElTableColumn label="供應商／原幣" min-width="150"
        ><template #default="{ row }"
          >{{ name(row.providerId) }} / {{ row.currency }}</template
        ></ElTableColumn
      >
      <ElTableColumn prop="version" label="條件版本" min-width="150" />
      <ElTableColumn label="GGR／有效投注" min-width="150"
        ><template #default="{ row }"
          >{{ (row.ggr / 100).toFixed(2) }} / {{ (row.valid / 100).toFixed(2) }}</template
        ></ElTableColumn
      >
      <ElTableColumn label="計費基礎／費率" min-width="150"
        ><template #default="{ row }">{{ row.basis }} / {{ row.rate }}%</template></ElTableColumn
      >
      <ElTableColumn label="期初／使用／新增扣抵" min-width="170"
        ><template #default="{ row }"
          >{{ row.opening / 100 }} / {{ row.used / 100 }} / {{ row.added / 100 }}</template
        ></ElTableColumn
      >
      <ElTableColumn label="計費基數" min-width="120"
        ><template #default="{ row }">{{ (row.base / 100).toFixed(2) }}</template></ElTableColumn
      >
      <ElTableColumn label="當日匯率／版本" min-width="170"
        ><template #default="{ row }"
          >{{ row.fxRate || '待補' }} / {{ row.fxVersion || '待補' }}</template
        ></ElTableColumn
      >
      <ElTableColumn label="應結金額" min-width="150"
        ><template #default="{ row }"
          >{{
            row.settled === null
              ? '待補，未計算'
              : `${row.settlementCurrency} ${(row.settled / 10 ** row.digits).toFixed(row.digits)}`
          }}<br />{{ row.issue }}</template
        ></ElTableColumn
      >
      <ElTableColumn label="遊戲明細" width="100"
        ><template #default="{ row }"
          ><ElButton link @click="sources = row.sources">查看</ElButton></template
        ></ElTableColumn
      >
    </ArtTable>
    <p v-for="t in totals" :key="t.id"
      >{{ name(t.id) }}：{{
        t.pending ? '資料待補，不提供完整應結' : `TWD ${t.amount.toFixed(2)}`
      }}；本期新增結轉 USD {{ (t.carry / 100).toFixed(2) }}</p
    >
    <p v-for="balance in period.carry" :key="balance.scope">
      {{ name(balance.scope.split(':')[2]) }} · 原幣 USD：期初 {{ balance.opening / 100 }}／已使用
      {{ balance.used / 100 }}／本期新增 {{ balance.added / 100 }}／期末
      {{ balance.closing === null ? '待補資料' : balance.closing / 100 }}
    </p>
    <ElDialog
      :model-value="!!sources"
      title="本日分組遊戲來源（不逐遊戲重複四捨五入）"
      width="min(94vw, 850px)"
      @close="sources = null"
    >
      <ArtTable :data="sources || []" height="auto" style="height: auto" :show-table-header="false"
        ><ElTableColumn prop="game" label="遊戲" /><ElTableColumn
          prop="id"
          label="注單" /><ElTableColumn prop="time" label="投注時間 UTC" min-width="220"
      /></ArtTable>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { statementExample, type StatementBet } from '@/domain/supplier-statements'
  import { settlementPeriod } from '@/domain/daily-settlement'
  const props = withDefaults(defineProps<{ kind?: 'provider' | 'agent' | 'merchant' }>(), {
    kind: 'merchant'
  })
  const policy = ref<'zero' | 'carry'>('carry'),
    provider = ref(''),
    missing = ref(false)
  const sources = ref<StatementBet[] | null>(null)
  const noBets = ref(false)
  const period = computed(() => {
    const owner = props.kind === 'provider' ? 'platform' : props.kind
    const example = statementExample(
      owner,
      'DEMO-ONLY',
      owner === 'platform' ? 5 : owner === 'agent' ? 6 : 7
    )
    const costs = example.costs.map((c) => ({ ...c, currency: 'TWD', negativeGgr: policy.value }))
    const bets = [
      ...example.bets,
      { ...example.bets[0], id: 'NEGATIVE-DEMO', time: '2026-09-18T03:00:00Z', payout: 120000 }
    ]
    const fx = ['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']
      .filter((d) => !missing.value || d !== '2026-09-16')
      .map((date, i) => ({
        date,
        from: 'USD',
        to: 'TWD',
        rate: String(32 + i / 10),
        version: `DEMO-FX-${date}`
      }))
    return settlementPeriod(
      noBets.value ? [] : bets,
      costs,
      owner,
      'DEMO-ONLY',
      '2026-09-01',
      '2026-09-30',
      'Asia/Taipei',
      fx,
      { TWD: 2 },
      noBets.value ? { [`${owner}:DEMO-ONLY:PV00001:USD:GGR:TWD`]: 25000 } : {}
    )
  })
  const rows = computed(() => period.value.lines)
  const visible = computed(() =>
    rows.value.filter((r) => !provider.value || provider.value === r.providerId)
  )
  const totals = computed(() =>
    [...new Set(visible.value.map((r) => r.providerId))].map((id) => {
      const group = visible.value.filter((r) => r.providerId === id)
      return {
        id,
        amount: group.reduce((n, r) => n + (r.settled || 0), 0) / 100,
        pending: group.some((r) => !!r.issue),
        carry: group.reduce((n, r) => n + r.added, 0)
      }
    })
  )
  const name = (id: string) => (id === 'PV00001' ? 'Pragmatic Play' : 'Evolution')
</script>
<style scoped>
  .daily-preview {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .filters {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }
  .filters label {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .filters :deep(.el-select) {
    width: 190px;
  }
</style>
