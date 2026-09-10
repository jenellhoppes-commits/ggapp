<template>
  <section class="page">
    <AppPageHeader
      title="維護設定"
      eyebrow="系統管理"
      description="集中管理緊急維護、預定排程與影響範圍；既有交易回呼不因前端設定中斷。"
    >
      <template #actions
        ><ElButton type="primary" @click="openCreate">新增維護排程</ElButton></template
      >
    </AppPageHeader>
    <ElTabs v-model="tab" @tab-change="changeTab"
      ><ElTabPane label="維護狀態" name="status" /><ElTabPane
        label="維護排程"
        name="schedules" /><ElTabPane label="異動紀錄" name="logs"
    /></ElTabs>

    <template v-if="tab === 'status'">
      <div class="summary-grid">
        <ElCard shadow="never"
          ><span>目前狀態</span
          ><strong :class="{ danger: systemStore.basicSettings.maintenanceMode }">{{
            systemStore.basicSettings.maintenanceMode ? '維護中' : '正常服務'
          }}</strong
          ><small>一般後台登入</small></ElCard
        >
        <ElCard shadow="never"
          ><span>待處理排程</span><strong>{{ scheduledCount }}</strong
          ><small>已排程或進行中</small></ElCard
        >
        <ElCard shadow="never"
          ><span>最近更新</span
          ><strong class="compact">{{ systemStore.basicSettings.updatedAt }}</strong
          ><small>{{ systemStore.basicSettings.updatedBy }}</small></ElCard
        >
      </div>
      <ElCard shadow="never"
        ><template #header><strong>緊急維護模式</strong></template
        ><ElForm label-position="top" class="emergency-form"
          ><ElFormItem label="維護模式"
            ><ElSwitch
              v-model="emergency.enabled"
              active-text="啟用"
              inactive-text="關閉" /></ElFormItem
          ><ElFormItem label="顯示訊息"
            ><ElInput
              v-model="emergency.message"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit /></ElFormItem
          ><div class="actions"
            ><ElButton @click="restoreEmergency">還原</ElButton
            ><ElButton type="primary" @click="saveEmergency">儲存維護狀態</ElButton></div
          ></ElForm
        ></ElCard
      >
      <ElCard shadow="never"
        ><template #header><strong>固定處理原則</strong></template
        ><ElDescriptions :column="1" border
          ><ElDescriptionsItem label="阻擋"
            >選定入口的新登入、商戶 API 新請求或新遊戲啟動</ElDescriptionsItem
          ><ElDescriptionsItem label="不中斷"
            >既有 Session、派彩、退款、查單、供應商 Callback</ElDescriptionsItem
          ><ElDescriptionsItem label="復原權限">超級管理員仍可登入並關閉維護模式</ElDescriptionsItem
          ><ElDescriptionsItem label="資料責任"
            >前端只維護設定及演示紀錄；正式排程、權限與執行結果由後端驗證</ElDescriptionsItem
          ></ElDescriptions
        ></ElCard
      >
    </template>

    <template v-else-if="tab === 'schedules'">
      <ElCard shadow="never"
        ><ElForm class="filters" @submit.prevent="applyFilters"
          ><ElFormItem label="關鍵字"
            ><ElInput v-model="draft.keyword" clearable placeholder="編號或名稱" /></ElFormItem
          ><ElFormItem label="狀態"
            ><ElSelect v-model="draft.status" clearable placeholder="全部狀態"
              ><ElOption
                v-for="(label, value) in maintenanceStatusLabels"
                :key="value"
                :label="label"
                :value="value" /></ElSelect></ElFormItem
          ><div class="actions"
            ><ElButton native-type="submit" type="primary">查詢</ElButton
            ><ElButton @click="resetFilters">重置</ElButton></div
          ></ElForm
        ></ElCard
      >
      <ElCard shadow="never"
        ><div class="table-heading"
          ><strong>維護排程</strong><span>共 {{ filtered.length }} 筆</span></div
        ><div class="table-region"
          ><ArtTable
            :data="pageItems"
            row-key="id"
            empty-text="沒有符合條件的維護排程"
            height="auto"
            empty-height="auto"
            :show-table-header="false"
            style="height: auto"
            ><ElTableColumn prop="id" label="排程編號" min-width="145" /><ElTableColumn
              prop="name"
              label="名稱"
              min-width="180"
            /><ElTableColumn label="影響範圍" min-width="250"
              ><template #default="{ row }"
                ><ElTag
                  v-for="target in row.targets"
                  :key="target"
                  class="target-tag"
                  effect="plain"
                  >{{ maintenanceTargetLabels[target as MaintenanceTarget] }}</ElTag
                ></template
              ></ElTableColumn
            ><ElTableColumn label="期間" min-width="320"
              ><template #default="{ row }"
                >{{ row.startAt }} ～ {{ row.endAt }}</template
              ></ElTableColumn
            ><ElTableColumn label="狀態" width="105"
              ><template #default="{ row }"
                ><ElTag :type="statusTag(row.status)">{{
                  maintenanceStatusLabels[row.status as MaintenanceStatus]
                }}</ElTag></template
              ></ElTableColumn
            ><ElTableColumn prop="updatedAt" label="更新時間" min-width="170" /><ElTableColumn
              label="操作"
              fixed="right"
              width="150"
              ><template #default="{ row }"
                ><ElButton link type="primary" @click="openEdit(row)">{{
                  row.status === 'Scheduled' ? '查看／編輯' : '查看'
                }}</ElButton
                ><ElButton v-if="row.status === 'Scheduled'" link type="danger" @click="cancel(row)"
                  >取消</ElButton
                ></template
              ></ElTableColumn
            ></ArtTable
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
        ><strong>維護設定異動紀錄</strong><span>共 {{ maintenanceLogs.length }} 筆</span></div
      ><div class="table-region"
        ><ArtTable
          :data="maintenanceLogs"
          row-key="id"
          height="auto"
          empty-height="auto"
          :show-table-header="false"
          style="height: auto"
          empty-text="暫無資料"
          ><ElTableColumn prop="createdAt" label="時間" min-width="170" /><ElTableColumn
            prop="action"
            label="操作"
            min-width="160" /><ElTableColumn
            prop="target"
            label="對象"
            min-width="150" /><ElTableColumn
            prop="detail"
            label="內容"
            min-width="220" /><ElTableColumn
            prop="operator"
            label="操作人"
            min-width="130" /></ArtTable></div
    ></ElCard>

    <ElDrawer
      v-model="drawer"
      :title="form.id ? '維護排程詳細' : '新增維護排程'"
      size="min(680px, 100%)"
      destroy-on-close
      ><ElForm label-position="top"
        ><ElFormItem label="排程名稱" required
          ><ElInput
            v-model="form.name"
            :disabled="readOnly"
            maxlength="60"
            show-word-limit /></ElFormItem
        ><ElFormItem label="維護期間" required
          ><ElDatePicker
            v-model="form.range"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="開始時間"
            end-placeholder="結束時間"
            range-separator="至"
            :disabled="readOnly"
            class="full" /></ElFormItem
        ><ElFormItem label="影響範圍" required
          ><ElCheckboxGroup v-model="form.targets"
            ><ElCheckbox
              v-for="(label, value) in maintenanceTargetLabels"
              :key="value"
              :value="value"
              :disabled="readOnly"
              >{{ label }}</ElCheckbox
            ></ElCheckboxGroup
          ></ElFormItem
        ><ElAlert
          title="選擇商戶 API 不會自動中斷供應商 Callback；選擇新遊戲啟動也不會關閉既有 Session。"
          type="info"
          :closable="false" /><ElFormItem label="對外顯示訊息" required
          ><ElInput
            v-model="form.message"
            type="textarea"
            :rows="3"
            :disabled="readOnly"
            maxlength="200"
            show-word-limit /></ElFormItem
        ><ElFormItem label="內部備註"
          ><ElInput
            v-model="form.note"
            type="textarea"
            :rows="3"
            :disabled="readOnly"
            maxlength="300"
            show-word-limit /></ElFormItem></ElForm
      ><template #footer
        ><ElButton @click="drawer = false">取消</ElButton
        ><ElButton v-if="!readOnly" type="primary" @click="saveSchedule"
          >儲存排程</ElButton
        ></template
      ></ElDrawer
    >
  </section>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { usePlatformOperationsStore } from '@/store/modules/platformOperations'
  import { usePlatformSystemStore } from '@/store/modules/platformSystem'
  import {
    maintenanceRangeError,
    maintenanceStatusLabels,
    maintenanceTargetLabels,
    type MaintenanceStatus,
    type MaintenanceTarget,
    type MaintenanceWindow
  } from '@/domain/platform-operations'
  defineOptions({ name: 'PlatformMaintenance' })
  const route = useRoute(),
    router = useRouter(),
    store = usePlatformOperationsStore(),
    systemStore = usePlatformSystemStore()
  const tab = ref(String(route.query.tab || 'status')),
    emergency = reactive({
      enabled: systemStore.basicSettings.maintenanceMode,
      message: systemStore.basicSettings.maintenanceMessage
    })
  const draft = reactive({ keyword: '', status: '' }),
    applied = reactive({ keyword: '', status: '' }),
    pageNumber = ref(1),
    pageSize = ref(20),
    drawer = ref(false)
  const emptyForm = () => ({
    id: '',
    name: '',
    range: [] as string[],
    targets: [] as MaintenanceTarget[],
    message: '',
    note: '',
    status: 'Scheduled' as MaintenanceStatus
  })
  const form = reactive(emptyForm())
  const readOnly = computed(() => Boolean(form.id && form.status !== 'Scheduled'))
  const scheduledCount = computed(
    () =>
      store.maintenanceWindows.filter((item) => ['Scheduled', 'Active'].includes(item.status))
        .length
  )
  const maintenanceLogs = computed(() => store.logs.filter((item) => item.module === 'Maintenance'))
  const filtered = computed(() =>
    store.maintenanceWindows.filter(
      (item) =>
        (!applied.keyword ||
          `${item.id} ${item.name}`.toLowerCase().includes(applied.keyword.toLowerCase())) &&
        (!applied.status || item.status === applied.status)
    )
  )
  const pageItems = computed(() =>
    filtered.value.slice((pageNumber.value - 1) * pageSize.value, pageNumber.value * pageSize.value)
  )
  const statusTag = (status: MaintenanceStatus) =>
    status === 'Active'
      ? 'danger'
      : status === 'Scheduled'
        ? 'warning'
        : status === 'Completed'
          ? 'success'
          : 'info'
  const changeTab = (value: string | number) =>
    router.replace({ query: { ...route.query, tab: String(value) } })
  const restoreEmergency = () =>
    Object.assign(emergency, {
      enabled: systemStore.basicSettings.maintenanceMode,
      message: systemStore.basicSettings.maintenanceMessage
    })
  const saveEmergency = async () => {
    if (emergency.enabled && !emergency.message.trim())
      return ElMessage.warning('啟用維護模式時必須填寫顯示訊息')
    if (emergency.enabled !== systemStore.basicSettings.maintenanceMode)
      await ElMessageBox.confirm(
        emergency.enabled
          ? '啟用後一般後台使用者將無法登入，確定繼續？'
          : '確定結束緊急維護並恢復一般登入？',
        emergency.enabled ? '啟用緊急維護' : '結束緊急維護',
        { type: 'warning' }
      )
    systemStore.saveBasicSettings({
      maintenanceMode: emergency.enabled,
      maintenanceMessage: emergency.message.trim()
    })
    store.logMaintenanceAction(
      emergency.enabled ? '啟用緊急維護' : '結束緊急維護',
      'GLOBAL',
      emergency.message.trim()
    )
    ElMessage.success('維護狀態已儲存')
  }
  const applyFilters = () => {
    Object.assign(applied, draft)
    pageNumber.value = 1
  }
  const resetFilters = () => {
    Object.assign(draft, { keyword: '', status: '' })
    applyFilters()
  }
  const openCreate = () => {
    Object.assign(form, emptyForm())
    drawer.value = true
  }
  const openEdit = (row: MaintenanceWindow) => {
    Object.assign(form, { ...row, range: [row.startAt, row.endAt], targets: [...row.targets] })
    drawer.value = true
  }
  const saveSchedule = () => {
    if (!form.name.trim()) return ElMessage.warning('請填寫排程名稱')
    const error = maintenanceRangeError(form.range[0], form.range[1])
    if (error) return ElMessage.warning(error)
    if (!form.targets.length) return ElMessage.warning('請至少選擇一個影響範圍')
    if (!form.message.trim()) return ElMessage.warning('請填寫對外顯示訊息')
    store.saveMaintenance({
      id: form.id || undefined,
      name: form.name.trim(),
      startAt: form.range[0],
      endAt: form.range[1],
      targets: [...form.targets],
      message: form.message.trim(),
      note: form.note.trim(),
      status: form.status
    })
    drawer.value = false
    ElMessage.success('維護排程已儲存')
  }
  const cancel = async (row: MaintenanceWindow) => {
    await ElMessageBox.confirm(`確定取消「${row.name}」？歷史紀錄仍會保留。`, '取消維護排程', {
      type: 'warning'
    })
    store.changeMaintenanceStatus(row.id, 'Cancelled')
    ElMessage.success('維護排程已取消')
  }
  watch(
    () => route.query.tab,
    (value) => {
      const next = String(value || 'status')
      tab.value = ['status', 'schedules', 'logs'].includes(next) ? next : 'status'
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
    font-size: 24px;
  }
  .summary-grid .compact {
    font-size: 18px;
  }
  .danger {
    color: var(--el-color-danger);
  }
  .emergency-form {
    max-width: 760px;
  }
  .full,
  .filters :deep(.el-select) {
    width: 100%;
  }
  .filters {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(180px, 0.6fr) auto;
    gap: 12px;
    align-items: end;
  }
  .filters :deep(.el-form-item) {
    margin-bottom: 0;
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
  .table-heading span {
    color: var(--el-text-color-secondary);
  }
  .table-region,
  .pagination {
    max-width: 100%;
    overflow: auto;
  }
  .pagination {
    padding-top: 16px;
  }
  .target-tag {
    margin: 2px 4px 2px 0;
  }
  @media (max-width: 720px) {
    .summary-grid,
    .filters {
      grid-template-columns: 1fr;
    }
    .actions {
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
