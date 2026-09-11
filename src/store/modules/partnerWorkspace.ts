import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { permitsAgent, findLoginAccount, accountRolesFor } from '@/domain/agent-access'
import type { SupplierCostVersion } from '@/domain/admin-supplier-costs'
import {
  supplierCostDemoSeed,
  sharedPartnerSample,
  typedPartnerSamples,
  settlementDayPartnerSamples
} from '@/domain/supplier-cost-demo'
import {
  PARTNER_JOURNAL_KEY,
  persistPartnerJournal,
  type PartnerJournal,
  type CreationEntry
} from '@/domain/partner-creation'

export const usePartnerWorkspaceStore = defineStore('partnerWorkspace', () => {
  const expected = ref(
    typeof localStorage === 'undefined' ? null : localStorage.getItem(PARTNER_JOURNAL_KEY)
  )
  const error = ref('')
  const journal = ref<PartnerJournal>({ version: 1, entries: [], costVersions: [] })
  if (expected.value) {
    try {
      const parsed = JSON.parse(expected.value)
      if (
        parsed.version !== 1 ||
        !Array.isArray(parsed.entries) ||
        !Array.isArray(parsed.costVersions) ||
        parsed.entries.some(
          (e: CreationEntry) =>
            !e || !e.requestId || !Array.isArray(e.costs) || (!e.agent && !e.merchant)
        )
      )
        throw new Error()
      journal.value = parsed
    } catch {
      error.value = '合作資料無法讀取，請保留資料並聯絡管理者；不會覆寫原內容'
    }
  }
  const legacyCosts = useLocalStorage<SupplierCostVersion[]>('ggap-admin-supplier-costs-v1', [], {
    writeDefaults: false
  })
  const costs = computed(() => [
    ...legacyCosts.value,
    ...journal.value.entries.flatMap((e) => e.costs),
    ...journal.value.costVersions
  ])
  function save(next: PartnerJournal) {
    if (error.value) throw new Error(error.value)
    const serialized = persistPartnerJournal(localStorage, expected.value, next)
    expected.value = serialized
    journal.value = JSON.parse(serialized)
  }
  function addEntry(entry: CreationEntry) {
    assertBusinessAccess()
    const previous = journal.value.entries.find((e) => e.requestId === entry.requestId)
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(entry)) throw new Error('重複請求內容衝突')
      return
    }
    save({ ...journal.value, entries: [...journal.value.entries, entry] })
  }
  function addCost(version: SupplierCostVersion) {
    assertBusinessAccess()
    if (costs.value.some((v) => v.id === version.id)) throw new Error('條件版本已存在')
    save({ ...journal.value, costVersions: [...journal.value.costVersions, version] })
  }
  function assertBusinessAccess() {
    const login = localStorage.getItem('ggap-demo-user') || ''
    const roles =
      login === 'super' ? ['R_SUPER'] : accountRolesFor(findLoginAccount(localStorage, login))
    if (!roles.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r)) && !permitsAgent(roles, 'business'))
      throw new Error('目前角色不可修改合作或商務條件')
  }
  if (!error.value && typeof localStorage !== 'undefined') {
    const legacySamples = supplierCostDemoSeed(costs.value)
    const demoCosts = [...legacySamples, ...sharedPartnerSample([...costs.value, ...legacySamples])]
    demoCosts.push(...typedPartnerSamples([...costs.value, ...demoCosts]))
    demoCosts.push(...settlementDayPartnerSamples([...costs.value, ...demoCosts]))
    if (demoCosts.length) {
      try {
        save({ ...journal.value, costVersions: [...journal.value.costVersions, ...demoCosts] })
      } catch (e) {
        error.value = e instanceof Error ? e.message : '演示資料保存失敗'
      }
    }
  }
  return { journal, costs, error, addEntry, addCost }
})
