<template>
  <ElCard shadow="never" class="report-entry-links">
    <template #header
      ><div class="entry-heading"
        ><div
          ><strong>查詢與匯出</strong
          ><p>報表回到對應業務模組，保留可用查詢；本機預覽，非整批驗收。</p></div
        ><ElTag type="warning">R03 本機預覽</ElTag></div
      ></template
    >
    <div class="entry-grid">
      <button
        v-for="entry in entries"
        :key="entry.name"
        @click="router.push({ path: entry.path, query: { currency } })"
        ><small>{{ entry.area }}{{ entry.transition ? ' · 過渡查詢' : '' }}</small
        ><strong>{{ entry.title }}</strong
        ><span>{{ entry.note }}</span
        ><span class="action">查詢／匯出 →</span></button
      >
    </div>
    <div class="finance-entry"
      ><strong>對帳與結算</strong><span>目的頁仍待開發，不產生正式金額或套用舊公式。</span
      ><ElButton
        v-for="entry in settlementDestinations"
        :key="entry.path"
        @click="router.push(entry.path)"
        >{{ entry.title }}（待開發）</ElButton
      ></div
    >
  </ElCard>
</template>
<script setup lang="ts">
  import { useRouter } from 'vue-router'
  import { reportDestinations as entries, settlementDestinations } from '@/domain/report-navigation'
  const router = useRouter()
  defineProps<{ currency: string }>()
</script>
<style scoped>
  .entry-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .entry-heading p {
    color: var(--el-text-color-secondary);
    margin: 8px 0 0;
    font-size: 13px;
  }
  .entry-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .entry-grid button {
    display: grid;
    gap: 9px;
    text-align: left;
    padding: 16px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    background: var(--el-bg-color);
    color: var(--el-text-color-primary);
    cursor: pointer;
  }
  .entry-grid button:hover,
  .entry-grid button:focus-visible {
    border-color: var(--el-color-primary);
  }
  .entry-grid small,
  .entry-grid span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }
  .entry-grid strong {
    font-size: 15px;
  }
  .entry-grid .action {
    color: var(--el-color-primary);
  }
  .finance-entry {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    border-top: 1px solid var(--el-border-color);
    margin-top: 18px;
    padding-top: 18px;
  }
  .finance-entry > span {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  @media (max-width: 900px) {
    .entry-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .entry-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
