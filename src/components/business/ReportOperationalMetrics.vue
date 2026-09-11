<template>
  <section class="operational-summary">
    <ReportApproxSummary
      :rows="[
        {
          currency,
          values: {
            bet: amount(stats.betAmount),
            payout: amount(stats.payoutAmount),
            ggr: amount(reportOutcome(stats).ggr)
          }
        }
      ]"
      :metrics="[
        { key: 'bet', label: '投注金額' },
        { key: 'payout', label: '派彩金額' },
        { key: 'ggr', label: 'GGR' }
      ]"
    />
    <dl class="operational-metrics" aria-label="已套用範圍營運合計">
      <div v-for="metric in reportMetrics.filter((item) => !item.amount)" :key="metric.key"
        ><dt>{{ metric.label }}</dt
        ><dd
          >{{ formatReportMetric(stats[metric.key], metric.amount)
          }}<small v-if="metric.amount"> {{ currency }}</small></dd
        ></div
      >
      <div
        ><dt>加權實際 RTP</dt><dd>{{ reportOutcome(stats).rtp ?? '—' }}</dd></div
      >
    </dl>
  </section>
</template>
<script setup lang="ts">
  import type { ReportStats } from '@/domain/report-four-tabs'
  import ReportApproxSummary from './ReportApproxSummary.vue'
  const amount = (value: string | null) => (value === null ? null : Number(value))
  import { reportOutcome } from '@/domain/report-outcome'
  import { formatReportMetric, reportMetrics } from '@/domain/report-presentation'
  defineProps<{ stats: ReportStats; currency: string }>()
</script>
<style scoped>
  .operational-summary {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .operational-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin: 0;
    gap: 16px;
  }
  .operational-metrics div {
    padding: 22px 24px;
    min-width: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color);
  }
  dt,
  small {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  small {
    display: inline-block;
    margin-left: 6px;
    font-weight: 400;
    letter-spacing: normal;
  }
  dd {
    margin: 14px 0 0;
    font-size: 26px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.5px;
    overflow-wrap: anywhere;
  }
  @media (max-width: 720px) {
    .operational-metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    dd {
      font-size: 19px;
    }
  }
</style>
