<template>
  <div v-if="game" class="game-detail-page">
    <AppPageHeader
      :title="game.displayName"
      eyebrow="遊戲中心／遊戲詳細"
      :description="`${game.code} · Game ID ${game.id}`"
      :status="game.status"
    >
      <template #actions>
        <ElButton @click="router.push('/games/management')">返回列表</ElButton>
        <ElButton @click="startBasicEdit">編輯基本資料</ElButton>
        <ElDropdown trigger="click" @command="handleStatusCommand">
          <ElButton type="primary">
            狀態操作
            <ArtSvgIcon icon="ri:arrow-down-s-line" class="ml-1" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem command="activate">啟用遊戲</ElDropdownItem>
              <ElDropdownItem command="maintenance">切換為維護中</ElDropdownItem>
              <ElDropdownItem command="disable" divided>停用遊戲</ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </template>
    </AppPageHeader>

    <div class="status-grid">
      <ElCard shadow="never">
        <span>主檔完整度</span>
        <strong>{{ game.masterComplete ? '已完成' : '待補資料' }}</strong>
        <GameProviderStatusTag :status="game.masterComplete ? 'Active' : 'Pending'" />
      </ElCard>
      <ElCard shadow="never">
        <span>供應商 RTP</span>
        <strong>{{ game.defaultRtp ? `${game.defaultRtp}%` : '未設定' }}</strong>
        <small>唯讀同步資料</small>
      </ElCard>
      <ElCard shadow="never">
        <span>供應商限額</span>
        <strong>唯讀</strong>
        <small>GGAP 不提供控制功能</small>
      </ElCard>
      <ElCard shadow="never">
        <span>使用商戶</span>
        <strong>{{ game.merchantCount }} 家</strong>
        <small>啟用後可供商戶配置</small>
      </ElCard>
    </div>

    <ElAlert
      v-if="!activationReady"
      title="目前尚未符合啟用條件"
      :description="activationMissing.join('、')"
      type="warning"
      :closable="false"
      show-icon
    />

    <ElCard class="detail-card">
      <ElTabs v-model="activeTab" @tab-change="syncTabToRoute">
        <ElTabPane label="基本資料" name="overview">
          <GameBasicPanel :game="game" />
        </ElTabPane>
        <ElTabPane label="供應商原始資料" name="provider-data">
          <ElAlert
            title="供應商 RTP、機率、遊戲結果及限額資料皆為唯讀"
            description="GGAP 只保存同步紀錄，不提供修改供應商內部數值的功能。"
            type="info"
            :closable="false"
            show-icon
          />
          <ElDescriptions :column="2" border class="provider-data">
            <ElDescriptionsItem label="供應商 RTP">
              {{ game.defaultRtp ? `${game.defaultRtp}%` : '未提供' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="同步狀態">
              {{ game.rtpStatus === 'Configured' ? '已同步' : '待同步' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="限額紀錄">
              {{ game.limitPlanCount ? `${game.limitPlanCount} 筆供應商紀錄` : '未提供' }}
            </ElDescriptionsItem>
            <ElDescriptionsItem label="資料權限">唯讀</ElDescriptionsItem>
          </ElDescriptions>
        </ElTabPane>
        <ElTabPane label="異動紀錄" name="logs">
          <GameAuditPanel :game-id="game.id" />
        </ElTabPane>
      </ElTabs>
    </ElCard>

    <ElDialog v-model="activationVisible" title="啟用前檢查" width="560px">
      <ElAlert
        :title="activationReady ? '遊戲已符合啟用條件' : '仍有必要設定未完成'"
        :type="activationReady ? 'success' : 'warning'"
        :closable="false"
        show-icon
      />
      <div class="activation-checks">
        <div v-for="item in activationItems" :key="item.label">
          <ArtSvgIcon
            :icon="item.passed ? 'ri:checkbox-circle-fill' : 'ri:close-circle-fill'"
            :class="item.passed ? 'passed' : 'failed'"
          />
          <span>{{ item.label }}</span>
          <ElTag :type="item.passed ? 'success' : 'warning'" effect="light">
            {{ item.passed ? '完成' : '待設定' }}
          </ElTag>
        </div>
      </div>
      <template #footer>
        <ElButton @click="activationVisible = false">取消</ElButton>
        <ElButton v-if="activationReady" type="primary" @click="confirmActivate">
          確認啟用
        </ElButton>
        <ElButton v-else type="primary" @click="goToMissingSetup">前往完成設定</ElButton>
      </template>
    </ElDialog>
  </div>

  <ElResult v-else icon="warning" title="找不到遊戲資料" sub-title="此遊戲可能已被移除。">
    <template #extra>
      <ElButton type="primary" @click="router.push('/games/management')">返回遊戲列表</ElButton>
    </template>
  </ElResult>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import AppPageHeader from '@/components/business/game-provider/app-page-header/index.vue'
  import GameProviderStatusTag from '@/components/business/game-provider/status-tag/index.vue'
  import { useGameCatalogStore } from '@/store/modules/gameCatalog'
  import type { GameStatus } from '@/types/game-provider'
  import GameBasicPanel from './modules/game-basic-panel.vue'
  import GameAuditPanel from './modules/game-audit-panel.vue'

  defineOptions({ name: 'GameDetail' })

  const route = useRoute()
  const router = useRouter()
  const gameCatalogStore = useGameCatalogStore()
  const activeTab = ref(String(route.query.tab || 'overview'))
  const activationVisible = ref(false)
  const game = computed(() => gameCatalogStore.findGame(String(route.params.id)))
  const activationItems = computed(() => [
    { label: '遊戲主檔資料完整', passed: Boolean(game.value?.masterComplete) },
    { label: '供應商 RTP 已完成同步', passed: game.value?.rtpStatus === 'Configured' }
  ])
  const activationReady = computed(() => activationItems.value.every((item) => item.passed))
  const activationMissing = computed(() =>
    activationItems.value.filter((item) => !item.passed).map((item) => item.label)
  )

  const syncTabToRoute = (tab: string | number) => {
    router.replace({ query: { ...route.query, tab: String(tab) } })
  }

  const startBasicEdit = () => {
    activeTab.value = 'overview'
    router.replace({ query: { ...route.query, tab: 'overview', edit: '1' } })
  }

  const changeStatus = async (status: GameStatus, label: string) => {
    if (!game.value) return
    const confirmed = await ElMessageBox.confirm(
      `確定要將「${game.value.displayName}」切換為${label}嗎？`,
      `${label}確認`,
      { confirmButtonText: '確認', cancelButtonText: '取消', type: 'warning' }
    ).catch(() => false)
    if (!confirmed) return
    gameCatalogStore.updateGame(game.value.id, { status }, `遊戲狀態切換為${label}`)
    ElMessage.success(`已切換為${label}`)
  }

  const handleStatusCommand = (command: string) => {
    if (command === 'activate') {
      activationVisible.value = true
      return
    }
    if (command === 'maintenance') changeStatus('Maintenance', '維護中')
    if (command === 'disable') changeStatus('Disabled', '停用')
  }

  const confirmActivate = () => {
    if (!game.value || !activationReady.value) return
    gameCatalogStore.updateGame(game.value.id, { status: 'Active' }, '通過啟用前完整性檢查')
    activationVisible.value = false
    ElMessage.success('遊戲已啟用')
  }

  const goToMissingSetup = () => {
    activationVisible.value = false
    activeTab.value = game.value?.rtpStatus !== 'Configured' ? 'provider-data' : 'overview'
    syncTabToRoute(activeTab.value)
  }

  watch(
    () => route.query.tab,
    (tab) => {
      if (tab) activeTab.value = String(tab)
    }
  )
</script>

<style scoped lang="scss">
  .game-detail-page {
    display: grid;
    gap: 16px;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    :deep(.el-card__body) {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 7px 12px;
      align-items: center;
      padding: 18px;
    }

    span,
    small {
      color: var(--art-gray-500);
    }

    strong {
      font-size: 20px;
    }

    small {
      grid-column: 1 / -1;
    }
  }

  .detail-card :deep(.el-card__body) {
    padding-top: 8px;
  }

  .provider-data {
    margin-top: 16px;
  }

  .tab-badge {
    margin-left: 8px;

    :deep(.el-badge__content) {
      position: static;
      transform: none;
    }
  }

  .activation-checks {
    display: grid;
    gap: 12px;
    margin-top: 18px;

    > div {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 12px;
      background: var(--art-gray-50);
      border-radius: 8px;
    }

    .passed {
      color: var(--el-color-success);
    }

    .failed {
      color: var(--el-color-warning);
    }
  }

  @media (width <= 900px) {
    .status-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (width <= 560px) {
    .status-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
