<template>
  <section class="system-workspace">
    <ElTabs :model-value="route.path" @tab-change="openTab">
      <ElTabPane
        v-for="tab in tabs"
        :key="tab.path"
        :name="tab.path"
        :label="String(tab.meta.tabTitle)"
      />
    </ElTabs>
    <component :is="page" :key="route.name" v-if="page" />
    <ElEmpty v-else description="此設定尚未提供可用介面" />
  </section>
</template>
<script setup lang="ts">
  import { computed, defineAsyncComponent } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  const route = useRoute()
  const router = useRouter()
  const sources = import.meta.glob('../game-provider/**/*.vue')
  const planned = () => import('./planned-page/index.vue')
  const tabs = computed(() =>
    router
      .getRoutes()
      .filter((r) => r.meta.workspace === route.meta.workspace && r.meta.sourceComponent)
  )
  const page = computed(() => {
    const source = String(route.meta.sourceComponent || '')
    const key = `..${source}.vue`
    const loader =
      source === '/navigation/planned-page'
        ? planned
        : sources[key] || sources[`..${source}/index.vue`]
    return loader ? defineAsyncComponent(loader as () => Promise<any>) : undefined
  })
  const openTab = (path: string | number) => router.push(String(path))
</script>
<style scoped>
  .system-workspace {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
</style>
