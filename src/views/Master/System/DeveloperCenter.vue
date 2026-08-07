<script setup lang="ts">
import { computed, h, ref } from 'vue'
import {
  NAlert,
  NButton,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NIcon,
  NInput,
  NSelect,
  NSpace,
  NStatistic,
  NTabPane,
  NTabs,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { ContentCopyOutlined, SearchOutlined, VisibilityOutlined } from '@vicons/material'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

type OwnerType = '商戶' | '代理' | '平台'
type KeyStatus = 'active' | 'rotating' | 'disabled'
type WebhookStatus = 'success' | 'failed' | 'retrying'
type ApiMethod = 'GET' | 'POST'

interface ApiKeyRow {
  key_id: string
  owner_type: OwnerType
  owner_name: string
  environment: 'Sandbox' | 'Production'
  status: KeyStatus
  allowed_ips: string[]
  callback_url: string
  last_used_at: string
  created_at: string
}

interface WebhookLog {
  log_id: string
  event: string
  target: string
  status: WebhookStatus
  retry_count: number
  latency_ms: number
  created_at: string
  request_id: string
}

interface ApiEndpoint {
  method: ApiMethod
  path: string
  name: string
  description: string
  auth: string
  owner: string
}

interface ErrorCode {
  code: string
  message: string
  description: string
}

const message = useMessage()
const keyword = ref('')
const environmentFilter = ref<string | null>(null)
const showDetail = ref(false)
const currentKey = ref<ApiKeyRow | null>(null)

const apiKeys = ref<ApiKeyRow[]>([
  {
    key_id: 'AK-OP1001-PROD',
    owner_type: '商戶',
    owner_name: 'Blue Whale Interactive',
    environment: 'Production',
    status: 'active',
    allowed_ips: ['203.0.113.10', '203.0.113.11'],
    callback_url: 'https://merchant.example.com/ggap/callback',
    last_used_at: '2026-07-07T10:30:00+08:00',
    created_at: '2026-05-11T09:00:00+08:00'
  },
  {
    key_id: 'AK-OP1008-SBX',
    owner_type: '商戶',
    owner_name: 'NovaPlay Entertainment',
    environment: 'Sandbox',
    status: 'rotating',
    allowed_ips: ['198.51.100.20'],
    callback_url: 'https://sandbox.novaplay.example/callback',
    last_used_at: '2026-07-07T09:12:00+08:00',
    created_at: '2026-06-22T14:40:00+08:00'
  },
  {
    key_id: 'AK-AGTSEA-PROD',
    owner_type: '代理',
    owner_name: 'SEA Growth Agent',
    environment: 'Production',
    status: 'active',
    allowed_ips: ['203.0.113.80'],
    callback_url: 'https://agent-sea.example.com/report-webhook',
    last_used_at: '2026-07-07T08:55:00+08:00',
    created_at: '2026-04-19T11:20:00+08:00'
  }
])

const webhookLogs = ref<WebhookLog[]>([
  { log_id: 'WH-20260707-0001', event: 'wallet.bet', target: 'OP-1001', status: 'success', retry_count: 0, latency_ms: 182, created_at: '2026-07-07T10:31:00+08:00', request_id: 'req-wallet-bet-001' },
  { log_id: 'WH-20260707-0002', event: 'wallet.refund', target: 'OP-1006', status: 'retrying', retry_count: 2, latency_ms: 3000, created_at: '2026-07-07T10:10:00+08:00', request_id: 'req-wallet-refund-014' },
  { log_id: 'WH-20260707-0003', event: 'settlement.ready', target: 'AGT-SEA-001', status: 'failed', retry_count: 5, latency_ms: 5000, created_at: '2026-07-07T01:30:00+08:00', request_id: 'req-settle-sea' }
])

const envOptions = [
  { label: 'Sandbox', value: 'Sandbox' },
  { label: 'Production', value: 'Production' }
]

const apiEndpoints: ApiEndpoint[] = [
  { method: 'POST', path: '/api/v1/game/launch', name: 'Launch Game', description: '建立遊戲啟動連結，帶入 transaction_currency 與 wallet_mode。', auth: 'API Key + HMAC', owner: '商戶' },
  { method: 'POST', path: '/api/v1/wallet/balance', name: 'Seamless Balance', description: 'Seamless Wallet 餘額查詢 Callback。', auth: 'Callback Signature', owner: '商戶' },
  { method: 'POST', path: '/api/v1/wallet/bet', name: 'Seamless Bet', description: 'Seamless Wallet 下注扣款 Callback。', auth: 'Callback Signature', owner: '商戶' },
  { method: 'POST', path: '/api/v1/wallet/win', name: 'Seamless Win / Payout', description: 'Seamless Wallet 派彩加款 Callback。', auth: 'Callback Signature', owner: '商戶' },
  { method: 'POST', path: '/api/v1/transfer/deposit', name: 'Transfer Wallet Deposit', description: 'Transfer Wallet 會員轉入 GGAP 內部帳本。', auth: 'API Key + HMAC', owner: '商戶' },
  { method: 'POST', path: '/api/v1/transfer/withdraw', name: 'Transfer Wallet Withdraw', description: 'Transfer Wallet 會員由 GGAP 內部帳本轉出。', auth: 'API Key + HMAC', owner: '商戶' },
  { method: 'GET', path: '/api/v1/report/transactions', name: 'Transaction Report', description: '查詢交易流水與雙幣別金額。', auth: 'API Key + HMAC', owner: '商戶 / 代理' },
  { method: 'GET', path: '/api/v1/report/settlements', name: 'Settlement Report', description: '查詢代理結算、下級代理結算與商戶結算明細。', auth: 'API Key + HMAC', owner: '代理' }
]

const errorCodes: ErrorCode[] = [
  { code: '10001', message: 'INVALID_SIGNATURE', description: '簽章驗證失敗。' },
  { code: '10002', message: 'DUPLICATE_REQUEST', description: 'idempotency_key 重複。' },
  { code: '20001', message: 'PLAYER_NOT_FOUND', description: '會員不存在。' },
  { code: '20002', message: 'INSUFFICIENT_BALANCE', description: '餘額不足。' },
  { code: '30001', message: 'GAME_DISABLED', description: '遊戲已停用或維護中。' },
  { code: '40001', message: 'RATE_NOT_LOCKED', description: '匯率尚未鎖定。' },
  { code: '50001', message: 'PROVIDER_TIMEOUT', description: 'Provider API timeout。' }
]

const launchExample = `POST /api/v1/game/launch
X-GGAP-KEY: AK-OP1001-PROD
X-GGAP-TIMESTAMP: 2026-07-07T10:30:00+08:00
X-GGAP-SIGNATURE: hmac_sha256(secret, timestamp + body)

{
  "merchant_id": "OP-1001",
  "merchant_player_id": "mem_8842",
  "transaction_currency": "TWD",
  "wallet_mode": "seamless",
  "provider_id": "PROV-PG",
  "game_id": "PG-001",
  "language": "zh-TW",
  "return_url": "https://merchant.example.com/lobby"
}`

const callbackExample = `POST https://merchant.example.com/ggap/callback
X-GGAP-EVENT: wallet.bet
X-GGAP-SIGNATURE: hmac_sha256(callback_secret, timestamp + body)

{
  "request_id": "req-wallet-bet-001",
  "idempotency_key": "idem-op1001-pg-8842",
  "merchant_id": "OP-1001",
  "merchant_player_id": "mem_8842",
  "transaction_currency": "TWD",
  "transaction_amount": "3200.00",
  "bet_id": "BET-20260707-000884",
  "round_id": "R-PG-8842-78231"
}`

const transferExample = `POST /api/v1/transfer/deposit
{
  "merchant_id": "OP-1008",
  "merchant_player_id": "nova_7711",
  "transaction_currency": "THB",
  "transaction_amount": "3200.00",
  "idempotency_key": "transfer-in-20260707-0001"
}`

const responseExample = `{
  "code": 0,
  "message": "OK",
  "data": {
    "transaction_id": "TX-20260707-000241",
    "status": "accepted",
    "settlement_currency": "USDT",
    "settlement_amount": 87.45
  }
}`

const statusMeta: Record<KeyStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  active: { label: '啟用', type: 'success' },
  rotating: { label: '輪替中', type: 'warning' },
  disabled: { label: '停用', type: 'error' }
}
const webhookMeta: Record<WebhookStatus, { label: string; type: 'success' | 'warning' | 'error' }> = {
  success: { label: '成功', type: 'success' },
  retrying: { label: '重試中', type: 'warning' },
  failed: { label: '失敗', type: 'error' }
}
const methodMeta: Record<ApiMethod, 'success' | 'info'> = {
  GET: 'info',
  POST: 'success'
}

const filteredKeys = computed(() => apiKeys.value.filter((row) => {
  const text = keyword.value.trim().toLowerCase()
  const matchesKeyword = !text || row.key_id.toLowerCase().includes(text) || row.owner_name.toLowerCase().includes(text)
  const matchesEnv = !environmentFilter.value || row.environment === environmentFilter.value
  return matchesKeyword && matchesEnv
}))

const summary = computed(() => ({
  keys: apiKeys.value.length,
  production: apiKeys.value.filter(row => row.environment === 'Production').length,
  webhookFailed: webhookLogs.value.filter(row => row.status !== 'success').length,
  avgLatency: Math.round(webhookLogs.value.reduce((sum, row) => sum + row.latency_ms, 0) / webhookLogs.value.length)
}))

const formatDateTime = (value: string) => new Date(value).toLocaleString()
const openDetail = (row: ApiKeyRow) => {
  currentKey.value = row
  showDetail.value = true
}
const copyKey = (row: ApiKeyRow) => message.success(`${row.key_id} 已複製展示用 Key，Secret 只顯示一次`)
const rotateKey = (row: ApiKeyRow) => {
  row.status = 'rotating'
  message.success(`${row.key_id} 已進入 Secret 輪替流程`)
}
const testCallback = (row?: ApiKeyRow) => message.success(`${row?.owner_name || '指定商戶'} Callback 測試已送出`)
const downloadPostman = () => message.success('已下載 Postman Collection 展示檔')
const copyText = (label: string) => message.success(`${label} 已複製`)
const resetFilters = () => {
  keyword.value = ''
  environmentFilter.value = null
}

const endpointColumns: DataTableColumns<ApiEndpoint> = [
  { title: 'Method', key: 'method', width: 90, render: row => h(NTag, { type: methodMeta[row.method], bordered: false, size: 'small' }, { default: () => row.method }) },
  { title: 'Endpoint', key: 'path', width: 260, render: row => h('span', { class: 'font-mono text-xs text-cyan-400' }, row.path) },
  { title: '名稱', key: 'name', width: 180 },
  { title: '說明', key: 'description', minWidth: 320 },
  { title: '驗證', key: 'auth', width: 160 },
  { title: '對象', key: 'owner', width: 120 },
  { title: '操作', key: 'actions', width: 90, fixed: 'right', render: row => h(NButton, { size: 'small', secondary: true, onClick: () => copyText(row.path) }, { default: () => '複製' }) }
]

const errorColumns: DataTableColumns<ErrorCode> = [
  { title: 'Code', key: 'code', width: 90, render: row => h('span', { class: 'font-mono text-xs' }, row.code) },
  { title: 'Message', key: 'message', width: 210, render: row => h('span', { class: 'font-mono text-xs text-amber-300' }, row.message) },
  { title: '說明', key: 'description', minWidth: 360 }
]

const keyColumns: DataTableColumns<ApiKeyRow> = [
  {
    title: 'API Key',
    key: 'key_id',
    width: 180,
    fixed: 'left',
    render: row => h('button', { class: 'font-mono text-cyan-500 hover:text-cyan-400', onClick: () => openDetail(row) }, row.key_id)
  },
  { title: '對象', key: 'owner_name', minWidth: 220, render: row => h('div', [h('div', { class: 'font-semibold' }, row.owner_name), h('div', { class: 'text-xs text-gray-500' }, row.owner_type)]) },
  { title: '環境', key: 'environment', width: 120, render: row => h(NTag, { type: row.environment === 'Production' ? 'error' : 'info', bordered: false, size: 'small' }, { default: () => row.environment }) },
  { title: '狀態', key: 'status', width: 110, render: row => h(NTag, { type: statusMeta[row.status].type, bordered: false, size: 'small' }, { default: () => statusMeta[row.status].label }) },
  { title: '允許 IP', key: 'allowed_ips', width: 140, render: row => `${row.allowed_ips.length} 組 IP` },
  { title: '最後使用', key: 'last_used_at', width: 180, render: row => formatDateTime(row.last_used_at) },
  {
    title: '操作',
    key: 'actions',
    width: 260,
    fixed: 'right',
    render: row => h(NSpace, { size: 6, wrap: false }, {
      default: () => [
        h(NButton, { size: 'small', secondary: true, onClick: () => openDetail(row) }, { icon: () => h(VisibilityOutlined), default: () => '查看' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => copyKey(row) }, { icon: () => h(ContentCopyOutlined), default: () => '複製' }),
        h(NButton, { size: 'small', secondary: true, onClick: () => testCallback(row) }, { default: () => '測試' }),
        h(NButton, { size: 'small', type: 'warning', secondary: true, onClick: () => rotateKey(row) }, { default: () => '輪替' })
      ]
    })
  }
]

const webhookColumns: DataTableColumns<WebhookLog> = [
  { title: 'Log ID', key: 'log_id', width: 170, render: row => h('span', { class: 'font-mono text-xs' }, row.log_id) },
  { title: '事件', key: 'event', width: 150 },
  { title: '對象', key: 'target', width: 130 },
  { title: '狀態', key: 'status', width: 100, render: row => h(NTag, { type: webhookMeta[row.status].type, bordered: false, size: 'small' }, { default: () => webhookMeta[row.status].label }) },
  { title: '重試', key: 'retry_count', width: 80, align: 'right' },
  { title: '延遲', key: 'latency_ms', width: 100, align: 'right', render: row => `${row.latency_ms} ms` },
  { title: 'Request ID', key: 'request_id', minWidth: 180, render: row => h('span', { class: 'font-mono text-xs' }, row.request_id) }
]
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">開發者中心</h1>
        <p class="mt-1 text-sm text-gray-500">
          管理 API 文件、API Key、Callback 測試、Webhook Log 與串接範例。
        </p>
      </div>
      <div class="flex gap-2">
        <n-button secondary @click="downloadPostman">下載 Postman</n-button>
        <n-button type="primary" @click="testCallback()">測試 Callback</n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="API Key" :value="summary.keys" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Production Key" :value="summary.production" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Webhook 異常" :value="summary.webhookFailed" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="平均延遲">{{ summary.avgLatency }} ms</n-statistic></div>
    </div>

    <n-alert type="info" :show-icon="false">
      Provider 側依幣別線維護獨立 API Key、憑證、URL 與錢包模式；商戶可用 Seamless Callback 或 Transfer Wallet Ledger。Production Secret 只顯示一次，輪替需保留過渡期。
    </n-alert>

    <n-tabs type="line" animated>
      <n-tab-pane name="docs" tab="API 文件">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <div class="text-sm text-gray-500">Sandbox Base URL</div>
              <div class="mt-2 font-mono text-sm text-cyan-400">https://sandbox-api.ggap.local</div>
              <n-button class="mt-3" size="small" secondary @click="copyText('Sandbox Base URL')">複製</n-button>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <div class="text-sm text-gray-500">Production Base URL</div>
              <div class="mt-2 font-mono text-sm text-cyan-400">https://api.ggap.local</div>
              <n-button class="mt-3" size="small" secondary @click="copyText('Production Base URL')">複製</n-button>
            </div>
            <div class="rounded border border-white/10 bg-[#202026] p-4">
              <div class="text-sm text-gray-500">驗證 Headers</div>
              <div class="mt-2 space-y-1 font-mono text-xs text-slate-300">
                <div>X-GGAP-KEY</div>
                <div>X-GGAP-TIMESTAMP</div>
                <div>X-GGAP-SIGNATURE</div>
              </div>
            </div>
          </div>

          <n-alert type="info" :show-icon="false">
            簽章：HMAC-SHA256(secret, timestamp + raw_body)。交易型 API 需帶 idempotency_key，重複 key 會回傳重複請求錯誤，避免重複扣款或派彩。
          </n-alert>

          <section class="space-y-3">
            <div>
              <h2 class="text-lg font-semibold">Endpoint 清單</h2>
              <p class="mt-1 text-sm text-gray-500">Merchant Callback 與 Provider 即時交易使用同一原幣；USDT 金額只在每日 00:10 日結後產生。</p>
            </div>
            <n-data-table :columns="withTableSorters(endpointColumns)" :data="apiEndpoints" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1280" />
          </section>

          <section class="space-y-3">
            <div>
              <h2 class="text-lg font-semibold">Request / Callback 範例</h2>
              <p class="mt-1 text-sm text-gray-500">包含 Launch Game、Seamless Wallet Callback、Transfer Wallet 與標準回應格式。</p>
            </div>
            <div class="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <div class="rounded border border-white/10 bg-[#18181c] p-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <h3 class="font-semibold">Launch Game</h3>
                  <n-button size="small" secondary @click="copyText('Launch Game 範例')">複製</n-button>
                </div>
                <pre class="api-code"><code>{{ launchExample }}</code></pre>
              </div>
              <div class="rounded border border-white/10 bg-[#18181c] p-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <h3 class="font-semibold">Seamless Wallet Callback</h3>
                  <n-button size="small" secondary @click="copyText('Callback 範例')">複製</n-button>
                </div>
                <pre class="api-code"><code>{{ callbackExample }}</code></pre>
              </div>
              <div class="rounded border border-white/10 bg-[#18181c] p-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <h3 class="font-semibold">Transfer Wallet Deposit</h3>
                  <n-button size="small" secondary @click="copyText('Transfer Wallet 範例')">複製</n-button>
                </div>
                <pre class="api-code"><code>{{ transferExample }}</code></pre>
              </div>
              <div class="rounded border border-white/10 bg-[#18181c] p-4">
                <div class="mb-3 flex items-center justify-between gap-2">
                  <h3 class="font-semibold">標準回應</h3>
                  <n-button size="small" secondary @click="copyText('標準回應範例')">複製</n-button>
                </div>
                <pre class="api-code"><code>{{ responseExample }}</code></pre>
              </div>
            </div>
          </section>

          <section class="space-y-3">
            <div>
              <h2 class="text-lg font-semibold">錯誤碼</h2>
              <p class="mt-1 text-sm text-gray-500">Provider timeout、Callback failed、餘額不足與匯率未鎖定等錯誤，後續可導向補單或維運流程。</p>
            </div>
            <n-data-table :columns="withTableSorters(errorColumns)" :data="errorCodes" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="720" />
          </section>
        </div>
      </n-tab-pane>

      <n-tab-pane name="keys" tab="API Key">
        <div class="mb-4 rounded border border-white/10 bg-[#202026] p-4">
          <div class="grid gap-3 xl:grid-cols-12">
            <n-input v-model:value="keyword" clearable placeholder="搜尋 Key / 對象" class="xl:col-span-4">
              <template #prefix><n-icon :component="SearchOutlined" /></template>
            </n-input>
            <n-select v-model:value="environmentFilter" clearable placeholder="環境" :options="envOptions" class="xl:col-span-2" />
            <n-button secondary class="xl:col-span-1" @click="resetFilters">重置</n-button>
          </div>
        </div>
        <n-data-table :columns="withTableSorters(keyColumns)" :data="filteredKeys" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1300" />
      </n-tab-pane>

      <n-tab-pane name="webhooks" tab="Webhook Log">
        <n-data-table :columns="withTableSorters(webhookColumns)" :data="webhookLogs" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="980" />
      </n-tab-pane>
    </n-tabs>

    <n-drawer v-model:show="showDetail" width="min(720px, 100vw)">
      <n-drawer-content closable>
        <template #header>
          <div v-if="currentKey" class="flex items-center gap-3">
            <span class="font-mono font-semibold">{{ currentKey.key_id }}</span>
            <n-tag :type="statusMeta[currentKey.status].type" :bordered="false">{{ statusMeta[currentKey.status].label }}</n-tag>
          </div>
        </template>
        <template v-if="currentKey">
          <n-descriptions bordered :column="2" label-placement="left">
            <n-descriptions-item label="對象">{{ currentKey.owner_type }} / {{ currentKey.owner_name }}</n-descriptions-item>
            <n-descriptions-item label="環境">{{ currentKey.environment }}</n-descriptions-item>
            <n-descriptions-item label="Callback URL" :span="2">{{ currentKey.callback_url }}</n-descriptions-item>
            <n-descriptions-item label="允許 IP" :span="2">{{ currentKey.allowed_ips.join(', ') }}</n-descriptions-item>
            <n-descriptions-item label="建立時間">{{ formatDateTime(currentKey.created_at) }}</n-descriptions-item>
            <n-descriptions-item label="最後使用">{{ formatDateTime(currentKey.last_used_at) }}</n-descriptions-item>
          </n-descriptions>
          <n-timeline class="mt-5">
            <n-timeline-item type="success" title="建立 API Key" :time="formatDateTime(currentKey.created_at)" />
            <n-timeline-item type="info" title="最後使用" :time="formatDateTime(currentKey.last_used_at)" />
          </n-timeline>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.api-code {
  max-height: 360px;
  overflow: auto;
  white-space: pre;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: 6px;
  background: #0f1014;
  padding: 12px;
  color: #d6deeb;
  font-size: 12px;
  line-height: 1.65;
}
</style>
