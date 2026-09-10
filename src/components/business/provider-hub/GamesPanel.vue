<template>
  <section class="games-panel">
    <ElForm class="toolbar" @submit.prevent="search">
      <ElInput
        v-model="draft.q"
        aria-label="遊戲查詢"
        placeholder="名稱、平台或供應商代碼"
        clearable
      />
      <ElSelect
        v-model="draft.providerFilter"
        aria-label="供應商查詢"
        placeholder="全部供應商"
        clearable
        ><ElOption v-for="p in store.state.providers" :key="p.id" :label="p.name" :value="p.id"
      /></ElSelect>
      <ElButton type="primary" native-type="submit">查詢</ElButton
      ><ElButton @click="reset">重置</ElButton>
    </ElForm>
    <div class="toolbar">
      <ElSelect v-model="syncProvider" aria-label="同步供應商" placeholder="選擇同步供應商"
        ><ElOption v-for="p in store.state.providers" :key="p.id" :label="p.name" :value="p.id"
      /></ElSelect>
      <ElSelect v-model="scenario" aria-label="模擬同步結果"
        ><ElOption label="成功情境" value="success" /><ElOption
          label="部分失敗情境"
          value="partial" /><ElOption label="失敗情境" value="failed"
      /></ElSelect>
      <ElButton :disabled="!canManage || !syncProvider" :loading="syncing" @click="sync"
        >模擬同步</ElButton
      >
      <ElButton @click="historyOpen = true">同步紀錄</ElButton>
    </div>
    <ElAlert
      v-if="latest"
      :title="`最近同步：${syncLabels[latest.status]} · 新增 ${latest.added}／更新 ${latest.updated}／不可用 ${latest.unavailable}／失敗 ${latest.failed}`"
      :description="`${providerName(latest.providerId)} · ${formatTime(latest.finishedAt || latest.startedAt)}`"
      :closable="false"
    />
    <ElTable
      :key="`${route.query.sort}-${route.query.order}`"
      :data="result.items"
      border
      :default-sort="{
        prop: String(route.query.sort || 'id'),
        order: route.query.order === 'desc' ? 'descending' : 'ascending'
      }"
      @sort-change="sort"
    >
      <ElTableColumn label="圖片" width="70"
        ><template #default
          ><span class="game-placeholder" aria-label="遊戲圖片尚未提供">遊戲</span></template
        ></ElTableColumn
      >
      <ElTableColumn prop="name" label="展示名稱" min-width="180" sortable="custom"
        ><template #default="{ row }"
          ><ElButton link type="primary" @click="open(row.id)">{{ row.name }}</ElButton></template
        ></ElTableColumn
      >
      <ElTableColumn prop="id" label="平台識別" min-width="150" sortable="custom" />
      <ElTableColumn prop="code" label="供應商遊戲代碼" min-width="185" sortable="custom" />
      <ElTableColumn prop="providerId" label="供應商" min-width="165" sortable="custom"
        ><template #default="{ row }">{{ providerName(row.providerId) }}</template></ElTableColumn
      >
      <ElTableColumn prop="type" label="類型" width="105" />
      <ElTableColumn label="狀態" min-width="150"
        ><template #default="{ row }"
          ><ElTag
            :type="
              gameStatus(row) === 'active'
                ? 'success'
                : gameStatus(row) === 'integrating'
                  ? 'warning'
                  : 'info'
            "
            >{{ statusLabels[gameStatus(row)] }}</ElTag
          ></template
        ></ElTableColumn
      >
      <ElTableColumn label="可用線路（模擬）" min-width="180"
        ><template #default="{ row }">{{
          usableLines(row) || '無可用線路'
        }}</template></ElTableColumn
      >
      <ElTableColumn prop="syncedAt" label="同步時間" min-width="180" sortable="custom"
        ><template #default="{ row }">{{ formatTime(row.syncedAt) }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="90" fixed="right"
        ><template #default="{ row }"
          ><ElButton link @click="open(row.id)">詳情</ElButton></template
        ></ElTableColumn
      >
    </ElTable>
    <div class="pagination"
      ><ElPagination
        :current-page="result.page"
        :page-size="result.size"
        :page-sizes="[10, 20, 50]"
        :total="result.total"
        layout="total, sizes, prev, pager, next"
        @current-change="(page: number) => updateQuery({ page })"
        @size-change="(size: number) => updateQuery({ size, page: 1 })"
    /></div>

    <ElDrawer
      :model-value="!!selected"
      :title="selected ? `${selected.name}｜遊戲詳情` : '遊戲詳情'"
      size="min(860px, 100%)"
      :before-close="close"
    >
      <template v-if="selected">
        <ElTabs :model-value="pane" @tab-change="(value) => updateQuery({ pane: String(value) })">
          <ElTabPane label="基本資料" name="profile" /><ElTabPane
            label="線路可用性"
            name="lines"
          /><ElTabPane label="商戶授權" name="grants" /><ElTabPane label="同步紀錄" name="sync" />
        </ElTabs>
        <template v-if="pane === 'profile'">
          <ElDescriptions title="來源資料" :column="1" border class="source-details">
            <ElDescriptionsItem label="供應商">{{
              providerName(selected.providerId)
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="平台識別">{{ selected.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="供應商遊戲代碼">{{ selected.code }}</ElDescriptionsItem>
            <ElDescriptionsItem label="來源名稱">{{ selected.sourceName }}</ElDescriptionsItem>
            <ElDescriptionsItem label="來源狀態">{{
              selected.sourceAvailable ? '可用' : '不可用'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="支援語系">{{
              selected.locales.join('、')
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="供應商 RTP">{{
              selected.rtp ?? '未提供'
            }}</ElDescriptionsItem>
          </ElDescriptions>
          <h3>平台展示設定</h3>
          <ElForm label-position="top" class="edit-form">
            <ElFormItem label="展示名稱" required
              ><ElInput v-model="edit.name" maxlength="80" :disabled="!canManage"
            /></ElFormItem>
            <ElFormItem label="遊戲類型" required>
              <ElSelect v-model="edit.type" :disabled="!canManage" placeholder="請選擇遊戲類型">
                <ElOption label="沿用供應商預設類型" value="__inherit" />
                <ElOption v-for="type in gameTypes" :key="type" :label="type" :value="type" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="狀態">
              <ElSelect v-model="edit.status" :disabled="!canManage" aria-label="遊戲狀態">
                <ElOption
                  v-for="(label, value) in statusLabels"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="編輯版本／最新版本"
              >{{ editVersion }} / {{ selected.version }}</ElFormItem
            >
          </ElForm>
          <ElAlert v-if="editError" :title="editError" type="error" :closable="false" />
        </template>
        <ElTable v-else-if="pane === 'lines'" :data="lineRows" border>
          <ElTableColumn prop="id" label="線路識別" min-width="170" /><ElTableColumn
            prop="currency"
            label="幣別"
            width="80"
          /><ElTableColumn prop="general" label="一般遊戲可用性" min-width="200" /><ElTableColumn
            prop="trial"
            label="試玩資格"
            min-width="220"
          />
        </ElTable>
        <template v-else-if="pane === 'grants'">
          <ElAlert
            title="沿用商戶層級錢包與既有遊戲／線路授權，不因開通幣別自動授權。此處唯讀；在商戶設定更新後即時同步。"
            type="info"
            :closable="false"
          />
          <ElTable :data="grantsPage.result.value.items" border
            ><ElTableColumn prop="merchant" label="商戶" min-width="140" /><ElTableColumn
              prop="line"
              label="供應商線路"
              min-width="150" /><ElTableColumn
              prop="wallet"
              label="商戶錢包"
              width="110" /><ElTableColumn
              prop="reason"
              label="授權交集結果（模擬）"
              min-width="230"
          /></ElTable>
          <div class="pagination">
            <ElPagination
              :current-page="grantsPage.result.value.page"
              :page-size="grantsPage.result.value.size"
              :page-sizes="[10, 20, 50]"
              :total="grantsPage.result.value.total"
              layout="total, sizes, prev, pager, next"
              @current-change="grantsPage.state.page = $event"
              @size-change="grantsPage.resize"
            />
          </div>
        </template>
        <template v-else
          ><ElTable :data="gameHistoryPage.result.value.items" border
            ><ElTableColumn prop="at" label="時間" min-width="180" /><ElTableColumn
              prop="code"
              label="來源代碼"
              min-width="140" /><ElTableColumn prop="message" label="同步結果" min-width="230"
          /></ElTable>
          <div class="pagination">
            <ElPagination
              :current-page="gameHistoryPage.result.value.page"
              :page-size="gameHistoryPage.result.value.size"
              :page-sizes="[10, 20, 50]"
              :total="gameHistoryPage.result.value.total"
              layout="total, sizes, prev, pager, next"
              @current-change="gameHistoryPage.state.page = $event"
              @size-change="gameHistoryPage.resize"
            />
          </div>
        </template>
      </template>
      <template #footer>
        <ElButton @click="close">關閉</ElButton>
        <template v-if="selected && pane === 'profile'">
          <ElButton @click="reloadEdit">重新載入比對</ElButton>
          <ElButton :disabled="!canManage" type="primary" @click="save">儲存變更</ElButton>
        </template>
      </template>
    </ElDrawer>
    <ElDrawer v-model="historyOpen" title="供應商同步紀錄（模擬）" size="min(900px, 100%)">
      <ElTable :data="syncHistoryPage.result.value.items" border
        ><ElTableColumn label="供應商" min-width="140"
          ><template #default="{ row }">{{ providerName(row.providerId) }}</template></ElTableColumn
        ><ElTableColumn label="結果" width="105"
          ><template #default="{ row }">{{
            syncLabels[row.status as keyof typeof syncLabels]
          }}</template></ElTableColumn
        ><ElTableColumn label="新增／更新／不可用／失敗" min-width="200"
          ><template #default="{ row }"
            >{{ row.added }} / {{ row.updated }} / {{ row.unavailable }} /
            {{ row.failed }}</template
          ></ElTableColumn
        ><ElTableColumn label="開始／結束" min-width="190"
          ><template #default="{ row }"
            >{{ formatTime(row.startedAt) }}<br />{{ formatTime(row.finishedAt) }}</template
          ></ElTableColumn
        ><ElTableColumn type="expand"
          ><template #default="{ row }"
            ><p v-for="(e, i) in row.events" :key="i">{{ e.code }}：{{ e.message }}</p></template
          ></ElTableColumn
        ></ElTable
      >
      <div class="pagination">
        <ElPagination
          :current-page="syncHistoryPage.result.value.page"
          :page-size="syncHistoryPage.result.value.size"
          :page-sizes="[10, 20, 50]"
          :total="syncHistoryPage.result.value.total"
          layout="total, sizes, prev, pager, next"
          @current-change="syncHistoryPage.state.page = $event"
          @size-change="syncHistoryPage.resize"
        />
      </div>
    </ElDrawer>
  </section>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { useUserStore } from '@/store/modules/user'
  import { canManageProviders } from '@/domain/provider-core'
  import { capabilityError, type DemoGame } from '@/domain/provider-demo'
  import { gameAvailabilityError } from '@/domain/game-availability'
  import { queryGames } from '@/domain/game-query'
  import { listPage } from '@/domain/list-query'
  import {
    startGameSync,
    finishGameSync,
    saveGameDisplay,
    syncLabels,
    gameTypes,
    type SyncScenario
  } from '@/domain/game-sync'
  const store = useProviderDemoStore()
  const user = useUserStore()
  const route = useRoute()
  const router = useRouter()
  const actor = computed(() => ({
    roles: user.info.roles || [],
    name: user.info.userName || '演示管理者'
  }))
  const canManage = computed(() => canManageProviders(actor.value))
  const draft = reactive({
    q: '',
    providerFilter: '',
    typeFilter: '',
    currencyFilter: '',
    activeFilter: ''
  })
  watch(
    () => [
      route.query.q,
      route.query.providerFilter,
      route.query.typeFilter,
      route.query.currencyFilter,
      route.query.activeFilter
    ],
    () =>
      Object.assign(draft, {
        q: String(route.query.q || ''),
        providerFilter: String(route.query.providerFilter || ''),
        typeFilter: String(route.query.typeFilter || ''),
        currencyFilter: String(route.query.currencyFilter || ''),
        activeFilter: String(route.query.activeFilter || '')
      }),
    { immediate: true }
  )
  const result = computed(() => queryGames(store.state.games, route.query))
  const updateQuery = (values: Record<string, string | number | undefined>) =>
    router.push({
      query: {
        ...route.query,
        ...Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, v === undefined ? undefined : String(v)])
        )
      }
    })
  const search = () => updateQuery({ ...draft, page: 1 })
  const reset = () => router.push({ path: route.path })
  const sort = ({ prop, order }: { prop: string; order: string | null }) =>
    updateQuery({
      sort: order ? prop : 'id',
      order: order === 'descending' ? 'desc' : 'asc',
      page: 1
    })
  const providerName = (id: string) => store.state.providers.find((p) => p.id === id)?.name || id
  const formatTime = (value?: string) =>
    value ? new Date(value).toLocaleString('zh-TW', { hour12: false }) : '尚未同步'
  const lines = (g: DemoGame) =>
    store.state.providers.find((p) => p.id === g.providerId)?.lines || []
  const trialError = (g: DemoGame, lineId: string) =>
    capabilityError(
      store.state,
      {
        name: '',
        purpose: 'internal',
        providerId: g.providerId,
        gameId: g.id,
        lineId,
        locale: g.locales[0] || '',
        expiresAt: ''
      },
      true
    )
  const usableLines = (g: DemoGame) =>
    lines(g)
      .filter((l) => !gameAvailabilityError(store.state, g, l.id))
      .map((l) => l.currency)
      .join('、')
  const open = (id: string) => updateQuery({ game: id, pane: 'profile' })
  const selected = computed(() => store.state.games.find((g) => g.id === route.query.game))
  const pane = computed(() =>
    ['profile', 'lines', 'grants', 'sync'].includes(String(route.query.pane))
      ? String(route.query.pane)
      : 'profile'
  )
  const statusLabels = { active: '啟用', disabled: '停用', integrating: '串接中' }
  const gameStatus = (g: DemoGame): NonNullable<DemoGame['status']> =>
    g.status ?? (g.active ? 'active' : 'disabled')
  const edit = reactive({
    name: '',
    tags: [] as string[],
    active: false,
    type: '',
    status: 'disabled' as NonNullable<DemoGame['status']>
  })
  const editVersion = ref(0)
  const editError = ref('')
  const baseline = ref('')
  const dirty = computed(() => !!selected.value && JSON.stringify(edit) !== baseline.value)
  function loadEdit() {
    if (!selected.value) return
    Object.assign(edit, {
      name: selected.value.name,
      type: selected.value.typeOverridden ? selected.value.type || '未分類' : '__inherit',
      tags: [...selected.value.tags],
      active: selected.value.active,
      status: gameStatus(selected.value)
    })
    editVersion.value = selected.value.version || 1
    baseline.value = JSON.stringify(edit)
    editError.value = ''
  }
  watch(() => selected.value?.id, loadEdit, { immediate: true })
  async function confirmLeave() {
    if (!dirty.value) return true
    try {
      await ElMessageBox.confirm('尚有未儲存的修改，確定放棄？', '離開遊戲編輯', {
        type: 'warning'
      })
      return true
    } catch {
      return false
    }
  }
  onBeforeRouteLeave(confirmLeave)
  onBeforeRouteUpdate((to) => (to.query.game !== route.query.game ? confirmLeave() : true))
  const close = () => updateQuery({ game: undefined, pane: undefined })
  async function reloadEdit() {
    if (await confirmLeave()) loadEdit()
  }
  function save() {
    try {
      if (!selected.value) return
      saveGameDisplay(store.state, selected.value.id, edit, editVersion.value, actor.value)
      loadEdit()
      ElMessage.success('遊戲資料已儲存')
    } catch (e) {
      editError.value = (e as Error).message
    }
  }
  const lineRows = computed(() =>
    selected.value
      ? lines(selected.value).map((l) => ({
          id: l.id,
          currency: l.currency,
          general: gameAvailabilityError(store.state, selected.value, l.id) || '可用（測試環境）',
          trial: trialError(selected.value!, l.id) || '可試玩（模擬）'
        }))
      : []
  )
  const grantRows = computed(() =>
    selected.value
      ? (store.state.merchants || []).flatMap((m) =>
          lines(selected.value!).map((l) => ({
            merchant: m.name,
            wallet: m.wallet,
            line: `${l.currency} · ${l.id}`,
            reason:
              gameAvailabilityError(store.state, selected.value, l.id, m.id) ||
              '已授權且可用（模擬）'
          }))
        )
      : []
  )
  const gameHistory = computed(() =>
    (store.state.syncRuns || [])
      .filter((r) => r.providerId === selected.value?.providerId)
      .flatMap((r) =>
        r.events
          .filter((e) => e.code === selected.value?.code)
          .map((e) => ({ ...e, at: formatTime(r.finishedAt || r.startedAt) }))
      )
  )
  function detailPage<T>(rows: () => T[]) {
    const state = reactive({ page: 1, size: 10 })
    const result = computed(() => listPage(rows(), state.page, state.size))
    const resize = (size: number) => {
      state.size = size
      state.page = 1
    }
    return { state, result, resize }
  }
  const grantsPage = detailPage(() => grantRows.value)
  const gameHistoryPage = detailPage(() => gameHistory.value)
  const syncHistoryPage = detailPage(() => store.state.syncRuns || [])
  watch(
    () => selected.value?.id,
    () => {
      grantsPage.state.page = 1
      gameHistoryPage.state.page = 1
    }
  )
  const syncProvider = ref(String(route.query.providerFilter || store.state.providers[0]?.id || ''))
  const scenario = ref<SyncScenario>('success')
  const syncing = ref(false)
  const historyOpen = ref(false)
  const latest = computed(() => store.state.syncRuns?.[0])
  async function sync() {
    try {
      const choice = scenario.value
      const id = startGameSync(store.state, syncProvider.value, actor.value)
      syncing.value = true
      await new Promise((resolve) => setTimeout(resolve, 700))
      finishGameSync(store.state, id, choice, actor.value)
      ElMessage.success(`模擬同步：${syncLabels[choice]}`)
    } catch (e) {
      ElMessage.error((e as Error).message)
    } finally {
      syncing.value = false
    }
  }
</script>

<style scoped>
  .games-panel {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .toolbar {
    display: grid;
    grid-template-columns: minmax(240px, 1fr) minmax(240px, 1fr) auto auto;
    gap: 10px;
    margin: 0;
    align-items: center;
  }
  .toolbar .el-input,
  .toolbar .el-select {
    width: 100%;
  }
  .game-placeholder {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 8px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color);
    font-size: 12px;
  }
  .pagination {
    max-width: 100%;
    overflow-x: auto;
    padding: 8px 0;
  }
  .edit-form {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 20px;
  }
  .source-details {
    margin: 16px 0 24px;
    overflow-wrap: anywhere;
  }
  .edit-form .el-select {
    width: 100%;
  }
  @media (max-width: 900px) {
    .toolbar {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .edit-form {
      grid-template-columns: minmax(0, 1fr);
    }
    .toolbar {
      grid-template-columns: minmax(0, 1fr);
    }
    .toolbar .el-input,
    .toolbar .el-select {
      width: 100%;
    }
  }
</style>
