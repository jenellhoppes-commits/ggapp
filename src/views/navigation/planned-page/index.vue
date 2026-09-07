<template>
  <div class="planned-page">
    <AppPageHeader
      :title="String(route.meta.title)"
      eyebrow="GGAP 開發演示"
      :description="String(route.meta.description || '')"
    >
      <template #actions><ElTag type="warning">待開發</ElTag></template>
    </AppPageHeader>
    <ElAlert
      title="頁面入口已建立，業務功能尚未實作"
      type="info"
      :closable="false"
      show-icon
      description="本輪只整理選單、頁面路由與角色入口；此頁不會執行查詢、產生帳單或送出付款。"
    />
    <ElCard shadow="never">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="所屬入口">{{ portalLabel }}</ElDescriptionsItem>
        <ElDescriptionsItem label="資料範圍">{{ scopeLabel }}</ElDescriptionsItem>
        <ElDescriptionsItem label="預定功能">{{ route.meta.description }}</ElDescriptionsItem>
        <ElDescriptionsItem label="目前狀態">導覽就緒，等待下一階段開發</ElDescriptionsItem>
      </ElDescriptions>
      <p class="scope-note"
        >正式資料隔離必須由後端登入權杖驗證；前端角色選單僅供演示，不是安全邊界。</p
      >
      <ElButton type="primary" @click="router.push(homePath)">返回本入口總覽</ElButton>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useCommon } from '@/hooks/core/useCommon'

  defineOptions({ name: 'GgapPlannedPage' })
  const route = useRoute()
  const router = useRouter()
  const { homePath } = useCommon()
  const isAgent = computed(() => route.path.startsWith('/agent/'))
  const isMerchant = computed(() => route.path.startsWith('/merchant/'))
  const portalLabel = computed(() =>
    isAgent.value ? '代理後台' : isMerchant.value ? '商戶後台' : '管理者後台'
  )
  const scopeLabel = computed(() =>
    isAgent.value
      ? '僅自身推廣商戶、串接進度、營運摘要與佣金；不含供應商成本與平台毛利。'
      : isMerchant.value
        ? '僅登入商戶自身幣別線、會員、交易與帳單；不提供供應商原始憑證。'
        : '管理者授權範圍內的平台資料。'
  )
</script>

<style scoped>
  .planned-page {
    display: grid;
    gap: 20px;
  }
  .scope-note {
    margin: 20px 0;
    color: var(--art-gray-600);
    line-height: 1.7;
  }
</style>
