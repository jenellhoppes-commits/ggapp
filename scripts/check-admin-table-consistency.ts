import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse, compileTemplate } from '@vue/compiler-sfc'

// Baseline data sources, columns and pagination counts from before the B2 migration.
const fixtures = [
  {
    path: 'src/views/game-provider/admin-dashboard/index.vue',
    tables: ['dashboardStore.recentActions'],
    columns: 6,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/agents/detail.vue',
    tables: ['directChildren', 'terms', 'visibleMerchants', 'reconciliations'],
    columns: 29,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/merchants/detail.vue',
    tables: ['terms', 'gameConfigurations', 'lines', 'reconciliations'],
    columns: 25,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/transactions/bets/detail.vue',
    tables: ['relatedTransactions', 'anomalies', 'accessLogs'],
    columns: 17,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/transactions/records/detail.vue',
    tables: ['relatedBet ? [relatedBet] : []', 'anomalies'],
    columns: 13,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/report-query/index.vue',
    tables: ['page.items'],
    columns: 5,
    pagination: 1
  },
  {
    path: 'src/views/game-provider/platform/developers/index.vue',
    tables: ['errorCodes'],
    columns: 4,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/platform/logs/index.vue',
    tables: ['pageRows'],
    columns: 9,
    pagination: 1
  },
  {
    path: 'src/views/game-provider/platform/maintenance/index.vue',
    tables: ['pageItems', 'maintenanceLogs'],
    columns: 12,
    pagination: 1
  },
  {
    path: 'src/views/game-provider/platform/network-lists/index.vue',
    tables: ['pageItems', 'networkLogs'],
    columns: 14,
    pagination: 1
  },
  {
    path: 'src/views/game-provider/platform/access/index.vue',
    tables: ['accountRows', 'store.roles', 'store.sensitiveGrants', 'store.dataScopes'],
    columns: 31,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/platform/locales/index.vue',
    tables: ['languageRows', 'regionRows', 'timezoneRows'],
    columns: 24,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/platform/system-logs/index.vue',
    tables: ['loginRows', 'approvalRows', 'errorRows'],
    columns: 24,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/platform/parameters/index.vue',
    tables: ['store.settingLogs'],
    columns: 6,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/platform/notifications/index.vue',
    tables: ['ruleRows', 'logRows'],
    columns: 17,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/finance-settings/currencies/index.vue',
    tables: ['rows'],
    columns: 11,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/finance-settings/exchange-rates/index.vue',
    tables: ['pagedRows'],
    columns: 18,
    pagination: 1
  },
  {
    path: 'src/views/game-provider/finance/reconciliation/index.vue',
    tables: ['pagedRows'],
    columns: 12,
    pagination: 1
  },
  {
    path: 'src/views/game-provider/finance/reconciliation/detail.vue',
    tables: ['dailyRows', 'gameRows', 'includedMerchants', 'recordDifferences'],
    columns: 23,
    pagination: 0
  },
  {
    path: 'src/views/game-provider/finance/reconciliation/differences.vue',
    tables: ['pagedRows'],
    columns: 10,
    pagination: 1
  }
]

for (const fixture of fixtures) {
  const source = readFileSync(fixture.path, 'utf8')
  const { descriptor, errors } = parse(source)
  assert.equal(errors.length, 0, fixture.path)
  const compiled = compileTemplate({
    source: descriptor.template!.content,
    filename: fixture.path,
    id: fixture.path
  })
  assert.equal(compiled.errors.length, 0, fixture.path)
  const tables = [...source.matchAll(/<ArtTable\b[^>]*>/g)].map((match) => match[0])
  assert.deepEqual(
    tables.map((tag) => tag.match(/:data="([^"]+)"/)?.[1]),
    fixture.tables,
    fixture.path
  )
  assert.doesNotMatch(source, /<ElTable\b/, fixture.path)
  assert.equal((source.match(/<ElTableColumn\b/g) || []).length, fixture.columns, fixture.path)
  assert.equal((source.match(/<ElPagination\b/g) || []).length, fixture.pagination, fixture.path)
  for (const tag of tables) {
    assert.doesNotMatch(
      tag,
      /\s(?:border|stripe|size|:border|:stripe|:size)(?:\s|=|>)/,
      fixture.path
    )
    assert.match(tag, /height="auto"/, fixture.path)
    assert.match(tag, /empty-height="auto"/, fixture.path)
    assert.match(tag, /:show-table-header="false"/, fixture.path)
    assert.match(tag, /style="height: auto"/, fixture.path)
    assert.doesNotMatch(tag, /:pagination=/, 'Keep the original external pagination only')
  }
  assert.doesNotMatch(
    descriptor.styles.map((style) => style.content).join('\n'),
    /border-radius:\s*\d+px/,
    fixture.path
  )
}
const table = readFileSync('src/components/core/tables/art-table/index.vue', 'utf8')
const dashboard = readFileSync('src/views/game-provider/admin-dashboard/index.vue', 'utf8')
assert.doesNotMatch(dashboard, /class="context-bar"/)
assert.match(dashboard, /dashboardStore.platformStatuses/, 'Retain platform status rendering')
assert.match(
  readFileSync('src/store/modules/adminDashboard.ts', 'utf8'),
  /title: '交易資料截止時間',\s*value: cutoffAt.value/,
  'Retain the cutoff in platform status'
)
const header = readFileSync(
  'src/components/business/game-provider/app-page-header/index.vue',
  'utf8'
)
assert.match(header, /\.heading-copy\s*\{[^}]*min-width: 0/s)
assert.match(header, /overflow-wrap: anywhere/)
assert.match(
  header,
  /flex-basis: auto/,
  'Mobile column layout must not inherit 280px vertical basis'
)
for (const contract of [
  'props.border ?? isBorder.value',
  'props.stripe ?? isZebra.value',
  'props.size ?? tableSize.value',
  'isHeaderBackground.value'
])
  assert.ok(table.includes(contract), contract)
console.log(
  `Admin table source contracts passed: ${fixtures.length} files, ${fixtures.reduce((total, item) => total + item.tables.length, 0)} shared tables, unchanged data sources/columns/pagination, global preference inheritance and radius tokens. Browser interaction remains a separate acceptance step.`
)
