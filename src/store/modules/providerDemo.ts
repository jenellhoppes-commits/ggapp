import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { createDemoState, createMerchantTrial, capabilityError } from '@/domain/provider-demo'
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
  // One-time sample for the designated local demonstration merchant only.
  // Never resurrect an expired/disabled sample or overwrite existing links.
  const sampleName = 'NovaBet 商戶演示試玩'
  if (!state.value.links.some((l) => l.merchantId === 'M00001')) {
    sample: for (const game of state.value.games) {
      const provider = state.value.providers.find((p) => p.id === game.providerId)
      for (const line of provider?.lines || []) {
        const input = {
          name: sampleName, purpose: 'merchant' as const, merchantId: 'M00001',
          providerId: game.providerId, gameId: game.id, lineId: line.id,
          locale: game.locales[0], initialCredit: 1000,
          expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), maxStarts: 100
        }
        if (!input.locale || capabilityError(state.value, input)) continue
        if (!state.value.merchants?.some((m) => m.id === 'M00001' && m.active)) break sample
        createMerchantTrial(state.value, input, { role: 'admin', name: '演示資料初始化' })
        break sample
      }
    }
  }
  return { state }
})
