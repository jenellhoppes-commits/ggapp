import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { createDemoState } from '@/domain/provider-demo'
import { ensureProviderCore } from '@/domain/provider-core'
import { watch } from 'vue'
import { useBusinessPartnerStore } from './businessPartner'
import { projectMerchantAccess } from '@/domain/game-availability'
import { ensureGameCatalog } from '@/domain/game-sync'

export const useProviderDemoStore = defineStore('providerDemo', () => {
  // Separate from production/report/wallet stores; shared only in this browser profile.
  const state = useLocalStorage('ggap-provider-demo-v1', createDemoState(), {
    writeDefaults: false
  })
  ensureProviderCore(state.value)
  ensureGameCatalog(state.value)
  const business = useBusinessPartnerStore()
  watch(
    () =>
      projectMerchantAccess(
        business.merchants,
        business.merchantGameConfigurations,
        business.merchantLineGameConfigurations
      ),
    (access) => {
      if (JSON.stringify(state.value.merchants) !== JSON.stringify(access))
        state.value.merchants = access
    },
    { immediate: true, deep: true, flush: 'sync' }
  )
  return { state }
})
