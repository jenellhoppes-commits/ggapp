<template>
  <ElCard shadow="never">
    <template #header>預估財務金額（未鎖定）</template>
    <p
      >匯率日期：{{ fxDate }}（查詢當天） · 原幣 {{ query.currency }} ·
      共用交易中心已結算正式線路資料。非實收款項，亦非扣除營運費用後淨利。</p
    >
    <ElAlert v-if="calculation.error" :title="calculation.error" type="warning" :closable="false" />
    <ElTable :data="calculation.rows">
      <ElTableColumn prop="currency" label="結算幣別" />
      <ElTableColumn prop="revenue" label="預估對直接下級應收" />
      <ElTableColumn prop="cost" label="預估供應商成本" />
      <ElTableColumn prop="profit" label="預估交易毛利" />
    </ElTable>
    <p
      >不合併不同結算幣別。正式結算另納入已鎖定期初餘額與上期回調；此處為所選活動區間、未扣期初餘額的預估。</p
    >
  </ElCard>
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import type { FourQuery } from '@/domain/report-four-tabs'
  import { platformDate } from '@/domain/report-four-tabs'
  import { useSettlementActivity } from '@/composables/useSettlementActivity'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { settlementPeriod } from '@/domain/daily-settlement'
  import { finalMinor } from '@/domain/settlement-money'
  const props = defineProps<{ query: FourQuery }>()
  const activity = useSettlementActivity(),
    workspace = usePartnerWorkspaceStore(),
    business = useBusinessPartnerStore(),
    finance = useFinanceSettingsStore(),
    locale = usePlatformLocaleStore()
  const fxDate = computed(() =>
    platformDate(new Date(), locale.defaultTimezone?.id || 'Asia/Taipei')
  )
  const calculation = computed(() => {
    try {
      const q = props.query
      const rows = activity.rows.value.filter(
        (r) =>
          r.production &&
          r.original.status === 'Settled' &&
          r.original.currency === q.currency &&
          (!q.merchant || r.original.merchantId === q.merchant) &&
          (!q.agent || r.original.agentId === q.agent) &&
          (!q.provider || r.providerId === q.provider) &&
          (!q.game ||
            [r.original.gameId, r.original.gameName, r.original.gameCode].some((v) =>
              v.includes(q.game)
            ))
      )
      const fx = finance.dailyRates
        .filter((r) => r.status === 'Locked')
        .map((r) => ({
          date: r.date,
          from: r.fromCurrency,
          to: r.toCurrency,
          rate: String(r.finalRate),
          version: r.id
        }))
      const precision = Object.fromEntries(finance.currencies.map((c) => [c.code, c.decimalPlaces]))
      const calculate = (
        owner: 'platform' | 'agent' | 'merchant',
        id: string,
        bets: ReturnType<typeof activity.select>
      ) => {
        const result = settlementPeriod(
          bets,
          workspace.costs,
          owner,
          id,
          q.from,
          q.to,
          locale.defaultTimezone?.id || '',
          fx,
          precision,
          {},
          fxDate.value
        )
        if (result.lines.some((l) => l.issue) || result.totals.some((t) => t.pending))
          throw new Error(result.lines.find((l) => l.issue)?.issue || '結算條件未齊備')
        return result.totals
      }
      const costs = calculate(
        'platform',
        'platform',
        rows.map((r) => r.toBet())
      )
      const buckets = new Map<
        string,
        { owner: 'agent' | 'merchant'; id: string; bets: ReturnType<typeof activity.select> }
      >()
      for (const row of rows) {
        const m = business.merchants.find((m) => m.id === row.original.merchantId)
        if (!m) throw new Error('商戶主檔缺漏')
        let a = business.agents.find((a) => a.id === m?.agentId)
        const seen = new Set<string>()
        while (a?.parentAgentId) {
          if (seen.has(a.id)) throw new Error('代理層級循環，不能計算')
          seen.add(a.id)
          const parent = business.agents.find((p) => p.id === a!.parentAgentId)
          if (!parent) throw new Error('代理上級資料缺漏')
          a = parent
        }
        if (m?.agentId && !a) throw new Error('商戶代理資料缺漏')
        const owner = a ? ('agent' as const) : ('merchant' as const),
          id = a?.id || row.original.merchantId,
          key = owner + ':' + id
        if (!buckets.has(key)) buckets.set(key, { owner, id, bets: [] })
        buckets.get(key)!.bets.push(row.toBet())
      }
      const income = [...buckets.values()].flatMap((b) => calculate(b.owner, b.id, b.bets))
      const currencies = new Set([...costs, ...income].map((t) => t.currency))
      return {
        error: '',
        rows: [...currencies].map((currency) => {
          const rev = income.filter((t) => t.currency === currency).reduce((n, t) => n + t.micro, 0)
          const cost = costs.filter((t) => t.currency === currency).reduce((n, t) => n + t.micro, 0)
          const format = (v: number) =>
            (finalMinor(v, precision[currency]) / 10 ** precision[currency]).toFixed(
              precision[currency]
            )
          const matched =
            costs.some((t) => t.currency === currency) &&
            income.some((t) => t.currency === currency)
          return {
            currency,
            revenue: format(rev),
            cost: format(cost),
            profit: matched ? format(rev - cost) : '結算幣不同，不混加'
          }
        })
      }
    } catch (e) {
      return { rows: [], error: '預估待補：' + (e instanceof Error ? e.message : String(e)) }
    }
  })
</script>
