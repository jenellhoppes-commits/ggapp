import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { useApprovalCenterStore } from '../src/store/modules/approvalCenter'
import { useRiskCenterStore } from '../src/store/modules/riskCenter'
import { useDashboardOverviewStore } from '../src/store/modules/dashboardOverview'
import { useBusinessPartnerStore } from '../src/store/modules/businessPartner'

setActivePinia(createPinia())
const approvals = useApprovalCenterStore()
const risk = useRiskCenterStore()
const historical = approvals.approvals.filter((item) => item.sourceType === 'Risk Rule')
assert.ok(historical.length, 'Retain historical risk records')
const pendingRisk = historical.filter((item) => item.status === 'Pending')
assert.ok(pendingRisk.length)
const before = JSON.stringify({
  approvals: approvals.approvals,
  logs: approvals.logs,
  rules: risk.rules
})
for (const item of pendingRisk) {
  assert.equal(approvals.review(item.id, true, '本期不開放'), false)
  assert.equal(approvals.review(item.id, false, '本期不開放'), false)
}
assert.equal(
  approvals.batchApprove(
    pendingRisk.map((item) => item.id),
    '本期不開放'
  ),
  0
)
assert.equal(
  JSON.stringify({ approvals: approvals.approvals, logs: approvals.logs, rules: risk.rules }),
  before
)
assert.ok(approvals.pendingItems.every((item) => item.sourceType !== 'Risk Rule'))
assert.ok(approvals.overdueItems.every((item) => item.sourceType !== 'Risk Rule'))
assert.ok(approvals.approvedItems.some((item) => item.sourceType === 'Risk Rule'))
assert.ok(approvals.rejectedItems.some((item) => item.sourceType === 'Risk Rule'))

const dashboard = useDashboardOverviewStore()
const business = useBusinessPartnerStore()
assert.ok(
  dashboard.tasks.every((item) => !/risk|風控/i.test(`${item.id} ${item.title} ${item.path}`))
)
assert.ok(!('restrictedMembers' in dashboard.operations))
assert.equal(
  dashboard.operations.activeMerchantLines,
  business.merchants.flatMap((item) => item.lines).filter((line) => line.status === 'Active').length
)
assert.equal(
  dashboard.tasks.find((item) => item.id === 'integration')?.count,
  business.merchants
    .flatMap((item) => item.lines)
    .filter((line) =>
      ['Draft', 'Pending', 'Configuring', 'Testing', 'Production Pending'].includes(line.status)
    ).length
)

const normal = approvals.pendingItems.find((item) => item.sourceType === 'Agent')
assert.ok(normal, 'Existing business approvals remain available')
assert.equal(approvals.review(normal.id, true, '演示測試核准'), true)
assert.equal(normal.status, 'Approved')

const read = (path: string) => readFileSync(path, 'utf8')
for (const path of [
  'members/detail.vue',
  'transactions/bets/detail.vue',
  'transactions/records/detail.vue',
  'approvals/pending/index.vue',
  'approvals/history-list/index.vue'
]) {
  assert.ok(!read(`src/views/game-provider/${path}`).includes('/risk/'), `Stale risk link: ${path}`)
}
const header = read('src/components/core/layouts/art-header-bar/index.vue')
// The approved compact header no longer displays demo notices.
assert.ok(!header.includes('開發演示'))
assert.ok(!/<[^>]+class=["'][^"']*demo-notice/.test(header))
assert.ok(!header.includes('正式環境'))
const locale = JSON.parse(read('src/locales/langs/zh.json'))
assert.equal(locale.topBar.user.logout, '登出')
assert.equal(locale.topBar.search.title, '搜尋')
assert.equal(locale.worktab.btn.refresh, '重新整理')
assert.equal(locale.login.roles.super, '管理者後台')
assert.ok(!/登录|搜索|默认|简体中文|標簽|注冊|后臺/.test(JSON.stringify(locale)))
console.log(
  'Realignment checks passed: deferred risk actions blocked, history retained, operational counts and Traditional Chinese chrome verified.'
)
