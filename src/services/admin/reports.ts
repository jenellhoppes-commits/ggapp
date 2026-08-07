import { apiClient } from '../apiClient'
import type { FinancialReportGroupBy, FinancialReportItem } from '../../types/report'

export const adminReportService = {
  async getFinancialReport(payload: {
    timeRange?: [number, number]
    startTime?: string
    endTime?: string
    groupBy: FinancialReportGroupBy
  }) {
    const response = await apiClient.post<{ list: FinancialReportItem[] }>('/api/v2/report/financial', payload)
    return response.data
  }
}
