export type SettlementCycle = 'Daily' | 'Weekly' | 'Monthly'
const iso = (d: Date) => d.toISOString().slice(0, 10)
export function cycleBounds(value: string, cycle: SettlementCycle = 'Monthly') {
  const date = cycle === 'Monthly' ? `${value}-01` : value
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)))
    throw new Error('請選擇有效帳期日期')
  const start = new Date(`${date}T00:00:00Z`)
  if (iso(start) !== date) throw new Error('請選擇有效帳期日期')
  if (cycle === 'Weekly') start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
  const next = new Date(start)
  if (cycle === 'Monthly') next.setUTCMonth(next.getUTCMonth() + 1)
  else next.setUTCDate(next.getUTCDate() + (cycle === 'Weekly' ? 7 : 1))
  const end = new Date(next.getTime() - 86400000)
  return {
    start: iso(start),
    end: iso(end),
    next: cycle === 'Monthly' ? iso(next).slice(0, 7) : iso(next),
    nextDate: iso(next)
  }
}
