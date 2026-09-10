<template>
  <section class="provider-terms">
    <SupplierCostConditions owner="platform" owner-id="platform" :provider-id="providerId" />
    <div v-if="versions.length" class="terms-heading">
      <div><h3>舊版合約紀錄（唯讀）</h3></div>
      <ElButton v-if="canWrite" disabled @click="edit">舊版編輯已停用</ElButton>
    </div>
    <template v-if="versions.length">
      <ElDescriptions :column="1" border>
        <ElDescriptionsItem label="目前生效">{{
          current ? `V${current.version} · ${describe(current)}` : '尚未生效，不能作為本日計費依據'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="下一版本">{{
          upcoming
            ? `V${upcoming.version} · ${upcoming.effectiveFrom} 起生效`
            : '無；目前條件持續有效'
        }}</ElDescriptionsItem>
        <ElDescriptionsItem label="日期依據"
          >{{ timezone }} · {{ today }}（平台日期）</ElDescriptionsItem
        >
      </ElDescriptions>
      <h4>版本紀錄</h4>
      <article v-for="item in [...versions].reverse()" :key="item.version" class="terms-version">
        <div class="terms-heading"
          ><strong>V{{ item.version }} · {{ item.effectiveFrom }} 起生效</strong
          ><ElTag
            :type="
              item.effectiveFrom > today
                ? 'warning'
                : current?.version === item.version
                  ? 'success'
                  : 'info'
            "
            >{{
              item.effectiveFrom > today
                ? '待生效'
                : current?.version === item.version
                  ? '生效中'
                  : '歷史版本'
            }}</ElTag
          ></div
        >
        <p>{{ describe(item) }}</p
        ><p v-if="item.note">備註：{{ item.note }}</p>
        <small>{{ item.createdBy }} · {{ item.createdAt }} · {{ item.timezone }}</small>
      </article>
    </template>
    <ElDialog
      v-model="opened"
      :title="versions.length ? '修改條件 · 建立新版本' : '新增合約條件'"
      width="min(560px, calc(100vw - 24px))"
      append-to-body
      :close-on-click-modal="false"
      :before-close="beforeClose"
    >
      <ElForm label-position="top" class="terms-form" @submit.prevent="save">
        <ElFormItem label="計費基礎" required
          ><ElSelect v-model="draft.basis" aria-label="計費基礎"
            ><ElOption label="GGR 百分比" value="GGR" /><ElOption
              label="有效投注百分比"
              value="ValidBet" /><ElOption label="每期固定費用" value="Fixed" /></ElSelect
        ></ElFormItem>
        <ElFormItem :label="draft.basis === 'Fixed' ? '每期固定金額' : '合約費率（%）'" required
          ><ElInput
            v-model="draft.rate"
            inputmode="decimal"
            placeholder="請手動輸入，不預設為 0"
            :maxlength="20"
        /></ElFormItem>
        <ElFormItem label="結算幣別" required
          ><ElSelect v-model="draft.currency" placeholder="選擇結算幣別" aria-label="結算幣別"
            ><ElOption v-for="c in currencies" :key="c" :label="c" :value="c" /></ElSelect
        ></ElFormItem>
        <ElFormItem label="結算週期" required
          ><ElSelect v-model="draft.cycle" aria-label="結算週期"
            ><ElOption label="月結" value="Monthly" /><ElOption
              label="週結"
              value="Weekly" /><ElOption label="日結" value="Daily" /></ElSelect
        ></ElFormItem>
        <ElFormItem :label="`生效日期（${timezone}）`" required
          ><ElDatePicker
            v-model="draft.effectiveFrom"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="每次新增版本皆須指定日期"
            :editable="true"
        /></ElFormItem>
        <ElFormItem label="備註"
          ><ElInput v-model="draft.note" type="textarea" :maxlength="500" show-word-limit
        /></ElFormItem>
        <ElAlert v-if="error" :title="error" type="error" :closable="false" role="alert" />
        <div class="terms-actions"
          ><ElButton @click="beforeClose(() => (opened = false))">取消</ElButton
          ><ElButton type="primary" native-type="submit" :disabled="!canWrite"
            >儲存新版本</ElButton
          ></div
        >
      </ElForm>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import SupplierCostConditions from '@/components/business/SupplierCostConditions.vue'
  import { computed, reactive, ref } from 'vue'
  import { useNow } from '@vueuse/core'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { useUserStore } from '@/store/modules/user'
  import { canManageProviders } from '@/domain/provider-core'
  import { platformDate } from '@/domain/report-four-tabs'
  import { saveProviderTerms, termsAt, type ProviderTermsInput } from '@/domain/provider-terms'
  const props = defineProps<{ providerId: string }>()
  const store = useProviderDemoStore(),
    locale = usePlatformLocaleStore(),
    finance = useFinanceSettingsStore(),
    user = useUserStore()
  const actor = computed(() => ({
    roles: user.info.roles || [],
    name: user.info.userName || '演示管理者'
  }))
  const canWrite = computed(() => canManageProviders(actor.value))
  const versions = computed(
    () => store.state.providers.find((p) => p.id === props.providerId)?.terms || []
  )
  const timezone = computed(() => locale.defaultTimezone?.id || '')
  const now = useNow({ interval: 60000 })
  const today = computed(() => {
    try {
      return platformDate(now.value, timezone.value)
    } catch {
      return ''
    }
  })
  const currencies = computed(() => finance.settlementCurrencies.map((c) => c.code))
  const current = computed(() => termsAt(versions.value, today.value))
  const upcoming = computed(() => versions.value.find((v) => v.effectiveFrom > today.value))
  const opened = ref(false),
    error = ref(''),
    expectedVersion = ref(0),
    original = ref('')
  const blank = (): ProviderTermsInput => ({
    basis: 'GGR',
    rate: '',
    currency: '',
    cycle: 'Monthly',
    effectiveFrom: '',
    note: ''
  })
  const draft = reactive(blank())
  const describe = (v: ProviderTermsInput) =>
    `${{ GGR: 'GGR', ValidBet: '有效投注', Fixed: '每期固定費用' }[v.basis]} ${v.rate}${v.basis === 'Fixed' ? '' : '%'} · ${v.currency} · ${{ Monthly: '月結', Weekly: '週結', Daily: '日結' }[v.cycle]}`
  function edit() {
    Object.assign(draft, blank(), versions.value.at(-1) || {}, { effectiveFrom: '' })
    expectedVersion.value = versions.value.at(-1)?.version || 0
    original.value = JSON.stringify(draft)
    error.value = ''
    opened.value = true
  }
  async function mayClose() {
    if (!opened.value || JSON.stringify(draft) === original.value) return true
    try {
      await ElMessageBox.confirm('尚有未儲存的合約條件，確定放棄？', '離開編輯', {
        confirmButtonText: '放棄變更',
        cancelButtonText: '繼續編輯',
        type: 'warning'
      })
      return true
    } catch {
      return false
    }
  }
  async function beforeClose(done: () => void) {
    if (await mayClose()) done()
  }
  async function leave() {
    if (!(await mayClose())) return false
    opened.value = false
    return true
  }
  onBeforeRouteLeave(leave)
  onBeforeRouteUpdate(leave)
  function save() {
    error.value = ''
    try {
      saveProviderTerms(
        store.state,
        props.providerId,
        {
          basis: draft.basis,
          rate: draft.rate.trim(),
          currency: draft.currency,
          cycle: draft.cycle,
          effectiveFrom: draft.effectiveFrom || '',
          note: draft.note.trim()
        },
        expectedVersion.value,
        actor.value,
        { today: today.value, timezone: timezone.value, currencies: currencies.value }
      )
      opened.value = false
      ElMessage.success('演示合約版本已儲存；不執行正式結算')
    } catch (e) {
      error.value = e instanceof Error ? e.message : '儲存失敗'
    }
  }
</script>
<style scoped>
  .provider-terms {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .terms-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  p,
  small {
    color: var(--el-text-color-secondary);
    overflow-wrap: anywhere;
  }
  .terms-version {
    border: 1px solid var(--el-border-color);
    border-radius: var(--el-border-radius-base);
    padding: 16px;
  }
  .terms-form {
    margin-top: 16px;
  }
  .terms-form :deep(.el-select),
  .terms-form :deep(.el-date-editor) {
    width: 100%;
  }
  .terms-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
  .terms-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
</style>
