<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NDatePicker, NIcon, NSelect, NTag } from 'naive-ui'
import { ArrowForwardRound, ScienceOutlined } from '@vicons/material'
import PageFilterBar from '../../components/Common/PageFilterBar.vue'

const props = defineProps<{ portal: 'agent' | 'merchant' }>()
const route = useRoute()
const router = useRouter()
const demoDate = '2026-09-04'
const toTimestamp = (value: string) => Date.parse(`${value}T00:00:00+08:00`)
const toDate = (value: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date(value))
const initialFrom = typeof route.query.from === 'string' ? route.query.from : demoDate
const initialTo = typeof route.query.to === 'string' ? route.query.to : demoDate
const range = ref<[number, number]>([toTimestamp(initialFrom), toTimestamp(initialTo)])
const currency = ref(typeof route.query.currency === 'string' ? route.query.currency : 'TWD')
const applied = ref({ from: initialFrom, to: initialTo, currency: currency.value })

const title = computed(() => props.portal === 'agent' ? '代理總覽' : '商戶總覽')
const identity = computed(() => props.portal === 'agent' ? 'SEA Master Agent（代理樹範圍）' : 'Golden Dragon（自身商戶）')
const reportPath = computed(() => props.portal === 'agent' ? '/agent/reports' : '/merchant/reports')
const hasSample = computed(() => applied.value.from <= demoDate && applied.value.to >= demoDate && applied.value.currency === 'TWD')
const metrics = computed(() => [
  { label: '下注筆數', value: hasSample.value ? (props.portal === 'agent' ? 126 : 42) : 0, money: false },
  { label: '投注人數', value: hasSample.value ? (props.portal === 'agent' ? 74 : 28) : 0, money: false },
  { label: '投注金額', value: hasSample.value ? (props.portal === 'agent' ? 268420 : 87640) : 0, money: true },
  { label: '派彩金額', value: hasSample.value ? (props.portal === 'agent' ? 193840 : 62980) : 0, money: true }
])
const organization = computed(() => props.portal === 'agent'
  ? [
      { label: '啟用商戶', value: 10, path: '/agent/merchants?status=active' },
      { label: '啟用下級代理', value: 4, path: '/agent/organization/sub-agents?status=active' },
      { label: '待完成商戶草稿', value: 2, path: '/agent/merchants?status=draft' }
    ]
  : [
      { label: '啟用幣別線', value: 2, path: '/merchant/finance/invoices' },
      { label: '可用遊戲', value: 36, path: '/merchant/games?status=enabled' },
      { label: 'Callback 資料狀態', value: '待核對', path: '/merchant/integration?tab=callbacks' }
    ])
const pending = computed(() => props.portal === 'agent'
  ? [
      { title: '商戶草稿待補資料', reason: '2 筆草稿尚未送交核准', path: '/agent/merchants?status=draft' },
      { title: '對帳來源待核對', reason: '缺少 1 個匯率版本', path: '/agent/finance/accounting?source=incomplete' }
    ]
  : [
      { title: '串接來源 IP 待確認', reason: 'Sandbox IP 尚未完成核准', path: '/merchant/integration?tab=ip' },
      { title: '帳單來源待核對', reason: '1 期帳單缺少匯率版本', path: '/merchant/finance/invoices?source=incomplete' }
    ])

const formatted = (item: { value: number; money: boolean }) => item.money
  ? `${new Intl.NumberFormat('zh-TW').format(item.value)} ${applied.value.currency}`
  : new Intl.NumberFormat('zh-TW').format(item.value)

const apply = () => {
  applied.value = { from: toDate(range.value[0]), to: toDate(range.value[1]), currency: currency.value }
  void router.replace({ query: applied.value })
}
const reset = () => {
  range.value = [toTimestamp(demoDate), toTimestamp(demoDate)]
  currency.value = 'TWD'
  apply()
}
const go = (path: string) => {
  const target = router.resolve(path)
  void router.push({ path: target.path, query: { ...target.query, ...applied.value } })
}
</script>

<template>
  <div class="page-stack">
    <header class="page-heading">
      <div><p class="page-eyebrow">{{ props.portal === 'agent' ? '代理後台' : '商戶後台' }}</p><h1>{{ title }}</h1><p>{{ identity }}｜查看營運概況、待辦與資料完整性。</p></div>
      <n-tag type="warning" :bordered="false">Demo 資料</n-tag>
    </header>

    <PageFilterBar :show-search="false" :active-filter-summary="`${applied.from}～${applied.to}、${applied.currency}`" @search="apply" @reset="reset">
      <template #filters>
        <label class="filter-field filter-field--wide"><span>日期範圍</span><n-date-picker v-model:value="range" type="daterange" :clearable="false" /></label>
        <label class="filter-field"><span>原幣別</span><n-select v-model:value="currency" :options="[{ label: 'TWD－新臺幣', value: 'TWD' }]" /></label>
      </template>
    </PageFilterBar>

    <section aria-labelledby="portal-metrics-heading">
      <div class="section-heading"><div><h2 id="portal-metrics-heading">營運摘要</h2><p>原幣資料，不跨幣別加總。</p></div></div>
      <div class="dashboard-kpi-grid">
        <button v-for="item in metrics" :key="item.label" class="metric-card" type="button" @click="go(reportPath)">
          <span class="metric-card__label">{{ item.label }}</span><strong>{{ formatted(item) }}</strong><span>{{ hasSample ? '目前查詢範圍' : '本範圍無交易' }}</span><n-icon class="metric-card__arrow" :component="ArrowForwardRound" />
        </button>
      </div>
    </section>

    <div class="dashboard-primary-grid">
      <section class="dashboard-section" aria-labelledby="portal-pending-heading">
        <div class="section-heading"><div><h2 id="portal-pending-heading">待辦</h2><p>只列出目前角色可處理的事項。</p></div></div>
        <div class="task-list">
          <button v-for="item in pending" :key="item.title" class="task-row" type="button" @click="go(item.path)">
            <n-icon :component="ScienceOutlined" /><span class="task-row__copy"><strong>{{ item.title }}</strong><small>{{ item.reason }}</small></span><n-tag type="warning" size="small" :bordered="false">待處理</n-tag><span></span><n-icon :component="ArrowForwardRound" />
          </button>
        </div>
      </section>
      <section class="dashboard-section" aria-labelledby="portal-status-heading">
        <div class="section-heading"><div><h2 id="portal-status-heading">資料狀態</h2><p>Demo 與正式來源分開標示。</p></div></div>
        <dl class="status-list">
          <div><dt>資料更新時間</dt><dd><n-tag size="small">2026-09-04 18:30</n-tag></dd><small>Asia/Taipei（UTC+8）</small></div>
          <div><dt>交易來源</dt><dd><n-tag type="success" size="small">完整</n-tag></dd><small>本頁示範資料版本 DEMO-0904</small></div>
          <div><dt>財務來源</dt><dd><n-tag type="warning" size="small">待核對</n-tag></dd><small>不顯示未核准佣金或正式帳務結果</small></div>
        </dl>
      </section>
    </div>

    <section aria-labelledby="portal-organization-heading">
      <div class="section-heading"><div><h2 id="portal-organization-heading">{{ props.portal === 'agent' ? '組織摘要' : '運作狀態' }}</h2><p>目前狀態，不受日期範圍影響。</p></div></div>
      <div class="resource-grid">
        <button v-for="item in organization" :key="item.label" class="resource-card" type="button" @click="go(item.path)"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>前往查看</small></button>
      </div>
    </section>
  </div>
</template>
