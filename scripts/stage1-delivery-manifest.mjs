import { createHash } from 'node:crypto'
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  copyFileSync,
  existsSync
} from 'node:fs'
import { resolve, relative } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'docs/stage1-evidence')
const original = JSON.parse(readFileSync(resolve(output, 'baseline-1788540877746.json'), 'utf8'))
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isSymbolicLink()
      ? []
      : item.isDirectory()
        ? walk(resolve(dir, item.name))
        : [resolve(dir, item.name)]
  )
const owned = [
  'src/router/modules/navigation.ts',
  'src/utils/navigation/section-menu.ts',
  'src/components/core/layouts/art-menus/art-sidebar-menu/index.vue',
  'src/components/core/layouts/art-menus/art-sidebar-menu/widget/GgapSectionMenu.vue',
  'src/components/core/layouts/art-header-bar/index.vue',
  'src/domain/report-financial-summary.ts',
  'src/domain/report-presentation.ts',
  'src/components/business/ReportFinancialSummary.vue',
  'src/components/business/ReportOperationalMetrics.vue',
  'src/views/game-provider/overview/index.vue',
  'src/views/game-provider/report-query/index.vue',
  'src/composables/useReportFourTabs.ts',
  'scripts/check-navigation.ts',
  'scripts/check-reports-four-tabs.ts',
  'scripts/check-stage1.ts',
  'scripts/check-stage1-download.ts',
  'scripts/stage1-evidence.mjs',
  'scripts/stage1-delivery-manifest.mjs'
]
const sourcePaths = [
  ...walk(resolve(root, 'src')),
  ...walk(resolve(root, 'scripts')),
  ...original.files.filter((f) => !f.path.includes('/')).map((f) => resolve(root, f.path))
]
const files = sourcePaths
  .filter(existsSync)
  .sort()
  .map((path) => ({ path: relative(root, path).replaceAll('\\', '/'), sha256: sha(path) }))
const before = new Map(original.files.map((f) => [f.path, f.sha256]))
const changedSinceBaseline = files
  .filter((f) => before.get(f.path) !== f.sha256)
  .map((f) => ({
    ...f,
    before: before.get(f.path) || null,
    ownership: owned.includes(f.path)
      ? 'stage1-development'
      : f.path === 'src/domain/report-four-tabs.ts'
        ? 'repair-agent-001-003'
        : 'generated-or-concurrent-review-required'
  }))
const screenshots = resolve(output, 'ui')
mkdirSync(screenshots, { recursive: true })
const captureDir =
  'C:/Users/user/.codex/visualizations/2026/09/04/01a06b16-6b70-7ca3-aeec-9895125a878d'
for (const file of readdirSync(captureDir).filter((f) => /^stage1-.*\.(png|json)$/.test(f)))
  copyFileSync(resolve(captureDir, file), resolve(screenshots, file))
const tests = readdirSync(output)
  .filter((f) => /^run-/.test(f) && existsSync(resolve(output, f, 'result.json')))
  .sort()
  .map((dir) => ({
    directory: dir,
    ...JSON.parse(readFileSync(resolve(output, dir, 'result.json'), 'utf8'))
  }))
const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout?.trim() || null
const documents = ['docs/STAGE1_DEVELOPMENT_DELIVERY.md', 'design-qa.md']
  .filter((f) => existsSync(resolve(root, f)))
  .map((path) => ({ path, sha256: sha(resolve(root, path)) }))
const evidence = walk(output)
  .filter((p) => !p.endsWith('delivery-manifest.json'))
  .map((p) => ({ path: relative(root, p).replaceAll('\\', '/'), sha256: sha(p) }))
writeFileSync(
  resolve(output, 'delivery-manifest.json'),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      root,
      branch: git(['branch', '--show-current']),
      head: git(['rev-parse', 'HEAD']),
      workingTree: git(['status', '--short']),
      baselineAt: original.recordedAt,
      baselineFile: 'docs/stage1-evidence/baseline-1788540877746.json',
      ownedFiles: owned.map((path) => ({ path, sha256: sha(resolve(root, path)) })),
      changedSinceBaseline,
      sourceAndDependencyFiles: files,
      documents,
      tests,
      evidence
    },
    null,
    2
  ) + '\n'
)
console.log(
  JSON.stringify(
    {
      manifest: resolve(output, 'delivery-manifest.json'),
      ownedFiles: owned.length,
      changedSinceBaseline: changedSinceBaseline.map((f) => ({
        path: f.path,
        ownership: f.ownership
      })),
      reportCore: files.find((f) => f.path === 'src/domain/report-four-tabs.ts'),
      tests: tests.map((t) => ({
        directory: t.directory,
        exitCode: t.exitCode,
        changed: t.changed
      })),
      evidenceFiles: evidence.length
    },
    null,
    2
  )
)
