// Prototype quote fallback: units of currency per USDT. Never use these to rewrite a bill.
const demoQuotes: Record<string, number> = {
  USDT: 1,
  USD: 1.001,
  TWD: 32.083333,
  THB: 35.75,
  HKD: 7.8,
  SGD: 1.3,
  AUD: 1.5,
  EUR: 0.92,
  INR: 84,
  PHP: 57.2,
  JPY: 147.2,
  VND: 26342,
  IDR: 16410,
  MYR: 4.2415,
  KRW: 1390,
  CNY: 7.15,
  ASGU: 1
}
export function reportQuoteDetails(
  currency: string,
  rates: Array<{
    fromCurrency: string
    toCurrency: string
    status: string
    date: string
    finalRate: number
  }>,
  date: string
) {
  if (currency === 'USDT') return { rate: 1, source: '基準幣', date: '' }
  const current = rates
    .filter(
      (r) =>
        r.fromCurrency === 'USDT' &&
        r.toCurrency === currency &&
        ['Published', 'Locked'].includes(r.status) &&
        r.date <= date &&
        r.finalRate > 0
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0]
  return current
    ? { rate: current.finalRate, source: '已發布／鎖定匯率', date: current.date }
    : {
        rate: demoQuotes[currency] ?? null,
        source: demoQuotes[currency] ? '內建展示匯率' : '未提供',
        date: ''
      }
}
export function reportQuote(
  currency: string,
  rates: Parameters<typeof reportQuoteDetails>[1],
  date: string
) {
  return reportQuoteDetails(currency, rates, date).rate
}
export function approximateReportTotal(
  rows: Array<{ currency: string; amount: number | null }>,
  target: string,
  quote: (currency: string) => number | null
): number | null {
  let total = 0
  for (const row of rows) {
    if (row.amount === null || !Number.isFinite(row.amount)) return null
    if (row.currency === target) {
      total += row.amount
      continue
    }
    const from = quote(row.currency),
      to = quote(target)
    if (!from || !to || !Number.isFinite(from) || !Number.isFinite(to) || from < 0 || to < 0)
      return null
    total += (row.amount / from) * to
  }
  return Number(total.toFixed(6))
}
