import {
  betKey,
  type ReportBet,
  type ReportEvent,
  type ReportSource
} from '@/domain/report-four-tabs'
export const reportSampleDate = '2026-09-04'
const bet = (
  id: string,
  merchantId: string,
  memberId: string,
  gameId: string,
  amount: string
): ReportBet => ({
  source: 'R4T-isolated',
  id,
  environment: 'report-demo',
  merchantId,
  merchantCode: merchantId,
  merchantName: `演示商戶 ${merchantId}`,
  memberId,
  providerId: 'DEMO-PV1',
  providerName: '隔離演示供應商',
  gameId,
  gameCode: gameId,
  gameName: `演示遊戲 ${gameId}`,
  agent: {
    id: merchantId === 'M1' ? 'A1' : 'A2',
    code: merchantId === 'M1' ? 'A1' : 'A2',
    name: merchantId === 'M1' ? '歷史直接代理一' : '歷史直接代理二'
  },
  accepted: true,
  time: '2026-09-04T02:00:00Z',
  currency: 'TWD',
  amount,
  roundId: 'ROUND-' + id,
  payoutComplete: true
})
const bets = [
  bet('B1', 'M1', 'U1', 'G1', '100'),
  bet('B2', 'M1', 'U1', 'G2', '50'),
  bet('B3', 'M2', 'U1', 'G1', '200'),
  bet('B4', 'M1', 'U2', 'G1', '80')
]
const event = (
  id: string,
  b: ReportBet,
  amount: string,
  type: ReportEvent['type'] = 'payout'
): ReportEvent => ({
  source: b.source,
  id,
  environment: b.environment,
  merchantId: b.merchantId,
  providerId: b.providerId,
  type,
  success: true,
  time: '2026-09-04T03:00:00Z',
  currency: b.currency,
  amount,
  betKeys: [betKey(b)],
  relationComplete: true,
  roundId: b.roundId
})
const p1 = event('P1', bets[0], '150')
/** Independent immutable fixture, never migrated into merchant balances or production records. */
export const reportDemoSource: ReportSource = {
  version: 'R4T-demo-v1',
  cutoff: '2026-09-05T00:00:00Z',
  complete: true,
  bets: [
    ...bets,
    { ...bets[0] },
    { ...bet('FAIL', 'M1', 'U8', 'G1', '900'), accepted: false },
    { ...bet('SANDBOX', 'M1', 'U9', 'G1', '999'), environment: 'sandbox' }
  ],
  events: [
    p1,
    { ...p1 },
    event('P2', bets[2], '100'),
    event('REFUND', bets[3], '80', 'refund'),
    event('TRANSFER', bets[0], '1000', 'transfer')
  ]
}
