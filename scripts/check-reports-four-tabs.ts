import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { reportDemoSource } from '../src/mock/game-provider/report-four-tabs'
import {
  queryFourReports,
  parseFourQuery,
  validateFourQuery,
  platformDate,
  minorAmount,
  reportTabs,
  reportTabLabels,
  betKey,
  fourCsv,
  reportCsvText,
  reportDrilldown,
  switchFourTab,
  fourQueryUrl,
  latestRequestGate,
  type ReportScope,
  type ReportSource
} from '../src/domain/report-four-tabs'
import { listPage } from '../src/domain/list-query'
import { gameProviderRoutes } from '../src/router/modules/gameProvider'
import { flattenRoutes } from '../src/router/modules/navigation'
import { staticRoutes } from '../src/router/routes/staticRoutes'
import { buildDisplayMenu } from '../src/utils/navigation/display-menu'
import { buildSectionMenu } from '../src/utils/navigation/section-menu'
import { legacySummaryTarget } from '../src/domain/report-navigation'
import { formatReportMetric } from '../src/domain/report-presentation'
const log = (id: string, detail: string) => console.log(`${id} 模擬通過：${detail}`)
const scope: ReportScope = {
  canView: true,
  canExport: true,
  canViewBets: true,
  environment: 'report-demo',
  merchantIds: ['M1', 'M2'],
  timezone: 'Asia/Taipei',
  currencies: { TWD: 2, USD: 2 }
}
const query = parseFourQuery(
  { from: '2026-09-04', to: '2026-09-04', currency: 'TWD' },
  '2026-09-04'
)
const clone = (): ReportSource => structuredClone(reportDemoSource)
const before = JSON.stringify(reportDemoSource)
const run = (tab: string = 'operations', source = reportDemoSource, overrides = {}) =>
  queryFourReports(source, { ...query, tab: tab as typeof query.tab, ...overrides }, scope)
const menu = buildDisplayMenu(gameProviderRoutes)
assert.deepEqual(
  buildSectionMenu(gameProviderRoutes).map((r) => r.title),
  ['總覽', '商務管理', '廠商管理', '交易中心', '財務中心', '報表中心', '系統管理']
)
assert.deepEqual(
  buildSectionMenu(gameProviderRoutes)[5].items.map((r) => r.meta.title),
  ['報表查詢']
)
assert.equal(flattenRoutes(menu).filter((r) => r.meta.title === '報表查詢').length, 1)
assert.deepEqual(
  reportTabs.map((t) => reportTabLabels[t]),
  ['營運報表', '代理報表', '商戶報表', '遊戲報表']
)
const view = readFileSync('src/views/game-provider/report-query/index.vue', 'utf8')
assert.equal((view.match(/<ElTable\s/g) || []).length, 1)
assert.ok(!/GGR|RTP|ROI|有效投注|佣金估算|chart/i.test(view))
assert.equal(formatReportMetric(12345), '12,345')
assert.equal(formatReportMetric('1234567.80', true), '1,234,567.80')
assert.equal(formatReportMetric(null, true), '資料待確認')
log('R4T-01', '第一階段七分區、唯一報表入口、四分頁、一表與四營運指標')
for (const tab of reportTabs)
  assert.deepEqual(run(tab).totals, {
    betCount: 4,
    players: 3,
    betAmount: '430.00',
    payoutAmount: '250.00'
  })
assert.deepEqual(
  run('merchants')
    .rows.map((r) => [r.key, r.betCount, r.players, r.betAmount, r.payoutAmount])
    .sort(),
  [
    ['M1', 3, 2, '230.00', '150.00'],
    ['M2', 1, 1, '200.00', '100.00']
  ]
)
log('R4T-02', '四分頁同來源 4筆/3人/430/250；商戶分組一致')
assert.equal(run().bets.length, 4)
assert.ok(run().bets.some((b) => b.id === 'B4'))
assert.ok(!run().bets.some((b) => b.id === 'FAIL' || b.id === 'SANDBOX'))
assert.equal(run().totals.payoutAmount, '250.00')
log('R4T-03', '重送下注與派彩去重；退款保留下注；轉點、失敗、Sandbox排除')
const games = run('games')
assert.equal(
  games.rows.reduce((n, r) => n + (r.players || 0), 0),
  4
)
assert.equal(games.totals.players, 3)
assert.deepEqual(
  games.rows.map((r) => [r.code, r.betCount, r.players, r.betAmount, r.payoutAmount]).sort(),
  [
    ['G1', 3, 3, '380.00', '250.00'],
    ['G2', 1, 1, '50.00', '0.00']
  ]
)
log('R4T-04', '人數以環境+商戶+會員去重，不加總列人數')
const historical = clone()
historical.bets = historical.bets.map((b) => ({
  ...b,
  ...(b.id === 'B2' ? { agent: null } : b.id === 'B4' ? { agent: 'unknown' as const } : {})
}))
const agents = run('agents', historical)
assert.ok(
  agents.rows.some((r) => r.key === 'unassigned') && agents.rows.some((r) => r.key === 'unknown')
)
assert.equal(agents.totals.betCount, 4)
assert.ok(run('agents').rows.some((r) => r.key === 'A1'))
assert.ok(!readFileSync('src/domain/report-four-tabs.ts', 'utf8').includes('businessPartner'))
log('R4T-05', '只用下注歷史代理；未歸屬/未知保留，無現今關係回填')
const edges = clone()
const base = edges.bets[0]
edges.events = []
edges.bets = [
  { ...base, id: 'start', time: '2026-09-03T16:00:00Z' },
  { ...base, id: 'before', time: '2026-09-03T15:59:59.999Z' },
  { ...base, id: 'end', time: '2026-09-04T16:00:00Z' }
]
assert.deepEqual(
  run('operations', edges).bets.map((b) => b.id),
  ['start']
)
assert.equal(platformDate('2026-09-04T16:00:00Z', 'Asia/Taipei'), '2026-09-05')
const late = clone()
late.events = late.events.map((e) => (e.id === 'P1' ? { ...e, time: '2026-09-04T18:00:00Z' } : e))
assert.equal(run('operations', late).totals.payoutAmount, '250.00')
late.cutoff = '2026-09-04T17:00:00Z'
assert.equal(run('operations', late).totals.payoutAmount, '100.00')
log('R4T-06', '平台時區起含迄不含；遲到派彩回歸原下注日期，固定截止版本')
const round = clone()
round.events = round.events.filter((e) => e.id !== 'P1')
round.events.push({
  ...reportDemoSource.events[0],
  id: 'ROUND-PAY',
  betKeys: [betKey(round.bets[0]), betKey(round.bets[3])]
})
assert.equal(run('games', round).totals.payoutAmount, '250.00')
round.events[round.events.length - 1].betKeys = [betKey(round.bets[0]), betKey(round.bets[1])]
assert.equal(run('games', round).totals.payoutAmount, null)
assert.ok(run('games', round).rows.every((r) => r.payoutAmount === null))
round.events[round.events.length - 1].betKeys = [betKey(round.bets[0]), betKey(round.bets[3])]
round.bets = round.bets.map((b) => (b.id === 'B4' ? { ...b, time: '2026-09-03T02:00:00Z' } : b))
assert.equal(run('operations', round).totals.payoutAmount, null)
log('R4T-07', '同分組局級派彩只計一次；跨遊戲與日期邊界待確認，不分攤')
assert.ok(validateFourQuery({ ...query, currency: '' }, scope).currency)
assert.ok(validateFourQuery({ ...query, from: '2026-02-30' }, scope).date)
assert.ok(validateFourQuery({ ...query, from: '2026-09-05' }, scope).date)
const invalid = parseFourQuery(
  { tab: 'hack', sort: 'hack', page: '-1', size: '100', currency: 'BAD', from: '' },
  '2026-09-04'
)
assert.equal(invalid.tab, 'operations')
assert.equal(invalid.sort, 'date')
assert.equal(invalid.page, 1)
assert.equal(invalid.size, 20)
assert.equal(invalid.from, '')
assert.equal(invalid.currency, 'BAD')
const switched = switchFourTab({ ...query, merchant: 'M1', game: 'draft', page: 7 }, 'games')
assert.equal(switched.currency, 'TWD')
assert.equal(switched.game, '')
assert.equal(switched.merchant, '')
assert.equal(switched.page, 1)
assert.deepEqual(parseFourQuery(fourQueryUrl(switched), '2026-09-04'), switched)
const applied = run()
const draft = { ...query, currency: 'USD' }
assert.equal(applied.query.currency, 'TWD')
assert.equal(draft.currency, 'USD')
log('R4T-08', '缺必填拒查、合法URL還原、無效值回合法預設、未提交不改已套用結果')
const many = clone()
many.events = []
many.bets = Array.from({ length: 57 }, (_, i) => ({
  ...base,
  id: `X${i}`,
  gameId: `G${String(i).padStart(3, '0')}`,
  gameCode: `G${i}`,
  gameName: '同名遊戲',
  amount: i % 2 ? '0.10' : '0.20'
}))
const manyResult = run('games', many, { sort: 'betAmount' })
assert.equal(manyResult.rows.length, 57)
for (const size of [10, 20, 50]) {
  const keys = []
  for (let p = 1; p <= Math.ceil(57 / size); p++)
    keys.push(...listPage(manyResult.rows, p, size).items.map((r) => r.key))
  assert.equal(keys.length, 57)
  assert.equal(new Set(keys).size, 57)
  assert.deepEqual(
    keys,
    manyResult.rows.map((r) => r.key)
  )
}
assert.equal(listPage(manyResult.rows, 999, 20).page, 3)
assert.equal(minorAmount('9007199254740993.01', 2), 900719925474099301n)
const gate = latestRequestGate(),
  old = gate.next(),
  fresh = gate.next()
assert.equal(gate.isCurrent(old), false)
assert.equal(gate.isCurrent(fresh), true)
log('R4T-09', '57列10/20/50無重漏、精確十進位與穩定排序、過期請求拒覆蓋')
const csv = fourCsv(manyResult, scope)
assert.equal(csv.split('\r\n').length, 58)
assert.ok(csv.includes(manyResult.cutoff) && csv.includes(manyResult.version))
assert.equal(reportCsvText('=CMD()'), '"\'=CMD()"')
assert.equal(reportCsvText('-1.25', true), '"-1.25"')
assert.equal(reportCsvText('甲,乙"\n丙'), '"甲,乙""\n丙"')
assert.ok(fourCsv(run('operations', round), scope).includes('資料待確認'))
assert.ok(!fourCsv(applied, scope).includes('USD'))
log('R4T-10', '全部列UTF8 CSV，同版本與已套用條件，未知與負數、引號/逗號/換行安全')
const dummy = { render: () => null },
  flat = flattenRoutes(gameProviderRoutes)
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    ...flat.map((r) => ({ ...r, children: undefined, component: dummy })),
    ...staticRoutes.map((r) => ({ ...r, component: r.component ? dummy : undefined }))
  ] as RouteRecordRaw[]
})
for (const [path, tab] of [
  ['/reports/overview', 'operations'],
  ['/dashboard/operations', 'operations'],
  ['/reports/agents/overview', 'agents'],
  ['/business/agents/summary', 'agents'],
  ['/reports/merchants/overview', 'merchants'],
  ['/reports/games/performance', 'games'],
  ['/dashboard/games', 'games']
]) {
  await router.push(`${path}?currency=TWD&from=2026-09-04&to=2026-09-04#history`)
  assert.equal(router.currentRoute.value.path, '/business/reports')
  assert.equal(router.currentRoute.value.query.tab, tab)
  assert.equal(router.currentRoute.value.query.currency, 'TWD')
  assert.equal(router.currentRoute.value.hash, '#history')
}
for (const tab of reportTabs) {
  const result = run(tab)
  for (const row of result.rows) {
    const link = reportDrilldown(result, row, scope)
    assert.equal(link.path, '/transactions/bets')
    assert.equal(link.query.reportSource, result.version)
    assert.equal(link.query.reportGroup, row.key)
    const replay = queryFourReports(reportDemoSource, parseFourQuery(link.query, ''), scope)
    assert.deepEqual(
      replay.rows.find((r) => r.key === link.query.reportGroup)?.betKeys,
      row.betKeys
    )
  }
}
await router.push('/reports/games/rtp')
assert.equal(router.currentRoute.value.path, '/retired/reports/rtp')
log('R4T-11', '四分頁精確來源明細；舊網址分頁、條件、hash及退役落點')
assert.deepEqual(
  legacySummaryTarget('/business/agents', { summary: 'agent-merchant', agent: 'A1' }),
  {
    path: '/business/reports',
    query: { summary: undefined, agent: 'A1', tab: 'merchants' }
  }
)
assert.equal(run('operations', reportDemoSource, { game: 'G2' }).totals.betCount, 1)
assert.equal(run('merchants', reportDemoSource, { agent: 'A1' }).totals.betCount, 3)
assert.throws(() => reportDrilldown(applied, { ...applied.rows[0], key: 'foreign' }, scope))
assert.throws(() => queryFourReports(reportDemoSource, query, { ...scope, canView: false }))
assert.throws(() => fourCsv(applied, { ...scope, canExport: false }))
assert.throws(() => fourCsv(applied, { ...scope, merchantIds: ['M1'] }))
assert.throws(() => reportDrilldown(applied, applied.rows[0], { ...scope, canViewBets: false }))
assert.equal(
  queryFourReports(
    reportDemoSource,
    { ...query, tab: 'merchants', merchant: 'M2' },
    { ...scope, merchantIds: ['M1'] }
  ).totals.betCount,
  0
)
assert.equal(run('operations', reportDemoSource, { currency: 'USD' }).totals.betCount, 0)
const incomplete = clone()
incomplete.complete = false
assert.equal(run('operations', incomplete).totals.betCount, null)
const conflict = clone()
conflict.bets[4].amount = '101'
assert.throws(() => run('operations', conflict))
assert.equal(JSON.stringify(reportDemoSource), before)
log('R4T-12', '查看/匯出/明細拒越權；空資料/缺來源/衝突有別；原來源未改')
console.log(
  'R4T-13：自動測試不替代畫面驗證，桌面/390px與其他尺寸結果見交付紀錄。正式後端、正式供應商及資金流程均未驗證。'
)
