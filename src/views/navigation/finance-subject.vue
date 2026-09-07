<template>
  <section class="subject"
    ><h1>請選擇帳務主體</h1
    ><ElAlert
      title="舊網址未指定帳務主體，不會自動挑選商戶、供應商或代理的結果。"
      type="info"
      :closable="false"
    /><ElButton
      v-for="entry in settlementDestinations"
      :key="entry.path"
      @click="router.push({ path: entry.path, query: route.query })"
      >{{ entry.title }}</ElButton
    ></section
  >
</template>
<script setup lang="ts">
  import { useRoute, useRouter } from 'vue-router'
  import { settlementDestinations } from '@/domain/report-navigation'
  const route = useRoute(),
    router = useRouter()
</script>
<style scoped>
  .subject {
    display: grid;
    gap: 16px;
  }
  .subject .el-button {
    margin: 0;
    justify-self: start;
  }
</style>
