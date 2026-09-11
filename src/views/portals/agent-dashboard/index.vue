<template>
  <section class="agent-dashboard">
    <AppPageHeader title="代理儀表板"
      ><template #actions
        ><ElTag v-if="scope.own">{{ scope.own.code }}／{{ scope.own.level }}</ElTag></template
      ></AppPageHeader
    >
    <ElEmpty v-if="!scope.own" description="目前無可用的代理資料" />
    <template v-else>
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
      <div class="cards"
        ><ElCard v-for="card in cards" :key="card.label" shadow="never"
          ><div class="card-heading"
            ><span>{{ card.label }}</span
            ><ElButton link type="primary" @click="router.push(card.path)">查看</ElButton></div
          ><strong>{{ card.value }}</strong
          ><span class="card-note">{{ card.note }}</span></ElCard
        ></div
      >
      <ElCard shadow="never"
        ><template #header>待辦事項</template
        ><div class="tasks">
          <ElButton @click="router.push('/agent/settlements?tab=own')"
            ><span>本代理待確認對帳</span><ElTag>{{ ownPending }}</ElTag></ElButton
          >
          <ElButton
            v-if="permitsAgent(user.info.roles || [], 'delivery')"
            @click="router.push('/agent/settlements?tab=merchants')"
            ><span>可核帳商戶單</span><ElTag>{{ actionable }}</ElTag></ElButton
          >
          <ElButton @click="router.push('/agent/notifications')"
            ><span>未讀公告</span><ElTag>{{ unread }}</ElTag></ElButton
          >
        </div></ElCard
      >
      <ElCard shadow="never"
        ><template #header
          ><div class="section-heading"
            ><span>原幣營運彙總</span
            ><ElButton link type="primary" @click="openReport()">查看報表</ElButton></div
          ></template
        >
        <ElTable :data="grouped" row-key="key" scrollbar-always-on>
          <ElTableColumn prop="currency" label="幣別" width="90" />
          <ElTableColumn prop="count" label="注單筆數" min-width="100" align="right" />
          <ElTableColumn prop="settled" label="已結算筆數" min-width="115" align="right" />
          <ElTableColumn label="已結算投注" min-width="160" align="right"
            ><template #default="{ row }">{{ money(row.bet) }}</template></ElTableColumn
          >
          <ElTableColumn label="已結算派彩" min-width="160" align="right"
            ><template #default="{ row }">{{ money(row.payout) }}</template></ElTableColumn
          >
          <ElTableColumn label="GGR" min-width="145" align="right"
            ><template #default="{ row }">{{
              money(row.bet - row.payout)
            }}</template></ElTableColumn
          >
          <ElTableColumn prop="rounds" label="局數" min-width="90" align="right" />
          <ElTableColumn label="操作" width="85"
            ><template #default="{ row }"
              ><ElButton link type="primary" @click="openReport(row.currency)"
                >明細</ElButton
              ></template
            ></ElTableColumn
          >
        </ElTable>
      </ElCard>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useUserStore } from '@/store/modules/user'
  import { useTransactionCenterStore } from '@/store/modules/transactionCenter'
  import { useFinanceCenterStore } from '@/store/modules/financeCenter'
  import { useCollectionModeStore } from '@/store/modules/collectionMode'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { agentScope } from '@/domain/agent-portal'
  import { agentReportRows, groupAgentReports, agentDemoNotices } from '@/domain/agent-demo'
  import { platformDate } from '@/domain/report-four-tabs'
  import { permitsAgent } from '@/domain/agent-access'
  import { mayDeliver } from '@/domain/collection-mode'
  const partners = useBusinessPartnerStore(),
    user = useUserStore(),
    transactions = useTransactionCenterStore(),
    finance = useFinanceCenterStore(),
    modes = useCollectionModeStore(),
    locale = usePlatformLocaleStore(),
    router = useRouter()
  const actor = computed(() => ({
    roles: user.info.roles || [],
    agentId: user.info.agentId,
    name: user.info.userName || ''
  }))
  const scope = computed(() => agentScope(partners, actor.value))
  const timezone = computed(() => locale.defaultTimezone?.id || 'Asia/Taipei')
  const today = platformDate(new Date(), timezone.value)
  const initialDates = (): [string, string] => [today.slice(0, 7) + '-01', today]
  const draftDates = ref<[string, string] | null>(initialDates()),
    draftCurrency = ref(''),
    dates = ref<[string, string] | null>(initialDates()),
    currency = ref('')
  function search() {
    dates.value = draftDates.value ? [...draftDates.value] : null
    currency.value = draftCurrency.value
  }
  function reset() {
    draftDates.value = initialDates()
    draftCurrency.value = ''
    search()
  }
  const bets = computed(() => agentReportRows(partners, actor.value, transactions.bets))
  const currencies = computed(() => [...new Set(bets.value.map((r) => r.currency))].sort())
  const filtered = computed(() =>
    bets.value.filter((r) => {
      if (currency.value && r.currency !== currency.value) return false
      if (!r.betAt || !/(Z|[+-]\d{2}:\d{2})$/.test(r.betAt)) return false
      try {
        const day = platformDate(r.betAt, timezone.value)
        return !dates.value || (day >= dates.value[0] && day <= dates.value[1])
      } catch {
        return false
      }
    })
  )
  const grouped = computed(() => groupAgentReports(filtered.value, 'currencies'))
  const money = (n: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
  function openReport(c = currency.value) {
    router.push({
      path: '/agent/reports',
      query: { from: dates.value?.[0], to: dates.value?.[1], currency: c || undefined }
    })
  }
  const cards = computed(() => [
    {
      label: '直屬下級代理',
      value: scope.value.agents.filter((a) => a.parentAgentId === scope.value.own?.id).length,
      note: '直接合作關係',
      path: '/agent/relations?relation=direct'
    },
    {
      label: '全部下級代理',
      value: scope.value.agents.length,
      note: '授權樹內去重',
      path: '/agent/relations'
    },
    {
      label: '直屬商戶',
      value: scope.value.merchants.filter((m) => m.agentId === scope.value.own?.id).length,
      note: '本代理直接所屬',
      path: '/agent/merchants?relation=direct'
    },
    {
      label: '轄下商戶',
      value: scope.value.merchants.length,
      note: '含直屬與間接商戶',
      path: '/agent/merchants'
    }
  ])
  const ownPending = computed(
    () =>
      finance.agentReconciliations.filter(
        (r) => r.agentId === scope.value.own?.id && !['Locked', 'Cancelled'].includes(r.status)
      ).length
  )
  const actionable = computed(
    () =>
      finance.merchantReconciliations.filter((r) => {
        const merchant = scope.value.merchants.find((m) => m.id === r.merchantId)
        return (
          merchant &&
          !['Locked', 'Cancelled'].includes(r.status) &&
          mayDeliver(
            user.info.roles || [],
            scope.value.own?.id,
            'merchant',
            merchant.agentId,
            modes.at(merchant.id, r.periodStart.slice(0, 10), merchant.collectionMode)
          )
        )
      }).length
  )
  const unread = computed(() => {
    try {
      const ids = JSON.parse(
        localStorage.getItem(
          `ggap-agent-notice-reads-v2:${scope.value.own?.id || ''}:${user.info.userId || ''}`
        ) || '[]'
      )
      return agentDemoNotices.filter((n) => !Array.isArray(ids) || !ids.includes(n.id)).length
    } catch {
      return agentDemoNotices.length
    }
  })
</script>
<style scoped>
  .agent-dashboard {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
    align-content: start;
    align-items: start;
    grid-auto-rows: max-content;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    align-items: start;
  }
  .cards strong {
    display: block;
    font-size: 28px;
    line-height: 1.3;
    margin: 8px 0;
    font-variant-numeric: tabular-nums;
  }
  .card-heading,
  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: center;
  }
  .card-note {
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
  .tasks {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .tasks .el-button {
    width: 100%;
    height: 42px;
    margin: 0;
  }
  .tasks :deep(.el-button > span) {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  @media (max-width: 1100px) {
    .cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .tasks {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 560px) {
    .cards {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
