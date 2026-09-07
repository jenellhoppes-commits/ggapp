<template>
  <ElForm
    class="app-filter-form"
    :label-position="mobile ? 'top' : 'right'"
    :label-width="mobile ? 'auto' : FILTER_LABEL_WIDTH"
    v-bind="$attrs"
  >
    <slot />
  </ElForm>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useWindowSize } from '@vueuse/core'
  import { FILTER_LABEL_WIDTH, FILTER_MOBILE_BREAKPOINT } from '@/utils/form/filter-layout'
  defineOptions({ name: 'AppFilterForm', inheritAttrs: false })
  const { width } = useWindowSize()
  const mobile = computed(() => width.value < FILTER_MOBILE_BREAKPOINT)
</script>

<style scoped lang="scss">
  .app-filter-form {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 12px;
    align-items: start;
  }
  .app-filter-form :deep(.el-form-item) {
    min-width: 0;
    margin: 0;
  }
  .app-filter-form :deep(.el-form-item__content) {
    min-width: 0;
  }
  .app-filter-form :deep(.filter-actions .el-form-item__content) {
    gap: 8px;
  }
  .app-filter-form :deep(.el-form-item__content > .el-input),
  .app-filter-form :deep(.el-form-item__content > .el-select),
  .app-filter-form :deep(.el-form-item__content > .el-date-editor) {
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }
  .app-filter-form :deep(.filter-actions),
  .app-filter-form :deep(.form-actions) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .app-filter-form :deep(.filter-actions .el-button + .el-button),
  .app-filter-form :deep(.form-actions .el-button + .el-button) {
    margin-left: 0;
  }
  @media (width < 640px) {
    .app-filter-form {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
