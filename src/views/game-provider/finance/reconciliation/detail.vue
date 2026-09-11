<template>
  <div v-if="record" class="detail-page">
    <ElRadioGroup v-model="documentMode" aria-label="對帳檢視模式">
      <ElRadioButton value="history">歷史單據（原快照）</ElRadioButton>
      <ElRadioButton value="current">新規則月結（本地演示）</ElRadioButton>
    </ElRadioGroup>
    <IntegratedSettlement
      v-if="documentMode === 'current'"
      :key="`${kind}:${record.id}`"
      :kind="kind"
      :owner-id="
        kind === 'provider'
          ? 'platform'
          : kind === 'agent'
            ? agentRecord!.agentId
            : merchantRecord!.merchantId
      "
      :provider-id="providerRecord?.providerId"
      :title="subjectName"
    />
    <template v-else>
      <AppPageHeader
        :title="subjectName"
        :eyebrow="`${kindLabel}詳細`"
        :description="`${record.id} · ${record.period} · ${subjectCode}`"
      >
        <template #actions>
          <ElTag :type="statusType(record.status)" effect="light">{{
            statusLabel(record.status)
          }}</ElTag>

          <ElButton type="primary" :disabled="!canConfirm" @click="openConfirm"
            >核帳／交付</ElButton
          >
        </template>
      </AppPageHeader>

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
                ><div
                  ><h2>資料範圍與對象</h2><p>本筆對帳採用的合作方、期間與結算條件。</p></div
                ></div
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
                ><template #default="scope">{{
                  money(scope.row.betAmount)
                }}</template></ElTableColumn
              >
              <ElTableColumn label="有效投注" min-width="140" align="right"
                ><template #default="scope">{{
                  money(scope.row.validBet)
                }}</template></ElTableColumn
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
                ><template #default="scope">{{
                  money(scope.row.validBet)
                }}</template></ElTableColumn
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

          <ElTabPane v-if="kind === 'provider'" label="遊戲彙總" name="provider-games">
            <ArtTable
              :data="providerGameSummary"
              height="auto"
              empty-height="auto"
              empty-text="本帳期尚無可彙總的遊戲紀錄"
              :show-table-header="false"
              style="height: auto"
            >
              <ElTableColumn label="遊戲" min-width="200"
                ><template #default="{ row }"
                  >{{ row.gameName }}<br /><small>{{ row.gameCode }}</small></template
                ></ElTableColumn
              >
              <ElTableColumn prop="betCount" label="投注筆數" width="110" align="right" />
              <ElTableColumn label="投注流水" min-width="140" align="right"
                ><template #default="{ row }">{{ money(row.betAmount) }}</template></ElTableColumn
              >
              <ElTableColumn label="有效投注" min-width="130" align="right"
                ><template #default="{ row }">{{ money(row.validBet) }}</template></ElTableColumn
              >
              <ElTableColumn label="派彩" min-width="140" align="right"
                ><template #default="{ row }">{{
                  money(row.payoutAmount)
                }}</template></ElTableColumn
              >
              <ElTableColumn label="GGR" min-width="140" align="right"
                ><template #default="{ row }">{{
                  money(row.betAmount - row.payoutAmount)
                }}</template></ElTableColumn
              >
              <ElTableColumn label="應結金額" min-width="140" align="right"
                ><template #default="{ row }">{{
                  settlementMoney(row.settlementAmount)
                }}</template></ElTableColumn
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
                <ElDescriptionsItem label="狀態">{{
                  settlementStatement.status
                }}</ElDescriptionsItem>
                <ElDescriptionsItem v-if="kind === 'merchant'" label="收付模式">{{
                  collectionMode === 'AgentCollect' ? '代理統收' : '平台代收'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="實際收款方">{{
                  delivery?.recipient === 'platform' ? '平台' : delivery?.recipient || '尚未交付'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="對帳期間">{{ record.period }}</ElDescriptionsItem>
                <ElDescriptionsItem label="上期累積金額">{{
                  settlementMoney(opening)
                }}</ElDescriptionsItem>
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
                  settlementMoney(delivery?.due ?? record.finalSettlementAmount + opening)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="實收／實付金額">{{
                  record.confirmedSettlementAmount === undefined
                    ? '尚未確認'
                    : settlementMoney(record.confirmedSettlementAmount)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="累積至下期">{{
                  delivery ? settlementMoney(delivery.carry) : '尚未交付'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="交付調整">{{
                  settlementMoney(delivery?.difference || 0)
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="負 GGR 處理"
                  >依當期商務條件；未保存政策的舊單須先核對，不自動清零。</ElDescriptionsItem
                >
                <ElDescriptionsItem label="確認說明">{{
                  record.confirmationNote || '—'
                }}</ElDescriptionsItem>
                <ElDescriptionsItem label="建立時間">{{ record.createdAt }}</ElDescriptionsItem>
              </ElDescriptions>
            </div>
            <ElDivider>計算依據（當期快照）</ElDivider>
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
              <ElDescriptionsItem label="費率"
                >{{ record.snapshot.ratePercent }}%</ElDescriptionsItem
              >
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
              <ElTimelineItem
                v-for="log in logs"
                :key="log.id"
                :timestamp="log.time"
                placement="top"
              >
                <strong>{{ log.action }}</strong
                ><p>{{ log.reason }}</p
                ><small>{{ log.before }} → {{ log.after }} · {{ log.operator }}</small>
              </ElTimelineItem>
            </ElTimeline>
          </ElTabPane>
        </ElTabs>
      </ElCard>

      <ElDialog
        v-model="confirmDialogVisible"
        title="財務核帳／交付"
        class="reconciliation-dialog"
        width="min(560px, 92vw)"
        top="4vh"
      >
        <ElForm label-position="top" class="confirm-form">
          <ElFormItem label="上期累積金額"
            ><ElInput :model-value="settlementMoney(opening)" disabled
          /></ElFormItem>
          <ElFormItem label="系統應結金額"
            ><ElInput :model-value="settlementMoney(record.finalSettlementAmount)" disabled
          /></ElFormItem>
          <ElFormItem label="差異調整金額"
            ><ElInputNumber v-model="confirmationForm.difference" :precision="6" class="full-width"
          /></ElFormItem>
          <ElFormItem label="應收／應付金額"
            ><ElInput :model-value="settlementMoney(due)" disabled
          /></ElFormItem>
          <ElFormItem label="實收／實付金額" required
            ><ElInput v-model="paymentText" inputmode="numeric" class="full-width"
          /></ElFormItem>
          <ElFormItem label="剩餘未收／未付金額"
            ><ElInput :model-value="settlementMoney(remaining)" disabled
          /></ElFormItem>
          <ElFormItem v-if="kind === 'merchant'" label="實際收款方" required>
            <ElSelect v-model="actualRecipient" :disabled="!platformOperator">
              <ElOption v-if="platformOperator" label="平台" value="platform" />
              <ElOption
                v-if="merchantOwner"
                :label="merchantOwner.agentName"
                :value="merchantOwner.agentId"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="交付備註"
            ><ElInput
              v-model="confirmationForm.note"
              type="textarea"
              :rows="3"
              placeholder="請填寫財務核帳調整依據"
          /></ElFormItem>
        </ElForm>
        <template #footer>
          <ElButton @click="confirmDialogVisible = false">取消</ElButton>
          <ElButton @click="submitConfirmation(true)">累積至下期</ElButton>
          <ElButton type="primary" @click="submitConfirmation(false)">確認交付並鎖定</ElButton>
        </template>
      </ElDialog>
    </template>
  </div>
  <ElResult v-else icon="warning" title="找不到對帳資料"
    ><template #extra
      ><ElButton type="primary" @click="router.back()">返回列表</ElButton></template
    ></ElResult
  >
</template>

<script setup lang="ts">
  import { useFinanceMoney } from '@/hooks/business/useFinanceMoney'
  import IntegratedSettlement from '@/components/business/IntegratedSettlement.vue'
  import { ElMessage } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import { useFinanceCenterStore } from '@/store/modules/financeCenter'
  import { useCollectionModeStore } from '@/store/modules/collectionMode'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import { useUserStore } from '@/store/modules/user'
  import { mayDeliver } from '@/domain/collection-mode'
  import { providerReconciliationSamples } from '@/domain/provider-reconciliation-samples'
  import { useProviderDemoStore } from '@/store/modules/providerDemo'
  import type {
    AgentReconciliationRecord,
    MerchantReconciliationRecord,
    ProviderReconciliationRecord
  } from '@/types/game-provider'

  defineOptions({ name: 'FinanceReconciliationDetail' })
  const route = useRoute()
  const router = useRouter()
  const store = useFinanceCenterStore()
  const modeStore = useCollectionModeStore(),
    business = useBusinessPartnerStore(),
    user = useUserStore()
  const actualRecipient = ref('platform')
  const merchantOwner = computed(() =>
    merchantRecord.value ? business.findMerchant(merchantRecord.value.merchantId) : undefined
  )
  const collectionMode = computed(
    () =>
      delivery.value?.collectionMode ||
      (record.value?.status === 'Locked'
        ? merchantOwner.value?.collectionMode || 'AgentCollect'
        : undefined) ||
      (merchantOwner.value
        ? modeStore.at(
            merchantOwner.value.id,
            record.value?.periodStart.slice(0, 10) || '',
            merchantOwner.value.collectionMode
          )
        : 'PlatformCollect')
  )
  const platformOperator = computed(() =>
    user.info.roles?.some((r) => ['R_SUPER', 'R_ADMIN'].includes(r))
  )
  const providers = useProviderDemoStore()
  const providerGameSummary = computed(() =>
    providerRecord.value
      ? (store.reportActivityRows(providerRecord.value, 'game') ??
        providerReconciliationSamples(providerRecord.value, providers.state.games))
      : []
  )
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
  const documentMode = ref('history')
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
  const canConfirm = computed(
    () =>
      !!record.value &&
      !['Locked', 'Cancelled'].includes(record.value.status) &&
      mayDeliver(
        user.info.roles || [],
        user.info.agentId,
        kind.value,
        merchantOwner.value?.agentId,
        collectionMode.value
      )
  )
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
      Difference: '待確認',
      Confirmed: '已確認',
      Locked: '已鎖定',
      Cancelled: '已取消'
    })[status] || status
  const statusType = (status: string) =>
    status === 'Difference'
      ? 'warning'
      : status === 'Pending Confirmation'
        ? 'warning'
        : status === 'Confirmed'
          ? 'success'
          : status === 'Locked'
            ? 'info'
            : 'primary'
  const confirmDialogVisible = ref(false)
  const confirmationForm = reactive({ actualAmount: 0, difference: 0, note: '' })
  const paymentText = ref('0')
  const paymentAmount = computed(() =>
    /^[0-9]+$/.test(paymentText.value) && Number.isSafeInteger(Number(paymentText.value))
      ? Number(paymentText.value)
      : null
  )
  const delivery = computed(() => store.deliveries.find((d) => d.id === record.value?.id))
  const opening = computed(() => store.deliveryOpening(kind.value, record.value?.id || ''))
  const due = computed(() =>
    Math.trunc(
      (record.value?.finalSettlementAmount || 0) + opening.value + confirmationForm.difference
    )
  )
  const remaining = computed(() => Number((due.value - (paymentAmount.value ?? 0)).toFixed(6)))
  const openConfirm = () => {
    actualRecipient.value =
      collectionMode.value === 'AgentCollect'
        ? merchantOwner.value?.agentId || 'platform'
        : 'platform'
    if (!canConfirm.value) return
    confirmationForm.actualAmount = 0
    paymentText.value = '0'
    confirmationForm.difference = 0
    confirmationForm.note = ''
    confirmDialogVisible.value = true
  }
  const submitConfirmation = (defer = false) => {
    if (paymentAmount.value === null) {
      ElMessage.error('實收／實付請輸入非負整數')
      return
    }
    if (!record.value) return
    try {
      store.deliverReconciliation(
        kind.value,
        record.value.id,
        paymentAmount.value,
        confirmationForm.difference,
        confirmationForm.note,
        defer,
        actualRecipient.value
      )
      ElMessage.success('已交付並鎖定原單')
      confirmDialogVisible.value = false
    } catch (e) {
      ElMessage.error(e instanceof Error ? e.message : '交付失敗')
    }
  }
</script>

<style scoped lang="scss">
  .detail-page {
    display: grid;
    align-content: start;
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
    background: transparent;
    border: 0;
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
  :deep(.reconciliation-dialog .el-dialog__body) {
    max-height: 65vh;
    overflow-y: auto;
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
