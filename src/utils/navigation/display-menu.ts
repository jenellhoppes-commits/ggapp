import type { AppRouteRecord } from '@/types/router'

/** Presentation only: preserve the original route tree for registration and permissions. */
export function buildDisplayMenu(items: AppRouteRecord[], parentPath = ''): AppRouteRecord[] {
  return items.flatMap<AppRouteRecord>((item) => {
    if (item.meta.isHide) return []
    const path =
      item.path.startsWith('/') || /^https?:\/\//.test(item.path)
        ? item.path
        : `${parentPath}/${item.path}`
    const children = buildDisplayMenu(item.children || [], path)
    if (children.length === 1) {
      const child = children[0]
      return [
        {
          ...child,
          meta: {
            ...child.meta,
            icon: item.meta.icon || child.meta.icon,
            menuGroup: item.meta.menuGroup || child.meta.menuGroup
          }
        }
      ]
    }
    if (children.length > 1) return [{ ...item, path, meta: { ...item.meta }, children }]
    const isPage = item.component && item.component !== '/index/index'
    if (!isPage && !item.meta.link && !item.meta.isIframe) return []
    return [{ ...item, path, meta: { ...item.meta }, children: undefined }]
  })
}
