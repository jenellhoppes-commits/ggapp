import { permitsAgent } from './agent-access'
export type CostOwner = 'platform' | 'agent' | 'merchant'
export interface SupplierCostInput {
  scope?: 'provider'
  negativeGgr?: 'zero' | 'carry'
  /** Monthly settlement day in the following month. Missing means an unverified legacy version. */
  settlementDay?: number
  reason?: string
  providerId: string
  /** Undefined is a legacy contract, never a wildcard for a typed contract. */
  gameType?: string
  /** Required for new versions. Missing on legacy rows means unverified, never all currencies. */
  transactionCurrency?: string
  basis: 'GGR' | 'ValidBet'
  currency: string
  cycle: 'Monthly' | 'Weekly' | 'Daily'
  effectiveFrom: string
  rate: string
  meaning: 'payable' | 'retained'
}
export interface SupplierCostVersion extends SupplierCostInput {
  id: string
  owner: CostOwner
  ownerId: string
  parentId: string
  payable: string
  upstreamId?: string
  upstreamCost?: string
  createdAt: string
  createdBy: string
  timezone: string
}
export const costUnits = (value: string) => {
  if (!/^(0|[1-9]\d{0,2})(\.\d{1,6})?$/.test(value) || Number(value) > 100)
    throw new Error('比例須為 0–100，最多六位小數；空白不等於 0')
  const [whole, decimals = ''] = value.split('.')
  return BigInt(whole) * 1000000n + BigInt(decimals.padEnd(6, '0'))
}
const unitsText = (n: bigint) =>
  `${n / 1000000n}.${String(n % 1000000n).padStart(6, '0')}`.replace(/\.?0+$/, '')
export function payableRate(input: Pick<SupplierCostInput, 'rate' | 'meaning'>) {
  return unitsText(
    input.meaning === 'retained' ? 100000000n - costUnits(input.rate) : costUnits(input.rate)
  )
}
export function monthlySettlementDate(month: string, settlementDay: number) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('請選擇有效月份')
  if (!Number.isInteger(settlementDay) || settlementDay < 1 || settlementDay > 28)
    throw new Error('次月結算日須為 1–28 日')
  const [year, monthNumber] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber, settlementDay)).toISOString().slice(0, 10)
}
export function supplierCostAt(
  rows: SupplierCostVersion[],
  owner: CostOwner,
  ownerId: string,
  providerId: string,
  date: string,
  transactionCurrency?: string,
  gameType?: string
) {
  return rows
    .filter(
      (r) =>
        r.owner === owner &&
        r.ownerId === ownerId &&
        r.providerId === providerId &&
        r.gameType === gameType &&
        (r.scope === 'provider' || r.transactionCurrency === transactionCurrency) &&
        r.effectiveFrom <= date
    )
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
    .at(-1)
}
export function prepareSupplierCost(
  rows: SupplierCostVersion[],
  owner: CostOwner,
  ownerId: string,
  parentId: string,
  input: SupplierCostInput,
  context: CostContext
): SupplierCostVersion {
  if (
    input.gameType !== undefined &&
    (!/^[A-Z][A-Z0-9_]*$/.test(input.gameType) || input.basis !== 'GGR')
  )
    throw new Error('遊戲類型條件必須使用有效類型與 GGR 計費基礎')
  const admin = context.roles.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r))
  if (
    !admin &&
    !(
      permitsAgent(context.roles, 'business') &&
      context.agentId &&
      owner !== 'platform' &&
      parentId === context.agentId &&
      context.editableTargets?.includes(`${owner}:${ownerId}`)
    )
  )
    throw new Error('僅總後台或有權限的直接上級可設定供應商條件')
  return prepareCost(rows, owner, ownerId, parentId, input, context)
}
export interface CostContext {
  roles: string[]
  name: string
  today: string
  timezone: string
  providers: string[]
  currencies: string[]
  providerCurrencies?: Record<string, string[]>
  agentId?: string
  editableTargets?: string[]
}
function prepareCost(
  rows: SupplierCostVersion[],
  owner: CostOwner,
  ownerId: string,
  parentId: string,
  input: SupplierCostInput,
  context: CostContext
): SupplierCostVersion {
  if (
    input.settlementDay !== undefined &&
    (!Number.isInteger(input.settlementDay) || input.settlementDay < 1 || input.settlementDay > 28)
  )
    throw new Error('次月結算日須為 1–28 日；舊版本未設定時保留待確認')
  if (input.scope === 'provider') {
    if (input.transactionCurrency) throw new Error('供應商共用合約不可綁定單一交易幣別')
    if (!input.negativeGgr) throw new Error('請設定負 GGR 處理方式')
  } else if (
    rows.some(
      (r) =>
        r.owner === owner &&
        r.ownerId === ownerId &&
        r.providerId === input.providerId &&
        r.scope === 'provider'
    )
  ) {
    throw new Error('此供應商已使用共用合約，不可再建立幣別線路條件')
  }
  if (
    input.scope !== 'provider' &&
    (!input.transactionCurrency ||
      !context.providerCurrencies?.[input.providerId]?.includes(input.transactionCurrency))
  )
    throw new Error('請指定已接入的供應商交易幣別；舊版未指定範圍的條件須重新確認')
  if (
    !ownerId ||
    !context.providers.includes(input.providerId) ||
    !context.currencies.includes(input.currency)
  )
    throw new Error('請選擇有效對象、供應商與結算幣別')
  if (
    !['GGR', 'ValidBet'].includes(input.basis) ||
    !['Monthly', 'Weekly', 'Daily'].includes(input.cycle)
  )
    throw new Error('請選擇支援的計費基礎與週期')
  if (
    !['payable', 'retained'].includes(input.meaning) ||
    (owner !== 'platform' && input.meaning !== 'payable')
  )
    throw new Error('下級條件只能使用對下級收取費率')
  const date = new Date(`${input.effectiveFrom}T00:00:00Z`)
  if (input.negativeGgr && !['zero', 'carry'].includes(input.negativeGgr))
    throw new Error('請選擇有效的負 GGR 處理方式')
  if (
    !context.today ||
    !context.timezone ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== input.effectiveFrom ||
    input.effectiveFrom < context.today
  )
    throw new Error('請填寫本日或未來有效日期；原型不開放追溯改價')
  const history = rows.filter(
    (r) =>
      r.owner === owner &&
      r.ownerId === ownerId &&
      r.providerId === input.providerId &&
      r.gameType === input.gameType &&
      (input.scope === 'provider' ||
        r.scope === 'provider' ||
        r.transactionCurrency === input.transactionCurrency)
  )
  if (history.some((r) => r.parentId !== parentId))
    throw new Error('此對象的上級已變更，請先處理舊成本承接關係')
  if (history.some((r) => r.effectiveFrom >= input.effectiveFrom))
    throw new Error('生效日期須晚於既有版本，不覆蓋歷史或排定版本')
  const payable = payableRate(input)
  const parentOwner: CostOwner = parentId ? 'agent' : 'platform'
  if (owner === 'merchant' && !parentId) throw new Error('商戶必須指定直接代理')
  if (owner === 'agent' && ownerId === parentId) throw new Error('不可承接自身條件')
  const upstream =
    owner === 'platform'
      ? undefined
      : supplierCostAt(
          rows,
          parentOwner,
          parentId || 'platform',
          input.providerId,
          input.effectiveFrom,
          input.transactionCurrency,
          input.gameType
        )
  if (owner !== 'platform' && !upstream)
    throw new Error('生效日缺少上游供應商成本；請先設定上游條件')
  if (input.scope === 'provider' && owner !== 'platform' && upstream?.scope !== 'provider')
    throw new Error('請先確認上游供應商共用合約，不自動合併舊版幣別條件')
  const compatible = (a: SupplierCostInput, b: SupplierCostInput) =>
    a.basis === b.basis &&
    (a.settlementDay === undefined ||
      b.settlementDay === undefined ||
      a.settlementDay === b.settlementDay) &&
    ((a.scope === 'provider' && b.scope === 'provider') ||
      (a.currency === b.currency && a.cycle === b.cycle))
  const upstreamVersions =
    owner === 'platform'
      ? []
      : rows.filter(
          (r) =>
            r.owner === parentOwner &&
            r.ownerId === (parentId || 'platform') &&
            r.providerId === input.providerId &&
            r.gameType === input.gameType &&
            (input.scope === 'provider' ||
              r.scope === 'provider' ||
              r.transactionCurrency === input.transactionCurrency) &&
            r.effectiveFrom > input.effectiveFrom
        )
  for (const base of [...(upstream ? [upstream] : []), ...upstreamVersions]) {
    if (!compatible(input, base))
      throw new Error('上游計費基礎、結算幣別或週期不一致，不能比較比例')
    if (costUnits(payable) < costUnits(base.payable))
      throw new Error(
        `低於上游成本 ${base.payable}%（${base.effectiveFrom} 起）；請提高對下級收取費率`
      )
  }
  // Changing a parent's cost cannot silently make an existing or scheduled child loss-making.
  const children = rows.filter(
    (r) =>
      r.providerId === input.providerId &&
      r.gameType === input.gameType &&
      (input.scope === 'provider' ||
        r.scope === 'provider' ||
        r.transactionCurrency === input.transactionCurrency) &&
      (owner === 'platform'
        ? r.owner === 'agent' && !r.parentId
        : owner === 'agent'
          ? r.owner !== 'platform' && r.parentId === ownerId
          : false)
  )
  for (const child of children) {
    const atStart = supplierCostAt(
      rows,
      child.owner,
      child.ownerId,
      child.providerId,
      input.effectiveFrom,
      input.transactionCurrency,
      input.gameType
    )
    if (child.effectiveFrom < input.effectiveFrom && child.id !== atStart?.id) continue
    if (!compatible(input, child) || costUnits(child.payable) < costUnits(payable))
      throw new Error(`下級 ${child.ownerId} 在新條件生效後不相容或低於成本；請先處理下級條件`)
  }
  return {
    ...input,
    id: `${owner}:${ownerId}:${input.providerId}:${input.gameType ? input.gameType + ':' : ''}${input.scope === 'provider' ? 'all' : input.transactionCurrency}:${input.effectiveFrom}`,
    owner,
    ownerId,
    parentId,
    payable,
    upstreamId: upstream?.id,
    upstreamCost: upstream?.payable,
    createdAt: new Date().toISOString(),
    createdBy: context.name,
    timezone: context.timezone
  }
}
