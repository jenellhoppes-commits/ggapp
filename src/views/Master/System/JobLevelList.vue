<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NAlert,
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NStatistic,
  NTag,
  NTree,
  useMessage
} from 'naive-ui'
import type { DataTableColumns, TreeOption } from 'naive-ui'
import { ContentCopyOutlined, EditOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type RoleStatus = 'enabled' | 'disabled' | 'system'

interface RoleRow {
  id: string
  name: string
  description: string
  status: RoleStatus
  member_count: number
  permission_count: number
  permissions: string[]
  scope: string
  updated_at: string
}

const message = useMessage()
const keyword = ref('')
const statusFilter = ref<RoleStatus | null>(null)
const showDrawer = ref(false)
const drawerMode = ref<'create' | 'edit' | 'view'>('view')
const currentRow = ref<RoleRow | null>(null)
const form = ref({
  id: '',
  name: '',
  description: '',
  status: 'enabled' as RoleStatus,
  permissions: [] as string[],
  scope: '全部後台資料'
})

const permissionOptions: TreeOption[] = [
  {
    key: 'overview',
    label: '總覽',
    children: [
      { key: 'dashboard:read', label: '儀錶板查看' },
      { key: 'report:read', label: '報表查看' },
      { key: 'report:export', label: '報表匯出' }
    ]
  },
  {
    key: 'business',
    label: '商務管理',
    children: [
      { key: 'merchant:read', label: '商戶查看' },
      { key: 'merchant:write', label: '商戶新增 / 編輯' },
      { key: 'agent:read', label: '代理查看' },
      { key: 'agent:write', label: '代理新增 / 編輯' },
      { key: 'rate:write', label: '代理與商戶費率設定' }
    ]
  },
  {
    key: 'content',
    label: '內容管理',
    children: [
      { key: 'provider:write', label: '供應商管理' },
      { key: 'game:write', label: '遊戲管理' },
      { key: 'campaign:write', label: '獎池與活動' }
    ]
  },
  {
    key: 'transactions',
    label: '交易中心',
    children: [
      { key: 'player:read', label: '會員管理' },
      { key: 'bet:read', label: '注單管理' },
      { key: 'ledger:read', label: '交易流水' },
      { key: 'repair:write', label: '補單處理' },
      { key: 'wallet-router:read', label: 'Wallet Router' }
    ]
  },
  {
    key: 'finance',
    label: '財務中心',
    children: [
      { key: 'finance:provider', label: '供應商帳務' },
      { key: 'finance:agent', label: '代理帳務' },
      { key: 'finance:margin', label: '平台毛利' },
      { key: 'finance:adjustment', label: '調帳紀錄' },
      { key: 'finance:exchange-rate', label: '匯率管理' }
    ]
  },
  {
    key: 'quality',
    label: '品質中心',
    children: [
      { key: 'risk:write', label: '風控管理' },
      { key: 'monitoring:read', label: '監控告警' },
      { key: 'audit:read', label: '操作紀錄' }
    ]
  },
  {
    key: 'system',
    label: '系統管理',
    children: [
      { key: 'developer:read', label: '開發者中心' },
      { key: 'system:setting', label: '系統設定' },
      { key: 'staff:write', label: '人員管理' },
      { key: 'role:write', label: '角色權限' }
    ]
  }
]

const allPermissionKeys = permissionOptions.flatMap(group => group.children || []).map(child => String(child.key))

const rows = ref<RoleRow[]>([
  {
    id: 'ROLE-SUPER',
    name: 'Super Administrator',
    description: '最高管理權限，包含所有模組與敏感操作。',
    status: 'system',
    member_count: 1,
    permission_count: allPermissionKeys.length,
    permissions: [...allPermissionKeys],
    scope: '全部後台資料',
    updated_at: '2026-07-07T09:00:00+08:00'
  },
  {
    id: 'ROLE-FINANCE',
    name: 'Finance Manager',
    description: '管理供應商帳務、代理帳務、平台毛利、調帳與匯率。',
    status: 'enabled',
    member_count: 2,
    permission_count: 9,
    permissions: ['dashboard:read', 'report:read', 'report:export', 'finance:provider', 'finance:agent', 'finance:margin', 'finance:adjustment', 'finance:exchange-rate', 'audit:read'],
    scope: '財務中心 + 操作紀錄',
    updated_at: '2026-07-06T18:10:00+08:00'
  },
  {
    id: 'ROLE-OPS',
    name: 'Operations',
    description: '管理商戶、代理、內容、交易與日常補單。',
    status: 'enabled',
    member_count: 5,
    permission_count: 16,
    permissions: ['dashboard:read', 'merchant:read', 'merchant:write', 'agent:read', 'agent:write', 'provider:write', 'game:write', 'campaign:write', 'player:read', 'bet:read', 'ledger:read', 'repair:write', 'wallet-router:read', 'risk:write', 'monitoring:read'],
    scope: '營運資料',
    updated_at: '2026-07-05T14:32:00+08:00'
  },
  {
    id: 'ROLE-AUDIT',
    name: 'Audit Readonly',
    description: '唯讀稽核角色，可查看報表、監控告警與操作紀錄。',
    status: 'enabled',
    member_count: 1,
    permission_count: 5,
    permissions: ['dashboard:read', 'report:read', 'monitoring:read', 'audit:read', 'system:setting'],
    scope: '唯讀資料',
    updated_at: '2026-06-28T10:15:00+08:00'
  }
])

const statusOptions = [
  { label: '啟用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
  { label: '系統角色', value: 'system' }
]
const statusMeta: Record<RoleStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  enabled: { label: '啟用', type: 'success' },
  disabled: { label: '停用', type: 'warning' },
  system: { label: '系統角色', type: 'error' }
}

const filteredRows = computed(() => rows.value.filter((row) => {
  const text = keyword.value.trim().toLowerCase()
  const matchesKeyword = !text || row.name.toLowerCase().includes(text) || row.id.toLowerCase().includes(text) || row.description.toLowerCase().includes(text)
  const matchesStatus = !statusFilter.value || row.status === statusFilter.value
  return matchesKeyword && matchesStatus
}))

const summary = computed(() => ({
  total: rows.value.length,
  enabled: rows.value.filter(row => row.status !== 'disabled').length,
  system: rows.value.filter(row => row.status === 'system').length,
  members: rows.value.reduce((sum, row) => sum + row.member_count, 0)
}))

const formatDateTime = (value: string) => new Date(value).toLocaleString()

const openDrawer = (mode: 'create' | 'edit' | 'view', row?: RoleRow) => {
  drawerMode.value = mode
  currentRow.value = row || null
  form.value = row
    ? {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status,
        permissions: [...row.permissions],
        scope: row.scope
      }
    : {
        id: `ROLE-${Date.now().toString().slice(-4)}`,
        name: '',
        description: '',
        status: 'enabled',
        permissions: ['dashboard:read'],
        scope: '營運資料範圍'
      }
  showDrawer.value = true
}

const saveRole = () => {
  if (!form.value.name) {
    message.warning('請輸入角色名稱')
    return
  }
  if (drawerMode.value === 'create') {
    rows.value.unshift({
      id: form.value.id,
      name: form.value.name,
      description: form.value.description,
      status: form.value.status,
      member_count: 0,
      permission_count: form.value.permissions.length,
      permissions: [...form.value.permissions],
      scope: form.value.scope,
      updated_at: new Date().toISOString()
    })
    message.success('角色已建立')
  } else {
    const row = rows.value.find(item => item.id === form.value.id)
    if (row && row.status !== 'system') {
      row.name = form.value.name
      row.description = form.value.description
      row.status = form.value.status
      row.permissions = [...form.value.permissions]
      row.permission_count = form.value.permissions.length
      row.scope = form.value.scope
      row.updated_at = new Date().toISOString()
      message.success('角色已更新')
    } else if (row?.status === 'system') {
      message.warning('系統角色不可修改')
    }
  }
  showDrawer.value = false
}

const copyRole = (row: RoleRow) => {
  const copy: RoleRow = {
    ...row,
    id: `ROLE-COPY-${Date.now().toString().slice(-4)}`,
    name: `${row.name} Copy`,
    status: 'enabled',
    member_count: 0,
    updated_at: new Date().toISOString()
  }
  rows.value.unshift(copy)
  message.success('角色已複製')
}

const toggleRole = (row: RoleRow) => {
  if (row.status === 'system') {
    message.warning('系統角色不可停用')
    return
  }
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
  row.updated_at = new Date().toISOString()
  message.success(`${row.name}：${statusMeta[row.status].label}`)
}

const deleteRole = (row: RoleRow) => {
  if (row.status === 'system' || row.member_count > 0) {
    message.warning('系統角色或已有綁定人員的角色不可刪除')
    return
  }
  rows.value = rows.value.filter(item => item.id !== row.id)
  message.success('角色已刪除')
}

const resetFilters = () => {
  keyword.value = ''
  statusFilter.value = null
}

const columns: DataTableColumns<RoleRow> = [
  { title: '角色', key: 'name', width: 240, fixed: 'left', render: row => h('button', { class: 'text-left font-semibold text-cyan-500 hover:text-cyan-400', onClick: () => openDrawer('view', row) }, row.name) },
  { title: '角色代碼', key: 'id', width: 170, render: row => h('span', { class: 'font-mono text-xs' }, row.id) },
  { title: '說明', key: 'description', minWidth: 260, ellipsis: { tooltip: true } },
  { title: '資料範圍', key: 'scope', width: 170 },
  { title: '人員數', key: 'member_count', width: 90, align: 'right' },
  { title: '權限數', key: 'permission_count', width: 90, align: 'right' },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false, size: 'small' }, { default: () => statusMeta[row.status].label }) },
  { title: '更新時間', key: 'updated_at', width: 180, render: row => formatDateTime(row.updated_at) },
  {
    title: '操作',
    key: 'actions',
    width: 310,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDrawer('view', row) }, { icon: () => h(VisibilityOutlined), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.status === 'system', onClick: () => openDrawer('edit', row) }, { icon: () => h(EditOutlined), default: () => '編輯' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => copyRole(row) }, { icon: () => h(ContentCopyOutlined), default: () => '複製' }),
        h(NButton, { size: 'small', secondary: true, disabled: row.status === 'system', onClick: () => toggleRole(row) }, { default: () => row.status === 'enabled' ? '停用' : '啟用' }),
        h(NButton, { size: 'small', type: 'error', secondary: true, disabled: row.status === 'system' || row.member_count > 0, onClick: () => deleteRole(row) }, { default: () => '刪除' })
      ]
    })
  }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">角色權限</h1>
        <p class="mt-1 text-sm text-gray-500">
          管理後台角色、資料範圍與模組權限；後續管理者、代理、商戶三入口可沿用此 RBAC 模型。
        </p>
      </div>
      <n-button type="primary" @click="openDrawer('create')">新增角色</n-button>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="角色總數" :value="summary.total" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="啟用角色" :value="summary.enabled" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="系統角色" :value="summary.system" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="綁定人員" :value="summary.members" /></div>
    </div>

    <n-alert type="info" :show-icon="false">
      系統角色不可刪除或停用；已有綁定人員的角色不可刪除。角色權限更新需寫入操作紀錄並建議搭配 MFA。
    </n-alert>

    <div class="rounded border border-white/10 bg-[#202026] p-4">
      <div class="grid gap-3 xl:grid-cols-12">
        <n-input v-model:value="keyword" clearable placeholder="搜尋角色名稱 / 代碼 / 說明" class="xl:col-span-4">
          <template #prefix><n-icon :component="SearchOutlined" /></template>
        </n-input>
        <n-select v-model:value="statusFilter" clearable placeholder="狀態" :options="statusOptions" class="xl:col-span-2" />
        <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
      </div>
    </div>

    <n-data-table :columns="withTableSorters(columns)" :data="filteredRows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1640" />

    <n-drawer v-model:show="showDrawer" width="min(820px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div class="flex items-center gap-3">
            <span class="font-semibold">{{ drawerMode === 'create' ? '新增角色' : form.name }}</span>
            <n-tag v-if="drawerMode !== 'create'" :type="statusMeta[form.status].type" :bordered="false">{{ statusMeta[form.status].label }}</n-tag>
          </div>
        </template>

        <n-form label-placement="left" label-width="110">
          <n-form-item label="角色代碼"><n-input v-model:value="form.id" :disabled="drawerMode !== 'create'" /></n-form-item>
          <n-form-item label="角色名稱"><n-input v-model:value="form.name" :disabled="drawerMode === 'view' || form.status === 'system'" /></n-form-item>
          <n-form-item label="狀態"><n-select v-model:value="form.status" :options="statusOptions" :disabled="drawerMode === 'view' || form.status === 'system'" /></n-form-item>
          <n-form-item label="資料範圍"><n-input v-model:value="form.scope" :disabled="drawerMode === 'view' || form.status === 'system'" /></n-form-item>
          <n-form-item label="說明"><n-input v-model:value="form.description" type="textarea" :disabled="drawerMode === 'view' || form.status === 'system'" /></n-form-item>
          <n-form-item label="權限">
            <div class="w-full rounded border border-white/10 bg-[#18181c] p-3">
              <div class="mb-3 text-sm text-gray-500">已選 {{ form.permissions.length }} 個權限</div>
              <n-tree
                :data="permissionOptions"
                checkable
                cascade
                default-expand-all
                :checked-keys="form.permissions"
                :disabled="drawerMode === 'view' || form.status === 'system'"
                @update:checked-keys="keys => form.permissions = keys.map(String)"
              />
            </div>
          </n-form-item>
        </n-form>

        <template v-if="drawerMode === 'view' && currentRow">
          <n-descriptions class="mt-4" bordered :column="2" label-placement="left">
            <n-descriptions-item label="人員數">{{ currentRow.member_count }}</n-descriptions-item>
            <n-descriptions-item label="更新時間">{{ formatDateTime(currentRow.updated_at) }}</n-descriptions-item>
            <n-descriptions-item label="刪除規則" :span="2">系統角色或已有綁定人員的角色不可刪除。</n-descriptions-item>
          </n-descriptions>
        </template>

        <template #footer>
          <div class="flex justify-end gap-2">
            <n-button @click="showDrawer = false">取消</n-button>
            <n-button v-if="drawerMode === 'view' && currentRow && currentRow.status !== 'system'" type="primary" secondary @click="openDrawer('edit', currentRow)">編輯</n-button>
            <n-button v-if="drawerMode !== 'view'" type="primary" @click="saveRole">儲存</n-button>
          </div>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
