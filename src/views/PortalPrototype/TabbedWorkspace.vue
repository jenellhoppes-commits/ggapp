<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NDatePicker, NDescriptions, NDescriptionsItem, NDrawer, NDrawerContent, NInput, NSelect, NTabPane, NTabs, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import PageFilterBar from '../../components/Common/PageFilterBar.vue'
import PageState from '../../components/Common/PageState.vue'
import ResponsiveDataTable from '../../components/Common/ResponsiveDataTable.vue'
import { DEFAULT_TABLE_PAGINATION } from '../../utils/tableSort'

type WorkspaceKind = 'agentAccounting' | 'agentReports' | 'merchantFinance' | 'merchantReports' | 'integration'
interface WorkspaceRow { id: string; [key: string]: string | number | null }
interface WorkspaceTab { key: string; label: string }
interface Column { title: string; key: string; minWidth?: number; width?: number; status?: boolean; money?: boolean }

const props = defineProps<{ kind: WorkspaceKind }>()
const route = useRoute()
const router = useRouter()

const definitions: Record<WorkspaceKind, { eyebrow: string; title: string; description: string; tabs: WorkspaceTab[] }> = {
  agentAccounting: { eyebrow: '財務中心', title: '對帳與佣金', description: '查看平台、下級代理與商戶對帳來源；缺少核准來源時不產生正式金額。', tabs: [{ key: 'platform', label: '平台對帳' }, { key: 'sub-agents', label: '下級代理' }, { key: 'merchants', label: '商戶對帳' }] },
  agentReports: { eyebrow: '報表中心', title: '報表查詢', description: '使用共同日期、單一原幣與代理樹資料範圍查看營運結果。', tabs: [{ key: 'merchants', label: '商戶報表' }, { key: 'sub-agents', label: '下級代理報表' }, { key: 'bets', label: '注單追蹤' }] },
  merchantFinance: { eyebrow: '財務中心', title: '對帳與帳單', description: '查看自身幣別線、對帳來源與帳單狀態，不提供資金申請或人工調帳。', tabs: [{ key: 'reconciliation', label: '對帳清單' }, { key: 'invoices', label: '結算單' }, { key: 'differences', label: '差異與紀錄' }] },
  merchantReports: { eyebrow: '報表中心', title: '報表查詢', description: '以單一原幣查看自身營運與遊戲資料，不計算平台收入、成本或佣金。', tabs: [{ key: 'operations', label: '營運報表' }, { key: 'games', label: '遊戲報表' }] },
  integration: { eyebrow: '串接中心', title: '串接設定', description: '集中查看 API 文件、憑證、商戶 API 來源 IP 與 Callback 紀錄。', tabs: [{ key: 'api', label: 'API 文件' }, { key: 'credentials', label: '憑證' }, { key: 'ip', label: '商戶 API 來源 IP' }, { key: 'callbacks', label: 'Callback 紀錄' }] }
}

const demoDate = '2026-09-04'
const definition = computed(() => definitions[props.kind])
const defaultTab = computed(() => definition.value.tabs[0]!.key)
const activeTab = ref(typeof route.query.tab === 'string' && definition.value.tabs.some(tab => tab.key === route.query.tab) ? String(route.query.tab) : defaultTab.value)
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const currency = ref(typeof route.query.currency === 'string' ? route.query.currency : 'TWD')
const range = ref<[number, number]>([Date.parse(`${demoDate}T00:00:00+08:00`), Date.parse(`${demoDate}T00:00:00+08:00`)])
const selected = ref<WorkspaceRow | null>(null)

const rowsByKey: Record<string, WorkspaceRow[]> = {
  'agentAccounting:platform': [
    { id: 'AR-202609-001', period: '2026-09-01～09-04', subject: 'GGAP 平台', currencies: 'TWD → 合約結算幣別', source: '缺匯率版本', amount: '待核對', status: '核對中', updatedAt: '2026-09-04 18:15' }
  ],
  'agentAccounting:sub-agents': [
    { id: 'AR-202609-002', period: '2026-09-01～09-04', subject: 'SEA Sub Agent 01（L2）', currencies: 'TWD → 待核對', source: '缺核准條件', amount: '待核對', status: '草稿', updatedAt: '2026-09-04 17:22' }
  ],
  'agentAccounting:merchants': [
    { id: 'AR-202609-003', period: '2026-09-01～09-04', subject: 'Blue Whale（OP-1001）', currencies: 'TWD → TWD', source: '交易來源完整', amount: '待核對', status: '核對中', updatedAt: '2026-09-04 16:35' }
  ],
  'agentReports:merchants': [
    { id: 'OP-1001', subject: 'Blue Whale Interactive', currency: 'TWD', bets: 86, players: 42, betAmount: '188,420.00 TWD', payoutAmount: '132,840.00 TWD' },
    { id: 'OP-1002', subject: 'Royal Ace Group', currency: 'TWD', bets: 40, players: 32, betAmount: '80,000.00 TWD', payoutAmount: '61,000.00 TWD' }
  ],
  'agentReports:sub-agents': [
    { id: 'AGT-SEA-SUB01', subject: 'SEA Sub Agent 01（直接）', currency: 'TWD', bets: 72, players: 38, betAmount: '151,200.00 TWD', payoutAmount: '108,400.00 TWD' }
  ],
  'agentReports:bets': [
    { id: 'BET-0001', subject: 'Blue Whale／player_10001', currency: 'TWD', bets: 1, players: 1, betAmount: '1,200.00 TWD', payoutAmount: '860.00 TWD' },
    { id: 'BET-0002', subject: 'Blue Whale／player_10001', currency: 'TWD', bets: 1, players: 1, betAmount: '300.00 TWD', payoutAmount: '0.00 TWD' }
  ],
  'merchantFinance:reconciliation': [
    { id: 'MR-202609-001', period: '2026-09-01～09-04', originalCurrency: 'TWD', settlementCurrency: 'TWD', source: '完整', amount: '待確認', status: '核對中', updatedAt: '2026-09-04 18:25' }
  ],
  'merchantFinance:invoices': [
    { id: 'MI-202608-001', period: '2026-08-01～08-31', originalCurrency: 'TWD', settlementCurrency: '依合約', source: '缺匯率版本', amount: '待核對', status: '草稿', updatedAt: '2026-09-04 17:40' }
  ],
  'merchantFinance:differences': [
    { id: 'DF-202609-001', period: '2026-09-01～09-04', originalCurrency: 'TWD', settlementCurrency: 'TWD', source: '2 筆來源差異', amount: '待核對', status: '有差異', updatedAt: '2026-09-04 16:20' }
  ],
  'merchantReports:operations': [
    { id: '2026-09-04', subject: '2026-09-04', currency: 'TWD', bets: 42, players: 28, betAmount: '87,640.00 TWD', payoutAmount: '62,980.00 TWD' }
  ],
  'merchantReports:games': [
    { id: 'PG-MW-001', subject: 'Mahjong Ways／PG Soft', currency: 'TWD', bets: 24, players: 16, betAmount: '51,200.00 TWD', payoutAmount: '38,460.00 TWD' },
    { id: 'EVO-BA-003', subject: 'Baccarat A／Evolution', currency: 'TWD', bets: 18, players: 12, betAmount: '36,440.00 TWD', payoutAmount: '24,520.00 TWD' }
  ],
  'integration:api': [
    { id: 'POST /v1/games/launch', subject: '啟動已授權遊戲', method: 'POST', environment: 'Sandbox', version: 'v1', status: '唯讀文件', updatedAt: '2026-09-04' },
    { id: 'POST /v1/wallet/balance', subject: '查詢會員餘額', method: 'POST', environment: 'Sandbox', version: 'v1', status: '唯讀文件', updatedAt: '2026-09-04' }
  ],
  'integration:credentials': [
    { id: 'cred_sandbox_01', subject: 'Sandbox 串接憑證', identifier: 'GGAP-SB-OP1001', secret: '••••••••••••', environment: 'Sandbox', status: '啟用', updatedAt: '2026-09-01' }
  ],
  'integration:ip': [
    { id: 'IP-001', subject: '203.0.113.0/28', environment: 'Sandbox', reason: '商戶 API 測試來源', status: '待確認', updatedAt: '2026-09-04 15:10' }
  ],
  'integration:callbacks': [
    { id: 'CB-20260904-001', subject: 'Bet／ORD-90001', http: '200 OK', environment: 'Sandbox', status: '成功', updatedAt: '2026-09-04 18:02:11' },
    { id: 'CB-20260904-002', subject: 'Win／ORD-90001', http: '504 Timeout', environment: 'Sandbox', status: '失敗', updatedAt: '2026-09-04 18:02:46' }
  ]
}

const reportColumns: Column[] = [
  { title: '對象／日期', key: 'subject', minWidth: 230 }, { title: '原幣', key: 'currency', width: 90 }, { title: '下注筆數', key: 'bets', width: 105 },
  { title: '投注人數', key: 'players', width: 105 }, { title: '投注金額', key: 'betAmount', minWidth: 160, money: true }, { title: '派彩金額', key: 'payoutAmount', minWidth: 160, money: true }
]
const accountingColumns: Column[] = [
  { title: '期間', key: 'period', minWidth: 180 }, { title: '對象', key: 'subject', minWidth: 210 }, { title: '原幣／結算幣別', key: 'currencies', minWidth: 190 },
  { title: '來源狀態', key: 'source', minWidth: 160 }, { title: '金額', key: 'amount', minWidth: 140, money: true }, { title: '狀態', key: 'status', width: 110, status: true }, { title: '更新時間', key: 'updatedAt', width: 155 }
]
const financeColumns: Column[] = [
  { title: '期間', key: 'period', minWidth: 180 }, { title: '原幣', key: 'originalCurrency', width: 100 }, { title: '結算幣別', key: 'settlementCurrency', width: 125 },
  { title: '來源完整性', key: 'source', minWidth: 160 }, { title: '金額', key: 'amount', minWidth: 140, money: true }, { title: '狀態', key: 'status', width: 110, status: true }, { title: '更新時間', key: 'updatedAt', width: 155 }
]
const integrationColumns: Record<string, Column[]> = {
  api: [{ title: '端點', key: 'id', minWidth: 220 }, { title: '用途', key: 'subject', minWidth: 210 }, { title: '方法', key: 'method', width: 90 }, { title: '環境', key: 'environment', width: 110 }, { title: '版本', key: 'version', width: 90 }, { title: '狀態', key: 'status', width: 110, status: true }],
  credentials: [{ title: '憑證', key: 'subject', minWidth: 200 }, { title: '公開識別', key: 'identifier', minWidth: 180 }, { title: 'Secret', key: 'secret', minWidth: 150 }, { title: '環境', key: 'environment', width: 110 }, { title: '狀態', key: 'status', width: 100, status: true }, { title: '更新時間', key: 'updatedAt', width: 135 }],
  ip: [{ title: 'IP／網段', key: 'subject', minWidth: 180 }, { title: '環境', key: 'environment', width: 110 }, { title: '原因', key: 'reason', minWidth: 210 }, { title: '狀態', key: 'status', width: 110, status: true }, { title: '更新時間', key: 'updatedAt', width: 155 }],
  callbacks: [{ title: '時間', key: 'updatedAt', width: 170 }, { title: '事件／原單號', key: 'subject', minWidth: 190 }, { title: 'HTTP 摘要', key: 'http', minWidth: 140 }, { title: '環境', key: 'environment', width: 110 }, { title: '狀態', key: 'status', width: 100, status: true }]
}

const currentRows = computed(() => rowsByKey[`${props.kind}:${activeTab.value}`] || [])
const filteredRows = computed(() => currentRows.value.filter(row => !keyword.value.trim() || Object.values(row).join(' ').toLocaleLowerCase().includes(keyword.value.trim().toLocaleLowerCase())))
const columnSpecs = computed<Column[]>(() => props.kind === 'agentAccounting'
  ? accountingColumns
  : props.kind === 'merchantFinance'
    ? financeColumns
    : props.kind === 'integration'
      ? (integrationColumns[activeTab.value] || integrationColumns.api || [])
      : reportColumns)
const statusType = (value: unknown) => /成功|完整|啟用/.test(String(value)) ? 'success' : /失敗|差異/.test(String(value)) ? 'error' : 'warning'
const columns = computed<DataTableColumns<WorkspaceRow>>(() => [
  ...columnSpecs.value.map(column => ({ title: column.title, key: column.key, width: column.width, minWidth: column.minWidth, render: column.status
    ? (row: WorkspaceRow) => h(NTag, { type: statusType(row[column.key]), bordered: false, size: 'small' }, { default: () => String(row[column.key] ?? '—') })
    : (row: WorkspaceRow) => h('span', { class: column.money ? 'whitespace-nowrap font-mono tabular-nums' : '' }, String(row[column.key] ?? '—')) })),
  { title: '操作', key: 'actions', width: 90, fixed: 'right', render: row => h(NButton, { size: 'small', secondary: true, 'aria-label': `查看 ${row.id}`, onClick: () => { selected.value = row } }, { default: () => '查看' }) }
])

const changeTab = (tab: string) => { activeTab.value = tab; selected.value = null; void router.replace({ query: { ...route.query, tab } }) }
const apply = () => { void router.replace({ query: { ...route.query, tab: activeTab.value, q: keyword.value || undefined, currency: currency.value } }) }
const reset = () => { keyword.value = ''; currency.value = 'TWD'; apply() }
watch(() => route.query.tab, tab => { if (typeof tab === 'string' && definition.value.tabs.some(item => item.key === tab)) activeTab.value = tab })
</script>

<template>
  <div class="page-stack">
    <header class="page-heading"><div><p class="page-eyebrow">{{ definition.eyebrow }}</p><h1>{{ definition.title }}</h1><p>{{ definition.description }}</p></div><n-tag type="warning" :bordered="false">原型待確認</n-tag></header>

    <n-tabs :value="activeTab" type="line" animated @update:value="changeTab">
      <n-tab-pane v-for="tab in definition.tabs" :key="tab.key" :name="tab.key" :tab="tab.label" />
    </n-tabs>

    <PageFilterBar v-model:search-value="keyword" search-placeholder="輸入對象、識別或來源" :active-filter-summary="`${currency}、${definition.tabs.find(tab => tab.key === activeTab)?.label}`" @search="apply" @reset="reset">
      <template #filters>
        <label v-if="kind !== 'integration'" class="filter-field filter-field--wide"><span>日期範圍</span><n-date-picker v-model:value="range" type="daterange" :clearable="false" /></label>
        <label class="filter-field"><span>{{ kind === 'integration' ? '環境' : '原幣別' }}</span><n-select v-model:value="currency" :options="kind === 'integration' ? [{ label: 'Sandbox', value: 'Sandbox' }] : [{ label: 'TWD－新臺幣', value: 'TWD' }]" /></label>
      </template>
    </PageFilterBar>

    <div v-if="kind === 'merchantFinance'" class="portal-summary-strip"><span>Wallet：Seamless</span><span>啟用幣別線：2</span><span>未核對項目：1</span></div>
    <n-alert v-if="kind === 'integration' && activeTab === 'api'" type="info" :show-icon="true">API 文件為唯讀；詳情包含參數、回應、錯誤碼與冪等要求，不支援 OpenAPI JSON 匯入。</n-alert>
    <n-alert v-if="kind === 'agentAccounting' || kind === 'merchantFinance'" type="warning" :show-icon="true">結算幣別不固定；缺少核准條件、匯率或交易來源時，金額一律顯示「待核對」。</n-alert>

    <section class="dashboard-section" :aria-labelledby="`${kind}-workspace-title`">
      <div class="section-heading"><div><h2 :id="`${kind}-workspace-title`">{{ definition.tabs.find(tab => tab.key === activeTab)?.label }}</h2><p>Demo 資料｜目前登入範圍</p></div></div>
      <PageState v-if="!filteredRows.length" kind="empty" description="目前條件沒有資料" compact><n-button @click="reset">重置條件</n-button></PageState>
      <ResponsiveDataTable v-else :columns="columns" :data="filteredRows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1100" :row-key="row => row.id" />
    </section>

    <n-drawer :show="Boolean(selected)" width="min(760px, calc(100vw - 16px))" @update:show="value => !value && (selected = null)">
      <n-drawer-content :title="selected ? `詳情｜${selected.id}` : '詳情'" closable>
        <n-tabs v-if="selected" type="line" animated>
          <n-tab-pane name="summary" tab="資料摘要"><n-descriptions bordered label-placement="left" :column="1"><n-descriptions-item v-for="column in columnSpecs" :key="column.key" :label="column.title">{{ selected[column.key] ?? '—' }}</n-descriptions-item></n-descriptions></n-tab-pane>
          <n-tab-pane v-if="kind === 'integration'" name="technical" tab="參數與回應"><n-alert type="info" :show-icon="true">示範內容已脫敏。請求需使用唯一冪等識別；錯誤回應保存 code、message 與 Trace ID。</n-alert><n-input class="mt-4" type="textarea" :value="'{\n  &quot;code&quot;: &quot;INVALID_REQUEST&quot;,\n  &quot;message&quot;: &quot;參數驗證失敗&quot;,\n  &quot;trace_id&quot;: &quot;trace_demo_masked&quot;\n}'" readonly :rows="7" /></n-tab-pane>
          <n-tab-pane v-else name="source" tab="來源與版本"><n-alert type="warning" :show-icon="true">正式結果必須保存交易來源、條件版本與匯率版本；原型不推定未核准公式。</n-alert></n-tab-pane>
          <n-tab-pane name="logs" tab="操作紀錄"><PageState kind="empty" description="目前沒有可顯示的操作紀錄" compact /></n-tab-pane>
        </n-tabs>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
