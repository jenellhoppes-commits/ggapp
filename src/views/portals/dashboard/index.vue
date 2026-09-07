<template>
  <div class="portal-dashboard">
    <AppPageHeader
      :title="portal.title"
      :eyebrow="portal.eyebrow"
      :description="portal.description"
    />

    <ElAlert
      :title="portal.scopeTitle"
      :description="portal.scopeDescription"
      type="info"
      :closable="false"
      show-icon
    />

    <div class="metric-grid">
      <ElCard v-for="metric in portal.metrics" :key="metric.label" shadow="never">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.note }}</small>
      </ElCard>
    </div>

    <ElCard shadow="never">
      <template #header>
        <div class="section-heading">
          <strong>本入口開發範圍</strong>
          <ElTag type="warning" effect="light">初步演示</ElTag>
        </div>
      </template>
      <ElTimeline>
        <ElTimelineItem
          v-for="item in portal.modules"
          :key="item.title"
          :timestamp="item.status"
          placement="top"
        >
          <strong>{{ item.title }}</strong>
          <p>{{ item.description }}</p>
        </ElTimelineItem>
      </ElTimeline>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'

  defineOptions({ name: 'GgapPortalDashboard' })

  const route = useRoute()
  const isAgent = computed(() => route.path.startsWith('/agent'))
  const portal = computed(() =>
    isAgent.value
      ? {
          title: '代理總覽',
          eyebrow: 'Agent Portal',
          description: '查看自身推廣商戶、串接進度、營運摘要與正式佣金。',
          scopeTitle: '資料範圍：目前登入代理',
          scopeDescription: '代理不得查看供應商成本、商戶正式對帳或平台完整毛利。',
          metrics: [
            { label: '推廣商戶', value: '12', note: '僅包含目前代理歸屬' },
            { label: '串接進行中', value: '4', note: '測試環境或待審核' },
            { label: '已確認佣金', value: '284,500 USD', note: '引用已確認商戶結算' },
            { label: '待付款佣金', value: '62,400 USD', note: '等待付款排程' }
          ],
          modules: [
            {
              title: '商戶與串接進度',
              status: '第一階段',
              description: '顯示所屬商戶及其 GGAP 串接狀態。'
            },
            { title: '營運摘要', status: '第二階段', description: '提供商戶與交易的範圍化報表。' },
            {
              title: '佣金與付款',
              status: '第三階段',
              description: '只引用已確認商戶結算計算正式佣金。'
            }
          ]
        }
      : {
          title: '商戶總覽',
          eyebrow: 'Merchant Portal',
          description: '管理自身幣別線與串接資料，查詢會員、交易、結算及帳單。',
          scopeTitle: '資料範圍：目前登入商戶',
          scopeDescription: '商戶只能存取自身資料，且無法取得供應商原始 API 憑證。',
          metrics: [
            { label: '啟用幣別線', value: '2', note: 'USD、TWD' },
            { label: '已開通遊戲', value: '48', note: '全部使用同幣別供應商路由' },
            { label: '活躍會員', value: '1,248', note: '已排除測試環境測試會員' },
            { label: '待付帳單', value: '128,400 USD', note: '正式結算金額' }
          ],
          modules: [
            {
              title: '幣別線與 API 串接',
              status: '第一階段',
              description: '顯示錢包、回呼、憑證狀態與測試結果。'
            },
            {
              title: '會員與交易',
              status: '第二階段',
              description: '提供錢包、遊戲連線、注單、遊戲局號與事件流水。'
            },
            {
              title: '結算與帳單',
              status: '第三階段',
              description: '分開呈現原幣明細、鎖定匯率與正式應收。'
            }
          ]
        }
  )
</script>

<style scoped>
  .portal-dashboard {
    display: grid;
    gap: 16px;
    padding-bottom: 24px;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .metric-grid span,
  .metric-grid strong,
  .metric-grid small {
    display: block;
  }

  .metric-grid span,
  .metric-grid small,
  .portal-dashboard p {
    color: var(--art-gray-600);
  }

  .metric-grid strong {
    margin: 10px 0 6px;
    font-size: 24px;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .portal-dashboard p {
    margin: 6px 0 0;
  }

  @media (width <= 900px) {
    .metric-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 560px) {
    .metric-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
