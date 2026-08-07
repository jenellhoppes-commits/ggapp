# GGAP 供應商多幣別與逐筆交易規格

版本：v1.3  
狀態：定版  
正式帳務幣別：USDT

## 1. 核心原則

1. GGAP 可對同一供應商建立多條幣別串接線。
2. 每條幣別線都有獨立的 Provider 幣別 ID、Provider 廠商 ID、API Key、憑證、API URL、Callback URL、錢包種類與金額精度。
3. Provider 的 Bet、Win、Refund、Rollback 以該幣別線原幣執行，不在即時交易階段先換成 USDT。
4. 平台以 `Asia/Taipei` 為唯一業務時區：00:00 關帳、00:05 鎖定匯率、00:10 啟動 T-1 日結，將原幣交易換算為 USDT。
5. 管理後台財務摘要、代理應收、供應商成本與平台毛利仍以 USDT 為主；交易明細必須同時保留 Provider 原幣。
6. 每位會員每一次下注都建立一筆獨立注單。同一 Round 可包含多個 `bet_id`，不得以 Round 彙總取代逐筆注單。

## 2. 供應商幣別管理

入口：`供應商管理 -> 供應商詳情 -> 幣別管理`

### 2.1 列表欄位

| 欄位 | 說明 |
| --- | --- |
| `connection_id` | GGAP 幣別串接線 ID |
| `provider_id` | GGAP 供應商 ID |
| `provider_currency_id` | Provider 提供的幣別 ID |
| `provider_merchant_id` | 該幣別線對應的 Provider 廠商 ID |
| `currency` | TWD、THB、PHP、VND、IDR、USD、USDT 等 |
| `provider_wallet_mode` | `seamless` 單一錢包或 `transfer` 轉帳錢包 |
| `api_url` | 該幣別線 API Base URL |
| `api_key_ciphertext` | 加密保存的 API Key，前端只取得遮罩 |
| `credential_ciphertext` | 加密保存的 Secret / 憑證，前端只取得遮罩 |
| `callback_url` | GGAP 提供給該幣別線的 Callback URL |
| `amount_precision` | Provider 可接受的小數位數 |
| `status` | `connected`、`testing`、`disabled` |
| `is_default` | 是否為供應商預設線 |
| `last_tested_at` | 最後一次連線測試時間 |

### 2.2 操作

- 新增幣別線：必填幣別 ID、廠商 ID、API URL、API Key、憑證、錢包種類與金額精度。
- 編輯幣別線：異動 API Key、憑證或 URL 時需記錄原因、操作人、前後值與 `trace_id`。
- 測試連線：分別測試驗證、餘額、Bet、Win、Rollback 與查單能力，不可只測 Base URL。
- 停用：有未完成 Round、待處理交易或未結算資料時不可直接停用，應先進入停止新 Session 狀態。
- Secret 輪換：新舊憑證需支援短暫重疊期；前端永遠不得回傳明文 Secret。

### 2.3 幣別線下注限額方案

入口：`供應商管理 -> 供應商詳情 -> 幣別管理 -> 下注限額方案`

下注限額方案由 Provider 依每條幣別線提供，GGAP 不建立投注區間，只勾選允許下放的方案。每一方案必須綁定：

```text
provider_id
+ provider_currency_connection_id
+ provider_bet_group_id
```

必要欄位：

```text
provider_bet_group_code
provider_bet_group_name
min_bet
max_bet
bet_step
supported_game_count
is_default
is_selected
version
synced_at
status
```

群組與遊戲的實際關係必須保存於 `provider_bet_group_game`：

```text
provider_bet_group_id
+ provider_game_id
+ version
```

`supported_game_count` 只作列表摘要，不得拿來判斷某款遊戲是否可使用該群組。

規則：

- 同一供應商的 TWD、THB、USDT 等幣別線各有獨立群組，不可跨幣別共用。
- Provider 負責提供群組代碼、名稱、上下限、步進、支援遊戲數、狀態與版本，GGAP 不可編輯這些數值。
- GGAP 只維護 `is_selected`；已連線幣別線至少需開放一個可用群組。
- 已淘汰群組保留供歷史查詢，不可再勾選或指派。
- 代理、商戶及會員只能引用上游已開放的群組，不可自行輸入新的最小值或最大值。
- 特殊會員若需較高額度，只能改指派另一個已開放的高額群組。
- 每次同步保存 Provider 群組版本；既有 Session 與歷史注單繼續使用下注當時的完整快照。
- 同一幣別線可開放多個群組，但每個會員、每款遊戲、每個 Session 最終只能解析出一個有效群組。
- 解析優先序固定為：會員覆寫 > 商戶遊戲指派 > 商戶幣別預設 > 代理指派 > Provider 預設。
- 活動只直接指定遊戲清單，不建立或修改下注限額方案。

## 3. Launch Game 路由

1. 讀取 `merchant_id + merchant_player_id + transaction_currency` 會員錢包。
2. 依 `provider_id + transaction_currency` 查找啟用中的 `provider_currency_connection`。
3. 找不到相同幣別線時禁止直接將金額轉成其他幣別進遊戲；必須依商戶設定明確拒絕或切換允許的備援線。
4. Session 鎖定：
   - `provider_currency_connection_id`
   - `provider_currency_id`
   - `provider_merchant_id`
   - `provider_currency`
   - `provider_wallet_mode`
   - `merchant_wallet_mode`
   - `amount_precision`
   - `provider_game_id`
   - `provider_bet_group_id`
   - `provider_bet_group_code`
   - `provider_bet_group_version`
   - `limit_source`
   - `limit_min_bet_snapshot`
   - `limit_max_bet_snapshot`
   - `limit_step_snapshot`
5. Session 建立後即使幣別設定被修改，既有 Round 仍使用原快照。

## 4. 逐筆注單

唯一鍵：`provider_currency_connection_id + provider_bet_id`

`round_id` 只負責把多次下注關聯到同一遊戲回合，不是注單唯一鍵。

必要欄位：

```text
bet_id
round_id
provider_bet_id
provider_transaction_id
merchant_id
agent_id
merchant_player_id
player_wallet_id
provider_id
provider_currency_connection_id
provider_currency_id
provider_merchant_id
provider_currency
provider_bet_amount
provider_win_amount
provider_ggr_original
provider_bet_group_id
provider_bet_group_code
provider_bet_group_name
limit_min_bet_snapshot
limit_max_bet_snapshot
limit_step_snapshot
settlement_currency = USDT
settlement_bet_amount
settlement_win_amount
settlement_ggr
settlement_status
settlement_batch_id
exchange_rate_id
exchange_rate
exchange_fee_rate
provider_raw_payload
wallet_raw_payload
created_at
settled_at
```

逐筆規則：

- 一次 Bet Callback 建立一筆 `bet_record`。
- Provider 若在同一 Round 回傳三次 Bet，系統必須建立三筆不同 `bet_id`。
- Win 若明確帶入 `bet_id`，可回填該筆注單的派彩金額。
- Win 只有 `round_id` 時，必須建立獨立 `round_settlement`，保存 Round 級派彩及關聯 Bet 清單；不得自行平均分配到各筆 Bet。
- Round 級 Win 未由 Provider 提供分配明細時，各 Bet 的 `provider_win_amount` 與 `provider_ggr_original` 保持 `null`，正式帳務以 Round 交易事件計算，避免製造不準確的逐筆 GGR。
- Refund、Rollback 必須保留原交易關聯並新增反向流水。
- 歷史原幣金額、Payload、匯率與日結結果不得因後續設定更新而重算。

## 5. 交易流水

每個 Bet、Win、Refund、Rollback、Transfer In、Transfer Out 都建立獨立 `transaction`。

交易必須同時保存：

- Provider 原幣：`provider_currency + provider_amount`
- 幣別線：`provider_currency_connection_id`
- Provider 身分：`provider_currency_id + provider_merchant_id`
- 平台日結：`settlement_currency + settlement_amount + settlement_batch_id`
- 冪等：`idempotency_key`
- 追蹤：`trace_id`
- 原始資料：Provider request / response、Merchant request / response

交易建立當下 `settlement_status = pending_daily`。00:10 日結成功後改為 `locked`；異常則維持待處理並進告警或補單流程。

## 6. 每日關帳與日結

執行順序：

1. 00:00 關閉 T-1 帳期的新交易寫入窗口，延遲 Callback 進待處理佇列。
2. 00:05 取得 T-1 每一個 Provider 原幣的公告匯率。
3. 建立匯率快照並鎖定版本。
4. 00:10 啟動日結。
5. 逐筆計算 USDT 金額，不修改原幣金額。
6. 建立 `daily_trade_summary`。
7. 產生代理日結來源與平台毛利分析。
8. 供應商帳務依 Provider 原幣報表 / 交易快照獨立對帳，保存原幣帳單與 USDT 帳務鏡像。
9. 鎖定 `settlement_batch_id`；差異只能走補單、調帳或下一期修正。

匯率方向固定：

```text
1 USDT = N provider_currency
settlement_amount_usdt = provider_amount / exchange_rate
```

金額使用 `DECIMAL` 或最小單位整數。API 金額以字串傳輸，不可使用 float / double 作財務計算。

## 7. API

```text
GET    /api/v2/admin/providers/{provider_id}/currency-connections
POST   /api/v2/admin/providers/{provider_id}/currency-connections
GET    /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}
PATCH  /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}
POST   /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}/test
POST   /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}/rotate-secret
PATCH  /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}/status

GET    /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}/bet-groups
GET    /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}/bet-groups/{group_id}/games
POST   /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}/bet-groups/sync
PUT    /api/v2/admin/providers/{provider_id}/currency-connections/{connection_id}/bet-groups/selection

GET    /api/v2/admin/bets
GET    /api/v2/admin/bets/{bet_id}
GET    /api/v2/admin/rounds/{round_id}/bets
GET    /api/v2/admin/rounds/{round_id}/settlement
GET    /api/v2/admin/transactions
GET    /api/v2/admin/settlement-batches/{batch_id}
```

注單列表預設回傳逐筆資料，`group_by=round` 只能作額外彙總檢視，不可改變原始資料或匯出內容。

## 8. 驗收

- PG Soft 可同時存在 TWD、THB、USDT 三條不同憑證與 URL 的幣別線。
- 每條線可分別設定單一錢包或轉帳錢包。
- Launch Game 能依會員幣別選到正確 `provider_currency_connection_id`。
- TWD 300 進 TWD Provider 線時，Provider 與遊戲內金額維持 300，不會先顯示成約 10 USDT。
- 同一會員同一 Round 連續下注兩次，注單列表出現兩個不同 `bet_id`。
- 每筆注單可追到 Provider 幣別 ID、廠商 ID、Provider Tx、原幣 Payload 與交易流水。
- 每筆注單可追到下注當下的 Provider 幣別線下注限額方案、最小值、最大值、步進、版本與檢核結果。
- 代理、商戶與會員只能指派 Provider 已提供且 GGAP 已開放的完整群組，不可修改或縮放群組上下限。
- Launch Game 必須依固定優先序解析唯一群組，並在 Session 保存群組 ID、版本、適用遊戲與完整上下限快照。
- Provider 只回傳 Round 級 Win 時，不得捏造單筆 Bet 派彩；Round 帳務與逐筆 Bet 關聯均可追溯。
- 導航與 API 只保留遊戲主檔、活動直接指定遊戲與 Provider 幣別線下注限額方案資源，不建立獨立限額頁面。
- 00:10 日結後每筆交易都取得 USDT 金額、匯率快照與 `settlement_batch_id`。
- 日結後修改匯率或幣別線，不會改寫歷史注單。
- 管理後台財務摘要仍以 USDT 顯示，明細可展開 Provider 原幣。
