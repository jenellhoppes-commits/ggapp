<template>
  <section class="agent-services">
    <AppPageHeader :title="title" />
    <ElEmpty v-if="!scope.own" description="目前無可用的代理資料" />
    <template v-else>
      <AgentReconciliation v-if="kind === 'settlements'" />
      <AgentAccounts
        v-else-if="kind === 'account'"
        :agent-id="scope.own.id"
        :login="user.info.email || user.info.userName || ''"
        :owner="user.info.userId === 2 && scope.own.id === 'A00001'"
      />
      <template v-else>
        <AppFilterForm @submit.prevent="search">
          <ElFormItem label="關鍵字"
            ><ElInput v-model="draft.q" clearable placeholder="搜尋公告標題或內容"
          /></ElFormItem>
          <ElFormItem label="分類"
            ><ElSelect v-model="draft.category" clearable placeholder="全部分類"
              ><ElOption v-for="c in categories" :key="c" :label="c" :value="c" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="閱讀狀態"
            ><ElSelect v-model="draft.status" clearable placeholder="全部狀態"
              ><ElOption label="未讀" value="unread" /><ElOption
                label="已讀"
                value="read" /></ElSelect
          ></ElFormItem>
          <div class="filter-actions"
            ><ElButton type="primary" @click="search">查詢</ElButton
            ><ElButton @click="reset">重置</ElButton></div
          >
        </AppFilterForm>
        <ElCard shadow="never"
          ><template #header
            ><div class="notice-actions"
              ><span>公告列表 · {{ notices.length }} 則</span
              ><ElButton :disabled="!notices.some((n) => !readIds.includes(n.id))" @click="markAll"
                >查詢結果標為已讀</ElButton
              ></div
            ></template
          >
          <ElTable :data="pageRows" row-key="id">
            <ElTableColumn label="閱讀狀態" width="100"
              ><template #default="{ row }"
                ><ElTag :type="readIds.includes(row.id) ? 'info' : 'primary'">{{
                  readIds.includes(row.id) ? '已讀' : '未讀'
                }}</ElTag></template
              ></ElTableColumn
            >
            <ElTableColumn prop="category" label="分類" width="120" />
            <ElTableColumn prop="title" label="標題" min-width="260" show-overflow-tooltip />
            <ElTableColumn prop="publishedAt" label="發布時間" min-width="170" />
            <ElTableColumn label="操作" width="90"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="openNotice(row.id)">閱讀</ElButton></template
              ></ElTableColumn
            >
          </ElTable>
          <ElPagination
            v-model:current-page="page"
            :page-size="10"
            :total="notices.length"
            layout="total, prev, pager, next"
            class="pagination"
          />
        </ElCard>
      </template>
    </template>
    <ElDialog
      v-model="noticeOpen"
      title="公告內容"
      width="min(680px, calc(100vw - 32px))"
      append-to-body
      class="agent-notice-dialog"
    >
      <template v-if="selectedNotice"
        ><h3>{{ selectedNotice.title }}</h3
        ><div class="notice-meta"
          >{{ selectedNotice.category }} · {{ selectedNotice.publishedAt }} · 平台營運</div
        ><p class="notice-content">{{ selectedNotice.content }}</p></template
      >
      <template #footer><ElButton @click="noticeOpen = false">關閉</ElButton></template>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import AgentReconciliation from '@/components/business/AgentReconciliation.vue'
  import AgentAccounts from '@/components/business/AgentAccounts.vue'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useUserStore } from '@/store/modules/user'
  import { agentScope } from '@/domain/agent-portal'
  import { agentDemoNotices } from '@/domain/agent-demo'
  const user = useUserStore(),
    partners = useBusinessPartnerStore(),
    route = useRoute()
  const scope = computed(() =>
    agentScope(partners, {
      roles: user.info.roles || [],
      agentId: user.info.agentId,
      name: user.info.userName || ''
    })
  )
  const kind = computed(() =>
    route.name === 'AgentPortalSettlements'
      ? 'settlements'
      : route.name === 'AgentPortalNotifications'
        ? 'notifications'
        : 'account'
  )
  const title = computed(
    () =>
      ({ settlements: '對帳／結算', notifications: '公告通知', account: '帳號與權限' })[kind.value]
  )
  const draft = reactive({ q: '', category: '', status: '' }),
    applied = ref({ ...draft }),
    page = ref(1),
    readIds = ref<string[]>([]),
    selectedId = ref(''),
    noticeOpen = ref(false)
  const key = computed(
    () => `ggap-agent-notice-reads-v2:${scope.value.own?.id || ''}:${user.info.userId || ''}`
  )
  watch(
    key,
    () => {
      readIds.value = []
      noticeOpen.value = false
      try {
        const saved = JSON.parse(localStorage.getItem(key.value) || '[]')
        if (Array.isArray(saved))
          readIds.value = saved.filter((id) => agentDemoNotices.some((n) => n.id === id))
      } catch {
        ElMessage.error('公告閱讀紀錄讀取失敗')
      }
    },
    { immediate: true }
  )
  const categories = [...new Set(agentDemoNotices.map((n) => n.category))]
  const notices = computed(() =>
    !scope.value.own
      ? []
      : agentDemoNotices
          .filter(
            (n) =>
              (!applied.value.category || n.category === applied.value.category) &&
              `${n.title} ${n.content}`.includes(applied.value.q.trim()) &&
              (!applied.value.status ||
                (readIds.value.includes(n.id) ? 'read' : 'unread') === applied.value.status)
          )
          .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  )
  const pageRows = computed(() => notices.value.slice((page.value - 1) * 10, page.value * 10))
  watch(
    () => notices.value.length,
    () => {
      page.value = Math.min(page.value, Math.max(1, Math.ceil(notices.value.length / 10)))
    }
  )
  const selectedNotice = computed(() =>
    scope.value.own ? agentDemoNotices.find((n) => n.id === selectedId.value) : undefined
  )
  const search = () => {
    applied.value = { ...draft }
    page.value = 1
  }
  const reset = () => {
    Object.assign(draft, { q: '', category: '', status: '' })
    search()
  }
  function mark(ids: string[]) {
    if (!scope.value.own) return
    try {
      const next = [
        ...new Set([
          ...readIds.value,
          ...ids.filter((id) => agentDemoNotices.some((n) => n.id === id))
        ])
      ]
      localStorage.setItem(key.value, JSON.stringify(next))
      readIds.value = next
    } catch {
      ElMessage.error('閱讀紀錄儲存失敗，請重試')
    }
  }
  function openNotice(id: string) {
    if (!notices.value.some((n) => n.id === id)) return
    selectedId.value = id
    noticeOpen.value = true
    mark([id])
  }
  function markAll() {
    mark(notices.value.map((n) => n.id))
  }
</script>
<style scoped>
  .agent-services {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
    align-content: start;
    align-items: start;
    grid-auto-rows: max-content;
  }
  .notice-actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  .pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
  .notice-meta {
    color: var(--el-text-color-secondary);
    margin-top: 12px;
  }
  .notice-content {
    line-height: 1.8;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    margin-top: 20px;
  }
</style>
<style>
  .agent-notice-dialog {
    margin: 4vh auto !important;
    max-height: 92dvh;
    display: flex;
    flex-direction: column;
  }
  .agent-notice-dialog .el-dialog__body {
    overflow: auto;
    min-height: 0;
  }
  .agent-notice-dialog .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
