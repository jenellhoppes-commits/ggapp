<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NInput,
  NSelect,
  NTabPane,
  NTabs,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import PageFilterBar from '../../components/Common/PageFilterBar.vue'
import PageState from '../../components/Common/PageState.vue'
import ResponsiveDataTable from '../../components/Common/ResponsiveDataTable.vue'

type PageKind = 'agentMerchants' | 'subAgents' | 'players' | 'games' | 'bets' | 'transactions'
interface PortalRow { id: string; [key: string]: string | number | boolean | null }
interface ColumnSpec { title: string; key: string; width?: number; minWidth?: number; status?: boolean; money?: boolean }

const props = defineProps<{ kind: PageKind }>()
const route = useRoute()
const router = useRouter()
const message = useMessage()

const definitions: Record<PageKind, {
  eyebrow: string; title: string; description: string; primary?: string; columns: ColumnSpec[]; rows: PortalRow[]
}> = {
  agentMerchants: {
    eyebrow: '組織管理', title: '商戶管理', description: '管理代理樹內商戶草稿並查看核准與啟用狀態。', primary: '新增商戶草稿',
    columns: [
      { title: '商戶', key: 'name', minWidth: 210 }, { title: '歸屬', key: 'owner', minWidth: 180 }, { title: '狀態', key: 'status', width: 100, status: true },
      { title: 'Wallet', key: 'wallet', width: 120 }, { title: '幣別線', key: 'lines', minWidth: 150 }, { title: '遊戲授權', key: 'games', width: 130 }, { title: '更新時間', key: 'updatedAt', width: 155 }
    ],
    rows: [
      { id: 'OP-1001', name: 'Blue Whale Interactive', owner: 'SEA Master Agent / 直屬', status: '啟用', wallet: 'Seamless', lines: '2 條｜TWD、PHP', games: '36／32 可用', updatedAt: '2026-09-04 18:12' },
      { id: 'OP-1002', name: 'Royal Ace Group', owner: 'SEA Sub Agent 01', status: '待審核', wallet: 'Transfer', lines: '1 條｜TWD', games: '24／待核對', updatedAt: '2026-09-04 16:35' },
      { id: 'OP-DRAFT-03', name: 'Sunrise Demo', owner: 'SEA Master Agent / 直屬', status: '草稿', wallet: '待確認', lines: '需求：THB', games: '尚未授權', updatedAt: '2026-09-04 14:08' }
    ]
  },
  subAgents: {
    eyebrow: '組織管理', title: '下級代理', description: '查看代理樹內下一層代理、商戶範圍與條件來源。', primary: '新增下一層代理草稿',
    columns: [
      { title: '代理', key: 'name', minWidth: 210 }, { title: '層級與路徑', key: 'path', minWidth: 210 }, { title: '狀態', key: 'status', width: 100, status: true },
      { title: '商戶數', key: 'merchants', width: 130 }, { title: '條件狀態', key: 'condition', minWidth: 170 }, { title: '更新時間', key: 'updatedAt', width: 155 }
    ],
    rows: [
      { id: 'AGT-SEA-SUB01', name: 'SEA Sub Agent 01', path: 'L2｜SEA Master Agent', status: '啟用', merchants: '直接 4／樹內 6', condition: '版本 AQR-202609', updatedAt: '2026-09-04 17:22' },
      { id: 'AGT-SEA-SUB02', name: 'SEA Sub Agent 02', path: 'L2｜SEA Master Agent', status: '啟用', merchants: '直接 2／樹內 2', condition: '待核對', updatedAt: '2026-09-04 15:10' },
      { id: 'AGT-DRAFT-03', name: 'Indonesia Channel', path: 'L2｜SEA Master Agent', status: '草稿', merchants: '0', condition: '缺少來源', updatedAt: '2026-09-04 11:40' }
    ]
  },
  players: {
    eyebrow: '營運管理', title: '會員查詢', description: '唯讀查詢目前商戶的會員、Wallet、原幣與來源時間。',
    columns: [
      { title: '會員', key: 'name', minWidth: 210 }, { title: 'Wallet／原幣', key: 'wallet', minWidth: 160 }, { title: '餘額快照', key: 'balance', minWidth: 170 },
      { title: '狀態', key: 'status', width: 100, status: true }, { title: '最近活動', key: 'updatedAt', width: 170 }, { title: '來源', key: 'source', minWidth: 150 }
    ],
    rows: [
      { id: 'MEM-TWD-10001', name: 'player_10001', wallet: 'Seamless／TWD', balance: '12,840.50 TWD', status: '啟用', updatedAt: '2026-09-04 18:05', source: 'Wallet 18:05' },
      { id: 'MEM-TWD-10002', name: 'player_10002', wallet: 'Seamless／TWD', balance: '資料待確認', status: '來源未知', updatedAt: '2026-09-04 17:41', source: '缺 Wallet 回應' },
      { id: 'MEM-PHP-10003', name: 'player_10003', wallet: 'Transfer／PHP', balance: '8,220.00 PHP', status: '限制', updatedAt: '2026-09-04 16:12', source: '帳本 16:12' }
    ]
  },
  games: {
    eyebrow: '營運管理', title: '我的遊戲', description: '查看目前商戶獲得授權且通過幣別線能力檢核的遊戲。',
    columns: [
      { title: '遊戲', key: 'name', minWidth: 210 }, { title: '供應商', key: 'provider', minWidth: 150 }, { title: '原幣線', key: 'lines', minWidth: 150 },
      { title: '類型', key: 'type', width: 100 }, { title: '平台狀態', key: 'platformStatus', width: 110, status: true }, { title: '商戶狀態', key: 'status', width: 110, status: true }, { title: '更新時間', key: 'updatedAt', width: 155 }
    ],
    rows: [
      { id: 'PG-MW-001', name: 'Mahjong Ways', provider: 'PG Soft', lines: 'TWD、PHP', type: 'Slot', platformStatus: '上架', status: '啟用', updatedAt: '2026-09-04 17:48' },
      { id: 'PP-SG-002', name: 'Sweet Bonanza', provider: 'Pragmatic Play', lines: 'TWD', type: 'Slot', platformStatus: '維護', status: '停用', updatedAt: '2026-09-04 16:20' },
      { id: 'EVO-BA-003', name: 'Baccarat A', provider: 'Evolution', lines: 'PHP', type: 'Live', platformStatus: '上架', status: '啟用', updatedAt: '2026-09-04 15:45' }
    ]
  },
  bets: {
    eyebrow: '交易中心', title: '注單查詢', description: '逐會員、逐筆查看商戶範圍內的原幣注單與來源事件。',
    columns: [
      { title: '注單識別', key: 'name', minWidth: 210 }, { title: '會員', key: 'member', minWidth: 150 }, { title: '遊戲／供應商', key: 'game', minWidth: 190 },
      { title: '原幣投注', key: 'bet', minWidth: 145, money: true }, { title: '原幣派彩', key: 'payout', minWidth: 145, money: true }, { title: '狀態', key: 'status', width: 105, status: true }, { title: '下注時間', key: 'updatedAt', width: 170 }
    ],
    rows: [
      { id: 'BET-0001', name: 'BET-0001｜Round R-8811', member: 'player_10001', game: 'Mahjong Ways／PG Soft', bet: '1,200.00 TWD', payout: '860.00 TWD', status: '已完成', updatedAt: '2026-09-04 18:01:10' },
      { id: 'BET-0002', name: 'BET-0002｜Round R-8811', member: 'player_10001', game: 'Mahjong Ways／PG Soft', bet: '300.00 TWD', payout: '0.00 TWD', status: '已完成', updatedAt: '2026-09-04 18:01:18' },
      { id: 'BET-0003', name: 'BET-0003｜Round R-8812', member: 'player_10002', game: 'Baccarat A／Evolution', bet: '5,000.00 PHP', payout: '待確認', status: '處理中', updatedAt: '2026-09-04 17:55:47' }
    ]
  },
  transactions: {
    eyebrow: '交易中心', title: '交易流水', description: '查看 Wallet 與遊戲交易事件；異常只提供來源追查。',
    columns: [
      { title: '交易識別', key: 'name', minWidth: 210 }, { title: '關聯注單', key: 'betId', minWidth: 140 }, { title: '會員', key: 'member', minWidth: 140 },
      { title: '事件／方向', key: 'event', minWidth: 150 }, { title: '原幣金額', key: 'amount', minWidth: 150, money: true }, { title: '狀態', key: 'status', width: 105, status: true }, { title: '發生時間', key: 'updatedAt', width: 170 }
    ],
    rows: [
      { id: 'TX-BET-0001', name: 'TX-BET-0001', betId: 'BET-0001', member: 'player_10001', event: 'Bet／扣款', amount: '-1,200.00 TWD', status: '成功', updatedAt: '2026-09-04 18:01:10' },
      { id: 'TX-WIN-0001', name: 'TX-WIN-0001', betId: 'BET-0001', member: 'player_10001', event: 'Win／加款', amount: '+860.00 TWD', status: '成功', updatedAt: '2026-09-04 18:02:45' },
      { id: 'TX-REF-0003', name: 'TX-REF-0003', betId: 'BET-0003', member: 'player_10002', event: '查單／無資金異動', amount: '5,000.00 PHP', status: '需確認', updatedAt: '2026-09-04 17:58:02' }
    ]
  }
}

const definition = computed(() => definitions[props.kind])
const rows = ref<PortalRow[]>(definition.value.rows.map(row => ({ ...row })))
const keyword = ref(typeof route.query.q === 'string' ? route.query.q : '')
const status = ref(typeof route.query.status === 'string' ? route.query.status : null)
const moreExpanded = ref(false)
const applied = ref({ keyword: keyword.value, status: status.value })
const selected = ref<PortalRow | null>(null)
const showCreate = ref(false)
const draftName = ref('')

const statusOptions = computed(() => [
  { label: '全部狀態', value: '' },
  ...Array.from(new Set(rows.value.map(row => String(row.status || '')).filter(Boolean))).map(value => ({ label: value, value }))
])
const filteredRows = computed(() => rows.value.filter(row => {
  const query = applied.value.keyword.trim().toLocaleLowerCase()
  return (!query || Object.values(row).join(' ').toLocaleLowerCase().includes(query)) && (!applied.value.status || row.status === applied.value.status)
}))
const activeSummary = computed(() => [applied.value.keyword && `關鍵字 ${applied.value.keyword}`, applied.value.status].filter(Boolean).join('、'))
const pagination = ref<PaginationProps>({ page: 1, pageSize: 10, showSizePicker: true, pageSizes: [10, 20, 50], onUpdatePage: page => { pagination.value.page = page; void syncUrl(page) }, onUpdatePageSize: size => { pagination.value.pageSize = size; pagination.value.page = 1; void syncUrl(1) } })

const statusType = (value: unknown) => {
  const text = String(value)
  if (/啟用|成功|已完成|上架/.test(text)) return 'success'
  if (/草稿|未知|待|處理中|需確認/.test(text)) return 'warning'
  if (/停用|限制|失敗|維護/.test(text)) return 'error'
  return 'default'
}
const columns = computed<DataTableColumns<PortalRow>>(() => [
  ...definition.value.columns.map(column => ({
    title: column.title,
    key: column.key,
    width: column.width,
    minWidth: column.minWidth,
    render: column.status
      ? (row: PortalRow) => h(NTag, { type: statusType(row[column.key]), bordered: false, size: 'small' }, { default: () => String(row[column.key]) })
      : (row: PortalRow) => h('span', { class: column.money ? 'whitespace-nowrap font-mono tabular-nums' : '' }, String(row[column.key] ?? '—'))
  })),
  { title: '操作', key: 'actions', width: 90, fixed: 'right', render: row => h(NButton, { size: 'small', secondary: true, 'aria-label': `查看 ${row.id}`, onClick: () => openRow(row) }, { default: () => '查看' }) }
])

const syncUrl = (page = pagination.value.page || 1) => router.replace({ query: { q: applied.value.keyword || undefined, status: applied.value.status || undefined, page: String(page), pageSize: String(pagination.value.pageSize || 10), id: selected.value?.id || undefined } })
const applyFilters = () => { applied.value = { keyword: keyword.value, status: status.value }; pagination.value.page = 1; void syncUrl(1) }
const resetFilters = () => { keyword.value = ''; status.value = null; applyFilters() }
const openRow = (row: PortalRow) => { selected.value = row; void syncUrl() }
const closeRow = () => { selected.value = null; void syncUrl() }
const createDraft = () => {
  if (!draftName.value.trim()) return
  const prefix = props.kind === 'agentMerchants' ? 'OP-DRAFT' : 'AGT-DRAFT'
  rows.value.unshift({ id: `${prefix}-${String(rows.value.length + 1).padStart(2, '0')}`, name: draftName.value.trim(), status: '草稿', owner: '目前代理', path: '待建立後確認', wallet: '待確認', lines: '待確認', games: '尚未授權', merchants: '0', condition: '缺少來源', updatedAt: '剛剛' })
  draftName.value = ''
  showCreate.value = false
  message.success('草稿已建立；尚未正式啟用')
}

watch(() => route.query.id, id => { selected.value = typeof id === 'string' ? rows.value.find(row => row.id === id) || null : null }, { immediate: true })
</script>

<template>
  <div class="page-stack">
    <header class="page-heading">
      <div><p class="page-eyebrow">{{ definition.eyebrow }}</p><h1>{{ definition.title }}</h1><p>{{ definition.description }}</p></div>
      <n-button v-if="definition.primary" type="primary" @click="showCreate = true">{{ definition.primary }}</n-button>
    </header>

    <PageFilterBar v-model:search-value="keyword" :search-placeholder="`${definition.title}關鍵字`" :active-filter-summary="activeSummary" show-more :more-expanded="moreExpanded" @update:more-expanded="moreExpanded = $event" @search="applyFilters" @reset="resetFilters">
      <template #filters><label class="filter-field"><span>狀態</span><n-select v-model:value="status" :options="statusOptions" clearable /></label></template>
      <template #more><label class="filter-field"><span>資料範圍</span><n-select value="current" :options="[{ label: '目前登入範圍', value: 'current' }]" disabled /></label></template>
    </PageFilterBar>

    <div class="portal-summary-strip"><span>資料範圍：目前登入角色</span><span>共 {{ filteredRows.length }} 筆</span><span>Demo 資料</span></div>

    <section class="dashboard-section" :aria-labelledby="`${kind}-table-title`">
      <div class="section-heading"><div><h2 :id="`${kind}-table-title`">{{ definition.title }}清單</h2><p>完整識別、來源與歷史請由「查看」開啟。</p></div></div>
      <PageState v-if="!filteredRows.length" kind="empty" :description="`沒有符合目前條件的${definition.title}`" compact><n-button @click="resetFilters">重置條件</n-button></PageState>
      <ResponsiveDataTable v-else :columns="columns" :data="filteredRows" :pagination="pagination" :scroll-x="1280" :row-key="row => row.id" />
    </section>

    <n-drawer :show="Boolean(selected)" width="min(760px, calc(100vw - 16px))" @update:show="value => !value && closeRow()">
      <n-drawer-content :title="selected ? `${definition.title}｜${selected.id}` : definition.title" closable>
        <n-tabs v-if="selected" type="line" animated>
          <n-tab-pane name="overview" tab="概況"><n-descriptions bordered label-placement="left" :column="1"><n-descriptions-item v-for="column in definition.columns" :key="column.key" :label="column.title">{{ selected[column.key] ?? '—' }}</n-descriptions-item></n-descriptions></n-tab-pane>
          <n-tab-pane name="source" tab="來源與限制"><n-alert type="info" :show-icon="true">此為 {{ props.kind.startsWith('agent') || props.kind === 'subAgents' ? '代理樹' : '目前商戶' }}範圍的 Demo 資料；正式操作仍需服務端權限與資料來源驗證。</n-alert></n-tab-pane>
          <n-tab-pane name="logs" tab="操作紀錄"><PageState kind="empty" description="目前沒有可顯示的操作紀錄" compact /></n-tab-pane>
        </n-tabs>
      </n-drawer-content>
    </n-drawer>

    <n-drawer v-model:show="showCreate" width="min(560px, calc(100vw - 16px))">
      <n-drawer-content :title="definition.primary" closable>
        <n-alert type="warning" :show-icon="true" class="mb-4">原型只建立草稿，不會啟用正式費率、憑證、遊戲授權或資金操作。</n-alert>
        <label class="filter-field !w-full"><span>名稱</span><n-input v-model:value="draftName" placeholder="請輸入草稿名稱" /></label>
        <template #footer><n-button type="primary" :disabled="!draftName.trim()" @click="createDraft">建立草稿</n-button></template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
