import type {
  ProviderReconciliationRecord,
  AgentReconciliationRecord,
  MerchantReconciliationRecord
} from '@/types/game-provider'
import type { ReconciliationDelivery } from './reconciliation-delivery'

export type ReportBill =
  | ProviderReconciliationRecord
  | AgentReconciliationRecord
  | MerchantReconciliationRecord
export function settlementReportRow(record: ReportBill, deliveries: ReconciliationDelivery[]) {
  const kind = 'providerId' in record ? 'provider' : 'merchantId' in record ? 'merchant' : 'agent'
  const delivery = deliveries.find((d) => d.id === record.id && d.kind === kind)
  const system = delivery?.system ?? record.finalSettlementAmount
  const opening = delivery?.opening ?? 0
  const difference = delivery?.difference ?? 0
  const calculated = Number((system + opening + difference).toFixed(6))
  // A pending bill has no posted delivery: never infer payment from its lock state.
  const due = delivery?.due ?? null
  return {
    id: record.id,
    provider:
      record.snapshot.reportDimensions?.providerId ??
      ('providerId' in record ? record.providerId : '—'),
    gameType: record.snapshot.reportDimensions?.gameType ?? '—',
    conditionVersion: record.snapshot.reportDimensions?.conditionVersion ?? '—',
    kind,
    period: record.period,
    name:
      'providerName' in record
        ? record.providerName
        : 'merchantName' in record
          ? record.merchantName
          : record.agentName,
    currency: record.snapshot.settlementCurrency,
    transactionCurrency: record.currency,
    ggr: record.ggr,
    basis: record.snapshot.settlementBasis,
    rate: record.snapshot.ratePercent,
    base: record.initialSettlementAmount,
    system,
    opening,
    difference,
    calculated,
    due,
    discarded: due === null ? null : Number((calculated - due).toFixed(6)),
    paid: delivery?.paid ?? null,
    remaining: delivery?.carry ?? null,
    // Once a carry is consumed, it is no longer outstanding on the source bill.
    outstanding: delivery
      ? deliveries.some((d) => d.sources.includes(record.id))
        ? 0
        : delivery.carry
      : null,
    recipient: delivery?.recipient ?? '',
    operator: delivery?.operator ?? '',
    deliveredAt: delivery?.time ?? '',
    mode: delivery?.collectionMode ?? '',
    status:
      record.status === 'Locked' ? '已鎖定' : record.status === 'Cancelled' ? '已取消' : '待確認',
    paymentStatus: delivery
      ? delivery.carry > 0
        ? '已結轉下期'
        : delivery.paid > 0
          ? '已收付'
          : '無需收付'
      : '未登錄',
    exchangeRate: record.snapshot.exchangeRate,
    formula: record.snapshot.formulaVersion,
    calculatedAt: record.snapshot.calculatedAt,
    href: `/finance/reconciliation/${kind === 'provider' ? 'providers' : kind === 'agent' ? 'agents' : 'merchants'}/${record.id}`
  }
}

export function comparableMargin(
  agent: AgentReconciliationRecord,
  merchants: MerchantReconciliationRecord[]
) {
  const included = agent.includedMerchantReconciliationIds.map((id) =>
    merchants.find((m) => m.id === id)
  )
  if (
    !included.length ||
    new Set(agent.includedMerchantReconciliationIds).size !== included.length ||
    included.some(
      (m) =>
        !m ||
        m.status === 'Cancelled' ||
        m.period !== agent.period ||
        m.agentId !== agent.agentId ||
        m.snapshot.settlementCurrency !== agent.snapshot.settlementCurrency ||
        (agent.snapshot.reportDimensions &&
          (!m.snapshot.reportDimensions ||
            m.snapshot.reportDimensions.providerId !== agent.snapshot.reportDimensions.providerId ||
            m.snapshot.reportDimensions.gameType !== agent.snapshot.reportDimensions.gameType ||
            m.snapshot.reportDimensions.conditionVersion !==
              agent.snapshot.reportDimensions.conditionVersion)) ||
        m.snapshot.settlementBasis !== 'GGR'
    ) ||
    agent.snapshot.settlementBasis !== 'GGR'
  )
    return null
  const downstream = Number(
    included.reduce((sum, m) => sum + m!.initialSettlementAmount, 0).toFixed(6)
  )
  return {
    downstream,
    upstream: agent.initialSettlementAmount,
    difference: Number((downstream - agent.initialSettlementAmount).toFixed(6))
  }
}
