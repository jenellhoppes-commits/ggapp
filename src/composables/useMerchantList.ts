import { ref } from 'vue'
import type { Merchant } from '../types/merchant'
import { adminMerchantService } from '../services/admin/merchants'
import { DEFAULT_TABLE_PAGINATION } from '../utils/tableSort'

export function useMerchantList() {
    const loading = ref(false)
    const list = ref<Merchant[]>([])
    const error = ref<string | null>(null)

    // Basic pagination state (mocked)
    const pagination = ref({
        ...DEFAULT_TABLE_PAGINATION,
        page: 1,
        itemCount: 0,
        pageCount: 1
    })

    async function fetchList(params: { agent_id?: string, parent_id?: number, search?: string } = {}) {
        loading.value = true
        error.value = null
        try {
            const data = await adminMerchantService.list(params)
            list.value = data.list
            pagination.value.itemCount = data.total
            // If backend doesn't return pageCount, calculate it
            pagination.value.pageCount = Math.ceil(data.total / (pagination.value.pageSize ?? 10))

        } catch (err: any) {
            console.error('Fetch Merchant List Error:', err)
            error.value = `API Error: ${err.message || err}`
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        list,
        pagination,
        error,
        fetchList
    }
}
