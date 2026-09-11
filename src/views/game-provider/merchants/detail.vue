<template>
  <div class="merchant-detail">
    <ElCard class="hero-card">
      <AppPageHeader
        :title="merchant.name"
        eyebrow="商戶詳細資料"
        :description="`${merchant.code} · 商戶 ID：${merchant.id}`"
        :status="currentStatus"
      >
        <template #meta>
          <div class="hero-meta">
            <span><ArtSvgIcon icon="ri:node-tree" />{{ merchant.agentName }}</span>
            <span><ArtSvgIcon icon="ri:wallet-3-line" />{{ merchant.walletMode }}</span>
            <span><ArtSvgIcon icon="ri:global-line" />{{ merchant.timezone }}</span>
          </div>
        </template>
        <template #actions>
          <ElButton
            @click="
              router.push({
                path: '/business/reports',
                query: { tab: 'merchants', merchant: merchant.id }
              })
            "
            >查看報表</ElButton
          >
          <ElButton @click="router.push('/business/merchants')">返回列表</ElButton>
          <ElButton @click="openEdit">編輯基本資料</ElButton>
          <ElButton type="primary" @click="addLineVisible = true">新增線路</ElButton>
          <ElButton
            :type="merchant.status === 'Suspended' ? 'success' : 'danger'"
            plain
            @click="impactVisible = true"
          >
            {{ merchant.status === 'Suspended' ? '恢復商戶' : '暫停商戶' }}
          </ElButton>
        </template>
      </AppPageHeader>
    </ElCard>

    <div class="summary-grid">
      <ElCard v-for="item in summary" :key="item.label" shadow="never">
        <p>{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </ElCard>
    </div>

    <ElCard class="tabs-card">
      <ElTabs v-model="activeTab" @tab-change="syncTab">
        <ElTabPane label="基本資料" name="profile">
          <div class="tab-panel overview-grid">
            <ElDescriptions :column="descriptionColumns" border>
              <ElDescriptionsItem label="商戶 ID">{{ merchant.id }}</ElDescriptionsItem>
              <ElDescriptionsItem label="商戶代碼">{{ merchant.code }}</ElDescriptionsItem>
              <ElDescriptionsItem label="所屬代理">
                <EntityLink
                  :label="merchant.agentName"
                  :secondary="merchant.agentId"
                  :to="`/business/agents/${merchant.agentId}`"
                />
              </ElDescriptionsItem>
              <ElDescriptionsItem label="錢包模式">{{ merchant.walletMode }}</ElDescriptionsItem>
              <ElDescriptionsItem label="國家／時區">
                {{ merchant.country }}／{{ merchant.timezone }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="主要聯絡人">{{ merchant.contact }}</ElDescriptionsItem>
              <ElDescriptionsItem label="建立時間">{{ merchant.createdAt }}</ElDescriptionsItem>
              <ElDescriptionsItem label="更新時間">{{ merchant.updatedAt }}</ElDescriptionsItem>
            </ElDescriptions>
            <ElAlert
              title="錢包模式屬於商戶層級，所有商戶線路固定繼承，不可於線路內單獨修改。"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </ElTabPane>

        <ElTabPane label="商務條件" name="commercial">
          <MerchantCollectionMode :merchant-id="merchant.id" :initial="merchant.collectionMode" />
          <SupplierCostConditions
            v-if="merchant.id === String(route.params.id)"
            embedded
            owner="merchant"
            :owner-id="merchant.id"
            :parent-id="merchant.agentId"
          />
        </ElTabPane>

        <ElTabPane label="線路管理" name="lines">
          <div class="tab-panel">
            <MerchantLineTable
              :lines="lines"
              editable
              @add="addLineVisible = true"
              @open="openLine"
            />
          </div>
        </ElTabPane>

        <ElTabPane label="遊戲配置" name="games">
          <div class="tab-panel">
            <ElAlert
              title="聚合平台不設定 RTP。此處為既有配置摘要，不代表各幣別均已開通；請由下方線路入口逐幣確認接入與合約。"
              type="info"
              :closable="false"
              show-icon
            />
            <div class="mt-4">
              <ElButton v-for="item in merchant.lines" :key="item.uid" @click="openLine(item)"
                >{{ item.currency }} · {{ item.uid }} · 線路設定</ElButton
              >
            </div>
            <ArtTable
              :data="gameConfigurations"
              class="mt-4"
              height="auto"
              empty-height="auto"
              :show-table-header="false"
              style="height: auto"
              empty-text="暫無資料"
            >
              <ElTableColumn prop="gameId" label="遊戲 ID" width="110" />
              <ElTableColumn prop="gameName" label="遊戲名稱" min-width="160" />
              <ElTableColumn label="狀態" width="100">
                <template #default="scope">
                  <ElSwitch
                    :model-value="scope.row.enabled"
                    disabled
                    @change="(value) => updateGame(scope.row, { enabled: Boolean(value) })"
                  />
                </template>
              </ElTableColumn>
              <ElTableColumn prop="updatedAt" label="更新時間" min-width="150" />
            </ArtTable>
          </div>
        </ElTabPane>

        <ElTabPane label="串接管理" name="integration">
          <div class="tab-panel">
            <ArtTable
              :data="lines"
              height="auto"
              empty-height="auto"
              :show-table-header="false"
              style="height: auto"
              empty-text="暫無資料"
            >
              <ElTableColumn prop="uid" label="線路 UID" min-width="210" />
              <ElTableColumn prop="currency" label="交易幣別" width="100" />
              <ElTableColumn prop="environment" label="最高環境" width="120" />
              <ElTableColumn label="憑證狀態" width="130">
                <template #default="scope">
                  <GameProviderStatusTag :status="scope.row.credentialStatus" />
                </template>
              </ElTableColumn>
              <ElTableColumn prop="updatedAt" label="更新時間" min-width="150" />
              <ElTableColumn label="操作" width="110">
                <template #default="scope">
                  <ElButton link type="primary" @click="openLine(scope.row)">管理串接</ElButton>
                </template>
              </ElTableColumn> </ArtTable
            >>
          </div>
        </ElTabPane>

        <ElTabPane label="對帳摘要" name="reconciliation">
          <div class="tab-panel">
            <div class="reconciliation-grid">
              <ElCard shadow="never">
                <p>本期預估結算</p>
                <strong>{{ formatMoney(reconciliations[0]?.estimatedSettlement || 0) }}</strong>
                <small>{{ merchant.settlementCurrency }}</small>
              </ElCard>
              <ElCard shadow="never">
                <p>待確認差異</p>
                <strong>{{ Number(merchant.id.slice(-2)) % 3 }}</strong>
                <small>差異須於結算批次完成前處理</small>
              </ElCard>
            </div>
            <ArtTable
              :data="reconciliations"
              class="mt-4"
              height="auto"
              empty-height="auto"
              :show-table-header="false"
              style="height: auto"
              empty-text="暫無資料"
            >
              <ElTableColumn prop="period" label="期間" width="110" />
              <ElTableColumn label="有效投注" min-width="130"
                ><template #default="scope">{{
                  formatMoney(scope.row.validBet)
                }}</template></ElTableColumn
              >
              <ElTableColumn label="GGR" min-width="120"
                ><template #default="scope">{{
                  formatMoney(scope.row.ggr)
                }}</template></ElTableColumn
              >
              <ElTableColumn label="預估結算" min-width="150"
                ><template #default="scope"
                  >{{ formatMoney(scope.row.estimatedSettlement) }}
                  {{ scope.row.currency }}</template
                ></ElTableColumn
              >
              <ElTableColumn label="狀態" width="100"
                ><template #default="scope">{{
                  reconciliationStatusLabel(scope.row.status)
                }}</template></ElTableColumn
              > </ArtTable
            >>
            <ElButton
              class="mt-4"
              type="primary"
              plain
              @click="router.push('/finance/reconciliation/merchants')"
            >
              前往商戶對帳
            </ElButton>
          </div>
        </ElTabPane>

        <ElTabPane label="異動紀錄" name="logs">
          <div class="tab-panel"><AuditTimeline :entries="auditEntries" /></div>
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <ElDrawer v-model="editVisible" title="編輯商戶基本資料" size="min(92vw, 560px)">
      <ElForm label-position="top">
        <div class="form-grid">
          <ElFormItem label="商戶名稱" required><ElInput v-model="editForm.name" /></ElFormItem>
          <ElFormItem label="品牌名稱"><ElInput v-model="editForm.brandName" /></ElFormItem>
          <ElFormItem label="國家／地區" required
            ><ElInput v-model="editForm.country"
          /></ElFormItem>
          <ElFormItem label="時區" required><ElInput v-model="editForm.timezone" /></ElFormItem>
          <ElFormItem label="主要聯絡人" required
            ><ElInput v-model="editForm.contact"
          /></ElFormItem>
          <ElFormItem label="電子信箱"><ElInput v-model="editForm.email" /></ElFormItem>
        </div>
        <ElFormItem label="備註"
          ><ElInput v-model="editForm.note" type="textarea" :rows="3"
        /></ElFormItem>
        <ElFormItem label="修改原因" required><ElInput v-model="editForm.reason" /></ElFormItem>
      </ElForm>
      <template #footer
        ><ElButton @click="editVisible = false">取消</ElButton
        ><ElButton type="primary" @click="saveMerchant">儲存修改</ElButton></template
      >
    </ElDrawer>

    <ElDialog v-model="addLineVisible" title="新增商戶線路" width="min(92vw, 560px)">
      <ElAlert
        :title="`新線路將繼承 ${merchant.walletMode} 錢包模式；草稿不代表該幣別的供應商遊戲已正式開通。`"
        type="info"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <ElForm label-position="top">
        <ElFormItem label="交易幣別" required>
          <ElSelect v-model="newCurrency" filterable class="w-full">
            <ElOption
              v-for="currency in currencies"
              :key="currency"
              :label="currency"
              :value="currency"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="線路 UID">
          <ElInput :model-value="newLineUid" disabled />
        </ElFormItem>
        <ElFormItem label="複製線路設定">
          <ElSelect v-model="copySource" class="w-full" clearable placeholder="選填">
            <ElOption
              v-for="line in lines"
              :key="line.uid"
              :label="`${line.uid} · ${line.currency}`"
              :value="line.uid"
            />
          </ElSelect>
        </ElFormItem>
        <ElCheckbox v-model="createSandbox">同時建立測試環境工作區</ElCheckbox>
      </ElForm>
      <template #footer>
        <ElButton @click="addLineVisible = false">取消</ElButton>
        <ElButton type="primary" :disabled="!newCurrency" @click="addLine">建立草稿</ElButton>
      </template>
    </ElDialog>

    <ImpactPreviewModal
      v-model="impactVisible"
      :title="merchant.status === 'Suspended' ? '恢復商戶影響預覽' : '暫停商戶影響預覽'"
      :summary="
        merchant.status === 'Suspended'
          ? '商戶將恢復啟用；各線路仍需逐條確認後啟用。'
          : `此操作影響 ${lines.length} 條商戶線路；歷史交易與報表仍會保留。`
      "
      :items="impactItems"
      @confirm="submitStatusChange"
    />
  </div>
</template>

<script setup lang="ts">
  import MerchantCollectionMode from '@/components/business/MerchantCollectionMode.vue'
  import SupplierCostConditions from '@/components/business/SupplierCostConditions.vue'
  import { ElMessage } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'
  import type { MerchantGameConfiguration, MerchantLine } from '@/types/game-provider'
  import { useBusinessPartnerStore } from '@/store/modules/businessPartner'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import AuditTimeline from '@/components/business/game-provider/audit-timeline/index.vue'
  import MerchantLineTable from '@/components/business/game-provider/currency-account-table/index.vue'
  import EntityLink from '@/components/business/game-provider/entity-link/index.vue'
  import GameProviderStatusTag from '@/components/business/game-provider/status-tag/index.vue'
  import ImpactPreviewModal from '@/components/business/game-provider/impact-preview-modal/index.vue'

  defineOptions({ name: 'MerchantDetail' })

  const router = useRouter()
  const route = useRoute()
  const store = useBusinessPartnerStore()
  const { width } = useWindowSize()
  const merchant = computed(() => store.findMerchant(String(route.params.id)) || store.merchants[0])
  const lines = computed(() => merchant.value.lines)
  const currentStatus = computed(() => merchant.value.status)
  const activeTab = ref(String(route.query.tab || 'profile'))
  const addLineVisible = ref(false)
  const editVisible = ref(false)
  const impactVisible = ref(false)
  const newCurrency = ref('')
  const copySource = ref('')
  const createSandbox = ref(true)
  const currencies = ['USD', 'TWD', 'SGD', 'PHP', 'THB', 'HKD', 'VND', 'MYR', 'JPY', 'EUR']
  const descriptionColumns = computed(() => (width.value < 760 ? 1 : 2))
  const reconciliations = computed(() => store.getMerchantReconciliations(merchant.value.id))
  const editForm = reactive({
    name: '',
    brandName: '',
    country: '',
    timezone: '',
    contact: '',
    email: '',
    note: '',
    reason: ''
  })
  const newLineUid = computed(() =>
    store.createLineUid(merchant.value.code, newCurrency.value || 'CURRENCY')
  )
  const summary = computed(() => [
    { label: '商戶線路', value: lines.value.length, note: '每條線路固定一個交易幣別' },
    {
      label: '已開通遊戲',
      value: gameConfigurations.value.filter((item) => item.enabled).length,
      note: '商戶層級遊戲配置'
    },
    { label: '錢包模式', value: merchant.value.walletMode, note: '所有線路固定繼承' },
    {
      label: '正式線路',
      value: lines.value.filter((line) => line.environment === 'Production').length,
      note: '已具正式環境'
    }
  ])
  const impactItems = computed(() => [
    { label: '商戶線路', value: lines.value.length },
    {
      label: '正式環境',
      value: lines.value.filter((line) => line.environment === 'Production').length
    },
    { label: '錢包模式', value: merchant.value.walletMode },
    { label: '歷史資料', value: '保留，不受影響' }
  ])
  const gameNames = ['Dragon Vault', 'Neon Tiger', 'Lucky Panda', 'Royal Baccarat', 'Fortune Ox']
  const gameConfigurations = computed(() =>
    store.getMerchantGameConfigurations(merchant.value.id).map((item, index) => ({
      ...item,
      gameName: gameNames[index] || item.gameId
    }))
  )
  const auditEntries = computed(() => store.getMerchantAuditLogs(merchant.value.id))

  const formatMoney = (value: number) => new Intl.NumberFormat('zh-TW').format(value)
  const reconciliationStatusLabel = (status: string) =>
    ({ Pending: '待確認', Difference: '有差異', Confirmed: '已確認', Completed: '已完成' })[
      status
    ] || status

  const openLine = (line: MerchantLine) =>
    router.push(`/business/merchants/${merchant.value.id}/lines/${line.uid}`)
  const syncTab = (tab: string | number) =>
    router.replace({ query: { ...route.query, tab: String(tab) } })
  const openEdit = () => {
    Object.assign(editForm, {
      name: merchant.value.name,
      brandName: merchant.value.brandName || '',
      country: merchant.value.country,
      timezone: merchant.value.timezone,
      contact: merchant.value.contact,
      email: merchant.value.email || '',
      note: merchant.value.note || '',
      reason: ''
    })
    editVisible.value = true
  }
  const saveMerchant = () => {
    if (!editForm.name.trim() || !editForm.contact.trim() || !editForm.reason.trim()) {
      ElMessage.warning('請填寫必要欄位與修改原因')
      return
    }
    store.updateMerchant(
      merchant.value.id,
      {
        name: editForm.name.trim(),
        brandName: editForm.brandName.trim(),
        country: editForm.country.trim(),
        timezone: editForm.timezone.trim(),
        contact: editForm.contact.trim(),
        email: editForm.email.trim(),
        note: editForm.note.trim()
      },
      editForm.reason.trim()
    )
    editVisible.value = false
    ElMessage.success('商戶基本資料已更新')
  }
  const addLine = () => {
    store.addMerchantLine(merchant.value.id, {
      currency: newCurrency.value,
      copySourceUid: copySource.value || undefined,
      createSandbox: createSandbox.value
    })
    addLineVisible.value = false
    newCurrency.value = ''
    copySource.value = ''
    createSandbox.value = true
    ElMessage.success('商戶線路草稿已建立')
  }
  const updateGame = (
    row: MerchantGameConfiguration,
    updates: Partial<Pick<MerchantGameConfiguration, 'enabled'>>
  ) => {
    store.updateMerchantGameConfiguration(
      merchant.value.id,
      row.gameId,
      updates,
      '商戶詳細頁調整遊戲配置'
    )
    ElMessage.success('遊戲配置已更新並同步至線路')
  }
  const submitStatusChange = (payload: { reason: string }) => {
    const nextStatus = merchant.value.status === 'Suspended' ? 'Active' : 'Suspended'
    store.changeMerchantStatus(merchant.value.id, nextStatus, payload.reason)
    ElMessage.success(
      nextStatus === 'Active' ? '商戶已恢復；請逐條確認線路狀態' : '商戶與所屬線路已暫停'
    )
  }
</script>

<style scoped lang="scss">
  .merchant-detail {
    display: grid;
    gap: 16px;
  }

  .hero-card :deep(.el-card__body) {
    padding: 22px 24px;
  }

  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 12px;
    font-size: 13px;
    color: var(--art-gray-600);

    span {
      display: flex;
      gap: 6px;
      align-items: center;
    }
  }

  .summary-grid,
  .reconciliation-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;

    p,
    small {
      margin: 0;
      color: var(--art-gray-600);
    }

    strong {
      display: block;
      margin: 7px 0 5px;
      font-size: 22px;
    }
  }

  .reconciliation-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tab-panel {
    min-height: 360px;
    padding: 16px 2px 6px;
  }

  .overview-grid {
    display: grid;
    gap: 16px;
  }

  .section-toolbar {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;

    h3,
    p {
      margin: 0;
    }

    p {
      margin-top: 5px;
      color: var(--art-gray-600);
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 16px;
  }

  @media (width <= 960px) {
    .summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 640px) {
    .summary-grid,
    .reconciliation-grid,
    .form-grid {
      grid-template-columns: 1fr;
    }

    .section-toolbar {
      flex-direction: column;
    }
  }
</style>
