<template>
  <section class="demo-links">
    <PortalTabs
      v-model="activeTab"
      :tabs="[
        { value: 'links', label: '連結列表' },
        { value: 'statistics', label: '使用統計' }
      ]"
    />
    <ElSelect
      v-if="actor.role !== 'merchant'"
      v-model="merchantFilter"
      clearable
      placeholder="全部可見商戶"
      aria-label="試玩商戶篩選"
      style="max-width: 300px; margin-bottom: 16px"
    >
      <ElOption v-for="m in visibleMerchants" :key="m.id" :label="m.name" :value="m.id" />
    </ElSelect>
    <template v-if="activeTab === 'statistics'">
      <p>僅統計測試連結成功啟動；不計入正式投注或結算。</p>
      <ElTable :data="statistics" empty-text="尚無符合條件的試玩紀錄">
        <ElTableColumn prop="merchant" label="商戶" min-width="140" />
        <ElTableColumn prop="game" label="遊戲" min-width="150" />
        <ElTableColumn prop="currency" label="幣別" width="90" />
        <ElTableColumn prop="starts" label="成功啟動次數" width="150" />
        <ElTableColumn prop="last" label="最近啟動" min-width="180" />
      </ElTable>
    </template>
    <template v-else>
      <div class="toolbar">
        <ElInput
          v-model="search"
          placeholder="搜尋名稱、遊戲或建立人"
          clearable
          style="max-width: 300px"
        />
        <ElButton type="primary" :disabled="actor.role === 'denied'" @click="openCreate()"
          >建立試玩連結</ElButton
        >
      </div>
      <ElTable
        :data="rows"
        border
        scrollbar-always-on
        empty-text="尚無試玩連結，請建立第一條單遊戲連結。"
      >
        <ElTableColumn prop="name" label="名稱" min-width="165" />
        <ElTableColumn label="用途" width="100"
          ><template #default="{ row }">{{
            row.purpose === 'internal' ? '內部試玩' : '商戶試玩'
          }}</template></ElTableColumn
        >
        <ElTableColumn label="商戶" min-width="150"
          ><template #default="{ row }">{{ merchantName(row.merchantId) }}</template></ElTableColumn
        >
        <ElTableColumn label="供應商／遊戲" min-width="200"
          ><template #default="{ row }"
            >{{ providerName(row.providerId) }}<br />{{ gameName(row.gameId) }}</template
          ></ElTableColumn
        >
        <ElTableColumn label="幣別" width="80"
          ><template #default="{ row }">{{ currency(row) }}</template></ElTableColumn
        >
        <ElTableColumn label="狀態" width="110"
          ><template #default="{ row }"
            ><ElTag :type="status(row) === '有效' ? 'success' : 'info'">{{
              status(row)
            }}</ElTag></template
          ></ElTableColumn
        >
        <ElTableColumn label="成功啟動（模擬）" min-width="155"
          ><template #default="{ row }"
            >{{ row.starts }} / {{ row.maxStarts ?? '不限' }}</template
          ></ElTableColumn
        >
        <ElTableColumn label="到期時間" min-width="185"
          ><template #default="{ row }">{{ formatTime(row.expiresAt) }}</template></ElTableColumn
        >
        <ElTableColumn prop="createdBy" label="建立人" min-width="125" />
        <ElTableColumn label="操作" width="290" :fixed="width >= 900 ? 'right' : false"
          ><template #default="{ row }">
            <ElButton link type="primary" @click="selectedId = row.id">查看</ElButton>
            <ElButton link type="primary" :disabled="status(row) !== '有效'" @click="openPlay(row)"
              >開啟試玩</ElButton
            >
            <ElButton link type="primary" @click="copy(row)">複製</ElButton>
            <ElButton link type="primary" @click="copyEmbed(row)">複製嵌入碼</ElButton>
            <ElButton link type="danger" :disabled="row.disabled" @click="disable(row)"
              >停用</ElButton
            >
            <ElButton link :disabled="!!row.replacedById" @click="openRegenerate(row)"
              >重新產生</ElButton
            >
          </template></ElTableColumn
        >
      </ElTable>
      <p class="hint">停用僅禁止新啟動；已開啟遊戲是否能終止，需視供應商能力。</p>
    </template>

    <ElDrawer
      v-model="createOpen"
      :before-close="closeCreate"
      title="建立單遊戲試玩連結"
      size="min(620px, 100%)"
      destroy-on-close
    >
      <ElAlert
        title="選供應商 → 選遊戲 → 選幣別 → 輸入金額 → 建立連結"
        description="下列可用性及授權皆為示範資料；正式版須由後端與供應商確認。"
        type="info"
        :closable="false"
      />
      <ElForm label-position="top" @submit.prevent="create">
        <ElAlert
          v-if="!availableProviders.length"
          title="沒有符合條件的供應商／遊戲。請檢查商戶綁定、同幣別測試線、遊戲授權與錢包相容性；內部未綁商戶仍須符合供應商試玩資格。"
          type="info"
          :closable="false"
        />
        <ElFormItem v-if="false" label="用途" required
          ><ElSelect
            v-model="form.purpose"
            :disabled="actor.role === 'merchant'"
            @change="resetSelection"
            ><ElOption label="內部試玩" value="internal" /><ElOption
              label="商戶試玩"
              value="merchant" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="試玩商戶" required
          ><ElSelect
            v-model="form.merchantId"
            :disabled="actor.role === 'merchant'"
            clearable
            placeholder="請選擇試玩商戶"
            @change="resetSelection"
            ><ElOption
              v-for="merchant in visibleMerchants"
              :key="merchant.id"
              :label="merchant.name"
              :value="merchant.id" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="供應商" required
          ><ElSelect
            v-model="form.providerId"
            placeholder="僅顯示授權且可試玩的供應商"
            @change="resetGame"
            ><ElOption
              v-for="provider in availableProviders"
              :key="provider.id"
              :label="`${provider.name} · ${modeLabel(provider.mode)}`"
              :value="provider.id" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="遊戲" required
          ><ElSelect
            v-model="form.gameId"
            :disabled="!form.providerId"
            placeholder="選擇單一遊戲"
            @change="resetLine"
            ><ElOption
              v-for="game in availableGames"
              :key="game.id"
              :label="game.name"
              :value="game.id" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="可試玩幣別線" required
          ><ElSelect v-model="form.lineId" :disabled="!form.gameId" placeholder="選擇一條可用幣別線"
            ><ElOption
              v-for="line in availableLines"
              :key="line.id"
              :label="`${line.currency} · ${line.id}${lineError(form.gameId, form.providerId, line.id) ? ' · ' + lineError(form.gameId, form.providerId, line.id) : ''}`"
              :disabled="!!lineError(form.gameId, form.providerId, line.id)"
              :value="line.id" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="試玩方式"
          ><ElInput :model-value="modeLabel(provider?.mode)" disabled
        /></ElFormItem>
        <ElFormItem label="語系" required
          ><ElSelect v-model="form.locale" :disabled="!game"
            ><ElOption
              v-for="locale in game?.locales || []"
              :key="locale"
              :label="locale === 'zh-TW' ? '繁體中文' : '英文'"
              :value="locale" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="名稱" required
          ><ElInput
            v-model="form.name"
            maxlength="80"
            show-word-limit
            placeholder="例如：供應商商務展示"
        /></ElFormItem>
        <ElFormItem label="到期時間（本地時區）" required
          ><ElDatePicker
            v-model="form.expiresAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ssZ"
            placeholder="選擇未來時間"
        /></ElFormItem>
        <ElFormItem label="啟動次數上限">
          <ElCheckbox v-model="limitEnabled">設定上限（未勾選為不限）</ElCheckbox>
          <ElInputNumber
            v-if="limitEnabled"
            v-model="form.maxStarts"
            :min="1"
            :precision="0"
            :max="100000"
          />
        </ElFormItem>
        <ElFormItem v-if="provider?.initialCredit" label="試玩金額" required>
          <ElInputNumber
            v-model="form.initialCredit"
            :disabled="!form.lineId"
            :min="0.01"
            :max="1000000"
            :precision="2"
          />
          <span>演示保護上限 1,000,000；不進入正式錢包。</span>
        </ElFormItem>
        <ElAlert
          v-if="error || eligibilityError"
          :title="error || eligibilityError"
          type="error"
          :closable="false"
        />
      </ElForm>
      <template #footer
        ><ElButton @click="closeCreate()">取消</ElButton
        ><ElButton
          type="primary"
          :disabled="!form.providerId || !form.gameId || !form.lineId || !!eligibilityError"
          @click="create"
          >建立連結</ElButton
        ></template
      >
    </ElDrawer>

    <ElDrawer
      :model-value="!!selected"
      title="試玩連結詳情"
      size="min(680px, 100%)"
      @close="selectedId = ''"
    >
      <template v-if="selected">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="名稱">{{ selected.name }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="selected.replacesId" label="前一版本"
            ><ElButton link @click="selectedId = selected.replacesId">{{
              selected.replacesId
            }}</ElButton></ElDescriptionsItem
          >
          <ElDescriptionsItem v-if="selected.replacedById" label="替代版本"
            ><ElButton link @click="selectedId = selected.replacedById">{{
              selected.replacedById
            }}</ElButton></ElDescriptionsItem
          >
          <ElDescriptionsItem label="綁定"
            >{{ providerName(selected.providerId) }} / {{ gameName(selected.gameId) }} /
            {{ selected.lineId }}</ElDescriptionsItem
          >
          <ElDescriptionsItem label="用途／商戶"
            >{{ selected.purpose === 'internal' ? '內部試玩' : '商戶試玩' }} /
            {{ merchantName(selected.merchantId) }}</ElDescriptionsItem
          >
          <ElDescriptionsItem label="方式／語系"
            >{{ modeLabel(selected.mode) }} / {{ selected.locale }}</ElDescriptionsItem
          >
          <ElDescriptionsItem label="狀態／到期"
            >{{ status(selected) }} / {{ formatTime(selected.expiresAt) }}</ElDescriptionsItem
          >
          <ElDescriptionsItem label="成功啟動"
            >{{ selected.starts }} / {{ selected.maxStarts ?? '不限' }}（模擬）</ElDescriptionsItem
          >
          <ElDescriptionsItem v-if="selected.initialCredit !== undefined" label="初始額度">{{
            selected.initialCredit
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="GGAP 本地分享網址"
            ><ElInput :model-value="shareUrl(selected)" readonly /><ElButton
              link
              type="primary"
              @click="copy(selected)"
              >複製連結</ElButton
            ></ElDescriptionsItem
          >
        </ElDescriptions>
        <h3>模擬啟動紀錄</h3>
        <ElTable
          :data="store.state.sessions.filter((item) => item.linkId === selected!.id)"
          empty-text="尚未啟動"
        >
          <ElTableColumn prop="id" label="獨立連線識別碼" min-width="230" /><ElTableColumn
            label="時間"
            min-width="170"
            ><template #default="{ row }">{{ formatTime(row.createdAt) }}</template></ElTableColumn
          >
        </ElTable>
        <p class="hint"
          >試玩事件排除正式投注統計、商戶結算、供應商應付、代理佣金及平台毛利。此演示不寫入上述資料。</p
        >
      </template>
    </ElDrawer>
    <ElDialog v-model="regenerateOpen" title="重新產生試玩連結" width="min(500px, 94vw)">
      <p
        >確認後另建新連結並使舊網址失效。舊連結的原期限、成功次數及啟動紀錄保持不變，可由詳情追溯前後版本。</p
      >
      <ElDatePicker
        v-model="regenerateExpiry"
        type="datetime"
        value-format="YYYY-MM-DDTHH:mm:ssZ"
        placeholder="新到期時間"
      />
      <template #footer
        ><ElButton @click="regenerateOpen = false">取消</ElButton
        ><ElButton type="primary" @click="regenerate">確認重新產生</ElButton></template
      >
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useNow, useWindowSize } from '@vueuse/core'
  import PortalTabs from '@/components/business/PortalTabs.vue'
  import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import {
    createMerchantTrial,
    capabilityError,
    linkStatus,
    manageDemoLink,
    modeLabel,
    visibleLinks,
    type DemoActor,
    type DemoInput,
    type DemoLink
  } from '@/domain/provider-demo'

  const store = useProviderDemoStore()
  const { width } = useWindowSize()
  const user = useUserStore()
  const route = useRoute()
  const router = useRouter()
  const actor = computed<DemoActor>(() => ({
    role: user.info.roles?.some((role) => ['R_SUPER', 'R_ADMIN'].includes(role))
      ? 'admin'
      : user.info.roles?.includes('R_MERCHANT') && !!user.info.merchantId
        ? 'merchant'
        : 'denied',
    name: user.info.userName || '演示使用者',
    merchantId: user.info.merchantId
  }))
  const now = useNow({ interval: 1000 })
  const activeTab = ref('links')
  const merchantFilter = ref('')
  const visibleMerchants = computed(() =>
    (store.state.merchants || []).filter(
      (m) =>
        actor.value.role === 'admin' ||
        (actor.value.role === 'merchant' && m.id === actor.value.merchantId)
    )
  )
  const search = ref('')
  const rows = computed(() =>
    visibleLinks(store.state, actor.value).filter(
      (link) =>
        (!merchantFilter.value || link.merchantId === merchantFilter.value) &&
        `${link.name} ${gameName(link.gameId)} ${link.createdBy}`
          .toLowerCase()
          .includes(search.value.toLowerCase())
    )
  )
  const statistics = computed(() =>
    rows.value.map((link) => {
      const sessions = store.state.sessions.filter((s) => s.linkId === link.id)
      return {
        merchant: merchantName(link.merchantId),
        game: gameName(link.gameId),
        currency: currency(link),
        starts: link.starts,
        last: sessions[0] ? formatTime(sessions[0].createdAt) : '尚未啟動'
      }
    })
  )
  const selectedId = ref('')
  const selected = computed(() =>
    visibleLinks(store.state, actor.value).find((link) => link.id === selectedId.value)
  )
  const createOpen = ref(false)
  const limitEnabled = ref(false)
  const error = ref('')
  const blank = (): DemoInput => ({
    name: '',
    purpose: 'merchant',
    merchantId: actor.value.merchantId,
    providerId: '',
    gameId: '',
    lineId: '',
    locale: 'zh-TW',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    maxStarts: undefined,
    initialCredit: undefined
  })
  const form = reactive<DemoInput>(blank())
  const draftSnapshot = () => JSON.stringify({ form, limitEnabled: limitEnabled.value })
  const createBaseline = ref(draftSnapshot())
  const createDirty = computed(() => createOpen.value && draftSnapshot() !== createBaseline.value)
  let pendingDiscard: Promise<boolean> | undefined
  function confirmDiscard(): Promise<boolean> {
    if (!createDirty.value) return Promise.resolve(true)
    if (!pendingDiscard) {
      pendingDiscard = ElMessageBox.confirm('尚有未儲存的修改，確定放棄？', '離開試玩建立', {
        type: 'warning',
        confirmButtonText: '放棄修改',
        cancelButtonText: '繼續編輯'
      })
        .then(
          () => true,
          () => false
        )
        .finally(() => {
          pendingDiscard = undefined
        })
    }
    return pendingDiscard
  }
  function clearCreate() {
    createOpen.value = false
    Object.assign(form, blank())
    limitEnabled.value = false
    error.value = ''
    createBaseline.value = draftSnapshot()
  }
  async function closeCreate(done?: () => void) {
    if (!(await confirmDiscard())) return
    clearCreate()
    done?.()
  }
  async function leaveCreate() {
    if (!(await confirmDiscard())) return false
    clearCreate()
    return true
  }
  onBeforeRouteLeave(leaveCreate)
  onBeforeRouteUpdate((to) => (to.query.game !== route.query.game ? leaveCreate() : true))
  const provider = computed(() => store.state.providers.find((item) => item.id === form.providerId))
  const game = computed(() => store.state.games.find((item) => item.id === form.gameId))
  const lineError = (gameId: string, providerId: string, lineId: string) => {
    const g = store.state.games.find((g) => g.id === gameId)
    return capabilityError(
      store.state,
      {
        ...form,
        gameId,
        providerId,
        lineId,
        locale: g?.locales[0] || '',
        initialCredit: undefined
      },
      true
    )
  }
  const eligibleGame = (g: { id: string; providerId: string }) =>
    store.state.providers
      .find((p) => p.id === g.providerId)
      ?.lines.some((l) => !lineError(g.id, g.providerId, l.id))
  const availableProviders = computed(() =>
    store.state.providers.filter((p) =>
      store.state.games.some((g) => g.providerId === p.id && eligibleGame(g))
    )
  )
  const availableGames = computed(() =>
    store.state.games.filter((g) => g.providerId === form.providerId && eligibleGame(g))
  )
  const availableLines = computed(() => provider.value?.lines || [])
  const eligibilityError = computed(() =>
    form.gameId && form.lineId ? capabilityError(store.state, form) : ''
  )
  const resetLine = () => {
    form.lineId = ''
    form.locale = game.value?.locales.includes('zh-TW') ? 'zh-TW' : game.value?.locales[0] || ''
  }
  const resetGame = () => {
    form.gameId = ''
    form.initialCredit = undefined
    resetLine()
  }
  const resetSelection = () => {
    form.providerId = ''
    resetGame()
  }
  async function openCreate(gameId?: string) {
    if (!(await confirmDiscard())) return
    limitEnabled.value = false
    Object.assign(form, blank())
    error.value = ''
    createOpen.value = true
    const target = store.state.games.find((item) => item.id === gameId)
    if (target && eligibleGame(target)) {
      form.providerId = target.providerId
      form.gameId = target.id
      resetLine()
    } else if (target) {
      const line = store.state.providers.find((p) => p.id === target.providerId)?.lines[0]
      error.value = line ? lineError(target.id, target.providerId, line.id) : '此遊戲沒有可試玩線路'
    }
    createBaseline.value = draftSnapshot()
  }
  const status = (link: DemoLink) => linkStatus(store.state, link, now.value.getTime())
  const providerName = (id: string) =>
    store.state.providers.find((item) => item.id === id)?.name || id
  const gameName = (id: string) => store.state.games.find((item) => item.id === id)?.name || id
  const merchantName = (id?: string) =>
    store.state.merchants?.find((item) => item.id === id)?.name || '未綁定'
  const currency = (link: DemoLink) =>
    store.state.providers
      .find((item) => item.id === link.providerId)
      ?.lines.find((line) => line.id === link.lineId)?.currency || '—'
  const formatTime = (value: string) => new Date(value).toLocaleString('zh-TW', { hour12: false })
  const shareUrl = (link: DemoLink) =>
    new URL(router.resolve(`/play/${link.token}`).href, window.location.origin).href
  const openPlay = (link: DemoLink) => window.open(shareUrl(link), '_blank', 'noopener,noreferrer')
  async function copy(link: DemoLink) {
    try {
      await navigator.clipboard.writeText(shareUrl(link))
      ElMessage.success('已複製本地演示連結')
    } catch {
      selectedId.value = link.id
      ElMessage.warning('無法自動複製，請在詳情中手動複製網址')
    }
  }
  async function copyEmbed(link: DemoLink) {
    const src = shareUrl(link).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    try {
      await navigator.clipboard.writeText(
        `<iframe src="${src}" title="遊戲試玩" width="100%" height="720" allow="fullscreen" referrerpolicy="no-referrer"></iframe>`
      )
      ElMessage.success('已複製測試連結嵌入碼')
    } catch {
      ElMessage.error('無法存取剪貼簿，請允許複製權限後再試')
    }
  }
  function create() {
    try {
      if (!form.merchantId) throw new Error('請先選擇試玩商戶')
      form.purpose = 'merchant'
      const link = createMerchantTrial(
        store.state,
        {
          ...form,
          merchantId: form.merchantId || undefined,
          maxStarts: limitEnabled.value ? (form.maxStarts ?? 1) : undefined,
          initialCredit: provider.value?.initialCredit
            ? (form.initialCredit ?? undefined)
            : undefined
        },
        actor.value
      )
      clearCreate()
      selectedId.value = link.id
      ElMessage.success('模擬連結已建立，可複製分享')
    } catch (cause) {
      error.value = (cause as Error).message
    }
  }
  async function disable(link: DemoLink) {
    try {
      await ElMessageBox.confirm('停用只會禁止新啟動，不保證中止已開啟遊戲。', '停用連結', {
        type: 'warning'
      })
      manageDemoLink(store.state, link.id, actor.value, 'disable')
      ElMessage.success('已停用連結')
    } catch (cause) {
      if (cause instanceof Error) ElMessage.error(cause.message)
    }
  }
  const regenerateOpen = ref(false)
  const regenerateId = ref('')
  const regenerateExpiry = ref('')
  function openRegenerate(link: DemoLink) {
    regenerateId.value = link.id
    regenerateExpiry.value = new Date(Date.now() + 86400000).toISOString()
    regenerateOpen.value = true
  }
  function regenerate() {
    try {
      const link = manageDemoLink(
        store.state,
        regenerateId.value,
        actor.value,
        'regenerate',
        regenerateExpiry.value
      )
      regenerateOpen.value = false
      selectedId.value = link.id
      ElMessage.success('新連結已產生，舊網址已失效')
    } catch (cause) {
      ElMessage.error((cause as Error).message)
    }
  }
  watch(
    () => route.query.game,
    (id) => {
      if (typeof id === 'string') openCreate(id)
    },
    { immediate: true }
  )
</script>

<style scoped>
  .demo-links {
    display: grid;
    gap: 18px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
  }
  :deep(.el-table__fixed-right .el-table__cell .cell),
  :deep(.el-table__body .el-table__cell:last-child .cell) {
    display: flex;
    flex-wrap: wrap;
    gap: 2px 10px;
  }
  :deep(.el-table__cell:last-child .el-button + .el-button) {
    margin-left: 0;
  }
  .hint {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.8;
  }
  .el-form {
    margin-top: 20px;
  }
  .el-select {
    width: 100%;
  }
  @media (max-width: 600px) {
    .toolbar > * {
      width: 100%;
      max-width: none !important;
    }
  }
</style>
