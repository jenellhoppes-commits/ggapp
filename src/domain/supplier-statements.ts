import {
  supplierCostAt,
  costUnits,
  type CostOwner,
  type SupplierCostVersion
} from './admin-supplier-costs'
import { platformDate } from './report-four-tabs'

export type StatementBet = {
  validConfirmed?: boolean
  id: string
  providerId: string
  currency: string
  time: string
  game: string
  gameType?: string
  bet: number
  valid: number
  payout: number
}
export type StatementLine = {
  key: string
  providerId: string
  gameType?: string
  currency: string
  version: string
  effectiveFrom: string
  effectiveTo: string
  basis: string
  rate: string
  settlementCurrency: string
  cycle: string
  bet: number
  valid: number
  payout: number
  ggr: number
  base: number
  amount: number | null
  issue: string
  sources: StatementBet[]
}
// Demonstration amounts are integer hundredths, not binary floating-point monetary inputs.
export function calculateStatement(
  bets: StatementBet[],
  costs: SupplierCostVersion[],
  owner: CostOwner,
  ownerId: string,
  from: string,
  to: string,
  timezone: string
) {
  const groups = new Map<string, StatementLine>()
  const validDate = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(`${date}T00:00:00Z`)) &&
    new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date
  if (!timezone || !validDate(from) || !validDate(to) || from > to)
    throw new Error('請設定有效帳期與平台時區')
  const seen = new Set<string>()
  for (const bet of bets) {
    if (seen.has(bet.id)) throw new Error('來源注單重複，不能重複計費')
    seen.add(bet.id)
    if (
      !Number.isFinite(Date.parse(bet.time)) ||
      ![bet.bet, bet.valid, bet.payout].every((n) => Number.isSafeInteger(n) && n >= 0)
    )
      throw new Error('來源時間或金額無效')
    const date = platformDate(new Date(bet.time), timezone)
    if (date < from || date > to) continue
    // Merchant rows are the sales rates assigned by its parent, not provider
    // acquisition costs. Never fall back to another owner's cost or rate.
    const version = supplierCostAt(
      costs,
      owner,
      ownerId,
      bet.providerId,
      date,
      bet.currency,
      bet.gameType
    )
    const key = `${bet.providerId}:${bet.gameType || 'legacy'}:${bet.currency}:${version?.id || 'missing'}`
    let line = groups.get(key)
    if (!line) {
      const next = costs
        .filter(
          (c) =>
            c.owner === owner &&
            c.ownerId === ownerId &&
            c.providerId === bet.providerId &&
            c.gameType === bet.gameType &&
            (c.scope === 'provider' || c.transactionCurrency === bet.currency) &&
            c.effectiveFrom > (version?.effectiveFrom || date)
        )
        .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))[0]
      const end = next
        ? new Date(Date.parse(`${next.effectiveFrom}T00:00:00Z`) - 86400000)
            .toISOString()
            .slice(0, 10)
        : to
      line = {
        key,
        providerId: bet.providerId,
        gameType: bet.gameType,
        currency: bet.currency,
        version: version?.id || '缺少條件',
        effectiveFrom: version
          ? version.effectiveFrom > from
            ? version.effectiveFrom
            : from
          : from,
        effectiveTo: end < to ? end : to,
        basis: version?.basis || '待補',
        rate: version?.payable || '',
        settlementCurrency: version?.currency || '',
        cycle: version?.cycle || '',
        bet: 0,
        valid: 0,
        payout: 0,
        ggr: 0,
        base: 0,
        amount: null,
        issue: version ? '' : '缺少適用費率版本',
        sources: []
      }
      groups.set(key, line)
    }
    line.bet += bet.bet
    line.valid += bet.valid
    line.payout += bet.payout
    line.sources.push({ ...bet })
    if (line.basis !== 'GGR' && bet.validConfirmed === false)
      line.issue = '交易來源未提供有效投注，不能推估計費基礎'
  }
  for (const line of groups.values()) {
    line.ggr = line.bet - line.payout
    line.base = line.basis === 'GGR' ? line.ggr : line.valid
    if (line.issue) continue
    if (![line.bet, line.valid, line.payout, line.base].every(Number.isSafeInteger)) {
      line.issue = '金額超出演示安全範圍'
      continue
    }
    if (line.base < 0) {
      line.issue = '負數結算政策待確認'
      continue
    }
    if (line.currency !== line.settlementCurrency) {
      line.issue = '缺少結算匯率快照，不以目前匯率代替'
      continue
    }
    line.amount = Number((BigInt(line.base) * costUnits(line.rate) + 50000000n) / 100000000n)
  }
  return [...groups.values()]
}

export function statementExample(owner: CostOwner, ownerId: string, rate: number) {
  const base = {
    owner,
    ownerId,
    parentId: '',
    meaning: 'payable' as const,
    basis: 'GGR' as const,
    currency: 'USD',
    cycle: 'Monthly' as const,
    transactionCurrency: 'USD',
    providerId: 'PV00001',
    createdAt: '2026-09-09',
    createdBy: '獨立驗收範例，非合約',
    timezone: 'Asia/Taipei'
  }
  const costs: SupplierCostVersion[] = [
    {
      ...base,
      id: 'DEMO-PP-V1',
      effectiveFrom: '2026-09-01',
      rate: String(rate),
      payable: String(rate)
    },
    {
      ...base,
      id: 'DEMO-PP-V2',
      effectiveFrom: '2026-09-16',
      rate: String(rate + 1),
      payable: String(rate + 1)
    },
    {
      ...base,
      id: 'DEMO-EVO-V1',
      providerId: 'PV00002',
      basis: 'ValidBet',
      effectiveFrom: '2026-09-01',
      rate: '2',
      payable: '2'
    }
  ]
  const bets: StatementBet[] = [
    {
      id: 'DEMO-BET-01',
      providerId: 'PV00001',
      currency: 'USD',
      time: '2026-09-15T15:59:00Z',
      game: 'PP 演示遊戲',
      bet: 100000,
      valid: 100000,
      payout: 80000
    },
    {
      id: 'DEMO-BET-02',
      providerId: 'PV00001',
      currency: 'USD',
      time: '2026-09-15T16:00:00Z',
      game: 'PP 演示遊戲',
      bet: 100000,
      valid: 100000,
      payout: 80000
    },
    {
      id: 'DEMO-BET-03',
      providerId: 'PV00002',
      currency: 'USD',
      time: '2026-09-17T03:00:00Z',
      game: 'Evolution 演示遊戲',
      bet: 50000,
      valid: 40000,
      payout: 30000
    }
  ]
  return { costs, bets }
}
