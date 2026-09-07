/** R03-REPORTS-4TABS: one isolated source and exact original-event aggregation. */
export const reportTabs = ['operations', 'agents', 'merchants', 'games'] as const
export type ReportTab = (typeof reportTabs)[number]
export const reportTabLabels = {
  operations: '營運報表',
  agents: '代理報表',
  merchants: '商戶報表',
  games: '遊戲報表'
}
export type ReportBet = {
  source: string
  id: string
  environment: string
  merchantId: string
  merchantCode: string
  merchantName: string
  memberId: string
  providerId: string
  providerName: string
  gameId: string
  gameCode: string
  gameName: string
  agent: { id: string; code: string; name: string } | null | 'unknown'
  accepted: boolean | null
  time: string
  currency: string
  amount: string
  roundId: string
  payoutComplete: boolean
}
export type ReportEvent = {
  source: string
  id: string
  environment: string
  merchantId: string
  providerId: string
  type: 'payout' | 'refund' | 'transfer' | 'rollback'
  success: boolean
  time: string
  currency: string
  amount: string
  betKeys: string[]
  relationComplete: boolean
  roundId?: string
}
export type ReportSource = {
  version: string
  cutoff: string
  bets: ReportBet[]
  events: ReportEvent[]
  complete: boolean
}
export type ReportScope = {
  canView: boolean
  canExport: boolean
  canViewBets: boolean
  environment: string
  merchantIds: string[]
  timezone: string
  currencies: Record<string, number>
}
export type FourQuery = {
  tab: ReportTab
  from: string
  to: string
  currency: string
  agent: string
  merchant: string
  provider: string
  game: string
  sort: string
  order: 'asc' | 'desc'
  page: number
  size: number
}
export type ReportStats = {
  betCount: number | null
  players: number | null
  betAmount: string | null
  payoutAmount: string | null
}
export type FourRow = ReportStats & {
  key: string
  label: string
  code: string
  provider: string
  betKeys: string[]
}
export type FourResult = {
  query: FourQuery
  rows: FourRow[]
  totals: ReportStats
  version: string
  cutoff: string
  timezone: string
  environment: string
  bets: ReportBet[]
  // Provenance for export authorization, including scoped records with unknown acceptance.
  merchantIds: string[]
  issues: string[]
}
export const betKey = (b: ReportBet) =>
  JSON.stringify([b.source, b.environment, b.merchantId, b.id])
const scalar = (v: unknown) => (typeof v === 'string' ? v : '')
export function platformDate(instant: string | Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(instant))
  const value = (type: string) => parts.find((p) => p.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
    new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value
  )
}
export function parseFourQuery(
  raw: Record<string, unknown>,
  today: string,
  lastCurrency = ''
): FourQuery {
  const tab = reportTabs.includes(scalar(raw.tab) as ReportTab)
    ? (scalar(raw.tab) as ReportTab)
    : 'operations'
  const allowed = [
    'betCount',
    'players',
    'betAmount',
    'payoutAmount',
    ...(tab === 'operations' ? ['date'] : [])
  ]
  const defaultSort = tab === 'operations' ? 'date' : 'betAmount'
  const page = Number(raw.page),
    size = Number(raw.size)
  return {
    tab,
    from:
      raw.from === undefined
        ? raw.startDate === undefined
          ? today
          : scalar(raw.startDate)
        : scalar(raw.from),
    to:
      raw.to === undefined
        ? raw.endDate === undefined
          ? today
          : scalar(raw.endDate)
        : scalar(raw.to),
    currency: raw.currency === undefined ? lastCurrency : scalar(raw.currency),
    agent: scalar(raw.agent || raw.agentId),
    merchant: scalar(raw.merchant || raw.merchantId),
    provider: scalar(raw.provider || raw.providerId),
    game: scalar(raw.game || raw.gameId),
    sort: allowed.includes(scalar(raw.sort)) ? scalar(raw.sort) : defaultSort,
    order: raw.order === 'asc' ? 'asc' : 'desc',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    size: [10, 20, 50].includes(size) ? size : 20
  }
}
export function validateFourQuery(q: FourQuery, scope: ReportScope) {
  const errors: Record<string, string> = {}
  if (!validDate(q.from) || !validDate(q.to)) errors.date = '請填寫有效的起訖日期'
  else if (q.from > q.to) errors.date = '開始日期不可晚於結束日期'
  if (!Object.keys(scope.currencies).length) errors.currency = '尚未設定合法原幣別'
  else if (!(q.currency in scope.currencies)) errors.currency = '請選擇合法的單一原幣別'
  try {
    platformDate(new Date(), scope.timezone)
  } catch {
    errors.date = '平台時區尚未設定或無效'
  }
  return errors
}
export function fourQueryUrl(q: FourQuery) {
  return Object.fromEntries(Object.entries(q).map(([k, v]) => [k, String(v)]))
}
export function switchFourTab(q: FourQuery, tab: ReportTab): FourQuery {
  return {
    ...q,
    tab,
    agent: '',
    merchant: '',
    provider: '',
    game: '',
    sort: tab === 'operations' ? 'date' : 'betAmount',
    order: 'desc',
    page: 1
  }
}
export function minorAmount(value: string, precision: number): bigint {
  if (
    !/^-?\d+(\.\d+)?$/.test(value) ||
    !Number.isInteger(precision) ||
    precision < 0 ||
    precision > 18
  )
    throw new Error('來源金額或幣別精度無效')
  const negative = value.startsWith('-'),
    [whole, fraction = ''] = (negative ? value.slice(1) : value).split('.')
  if (fraction.length > precision && /[1-9]/.test(fraction.slice(precision)))
    throw new Error('來源金額超出幣別精度，不能自行捨入')
  return (
    (negative ? -1n : 1n) *
    (BigInt(whole) * 10n ** BigInt(precision) +
      BigInt(fraction.slice(0, precision).padEnd(precision, '0') || '0'))
  )
}
export function decimalAmount(value: bigint, precision: number): string {
  const sign = value < 0n ? '-' : '',
    abs = (value < 0n ? -value : value).toString().padStart(precision + 1, '0')
  return sign + (precision ? abs.slice(0, -precision) + '.' + abs.slice(-precision) : abs)
}
export function groupKey(b: ReportBet, tab: ReportTab, timezone: string) {
  if (tab === 'operations') return platformDate(b.time, timezone)
  if (tab === 'merchants') return b.merchantId
  if (tab === 'games') return JSON.stringify([b.providerId, b.gameId])
  return b.agent === 'unknown' ? 'unknown' : b.agent === null ? 'unassigned' : b.agent.id
}
export function queryFourReports(
  source: ReportSource,
  q: FourQuery,
  scope: ReportScope
): FourResult {
  if (!scope.canView) throw new Error('無報表查看權限')
  const errors = validateFourQuery(q, scope)
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join('；'))
  if (!Number.isFinite(Date.parse(source.cutoff))) throw new Error('缺少有效的資料截止時間')
  const precision = scope.currencies[q.currency]
  const authorized = (b: { environment: string; merchantId: string }) =>
    b.environment === scope.environment && scope.merchantIds.includes(b.merchantId)
  const unique = new Map<string, ReportBet>()
  // Incomplete acceptance is scoped by the same filters as accepted bets.
  // Track affected group keys without treating unknown records as accepted bets.
  const matchesQuery = (b: ReportBet) => {
    const day = platformDate(b.time, scope.timezone)
    return (
      day >= q.from &&
      day <= q.to &&
      (!q.agent || groupKey(b, 'agents', scope.timezone) === q.agent) &&
      (!q.merchant || b.merchantId === q.merchant) &&
      (!q.provider || b.providerId === q.provider) &&
      (!q.game ||
        `${b.gameId} ${b.gameCode} ${b.gameName}`.toLowerCase().includes(q.game.toLowerCase()))
    )
  }
  const missingAcceptance = new Set<string>()
  const resultMerchants = new Set<string>(
    source.complete ? [] : scope.merchantIds.filter((id) => !q.merchant || id === q.merchant)
  )
  for (const b of source.bets) {
    if (
      !authorized(b) ||
      b.currency !== q.currency ||
      Date.parse(b.time) > Date.parse(source.cutoff)
    )
      continue
    if (!Number.isFinite(Date.parse(b.time))) throw new Error('原始下注時間無效')
    if (b.accepted === null && matchesQuery(b)) {
      missingAcceptance.add(groupKey(b, q.tab, scope.timezone))
      resultMerchants.add(b.merchantId)
    }
    if (b.accepted !== true) continue
    const key = betKey(b),
      previous = unique.get(key)
    if (
      previous &&
      [
        previous.amount,
        previous.time,
        previous.memberId,
        previous.gameId,
        previous.providerId,
        JSON.stringify(previous.agent)
      ].join('|') !==
        [b.amount, b.time, b.memberId, b.gameId, b.providerId, JSON.stringify(b.agent)].join('|')
    )
      throw new Error('重複下注來源互相衝突，需核對原始資料')
    unique.set(key, b)
  }
  const all = [...unique.values()]
  const bets = all.filter(matchesQuery)
  const selectedKeys = new Set(bets.map(betKey)),
    groups = new Map<string, ReportBet[]>()
  for (const b of bets) {
    resultMerchants.add(b.merchantId)
    const key = groupKey(b, q.tab, scope.timezone)
    groups.set(key, [...(groups.get(key) || []), b])
  }
  const payouts = new Map<string, bigint>(),
    unknown = new Set<string>(),
    seenEvents = new Map<string, ReportEvent>()
  for (const b of bets) if (!b.payoutComplete) unknown.add(groupKey(b, q.tab, scope.timezone))
  for (const e of source.events) {
    if (
      !authorized(e) ||
      e.currency !== q.currency ||
      !e.success ||
      e.type !== 'payout' ||
      Date.parse(e.time) > Date.parse(source.cutoff)
    )
      continue
    if (!Number.isFinite(Date.parse(e.time))) throw new Error('派彩時間無效')
    const key = JSON.stringify([e.source, e.environment, e.merchantId, e.id]),
      previous = seenEvents.get(key)
    if (previous) {
      if (JSON.stringify(previous) !== JSON.stringify(e)) throw new Error('重複派彩來源互相衝突')
      continue
    }
    seenEvents.set(key, e)
    const linked = e.betKeys.map((key) => unique.get(key)).filter((b): b is ReportBet => !!b)
    const candidates = e.relationComplete
      ? linked
      : all.filter(
          (b) =>
            b.merchantId === e.merchantId &&
            b.providerId === e.providerId &&
            (!e.roundId || b.roundId === e.roundId)
        )
    const touched = candidates.filter((b) => selectedKeys.has(betKey(b)))
    if (!touched.length) continue
    const groupIds = new Set(linked.map((b) => groupKey(b, q.tab, scope.timezone)))
    const dimensions = new Set(
      linked.map((b) =>
        JSON.stringify([
          platformDate(b.time, scope.timezone),
          groupKey(b, 'agents', scope.timezone),
          b.merchantId,
          b.providerId,
          b.gameId
        ])
      )
    )
    const complete =
      e.relationComplete &&
      linked.length === e.betKeys.length &&
      linked.length > 0 &&
      linked.every((b) => selectedKeys.has(betKey(b))) &&
      linked.every(
        (b) =>
          b.source === e.source &&
          b.providerId === e.providerId &&
          b.merchantId === e.merchantId &&
          b.environment === e.environment
      ) &&
      groupIds.size === 1 &&
      dimensions.size === 1
    if (!complete) {
      touched.forEach((b) => unknown.add(groupKey(b, q.tab, scope.timezone)))
      continue
    }
    const group = groupKey(linked[0], q.tab, scope.timezone)
    payouts.set(group, (payouts.get(group) || 0n) + minorAmount(e.amount, precision))
  }
  const baseStats = (items: ReportBet[]): ReportStats => ({
    betCount: items.length,
    players: new Set(items.map((b) => JSON.stringify([b.environment, b.merchantId, b.memberId])))
      .size,
    betAmount: decimalAmount(
      items.reduce((n, b) => n + minorAmount(b.amount, precision), 0n),
      precision
    ),
    payoutAmount: null
  })
  const rows: FourRow[] = [...groups].map(([key, items]) => {
    const b = items[0],
      stats = baseStats(items)
    const label =
      q.tab === 'operations'
        ? key
        : q.tab === 'merchants'
          ? b.merchantName
          : q.tab === 'games'
            ? b.gameName
            : b.agent === 'unknown'
              ? '歸屬待確認'
              : b.agent === null
                ? '未歸屬'
                : b.agent.name
    const code =
      q.tab === 'merchants'
        ? b.merchantCode
        : q.tab === 'games'
          ? b.gameCode
          : q.tab === 'agents' && typeof b.agent === 'object' && b.agent
            ? b.agent.code
            : ''
    return {
      ...stats,
      key,
      label,
      code,
      provider: q.tab === 'games' ? b.providerName : '',
      betKeys: items.map(betKey),
      payoutAmount: unknown.has(key) ? null : decimalAmount(payouts.get(key) || 0n, precision)
    }
  })
  const totals = baseStats(bets)
  totals.payoutAmount = unknown.size
    ? null
    : decimalAmount(
        [...payouts.values()].reduce((a, b) => a + b, 0n),
        precision
      )
  const issues: string[] = []
  if (unknown.size) issues.push('部分派彩缺來源或跨分組／查詢邊界，受影響派彩資料待確認')
  if (!source.complete || missingAcceptance.size) {
    issues.push('缺少完整原始下注或曾成功受理依據')
    const unconfirmed: ReportStats = {
      betCount: null,
      players: null,
      betAmount: null,
      payoutAmount: null
    }
    Object.assign(totals, unconfirmed)
    rows.forEach((r) => {
      if (!source.complete || missingAcceptance.has(r.key)) Object.assign(r, unconfirmed)
    })
  }
  rows.sort((a, b) => {
    const field = q.sort === 'date' ? 'key' : (q.sort as keyof ReportStats),
      av = a[field],
      bv = b[field]
    if (av === null || bv === null)
      return av === bv ? a.key.localeCompare(b.key) : av === null ? 1 : -1
    let comparison = 0
    if (field === 'key') comparison = String(av).localeCompare(String(bv))
    else if (field === 'betAmount' || field === 'payoutAmount') {
      const aa = minorAmount(String(av), precision),
        bb = minorAmount(String(bv), precision)
      comparison = aa < bb ? -1 : aa > bb ? 1 : 0
    } else comparison = Number(av) - Number(bv)
    return comparison ? (q.order === 'asc' ? comparison : -comparison) : a.key.localeCompare(b.key)
  })
  return {
    query: { ...q },
    rows,
    totals,
    version: source.version,
    cutoff: source.cutoff,
    timezone: scope.timezone,
    environment: scope.environment,
    bets,
    merchantIds: [...resultMerchants],
    issues
  }
}
export function reportCsvText(value: unknown, numeric = false) {
  let text = String(value === null ? '資料待確認' : value)
  if ((!numeric && /^[\s]*[=+@-]/.test(text)) || (!numeric && /^[\t\r\n]/.test(text)))
    text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}
export const fourCsvCompletenessMarker = '# 報表完整性說明（非交易資料）'
export function fourCsv(result: FourResult, scope: ReportScope) {
  if (
    !scope.canView ||
    !scope.canExport ||
    result.environment !== scope.environment ||
    !Array.isArray(result.merchantIds) ||
    result.merchantIds.some((id) => !scope.merchantIds.includes(id)) ||
    result.bets.some((b) => !scope.merchantIds.includes(b.merchantId)) ||
    !(result.query.currency in scope.currencies)
  )
    throw new Error('無此查詢結果的匯出權限')
  const header = [
    '維度代碼',
    '維度名稱',
    '供應商',
    '下注筆數',
    '投注人數',
    '投注金額',
    '派彩金額',
    '原幣別',
    '起日',
    '迄日',
    '平台時區',
    '資料更新時間',
    '來源版本'
  ]
  const lines = result.rows.map((r) =>
    [
      r.code,
      r.label,
      r.provider,
      r.betCount,
      r.players,
      r.betAmount,
      r.payoutAmount,
      result.query.currency,
      result.query.from,
      result.query.to,
      result.timezone,
      result.cutoff,
      result.version
    ]
      .map((v, i) => reportCsvText(v, i >= 3 && i <= 6 && v !== null))
      .join(',')
  )
  if (result.issues.length || Object.values(result.totals).some((value) => value === null)) {
    // Fixed-width metadata record: never a transaction or an additive amount row.
    // Entity filters and raw input are deliberately not copied into this explanation.
    lines.push(
      [
        fourCsvCompletenessMarker,
        ['資料待確認', ...result.issues].join('；'),
        '',
        '',
        '',
        '',
        '',
        result.query.currency,
        result.query.from,
        result.query.to,
        result.timezone,
        result.cutoff,
        result.version
      ]
        .map((value) => reportCsvText(value))
        .join(',')
    )
  }
  return '\uFEFF' + [header.map((v) => reportCsvText(v)).join(','), ...lines].join('\r\n')
}
export function reportDrilldown(result: FourResult, row: FourRow, scope: ReportScope) {
  if (
    !scope.canView ||
    !scope.canViewBets ||
    result.environment !== scope.environment ||
    result.bets.some((b) => !scope.merchantIds.includes(b.merchantId))
  )
    throw new Error('無原始注單查看權限')
  if (!result.rows.includes(row)) throw new Error('明細分組不屬於目前查詢結果')
  return {
    path: '/transactions/bets',
    query: {
      ...fourQueryUrl(result.query),
      reportSource: result.version,
      reportGroup: row.key,
      page: '1',
      environment: result.environment,
      timezone: result.timezone
    }
  }
}
export function latestRequestGate() {
  let id = 0
  return { next: () => ++id, isCurrent: (value: number) => value === id }
}
