<template>
  <section
    ><AppPageHeader
      title="結算明細"
      description="僅呈現本商戶逐供應商收費，不提供上游成本或付款操作。" /><IntegratedSettlement
      v-if="user.info.merchantId"
      kind="merchant"
      :owner-id="user.info.merchantId"
      title="本商戶結算"
  /></section>
</template>
<script setup lang="ts">
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import IntegratedSettlement from '@/components/business/IntegratedSettlement.vue'
  import { useUserStore } from '@/store/modules/user'
  const user = useUserStore()
  defineOptions({ name: 'MerchantPortalSettlements' })
</script>
