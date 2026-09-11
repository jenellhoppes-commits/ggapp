<template>
  <section class="accounts">
    <AppFilterForm @submit.prevent="search">
      <ElFormItem label="姓名／帳號"
        ><ElInput v-model="draft.q" clearable placeholder="搜尋姓名或電子郵件"
      /></ElFormItem>
      <ElFormItem label="角色"
        ><ElSelect v-model="draft.role" clearable placeholder="全部角色"
          ><ElOption v-for="r in accountRoles" :key="r" :label="r" :value="r" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="狀態"
        ><ElSelect v-model="draft.status" clearable placeholder="全部狀態"
          ><ElOption label="啟用" value="啟用" /><ElOption label="停用" value="停用" /></ElSelect
      ></ElFormItem>
      <div class="filter-actions"
        ><ElButton type="primary" @click="search">查詢</ElButton
        ><ElButton @click="reset">重置</ElButton></div
      >
    </AppFilterForm>
    <ElCard shadow="never"
      ><template #header
        ><div class="section-heading"
          ><span>本代理帳號 · {{ filtered.length }} 位</span
          ><ElButton v-if="canManage" type="primary" @click="open()">新增帳號</ElButton></div
        ></template
      >
      <ElTable :data="filtered" row-key="id" scrollbar-always-on>
        <ElTableColumn
          prop="name"
          label="姓名"
          min-width="160"
          show-overflow-tooltip
        /><ElTableColumn prop="account" label="帳號" min-width="230" show-overflow-tooltip />
        <ElTableColumn prop="role" label="角色" min-width="120" /><ElTableColumn
          prop="agentId"
          label="所屬代理"
          width="120"
        />
        <ElTableColumn label="狀態" width="90"
          ><template #default="{ row }"
            ><ElTag :type="row.status === '啟用' ? 'success' : 'info'">{{
              row.status
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="操作" width="140"
          ><template #default="{ row }"
            ><span v-if="row.id === actorId">目前帳號</span
            ><ElButton v-else-if="canManage" link type="primary" @click="open(row)"
              >編輯／停用</ElButton
            ><span v-else>唯讀</span></template
          ></ElTableColumn
        >
      </ElTable>
    </ElCard>
    <ElCard shadow="never"
      ><template #header>角色權限</template
      ><ElTable :data="rolePermissions"
        ><ElTableColumn prop="role" label="角色" width="125" /><ElTableColumn
          prop="business"
          label="業務與報表"
          min-width="230" /><ElTableColumn
          prop="finance"
          label="核帳／交付"
          min-width="260" /><ElTableColumn
          prop="accounts"
          label="帳號管理"
          min-width="170" /></ElTable
    ></ElCard>
    <ElCard shadow="never"
      ><template #header>操作紀錄</template
      ><ElTable :data="canManage ? history : []" max-height="320" scrollbar-always-on
        ><ElTableColumn prop="time" label="時間" min-width="190" /><ElTableColumn
          prop="operator"
          label="操作人"
          min-width="120" /><ElTableColumn
          prop="target"
          label="對象"
          min-width="180" /><ElTableColumn
          prop="before"
          label="變更前"
          min-width="140" /><ElTableColumn
          prop="after"
          label="變更後"
          min-width="140" /><ElTableColumn prop="reason" label="原因" min-width="180" /></ElTable
    ></ElCard>
    <ElDialog
      v-model="opened"
      :title="editing ? '編輯帳號' : '新增帳號'"
      width="min(620px, calc(100vw - 32px))"
      append-to-body
      class="agent-account-dialog"
      :close-on-click-modal="false"
    >
      <ElForm label-position="top" class="account-form" @submit.prevent="save">
        <ElFormItem label="姓名" required
          ><ElInput v-model="form.name" maxlength="60"
        /></ElFormItem>
        <ElFormItem label="電子郵件帳號" required
          ><ElInput v-model="form.account" :disabled="editing" maxlength="120"
        /></ElFormItem>
        <ElFormItem label="角色" required
          ><ElSelect v-model="form.role"
            ><ElOption v-for="r in accountRoles" :key="r" :label="r" :value="r" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="狀態" required
          ><ElSelect v-model="form.status"
            ><ElOption label="啟用" value="啟用" /><ElOption label="停用" value="停用" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="所屬代理"
          ><span>{{ agentId }}</span></ElFormItem
        >
        <ElFormItem label="變更原因" required class="full"
          ><ElInput v-model="reason" type="textarea" :rows="3" maxlength="500"
        /></ElFormItem>
      </ElForm>
      <template #footer
        ><ElButton @click="opened = false">取消</ElButton
        ><ElButton type="primary" @click="save">儲存</ElButton></template
      >
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import { permitsAgent, loadAgentAccounts } from '@/domain/agent-access'
  import { computed, reactive, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import {
    accountRoles,
    rolePermissions,
    saveAgentAccount,
    type AgentAccount,
    type AccountChange
  } from '@/domain/agent-accounts'
  const props = defineProps<{ agentId: string; login: string; owner: boolean }>()
  const user = useUserStore()
  const rows = ref<AgentAccount[]>([]),
    history = ref<AccountChange[]>([]),
    opened = ref(false),
    editing = ref(false),
    reason = ref('')
  const actorId = computed(
    () => rows.value.find((r) => r.account.toLowerCase() === props.login.toLowerCase())?.id || ''
  )
  const key = computed(() => `ggap-agent-accounts-v1:${props.agentId}`)
  const canManage = computed(
    () =>
      permitsAgent(user.activeRoles(), 'accounts') &&
      rows.value.some(
        (r) => r.id === actorId.value && r.role === '代理管理員' && r.status === '啟用'
      )
  )
  const empty = (): AgentAccount => ({
    id: '',
    agentId: props.agentId,
    name: '',
    account: '',
    role: '稽核',
    status: '啟用'
  })
  const form = reactive(empty()),
    draft = reactive({ q: '', role: '', status: '' }),
    applied = ref({ ...draft })
  const search = () => {
    applied.value = { ...draft }
  }
  const reset = () => {
    Object.assign(draft, { q: '', role: '', status: '' })
    search()
  }
  watch(
    key,
    () => {
      opened.value = false
      reset()
      history.value = []
      rows.value = []
      try {
        const saved = loadAgentAccounts(localStorage, props.agentId)
        rows.value = saved.rows
        history.value = saved.history
      } catch {
        ElMessage.error('帳號資料讀取失敗，請重新整理後再試')
      }
    },
    { immediate: true }
  )
  const filtered = computed(() =>
    rows.value.filter(
      (r) =>
        (canManage.value || r.id === actorId.value) &&
        (!applied.value.role || r.role === applied.value.role) &&
        (!applied.value.status || r.status === applied.value.status) &&
        `${r.name} ${r.account}`.toLowerCase().includes(applied.value.q.trim().toLowerCase())
    )
  )
  function open(row?: AgentAccount) {
    if (!canManage.value) return
    editing.value = !!row
    Object.assign(form, row || { ...empty(), id: crypto.randomUUID() })
    reason.value = ''
    opened.value = true
  }
  function save() {
    try {
      if (!canManage.value) throw new Error('目前帳號沒有帳號管理權限')
      const latest = loadAgentAccounts(localStorage, props.agentId)
      if (JSON.stringify(latest.rows) !== JSON.stringify(rows.value))
        throw new Error('帳號資料已變更，請重新整理後再操作')
      const next = saveAgentAccount(rows.value, actorId.value, form, reason.value)
      const old = rows.value.find((r) => r.id === next.id)
      const updated = old
        ? rows.value.map((r) => (r.id === next.id ? next : r))
        : [...rows.value, next]
      const logs = [
        {
          target: next.account,
          before: old ? `${old.role}／${old.status}` : '新增',
          after: `${next.role}／${next.status}`,
          reason: reason.value.trim(),
          operator: props.login,
          time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' })
        },
        ...history.value
      ]
      localStorage.setItem(key.value, JSON.stringify({ rows: updated, history: logs }))
      rows.value = updated
      history.value = logs
      opened.value = false
      ElMessage.success('帳號設定已儲存')
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '儲存失敗')
    }
  }
</script>
<style scoped>
  .accounts {
    display: grid;
    gap: 16px;
    min-width: 0;
    align-content: start;
  }
  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }
</style>
<style>
  .agent-account-dialog {
    margin: 4vh auto !important;
    max-height: 92dvh;
    display: flex;
    flex-direction: column;
  }
  .agent-account-dialog .el-dialog__body {
    overflow: auto;
    min-height: 0;
  }
  .agent-account-dialog .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
  }
  .agent-account-dialog .account-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  .agent-account-dialog .el-form-item {
    margin: 0;
    min-width: 0;
  }
  .agent-account-dialog .full {
    grid-column: 1/-1;
  }
  @media (max-width: 640px) {
    .agent-account-dialog .account-form {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
