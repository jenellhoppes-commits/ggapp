import type { FourQuery, ReportStats } from './report-four-tabs'
export const reportMetrics: { key: keyof ReportStats; label: string; amount?: boolean }[] = [
  { key: 'betCount', label: '下注筆數' },
  { key: 'players', label: '投注人數' },
  { key: 'betAmount', label: '投注金額', amount: true },
  { key: 'payoutAmount', label: '派彩金額', amount: true }
]
export function formatReportMetric(value: number | string | null, amount = false) {
  if (value === null) return '資料待確認'
  if (!amount && typeof value === 'number') return value.toLocaleString('zh-TW')
  const raw = String(value)
  if (!amount || !/^-?\d+(\.\d+)?$/.test(raw)) return raw
  const negative = raw.startsWith('-')
  const [whole, fraction] = (negative ? raw.slice(1) : raw).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${negative ? '-' : ''}${grouped}${fraction === undefined ? '' : `.${fraction}`}`
}
export const reportSortState = (query: FourQuery, key: string) =>
  query.sort !== key ? '未排序' : query.order === 'asc' ? '升冪' : '降冪'
export const nextReportSort = (query: FourQuery, key: string): FourQuery => ({
  ...query,
  sort: key,
  order: query.sort === key && query.order === 'asc' ? 'desc' : 'asc',
  page: 1
})
