<template>
  <div class="page">
    <AppPageHeader
      title="操作紀錄"
      eyebrow="人員與權限 · 操作紀錄"
      description="查詢後台帳號、角色、權限及資料範圍的敏感異動。"
    >
      <template #actions><ElButton @click="exportRows">匯出查詢結果</ElButton></template>
    </AppPageHeader>
    <ElAlert
      title="操作紀錄為不可修改的稽核資料；正式環境應由後端保存修改前後內容與來源 IP。"
      type="info"
      :closable="false"
      show-icon
    />
    <ElCard shadow="never" class="filter-card">
      <ElForm inline>
        <ElFormItem label="關鍵字"
          ><ElInput v-model="filters.keyword" clearable placeholder="對象、操作人或說明"
        /></ElFormItem>
        <ElFormItem label="資料類型"
          ><ElSelect v-model="filters.entityType" clearable placeholder="全部類型"
            ><ElOption label="後台帳號" value="Account" /><ElOption
              label="角色"
              value="Role" /><ElOption label="操作權限" value="Permission" /><ElOption
              label="敏感權限"
              value="Sensitive Grant" /><ElOption label="資料範圍" value="Data Scope" /></ElSelect
        ></ElFormItem>
        <ElFormItem><ElButton type="primary">查詢</ElButton></ElFormItem
        ><ElFormItem><ElButton @click="reset">重置</ElButton></ElFormItem>
      </ElForm>
    </ElCard>
    <ElCard shadow="never" class="table-card">
      <div class="toolbar"
        ><div
          ><strong>操作紀錄清單</strong><span>共 {{ rows.length }} 筆</span></div
        ><span>最近異動優先顯示</span></div
      >
      <div class="table-region">
        <ElTable :data="pageRows" border row-key="id" empty-text="查無符合條件的操作紀錄">
          <ElTableColumn prop="createdAt" label="操作時間" min-width="165" fixed="left" />
          <ElTableColumn label="資料類型" width="120"
            ><template #default="scope"
              ><ElTag effect="plain">{{ entityLabel(scope.row.entityType) }}</ElTag></template
            ></ElTableColumn
          >
          <ElTableColumn label="對象" min-width="150"
            ><template #default="scope"
              ><strong>{{ scope.row.entityId }}</strong
              ><br /><small>{{ scope.row.id }}</small></template
            ></ElTableColumn
          >
          <ElTableColumn prop="action" label="操作" min-width="160" />
          <ElTableColumn prop="beforeValue" label="修改前" min-width="190" show-overflow-tooltip />
          <ElTableColumn prop="afterValue" label="修改後" min-width="190" show-overflow-tooltip />
          <ElTableColumn prop="operator" label="操作人" min-width="130" />
          <ElTableColumn prop="note" label="說明" min-width="240" show-overflow-tooltip />
          <ElTableColumn label="查看" width="82" fixed="right"
            ><template #default="scope"
              ><ElButton link type="primary" @click="openDetail(scope.row)"
                >詳情</ElButton
              ></template
            ></ElTableColumn
          >
        </ElTable>
      </div>
      <ElPagination
        v-model:current-page="pageNumber"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="rows.length"
        layout="total, sizes, prev, pager, next"
        class="pagination"
      />
    </ElCard>
    <ElDrawer v-model="drawer" title="操作紀錄詳情" size="min(660px, 100%)" destroy-on-close>
      <template v-if="selected">
        <ElDescriptions :column="1" border>
          <ElDescriptionsItem label="紀錄編號">{{ selected.id }}</ElDescriptionsItem>
          <ElDescriptionsItem label="操作時間">{{ selected.createdAt }}</ElDescriptionsItem>
          <ElDescriptionsItem label="資料類型">{{
            entityLabel(selected.entityType)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="異動對象">{{ selected.entityId }}</ElDescriptionsItem>
          <ElDescriptionsItem label="操作">{{ selected.action }}</ElDescriptionsItem>
          <ElDescriptionsItem label="操作人">{{ selected.operator }}</ElDescriptionsItem>
          <ElDescriptionsItem label="修改前">{{ selected.beforeValue || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="修改後">{{ selected.afterValue || '—' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="說明">{{ selected.note || '—' }}</ElDescriptionsItem>
        </ElDescriptions>
        <ElAlert
          class="drawer-alert"
          title="來源 IP、裝置與請求追蹤編號須由正式後端提供，本演示不建立虛構值。"
          type="warning"
          :closable="false"
          show-icon
        />
      </template>
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { usePlatformAccessStore } from '@/store/modules/platformAccess'
  import type { PlatformAccessLog } from '@/types/game-provider'

  defineOptions({ name: 'PlatformOperationLogs' })
  const store = usePlatformAccessStore()
  const filters = reactive({ keyword: '', entityType: '' })
  const pageNumber = ref(1)
  const pageSize = ref(10)
  const drawer = ref(false)
  const selected = ref<PlatformAccessLog>()
  const rows = computed(() =>
    [...store.logs]
      .filter(
        (item) =>
          (!filters.entityType || item.entityType === filters.entityType) &&
          (!filters.keyword ||
            `${item.id}${item.entityId}${item.action}${item.operator}${item.note}`
              .toLowerCase()
              .includes(filters.keyword.toLowerCase()))
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  )
  const pageRows = computed(() => {
    const start = (pageNumber.value - 1) * pageSize.value
    return rows.value.slice(start, start + pageSize.value)
  })
  watch([() => filters.keyword, () => filters.entityType, pageSize], () => (pageNumber.value = 1))
  const reset = () => {
    filters.keyword = ''
    filters.entityType = ''
  }
  const openDetail = (row: PlatformAccessLog) => {
    selected.value = row
    drawer.value = true
  }
  const entityLabel = (type: PlatformAccessLog['entityType']) =>
    ({
      Account: '後台帳號',
      Role: '角色',
      Permission: '操作權限',
      'Sensitive Grant': '敏感權限',
      'Data Scope': '資料範圍'
    })[type]
  const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`
  const exportRows = () => {
    if (!rows.value.length) {
      ElMessage.warning('目前沒有可匯出的操作紀錄')
      return
    }
    const headings = [
      '紀錄編號',
      '操作時間',
      '資料類型',
      '異動對象',
      '操作',
      '修改前',
      '修改後',
      '操作人',
      '說明'
    ]
    const lines = rows.value.map((item) =>
      [
        item.id,
        item.createdAt,
        entityLabel(item.entityType),
        item.entityId,
        item.action,
        item.beforeValue,
        item.afterValue,
        item.operator,
        item.note
      ]
        .map(csvCell)
        .join(',')
    )
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${headings.map(csvCell).join(',')}\n${lines.join('\n')}`], {
        type: 'text/csv;charset=utf-8'
      })
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `GGAP-操作紀錄-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success(`已匯出 ${rows.value.length} 筆操作紀錄`)
  }
</script>

<style scoped lang="scss">
  .page {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding-bottom: 24px;
  }

  .filter-card :deep(.el-card__body) {
    padding-bottom: 2px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    color: var(--art-gray-600);

    > div {
      display: flex;
      gap: 12px;
      align-items: baseline;
    }

    strong {
      font-size: 16px;
      color: var(--art-text-gray-900);
    }
  }

  small {
    color: var(--art-gray-600);
  }

  .table-region {
    width: 100%;
    overflow-x: auto;
  }

  .pagination {
    justify-content: flex-end;
    margin-top: 16px;
  }

  .drawer-alert {
    margin-top: 16px;
  }

  @media (width <= 620px) {
    .toolbar {
      flex-direction: column;
      align-items: flex-start;
    }

    .pagination {
      justify-content: flex-start;
      overflow-x: auto;
    }
  }
</style>
