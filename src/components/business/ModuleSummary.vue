<template>
  <ElCard shadow="never" class="module-summary">
    <div class="summary-heading">
      <strong>摘要與匯出</strong><span>既有示範彙總；不作正式帳務依據</span>
      <ElButton v-if="selected" @click="select('')">收合摘要</ElButton>
    </div>
    <ElTabs :model-value="selected" @tab-change="select">
      <ElTabPane v-for="item in available" :key="item.mode" :name="item.mode" :label="item.label" />
    </ElTabs>
    <ReportQuery v-if="selected" :embedded-mode="selected" :key="selected" />
    <p v-else>選擇摘要項目後，在本頁查詢及匯出；下方管理列表仍保留。</p>
  </ElCard>
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import type { ReportMode } from '@/types/game-provider'
  import ReportQuery from '@/views/game-provider/reports/index.vue'
  const props = defineProps<{ modes: ReportMode[] }>()
  const labels: Partial<Record<ReportMode, string>> = {
    overview: '原幣營運摘要',
    merchant: '商戶摘要',
    'merchant-line': '線路摘要',
    agent: '代理摘要',
    'agent-merchant': '關聯商戶摘要',
    'game-performance': '遊戲表現',
    member: '會員統計',
    bet: '注單統計',
    transaction: '交易統計'
  }
  const route = useRoute()
  const router = useRouter()
  const available = computed(() =>
    props.modes.map((mode) => ({ mode, label: labels[mode] || mode }))
  )
  const selected = computed(() =>
    props.modes.includes(route.query.summary as ReportMode)
      ? (route.query.summary as ReportMode)
      : undefined
  )
  const select = (value: string | number) =>
    router.push({ query: { ...route.query, summary: String(value) || undefined, page: '1' } })
</script>
<style scoped>
  .module-summary {
    min-width: 0;
  }
  .summary-heading {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .summary-heading span,
  p {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
</style>
