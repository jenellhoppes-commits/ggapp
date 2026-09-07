<template>
  <div class="developer-page">
    <AppPageHeader
      title="開發者中心"
      eyebrow="系統管理 · 串接與 API"
      description="集中查看環境、驗證、請求規則與完整 API 文件；供應商憑證仍由供應商詳情專用操作管理。"
    >
      <template #actions>
        <ElButton @click="copyBaseUrl">複製測試端點</ElButton>
        <ElButton type="primary" @click="openSpecFile">匯入 OpenAPI JSON</ElButton>
        <input
          ref="specFileInput"
          class="visually-hidden"
          type="file"
          accept="application/json,.json"
          @change="importSpec"
        />
      </template>
    </AppPageHeader>

    <ElAlert
      type="warning"
      :closable="false"
      show-icon
      title="目前為前端文件工具演示；預設規格不是正式契約，也不包含可用憑證。"
      description="正式上線時請匯入經版本核准的完整 OpenAPI JSON，並由後端權限控制可查看的環境與文件版本。"
    />

    <div class="summary-grid">
      <div
        ><span>文件版本</span><strong>{{ apiSpec.info?.version || '未標示' }}</strong
        ><small>{{ importedFileName || '內建示範規格' }}</small></div
      >
      <div
        ><span>API 端點</span><strong>{{ endpoints.length }}</strong
        ><small>依 OpenAPI paths 自動解析</small></div
      >
      <div><span>測試環境</span><strong>Sandbox</strong><small>與正式資金及會員隔離</small></div>
      <div><span>驗證方式</span><strong>HMAC</strong><small>簽章、時間戳與防重識別</small></div>
    </div>

    <ElCard shadow="never" class="content-card">
      <ElTabs v-model="activeTab" @tab-change="syncTab">
        <ElTabPane label="串接資訊" name="integration">
          <div class="section-grid">
            <section>
              <div class="section-heading"
                ><h2>環境與端點</h2><p>所有範例網域均不可連線，避免誤用為正式服務。</p></div
              >
              <ElDescriptions :column="descriptionColumns" border>
                <ElDescriptionsItem label="測試 Base URL"
                  ><code>{{ sandboxUrl }}</code></ElDescriptionsItem
                >
                <ElDescriptionsItem label="正式 Base URL"
                  >由上線文件及授權後提供</ElDescriptionsItem
                >
                <ElDescriptionsItem label="內容格式">application/json</ElDescriptionsItem>
                <ElDescriptionsItem label="時間標準">UTC，ISO 8601</ElDescriptionsItem>
                <ElDescriptionsItem label="Trace ID"
                  >每次請求與 Callback 必須保留</ElDescriptionsItem
                >
                <ElDescriptionsItem label="測試資料">隔離 Wallet 與測試會員</ElDescriptionsItem>
              </ElDescriptions>
            </section>

            <section>
              <div class="section-heading"
                ><h2>請求與安全規則</h2
                ><p>憑證只顯示識別與遮罩，不在文件或網址保存 Secret。</p></div
              >
              <div class="rule-list">
                <div v-for="rule in integrationRules" :key="rule.title">
                  <ArtSvgIcon :icon="rule.icon" />
                  <span
                    ><strong>{{ rule.title }}</strong
                    ><small>{{ rule.description }}</small></span
                  >
                </div>
              </div>
            </section>
          </div>
        </ElTabPane>

        <ElTabPane label="API 文件" name="api">
          <div class="api-toolbar">
            <div
              ><strong>OpenAPI 文件工具</strong
              ><span>匯入規格後會自動建立端點、請求與回應內容。</span></div
            >
            <ElSpace wrap>
              <ElInput v-model="keyword" clearable placeholder="搜尋路徑、名稱或標籤" />
              <ElSelect v-model="selectedTag" clearable placeholder="全部標籤">
                <ElOption v-for="tag in tags" :key="tag" :label="tag" :value="tag" />
              </ElSelect>
              <ElButton @click="downloadSpec">下載目前規格</ElButton>
            </ElSpace>
          </div>

          <ElEmpty v-if="!filteredEndpoints.length" description="沒有符合條件的 API 端點" />
          <ElCollapse v-else v-model="openedEndpoints" accordion class="endpoint-list">
            <ElCollapseItem
              v-for="endpointItem in filteredEndpoints"
              :key="endpointItem.key"
              :name="endpointItem.key"
            >
              <template #title>
                <div class="endpoint-title">
                  <span class="method" :class="endpointItem.method.toLowerCase()">{{
                    endpointItem.method
                  }}</span>
                  <code>{{ endpointItem.path }}</code>
                  <strong>{{ endpointItem.summary }}</strong>
                  <ElTag size="small" effect="plain">{{ endpointItem.tag }}</ElTag>
                </div>
              </template>
              <div class="endpoint-body">
                <p>{{ endpointItem.description || '此端點尚未提供補充說明。' }}</p>
                <ElDescriptions :column="descriptionColumns" border>
                  <ElDescriptionsItem label="operationId">{{
                    endpointItem.operationId || '—'
                  }}</ElDescriptionsItem>
                  <ElDescriptionsItem label="驗證">HMAC 簽章</ElDescriptionsItem>
                </ElDescriptions>
                <div class="code-grid">
                  <div
                    ><h3>請求內容</h3><pre>{{ endpointItem.requestExample }}</pre>
                  </div>
                  <div
                    ><h3>回應內容</h3><pre>{{ endpointItem.responseExample }}</pre>
                  </div>
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </ElTabPane>

        <ElTabPane label="Callback 與錯誤碼" name="callback">
          <div class="section-grid">
            <section>
              <div class="section-heading"
                ><h2>Callback 處理</h2><p>下注、派彩與退款必須可重試且防止重複入帳。</p></div
              >
              <ElTimeline>
                <ElTimelineItem
                  v-for="step in callbackSteps"
                  :key="step.title"
                  :timestamp="step.code"
                  placement="top"
                >
                  <strong>{{ step.title }}</strong
                  ><p>{{ step.description }}</p>
                </ElTimelineItem>
              </ElTimeline>
            </section>
            <section>
              <div class="section-heading"
                ><h2>共用錯誤碼</h2><p>正式清單以核准的 OpenAPI 規格為準。</p></div
              >
              <ElTable :data="errorCodes" border>
                <ElTableColumn prop="code" label="錯誤碼" width="150" />
                <ElTableColumn prop="http" label="HTTP" width="90" />
                <ElTableColumn prop="meaning" label="說明" min-width="180" />
                <ElTableColumn prop="retry" label="建議處理" min-width="220" />
              </ElTable>
            </section>
          </div>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'

  defineOptions({ name: 'DeveloperCenter' })

  type OpenApiOperation = {
    summary?: string
    description?: string
    operationId?: string
    tags?: string[]
    requestBody?: unknown
    responses?: Record<string, unknown>
    [key: string]: unknown
  }
  type OpenApiDocument = {
    openapi: string
    info: { title?: string; version?: string }
    servers?: Array<{ url: string; description?: string }>
    paths: Record<string, Record<string, OpenApiOperation>>
  }

  const route = useRoute()
  const router = useRouter()
  const { width } = useWindowSize()
  const descriptionColumns = computed(() => (width.value < 760 ? 1 : 2))
  const activeTab = ref(
    ['integration', 'api', 'callback'].includes(String(route.query.tab))
      ? String(route.query.tab)
      : 'integration'
  )
  const keyword = ref('')
  const selectedTag = ref('')
  const openedEndpoints = ref('')
  const importedFileName = ref('')
  const specFileInput = ref<HTMLInputElement>()
  const sandboxUrl = 'https://sandbox-api.ggap.example.invalid/v1'

  function endpoint(
    method: string,
    summary: string,
    tag: string,
    description: string,
    request: unknown,
    response: unknown
  ) {
    return {
      [method.toLowerCase()]: {
        tags: [tag],
        summary,
        description,
        operationId: `${method.toLowerCase()}${summary.replace(/[^A-Za-z0-9\u4e00-\u9fff]/g, '')}`,
        requestBody: { content: { 'application/json': { example: request } } },
        responses: {
          '200': {
            description: '成功',
            content: { 'application/json': { example: response } }
          }
        }
      }
    }
  }

  const apiSpec = ref<OpenApiDocument>({
    openapi: '3.1.0',
    info: { title: 'GGAP Integration API（示範）', version: '0.1-demo' },
    servers: [{ url: sandboxUrl, description: '不可連線的演示端點' }],
    paths: {
      '/launch': endpoint(
        'POST',
        '啟動遊戲',
        'Launch',
        '建立會員遊戲 Session 並回傳一次性啟動網址。',
        { merchantId: 'M00001', memberId: 'TEST-001', gameCode: 'DEMO-001', currency: 'TWD' },
        { traceId: 'TRACE-DEMO', launchUrl: 'https://launch.example.invalid/session' }
      ),
      '/wallet/balance': endpoint(
        'POST',
        '查詢餘額',
        'Wallet',
        '依商戶與會員識別查詢測試 Wallet 餘額。',
        { merchantId: 'M00001', memberId: 'TEST-001', currency: 'TWD' },
        { balance: 10000, currency: 'TWD' }
      ),
      '/wallet/bet': endpoint(
        'POST',
        '下注扣款',
        'Wallet',
        '每筆下注使用唯一 transactionId，重試不得重複扣款。',
        { transactionId: 'BET-DEMO-001', roundId: 'ROUND-DEMO-001', amount: 100 },
        { transactionId: 'BET-DEMO-001', balance: 9900 }
      ),
      '/wallet/win': endpoint(
        'POST',
        '派彩入帳',
        'Wallet',
        '派彩與下注分開記錄，並保留原始交易幣別。',
        { transactionId: 'WIN-DEMO-001', relatedBetId: 'BET-DEMO-001', amount: 180 },
        { transactionId: 'WIN-DEMO-001', balance: 10080 }
      ),
      '/wallet/refund': endpoint(
        'POST',
        '退款',
        'Wallet',
        '退款必須關聯原交易並保持冪等。',
        { transactionId: 'REF-DEMO-001', originalTransactionId: 'BET-DEMO-001', amount: 100 },
        { transactionId: 'REF-DEMO-001', status: 'success' }
      ),
      '/wallet/rollback': endpoint(
        'POST',
        '回滾',
        'Wallet',
        '回滾指定交易，不得直接修改已存在的帳本紀錄。',
        { transactionId: 'RB-DEMO-001', originalTransactionId: 'WIN-DEMO-001' },
        { transactionId: 'RB-DEMO-001', status: 'success' }
      ),
      '/transfer/in': endpoint(
        'POST',
        '轉入測試 Wallet',
        'Transfer Wallet',
        '只在商戶線路支援 Transfer Wallet 時提供。',
        { transactionId: 'TIN-DEMO-001', amount: 1000, currency: 'TWD' },
        { balance: 11000 }
      ),
      '/transfer/out': endpoint(
        'POST',
        '轉出測試 Wallet',
        'Transfer Wallet',
        '從隔離的測試 Wallet 轉出，不觸及正式資金。',
        { transactionId: 'TOUT-DEMO-001', amount: 500, currency: 'TWD' },
        { balance: 10500 }
      )
    }
  })

  const endpointMethods = ['get', 'post', 'put', 'patch', 'delete']
  const extractExample = (value: unknown) => {
    const source = value as {
      content?: Record<string, { example?: unknown; schema?: unknown }>
    }
    return (
      source?.content?.['application/json']?.example ||
      source?.content?.['application/json']?.schema ||
      {}
    )
  }
  const endpoints = computed(() =>
    Object.entries(apiSpec.value.paths || {}).flatMap(([path, operations]) =>
      Object.entries(operations)
        .filter(([method]) => endpointMethods.includes(method.toLowerCase()))
        .map(([method, operation]) => ({
          key: `${method.toUpperCase()} ${path}`,
          method: method.toUpperCase(),
          path,
          summary: operation.summary || operation.operationId || '未命名端點',
          description: operation.description || '',
          operationId: operation.operationId,
          tag: operation.tags?.[0] || '其他',
          requestExample: JSON.stringify(extractExample(operation.requestBody), null, 2),
          responseExample: JSON.stringify(
            extractExample(operation.responses?.['200'] || operation.responses?.['201']),
            null,
            2
          )
        }))
    )
  )
  const tags = computed(() => Array.from(new Set(endpoints.value.map((item) => item.tag))))
  const filteredEndpoints = computed(() => {
    const term = keyword.value.trim().toLowerCase()
    return endpoints.value.filter(
      (item) =>
        (!selectedTag.value || item.tag === selectedTag.value) &&
        (!term ||
          `${item.method} ${item.path} ${item.summary} ${item.tag}`.toLowerCase().includes(term))
    )
  })

  const integrationRules = [
    {
      icon: 'ri:key-2-line',
      title: '憑證隔離',
      description: '商戶只管理自身 GGAP 憑證，不能查看供應商憑證。'
    },
    {
      icon: 'ri:fingerprint-line',
      title: 'HMAC 簽章',
      description: '簽章內容應包含時間戳、請求內容與唯一請求識別。'
    },
    {
      icon: 'ri:repeat-2-line',
      title: '冪等防重',
      description: 'Bet、Win、Refund、Rollback 與 Transfer 都必須能安全重試。'
    },
    {
      icon: 'ri:route-line',
      title: 'Trace ID',
      description: 'Launch、Wallet 與 Callback 全流程使用同一追蹤識別。'
    }
  ]
  const callbackSteps = [
    { code: '01', title: '驗證來源與簽章', description: '先檢查商戶、時間戳、簽章與允許來源。' },
    {
      code: '02',
      title: '檢查冪等識別',
      description: '已成功處理的 transactionId 直接回傳既有結果。'
    },
    {
      code: '03',
      title: '寫入隔離帳本',
      description: '測試與正式 Wallet、會員及統計資料完全分離。'
    },
    {
      code: '04',
      title: '回傳結果與 Trace ID',
      description: '錯誤也必須回傳可追蹤且不洩漏內部資料的結果。'
    }
  ]
  const errorCodes = [
    { code: 'AUTH_INVALID', http: 401, meaning: '簽章或憑證無效', retry: '修正憑證或簽章後再送出' },
    {
      code: 'REQUEST_EXPIRED',
      http: 401,
      meaning: '時間戳超出允許範圍',
      retry: '校準時間並使用新的請求識別'
    },
    {
      code: 'DUPLICATE_TRANSACTION',
      http: 409,
      meaning: '交易識別已存在',
      retry: '查詢原交易結果，不得換 ID 重複入帳'
    },
    {
      code: 'INSUFFICIENT_BALANCE',
      http: 422,
      meaning: '餘額不足',
      retry: '不重試，提示會員或商戶'
    },
    {
      code: 'PROVIDER_UNAVAILABLE',
      http: 503,
      meaning: '供應商暫時不可用',
      retry: '依 Retry-After 或退避規則重試'
    }
  ]

  const syncTab = (name: string | number) =>
    router.replace({ query: { ...route.query, tab: String(name) } })
  const copyBaseUrl = async () => {
    await navigator.clipboard.writeText(sandboxUrl)
    ElMessage.success('已複製測試端點')
  }
  const openSpecFile = () => specFileInput.value?.click()
  const importSpec = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as OpenApiDocument
      if (!parsed.openapi || !parsed.info || !parsed.paths) throw new Error('invalid')
      apiSpec.value = parsed
      importedFileName.value = file.name
      activeTab.value = 'api'
      syncTab('api')
      ElMessage.success(`已載入 ${file.name}`)
    } catch {
      ElMessage.error('無法讀取文件，請確認為有效的 OpenAPI JSON')
    } finally {
      input.value = ''
    }
  }
  const downloadSpec = () => {
    const blob = new Blob([JSON.stringify(apiSpec.value, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = importedFileName.value || 'ggap-openapi-demo.json'
    link.click()
    URL.revokeObjectURL(url)
  }
</script>

<style scoped lang="scss">
  .developer-page {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .summary-grid > div {
    display: grid;
    gap: 6px;
    padding: 16px;
    border: 1px solid var(--art-border-color);
    border-radius: 10px;
  }
  .summary-grid strong {
    font-size: 22px;
  }
  .summary-grid span,
  .summary-grid small,
  .section-heading p,
  .api-toolbar span,
  .rule-list small,
  .endpoint-body > p,
  .el-timeline p {
    color: var(--art-gray-500);
  }
  .content-card :deep(.el-card__body) {
    padding-top: 4px;
  }
  .section-grid {
    display: grid;
    gap: 24px;
    padding: 12px 0;
  }
  .section-heading {
    margin-bottom: 14px;
  }
  .section-heading h2,
  .section-heading p,
  .endpoint-body > p,
  .el-timeline p {
    margin: 0;
  }
  .section-heading h2 {
    margin-bottom: 5px;
    font-size: 17px;
  }
  code {
    font-family: 'SFMono-Regular', Consolas, monospace;
  }
  .rule-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .rule-list > div {
    display: flex;
    gap: 12px;
    padding: 14px;
    border: 1px solid var(--art-border-color);
    border-radius: 8px;
  }
  .rule-list svg {
    flex: 0 0 auto;
    font-size: 20px;
    color: var(--theme-color);
  }
  .rule-list span {
    display: grid;
    gap: 4px;
  }
  .api-toolbar {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0 16px;
  }
  .api-toolbar > div {
    display: grid;
    gap: 4px;
  }
  .api-toolbar :deep(.el-input),
  .api-toolbar :deep(.el-select) {
    width: 220px;
  }
  .endpoint-title {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }
  .endpoint-title code {
    color: var(--art-gray-900);
  }
  .method {
    min-width: 58px;
    padding: 3px 8px;
    color: white;
    text-align: center;
    border-radius: 5px;
  }
  .method.get {
    background: #2563eb;
  }
  .method.post {
    background: #059669;
  }
  .method.put,
  .method.patch {
    background: #d97706;
  }
  .method.delete {
    background: #dc2626;
  }
  .endpoint-body {
    display: grid;
    gap: 14px;
    padding: 4px 10px 16px;
  }
  .code-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
  .code-grid h3 {
    margin: 0 0 8px;
    font-size: 14px;
  }
  pre {
    min-height: 120px;
    max-height: 360px;
    padding: 14px;
    margin: 0;
    overflow: auto;
    color: #d7e3ff;
    background: #101522;
    border-radius: 8px;
  }
  @media (width <= 980px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .api-toolbar {
      align-items: flex-start;
      flex-direction: column;
    }
  }
  @media (width <= 680px) {
    .summary-grid,
    .rule-list,
    .code-grid {
      grid-template-columns: 1fr;
    }
    .api-toolbar :deep(.el-input),
    .api-toolbar :deep(.el-select) {
      width: min(100%, 300px);
    }
    .endpoint-title {
      flex-wrap: wrap;
      padding: 8px 0;
    }
  }
</style>
