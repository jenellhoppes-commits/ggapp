<template>
  <div class="trial-management">
    <AppPageHeader title="試玩管理" eyebrow="廠商管理">
      <template #actions>
        <ElTag type="warning" effect="plain">開發演示・非正式串接</ElTag>
      </template>
    </AppPageHeader>
    <DemoLinks />
  </div>
</template>

<script setup lang="ts">
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import DemoLinks from '@/components/business/provider-hub/DemoLinks.vue'
</script>

<style scoped>
  .trial-management {
    display: grid;
    align-content: start;
    gap: 20px;
    width: 100%;
    min-width: 0;
  }
</style>
