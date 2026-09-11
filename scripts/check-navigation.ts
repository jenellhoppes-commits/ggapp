import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import type { AppRouteRecord } from '../src/types/router'
import { gameProviderRoutes, legacyNavigationRedirects } from '../src/router/modules/gameProvider'
import { portalRoutes } from '../src/router/modules/portals'
import { flattenRoutes } from '../src/router/modules/navigation'
import { staticRoutes } from '../src/router/routes/staticRoutes'
import { getFirstMenuPath } from '../src/utils/navigation/route'
import { buildDisplayMenu } from '../src/utils/navigation/display-menu'
import { RouteValidator } from '../src/router/core/RouteValidator'

const all = [...gameProviderRoutes, ...portalRoutes]
const merchantRoutes = portalRoutes.find((r) => r.path === '/merchant')!.children!
for (const path of ['dashboard', 'profile', 'lines', 'games', 'integration', 'members', 'bets', 'transactions', 'reports', 'settlements', 'notifications', 'account', 'security']) {
  const route = merchantRoutes.find((r) => r.path === path)
  assert.ok(route, `Merchant module route missing: ${path}`)
  assert.deepEqual(route.meta.roles, ['R_MERCHANT'])
  if (!['lines', 'transactions'].includes(path)) assert.ok(!route.meta.isHide, `Merchant module hidden: ${path}`)
}
assert.equal(merchantRoutes.find((r) => r.path === 'invoices')?.meta.isHide, true)
const merchantDisplay = buildDisplayMenu([portalRoutes.find((r) => r.path === '/merchant')!])
assert.deepEqual(merchantDisplay.map((r) => r.meta.title), ['儀錶板', '商務中心', '遊戲中心', '會員中心', '交易中心', '報表管理', '對帳/結算', '匯率報表', '串接中心', '公告通知', '帳號與權限', '操作紀錄'])
assert.ok(merchantDisplay.every((r) => !r.children?.length && r.path.startsWith('/merchant/')))
assert.equal(
  new RouteValidator().validate(all).valid,
  true,
  'Runtime route validation must allow application startup'
)
assert.ok(
  gameProviderRoutes.every((r) => !r.meta.menuGroup),
  'Seven sections carry their own headings'
)
const flat = flattenRoutes(all)
const originalMenu = JSON.stringify(all)
const agentDisplay = buildDisplayMenu([portalRoutes[0]])
assert.equal(agentDisplay.length, 9)
assert.ok(
  agentDisplay.every(
    (r) => !r.children?.length && r.meta.menuGroup === '代理作業' && r.path.startsWith('/agent/')
  )
)
assert.ok(!agentDisplay.some((r) => r.name === 'AgentPortal'))
assert.deepEqual(buildDisplayMenu(agentDisplay), agentDisplay)
assert.equal(JSON.stringify(all), originalMenu)
const displayMenu = buildDisplayMenu(gameProviderRoutes)
const displayFlat = flattenRoutes(displayMenu)
assert.equal(JSON.stringify(all), originalMenu, 'Display menu must not mutate registered routes')
assert.deepEqual(buildDisplayMenu(displayMenu), displayMenu, 'Menu projection must be idempotent')
assert.ok(displayFlat.every((item) => !item.meta.isHide && item.children?.length !== 1))
const contentMenu = displayMenu.find((r) => r.path === '/content')!
assert.deepEqual(
  contentMenu.children?.map((r) => r.meta.title),
  ['供應商管理', '遊戲管理', '試玩管理']
)
assert.deepEqual(
  displayMenu.find((r) => r.path === '/business')?.children?.map((r) => r.meta.title),
  ['代理管理', '商戶管理', '會員與錢包']
)
assert.deepEqual(
  displayMenu.find((r) => r.path === '/transactions')?.children?.map((r) => r.meta.title),
  ['注單管理', '交易流水']
)
assert.deepEqual(
  displayMenu.find((r) => r.path === '/finance')?.children?.map((r) => r.meta.title),
  ['供應商對帳', '代理對帳', '商戶對帳', '異動紀錄']
)
assert.deepEqual(
  displayMenu.find((r) => r.path === '/platform')?.children?.map((r) => r.meta.title),
  ['開發者中心', '維護設定', '匯率管理', '白名單／黑名單', '人員與權限']
)
assert.equal(
  displayMenu
    .find((r) => r.path === '/platform')
    ?.children?.find((r) => r.path === '/platform/exchange-rates')?.children,
  undefined,
  '匯率管理應為單一側欄入口，設定與歷史改由頁內頁籤切換'
)
const accessWorkspace = flat.filter((route) => route.meta.workspace === 'access')
assert.deepEqual(
  accessWorkspace.map((route) => route.meta.tabTitle),
  ['後台帳號', '角色管理', '操作紀錄'],
  '人員與權限應提供後台帳號、角色管理與操作紀錄三個頁面'
)
assert.equal(
  flat.find((route) => route.name === 'PlatformOperationLogs')?.path,
  '/platform/access/logs',
  '操作紀錄應歸屬人員與權限'
)
const developerCenter = flat.find((route) => route.name === 'DeveloperCenter')!
assert.equal(
  developerCenter.component,
  '/game-provider/platform/developers/index',
  '開發者中心應使用獨立頁面'
)
assert.equal(developerCenter.meta.workspace, undefined, '開發者中心不得顯示系統設定共用頁籤')
assert.equal(
  developerCenter.meta.sourceComponent,
  undefined,
  '開發者中心不得再由 system-workspace 包裝'
)
assert.ok(
  !flat.some((r) => /reports\/index/.test(String(r.component))),
  'No standalone report page remains'
)
assert.ok(!flat.some((item) => item.path === '/admin/providers/demo-links'))
for (const route of flat) {
  assert.ok(
    !/\b(Provider|Wallet|Round)\b/.test(`${route.meta.title} ${route.meta.description || ''}`)
  )
  if (route.meta.activePath)
    assert.ok(flattenRoutes(buildDisplayMenu(all)).some((item) => item.path === route.meta.activePath))
}
assert.deepEqual(
  buildDisplayMenu([
    {
      path: '/empty',
      name: 'Empty',
      component: '/index/index',
      meta: { title: '空目錄' },
      children: [
        {
          path: 'detail',
          name: 'Hidden',
          component: '/detail',
          meta: { title: '詳情', isHide: true }
        }
      ]
    }
  ]),
  [],
  'Directories with no visible pages must not become dead links'
)
const records = [...flat, ...staticRoutes]
assert.equal(
  new Set(records.map((route) => route.name)).size,
  records.length,
  'Duplicate route names'
)
assert.equal(
  new Set(records.map((route) => route.path)).size,
  records.length,
  'Duplicate route paths'
)
assert.deepEqual(
  gameProviderRoutes.map((r) => r.meta.title),
  ['總覽', '商務管理', '廠商管理', '交易中心', '財務中心', '報表中心', '系統管理']
)

for (const route of flat) {
  if (typeof route.component === 'string' && route.component) {
    const base = resolve('src/views', `.${route.component}`)
    assert.ok(
      existsSync(`${base}.vue`) || existsSync(`${base}/index.vue`),
      `Missing component ${route.component}`
    )
  }
  assert.ok(
    !/獎池|限紅|單槍|代理結算單|品質中心|風控/.test(route.meta.title),
    `Excluded module: ${route.meta.title}`
  )
  if (route.meta.activePath) {
    assert.ok(
      flat.some((entry) => entry.path === route.meta.activePath && !entry.meta.isHide),
      `Invalid active menu for ${route.name}`
    )
  }
}

const dummy = { render: () => null }
assert.ok(flat.every((route) => !/\/(risk|quality)(\/|$)/.test(route.path)))
const runtime = (routes: AppRouteRecord[]): RouteRecordRaw[] =>
  routes.map(
    (route) =>
      ({
        ...route,
        component: route.component ? dummy : undefined,
        children: route.children ? runtime(route.children) : undefined
      }) as RouteRecordRaw
  )
const publicRuntime = staticRoutes.map((route) => ({
  ...route,
  component: route.component ? dummy : undefined
})) as RouteRecordRaw[]
const router = createRouter({
  history: createMemoryHistory(),
  routes: [...publicRuntime, ...runtime(all)]
})
const sample = (path: string) =>
  path.replace(
    /:([A-Za-z0-9_]+)(\(([^)]*)\))?[?*+]?/g,
    (_, key: string, _pattern: string, pattern: string) => {
      if (pattern?.includes('|')) return pattern.split('|')[0]
      if (pattern) return `${pattern.match(/^[A-Z]+/)?.[0] || 'ID'}00001`
      return key === 'merchantId' ? 'M00001' : key === 'lineUid' ? 'M00001-TWD' : 'DEMO001'
    }
  )

for (const route of flat) {
  await router.push(sample(route.path))
  assert.ok(
    !String(router.currentRoute.value.name).startsWith('Exception'),
    `Unreachable ${route.path}`
  )
  if (!route.children?.length && !route.redirect)
    assert.equal(router.currentRoute.value.name, route.name, `Wrong landing: ${route.path}`)
}

assert.deepEqual(
  portalRoutes[0].children?.filter((r) => !r.meta.isHide).map((r) => r.meta.title),
  [
    '儀錶板',
    '代理關係',
    '商戶管理',
    '商務條件',
    '代理報表',
    '匯率報表',
    '對帳／結算',
    '公告通知',
    '帳號與權限'
  ]
)
for (const [oldPath, newPath, tab] of [
  ['integration', '/agent/merchants/integration', undefined],
  ['commissions', '/agent/settlements', 'commissions'],
  ['payments', '/agent/settlements', 'payments']
] as const) {
  await router.push(`/agent/${oldPath}?q=keep`)
  assert.equal(router.currentRoute.value.path, newPath)
  assert.equal(router.currentRoute.value.query.q, 'keep')
  if (tab) assert.equal(router.currentRoute.value.query.tab, tab)
}

for (const migration of legacyNavigationRedirects) {
  await router.push(`${sample(migration.path)}?source=bookmark#history`)
  assert.ok(
    !String(router.currentRoute.value.name).startsWith('Exception'),
    `Broken migration ${migration.path}`
  )
  assert.equal(router.currentRoute.value.query.source, 'bookmark')
  assert.equal(router.currentRoute.value.hash, '#history')
}
await router.push('/admin/providers/demo-links?game=G00001#history')
assert.equal(router.currentRoute.value.path, '/trials/links')
assert.equal(router.currentRoute.value.query.game, 'G00001')
assert.equal(router.currentRoute.value.hash, '#history')
for (const path of [
  '/jackpots',
  '/jackpots/list',
  '/jackpots/JP00001',
  '/members/management/P00001',
  '/risk/cases/R00001',
  '/finance/agent-statements',
  '/system',
  '/games/management/create',
  '/players',
  '/settlements'
]) {
  await router.push(path)
  assert.ok(
    !String(router.currentRoute.value.name).startsWith('Exception'),
    `Broken bookmark ${path}`
  )
}

for (const path of [
  '/risk',
  '/risk/rules',
  '/risk/cases/R00001',
  '/platform/risk',
  '/platform/risk/alerts',
  '/quality/overview'
]) {
  await router.push(`${path}?source=old-menu#history`)
  assert.equal(
    router.currentRoute.value.path,
    '/retired/reports/quality',
    `Deferred module reachable: ${path}`
  )
  assert.equal(router.currentRoute.value.query.source, 'old-menu')
  assert.equal(router.currentRoute.value.hash, '#history')
}

for (const route of staticRoutes.filter((entry) => entry.redirect && !entry.path.includes(':'))) {
  await router.push(route.path)
  assert.ok(
    !String(router.currentRoute.value.name).startsWith('Exception'),
    `Broken static redirect ${route.path}`
  )
}

const filterRole = (routes: AppRouteRecord[], role: string): AppRouteRecord[] =>
  routes
    .filter((route) => !route.meta.roles || route.meta.roles.includes(role))
    .map((route) => ({
      ...route,
      children: route.children ? filterRole(route.children, role) : undefined
    }))
const normalized = (routes: AppRouteRecord[], parent = ''): AppRouteRecord[] =>
  routes.map((route) => {
    const path = route.path.startsWith('/') ? route.path : `${parent}/${route.path}`
    return {
      ...route,
      path,
      children: route.children ? normalized(route.children, path) : undefined
    }
  })
for (const [role, home, prefix] of [
  ['R_SUPER', '/dashboard', ''],
  ['R_AGENT', '/agent/dashboard', '/agent'],
  ['R_MERCHANT', '/merchant/dashboard', '/merchant']
]) {
  const menu = normalized(filterRole(all, role))
  assert.equal(getFirstMenuPath(menu), home)
  assert.equal(getFirstMenuPath(buildDisplayMenu(menu)), home)
  assert.ok(flattenRoutes(buildDisplayMenu(menu)).every((item) => item.children?.length !== 1))
  const visible = flattenRoutes(menu)
  assert.ok(
    visible.every((route) => route.meta.roles?.includes(role)),
    `Role mismatch ${role}`
  )
  if (prefix)
    assert.ok(
      !visible.some((route) => route.path.startsWith('/trials')),
      'Admin trials must not leak into other portals'
    )
  if (prefix)
    assert.ok(
      visible.every((route) => route.path.startsWith(`${prefix}/`) || route.path === prefix)
    )
  const scopedRouter = createRouter({
    history: createMemoryHistory(),
    routes: [...publicRuntime, ...runtime(menu)]
  })
  const forbidden = prefix ? '/admin/providers' : '/agent/commissions'
  assert.equal(
    scopedRouter.resolve(forbidden).name,
    'Exception404',
    `Cross-portal route exposed for ${role}`
  )
}
assert.equal(filterRole(all, 'UNKNOWN').length, 0)
console.log(
  `Navigation checks passed: ${flat.length} canonical routes, ${legacyNavigationRedirects.length} migrations, 3 role menus.`
)
