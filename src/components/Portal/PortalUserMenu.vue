<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { NAvatar, NButton, NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NPopover, useDialog } from 'naive-ui'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import PortalUserMenuPanel from './PortalUserMenuPanel.vue'

const props = defineProps<{
  name: string
  account: string
  roleLabel: string
  dataScope: string
  themeMode: 'dark' | 'light'
}>()

const emit = defineEmits<{
  (e: 'update:themeMode', value: 'dark' | 'light'): void
  (e: 'logout'): void
}>()

const { locale } = useI18n()
const dialog = useDialog()
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
const menuOpen = ref(false)
const showAccess = ref(false)
const triggerRef = ref<InstanceType<typeof NButton> | null>(null)
const fullscreenSupported = computed(() => !isMobile.value && typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen))

const returnFocus = async () => {
  await nextTick()
  const element = triggerRef.value?.$el as HTMLElement | undefined
  element?.focus()
}

const closeMenu = async () => {
  menuOpen.value = false
  await returnFocus()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && menuOpen.value) void closeMenu()
}

const openAccess = () => {
  menuOpen.value = false
  showAccess.value = true
}

const updateLanguage = (value: string) => {
  locale.value = value
  localStorage.setItem('ggap:portal-language', value)
}

const toggleFullscreen = async () => {
  if (!fullscreenSupported.value) return
  if (document.fullscreenElement) await document.exitFullscreen()
  else await document.documentElement.requestFullscreen()
  menuOpen.value = false
}

const requestLogout = () => {
  menuOpen.value = false
  if (sessionStorage.getItem('ggap:unsaved') !== '1') {
    emit('logout')
    return
  }
  dialog.warning({
    title: '尚有未儲存內容',
    content: '離開後未儲存的內容將不會保留，確定登出嗎？',
    positiveText: '仍要登出',
    negativeText: '繼續編輯',
    onPositiveClick: () => emit('logout')
  })
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <n-button
    ref="triggerRef"
    quaternary
    circle
    class="portal-avatar-button"
    aria-label="開啟使用者選單"
    :aria-expanded="menuOpen"
    @click="menuOpen = !menuOpen"
  >
    <n-avatar round size="small">{{ name.slice(0, 1).toUpperCase() }}</n-avatar>
  </n-button>

  <n-popover
    v-if="!isMobile"
    :show="menuOpen"
    trigger="manual"
    placement="bottom-end"
    :width="300"
    :show-arrow="false"
    @clickoutside="closeMenu"
  >
    <template #trigger><span class="portal-user-menu-anchor" aria-hidden="true" /></template>
    <PortalUserMenuPanel
      v-bind="props"
      :fullscreen-supported="fullscreenSupported"
      @account="openAccess"
      @update:theme-mode="emit('update:themeMode', $event)"
      @fullscreen="toggleFullscreen"
      @language="updateLanguage"
      @logout="requestLogout"
    />
  </n-popover>

  <n-drawer v-else :show="menuOpen" placement="bottom" height="min(520px, 86dvh)" @update:show="value => !value && closeMenu()">
    <n-drawer-content title="使用者選單" closable>
      <PortalUserMenuPanel
        v-bind="props"
        :fullscreen-supported="false"
        @account="openAccess"
        @update:theme-mode="emit('update:themeMode', $event)"
        @fullscreen="toggleFullscreen"
        @language="updateLanguage"
        @logout="requestLogout"
      />
    </n-drawer-content>
  </n-drawer>

  <n-drawer v-model:show="showAccess" placement="right" width="min(520px, calc(100vw - 16px))">
    <n-drawer-content title="帳號與權限" closable>
      <n-descriptions bordered label-placement="left" :column="1">
        <n-descriptions-item label="使用者">{{ name }}</n-descriptions-item>
        <n-descriptions-item label="登入帳號">{{ account }}</n-descriptions-item>
        <n-descriptions-item label="角色">{{ roleLabel }}</n-descriptions-item>
        <n-descriptions-item label="資料範圍">{{ dataScope }}</n-descriptions-item>
      </n-descriptions>
    </n-drawer-content>
  </n-drawer>
</template>
