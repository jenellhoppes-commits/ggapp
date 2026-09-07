import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  MaintenanceWindow,
  NetworkRule,
  PlatformOperationLog
} from '@/domain/platform-operations'
import { networkRuleKey, normalizeNetworkValue } from '@/domain/platform-operations'

const nowText = () => new Date().toLocaleString('sv-SE').replace('T', ' ').slice(0, 19)
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36).toUpperCase()}`

export const usePlatformOperationsStore = defineStore('platformOperationsStore', () => {
  const maintenanceWindows = ref<MaintenanceWindow[]>([
    {
      id: 'MW-202609-003',
      name: '商戶 API 例行升級',
      startAt: '2026-09-12 02:00:00',
      endAt: '2026-09-12 03:30:00',
      targets: ['MerchantApi'],
      message: '商戶 API 例行升級中，請稍後再試。',
      note: 'Callback、派彩、退款與查單持續受理。',
      status: 'Scheduled',
      createdBy: 'Platform Owner',
      updatedAt: '2026-09-04 16:20:00'
    },
    {
      id: 'MW-202609-002',
      name: '遊戲啟動服務更新',
      startAt: '2026-09-03 04:00:00',
      endAt: '2026-09-03 04:45:00',
      targets: ['GameLaunch'],
      message: '遊戲啟動服務更新中。',
      note: '既有 Session 與交易回呼不中斷。',
      status: 'Completed',
      createdBy: 'Operations One',
      updatedAt: '2026-09-03 04:48:00'
    },
    {
      id: 'MW-202609-001',
      name: '三入口維護演練',
      startAt: '2026-09-08 01:00:00',
      endAt: '2026-09-08 02:00:00',
      targets: ['AdminPortal', 'MerchantPortal', 'AgentPortal'],
      message: '平台維護演練中。',
      note: '演練排程已取消，保留歷史。',
      status: 'Cancelled',
      createdBy: 'Super Admin',
      updatedAt: '2026-09-04 10:00:00'
    }
  ])

  const networkRules = ref<NetworkRule[]>([
    {
      id: 'NET-0008',
      listType: 'Block',
      scope: 'AdminLogin',
      valueType: 'CIDR',
      value: '198.51.100.0/24',
      environment: 'All',
      merchant: '',
      expiresAt: '',
      note: '異常登入來源',
      status: 'Enabled',
      updatedBy: 'Super Admin',
      updatedAt: '2026-09-04 18:10:00'
    },
    {
      id: 'NET-0007',
      listType: 'Block',
      scope: 'MerchantApi',
      valueType: 'IPv4',
      value: '203.0.113.66',
      environment: 'Production',
      merchant: 'M00003｜North Star',
      expiresAt: '2026-09-30 23:59:59',
      note: '商戶通報的外洩來源',
      status: 'Enabled',
      updatedBy: 'Security Admin',
      updatedAt: '2026-09-04 14:30:00'
    },
    {
      id: 'NET-0006',
      listType: 'Allow',
      scope: 'ProviderCallback',
      valueType: 'CIDR',
      value: '203.0.113.0/28',
      environment: 'Production',
      merchant: '',
      expiresAt: '',
      note: 'Pragmatic Callback 正式來源',
      status: 'Enabled',
      updatedBy: 'Integration Admin',
      updatedAt: '2026-09-04 12:15:00'
    },
    {
      id: 'NET-0005',
      listType: 'Allow',
      scope: 'MerchantApi',
      valueType: 'IPv4',
      value: '192.0.2.41',
      environment: 'Sandbox',
      merchant: 'M00001｜Demo Merchant',
      expiresAt: '2026-10-01 00:00:00',
      note: '商戶測試串接',
      status: 'Enabled',
      updatedBy: 'Integration Admin',
      updatedAt: '2026-09-03 16:40:00'
    },
    {
      id: 'NET-0004',
      listType: 'Allow',
      scope: 'DeveloperApi',
      valueType: 'Domain',
      value: '*.aerixc.dev',
      environment: 'Sandbox',
      merchant: '',
      expiresAt: '',
      note: '內部開發工具',
      status: 'Enabled',
      updatedBy: 'Platform Owner',
      updatedAt: '2026-09-03 11:20:00'
    },
    {
      id: 'NET-0003',
      listType: 'Allow',
      scope: 'AdminLogin',
      valueType: 'CIDR',
      value: '10.20.0.0/16',
      environment: 'All',
      merchant: '',
      expiresAt: '',
      note: '公司 VPN',
      status: 'Enabled',
      updatedBy: 'Super Admin',
      updatedAt: '2026-09-02 09:10:00'
    },
    {
      id: 'NET-0002',
      listType: 'Block',
      scope: 'DeveloperApi',
      valueType: 'IPv4',
      value: '192.0.2.88',
      environment: 'Sandbox',
      merchant: '',
      expiresAt: '2026-09-04 00:00:00',
      note: '已到期的臨時封鎖',
      status: 'Disabled',
      updatedBy: 'Security Admin',
      updatedAt: '2026-09-04 00:05:00'
    },
    {
      id: 'NET-0001',
      listType: 'Allow',
      scope: 'AdminLogin',
      valueType: 'IPv4',
      value: '203.0.113.10',
      environment: 'All',
      merchant: '',
      expiresAt: '',
      note: '營運固定出口',
      status: 'Enabled',
      updatedBy: 'Super Admin',
      updatedAt: '2026-09-01 10:00:00'
    }
  ])

  const logs = ref<PlatformOperationLog[]>([
    {
      id: 'POL-005',
      module: 'NetworkList',
      action: '啟用黑名單',
      target: 'NET-0008',
      operator: 'Super Admin',
      createdAt: '2026-09-04 18:10:00',
      detail: '後台登入｜198.51.100.0/24'
    },
    {
      id: 'POL-004',
      module: 'Maintenance',
      action: '新增維護排程',
      target: 'MW-202609-003',
      operator: 'Platform Owner',
      createdAt: '2026-09-04 16:20:00',
      detail: '商戶 API 例行升級'
    },
    {
      id: 'POL-003',
      module: 'NetworkList',
      action: '更新白名單',
      target: 'NET-0006',
      operator: 'Integration Admin',
      createdAt: '2026-09-04 12:15:00',
      detail: '供應商 Callback｜203.0.113.0/28'
    },
    {
      id: 'POL-002',
      module: 'Maintenance',
      action: '取消維護排程',
      target: 'MW-202609-001',
      operator: 'Super Admin',
      createdAt: '2026-09-04 10:00:00',
      detail: '三入口維護演練'
    },
    {
      id: 'POL-001',
      module: 'Maintenance',
      action: '完成維護排程',
      target: 'MW-202609-002',
      operator: 'Operations One',
      createdAt: '2026-09-03 04:48:00',
      detail: '遊戲啟動服務更新'
    }
  ])

  const addLog = (
    module: PlatformOperationLog['module'],
    action: string,
    target: string,
    detail: string
  ) =>
    logs.value.unshift({
      id: nextId('POL'),
      module,
      action,
      target,
      detail,
      operator: 'Super Admin',
      createdAt: nowText()
    })

  const saveMaintenance = (
    input: Omit<MaintenanceWindow, 'id' | 'createdBy' | 'updatedAt'> & { id?: string }
  ) => {
    const existing = input.id
      ? maintenanceWindows.value.find((item) => item.id === input.id)
      : undefined
    if (existing) Object.assign(existing, input, { updatedAt: nowText() })
    else
      maintenanceWindows.value.unshift({
        ...input,
        id: nextId('MW'),
        createdBy: 'Super Admin',
        updatedAt: nowText()
      })
    const target = existing?.id || maintenanceWindows.value[0].id
    addLog('Maintenance', existing ? '更新維護排程' : '新增維護排程', target, input.name)
  }

  const changeMaintenanceStatus = (id: string, status: MaintenanceWindow['status']) => {
    const item = maintenanceWindows.value.find((row) => row.id === id)
    if (!item) return false
    item.status = status
    item.updatedAt = nowText()
    addLog('Maintenance', status === 'Cancelled' ? '取消維護排程' : '更新維護狀態', id, item.name)
    return true
  }

  const logMaintenanceAction = (action: string, target: string, detail: string) =>
    addLog('Maintenance', action, target, detail)

  const saveNetworkRule = (
    input: Omit<NetworkRule, 'id' | 'updatedBy' | 'updatedAt'> & { id?: string }
  ) => {
    const normalized = normalizeNetworkValue(input.value, input.valueType)
    const existing = input.id ? networkRules.value.find((item) => item.id === input.id) : undefined
    const duplicate = networkRules.value.find(
      (item) =>
        item.id !== input.id &&
        networkRuleKey(item) === networkRuleKey({ ...input, value: normalized })
    )
    if (duplicate) return { ok: false, message: `相同規則已存在：${duplicate.id}` }
    if (existing)
      Object.assign(existing, input, {
        value: normalized,
        updatedBy: 'Super Admin',
        updatedAt: nowText()
      })
    else
      networkRules.value.unshift({
        ...input,
        value: normalized,
        id: nextId('NET'),
        updatedBy: 'Super Admin',
        updatedAt: nowText()
      })
    const target = existing?.id || networkRules.value[0].id
    addLog('NetworkList', existing ? '更新存取規則' : '新增存取規則', target, normalized)
    return { ok: true, message: '' }
  }

  const toggleNetworkRule = (id: string) => {
    const item = networkRules.value.find((row) => row.id === id)
    if (!item) return false
    item.status = item.status === 'Enabled' ? 'Disabled' : 'Enabled'
    item.updatedAt = nowText()
    item.updatedBy = 'Super Admin'
    addLog(
      'NetworkList',
      item.status === 'Enabled' ? '啟用存取規則' : '停用存取規則',
      id,
      item.value
    )
    return true
  }

  return {
    maintenanceWindows,
    networkRules,
    logs,
    saveMaintenance,
    changeMaintenanceStatus,
    logMaintenanceAction,
    saveNetworkRule,
    toggleNetworkRule
  }
})
