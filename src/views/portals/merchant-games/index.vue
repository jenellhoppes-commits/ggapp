<template>
  <section class="center">
    <AppPageHeader title="遊戲中心" />
    <MerchantCenterNav />
    <ElEmpty v-if="!merchant" description="無法取得有效商戶資料" />
    <DemoLinks v-else-if="isDemo && demoAllowed" />
    <template v-else>
      <AppFilterForm @submit.prevent="search">
        <ElFormItem label="關鍵字">
          <ElInput
            v-model="draft"
            placeholder="搜尋名稱、代碼或線路"
            clearable
            @keyup.enter="search"
          />
        </ElFormItem>
        <div class="filter-actions"
          ><ElButton type="primary" @click="search">查詢</ElButton
          ><ElButton @click="reset">重置</ElButton></div
        >
      </AppFilterForm>
      <ElCard shadow="never">
        <template #header
          >{{ isLines ? '商戶線路' : '條件授權遊戲' }} · {{ filtered.length }} 筆</template
        >
        <ElTable
          :data="paged"
          row-key="id"
          :scrollbar-always-on="true"
          :empty-text="
            draft.trim()
              ? '沒有符合查詢的資料，請調整關鍵字'
              : isLines
                ? '尚未配置商戶線路'
                : '目前沒有符合有效商務條件的授權遊戲'
          "
        >
          <ElTableColumn
            prop="name"
            :label="isLines ? '線路代碼' : '遊戲名稱'"
            min-width="190"
            show-overflow-tooltip
          />
          <ElTableColumn
            prop="code"
            :label="isLines ? '錢包模式' : '遊戲代碼'"
            min-width="160"
            show-overflow-tooltip
          />
          <ElTableColumn v-if="!isLines" prop="provider" label="供應商" min-width="150" />
          <ElTableColumn v-if="!isLines" prop="type" label="類型" width="110" />
          <ElTableColumn prop="currencies" label="交易幣別" min-width="140" />
          <ElTableColumn prop="status" label="狀態" min-width="130" />
        </ElTable>
        <ElPagination
          v-model:current-page="page"
          :page-size="10"
          :total="filtered.length"
          layout="total, prev, pager, next"
        />
        <ElButton
          v-if="!isLines && !rows.length"
          link
          type="primary"
          @click="router.push('/merchant/profile?tab=conditions')"
          >查看商務條件與版本</ElButton
        >
      </ElCard>
    </template>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import MerchantCenterNav from '@/components/business/MerchantCenterNav.vue'
  import DemoLinks from '@/components/business/provider-hub/DemoLinks.vue'
  import { useMerchantDemoAccess } from '@/composables/useMerchantDemoAccess'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { merchantConditions } from '@/domain/merchant-profile'
  import { commercialGameType } from '@/domain/game-types'
  const route = useRoute(),
    router = useRouter(),
    user = useUserStore(),
    partners = useBusinessPartnerStore(),
    providers = useProviderDemoStore(),
    workspace = usePartnerWorkspaceStore()
  const merchant = computed(() =>
    user.info.roles?.includes('R_MERCHANT')
      ? partners.merchants.find((m) => m.id === user.info.merchantId)
      : undefined
  )
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())
  const conditions = computed(() =>
    merchantConditions(
      partners.merchants,
      workspace.costs,
      { roles: user.info.roles || [], merchantId: user.info.merchantId },
      today
    ).filter((r) => r.state === '目前有效')
  )
  const demoAllowed = useMerchantDemoAccess()
  const isDemo = computed(() => route.query.tab === 'demo-links')
  const isLines = computed(() => route.query.tab === 'lines')
  watch(
    () => [route.query.tab, demoAllowed.value],
    () => {
      if (
        !['games', 'lines', 'demo-links', undefined].includes(
          route.query.tab as string | undefined
        ) ||
        (isDemo.value && !demoAllowed.value)
      )
        router.replace({ path: '/merchant/games', query: { tab: 'games' } })
    },
    { immediate: true }
  )
  const rows = computed(() => {
    if (!merchant.value) return []
    if (isLines.value)
      return merchant.value.lines.map((l) => ({
        id: l.uid,
        name: l.uid,
        code: l.walletMode,
        provider: '',
        type: '',
        currencies: l.currency,
        status:
          ({ Active: '啟用', Testing: '測試中', Disabled: '停用' } as Record<string, string>)[
            l.status
          ] || l.status
      }))
    return providers.state.games.flatMap((g) => {
      const currencies = merchant
        .value!.lines.filter(
          (l) =>
            g.currencies.includes(l.currency) &&
            conditions.value.some(
              (c) =>
                c.providerId === g.providerId &&
                c.gameType === commercialGameType(g.type) &&
                (c.transactionCurrency === '供應商全部幣別線路' ||
                  c.transactionCurrency === l.currency)
            )
        )
        .map((l) => l.currency)
      if (!currencies.length) return []
      return [
        {
          id: g.id,
          name: g.name,
          code: g.code,
          provider:
            providers.state.providers.find((p) => p.id === g.providerId)?.name || g.providerId,
          type: commercialGameType(g.type) || '未設定',
          currencies: [...new Set(currencies)].join(' / '),
          status: g.active && g.sourceAvailable !== false ? '已授權' : '暫不可用'
        }
      ]
    })
  })
  const draft = ref(String(route.query.q || '')),
    page = ref(1)
  const filtered = computed(() =>
    rows.value.filter((r) =>
      [r.name, r.code, r.provider]
        .join(' ')
        .toLowerCase()
        .includes(String(route.query.q || '').toLowerCase())
    )
  )
  const paged = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
  const search = () =>
    router.replace({ query: { tab: route.query.tab, q: draft.value.trim() || undefined } })
  const reset = () => {
    draft.value = ''
    search()
  }
  watch(
    () => route.fullPath,
    () => {
      draft.value = String(route.query.q || '')
      page.value = 1
    }
  )
</script>
<style scoped>
  .center {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: 16px;
    min-width: 0;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }
  .filters .el-input {
    width: min(100%, 360px);
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
  }
  .actions .el-button {
    margin-left: 0;
  }
  .el-pagination {
    margin-top: 16px;
    justify-content: flex-end;
  }
</style>
