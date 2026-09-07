import type { ReportMetricRow, ReportRowStatus } from '../types/game-provider'
export interface ReportFilters {
  dateRange: [string, string]
  currency: string
  agentId: string
  merchantId: string
  gameId: string
  lineUid: string
  keyword: string
  excludeTest: boolean
  status: ReportRowStatus | ''
}
const scalar = (value: unknown) => (typeof value === 'string' ? value : '')
export function readReportFilters(query: Record<string, unknown> = {}): ReportFilters {
  return {
    dateRange: [
      scalar(query.from || query.startDate) || '2026-09-01',
      scalar(query.to || query.endDate) || '2026-09-04'
    ],
    currency: scalar(query.currency),
    agentId: scalar(query.agentId),
    merchantId: scalar(query.merchantId),
    gameId: scalar(query.gameId),
    lineUid: scalar(query.lineUid),
    keyword: scalar(typeof query.keyword === 'string' ? query.keyword : query.q),
    excludeTest: query.excludeTest !== 'false',
    status: ['Normal', 'Attention', 'Pending', 'Completed'].includes(scalar(query.status))
      ? (scalar(query.status) as ReportRowStatus)
      : ''
  }
}
export function filterReportRows(rows: ReportMetricRow[], filters: ReportFilters) {
  const query = filters.keyword.trim().toLowerCase()
  return rows.filter((row) => {
    for (const key of ['currency', 'agentId', 'merchantId', 'gameId', 'lineUid', 'status'] as const)
      if (filters[key] && row[key] !== filters[key]) return false
    if (filters.excludeTest && row.category === '測試會員') return false
    return (
      !query ||
      `${row.id} ${row.primary} ${row.secondary || ''} ${row.agentName || ''} ${row.merchantName || ''} ${row.lineUid || ''}`
        .toLowerCase()
        .includes(query)
    )
  })
}
export function reportFilterQuery(filters: ReportFilters) {
  const { dateRange, excludeTest, ...rest } = filters
  return { ...rest, from: dateRange[0], to: dateRange[1], excludeTest: String(excludeTest) }
}
export function reportCsvCell(value: unknown) {
  const raw = String(value ?? '')
  const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw
  return `"${safe.replaceAll('"', '""')}"`
}
