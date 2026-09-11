export const gameTypes = [
  '未分類',
  '電子遊戲',
  '真人娛樂',
  '捕魚遊戲',
  '體育',
  '彩票',
  '棋牌',
  '其他'
]

export function commercialGameType(value?: string): string | undefined {
  if (!value) return undefined
  const aliases: Record<string, string> = {
    GT001: 'SLOT',
    GT002: 'LIVE',
    GT003: 'FISHING',
    GT004: 'OTHER',
    GT005: 'TABLE',
    GT006: 'SPORT',
    GT007: 'LOTTERY',
    GT008: 'OTHER',
    電子遊戲: 'SLOT',
    真人娛樂: 'LIVE',
    捕魚遊戲: 'FISHING',
    體育: 'SPORT',
    彩票: 'LOTTERY',
    棋牌: 'TABLE',
    其他: 'OTHER'
  }
  const code = aliases[value] || value.toUpperCase()
  return ['SLOT', 'LIVE', 'FISHING', 'SPORT', 'LOTTERY', 'TABLE', 'OTHER'].includes(code)
    ? code
    : undefined
}
