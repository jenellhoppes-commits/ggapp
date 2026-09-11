export interface PortalRate {
  id: string
  date: string
  fromCurrency: string
  toCurrency: string
  status: string
}

/** Source is already scoped by the caller; never expands tenant visibility. */
export function filterPortalRates<T extends PortalRate>(
  source: T[],
  query: {
    today: string
    view: string
    from?: string
    to?: string
    currency?: string
  }
): T[] {
  const published = source.filter(
    (r) => ['Published', 'Locked'].includes(r.status) && r.date <= query.today
  )
  return published
    .filter(
      (r) =>
        (query.view === 'history' ||
          !published.some(
            (other) =>
              other.fromCurrency === r.fromCurrency &&
              other.toCurrency === r.toCurrency &&
              other.date > r.date
          )) &&
        (!query.from || r.date >= query.from) &&
        (!query.to || r.date <= query.to) &&
        (!query.currency || r.fromCurrency === query.currency || r.toCurrency === query.currency)
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.toCurrency.localeCompare(b.toCurrency) ||
        a.id.localeCompare(b.id)
    )
}
