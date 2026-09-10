<template>
  <section class="agent-partners">
    <AppPageHeader
      :title="pageTitle"
      description="可查看所有下級；費率修改統一由商務條件辦理，其他設定唯讀。"
      ><template #actions>
        <ElButton
          v-if="route.name === 'AgentPortalRelations' && scope.own"
          type="primary"
          :disabled="scope.own.level === 'L3'"
          @click="router.push('/agent/relations/create')"
          >{{ scope.own.level === 'L3' ? '已達三級上限' : '新增下級代理' }}</ElButton
        >
        <ElButton
          v-if="route.name === 'AgentPortalMerchants' && scope.own"
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
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="登入代理"
          >{{ scope.own.name }} · {{ scope.own.id }}</ElDescriptionsItem
        >
        <ElDescriptionsItem label="舊通用費率（唯讀參考）">{{
          ownRate ? `${ownRate.rate}% · ${basisText(ownRate.basis)}` : '未設定生效條件'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="日期依據">{{ today }} · {{ timezone }}</ElDescriptionsItem>
      </ElDescriptions>
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
          <ElFormItem label="關係"
            ><ElSelect v-model="relation" clearable placeholder="全部關係" aria-label="關係篩選"
              ><ElOption label="直屬" value="direct" /><ElOption
                label="間接下級"
                value="indirect" /></ElSelect
          ></ElFormItem>
          <div class="filter-actions"
            ><ElButton type="primary" @click="apply">查詢</ElButton
            ><ElButton @click="reset">重置</ElButton></div
          >
        </AppFilterForm></ElCard
      >
      <ElTabs v-if="isTerms" v-model="tab" @tab-change="changeTab"
        ><ElTabPane :label="`下級代理（${scope.agents.length}）`" name="agent" /><ElTabPane
          :label="`商戶（${scope.merchants.length}）`"
          name="merchant"
      /></ElTabs>
      <ArtTable :data="paged" row-key="key">
        <ElTableColumn prop="name" label="名稱" min-width="180" /><ElTableColumn
          prop="code"
          label="代碼"
          min-width="140"
        />
        <ElTableColumn label="關係" width="105"
          ><template #default="{ row }">{{
            row.direct ? '直屬' : '間接下級'
          }}</template></ElTableColumn
        >
        <ElTableColumn label="舊通用費率（非新制成本）" min-width="150"
          ><template #default="{ row }">{{
            row.rate ? `${row.rate.rate}% · ${basisText(row.rate.basis)}` : '尚無生效條件'
          }}</template></ElTableColumn
        >
        <ElTableColumn label="操作" min-width="160"
          ><template #default="{ row }"
            ><ElButton link type="primary" @click="inspect(row)">查看</ElButton
            ><ElButton
              v-if="!isTerms"
              link
              type="primary"
              @click="router.push({ path: '/agent/terms', query: { kind: row.kind, q: row.id } })"
              >商務條件</ElButton
            ><ElButton v-if="isTerms && row.editable" link type="primary" @click="edit(row)"
              >修改費率</ElButton
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
      :title="editing ? '修改費率 · 新生效版本' : '授權資料與費率版本'"
      width="min(560px, calc(100vw - 24px))"
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
          :key="selected.key + editing"
          ref="newConditions"
          :owner="selected.kind"
          :owner-id="selected.id"
          :parent-id="selected.parentId"
          :readonly="!editing"
          :hide-upstream="!selected.direct"
        />
        <div v-if="!editing" class="history"
          ><h3>舊通用費率版本（唯讀參考）</h3>
          <ElAlert
            v-if="selected.rate && ownRate && selected.rate.basis !== ownRate.basis"
            type="warning"
            :closable="false"
            title="計費基礎與自身費率不同，不可直接比較百分比。"
          />
          <ElEmpty v-if="!history.length" description="尚無已核准條件" /><article
            v-for="v in history"
            :key="v.key"
            ><strong>V{{ v.version }} · {{ v.rate }}%</strong
            ><ElTag class="version-state">{{ versionState(v) }}</ElTag>
            <ElDescriptions :column="1" size="small">
              <ElDescriptionsItem label="適用期間"
                >{{ v.effectiveFrom }} 起 ～ {{ versionEnd(v) || '持續適用'
                }}{{ versionEnd(v) ? '（不含當日）' : '' }}</ElDescriptionsItem
              >
              <ElDescriptionsItem label="計費基礎">{{ basisText(v.basis) }}</ElDescriptionsItem>
              <ElDescriptionsItem label="結算幣別">{{ v.currency }}</ElDescriptionsItem>
              <ElDescriptionsItem label="結算週期">{{ cycleText(v.cycle) }}</ElDescriptionsItem>
            </ElDescriptions></article
          ></div
        >
      </template>
      <template #footer><ElButton @click="close(() => (opened = false))">關閉</ElButton></template>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useNow, useEventListener } from '@vueuse/core'
  import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
  import { ElMessageBox } from 'element-plus'
  import SupplierCostConditions from '@/components/business/SupplierCostConditions.vue'
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
    rateAt,
    rateTimeline,
    type RateTarget
  } from '@/domain/agent-portal'
  const store = useBusinessPartnerStore(),
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
  const ownRate = computed(() =>
    scope.value.own
      ? rateAt(store, { kind: 'agent', id: scope.value.own.id }, today.value)
      : undefined
  )
  const tab = ref(route.query.kind === 'merchant' ? 'merchant' : 'agent'),
    relation = ref(String(route.query.relation || '')),
    keyword = ref(String(route.query.q || '')),
    pageNumber = ref(1),
    pageSize = ref(10)
  const allRows = computed(() =>
    [
      ...scope.value.agents.map((a) => ({
        kind: 'agent' as const,
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
      rate: rateAt(store, r, today.value)
    }))
  )
  const rows = computed(() =>
    allRows.value.filter(
      (r) =>
        r.kind ===
          (isTerms.value
            ? tab.value
            : route.name === 'AgentPortalRelations'
              ? 'agent'
              : 'merchant') &&
        (!route.query.relation ||
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
        relation: relation.value || undefined
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
    apply()
  }
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
  const history = computed(() =>
    selected.value ? [...rateTimeline(store, selected.value)].reverse() : []
  )
  const dirty = computed(() => opened.value && editing.value && !!newConditions.value?.dirty)
  const basisText = (value: string) =>
    ({ GGR: 'GGR（遊戲毛收入）', 'Valid Bet': '有效投注', Turnover: '總投注' })[value] || value
  const cycleText = (value: string) =>
    ({ Daily: '每日', Weekly: '每週', Semimonthly: '每半月', Monthly: '每月' })[value] || value
  const parentText = (id?: string) =>
    id ? `${store.agents.find((a) => a.id === id)?.name || '未提供名稱'}（${id}）` : '—'
  type Version = ReturnType<typeof rateTimeline>[number]
  const versionEnd = (v: Version) => {
    const timeline = selected.value ? rateTimeline(store, selected.value) : []
    const next = timeline[timeline.findIndex((item) => item.key === v.key) + 1]?.effectiveFrom
    return [v.until, next].filter((s): s is string => !!s).sort()[0]
  }
  const versionState = (v: Version) =>
    !today.value
      ? '日期設定缺失'
      : v.effectiveFrom > today.value
        ? '待生效'
        : selected.value?.rate?.key === v.key
          ? '目前適用'
          : v.until && v.until <= today.value
            ? '已失效'
            : '歷史版本'
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
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) auto;
  }
  @media (width < 1000px) {
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
