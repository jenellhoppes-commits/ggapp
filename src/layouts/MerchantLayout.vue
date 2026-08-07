<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NConfigProvider,
  NDrawer,
  NDrawerContent,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  NTag,
  darkTheme
} from 'naive-ui'
import type { GlobalThemeOverrides, MenuOption } from 'naive-ui'
import { ExitToAppOutlined, MenuOutlined } from '@vicons/material'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { agentMenuOptions } from '../config/menu-agent'
import { merchantMenuOptions } from '../config/menu-merchant'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const currentRoute = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const collapsed = ref(false)
const showMobileMenu = ref(false)

const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
const isDesktop = breakpoints.greaterOrEqual('md')

const isAgentPortal = computed(() => currentRoute.path.startsWith('/agent'))
const portalTitle = computed(() => isAgentPortal.value ? '代理後台' : '商戶後台')
const portalSubtitle = computed(() => isAgentPortal.value ? '帳務與商戶管理' : '會員、投注與串接')
const portalTag = computed(() => isAgentPortal.value ? 'AGENT' : 'MERCHANT')
const collapsedMark = computed(() => isAgentPortal.value ? 'A' : 'M')
const menuOptions = computed<MenuOption[]>(() => isAgentPortal.value ? agentMenuOptions() : merchantMenuOptions())
const activeKey = computed(() => currentRoute.name as string)

const flattenMenuOptions = (options: MenuOption[]): MenuOption[] => {
  return options.flatMap(option => {
    const children = option.children as MenuOption[] | undefined
    if (option.type === 'group' && children?.length) return flattenMenuOptions(children)
    return [{ ...option, children: undefined }]
  })
}

const visibleMenuOptions = computed(() => collapsed.value ? flattenMenuOptions(menuOptions.value) : menuOptions.value)

const handleLogout = () => {
  authStore.logout()
  router.push(isAgentPortal.value ? '/agent/login' : '/merchant/login')
}

const handleVersionClick = () => {
  console.log(`${portalTitle.value} v0.1.0`)
}

const themeOverrides: GlobalThemeOverrides = {
  Layout: {
    siderColor: '#18181c',
    headerColor: '#18181c',
    headerBorderColor: '#333'
  }
}
</script>

<template>
  <n-config-provider :theme="darkTheme" :theme-overrides="themeOverrides">
    <n-layout has-sider class="portal-shell h-screen bg-[#101014]">
      <n-layout-sider
        v-if="isDesktop"
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        :collapsed="collapsed"
        @collapse="collapsed = true"
        @expand="collapsed = false"
      >
        <div class="flex h-16 items-center justify-center overflow-hidden whitespace-nowrap border-b border-[#333]">
          <span v-if="!collapsed" class="pl-4 text-xl font-bold tracking-widest text-white">{{ portalTitle }}</span>
          <span v-else class="flex h-8 w-8 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 text-sm font-bold text-emerald-300">
            {{ collapsedMark }}
          </span>
        </div>
        <n-menu
          class="portal-menu"
          :class="{ 'portal-menu--icon-only': collapsed }"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="visibleMenuOptions"
          :value="activeKey"
          :inverted="true"
        />
      </n-layout-sider>

      <n-drawer v-model:show="showMobileMenu" :width="280" placement="left" class="bg-[#18181c]">
        <n-drawer-content body-content-style="padding: 0;">
          <div class="flex h-16 items-center justify-center border-b border-[#333] bg-[#18181c]">
            <span class="text-xl font-bold tracking-widest text-white">{{ portalTitle }}</span>
          </div>
          <n-menu
            :options="menuOptions"
            :value="activeKey"
            :inverted="true"
            @update:value="showMobileMenu = false"
          />
        </n-drawer-content>
      </n-drawer>

      <n-layout class="min-w-0">
        <n-layout-header bordered class="flex min-h-16 flex-wrap items-center justify-between gap-3 bg-[#18181c] px-4 py-3 md:h-16 md:flex-nowrap md:px-6 md:py-0">
          <div class="flex min-w-0 items-center">
            <n-button quaternary circle @click="isMobile ? showMobileMenu = true : collapsed = !collapsed">
              <template #icon>
                <n-icon size="24" color="#ccc"><MenuOutlined /></n-icon>
              </template>
            </n-button>
            <n-tag :type="isAgentPortal ? 'warning' : 'info'" size="small" class="ml-3 shrink-0">{{ portalTag }}</n-tag>
            <div class="ml-3 min-w-0 md:hidden">
              <div class="truncate text-sm font-bold text-white">{{ portalTitle }}</div>
              <div class="truncate text-xs text-gray-500">{{ portalSubtitle }}</div>
            </div>
          </div>

          <div class="flex shrink-0 items-center justify-end gap-2 md:flex-none md:gap-4">
            <div class="hidden text-right md:block">
              <div class="text-sm font-bold text-white">{{ portalTitle }}</div>
              <div class="text-xs text-gray-400">{{ portalSubtitle }}</div>
            </div>
            <LanguageSwitcher />
            <div class="flex items-center gap-2">
              <span class="hidden max-w-[180px] truncate text-sm text-gray-400 md:inline">
                {{ t('common.hi') }} <span class="font-bold text-gray-200">{{ authStore.userInfo?.name || portalTag }}</span>
              </span>
              <n-button strong secondary type="error" size="small" aria-label="登出" @click="handleLogout">
                <template #icon><n-icon><ExitToAppOutlined /></n-icon></template>
                <span class="hidden md:inline">{{ t('common.logout') }}</span>
              </n-button>
            </div>
          </div>
        </n-layout-header>

        <n-layout-content class="min-h-[85vh] min-w-0 overflow-auto bg-[#101014] p-4 md:p-6">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </n-layout-content>
        <n-layout-footer bordered class="p-4 text-center">
          <n-tag :bordered="false" size="small" class="cursor-pointer opacity-50 transition-opacity hover:opacity-100" @click="handleVersionClick">
            Version: v0.1.0 ({{ portalTitle }})
          </n-tag>
        </n-layout-footer>
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<style scoped>
.portal-shell :deep(.n-layout-scroll-container),
.portal-shell :deep(.n-scrollbar-container) {
  scrollbar-width: thin;
  scrollbar-color: #2f3037 #101014;
}

.portal-shell :deep(.n-layout-scroll-container::-webkit-scrollbar),
.portal-shell :deep(.n-scrollbar-container::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

.portal-shell :deep(.n-layout-scroll-container::-webkit-scrollbar-thumb),
.portal-shell :deep(.n-scrollbar-container::-webkit-scrollbar-thumb) {
  border-radius: 999px;
  background: #2f3037;
}

.portal-shell :deep(.n-layout-scroll-container::-webkit-scrollbar-track),
.portal-shell :deep(.n-scrollbar-container::-webkit-scrollbar-track) {
  background: #101014;
}

.portal-menu--icon-only :deep(.n-menu-item-content) {
  width: 64px;
  padding-left: 0 !important;
  padding-right: 0 !important;
  justify-content: center;
}

.portal-menu--icon-only :deep(.n-menu-item-content__icon) {
  margin-right: 0 !important;
}

.portal-menu--icon-only :deep(.n-menu-item-content-header),
.portal-menu--icon-only :deep(.n-menu-item-content__arrow) {
  display: none !important;
}
</style>
