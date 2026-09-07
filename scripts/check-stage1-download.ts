import assert from 'node:assert/strict'
import { copyFileSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const path = 'C:/Users/user/Downloads/運營報表_2026-09-04_2026-09-04_TWD.csv'
const bytes = readFileSync(path),
  metadata = statSync(path)
const uiStart = JSON.parse(readFileSync('docs/stage1-evidence/baseline-1788542967165.json', 'utf8'))
assert.ok(
  metadata.mtimeMs > Date.parse(uiStart.recordedAt),
  'Download must be newer than final UI baseline'
)
const lines = bytes
  .toString('utf8')
  .replace(/^\uFEFF/, '')
  .trim()
  .split(/\r?\n/)
assert.equal(lines.length, 2)
assert.equal(lines[0].slice(1, -1).split('","').length, 13)
assert.equal(
  lines[1],
  '"","2026-09-04","","1","1","200","100","TWD","2026-09-04","2026-09-04","Asia/Taipei","2026-09-05T00:00:00Z","R4T-demo-v1"'
)
assert.ok(!lines.join('').includes('平台收入'))
const result = {
  sourceFile: path,
  downloadedAt: metadata.mtime.toISOString(),
  uiBaselineAt: uiStart.recordedAt,
  bytes: bytes.length,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  rows: 1,
  columns: 13,
  expected: 'M2 operations 1/1/200/100 TWD, 2026-09-04, R4T-demo-v1',
  downloadEvent:
    'Browser event hook timed out; actual downloaded file independently verified by timestamp, content and hash.'
}
copyFileSync(path, 'docs/stage1-evidence/actual-operations-M2.csv')
writeFileSync(
  'docs/stage1-evidence/actual-download-verification.json',
  JSON.stringify(result, null, 2) + '\n'
)
console.log('Actual browser CSV download verified:', JSON.stringify(result, null, 2))
