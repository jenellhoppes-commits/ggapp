<template>
  <section class="merchant-profile">
    <AppPageHeader title="商務中心" />
    <ElEmpty v-if="!profile" description="無法取得有效商戶資料" />
    <template v-else>
      <PortalTabs
        v-model="tab"
        :tabs="[
          { value: 'profile', label: '基本資料與結算設定' },
          { value: 'conditions', label: '商務條件與版本' }
        ]"
      />
      <ElCard v-if="tab === 'profile'" shadow="never">
        <template #header>基本資料</template>
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="商戶"
            >{{ profile.name }} · {{ profile.code }}</ElDescriptionsItem
          >
          <ElDescriptionsItem label="所屬代理">{{ profile.agentName }}</ElDescriptionsItem>
          <ElDescriptionsItem label="聯絡人">{{ profile.contact || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="電子郵件">{{ profile.email || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="合作開始">{{
            profile.cooperationStartDate || '—'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="收付模式">{{
            mode === 'AgentCollect' ? '代理統收' : '平台代收'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="對應收款方">{{
            mode === 'AgentCollect' ? profile.agentName : '平台'
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="合約結算週期">{{
            cycle(profile.settlementCycle)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="結算幣">{{ profile.settlementCurrency }}</ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>
      <ElCard v-else shadow="never">
        <template #header>適用商務條件</template>
        <div class="filters">
          <ElSelect v-model="state" aria-label="條件版本狀態">
            <ElOption v-for="s in states" :key="s" :label="s" :value="s" />
          </ElSelect>
          <span>生效判定日：{{ today }}</span>
        </div>
        <ElTable :data="visible" row-key="id" :scrollbar-always-on="true">
          <ElTableColumn prop="providerId" label="供應商代碼" min-width="140" />
          <ElTableColumn prop="gameType" label="遊戲類型" min-width="110" />
          <ElTableColumn prop="percent" label="適用商務比例 %" min-width="150" align="right" />
          <ElTableColumn prop="currency" label="結算幣" width="100" />
          <ElTableColumn prop="transactionCurrency" label="交易幣範圍" min-width="190" />
          <ElTableColumn prop="effectiveFrom" label="生效日期" width="130" />
          <ElTableColumn prop="negativeGgr" label="負 GGR 政策" width="130" />
          <ElTableColumn prop="id" label="條件版本" min-width="220" show-overflow-tooltip />
          <ElTableColumn prop="state" label="版本狀態" width="120" />
        </ElTable>
      </ElCard>
    </template>
  </section>
</template>
<script setup lang="ts">
  import PortalTabs from '@/components/business/PortalTabs.vue'
  import { usePortalQueryTab } from '@/composables/usePortalQueryTab'
  import { computed, ref } from 'vue'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useUserStore } from '@/store/modules/user'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { useCollectionModeStore } from '@/store/modules/collectionMode'
  import { merchantProfile, merchantConditions } from '@/domain/merchant-profile'
  const user = useUserStore(),
    partners = useBusinessPartnerStore(),
    workspace = usePartnerWorkspaceStore(),
    modes = useCollectionModeStore()
  const actor = computed(() => ({ roles: user.info.roles || [], merchantId: user.info.merchantId }))
  const profile = computed(() => merchantProfile(partners.merchants, actor.value))
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
  const mode = computed(() =>
    profile.value ? modes.at(profile.value.id, today, profile.value.collectionMode) : undefined
  )
  const states = ['目前有效', '未來生效', '歷史版本', '待補完整', '全部版本']
  const state = ref('目前有效')
  const tab = usePortalQueryTab(['profile', 'conditions'], 'profile')
  const rows = computed(() =>
    merchantConditions(partners.merchants, workspace.costs, actor.value, today)
  )
  const visible = computed(() =>
    rows.value.filter((r) => state.value === '全部版本' || r.state === state.value)
  )
  const cycle = (value: string) =>
    ({ Daily: '日結', Weekly: '週結', Monthly: '月結', Semimonthly: '半月結' })[value as 'Daily'] ||
    value
</script>
<style scoped>
  .merchant-profile {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-content: start;
    gap: 16px;
    min-width: 0;
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }
  .filters .el-select {
    width: 180px;
  }
  .filters span {
    color: var(--el-text-color-secondary);
  }
</style>
