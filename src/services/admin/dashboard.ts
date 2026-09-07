import { mockApiResponse } from '../apiClient'
import { createAdminDashboardDemo } from '../demo/adminDashboard'

export type DashboardTone = 'success' | 'warning' | 'error' | 'info' | 'default'
export type DashboardSectionState = 'ok' | 'incomplete' | 'unavailable'

export interface AdminDashboardQuery {
  from: string
  to: string
  currency: string
  merchantId?: string
  providerId?: string
}

export interface DashboardKpi {
  key: 'bet_count' | 'player_count' | 'bet_amount' | 'payout_amount'
  label: string
  value: number | null
  note: string
  route: string
  money?: boolean
  sectionState: DashboardSectionState
}

export interface DashboardPendingItem {
  id: string
  label: string
  count: number | null
  reason: string
  urgency: 'high' | 'medium' | 'normal'
  route: string
}

export interface DashboardPlatformStatus {
  key: string
  label: string
  value: string
  note: string
  tone: DashboardTone
}

export interface DashboardResourceItem {
  key: string
  label: string
  value: number | null
  note: string
  route: string
}

export interface DashboardRecentAction {
  id: string
  operatedAt: string
  target: string
  action: string
  result: string
  operator: string
  route: string
}

export interface DashboardSectionStatus {
  key: 'operation' | 'pending' | 'platform' | 'resources' | 'actions'
  state: DashboardSectionState
  reason?: string
  traceId?: string
}

export interface AdminDashboardData {
  version: string
  cutoffAt: string
  updatedAt: string
  timezone: 'Asia/Taipei'
  environment: 'demo' | 'production'
  currency: string
  operationSummary: DashboardKpi[]
  pendingItems: DashboardPendingItem[]
  platformStatus: DashboardPlatformStatus[]
  resourceSummary: DashboardResourceItem[]
  recentActions: DashboardRecentAction[]
  sectionStatuses: DashboardSectionStatus[]
}

export const adminDashboardService = {
  async getOverview(query: AdminDashboardQuery) {
    return mockApiResponse<AdminDashboardData>(createAdminDashboardDemo(query))
  }
}
