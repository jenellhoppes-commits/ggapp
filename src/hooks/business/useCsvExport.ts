import { ElMessage } from 'element-plus'
import { downloadCsv, type CsvCell } from '@/utils/export/csv'

export function useCsvExport() {
  const exportCsv = (name: string, headers: string[], rows: CsvCell[][]) => {
    if (!rows.length) {
      ElMessage.info('目前篩選結果沒有可匯出的資料')
      return
    }
    try {
      downloadCsv(name, headers, rows)
      ElMessage.success(`已啟動 CSV 下載，共 ${rows.length} 筆`)
    } catch {
      ElMessage.error('無法啟動下載，請重試')
    }
  }
  return { exportCsv }
}
