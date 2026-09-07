import { canManageProviders, type CoreActor } from './provider-core'
import type { DemoState } from './provider-demo'

export interface ProviderTermsInput {
  basis: 'GGR' | 'ValidBet' | 'Fixed'
  rate: string
  currency: string
  cycle: 'Monthly' | 'Weekly' | 'Daily'
  effectiveFrom: string
  note: string
}
export interface ProviderTermsVersion extends ProviderTermsInput {
  version: number
  timezone: string
  createdAt: string
  createdBy: string
}
export function termsAt(versions: ProviderTermsVersion[], date: string) {
  return [...versions].reverse().find((v) => v.effectiveFrom <= date)
}
export function saveProviderTerms(
  state: DemoState,
  providerId: string,
  input: ProviderTermsInput,
  expectedVersion: number,
  actor: CoreActor,
  context: { today: string; timezone: string; currencies: string[] }
) {
  if (!canManageProviders(actor)) throw new Error('沒有供應商設定權限')
  const provider = state.providers.find((p) => p.id === providerId)
  if (!provider) throw new Error('找不到供應商')
  const versions = provider.terms || []
  if ((versions.at(-1)?.version || 0) !== expectedVersion)
    throw new Error('資料已更新，請取消後重新開啟比對')
  if (!['GGR', 'ValidBet', 'Fixed'].includes(input.basis)) throw new Error('請選擇計費基礎')
  if (
    !/^(0|[1-9]\d{0,11})(\.\d{1,6})?$/.test(input.rate) ||
    (input.basis !== 'Fixed' && Number(input.rate) > 100)
  )
    throw new Error('請輸入有效費率：百分比 0–100，金額非負，最多六位小數')
  if (!context.currencies.includes(input.currency)) throw new Error('請選擇已啟用的結算幣別')
  if (!['Monthly', 'Weekly', 'Daily'].includes(input.cycle)) throw new Error('請選擇結算週期')
  const parsed = new Date(`${input.effectiveFrom}T00:00:00Z`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== input.effectiveFrom
  )
    throw new Error('請填寫有效的生效日期')
  if (!context.today || !context.timezone) throw new Error('平台時區尚未設定')
  if (input.effectiveFrom < context.today)
    throw new Error('原型暫不開放追溯生效，請選擇本日或未來日期')
  if (versions.length && input.effectiveFrom <= versions.at(-1)!.effectiveFrom)
    throw new Error('新版本生效日期必須晚於上一版本，不覆蓋已排定條件')
  if (input.note.length > 500) throw new Error('備註不得超過 500 字')
  const version = expectedVersion + 1
  provider.terms = [
    ...versions,
    {
      ...input,
      version,
      timezone: context.timezone,
      createdAt: new Date().toISOString(),
      createdBy: actor.name
    }
  ]
  state.audit.unshift({
    at: new Date().toISOString(),
    providerId,
    action: `新增合約條件 V${version}，${input.effectiveFrom} 生效（演示，不執行結算）`,
    actor: actor.name
  })
}
