import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gameProviderRoutes } from '../src/router/modules/gameProvider'
import { buildSectionMenu } from '../src/utils/navigation/section-menu'
import { hasFinancialView, financialSourceStatus } from '../src/domain/report-financial-summary'
import { reportMetrics, nextReportSort, reportSortState } from '../src/domain/report-presentation'
import {
  parseFourQuery,
  queryFourReports,
  fourQueryUrl,
  type ReportScope
} from '../src/domain/report-four-tabs'
import { reportDemoSource } from '../src/mock/game-provider/report-four-tabs'
const log = (id: string, message: string) => console.log(`${id} 模擬通過：${message}`)
const sections = buildSectionMenu(gameProviderRoutes)
assert.deepEqual(
  sections.map((s) => s.items.map((i) => i.meta.title)),
  [
    ['儀錶板'],
    ['代理管理', '商戶管理', '會員與錢包'],
    ['供應商管理', '遊戲管理', '試玩管理'],
    ['注單管理', '交易流水'],
    ['供應商結算', '商戶結算', '代理結算'],
    ['報表查詢'],
    ['開發者中心', '維護設定', '白名單／黑名單', '人員與權限']
  ]
)
const empty = {
  ...gameProviderRoutes[0],
  children: gameProviderRoutes[0].children?.map((r) => ({
    ...r,
    meta: { ...r.meta, isHide: true }
  }))
}
assert.deepEqual(buildSectionMenu([empty]), [])
assert.deepEqual(buildSectionMenu([]), [])
assert.ok(sections.every((s) => s.items.every((i) => !i.children?.length)))
log('CH-01/02/05/06', '七分區直接功能、唯一報表、空權限分區隱藏；路由相容另由導航測試驗證')
const scope: ReportScope = {
  canView: true,
  canExport: true,
  canViewBets: true,
  environment: 'report-demo',
  merchantIds: ['M1', 'M2'],
  timezone: 'Asia/Taipei',
  currencies: { TWD: 2 }
}
const q = parseFourQuery(
  { from: '2026-09-04', to: '2026-09-04', currency: 'TWD', merchant: 'M2' },
  '2026-09-05'
)
const result = queryFourReports(reportDemoSource, q, scope)
assert.deepEqual(
  queryFourReports(reportDemoSource, parseFourQuery(fourQueryUrl(q), '2026-09-05'), scope).totals,
  result.totals
)
assert.deepEqual(result.totals, {
  betCount: 1,
  players: 1,
  betAmount: '200.00',
  payoutAmount: '100.00'
})
assert.ok(
  readFileSync('src/views/game-provider/overview/index.vue', 'utf8').includes(
    '<ReportQuery overview'
  )
)
log('OV-01', '儀錶板重用同一查詢元件，已套用期間、幣別及商戶範圍往返一致；不複製資料')
const financial = financialSourceStatus(result)
assert.equal(financial.revenue, null)
assert.equal(financial.cost, null)
assert.equal(financial.profit, null)
assert.equal(financial.period, '2026-09-04 至 2026-09-04')
assert.equal(financial.operationVersion, result.version)
assert.equal(financial.sources.length, 8)
assert.ok(
  financial.sources.every(
    (s) =>
      s.status === '缺少來源' &&
      s.recordId === null &&
      s.sourceCurrency === null &&
      s.sourcePeriod === null &&
      s.version === null
  )
)
const roles = [{ code: 'OP', status: 'Active', permissionIds: ['view'] }]
const permissions = [{ id: 'view', module: 'finance', action: 'View' }]
assert.equal(hasFinancialView(['OP'], roles, permissions), true)
assert.equal(hasFinancialView(['OTHER'], roles, permissions), false)
assert.equal(hasFinancialView(['OP'], [{ ...roles[0], status: 'Inactive' }], permissions), false)
assert.equal(hasFinancialView(['OP'], roles, [{ ...permissions[0], action: 'Execute' }]), false)
assert.equal(hasFinancialView(['OP'], roles, []), false)
log('RP-01', '三財務摘要全部缺來源不當0；八類來源、既有財務View權限、唯讀無公式')
for (const metric of reportMetrics) {
  const asc = nextReportSort(q, metric.key),
    desc = nextReportSort(asc, metric.key)
  assert.equal(asc.order, 'asc')
  assert.equal(desc.order, 'desc')
  assert.equal(asc.page, 1)
  assert.equal(reportSortState(asc, metric.key), '升冪')
  assert.equal(reportSortState(desc, metric.key), '降冪')
}
const view = readFileSync('src/views/game-provider/report-query/index.vue', 'utf8')
assert.ok(view.includes('class="sort-control"') && view.includes(':aria-label="sortLabel'))
assert.ok(!view.includes('sortable="custom"'))
assert.ok(!view.includes('`${result.query.tab}:${result.query.sort}'))
assert.ok(view.includes('資料待確認') && view.includes('來源缺項'))
const drawer = readFileSync('src/components/business/ReportFinancialSummary.vue', 'utf8')
assert.equal((drawer.match(/<ElDrawer\b/g) || []).length, 1)
assert.ok(drawer.includes('返回來源類別'))
log('CH-03/R4T-002', '排序升降冪及單一抽屜結構通過；真實Tab/Enter/Space另作瀏覽器驗證')
console.log('Stage 1 structural/domain self-checks complete. No production/backend acceptance.')
