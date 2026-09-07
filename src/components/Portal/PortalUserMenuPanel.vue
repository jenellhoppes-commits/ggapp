<script setup lang="ts">
import { NButton, NDivider, NIcon, NSelect, NSwitch, NTag } from 'naive-ui'
import {
  AccountCircleOutlined,
  DarkModeOutlined,
  FullscreenOutlined,
  LogOutOutlined,
  TranslateOutlined
} from '@vicons/material'

defineProps<{
  name: string
  account: string
  roleLabel: string
  dataScope: string
  themeMode: 'dark' | 'light'
  fullscreenSupported: boolean
}>()

const emit = defineEmits<{
  (e: 'account'): void
  (e: 'update:themeMode', value: 'dark' | 'light'): void
  (e: 'fullscreen'): void
  (e: 'language', value: string): void
  (e: 'logout'): void
}>()

const languageOptions = [
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en' }
]
</script>

<template>
  <div class="portal-user-panel" role="menu" aria-label="使用者選單">
    <div class="portal-user-panel__summary">
      <div class="portal-user-panel__avatar" aria-hidden="true">{{ name.slice(0, 1).toUpperCase() }}</div>
      <div><strong :title="name">{{ name }}</strong><span :title="account">{{ account }}</span><n-tag size="tiny" :bordered="false">{{ roleLabel }}</n-tag></div>
    </div>

    <n-divider />
    <n-button text block class="portal-user-panel__item" role="menuitem" @click="emit('account')">
      <template #icon><n-icon :component="AccountCircleOutlined" /></template>
      帳號與權限
    </n-button>

    <n-divider title-placement="left">顯示偏好</n-divider>
    <div class="portal-user-panel__setting">
      <span><n-icon :component="DarkModeOutlined" />深色模式</span>
      <n-switch
        :value="themeMode === 'dark'"
        aria-label="切換深色模式"
        @update:value="value => emit('update:themeMode', value ? 'dark' : 'light')"
      />
    </div>
    <n-button text block class="portal-user-panel__item" role="menuitem" :disabled="!fullscreenSupported" @click="emit('fullscreen')">
      <template #icon><n-icon :component="FullscreenOutlined" /></template>
      全螢幕顯示
    </n-button>
    <label class="portal-user-panel__language">
      <span><n-icon :component="TranslateOutlined" />介面語言</span>
      <n-select :default-value="'zh-TW'" size="small" :options="languageOptions" aria-label="介面語言" @update:value="emit('language', $event)" />
    </label>

    <n-divider />
    <n-button text block type="error" class="portal-user-panel__item" role="menuitem" @click="emit('logout')">
      <template #icon><n-icon :component="LogOutOutlined" /></template>
      登出
    </n-button>
  </div>
</template>
