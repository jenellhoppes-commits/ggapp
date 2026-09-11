<template>
  <section class="services">
    <AppPageHeader v-if="kind !== 'integration'" :title="title" />
    <ElEmpty v-if="!own" description="無法取得有效商戶身分" />
    <template v-else>
      <DeveloperCenter v-if="kind === 'integration'" merchant-mode>
        <template #merchant-environments>
          <h3 class="environment-heading">本商戶線路環境</h3>
          <ElTable :data="environments" scrollbar-always-on>
            <ElTableColumn prop="line" label="線路" min-width="160" show-overflow-tooltip />
            <ElTableColumn prop="currency" label="幣別" width="90" />
            <ElTableColumn prop="environment" label="環境" width="90" />
            <ElTableColumn prop="status" label="狀態" width="100" />
            <ElTableColumn
              prop="endpoint"
              label="已配置端點"
              min-width="230"
              show-overflow-tooltip
            />
            <ElTableColumn
              prop="callback"
              label="Callback URL"
              min-width="230"
              show-overflow-tooltip
            />
          </ElTable>
        </template>
      </DeveloperCenter>
      <template v-else-if="kind === 'dashboard'">
        <AppFilterForm @submit.prevent="search">
          <ElFormItem label="資料期間"
            ><ElDatePicker
              v-model="draftDates"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="開始日期"
              end-placeholder="結束日期"
          /></ElFormItem>
          <ElFormItem label="原幣別"
            ><ElSelect v-model="draftCurrency" clearable placeholder="全部原幣"
              ><ElOption v-for="c in currencies" :key="c" :label="c" :value="c" /></ElSelect
          ></ElFormItem>
          <div class="filter-actions"
            ><ElButton type="primary" @click="search">查詢</ElButton
            ><ElButton @click="reset">重置</ElButton></div
          >
        </AppFilterForm>
        <p class="muted"
          >{{ dates ? dates.join(' 至 ') : '全部期間' }} · {{ currency || '全部原幣' }} ·
          依下注時間（Asia/Taipei）；營運摘要套用查詢，線路與待辦顯示目前狀態。</p
        >
        <div class="metrics">
          <ElCard v-for="item in metrics" :key="item.label" shadow="never"
            ><span>{{ item.label }}</span
            ><strong>{{ item.value }}</strong
            ><ElButton link type="primary" @click="router.push(item.path)">查看</ElButton></ElCard
          >
        </div>
        <ElCard shadow="never"
          ><template #header
            ><div class="section-heading"
              ><span>原幣營運摘要</span
              ><ElButton link type="primary" @click="openDashboardReport()">查看報表</ElButton></div
            ></template
          >
          <ElTable
            :data="summary"
            scrollbar-always-on
            empty-text="查詢期間內沒有注單，請調整日期或幣別"
            ><ElTableColumn prop="currency" label="原幣" width="90" /><ElTableColumn
              prop="total"
              label="注單數"
              min-width="100"
              align="right"
            /><ElTableColumn
              prop="count"
              label="已結算筆數"
              min-width="110"
              align="right"
            /><ElTableColumn
              v-for="c in ['bet', 'payout', 'ggr']"
              :key="c"
              :label="{ bet: '投注', payout: '派彩', ggr: 'GGR' }[c]"
              align="right"
              min-width="150"
              ><template #default="{ row }">{{ money(row[c]) }}</template></ElTableColumn
            ><ElTableColumn label="實際 RTP" min-width="110" align="right"
              ><template #default="{ row }">{{
                row.rtp === null ? '—' : row.rtp.toFixed(2) + '%'
              }}</template></ElTableColumn
            ><ElTableColumn label="操作" fixed="right" width="85"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="openDashboardReport(row.currency)"
                  >明細</ElButton
                ></template
              ></ElTableColumn
            ></ElTable
          >
        </ElCard>
        <ElCard shadow="never"
          ><template #header>待辦事項</template
          ><div class="tasks"
            ><ElButton @click="router.push('/merchant/settlements?status=pending')"
              >待確認對帳 <ElTag>{{ metrics[1].value }}</ElTag></ElButton
            ><ElButton @click="router.push('/merchant/notifications?status=unread')"
              >未讀公告 <ElTag>{{ metrics[2].value }}</ElTag></ElButton
            ></div
          ></ElCard
        >
        <ElCard shadow="never"
          ><template #header>最新公告</template
          ><div class="notice-links"
            ><ElButton
              v-for="n in notices"
              :key="n.id"
              link
              type="primary"
              @click="readNotice(n.id)"
              >{{ n.title }}</ElButton
            ></div
          ></ElCard
        >
      </template>
      <MerchantAccounts
        v-else-if="kind === 'account'"
        :merchant-id="own.id"
        :login="user.info.email || ''"
      />
      <template v-else>
        <AppFilterForm @submit.prevent="search">
          <ElFormItem :label="kind === 'account' ? '姓名／帳號' : '關鍵字'"
            ><ElInput v-model="draft" clearable placeholder="搜尋目前列表" @keyup.enter="search"
          /></ElFormItem>
          <ElFormItem v-if="kind === 'notifications'" label="分類"
            ><ElSelect v-model="draftCategory" clearable placeholder="全部分類"
              ><ElOption v-for="c in categories" :key="c" :label="c" :value="c" /></ElSelect
          ></ElFormItem>
          <ElFormItem v-if="kind === 'notifications'" label="閱讀狀態"
            ><ElSelect v-model="draftStatus" clearable placeholder="全部狀態"
              ><ElOption label="未讀" value="未讀" /><ElOption
                label="已讀"
                value="已讀" /></ElSelect
          ></ElFormItem>
          <ElFormItem v-if="kind === 'security'" label="日期範圍"
            ><ElDatePicker
              v-model="draftDates"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="至"
              start-placeholder="開始日期"
              end-placeholder="結束日期"
          /></ElFormItem>
          <div class="filter-actions"
            ><ElButton type="primary" @click="search">查詢</ElButton
            ><ElButton @click="reset">重置</ElButton></div
          >
        </AppFilterForm>
        <ElCard shadow="never"
          ><template #header
            ><div class="section-heading"
              ><span>{{ title }} · {{ filtered.length }} 筆</span
              ><ElButton
                v-if="kind === 'notifications'"
                :disabled="!filtered.some((r) => r.status === '未讀')"
                @click="markAll"
                >查詢結果標為已讀</ElButton
              ></div
            ></template
          >
          <ElTable :data="filtered.slice((page - 1) * 10, page * 10)" :scrollbar-always-on="true">
            <ElTableColumn
              v-for="c in columns"
              :key="c.key"
              :prop="c.key"
              :label="c.label"
              min-width="160"
              show-overflow-tooltip
            />
            <ElTableColumn v-if="kind === 'notifications'" label="操作" fixed="right" width="90"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="readNotice(String(row.id))"
                  >閱讀</ElButton
                ></template
              ></ElTableColumn
            >
            <ElTableColumn v-if="kind === 'security'" label="操作" fixed="right" width="90"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="auditId = row.id">詳細</ElButton></template
              ></ElTableColumn
            > </ElTable
          ><ElPagination
            v-model:current-page="page"
            :page-size="10"
            :total="filtered.length"
            layout="total, prev, pager, next"
          />
        </ElCard>
        <ElCard v-if="kind === 'account'" shadow="never"
          ><template #header>目前角色權限</template>
          <ElTable :data="permissions"
            ><ElTableColumn prop="role" label="角色" width="150" /><ElTableColumn
              prop="business"
              label="業務與報表"
              min-width="240" /><ElTableColumn
              prop="finance"
              label="對帳／結算"
              min-width="240" /><ElTableColumn prop="accounts" label="帳號管理" min-width="220"
          /></ElTable>
        </ElCard>
        <p v-if="kind === 'security'" class="muted"
          >顯示本機演示的帳號變更與公告閱讀紀錄；正式環境需使用伺服器稽核保存。</p
        >
      </template>
      <ElDialog
        :model-value="!!selectedAudit"
        title="操作紀錄詳細"
        width="min(720px, calc(100vw - 32px))"
        append-to-body
        @close="auditId = ''"
      >
        <ElDescriptions v-if="selectedAudit" :column="1" border
          ><ElDescriptionsItem v-for="c in columns" :key="c.key" :label="c.label"
            ><span style="overflow-wrap: anywhere">{{
              selectedAudit[c.key]
            }}</span></ElDescriptionsItem
          ></ElDescriptions
        >
        <template #footer><ElButton @click="auditId = ''">關閉</ElButton></template>
      </ElDialog>
      <ElDialog
        :model-value="!!notice"
        title="公告內容"
        width="min(680px, calc(100vw - 32px))"
        append-to-body
        @close="noticeId = ''"
      >
        <template v-if="notice"
          ><h3>{{ notice.title }}</h3
          ><p>{{ notice.date }} · {{ notice.category }}</p
          ><p class="notice-body">{{ notice.content }}</p></template
        ><template #footer><ElButton @click="noticeId = ''">關閉</ElButton></template>
      </ElDialog>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useLocalStorage } from '@vueuse/core'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import DeveloperCenter from '@/views/game-provider/platform/developers/index.vue'
  import MerchantAccounts from '@/components/business/MerchantAccounts.vue'
  import { loadMerchantAccounts, type MerchantAudit } from '@/domain/merchant-accounts'
  import { platformDate } from '@/domain/report-four-tabs'
  import { merchantDashboardRows, merchantDashboardSummary } from '@/domain/merchant-dashboard'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useTransactionCenterStore } from '@/store/modules/transactionCenter'
  import { useFinanceCenterStore } from '@/store/modules/financeCenter'
  const route = useRoute(),
    router = useRouter(),
    user = useUserStore(),
    partners = useBusinessPartnerStore(),
    transactions = useTransactionCenterStore(),
    finance = useFinanceCenterStore()
  const own = computed(() =>
    user.info.roles?.includes('R_MERCHANT')
      ? partners.merchants.find((m) => m.id === user.info.merchantId)
      : undefined
  )
  const kind = computed(() => route.path.split('/').at(-1) || 'dashboard')
  const title = computed(
    () =>
      (
        ({
          dashboard: '儀錶板',
          integration: '串接中心',
          notifications: '公告通知',
          account: '帳號與權限',
          security: '操作紀錄'
        }) as Record<string, string>
      )[kind.value]
  )
  const environments = computed(
    () =>
      own.value?.lines.flatMap((l) =>
        l.environments.map((e) => ({
          line: l.uid,
          currency: l.currency,
          environment: e.environment === 'Production' ? '正式' : '測試',
          status:
            (
              {
                Active: '啟用',
                Testing: '測試中',
                Disabled: '停用',
                Configuring: '設定中',
                'Not Configured': '未設定'
              } as Record<string, string>
            )[e.status] || e.status,
          endpoint: e.endpoint || '未設定',
          callback: e.callbackUrl || '未設定'
        }))
      ) || []
  )
  const permissions = [
    {
      role: '商戶帳號',
      business: '本商戶資料查詢與報表',
      finance: '查看結算明細與收付結果；不可調整或鎖定',
      accounts: '僅查看目前帳號；子帳號與角色管理尚未接入'
    }
  ]
  const notices = [
    {
      id: 'merchant-scope',
      date: '2026-09-10',
      category: '操作說明',
      title: '商戶資料與查詢範圍',
      content:
        '各中心僅顯示本商戶資料。商務條件與收付模式由平台或上級管理，商戶可查看適用版本及結算結果。'
    },
    {
      id: 'merchant-billing',
      date: '2026-09-09',
      category: '結算說明',
      title: '結算單與交付金額',
      content:
        '已鎖定不等於已收款。結算金額取整後形成應付，捨去尾數不列為欠款；交付結果以平台或有權限代理登錄為準。'
    },
    {
      id: 'merchant-trial',
      date: '2026-09-08',
      category: '遊戲服務',
      title: '試玩連結使用方式',
      content:
        '有開放給本商戶的有效試玩連結時，遊戲中心會顯示試玩分頁。試玩不代表正式串接通過，也不納入正式營運結算。'
    }
  ]
  type Log = { id: string; time: string; operator: string; action: string; target: string }
  const local = useLocalStorage<Record<string, { read: string[]; logs: Log[] }>>(
    'ggap-merchant-notice-history-v1',
    {}
  )
  const scopeKey = computed(() => `${own.value?.id || ''}:${user.info.userId}`)
  const dashboardFilters = useLocalStorage<Record<string,{dates:[string,string]|null;currency:string}>>('ggap-merchant-dashboard-filters-v1',{})
  const accountData = ref<{ history: MerchantAudit[] } | null>(null)
  function refreshAudit() {
    try {
      accountData.value = own.value ? loadMerchantAccounts(localStorage, own.value.id) : null
    } catch {
      accountData.value = null
    }
  }
  onMounted(() => {
    window.addEventListener('storage', refreshAudit)
    window.addEventListener('merchant-accounts-changed', refreshAudit)
  })
  onUnmounted(() => {
    window.removeEventListener('storage', refreshAudit)
    window.removeEventListener('merchant-accounts-changed', refreshAudit)
  })
  const allAudits = computed(() => {
    if (!own.value) return []
    const roles = user.activeRoles(),
      canReadAll = roles.includes('R_MERCHANT_MANAGER') || roles.includes('R_MERCHANT_AUDITOR')
    const noticesLogs = Object.entries(local.value)
      .filter(([key]) =>
        canReadAll ? key.startsWith(own.value!.id + ':') : key === scopeKey.value
      )
      .flatMap(([, value]) =>
        value.logs.map((l) => ({ ...l, before: '未讀', after: '已讀', reason: '閱讀公告' }))
      )
    const accounts = (accountData.value?.history || []).filter(
      (l) => canReadAll || l.operator === user.info.email
    )
    return [...noticesLogs, ...accounts].sort((a, b) => b.time.localeCompare(a.time))
  })
  const history = computed(() =>
    own.value ? local.value[scopeKey.value] || { read: [], logs: [] } : { read: [], logs: [] }
  )
  const noticeId = ref(''),
    notice = computed(() => (own.value ? notices.find((n) => n.id === noticeId.value) : undefined))
  const categories = [...new Set(notices.map((n) => n.category))]
  function readNotice(id: string) {
    if (!own.value || !notices.some((n) => n.id === id)) return
    noticeId.value = id
    if (history.value.read.includes(id)) return
    local.value = {
      ...local.value,
      [scopeKey.value]: {
        read: [...history.value.read, id],
        logs: [
          {
            id: crypto.randomUUID(),
            time: new Date().toISOString(),
            operator: user.info.email || user.info.userName || '',
            action: '閱讀公告',
            target: id
          },
          ...history.value.logs
        ]
      }
    }
  }
  const metrics = computed(() => [
    { label: '商戶線路', value: own.value?.lines.length || 0, path: '/merchant/games?tab=lines' },
    {
      label: '待確認帳單',
      value: finance.merchantReconciliations.filter(
        (r) => r.merchantId === own.value?.id && !['Locked', 'Cancelled'].includes(r.status)
      ).length,
      path: '/merchant/settlements?status=pending'
    },
    {
      label: '未讀公告',
      value: notices.filter((n) => !history.value.read.includes(n.id)).length,
      path: '/merchant/notifications?status=unread'
    }
  ])
  const summary = computed(() =>
    merchantDashboardSummary(
      merchantDashboardRows(transactions.bets, own.value?.id, dates.value, currency.value)
    )
  )
  function openDashboardReport(selectedCurrency = currency.value) {
    router.push({
      path: '/merchant/reports',
      query: {
        currency: selectedCurrency || undefined,
        from: dates.value?.[0],
        to: dates.value?.[1]
      }
    })
  }
  const columns = computed(() =>
    kind.value === 'account'
      ? [
          { key: 'name', label: '姓名' },
          { key: 'account', label: '帳號' },
          { key: 'role', label: '角色' },
          { key: 'scope', label: '資料範圍' },
          { key: 'status', label: '狀態' },
          { key: 'operation', label: '操作' }
        ]
      : kind.value === 'notifications'
        ? [
            { key: 'status', label: '閱讀狀態' },
            { key: 'category', label: '分類' },
            { key: 'title', label: '標題' },
            { key: 'date', label: '發布日期' }
          ]
        : [
            { key: 'time', label: '時間（Asia/Taipei）' },
            { key: 'operator', label: '操作人' },
            { key: 'action', label: '操作' },
            { key: 'target', label: '對象' },
            { key: 'before', label: '變更前' },
            { key: 'after', label: '變更後' },
            { key: 'reason', label: '原因' }
          ]
  )
  const rows = computed<Record<string, string>[]>(() => {
    if (!own.value) return []
    if (kind.value === 'account')
      return [
        {
          id: String(user.info.userId),
          name: user.info.userName || '',
          account: user.info.email || '',
          role: '商戶帳號',
          scope: own.value.name + ' · ' + own.value.code,
          status: '啟用',
          operation: '目前帳號'
        }
      ]
    if (kind.value === 'notifications')
      return notices.map((n) => ({
        ...n,
        status: history.value.read.includes(n.id) ? '已讀' : '未讀'
      }))
    return allAudits.value
      .filter((l) => inDates(l.time))
      .map((l) => ({
        ...l,
        time: new Date(l.time).toLocaleString('sv-SE', { timeZone: 'Asia/Taipei' }),
        target: notices.find((n) => n.id === l.target)?.title || l.target
      }))
  })
  const draft = ref(''),
    q = ref(''),
    page = ref(1)
  const draftCategory = ref(''),
    category = ref(''),
    draftStatus = ref(''),
    status = ref('')
  const draftCurrency = ref(''),
    currency = ref(''),
    draftDates = ref<[string, string] | null>(null),
    dates = ref<[string, string] | null>(null)
  const currencies = computed(() =>
    [
      ...new Set(
        transactions.bets.filter((b) => b.merchantId === own.value?.id).map((b) => b.currency)
      )
    ].sort()
  )
  function inDates(time: string) {
    if (!dates.value) return true
    try {
      const day = platformDate(time, 'Asia/Taipei')
      return day >= dates.value[0] && day <= dates.value[1]
    } catch {
      return false
    }
  }
  const filtered = computed(() =>
    rows.value.filter(
      (r) =>
        Object.values(r).join(' ').toLowerCase().includes(q.value.toLowerCase()) &&
        (!category.value || r.category === category.value) &&
        (!status.value || r.status === status.value)
    )
  )
  const search = () => {
    q.value = draft.value.trim()
    category.value = draftCategory.value
    status.value = draftStatus.value
    currency.value = draftCurrency.value
    dates.value = draftDates.value ? [...draftDates.value] : null
    if(kind.value==='dashboard')dashboardFilters.value={...dashboardFilters.value,[scopeKey.value]:{dates:dates.value,currency:currency.value}}
    page.value = 1
  }
  const auditId = ref(''),
    selectedAudit = computed(() =>
      kind.value === 'security' ? rows.value.find((r) => r.id === auditId.value) : undefined
    )
  const reset = () => {
    draft.value = ''
    draftCategory.value = ''
    draftStatus.value = ''
    draftCurrency.value = ''
    draftDates.value = null
    noticeId.value = ''
    search()
  }
  function markAll() {
    for (const n of [...filtered.value]) readNotice(n.id)
    noticeId.value = ''
  }
  watch(
    () => [route.path, route.query.status, scopeKey.value],
    () => {
      if(kind.value==='dashboard'){
        const saved=dashboardFilters.value[scopeKey.value]
        draftDates.value=saved?.dates || null
        draftCurrency.value=saved?.currency || ''
        noticeId.value=''
        search()
      }else reset()
      auditId.value = ''
      refreshAudit()
      if (kind.value === 'notifications' && route.query.status === 'unread') {
        draftStatus.value = '未讀'
        search()
      }
    },
    { immediate: true }
  )
  watch(
    () => filtered.value.length,
    () => {
      page.value = Math.min(page.value, Math.max(1, Math.ceil(filtered.value.length / 10)))
    }
  )
  const money = (n: number) =>
    Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '—'
</script>
<style scoped>
  .services {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: 16px;
    min-width: 0;
  }
  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .environment-heading {
    font-size: 16px;
    margin: 24px 0 12px;
  }
  .tasks {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .tasks .el-tag {
    margin-left: 12px;
  }
  .notice-links {
    display: grid;
    justify-items: start;
    gap: 16px;
  }
  .notice-links .el-button {
    margin-left: 0;
  }
  .muted {
    color: var(--art-gray-500);
    margin: 0;
    font-size: 13px;
  }
  .metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .metrics strong {
    display: block;
    font-size: 28px;
    margin: 16px 0;
  }
  .actions {
    display: flex;
    justify-content: flex-end;
    grid-column: 1/-1;
    gap: 8px;
  }
  .actions .el-button {
    margin-left: 0;
  }
  .el-pagination {
    justify-content: flex-end;
    margin-top: 16px;
  }
  .notice-body {
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  @media (width<600px) {
    .metrics {
      grid-template-columns: 1fr;
    }
  }
</style>
