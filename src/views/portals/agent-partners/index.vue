<template>
  <section class="agent-partners">
    <AppPageHeader
      :title="pageTitle"
      :description="
        isTerms
          ? '管理自己取得與直屬下發的供應商／遊戲類型條件。'
          : isRelations
            ? '查看授權代理樹、合作狀態與直屬關係。'
            : '查詢直屬與間接商戶、線路及收付模式。'
      "
      ><template #actions>
        <ElButton
          v-if="
            route.name === 'AgentPortalRelations' &&
            scope.own &&
            permitsAgent(actor.roles, 'business')
          "
          type="primary"
          :disabled="scope.own.level === 'L3'"
          @click="router.push('/agent/relations/create')"
          >{{ scope.own.level === 'L3' ? '已達三級上限' : '新增下級代理' }}</ElButton
        >
        <ElButton
          v-if="
            route.name === 'AgentPortalMerchants' &&
            scope.own &&
            permitsAgent(actor.roles, 'business')
          "
          type="primary"
          @click="router.push('/agent/merchants/create')"
          >新增直屬商戶</ElButton
        >
        <ElButton
          v-if="route.name === 'AgentPortalMerchants'"
          @click="router.push('/agent/merchants/integration')"
          >串接進度</ElButton
        >
      </template></AppPageHeader
    >
    <ElAlert
      v-if="!scope.own"
      title="代理身分未綁定、未啟用或無權限，無法查詢。請重新登入或聯絡管理者。"
      type="error"
      :closable="false"
    />
    <template v-else>
      <div v-if="isRelations" class="relation-overview">
        <ElCard shadow="never">
          <template #header>授權代理樹</template>
          <ElTree
            :data="agentTree"
            node-key="id"
            :props="{ label: 'label', children: 'children' }"
            default-expand-all
            highlight-current
            @node-click="selectNode"
          />
        </ElCard>
        <ElCard v-if="activeNode" shadow="never">
          <template #header>節點摘要</template>
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="代理"
              >{{ activeNode.name }} · {{ activeNode.code }}</ElDescriptionsItem
            >
            <ElDescriptionsItem label="層級">{{ activeNode.level }}</ElDescriptionsItem>
            <ElDescriptionsItem label="直接上級">{{
              activeNode.id === scope.own.id ? '—' : parentText(activeNode.parentAgentId)
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="合作狀態"
              ><GameProviderStatusTag :status="activeNode.status"
            /></ElDescriptionsItem>
            <ElDescriptionsItem label="合作開始">{{
              activeNode.cooperationStartDate || '—'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="直屬商戶">{{
              scope.merchants.filter((m) => m.agentId === activeNode?.id).length
            }}</ElDescriptionsItem>
          </ElDescriptions>
        </ElCard>
      </div>
      <ElDescriptions v-else :column="2" border>
        <ElDescriptionsItem label="登入代理"
          >{{ scope.own.name }} · {{ scope.own.id }}</ElDescriptionsItem
        >
        <ElDescriptionsItem label="日期依據">{{ today }} · {{ timezone }}</ElDescriptionsItem>
      </ElDescriptions>
      <h3 v-if="isTerms" class="section-heading">我的取得條件</h3>
      <SupplierCostConditions
        v-if="isTerms"
        owner="agent"
        :owner-id="scope.own.id"
        readonly
        hide-upstream
      />
      <ElCard shadow="never"
        ><AppFilterForm class="partner-filters" @submit.prevent="apply">
          <ElFormItem label="名稱／代碼"
            ><ElInput v-model="keyword" clearable placeholder="查詢授權範圍內名稱或代碼"
          /></ElFormItem>
          <ElFormItem v-if="!isTerms" label="關係"
            ><ElSelect v-model="relation" clearable placeholder="全部關係" aria-label="關係篩選"
              ><ElOption label="直屬" value="direct" /><ElOption
                label="間接下級"
                value="indirect" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="狀態"
            ><ElSelect v-model="status" clearable placeholder="全部狀態"
              ><ElOption
                v-for="s in statusChoices"
                :key="s"
                :value="s"
                :label="
                  (
                    {
                      Active: '合作中',
                      Disabled: '已停用',
                      Draft: '草稿',
                      Pending: '待確認'
                    } as Record<string, string>
                  )[s] || s
                " /></ElSelect
          ></ElFormItem>
          <ElFormItem v-if="isRelations" label="層級"
            ><ElSelect v-model="level" clearable placeholder="全部層級"
              ><ElOption v-for="l in ['L1', 'L2', 'L3']" :key="l" :value="l" :label="l" /></ElSelect
          ></ElFormItem>
          <ElFormItem v-if="!isRelations && !isTerms" label="收付模式"
            ><ElSelect v-model="mode" clearable placeholder="全部模式"
              ><ElOption label="代理統收" value="AgentCollect" /><ElOption
                label="平台代收"
                value="PlatformCollect" /></ElSelect
          ></ElFormItem>
          <div class="filter-actions"
            ><ElButton type="primary" @click="apply">查詢</ElButton
            ><ElButton @click="reset">重置</ElButton></div
          >
        </AppFilterForm></ElCard
      >
      <ElTabs v-if="isTerms" v-model="tab" @tab-change="changeTab"
        ><ElTabPane
          :label="`直屬代理（${scope.agents.filter((a) => a.parentAgentId === actor.agentId).length}）`"
          name="agent" /><ElTabPane
          :label="`直屬商戶（${scope.merchants.filter((m) => m.agentId === actor.agentId).length}）`"
          name="merchant"
      /></ElTabs>
      <ArtTable :data="paged" row-key="key">
        <ElTableColumn prop="name" label="名稱" min-width="180" /><ElTableColumn
          prop="code"
          label="代碼"
          min-width="140"
        />
        <ElTableColumn v-if="isRelations" prop="level" label="層級" width="80" />
        <ElTableColumn prop="cooperationStartDate" label="合作開始" min-width="125" />
        <ElTableColumn
          v-if="!isRelations && !isTerms"
          prop="currencies"
          label="交易幣別"
          min-width="140"
        />
        <ElTableColumn v-if="!isRelations && !isTerms" prop="lineCount" label="線路數" width="90" />
        <ElTableColumn label="關係" width="105"
          ><template #default="{ row }">{{
            row.direct ? '直屬' : '間接下級'
          }}</template></ElTableColumn
        >
        <ElTableColumn label="合作狀態" width="110">
          <template #default="{ row }"><GameProviderStatusTag :status="row.status" /></template>
        </ElTableColumn>
        <ElTableColumn label="直接上級" min-width="160">
          <template #default="{ row }">{{ parentText(row.parentId) }}</template>
        </ElTableColumn>
        <ElTableColumn v-if="route.name === 'AgentPortalMerchants'" label="收付模式" width="120">
          <template #default="{ row }">{{
            collection.at(
              row.id,
              today,
              store.merchants.find((m) => m.id === row.id)?.collectionMode
            ) === 'AgentCollect'
              ? '代理統收'
              : '平台代收'
          }}</template>
        </ElTableColumn>
        <ElTableColumn label="操作" min-width="160"
          ><template #default="{ row }"
            ><ElButton link type="primary" @click="inspect(row)">查看</ElButton
            ><ElButton
              v-if="!isTerms && row.termsVisible"
              link
              type="primary"
              @click="router.push({ path: '/agent/terms', query: { kind: row.kind, q: row.id } })"
              >商務條件</ElButton
            ><ElButton v-if="isTerms && row.editable" link type="primary" @click="edit(row)"
              >編輯商務條件</ElButton
            ></template
          ></ElTableColumn
        >
      </ArtTable>
      <ElPagination
        v-model:current-page="pageNumber"
        v-model:page-size="pageSize"
        :total="rows.length"
        :page-sizes="[10, 20, 50]"
        layout="prev, pager, next, sizes"
        @size-change="pageNumber = 1"
      />
    </template>
    <ElDialog
      v-model="opened"
      :title="editing ? '編輯商務條件 · 新版本' : '合作資料與條件'"
      width="min(1080px, calc(100vw - 32px))"
      append-to-body
      class="partner-dialog"
      :close-on-click-modal="false"
      :before-close="close"
    >
      <template v-if="selected">
        <p>{{ selected.name }} · {{ selected.code }}</p>
        <h3 v-if="!editing">基本資料</h3>
        <ElDescriptions v-if="!editing" :column="1" border>
          <ElDescriptionsItem :label="selected.kind === 'agent' ? '代理編號' : '商戶編號'">{{
            selected.id
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="關係">{{
            selected.direct ? '直屬' : '間接下級（唯讀）'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="所屬代理">{{
            parentText(selected.parentId)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="合作狀態"
            ><GameProviderStatusTag :status="selected.status"
          /></ElDescriptionsItem>
          <ElDescriptionsItem label="合作開始">{{
            selected.cooperationStartDate || '未提供'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="更新時間">{{
            selected.updatedAt || '未提供'
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <SupplierCostConditions
          v-if="selected.termsVisible"
          :key="selected.key + editing"
          ref="newConditions"
          :owner="selected.kind"
          :owner-id="selected.id"
          :parent-id="selected.parentId"
          :readonly="!editing"
          :hide-upstream="!selected.direct"
        />
        <MerchantCollectionMode
          v-if="selected.kind === 'merchant' && selected.direct && !editing"
          :merchant-id="selected.id"
          :initial="store.merchants.find((m) => m.id === selected?.id)?.collectionMode"
        />
      </template>
      <template #footer><ElButton @click="close(() => (opened = false))">關閉</ElButton></template>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { permitsAgent } from '@/domain/agent-access'
  import { computed, ref, watch } from 'vue'
  import { useNow, useEventListener } from '@vueuse/core'
  import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
  import { ElMessageBox } from 'element-plus'
  import SupplierCostConditions from '@/components/business/SupplierCostConditions.vue'
  import MerchantCollectionMode from '@/components/business/MerchantCollectionMode.vue'
  import { useCollectionModeStore } from '@/store/modules/collectionMode'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import GameProviderStatusTag from '@/components/business/game-provider/status-tag/index.vue'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { platformDate } from '@/domain/report-four-tabs'
  import {
    agentScope,
    canEditRate,
    canViewAgentTerms,
    type RateTarget
  } from '@/domain/agent-portal'
  const store = useBusinessPartnerStore(),
    collection = useCollectionModeStore(),
    user = useUserStore(),
    locale = usePlatformLocaleStore(),
    route = useRoute(),
    router = useRouter()
  const actor = computed(() => ({
    roles: user.info.roles || [],
    agentId: user.info.agentId,
    name: user.info.userName || '演示代理'
  }))
  const isTerms = computed(() => route.name === 'AgentPortalTerms')
  const isRelations = computed(() => route.name === 'AgentPortalRelations')
  const pageTitle = computed(() =>
    isTerms.value ? '商務條件' : route.name === 'AgentPortalRelations' ? '代理關係' : '商戶管理'
  )
  const scope = computed(() => agentScope(store, actor.value)),
    now = useNow({ interval: 60000 })
  const timezone = computed(() => locale.defaultTimezone?.id || '')
  const today = computed(() => {
    try {
      return platformDate(now.value, timezone.value)
    } catch {
      return ''
    }
  })
  const tab = ref(route.query.kind === 'merchant' ? 'merchant' : 'agent'),
    status = ref(String(route.query.status || '')),
    level = ref(String(route.query.level || '')),
    mode = ref(String(route.query.mode || '')),
    relation = ref(String(route.query.relation || '')),
    keyword = ref(String(route.query.q || '')),
    pageNumber = ref(1),
    pageSize = ref(10)
  const allRows = computed(() =>
    [
      ...scope.value.agents.map((a) => ({
        kind: 'agent' as const,
        level: a.level,
        currencies: '',
        lineCount: 0,
        id: a.id,
        name: a.name,
        code: a.code,
        parentId: a.parentAgentId,
        status: a.status,
        cooperationStartDate: a.cooperationStartDate,
        updatedAt: a.updatedAt,
        direct: a.parentAgentId === actor.value.agentId
      })),
      ...scope.value.merchants.map((m) => ({
        kind: 'merchant' as const,
        level: '',
        currencies: [...new Set(m.lines.map((l) => l.currency))].join(' / '),
        lineCount: m.lines.length,
        id: m.id,
        name: m.name,
        code: m.code,
        parentId: m.agentId,
        status: m.status,
        cooperationStartDate: m.cooperationStartDate,
        updatedAt: m.updatedAt,
        direct: m.agentId === actor.value.agentId
      }))
    ].map((r) => ({
      ...r,
      key: `${r.kind}:${r.id}`,
      editable: canEditRate(store, actor.value, r),
      termsVisible: canViewAgentTerms(store, actor.value, r)
    }))
  )
  const statusChoices = computed(() => [
    ...new Set(
      allRows.value
        .filter(
          (r) => r.kind === (isRelations.value ? 'agent' : isTerms.value ? tab.value : 'merchant')
        )
        .map((r) => r.status)
    )
  ])
  const nodeId = ref('')
  function selectNode(node: { id: string }) {
    nodeId.value = node.id
  }
  const activeNode = computed(
    () =>
      [scope.value.own, ...scope.value.agents].find((a) => a?.id === nodeId.value) ||
      scope.value.own
  )
  type TreeNode = { id: string; label: string; children: TreeNode[] }
  const agentTree = computed(() => {
    if (!scope.value.own) return []
    const seen = new Set<string>()
    const build = (a: NonNullable<typeof scope.value.own>): TreeNode => {
      seen.add(a.id)
      return {
        id: a.id,
        label: `${a.code} / ${a.name} · ${a.level}`,
        children: scope.value.agents
          .filter((c) => c.parentAgentId === a.id && !seen.has(c.id))
          .map(build)
      }
    }
    return [build(scope.value.own)]
  })
  const rows = computed(() =>
    allRows.value.filter(
      (r) =>
        (!isTerms.value || r.termsVisible) &&
        (!route.query.status || r.status === route.query.status) &&
        (!isRelations.value || !route.query.level || r.level === route.query.level) &&
        (isRelations.value ||
          isTerms.value ||
          !route.query.mode ||
          collection.at(
            r.id,
            today.value,
            store.merchants.find((m) => m.id === r.id)?.collectionMode
          ) === route.query.mode) &&
        r.kind ===
          (isTerms.value
            ? tab.value
            : route.name === 'AgentPortalRelations'
              ? 'agent'
              : 'merchant') &&
        (isTerms.value ||
          !route.query.relation ||
          (route.query.relation === 'direct'
            ? r.direct
            : route.query.relation === 'indirect'
              ? !r.direct
              : false)) &&
        `${r.name} ${r.code} ${r.id}`
          .toLowerCase()
          .includes(String(route.query.q || '').toLowerCase())
    )
  )
  const paged = computed(() =>
    rows.value.slice((pageNumber.value - 1) * pageSize.value, pageNumber.value * pageSize.value)
  )
  const apply = () => {
    pageNumber.value = 1
    router.replace({
      query: {
        ...route.query,
        q: keyword.value.trim() || undefined,
        relation: relation.value || undefined,
        status: status.value || undefined,
        level: level.value || undefined,
        mode: mode.value || undefined
      }
    })
  }
  const changeTab = () => {
    pageNumber.value = 1
    router.replace({ query: { ...route.query, kind: tab.value, q: undefined } })
  }
  watch(
    () => route.query.kind,
    () => {
      tab.value = route.query.kind === 'merchant' ? 'merchant' : 'agent'
    }
  )
  const reset = () => {
    keyword.value = ''
    relation.value = ''
    status.value = ''
    level.value = ''
    mode.value = ''
    apply()
  }
  watch(
    () => route.fullPath,
    () => {
      status.value = String(route.query.status || '')
      level.value = String(route.query.level || '')
      mode.value = String(route.query.mode || '')
      pageNumber.value = 1
    }
  )
  watch(
    () => route.query.relation,
    () => {
      relation.value = String(route.query.relation || '')
    }
  )
  watch(
    () => route.query.q,
    () => {
      keyword.value = String(route.query.q || '')
      pageNumber.value = 1
    }
  )
  watch(
    () => rows.value.length,
    () => {
      pageNumber.value = Math.min(
        pageNumber.value,
        Math.max(1, Math.ceil(rows.value.length / pageSize.value))
      )
    }
  )
  const selectedKey = ref(''),
    opened = ref(false),
    editing = ref(false)
  const newConditions = ref<InstanceType<typeof SupplierCostConditions>>()
  const selected = computed(() => allRows.value.find((r) => r.key === selectedKey.value))
  const dirty = computed(() => opened.value && editing.value && !!newConditions.value?.dirty)
  const parentText = (id?: string) =>
    id ? `${store.agents.find((a) => a.id === id)?.name || '未提供名稱'}（${id}）` : '—'
  function inspect(row: RateTarget) {
    selectedKey.value = `${row.kind}:${row.id}`
    editing.value = false
    opened.value = true
  }
  function edit(row: RateTarget) {
    if (!isTerms.value || !canEditRate(store, actor.value, row)) return
    selectedKey.value = `${row.kind}:${row.id}`
    editing.value = true
    opened.value = true
  }
  async function mayClose() {
    if (!dirty.value) return true
    try {
      await ElMessageBox.confirm('放棄尚未儲存的費率修改？', '離開編輯', {
        confirmButtonText: '放棄變更',
        cancelButtonText: '繼續編輯'
      })
      return true
    } catch {
      return false
    }
  }
  async function close(done: () => void) {
    if (await mayClose()) done()
  }
  onBeforeRouteLeave(async () => {
    if (!(await mayClose())) return false
    opened.value = false
    return true
  })
  useEventListener(window, 'beforeunload', (e) => {
    if (dirty.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
</script>
<style scoped>
  .agent-partners {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
  }
  .rate-form {
    margin-top: 16px;
  }
  .rate-form :deep(.el-date-editor) {
    width: 100%;
  }
  .rate-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  .rate-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  .history {
    display: grid;
    gap: 12px;
    margin-top: 20px;
  }
  .history article {
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    padding: 12px;
  }
  .version-state {
    margin-left: 12px;
  }
  .history h3 {
    margin: 0;
  }
  .partner-filters {
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  }
  .relation-overview {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 16px;
  }
  .section-heading {
    margin: 0;
    font-size: 16px;
  }
  .relation-overview :deep(.el-tree-node__content) {
    min-height: 36px;
    height: auto;
  }
  .relation-overview :deep(.el-tree-node__label) {
    white-space: normal;
  }
  @media (width < 1000px) {
    .relation-overview {
      grid-template-columns: minmax(0, 1fr);
    }
    .partner-filters {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
<style>
  .partner-dialog {
    max-height: 90dvh;
    display: flex;
    flex-direction: column;
    margin-top: 5dvh !important;
  }
  .partner-dialog .el-dialog__body {
    overflow: auto;
    min-height: 0;
    overflow-wrap: anywhere;
  }
  .partner-dialog .el-dialog__header,
  .partner-dialog .el-dialog__footer {
    flex-shrink: 0;
  }
</style>
