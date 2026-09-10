<template>
  <ElCard shadow="never">
    <template #header>2. 下發條件（供應商）</template>
    <div class="toolbar">
      <span>已開放 {{ selected.length }} 家</span>
      <ElButton @click="toggleAll(true)">全部開啟</ElButton>
      <ElButton @click="toggleAll(false)">全部關閉</ElButton>
    </div>
    <ElTable :data="rows" row-key="id">
      <ElTableColumn label="開放" width="90"
        ><template #default="{ row }">
          <ElSwitch
            v-model="choices[row.id].enabled"
            :disabled="!row.term"
            :aria-label="`開放 ${row.name}`"
          /> </template
      ></ElTableColumn>
      <ElTableColumn prop="name" label="供應商" min-width="160" />
      <ElTableColumn label="自己的取得費率" min-width="160"
        ><template #default="{ row }">
          {{ row.term ? `${row.term.payable}%` : '無有效授權條件' }}
        </template></ElTableColumn
      >
      <ElTableColumn label="計費基礎" width="110"
        ><template #default="{ row }">
          {{ row.term ? (row.term.basis === 'GGR' ? 'GGR' : '有效投注') : '—' }}
        </template></ElTableColumn
      >
      <ElTableColumn label="給下級的費率 %" min-width="220"
        ><template #default="{ row }">
          <ElInput
            v-model="choices[row.id].rate"
            :disabled="!choices[row.id].enabled || !row.term"
            :aria-label="`${row.name} 下發費率`"
            inputmode="decimal"
            placeholder="開啟後必填"
          />
          <small v-if="choices[row.id].enabled && row.term"
            >最低 {{ row.term.payable }}%；相等為零價差</small
          >
        </template></ElTableColumn
      >
    </ElTable>
  </ElCard>
  <ElCard shadow="never">
    <template #header>3. 結算設定</template>
    <ElForm label-position="top" class="settings">
      <ElFormItem label="結算週期" required
        ><ElSelect v-model="settings.cycle">
          <ElOption label="每月" value="Monthly" /><ElOption label="每週" value="Weekly" /><ElOption
            label="每日"
            value="Daily"
          /> </ElSelect
      ></ElFormItem>
      <ElFormItem label="結算幣別" required
        ><ElSelect v-model="settings.currency" placeholder="請選擇">
          <ElOption
            v-for="c in finance.settlementCurrencies"
            :key="c.code"
            :label="c.code"
            :value="c.code"
          /> </ElSelect
      ></ElFormItem>
      <ElFormItem label="生效日期" required
        ><ElDatePicker v-model="settings.effectiveFrom" value-format="YYYY-MM-DD" type="date"
      /></ElFormItem>
      <ElFormItem label="負 GGR 處理" required
        ><ElSelect v-model="settings.negativeGgr" placeholder="請選擇">
          <ElOption label="清零" value="zero" /><ElOption
            label="累積至下期扣抵"
            value="carry"
          /> </ElSelect
      ></ElFormItem>
    </ElForm>
  </ElCard>
</template>
<script setup lang="ts">
  import { computed, reactive, watch } from 'vue'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { useUserStore } from '@/store/modules/user'
  import { visiblePartnerTerms } from '@/domain/visible-partner-terms'
  import { supplierCostAt, costUnits, type SupplierCostInput } from '@/domain/admin-supplier-costs'
  import { platformDate } from '@/domain/report-four-tabs'
  const props = defineProps<{ parentId: string; timezone: string }>()
  const workspace = usePartnerWorkspaceStore(),
    providers = useProviderDemoStore(),
    finance = useFinanceSettingsStore()
  const choices = reactive<Record<string, { enabled: boolean; rate: string }>>({})
  const settings = reactive({
    cycle: 'Monthly' as SupplierCostInput['cycle'],
    currency: '',
    effectiveFrom: '',
    negativeGgr: '' as '' | 'zero' | 'carry'
  })
  watch(
    () => providers.state.providers.map((p) => p.id),
    (ids) => {
      for (const id of ids) choices[id] ||= { enabled: false, rate: '' }
    },
    { immediate: true }
  )
  watch(
    () => props.parentId,
    () => {
      for (const item of Object.values(choices)) {
        item.enabled = false
        item.rate = ''
      }
    }
  )
  const user = useUserStore()
  const rows = computed(() =>
    providers.state.providers.map((p) => {
      const term = supplierCostAt(
        visiblePartnerTerms(workspace.costs, {
          roles: user.info.roles || [],
          agentId: user.info.agentId,
          merchantId: user.info.merchantId
        }),
        props.parentId ? 'agent' : 'platform',
        props.parentId || 'platform',
        p.id,
        settings.effectiveFrom || platformDate(new Date(), props.timezone || 'Asia/Taipei')
      )
      return { id: p.id, name: p.name, term: term?.scope === 'provider' ? term : undefined }
    })
  )
  const selected = computed(() => rows.value.filter((p) => choices[p.id]?.enabled))
  function toggleAll(enabled: boolean) {
    for (const row of rows.value) choices[row.id].enabled = enabled && !!row.term
  }
  function validate() {
    if (!selected.value.length) throw new Error('請至少開放一家供應商')
    for (const row of selected.value) {
      if (!row.term) throw new Error(`${row.name} 缺少有效授權條件`)
      if (!choices[row.id].rate.trim()) throw new Error(`${row.name} 已開放，請填入下發費率`)
      if (costUnits(choices[row.id].rate) < costUnits(row.term.payable))
        throw new Error(`${row.name} 下發費率不得低於自己的取得費率 ${row.term.payable}%`)
    }
    if (!settings.currency || !settings.effectiveFrom || !settings.negativeGgr)
      throw new Error('請完成結算幣別、生效日期及負 GGR 處理')
  }
  function inputs(): SupplierCostInput[] {
    validate()
    return selected.value.map((row) => ({
      ...settings,
      negativeGgr: settings.negativeGgr as 'zero' | 'carry',
      providerId: row.id,
      scope: 'provider',
      meaning: 'payable',
      basis: row.term!.basis,
      rate: choices[row.id].rate,
      reason: '初始下發條件'
    }))
  }
  defineExpose({
    validate,
    inputs,
    dirty: computed(
      () =>
        Object.values(choices).some((c) => c.enabled || c.rate) ||
        !!settings.currency ||
        !!settings.effectiveFrom ||
        !!settings.negativeGgr ||
        settings.cycle !== 'Monthly'
    )
  })
</script>
<style scoped>
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .settings {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 24px;
  }
  .settings :deep(.el-select),
  .settings :deep(.el-date-editor) {
    width: 100%;
  }
  small {
    color: var(--el-text-color-secondary);
  }
  @media (max-width: 600px) {
    .settings {
      grid-template-columns: 1fr;
    }
  }
</style>
