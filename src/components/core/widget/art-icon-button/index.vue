<!-- 按钮组件 -->
<template>
  <button
    type="button"
    class="size-8.5 shrink-0 inline-flex flex-cc c-p leading-none text-g-600 dark:text-g-800 text-xl rounded tad-300 hover:bg-hover-color focus-visible:outline-2 focus-visible:outline-[var(--el-color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
    :class="{ 'rounded-full': circle }"
  >
    <ArtSvgIcon :icon="icon" aria-hidden="true"></ArtSvgIcon>
    <slot></slot>
  </button>
</template>

<script lang="ts" setup>
  defineOptions({ name: 'ArtIconButton' })

  interface Props {
    /** 图标名称 */
    icon: string
    /** 圆角按钮 */
    circle?: boolean
  }

  withDefaults(defineProps<Props>(), {})
</script>
