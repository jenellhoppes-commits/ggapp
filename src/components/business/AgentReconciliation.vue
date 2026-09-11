<template>
  <section class="agent-reconciliation">
    <ElTabs v-model="tab"
      ><ElTabPane label="本代理上繳" name="own" /><ElTabPane
        label="直屬商戶"
        name="merchants" /><ElTabPane label="直屬代理" name="agents"
    /></ElTabs>
    <AppFilterForm @submit.prevent="applyFilters">
      <ElFormItem label="期數"
        ><ElSelect v-model="draft.period" clearable placeholder="全部期數"
          ><ElOption v-for="p in periods" :key="p" :label="p" :value="p" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="幣別"
        ><ElSelect v-model="draft.currency" clearable placeholder="全部幣別"
          ><ElOption v-for="c in currencies" :key="c" :label="c" :value="c" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="對帳狀態"
        ><ElSelect v-model="draft.status" clearable placeholder="全部狀態"
          ><ElOption label="待確認" value="pending" /><ElOption
            label="已鎖定"
            value="Locked" /><ElOption label="已取消" value="Cancelled" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="收付狀態"
        ><ElSelect v-model="draft.payment" clearable placeholder="全部狀態"
          ><ElOption
            v-for="s in ['未收付', '已收付', '已結轉下期', '無須收付']"
            :key="s"
            :label="s"
            :value="s" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="單號／對象"
        ><ElInput v-model="draft.query" clearable placeholder="搜尋單號或對象"
      /></ElFormItem>
      <div class="filter-actions"
        ><ElButton type="primary" @click="applyFilters">查詢</ElButton
        ><ElButton @click="resetFilters">重置</ElButton></div
      >
    </AppFilterForm>
    <ElTable :data="rows" row-key="id" scrollbar-always-on>
      <ElTableColumn prop="id" label="單號" min-width="190" /><ElTableColumn
        prop="period"
        label="期間"
        width="110"
      />
      <ElTableColumn label="對象" min-width="150"
        ><template #default="{ row }">{{ name(row) }}</template></ElTableColumn
      >
      <ElTableColumn label="結算幣" width="90"
        ><template #default="{ row }">{{
          row.snapshot.settlementCurrency
        }}</template></ElTableColumn
      >
      <ElTableColumn prop="finalSettlementAmount" label="應結金額" min-width="140" />
      <ElTableColumn label="對帳狀態" width="110"
        ><template #default="{ row }">{{
          row.status === 'Locked' ? '已鎖定' : row.status === 'Cancelled' ? '已取消' : '待確認'
        }}</template></ElTableColumn
      >
      <ElTableColumn label="收付狀態" width="125"
        ><template #default="{ row }">{{ payment(row.id) }}</template></ElTableColumn
      >
      <ElTableColumn label="操作" width="130"
        ><template #default="{ row }"
          ><ElButton link type="primary" @click="open(row.id)">{{
            editable(row) ? '核帳／交付' : '查看'
          }}</ElButton></template
        ></ElTableColumn
      >
    </ElTable>
    <ElDialog
      v-model="opened"
      title="結算單與交付"
      width="min(850px, calc(100vw - 32px))"
      class="agent-delivery-dialog"
      append-to-body
      :close-on-click-modal="false"
    >
      <template v-if="selected">
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="單號">{{ selected.id }}</ElDescriptionsItem
          ><ElDescriptionsItem label="對象">{{ name(selected) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="期間">{{ selected.period }}</ElDescriptionsItem
          ><ElDescriptionsItem label="結算幣">{{
            selected.snapshot.settlementCurrency
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="GGR">{{ selected.ggr }}</ElDescriptionsItem
          ><ElDescriptionsItem label="應結金額">{{
            selected.finalSettlementAmount
          }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElForm v-if="editable(selected)" label-position="top" class="delivery delivery-form">
          <ElFormItem label="系統應結／上期待交付"
            ><span
              >{{ selected.finalSettlementAmount }} ／
              {{ finance.deliveryOpening('merchant', selected.id) }}</span
            ></ElFormItem
          >
          <ElFormItem label="差異調整"
            ><ElInputNumber v-model="difference" :precision="6"
          /></ElFormItem>
          <ElFormItem label="實際收款方"
            ><span>{{ scope.own?.name }}</span></ElFormItem
          >
          <ElFormItem label="實收金額"
            ><ElInputNumber v-model="paid" :min="0" :precision="0"
          /></ElFormItem>
          <ElFormItem label="取整後應收／剩餘款"
            ><span>{{ due }} ／ {{ due - paid }}</span></ElFormItem
          >
          <ElFormItem label="調整原因／交付備註" class="full-row"
            ><ElInput v-model="reason" type="textarea"
          /></ElFormItem>
          <ElCheckbox v-model="defer" class="full-row">未交付餘額保留至下期</ElCheckbox>
        </ElForm>
        <ElDescriptions v-if="delivery" :column="2" border class="delivery">
          <ElDescriptionsItem label="實際交付">{{ delivery.paid }}</ElDescriptionsItem
          ><ElDescriptionsItem label="結轉餘額">{{ delivery.carry }}</ElDescriptionsItem>
          <ElDescriptionsItem label="登錄人">{{ delivery.operator }}</ElDescriptionsItem
          ><ElDescriptionsItem label="登錄時間">{{ delivery.time }}</ElDescriptionsItem>
          <ElDescriptionsItem label="備註">{{ delivery.reason || '—' }}</ElDescriptionsItem>
        </ElDescriptions>
      </template>
      <template #footer
        ><ElButton @click="opened = false">關閉</ElButton
        ><ElButton v-if="selected && editable(selected)" type="primary" @click="confirm"
          >確認並鎖定</ElButton
        ></template
      >
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, reactive, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useFinanceCenterStore } from '@/store/modules/financeCenter'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useUserStore } from '@/store/modules/user'
  import { useCollectionModeStore } from '@/store/modules/collectionMode'
  import { agentScope } from '@/domain/agent-portal'
  import { mayDeliver } from '@/domain/collection-mode'
  const finance = useFinanceCenterStore(),
    partners = useBusinessPartnerStore(),
    user = useUserStore(),
    modes = useCollectionModeStore()
  const scope = computed(() =>
    agentScope(partners, {
      roles: user.info.roles || [],
      agentId: user.info.agentId,
      name: user.info.userName || ''
    })
  )
  const route = useRoute()
  const tab = ref(
      ['own', 'merchants', 'agents'].includes(String(route.query.tab))
        ? String(route.query.tab)
        : 'own'
    ),
    selectedId = ref(''),
    opened = ref(false),
    paid = ref(0),
    difference = ref(0),
    reason = ref(''),
    defer = ref(false)
  const emptyFilters = () => ({ period: '', currency: '', status: '', payment: '', query: '' })
  const draft = reactive(emptyFilters()),
    applied = ref(emptyFilters())
  const applyFilters = () => {
    applied.value = { ...draft }
  }
  const resetFilters = () => {
    Object.assign(draft, emptyFilters())
    applyFilters()
  }
  watch(tab, resetFilters)
  const all = computed(() =>
    !scope.value.own
      ? []
      : tab.value === 'merchants'
        ? finance.merchantReconciliations.filter((r) =>
            scope.value.merchants.some(
              (m) => m.id === r.merchantId && m.agentId === scope.value.own?.id
            )
          )
        : finance.agentReconciliations.filter((r) =>
            tab.value === 'own'
              ? r.agentId === scope.value.own?.id
              : scope.value.agents.some(
                  (a) => a.id === r.agentId && a.parentAgentId === scope.value.own?.id
                )
          )
  )
  type Row = (typeof all.value)[number]
  const periods = computed(() => [...new Set(all.value.map((r) => r.period))].sort().reverse())
  const currencies = computed(() =>
    [...new Set(all.value.map((r) => r.snapshot.settlementCurrency))].sort()
  )
  const name = (r: Row) =>
    'merchantId' in r
      ? partners.merchants.find((m) => m.id === r.merchantId)?.name
      : partners.agents.find((a) => a.id === r.agentId)?.name
  const rows = computed(() =>
    all.value.filter((r) => {
      const f = applied.value
      return (
        (!f.period || r.period === f.period) &&
        (!f.currency || r.snapshot.settlementCurrency === f.currency) &&
        (!f.status ||
          (f.status === 'pending'
            ? !['Locked', 'Cancelled'].includes(r.status)
            : r.status === f.status)) &&
        (!f.payment || payment(r.id) === f.payment) &&
        `${r.id} ${name(r)}`.toLowerCase().includes(f.query.trim().toLowerCase())
      )
    })
  )
  const selected = computed(() => all.value.find((r) => r.id === selectedId.value))
  const delivery = computed(() => finance.deliveries.find((d) => d.id === selected.value?.id))
  const due = computed(() =>
    selected.value
      ? Math.trunc(
          (Math.round(selected.value.finalSettlementAmount * 1e6) +
            Math.round(finance.deliveryOpening('merchant', selected.value.id) * 1e6) +
            Math.round(difference.value * 1e6)) /
            1e6
        )
      : 0
  )
  function editable(r: Row) {
    if (!scope.value.own || !('merchantId' in r) || ['Locked', 'Cancelled'].includes(r.status))
      return false
    const m = scope.value.merchants.find((m) => m.id === r.merchantId)
    return (
      !!m &&
      mayDeliver(
        user.activeRoles(),
        scope.value.own.id,
        'merchant',
        m.agentId,
        modes.at(m.id, r.periodStart.slice(0, 10), m.collectionMode)
      )
    )
  }
  function payment(id: string) {
    const d = finance.deliveries.find((d) => d.id === id)
    return !d ? '未收付' : d.carry ? '已結轉下期' : d.paid ? '已收付' : '無須收付'
  }
  function open(id: string) {
    selectedId.value = id
    paid.value = 0
    difference.value = 0
    reason.value = ''
    defer.value = false
    opened.value = true
  }
  async function confirm() {
    if (!selected.value || !editable(selected.value)) return
    const id = selected.value.id
    try {
      await ElMessageBox.confirm('確認後將鎖定原單，平台與代理不能重複交付。', '確認交付')
      if (!selected.value || selected.value.id !== id || !editable(selected.value))
        throw new Error('單據或權限已變更')
      finance.deliverReconciliation(
        'merchant',
        id,
        paid.value,
        difference.value,
        reason.value,
        defer.value,
        scope.value.own?.id
      )
      ElMessage.success('已交付並鎖定')
    } catch (e) {
      if (e instanceof Error) ElMessage.error(e.message)
    }
  }
</script>
<style scoped>
  .agent-reconciliation {
    display: grid;
    gap: 16px;
    min-width: 0;
    align-content: start;
    align-items: start;
    grid-auto-rows: max-content;
  }
  .search {
    max-width: 360px;
    height: 36px;
    width: 100%;
  }
  .delivery {
    margin-top: 20px;
  }
</style>
<style>
  .agent-delivery-dialog {
    margin: 4vh auto !important;
    max-height: 92dvh;
    display: flex;
    flex-direction: column;
  }
  .agent-delivery-dialog .el-dialog__body {
    overflow: auto;
    min-height: 0;
    padding-top: 12px;
  }
  .agent-delivery-dialog .el-dialog__header,
  .agent-delivery-dialog .el-dialog__footer {
    flex-shrink: 0;
  }
  .agent-delivery-dialog .el-dialog__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 16px;
  }
  .agent-delivery-dialog .delivery-form {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 24px;
    align-content: start;
  }
  .agent-delivery-dialog .delivery-form .el-form-item {
    margin: 0;
    min-width: 0;
  }
  .agent-delivery-dialog .delivery-form .el-input-number {
    width: 100%;
  }
  .agent-delivery-dialog .delivery-form .full-row {
    grid-column: 1 / -1;
  }
  .agent-delivery-dialog .el-descriptions__body {
    overflow-wrap: anywhere;
  }
  @media (max-width: 640px) {
    .agent-delivery-dialog .delivery-form {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
