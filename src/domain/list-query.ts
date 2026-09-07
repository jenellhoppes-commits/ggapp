export function listPage<T>(
  rows: T[],
  page: number,
  size: number,
  compare?: (a: T, b: T) => number
) {
  const pageSize = [10, 20, 50].includes(size) ? size : 10
  const sorted = compare ? [...rows].sort(compare) : rows
  const current = Math.min(
    Math.max(1, Number.isSafeInteger(page) ? page : 1),
    Math.max(1, Math.ceil(rows.length / pageSize))
  )
  return {
    items: sorted.slice((current - 1) * pageSize, current * pageSize),
    total: rows.length,
    page: current,
    size: pageSize
  }
}
