import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import { useUserStore } from './user'
import {
  collectionModeAt,
  type CollectionVersion,
  type CollectionMode
} from '@/domain/collection-mode'
export const useCollectionModeStore = defineStore('collectionMode', () => {
  const versions = useLocalStorage<CollectionVersion[]>('ggap-collection-modes-v1', [])
  const at = (merchantId: string, date: string, initial?: CollectionMode) =>
    collectionModeAt(versions.value, merchantId, date, initial)
  const save = (
    merchantId: string,
    mode: CollectionMode,
    effectiveFrom: string,
    reason: string
  ) => {
    const user = useUserStore()
    if (!user.info.roles?.some((role) => ['R_SUPER', 'R_ADMIN'].includes(role)))
      throw new Error('僅平台可變更收付模式')
    if (
      !['AgentCollect', 'PlatformCollect'].includes(mode) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom) ||
      !reason.trim()
    )
      throw new Error('請填寫模式、生效日及變更原因')
    const parsed = new Date(effectiveFrom + 'T00:00:00Z')
    if (
      !merchantId ||
      !Number.isFinite(parsed.getTime()) ||
      parsed.toISOString().slice(0, 10) !== effectiveFrom
    )
      throw new Error('生效日期無效')
    const version =
      // Each effective date has exactly one immutable version.
      Math.max(
        0,
        ...versions.value.filter((v) => v.merchantId === merchantId).map((v) => v.version)
      ) + 1
    if (
      versions.value.some((v) => v.merchantId === merchantId && v.effectiveFrom === effectiveFrom)
    )
      throw new Error('該生效日期已有模式版本，請選擇其他日期')
    versions.value.push({
      merchantId,
      mode,
      effectiveFrom,
      reason: reason.trim(),
      version,
      actor: user.info.userName || '平台',
      createdAt: new Date().toISOString()
    })
  }
  return { versions, at, save }
})
