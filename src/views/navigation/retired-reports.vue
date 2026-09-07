<template>
  <section class="retired-report">
    <AppPageHeader :title="title" eyebrow="功能狀態" description="五區塊最小原型・本機演示" />
    <ElAlert
      :title="pending ? '此功能尚未實作' : '此功能不在本期範圍'"
      :description="
        pending
          ? '原入口沒有可用查詢或正式資料契約，因此未宣稱移轉完成。供應商核心資料仍保留。'
          : '此入口與操作已停止提供，沒有刪除來源或歷史資料。必要技術錯誤與稽核紀錄保留於系統管理。'
      "
      type="warning"
      :closable="false"
      show-icon
    />
    <p>舊網址的查詢參數已保留，但本頁不執行退役功能、不補款送單、不產生新帳務。</p>
    <ElButton @click="router.push('/business/merchants')">返回商戶管理</ElButton>
  </section>
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  const route = useRoute()
  const router = useRouter()
  const pending = computed(() => route.params.kind === 'providers')
  const title = computed(
    () =>
      (
        ({
          providers: '供應商營運報表尚未開放',
          rtp: '獨立 RTP 報表已停用',
          jackpot: '獎池功能已停用',
          quality: '品質與風控功能已停用',
          activity: '活動與分組功能已停用',
          manual: '補單送單功能已停用',
          payments: '獨立付款與調帳功能未開放',
          configuration: '此獨立設定不在本期範圍'
        }) as Record<string, string>
      )[String(route.params.kind)] || '此功能已停用'
  )
</script>
<style scoped>
  .retired-report {
    display: grid;
    gap: 20px;
  }
  .el-button {
    justify-self: start;
  }
</style>
