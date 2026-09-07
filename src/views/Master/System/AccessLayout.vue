<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabPane, NTabs } from 'naive-ui'

const route = useRoute()
const router = useRouter()
const tabs = [
  { name: 'AccessAccounts', label: '後台帳號', path: '/platform/access/accounts' },
  { name: 'AccessRoles', label: '角色管理', path: '/platform/access/roles' },
  { name: 'AccessLogs', label: '操作紀錄', path: '/platform/access/logs' }
]
const active = computed(() => String(route.name || 'AccessLogs'))
const changeTab = (name: string) => {
  const target = tabs.find(tab => tab.name === name)
  if (target) void router.push(target.path)
}
</script>

<template>
  <div class="page-stack">
    <nav aria-label="人員與權限功能">
      <n-tabs :value="active" type="line" @update:value="changeTab">
        <n-tab-pane v-for="tab in tabs" :key="tab.name" :name="tab.name" :tab="tab.label" />
      </n-tabs>
    </nav>
    <router-view />
  </div>
</template>
