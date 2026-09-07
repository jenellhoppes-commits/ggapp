<template>
  <div v-if="record" class="detail-page">
    <AppPageHeader
      :title="subjectName"
      :eyebrow="`${kindLabel}詳細`"
      :description="`${record.id} · ${record.period} · ${subjectCode}`"
    >
      <template #actions>
        <ElTag :type="statusType(record.status)" effect="light">{{
          statusLabel(record.status)
        }}</ElTag>
        <ElButton v-if="kind === 'merchant'" disabled title="計算規則與快照更新流程尚未完成"
          >重新計算（未開放）</ElButton
        >
        <ElButton type="primary" :disabled="!canConfirm" @click="openConfirm">確認對帳</ElButton>
      </template>
    </AppPageHeader>

    <ElAlert v-if="record.unresolvedDifferenceCount" type="error" :closable="false" show-icon>
      <template #title
        >尚有 {{ record.unresolvedDifferenceCount }} 筆差異未完成處理，因此不能確認對帳。</template
      >
      <ElButton link type="danger" @click="openDifferences">前往差異處理</ElButton>
    </ElAlert>
    <ElAlert
      v-else-if="!canConfirm && record.status === 'Pending Confirmation'"
      type="warning"
      :closable="false"
      show-icon
    >
      <template #title>{{ confirmBlockReason }}</template>
    </ElAlert>

    <div class="metric-grid">
      <div
        ><span>投注總額</span><strong>{{ money(record.betAmount) }}</strong
        ><small>{{ record.betCount.toLocaleString() }} 筆</small></div
      >
      <div
        ><span>有效投注</span><strong>{{ money(record.validBet) }}</strong
        ><small>{{ volumeHint }}</small></div
      >
      <div
        ><span>派彩總額</span><strong>{{ money(record.payoutAmount) }}</strong
        ><small>含一般派彩</small></div
      >
      <div
        ><span>GGR</span><strong>{{ money(record.ggr) }}</strong
        ><small>投注減派彩</small></div
      >
      <div
        ><span>調整金額</span
        ><strong :class="{ danger: record.adjustmentAmount < 0 }">{{
          settlementMoney(record.adjustmentAmount)
        }}</strong
        ><small>差異調整加總</small></div
      >
      <div class="accent"
        ><span>最終應結</span><strong>{{ settlementMoney(record.finalSettlementAmount) }}</strong
        ><small
          >{{ record.snapshot.settlementBasis }} × {{ record.snapshot.ratePercent }}%</small
        ></div
      >
    </div>

    <ElCard shadow="never" class="content-card">
      <ElTabs v-model="activeTab">
        <ElTabPane label="對帳摘要" name="summary">
          <div class="section">
            <div class="section-heading"
              ><div><h2>資料範圍與對象</h2><p>本筆對帳採用的合作方、期間與結算條件。</p></div></div
            >
            <ElDescriptions :column="descriptionColumns" border>
              <ElDescriptionsItem label="對帳編號">{{ record.id }}</ElDescriptionsItem>
              <ElDescriptionsItem label="對帳期間"
                >{{ record.periodStart }} ～ {{ record.periodEnd }}</ElDescriptionsItem
              >
              <ElDescriptionsItem v-if="kind === 'provider'" label="供應商"
                >{{ providerRecord!.providerCode }}｜{{
                  providerRecord!.providerName
                }}</ElDescriptionsItem
              >
              <ElDescriptionsItem v-if="kind === 'merchant'" label="商戶"
                >{{ merchantRecord!.merchantCode }}｜{{
                  merchantRecord!.merchantName
                }}</ElDescriptionsItem
              >
              <ElDescriptionsItem v-if="kind === 'merchant'" label="商戶線路">{{
                merchantRecord!.lineUid
              }}</ElDescriptionsItem>
              <ElDescriptionsItem v-if="kind !== 'provider'" label="代理">{{
                relatedAgent
              }}</ElDescriptionsItem>
              <ElDescriptionsItem v-if="kind === 'agent'" label="納入商戶數">{{
                agentRecord!.merchantCount
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="交易幣別">{{
                record.snapshot.transactionCurrency
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="結算幣別">{{
                record.snapshot.settlementCurrency
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="建立時間">{{ record.createdAt }}</ElDescriptionsItem>
              <ElDescriptionsItem label="更新時間">{{ record.updatedAt }}</ElDescriptionsItem>
            </ElDescriptions>
          </div>
        </ElTabPane>

        <ElTabPane v-if="kind === 'merchant'" label="每日彙總" name="daily">
          <ArtTable
            :data="dailyRows"
            height="auto"
            empty-height="auto"
            empty-text="暫無資料"
            :show-table-header="false"
            style="height: auto"
          >
            <ElTableColumn prop="date" label="日期" width="120" />
            <ElTableColumn prop="betCount" label="投注筆數" width="110" align="right" />
            <ElTableColumn label="投注總額" min-width="140" align="right"
              ><template #default="scope">{{ money(scope.row.betAmount) }}</template></ElTableColumn
            >
            <ElTableColumn label="有效投注" min-width="140" align="right"
              ><template #default="scope">{{ money(scope.row.validBet) }}</template></ElTableColumn
            >
            <ElTableColumn label="派彩" min-width="140" align="right"
              ><template #default="scope">{{
                money(scope.row.payoutAmount)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="GGR" min-width="130" align="right"
              ><template #default="scope">{{ money(scope.row.ggr) }}</template></ElTableColumn
            >
            <ElTableColumn label="應結金額" min-width="140" align="right"
              ><template #default="scope"
                ><strong>{{ settlementMoney(scope.row.settlementAmount) }}</strong></template
              ></ElTableColumn
            >
          </ArtTable>
        </ElTabPane>

        <ElTabPane v-if="kind === 'merchant'" label="遊戲彙總" name="games">
          <ArtTable
            :data="gameRows"
            height="auto"
            empty-height="auto"
            empty-text="暫無資料"
            :show-table-header="false"
            style="height: auto"
          >
            <ElTableColumn label="遊戲" min-width="220"
              ><template #default="scope"
                ><strong>{{ scope.row.gameName }}</strong
                ><br /><small>{{ scope.row.gameCode }}</small></template
              ></ElTableColumn
            >
            <ElTableColumn prop="betCount" label="投注筆數" width="110" align="right" />
            <ElTableColumn label="有效投注" min-width="140" align="right"
              ><template #default="scope">{{ money(scope.row.validBet) }}</template></ElTableColumn
            >
            <ElTableColumn label="派彩" min-width="140" align="right"
              ><template #default="scope">{{
                money(scope.row.payoutAmount)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="GGR" min-width="130" align="right"
              ><template #default="scope">{{ money(scope.row.ggr) }}</template></ElTableColumn
            >
            <ElTableColumn label="應結金額" min-width="140" align="right"
              ><template #default="scope"
                ><strong>{{ settlementMoney(scope.row.settlementAmount) }}</strong></template
              ></ElTableColumn
            >
          </ArtTable>
        </ElTabPane>

        <ElTabPane v-if="kind === 'agent'" label="商戶對帳" name="merchants">
          <ArtTable
            :data="includedMerchants"
            height="auto"
            empty-height="auto"
            empty-text="暫無資料"
            :show-table-header="false"
            style="height: auto"
          >
            <ElTableColumn label="商戶／線路" min-width="240"
              ><template #default="scope"
                ><button
                  class="primary-link"
                  type="button"
                  @click="router.push(`/finance/reconciliation/merchants/${scope.row.id}`)"
                  ><strong>{{ scope.row.merchantName }}</strong
                  ><small>{{ scope.row.lineUid }} · {{ scope.row.id }}</small></button
                ></template
              ></ElTableColumn
            >
            <ElTableColumn label="有效投注" min-width="140" align="right"
              ><template #default="scope">{{
                moneyWithCurrency(scope.row.validBet, scope.row.currency)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="GGR" min-width="130" align="right"
              ><template #default="scope">{{
                moneyWithCurrency(scope.row.ggr, scope.row.currency)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="狀態" width="115"
              ><template #default="scope"
                ><ElTag :type="statusType(scope.row.status)">{{
                  statusLabel(scope.row.status)
                }}</ElTag></template
              ></ElTableColumn
            >
          </ArtTable>
        </ElTabPane>

        <ElTabPane label="結算單" name="statement">
          <div class="section">
            <div class="section-heading"
              ><div
                ><h2>{{ kindLabel.replace('對帳', '') }}結算單</h2
                ><p>結算單直接隸屬本筆對帳，不再使用獨立側欄頁面。</p></div
              ></div
            >
            <ElDescriptions :column="descriptionColumns" border>
              <ElDescriptionsItem label="結算單編號">{{
                settlementStatement.id
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="狀態">{{ settlementStatement.status }}</ElDescriptionsItem>
              <ElDescriptionsItem label="交易幣別">{{
                record.snapshot.transactionCurrency
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="結算幣別">{{
                record.snapshot.settlementCurrency
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="原始應結">{{
                settlementMoney(record.initialSettlementAmount)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="差異與尾差調整">{{
                settlementMoney(record.adjustmentAmount)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="最終應結">{{
                settlementMoney(record.finalSettlementAmount)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="確認金額">{{
                record.confirmedSettlementAmount === undefined
                  ? '尚未確認'
                  : settlementMoney(record.confirmedSettlementAmount)
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="確認說明">{{
                record.confirmationNote || '—'
              }}</ElDescriptionsItem>
              <ElDescriptionsItem label="建立時間">{{ record.createdAt }}</ElDescriptionsItem>
            </ElDescriptions>
            <ElAlert
              v-if="record.status === 'Pending Confirmation'"
              type="info"
              :closable="false"
              title="完成差異處理後，在確認對帳時輸入實收／實付金額；系統會把尾差記入本張結算單。"
            />
          </div>
        </ElTabPane>

        <ElTabPane :label="`差異（${record.differenceCount}）`" name="differences">
          <div class="section-heading"
            ><div><h2>差異案件</h2><p>差異未清除前，對帳不能進入確認與結算。</p></div
            ><ElButton type="primary" plain @click="openDifferences">集中處理差異</ElButton></div
          >
          <ArtTable
            :data="recordDifferences"
            empty-text="本筆對帳沒有差異"
            height="auto"
            empty-height="auto"
            :show-table-header="false"
            style="height: auto"
          >
            <ElTableColumn prop="id" label="差異編號" width="135" />
            <ElTableColumn label="類型" width="120"
              ><template #default="scope">{{
                differenceTypeLabel(scope.row.type)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="系統值" min-width="140" align="right"
              ><template #default="scope">{{
                money(scope.row.systemValue)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="合作方值" min-width="140" align="right"
              ><template #default="scope">{{
                money(scope.row.partnerValue)
              }}</template></ElTableColumn
            >
            <ElTableColumn label="差異" min-width="130" align="right"
              ><template #default="scope"
                ><strong class="danger">{{ money(scope.row.differenceAmount) }}</strong></template
              ></ElTableColumn
            >
            <ElTableColumn label="狀態" width="110"
              ><template #default="scope">{{
                differenceStatusLabel(scope.row.status)
              }}</template></ElTableColumn
            >
          </ArtTable>
        </ElTabPane>

        <ElTabPane label="計算快照" name="snapshot">
          <ElAlert
            v-if="!record.snapshot.contractReferences?.length"
            title="此為舊版演示快照，未保存合約版本引用。不可把目前合約補標為歷史計算依據。"
            type="warning"
            :closable="false"
          />
          <template v-if="kind !== 'provider'">
            <ElButton class="my-4" @click="inspectContracts">檢查期間合約與注單引用</ElButton>
            <template v-if="betReferences">
              <ElAlert
                :closable="false"
                type="warning"
                :title="`依下注時間選版（${betReferences.timezone}）：目前 ${betReferences.matchedCount} 筆／對帳記載 ${betReferences.expectedBetCount} 筆；尚未進行金額計算。`"
              />
              <p v-if="!betReferences.complete">明細不完整或引用有誤，禁止以彙總金額分攤補算。</p>
              <ArtTable :data="betReferences.references" height="auto" style="height: auto">
                <ElTableColumn prop="transactionId" label="注單 ID" min-width="160" />
                <ElTableColumn prop="timestamp" label="下注時間" min-width="220" />
                <ElTableColumn label="合約版本／費率" min-width="200"
                  ><template #default="{ row }"
                    >{{ row.contract.contractKey }} · V{{ row.contract.version }} ·
                    {{ row.contract.rate }}%</template
                  ></ElTableColumn
                >
              </ArtTable>
              <p
                v-for="(issue, index) in [...betReferences.issues, ...betReferences.excluded]"
                :key="index"
                >{{ issue.betId }}：{{ issue.reason }}</p
              >
            </template>
            <ElAlert v-if="contractError" :title="contractError" type="error" :closable="false" />
            <template v-if="contractCoverage.length">
              <p
                >以下依目前合約紀錄檢查日期覆蓋，僅供核對，不是此對帳單的歷史快照，也未重算金額。期間為起日含、迄日不含。</p
              >
              <ArtTable :data="contractCoverage" height="auto" style="height: auto">
                <ElTableColumn prop="from" label="起日" width="120" />
                <ElTableColumn prop="toExclusive" label="迄日（不含）" width="140" />
                <ElTableColumn label="合約引用" min-width="230"
                  ><template #default="{ row }">{{
                    row.reference
                      ? `${row.reference.contractKey} · V${row.reference.version}`
                      : row.error
                  }}</template></ElTableColumn
                >
                <ElTableColumn label="費率／基礎" min-width="150"
                  ><template #default="{ row }">{{
                    row.reference ? `${row.reference.rate}% · ${row.reference.basis}` : '不可計算'
                  }}</template></ElTableColumn
                >
              </ArtTable>
            </template>
          </template>
          <div class="section-heading"
            ><div
              ><h2>結算計算快照</h2
              ><p>固定保存當期費率、匯率、精度與公式版本，避免日後設定異動影響歷史結果。</p></div
            ></div
          >
          <ElDescriptions :column="descriptionColumns" border>
            <ElDescriptionsItem label="結算基礎">{{
              record.snapshot.settlementBasis
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="費率">{{ record.snapshot.ratePercent }}%</ElDescriptionsItem>
            <ElDescriptionsItem label="匯率"
              >1 {{ record.snapshot.transactionCurrency }} = {{ record.snapshot.exchangeRate }}
              {{ record.snapshot.settlementCurrency }}</ElDescriptionsItem
            >
            <ElDescriptionsItem label="匯率來源">{{
              record.snapshot.exchangeRateSource
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="匯率時間">{{
              record.snapshot.exchangeRateTime
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="金額精度"
              >小數 {{ record.snapshot.amountPrecision }} 位</ElDescriptionsItem
            >
            <ElDescriptionsItem label="捨入規則">{{
              record.snapshot.roundingRule
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="公式版本">{{
              record.snapshot.formulaVersion
            }}</ElDescriptionsItem>
            <ElDescriptionsItem label="計算時間">{{
              record.snapshot.calculatedAt
            }}</ElDescriptionsItem>
          </ElDescriptions>
        </ElTabPane>

        <ElTabPane label="操作紀錄" name="logs">
          <ElTimeline>
            <ElTimelineItem v-for="log in logs" :key="log.id" :timestamp="log.time" placement="top">
              <strong>{{ log.action }}</strong
              ><p>{{ log.reason }}</p
              ><small>{{ log.before }} → {{ log.after }} · {{ log.operator }}</small>
            </ElTimelineItem>
          </ElTimeline>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <ElDialog v-model="confirmDialogVisible" title="確認對帳與結算金額" width="min(520px, 92vw)">
      <ElAlert
        type="warning"
        :closable="false"
        title="確認後將鎖定本期對帳依據；尾數或實際收付差額會新增為本次確認調整。"
      />
      <ElForm label-position="top" class="confirm-form">
        <ElFormItem :label="kind === 'merchant' ? '實收金額' : '實付金額'" required>
          <ElInputNumber
            v-model="confirmationForm.actualAmount"
            :min="0"
            :precision="record.snapshot.amountPrecision"
            controls-position="right"
            class="full-width"
          />
          <small>預計金額：{{ settlementMoney(expectedBeforeConfirmation) }}</small>
        </ElFormItem>
        <ElFormItem label="確認差額">
          <strong :class="{ danger: confirmationDelta < 0 }">{{
            settlementMoney(confirmationDelta)
          }}</strong>
        </ElFormItem>
        <ElFormItem label="確認說明">
          <ElInput
            v-model="confirmationForm.note"
            type="textarea"
            :rows="3"
            placeholder="例如：依對方付款尾數調整、銀行實收金額"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="confirmDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitConfirmation">確認並鎖定金額</ElButton>
      </template>
    </ElDialog>
  </div>
  <ElResult v-else icon="warning" title="找不到對帳資料"
    ><template #extra
      ><ElButton type="primary" @click="router.back()">返回列表</ElButton></template
    ></ElResult
  >
</template>

<script setup lang="ts">
  import { useFinanceMoney } from '@/hooks/business/useFinanceMoney'
  import { ElMessage } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useFinanceCenterStore } from '@/store/modules/financeCenter'
  import type {
    AgentReconciliationRecord,
    MerchantReconciliationRecord,
    ProviderReconciliationRecord
  } from '@/types/game-provider'

  defineOptions({ name: 'FinanceReconciliationDetail' })
  const route = useRoute()
  const router = useRouter()
  const store = useFinanceCenterStore()
  const { width } = useWindowSize()
  type ReconciliationKind = 'provider' | 'agent' | 'merchant'
  type ReconciliationRecord =
    | ProviderReconciliationRecord
    | AgentReconciliationRecord
    | MerchantReconciliationRecord
  const kind = computed<ReconciliationKind>(() =>
    String(route.name).startsWith('Provider')
      ? 'provider'
      : String(route.name).startsWith('Agent')
        ? 'agent'
        : 'merchant'
  )
  const providerRecord = computed(() =>
    kind.value === 'provider'
      ? store.findProviderReconciliation(String(route.params.id))
      : undefined
  )
  const merchantRecord = computed(() =>
    kind.value === 'merchant'
      ? store.findMerchantReconciliation(String(route.params.id))
      : undefined
  )
  const agentRecord = computed(() =>
    kind.value === 'agent' ? store.findAgentReconciliation(String(route.params.id)) : undefined
  )
  const record = computed<ReconciliationRecord | undefined>(
    () => providerRecord.value || merchantRecord.value || agentRecord.value
  )
  const kindLabel = computed(() =>
    kind.value === 'provider' ? '供應商對帳' : kind.value === 'agent' ? '代理對帳' : '商戶對帳'
  )
  const subjectName = computed(
    () =>
      providerRecord.value?.providerName ||
      merchantRecord.value?.merchantName ||
      agentRecord.value?.agentName ||
      ''
  )
  const subjectCode = computed(
    () =>
      providerRecord.value?.providerCode ||
      merchantRecord.value?.lineUid ||
      agentRecord.value?.agentCode ||
      ''
  )
  const relatedAgent = computed(() => {
    const target = merchantRecord.value || agentRecord.value
    return target ? `${target.agentId}｜${target.agentName}` : '—'
  })
  const volumeHint = computed(() =>
    kind.value === 'provider'
      ? `${record.value?.betCount.toLocaleString() || 0} 筆交易`
      : `${record.value?.memberCount.toLocaleString() || 0} 位會員`
  )
  const activeTab = ref('summary')
  const contractCoverage = ref<ReturnType<typeof store.previewContractCoverage>>([])
  const contractError = ref('')
  const betReferences = ref<ReturnType<typeof store.previewMerchantBetReferences>>()
  watch(
    () => route.fullPath,
    () => {
      contractCoverage.value = []
      contractError.value = ''
      betReferences.value = undefined
    }
  )
  const inspectContracts = () => {
    contractCoverage.value = []
    contractError.value = ''
    betReferences.value = undefined
    try {
      if (kind.value !== 'provider' && record.value)
        contractCoverage.value = store.previewContractCoverage(kind.value, record.value.id)
      if (kind.value === 'merchant' && record.value)
        betReferences.value = store.previewMerchantBetReferences(record.value.id)
    } catch (e) {
      contractError.value = e instanceof Error ? e.message : '無法檢查合約'
    }
  }
  const descriptionColumns = computed(() => (width.value < 720 ? 1 : 2))
  const dailyRows = computed(() =>
    merchantRecord.value ? store.getDailyRows(merchantRecord.value) : []
  )
  const gameRows = computed(() =>
    merchantRecord.value ? store.getGameRows(merchantRecord.value) : []
  )
  const includedMerchants = computed(() =>
    agentRecord.value ? store.getIncludedMerchantReconciliations(agentRecord.value) : []
  )
  const recordDifferences = computed(() =>
    record.value ? store.getDifferences(record.value.id) : []
  )
  const logs = computed(() => (record.value ? store.getLogs(record.value.id) : []))
  const settlementStatement = computed(() => {
    const prefix = kind.value === 'provider' ? 'PST' : kind.value === 'agent' ? 'AST' : 'MST'
    const status =
      record.value?.status === 'Locked'
        ? '已完成'
        : record.value?.status === 'Confirmed'
          ? '已確認'
          : '待確認'
    return { id: `${prefix}-${record.value?.id || ''}`, status }
  })
  const confirmBlockReason = computed(() => {
    if (!agentRecord.value) return ''
    const incomplete = includedMerchants.value.filter(
      (item) => !['Confirmed', 'Locked'].includes(item.status)
    ).length
    return incomplete ? `仍有 ${incomplete} 筆商戶對帳尚未確認，代理對帳暫時不能確認。` : ''
  })
  const canConfirm = computed(() => {
    if (
      !record.value ||
      record.value.unresolvedDifferenceCount > 0 ||
      ['Confirmed', 'Locked', 'Cancelled'].includes(record.value.status)
    )
      return false
    if (agentRecord.value)
      return includedMerchants.value.every((item) => ['Confirmed', 'Locked'].includes(item.status))
    return true
  })
  const { money: formatMoney } = useFinanceMoney()
  const moneyWithCurrency = (value: number, currency: string) =>
    formatMoney(value, currency, record.value?.snapshot.amountPrecision)
  const money = (value: number) => moneyWithCurrency(value, record.value?.currency || '')
  const settlementMoney = (value: number) =>
    moneyWithCurrency(value, record.value?.snapshot.settlementCurrency || '')
  const statusLabel = (status: string) =>
    ({
      Draft: '草稿',
      'Pending Confirmation': '待確認',
      Difference: '有差異',
      Confirmed: '已確認',
      Locked: '已鎖定',
      Cancelled: '已取消'
    })[status] || status
  const statusType = (status: string) =>
    status === 'Difference'
      ? 'danger'
      : status === 'Pending Confirmation'
        ? 'warning'
        : status === 'Confirmed'
          ? 'success'
          : status === 'Locked'
            ? 'info'
            : 'primary'
  const differenceTypeLabel = (type: string) =>
    ({
      'Bet Amount': '投注金額',
      'Payout Amount': '派彩金額',
      'Valid Bet': '有效投注',
      Jackpot: '獎池',
      Refund: '退款',
      'Exchange Rate': '匯率',
      Fee: '費用',
      Other: '其他'
    })[type] || type
  const differenceStatusLabel = (status: string) =>
    ({
      Open: '待處理',
      Investigating: '調查中',
      'Waiting Partner': '等待合作方',
      'Waiting Internal': '等待內部',
      Resolved: '已解決',
      Accepted: '已接受',
      Closed: '已關閉'
    })[status] || status
  const openDifferences = () =>
    router.push({
      path: '/finance/reconciliation/differences',
      query: { reconciliationId: record.value?.id }
    })
  const confirmDialogVisible = ref(false)
  const expectedBeforeConfirmation = ref(0)
  const confirmationForm = reactive({ actualAmount: 0, note: '' })
  const confirmationDelta = computed(() =>
    Number((confirmationForm.actualAmount - expectedBeforeConfirmation.value).toFixed(8))
  )
  const openConfirm = () => {
    if (!record.value || !canConfirm.value) return
    expectedBeforeConfirmation.value = record.value.finalSettlementAmount
    confirmationForm.actualAmount = record.value.finalSettlementAmount
    confirmationForm.note = ''
    confirmDialogVisible.value = true
  }
  const submitConfirmation = () => {
    if (!record.value || confirmationForm.actualAmount < 0) return
    const success =
      kind.value === 'provider'
        ? store.confirmProvider(
            record.value.id,
            confirmationForm.actualAmount,
            confirmationForm.note
          )
        : kind.value === 'merchant'
          ? store.confirmMerchant(
              record.value.id,
              confirmationForm.actualAmount,
              confirmationForm.note
            )
          : store.confirmAgent(
              record.value.id,
              confirmationForm.actualAmount,
              confirmationForm.note
            )
    if (success) ElMessage.success('對帳已確認')
    else ElMessage.error('尚未符合確認條件')
    if (success) confirmDialogVisible.value = false
  }
</script>

<style scoped lang="scss">
  .detail-page {
    display: grid;
    gap: 16px;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 12px;
  }

  .metric-grid > div {
    display: grid;
    gap: 5px;
    padding: 16px;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);
  }

  .metric-grid .accent {
    border-color: var(--el-color-primary-light-5);
  }

  .metric-grid span,
  .metric-grid small,
  .section-heading p,
  .primary-link small,
  .el-timeline p,
  .el-timeline small {
    color: var(--art-gray-500);
  }

  .metric-grid strong {
    font-size: 18px;
    color: var(--art-gray-900);
  }

  .danger {
    color: var(--el-color-danger) !important;
  }

  .confirm-form {
    margin-top: 16px;
  }

  .full-width {
    width: 100%;
  }

  .confirm-form small {
    display: block;
    margin-top: 6px;
    color: var(--art-gray-500);
  }

  .content-card :deep(.el-card__body) {
    padding-top: 4px;
  }

  .section {
    display: grid;
    gap: 16px;
  }

  .section-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 10px 0 16px;
  }

  .section-heading h2 {
    margin: 0 0 5px;
    font-size: 17px;
  }

  .section-heading p,
  .el-timeline p {
    margin: 0;
  }

  .primary-link {
    display: grid;
    gap: 4px;
    padding: 0;
    color: var(--el-color-primary);
    text-align: left;
    cursor: pointer;
    background: none;
    border: 0;
  }

  @media (width <= 1180px) {
    .metric-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (width <= 680px) {
    .metric-grid {
      grid-template-columns: 1fr;
    }

    .section-heading {
      flex-direction: column;
      gap: 10px;
      align-items: flex-start;
    }
  }
</style>
