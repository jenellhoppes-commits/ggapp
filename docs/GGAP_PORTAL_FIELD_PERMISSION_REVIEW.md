# 三端欄位與權限核對／開發前檢核 v0.5

## 開發狀態更新（2026-09-07，優先於以下開發前檢核）

本次使用者已核准開始第一階段原型。查看所有下級及商戶、僅修改直屬下一級代理及直屬商戶費率；下級費率 ≤ 上級取得費率，不需審核。每次變更必填生效日期，未變更沿用原版本，不覆蓋歷史對帳單。下文相應待決策內容已定案。

已新增代理演示身分 agentId、範圍查詢頁、直屬費率編輯、版本追加及未來上下級費率檢查。v0.5 已將共用合約讀取接入總後台列表／歷史，保存總後台基礎合約，依平台日期統一目前版本；瀏覽器測試驗證代理儲存後總後台可見且重整保留。G01 只完成前端綁定，後端仍缺；G04 正式結算版本串接仍缺。其他商戶頁、報表與財務能力未宣稱完成；未推送部署。詳細交付界線見主規格 v0.5 首節。

日期：2026-09-07。依目前工作區原始碼檢查；本次僅更新文件，不開發功能、不部署。

## 1. 審查結論

**可確認資料模型與畫面來源，但尚不可宣告兩端規格全部核准。** 以下將「程式現況」「建議權限」「缺口／待決策」分開。總後台已有欄位不代表代理／商戶可見，也不代表總後台現有演示公式或精度就是正式規格。

本文件補充 `GGAP_AGENT_MERCHANT_PORTAL_SPEC.md`。若先前摘要寫「直接共用欄位」，應解讀為可引用資料概念與元件，不可直接共用整份回應資料或管理者操作。

## 2. 欄位來源對照

最新更正：代理可看授權下級代理與商戶，可修改其費率；其他設定及對帳單不可強制更改。取代「代理不含下級、全部唯讀」。商戶端權限不因此擴大，平台時區規則不變。其他帳務操作、層級深度、費率界線及細部欄位白名單仍待定；不自動開放付款、任意調帳或整份合約修改。授權必須由後端驗證，不信任前端 ID；未核准欄位與操作預設拒絕。

| 模組／欄位 | 現有總後台模型或來源 | 代理端建議 | 商戶端建議 | 尚須處理 |
| --- | --- | --- | --- | --- |
| 代理識別／名稱 | `AgentRecord.id/code/name` | 自身唯讀 | 不展示代理內部資料；對接窗口另定 | 登入回應缺 agentId |
| 代理層級／上層 | `level/parentAgentId` | 可看授權下級，不修改層級／歸屬設定 | 不提供 | 層級深度與歷史歸屬待定 |
| 商戶識別／名稱 | `MerchantRecord.id/code/name/brandName` | 授權歸屬商戶唯讀 | 自身唯讀 | 統一跨模組識別與租戶約束 |
| 商戶歸屬 | `MerchantRecord.agentId/agentName` | 用於服務端範圍判定 | 非必要不展示 | 目前關係不含歸屬期間，不能直接決定歷史可見性 |
| 商戶狀態／更新時間 | `MerchantRecord.status/updatedAt` | 歸屬商戶唯讀 | 自身唯讀 | 兩端不得直接搬入總後台暫停／恢復按鈕 |
| 連絡方式／備註 | `contact/email/note` 等 | 僅核准的商務連絡欄位；內部備註不提供 | 自身可見欄位另定，首版不修改 | 私密備註與外部可見備註須分離 |
| Wallet 模式 | `MerchantRecord.walletMode`、`MerchantLine.walletMode` | 串接摘要必要時唯讀 | 自身唯讀 | 現況由商戶帶入線路，不擅自改成逐線設定 |
| 幣別線 | `MerchantLine.uid/merchantId/currency/status` | 歸屬商戶串接狀態摘要 | 自身線路唯讀 | 交易欄位叫 lineUid；供應商線路 id 不是同一種識別 |
| 環境與串接 | `MerchantLine.environments`、`IntegrationEnvironmentConfig.environment/status` | 只提供進度／結果摘要 | 自身環境、狀態、更新時間 | 不將整份環境設定直接傳到代理端 |
| 回呼／白名單／憑證 | `callbackUrl/ipWhitelist/credential` | 不提供 | 僅自身 GGAP 串接資訊；憑證狀態／遮罩，寫入另定 | 不下發供應商原始憑證；輪替需後端權限與稽核 |
| 遊戲授權 | `MerchantGameConfiguration`、`MerchantLineGameConfiguration` | 摘要數量，非商戶逐遊戲管理權 | 自身已授權遊戲與狀態唯讀 | 不公開 RTP 計畫、限紅或其他內部設定；數量口徑須去重 |
| 會員識別 | `memberId/externalMemberId` | 首版不提供個別會員資料 | 自身會員查詢 | 跨商戶同名 externalMemberId 不可視為同一人 |
| 注單識別與關聯 | `BetCenterRecord.id/roundId/gameId/merchantId/lineUid/transactionIds` | 僅彙總，不開放注單詳情 | 自身唯讀 | 原詳情連結指向管理者路由，需兩端專用授權導覽 |
| 注單金額 | `betAmount/payoutAmount/playerNet/currency` | 僅經核准的營運摘要 | 自身原幣唯讀 | 欄位含義、符號、幣別精度不能靠名稱推定 |
| 注單狀態／時間 | `status/time/settledAt` | 摘要 | 自身唯讀 | 注單 Settled 不等於商戶帳務已確認／付款 |
| 流水識別與關聯 | `TransactionCenterRecord.id/externalReference/betId/parentTransactionId` | 不提供逐筆流水 | 自身唯讀 | 外部參考號、局號與注單號不能混用 |
| 流水金額與餘額 | `amount/currency/beforeBalance/afterBalance/walletMode` | 不提供 | 自身唯讀，餘額依來源明示 | 不把派彩當付款，不開放任意調餘額 |
| 流水狀態／時間 | `type/status/time/completedAt/history` | 不提供 | 自身交易結果及必要歷程 | 稽核 note/operator 需外部白名單，不傳完整內部 history |
| 風險／盤面／重播 | `riskStatus/result` | 不提供 | 首版不自動提供；技術異常與內部風險分離 | 總後台存在欄位不代表兩端需新增風控或重播權限 |
| 商戶合約條件 | `MerchantCommercialTerm.settlementBasis/merchantTermPercent/settlementCurrency/settlementCycle/effectiveFrom/version` | 可修改授權商戶費率，非整份合約任意可改 | 自身已生效條件唯讀（待核准） | 欄位語意、費率界線與生效／審核規則另定 |
| 代理合約條件 | `AgentCommercialTerm.ratePercent/settlementBasis/effectiveFrom/version` | 可修改授權下級代理費率，不推定可改自身上游條件 | 不提供 | 層級深度、費率限制、公式與審核仍待定 |
| 商戶對帳 | `MerchantReconciliationRecord.id/periodStart/periodEnd/lineUid/currency/status` | 僅佣金所需的核准來源摘要 | 自身已准許的結果唯讀 | 對帳確認與結算核准不是同一狀態 |
| 計算快照 | `FinanceCalculationSnapshot` | 不提供完整商戶／供應商快照 | 自身需顯示的費率、幣別與匯率快照 | formulaVersion 不是合約版本；缺直接 termId／termVersion 關聯 |
| 結算金額 | `MerchantSettlementStatement.grossAmount/adjustmentAmount/finalAmount` | 不提供完整商戶結算 | 自身唯讀 | 以結算幣別顯示；不可將 grossAmount 直接命名為原交易幣金額 |
| 結算來源／日期 | `reconciliationId/batchId/period/dueDate/paidAt` | 自身佣金所需識別摘要 | 自身必要識別與日期唯讀 | 總後台批次可能跨租戶，不允許沿 batchId 看整批 |
| 代理結算模型 | `AgentSettlementStatement` | 可供後續佣金來源評估，尚不可直接改名使用 | 不提供 | 舊代理結算不等於新佣金模型已核准 |
| 付款狀態 | `SettlementStatementStatus`、`paidAt` | 自身付款結果唯讀 | 自身付款結果唯讀 | 已付／未付金額、部分付款、付款流水須另建完整契約，不能由單一 Paid 推算 |
| 供應商成本條件 | `DemoProvider.terms`／`ProviderTermsVersion` | 不提供 | 不提供 | 僅總後台演示原型；不接兩端正式計費 |

## 3. 必須修正或決策的衝突

### G01：代理身分與歸屬範圍未閉合

來源：`src/api/auth.ts`、`src/types/game-provider.ts`。

- 現況：代理演示角色只有 userId／roles，無 agentId；商戶示範綁定 M00001。
- 條件：正式查詢必須取得服務端驗證的 agentId／merchantId；沒有綁定時拒絕查詢，不能退回全平台。
- 已確認可看下級；授權層級深度與歸屬異動前後歷史資料範圍仍待決策。

### G02：跨模組資料識別不一致

來源：`src/mock/game-provider/report-four-tabs.ts`、`src/composables/useReportFourTabs.ts`、`src/api/auth.ts`。

- 現況：報表演示使用 M1／M2；商戶登入為 M00001。它們是不同示範集合，不存在已確認映射。
- 條件：指定單一商戶資料來源或明確、可驗證的 ID 對照；禁止用字串截短、補零或相似名稱猜映射。
- 驗收：同一商戶總覽、清單、詳情、統計與匯出來源一致；其他商戶不可被帶入。

### G03：金額精度尚未真正全域一致

來源：`src/views/game-provider/transactions/bets/index.vue`、`transactions/records/index.vue`。

- 現況：兩頁 money 函式仍固定 minimumFractionDigits／maximumFractionDigits 為 2。
- 條件：新兩端不可照搬；先定義每幣別精度、已確認帳務快照優先序與原幣／結算幣的格式契約。
- 驗收：零位、兩位及多位小數幣別，以及負數、明確 0、未設定分別測試；不可僅驗證 TWD。

### G04：合約版本與帳務快照沒有完整引用

來源：`FinanceCalculationSnapshot`、`MerchantSettlementStatement`、`AgentSettlementStatement`。

- 現況：快照有 ratePercent、formulaVersion、exchangeRate、精度／捨入資訊；不能由 formulaVersion 推定 termVersion。結算單含 reconciliationId，但不直接包含合約版本。
- 條件：核准來源鏈「結算單→對帳→適用合約版本／分段→匯率與公式快照」的資料契約，缺失時不能假裝可追溯。
- 待決策：代理／商戶是否採供應商已確認的生效日規則、跨期退款及歷史更正方法。

### G05：費率基礎與帳期枚舉不同

來源：`src/domain/provider-terms.ts`、`src/types/game-provider.ts`。

- 供應商原型：GGR／ValidBet／Fixed，日／週／月。
- 舊商務模型：GGR／Valid Bet／Turnover，日／週／半月／月。
- 條件：逐一核對語意；ValidBet 與 Valid Bet 可能可映射，但 Fixed 與 Turnover 並不等價，不得直接替換。帳期亦不自動刪除半月或加入固定每日。

### G06：狀態名稱不能混用

- 注單：In Progress／Settled／Cancelled／Refunded／Exception。
- 流水：Processing／Success／Failed／Refunded／Rolled Back／Exception。
- 結算單：Draft／Pending Review／Approved／Paid／Voided。
- 合約：舊商務模型 Draft／Scheduled／Active／Expired／Disabled；供應商原型按日期顯示生效中／待生效／歷史版本，不是同一狀態機。
- 條件：每個物件獨立狀態與操作權限；注單 Settled、流水 Success、結算 Approved 都不能顯示為已付款。

### G07：統計口徑不可沿用示意值

- 來源：`src/views/portals/dashboard/index.vue` 的固定統計、`src/views/game-provider/merchants/index.vue` 的 enabledGames formatter。
- 現況：兩端總覽為固定文字；總後台商戶開通遊戲數取各線 enabledGames 的最大值，不是跨線遊戲 ID 去重總數。
- 條件：定義指標的範圍、環境、日期、時間欄位與去重鍵；不可把 max 值直接標為已授權遊戲總數。

### G08：資料安全與操作差異

- 共用 ElTable、欄位名稱或前端 selector 不等於後端隔離。總後台列表詳情 URL、整批帳務、稽核原文與操作按鈕不可照搬。
- 代理可查詢授權下級與商戶並調整費率，不可藉此改其他設定或強制改對帳單；其他帳務操作須逐項核准。匯出、細部遮罩和既有試玩例外仍依各自限制。
- 條件：每頁列出資料與操作白名單；未決策的寫入、匯出與敏感欄位一律不開放。

## 4. 開發前關卡

| 關卡 | 通過證據 | 本次狀態 |
| --- | --- | --- |
| 欄位存在與來源 | 原始碼模型／實際頁面欄位對照 | 已完成首輪；本文件列明缺口 |
| 角色與主體識別 | 後端身分契約、agentId／merchantId 綁定 | 未完成；G01／G02 |
| 可見／可改／可匯出權限 | 使用者核准三端白名單 | 代理下級／商戶費率修改已確認；其他帳務權限與欄位待定，匯出未開放 |
| 指標／狀態／日期口徑 | 每個指標定義、枚舉及時區／精度規則 | 部分有來源，G03／G06／G07 未完成 |
| 財務正確性 | 公式、合約引用、匯率、帳期與付款規則核准 | 未完成；G04／G05 |
| 安全與功能驗收 | 多角色、多租戶、直連／匯出越權及查詢一致性案例 | 驗收要求已列，尚未執行新兩端功能驗收 |

**放行原則：已放行第一階段代理範圍及費率版本原型。** 正式 API 隔離、財務結算及其他商戶功能仍需各自前置關卡，不能因原型可操作就提前開放計算或付款。

## 5. 本次確認與保留事項

1. 已確認代理可以看全部下級及其商戶、自身直屬商戶；歸屬異動後歷史可見性仍待定。
2. 已確認代理可修改授權下級代理與商戶費率，但不可修改其他設定或強制改寫對帳單。其他帳務權限逐項定義，不能推定全部開放。商戶端與既有試玩例外另依原規格。
3. 已確認兩端報表日期統一採平台時區；商戶 timezone 不默默改變查詢口徑。時間欄位、區間邊界與帳期規則仍待定。

上述確認已允許第一階段原型，不代表財務公式或全量開發自動獲准；其餘 G01–G08 按所屬模組完成前置定案。

## 6. 來源索引

- `src/api/auth.ts`；`src/router/modules/portals.ts`。
- `src/types/game-provider.ts`：AgentRecord、MerchantRecord、MerchantLine、商務條件、注單／流水、FinanceCalculationSnapshot 與結算單模型。
- `src/views/game-provider/merchants/index.vue`；`src/views/game-provider/transactions/bets/index.vue`；`src/views/game-provider/transactions/records/index.vue`。
- `src/views/game-provider/finance/settlement/statements/settlement-table.vue`。
- `src/mock/game-provider/report-four-tabs.ts`；`src/composables/useReportFourTabs.ts`。
- `src/domain/provider-terms.ts`；`src/views/portals/dashboard/index.vue`。

本版新增代理原型及領域／瀏覽器測試，沒有執行正式帳務、推送或部署。測試通過不等於上述正式後端與財務缺口已解決。
