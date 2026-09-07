<template>
  <section class="agent-partners">
    <AppPageHeader
      title="下級代理與商戶"
      description="可查看所有下級；僅可調整直屬下一級代理及直屬商戶費率。"
    />
    <ElAlert
      title="前端演示：與總後台共用商務識別，費率修改另存追加版本紀錄；不執行正式結算、不回寫對帳單，請勿填真實合約數字。"
      type="warning"
      :closable="false"
    />
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
        <ElDescriptionsItem label="自身取得費率">{{
          ownRate ? `${ownRate.rate}% · ${ownRate.basis}` : '未設定生效條件'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="日期依據">{{ today }} · {{ timezone }}</ElDescriptionsItem>
      </ElDescriptions>
      <ElCard shadow="never"
        ><AppFilterForm @submit.prevent="apply">
          <ElFormItem label="名稱／代碼"
            ><ElInput v-model="keyword" clearable placeholder="查詢授權範圍內名稱或代碼"
          /></ElFormItem>
          <div class="filter-actions"
            ><ElButton type="primary" @click="apply">查詢</ElButton
            ><ElButton @click="reset">重置</ElButton></div
          >
        </AppFilterForm></ElCard
      >
      <ElTabs v-model="tab" @tab-change="pageNumber = 1"
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
        <ElTableColumn label="目前費率" min-width="150"
          ><template #default="{ row }">{{
            row.rate ? `${row.rate.rate}% · ${row.rate.basis}` : '尚無生效條件'
          }}</template></ElTableColumn
        >
        <ElTableColumn label="操作" min-width="160"
          ><template #default="{ row }"
            ><ElButton link type="primary" @click="inspect(row)">查看</ElButton
            ><ElButton v-if="row.editable" link type="primary" @click="edit(row)"
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
      :title="editing ? '修改費率 · 新生效版本' : '費率版本紀錄'"
      width="min(560px, calc(100vw - 24px))"
      append-to-body
      :close-on-click-modal="false"
      :before-close="close"
    >
      <template v-if="selected">
        <p>{{ selected.name }} · {{ selected.code }}</p>
        <template v-if="editing">
          <ElAlert
            title="不需審核；不得高於生效期間的上級費率，可相等。計費基礎、幣別及帳期不可修改。"
            type="info"
            :closable="false"
          />
          <ElForm label-position="top" class="rate-form" @submit.prevent="save">
            <ElFormItem label="新費率（%）" required
              ><ElInput v-model="draft.rate" placeholder="手動輸入費率" inputmode="decimal"
            /></ElFormItem>
            <ElFormItem :label="`生效日期（${timezone}）`" required
              ><ElDatePicker
                v-model="draft.date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="每次修改必填生效日期"
            /></ElFormItem>
            <ElAlert v-if="error" :title="error" type="error" :closable="false" role="alert" />
            <div class="rate-actions"
              ><ElButton @click="close(() => (opened = false))">取消</ElButton
              ><ElButton type="primary" native-type="submit">儲存新版本</ElButton></div
            >
          </ElForm>
        </template>
        <div v-else class="history"
          ><ElEmpty v-if="!history.length" description="尚無已核准條件" /><article
            v-for="v in history"
            :key="`${v.effectiveFrom}-${v.version}`"
            ><strong>V{{ v.version }} · {{ v.rate }}%</strong
            ><p>{{ v.effectiveFrom }} 起 · {{ v.basis }} · {{ v.currency }} · {{ v.cycle }}</p
            ><small>{{
              v.effectiveFrom > today ? '待生效' : '已到生效日（適用版本以日期判定）'
            }}</small></article
          ></div
        >
      </template>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useNow, useEventListener } from '@vueuse/core'
  import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { platformDate } from '@/domain/report-four-tabs'
  import {
    agentScope,
    canEditRate,
    rateAt,
    rateTimeline,
    rateFingerprint,
    savePortalRate,
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
  const tab = ref('agent'),
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
        direct: a.parentAgentId === actor.value.agentId
      })),
      ...scope.value.merchants.map((m) => ({
        kind: 'merchant' as const,
        id: m.id,
        name: m.name,
        code: m.code,
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
        r.kind === tab.value &&
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
    router.replace({ query: { q: keyword.value.trim() || undefined } })
  }
  const reset = () => {
    keyword.value = ''
    apply()
  }
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
    editing = ref(false),
    error = ref(''),
    fingerprint = ref(''),
    original = ref('')
  const draft = reactive({ rate: '', date: '' })
  const selected = computed(() => allRows.value.find((r) => r.key === selectedKey.value))
  const history = computed(() =>
    selected.value ? [...rateTimeline(store, selected.value)].reverse() : []
  )
  const dirty = computed(
    () => opened.value && editing.value && original.value !== JSON.stringify(draft)
  )
  function inspect(row: RateTarget) {
    selectedKey.value = `${row.kind}:${row.id}`
    editing.value = false
    opened.value = true
  }
  function edit(row: RateTarget) {
    if (!canEditRate(store, actor.value, row)) return
    selectedKey.value = `${row.kind}:${row.id}`
    editing.value = true
    error.value = ''
    draft.rate = rateAt(store, row, today.value)?.rate || ''
    draft.date = ''
    original.value = JSON.stringify(draft)
    fingerprint.value = rateFingerprint(store)
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
  function save() {
    error.value = ''
    try {
      if (!selected.value) throw new Error('對象已不在授權範圍')
      savePortalRate(
        store,
        actor.value,
        selected.value,
        { rate: draft.rate, effectiveFrom: draft.date || '', fingerprint: fingerprint.value },
        { today: today.value, timezone: timezone.value }
      )
      opened.value = false
      ElMessage.success('費率演示版本已保存，不需審核；歷史對帳未變更')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '儲存失敗'
    }
  }
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
  }
  .history article {
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    padding: 12px;
  }
</style>
