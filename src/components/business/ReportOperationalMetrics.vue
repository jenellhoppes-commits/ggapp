<template>
  <dl class="operational-metrics" aria-label="已套用範圍營運合計">
    <div v-for="metric in reportMetrics" :key="metric.key"
      ><dt>{{ metric.label }}</dt
      ><dd
        >{{ formatReportMetric(stats[metric.key], metric.amount)
        }}<small v-if="metric.amount"> {{ currency }}</small></dd
      ></div
    >
  </dl>
</template>
<script setup lang="ts">
  import type { ReportStats } from '@/domain/report-four-tabs'
  import { formatReportMetric, reportMetrics } from '@/domain/report-presentation'
  defineProps<{ stats: ReportStats; currency: string }>()
</script>
<style scoped>
  .operational-metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    margin: 0;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-bg-color);
  }
  .operational-metrics div {
    padding: 14px 16px;
    min-width: 0;
  }
  dt,
  small {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  dd {
    margin: 6px 0 0;
    font-size: 22px;
    font-weight: 600;
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
