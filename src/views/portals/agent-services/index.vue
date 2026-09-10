<template>
  <section class="agent-services">
    <AppPageHeader :title="title" description="代理演示入口；僅供本人及授權範圍使用。" />
    <ElAlert
      v-if="!scope.own"
      title="缺少有效代理身分，無法取得資料。"
      type="error"
      :closable="false"
    />
    <template v-else>
      <template v-if="kind === 'settlements'">
        <ElTabs :model-value="tab" @update:model-value="changeTab">
          <ElTabPane label="對帳單" name="statements" />
          <ElTabPane label="我的佣金" name="commissions" />
          <ElTabPane label="付款紀錄" name="payments" />
        </ElTabs>
        <template v-if="tab === 'statements'">
          <IntegratedSettlement
            v-if="user.info.agentId"
            kind="agent"
            :owner-id="user.info.agentId"
            title="本代理結算"
          />
          <ElCard shadow="never">
            <template #header>對帳操作範例 <ElTag type="info">非正式帳單</ElTag></template>
            <ElDescriptions :column="1" border>
              <ElDescriptionsItem label="對象"
                >{{ scope.own.name }}（{{ scope.own.id }}）</ElDescriptionsItem
              >
              <ElDescriptionsItem label="示意帳期">2026-09-01 ～ 2026-09-30</ElDescriptionsItem>
              <ElDescriptionsItem label="金額"
                >未計算；佣金公式與正式來源尚未完成</ElDescriptionsItem
              >
              <ElDescriptionsItem label="操作範圍"
                >查看明細、填寫本地異議草稿；不可改帳或付款</ElDescriptionsItem
              >
            </ElDescriptions>
            <ElButton class="detail-button" type="primary" plain @click="statementOpen = true"
              >查看演示明細</ElButton
            >
          </ElCard>
        </template>
        <template v-else-if="tab === 'commissions'">
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="費率版本依據"
              >依平台時區的下注時間選取；未修改沿用原費率。</ElDescriptionsItem
            >
            <ElDescriptionsItem label="跨期注單"
              >生效日後的下注採新費率；生效日前下注不因稍後派彩而改用新費率。</ElDescriptionsItem
            >
            <ElDescriptionsItem label="尚待定案"
              >佣金公式、多層分配、退款及負數處理、跨期入帳規則。</ElDescriptionsItem
            >
          </ElDescriptions>
          <ElEmpty description="尚無已計算或已確認的佣金紀錄" />
          <ElButton @click="router.push('/agent/terms')">查看商務條件</ElButton>
        </template>
        <template v-else>
          <ElAlert
            title="付款紀錄將僅供查閱，不開放代理執行付款或更改付款狀態。"
            type="info"
            :closable="false"
          />
          <ElEmpty description="目前沒有正式付款紀錄；不以示意金額代替實際付款" />
        </template>
      </template>
      <template v-else-if="kind === 'notifications'">
        <AppFilterForm @submit.prevent="applyNoticeFilter">
          <ElFormItem label="關鍵字"
            ><ElInput
              v-model="draftQuery"
              clearable
              placeholder="搜尋公告標題或內容"
              @keyup.enter="applyNoticeFilter"
          /></ElFormItem>
          <ElFormItem label="閱讀狀態"
            ><ElSelect v-model="draftStatus"
              ><ElOption label="全部" value="all" /><ElOption
                label="未讀"
                value="unread" /><ElOption label="已讀" value="read" /></ElSelect
          ></ElFormItem>
          <div class="filter-actions"
            ><ElButton type="primary" @click="applyNoticeFilter">查詢</ElButton
            ><ElButton @click="resetNotices">重置</ElButton></div
          >
        </AppFilterForm>
        <div class="notice-actions"
          ><span>共 {{ notices.length }} 則 · 未讀 {{ unreadCount }} 則</span
          ><ElButton :disabled="unreadCount === 0" @click="markAll">全部標為已讀</ElButton></div
        >
        <ArtTable :data="notices" row-key="id">
          <ElTableColumn label="狀態" width="100"
            ><template #default="{ row }"
              ><ElTag :type="readIds.includes(row.id) ? 'info' : 'primary'">{{
                readIds.includes(row.id) ? '已讀' : '未讀'
              }}</ElTag></template
            ></ElTableColumn
          >
          <ElTableColumn prop="category" label="分類" min-width="120" />
          <ElTableColumn prop="title" label="標題" min-width="250" />
          <ElTableColumn label="操作" width="100"
            ><template #default="{ row }"
              ><ElButton link type="primary" @click="openNotice(row.id)">閱讀</ElButton></template
            ></ElTableColumn
          >
        </ArtTable>
      </template>
      <template v-else>
        <ElAlert
          title="本人資料與權限來自目前登入身分。正式帳號服務尚未串接，不提供修改密碼、自行擴權或子帳號管理。"
          type="info"
          :closable="false"
        />
        <ElCard shadow="never"
          ><template #header>本人資料</template>
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="登入帳號">{{
              user.info.userName || '未提供'
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="代理名稱">{{ scope.own.name }}</ElDescriptionsItem>
            <ElDescriptionsItem label="綁定代理">{{ scope.own.id }}</ElDescriptionsItem>
            <ElDescriptionsItem label="入口角色">代理</ElDescriptionsItem>
            <ElDescriptionsItem label="平台時區">{{ timezone || '未設定' }}</ElDescriptionsItem>
          </ElDescriptions>
        </ElCard>
        <ElCard shadow="never"
          ><template #header>授權範圍</template>
          <p
            >可查看 {{ scope.agents.length }} 個下級代理、{{
              scope.merchants.length
            }}
            個轄下商戶。此為前端演示限制，正式服務須由後端驗證權限。</p
          >
          <ArtTable :data="agentPermissionRows" row-key="item"
            ><ElTableColumn prop="item" label="功能" min-width="190" /><ElTableColumn
              prop="scope"
              label="資料範圍"
              min-width="180" /><ElTableColumn prop="action" label="允許操作" min-width="270"
          /></ArtTable>
        </ElCard>
        <ElCard shadow="never"
          ><template #header>登入安全</template>
          <p>密碼更新、多因素驗證及登入紀錄需正式認證服務支援，目前未開放。</p>
          <ElButton disabled>修改密碼（未開放）</ElButton
          ><ElButton disabled>多因素驗證（未開放）</ElButton>
        </ElCard>
      </template>
      <ElAlert v-if="storageError" :title="storageError" type="warning" :closable="false" />
    </template>
    <ElDialog
      v-model="statementOpen"
      title="對帳操作範例（非正式帳單）"
      width="min(720px, 94vw)"
      :close-on-click-modal="false"
    >
      <p>範例帳期：2026-09-01 ～ 2026-09-30；僅供 {{ scope.own?.name }} 檢視操作流程。</p>
      <ElAlert
        title="尚無鎖定費率、匯率或正式金額快照；不提供確認出帳及修改帳單。"
        type="warning"
        :closable="false"
      />
      <ElForm label-position="top" class="draft-form"
        ><ElFormItem label="異議草稿（僅本地，未送出）"
          ><ElInput
            v-model="objection"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            placeholder="例如：請協助確認跨期注單所引用的費率版本"
            @input="draftSaved = false" /></ElFormItem
      ></ElForm>
      <p v-if="draftSaved" role="status">草稿已保存於此瀏覽器，未送出。</p>
      <template #footer
        ><ElButton @click="statementOpen = false">關閉</ElButton
        ><ElButton type="primary" @click="saveDraft">保存本地草稿</ElButton></template
      >
    </ElDialog>
    <ElDialog v-model="noticeOpen" title="公告內容（演示）" width="min(640px, 94vw)"
      ><template v-if="selectedNotice"
        ><h2>{{ selectedNotice.title }}</h2
        ><p>{{ selectedNotice.content }}</p></template
      ><template #footer><ElButton @click="noticeOpen = false">關閉</ElButton></template></ElDialog
    >
  </section>
</template>
<script setup lang="ts">
  import IntegratedSettlement from '@/components/business/IntegratedSettlement.vue'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useUserStore } from '@/store/modules/user'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { agentScope } from '@/domain/agent-portal'
  import { agentDemoNotices, agentPermissionRows } from '@/domain/agent-demo'
  const user = useUserStore(),
    partners = useBusinessPartnerStore(),
    locale = usePlatformLocaleStore(),
    route = useRoute(),
    router = useRouter()
  const scope = computed(() =>
    agentScope(partners, {
      roles: user.info.roles || [],
      agentId: user.info.agentId,
      name: user.info.userName || ''
    })
  )
  const timezone = computed(() => locale.defaultTimezone?.id || '')
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
  const tab = computed(() =>
    ['commissions', 'payments'].includes(String(route.query.tab))
      ? String(route.query.tab)
      : 'statements'
  )
  const changeTab = (value: string | number) =>
    router.replace({ query: { ...route.query, tab: String(value) } })
  const statementOpen = ref(false),
    noticeOpen = ref(false),
    selectedId = ref(''),
    objection = ref(''),
    draftSaved = ref(false),
    storageError = ref(''),
    readIds = ref<string[]>([])
  const draftQuery = ref(''),
    draftStatus = ref('all')
  watch(
    () => route.fullPath,
    () => {
      draftQuery.value = String(route.query.q || '')
      draftStatus.value = String(route.query.status || 'all')
      statementOpen.value = false
      noticeOpen.value = false
    },
    { immediate: true }
  )
  const key = computed(() =>
    scope.value.own ? `ggap-agent-demo-services-v1:${scope.value.own.id}` : ''
  )
  watch(
    key,
    () => {
      readIds.value = []
      objection.value = ''
      draftSaved.value = false
      storageError.value = ''
      statementOpen.value = false
      noticeOpen.value = false
      selectedId.value = ''
      if (!key.value) return
      try {
        const saved = JSON.parse(localStorage.getItem(key.value) || '{}')
        readIds.value = Array.isArray(saved.readIds)
          ? saved.readIds.filter((id: unknown) => agentDemoNotices.some((n) => n.id === id))
          : []
        objection.value = typeof saved.objection === 'string' ? saved.objection.slice(0, 1000) : ''
      } catch {
        storageError.value = '無法讀取本地狀態，請確認瀏覽器儲存設定。'
      }
    },
    { immediate: true }
  )
  // Persist the saved draft only; reading an announcement must not silently save an unsaved draft.
  const storedObjection = ref('')
  watch(
    key,
    () => {
      storedObjection.value = objection.value
    },
    { immediate: true }
  )
  const persist = () => {
    if (!key.value) return false
    try {
      localStorage.setItem(
        key.value,
        JSON.stringify({ readIds: readIds.value, objection: storedObjection.value })
      )
      storageError.value = ''
      return true
    } catch {
      storageError.value = '本地儲存失敗，變更僅在本次畫面有效，未送出任何資料。'
      return false
    }
  }
  const saveDraft = () => {
    storedObjection.value = objection.value
    draftSaved.value = persist()
  }
  const selectedNotice = computed(() => agentDemoNotices.find((n) => n.id === selectedId.value))
  const unreadCount = computed(
    () => agentDemoNotices.filter((n) => !readIds.value.includes(n.id)).length
  )
  const notices = computed(() =>
    agentDemoNotices.filter((n) => {
      const status = String(route.query.status || 'all'),
        read = readIds.value.includes(n.id)
      return (
        `${n.title} ${n.content}`.includes(String(route.query.q || '').trim()) &&
        (status === 'all' || (status === 'read' && read) || (status === 'unread' && !read))
      )
    })
  )
  const applyNoticeFilter = () =>
    router.replace({
      query: { q: draftQuery.value.trim() || undefined, status: draftStatus.value }
    })
  const resetNotices = () => {
    draftQuery.value = ''
    draftStatus.value = 'all'
    applyNoticeFilter()
  }
  const openNotice = (id: string) => {
    selectedId.value = id
    noticeOpen.value = true
    if (!readIds.value.includes(id)) {
      readIds.value.push(id)
      persist()
    }
  }
  const markAll = () => {
    readIds.value = agentDemoNotices.map((n) => n.id)
    persist()
  }
</script>
<style scoped>
  .agent-services {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
  }
  .notice-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
  }
  .detail-button,
  .draft-form {
    margin-top: 16px;
  }
</style>
