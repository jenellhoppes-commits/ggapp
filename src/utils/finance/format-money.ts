/** Display precision is separate from calculation/rounding rules. */
export function formatFinancialAmount(value: number, currency: string, precision: number): string {
  const digits = Number.isInteger(precision) && precision >= 0 && precision <= 8 ? precision : 2
  return `${currency} ${new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value)}`.trim()
}

/** Old records without a precision snapshot must not follow today's settings. */
export function legacyAmountPrecision(...values: number[]): number {
  return Math.max(
    2,
    ...values.map((value) => {
      const [coefficient, exponent = '0'] = String(value).toLowerCase().split('e')
      return Math.min(8, Math.max(0, (coefficient.split('.')[1]?.length ?? 0) - Number(exponent)))
    })
  )
}
