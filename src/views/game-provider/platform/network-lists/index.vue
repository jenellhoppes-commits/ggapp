<template>
  <section class="page">
    <AppPageHeader
      title="白名單／黑名單"
      eyebrow="系統管理"
      description="管理後台登入、商戶 API、供應商 Callback 與開發者 API 的來源規則。"
      ><template #actions
        ><ElButton v-if="tab !== 'logs'" type="primary" @click="openCreate"
          >新增{{ tab === 'block' ? '黑名單' : '白名單' }}</ElButton
        ></template
      ></AppPageHeader
    >
    <ElAlert
      type="warning"
      :closable="false"
      show-icon
      title="黑名單優先於白名單；本頁為前端規則演示。"
      >正式來源判斷、防止自我鎖定、IPv6 支援與閘道套用結果仍須由後端驗證。商戶只能管理自己的 GGAP
      串接來源，不能查看供應商規則。</ElAlert
    >
    <div class="summary-grid"
      ><ElCard shadow="never"
        ><span>啟用白名單</span><strong>{{ enabledCount('Allow') }}</strong
        ><small>未到期規則</small></ElCard
      ><ElCard shadow="never"
        ><span>啟用黑名單</span><strong>{{ enabledCount('Block') }}</strong
        ><small>優先拒絕</small></ElCard
      ><ElCard shadow="never"
        ><span>已到期</span><strong>{{ expiredCount }}</strong
        ><small>保留歷史，不再生效</small></ElCard
      ></div
    >
    <ElTabs v-model="tab" @tab-change="changeTab"
      ><ElTabPane label="白名單" name="allow" /><ElTabPane label="黑名單" name="block" /><ElTabPane
        label="異動紀錄"
        name="logs"
    /></ElTabs>

    <template v-if="tab !== 'logs'">
      <ElCard shadow="never"
        ><ElForm class="filters" @submit.prevent="applyFilters"
          ><ElFormItem label="關鍵字"
            ><ElInput
              v-model="draft.keyword"
              clearable
              placeholder="編號、IP、網域或備註" /></ElFormItem
          ><ElFormItem label="用途"
            ><ElSelect v-model="draft.scope" clearable placeholder="全部用途"
              ><ElOption
                v-for="(label, value) in networkScopeLabels"
                :key="value"
                :label="label"
                :value="value" /></ElSelect></ElFormItem
          ><ElFormItem label="環境"
            ><ElSelect v-model="draft.environment" clearable placeholder="全部環境"
              ><ElOption label="正式環境" value="Production" /><ElOption
                label="測試環境"
                value="Sandbox" /><ElOption label="全部環境" value="All" /></ElSelect></ElFormItem
          ><ElFormItem label="狀態"
            ><ElSelect v-model="draft.status" clearable placeholder="全部狀態"
              ><ElOption label="啟用" value="Enabled" /><ElOption
                label="停用"
                value="Disabled" /><ElOption
                label="已到期"
                value="Expired" /></ElSelect></ElFormItem
          ><div class="actions"
            ><ElButton native-type="submit" type="primary">查詢</ElButton
            ><ElButton @click="resetFilters">重置</ElButton></div
          ></ElForm
        ></ElCard
      >
      <ElCard shadow="never"
        ><div class="table-heading"
          ><strong>{{ tab === 'block' ? '黑名單' : '白名單' }}規則</strong
          ><span>共 {{ filtered.length }} 筆</span></div
        ><div class="table-region"
          ><ElTable :data="pageItems" border row-key="id" empty-text="沒有符合條件的規則"
            ><ElTableColumn prop="id" label="規則編號" min-width="130" /><ElTableColumn
              label="規則值"
              min-width="210"
              ><template #default="{ row }"
                ><div class="identity"
                  ><strong>{{ row.value }}</strong
                  ><small>{{ row.valueType }}</small></div
                ></template
              ></ElTableColumn
            ><ElTableColumn label="用途" min-width="150"
              ><template #default="{ row }">{{
                networkScopeLabels[row.scope as NetworkScope]
              }}</template></ElTableColumn
            ><ElTableColumn label="環境" width="110"
              ><template #default="{ row }">{{
                environmentLabel(row.environment)
              }}</template></ElTableColumn
            ><ElTableColumn prop="merchant" label="限定商戶" min-width="180"
              ><template #default="{ row }">{{ row.merchant || '不限定' }}</template></ElTableColumn
            ><ElTableColumn prop="expiresAt" label="到期時間" min-width="175"
              ><template #default="{ row }">{{ row.expiresAt || '永久' }}</template></ElTableColumn
            ><ElTableColumn label="狀態" width="100"
              ><template #default="{ row }"
                ><ElTag
                  :type="
                    isRuleExpired(row) ? 'info' : row.status === 'Enabled' ? 'success' : 'info'
                  "
                  >{{
                    isRuleExpired(row) ? '已到期' : row.status === 'Enabled' ? '啟用' : '停用'
                  }}</ElTag
                ></template
              ></ElTableColumn
            ><ElTableColumn
              prop="note"
              label="備註"
              min-width="190"
              show-overflow-tooltip
            /><ElTableColumn label="操作" fixed="right" width="155"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="openEdit(row)">編輯</ElButton
                ><ElButton
                  link
                  :type="row.status === 'Enabled' ? 'danger' : 'success'"
                  :disabled="isRuleExpired(row)"
                  @click="toggle(row)"
                  >{{ row.status === 'Enabled' ? '停用' : '啟用' }}</ElButton
                ></template
              ></ElTableColumn
            ></ElTable
          ></div
        ><ElPagination
          v-model:current-page="pageNumber"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filtered.length"
          layout="total, sizes, prev, pager, next"
          class="pagination"
      /></ElCard>
    </template>

    <ElCard v-else shadow="never"
      ><div class="table-heading"
        ><strong>名單異動紀錄</strong><span>共 {{ networkLogs.length }} 筆</span></div
      ><div class="table-region"
        ><ElTable :data="networkLogs" border row-key="id"
          ><ElTableColumn prop="createdAt" label="時間" min-width="170" /><ElTableColumn
            prop="action"
            label="操作"
            min-width="170" /><ElTableColumn
            prop="target"
            label="規則"
            min-width="135" /><ElTableColumn
            prop="detail"
            label="內容"
            min-width="230" /><ElTableColumn
            prop="operator"
            label="操作人"
            min-width="140" /></ElTable></div
    ></ElCard>

    <ElDrawer
      v-model="drawer"
      :title="form.id ? '編輯存取規則' : `新增${form.listType === 'Block' ? '黑名單' : '白名單'}`"
      size="min(680px, 100%)"
      destroy-on-close
      ><ElForm label-position="top"
        ><div class="form-grid"
          ><ElFormItem label="名單類型"
            ><ElRadioGroup v-model="form.listType" :disabled="Boolean(form.id)"
              ><ElRadioButton value="Allow">白名單</ElRadioButton
              ><ElRadioButton value="Block">黑名單</ElRadioButton></ElRadioGroup
            ></ElFormItem
          ><ElFormItem label="狀態"
            ><ElSelect v-model="form.status" class="full"
              ><ElOption label="啟用" value="Enabled" /><ElOption
                label="停用"
                value="Disabled" /></ElSelect></ElFormItem
          ><ElFormItem label="用途" required
            ><ElSelect v-model="form.scope" class="full"
              ><ElOption
                v-for="(label, value) in networkScopeLabels"
                :key="value"
                :label="label"
                :value="value" /></ElSelect></ElFormItem
          ><ElFormItem label="環境" required
            ><ElSelect v-model="form.environment" class="full"
              ><ElOption label="正式環境" value="Production" /><ElOption
                label="測試環境"
                value="Sandbox" /><ElOption label="全部環境" value="All" /></ElSelect></ElFormItem
          ><ElFormItem label="規則類型" required
            ><ElSelect v-model="form.valueType" class="full"
              ><ElOption label="單一 IPv4" value="IPv4" /><ElOption
                label="IPv4 CIDR"
                value="CIDR" /><ElOption label="網域" value="Domain" /></ElSelect></ElFormItem
          ><ElFormItem label="IP、CIDR 或網域" required :error="valueError"
            ><ElInput
              v-model="form.value"
              :placeholder="valuePlaceholder"
              @blur="validateValue" /></ElFormItem
          ><ElFormItem label="限定商戶"
            ><ElSelect v-model="form.merchant" clearable class="full" placeholder="不限定"
              ><ElOption label="M00001｜Demo Merchant" value="M00001｜Demo Merchant" /><ElOption
                label="M00002｜Asia Partner"
                value="M00002｜Asia Partner" /><ElOption
                label="M00003｜North Star"
                value="M00003｜North Star" /></ElSelect></ElFormItem
          ><ElFormItem label="到期時間"
            ><ElDatePicker
              v-model="form.expiresAt"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              placeholder="留空表示永久"
              class="full" /></ElFormItem></div
        ><ElFormItem label="備註" required
          ><ElInput
            v-model="form.note"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit /></ElFormItem
        ><ElAlert
          v-if="form.listType === 'Allow' && form.scope === 'AdminLogin'"
          title="正式儲存前必須由後端確認目前來源仍可登入，避免管理員把自己鎖在系統外。"
          type="warning"
          :closable="false" /></ElForm
      ><template #footer
        ><ElButton @click="drawer = false">取消</ElButton
        ><ElButton type="primary" @click="save">儲存規則</ElButton></template
      ></ElDrawer
    >
  </section>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { usePlatformOperationsStore } from '@/store/modules/platformOperations'
  import {
    isRuleExpired,
    networkScopeLabels,
    validateNetworkValue,
    type NetworkEnvironment,
    type NetworkRule,
    type NetworkRuleStatus,
    type NetworkRuleType,
    type NetworkScope,
    type NetworkValueType
  } from '@/domain/platform-operations'
  defineOptions({ name: 'PlatformNetworkLists' })
  const route = useRoute(),
    router = useRouter(),
    store = usePlatformOperationsStore(),
    tab = ref(String(route.query.tab || 'allow'))
  const draft = reactive({ keyword: '', scope: '', environment: '', status: '' }),
    applied = reactive({ keyword: '', scope: '', environment: '', status: '' }),
    pageNumber = ref(1),
    pageSize = ref(20),
    drawer = ref(false),
    valueError = ref('')
  const emptyForm = (type: NetworkRuleType = 'Allow') => ({
    id: '',
    listType: type,
    scope: 'AdminLogin' as NetworkScope,
    valueType: 'IPv4' as NetworkValueType,
    value: '',
    environment: 'Production' as NetworkEnvironment,
    merchant: '',
    expiresAt: '',
    note: '',
    status: 'Enabled' as NetworkRuleStatus
  })
  const form = reactive(emptyForm())
  const currentType = computed<NetworkRuleType>(() => (tab.value === 'block' ? 'Block' : 'Allow'))
  const enabledCount = (type: NetworkRuleType) =>
    store.networkRules.filter(
      (item) => item.listType === type && item.status === 'Enabled' && !isRuleExpired(item)
    ).length
  const expiredCount = computed(
    () => store.networkRules.filter((item) => isRuleExpired(item)).length
  )
  const networkLogs = computed(() => store.logs.filter((item) => item.module === 'NetworkList'))
  const filtered = computed(() =>
    store.networkRules.filter(
      (item) =>
        item.listType === currentType.value &&
        (!applied.keyword ||
          `${item.id} ${item.value} ${item.note}`
            .toLowerCase()
            .includes(applied.keyword.toLowerCase())) &&
        (!applied.scope || item.scope === applied.scope) &&
        (!applied.environment || item.environment === applied.environment) &&
        (!applied.status ||
          (applied.status === 'Expired'
            ? isRuleExpired(item)
            : item.status === applied.status && !isRuleExpired(item)))
    )
  )
  const pageItems = computed(() =>
    filtered.value.slice((pageNumber.value - 1) * pageSize.value, pageNumber.value * pageSize.value)
  )
  const environmentLabel = (value: NetworkEnvironment) =>
    ({ Production: '正式', Sandbox: '測試', All: '全部' })[value]
  const valuePlaceholder = computed(() =>
    form.valueType === 'IPv4'
      ? '例如 203.0.113.10'
      : form.valueType === 'CIDR'
        ? '例如 203.0.113.0/24'
        : '例如 api.example.com'
  )
  const changeTab = (value: string | number) =>
    router.replace({ query: { ...route.query, tab: String(value) } })
  const applyFilters = () => {
    Object.assign(applied, draft)
    pageNumber.value = 1
  }
  const resetFilters = () => {
    Object.assign(draft, { keyword: '', scope: '', environment: '', status: '' })
    applyFilters()
  }
  const openCreate = () => {
    Object.assign(form, emptyForm(currentType.value))
    valueError.value = ''
    drawer.value = true
  }
  const openEdit = (row: NetworkRule) => {
    Object.assign(form, { ...row })
    valueError.value = ''
    drawer.value = true
  }
  const validateValue = () => (valueError.value = validateNetworkValue(form.value, form.valueType))
  const save = () => {
    validateValue()
    if (valueError.value) return
    if (!form.note.trim()) return ElMessage.warning('請填寫新增或調整原因')
    if (form.expiresAt && new Date(form.expiresAt).getTime() <= Date.now())
      return ElMessage.warning('到期時間必須晚於目前時間')
    const result = store.saveNetworkRule({
      id: form.id || undefined,
      listType: form.listType,
      scope: form.scope,
      valueType: form.valueType,
      value: form.value,
      environment: form.environment,
      merchant: form.merchant,
      expiresAt: form.expiresAt,
      note: form.note.trim(),
      status: form.status
    })
    if (!result.ok) return ElMessage.warning(result.message)
    drawer.value = false
    ElMessage.success('存取規則已儲存')
  }
  const toggle = async (row: NetworkRule) => {
    await ElMessageBox.confirm(
      `確定${row.status === 'Enabled' ? '停用' : '啟用'}規則 ${row.id}？`,
      `${row.status === 'Enabled' ? '停用' : '啟用'}存取規則`,
      { type: 'warning' }
    )
    store.toggleNetworkRule(row.id)
    ElMessage.success('規則狀態已更新')
  }
  watch(
    () => route.query.tab,
    (value) => {
      const next = String(value || 'allow')
      tab.value = ['allow', 'block', 'logs'].includes(next) ? next : 'allow'
      pageNumber.value = 1
    },
    { immediate: true }
  )
</script>

<style scoped>
  .page {
    display: grid;
    gap: 16px;
    min-width: 0;
    padding-bottom: 24px;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .summary-grid span,
  .summary-grid small {
    display: block;
    color: var(--el-text-color-secondary);
  }
  .summary-grid strong {
    display: block;
    margin: 10px 0;
    font-size: 26px;
  }
  .filters {
    display: grid;
    grid-template-columns: minmax(210px, 1.2fr) repeat(3, minmax(145px, 0.7fr)) auto;
    gap: 12px;
    align-items: end;
  }
  .filters :deep(.el-form-item) {
    margin-bottom: 0;
  }
  .filters :deep(.el-select),
  .full {
    width: 100%;
  }
  .actions,
  .table-heading {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .table-heading {
    justify-content: space-between;
    margin-bottom: 14px;
  }
  .table-heading span,
  .identity small {
    color: var(--el-text-color-secondary);
  }
  .identity {
    display: grid;
    gap: 4px;
  }
  .table-region,
  .pagination {
    max-width: 100%;
    overflow: auto;
  }
  .pagination {
    padding-top: 16px;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 14px;
  }
  @media (max-width: 900px) {
    .filters {
      grid-template-columns: 1fr 1fr;
    }
    .actions {
      grid-column: 1/-1;
    }
  }
  @media (max-width: 720px) {
    .summary-grid,
    .filters,
    .form-grid {
      grid-template-columns: 1fr;
    }
    .actions {
      grid-column: auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .actions :deep(.el-button) {
      margin-left: 0;
    }
    .table-heading {
      align-items: flex-start;
    }
  }
</style>
