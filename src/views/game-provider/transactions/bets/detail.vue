<template>
  <div v-if="bet" class="bet-detail-page">
    <ElCard class="hero-card" shadow="never">
      <AppPageHeader
        :title="bet.id"
        eyebrow="注單詳細"
        :description="`局號：${bet.roundId} · ${bet.gameName}`"
      >
        <template #status>
          <ElTag :type="betStatusType(bet.status)" effect="light" round>{{
            betStatusLabel(bet.status)
          }}</ElTag>
          <ElTag :type="riskType(bet.riskStatus)" effect="plain" round>{{
            riskLabel(bet.riskStatus)
          }}</ElTag>
        </template>
        <template #meta>
          <div class="hero-meta">
            <span><ArtSvgIcon icon="ri:user-line" />{{ bet.externalMemberId }}</span>
            <span><ArtSvgIcon icon="ri:store-2-line" />{{ bet.merchantName }}</span>
            <span><ArtSvgIcon icon="ri:route-line" />{{ bet.lineUid }}</span>
            <span><ArtSvgIcon icon="ri:money-dollar-circle-line" />{{ bet.currency }}</span>
          </div>
        </template>
        <template #actions>
          <ElButton @click="router.push('/transactions/bets')">返回列表</ElButton>
          <ElButton @click="router.push(`/members/management/${bet.memberId}?tab=bets`)"
            >查看會員</ElButton
          >
          <ElButton
            v-if="relatedTransactions[0]"
            @click="router.push(`/transactions/records/${relatedTransactions[0].id}`)"
            >查看關聯交易</ElButton
          >
        </template>
      </AppPageHeader>
    </ElCard>

    <div class="summary-grid">
      <ElCard v-for="item in summary" :key="item.label" shadow="never">
        <span>{{ item.label }}</span
        ><strong :class="item.className">{{ item.value }}</strong
        ><small>{{ item.note }}</small>
      </ElCard>
    </div>

    <ElCard class="tabs-card" shadow="never">
      <ElTabs v-model="activeTab" @tab-change="syncTab">
        <ElTabPane label="基本資料" name="overview">
          <div class="tab-panel detail-grid">
            <section class="section-block">
              <div class="section-title"
                ><div><h3>注單識別</h3><p>平台、商戶、會員與遊戲的完整關聯。</p></div></div
              >
              <ElDescriptions :column="descriptionColumns" border>
                <ElDescriptionsItem label="注單編號">{{ bet.id }}</ElDescriptionsItem>
                <ElDescriptionsItem label="局號">{{ bet.roundId }}</ElDescriptionsItem>
                <ElDescriptionsItem label="會員">
                  <EntityLink
                    :label="bet.externalMemberId"
                    :secondary="bet.memberId"
                    :to="`/members/management/${bet.memberId}`"
                  />
                </ElDescriptionsItem>
                <ElDescriptionsItem label="遊戲">
                  <EntityLink
                    :label="bet.gameName"
                    :secondary="bet.gameId"
                    :to="`/games/management/${bet.gameId}`"
                  />
                </ElDescriptionsItem>
                <ElDescriptionsItem label="遊戲代碼">{{ bet.gameCode }}</ElDescriptionsItem>
                <ElDescriptionsItem label="遊戲類型">{{
                  gameTypeLabel(bet.gameType)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="商戶">
                  <EntityLink
                    :label="bet.merchantName"
                    :secondary="bet.merchantId"
                    :to="`/business/merchants/${bet.merchantId}`"
                  />
                </ElDescriptionsItem>
                <ElDescriptionsItem label="所屬代理">
                  <EntityLink
                    :label="bet.agentName"
                    :secondary="bet.agentId"
                    :to="`/business/agents/${bet.agentId}`"
                  />
                </ElDescriptionsItem>
                <ElDescriptionsItem label="線路 UID">{{ bet.lineUid }}</ElDescriptionsItem>
                <ElDescriptionsItem label="交易幣別">{{ bet.currency }}</ElDescriptionsItem>
                <ElDescriptionsItem label="錢包模式">{{
                  bet.walletMode === 'Seamless' ? '單一錢包' : '轉帳錢包'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="遊戲版本">{{
                  bet.result.version.gameVersion
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="RTP 方案">{{
                  bet.result.version.rtpPlan
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="限紅方案">{{
                  bet.result.version.limitPlan
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="注單狀態">{{
                  betStatusLabel(bet.status)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="開始時間">{{ bet.time }}</ElDescriptionsItem>
                <ElDescriptionsItem label="結算時間">{{
                  bet.settledAt || '尚未結算'
                }}</ElDescriptionsItem>
              </ElDescriptions>
            </section>

            <section class="section-block">
              <div class="section-title"
                ><div><h3>金額摘要</h3><p>所有金額均以該注單交易幣別呈現。</p></div></div
              >
              <div class="amount-list">
                <div
                  ><span>投注金額</span
                  ><strong>{{ money(bet.betAmount) }} {{ bet.currency }}</strong></div
                >
                <div
                  ><span>有效投注</span
                  ><strong>{{ money(bet.betAmount) }} {{ bet.currency }}</strong></div
                >
                <div
                  ><span>派彩金額</span
                  ><strong>{{ money(bet.payoutAmount) }} {{ bet.currency }}</strong></div
                >
                <div
                  ><span>會員淨額</span
                  ><strong :class="bet.playerNet >= 0 ? 'positive' : 'negative'"
                    >{{ money(bet.playerNet) }} {{ bet.currency }}</strong
                  ></div
                >
                <div
                  ><span>遊戲商淨額</span
                  ><strong :class="bet.playerNet <= 0 ? 'positive' : 'negative'"
                    >{{ money(-bet.playerNet) }} {{ bet.currency }}</strong
                  ></div
                >
                <div
                  ><span>Jackpot 金額</span
                  ><strong>{{ money(bet.result.jackpotAmount) }} {{ bet.currency }}</strong></div
                >
              </div>
              <ElAlert
                title="注單資料由遊戲服務與錢包交易共同產生，總後台不可人工更改金額或狀態。"
                type="info"
                :closable="false"
                show-icon
              />
            </section>
          </div>
        </ElTabPane>

        <ElTabPane label="關聯交易" name="transactions">
          <div class="tab-panel">
            <div class="section-title"
              ><div><h3>關聯交易</h3><p>同一局號下的投注扣款與派彩入帳。</p></div></div
            >
            <ArtTable
              :data="relatedTransactions"
              empty-text="尚無關聯交易"
              height="auto"
              empty-height="auto"
              :show-table-header="false"
              style="height: auto"
            >
              <ElTableColumn label="交易編號" width="135"
                ><template #default="scope"
                  ><EntityLink
                    :label="scope.row.id"
                    :to="`/transactions/records/${scope.row.id}`" /></template
              ></ElTableColumn>
              <ElTableColumn label="類型" width="100"
                ><template #default="scope">{{
                  transactionTypeLabel(scope.row.type)
                }}</template></ElTableColumn
              >
              <ElTableColumn label="金額" width="150" align="right"
                ><template #default="scope"
                  ><span :class="scope.row.amount >= 0 ? 'positive' : 'negative'"
                    >{{ money(scope.row.amount) }} {{ scope.row.currency }}</span
                  ></template
                ></ElTableColumn
              >
              <ElTableColumn label="狀態" width="100"
                ><template #default="scope"
                  ><ElTag :type="transactionStatusType(scope.row.status)">{{
                    transactionStatusLabel(scope.row.status)
                  }}</ElTag></template
                ></ElTableColumn
              >
              <ElTableColumn prop="externalReference" label="外部參考號" min-width="200" />
              <ElTableColumn prop="time" label="交易時間" width="160" /> </ArtTable
            >>
          </div>
        </ElTabPane>

        <ElTabPane label="異常紀錄" name="anomalies">
          <div class="tab-panel">
            <div class="section-title"
              ><div><h3>交易異常紀錄</h3><p>保留交易異常與歷史參照，供查詢及追蹤。</p></div></div
            >
            <ArtTable
              :data="anomalies"
              empty-text="此注單尚無異常紀錄"
              height="auto"
              empty-height="auto"
              :show-table-header="false"
              style="height: auto"
            >
              <ElTableColumn prop="id" label="異常編號" width="120" />
              <ElTableColumn prop="type" label="異常類型" min-width="190" />
              <ElTableColumn label="風險等級" width="100"
                ><template #default="scope"
                  ><ElTag :type="scope.row.riskLevel === 'High' ? 'danger' : 'warning'">{{
                    scope.row.riskLevel === 'High'
                      ? '高'
                      : scope.row.riskLevel === 'Medium'
                        ? '中'
                        : '低'
                  }}</ElTag></template
                ></ElTableColumn
              >
              <ElTableColumn label="關聯交易" width="140"
                ><template #default="scope"
                  ><EntityLink
                    v-if="scope.row.transactionId"
                    :label="scope.row.transactionId"
                    :to="`/transactions/records/${scope.row.transactionId}`"
                  /><span v-else>—</span></template
                ></ElTableColumn
              >
              <ElTableColumn label="歷史案件參照" width="140">
                <template #default="scope">{{ scope.row.riskCaseId || '—' }}</template>
              </ElTableColumn>
              <ElTableColumn label="狀態" width="100"
                ><template #default="scope">{{
                  anomalyStatusLabel(scope.row.status)
                }}</template></ElTableColumn
              >
              <ElTableColumn prop="occurredAt" label="發生時間" width="160" /> </ArtTable
            >>
          </div>
        </ElTabPane>

        <ElTabPane v-if="canViewRawResult" label="原始結果" name="raw">
          <div class="tab-panel raw-layout">
            <section class="section-block raw-result">
              <div class="section-title">
                <div>
                  <h3>原始結果資料</h3>
                  <p>僅供具備技術資料權限的角色查閱，所有操作均保留紀錄。</p>
                </div>
                <div class="raw-actions">
                  <ElButton @click="copyRawPayload">複製內容</ElButton>
                  <ElButton type="primary" @click="exportRawPayload">匯出結果資料</ElButton>
                </div>
              </div>
              <ElAlert
                title="敏感資料：一般客服與商戶後台不顯示內部 Debug、Math、RNG Seed 或技術 Log。"
                type="warning"
                :closable="false"
                show-icon
                class="mb-4"
              />
              <pre>{{ bet.result.rawPayload }}</pre>
            </section>
            <section class="section-block">
              <div class="section-title">
                <div><h3>查看與匯出紀錄</h3><p>保留歷史操作證據；本版僅提供原始資料查詢。</p></div>
              </div>
              <ArtTable
                :data="accessLogs"
                empty-text="尚無操作紀錄"
                height="auto"
                empty-height="auto"
                :show-table-header="false"
                style="height: auto"
              >
                <ElTableColumn label="操作" min-width="130">
                  <template #default="scope">{{ accessActionLabel(scope.row.action) }}</template>
                </ElTableColumn>
                <ElTableColumn prop="detail" label="內容" min-width="190" />
                <ElTableColumn prop="operator" label="操作人" width="120" />
                <ElTableColumn prop="time" label="時間" width="160" /> </ArtTable
              >>
            </section>
          </div>
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </div>

  <ElResult v-else icon="warning" title="找不到注單資料" sub-title="請確認注單編號是否正確。">
    <template #extra
      ><ElButton type="primary" @click="router.push('/transactions/bets')"
        >返回注單列表</ElButton
      ></template
    >
  </ElResult>
</template>

<script setup lang="ts">
  import { ElButton, ElMessage, ElTag } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'
  import type {
    BetResultAccessLog,
    MemberBetStatus,
    MemberTransactionStatus,
    MemberTransactionType
  } from '@/types/game-provider'
  import { useTransactionCenterStore } from '@/store/modules/transactionCenter'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import EntityLink from '@/components/business/game-provider/entity-link/index.vue'

  defineOptions({ name: 'BetDetail' })
  const route = useRoute()
  const router = useRouter()
  const store = useTransactionCenterStore()
  const { width } = useWindowSize()
  const activeTab = ref(
    ['overview', 'transactions', 'anomalies', 'raw'].includes(String(route.query.tab))
      ? String(route.query.tab)
      : 'overview'
  )
  const descriptionColumns = computed(() => (width.value < 760 ? 1 : 2))
  const bet = computed(() => store.findBet(String(route.params.id)))
  const relatedTransactions = computed(() =>
    bet.value ? store.getTransactionsByBet(bet.value.id) : []
  )
  const anomalies = computed(() => (bet.value ? store.getBetAnomalies(bet.value.id) : []))
  const accessLogs = computed(() => (bet.value ? store.getBetResultAccessLogs(bet.value.id) : []))
  const canViewRawResult = true
  const summary = computed(() =>
    bet.value
      ? [
          {
            label: '投注金額',
            value: `${money(bet.value.betAmount)} ${bet.value.currency}`,
            note: '會員扣款'
          },
          {
            label: '派彩金額',
            value: `${money(bet.value.payoutAmount)} ${bet.value.currency}`,
            note: '會員入帳'
          },
          {
            label: '會員淨額',
            value: `${money(bet.value.playerNet)} ${bet.value.currency}`,
            note: bet.value.playerNet >= 0 ? '會員淨贏' : '會員淨輸',
            className: bet.value.playerNet >= 0 ? 'positive' : 'negative'
          }
        ]
      : []
  )
  const money = (value: number) =>
    new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      value
    )
  const betStatusLabel = (status: MemberBetStatus) =>
    ({
      'In Progress': '進行中',
      Settled: '已結算',
      Cancelled: '已取消',
      Refunded: '已退款',
      Exception: '異常'
    })[status]
  const betStatusType = (status: MemberBetStatus) =>
    status === 'Settled'
      ? 'success'
      : status === 'Exception'
        ? 'danger'
        : status === 'In Progress'
          ? 'warning'
          : 'info'
  const riskLabel = (status: 'Normal' | 'Attention' | 'Exception') =>
    ({ Normal: '正常', Attention: '需關注', Exception: '異常' })[status]
  const riskType = (status: 'Normal' | 'Attention' | 'Exception') =>
    status === 'Exception' ? 'danger' : status === 'Attention' ? 'warning' : 'info'
  const gameTypeLabel = (type: string) =>
    ({
      GT001: '電子遊戲',
      GT002: '真人遊戲',
      GT003: '捕魚遊戲',
      GT004: '街機遊戲',
      GT005: '桌牌遊戲',
      GT006: '虛擬運動',
      GT007: '彩票遊戲',
      GT008: '其他遊戲'
    })[type as 'GT001'] || type
  const transactionTypeLabel = (type: MemberTransactionType) =>
    ({
      Bet: '投注',
      Payout: '派彩',
      Refund: '退款',
      Rollback: '回滾',
      Jackpot: '獎池',
      'Transfer In': '轉入',
      'Transfer Out': '轉出'
    })[type]
  const transactionStatusLabel = (status: MemberTransactionStatus) =>
    ({
      Processing: '處理中',
      Success: '成功',
      Failed: '失敗',
      Refunded: '已退款',
      'Rolled Back': '已回滾',
      Exception: '異常'
    })[status]
  const transactionStatusType = (status: MemberTransactionStatus) =>
    status === 'Success'
      ? 'success'
      : ['Failed', 'Exception'].includes(status)
        ? 'danger'
        : status === 'Processing'
          ? 'warning'
          : 'info'
  const anomalyStatusLabel = (status: string) =>
    ({ Open: '待處理', Investigating: '調查中', Resolved: '已解決', Dismissed: '已排除' })[
      status as 'Open'
    ] || status
  const accessActionLabel = (action: BetResultAccessLog['action']) =>
    ({
      'View Board': '查看盤面',
      'Start Replay': '啟動重播',
      'View Raw Result': '查看原始結果',
      'Export Result': '匯出結果資料'
    })[action]
  const trackTabAccess = (tab: string) => {
    if (!bet.value) return
    if (tab === 'raw')
      store.logBetResultAccess(bet.value.id, 'View Raw Result', '查看原始 JSON 結果')
  }
  const syncTab = (tab: string | number) => {
    const target = String(tab)
    trackTabAccess(target)
    router.replace({ query: { ...route.query, tab: target } })
  }
  const copyRawPayload = async () => {
    if (!bet.value) return
    await navigator.clipboard.writeText(bet.value.result.rawPayload)
    store.logBetResultAccess(bet.value.id, 'View Raw Result', '複製原始 JSON 結果')
    ElMessage.success('原始結果已複製')
  }
  const exportRawPayload = () => {
    if (!bet.value) return
    const link = document.createElement('a')
    link.href = URL.createObjectURL(
      new Blob([bet.value.result.rawPayload], { type: 'application/json;charset=utf-8' })
    )
    link.download = `${bet.value.id}-result.json`
    link.click()
    URL.revokeObjectURL(link.href)
    store.logBetResultAccess(bet.value.id, 'Export Result', '匯出原始 JSON 結果')
    ElMessage.success('結果資料已匯出')
  }
  watch(
    () => [route.query.tab, route.query.eventId, route.query.stageId],
    ([tab]) => {
      if (tab)
        activeTab.value = ['overview', 'transactions', 'anomalies', 'raw'].includes(String(tab))
          ? String(tab)
          : 'overview'
    }
  )
  watch(
    () => bet.value?.id,
    () => {
      trackTabAccess(activeTab.value)
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .bet-detail-page {
    display: grid;
    gap: 16px;
  }

  .risk-source-alert {
    grid-column: 1 / -1;
  }

  .hero-card :deep(.el-card__body) {
    padding: 20px 22px;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin-top: 12px;
    color: var(--art-gray-600);
  }

  .hero-meta span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .summary-grid :deep(.el-card__body) {
    display: grid;
    gap: 7px;
    padding: 18px;
  }

  .summary-grid span,
  .summary-grid small,
  .section-title p,
  .amount-list span {
    color: var(--art-gray-500);
  }

  .summary-grid strong {
    overflow: hidden;
    font-size: 20px;
    text-overflow: ellipsis;
  }

  .tabs-card :deep(.el-card__body) {
    padding-top: 8px;
  }

  .tab-panel {
    padding: 10px 0 4px;
  }

  .detail-grid,
  .result-layout {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
    gap: 16px;
  }

  .result-layout {
    grid-template-columns: 1fr 1fr;
  }

  .board-layout,
  .replay-layout,
  .raw-layout {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
    gap: 16px;
  }

  .stage-tabs,
  .replay-controls,
  .raw-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .stage-tabs {
    margin-bottom: 18px;
  }

  .stage-tabs :deep(.el-button + .el-button) {
    margin-left: 0;
  }

  .symbol-board {
    display: grid;
    gap: 10px;
    max-width: 760px;
    padding: 20px;
    margin: 0 auto;
    background: var(--art-gray-50);
    border: 1px solid var(--art-gray-200);
    border-radius: var(--custom-radius);
  }

  .symbol-cell {
    display: grid;
    gap: 4px;
    place-content: center;
    min-height: 104px;
    text-align: center;
    background: var(--art-bg-color);
    border: 2px solid var(--art-gray-200);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .symbol-cell.winning {
    background: var(--el-color-warning-light-9);
    border-color: var(--el-color-warning);
    box-shadow: 0 0 0 3px var(--el-color-warning-light-8);
  }

  .symbol-cell span {
    font-size: 30px;
  }

  .symbol-cell small {
    color: var(--art-gray-500);
  }

  .replay-stage {
    display: grid;
    gap: 10px;
    place-content: center;
    min-height: 280px;
    padding: 28px;
    margin-bottom: 18px;
    text-align: center;
    background: linear-gradient(145deg, var(--art-gray-50), var(--art-bg-color));
    border: 1px solid var(--art-gray-200);
    border-radius: var(--custom-radius);
  }

  .replay-stage > .art-svg-icon {
    margin: 4px auto;
    font-size: 42px;
    color: var(--el-color-primary);
  }

  .replay-stage h2,
  .replay-stage p {
    margin: 0;
  }

  .replay-stage p,
  .replay-stage > span {
    color: var(--art-gray-500);
  }

  .replay-controls {
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
  }

  .speed-select {
    width: 92px;
  }

  .transaction-trail button,
  .timeline-list button {
    width: 100%;
    font: inherit;
    color: inherit;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
  }

  .transaction-trail button {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 5px 12px;
    padding: 13px 2px;
    border-bottom: 1px solid var(--art-gray-200);
  }

  .transaction-trail button:hover {
    color: var(--el-color-primary);
  }

  .transaction-trail button small {
    grid-column: 1 / -1;
    color: var(--art-gray-500);
  }

  .event-timeline {
    grid-column: 1 / -1;
  }

  .timeline-list {
    display: grid;
    gap: 8px;
  }

  .timeline-list button {
    display: grid;
    grid-template-columns: 58px 26px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 12px 14px;
    border: 1px solid var(--art-gray-200);
    border-radius: var(--el-border-radius-base);
  }

  .timeline-list button:hover,
  .timeline-list button.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }

  .timeline-list button.risk {
    border-left: 4px solid var(--el-color-danger);
  }

  .timeline-list time,
  .timeline-list small {
    color: var(--art-gray-500);
  }

  .timeline-list span {
    display: grid;
    gap: 3px;
  }

  .section-block {
    min-width: 0;
    padding: 18px;
    border: 1px solid var(--art-gray-200);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .section-title {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .section-title h3,
  .section-title p {
    margin: 0;
  }

  .section-title p {
    margin-top: 5px;
    font-size: 13px;
  }

  .amount-list {
    display: grid;
    gap: 0;
    margin-bottom: 16px;
    border: 1px solid var(--art-gray-200);
    border-radius: var(--el-border-radius-base);
  }

  .amount-list > div {
    display: flex;
    gap: 20px;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid var(--art-gray-200);
  }

  .amount-list > div:last-child {
    border-bottom: 0;
  }

  .positive {
    color: var(--el-color-success);
  }

  .negative {
    color: var(--el-color-danger);
  }

  .raw-result pre {
    min-height: 220px;
    padding: 16px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.7;
    color: var(--art-gray-800);
    background: var(--art-gray-50);
    border-radius: var(--el-border-radius-base);
  }

  @media (width <= 1000px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .detail-grid,
    .result-layout,
    .board-layout,
    .replay-layout,
    .raw-layout {
      grid-template-columns: 1fr;
    }

    .event-timeline {
      grid-column: auto;
    }
  }

  @media (width <= 560px) {
    .summary-grid {
      grid-template-columns: 1fr;
    }

    .section-block {
      padding: 12px;
    }

    .symbol-board {
      gap: 5px;
      padding: 10px;
    }

    .symbol-cell {
      min-height: 76px;
    }

    .symbol-cell span {
      font-size: 22px;
    }

    .symbol-cell small {
      display: none;
    }

    .timeline-list button {
      grid-template-columns: 48px 22px minmax(0, 1fr);
    }

    .timeline-list .el-tag {
      grid-column: 3;
      justify-self: start;
    }
  }
</style>
