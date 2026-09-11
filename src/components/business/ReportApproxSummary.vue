<template>
  <section class="approx-summary">
    <div class="approx-toolbar">
      <div
        ><strong>大致金額</strong
        ><span>統一換算 · 查詢日 {{ rateDate }} · {{ rateSources }}</span></div
      >
      <ElSelect v-model="target" aria-label="大致金額換算幣別" style="width: 160px"
        ><ElOption v-for="code in ['USDT', 'USD', 'TWD']" :key="code" :value="code" :label="code"
      /></ElSelect>
    </div>
    <div class="approx-metrics">
      <article v-for="metric in metrics" :key="metric.key"
        ><span>{{ metric.label }}</span
        ><strong
          >≈ {{ display(metric.key) }} <small>{{ target }}</small></strong
        ></article
      >
    </div>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import {
    approximateReportTotal,
    reportQuote,
    reportQuoteDetails
  } from '@/domain/report-approximation'
  const props = defineProps<{
    rows: Array<{ currency: string; values: Record<string, number | null> }>
    metrics: Array<{ key: string; label: string }>
  }>()
  const finance = useFinanceSettingsStore()
  const target = ref('USDT')
  const rateDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
  const quotes = computed(
    () => (currency: string) => reportQuote(currency, finance.dailyRates, rateDate)
  )
  const rateSources = computed(() => {
    const currencies = [
      ...new Set(props.rows.filter((r) => r.currency !== target.value).map((r) => r.currency))
    ]
    if (!currencies.length) return '同幣別，無需換算'
    return [
      ...new Set(
        [...currencies, target.value]
          .map((c) => reportQuoteDetails(c, finance.dailyRates, rateDate))
          .filter((q) => q.source !== '基準幣')
          .map((q) => `${q.source}${q.date ? ' ' + q.date : ''}`)
      )
    ].join('、')
  })
  function display(key: string) {
    const result = approximateReportTotal(
      props.rows.map((r) => ({ currency: r.currency, amount: r.values[key] ?? null })),
      target.value,
      quotes.value
    )
    return result === null
      ? '—'
      : result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
</script>
<style scoped>
  .approx-summary {
    min-width: 0;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-bg-color);
    padding: 20px 24px;
  }
  .approx-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .approx-toolbar span {
    display: block;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 6px;
  }
  .approx-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 24px;
  }
  .approx-metrics article > span {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .approx-metrics strong {
    overflow-wrap: anywhere;
    display: block;
    font-size: 26px;
    font-weight: 600;
    margin-top: 12px;
    font-variant-numeric: tabular-nums;
  }
  .approx-metrics small {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    font-weight: 400;
  }
  @media (max-width: 480px) {
    .approx-summary {
      padding: 16px;
    }
    .approx-toolbar {
      flex-wrap: wrap;
    }
    .approx-metrics {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    .approx-metrics strong {
      font-size: 22px;
    }
  }
</style>
