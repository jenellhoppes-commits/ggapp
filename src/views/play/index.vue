<template>
  <main class="play-page">
    <ElCard class="play-card">
      <ElTag type="warning">GGAP・前端試玩演示</ElTag>
      <h1>{{ game?.name || '遊戲試玩連結' }}</h1>
      <p>這是啟動流程演示，並非可投注遊戲或商戶串接測試。</p>
      <ElDescriptions v-if="link" :column="1" border class="mt-4">
        <ElDescriptionsItem label="試玩方式">{{ modeLabel(link.mode) }}</ElDescriptionsItem>
        <ElDescriptionsItem label="幣別線">{{ link.lineId }}</ElDescriptionsItem>
        <ElDescriptionsItem label="狀態">{{
          linkStatus(store.state, link, now.getTime())
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="到期時間">{{
          new Date(link.expiresAt).toLocaleString('zh-TW')
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="成功次數（模擬）"
          >{{ link.starts }} / {{ link.maxStarts ?? '不限' }}</ElDescriptionsItem
        >
      </ElDescriptions>
      <ElAlert
        v-else
        title="連結不存在、已失效，或不在目前瀏覽器演示資料中。"
        type="error"
        :closable="false"
        class="mt-4"
      />
      <div class="actions"
        ><ElCheckbox v-model="failure">模擬供應商啟動失敗</ElCheckbox
        ><ElButton
          type="primary"
          :loading="busy"
          :disabled="!link || linkStatus(store.state, link, now.getTime()) !== '有效'"
          @click="launch"
          >{{ session ? '再次模擬啟動' : '模擬開啟試玩' }}</ElButton
        ></div
      >
      <ElAlert v-if="error" :title="error" type="error" :closable="false" />
      <div v-if="session" class="session">
        <h2>獨立試玩連線已建立（模擬）</h2>
        <p>連線識別碼：{{ session.id }}</p
        ><p>此處預留供應商遊戲容器，目前沒有真實啟動網址。</p>
        <ElTag type="info">不計入正式統計及帳務</ElTag>
      </div>
      <p class="hint"
        >停用或重新產生連結只阻止後續啟動，不保證終止既有遊戲。網址參數不會改變試玩身分。</p
      >
    </ElCard>
  </main>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useNow } from '@vueuse/core'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { launchDemo, linkStatus, modeLabel, type DemoSession } from '@/domain/provider-demo'
  const store = useProviderDemoStore()
  const route = useRoute()
  const now = useNow({ interval: 1000 })
  const link = computed(() => store.state.links.find((item) => item.token === route.params.token))
  const game = computed(() => store.state.games.find((item) => item.id === link.value?.gameId))
  const failure = ref(false)
  const busy = ref(false)
  const error = ref('')
  const session = ref<DemoSession>()
  async function launch() {
    if (busy.value) return
    busy.value = true
    error.value = ''
    session.value = undefined
    try {
      session.value = launchDemo(store.state, String(route.params.token), failure.value)
    } catch (cause) {
      error.value = (cause as Error).message
    } finally {
      busy.value = false
    }
  }
  watch(
    () => route.params.token,
    () => {
      session.value = undefined
      error.value = ''
    }
  )
</script>
<style scoped>
  .play-page {
    min-height: 100vh;
    padding: 40px 20px;
    background: var(--el-bg-color-page);
    display: grid;
    place-items: center;
  }
  .play-card {
    width: min(760px, 100%);
  }
  h1 {
    font-size: 30px;
    margin: 20px 0 12px;
  }
  p {
    line-height: 1.8;
    margin: 14px 0;
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    margin: 24px 0;
  }
  .session {
    border: 1px dashed var(--el-color-primary);
    border-radius: 12px;
    padding: 24px;
    margin-top: 20px;
  }
  .hint {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
</style>
