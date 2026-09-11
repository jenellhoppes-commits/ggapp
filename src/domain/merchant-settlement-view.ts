/** Merchant record.currency is the transaction line currency, not the settlement currency. */
export function merchantSettlementCurrency(record: {
  snapshot?: { settlementCurrency?: string }
}): string {
  return record.snapshot?.settlementCurrency || ''
}
