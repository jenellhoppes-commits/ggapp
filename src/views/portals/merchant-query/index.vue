<template>
  <section class="merchant-query">
    <AppPageHeader :title="title" description="僅查詢登入商戶自身資料；不提供修改或匯出。" />
    <ElAlert
      title="本地演示資料，非正式交易或即時錢包餘額。此批資料顯示時間來源為 Asia/Taipei。"
      type="warning"
      :closable="false"
    />
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
        <div class="filter-actions"
          ><ElButton type="primary" @click="search">查詢</ElButton
          ><ElButton @click="reset">重置</ElButton></div
        >
      </AppFilterForm>
      <p>符合條件 {{ filtered.length }} 筆；金額逐筆以原幣顯示，不混幣加總。</p>
      <ArtTable :data="paged" row-key="id">
        <ElTableColumn
          prop="id"
          :label="kind === 'members' ? '會員 ID' : '紀錄 ID'"
          min-width="160"
        />
        <ElTableColumn
          prop="memberId"
          :label="kind === 'members' ? '商戶會員識別' : '會員 ID'"
          min-width="150"
        />
        <ElTableColumn
          prop="description"
          :label="kind === 'bets' ? '遊戲' : kind === 'transactions' ? '事件' : '錢包模式'"
          min-width="140"
        />
        <ElTableColumn prop="lineUid" label="線路" min-width="130" />
        <ElTableColumn prop="relatedId" label="關聯識別" min-width="160" />
        <ElTableColumn label="狀態" min-width="120"
          ><template #default="{ row }">{{ statusText(row.status) }}</template></ElTableColumn
        >
        <ElTableColumn
          :label="kind === 'members' ? '餘額快照' : kind === 'bets' ? '投注金額' : '事件金額'"
          min-width="160"
          ><template #default="{ row }">{{
            money(row.amount, row.currency)
          }}</template></ElTableColumn
        >
        <ElTableColumn
          prop="time"
          :label="kind === 'members' ? '快照時間' : kind === 'bets' ? '下注時間' : '事件時間'"
          min-width="170"
        />
      </ArtTable>
      <ElPagination
        v-model:current-page="page"
        :page-size="10"
        :total="filtered.length"
        layout="prev, pager, next"
      />
    </template>
  </section>
</template>
<script setup lang="ts">
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
    route.name === 'MerchantPortalBets'
      ? 'bets'
      : route.name === 'MerchantPortalTransactions'
        ? 'transactions'
        : 'members'
  )
  const title = computed(
    () => ({ bets: '注單查詢', transactions: '交易流水', members: '會員與錢包' })[kind.value]
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
    page = ref(1)
  const currencies = computed(() => [...new Set(rows.value.map((r) => r.currency))].sort())
  const filtered = computed(() =>
    rows.value.filter(
      (r) =>
        (!route.query.currency || r.currency === route.query.currency) &&
        [r.id, r.memberId, r.relatedId, r.description]
          .join(' ')
          .toLowerCase()
          .includes(String(route.query.q || '').toLowerCase())
    )
  )
  const paged = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
  const search = () =>
    router.replace({
      query: { q: draft.value.trim() || undefined, currency: currency.value || undefined }
    })
  const reset = () => {
    draft.value = ''
    currency.value = ''
    search()
  }
  watch(
    () => route.fullPath,
    () => {
      draft.value = String(route.query.q || '')
      currency.value = String(route.query.currency || '')
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
  .merchant-query {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
  }
  .filter-actions {
    display: flex;
    gap: 8px;
  }
  .filter-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
</style>
