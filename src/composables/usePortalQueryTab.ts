import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/** Page-local tabs retain applied query conditions and work with Back/refresh. */
export function usePortalQueryTab(values: string[], fallback: string, key = 'tab') {
  const route = useRoute(),
    router = useRouter()
  return computed({
    get: () =>
      typeof route.query[key] === 'string' && values.includes(route.query[key] as string)
        ? (route.query[key] as string)
        : fallback,
    set: (value: string) => {
      if (values.includes(value))
        void router.push({ path: route.path, query: { ...route.query, [key]: value } })
    }
  })
}
