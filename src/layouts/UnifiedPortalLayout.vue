<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NConfigProvider, NDrawer, NDrawerContent, NLayout, NLayoutContent, NLayoutSider, NMenu, darkTheme } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { breakpointsTailwind, useBreakpoints, useStorage } from '@vueuse/core'
import PortalHeaderBar from '../components/Portal/PortalHeaderBar.vue'
import { masterMenuOptions } from '../config/menu-master'
import { agentMenuOptions } from '../config/menu-agent'
import { merchantMenuOptions } from '../config/menu-merchant'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const collapsed = ref(false)
const showMobileMenu = ref(false)
const themeMode = useStorage<'dark' | 'light'>('ggap:portal-theme', 'dark')
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
const isDesktop = breakpoints.greaterOrEqual('md')

const portal = computed<'admin' | 'agent' | 'merchant'>(() => {
  const matchedPortal = [...route.matched].reverse().find(record => record.meta.portal)?.meta.portal
  return matchedPortal === 'agent' || matchedPortal === 'merchant' ? matchedPortal : 'admin'
})
const portalTitle = computed(() => portal.value === 'admin' ? 'GGAP 管理者後台' : portal.value === 'agent' ? 'GGAP 代理後台' : 'GGAP 商戶後台')
const portalMark = computed(() => portal.value === 'admin' ? 'G' : portal.value === 'agent' ? 'A' : 'M')
const menuOptions = computed<MenuOption[]>(() => portal.value === 'admin' ? masterMenuOptions(() => '') : portal.value === 'agent' ? agentMenuOptions() : merchantMenuOptions())
const activeKey = computed(() => String(route.name || ''))
const mobileDrawerWidth = computed(() => typeof window === 'undefined' ? 288 : Math.min(300, Math.max(280, window.innerWidth - 48)))

const handleMenu = () => {
  if (isMobile.value) showMobileMenu.value = true
  else collapsed.value = !collapsed.value
}

const handleLogout = () => {
  const loginPath = portal.value === 'admin' ? '/admin/login' : portal.value === 'agent' ? '/agent/login' : '/merchant/login'
  authStore.logout()
  void router.push(loginPath)
}
</script>

<template>
  <n-config-provider :theme="themeMode === 'dark' ? darkTheme : null">
    <a class="skip-link" href="#portal-main-content">跳到主要內容</a>
    <n-layout has-sider class="portal-shell" :class="`portal-theme-${themeMode}`">
      <n-layout-sider v-if="isDesktop" bordered collapse-mode="width" :collapsed-width="68" :width="224" :collapsed="collapsed" class="portal-sider">
        <div class="portal-brand" :class="{ 'portal-brand--collapsed': collapsed }">
          <span class="portal-brand__mark">{{ portalMark }}</span><span v-if="!collapsed">{{ portalTitle }}</span>
        </div>
        <nav :aria-label="`${portalTitle}主要功能`">
          <n-menu class="portal-menu" :collapsed="collapsed" :collapsed-width="68" :collapsed-icon-size="21" :options="menuOptions" :value="activeKey" />
        </nav>
      </n-layout-sider>

      <n-drawer v-model:show="showMobileMenu" :width="mobileDrawerWidth" placement="left">
        <n-drawer-content :title="portalTitle" body-content-style="padding: 0" closable>
          <nav :aria-label="`${portalTitle}行動版主要功能`"><n-menu :options="menuOptions" :value="activeKey" @update:value="showMobileMenu = false" /></nav>
        </n-drawer-content>
      </n-drawer>

      <n-layout class="portal-workspace">
        <PortalHeaderBar :portal="portal" :theme-mode="themeMode" @menu="handleMenu" @update:theme-mode="themeMode = $event" @logout="handleLogout" />
        <n-layout-content id="portal-main-content" class="portal-content" tabindex="-1">
          <router-view v-slot="{ Component }"><transition name="fade" mode="out-in"><component :is="Component" /></transition></router-view>
        </n-layout-content>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>
