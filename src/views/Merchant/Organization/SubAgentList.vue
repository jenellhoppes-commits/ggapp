<script setup lang="ts">
import { computed, h, reactive, ref } from 'vue'
import {
  NAlert, NButton, NCard, NCheckbox, NCheckboxGroup, NDataTable, NDescriptions, NDescriptionsItem,
  NDrawer, NDrawerContent, NForm, NFormItem, NGrid, NGridItem, NInput, NInputNumber, NSelect,
  NStatistic, NTabPane, NTabs, NTag, useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { getAgentBetLimitAccess } from '../../../mocks/gameLimits'
import type { AgentBetLimitAccess } from '../../../types/gameLimit'
import { DEFAULT_TABLE_PAGINATION, withTableSorters } from '../../../utils/tableSort'

interface SubAgentRate {
  provider_id: string
  provider_name: string
  upstream_rate: number
  child_quote_rate: number
  margin_rate: number
  rate_version: string
  effective_at: string
}

interface SubAgentRow {
  agent_id: string
  agent_name: string
  level: 'L2' | 'L3'
  parent_agent_id: string
  parent_agent: string
  agent_path: string
  child_count: number
  merchant_count: number
  provider_rates: SubAgentRate[]
  bet_limit_access: AgentBetLimitAccess[]
  fx_service_fee_rate: number
  monthly_ggr_usdt: number
  receivable_usdt: number
  status: 'active' | 'disabled' | 'settlement_hold'
  updated_at: string
}

const message = useMessage()
const keyword = ref('')
const level = ref<string | null>(null)
const showDrawer = ref(false)
const drawerMode = ref<'view' | 'edit' | 'create'>('view')
const activeTab = ref('basic')
const selectedAgent = ref<SubAgentRow | null>(null)
const selectedLimitIds = ref<string[]>([])
const rateDrafts = ref<SubAgentRate[]>([])

const providerRates = [
  { provider_id: 'PG', provider_name: 'PG Soft', upstream_rate: 0.075 },
  { provider_id: 'JILI', provider_name: 'JILI', upstream_rate: 0.09 },
  { provider_id: 'EVO', provider_name: 'Evolution', upstream_rate: 0.095 },
  { provider_id: 'PP', provider_name: 'Pragmatic Play', upstream_rate: 0.078 }
]

const makeRates = (level: 'L2' | 'L3', overrides: Record<string, number> = {}): SubAgentRate[] => providerRates.map(provider => {
  const inherited = level === 'L2' ? provider.upstream_rate : provider.upstream_rate + 0.013
  const quote = overrides[provider.provider_id] ?? inherited + 0.008
  return {
    provider_id: provider.provider_id,
    provider_name: provider.provider_name,
    upstream_rate: inherited,
    child_quote_rate: quote,
    margin_rate: Number((quote - inherited).toFixed(6)),
    rate_version: `AQR-${provider.provider_id}-2026.08`,
    effective_at: '2026-08-01T00:00:00.000+08:00'
  }
})

const rows = ref<SubAgentRow[]>([
  {
    agent_id: 'AGT-SEA-SUB01', agent_name: 'SEA Sub Agent 01', level: 'L2', parent_agent_id: 'AGT-SEA-001', parent_agent: 'SEA Growth Agent',
    agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01', child_count: 1, merchant_count: 5,
    provider_rates: makeRates('L2', { PG: 0.088, JILI: 0.102, EVO: 0.108, PP: 0.092 }),
    bet_limit_access: getAgentBetLimitAccess('AGT-SEA-SUB01'), fx_service_fee_rate: 0.004, monthly_ggr_usdt: 42100, receivable_usdt: 3283.8,
    status: 'active', updated_at: '2026-08-01T00:00:00.000+08:00'
  },
  {
    agent_id: 'AGT-SEA-SUB01-L3', agent_name: 'SEA Local Desk L3', level: 'L3', parent_agent_id: 'AGT-SEA-SUB01', parent_agent: 'SEA Sub Agent 01',
    agent_path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3', child_count: 0, merchant_count: 3,
    provider_rates: makeRates('L3', { PG: 0.096, JILI: 0.11, EVO: 0.116, PP: 0.1 }),
    bet_limit_access: getAgentBetLimitAccess('AGT-SEA-SUB01-L3', false), fx_service_fee_rate: 0.004, monthly_ggr_usdt: 18300, receivable_usdt: 1537.2,
    status: 'active', updated_at: '2026-08-01T00:00:00.000+08:00'
  }
])

const formValue = reactive({
  agent_id: '', agent_name: '', level: 'L2' as 'L2' | 'L3', parent_agent_id: 'AGT-SEA-001', parent_agent: 'SEA Growth Agent',
  status: 'active' as SubAgentRow['status'], fx_service_fee_rate: 0.004
})

const filteredRows = computed(() => rows.value.filter(row => {
  const text = `${row.agent_id} ${row.agent_name} ${row.parent_agent} ${row.agent_path}`.toLowerCase()
  return (!keyword.value || text.includes(keyword.value.toLowerCase())) && (!level.value || row.level === level.value)
}))
const totalReceivable = computed(() => filteredRows.value.reduce((sum, row) => sum + row.receivable_usdt, 0))
const l2Count = computed(() => rows.value.filter(row => row.level === 'L2').length)
const l3Count = computed(() => rows.value.filter(row => row.level === 'L3').length)
const merchantCount = computed(() => rows.value.reduce((sum, row) => sum + row.merchant_count, 0))
const formatRate = (value: number) => `${(value * 100).toFixed(2)}%`

const availableLimits = computed(() => {
  const parent = rows.value.find(row => row.agent_id === formValue.parent_agent_id)
  const parentAccess = parent?.bet_limit_access ?? getAgentBetLimitAccess('AGT-SEA-001')
  return parentAccess
    .filter(item => item.assignable_to_child)
    .map(item => ({ ...item, assignable_to_child: formValue.level === 'L2', assigned_merchant_count: 0 }))
})

const resetDrafts = (agent: SubAgentRow | null, targetLevel: 'L2' | 'L3') => {
  rateDrafts.value = agent ? agent.provider_rates.map(rate => ({ ...rate })) : makeRates(targetLevel)
  selectedLimitIds.value = agent ? agent.bet_limit_access.map(item => item.provider_bet_group_id) : availableLimits.value.map(item => item.provider_bet_group_id)
}

const openCreate = (parent?: SubAgentRow) => {
  if (parent?.level === 'L3') return
  drawerMode.value = 'create'
  selectedAgent.value = null
  formValue.level = parent ? 'L3' : 'L2'
  formValue.parent_agent_id = parent?.agent_id || 'AGT-SEA-001'
  formValue.parent_agent = parent?.agent_name || 'SEA Growth Agent'
  formValue.agent_id = ''
  formValue.agent_name = ''
  formValue.status = 'active'
  formValue.fx_service_fee_rate = parent?.fx_service_fee_rate ?? 0.004
  resetDrafts(parent || null, formValue.level)
  activeTab.value = 'basic'
  showDrawer.value = true
}

const openAgent = (agent: SubAgentRow, mode: 'view' | 'edit', tab = 'basic') => {
  selectedAgent.value = agent
  drawerMode.value = mode
  Object.assign(formValue, {
    agent_id: agent.agent_id, agent_name: agent.agent_name, level: agent.level,
    parent_agent_id: agent.parent_agent_id, parent_agent: agent.parent_agent,
    status: agent.status, fx_service_fee_rate: agent.fx_service_fee_rate
  })
  resetDrafts(agent, agent.level)
  activeTab.value = tab
  showDrawer.value = true
}

const saveAgent = () => {
  if (!formValue.agent_id.trim() || !formValue.agent_name.trim()) {
    message.error('請填寫代理代碼與代理名稱')
    return
  }
  if (drawerMode.value === 'create' && rows.value.some(row => row.agent_id === formValue.agent_id.trim())) {
    message.error('代理代碼已存在')
    return
  }
  const invalidRate = rateDrafts.value.find(rate => rate.child_quote_rate < rate.upstream_rate)
  if (invalidRate) {
    message.error(`${invalidRate.provider_name} 的下層費率不可低於上游費率`)
    return
  }
  if (!selectedLimitIds.value.length) {
    message.error('至少需開放一個上級代理可分配的下注限額方案')
    return
  }

  const effectiveAt = new Date().toISOString()
  const version = effectiveAt.slice(0, 10).replace(/-/g, '')
  const rates = rateDrafts.value.map(rate => ({ ...rate, rate_version: `AQR-${formValue.agent_id}-${rate.provider_id}-${version}`, effective_at: effectiveAt }))
  const limits = availableLimits.value.filter(item => selectedLimitIds.value.includes(item.provider_bet_group_id))

  if (drawerMode.value === 'create') {
    const created: SubAgentRow = {
      agent_id: formValue.agent_id.trim(), agent_name: formValue.agent_name.trim(), level: formValue.level,
      parent_agent_id: formValue.parent_agent_id, parent_agent: formValue.parent_agent,
      agent_path: `${formValue.parent_agent_id === 'AGT-SEA-001' ? 'AGT-SEA-001' : rows.value.find(row => row.agent_id === formValue.parent_agent_id)?.agent_path} / ${formValue.agent_id.trim()}`,
      child_count: 0, merchant_count: 0, provider_rates: rates, bet_limit_access: limits,
      fx_service_fee_rate: formValue.fx_service_fee_rate, monthly_ggr_usdt: 0, receivable_usdt: 0,
      status: formValue.status, updated_at: effectiveAt
    }
    rows.value.unshift(created)
    const parent = rows.value.find(row => row.agent_id === created.parent_agent_id)
    if (parent) parent.child_count += 1
    selectedAgent.value = created
    drawerMode.value = 'edit'
    message.success('下級代理已建立，費率與下注限額授權已建立新版本')
  } else if (selectedAgent.value) {
    Object.assign(selectedAgent.value, {
      agent_name: formValue.agent_name, status: formValue.status, fx_service_fee_rate: formValue.fx_service_fee_rate,
      provider_rates: rates, bet_limit_access: limits, updated_at: effectiveAt
    })
    message.success('代理設定已儲存；歷史注單、Session 與帳單快照不會重算')
  }
}

const rateColumns: DataTableColumns<SubAgentRate> = [
  { title: '供應商', key: 'provider_name', width: 150 },
  { title: '上游費率', key: 'upstream_rate', width: 125, align: 'right', render: row => formatRate(row.upstream_rate) },
  {
    title: '下層代理費率', key: 'child_quote_rate', width: 190, align: 'right',
    render: row => h(NInputNumber, {
      value: row.child_quote_rate, min: row.upstream_rate, max: 0.5, step: 0.001, size: 'small', disabled: drawerMode.value === 'view',
      onUpdateValue: (value: number | null) => {
        row.child_quote_rate = value ?? row.upstream_rate
        row.margin_rate = Number((row.child_quote_rate - row.upstream_rate).toFixed(6))
      }
    }, { suffix: () => formatRate(row.child_quote_rate) })
  },
  { title: '層級差額', key: 'margin_rate', width: 120, align: 'right', render: row => formatRate(row.margin_rate) },
  { title: '版本', key: 'rate_version', minWidth: 180 }
]

const columns: DataTableColumns<SubAgentRow> = [
  { title: '代理代碼', key: 'agent_id', width: 165, render: row => h('span', { class: 'font-mono text-cyan-300' }, row.agent_id) },
  { title: '代理名稱', key: 'agent_name', minWidth: 170 },
  { title: '層級', key: 'level', width: 80, render: row => h(NTag, { type: row.level === 'L2' ? 'info' : 'warning', size: 'small', bordered: false }, { default: () => row.level }) },
  { title: '上級代理', key: 'parent_agent', minWidth: 160 },
  { title: '子代理', key: 'child_count', width: 90, align: 'right' },
  { title: '商戶數', key: 'merchant_count', width: 90, align: 'right' },
  { title: '供應商費率', key: 'provider_rates', width: 115, align: 'right', render: row => `${row.provider_rates.length} 組` },
  { title: '限額授權', key: 'bet_limit_access', width: 110, align: 'right', render: row => `${row.bet_limit_access.length} 個` },
  { title: '本月 GGR', key: 'monthly_ggr_usdt', width: 135, align: 'right', render: row => h('span', { class: row.monthly_ggr_usdt >= 0 ? 'text-emerald-400' : 'text-red-400' }, `USDT ${row.monthly_ggr_usdt.toLocaleString()}`) },
  { title: '上級應收', key: 'receivable_usdt', width: 125, align: 'right', render: row => `USDT ${row.receivable_usdt.toLocaleString()}` },
  {
    title: '狀態', key: 'status', width: 110,
    render: row => {
      const typeMap = { active: 'success', disabled: 'error', settlement_hold: 'warning' } as const
      const labelMap = { active: '啟用', disabled: '停用', settlement_hold: '結算觀察' }
      return h(NTag, { type: typeMap[row.status], size: 'small', bordered: false }, { default: () => labelMap[row.status] })
    }
  },
  {
    title: '操作', key: 'actions', width: 240, fixed: 'right',
    render: row => h('div', { class: 'flex flex-wrap gap-2' }, [
      h(NButton, { size: 'small', secondary: true, onClick: () => openAgent(row, 'view') }, { default: () => '查看' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openAgent(row, 'edit', 'rates') }, { default: () => '費率' }),
      h(NButton, { size: 'small', secondary: true, onClick: () => openAgent(row, 'edit', 'limits') }, { default: () => '限額' }),
      h(NButton, { size: 'small', secondary: true, disabled: row.level === 'L3', onClick: () => openCreate(row) }, { default: () => '新增下級' })
    ])
  }
]
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div><h1 class="text-2xl font-bold text-white">下級代理</h1><p class="mt-2 text-sm text-gray-500">代理最多三級；L1 可建立 L2，L2 可建立 L3，L3 不可再新增下級。</p></div>
      <n-button type="primary" @click="openCreate()">新增 L2 代理</n-button>
    </header>

    <n-alert type="warning" :show-icon="false" class="!bg-[#3a2b14]">
      下級代理費率依供應商設定，未另行調整時沿用上級代理的預設下層報價；匯率服務費獨立繼承。下注限額只能從上級已開放的 Provider 幣別線方案中下放。
    </n-alert>

    <n-grid cols="1 m:2 l:4" :x-gap="16" :y-gap="16" responsive="screen">
      <n-grid-item><n-card><n-statistic label="L2 / L3" :value="`${l2Count} / ${l3Count}`" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="關聯商戶" :value="merchantCount" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="下級應收參考" :value="`USDT ${totalReceivable.toLocaleString()}`" /></n-card></n-grid-item>
      <n-grid-item><n-card><n-statistic label="GGAP 正式收款" value="僅 L1" /></n-card></n-grid-item>
    </n-grid>

    <n-card>
      <div class="mb-4 grid gap-3 md:grid-cols-[minmax(260px,1fr)_180px_auto]">
        <n-input v-model:value="keyword" clearable placeholder="搜尋代理代碼 / 名稱 / 上級代理" />
        <n-select v-model:value="level" clearable placeholder="代理層級" :options="[{ label: 'L2', value: 'L2' }, { label: 'L3', value: 'L3' }]" />
        <n-button tertiary @click="keyword = ''; level = null">重置</n-button>
      </div>
      <n-data-table :columns="withTableSorters(columns)" :data="filteredRows" :pagination="DEFAULT_TABLE_PAGINATION" :scroll-x="1660" striped />
    </n-card>

    <n-drawer :show="showDrawer" width="min(960px, 100vw)" @update:show="showDrawer = $event">
      <n-drawer-content :title="drawerMode === 'create' ? `新增 ${formValue.level} 代理` : `${formValue.agent_name} / ${formValue.agent_id}`" closable>
        <n-alert type="info" :show-icon="false" class="mb-4">供應商費率只作代理層級報價與毛利試算，不代表代理與供應商直接結算；供應商應付仍由 GGAP 獨立處理。</n-alert>
        <n-tabs v-model:value="activeTab" type="line" animated>
          <n-tab-pane name="basic" tab="基本資料">
            <n-form label-placement="left" label-width="130">
              <n-form-item label="代理層級"><n-input :value="formValue.level" readonly /></n-form-item>
              <n-form-item label="上級代理"><n-input :value="`${formValue.parent_agent} / ${formValue.parent_agent_id}`" readonly /></n-form-item>
              <n-form-item label="代理代碼" required><n-input v-model:value="formValue.agent_id" :disabled="drawerMode !== 'create'" placeholder="例如 AGT-SEA-SUB02" /></n-form-item>
              <n-form-item label="代理名稱" required><n-input v-model:value="formValue.agent_name" :readonly="drawerMode === 'view'" /></n-form-item>
              <n-form-item label="狀態"><n-select v-model:value="formValue.status" :disabled="drawerMode === 'view'" :options="[{ label: '啟用', value: 'active' }, { label: '停用', value: 'disabled' }, { label: '結算觀察', value: 'settlement_hold' }]" /></n-form-item>
              <n-form-item label="匯率服務費"><n-input :value="formatRate(formValue.fx_service_fee_rate)" readonly /></n-form-item>
            </n-form>
          </n-tab-pane>

          <n-tab-pane name="rates" tab="供應商費率">
            <n-alert type="warning" :show-icon="false" class="mb-4">下層代理費率不得低於上游費率。儲存會建立新費率版本與生效時間，不回寫歷史帳務。</n-alert>
            <n-data-table :columns="withTableSorters(rateColumns)" :data="rateDrafts" :pagination="false" :scroll-x="850" />
          </n-tab-pane>

          <n-tab-pane name="limits" tab="下注限額授權">
            <n-alert type="info" :show-icon="false" class="mb-4">方案區間由 Provider 依幣別線提供，代理只能勾選上級已開放方案；不可自行輸入最小或最大投注。</n-alert>
            <n-checkbox-group v-model:value="selectedLimitIds" class="block space-y-3">
              <label v-for="item in availableLimits" :key="item.provider_bet_group_id" class="flex cursor-pointer items-center justify-between gap-4 rounded border border-white/10 bg-[#202026] p-4">
                <div class="flex items-center gap-3"><n-checkbox :value="item.provider_bet_group_id" :disabled="drawerMode === 'view'" /><div><div>{{ item.provider_name }} / {{ item.provider_bet_group_name }}</div><div class="mt-1 font-mono text-xs text-gray-500">{{ item.provider_currency_connection_id }} / {{ item.provider_bet_group_code }}</div></div></div>
                <div class="text-right text-sm"><n-tag size="small" :bordered="false">{{ item.display_currency }}</n-tag><div class="mt-1">{{ item.min_bet_display.toLocaleString() }} - {{ item.max_bet_display.toLocaleString() }}</div></div>
              </label>
            </n-checkbox-group>
          </n-tab-pane>

          <n-tab-pane name="settlement" tab="帳務定位">
            <n-descriptions bordered :column="1" label-placement="left">
              <n-descriptions-item label="層級路徑">{{ selectedAgent?.agent_path || `${formValue.parent_agent_id} / ${formValue.agent_id || '新代理'}` }}</n-descriptions-item>
              <n-descriptions-item label="GGAP 正式收款">僅向 Root L1 代理開帳</n-descriptions-item>
              <n-descriptions-item label="下級代理應收">上級代理內部帳務與報表，不形成 GGAP 對 L2 / L3 的正式帳單</n-descriptions-item>
              <n-descriptions-item label="下注來源">逐會員逐筆原幣注單，00:10 日結完成後鎖定 USDT 換算與費率版本</n-descriptions-item>
            </n-descriptions>
          </n-tab-pane>
        </n-tabs>
        <template #footer><div class="flex justify-end gap-2"><n-button @click="showDrawer = false">關閉</n-button><n-button v-if="drawerMode !== 'view'" type="primary" @click="saveAgent">{{ drawerMode === 'create' ? '建立代理' : '儲存新版本' }}</n-button></div></template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
