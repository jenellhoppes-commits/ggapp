<template>
  <section aria-label="期間財務來源狀態">
    <div class="financial-cards">
      <ElCard v-for="card in cards" :key="card.id" shadow="never">
        <span>{{ card.label }}</span
        ><strong>待核對</strong>
        <p>{{ card.note }}</p>
        <ElButton link type="primary" @click="open(card.id)">{{
          card.id === 'income'
            ? '查看收入來源'
            : card.id === 'cost'
              ? '查看成本來源'
              : '查看核對缺項'
        }}</ElButton>
      </ElCard>
    </div>
    <p class="source-note"
      >{{ data.period }} · {{ data.currency }} ·
      僅展示來源狀態，尚未計算正式財務金額。所有適用成本未齊備前，利潤維持待核對。</p
    >
    <ElDrawer
      v-model="drawer"
      :title="
        detail
          ? detail.label
          : mode === 'income'
            ? '收入來源'
            : mode === 'cost'
              ? '成本來源'
              : '利潤核對缺項'
      "
      size="min(600px, 100%)"
      destroy-on-close
    >
      <p class="source-note"
        >查詢期間 {{ data.period }}／{{ data.currency }}<br />隔離演示 · 營運來源
        {{ data.operationVersion }}<br />限定範圍：{{ appliedScope }}</p
      >
      <div ref="drawerContent">
        <template v-if="detail">
          <ElButton data-back-source @click="selected = ''">返回來源類別</ElButton>
          <ElAlert :title="detail.missing" type="warning" :closable="false" class="detail-alert" />
          <ElDescriptions :column="1" border>
            <ElDescriptionsItem label="預期來源">{{ detail.source }}</ElDescriptionsItem>
            <ElDescriptionsItem label="適用性">{{ detail.applicability }}</ElDescriptionsItem>
            <ElDescriptionsItem label="原記錄識別">未提供，無可開啟原記錄</ElDescriptionsItem>
            <ElDescriptionsItem label="來源版本">未提供</ElDescriptionsItem>
            <ElDescriptionsItem label="來源期間與幣別"
              >未提供，不能假設等於本查詢期間</ElDescriptionsItem
            >
            <ElDescriptionsItem label="核對狀態">{{ detail.status }}</ElDescriptionsItem>
          </ElDescriptions>
          <p class="source-note">來源接入與核准計算不在本演示報表內；此處不新增費用或調整利潤。</p>
        </template>
        <div v-else class="source-list">
          <p>以下是需核對的來源類別，不代表已存在費用或全部適用。選擇類別查看缺項。</p>
          <button
            v-for="item in visibleSources"
            :key="item.id"
            :data-source-id="item.id"
            type="button"
            @click="selected = item.id"
          >
            <span>{{ item.label }}</span
            ><small>{{ item.status }} · 適用性待核對</small
            ><ArtSvgIcon icon="ri:arrow-right-s-line" />
          </button>
        </div>
      </div>
    </ElDrawer>
  </section>
</template>
<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import type { FourResult } from '@/domain/report-four-tabs'
  import { financialSourceStatus } from '@/domain/report-financial-summary'
  const props = defineProps<{ result: FourResult }>()
  const data = computed(() => financialSourceStatus(props.result))
  const appliedScope = computed(
    () =>
      [
        data.value.filters.agent && `代理 ${data.value.filters.agent}`,
        data.value.filters.merchant && `商戶 ${data.value.filters.merchant}`,
        data.value.filters.provider && `供應商 ${data.value.filters.provider}`,
        data.value.filters.game && `遊戲 ${data.value.filters.game}`
      ]
        .filter(Boolean)
        .join('／') || '全部授權演示範圍'
  )
  const drawer = ref(false),
    mode = ref('income'),
    selected = ref('')
  const cards = [
    { id: 'income', label: '平台收入', note: '收入來源及認列版本未齊' },
    { id: 'cost', label: '總成本', note: '適用性與成本來源未齊' },
    { id: 'profit', label: '利潤', note: '收入與全部適用成本待核對' }
  ]
  const visibleSources = computed(() =>
    data.value.sources.filter(
      (s) =>
        mode.value === 'profit' || (mode.value === 'income' ? s.id === 'income' : s.id !== 'income')
    )
  )
  const detail = computed(() => visibleSources.value.find((s) => s.id === selected.value))
  const drawerContent = ref<HTMLElement>()
  watch(selected, async (value, previous) => {
    if (!drawer.value) return
    await nextTick()
    const selector = value ? '[data-back-source]' : `[data-source-id="${previous}"]`
    drawerContent.value?.querySelector<HTMLButtonElement>(selector)?.focus()
  })
  const open = (id: string) => {
    mode.value = id
    selected.value = ''
    drawer.value = true
  }
  watch(
    () => props.result,
    () => {
      drawer.value = false
      selected.value = ''
    }
  )
</script>
<style scoped>
  .financial-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .financial-cards strong {
    display: block;
    margin: 10px 0;
    font-size: 24px;
  }
  .financial-cards p,
  .source-note,
  .source-list small {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .source-note {
    margin: 12px 0;
  }
  .source-list {
    display: grid;
    gap: 12px;
  }
  .source-list button {
    display: grid;
    grid-template-columns: 1fr auto;
    text-align: left;
    gap: 4px 12px;
    padding: 14px;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    cursor: pointer;
  }
  .source-list small {
    grid-column: 1;
  }
  .source-list button :deep(.art-svg-icon) {
    grid-column: 2;
    grid-row: 1 / 3;
    align-self: center;
  }
  .source-list button:hover {
    background: var(--el-fill-color-light);
  }
  .source-list button:focus-visible {
    outline: 2px solid var(--el-color-primary);
  }
  .detail-alert {
    margin: 16px 0;
  }
  @media (max-width: 720px) {
    .financial-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
