<template>
  <section class="agent-dashboard">
    <AppPageHeader title="儀錶板" description="代理作業概況；僅顯示登入代理授權範圍。" />
    <ElAlert
      v-if="!scope.own"
      type="error"
      :closable="false"
      title="缺少有效代理身分，無法取得概況。"
    />
    <template v-else>
      <div class="cards"
        ><ElCard v-for="card in cards" :key="card.label" shadow="never"
          ><p>{{ card.label }}</p
          ><strong>{{ card.value }}</strong
          ><p
            ><ElButton link type="primary" @click="router.push(card.path)">查看</ElButton></p
          ></ElCard
        ></div
      >
      <ElDescriptions :column="1" border
        ><ElDescriptionsItem label="已確認佣金">尚未提供（佣金公式及來源未完成）</ElDescriptionsItem
        ><ElDescriptionsItem label="付款摘要"
          >尚未提供（付款紀錄未串接）</ElDescriptionsItem
        ></ElDescriptions
      >
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useUserStore } from '@/store/modules/user'
  import { agentScope } from '@/domain/agent-portal'
  const store = useBusinessPartnerStore(),
    user = useUserStore(),
    router = useRouter()
  const scope = computed(() =>
    agentScope(store, {
      roles: user.info.roles || [],
      agentId: user.info.agentId,
      name: user.info.userName || ''
    })
  )
  const cards = computed(() => [
    {
      label: '直屬下級代理',
      value: scope.value.agents.filter((a) => a.parentAgentId === scope.value.own?.id).length,
      path: '/agent/relations?relation=direct'
    },
    { label: '全部下級代理', value: scope.value.agents.length, path: '/agent/relations' },
    {
      label: '直屬商戶',
      value: scope.value.merchants.filter((m) => m.agentId === scope.value.own?.id).length,
      path: '/agent/merchants?relation=direct'
    },
    { label: '轄下商戶', value: scope.value.merchants.length, path: '/agent/merchants' }
  ])
</script>
<style scoped>
  .agent-dashboard {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
    gap: 16px;
  }
  .cards strong {
    font-size: 28px;
  }
</style>
