import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import { useUserStore } from '@/store/modules/user'
import { useProviderDemoStore } from '@/store/modules/providerDemo'
export function useMerchantDemoAccess() {
  const user = useUserStore(), store = useProviderDemoStore(), now = useNow({ interval: 1000 })
  return computed(() => !!user.info.merchantId && !!user.info.roles?.includes('R_MERCHANT') && store.state.links.some((link) =>
    link.purpose === 'merchant' && link.merchantId === user.info.merchantId && !link.disabled && !link.replacedById &&
    Date.parse(link.expiresAt) > now.value.getTime() && (link.maxStarts === undefined || link.starts < link.maxStarts)
  ))
}
