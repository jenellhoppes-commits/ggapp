<script setup lang="ts">
import { NAlert, NButton, NEmpty, NIcon, NSkeleton } from 'naive-ui'
import { LockOutlined, RefreshRound } from '@vicons/material'

type StateKind = 'loading' | 'empty' | 'error' | 'forbidden'

withDefaults(defineProps<{
  kind: StateKind
  title?: string
  description?: string
  traceId?: string
  compact?: boolean
}>(), {
  title: '',
  description: '',
  traceId: '',
  compact: false
})

const emit = defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <div v-if="kind === 'loading'" class="page-state" :class="{ 'page-state--compact': compact }" role="status" aria-live="polite">
    <span class="sr-only">資料載入中</span>
    <n-skeleton text :repeat="compact ? 2 : 5" />
  </div>

  <div v-else-if="kind === 'empty'" class="page-state" :class="{ 'page-state--compact': compact }">
    <n-empty :description="description || '目前沒有符合條件的資料'">
      <template #extra><slot /></template>
    </n-empty>
  </div>

  <n-alert v-else-if="kind === 'error'" class="page-state" type="error" :title="title || '資料載入失敗'" :show-icon="true">
    <p>{{ description || '請保留目前條件並重新嘗試。' }}</p>
    <p v-if="traceId" class="mt-1 font-mono text-xs">Trace ID：{{ traceId }}</p>
    <n-button class="mt-3" size="small" secondary @click="emit('retry')">
      <template #icon><n-icon :component="RefreshRound" /></template>
      重試
    </n-button>
  </n-alert>

  <n-alert v-else class="page-state" type="warning" :title="title || '無權限查看'" :show-icon="true">
    <template #icon><n-icon :component="LockOutlined" /></template>
    {{ description || '目前帳號沒有這個區塊的資料權限。' }}
  </n-alert>
</template>
