<template><PartnerCreateForm :key="kind" :kind="kind" /></template>
<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import PartnerCreateForm from '@/components/business/PartnerCreateForm.vue'
  const route = useRoute()
  const kind = computed(() => (route.name === 'AgentPortalCreateAgent' ? 'agent' : 'merchant'))
</script>
