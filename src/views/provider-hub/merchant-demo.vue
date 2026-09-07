<template>
  <div
    ><AppPageHeader
      title="試玩連結"
      description="僅管理自身商戶的授權遊戲試玩，不代表 API 串接驗收通過。" /><ElCard
      ><DemoLinks /></ElCard
  ></div>
</template>
<script setup lang="ts">
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import DemoLinks from '@/components/business/provider-hub/DemoLinks.vue'
</script>
