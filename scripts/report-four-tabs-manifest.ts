import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { legacyNavigationRedirects } from '../src/router/modules/gameProvider'

// Read-only inventory of this delivery, not a claim of ownership of the dirty worktree.
const files = [
  'src/domain/report-four-tabs.ts',
  'src/domain/report-navigation.ts',
  'src/domain/report-query.ts',
  'src/mock/game-provider/report-four-tabs.ts',
  'src/composables/useReportFourTabs.ts',
  'src/components/business/ReportBetDrilldown.vue',
  'src/components/business/ModuleSummary.vue',
  'src/components/business/ReportEntryLinks.vue',
  'src/views/game-provider/report-query/index.vue',
  'src/views/game-provider/reports/index.vue',
  'src/views/game-provider/dashboard/index.vue',
  'src/views/game-provider/agents/index.vue',
  'src/views/game-provider/agents/detail.vue',
  'src/views/game-provider/merchants/index.vue',
  'src/views/game-provider/merchants/detail.vue',
  'src/views/game-provider/members/index.vue',
  'src/views/game-provider/transactions/bets/index.vue',
  'src/views/game-provider/transactions/records/index.vue',
  'src/views/provider-hub/index.vue',
  'src/views/navigation/system-workspace.vue',
  'src/views/navigation/finance-subject.vue',
  'src/views/navigation/retired-reports.vue',
  'src/router/modules/navigation.ts',
  'src/router/routes/staticRoutes.ts',
  'src/router/guards/beforeEach.ts',
  'src/router/core/MenuProcessor.ts',
  'src/components/core/layouts/art-header-bar/index.vue',
  'scripts/check-navigation.ts',
  'scripts/check-report-preview.ts',
  'scripts/check-reports-four-tabs.ts',
  'scripts/report-four-tabs-manifest.ts'
]
const locked = [
  'src/components/business/provider-hub/GamesPanel.vue',
  'src/components/business/provider-hub/DemoLinks.vue',
  'src/components/business/provider-hub/ProvidersPanel.vue',
  'src/domain/game-query.ts'
]
const inventory = (paths: string[]) =>
  paths.map((path) => ({
    path,
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex')
  }))
console.log(
  JSON.stringify(
    {
      delivery: 'R03-REPORTS-4TABS v1.0',
      files: inventory(files),
      lockedDependencies: inventory(locked),
      migrations: legacyNavigationRedirects
    },
    null,
    2
  )
)
