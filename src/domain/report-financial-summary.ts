import type { FourResult } from './report-four-tabs'

export const financialSourceCategories = [
  {
    id: 'income',
    label: '平台收入',
    source: '收入認列類別與生效版本',
    missing: '尚未接入核准的收入來源及認列規則。'
  },
  {
    id: 'provider',
    label: '供應商成本',
    source: '供應商結算來源',
    missing: '尚未確認實際適用的供應商、帳期及成本來源。'
  },
  {
    id: 'agent',
    label: '代理成本',
    source: '代理結算來源',
    missing: '尚未接入核准的代理收益及條件版本。'
  },
  {
    id: 'payment',
    label: '支付／匯兌成本',
    source: '支付費用與匯兌來源',
    missing: '費用、適用範圍及換算依據未確認。'
  },
  {
    id: 'personnel',
    label: '人事成本',
    source: '人事費用來源',
    missing: '適用性、來源及期間歸屬未確認。'
  },
  {
    id: 'hosting',
    label: '主機成本',
    source: '主機費用來源',
    missing: '適用性、來源及期間歸屬未確認。'
  },
  {
    id: 'software',
    label: '軟體成本',
    source: '軟體費用來源',
    missing: '適用性、來源及期間歸屬未確認。'
  },
  {
    id: 'other',
    label: '其他適用成本',
    source: '其他核准費用來源',
    missing: '成本適用範圍尚未確認，不能宣稱來源完整。'
  }
] as const

/** Stage 1 has no financial records. Missingness is not zero and no formula is inferred. */
export function financialSourceStatus(result: FourResult) {
  return {
    period: `${result.query.from} 至 ${result.query.to}`,
    currency: result.query.currency,
    environment: result.environment,
    operationVersion: result.version,
    filters: {
      agent: result.query.agent,
      merchant: result.query.merchant,
      provider: result.query.provider,
      game: result.query.game
    },
    revenue: null,
    cost: null,
    profit: null,
    sources: financialSourceCategories.map((category) => ({
      ...category,
      applicability: '待核對',
      recordId: null,
      version: null,
      sourceCurrency: null,
      sourcePeriod: null,
      status: '缺少來源'
    }))
  }
}

/** Reuse the existing role/permission catalog, not an all-operator shortcut. */
export function hasFinancialView(
  assigned: string[],
  roles: { code: string; status: string; permissionIds: string[] }[],
  permissions: { id: string; module: string; action: string }[]
) {
  const grants = new Set(
    roles
      .filter((r) => r.status === 'Active' && assigned.includes(r.code))
      .flatMap((r) => r.permissionIds)
  )
  return permissions.some((p) => p.module === 'finance' && p.action === 'View' && grants.has(p.id))
}
