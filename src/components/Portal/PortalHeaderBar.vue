<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAutoComplete, NBadge, NButton, NIcon, NPopover, NTag } from 'naive-ui'
import { MenuRound, NotificationsNoneOutlined, SearchRound, TaskAltOutlined } from '@vicons/material'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { useAuthStore } from '../../stores/auth'
import PortalUserMenu from './PortalUserMenu.vue'

const props = defineProps<{
  portal: 'admin' | 'agent' | 'merchant'
  themeMode: 'dark' | 'light'
}>()

const emit = defineEmits<{
  (e: 'menu'): void
  (e: 'update:themeMode', value: 'dark' | 'light'): void
  (e: 'logout'): void
}>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const breakpoints = useBreakpoints(breakpointsTailwind)
const isMobile = breakpoints.smaller('md')
const searchOpen = ref(false)
const searchValue = ref('')

const agentSearch = [
  ['代理總覽', '/agent/dashboard'], ['商戶管理', '/agent/merchants'], ['下級代理', '/agent/organization/sub-agents'],
  ['對帳與佣金', '/agent/finance/accounting'], ['報表查詢', '/agent/reports']
]
const merchantSearch = [
  ['商戶總覽', '/merchant/dashboard'], ['會員查詢', '/merchant/players'], ['我的遊戲', '/merchant/games'],
  ['注單查詢', '/merchant/betting/bets'], ['交易流水', '/merchant/betting/transactions'], ['對帳與帳單', '/merchant/finance/invoices'],
  ['報表查詢', '/merchant/reports'], ['串接設定', '/merchant/integration']
]
const adminSearch = [
  ['營運儀錶板', '/admin/dashboard'], ['供應商管理', '/admin/game-center/providers'], ['遊戲管理', '/admin/game-center/list'],
  ['注單管理', '/admin/transactions/bets'], ['商戶對帳', '/admin/finance/merchant-accounting'], ['操作紀錄', '/platform/access/logs']
]
const searchOptions = computed(() => (props.portal === 'admin' ? adminSearch : props.portal === 'agent' ? agentSearch : merchantSearch).map(([label, value]) => ({ label, value })))
const roleLabel = computed(() => props.portal === 'admin' ? '管理者' : props.portal === 'agent' ? '代理' : '商戶')
const dataScope = computed(() => props.portal === 'admin' ? '依管理者角色授權範圍' : props.portal === 'agent' ? '自己、下級代理與所屬商戶' : '目前商戶自身資料')
const pendingLabel = computed(() => props.portal === 'admin' ? '營運與對帳待處理' : props.portal === 'agent' ? '商戶草稿與對帳待核對' : '串接缺項與帳單差異')
const notices = computed(() => props.portal === 'admin'
  ? ['供應商線路與對帳仍有待處理項目']
  : props.portal === 'agent'
    ? ['有商戶草稿等待補齊資料', '對帳來源仍有待核對項目']
    : ['API 來源 IP 尚待確認', '有帳單來源缺少匯率版本'])
const pendingPath = computed(() => props.portal === 'admin' ? '/admin/dashboard?focus=pending' : props.portal === 'agent' ? '/agent/dashboard?focus=pending' : '/merchant/dashboard?focus=pending')
const routeContext = computed(() => `${String(route.meta.center || roleLabel.value)} ／ ${String(route.meta.title || '')}`)

const selectSearch = (value: string) => {
  searchValue.value = ''
  searchOpen.value = false
  void router.push(value)
}
</script>

<template>
  <header class="portal-header-bar">
    <div class="portal-header-bar__left">
      <n-button quaternary circle aria-label="開啟或收合主要選單" @click="emit('menu')">
        <template #icon><n-icon :component="MenuRound" /></template>
      </n-button>
      <n-tag type="warning" size="small" :bordered="false">Sandbox 演示</n-tag>
      <span class="portal-route-context">{{ routeContext }}</span>
    </div>

    <div class="portal-header-bar__right">
      <n-button class="portal-pending-button" secondary size="small" :aria-label="`待處理：${pendingLabel}`" @click="router.push(pendingPath)">
        <template #icon><n-icon :component="TaskAltOutlined" /></template>
        <span>待處理</span>
      </n-button>

      <div class="portal-search" :class="{ 'portal-search--open': searchOpen }">
        <n-auto-complete
          v-if="!isMobile || searchOpen"
          v-model:value="searchValue"
          :options="searchOptions"
          placeholder="搜尋功能"
          aria-label="搜尋目前入口功能"
          clear-after-select
          @select="selectSearch"
        />
        <kbd v-if="!isMobile">Ctrl K</kbd>
        <n-button v-else quaternary circle aria-label="開啟功能搜尋" @click="searchOpen = !searchOpen">
          <template #icon><n-icon :component="SearchRound" /></template>
        </n-button>
      </div>

      <n-popover trigger="click" placement="bottom-end" :width="280">
        <template #trigger>
          <n-button quaternary circle aria-label="查看通知">
            <n-badge dot :show="notices.length > 0"><n-icon :component="NotificationsNoneOutlined" size="21" /></n-badge>
          </n-button>
        </template>
        <div class="portal-notice-list">
          <strong>通知</strong>
          <p v-for="notice in notices" :key="notice">{{ notice }}</p>
        </div>
      </n-popover>

      <PortalUserMenu
        :name="authStore.userInfo?.name || roleLabel"
        :account="authStore.userInfo?.account || authStore.userInfo?.id || 'demo'"
        :role-label="roleLabel"
        :data-scope="dataScope"
        :theme-mode="themeMode"
        @update:theme-mode="emit('update:themeMode', $event)"
        @logout="emit('logout')"
      />
    </div>
  </header>
</template>
