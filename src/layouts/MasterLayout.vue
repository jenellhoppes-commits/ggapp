<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NDrawer,
  NDrawerContent,
  NIcon,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NMenu,
  NTag
} from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import { ExitToAppOutlined, MenuRound } from '@vicons/material'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { expandedMasterMenuKeys, masterMenuOptions } from '../config/menu-master'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const collapsed = ref(false)
const showMobileMenu = ref(false)
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
const isDesktop = breakpoints.greaterOrEqual('md')
const mobileDrawerWidth = computed(() => typeof window === 'undefined' ? 288 : Math.min(300, Math.max(280, window.innerWidth - 48)))

const menuOptions = computed<MenuOption[]>(() => masterMenuOptions(t))
const activeKey = computed(() => String(route.name || ''))
const pageTitle = computed(() => String(route.meta.title || 'GGAP'))
const pageCenter = computed(() => String(route.meta.center || '總覽'))

const handleMenuToggle = () => {
  if (isMobile.value) showMobileMenu.value = true
  else collapsed.value = !collapsed.value
}

const handleLogout = () => {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要內容</a>
  <n-layout has-sider class="master-shell">
    <n-layout-sider
      v-if="isDesktop"
      bordered
      collapse-mode="width"
      :collapsed-width="68"
      :width="228"
      :collapsed="collapsed"
      :inverted="true"
      class="master-sider"
    >
      <div class="master-brand" :class="{ 'master-brand--collapsed': collapsed }">
        <span class="master-brand__mark" aria-hidden="true">G</span>
        <span v-if="!collapsed" class="master-brand__text">GGAP 管理者後台</span>
      </div>
      <nav aria-label="管理者主要功能">
        <n-menu
          class="master-menu"
          :collapsed="collapsed"
          :collapsed-width="68"
          :collapsed-icon-size="21"
          :options="menuOptions"
          :value="activeKey"
          :default-expanded-keys="expandedMasterMenuKeys"
          :inverted="true"
        />
      </nav>
    </n-layout-sider>

    <n-drawer v-model:show="showMobileMenu" :width="mobileDrawerWidth" placement="left">
      <n-drawer-content body-content-style="padding: 0" closable title="GGAP 管理者後台">
        <nav aria-label="管理者行動版主要功能">
          <n-menu
            class="master-menu"
            :options="menuOptions"
            :value="activeKey"
            :default-expanded-keys="expandedMasterMenuKeys"
            :inverted="true"
            @update:value="showMobileMenu = false"
          />
        </nav>
      </n-drawer-content>
    </n-drawer>

    <n-layout class="master-workspace">
      <n-layout-header bordered class="master-header">
        <div class="master-header__left">
          <n-button quaternary circle aria-label="開啟或收合主要選單" @click="handleMenuToggle">
            <template #icon><n-icon :component="MenuRound" size="22" /></template>
          </n-button>
          <n-breadcrumb class="master-breadcrumb">
            <n-breadcrumb-item>{{ pageCenter }}</n-breadcrumb-item>
            <n-breadcrumb-item>{{ pageTitle }}</n-breadcrumb-item>
          </n-breadcrumb>
        </div>

        <div class="master-header__right">
          <n-tag type="warning" size="small" :bordered="false">開發演示</n-tag>
          <div class="master-user">
            <strong>{{ authStore.userInfo?.name || 'Admin' }}</strong>
            <span>管理者</span>
          </div>
          <LanguageSwitcher class="master-language" />
          <n-button secondary type="error" size="small" aria-label="登出管理者後台" @click="handleLogout">
            <template #icon><n-icon :component="ExitToAppOutlined" /></template>
            <span class="master-logout-label">登出</span>
          </n-button>
        </div>
      </n-layout-header>

      <n-layout-content id="main-content" class="master-content" tabindex="-1">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>
