import type { SupplierCostVersion } from './admin-supplier-costs'

/** Add an auditable settlement-day backfill to typed demo contracts without rewriting history. */
export function settlementDayPartnerSamples(
  existing: SupplierCostVersion[]
): SupplierCostVersion[] {
  const eligible = existing.filter(
    (row) =>
      row.scope === 'provider' && row.cycle === 'Monthly' && row.id.startsWith('sample-types:')
  )
  const result: SupplierCostVersion[] = []
  for (const source of eligible) {
    const id = `sample-settlement-day-v2:${source.id}`
    if (existing.some((row) => row.id === id)) continue
    const upstreamId = source.upstreamId
      ? `sample-settlement-day-v2:${source.upstreamId}`
      : undefined
    result.push({
      ...source,
      id,
      settlementDay: 1,
      effectiveFrom: '2026-09-01',
      createdAt: '2026-09-11T00:00:00.000Z',
      createdBy: '使用者授權假資料',
      reason: '驗收演示：回溯補登次月 1 日結算，保留原版本',
      ...(upstreamId ? { upstreamId } : {})
    })
  }
  return result
}

/** Separate typed fixtures; never rewrite an existing contract or locked snapshot. */
export function typedPartnerSamples(existing: SupplierCostVersion[]): SupplierCostVersion[] {
  const result: SupplierCostVersion[] = []
  const samples = existing.filter((r) => r.id.startsWith('sample-v3:'))
  for (const providerId of new Set(samples.map((r) => r.providerId))) {
    if (existing.some((r) => r.providerId === providerId && r.gameType)) continue
    // Do not extend a provider chain that the user has customized.
    if (
      existing.some(
        (r) =>
          r.providerId === providerId &&
          !r.id.startsWith('sample-v3:') &&
          !r.createdBy.includes('演示')
      )
    )
      continue
    for (const gameType of ['SLOT', 'LIVE']) {
      const chain = samples.filter((r) => r.providerId === providerId)
      for (const source of chain) {
        const rate = String(Number(source.payable) + (gameType === 'LIVE' ? 3 : 0))
        const parent = chain.find((r) => r.id === source.upstreamId)
        result.push({
          ...source,
          gameType,
          id: `sample-types:${source.id}:${gameType}`,
          rate,
          payable: rate,
          effectiveFrom: '2026-09-10',
          createdAt: '2026-09-10T00:00:00.000Z',
          reason: '供應商／遊戲類型假資料',
          upstreamId: parent ? `sample-types:${parent.id}:${gameType}` : undefined,
          upstreamCost: parent
            ? String(Number(parent.payable) + (gameType === 'LIVE' ? 3 : 0))
            : undefined
        })
      }
    }
  }
  return result
}

/** Explicitly requested sample set; preserve any manually configured provider chain. */
export function sharedPartnerSample(existing: SupplierCostVersion[]): SupplierCostVersion[] {
  const result: SupplierCostVersion[] = []
  for (let i = 1; i <= 8; i++) {
    const providerId = `PV${String(i).padStart(5, '0')}`
    if (
      existing.some(
        (r) =>
          r.providerId === providerId &&
          (r.scope === 'provider' || !r.createdBy.includes('演示資料'))
      )
    )
      continue
    const base = [2, 4, 3, 3.5, 4.5, 3, 2.5, 3.5][i - 1]
    const targets = [
      { owner: 'platform' as const, ownerId: 'platform', parentId: '', rate: base },
      { owner: 'agent' as const, ownerId: 'A00001', parentId: '', rate: base + 1 },
      { owner: 'merchant' as const, ownerId: 'M00001', parentId: 'A00001', rate: base + 2 }
    ]
    let upstream: SupplierCostVersion | undefined
    for (const target of targets) {
      const row: SupplierCostVersion = {
        ...target,
        rate: String(target.rate),
        payable: String(target.rate),
        providerId,
        id: `sample-v3:${providerId}:${target.owner}:${target.ownerId}`,
        scope: 'provider',
        currency: 'USD',
        basis: 'GGR',
        cycle: 'Monthly',
        settlementDay: 1,
        meaning: 'payable',
        negativeGgr: i % 2 ? 'zero' : 'carry',
        effectiveFrom: '2026-09-09',
        createdAt: '2026-09-09T00:00:00.000Z',
        createdBy: '使用者授權假資料',
        reason: '供應商開放與下發費率操作範例',
        timezone: 'Asia/Taipei',
        ...(upstream ? { upstreamId: upstream.id, upstreamCost: upstream.payable } : {})
      }
      result.push(row)
      upstream = row
    }
  }
  return result
}

/** User-approved frontend sample; never replace an existing contract chain. */
export function supplierCostDemoSeed(existing: SupplierCostVersion[]): SupplierCostVersion[] {
  const targets = [
    { owner: 'platform', ownerId: 'platform', parentId: '', rate: '5' },
    { owner: 'agent', ownerId: 'A00001', parentId: '', rate: '6' },
    { owner: 'merchant', ownerId: 'M00001', parentId: 'A00001', rate: '7' }
  ] as const
  // Seed the whole chain atomically only when none of its scopes has been configured.
  // Legacy unscoped PP conditions also prevent seeding: their currency is uncertain.
  if (
    existing.some(
      (row) =>
        row.providerId === 'PV00001' &&
        (!row.transactionCurrency || row.transactionCurrency === 'USD') &&
        targets.some((target) => target.owner === row.owner && target.ownerId === row.ownerId)
    )
  )
    return []
  const result: SupplierCostVersion[] = []
  for (const target of targets) {
    const upstream = result.at(-1)
    result.push({
      ...target,
      id: `${target.owner}:${target.ownerId}:PV00001:USD:2026-09-09`,
      providerId: 'PV00001',
      transactionCurrency: 'USD',
      currency: 'USD',
      basis: 'GGR',
      cycle: 'Monthly',
      meaning: 'payable',
      payable: target.rate,
      effectiveFrom: '2026-09-09',
      createdAt: '2026-09-09T00:00:00.000Z',
      createdBy: '演示資料（非真實合約）',
      reason: '演示：PP 成本 5% → 亞洲總代理 6% → NovaBet 7%；非正式結算',
      timezone: 'Asia/Taipei',
      ...(upstream ? { upstreamId: upstream.id, upstreamCost: upstream.payable } : {})
    })
  }
  return result
}
