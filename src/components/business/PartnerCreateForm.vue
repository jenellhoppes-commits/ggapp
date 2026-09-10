<template>
  <section class="partner-create-v2">
    <AppPageHeader
      :title="kind === 'agent' ? '新增代理' : '新增商戶'"
      description="建立基本資料與直屬上級給予的初版結算條件。"
    >
      <template #actions><ElButton @click="cancel">返回列表</ElButton></template>
    </AppPageHeader>
    <div
      v-if="error || workspace.error"
      ref="errorPanel"
      tabindex="-1"
      aria-label="新增資料驗證錯誤"
    >
      <ElAlert :title="error || workspace.error" type="error" :closable="false" />
    </div>
    <ElCard shadow="never">
      <template #header>1. 基本資料</template>
      <ElForm label-position="top" class="basic-fields" @submit.prevent="submit">
        <ElFormItem label="所屬代理" :required="kind === 'merchant' || isAgent">
          <ElInput
            v-if="isAgent"
            :model-value="own ? `${own.name} · ${own.level}` : '無有效代理身分'"
            disabled
          />
          <ElSelect
            v-else
            v-model="form.parentId"
            clearable
            :placeholder="kind === 'merchant' ? '請選擇所屬代理' : '頂級代理可不選上級'"
          >
            <ElOption
              v-for="a in parents"
              :key="a.id"
              :value="a.id"
              :label="`${a.name} · ${a.level} · ${a.code}`"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="kind === 'agent'" label="建立層級"
          ><ElInput :model-value="levelLabel" disabled
        /></ElFormItem>
        <ElFormItem label="代碼" required
          ><ElInput v-model="form.code" maxlength="32" placeholder="3–32 位英數、底線或連字號"
        /></ElFormItem>
        <ElFormItem label="名稱" required
          ><ElInput v-model="form.name" maxlength="80"
        /></ElFormItem>
        <ElFormItem label="聯絡人" required
          ><ElInput v-model="form.contact" maxlength="80"
        /></ElFormItem>
        <ElFormItem label="聯絡方式" required
          ><ElInput v-model="form.contactMethod" maxlength="120"
        /></ElFormItem>
        <ElFormItem label="合作開始日期" required
          ><ElDatePicker v-model="form.cooperationStartDate" value-format="YYYY-MM-DD" type="date"
        /></ElFormItem>
        <template v-if="kind === 'merchant'">
          <ElFormItem label="國家／地區" required
            ><ElInput v-model="form.country" maxlength="60"
          /></ElFormItem>
          <ElFormItem label="Email" required
            ><ElInput v-model="form.email" type="email"
          /></ElFormItem>
          <ElFormItem label="初始線路幣別" required
            ><ElSelect v-model="form.lineCurrency"
              ><ElOption
                v-for="c in finance.transactionCurrencies"
                :key="c.code"
                :label="c.code"
                :value="c.code" /></ElSelect
          ></ElFormItem>
          <ElFormItem label="錢包模式" required
            ><ElSelect v-model="form.walletMode"
              ><ElOption label="Seamless 單一錢包" value="Seamless" /><ElOption
                label="Transfer 轉帳錢包"
                value="Transfer" /></ElSelect
          ></ElFormItem>
        </template>
        <ElFormItem label="業務時區"><ElInput :model-value="timezone" disabled /></ElFormItem>
        <ElFormItem label="備註"
          ><ElInput v-model="form.note" type="textarea" maxlength="500"
        /></ElFormItem>
      </ElForm>
    </ElCard>
    <PartnerProviderSelection ref="conditions" :parent-id="form.parentId" :timezone="timezone" />
    <div class="create-actions"
      ><ElButton @click="cancel">取消</ElButton
      ><ElButton
        type="primary"
        :loading="saving"
        :disabled="!allowed || !!workspace.error"
        @click="submit"
        >建立並保存</ElButton
      ></div
    >
    <p
      >條件未填、低於上游成本、超出三級或保存失敗時，不會建立半套合作資料。新商戶線路為待設定草稿，不會產生遊戲授權或密鑰。</p
    >
  </section>
</template>
<script setup lang="ts">
  import { computed, reactive, ref, watch, nextTick } from 'vue'
  import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { usePartnerWorkspaceStore } from '@/store/modules/partnerWorkspace'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import { useUserStore } from '@/store/modules/user'
  import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { preparePartnerCreation } from '@/domain/partner-creation'
  import { newAgentLevel } from '@/domain/agent-hierarchy'
  import { platformDate } from '@/domain/report-four-tabs'
  import { generalLineError } from '@/domain/game-availability'
  import PartnerProviderSelection from './PartnerProviderSelection.vue'
  import AppPageHeader from './game-provider/app-page-header/index.vue'
  const props = defineProps<{ kind: 'agent' | 'merchant' }>()
  const business = useBusinessPartnerStore(),
    workspace = usePartnerWorkspaceStore(),
    providers = useProviderDemoStore(),
    user = useUserStore(),
    finance = useFinanceSettingsStore(),
    locale = usePlatformLocaleStore(),
    route = useRoute(),
    router = useRouter()
  const isAgent = computed(
    () =>
      user.info.roles?.includes('R_AGENT') &&
      !user.info.roles?.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r))
  )
  const own = computed(() =>
    business.agents.find((a) => a.id === user.info.agentId && a.status === 'Active')
  )
  const timezone = computed(() => locale.defaultTimezone?.id || '')
  const form = reactive({
    code: '',
    name: '',
    parentId: isAgent.value ? own.value?.id || '' : String(route.query.parentId || ''),
    contact: '',
    contactMethod: '',
    cooperationStartDate: '',
    note: '',
    country: '',
    email: '',
    walletMode: 'Seamless' as 'Seamless' | 'Transfer',
    lineCurrency: ''
  })
  const initial = JSON.stringify(form)
  const parents = computed(() =>
    business.agents.filter(
      (a) => a.status === 'Active' && (props.kind === 'merchant' || a.level !== 'L3')
    )
  )
  const levelLabel = computed(() => {
    try {
      return newAgentLevel(business.agents, form.parentId || undefined)
    } catch (e) {
      return (e as Error).message
    }
  })
  const allowed = computed(
    () =>
      (isAgent.value
        ? !!own.value && (props.kind !== 'agent' || own.value.level !== 'L3')
        : user.info.roles?.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r))) && !!timezone.value
  )
  const conditions = ref<InstanceType<typeof PartnerProviderSelection>>()
  const errorPanel = ref<HTMLElement>()
  const saving = ref(false),
    error = ref(''),
    saved = ref(false)
  const requestId = crypto.randomUUID()
  const dirty = computed(
    () => !saved.value && (JSON.stringify(form) !== initial || !!conditions.value?.dirty)
  )
  const listPath = () =>
    `${isAgent.value ? '/agent' : '/business'}/${props.kind === 'agent' ? (isAgent.value ? 'relations' : 'agents') : 'merchants'}`
  async function mayLeave() {
    if (!dirty.value) return true
    try {
      await ElMessageBox.confirm('放棄尚未保存的基本資料與結算條件？', '離開新增', {
        confirmButtonText: '放棄變更',
        cancelButtonText: '繼續填寫'
      })
      return true
    } catch {
      return false
    }
  }
  async function cancel() {
    await router.push(listPath())
  }
  onBeforeRouteLeave(mayLeave)
  watch(
    () => user.info.agentId,
    () => {
      if (isAgent.value) form.parentId = own.value?.id || ''
    }
  )
  async function submit() {
    if (saving.value || saved.value) return
    error.value = ''
    saving.value = true
    try {
      if (!allowed.value) throw new Error('無新增權限，或已達三級上限')
      if (!conditions.value) throw new Error('結算條件尚未載入')
      conditions.value.validate()
      const entry = preparePartnerCreation(
        {
          agents: business.agents,
          merchants: business.merchants,
          costs: workspace.costs,
          entries: workspace.journal.entries
        },
        { ...form, kind: props.kind, terms: conditions.value.inputs() },
        {
          roles: user.info.roles || [],
          agentId: user.info.agentId,
          name: user.info.userName || '演示使用者',
          timezone: timezone.value,
          today: platformDate(new Date(), timezone.value),
          providers: providers.state.providers.map((p) => p.id),
          currencies: finance.settlementCurrencies.map((c) => c.code),
          providerCurrencies: Object.fromEntries(
            providers.state.providers.map((p) => [
              p.id,
              p.lines.filter((l) => !generalLineError(p, l, providers.state)).map((l) => l.currency)
            ])
          ),
          providerWallets: Object.fromEntries(
            providers.state.providers.map((p) => [p.id, p.integration?.wallets || []])
          )
        },
        requestId
      )
      workspace.addEntry(entry)
      saved.value = true
      ElMessage.success('基本資料與結算條件已整組保存')
      await router.push(
        isAgent.value
          ? { path: listPath(), query: { q: entry.agent?.code || entry.merchant?.code } }
          : `${listPath()}/${entry.agent?.id || entry.merchant?.id}`
      )
    } catch (e) {
      error.value = e instanceof Error ? e.message : '保存失敗，資料尚未建立'
      await nextTick()
      errorPanel.value?.focus({ preventScroll: true })
      errorPanel.value?.scrollIntoView({ behavior: 'auto', block: 'center' })
    } finally {
      saving.value = false
    }
  }
</script>
<style scoped>
  .partner-create-v2 {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .basic-fields {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0 20px;
  }
  .basic-fields :deep(.el-select),
  .basic-fields :deep(.el-date-editor) {
    width: 100%;
  }
  .create-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  @media (max-width: 1000px) {
    .basic-fields {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 600px) {
    .basic-fields {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
