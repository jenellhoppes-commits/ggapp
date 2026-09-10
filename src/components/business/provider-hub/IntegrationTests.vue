<template>
  <section class="integration-tests">
    <ElDescriptions :column="1" border>
      <ElDescriptionsItem label="商戶幣別線"
        >{{ line.uid }} / {{ line.currency }}</ElDescriptionsItem
      >
      <ElDescriptionsItem label="固定環境">測試環境（不可切換正式環境）</ElDescriptionsItem>
      <ElDescriptionsItem label="測試憑證識別碼">{{
        sandbox?.credential?.id || '尚未核發'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="錢包模式">{{
        line.walletMode === 'Transfer' ? '轉點錢包' : '無縫錢包'
      }}</ElDescriptionsItem>
    </ElDescriptions>
    <ElAlert v-if="blocked" :title="blocked" type="error" :closable="false" />
    <div class="toolbar"
      ><ElSelect v-model="scenario" aria-label="模擬情境" style="width: 250px"
        ><ElOption label="正常回應" value="success" /><ElOption
          label="下注回呼逾時"
          value="callback-failure" /></ElSelect
      ><ElButton type="primary" :disabled="!!blocked" @click="run">執行模擬測試</ElButton></div
    >
    <ElTable :data="rows" border>
      <ElTableColumn label="測試項目" min-width="150"
        ><template #default="{ row }"
          >{{ row.label }}<small class="operation">{{ row.operation }}</small></template
        ></ElTableColumn
      >
      <ElTableColumn prop="status" label="結果" min-width="120" />
      <ElTableColumn prop="callback" label="回呼結果" min-width="185" />
      <ElTableColumn prop="errorCode" label="錯誤碼" min-width="210" />
      <ElTableColumn prop="at" label="時間" min-width="215" />
      <ElTableColumn prop="durationMs" label="耗時（毫秒）" width="130" />
      <ElTableColumn prop="traceId" label="追蹤識別碼" min-width="340" />
    </ElTable>
    <ElDescriptions v-if="result" :column="1" border
      ><ElDescriptionsItem label="測試會員">{{ result.testMember }}</ElDescriptionsItem
      ><ElDescriptionsItem label="隔離錢包">{{ result.walletId }}</ElDescriptionsItem
      ><ElDescriptionsItem label="模擬餘額"
        >{{ result.balanceBefore }} → {{ result.balanceAfter }}
        {{ result.currency }}</ElDescriptionsItem
      ><ElDescriptionsItem label="帳務隔離"
        >不寫入正式注單、商戶結算、供應商應付、代理佣金與平台毛利</ElDescriptionsItem
      ></ElDescriptions
    >
    <p>試玩連結能開啟，不代表以上串接測試通過。正式驗收仍需後端實際測試與可追溯回應紀錄。</p>
  </section>
</template>
<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useLocalStorage, useNow } from '@vueuse/core'
  import { ElMessage } from 'element-plus'
  import type { MerchantLine } from '@/types/game-provider'
  import { integrationCases, runIntegrationDemo, sandboxError } from '@/domain/integration-demo'
  const props = defineProps<{ line: MerchantLine }>()
  const scenario = ref<'success' | 'callback-failure'>('success')
  const runs = useLocalStorage<Record<string, ReturnType<typeof runIntegrationDemo>>>(
    'ggap-integration-demo-v1',
    {},
    { writeDefaults: false }
  )
  const now = useNow({ interval: 1000 })
  const sandbox = computed(() =>
    props.line.environments.find((item) => item.environment === 'Sandbox')
  )
  const blocked = computed(() => sandboxError(props.line, now.value.getTime()))
  const result = computed(() => runs.value[props.line.uid])
  const rows = computed(
    () =>
      result.value?.rows ||
      integrationCases(props.line.walletMode).map(([operation, label]) => ({
        operation,
        label,
        status: '尚未執行',
        callback: '—',
        errorCode: '—',
        at: '—',
        durationMs: '—',
        traceId: '—'
      }))
  )
  function run() {
    try {
      runs.value[props.line.uid] = runIntegrationDemo(props.line, scenario.value)
      ElMessage.info('模擬測試已完成；不代表正式串接驗收')
    } catch (cause) {
      ElMessage.error((cause as Error).message)
    }
  }
  watch(
    () => props.line.uid,
    () => {
      scenario.value = 'success'
    }
  )
</script>
<style scoped>
  .integration-tests {
    display: grid;
    gap: 18px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
  }
  .operation {
    display: block;
    color: var(--el-text-color-secondary);
  }
  p {
    color: var(--el-text-color-secondary);
    line-height: 1.8;
  }
</style>
