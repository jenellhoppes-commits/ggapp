<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NStatistic,
  NSwitch,
  NTag,
  NTimeline,
  NTimelineItem,
  useMessage
} from 'naive-ui'

const message = useMessage()
const ipInput = ref('')
const showSaveConfirm = ref(false)
const settings = ref({
  maintenance_mode: false,
  maintenance_message: '系統維護中，請稍後再試。',
  admin_whitelist: ['127.0.0.1', '203.0.113.10'],
  login_mfa_required: true,
  password_expire_days: 90,
  max_login_failures: 5,
  session_timeout_minutes: 30,
  audit_retention_days: 365,
  api_rate_limit_per_minute: 600,
  fx_fetch_time: '00:00',
  daily_settlement_time: '00:10',
  timezone: 'Asia/Taipei',
  default_language: 'zh-TW'
})

const logs = ref([
  { action: '更新登入安全設定', operator: 'admin', time: '2026-07-07T09:10:00+08:00', trace_id: 'trace-system-security' },
  { action: '新增後台 IP 白名單', operator: 'admin', time: '2026-07-06T18:30:00+08:00', trace_id: 'trace-system-ip' },
  { action: '調整日結排程', operator: 'Finance', time: '2026-07-05T11:20:00+08:00', trace_id: 'trace-system-settlement' }
])

const languageOptions = [
  { label: '繁體中文', value: 'zh-TW' },
  { label: 'English', value: 'en-US' }
]

const timezoneOptions = [
  { label: 'Asia/Taipei', value: 'Asia/Taipei' },
  { label: 'Asia/Shanghai', value: 'Asia/Shanghai' },
  { label: 'UTC', value: 'UTC' }
]

const summary = computed(() => ({
  whitelist: settings.value.admin_whitelist.length,
  mfa: settings.value.login_mfa_required ? '啟用' : '未啟用',
  session: `${settings.value.session_timeout_minutes} 分鐘`,
  retention: `${settings.value.audit_retention_days} 天`
}))

const settingImpacts = computed(() => [
  {
    label: '維護模式',
    value: settings.value.maintenance_mode ? '開啟，非白名單管理員將被阻擋登入' : '關閉，後台維持正常登入'
  },
  {
    label: '登入安全',
    value: `MFA ${settings.value.login_mfa_required ? '強制啟用' : '未強制'}，登入失敗 ${settings.value.max_login_failures} 次鎖定`
  },
  {
    label: '系統排程',
    value: `每日 ${settings.value.fx_fetch_time} 取得公告匯率，${settings.value.daily_settlement_time} 執行前一日帳期日結`
  },
  {
    label: '操作紀錄',
    value: `保留 ${settings.value.audit_retention_days} 天，API Rate Limit 為 ${settings.value.api_rate_limit_per_minute} 次 / 分鐘`
  }
])

const formatDateTime = (value: string) => new Date(value).toLocaleString()

const openSaveConfirm = () => {
  showSaveConfirm.value = true
}

const confirmSaveSettings = () => {
  logs.value.unshift({
    action: '保存系統設定',
    operator: 'admin',
    time: new Date().toISOString(),
    trace_id: `trace-setting-${Date.now()}`
  })
  showSaveConfirm.value = false
  message.success('系統設定已保存，正式版會寫入操作紀錄並通知相關服務重新載入設定')
}

const addIp = () => {
  const ip = ipInput.value.trim()
  if (!ip) return
  if (settings.value.admin_whitelist.includes(ip)) {
    message.warning('此 IP 已存在於白名單')
    return
  }
  settings.value.admin_whitelist.push(ip)
  logs.value.unshift({ action: '新增後台 IP 白名單', operator: 'admin', time: new Date().toISOString(), trace_id: `trace-ip-${Date.now()}` })
  ipInput.value = ''
  message.success('IP 已加入白名單')
}

const removeIp = (ip: string) => {
  settings.value.admin_whitelist = settings.value.admin_whitelist.filter(item => item !== ip)
  logs.value.unshift({ action: '移除後台 IP 白名單', operator: 'admin', time: new Date().toISOString(), trace_id: `trace-ip-remove-${Date.now()}` })
  message.success('IP 已移除')
}

const testNotification = () => {
  message.success('測試告警通知已送出，正式版會發送至 Telegram / Email / Webhook')
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">系統設定</h1>
        <p class="mt-1 text-sm text-gray-500">設定後台安全、登入限制、維護模式、排程時間、操作紀錄保留與系統通知。</p>
      </div>
      <div class="flex gap-2">
        <n-button secondary @click="testNotification">測試通知</n-button>
        <n-button type="primary" @click="openSaveConfirm">保存設定</n-button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="白名單 IP" :value="summary.whitelist" /></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="MFA 強制">{{ summary.mfa }}</n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="Session Timeout">{{ summary.session }}</n-statistic></div>
      <div class="rounded border border-white/10 bg-[#202026] p-4"><n-statistic label="紀錄保留">{{ summary.retention }}</n-statistic></div>
    </div>

    <n-alert type="warning" :show-icon="false">
      維護模式會阻擋非白名單管理員登入；日結與匯率排程時間會影響交易快照、代理應收與供應商應付，正式版需二次確認後才可保存。
    </n-alert>

    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <n-card title="維護與基本設定" size="small">
        <n-form label-placement="left" label-width="140">
          <n-form-item label="維護模式">
            <n-switch v-model:value="settings.maintenance_mode">
              <template #checked>ON</template>
              <template #unchecked>OFF</template>
            </n-switch>
          </n-form-item>
          <n-form-item label="維護訊息"><n-input v-model:value="settings.maintenance_message" type="textarea" /></n-form-item>
          <n-form-item label="預設語系"><n-select v-model:value="settings.default_language" :options="languageOptions" /></n-form-item>
          <n-form-item label="系統時區"><n-select v-model:value="settings.timezone" :options="timezoneOptions" /></n-form-item>
        </n-form>
      </n-card>

      <n-card title="登入安全" size="small">
        <n-form label-placement="left" label-width="160">
          <n-form-item label="強制 MFA"><n-switch v-model:value="settings.login_mfa_required" /></n-form-item>
          <n-form-item label="密碼到期天數"><n-input-number v-model:value="settings.password_expire_days" :min="30" :max="365" class="w-full" /></n-form-item>
          <n-form-item label="登入失敗鎖定次數"><n-input-number v-model:value="settings.max_login_failures" :min="3" :max="10" class="w-full" /></n-form-item>
          <n-form-item label="Session Timeout"><n-input-number v-model:value="settings.session_timeout_minutes" :min="10" :max="240" class="w-full"><template #suffix>分鐘</template></n-input-number></n-form-item>
        </n-form>
      </n-card>

      <n-card title="後台 IP 白名單" size="small">
        <n-space vertical>
          <div class="flex gap-2">
            <n-input v-model:value="ipInput" placeholder="輸入 IP，例如 203.0.113.20" @keydown.enter="addIp" />
            <n-button type="primary" secondary @click="addIp">新增</n-button>
          </div>
          <div class="flex flex-wrap gap-2">
            <n-tag v-for="ip in settings.admin_whitelist" :key="ip" closable :bordered="false" @close="removeIp(ip)">
              {{ ip }}
            </n-tag>
          </div>
        </n-space>
      </n-card>

      <n-card title="排程與紀錄" size="small">
        <n-form label-placement="left" label-width="150">
          <n-form-item label="公告匯率時間"><n-input v-model:value="settings.fx_fetch_time" /></n-form-item>
          <n-form-item label="日結執行時間"><n-input v-model:value="settings.daily_settlement_time" /></n-form-item>
          <n-form-item label="操作紀錄保留"><n-input-number v-model:value="settings.audit_retention_days" :min="90" :max="2555" class="w-full"><template #suffix>天</template></n-input-number></n-form-item>
          <n-form-item label="API Rate Limit"><n-input-number v-model:value="settings.api_rate_limit_per_minute" :min="60" :max="5000" class="w-full"><template #suffix>次 / 分鐘</template></n-input-number></n-form-item>
        </n-form>
      </n-card>
    </div>

    <n-card title="設定摘要" size="small">
      <n-descriptions bordered :column="2" label-placement="left">
        <n-descriptions-item label="匯率排程">每日 {{ settings.fx_fetch_time }} 取得第三方公告匯率</n-descriptions-item>
        <n-descriptions-item label="日結排程">每日 {{ settings.daily_settlement_time }} 結算前一日帳期</n-descriptions-item>
        <n-descriptions-item label="維護模式">
          <n-tag :type="settings.maintenance_mode ? 'warning' : 'success'" :bordered="false">{{ settings.maintenance_mode ? '開啟' : '關閉' }}</n-tag>
        </n-descriptions-item>
        <n-descriptions-item label="敏感操作">角色權限、匯率服務費、日結排程需二次確認</n-descriptions-item>
      </n-descriptions>
    </n-card>

    <n-card title="近期設定操作" size="small">
      <n-timeline>
        <n-timeline-item
          v-for="log in logs"
          :key="log.trace_id"
          type="success"
          :title="log.action"
          :content="`${log.operator} · ${log.trace_id}`"
          :time="formatDateTime(log.time)"
        />
      </n-timeline>
    </n-card>

    <n-modal v-model:show="showSaveConfirm" preset="card" title="確認保存系統設定" style="width: min(620px, 92vw);">
      <n-alert type="warning" :show-icon="false" class="mb-4">
        此操作會影響後台登入、安全策略、匯率批次、日結批次與操作紀錄保存規則；正式版需寫入操作紀錄並通知相關服務重新載入設定。
      </n-alert>
      <n-descriptions bordered :column="1" label-placement="left">
        <n-descriptions-item v-for="item in settingImpacts" :key="item.label" :label="item.label">
          {{ item.value }}
        </n-descriptions-item>
      </n-descriptions>
      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button @click="showSaveConfirm = false">取消</n-button>
          <n-button type="primary" @click="confirmSaveSettings">確認保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>
