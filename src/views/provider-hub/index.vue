<template>
  <div class="provider-hub">
    <AppPageHeader
      :title="tab === 'games' ? '遊戲管理' : '供應商管理'"
      eyebrow="廠商管理"
      description="供應商、幣別線路與遊戲資料。"
    >
      <template #actions
        ><ElTag type="warning" effect="plain">開發演示・非正式串接</ElTag></template
      >
    </AppPageHeader>
    <div class="metrics">
      <div class="metric"
        ><small>全部供應商</small><strong>{{ store.state.providers.length }}</strong></div
      >
      <div class="metric"
        ><small>全部遊戲</small><strong>{{ store.state.games.length }}</strong></div
      >
      <div class="metric"
        ><small>全部幣別線路</small
        ><strong>{{
          store.state.providers.reduce((total, p) => total + p.lines.length, 0)
        }}</strong></div
      >
      <div class="metric"
        ><small>啟用幣別線路</small
        ><strong>{{
          store.state.providers.reduce(
            (total, p) => total + p.lines.filter((line) => line.config?.status === 'active').length,
            0
          )
        }}</strong></div
      >
    </div>
    <section class="module-content">
      <ProvidersPanel v-if="tab === 'providers'" />
      <GamesPanel v-else />
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import ProvidersPanel from '@/components/business/provider-hub/ProvidersPanel.vue'
  import GamesPanel from '@/components/business/provider-hub/GamesPanel.vue'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  const store = useProviderDemoStore()
  const route = useRoute()
  const tab = computed(() => (route.path.includes('/games') ? 'games' : 'providers'))
</script>

<style scoped>
  .provider-hub {
    display: grid;
    gap: 20px;
    width: 100%;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .metric {
    padding: 16px 0;
    border-bottom: 1px solid var(--el-border-color);
  }
  .module-content {
    min-width: 0;
  }
  .metrics small {
    display: block;
    color: var(--el-text-color-secondary);
  }
  .metrics strong {
    display: block;
    font-size: 28px;
    margin-top: 10px;
  }
  .toolbar {
    display: flex;
    gap: 12px;
    margin: 20px 0;
    flex-wrap: wrap;
  }
  .toolbar .el-input,
  .toolbar .el-select {
    width: 260px;
  }
  .hint {
    margin-top: 20px;
    line-height: 1.8;
    color: var(--el-text-color-secondary);
  }
  .tag {
    margin: 3px;
  }
  @media (max-width: 700px) {
    .metrics {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 12px;
    }
    .metric {
      padding: 10px 0;
    }
    .metrics strong {
      margin-top: 4px;
      font-size: 22px;
    }
  }
</style>
