<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui'

export interface DemoField {
  label: string
  value: string | number
  tag?: 'success' | 'warning' | 'error' | 'info' | 'default'
  editable?: boolean
  placeholder?: string
}

export interface DemoSection {
  title: string
  fields: DemoField[]
}

const props = withDefaults(defineProps<{
  show: boolean
  title: string
  subtitle?: string
  notice?: string
  fields?: DemoField[]
  sections?: DemoSection[]
  timeline?: string[]
  editable?: boolean
}>(), {
  editable: true
})

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const isEditing = ref(false)
const draft = ref<Record<string, string>>({})

const visible = computed({
  get: () => props.show,
  set: value => emit('update:show', value)
})

const fieldKey = (field: DemoField, sectionTitle = 'base') => `${sectionTitle}::${field.label}`

const resetDraft = () => {
  const next: Record<string, string> = {}
  props.fields?.forEach(field => {
    next[fieldKey(field)] = String(field.value)
  })
  props.sections?.forEach(section => {
    section.fields.forEach(field => {
      next[fieldKey(field, section.title)] = String(field.value)
    })
  })
  draft.value = next
}

const getDraftValue = (field: DemoField, sectionTitle = 'base') => {
  const key = fieldKey(field, sectionTitle)
  return draft.value[key] ?? String(field.value)
}

const canEditField = (field: DemoField) => field.editable !== false

const startEdit = () => {
  resetDraft()
  isEditing.value = true
}

const cancelEdit = () => {
  resetDraft()
  isEditing.value = false
}

const saveEdit = () => {
  isEditing.value = false
}

watch(() => props.show, (show) => {
  if (show) {
    resetDraft()
    isEditing.value = false
  }
})
</script>

<template>
  <n-drawer v-model:show="visible" placement="right" :width="720">
    <n-drawer-content :title="title" closable>
      <div class="space-y-4">
        <div v-if="editable" class="flex justify-end">
          <n-space size="small">
            <n-button v-if="!isEditing" size="small" secondary type="primary" @click="startEdit">編輯</n-button>
            <template v-else>
              <n-button size="small" secondary @click="cancelEdit">取消</n-button>
              <n-button size="small" type="primary" @click="saveEdit">儲存演示</n-button>
            </template>
          </n-space>
        </div>

        <p v-if="subtitle" class="text-sm text-slate-400">{{ subtitle }}</p>

        <n-alert v-if="notice" type="info" :bordered="false">
          {{ notice }}
        </n-alert>

        <n-card v-if="fields?.length" size="small" title="基本資料">
          <n-descriptions v-if="!isEditing" bordered :column="2" size="small">
            <n-descriptions-item v-for="field in fields" :key="field.label" :label="field.label">
              <n-tag v-if="field.tag" :type="field.tag" size="small" :bordered="false">
                {{ getDraftValue(field) }}
              </n-tag>
              <span v-else>{{ getDraftValue(field) }}</span>
            </n-descriptions-item>
          </n-descriptions>

          <n-form v-else label-placement="top">
            <div class="grid gap-3 md:grid-cols-2">
              <n-form-item v-for="field in fields" :key="field.label" :label="field.label">
                <n-input
                  v-if="canEditField(field)"
                  v-model:value="draft[fieldKey(field)]"
                  :placeholder="field.placeholder || `請輸入${field.label}`"
                />
                <n-tag v-else-if="field.tag" :type="field.tag" size="small" :bordered="false">
                  {{ getDraftValue(field) }}
                </n-tag>
                <span v-else>{{ getDraftValue(field) }}</span>
              </n-form-item>
            </div>
          </n-form>
        </n-card>

        <n-card v-for="section in sections" :key="section.title" size="small" :title="section.title">
          <n-descriptions v-if="!isEditing" bordered :column="2" size="small">
            <n-descriptions-item v-for="field in section.fields" :key="field.label" :label="field.label">
              <n-tag v-if="field.tag" :type="field.tag" size="small" :bordered="false">
                {{ getDraftValue(field, section.title) }}
              </n-tag>
              <span v-else>{{ getDraftValue(field, section.title) }}</span>
            </n-descriptions-item>
          </n-descriptions>

          <n-form v-else label-placement="top">
            <div class="grid gap-3 md:grid-cols-2">
              <n-form-item v-for="field in section.fields" :key="field.label" :label="field.label">
                <n-input
                  v-if="canEditField(field)"
                  v-model:value="draft[fieldKey(field, section.title)]"
                  :placeholder="field.placeholder || `請輸入${field.label}`"
                />
                <n-tag v-else-if="field.tag" :type="field.tag" size="small" :bordered="false">
                  {{ getDraftValue(field, section.title) }}
                </n-tag>
                <span v-else>{{ getDraftValue(field, section.title) }}</span>
              </n-form-item>
            </div>
          </n-form>
        </n-card>

        <n-card v-if="timeline?.length" size="small" title="操作紀錄">
          <n-timeline>
            <n-timeline-item v-for="item in timeline" :key="item" type="success" :content="item" />
          </n-timeline>
        </n-card>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <n-button v-if="isEditing" secondary @click="cancelEdit">取消編輯</n-button>
          <n-button v-if="isEditing" type="primary" @click="saveEdit">儲存演示</n-button>
          <n-button v-else @click="visible = false">關閉</n-button>
        </div>
      </template>
    </n-drawer-content>
  </n-drawer>
</template>
