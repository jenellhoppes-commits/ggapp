<template>
  <ElCard class="supplier-costs" :class="{ embedded }" shadow="never">
    <template #header
      ><strong>{{ owner === 'platform' ? '供應商合約成本' : '供應商銷售條件' }}</strong></template
    >
    <AppFilterForm v-if="!readonly" class="cost-form" @submit.prevent="add">
      <h3 class="form-section"
        >1. {{ owner === 'platform' ? '已接入供應商' : '選擇合作供應商' }}</h3
      >
      <ElFormItem label="供應商"
        ><ElSelect v-model="draft.providerId" filterable :disabled="!!providerId"
          ><ElOption
            v-for="p in visibleProviders"
            :key="p.id"
            :label="p.name"
            :value="p.id" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="生效日期" required
        ><ElDatePicker v-model="draft.effectiveFrom" type="date" value-format="YYYY-MM-DD"
      /></ElFormItem>
      <h3 class="form-section">2. {{ owner === 'platform' ? '供應商成本' : '設定銷售費率' }}</h3>
      <ElFormItem :label="owner === 'platform' ? '供應商收費 %' : '銷售費率 %'" required>
        <ElInput v-model="draft.rate" inputmode="decimal" placeholder="輸入費率" />
      </ElFormItem>
      <ElFormItem label="計費基礎"
        ><ElSelect v-model="draft.basis" :disabled="owner !== 'platform'"
          ><ElOption label="GGR" value="GGR" /><ElOption
            label="有效投注"
            value="ValidBet" /></ElSelect
      ></ElFormItem>
      <h3 class="form-section">3. 結算方式</h3>
      <ElFormItem label="結算幣別"
        ><ElSelect v-model="draft.currency"
          ><ElOption
            v-for="c in finance.settlementCurrencies"
            :key="c.code"
            :label="c.code"
            :value="c.code" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="結算週期"
        ><ElSelect v-model="draft.cycle"
          ><ElOption label="每月" value="Monthly" /><ElOption
            label="每週"
            value="Weekly" /><ElOption label="每日" value="Daily" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="變更原因" :required="!deferred"
        ><ElInput v-model="draft.reason" placeholder="說明合約變更原因"
      /></ElFormItem>
      <ElFormItem label="負 GGR 處理" required>
        <ElSelect v-model="draft.negativeGgr" placeholder="請選擇">
          <ElOption label="清零" value="zero" />
          <ElOption label="累積至下期扣抵" value="carry" />
        </ElSelect>
      </ElFormItem>
      <div class="filter-actions"
        ><ElButton type="primary" @click="add">{{
          deferred ? '加入供應商條件' : '保存新版本'
        }}</ElButton></div
      >
    </AppFilterForm>
    <h3 v-if="deferred" class="selected-heading">已選供應商條件（{{ pending.length }}）</h3>
    <ElAlert v-if="error" :title="error" type="error" :closable="false" />
    <ArtTable
      :data="displayRows"
      row-key="id"
      height="auto"
      empty-height="120px"
      :show-table-header="false"
      style="height: auto"
      :empty-text="
        owner === 'platform'
          ? '尚未設定供應商合約成本'
          : '尚未設定供應商銷售條件；請先確認上游合約，再設定售價'
      "
    >
      <ElTableColumn label="供應商" min-width="150"
        ><template #default="{ row }">{{
          providers.state.providers.find((p) => p.id === row.providerId)?.name || row.providerId
        }}</template></ElTableColumn
      >
      <ElTableColumn
        prop="payable"
        :label="owner === 'platform' ? '上繳成本 %' : '對下級收取 %'"
        min-width="140"
      />
      <ElTableColumn
        v-if="owner !== 'platform' && !hideUpstream && canViewAcquisition"
        prop="upstreamCost"
        label="上游成本 %"
        min-width="130"
      />
      <ElTableColumn prop="effectiveFrom" label="生效日期" min-width="140" />
      <ElTableColumn prop="currency" label="結算幣" width="100" />
      <ElTableColumn label="合約範圍" width="160"
        ><template #default="{ row }">{{
          row.scope === 'provider'
            ? '供應商全部幣別線路'
            : `舊版：${row.transactionCurrency || '待確認'}`
        }}</template></ElTableColumn
      >
      <ElTableColumn prop="basis" label="計費基礎" width="110" />
      <ElTableColumn label="負 GGR 處理" min-width="150">
        <template #default="{ row }">{{
          row.negativeGgr === 'carry'
            ? '累積至下期扣抵'
            : row.negativeGgr === 'zero'
              ? '清零'
              : '待確認（舊版本）'
        }}</template>
      </ElTableColumn>
      <ElTableColumn prop="createdBy" label="建立人" min-width="130" />
      <ElTableColumn v-if="deferred" label="操作" width="100"
        ><template #default="{ $index }"
          ><ElButton link @click="pending.splice($index, 1)">移除待存</ElButton></template
        ></ElTableColumn
      >
    </ArtTable>
  </ElCard>
</template>
<script setup lang="ts">
  import { computed, ref, reactive, watch } from 'vue'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { useUserStore } from '@/store/modules/user'
  import { platformDate } from '@/domain/report-four-tabs'
  import {
    payableRate,
    prepareSupplierCost,
    supplierCostAt,
    type SupplierCostInput,
    type SupplierCostVersion,
    type CostOwner
  } from '@/domain/admin-supplier-costs'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { visiblePartnerTerms } from '@/domain/visible-partner-terms'
  const props = defineProps<{
    owner: CostOwner
    ownerId?: string
    parentId?: string
    providerId?: string
    deferred?: boolean
    readonly?: boolean
    embedded?: boolean
    hideUpstream?: boolean
  }>()
  const providers = useProviderDemoStore(),
    finance = useFinanceSettingsStore(),
    locale = usePlatformLocaleStore(),
    user = useUserStore()
  const workspace = usePartnerWorkspaceStore(),
    business = useBusinessPartnerStore()
  const rows = computed<SupplierCostVersion[]>(() => workspace.costs)
  const visibleRows = computed(() =>
    visiblePartnerTerms(rows.value, {
      roles: user.info.roles || [],
      agentId: user.info.agentId,
      merchantId: user.info.merchantId
    })
  )
  const canViewAcquisition = computed(
    () =>
      user.info.roles?.some((r) => ['R_ADMIN', 'R_SUPER'].includes(r)) ||
      (user.info.roles?.includes('R_AGENT') &&
        props.parentId === user.info.agentId &&
        props.ownerId !== user.info.agentId)
  )
  const upstreamRows = computed(() =>
    rows.value.filter(
      (r) =>
        r.owner === (props.parentId ? 'agent' : 'platform') &&
        r.ownerId === (props.parentId || 'platform') &&
        r.scope === 'provider' &&
        r.effectiveFrom <= (draft.effectiveFrom || context().today)
    )
  )
  const visibleProviders = computed(() =>
    props.owner === 'platform'
      ? providers.state.providers
      : providers.state.providers.filter((p) =>
          upstreamRows.value.some((r) => r.providerId === p.id)
        )
  )
  const pending = ref<SupplierCostInput[]>([]),
    error = ref('')
  const draft = reactive<SupplierCostInput>({
    providerId: props.providerId || '',
    scope: 'provider',
    rate: '',
    meaning: 'payable',
    basis: 'GGR',
    currency: '',
    cycle: 'Monthly',
    effectiveFrom: '',
    reason: ''
  })
  const timezone = computed(() => locale.defaultTimezone?.id || '')
  const context = () => ({
    roles: user.info.roles || [],
    agentId: business.agents.find((a) => a.id === user.info.agentId && a.status === 'Active')?.id,
    editableTargets: [
      ...business.agents
        .filter((a) => a.parentAgentId === user.info.agentId)
        .map((a) => `agent:${a.id}`),
      ...business.merchants
        .filter((m) => m.agentId === user.info.agentId)
        .map((m) => `merchant:${m.id}`),
      ...(props.deferred && props.parentId === user.info.agentId ? [`${props.owner}:pending`] : [])
    ],
    name: user.info.userName || '管理者',
    today: timezone.value ? platformDate(new Date(), timezone.value) : '',
    timezone: timezone.value,
    providers: providers.state.providers.map((p) => p.id),
    currencies: finance.settlementCurrencies.map((c) => c.code),
    providerCurrencies: Object.fromEntries(
      providers.state.providers.map((p) => [p.id, p.lines.map((l) => l.currency)])
    )
  })
  const upstream = computed(() =>
    supplierCostAt(
      rows.value,
      props.parentId ? 'agent' : 'platform',
      props.parentId || 'platform',
      draft.providerId,
      draft.effectiveFrom,
      draft.transactionCurrency
    )
  )
  const displayRows = computed(() =>
    props.deferred
      ? pending.value.map((r, i) => ({
          ...r,
          id: String(i),
          payable: payableRate(r),
          createdBy: '建立合作時保存'
        }))
      : visibleRows.value
          .filter(
            (r) =>
              r.owner === props.owner &&
              r.ownerId === (props.ownerId || 'platform') &&
              (!props.providerId || r.providerId === props.providerId)
          )
          .slice()
          .reverse()
  )
  const inherit = () => {
    if (upstream.value)
      Object.assign(draft, {
        basis: upstream.value.basis
      })
  }
  watch(
    () => [
      props.parentId,
      draft.providerId,
      draft.transactionCurrency,
      draft.effectiveFrom,
      upstream.value?.id
    ],
    () => {
      if (props.owner === 'platform') return
      if (upstream.value) inherit()
    }
  )
  const prepare = (ownerId: string) => {
    let next = [...rows.value]
    for (const input of pending.value)
      next.push(
        prepareSupplierCost(next, props.owner, ownerId, props.parentId || '', input, context())
      )
    return next
  }
  function add() {
    error.value = ''
    try {
      if (props.readonly) throw new Error('此條件僅可查看')
      if (!draft.negativeGgr) throw new Error('請選擇負 GGR 處理方式；新設定依生效日期適用')
      if (!props.deferred && !draft.reason?.trim()) throw new Error('修改條件須填寫變更原因')
      const candidate = prepareSupplierCost(
        prepare(props.ownerId || 'pending'),
        props.owner,
        props.ownerId || (props.owner === 'platform' ? 'platform' : 'pending'),
        props.parentId || '',
        { ...draft },
        context()
      )
      if (props.deferred) pending.value.push({ ...draft })
      else {
        if (props.owner !== 'platform' && !props.ownerId) throw new Error('請先建立主檔')
        workspace.addCost(candidate)
      }
      draft.rate = ''
      draft.effectiveFrom = ''
    } catch (e) {
      error.value = e instanceof Error ? e.message : '保存失敗'
    }
  }
  function validate() {
    if (props.deferred && !pending.value.length)
      throw new Error('請選擇至少一家供應商並加入結算條件')
    if (draft.rate || draft.effectiveFrom)
      throw new Error('目前編輯的供應商條件尚未加入，請先按「加入供應商條件」或清空費率與日期')
    prepare(props.ownerId || 'pending')
  }
  defineExpose({
    validate,
    inputs: () => JSON.parse(JSON.stringify(pending.value)) as SupplierCostInput[],
    dirty: computed(() => !!pending.value.length || !!draft.rate || !!draft.effectiveFrom)
  })
</script>
<style scoped>
  .supplier-costs {
    margin: 16px 0;
    min-width: 0;
  }
  .supplier-costs.embedded {
    margin: 0;
    border: 0;
  }
  .embedded :deep(.el-card__header) {
    padding: 16px 0;
  }
  .embedded :deep(.el-card__body) {
    padding: 16px 0;
  }
  .cost-form {
    margin: 16px 0;
  }
  .form-section {
    grid-column: 1 / -1;
    margin: 12px 0 0;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
  .selected-heading {
    margin: 20px 0 12px;
    font-size: 14px;
  }
  .cost-form :deep(.el-form-item__label) {
    white-space: nowrap;
    width: 120px !important;
    flex-shrink: 0;
  }
  .cost-form :deep(.filter-actions) {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
  @media (width < 640px) {
    .cost-form :deep(.el-form-item__label) {
      width: auto !important;
    }
  }
  .supplier-costs :deep(.el-empty) {
    padding: 16px 0;
  }
  .supplier-costs :deep(.el-empty__image) {
    width: 48px !important;
    height: 48px;
  }
</style>
