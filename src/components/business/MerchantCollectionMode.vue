<template>
  <ElCard shadow="never">
    <template #header>收付模式</template>
    <p>目前生效：{{ currentMode === 'AgentCollect' ? '代理統收' : '平台代收' }}</p>
    <ElForm label-position="top" :disabled="!editable">
      <ElFormItem label="收付模式" required
        ><ElSelect v-model="mode"
          ><ElOption label="代理統收" value="AgentCollect" /><ElOption
            label="平台代收"
            value="PlatformCollect" /></ElSelect
      ></ElFormItem>
      <ElFormItem label="生效日期" required
        ><ElDatePicker v-model="date" value-format="YYYY-MM-DD"
      /></ElFormItem>
      <ElFormItem label="變更原因" required><ElInput v-model="reason" /></ElFormItem>
      <ElButton v-if="editable" type="primary" @click="save">保存模式版本</ElButton>
    </ElForm>
    <ElTable :data="history">
      <ElTableColumn prop="version" label="版本" width="80" />
      <ElTableColumn label="模式"
        ><template #default="{ row }">{{
          row.mode === 'AgentCollect' ? '代理統收' : '平台代收'
        }}</template></ElTableColumn
      >
      <ElTableColumn prop="effectiveFrom" label="生效日期" />
      <ElTableColumn label="生效狀態"
        ><template #default="{ row }">{{
          row.effectiveFrom > today
            ? '未來生效'
            : row.version === effectiveVersion?.version
              ? '目前生效'
              : '歷史版本'
        }}</template></ElTableColumn
      >
      <ElTableColumn prop="reason" label="變更原因" />
      <ElTableColumn prop="actor" label="登錄人" />
    </ElTable>
  </ElCard>
</template>
<script setup lang="ts">
  import { useCollectionModeStore } from '@/store/modules/collectionMode'
  import { useUserStore } from '@/store/modules/user'
  import type { CollectionMode } from '@/domain/collection-mode'
  import { ElMessage } from 'element-plus'
  import { usePlatformLocaleStore } from '@/store/modules/platformLocale'
  import { platformDate } from '@/domain/report-four-tabs'
  const props = defineProps<{ merchantId: string; initial?: CollectionMode }>()
  const store = useCollectionModeStore(),
    user = useUserStore()
  const today = computed(() =>
    platformDate(new Date(), usePlatformLocaleStore().defaultTimezone?.id || 'Asia/Taipei')
  )
  const currentMode = computed(() => store.at(props.merchantId, today.value, props.initial))
  const effectiveVersion = computed(
    () =>
      history.value
        .filter((v) => v.effectiveFrom <= today.value)
        .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.version - a.version)[0]
  )
  const mode = ref<CollectionMode>(props.initial || 'AgentCollect'),
    date = ref(''),
    reason = ref('')
  const editable = computed(() => user.info.roles?.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r)))
  const history = computed(() =>
    store.versions
      .filter((v) => v.merchantId === props.merchantId)
      .slice()
      .reverse()
  )
  watch(
    () => props.merchantId,
    () => {
      mode.value = currentMode.value
      date.value = ''
      reason.value = ''
    },
    { immediate: true }
  )
  function save() {
    try {
      store.save(props.merchantId, mode.value, date.value, reason.value)
      ElMessage.success('模式版本已保存')
    } catch (e) {
      ElMessage.error((e as Error).message)
    }
  }
</script>
