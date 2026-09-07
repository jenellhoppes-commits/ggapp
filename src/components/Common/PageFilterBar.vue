<script setup lang="ts">
import { NButton, NIcon, NInput } from 'naive-ui'
import { ExpandMoreRound, RefreshRound, SearchRound } from '@vicons/material'

interface Props {
  searchPlaceholder?: string
  searchValue?: string
  showSearch?: boolean
  showMore?: boolean
  moreExpanded?: boolean
  activeFilterSummary?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: '輸入關鍵字',
  searchValue: '',
  showSearch: true,
  showMore: false,
  moreExpanded: false,
  activeFilterSummary: '',
  loading: false
})

const emit = defineEmits<{
  (e: 'update:searchValue', value: string): void
  (e: 'update:moreExpanded', value: boolean): void
  (e: 'search'): void
  (e: 'reset'): void
}>()
</script>

<template>
  <form class="page-filter-bar" role="search" aria-label="頁面查詢條件" @submit.prevent="emit('search')">
    <div class="page-filter-bar__main">
      <n-input
        v-if="showSearch"
        :value="props.searchValue"
        :placeholder="searchPlaceholder"
        clearable
        class="page-filter-bar__search"
        aria-label="關鍵字"
        @update:value="value => emit('update:searchValue', value)"
      >
        <template #prefix><n-icon :component="SearchRound" /></template>
      </n-input>

      <div class="page-filter-bar__filters">
        <slot name="filters" />
      </div>

      <div class="page-filter-bar__actions">
        <n-button
          v-if="showMore"
          attr-type="button"
          secondary
          :aria-expanded="moreExpanded"
          aria-controls="page-filter-more"
          @click="emit('update:moreExpanded', !moreExpanded)"
        >
          更多條件
          <template #icon>
            <n-icon :component="ExpandMoreRound" :class="{ 'rotate-180': moreExpanded }" />
          </template>
        </n-button>
        <slot name="actions" />
        <n-button type="primary" attr-type="submit" :loading="loading">
          <template #icon><n-icon :component="SearchRound" /></template>
          查詢
        </n-button>
        <n-button attr-type="button" :disabled="loading" @click="emit('reset')">
          <template #icon><n-icon :component="RefreshRound" /></template>
          重置
        </n-button>
      </div>
    </div>

    <div v-if="activeFilterSummary" class="page-filter-bar__summary" aria-live="polite">
      已套用：{{ activeFilterSummary }}
    </div>

    <div v-if="showMore && moreExpanded" id="page-filter-more" class="page-filter-bar__more">
      <slot name="more" />
    </div>
  </form>
</template>
