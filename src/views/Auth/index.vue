<script setup lang="ts">
import { computed, nextTick, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NDivider,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NTag,
  NText,
  useMessage
} from 'naive-ui'
import { useAuthStore } from '../../stores/auth'
import type { Portal } from '../../stores/auth'
import { defaultPathByPortal, loginPathByPortal } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()

const loading = ref(false)
const formRef = ref()
const selectedPortal = ref<Portal>('admin')
const pendingDemoLoginKey = 'ggap:pending-demo-login'
const model = ref({
  username: '',
  password: ''
})

const portalOptions: Portal[] = ['admin', 'agent', 'merchant']

const routePortal = computed<Portal | null>(() => {
  const metaPortal = route.meta.portal as Portal | undefined
  const queryPortal = route.query.portal as Portal | undefined
  return metaPortal || queryPortal || null
})

const portalTitleMap: Record<Portal, string> = {
  admin: '管理者後台',
  agent: '代理後台',
  merchant: '商戶後台'
}

const portalRoleMap: Record<Portal, string> = {
  admin: 'MASTER',
  agent: 'AGENT',
  merchant: 'MERCHANT'
}

const portalHintMap: Record<Portal, string> = {
  admin: '全域營運、商務、內容、交易、財務、品質與系統管理。',
  agent: '代理查看自己的帳務、下級代理、關聯商戶與報表資料。',
  merchant: '商戶查看會員、投注、遊戲、帳務參考與 API 串接資訊。'
}

const quickLoginMap: Record<Portal, { username: string; password: string; label: string }> = {
  admin: { username: 'admin', password: 'admin123', label: '管理者 Demo' },
  agent: { username: 'agent', password: 'agent123', label: '代理 Demo' },
  merchant: { username: 'merchant', password: '123456', label: '商戶 Demo' }
}

const rules = {
  username: { required: true, message: '請輸入帳號', trigger: 'blur' },
  password: { required: true, message: '請輸入密碼', trigger: 'blur' }
}

watchEffect(() => {
  if (routePortal.value) selectedPortal.value = routePortal.value
})

const getSafeRedirect = (portal: Portal) => {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  const allowedAdminPath = portal === 'admin' && redirect.startsWith('/platform/')
  return redirect.startsWith(`/${portal}/`) || allowedAdminPath ? redirect : defaultPathByPortal[portal]
}

const handleLogin = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    const result = await authStore.login(model.value.username, model.value.password, selectedPortal.value)

    if (!result.success) {
      message.error(result.message || '登入失敗')
      return
    }

    message.success('登入成功')
    router.push(getSafeRedirect(selectedPortal.value))
  } catch (error) {
    if (error instanceof Error) console.error(error)
  } finally {
    loading.value = false
  }
}

const quickLogin = async (portal: Portal) => {
  authStore.logout()

  if (routePortal.value && routePortal.value !== portal) {
    sessionStorage.setItem(pendingDemoLoginKey, portal)
    router.push({ path: loginPathByPortal[portal], query: { demo: portal } })
    return
  }

  selectedPortal.value = portal
  model.value.username = quickLoginMap[portal].username
  model.value.password = quickLoginMap[portal].password
  await nextTick()
  await handleLogin()
}

const goPortalLogin = (portal: Portal) => {
  if (selectedPortal.value !== portal) authStore.logout()
  selectedPortal.value = portal
  router.push(loginPathByPortal[portal])
}

const handlePortalSelect = (portal: Portal) => {
  if (routePortal.value && routePortal.value !== portal) {
    goPortalLogin(portal)
    return
  }

  selectedPortal.value = portal
}

watchEffect(() => {
  const demoPortal = route.query.demo as Portal | undefined

  if (demoPortal && quickLoginMap[demoPortal] && (!routePortal.value || routePortal.value === demoPortal)) {
    selectedPortal.value = demoPortal
    model.value.username = quickLoginMap[demoPortal].username
    model.value.password = quickLoginMap[demoPortal].password
    router.replace(loginPathByPortal[demoPortal])

    if (sessionStorage.getItem(pendingDemoLoginKey) === demoPortal) {
      sessionStorage.removeItem(pendingDemoLoginKey)
      void nextTick(() => handleLogin())
    }
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[#101014] px-4 py-10 md:px-6">
    <div class="grid w-full max-w-[920px] grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
      <section class="flex min-h-[520px] flex-col justify-between border border-[#2a2b31] bg-[#18191f] p-6 md:p-8">
        <div>
          <n-tag :bordered="false" type="success" size="small">GGAP Admin Suite</n-tag>
          <h1 class="mt-6 text-3xl font-bold text-white">三入口登入</h1>
          <p class="mt-3 text-sm leading-6 text-gray-400">
            管理者、代理、商戶共用同一套後台模組，但入口、資料範圍與 API request scope 會各自分開。
          </p>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <button
            v-for="portal in portalOptions"
            :key="portal"
            type="button"
            class="border p-4 text-left transition-colors hover:-translate-y-0.5"
            :class="selectedPortal === portal ? 'border-emerald-400 bg-emerald-400/10' : 'border-[#30313a] bg-[#202127] hover:border-[#555866]'"
            @click="handlePortalSelect(portal)"
          >
            <div class="text-sm font-semibold text-white">{{ portalTitleMap[portal] }}</div>
            <div class="mt-2 text-xs text-gray-500">{{ portalRoleMap[portal] }}</div>
            <div class="mt-3 text-xs text-emerald-300">
              {{ selectedPortal === portal ? '目前入口' : '切換入口' }}
            </div>
          </button>
        </div>

        <n-alert type="info" :bordered="false" class="!bg-[#14283a]">
          {{ portalHintMap[selectedPortal] }}
        </n-alert>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <n-button
            v-for="portal in portalOptions"
            :key="`${portal}-entry`"
            :type="selectedPortal === portal ? 'primary' : 'default'"
            secondary
            @click="goPortalLogin(portal)"
          >
            {{ portalTitleMap[portal] }}入口
          </n-button>
        </div>
      </section>

      <n-card class="border border-[#2a2b31] bg-[#18191f]">
        <template #header>
          <div>
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-white">{{ portalTitleMap[selectedPortal] }}</h2>
              <n-tag size="small" :type="selectedPortal === 'admin' ? 'error' : selectedPortal === 'agent' ? 'warning' : 'info'">
                {{ portalRoleMap[selectedPortal] }}
              </n-tag>
            </div>
            <p class="mt-2 text-sm text-gray-500">請使用對應入口帳號登入。</p>
          </div>
        </template>

        <n-form ref="formRef" :model="model" :rules="rules" size="large">
          <n-form-item path="username" label="帳號">
            <n-input v-model:value="model.username" placeholder="請輸入帳號" @keydown.enter="handleLogin" />
          </n-form-item>

          <n-form-item path="password" label="密碼">
            <n-input v-model:value="model.password" type="password" show-password-on="click" placeholder="請輸入密碼" @keydown.enter="handleLogin" />
          </n-form-item>

          <n-button type="primary" block :loading="loading" class="mt-3 h-11" strong @click="handleLogin">
            {{ loading ? '登入中' : '登入' }}
          </n-button>
        </n-form>

        <n-divider class="!my-6">
          <n-text depth="3" class="text-xs">快速登入</n-text>
        </n-divider>

        <n-space vertical :size="10">
          <n-button
            v-for="portal in portalOptions"
            :key="portal"
            block
            secondary
            @click="quickLogin(portal)"
          >
            {{ quickLoginMap[portal].label }}
            <span class="ml-2 text-xs text-gray-400">
              {{ quickLoginMap[portal].username }} / {{ quickLoginMap[portal].password }}
            </span>
          </n-button>
        </n-space>

        <template #footer>
          <div class="text-center text-xs text-gray-500">
            V1 權限模型：portal + role + data scope
          </div>
        </template>
      </n-card>
    </div>
  </div>
</template>
