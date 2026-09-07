import type { DemoGame } from './provider-demo'
import { listPage } from './list-query'

export const gameSortKeys = ['id', 'name', 'code', 'providerId', 'syncedAt'] as const
export function queryGames(games: DemoGame[], query: Record<string, unknown>) {
  const q = String(query.q || '')
    .trim()
    .toLowerCase()
  const key = gameSortKeys.find((k) => k === query.sort) || 'id'
  const direction = query.order === 'desc' ? -1 : 1
  return listPage(
    games.filter(
      (g) =>
        (!query.providerFilter || g.providerId === query.providerFilter) &&
        (!query.typeFilter || g.type === query.typeFilter) &&
        (!query.currencyFilter || g.currencies.includes(String(query.currencyFilter))) &&
        (query.activeFilter !== 'active' || g.active) &&
        (query.activeFilter !== 'inactive' || !g.active) &&
        `${g.id} ${g.code} ${g.name}`.toLowerCase().includes(q)
    ),
    Number(query.page || 1),
    Number(query.size || 10),
    (a, b) =>
      direction *
      (String(a[key] || '').localeCompare(String(b[key] || '')) || a.id.localeCompare(b.id))
  )
}
