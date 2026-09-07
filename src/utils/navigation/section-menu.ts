import type { AppRouteRecord } from '@/types/router'
import { buildDisplayMenu } from './display-menu'

/** Flatten only the visible projection; authorization and canonical routes remain untouched. */
export function buildSectionMenu(routes: AppRouteRecord[]) {
  return routes.flatMap((section) => {
    if (section.meta.isHide) return []
    const items = buildDisplayMenu(section.children || [], section.path)
    return items.length ? [{ path: section.path, title: section.meta.title, items }] : []
  })
}
