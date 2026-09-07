import assert from 'node:assert/strict'
import { createDateRangeShortcuts } from '../src/utils/form/date-range-shortcuts'

const date = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
let timezone = 'Asia/Taipei'
let now = new Date('2026-09-06T16:30:00Z')
const shortcuts = createDateRangeShortcuts(
  () => timezone,
  () => now
)
const ranges = () => shortcuts.map((s) => s.value().map(date).join('/'))
assert.deepEqual(
  shortcuts.map((s) => s.text),
  ['本日', '昨日', '本週', '上週', '本月', '上月']
)
assert.deepEqual(ranges(), [
  '2026-09-07/2026-09-07',
  '2026-09-06/2026-09-06',
  '2026-09-07/2026-09-07',
  '2026-08-31/2026-09-06',
  '2026-09-01/2026-09-07',
  '2026-08-01/2026-08-31'
])
timezone = 'America/New_York'
assert.equal(ranges()[0], '2026-09-06/2026-09-06')
assert.equal(ranges()[2], '2026-08-31/2026-09-06')
now = new Date('2024-03-01T18:00:00Z')
assert.equal(ranges()[5], '2024-02-01/2024-02-29')
now = new Date('2027-01-01T18:00:00Z')
assert.equal(ranges()[5], '2026-12-01/2026-12-31')
assert.equal(ranges()[2], '2026-12-28/2027-01-01')
console.log('Date shortcuts: all calendar, timezone and rollover checks passed')
