<template>
  <ElTabs :model-value="modelValue" class="portal-tabs" @update:model-value="value => emit('update:modelValue', String(value))">
    <ElTabPane v-for="tab in tabs" :key="tab.value" :name="tab.value" :label="tab.label" />
  </ElTabs>
</template>
<script setup lang="ts">
defineProps<{ modelValue: string; tabs: {value:string;label:string}[] }>()
const emit = defineEmits<{ 'update:modelValue': [value:string] }>()
</script>
<style scoped>.portal-tabs {min-width:0} .portal-tabs :deep(.el-tabs__header) {margin:0} .portal-tabs :deep(.el-tabs__content) {display:none}</style>
