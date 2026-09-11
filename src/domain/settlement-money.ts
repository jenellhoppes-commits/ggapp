export function divideRounded(n: bigint, d: bigint): bigint {
  if (d <= 0n) throw new Error('金額除數無效')
  return n < 0n ? -((-n + d / 2n) / d) : (n + d / 2n) / d
}
export function safeMoney(n: bigint) {
  const value = Number(n)
  if (!Number.isSafeInteger(value)) throw new Error('金額超出安全範圍')
  return value
}
export function finalMinor(micro: number, digits: number) {
  if (!Number.isSafeInteger(micro) || !Number.isInteger(digits) || digits < 0 || digits > 6)
    throw new Error('金額或結算幣別精度無效')
  return safeMoney(divideRounded(BigInt(micro), BigInt(10 ** (6 - digits))))
}
