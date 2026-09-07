export const maintenanceTargets = [
  'AdminPortal',
  'MerchantPortal',
  'AgentPortal',
  'GameLaunch',
  'MerchantApi'
] as const
export type MaintenanceTarget = (typeof maintenanceTargets)[number]
export const maintenanceTargetLabels: Record<MaintenanceTarget, string> = {
  AdminPortal: '管理者後台',
  MerchantPortal: '商戶後台',
  AgentPortal: '代理後台',
  GameLaunch: '新遊戲啟動',
  MerchantApi: '商戶 API（不含 Callback）'
}

export type MaintenanceStatus = 'Scheduled' | 'Active' | 'Completed' | 'Cancelled'
export const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  Scheduled: '已排程',
  Active: '進行中',
  Completed: '已完成',
  Cancelled: '已取消'
}

export interface MaintenanceWindow {
  id: string
  name: string
  startAt: string
  endAt: string
  targets: MaintenanceTarget[]
  message: string
  note: string
  status: MaintenanceStatus
  createdBy: string
  updatedAt: string
}

export const networkRuleTypes = ['Allow', 'Block'] as const
export type NetworkRuleType = (typeof networkRuleTypes)[number]
export const networkRuleTypeLabels: Record<NetworkRuleType, string> = {
  Allow: '白名單',
  Block: '黑名單'
}

export const networkScopes = [
  'AdminLogin',
  'MerchantApi',
  'ProviderCallback',
  'DeveloperApi'
] as const
export type NetworkScope = (typeof networkScopes)[number]
export const networkScopeLabels: Record<NetworkScope, string> = {
  AdminLogin: '後台登入',
  MerchantApi: '商戶 API',
  ProviderCallback: '供應商 Callback',
  DeveloperApi: '開發者 API'
}

export type NetworkValueType = 'IPv4' | 'CIDR' | 'Domain'
export type NetworkEnvironment = 'Production' | 'Sandbox' | 'All'
export type NetworkRuleStatus = 'Enabled' | 'Disabled'

export interface NetworkRule {
  id: string
  listType: NetworkRuleType
  scope: NetworkScope
  valueType: NetworkValueType
  value: string
  environment: NetworkEnvironment
  merchant: string
  expiresAt: string
  note: string
  status: NetworkRuleStatus
  updatedBy: string
  updatedAt: string
}

export interface PlatformOperationLog {
  id: string
  module: 'Maintenance' | 'NetworkList'
  action: string
  target: string
  operator: string
  createdAt: string
  detail: string
}

const ipv4 = (value: string) => {
  const parts = value.split('.')
  return (
    parts.length === 4 &&
    parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255)
  )
}

export function normalizeNetworkValue(value: string, type: NetworkValueType) {
  const normalized = value.trim().toLowerCase()
  return type === 'Domain' ? normalized.replace(/^https?:\/\//, '').replace(/\/$/, '') : normalized
}

export function validateNetworkValue(value: string, type: NetworkValueType) {
  const normalized = normalizeNetworkValue(value, type)
  if (!normalized) return '請輸入規則值'
  if (type === 'IPv4') return ipv4(normalized) ? '' : '請輸入有效的 IPv4 位址'
  if (type === 'CIDR') {
    const [address, prefix, extra] = normalized.split('/')
    return extra === undefined &&
      ipv4(address) &&
      /^\d{1,2}$/.test(prefix || '') &&
      Number(prefix) <= 32
      ? ''
      : '請輸入有效的 IPv4 CIDR，例如 203.0.113.0/24'
  }
  return /^(\*\.)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(normalized)
    ? ''
    : '請輸入有效網域，例如 api.example.com 或 *.example.com'
}

export function maintenanceRangeError(startAt: string, endAt: string) {
  if (!startAt || !endAt) return '請選擇完整的開始與結束時間'
  return new Date(startAt).getTime() < new Date(endAt).getTime() ? '' : '結束時間必須晚於開始時間'
}

export const networkRuleKey = (
  rule: Pick<NetworkRule, 'listType' | 'scope' | 'environment' | 'merchant' | 'value'>
) =>
  [
    rule.listType,
    rule.scope,
    rule.environment,
    rule.merchant,
    rule.value.trim().toLowerCase()
  ].join('|')

export const isRuleExpired = (rule: Pick<NetworkRule, 'expiresAt'>, now = new Date()) =>
  Boolean(rule.expiresAt && new Date(rule.expiresAt).getTime() <= now.getTime())
