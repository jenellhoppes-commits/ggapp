<template>
  <section class="report-bets">
    <AppPageHeader
      title="注單管理"
      eyebrow="交易中心"
      description="報表來源的原始逐筆下注・隔離演示・唯讀，不混入舊範本或正式資料。"
      ><template #actions
        ><ElButton @click="back">返回報表</ElButton
        ><ElButton v-if="result && scope.canExport" @click="download"
          >匯出本範圍注單</ElButton
        ></template
      ></AppPageHeader
    >
    <ElAlert v-if="error" :title="error" type="error" :closable="false" />
    <template v-else-if="result">
      <p
        >{{ result.query.from }} 至 {{ result.query.to }} · {{ result.query.currency }} ·
        {{ result.timezone }} · {{ row?.label }} · 截止 {{ result.cutoff }} ·
        {{ result.version }}</p
      >
      <ElAlert
        title="每筆為原始成功下注；退款不抹除成功事實，局級派彩不分配到個別下注。"
        :closable="false"
        type="info"
      />
      <ElForm inline @submit.prevent="apply"
        ><ElFormItem label="局號"
          ><ElInput v-model="roundDraft" placeholder="本範圍內精確局號" clearable /></ElFormItem
        ><ElButton native-type="submit">查詢</ElButton
        ><ElButton @click="reset">重置局號</ElButton></ElForm
      >
      <div class="table-region"
        ><ElTable :data="page.items" :row-key="betKey" border>
          <ElTableColumn prop="id" label="原始下注識別" min-width="150" />
          <ElTableColumn prop="roundId" label="局號" min-width="180" />
          <ElTableColumn prop="time" label="原始下注時間（UTC）" min-width="205" />
          <ElTableColumn prop="merchantName" label="商戶" min-width="160" /><ElTableColumn
            prop="memberId"
            label="會員"
            min-width="120"
          />
          <ElTableColumn prop="gameName" label="遊戲" min-width="160" /><ElTableColumn
            label="下注當時代理"
            min-width="180"
            ><template #default="{ row: b }">{{ agentName(b) }}</template></ElTableColumn
          >
          <ElTableColumn prop="currency" label="原幣別" min-width="100" /><ElTableColumn
            prop="amount"
            label="原始投注金額"
            min-width="140"
            align="right"
          />
          <ElTableColumn label="操作" width="130"
            ><template #default="{ row: b }"
              ><ElButton link type="primary" @click="selected = b">關聯事件</ElButton></template
            ></ElTableColumn
          >
        </ElTable></div
      >
      <div class="pagination"
        ><ElPagination
          :current-page="page.page"
          :page-size="page.size"
          :total="page.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="setPage"
          @size-change="setSize"
      /></div>
    </template>
    <ElDrawer
      :model-value="!!selected"
      @close="selected = undefined"
      title="原始下注與關聯事件"
      size="min(720px, 100%)"
    >
      <template v-if="selected"
        ><ElDescriptions :column="1" border
          ><ElDescriptionsItem label="下注識別">{{ selected.id }}</ElDescriptionsItem
          ><ElDescriptionsItem label="曾成功受理">已成功（原始事件）</ElDescriptionsItem
          ><ElDescriptionsItem label="原始下注"
            >{{ selected.amount }} {{ selected.currency }}</ElDescriptionsItem
          ><ElDescriptionsItem label="局號">{{ selected.roundId }}</ElDescriptionsItem
          ><ElDescriptionsItem label="歷史代理">{{
            agentName(selected)
          }}</ElDescriptionsItem></ElDescriptions
        >
        <p
          >只列同來源、環境、商戶及截止時間內的原始關聯事件。局級事件僅展示關聯，不重複分派金額；無補款或重送操作。</p
        >
        <ElTable :data="events" border
          ><ElTableColumn prop="id" label="事件識別" min-width="125" /><ElTableColumn
            label="類型"
            min-width="90"
            ><template #default="{ row: e }">{{ eventType(e.type) }}</template></ElTableColumn
          ><ElTableColumn prop="amount" label="原幣金額" min-width="120" /><ElTableColumn
            prop="currency"
            label="幣別"
          /><ElTableColumn prop="time" label="時間" min-width="200" /><ElTableColumn label="狀態"
            ><template #default="{ row: e }">{{
              e.success ? '成功' : '失敗'
            }}</template></ElTableColumn
          ></ElTable
        >
        <ElEmpty
          v-if="!events.length"
          :description="
            selected.payoutComplete ? '完整來源未有關聯派彩事件' : '事件來源不完整，資料待確認'
          "
      /></template>
    </ElDrawer>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useReportFourTabs } from '@/composables/useReportFourTabs'
  import {
    parseFourQuery,
    queryFourReports,
    fourQueryUrl,
    betKey,
    reportCsvText,
    type ReportBet,
    type ReportEvent,
    type FourResult
  } from '@/domain/report-four-tabs'
  import { listPage } from '@/domain/list-query'
  const route = useRoute(),
    router = useRouter(),
    { source, scope } = useReportFourTabs(),
    error = ref(''),
    result = ref<FourResult>(),
    selected = ref<ReportBet>(),
    roundDraft = ref('')
  const row = computed(() => result.value?.rows.find((r) => r.key === route.query.reportGroup))
  const bets = computed(
    () =>
      result.value?.bets.filter(
        (b) =>
          row.value?.betKeys.includes(betKey(b)) &&
          (!route.query.roundId || b.roundId === route.query.roundId)
      ) || []
  )
  const page = computed(() =>
    listPage(bets.value, Number(route.query.page) || 1, Number(route.query.size) || 20)
  )
  const events = computed(() => {
    const b = selected.value
    if (!b) return []
    return [
      ...new Map(
        source.events
          .filter(
            (e) =>
              e.environment === scope.value.environment &&
              e.source === b.source &&
              e.providerId === b.providerId &&
              e.merchantId === b.merchantId &&
              scope.value.merchantIds.includes(e.merchantId) &&
              Date.parse(e.time) <= Date.parse(source.cutoff) &&
              e.betKeys.includes(betKey(b))
          )
          .map((e) => [JSON.stringify([e.source, e.environment, e.merchantId, e.id]), e])
      ).values()
    ]
  })
  const eventType = (type: ReportEvent['type']) =>
    ({ payout: '派彩', refund: '退款', transfer: '轉點', rollback: '回滾' })[type]
  const agentName = (b: ReportBet) =>
    b.agent === 'unknown'
      ? '歸屬待確認'
      : b.agent === null
        ? '未歸屬'
        : `${b.agent.code}／${b.agent.name}`
  const back = () =>
    router.push({ path: '/business/reports', query: fourQueryUrl(parseFourQuery(route.query, '')) })
  const apply = () =>
    router.push({
      query: { ...route.query, roundId: roundDraft.value.trim() || undefined, page: '1' }
    })
  const reset = () => {
    roundDraft.value = ''
    apply()
  }
  const setPage = (page: number) => router.push({ query: { ...route.query, page: String(page) } })
  const setSize = (size: number) =>
    router.push({ query: { ...route.query, size: String(size), page: '1' } })
  const download = () => {
    if (!result.value || !scope.value.canView || !scope.value.canViewBets || !scope.value.canExport)
      return
    try {
      const header = [
          '下注識別',
          '局號',
          '下注時間',
          '商戶',
          '會員',
          '遊戲',
          '歷史代理',
          '原幣別',
          '原始下注金額',
          '資料更新時間',
          '來源版本'
        ],
        rows = bets.value.map((b) => [
          b.id,
          b.roundId,
          b.time,
          b.merchantId,
          b.memberId,
          b.gameId,
          agentName(b),
          b.currency,
          b.amount,
          source.cutoff,
          source.version
        ])
      const csv =
          '\uFEFF' +
          [
            header.map((v) => reportCsvText(v)).join(','),
            ...rows.map((r) => r.map((v, i) => reportCsvText(v, i === 8)).join(','))
          ].join('\r\n'),
        link = document.createElement('a')
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
      link.download = `原始注單_${result.value.query.from}_${result.value.query.to}_${result.value.query.currency}.csv`
      document.body.append(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(link.href), 1000)
    } catch {
      ElMessage.error('匯出失敗')
    }
  }
  watch(
    () => [route.fullPath, scope.value],
    () => {
      error.value = ''
      result.value = undefined
      selected.value = undefined
      roundDraft.value = String(route.query.roundId || '')
      try {
        if (!scope.value.canViewBets) throw new Error('無原始注單查看權限')
        if (route.query.reportSource !== source.version)
          throw new Error('來源版本不存在或已過期，請返回報表重新查詢')
        if (
          route.query.environment !== scope.value.environment ||
          route.query.timezone !== scope.value.timezone
        )
          throw new Error('來源環境或平台時區不符，請重新查詢')
        const next = queryFourReports(source, parseFourQuery(route.query, ''), scope.value)
        if (!next.rows.some((r) => r.key === route.query.reportGroup))
          throw new Error('此分組不存在或不在授權範圍')
        result.value = next
      } catch (e) {
        error.value = e instanceof Error ? e.message : '無法查詢此來源'
      }
    },
    { immediate: true }
  )
</script>
<style scoped>
  .report-bets {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .report-bets p {
    overflow-wrap: anywhere;
    line-height: 1.7;
    color: var(--el-text-color-secondary);
  }
  .table-region,
  .pagination {
    max-width: 100%;
    overflow: auto;
  }
</style>
