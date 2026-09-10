<template>
  <section class="agent-integration">
    <AppPageHeader
      title="串接進度"
      description="查看直屬與全部下級商戶的線路進度；不提供技術設定或啟用操作。"
    />
    <ElAlert
      v-if="!scope.own"
      type="error"
      :closable="false"
      title="缺少有效代理身分，無法查詢。"
    />
    <template v-else>
      <AppFilterForm @submit.prevent="search">
        <ElFormItem label="名稱／代碼"
          ><ElInput
            v-model="keyword"
            clearable
            placeholder="商戶、代理 ID 或線路"
            @keyup.enter="search"
        /></ElFormItem>
        <ElFormItem label="環境"
          ><ElSelect v-model="environment" clearable placeholder="全部"
            ><ElOption
              v-for="(label, value) in environments"
              :key="value"
              :label="label"
              :value="value" /></ElSelect
        ></ElFormItem>
        <div class="filter-actions"
          ><ElButton type="primary" @click="search">查詢</ElButton
          ><ElButton @click="reset">重置</ElButton></div
        >
      </AppFilterForm>
      <p>符合條件 {{ filtered.length }} 條線路</p>
      <ArtTable :data="paged" row-key="key">
        <ElTableColumn prop="merchantName" label="商戶" min-width="170" />
        <ElTableColumn prop="merchantCode" label="商戶代碼" min-width="140" />
        <ElTableColumn prop="agentId" label="所屬代理" width="120" />
        <ElTableColumn label="關係" width="100"
          ><template #default="{ row }">{{
            row.direct ? '直屬' : '間接下級'
          }}</template></ElTableColumn
        >
        <ElTableColumn prop="lineUid" label="線路" min-width="180" />
        <ElTableColumn prop="currency" label="幣別" width="80" />
        <ElTableColumn label="環境" width="130"
          ><template #default="{ row }">{{
            environments[row.environment as keyof typeof environments]
          }}</template></ElTableColumn
        >
        <ElTableColumn label="必要測試" width="120"
          ><template #default="{ row }">{{
            row.total ? `${row.passed}/${row.total} 通過` : '尚無測試資料'
          }}</template></ElTableColumn
        >
        <ElTableColumn prop="updatedAt" label="更新時間" min-width="165" />
        <ElTableColumn label="操作" width="90"
          ><template #default="{ row }"
            ><ElButton link type="primary" @click="selectedKey = row.key">查看</ElButton></template
          ></ElTableColumn
        >
      </ArtTable>
      <ElPagination
        v-model:current-page="page"
        :page-size="10"
        :total="filtered.length"
        layout="prev,pager,next"
      />
    </template>
    <ElDialog
      :model-value="!!selected"
      title="串接狀態詳情"
      width="min(620px, calc(100vw - 24px))"
      append-to-body
      @close="selectedKey = ''"
    >
      <template v-if="selected">
        <p>{{ selected.merchantName }} · {{ selected.lineUid }}</p>
        <p>線路狀態：{{ statusText(selected.status) }}</p>
        <h3>環境狀態</h3>
        <ElEmpty v-if="!selected.environments.length" description="尚未設定環境" />
        <p v-for="e in selected.environments" :key="e.environment"
          >{{ e.environment === 'Sandbox' ? '測試環境' : '正式環境' }}：{{ statusText(e.status) }} ·
          {{ e.updatedAt }}</p
        >
        <h3>測試項目</h3>
        <ElEmpty v-if="!selected.tests.length" description="尚無測試紀錄" />
        <p v-for="t in selected.tests" :key="t.id"
          >{{ t.name }}（{{ t.required ? '必要' : '選用' }}）：{{ statusText(t.status) }} ·
          {{ t.testedAt || '尚未測試' }}</p
        >
      </template>
    </ElDialog>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AppFilterForm from '@/components/business/game-provider/app-filter-form/index.vue'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useUserStore } from '@/store/modules/user'
  import { agentScope } from '@/domain/agent-portal'
  import { agentIntegrationRows } from '@/domain/agent-integration'
  const store = useBusinessPartnerStore(),
    user = useUserStore(),
    route = useRoute(),
    router = useRouter()
  const actor = computed(() => ({
    roles: user.info.roles || [],
    agentId: user.info.agentId,
    name: user.info.userName || ''
  }))
  const scope = computed(() => agentScope(store, actor.value))
  const rows = computed(() => agentIntegrationRows(store, actor.value, store.merchantLineTests))
  const environments = { 'Not Configured': '尚未設定', Sandbox: '測試環境', Production: '正式環境' }
  const keyword = ref(String(route.query.q || '')),
    environment = ref(String(route.query.environment || '')),
    page = ref(1),
    selectedKey = ref('')
  const filtered = computed(() =>
    rows.value.filter(
      (r) =>
        (!route.query.environment || r.environment === route.query.environment) &&
        [r.merchantName, r.merchantCode, r.merchantId, r.agentId, r.lineUid]
          .join(' ')
          .toLowerCase()
          .includes(String(route.query.q || '').toLowerCase())
    )
  )
  const paged = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
  const selected = computed(() => rows.value.find((r) => r.key === selectedKey.value))
  const search = () =>
    router.replace({
      query: { q: keyword.value.trim() || undefined, environment: environment.value || undefined }
    })
  const reset = () => {
    keyword.value = ''
    environment.value = ''
    search()
  }
  watch(
    () => route.fullPath,
    () => {
      keyword.value = String(route.query.q || '')
      environment.value = String(route.query.environment || '')
      page.value = 1
      selectedKey.value = ''
    }
  )
  watch(
    () => filtered.value.length,
    () => {
      page.value = 1
    }
  )
  const statusText = (value: string) =>
    (
      ({
        'Not Started': '尚未開始',
        'Not Configured': '尚未設定',
        Configuring: '設定中',
        Testing: '測試中',
        Passed: '通過',
        Failed: '失敗',
        Active: '啟用',
        Disabled: '停用',
        Draft: '草稿',
        Suspended: '暫停',
        Pending: '待處理'
      }) as Record<string, string>
    )[value] || value
</script>
<style scoped>
  .agent-integration {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    min-width: 0;
  }
  .filter-actions {
    display: flex;
    gap: 8px;
  }
  .filter-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
</style>
