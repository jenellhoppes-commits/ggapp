# 總後台逐頁規格與完成度對照 v0.1

> B2 更新：平台管理、財務設定及對帳的 10 個檔案完成第一批共用表格與全域圓角遷移。適用範圍、測試與未驗收項目見 [B2 交付紀錄](C:/Users/user/Desktop/ggap/docs/GGAP_ADMIN_B2_DELIVERY.md)；下方原始逐頁盤點未改作「全部完成」。

> 2026-09-07 B1 更新：供應商／商戶／代理對帳及差異案件已接上 CSV 下載；其他提示型匯出、新增角色／範圍／幣別、商戶批次操作、商戶重新計算均改標示未開放。以下逐頁內容保留修改前盤點，相關操作現況以 [B1 交付紀錄](C:/Users/user/Desktop/ggap/docs/GGAP_ADMIN_B1_DELIVERY.md) 為準，不應將停用入口視為功能完成。

日期：2026-09-07。狀態：**現況初版／驗收候選，尚非核准 PRD**。

本表涵蓋目前總後台的 52 個頁面路由，包含隱藏設定與相容頁，不包含其他入口。先閱讀[總規格與狀態定義](C:/Users/user/Desktop/ggap/docs/GGAP_ADMIN_SPEC_STATUS.md)。頁籤、抽屜和共享元件的動作可能不同，不能以同一來源檔的所有欄位當成每個模式都呈現。

每頁的「驗收候選」均是後續需要驗證的條件，不是已通過聲明。「權限」列的是當前路由限制；正式後端授權與每個動作仍需核准矩陣。欄位目前是功能摘要，必填／長度／唯一性／預設值／遮罩／錯誤訊息尚待逐欄定稿。

## 頁面索引

| 編號 | 頁面 | 入口 | 群組 |
| --- | --- | --- | --- |
| ADM-001 | 儀錶板 | 主選單 | DASH |
| ADM-002 | 代理管理 | 主選單 | AGENT |
| ADM-003 | 新增代理 | 隱藏／詳情／設定 | AGENT |
| ADM-004 | 代理詳細 | 隱藏／詳情／設定 | AGENT |
| ADM-005 | 商戶管理 | 主選單 | MERCHANT |
| ADM-006 | 新增商戶 | 隱藏／詳情／設定 | MERCHANT |
| ADM-007 | 商戶線路詳細 | 隱藏／詳情／設定 | MERCHANT |
| ADM-008 | 商戶線路詳細 | 舊相容 | MERCHANT |
| ADM-009 | 商戶詳細 | 隱藏／詳情／設定 | MERCHANT |
| ADM-010 | 會員與錢包 | 主選單 | MEMBER |
| ADM-011 | 會員詳細 | 隱藏／詳情／設定 | MEMBER |
| ADM-012 | 供應商管理 | 主選單 | PROVIDER |
| ADM-013 | 遊戲管理 | 主選單 | GAME |
| ADM-014 | 供應商詳情 | 隱藏／詳情／設定 | PROVIDER |
| ADM-015 | 遊戲詳情 | 隱藏／詳情／設定 | GAME |
| ADM-016 | 試玩管理 | 主選單 | TRIAL |
| ADM-017 | 注單管理 | 主選單 | BET |
| ADM-018 | 注單詳細 | 隱藏／詳情／設定 | BET |
| ADM-019 | 交易流水 | 主選單 | TX |
| ADM-020 | 交易詳細 | 隱藏／詳情／設定 | TX |
| ADM-021 | 供應商對帳 | 主選單 | RECON |
| ADM-022 | 供應商對帳詳細 | 隱藏／詳情／設定 | RECON |
| ADM-023 | 代理對帳 | 主選單 | RECON |
| ADM-024 | 代理對帳詳細 | 隱藏／詳情／設定 | RECON |
| ADM-025 | 商戶對帳 | 主選單 | RECON |
| ADM-026 | 商戶對帳詳細 | 隱藏／詳情／設定 | RECON |
| ADM-027 | 差異處理 | 主選單 | DIFF |
| ADM-028 | 異動紀錄 | 主選單 | FINLOG |
| ADM-029 | 報表查詢 | 主選單 | REPORT |
| ADM-030 | 開發者中心 | 主選單 | DEV |
| ADM-031 | 維護設定 | 主選單 | MAINT |
| ADM-032 | 匯率管理 | 主選單 | RATE |
| ADM-033 | 白名單／黑名單 | 主選單 | NETWORK |
| ADM-034 | 人員與權限 | 主選單 | ACCESS |
| ADM-035 | 角色管理 | 隱藏／詳情／設定 | ACCESS |
| ADM-036 | 操作權限 | 隱藏／詳情／設定 | ACCESS |
| ADM-037 | 敏感權限 | 隱藏／詳情／設定 | ACCESS |
| ADM-038 | 資料範圍 | 隱藏／詳情／設定 | ACCESS |
| ADM-039 | 操作紀錄 | 隱藏／詳情／設定 | ACCESSLOG |
| ADM-040 | 幣別資料 | 隱藏／詳情／設定 | CURRENCY |
| ADM-041 | 交易幣別 | 隱藏／詳情／設定 | CURRENCY |
| ADM-042 | 結算幣別 | 隱藏／詳情／設定 | CURRENCY |
| ADM-043 | 精度設定 | 隱藏／詳情／設定 | CURRENCY |
| ADM-044 | 語系管理 | 隱藏／詳情／設定 | LOCALE |
| ADM-045 | 國家／地區 | 隱藏／詳情／設定 | LOCALE |
| ADM-046 | 時區管理 | 隱藏／詳情／設定 | LOCALE |
| ADM-047 | 系統基本設定 | 隱藏／詳情／設定 | PARAM |
| ADM-048 | 登入安全 | 隱藏／詳情／設定 | PARAM |
| ADM-049 | 登入紀錄 | 隱藏／詳情／設定 | SYSLOG |
| ADM-050 | 審核紀錄 | 隱藏／詳情／設定 | SYSLOG |
| ADM-051 | 系統異常紀錄 | 隱藏／詳情／設定 | SYSLOG |
| ADM-052 | 功能停用說明 | 停用說明 | RETIRED |

## 逐頁現況與驗收候選

### ADM-001｜儀錶板

- 路由：`/dashboard`；識別：`GameProviderDashboard`。
- 入口：主選單可見。
- 欄位摘要：日期、原幣別、商戶、供應商；下注筆數、投注人數、投注／派彩金額、待辦、平台狀態。
- 操作摘要：查詢／重置、重新整理、指標及待辦跳轉。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：篩選範圍與資源現況分開；空值不可冒充零。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示；資料與互動程式已存在。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：全站時區、資料截止時間與報表口徑需統一；近期移除資訊需求仍須對照目前頁面。待決策 D03,D05。
- 驗收候選：同條件與注單／報表交叉核對；跨日、空資料、異常資料和返回篩選狀態。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-global-consistency、check-navigation（非完整 KPI 對帳驗收）；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/admin-dashboard/index.vue)。

### ADM-002｜代理管理

- 路由：`/business/agents`；識別：`AgentsList`。
- 入口：主選單可見。
- 欄位摘要：代理 ID／代碼／名稱、層級、代理條件、直屬商戶數、狀態；查詢欄位。
- 操作摘要：查詢、建立代理入口、詳情、狀態處理、CSV。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立為草稿；層級限制與條件版本由 businessPartner 管理。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／商務規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：代理詳情直接標示結算公式尚未定案；多層分配、版本生效與差額方向不能從範例值推定。待決策 D02,D04,D06。
- 驗收候選：代碼重複、循環上級、L3 無子代理、條件版本歷史、CSV 等於篩選結果。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；商務逐項狀態驗收待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/agents/index.vue)。

### ADM-003｜新增代理

- 路由：`/business/agents/create`；識別：`AgentCreate`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/business/agents`。
- 欄位摘要：代理代碼／名稱、聯絡人／方式、合作開始日、備註、層級／上級、商務條件。
- 操作摘要：返回、儲存草稿、儲存並進詳情。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立為草稿；層級限制與條件版本由 businessPartner 管理。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／商務規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：代理詳情直接標示結算公式尚未定案；多層分配、版本生效與差額方向不能從範例值推定。待決策 D02,D04,D06。
- 驗收候選：代碼重複、循環上級、L3 無子代理、條件版本歷史、CSV 等於篩選結果。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；商務逐項狀態驗收待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/agents/create.vue)。

### ADM-004｜代理詳細

- 路由：`/business/agents/:id(A[0-9]+)`；識別：`AgentDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/business/agents`。
- 欄位摘要：基本資料、代理關係、商務條件版本、關聯商戶／紀錄。
- 操作摘要：編輯基本資料、建立子代理、調整上級、條件版本及狀態操作。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立為草稿；層級限制與條件版本由 businessPartner 管理。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／商務規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：代理詳情直接標示結算公式尚未定案；多層分配、版本生效與差額方向不能從範例值推定。待決策 D02,D04,D06。
- 驗收候選：代碼重複、循環上級、L3 無子代理、條件版本歷史、CSV 等於篩選結果。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；商務逐項狀態驗收待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/agents/detail.vue)。

### ADM-005｜商戶管理

- 路由：`/business/merchants`；識別：`MerchantsList`。
- 入口：主選單可見。
- 欄位摘要：商戶代碼／名稱、代理、錢包模式、狀態、線路、環境與查詢條件。
- 操作摘要：新增入口、查詢、詳情、CSV；批次操作僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立／審核與暫停等前端狀態；線路沿用商戶級錢包模式。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：列表批次操作僅提示尚未開放；正式環境申請不是正式開通；商務公式待確認。待決策 D02,D04,D07。
- 驗收候選：唯一代碼及線路識別、同幣多線、暫停影響、授權變更與試玩可用性、舊網址。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-batch02 涵蓋授權投影，非全部商戶表單；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/merchants/index.vue)。

### ADM-006｜新增商戶

- 路由：`/business/merchants/create`；識別：`MerchantCreate`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/business/merchants`。
- 欄位摘要：基本資料、代理與商務條件、商戶錢包模式、幣別線路／Sandbox。
- 操作摘要：分步填寫、上一步／下一步、建立並送審（本地）。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立／審核與暫停等前端狀態；線路沿用商戶級錢包模式。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：列表批次操作僅提示尚未開放；正式環境申請不是正式開通；商務公式待確認。待決策 D02,D04,D07。
- 驗收候選：唯一代碼及線路識別、同幣多線、暫停影響、授權變更與試玩可用性、舊網址。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-batch02 涵蓋授權投影，非全部商戶表單；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/merchants/create.vue)。

### ADM-007｜商戶線路詳細

- 路由：`/business/merchants/:merchantId/lines/:lineUid`；識別：`MerchantLineDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/business/merchants`。
- 欄位摘要：商戶／線路 UID／交易幣別、錢包、環境、遊戲路由、串接設定及會員。
- 操作摘要：返回商戶、串接設定、環境申請、遊戲配置、線路啟停。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立／審核與暫停等前端狀態；線路沿用商戶級錢包模式。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：列表批次操作僅提示尚未開放；正式環境申請不是正式開通；商務公式待確認。待決策 D02,D04,D07。
- 驗收候選：唯一代碼及線路識別、同幣多線、暫停影響、授權變更與試玩可用性、舊網址。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-batch02 涵蓋授權投影，非全部商戶表單；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/merchants/currency-detail.vue)。

### ADM-008｜商戶線路詳細

- 路由：`/business/merchants/:merchantId/currencies/:currency`；識別：`LegacyMerchantCurrencyDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/business/merchants`。
- 欄位摘要：舊 merchantId／currency 路徑，使用同一線路詳情元件。
- 操作摘要：相容入口；須驗證多線同幣時解析是否唯一，不另算新功能。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立／審核與暫停等前端狀態；線路沿用商戶級錢包模式。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：相容入口／待驗收。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：列表批次操作僅提示尚未開放；正式環境申請不是正式開通；商務公式待確認。待決策 D02,D04,D07。
- 驗收候選：唯一代碼及線路識別、同幣多線、暫停影響、授權變更與試玩可用性、舊網址。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-batch02 涵蓋授權投影，非全部商戶表單；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/merchants/currency-detail.vue)。

### ADM-009｜商戶詳細

- 路由：`/business/merchants/:id(M[0-9]+)`；識別：`MerchantDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/business/merchants`。
- 欄位摘要：商戶資料、代理、錢包、商務條件版本、線路與遊戲授權。
- 操作摘要：編輯、建立條件、啟用條件、新增線路、遊戲配置、狀態變更。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：建立／審核與暫停等前端狀態；線路沿用商戶級錢包模式。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：列表批次操作僅提示尚未開放；正式環境申請不是正式開通；商務公式待確認。待決策 D02,D04,D07。
- 驗收候選：唯一代碼及線路識別、同幣多線、暫停影響、授權變更與試玩可用性、舊網址。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-batch02 涵蓋授權投影，非全部商戶表單；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/merchants/detail.vue)。

### ADM-010｜會員與錢包

- 路由：`/transactions/members`；識別：`MembersList`。
- 入口：主選單可見。
- 欄位摘要：會員 ID、外部 ID、商戶／代理／線路、幣別、標記／限制摘要與查詢。
- 操作摘要：查詢、匯出、詳情、標記處理。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：一般／測試／白名單／觀察／歷史風控標記；限制流程需核對本期邊界。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／範圍待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：會員限制程式與風控入口停用同時存在，不能直接推論限制能力已核准開放；非真實 Wallet。待決策 D01,D03,D04。
- 驗收候選：會員與商戶／線路歸屬、標記報表排除、限制按鈕與歷史唯讀邊界。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；標記與限制全情境待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/members/index.vue)。

### ADM-011｜會員詳細

- 路由：`/transactions/members/:id(P[0-9]+)`；識別：`MemberDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/transactions/members`。
- 欄位摘要：會員基本資料、遊戲／注單／交易、標記與限制歷史。
- 操作摘要：返回、關聯查詢、標記新增／移除；限制能力依本期邊界驗收。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：一般／測試／白名單／觀察／歷史風控標記；限制流程需核對本期邊界。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／範圍待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：會員限制程式與風控入口停用同時存在，不能直接推論限制能力已核准開放；非真實 Wallet。待決策 D01,D03,D04。
- 驗收候選：會員與商戶／線路歸屬、標記報表排除、限制按鈕與歷史唯讀邊界。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；標記與限制全情境待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/members/detail.vue)。

### ADM-012｜供應商管理

- 路由：`/admin/providers`；識別：`ProvidersList`。
- 入口：主選單可見。高亮歸屬：`/admin/providers`。
- 欄位摘要：供應商 ID／代碼／名稱、狀態、幣別線、環境、錢包能力、端點與憑證示範、設定版本。
- 操作摘要：新增／編輯、線路設定、模擬檢核、啟用／維護／停用、詳情抽屜。
- 權限：路由 R_SUPER／R_ADMIN；另有前端 actor／能力檢查，仍非伺服器授權。
- 狀態與全域設定：能力與授權需同時通過；正式環境仍被演示契約阻擋。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示；有領域測試。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：已通過的是 Mock 能力，不是供應商正式認證；憑證保管與 API 生效未完成。待決策 D04,D07。
- 驗收候選：能力不符拒絕啟用、版本衝突、失敗保留舊設定、詳情深連結及權限。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-core、check-provider-batch02；[來源](C:/Users/user/Desktop/ggap/src/views/provider-hub/index.vue)；[供應商業務元件](C:/Users/user/Desktop/ggap/src/components/business/provider-hub/ProvidersPanel.vue)。

### ADM-013｜遊戲管理

- 路由：`/admin/providers/games`；識別：`GamesList`。
- 入口：主選單可見。高亮歸屬：`/admin/providers/games`。
- 欄位摘要：平台遊戲 ID、來源代碼／名稱、供應商、類型、顯示資料、平台／來源可用性、幣別、版本、同步時間。
- 操作摘要：查詢／排序／分頁、模擬同步、顯示資料儲存、同步紀錄、詳情與試玩。
- 權限：路由 R_SUPER／R_ADMIN；另有前端 actor／能力檢查，仍非伺服器授權。
- 狀態與全域設定：成功／部分失敗／失敗同步情境；可用性須通過供應商、線路、來源與授權交集。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示；有領域測試。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：不等於正式同步排程；圖片有占位，舊 game-provider/games 不代表目前使用頁面。待決策 D03,D04,D07。
- 驗收候選：重跑不重複、人工欄位不覆蓋、部分失敗不刪舊資料、權限交集與原值排序。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-batch02；[來源](C:/Users/user/Desktop/ggap/src/views/provider-hub/index.vue)；[遊戲業務元件](C:/Users/user/Desktop/ggap/src/components/business/provider-hub/GamesPanel.vue)。

### ADM-014｜供應商詳情

- 路由：`/admin/providers/detail/:id(PV[0-9]+)`；識別：`ProviderDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/admin/providers`。
- 欄位摘要：供應商識別、能力、線路、串接設定及紀錄，透過 ProvidersPanel 抽屜呈現。
- 操作摘要：深連結開啟對象、查看／編輯與線路操作（依前端 actor）。
- 權限：路由 R_SUPER／R_ADMIN；另有前端 actor／能力檢查，仍非伺服器授權。
- 狀態與全域設定：能力與授權需同時通過；正式環境仍被演示契約阻擋。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示；有領域測試。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：已通過的是 Mock 能力，不是供應商正式認證；憑證保管與 API 生效未完成。待決策 D04,D07。
- 驗收候選：能力不符拒絕啟用、版本衝突、失敗保留舊設定、詳情深連結及權限。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-core、check-provider-batch02；[來源](C:/Users/user/Desktop/ggap/src/views/provider-hub/index.vue)；[供應商業務元件](C:/Users/user/Desktop/ggap/src/components/business/provider-hub/ProvidersPanel.vue)。

### ADM-015｜遊戲詳情

- 路由：`/admin/providers/games/:id(G[0-9]+)`；識別：`GameDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/admin/providers/games`。
- 欄位摘要：遊戲識別、顯示資料、來源、可用線路與同步／異動資訊，透過 GamesPanel 抽屜呈現。
- 操作摘要：深連結、編輯顯示資料、查看可用性與試玩入口。
- 權限：路由 R_SUPER／R_ADMIN；另有前端 actor／能力檢查，仍非伺服器授權。
- 狀態與全域設定：成功／部分失敗／失敗同步情境；可用性須通過供應商、線路、來源與授權交集。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示；有領域測試。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：不等於正式同步排程；圖片有占位，舊 game-provider/games 不代表目前使用頁面。待決策 D03,D04,D07。
- 驗收候選：重跑不重複、人工欄位不覆蓋、部分失敗不刪舊資料、權限交集與原值排序。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-batch02；[來源](C:/Users/user/Desktop/ggap/src/views/provider-hub/index.vue)；[遊戲業務元件](C:/Users/user/Desktop/ggap/src/components/business/provider-hub/GamesPanel.vue)。

### ADM-016｜試玩管理

- 路由：`/trials/links`；識別：`TrialLinks`。
- 入口：主選單可見。
- 欄位摘要：連結 ID／名称、內部或商戶用途、商戶／供應商／遊戲、幣別、語系、到期、啟動限制、建立人。
- 操作摘要：建立、複製、模擬啟動、停用、重新產生、查看紀錄。
- 權限：路由 R_SUPER／R_ADMIN；另有前端 actor／能力檢查，仍非伺服器授權。
- 狀態與全域設定：有效／失效、到期、停用與替換鏈；新舊連結不得覆寫歷史。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示；有隔離測試。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：分享的是本地演示連結；正式 Session、計費排除與跨裝置隔離未驗收。待決策 D04,D07。
- 驗收候選：過期／次數限制、越權商戶、替換後舊連結失效、歷史 Session 保留。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-provider-demo、check-provider-batch02；[來源](C:/Users/user/Desktop/ggap/src/views/provider-hub/trial-management.vue)；[試玩業務元件](C:/Users/user/Desktop/ggap/src/components/business/provider-hub/DemoLinks.vue)。

### ADM-017｜注單管理

- 路由：`/transactions/bets`；識別：`BetsList`。
- 入口：主選單可見。
- 欄位摘要：注單／局號、會員、商戶、遊戲、線路、幣別、投注／有效投注／派彩、狀態、時間、結果／回放資料。
- 操作摘要：查詢／CSV、詳情、關聯會員／交易、結果與回放展示、複製／匯出結果。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：進行中／已結算／取消／退款／異常；結果與回放取決於提供資料能力。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：正式逐筆來源、重複事件、補單與回放真實性未驗收；歷史風險欄位不等於啟用風控。待決策 D01,D03,D04,D07。
- 驗收候選：局號及交易關聯、重複事件、取消退款計入口徑、CSV、不可回放提示。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；交易端到端待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/transactions/bets/index.vue)。

### ADM-018｜注單詳細

- 路由：`/transactions/bets/:id(B[0-9]+)`；識別：`BetDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/transactions/bets`。
- 欄位摘要：注單／局號、會員、商戶、遊戲、線路、幣別、投注／有效投注／派彩、狀態、時間、結果／回放資料。
- 操作摘要：查詢／CSV、詳情、關聯會員／交易、結果與回放展示、複製／匯出結果。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：進行中／已結算／取消／退款／異常；結果與回放取決於提供資料能力。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：正式逐筆來源、重複事件、補單與回放真實性未驗收；歷史風險欄位不等於啟用風控。待決策 D01,D03,D04,D07。
- 驗收候選：局號及交易關聯、重複事件、取消退款計入口徑、CSV、不可回放提示。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；交易端到端待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/transactions/bets/detail.vue)。

### ADM-019｜交易流水

- 路由：`/transactions/records`；識別：`GameTransactions`。
- 入口：主選單可見。
- 欄位摘要：交易 ID／外部參考、類型／方向、會員、商戶／代理／線路、幣別、金額、餘額、狀態、回應與時間。
- 操作摘要：查詢／CSV、詳情、關聯注單與會員、交易歷程。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：處理中／成功／失敗／退款／回滾／異常。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：正式 Wallet 回應、重送冪等與一致性待服務驗收；跨頁資料來源須核對。待決策 D03,D04,D07。
- 驗收候選：一筆下注對多筆交易、重送不重複、退款回滾關聯、餘額可追溯。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；真實交易整合未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/transactions/records/index.vue)。

### ADM-020｜交易詳細

- 路由：`/transactions/records/:id(TX[0-9]+)`；識別：`TransactionDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/transactions/records`。
- 欄位摘要：交易 ID／外部參考、類型／方向、會員、商戶／代理／線路、幣別、金額、餘額、狀態、回應與時間。
- 操作摘要：查詢／CSV、詳情、關聯注單與會員、交易歷程。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：處理中／成功／失敗／退款／回滾／異常。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：正式 Wallet 回應、重送冪等與一致性待服務驗收；跨頁資料來源須核對。待決策 D03,D04,D07。
- 驗收候選：一筆下注對多筆交易、重送不重複、退款回滾關聯、餘額可追溯。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation；真實交易整合未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/transactions/records/detail.vue)。

### ADM-021｜供應商對帳

- 路由：`/finance/reconciliation/providers`；識別：`ProviderReconciliation`。
- 入口：主選單可見。
- 欄位摘要：對帳 ID／期間、供應商或代理或商戶線路、交易／結算幣別、投注／GGR／應結、差異數、快照／精度／版本、確認金額與原因。
- 操作摘要：查詢／分頁／詳情、差異跳轉、確認對帳；商戶有重新計算入口；清單有匯出／刷新。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：草稿／待確認／差異／已確認／已鎖定／取消；確認前有差異與狀態檢查。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：清單匯出和刷新僅訊息；recalculateMerchant 只更新時間與紀錄，沒有重算金額；期間選项寫死 2026-07／08。待決策 D02,D03,D06。
- 驗收候選：變更來源後重算數字；未解差異不可確認；重複確認、歷史快照、原幣與結算幣、真正下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation、check-global-consistency；全帳期重算未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/reconciliation/index.vue)。

### ADM-022｜供應商對帳詳細

- 路由：`/finance/reconciliation/providers/:id`；識別：`ProviderReconciliationDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/finance/reconciliation/providers`。
- 欄位摘要：對帳 ID／期間、供應商或代理或商戶線路、交易／結算幣別、投注／GGR／應結、差異數、快照／精度／版本、確認金額與原因。
- 操作摘要：查詢／分頁／詳情、差異跳轉、確認對帳；商戶有重新計算入口；清單有匯出／刷新。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：草稿／待確認／差異／已確認／已鎖定／取消；確認前有差異與狀態檢查。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：清單匯出和刷新僅訊息；recalculateMerchant 只更新時間與紀錄，沒有重算金額；期間選项寫死 2026-07／08。待決策 D02,D03,D06。
- 驗收候選：變更來源後重算數字；未解差異不可確認；重複確認、歷史快照、原幣與結算幣、真正下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation、check-global-consistency；全帳期重算未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/reconciliation/detail.vue)。

### ADM-023｜代理對帳

- 路由：`/finance/reconciliation/agents`；識別：`AgentReconciliation`。
- 入口：主選單可見。
- 欄位摘要：對帳 ID／期間、供應商或代理或商戶線路、交易／結算幣別、投注／GGR／應結、差異數、快照／精度／版本、確認金額與原因。
- 操作摘要：查詢／分頁／詳情、差異跳轉、確認對帳；商戶有重新計算入口；清單有匯出／刷新。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：草稿／待確認／差異／已確認／已鎖定／取消；確認前有差異與狀態檢查。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：清單匯出和刷新僅訊息；recalculateMerchant 只更新時間與紀錄，沒有重算金額；期間選项寫死 2026-07／08。待決策 D02,D03,D06。
- 驗收候選：變更來源後重算數字；未解差異不可確認；重複確認、歷史快照、原幣與結算幣、真正下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation、check-global-consistency；全帳期重算未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/reconciliation/index.vue)。

### ADM-024｜代理對帳詳細

- 路由：`/finance/reconciliation/agents/:id`；識別：`AgentReconciliationDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/finance/reconciliation/agents`。
- 欄位摘要：對帳 ID／期間、供應商或代理或商戶線路、交易／結算幣別、投注／GGR／應結、差異數、快照／精度／版本、確認金額與原因。
- 操作摘要：查詢／分頁／詳情、差異跳轉、確認對帳；商戶有重新計算入口；清單有匯出／刷新。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：草稿／待確認／差異／已確認／已鎖定／取消；確認前有差異與狀態檢查。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：清單匯出和刷新僅訊息；recalculateMerchant 只更新時間與紀錄，沒有重算金額；期間選项寫死 2026-07／08。待決策 D02,D03,D06。
- 驗收候選：變更來源後重算數字；未解差異不可確認；重複確認、歷史快照、原幣與結算幣、真正下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation、check-global-consistency；全帳期重算未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/reconciliation/detail.vue)。

### ADM-025｜商戶對帳

- 路由：`/finance/reconciliation/merchants`；識別：`MerchantReconciliation`。
- 入口：主選單可見。
- 欄位摘要：對帳 ID／期間、供應商或代理或商戶線路、交易／結算幣別、投注／GGR／應結、差異數、快照／精度／版本、確認金額與原因。
- 操作摘要：查詢／分頁／詳情、差異跳轉、確認對帳；商戶有重新計算入口；清單有匯出／刷新。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：草稿／待確認／差異／已確認／已鎖定／取消；確認前有差異與狀態檢查。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：清單匯出和刷新僅訊息；recalculateMerchant 只更新時間與紀錄，沒有重算金額；期間選项寫死 2026-07／08。待決策 D02,D03,D06。
- 驗收候選：變更來源後重算數字；未解差異不可確認；重複確認、歷史快照、原幣與結算幣、真正下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation、check-global-consistency；全帳期重算未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/reconciliation/index.vue)。

### ADM-026｜商戶對帳詳細

- 路由：`/finance/reconciliation/merchants/:id`；識別：`MerchantReconciliationDetail`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/finance/reconciliation/merchants`。
- 欄位摘要：對帳 ID／期間、供應商或代理或商戶線路、交易／結算幣別、投注／GGR／應結、差異數、快照／精度／版本、確認金額與原因。
- 操作摘要：查詢／分頁／詳情、差異跳轉、確認對帳；商戶有重新計算入口；清單有匯出／刷新。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：草稿／待確認／差異／已確認／已鎖定／取消；確認前有差異與狀態檢查。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：清單匯出和刷新僅訊息；recalculateMerchant 只更新時間與紀錄，沒有重算金額；期間選项寫死 2026-07／08。待決策 D02,D03,D06。
- 驗收候選：變更來源後重算數字；未解差異不可確認；重複確認、歷史快照、原幣與結算幣、真正下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation、check-global-consistency；全帳期重算未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/reconciliation/detail.vue)。

### ADM-027｜差異處理

- 路由：`/finance/reconciliation/differences`；識別：`ReconciliationDifferences`。
- 入口：主選單可見。
- 欄位摘要：差異／對帳 ID、對象／期間、類型、系統值／合作方值／差額、幣別、負責人、狀態／期限、處理方式／原因。
- 操作摘要：查詢、指派／調查、處理、返回來源；匯出／刷新入口。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：Open／Investigating 等處理狀態及 Resolved／Accepted／Closed 終態。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出／刷新只提示；重複送出、已鎖定對帳是否可改與差額捨入仍須驗收。待決策 D02,D04,D06。
- 驗收候選：同案件重送不得重複調整、已鎖定帳保護、負責人權限、原因必填、處理前後值。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation 僅部分條件，非全差異流程；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/reconciliation/differences.vue)。

### ADM-028｜異動紀錄

- 路由：`/finance/reconciliation/logs`；識別：`SettlementChangeLogs`。
- 入口：主選單可見。
- 欄位摘要：時間、資料類型／對象、操作、修改前後、操作人、原因。
- 操作摘要：查詢、關聯資料查看；依頁面實作提供紀錄呈現。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：唯讀操作歷史。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：紀錄来自前端 Store，不具伺服器不可竄改保證；保存／匯出規則未定。待決策 D04,D06,D07。
- 驗收候選：每次確認／調整有對應紀錄，隱藏敏感值，保存期限與下載檔核對。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-finance-reconciliation 的部分紀錄斷言；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance/settlement/logs/index.vue)。

### ADM-029｜報表查詢

- 路由：`/business/reports`；識別：`ReportsFourTabs`。
- 入口：主選單可見。
- 欄位摘要：營運／代理／商戶／遊戲；日期、單一原幣、代理／商戶／供應商／遊戲、指標與財務摘要。
- 操作摘要：查詢、切頁籤、原值排序、下鑽、CSV、錯誤重新查詢。
- 權限：路由 R_SUPER／R_ADMIN；另有前端 Scope 與財務摘要權限判斷；商戶資料範圍為示範範圍。
- 狀態與全域設定：loading／error／empty；查看／匯出與財務摘要有前端權限判斷。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示；有獨立報表實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：使用 reportDemoSource 與固定示範商戶範圍，不可宣稱與總後台所有交易已共用正式帳源。待決策 D03,D04,D05,D06。
- 驗收候選：四頁籤同範圍合計、測試會員排除、跨日與時區、下鑽參數、無權限與 CSV 真實下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：歷史報表交驗紀錄可參考；本輪未重跑其瀏覽器矩陣；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/report-query/index.vue)。

### ADM-030｜開發者中心

- 路由：`/platform/developers`；識別：`DeveloperCenter`。
- 入口：主選單可見。
- 欄位摘要：測試／正式 Base URL、Trace ID、API operationId／驗證說明、Callback、錯誤碼、OpenAPI 文件。
- 操作摘要：複製端點、匯入 OpenAPI JSON、搜尋文件、下載目前規格。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：文件載入／解析／錯誤狀態。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／文件工具已實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：有 API 文件不代表已實作 API；版本、簽章、重試與供應商實際契約待後端確認。待決策 D07。
- 驗收候選：無效 JSON／不相容規格提示、下載可再匯入、禁止把真實密鑰放進前端文件。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；API 契約測試待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/developers/index.vue)。

### ADM-031｜維護設定

- 路由：`/platform/maintenance`；識別：`PlatformMaintenance`。
- 入口：主選單可見。
- 欄位摘要：緊急維護開關／訊息、排程 ID／名稱、影響入口／範圍、起訖、狀態、異動紀錄。
- 操作摘要：儲存緊急狀態、還原、新增／編輯／取消排程、篩選。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：緊急狀態與排程狀態分開。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：介面描述的阻擋／放行不代表正式 API 閘道已套用；救援入口、進行中交易與排程衝突規則待驗收。待決策 D04,D05,D07。
- 驗收候選：時間先後、重疊排程、超級管理員復原、進行中交易不被誤中斷。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；排程／閘道整合待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/maintenance/index.vue)。

### ADM-032｜匯率管理

- 路由：`/platform/exchange-rates`；識別：`ExchangeRateManagement`。
- 入口：主選單可見。
- 欄位摘要：幣別對／來源、類型、精度、調整、版本／生效日、每日鎖定、歷史。
- 操作摘要：新增／編輯設定、模擬抓取與鎖定、歷史、查詢；歷史匯出入口。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：啟停、當日鎖定／未鎖定、版本與歷史快照。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：沒有外部匯率或正式排程；歷史匯出只顯示準備匯出訊息。待決策 D02,D05,D06,D07。
- 驗收候選：USDT／固定掛鉤與交叉匯率、今日缺值不沿用、歷史鎖定、不支援幣別拒絕。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-exchange-rate；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance-settings/exchange-rates/index.vue)。

### ADM-033｜白名單／黑名單

- 路由：`/platform/network-lists`；識別：`PlatformNetworkLists`。
- 入口：主選單可見。
- 欄位摘要：規則 ID／值、IP／CIDR／網域、用途、環境、啟停／到期、範圍、原因。
- 操作摘要：新增／編輯、啟停、查詢、異動紀錄。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：黑名單優先；啟用／停用／已到期。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：頁面明示 IPv6、防自我鎖定、真實來源與閘道套用仍待後端驗證。待決策 D04,D05,D07。
- 驗收候選：格式、到期、衝突優先序、自我鎖定保護、商戶隔離與後端生效結果。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；正式阻擋驗收未完成；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/network-lists/index.vue)。

### ADM-034｜人員與權限

- 路由：`/platform/access/accounts`；識別：`PlatformAccounts`。
- 入口：主選單可見。高亮歸屬：`/platform/access/accounts`。工作區：access；頁籤：後台帳號。
- 欄位摘要：帳號／姓名／部門／角色、MFA、最後登入、啟停狀態。
- 操作摘要：建立／編輯、解鎖、停用、重設密碼、詳情；匯出僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：帳號 Active／Locked／Inactive／Pending；敏感授權另有審核狀態。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出只有提示；新增角色與新增資料範圍未開放；auth.ts 使用固定演示帳號，管理設定未完整落實到登入與全站按鈕。待決策 D04,D06,D07。
- 驗收候選：最小權限、越權網址與按鈕、停用後登入拒絕、MFA／重設密碼、敏感操作分權、資料範圍。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation 僅入口角色隔離；細權限與真實登入未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/access/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-035｜角色管理

- 路由：`/platform/access/roles`；識別：`PlatformRoles`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/access/accounts`。工作區：access；頁籤：角色管理。
- 欄位摘要：角色、權限數／成員等摘要、權限勾選。
- 操作摘要：編輯既有角色與權限；新增角色僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：帳號 Active／Locked／Inactive／Pending；敏感授權另有審核狀態。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出只有提示；新增角色與新增資料範圍未開放；auth.ts 使用固定演示帳號，管理設定未完整落實到登入與全站按鈕。待決策 D04,D06,D07。
- 驗收候選：最小權限、越權網址與按鈕、停用後登入拒絕、MFA／重設密碼、敏感操作分權、資料範圍。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation 僅入口角色隔離；細權限與真實登入未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/access/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-036｜操作權限

- 路由：`/platform/access/permissions`；識別：`PlatformPermissions`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/access/accounts`。工作區：access-detail；頁籤：操作權限。
- 欄位摘要：操作權限識別／動作、敏感屬性、角色關聯。
- 操作摘要：查看操作權限定義及頁面提供的設定；全站執行端相依待驗收。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：帳號 Active／Locked／Inactive／Pending；敏感授權另有審核狀態。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出只有提示；新增角色與新增資料範圍未開放；auth.ts 使用固定演示帳號，管理設定未完整落實到登入與全站按鈕。待決策 D04,D06,D07。
- 驗收候選：最小權限、越權網址與按鈕、停用後登入拒絕、MFA／重設密碼、敏感操作分權、資料範圍。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation 僅入口角色隔離；細權限與真實登入未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/access/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-037｜敏感權限

- 路由：`/platform/access/sensitive`；識別：`PlatformSensitivePermissions`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/access/accounts`。工作區：access-detail；頁籤：敏感權限。
- 欄位摘要：敏感權限、角色／申請、狀態、原因及覆核資訊。
- 操作摘要：敏感授權查看與覆核（本地）。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：帳號 Active／Locked／Inactive／Pending；敏感授權另有審核狀態。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出只有提示；新增角色與新增資料範圍未開放；auth.ts 使用固定演示帳號，管理設定未完整落實到登入與全站按鈕。待決策 D04,D06,D07。
- 驗收候選：最小權限、越權網址與按鈕、停用後登入拒絕、MFA／重設密碼、敏感操作分權、資料範圍。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation 僅入口角色隔離；細權限與真實登入未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/access/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-038｜資料範圍

- 路由：`/platform/access/data-scopes`；識別：`PlatformDataScopes`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/access/accounts`。工作區：access-detail；頁籤：資料範圍。
- 欄位摘要：資料範圍名稱／類型、代理／商戶範圍等設定。
- 操作摘要：編輯既有範圍；新增入口未實作。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：帳號 Active／Locked／Inactive／Pending；敏感授權另有審核狀態。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出只有提示；新增角色與新增資料範圍未開放；auth.ts 使用固定演示帳號，管理設定未完整落實到登入與全站按鈕。待決策 D04,D06,D07。
- 驗收候選：最小權限、越權網址與按鈕、停用後登入拒絕、MFA／重設密碼、敏感操作分權、資料範圍。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation 僅入口角色隔離；細權限與真實登入未驗收；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/access/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-039｜操作紀錄

- 路由：`/platform/access/logs`；識別：`PlatformOperationLogs`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/access/accounts`。工作區：access；頁籤：操作紀錄。
- 欄位摘要：時間、帳號／角色／權限／敏感授權／資料範圍對象、前後值、操作人／說明。
- 操作摘要：篩選、詳細、CSV。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：唯讀紀錄。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：不能等同真實登入事件或不可竄改稽核；匯出需按實際檔案驗收。待決策 D04,D06,D07。
- 驗收候選：帳號／角色修改與紀錄一一對應、敏感值遮罩、下載與篩選一致。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/logs/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-040｜幣別資料

- 路由：`/platform/currencies/data`；識別：`CurrencyData`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：幣別資料。
- 欄位摘要：幣別代碼／名稱／ISO 數字碼、交易／結算用途、精度、狀態。
- 操作摘要：編輯既有幣別；新增儲存及匯出未實作。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：幣別主檔啟停與可用用途分開。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作／規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：新增幣別儲存只提示僅能編輯既有項目；匯出只提示；幣別 decimalPlaces 與 settlementRule.amountPrecision 是獨立設定，優先序未定。待決策 D02,D05,D06。
- 驗收候選：兩套精度的變更影響、最小單位、停用已使用幣別、歷史單據不重寫、新增及真正匯出。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-exchange-rate、check-global-consistency 僅各自規則，未證明跨設定一致；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance-settings/currencies/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-041｜交易幣別

- 路由：`/platform/currencies/transaction`；識別：`TransactionCurrencies`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：交易幣別。
- 欄位摘要：幣別、交易開關、精度、狀態。
- 操作摘要：啟停交易用途、篩選；匯出僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：幣別主檔啟停與可用用途分開。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作／規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：新增幣別儲存只提示僅能編輯既有項目；匯出只提示；幣別 decimalPlaces 與 settlementRule.amountPrecision 是獨立設定，優先序未定。待決策 D02,D05,D06。
- 驗收候選：兩套精度的變更影響、最小單位、停用已使用幣別、歷史單據不重寫、新增及真正匯出。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-exchange-rate、check-global-consistency 僅各自規則，未證明跨設定一致；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance-settings/currencies/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-042｜結算幣別

- 路由：`/platform/currencies/settlement`；識別：`SettlementCurrencies`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：結算幣別。
- 欄位摘要：幣別、結算開關、精度、狀態。
- 操作摘要：啟停結算用途、篩選；匯出僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：幣別主檔啟停與可用用途分開。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作／規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：新增幣別儲存只提示僅能編輯既有項目；匯出只提示；幣別 decimalPlaces 與 settlementRule.amountPrecision 是獨立設定，優先序未定。待決策 D02,D05,D06。
- 驗收候選：兩套精度的變更影響、最小單位、停用已使用幣別、歷史單據不重寫、新增及真正匯出。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-exchange-rate、check-global-consistency 僅各自規則，未證明跨設定一致；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance-settings/currencies/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-043｜精度設定

- 路由：`/platform/currencies/precision`；識別：`CurrencyPrecision`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：精度設定。
- 欄位摘要：幣別、decimalPlaces、minimumUnit。
- 操作摘要：修改幣別精度；不是 settlementRule.amountPrecision 設定頁。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：幣別主檔啟停與可用用途分開。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作／規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：新增幣別儲存只提示僅能編輯既有項目；匯出只提示；幣別 decimalPlaces 與 settlementRule.amountPrecision 是獨立設定，優先序未定。待決策 D02,D05,D06。
- 驗收候選：兩套精度的變更影響、最小單位、停用已使用幣別、歷史單據不重寫、新增及真正匯出。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-exchange-rate、check-global-consistency 僅各自規則，未證明跨設定一致；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/finance-settings/currencies/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-044｜語系管理

- 路由：`/platform/locales/languages`；識別：`PlatformLanguages`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：語系管理。
- 欄位摘要：語系代碼／名稱／翻譯進度、日期／時間格式、方向、後台可用／預設／狀態。
- 操作摘要：編輯、後台可用啟停、設預設、紀錄；匯出僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：預設／啟用標記。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：平台預設語系與使用者介面 locale 不等同；頁面文字未全翻譯；部分時間格式仍各寫各的；匯出只提示。待決策 D05,D06。
- 驗收候選：預設與個人偏好優先序、跨日時區、日期格式、語系切換不丟失查詢。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；全站翻譯與時區矩陣待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/locales/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-045｜國家／地區

- 路由：`/platform/locales/regions`；識別：`PlatformRegions`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：國家／地區。
- 欄位摘要：國家／地區、預設語系／時區／幣別、啟停。
- 操作摘要：編輯地區、啟停、紀錄；匯出僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：預設／啟用標記。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：平台預設語系與使用者介面 locale 不等同；頁面文字未全翻譯；部分時間格式仍各寫各的；匯出只提示。待決策 D05,D06。
- 驗收候選：預設與個人偏好優先序、跨日時區、日期格式、語系切換不丟失查詢。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；全站翻譯與時區矩陣待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/locales/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-046｜時區管理

- 路由：`/platform/locales/timezones`；識別：`PlatformTimezones`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：時區管理。
- 欄位摘要：時區 ID／名稱／偏移／預設／狀態。
- 操作摘要：編輯、設預設、紀錄；匯出僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：預設／啟用標記。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：平台預設語系與使用者介面 locale 不等同；頁面文字未全翻譯；部分時間格式仍各寫各的；匯出只提示。待決策 D05,D06。
- 驗收候選：預設與個人偏好優先序、跨日時區、日期格式、語系切換不丟失查詢。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；全站翻譯與時區矩陣待補；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/locales/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-047｜系統基本設定

- 路由：`/platform/parameters/basic`；識別：`PlatformBasicSettings`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：系統基本設定。
- 欄位摘要：平台名稱／代碼／環境、客服信箱、語系／時區／格式、維護、紀錄保存。
- 操作摘要：儲存、還原、查看異動；與專用維護／語系設定關係待確認。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：設定草稿與目前值；安全規則仅演示。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：與專用維護頁及平台語系有重疊設定；登入安全未證明接入 auth；需定義唯一設定來源。待決策 D04,D05,D07。
- 驗收候選：儲存後實際消費端改變、還原不保存、非法設定拒絕、安全條件端到端。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/parameters/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-048｜登入安全

- 路由：`/platform/parameters/login-security`；識別：`PlatformLoginSecurity`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：登入安全。
- 欄位摘要：登入安全條件、密碼／Session／MFA 等模式內欄位（逐欄限制待確認）。
- 操作摘要：儲存、還原、查看異動；真正登入強制套用未驗收。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：設定草稿與目前值；安全規則仅演示。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／規格待確認。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：與專用維護頁及平台語系有重疊設定；登入安全未證明接入 auth；需定義唯一設定來源。待決策 D04,D05,D07。
- 驗收候選：儲存後實際消費端改變、還原不保存、非法設定拒絕、安全條件端到端。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：本輪程式閱讀；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/parameters/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-049｜登入紀錄

- 路由：`/platform/logs/logins`；識別：`PlatformLoginLogs`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：登入紀錄。
- 欄位摘要：時間、帳號、登入結果、來源與詳情。
- 操作摘要：篩選、查看；刷新／匯出僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：登入結果；審核歷史；New／Investigating／Resolved／Ignored。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出／刷新只提示；審核紀錄存在不代表待審核工作流已開放；正式來源與保存未驗收。待決策 D01,D04,D06,D07。
- 驗收候選：登入和審核事件一致、異常終態／重開規則、稽核保留、下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-realignment 僅部分歷史保留與停用流程；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/system-logs/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-050｜審核紀錄

- 路由：`/platform/logs/approvals`；識別：`PlatformApprovalLogs`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：審核紀錄。
- 欄位摘要：審核時間、對象、送審／核准／駁回紀錄。
- 操作摘要：篩選、詳情；不是待審核操作入口，匯出／刷新僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：登入結果；審核歷史；New／Investigating／Resolved／Ignored。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出／刷新只提示；審核紀錄存在不代表待審核工作流已開放；正式來源與保存未驗收。待決策 D01,D04,D06,D07。
- 驗收候選：登入和審核事件一致、異常終態／重開規則、稽核保留、下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-realignment 僅部分歷史保留與停用流程；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/system-logs/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-051｜系統異常紀錄

- 路由：`/platform/logs/errors`；識別：`PlatformErrorLogs`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。工作區：settings；頁籤：系統異常紀錄。
- 欄位摘要：異常 ID／時間／來源／狀態／負責人／內容。
- 操作摘要：查看、指派、解決／忽略；匯出／刷新僅提示。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：登入結果；審核歷史；New／Investigating／Resolved／Ignored。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：僅演示／部分未實作。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：匯出／刷新只提示；審核紀錄存在不代表待審核工作流已開放；正式來源與保存未驗收。待決策 D01,D04,D06,D07。
- 驗收候選：登入和審核事件一致、異常終態／重開規則、稽核保留、下載。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-realignment 僅部分歷史保留與停用流程；[來源](C:/Users/user/Desktop/ggap/src/views/game-provider/platform/system-logs/index.vue)；[工作區模式載入](C:/Users/user/Desktop/ggap/src/views/navigation/system-workspace.vue:17)。

### ADM-052｜功能停用說明

- 路由：`/retired/reports/:kind(rtp|jackpot|providers|quality|activity|manual|payments|configuration)`；識別：`RetiredReportStatus`。
- 入口：不單獨顯示於主選單；須驗證詳情／工作區／相容進入方式。高亮歸屬：`/platform/developers`。
- 欄位摘要：kind 與對應說明。
- 操作摘要：查看說明、返回管理頁。
- 權限：路由 R_SUPER／R_ADMIN；動作級／資料級強制授權未在本輪逐項驗證。
- 狀態與全域設定：不在本期／尚未實作。須按總規格 P0–P3、G1–G6 中適用項目驗收；不適用項目須註記原因。
- 完成狀態：待確認／未開放（非已完成業務功能）。頁面功能完整驗收：**尚未完成**。
- 缺口與相依：不得把保留檔案計入已開放範圍，也不擅自恢復入口。待決策 D01。
- 驗收候選：舊網址落點、提示正確、沒有繞過停用的寫入路徑。共享群組中的非本頁操作在對應頁驗收，不能把整個群組的測試當成此頁皆通過。
- 現有證據：check-navigation、check-realignment；[來源](C:/Users/user/Desktop/ggap/src/views/navigation/retired-reports.vue)。

## 收斂方式

1. 每個 ADM 編號核准其是否在本期；相容頁不重複計算功能量。
2. 以每個「操作」拆測試案例，補欄位規則、角色、前置狀態、輸入、預期資料變化、失敗結果及紀錄。
3. 真正下載、寫入／重新載入、拒絕越權等需操作證據，不能用檔案存在或成功訊息替代。
4. 完成案例可逐項改為「已完成（前端／模擬／正式）」；未測情境保持待驗收。
5. 程式來源異動後比對機器盤點的雜湊，重新核對行號與結論；文件狀態不會自動隨程式變更。
