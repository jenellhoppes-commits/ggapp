<script setup lang="ts" generic="Row extends object">
import { NDataTable } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { withTableSorters } from '../../utils/tableSort'

withDefaults(defineProps<{
  columns: DataTableColumns<Row>
  data: Row[]
  pagination?: false | PaginationProps
  loading?: boolean
  scrollX?: number
  rowKey?: (row: Row) => string | number
  emptyText?: string
}>(), {
  pagination: false,
  loading: false,
  scrollX: 760,
  rowKey: undefined,
  emptyText: '目前沒有符合條件的資料'
})

</script>

<template>
  <div class="responsive-table" role="region" aria-label="資料表格" tabindex="0">
    <n-data-table
      :columns="withTableSorters(columns)"
      :data="data"
      :pagination="pagination"
      :loading="loading"
      :scroll-x="scrollX"
      :row-key="rowKey"
      :bordered="false"
      size="small"
    >
      <template #empty>
        <div class="py-8 text-center text-sm text-gray-500">{{ emptyText }}</div>
      </template>
    </n-data-table>
  </div>
</template>
