<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NAlert, NButton, NCard, NDivider, NDynamicTags, NSpace, NTag, useMessage } from 'naive-ui'
import CopyableText from '../../../components/Common/CopyableText.vue'
import { portalDeveloperService } from '../../../services/portal/developer'

const route = useRoute()
const message = useMessage()
const isAgentPortal = computed(() => route.path.startsWith('/agent'))

const credentials = ref({
  merchant_code: '',
  secret_key: '',
  whitelist: [] as string[]
})
const loading = ref(false)

const title = computed(() => isAgentPortal.value ? '代理報表 API' : 'API 憑證 / 白名單')
const description = computed(() => isAgentPortal.value
  ? '代理端 API 僅提供自身代理樹內的商戶、帳務與報表資料，不提供遊戲 Launch 或 Wallet Callback。'
  : '商戶端 API 用於遊戲 Launch、錢包 Callback、Transfer Wallet 與 Callback 測試。')
const codeLabel = computed(() => isAgentPortal.value ? '代理代碼' : '商戶代碼')
const currentPortal = computed(() => isAgentPortal.value ? 'agent' as const : 'merchant' as const)

const fetchCreds = async () => {
  loading.value = true
  try {
    credentials.value = await portalDeveloperService.getCredentials(currentPortal.value)
    if (isAgentPortal.value) credentials.value.merchant_code = 'AGT-SEA-001'
  } finally {
    loading.value = false
  }
}

const updateWhitelist = async (newList: string[]) => {
  credentials.value.whitelist = newList
  try {
    await portalDeveloperService.updateWhitelist(currentPortal.value, newList)
    message.success('IP 白名單已更新')
  } catch {
    message.error('IP 白名單更新失敗')
  }
}

const openDocs = () => {
  message.info(isAgentPortal.value ? '演示：開啟代理報表 API 文件。' : '演示：開啟商戶 API 文件。')
}

onMounted(() => fetchCreds())
</script>

<template>
  <div class="max-w-5xl space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-white">{{ title }}</h1>
      <p class="mt-2 text-sm text-gray-500">{{ description }}</p>
    </header>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <n-card title="API 憑證" class="h-fit">
        <div class="space-y-5">
          <div>
            <div class="mb-2 text-sm text-gray-400">{{ codeLabel }}</div>
            <CopyableText :text="credentials.merchant_code || (loading ? 'Loading...' : '-')" />
          </div>

          <div>
            <div class="mb-2 text-sm text-gray-400">
              通訊密鑰
              <n-tag size="small" type="warning" class="ml-2">敏感資料</n-tag>
            </div>
            <CopyableText :text="credentials.secret_key || (loading ? 'Loading...' : '-')" :masked="true" />
          </div>

          <n-alert type="warning" :bordered="false">
            <template #header>安全提醒</template>
            請勿分享 Secret Key；後端串接時需使用 IP 白名單、簽章與冪等鍵保護請求。
          </n-alert>
        </div>
      </n-card>

      <n-card title="IP 白名單" class="h-fit">
        <div class="space-y-4">
          <p class="text-sm text-gray-400">僅接受來自白名單 IP 的請求；最多 10 筆。</p>
          <n-dynamic-tags
            :value="credentials.whitelist"
            :max="10"
            :input-props="{ placeholder: '新增伺服器 IP' }"
            @update:value="updateWhitelist"
          />
          <p class="text-xs text-gray-500">正式環境建議只填入後端固定出口 IP。</p>
        </div>
      </n-card>
    </div>

    <n-divider />

    <n-card :title="isAgentPortal ? '代理可用 API 範圍' : '商戶串接文件'">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded border border-gray-700 bg-gray-800 p-4">
          <h4 class="mb-1 font-medium text-white">{{ isAgentPortal ? '商戶清單' : 'Launch Game' }}</h4>
          <p class="text-sm text-gray-400">{{ isAgentPortal ? '查詢代理樹內商戶資料。' : '建立遊戲入口並鎖定 Provider 幣別線、交易原幣與下注限額方案版本。' }}</p>
        </div>
        <div class="rounded border border-gray-700 bg-gray-800 p-4">
          <h4 class="mb-1 font-medium text-white">{{ isAgentPortal ? '帳務報表' : 'Wallet Callback' }}</h4>
          <p class="text-sm text-gray-400">{{ isAgentPortal ? '查詢代理應付、商戶應收與日結摘要。' : 'Bet / Win / Refund / Cancel 錢包回調。' }}</p>
        </div>
        <div class="rounded border border-gray-700 bg-gray-800 p-4">
          <h4 class="mb-1 font-medium text-white">{{ isAgentPortal ? '注單追蹤' : 'Callback Logs' }}</h4>
          <p class="text-sm text-gray-400">{{ isAgentPortal ? '查詢代理樹範圍內注單。' : '查詢 Callback 發送與重試紀錄。' }}</p>
        </div>
      </div>

      <n-space class="mt-5">
        <n-button type="primary" @click="openDocs">查看完整文件</n-button>
        <n-button secondary>聯絡客服</n-button>
      </n-space>
    </n-card>
  </div>
</template>
