<template>
  <section class="accounts">
    <AppFilterForm @submit.prevent="search">
      <ElFormItem label="姓名／帳號"><ElInput v-model="draft.q" clearable /></ElFormItem>
      <ElFormItem label="角色"
        ><ElSelect v-model="draft.role" clearable placeholder="全部角色"
          ><ElOption v-for="r in merchantRoles" :key="r" :label="r" :value="r" /></ElSelect
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
    <ElAlert v-if="error" :title="error" type="error" :closable="false" />
    <ElCard shadow="never"
      ><template #header
        ><div class="heading"
          ><span>本商戶帳號 · {{ filtered.length }} 位</span
          ><ElButton v-if="canManage" type="primary" @click="open()">新增帳號</ElButton></div
        ></template
      >
      <ElTable :data="filtered.slice((page - 1) * 10, page * 10)" row-key="id" scrollbar-always-on>
        <ElTableColumn
          prop="name"
          label="姓名"
          min-width="130"
          show-overflow-tooltip
        /><ElTableColumn
          prop="account"
          label="帳號"
          min-width="240"
          show-overflow-tooltip
        /><ElTableColumn prop="role" label="角色" min-width="130" /><ElTableColumn
          prop="merchantId"
          label="所屬商戶"
          width="120"
        />
        <ElTableColumn label="狀態" width="90"
          ><template #default="{ row }"
            ><ElTag :type="row.status === '啟用' ? 'success' : 'info'">{{
              row.status
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="操作" width="140" fixed="right"
          ><template #default="{ row }"
            ><span v-if="row.account === login">目前帳號</span
            ><ElButton
              v-else-if="canManage && row.id !== 'M00001:owner'"
              link
              type="primary"
              @click="open(row)"
              >編輯／停用</ElButton
            ><span v-else>唯讀</span></template
          ></ElTableColumn
        >
      </ElTable>
      <ElPagination
        v-model:current-page="page"
        :total="filtered.length"
        :page-size="10"
        layout="total, prev, pager, next"
      />
    </ElCard>
    <ElCard shadow="never"
      ><template #header>角色權限</template
      ><ElTable :data="roleRows" scrollbar-always-on
        ><ElTableColumn prop="role" label="角色" width="140" /><ElTableColumn
          prop="read"
          label="資料查詢"
          min-width="260" /><ElTableColumn
          prop="manage"
          label="帳號管理"
          min-width="220" /><ElTableColumn prop="audit" label="操作紀錄" min-width="200" /></ElTable
    ></ElCard>
    <p class="note"
      >目前為本機演示帳號；新增帳號使用演示密碼 123456。正式環境須接入邀請與密碼設定服務。</p
    >
    <ElDialog
      v-model="opened"
      :title="editing ? '編輯帳號' : '新增帳號'"
      width="min(620px, calc(100vw - 32px))"
      append-to-body
      :close-on-click-modal="false"
    >
      <ElForm label-position="top" class="form" @submit.prevent="save">
        <ElFormItem label="姓名" required
          ><ElInput v-model="form.name" maxlength="60"
        /></ElFormItem>
        <ElFormItem label="電子郵件帳號" required
          ><ElInput v-model="form.account" :disabled="editing" maxlength="120"
        /></ElFormItem>
        <ElFormItem label="角色" required
          ><ElSelect v-model="form.role"
            ><ElOption v-for="r in merchantRoles" :key="r" :label="r" :value="r" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="狀態" required
          ><ElSelect v-model="form.status"
            ><ElOption label="啟用" value="啟用" /><ElOption label="停用" value="停用" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="變更原因" required class="full"
          ><ElInput v-model="reason" type="textarea" :rows="3" maxlength="500" show-word-limit
        /></ElFormItem> </ElForm
      ><template #footer
        ><ElButton @click="opened = false">取消</ElButton
        ><ElButton type="primary" @click="save">儲存</ElButton></template
      >
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import {
    merchantRoles,
    loadMerchantAccounts,
    saveMerchantAccount,
    type MerchantAccount
  } from '@/domain/merchant-accounts'
  const props = defineProps<{ merchantId: string; login: string }>()
  const rows = ref<MerchantAccount[]>([]),
    error = ref(''),
    opened = ref(false),
    editing = ref(false),
    reason = ref(''),
    page = ref(1)
  const draft = reactive({ q: '', role: '', status: '' }),
    applied = ref({ ...draft })
  const actor = computed(() =>
    rows.value.find((r) => r.account.toLowerCase() === props.login.toLowerCase())
  )
  const canManage = computed(
    () => actor.value?.status === '啟用' && actor.value?.role === '商戶管理員'
  )
  const visible = computed(() =>
    canManage.value ? rows.value : rows.value.filter((r) => r.id === actor.value?.id)
  )
  const filtered = computed(() =>
    visible.value.filter(
      (r) =>
        (r.name + ' ' + r.account).toLowerCase().includes(applied.value.q.toLowerCase()) &&
        (!applied.value.role || r.role === applied.value.role) &&
        (!applied.value.status || r.status === applied.value.status)
    )
  )
  const roleRows = merchantRoles.map((role) => ({
    role,
    read: '本商戶業務、會員、交易、報表與結算唯讀',
    manage: role === '商戶管理員' ? '新增、編輯、停用本商戶子帳號' : '僅查看本人',
    audit: ['商戶管理員', '稽核'].includes(role) ? '本商戶紀錄' : '本人紀錄'
  }))
  const blank = (): MerchantAccount => ({
    id: '',
    merchantId: props.merchantId,
    name: '',
    account: '',
    role: '營運',
    status: '啟用'
  })
  const form = reactive<MerchantAccount>(blank())
  function refresh() {
    try {
      rows.value = loadMerchantAccounts(localStorage, props.merchantId).rows
      error.value = ''
    } catch {
      rows.value = []
      error.value = '帳號資料讀取失敗，請勿覆寫原資料'
    }
  }
  function search() {
    applied.value = { ...draft, q: draft.q.trim() }
    page.value = 1
  }
  function reset() {
    Object.assign(draft, { q: '', role: '', status: '' })
    search()
  }
  function open(row?: MerchantAccount) {
    refresh()
    if (!canManage.value) return
    editing.value = !!row
    Object.assign(form, row || { ...blank(), id: crypto.randomUUID() })
    reason.value = ''
    opened.value = true
  }
  function save() {
    try {
      saveMerchantAccount(localStorage, props.merchantId, props.login, { ...form }, reason.value)
      refresh()
      opened.value = false
      ElMessage.success('帳號已儲存並記錄變更')
      window.dispatchEvent(new Event('merchant-accounts-changed'))
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '儲存失敗')
    }
  }
  watch(
    () => [props.merchantId, props.login],
    () => {
      opened.value = false
      reset()
      refresh()
    },
    { immediate: true }
  )
  watch(
    () => filtered.value.length,
    () => {
      page.value = Math.min(page.value, Math.max(1, Math.ceil(filtered.value.length / 10)))
    }
  )
  onMounted(() => window.addEventListener('storage', refresh))
  onUnmounted(() => window.removeEventListener('storage', refresh))
</script>
<style scoped>
  .accounts {
    display: grid;
    gap: 16px;
    min-width: 0;
    align-content: start;
  }
  .heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .el-pagination {
    justify-content: flex-end;
    margin-top: 16px;
  }
  .form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    max-height: 65vh;
    overflow: auto;
  }
  .full {
    grid-column: 1/-1;
  }
  .form .el-form-item {
    margin: 0;
  }
  .note {
    font-size: 13px;
    color: var(--art-gray-500);
    margin: 0;
  }
  @media (width<600px) {
    .form {
      grid-template-columns: 1fr;
    }
  }
</style>
