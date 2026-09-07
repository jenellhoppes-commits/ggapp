import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { useAdminDashboardStore } from '../src/store/modules/adminDashboard'
import { gameProviderRoutes } from '../src/router/modules/gameProvider'
import { flattenRoutes } from '../src/router/modules/navigation'

setActivePinia(createPinia())
const store = useAdminDashboardStore()
assert.ok(store.currencies.length > 0)
assert.ok(store.sampleDate)
assert.equal(store.tasks.length, 8)
assert.equal(store.platformStatuses.length, 4)
assert.equal(store.resources.length, 5)
assert.ok(store.recentActions.length <= 5)

const available = store.getSummary({
  from: store.sampleDate,
  to: store.sampleDate,
  currency: store.currencies[0]
})
assert.equal(available.available, true)
const missing = store.getSummary({
  from: '2025-01-01',
  to: '2025-01-01',
  currency: store.currencies[0]
})
assert.equal(missing.available, false)
assert.equal(missing.betCount, 0)

const route = flattenRoutes(gameProviderRoutes).find(
  (item) => item.name === 'GameProviderDashboard'
)
assert.equal(route?.component, '/game-provider/admin-dashboard/index')
const page = readFileSync('src/views/game-provider/admin-dashboard/index.vue', 'utf8')
for (const required of [
  '下注筆數',
  '投注人數',
  '投注金額',
  '派彩金額',
  '待處理工作',
  '平台狀態',
  '聚合器資源摘要',
  '最近資料更新與操作',
  '資料待確認'
])
  assert.ok(page.includes(required), `Missing dashboard content: ${required}`)
for (const excluded of ['RTP', '遊戲表現排行', '商戶線路排行', '營運趨勢示意'])
  assert.ok(!page.includes(excluded), `Excluded dashboard content: ${excluded}`)

console.log(
  'Admin dashboard checks passed: independent page, data states, work queue and current resources.'
)
