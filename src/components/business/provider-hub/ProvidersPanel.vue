<template>
  <section class="providers-panel">
    <ElForm class="filters" label-position="top" @submit.prevent="applyFilters">
      <ElFormItem label="代碼／名稱"
        ><ElInput v-model="draft.q" clearable placeholder="輸入供應商代碼或名稱"
      /></ElFormItem>
      <ElFormItem label="狀態"
        ><ElSelect v-model="draft.status" clearable placeholder="全部狀態"
          ><ElOption
            v-for="(label, value) in providerLabels"
            :key="value"
            :label="label"
            :value="value" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="幣別"
        ><ElSelect v-model="draft.currency" clearable placeholder="全部幣別"
          ><ElOption v-for="c in coreCurrencies" :key="c" :label="c" :value="c" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="環境"
        ><ElSelect v-model="draft.environment" clearable placeholder="全部環境"
          ><ElOption
            v-for="(label, value) in environmentLabels"
            :key="value"
            :label="label"
            :value="value" /></ElSelect
      ></ElFormItem>
      <div class="filter-actions"
        ><ElButton type="primary" native-type="submit">查詢</ElButton
        ><ElButton @click="resetFilters">重置</ElButton></div
      >
    </ElForm>
    <div class="list-heading"
      ><span>共 {{ result.total }} 家供應商 · 已套用 {{ appliedCount }} 項條件</span
      ><ElButton v-if="canWrite" type="primary" @click="createProvider"
        ><ArtSvgIcon icon="ri:add-line" />新增供應商</ElButton
      ></div
    >
    <ElTable
      :data="result.items"
      row-key="id"
      border
      :empty-text="appliedCount ? '查無結果，請調整或重置條件' : '尚無供應商'"
      :default-sort="{ prop: sortKey, order: sortOrder }"
      @sort-change="sortChanged"
    >
      <ElTableColumn prop="code" label="代碼" min-width="130" sortable="custom" />
      <ElTableColumn
        prop="name"
        label="供應商"
        min-width="180"
        sortable="custom"
        show-overflow-tooltip
      />
      <ElTableColumn label="狀態" width="100"
        ><template #default="{ row }"
          ><ElTag :type="row.status === 'active' ? 'success' : 'warning'">{{
            providerLabels[row.status as keyof typeof providerLabels]
          }}</ElTag></template
        ></ElTableColumn
      >
      <ElTableColumn prop="currencies" label="可用幣別（測試）" min-width="160" />
      <ElTableColumn label="預設遊戲類型" min-width="130"
        ><template #default="{ row }"
          ><ElTag>{{ row.defaultGameType }}</ElTag></template
        ></ElTableColumn
      >
      <ElTableColumn prop="productionCount" label="正式啟用線" width="135" sortable="custom" />
      <ElTableColumn prop="gameCount" label="遊戲數" width="105" sortable="custom" />
      <ElTableColumn prop="updatedAt" label="更新時間（UTC）" min-width="210" sortable="custom"
        ><template #default="{ row }">{{ time(row.updatedAt) }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="110" :fixed="width >= 1200 ? 'right' : false"
        ><template #default="{ row }"
          ><ElButton link type="primary" @click="openProvider(row.id)">查看詳情</ElButton></template
        ></ElTableColumn
      >
    </ElTable>
    <ElPagination
      class="pagination"
      :current-page="result.page"
      :page-size="result.size"
      :total="result.total"
      :page-sizes="[10, 20, 50]"
      :pager-count="5"
      layout="total, prev, pager, next, sizes"
      @current-change="setPage"
      @size-change="setSize"
    />

    <ElDrawer
      :model-value="opened"
      :title="
        creating
          ? '新增供應商'
          : `${selected?.name || '供應商詳情'}｜${selected?.profile?.code || ''}`
      "
      :size="width < 768 ? '100%' : 'min(1040px, 96vw)'"
      :before-close="beforeClose"
      @closed="clearEditor"
    >
      <ElAlert
        v-if="error"
        :title="error"
        type="error"
        :closable="false"
        show-icon
        class="notice"
      />
      <template v-if="editingProfile">
        <ElForm label-position="top" @submit.prevent="submitProfile">
          <ElFormItem label="代碼" required :error="profileErrors.code"
            ><ElInput v-model="profileForm.code" :disabled="!creating" maxlength="32"
          /></ElFormItem>
          <ElFormItem label="名稱" required :error="profileErrors.name"
            ><ElInput v-model="profileForm.name" maxlength="80"
          /></ElFormItem>
          <ElFormItem label="聯絡資訊"
            ><ElInput v-model="profileForm.contact" maxlength="160"
          /></ElFormItem>
          <ElFormItem label="預設遊戲類型" required>
            <ElSelect v-model="profileForm.defaultGameType">
              <ElOption v-for="type in gameTypes" :key="type" :label="type" :value="type" />
            </ElSelect>
            <small>旗下遊戲預設沿用此類型，個別修改的遊戲不受影響。</small>
          </ElFormItem>
          <ElFormItem label="是否提供試玩">
            <ElSelect v-model="profileForm.offersTrial" aria-label="是否提供試玩">
              <ElOption label="是" :value="true" />
              <ElOption label="否" :value="false" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="試玩方式">
            <ElSelect v-model="profileForm.trialMode" aria-label="試玩方式">
              <ElOption label="原生試玩" value="native" />
              <ElOption label="測試試玩" value="sandbox" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="備註"
            ><ElInput v-model="profileForm.note" type="textarea" maxlength="500" show-word-limit
          /></ElFormItem>
        </ElForm>
      </template>
      <template v-else-if="selected">
        <ElTabs :model-value="pane" @tab-change="changePane">
          <ElTabPane label="基本資料" name="profile">
            <ElDescriptions :column="width < 768 ? 1 : 2" border>
              <ElDescriptionsItem label="供應商識別">{{ selected.id }}</ElDescriptionsItem>
              <ElDescriptionsItem label="預設遊戲類型"
                ><ElTag>{{
                  selected.profile?.defaultGameType || '未分類'
                }}</ElTag></ElDescriptionsItem
              >
              <ElDescriptionsItem label="狀態">{{
                providerLabels[selected.profile!.status]
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="聯絡資訊">{{
                selected.profile!.contact || '—'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="更新時間（UTC）">{{
                time(selected.profile!.updatedAt)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="備註">{{
                selected.profile!.note || '—'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="試玩方式">{{
                modeLabel(selected.mode)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="是否提供試玩">{{
                selected.profile?.offersTrial ? '是' : '否'
              }}</ElDescriptionsItem>
            </ElDescriptions>
            <div v-if="canWrite" class="actions"
              ><ElButton @click="editProfile">編輯基本資料</ElButton
              ><ElButton
                v-if="selected.profile!.status !== 'active'"
                @click="setProviderStatus('active')"
                >模擬啟用</ElButton
              ><ElButton
                v-if="selected.profile!.status !== 'maintenance'"
                @click="setProviderStatus('maintenance')"
                >維護</ElButton
              ><ElButton
                v-if="selected.profile!.status !== 'disabled'"
                type="danger"
                plain
                @click="setProviderStatus('disabled')"
                >停用</ElButton
              ></div
            >
            <p class="hint">停用只阻擋新啟動；既有派彩、退款與查單仍須受理。</p>
          </ElTabPane>
          <ElTabPane label="API 設定" name="api">
            <ElTable :data="selected.lines" border empty-text="請先於幣別管理新增線路">
              <ElTableColumn prop="currency" label="交易幣別" width="100" />
              <ElTableColumn prop="config.apiUrl" label="API URL" min-width="240" />
              <ElTableColumn prop="config.accountId" label="供應商帳號 ID" min-width="160" />
              <ElTableColumn prop="config.currencyId" label="供應商幣別 ID" min-width="160" />
              <ElTableColumn label="憑證" min-width="150"
                ><template #default="{ row }">{{
                  row.config?.credential?.mask || '未設定'
                }}</template></ElTableColumn
              >
              <ElTableColumn label="操作" width="110"
                ><template #default="{ row }"
                  ><ElButton
                    link
                    type="primary"
                    @click="patchQuery({ pane: 'lines', line: row.id })"
                    >查看設定</ElButton
                  ></template
                ></ElTableColumn
              >
            </ElTable>
          </ElTabPane>
          <ElTabPane label="幣別管理" name="lines">
            <template v-if="lineForm">
              <div class="list-heading"
                ><h3>{{ editingLineId ? '編輯線路' : '新增線路' }}</h3
                ><ElButton @click="cancelLine">返回線路列表</ElButton></div
              >
              <ElAlert
                title="儲存設定或重設憑證後，舊測試失效並暫停新的啟動。未儲存前不改變線路。"
                type="info"
                :closable="false"
                class="notice"
              />
              <ElForm label-position="top" class="line-form" @submit.prevent="submitLine">
                <ElFormItem label="線路識別"
                  ><ElInput :model-value="editingLineId || '儲存時產生'" disabled
                /></ElFormItem>
                <ElFormItem label="幣別" required
                  ><ElSelect v-model="lineForm.currency" :disabled="identityLocked"
                    ><ElOption
                      v-for="c in coreCurrencies"
                      :key="c"
                      :label="c"
                      :value="c" /></ElSelect
                ></ElFormItem>
                <ElFormItem label="環境" required
                  ><ElSelect v-model="lineForm.environment" :disabled="identityLocked"
                    ><ElOption
                      v-for="(label, value) in environmentLabels"
                      :key="value"
                      :label="label"
                      :value="value" /></ElSelect
                ></ElFormItem>
                <ElFormItem
                  label="供應商帳號 ID"
                  required
                  :error="lineForm.accountId.trim() ? '' : lineSubmitted ? '此欄位必填' : ''"
                  ><ElInput v-model="lineForm.accountId" maxlength="100"
                /></ElFormItem>
                <ElFormItem label="供應商幣別 ID" required
                  ><ElInput v-model="lineForm.currencyId" maxlength="50"
                /></ElFormItem>
                <ElFormItem class="wide" label="API URL" required
                  ><ElInput
                    v-model="lineForm.apiUrl"
                    placeholder="https://provider.example.invalid/api"
                    maxlength="300"
                /></ElFormItem>
                <ElFormItem class="wide" label="Callback 路徑（平台產生，唯讀）"
                  ><ElInput
                    :model-value="
                      editingLineId
                        ? `/callbacks/${selected.id}/${editingLineId}/{event}`
                        : '線路儲存後產生'
                    "
                    disabled
                /></ElFormItem>
                <ElFormItem label="金額小數位數（0–8）" required
                  ><ElInputNumber v-model="lineForm.scale" :min="0" :max="8" :precision="0"
                /></ElFormItem>
                <ElFormItem label="最小單位（十進位字串）" required
                  ><ElInput v-model="lineForm.minUnit" maxlength="30"
                /></ElFormItem>
              </ElForm>
            </template>
            <template v-else>
              <div class="list-heading"
                ><span>供應商各幣別線路共用成本費率與結算條件</span
                ><ElButton v-if="canWrite" @click="newLine">新增線路</ElButton></div
              >
              <ElTable :data="linePage.items" border row-key="id" empty-text="尚無幣別線路">
                <ElTableColumn prop="id" label="線路識別" min-width="200" show-overflow-tooltip />
                <ElTableColumn prop="currency" label="幣別" width="90" />
                <ElTableColumn label="環境" min-width="180"
                  ><template #default="{ row }">{{
                    environmentLabels[row.config.environment as Environment]
                  }}</template></ElTableColumn
                >
                <ElTableColumn label="狀態" width="100"
                  ><template #default="{ row }"
                    ><ElTag>{{ lineLabels[row.config.status as LineStatus] }}</ElTag></template
                  ></ElTableColumn
                >
                <ElTableColumn label="操作" width="100"
                  ><template #default="{ row }"
                    ><ElButton link type="primary" @click="inspectLine(row.id)"
                      >查看設定</ElButton
                    ></template
                  ></ElTableColumn
                >
              </ElTable>
              <ElPagination
                class="pagination"
                v-model:current-page="linePageNumber"
                v-model:page-size="lineSize"
                :total="linePage.total"
                :page-sizes="[10, 20, 50]"
                layout="total, prev, pager, next, sizes"
                @size-change="linePageNumber = 1"
              />
              <section v-if="inspectedLine" class="line-inspection">
                <h3
                  >{{ inspectedLine.currency }}｜{{
                    environmentLabels[inspectedLine.config!.environment]
                  }}</h3
                >
                <ElDescriptions :column="1" border>
                  <ElDescriptionsItem label="API URL">{{
                    inspectedLine.config!.apiUrl || '未設定'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="外部帳號／幣別 ID"
                    >{{ inspectedLine.config!.accountId || '—' }} /
                    {{ inspectedLine.config!.currencyId || '—' }}</ElDescriptionsItem
                  >
                  <ElDescriptionsItem label="Callback 路徑">{{
                    `/callbacks/${selected.id}/${inspectedLine.id}/{event}`
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="小數位／最小單位"
                    >{{ inspectedLine.config!.scale }} /
                    {{ inspectedLine.config!.minUnit }}</ElDescriptionsItem
                  >
                  <ElDescriptionsItem label="憑證識別">{{
                    inspectedLine.config!.credential?.id || '未設定'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="憑證遮罩／更新時間"
                    >{{ inspectedLine.config!.credential?.mask || '—' }} /
                    {{ time(inspectedLine.config!.credential?.updatedAt) }}</ElDescriptionsItem
                  >
                  <ElDescriptionsItem label="模擬測試">{{
                    inspectedLine.config!.check?.message || '未驗證'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="測試時間／追蹤識別"
                    >{{ time(inspectedLine.config!.check?.at) }} /
                    {{ inspectedLine.config!.check?.traceId || '—' }}</ElDescriptionsItem
                  >
                </ElDescriptions>
                <div class="checks"
                  ><div v-for="check in checks" :key="check.label"
                    ><ElTag :type="check.passed ? 'success' : 'warning'">{{
                      check.passed ? '模擬符合' : '待完成'
                    }}</ElTag
                    ><span>{{ check.label }}</span></div
                  ></div
                >
                <div v-if="canWrite" class="actions"
                  ><ElButton @click="editLine">編輯設定</ElButton
                  ><ElButton @click="resetCredential">重設示範憑證識別</ElButton
                  ><ElButton @click="runTest(false)">模擬設定測試</ElButton
                  ><ElButton @click="runTest(true)">模擬逾時</ElButton
                  ><ElButton
                    type="primary"
                    :disabled="checks.some((c) => !c.passed)"
                    @click="setLineStatus('active')"
                    >模擬啟用測試線</ElButton
                  ><ElButton @click="setLineStatus('maintenance')">維護</ElButton
                  ><ElButton type="danger" plain @click="setLineStatus('disabled')"
                    >停用</ElButton
                  ></div
                >
              </section>
            </template>
          </ElTabPane>
          <ElTabPane label="成本費率" name="costs">
            <ProviderTerms :key="selected.id" :provider-id="selected.id" />
          </ElTabPane>
          <ElTabPane label="遊戲清單" name="games"
            ><ElTable :data="gamePage.items" border
              ><ElTableColumn prop="name" label="遊戲" min-width="160" /><ElTableColumn
                prop="code"
                label="代碼"
                min-width="160"
              /><ElTableColumn label="操作" width="100"
                ><template #default="{ row }"
                  ><ElButton
                    link
                    type="primary"
                    @click="
                      router.push({ path: '/admin/providers/games', query: { game: row.id } })
                    "
                    >查看遊戲</ElButton
                  ></template
                ></ElTableColumn
              ></ElTable
            ><ElPagination
              class="pagination"
              v-model:current-page="gamePageNumber"
              v-model:page-size="gameSize"
              :page-sizes="[10, 20, 50]"
              :total="gamePage.total"
              layout="total, prev, pager, next, sizes"
              @size-change="gamePageNumber = 1"
          /></ElTabPane>
          <ElTabPane label="操作紀錄" name="audit"
            ><ElTable :data="auditPage.items" border empty-text="尚無操作紀錄"
              ><ElTableColumn label="時間（UTC）" min-width="190"
                ><template #default="{ row }">{{ time(row.at) }}</template></ElTableColumn
              ><ElTableColumn prop="action" label="操作" min-width="300" /><ElTableColumn
                prop="actor"
                label="操作人"
                min-width="120" /></ElTable
            ><ElPagination
              class="pagination"
              v-model:current-page="auditPageNumber"
              v-model:page-size="auditSize"
              :page-sizes="[10, 20, 50]"
              :total="auditPage.total"
              layout="total, prev, pager, next, sizes"
              @size-change="auditPageNumber = 1"
          /></ElTabPane>
        </ElTabs>
      </template>
      <ElEmpty v-else description="找不到指定供應商" />
      <template #footer
        ><div class="footer"
          ><ElButton @click="close">{{ dirty ? '取消修改' : '關閉' }}</ElButton
          ><ElButton
            v-if="editingProfile || lineForm"
            :disabled="!canWrite"
            type="primary"
            :loading="saving"
            @click="editingProfile ? submitProfile() : submitLine()"
            >儲存</ElButton
          ></div
        ></template
      >
    </ElDrawer>
  </section>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
  import { useWindowSize } from '@vueuse/core'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { useUserStore } from '@/store/modules/user'
  import { modeLabel } from '@/domain/provider-demo'
  import { gameTypes } from '@/domain/game-types'
  import ProviderTerms from './ProviderTerms.vue'
  import { listPage } from '@/domain/list-query'
  import {
    canManageProviders,
    coreCurrencies,
    providerLabels,
    lineLabels,
    environmentLabels,
    blankLine,
    saveProvider,
    saveLine,
    resetDemoCredential,
    testLine,
    activationChecks,
    changeLineStatus,
    changeProviderStatus,
    type LineInput,
    type Environment,
    type LineStatus,
    type ProviderProfile
  } from '@/domain/provider-core'

  const store = useProviderDemoStore()
  const user = useUserStore()
  const route = useRoute()
  const router = useRouter()
  const { width } = useWindowSize()
  const actor = computed(() => ({
    roles: user.info.roles || [],
    name: user.info.userName || '演示管理者'
  }))
  const canWrite = computed(() => canManageProviders(actor.value))
  const keys = ['q', 'status', 'currency', 'environment'] as const
  const fromUrl = () =>
    Object.fromEntries(keys.map((k) => [k, String(route.query[k] || '')])) as Record<
      (typeof keys)[number],
      string
    >
  const draft = reactive(fromUrl())
  const applied = computed(fromUrl)
  const appliedCount = computed(() => Object.values(applied.value).filter(Boolean).length)
  const sortKey = computed(() =>
    ['name', 'code', 'gameCount', 'productionCount', 'updatedAt'].includes(String(route.query.sort))
      ? String(route.query.sort)
      : 'code'
  )
  const sortOrder = computed(() =>
    route.query.order === 'descending' ? 'descending' : 'ascending'
  )
  const rows = computed(() =>
    store.state.providers
      .filter((p) => {
        const f = applied.value
        return (
          `${p.name} ${p.profile?.code || p.id}`.toLowerCase().includes(f.q.trim().toLowerCase()) &&
          (!f.status || p.profile?.status === f.status) &&
          ((!f.currency && !f.environment) ||
            p.lines.some(
              (l) =>
                (!f.currency || l.currency === f.currency) &&
                (!f.environment || l.config?.environment === f.environment)
            ))
        )
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        defaultGameType: p.profile?.defaultGameType || '未分類',
        code: p.profile!.code,
        status: p.profile!.status,
        currencies:
          [
            ...new Set(
              p.lines
                .filter((l) => p.available && l.available && l.config?.environment === 'sandbox')
                .map((l) => l.currency)
            )
          ].join('、') || '—',
        productionCount: 0,
        gameCount: store.state.games.filter((g) => g.providerId === p.id).length,
        updatedAt: p.profile!.updatedAt
      }))
  )
  const result = computed(() =>
    listPage(rows.value, Number(route.query.page || 1), Number(route.query.size || 10), (a, b) => {
      const key = sortKey.value as keyof typeof a
      const x = a[key]
      const y = b[key]
      return (
        (typeof x === 'number' && typeof y === 'number'
          ? x - y
          : String(x).localeCompare(String(y), 'zh-TW')) *
        (sortOrder.value === 'descending' ? -1 : 1)
      )
    })
  )
  const patchQuery = (patch: Record<string, string | undefined>) =>
    router.replace({ query: { ...route.query, ...patch } })
  const applyFilters = () =>
    patchQuery({ ...Object.fromEntries(keys.map((k) => [k, draft[k] || undefined])), page: '1' })
  const resetFilters = () => {
    keys.forEach((k) => (draft[k] = ''))
    void applyFilters()
  }
  const setPage = (page: number) => patchQuery({ page: String(page) })
  const setSize = (size: number) => patchQuery({ size: String(size), page: '1' })
  const sortChanged = ({ prop, order }: { prop: string; order: string | null }) =>
    patchQuery({ sort: order ? prop : undefined, order: order || undefined, page: '1' })
  const selected = computed(() =>
    store.state.providers.find(
      (p) => p.id === String(route.params.id || route.query.provider || '')
    )
  )
  const creating = computed(() => route.query.createProvider === '1')
  const opened = computed(() => creating.value || !!route.params.id || !!route.query.provider)
  const pane = computed(() =>
    ['profile', 'api', 'lines', 'games', 'costs', 'audit'].includes(String(route.query.pane))
      ? String(route.query.pane)
      : 'profile'
  )
  const error = ref('')
  const saving = ref(false)
  const editingProfile = ref(false)
  const profileForm = reactive({
    trialMode: 'native' as 'native' | 'sandbox',
    offersTrial: false,
    code: '',
    name: '',
    contact: '',
    note: '',
    defaultGameType: '未分類'
  })
  const profileErrors = reactive({ code: '', name: '' })
  const profileVersion = ref(0)
  const original = ref('')
  const lineForm = ref<LineInput>()
  const editingLineId = ref('')
  const lineVersion = ref(0)
  const lineSubmitted = ref(false)
  const dirty = computed(
    () =>
      (editingProfile.value || lineForm.value) &&
      JSON.stringify(editingProfile.value ? profileForm : lineForm.value) !== original.value
  )
  const linePageNumber = ref(1)
  const lineSize = ref(10)
  const gamePageNumber = ref(1)
  const auditPageNumber = ref(1)
  const gameSize = ref(10)
  const auditSize = ref(10)
  const linePage = computed(() =>
    listPage(selected.value?.lines || [], linePageNumber.value, lineSize.value)
  )
  const gamePage = computed(() =>
    listPage(
      store.state.games.filter((g) => g.providerId === selected.value?.id),
      gamePageNumber.value,
      gameSize.value
    )
  )
  const auditPage = computed(() =>
    listPage(
      store.state.audit.filter((a) => a.providerId === selected.value?.id),
      auditPageNumber.value,
      auditSize.value
    )
  )
  const inspectedLine = computed(() => selected.value?.lines.find((l) => l.id === route.query.line))
  const identityLocked = computed(
    () =>
      !!selected.value?.lines.find((l) => l.id === editingLineId.value)?.config?.used ||
      store.state.links.some((l) => l.lineId === editingLineId.value)
  )
  const checks = computed(() =>
    selected.value && inspectedLine.value
      ? activationChecks(store.state, selected.value, inspectedLine.value)
      : []
  )
  const time = (s?: string) =>
    s
      ? s
          .replace('T', ' ')
          .replace(/\.\d+Z$/, ' UTC')
          .replace(/Z$/, ' UTC')
      : '—'
  async function discard() {
    if (!dirty.value) return true
    try {
      await ElMessageBox.confirm('尚有未儲存修改，確定放棄？', '離開編輯', {
        confirmButtonText: '放棄修改',
        cancelButtonText: '繼續編輯',
        type: 'warning'
      })
      return true
    } catch {
      return false
    }
  }
  onBeforeRouteLeave(discard)
  onBeforeRouteUpdate(async () => {
    if (!(await discard())) return false
    clearEditor()
    return true
  })
  function clearEditor() {
    editingProfile.value = false
    lineForm.value = undefined
    original.value = ''
    error.value = ''
    lineSubmitted.value = false
  }
  async function close() {
    if (!(await discard())) return
    clearEditor()
    await router.replace({
      path: '/admin/providers',
      query: {
        ...route.query,
        provider: undefined,
        createProvider: undefined,
        pane: undefined,
        line: undefined
      }
    })
  }
  async function beforeClose(done: () => void) {
    if (!(await discard())) return
    clearEditor()
    await close()
    done()
  }
  const openProvider = (id: string) =>
    patchQuery({ provider: id, pane: 'profile', line: undefined })
  const createProvider = () =>
    patchQuery({ provider: undefined, createProvider: '1', pane: undefined, line: undefined })
  const changePane = (name: string | number) => patchQuery({ pane: String(name), line: undefined })
  function editProfile() {
    if (!selected.value) return
    const p = selected.value
    Object.assign(profileForm, {
      trialMode: p.mode || 'native',
      offersTrial: p.profile?.offersTrial ?? false,
      code: p.profile!.code,
      name: p.name,
      contact: p.profile!.contact,
      note: p.profile!.note,
      defaultGameType: p.profile?.defaultGameType || '未分類'
    })
    profileVersion.value = p.profile!.version
    editingProfile.value = true
    original.value = JSON.stringify(profileForm)
    error.value = ''
  }
  async function perform(fn: () => void) {
    if (saving.value) return
    saving.value = true
    error.value = ''
    try {
      fn()
      ElMessage.success('資料已更新')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '操作失敗'
      ElMessage.error(error.value)
    } finally {
      saving.value = false
    }
  }
  async function submitProfile() {
    profileErrors.code = /^[A-Za-z0-9_-]{2,32}$/.test(profileForm.code.trim())
      ? ''
      : '請填 2–32 位英數代碼'
    profileErrors.name = profileForm.name.trim() ? '' : '名稱必填'
    if (profileErrors.code || profileErrors.name) return
    await perform(() => {
      const p = saveProvider(
        store.state,
        creating.value ? undefined : selected.value?.id,
        profileForm,
        profileVersion.value,
        actor.value
      )
      clearEditor()
      void patchQuery({ createProvider: undefined, provider: p.id, pane: 'profile' })
    })
  }
  function newLine() {
    editingLineId.value = ''
    lineVersion.value = 0
    lineForm.value = { ...blankLine(), currency: 'TWD' }
    original.value = JSON.stringify(lineForm.value)
    lineSubmitted.value = false
    error.value = ''
  }
  function editLine() {
    if (!inspectedLine.value) return
    const l = inspectedLine.value
    editingLineId.value = l.id
    lineVersion.value = l.config!.version
    const c = l.config!
    lineForm.value = {
      currency: l.currency,
      environment: c.environment,
      accountId: c.accountId,
      currencyId: c.currencyId,
      apiUrl: c.apiUrl,
      wallet: c.wallet,
      scale: c.scale,
      minUnit: c.minUnit
    }
    original.value = JSON.stringify(lineForm.value)
    error.value = ''
  }
  async function cancelLine() {
    if (await discard()) clearEditor()
  }
  async function submitLine() {
    if (!lineForm.value || !selected.value) return
    lineSubmitted.value = true
    await perform(() => {
      const l = saveLine(
        store.state,
        selected.value!.id,
        editingLineId.value || undefined,
        lineForm.value!,
        lineVersion.value,
        actor.value
      )
      clearEditor()
      void patchQuery({ line: l.id, pane: 'lines' })
    })
  }
  const inspectLine = (id: string) => patchQuery({ line: id })
  async function reason(title: string, text: string) {
    try {
      const answer = await ElMessageBox.prompt(text, title, {
        inputPlaceholder: '請填原因，勿輸入密碼或密鑰',
        inputValidator: (s) => !!s?.trim() || '原因必填',
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        type: 'warning'
      })
      return answer.value
    } catch {
      return undefined
    }
  }
  async function setProviderStatus(status: ProviderProfile['status']) {
    const p = selected.value
    if (!p) return
    const version = p.profile!.version
    const count = (store.state.merchants || []).filter((m) =>
      m.lines.some((l) =>
        l.games.some((id) => store.state.games.some((g) => g.id === id && g.providerId === p.id))
      )
    ).length
    const r = await reason(
      `供應商${providerLabels[status]}`,
      `${p.name}：${p.lines.filter((l) => l.available).length} 條啟用線、${count} 個示範授權商戶。僅影響新啟動；既有交易仍需受理。`
    )
    if (r)
      await perform(() => changeProviderStatus(store.state, p.id, status, version, r, actor.value))
  }
  async function resetCredential() {
    const p = selected.value
    const l = inspectedLine.value
    if (!p || !l) return
    const version = l.config!.version
    const r = await reason(
      '重設示範憑證識別',
      `${l.id}：不接收真實 API Key；重設後舊測試失效，停止新啟動。`
    )
    if (r)
      await perform(() => resetDemoCredential(store.state, p.id, l.id, version, r, actor.value))
  }
  async function runTest(failure: boolean) {
    const p = selected.value
    const l = inspectedLine.value
    if (!p || !l) return
    await perform(() => testLine(store.state, p.id, l.id, l.config!.version, failure, actor.value))
  }
  async function setLineStatus(status: 'active' | 'maintenance' | 'disabled') {
    const p = selected.value
    const l = inspectedLine.value
    if (!p || !l) return
    const version = l.config!.version
    const r = await reason(
      `線路${lineLabels[status]}`,
      `${l.id}：僅變更演示啟動狀態，不中止既有 Session、不刪歷史。`
    )
    if (r)
      await perform(() =>
        changeLineStatus(store.state, p.id, l.id, status, version, r, actor.value)
      )
  }
  watch(
    () => route.fullPath,
    () => {
      Object.assign(draft, fromUrl())
      if (creating.value) {
        Object.assign(profileForm, {
          trialMode: 'native',
          offersTrial: false,
          code: '',
          name: '',
          contact: '',
          note: '',
          defaultGameType: '未分類'
        })
        editingProfile.value = true
        original.value = JSON.stringify(profileForm)
      }
    },
    { immediate: true }
  )
</script>

<style scoped>
  .providers-panel {
    min-width: 0;
  }
  .filters {
    display: grid;
    grid-template-columns: repeat(5, minmax(140px, 1fr)) auto;
    gap: 12px;
    margin: 16px 0;
    align-items: flex-end;
  }
  .filters .el-form-item {
    width: auto;
    margin: 0;
  }
  .filters .el-select {
    width: 100%;
  }
  .filter-actions,
  .actions,
  .footer {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .filter-actions .el-button + .el-button,
  .actions .el-button + .el-button {
    margin-left: 0;
  }
  .list-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 18px 0;
  }
  .list-heading span,
  .hint {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
  .pagination {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 18px;
    justify-content: flex-end;
  }
  .actions,
  .notice,
  .line-inspection {
    margin-top: 18px;
  }
  .notice {
    margin-bottom: 18px;
  }
  .line-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 18px;
  }
  .line-form .el-select {
    width: 100%;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .checks {
    display: grid;
    gap: 10px;
    margin-top: 18px;
  }
  .checks > div {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }
  .footer {
    justify-content: flex-end;
  }
  :deep(.el-descriptions__content) {
    overflow-wrap: anywhere;
  }
  h3 {
    font-size: 18px;
  }
  @media (max-width: 1100px) {
    .filters {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .filter-actions {
      grid-column: 1 / -1;
    }
  }
  @media (max-width: 767px) {
    .line-form {
      grid-template-columns: minmax(0, 1fr);
    }
    .filters .el-form-item {
      width: 100%;
    }
    .filters {
      grid-template-columns: minmax(0, 1fr);
    }
    .list-heading {
      flex-wrap: wrap;
    }
  }
</style>
