/** Calendar dates follow the platform timezone; weeks start on Monday. */
export function createDateRangeShortcuts(timezone: () => string, now = () => new Date()) {
  return ['本日', '昨日', '本週', '上週', '本月', '上月'].map((text, index) => ({
    text,
    value: (): [Date, Date] => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone(),
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
      }).formatToParts(now())
      const part = (type: string) => Number(parts.find((p) => p.type === type)!.value)
      const end = new Date(Date.UTC(part('year'), part('month') - 1, part('day')))
      const start = new Date(end)
      if (index === 1) {
        start.setUTCDate(start.getUTCDate() - 1)
        end.setUTCDate(end.getUTCDate() - 1)
      } else if (index === 2 || index === 3) {
        start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7))
        if (index === 3) {
          end.setTime(start.getTime())
          end.setUTCDate(end.getUTCDate() - 1)
          start.setUTCDate(start.getUTCDate() - 7)
        }
      } else if (index === 4 || index === 5) {
        start.setUTCDate(1)
        if (index === 5) {
          end.setTime(start.getTime())
          end.setUTCDate(0)
          start.setUTCMonth(start.getUTCMonth() - 1)
        }
      }
      // The picker displays local calendar dates, not UTC instants.
      const local = (date: Date) =>
        new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)
      return [local(start), local(end)]
    }
  }))
}
