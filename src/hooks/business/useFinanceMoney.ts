import { useFinanceCenterStore } from '@/store/modules/financeCenter'
import { useFinanceSettingsStore } from '@/store/modules/financeSettings'
import { formatFinancialAmount, legacyAmountPrecision } from '@/utils/finance/format-money'
import type {
  MerchantSettlementStatement,
  AgentSettlementStatement,
  SettlementBatchRecord,
  SettlementAdjustmentRecord
} from '@/types/game-provider'

export function useFinanceMoney() {
  const finance = useFinanceCenterStore()
  const settings = useFinanceSettingsStore()
  type Statement = MerchantSettlementStatement | AgentSettlementStatement
  const statementPrecision = (row: Statement) =>
    row.amountPrecision ??
    [...finance.merchantReconciliations, ...finance.agentReconciliations].find(
      (record) => record.id === row.reconciliationId
    )?.snapshot.amountPrecision ??
    legacyAmountPrecision(row.grossAmount, row.adjustmentAmount, row.finalAmount)

  const money = (
    value: number,
    currency: string,
    precision = settings.settlementRule.amountPrecision
  ) => formatFinancialAmount(value, currency, precision)
  const statementMoney = (value: number, row: Statement) =>
    money(value, row.settlementCurrency, statementPrecision(row))
  const batchMoney = (value: number, row: SettlementBatchRecord) =>
    money(
      value,
      row.settlementCurrency,
      row.amountPrecision ??
        legacyAmountPrecision(row.totalAmount, row.adjustmentAmount, row.finalAmount)
    )
  const adjustmentMoney = (value: number, row: SettlementAdjustmentRecord) =>
    money(value, row.currency, row.amountPrecision ?? legacyAmountPrecision(row.amount))

  return { money, statementMoney, batchMoney, adjustmentMoney }
}
