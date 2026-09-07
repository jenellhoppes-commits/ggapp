import type { MerchantLine } from '../types/game-provider'

export interface IntegrationResult {
  operation: string
  label: string
  status: '模擬通過' | '模擬失敗' | '未執行'
  callback: string
  errorCode: string
  at: string
  traceId: string
  durationMs: number
}
export function sandboxError(line: MerchantLine, now = Date.now()) {
  const environment = line.environments.find((item) => item.environment === 'Sandbox')
  const credential = environment?.credential
  if (['Suspended', 'Closed'].includes(line.status)) return '線路已暫停或關閉'
  if (!environment || environment.status === 'Disabled') return '尚未建立可用的測試環境'
  if (
    !credential ||
    credential.environment !== 'Sandbox' ||
    !['Active', 'Testing'].includes(credential.status)
  )
    return '請先在此線路的測試環境核發有效測試憑證'
  if (
    credential.expiresAt &&
    (!Number.isFinite(Date.parse(credential.expiresAt)) || Date.parse(credential.expiresAt) <= now)
  )
    return '測試憑證已到期或到期時間無效'
  return ''
}
export function integrationCases(walletMode: MerchantLine['walletMode']) {
  const base = [
    ['Launch', '啟動遊戲'],
    ['Balance', '查詢餘額'],
    ['Bet', '下注'],
    ['Win', '派彩'],
    ['Refund', '退款'],
    ['Rollback', '回滾']
  ]
  return walletMode === 'Transfer'
    ? [...base, ['TransferIn', '轉入'], ['TransferOut', '轉出']]
    : base
}
export function runIntegrationDemo(line: MerchantLine, scenario: 'success' | 'callback-failure') {
  const error = sandboxError(line)
  if (error) throw new Error(error)
  // Never call an endpoint or mutate line, member or production wallet state.
  const environment = line.environments.find((item) => item.environment === 'Sandbox')!
  const runId = crypto.randomUUID()
  const at = new Date().toISOString()
  let balance = 1000
  const rows: IntegrationResult[] = integrationCases(line.walletMode).map(
    ([operation, label], index) => {
      const failed = scenario === 'callback-failure' && operation === 'Bet'
      const skipped =
        scenario === 'callback-failure' && ['Win', 'Refund', 'Rollback'].includes(operation)
      if (!failed && !skipped)
        balance +=
          (
            {
              Bet: -10,
              Win: 15,
              Refund: 10,
              Rollback: -15,
              TransferIn: 20,
              TransferOut: -20
            } as Record<string, number>
          )[operation] || 0
      return {
        operation,
        label,
        status: failed ? '模擬失敗' : skipped ? '未執行' : '模擬通過',
        callback: failed
          ? '模擬回呼逾時'
          : skipped
            ? '依賴下注成功，已略過'
            : operation === 'Launch'
              ? '模擬啟動回應'
              : '模擬回呼成功',
        errorCode: failed ? 'MOCK_CALLBACK_TIMEOUT' : skipped ? 'DEPENDENCY_FAILED' : 'OK',
        at,
        traceId: `${runId}-${index + 1}`,
        durationMs: failed ? 3000 : skipped ? 0 : 15 + index * 7
      }
    }
  )
  return {
    runId,
    lineUid: line.uid,
    credentialId: environment.credential!.id,
    environment: 'Sandbox' as const,
    testMember: `TEST-${runId}`,
    walletId: `TEST-WALLET-${runId}`,
    balanceBefore: 1000,
    balanceAfter: balance,
    currency: line.currency,
    rows,
    accounting: 'excluded' as const,
    mock: true as const
  }
}
