<template>
  <section class="merchant-query">
    <AppPageHeader :title="title" />
    <MerchantCenterNav />
    <ElAlert
      v-if="!authorized"
      title="缺少有效商戶身分，無法查詢。"
      type="error"
      :closable="false"
    />
    <template v-else>
      <AppFilterForm @submit.prevent="search">
        <ElFormItem label="關鍵字"
          ><ElInput
            v-model="draft"
            clearable
            placeholder="識別碼、會員、遊戲或事件"
            @keyup.enter="search"
        /></ElFormItem>
        <ElFormItem label="幣別"
          ><ElSelect v-model="currency" clearable placeholder="全部"
            ><ElOption v-for="c in currencies" :key="c" :label="c" :value="c" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="狀態">
          <ElSelect v-model="status" clearable placeholder="全部狀態">
            <ElOption v-for="s in statuses" :key="s" :label="statusText(s)" :value="s" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="線路">
          <ElSelect v-model="line" clearable placeholder="全部線路">
            <ElOption v-for="l in lines" :key="l" :label="l" :value="l" />
          </ElSelect>
        </ElFormItem>
        <div class="filter-actions"
          ><ElButton type="primary" @click="search">查詢</ElButton
          ><ElButton @click="reset">重置</ElButton></div
        >
      </AppFilterForm>
      <div class="summary">
        <ElCard shadow="never"
          >{{ kind === 'members' ? '會員紀錄' : '交易紀錄'
          }}<strong>{{ filtered.length }}</strong></ElCard
        >
        <ElCard shadow="never"
          >交易幣別<strong>{{ new Set(filtered.map((r) => r.currency)).size }}</strong></ElCard
        >
        <ElCard shadow="never"
          >線路數<strong>{{ new Set(filtered.map((r) => r.lineUid)).size }}</strong></ElCard
        >
      </div>
      <ElTable :data="paged" row-key="id" :scrollbar-always-on="true">
        <ElTableColumn
          prop="id"
          :label="kind === 'members' ? '會員 ID' : '紀錄 ID'"
          min-width="160"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="memberId"
          :label="kind === 'members' ? '商戶會員識別' : '會員 ID'"
          min-width="150"
          show-overflow-tooltip
        />
        <ElTableColumn
          prop="description"
          :label="kind === 'bets' ? '遊戲' : kind === 'transactions' ? '事件' : '錢包模式'"
          min-width="140"
        />
        <ElTableColumn prop="lineUid" label="線路" min-width="180" show-overflow-tooltip />
        <ElTableColumn
          v-if="kind !== 'members'"
          prop="relatedId"
          label="關聯識別"
          min-width="180"
          show-overflow-tooltip
        />
        <ElTableColumn label="狀態" min-width="120"
          ><template #default="{ row }">{{ statusText(row.status) }}</template></ElTableColumn
        >
        <ElTableColumn
          :label="kind === 'members' ? '餘額快照' : kind === 'bets' ? '投注金額' : '事件金額'"
          min-width="160"
          align="right"
          ><template #default="{ row }">{{
            money(row.amount, row.currency)
          }}</template></ElTableColumn
        >
        <ElTableColumn
          prop="time"
          :label="kind === 'members' ? '快照時間' : kind === 'bets' ? '下注時間' : '事件時間'"
          min-width="170"
        />
        <ElTableColumn label="操作" fixed="right" width="90">
          <template #default="{ row }"
            ><ElButton link type="primary" @click="selectedId = row.id">明細</ElButton></template
          >
        </ElTableColumn>
      </ElTable>
      <ElPagination
        v-model:current-page="page"
        :page-size="10"
        :total="filtered.length"
        layout="total, prev, pager, next"
      />
      <ElDialog
        :model-value="!!selected"
        :title="kind === 'members' ? '會員與錢包明細' : '交易明細'"
        width="min(760px, calc(100vw - 32px))"
        @close="selectedId = ''"
      >
        <ElDescriptions v-if="selected" :column="1" border>
          <ElDescriptionsItem label="識別碼">{{ selected.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="會員識別">{{ selected.memberId }}</ElDescriptionsItem>
          <ElDescriptionsItem label="線路">{{ selected.lineUid }}</ElDescriptionsItem>
          <ElDescriptionsItem label="遊戲／事件／錢包模式">{{
            selected.description
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="狀態">{{ statusText(selected.status) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="金額（原幣）">{{
            money(selected.amount, selected.currency)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="資料時間">{{ selected.time }}</ElDescriptionsItem>
          <ElDescriptionsItem v-if="selected.relatedId" label="關聯識別">{{
            selected.relatedId
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <template #footer><ElButton @click="selectedId = ''">關閉</ElButton></template>
      </ElDialog>
    </template>
  </section>
</template>
<script setup lang="ts">
  import MerchantCenterNav from '@/components/business/MerchantCenterNav.vue'
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useTransactionCenterStore } from '@/store/modules/transactionCenter'
  import { useMemberCenterStore } from '@/store/modules/memberCenter'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { merchantQueryRows, type MerchantQueryKind } from '@/domain/merchant-portal'
  import { formatFinancialAmount } from '@/utils/finance/format-money'
  const route = useRoute(),
    router = useRouter(),
    user = useUserStore(),
    partners = useBusinessPartnerStore(),
    transactions = useTransactionCenterStore(),
    members = useMemberCenterStore(),
    settings = useFinanceSettingsStore()
  const kind = computed<MerchantQueryKind>(() =>
    route.name === 'MerchantPortalMembers'
      ? 'members'
      : route.query.tab === 'transactions' || route.name === 'MerchantPortalTransactions'
        ? 'transactions'
        : 'bets'
  )
  const title = computed(
    () => ({ bets: '交易中心', transactions: '交易中心', members: '會員中心' })[kind.value]
  )
  const actor = computed(() => ({ roles: user.info.roles || [], merchantId: user.info.merchantId }))
  const authorized = computed(
    () =>
      actor.value.roles.includes('R_MERCHANT') &&
      partners.merchants.some((m) => m.id === actor.value.merchantId)
  )
  const rows = computed(() =>
    merchantQueryRows(
      {
        merchants: partners.merchants,
        bets: transactions.bets,
        transactions: transactions.transactions,
        members: members.members
      },
      actor.value,
      kind.value
    )
  )
  const draft = ref(String(route.query.q || '')),
    currency = ref(String(route.query.currency || '')),
    status = ref(String(route.query.status || '')),
    line = ref(String(route.query.line || '')),
    page = ref(1)
  const selectedId = ref('')
  const selected = computed(() => rows.value.find((r) => r.id === selectedId.value))
  const lines = computed(() => [...new Set(rows.value.map((r) => r.lineUid))].sort())
  const statuses = computed(() => [...new Set(rows.value.map((r) => r.status))].sort())
  const currencies = computed(() => [...new Set(rows.value.map((r) => r.currency))].sort())
  const filtered = computed(() =>
    rows.value.filter(
      (r) =>
        (!route.query.currency || r.currency === route.query.currency) &&
        (!route.query.status || r.status === route.query.status) &&
        (!route.query.line || r.lineUid === route.query.line) &&
        [r.id, r.memberId, r.relatedId, r.description]
          .join(' ')
          .toLowerCase()
          .includes(String(route.query.q || '').toLowerCase())
    )
  )
  const paged = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
  const search = () =>
    router.replace({
      query: {
        tab: route.query.tab,
        q: draft.value.trim() || undefined,
        currency: currency.value || undefined,
        status: status.value || undefined,
        line: line.value || undefined
      }
    })
  const reset = () => {
    draft.value = ''
    currency.value = ''
    status.value = ''
    line.value = ''
    search()
  }
  watch(
    () => route.fullPath,
    () => {
      draft.value = String(route.query.q || '')
      currency.value = String(route.query.currency || '')
      status.value = String(route.query.status || '')
      line.value = String(route.query.line || '')
      selectedId.value = ''
      page.value = 1
    }
  )
  watch(
    () => filtered.value.length,
    () => {
      page.value = 1
    }
  )
  const money = (amount: number, code: string) => {
    const precision = settings.currencies.find((c) => c.code === code)?.decimalPlaces
    return precision === undefined
      ? `${code}：未設定顯示精度`
      : formatFinancialAmount(amount, code, precision)
  }
  const statusText = (status: string) =>
    (
      ({
        'In Progress': '進行中',
        Settled: '已結算',
        Cancelled: '已取消',
        Refunded: '已退款',
        Exception: '異常',
        Processing: '處理中',
        Success: '成功',
        Failed: '失敗',
        'Rolled Back': '已回滾',
        Active: '啟用',
        Inactive: '停用',
        Blocked: '封鎖'
      }) as Record<string, string>
    )[status] || status
</script>
<style scoped>
  .summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .summary strong {
    display: block;
    margin-top: 12px;
    font-size: 26px;
  }
  .el-pagination {
    justify-content: flex-end;
  }
  @media (width < 600px) {
    .summary {
      grid-template-columns: 1fr;
    }
  }
  .merchant-query {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
    align-content: start;
  }
  :deep(.el-descriptions__content) {
    overflow-wrap: anywhere;
  }
  .filter-actions {
    display: flex;
    gap: 8px;
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
  .filter-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
</style>
