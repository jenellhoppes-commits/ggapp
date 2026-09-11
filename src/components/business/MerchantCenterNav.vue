<template>
  <PortalTabs v-if="links.length" :model-value="String(route.query.tab || (gameCenter ? 'games' : 'bets'))" :tabs="links.map(([value,label]) => ({value,label}))" @update:model-value="tab => router.push({ path: gameCenter ? '/merchant/games' : '/merchant/bets', query: { tab } })" />
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PortalTabs from './PortalTabs.vue'
import { useMerchantDemoAccess } from '@/composables/useMerchantDemoAccess'
const route = useRoute()
const router = useRouter()
const demoAllowed = useMerchantDemoAccess()
const gameCenter = computed(() => ['/merchant/games', '/merchant/lines', '/merchant/demo-links'].includes(route.path))
const groups = [
  [['games', '可用遊戲'], ['lines', '線路資訊'], ['demo-links', '試玩連結']],
  [['bets', '注單查詢'], ['transactions', '交易流水']]
]
const links = computed(() => (groups.find((g) => g.some(([p]) => route.path === '/merchant/' + p)) || []).filter(([p]) => p !== 'demo-links' || demoAllowed.value))
</script>
<style scoped>
.center-links { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 16px; }
a { padding: 10px 0; color: var(--el-text-color-regular); }
a[aria-current='page'] { color: var(--el-color-primary); border-bottom: 2px solid var(--el-color-primary); }
</style>
