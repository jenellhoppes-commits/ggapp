# GGAP API 契約串接清單

本文件用來銜接目前前端 Demo 與後端正式 API。目標是讓後端可以照表實作 endpoint，前端只需要替換 service response，不需要逐頁重拆 UI。

## 1. 共用規格

### 1.1 Response Wrapper

所有 API 建議統一回傳：

```ts
interface ApiResponse<T> {
  code: number
  message: string
  data: T
  trace_id?: string
}
```

成功：

```json
{
  "code": 0,
  "message": "OK",
  "data": {},
  "trace_id": "trace-20260708-000001"
}
```

失敗：

```json
{
  "code": 401001,
  "message": "Unauthorized",
  "data": null,
  "trace_id": "trace-20260708-000002"
}
```

### 1.2 List Response

列表型資料建議統一：

```ts
interface ListResponse<T> {
  list: T[]
  total: number
  page?: number
  page_size?: number
}
```

若要與部分既有前端型別兼容，也可暫時支援 `items`：

```ts
interface PagedResponse<T> {
  items: T[]
  page: number
  page_size: number
  total: number
}
```

正式建議以 `list` 為主，後續再逐步移除 `items`。

### 1.3 Request Header

前端統一由 `src/services/apiClient.ts` 帶入：

| Header | 範例 | 用途 |
| --- | --- | --- |
| `Authorization` | `Bearer xxx` | 登入 token。 |
| `X-GGAP-Portal` | `admin` / `agent` / `merchant` | 目前入口。 |
| `X-GGAP-Role` | `MASTER` / `AGENT` / `MERCHANT` | 目前登入角色。 |
| `X-GGAP-Data-Scope` | `global` / `agent_tree` / `merchant_self` | 前端資料範圍提示。 |
| `X-GGAP-Agent-Id` | `AGT-DIRECT` | 代理身份或商戶所屬代理。 |
| `X-GGAP-Merchant-Id` | `OP-1001` | 商戶身份。 |

安全規則：

1. 後端授權必須以 token claims 為準。
2. `X-GGAP-*` Header 只能作為前端入口提示、除錯與記錄輔助。
3. 後端不可只信任前端 Header 進行資料授權。

### 1.4 Query Params

目前前端共用 query 型別已預留：

| 欄位 | 型別 | 用途 |
| --- | --- | --- |
| `keyword` | string | 關鍵字搜尋。 |
| `date_from` | string | 起始日期。 |
| `date_to` | string | 結束日期。 |
| `status` | string | 狀態。 |
| `merchant_id` | string | 商戶 ID。 |
| `agent_id` | string | 代理 ID。 |
| `provider_id` | string | 供應商 ID。 |
| `transaction_currency` | string | 會員錢包、Merchant Callback 與 Provider 即時交易使用的真實原幣。 |
| `display_currency` | string | 相容舊欄位；新 API 應回傳 `transaction_currency`。 |
| `settlement_currency` | string | 結算幣別，MVP 預設 USDT。 |
| `page` | number | 頁碼。 |
| `page_size` | number | 每頁筆數。 |

建議後端列表 API 都支援 `page` / `page_size`，即使目前 Demo UI 尚未每頁都顯示分頁。

## 2. 三入口與資料範圍

| 入口 | Login URL | Role | Portal | Data Scope | 預設首頁 |
| --- | --- | --- | --- | --- | --- |
| 管理者後台 | `/admin/login` | `MASTER` | `admin` | `global` | `/admin/dashboard` |
| 代理後台 | `/agent/login` | `AGENT` | `agent` | `agent_tree` | `/agent/dashboard` |
| 商戶後台 | `/merchant/login` | `MERCHANT` | `merchant` | `merchant_self` | `/merchant/dashboard` |

### 2.1 授權規則

1. `MASTER` 可看全域資料。
2. `AGENT` 只能看自己的代理樹，包含下級代理、所屬商戶、所屬會員與代理帳務。
3. `MERCHANT` 只能看自身商戶資料，包含自身遊戲、會員、注單、報表、錢包與串接資訊。
4. 前端 route guard 會阻擋錯誤入口；後端仍必須再次驗證。
5. 財務正式帳務主體不因入口改變。入口只影響資料可見範圍。

## 3. Auth API

### 3.1 Login

| 項目 | 規格 |
| --- | --- |
| Method | `POST` |
| Path | `/api/login` |
| 角色 | Public |
| 前端狀態 | 已使用 |
| 優先級 | P0 |

Request：

```ts
{
  username: string
  password: string
  portal?: 'admin' | 'agent' | 'merchant'
}
```

Response：

```ts
{
  token: string
  id: string
  account: string
  name: string
  role: 'MASTER' | 'AGENT' | 'MERCHANT'
  portal: 'admin' | 'agent' | 'merchant'
  data_scope: 'global' | 'agent_tree' | 'merchant_self'
  agent_id?: string
  agent_level?: 1 | 2 | 3
  merchant_id?: string
  merchant_code?: string
}
```

備註：

1. Demo 目前 login handler 有回傳 `success` 欄位；正式 API 建議改為共用 `ApiResponse`。
2. 若 `portal` 與 role 不符，後端應回傳錯誤，例如代理帳號不可從 `/admin/login` 登入。

### 3.2 Current User

| 項目 | 規格 |
| --- | --- |
| Method | `GET` |
| Path | `/api/me` |
| 角色 | `MASTER` / `AGENT` / `MERCHANT` |
| 前端狀態 | 建議新增 |
| 優先級 | P0 |

用途：

1. 重新整理頁面後恢復登入者資訊。
2. 後端可重新下發 role、portal、data_scope、agent_id、merchant_id。
3. 前端後續可減少 localStorage 對 user profile 的依賴。

### 3.3 Logout

| 項目 | 規格 |
| --- | --- |
| Method | `POST` |
| Path | `/api/logout` |
| 角色 | `MASTER` / `AGENT` / `MERCHANT` |
| 前端狀態 | 可選 |
| 優先級 | P2 |

## 4. 管理者端 API

### 4.1 Dashboard

| API | Method | Role | Data Scope | 狀態 | 優先級 |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/admin/dashboard/summary` | `GET` | `MASTER` | `global` | 建議新增 | P1 |
| `/api/v2/admin/dashboard/trends` | `GET` | `MASTER` | `global` | 建議新增 | P1 |
| `/api/v2/admin/dashboard/alerts` | `GET` | `MASTER` | `global` | 建議新增 | P1 |

建議 response：

```ts
{
  kpi: {
    total_bet_usdt: number
    settlement_ggr_usdt: number
    agent_receivable_usdt: number
    provider_payable_usdt: number
    platform_margin_usdt: number
    active_merchants: number
    active_players: number
  }
  trend_7d: Array<{
    date: string
    total_bet_usdt: number
    settlement_ggr_usdt: number
    platform_margin_usdt: number
  }>
  alerts: Array<{
    level: 'info' | 'warning' | 'critical'
    title: string
    message: string
    count: number
  }>
}
```

### 4.2 Content / Provider / Game

| API | Method | Role | 狀態 | 優先級 | 前端 Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/game/list` | `GET` | `MASTER` | 已使用 | P1 | `admin/content.ts` |
| `/api/v2/game/update` | `POST` | `MASTER` | 已使用 | P1 | `admin/content.ts` |
| `/api/admin/providers` | `POST` | `MASTER` | 已使用，建議改名 | P1 | `admin/content.ts` |
| `/api/v2/providers/update` | `POST` | `MASTER` | 已使用，建議改名 | P1 | `admin/content.ts` |
| `/api/v2/game/rtp` | `POST` | `MASTER` | 已使用 | P2 | `admin/content.ts` |

正式路徑建議：

| 現有路徑 | 建議正式路徑 |
| --- | --- |
| `/api/admin/providers` | `/api/v2/admin/providers` |
| `/api/v2/providers/update` | `/api/v2/admin/providers/:provider_id` |
| - | `/api/v2/admin/providers/:provider_id/currency-connections` |
| - | `/api/v2/admin/providers/:provider_id/currency-connections/:connection_id/bet-groups` |
| `/api/v2/game/list` | `/api/v2/admin/games` |
| `/api/v2/game/update` | `/api/v2/admin/games/:game_id` |
| `/api/v2/game/rtp` | `/api/v2/admin/games/rtp` |

Provider 重點欄位：

```ts
{
  provider_id: string
  provider_code: string
  provider_name: string
  status: 'active' | 'maintenance' | 'disabled'
  settlement_currency: 'USDT'
  provider_cost_rate: number
  negative_ggr_policy: 'carry_forward' | 'zero_out'
  api_endpoint?: string
  callback_endpoint?: string
  contract_start_at?: string
  contract_end_at?: string
}
```

Provider 幣別線：

```ts
{
  provider_currency_connection_id: string
  provider_id: string
  provider_currency_id: string
  provider_merchant_id: string
  currency: string
  wallet_mode: 'seamless' | 'transfer'
  api_url: string
  callback_url: string
  amount_precision: number
  invoice_currency: string
  payment_currency: string
  credential_version: string
  status: 'active' | 'maintenance' | 'disabled'
}
```

供應商帳務需同時回傳 `provider_report_ggr_original`、`original_currency`、`exchange_rate_id`、`exchange_rate`、`provider_report_ggr_usdt`、`provider_payable_original` 與 `provider_payable_usdt`。負 GGR 結轉另存 `opening_carry_forward`、`applied_carry_forward`、`closing_carry_forward`，正式應付不得小於 0。

Provider 幣別線下注限額方案：

```ts
{
  provider_bet_group_id: string
  provider_bet_group_code: string
  provider_bet_group_name: string
  provider_id: string
  provider_currency_connection_id: string
  min_bet: string
  max_bet: string
  bet_step: string
  supported_game_count: number
  is_selected: boolean
  is_default: boolean
  version: string
  synced_at: string
  status: 'available' | 'deprecated'
}
```

群組適用遊戲不可只保存數量，必須另有映射：

```ts
{
  provider_bet_group_id: string
  provider_game_id: string
  provider_game_name: string
  game_type: string
  version: string
  status: 'active' | 'disabled'
}
```

重要規則：

1. 供應商成本費率在供應商管理內設定。
2. 供應商結算是平台自己的成本帳，不直接掛代理或商戶。
3. 代理 / 商戶費率可以依供應商調整，但那是報價與應收邏輯，不代表代理與供應商有直接帳務關係。
4. 下注限額方案由 Provider 依幣別線提供；GGAP 只維護勾選狀態，不可新增或修改上下限。
5. 代理、商戶及會員只能引用上游已勾選的群組；每筆注單必須保存實際生效的群組、版本與數值快照。
6. 已淘汰群組不可新指派，但歷史 Session 與注單仍可查詢。

Game 重點欄位：

```ts
{
  game_id: string
  game_code: string
  name_zh: string
  name_en: string
  provider_id: string
  provider_name: string
  game_type: string
  status: 'active' | 'maintenance' | 'disabled'
  rtp: number
  maintenance?: {
    mode: 'none' | 'once' | 'weekly' | 'monthly'
    start_at?: string
    end_at?: string
    weekday?: number
    month_day?: number
  }
}
```

### 4.3 Merchant

| API | Method | Role | 狀態 | 優先級 | 前端 Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/merchant/:merchantId/providers` | `GET` | `MASTER` | 已使用 | P1 | `admin/merchants.ts` |
| `/api/v2/merchant/:merchantId/providers` | `POST` | `MASTER` | 已使用 | P1 | `admin/merchants.ts` |
| `/api/v2/admin/merchants` | `GET` | `MASTER` | 建議新增 | P1 | 待收斂 |
| `/api/v2/admin/merchants` | `POST` | `MASTER` | 建議新增 | P1 | 待收斂 |
| `/api/v2/admin/merchants/:merchant_id` | `GET` | `MASTER` | 建議新增 | P1 | 待收斂 |
| `/api/v2/admin/merchants/:merchant_id` | `PUT` | `MASTER` | 建議新增 | P1 | 待收斂 |

商戶核心欄位：

```ts
{
  merchant_id: string
  merchant_code: string
  merchant_name: string
  agent_id: string
  wallet_mode: 'seamless' | 'transfer'
  status: 'active' | 'disabled' | 'maintenance'
  transaction_currencies: string[]
  default_transaction_currency: string
  display_currencies?: string[] // 舊版相容別名
  settlement_currency: 'USDT'
  callback_amount_mode: 'transaction_currency' | 'settlement_currency'
  exchange_service_fee_rate: number
  default_merchant_markup_rate: number
  api_status: 'enabled' | 'disabled'
  created_at: string
}
```

`callback_amount_mode` 預設必須為 `transaction_currency`；只有會員錢包本身是 USDT 的商戶才可使用 `settlement_currency`。

`exchange_service_fee_rate` 是平台換匯服務費；`default_merchant_markup_rate` 是代理對商戶的預設報價加價。兩者不得互相作為備援值。

商戶供應商授權：

```ts
{
  providerId: number
  code?: string
  name?: string
  globalStatus?: 'active' | 'maintenance' | 'disabled'
  status: 'active' | 'disabled'
  revenueShare: number
  excludedGames?: string[]
}
```

### 4.4 Agent

| API | Method | Role | 狀態 | 優先級 |
| --- | --- | --- | --- | --- |
| `/api/v2/admin/agents` | `GET` | `MASTER` | 建議新增 | P1 |
| `/api/v2/admin/agents` | `POST` | `MASTER` | 建議新增 | P1 |
| `/api/v2/admin/agents/:agent_id` | `GET` | `MASTER` | 建議新增 | P1 |
| `/api/v2/admin/agents/:agent_id` | `PUT` | `MASTER` | 建議新增 | P1 |
| `/api/v2/admin/agents/:agent_id/rates` | `GET` | `MASTER` | 建議新增 | P1 |
| `/api/v2/admin/agents/:agent_id/rates` | `PUT` | `MASTER` | 建議新增 | P1 |

代理核心欄位：

```ts
{
  agent_id: string
  agent_code: string
  agent_name: string
  level: 1 | 2 | 3
  parent_agent_id?: string
  status: 'active' | 'disabled'
  settlement_currency: 'USDT'
  service_fee_rate: number
  created_at: string
}
```

代理費率：

```ts
{
  agent_id: string
  default_rate: number
  provider_rates: Array<{
    provider_id: string
    provider_name: string
    provider_cost_rate: number
    agent_rate: number
    effective_at: string
  }>
}
```

規則：

1. 代理最多三級：L1 / L2 / L3。
2. L3 不可再新增下級代理。
3. 費率可設定預設值，也可依供應商覆寫。
4. 若未指定供應商費率，使用代理預設費率。
5. 供應商成本只作報價參考與毛利分析，不是代理與供應商直接結算。

### 4.5 Admin Finance

| API | Method | Role | 狀態 | 優先級 | 前端 Service |
| --- | --- | --- | --- | --- | --- |
| `/api/admin/funds` | `GET` | `MASTER` | 已使用，建議改名 | P2 | `admin/finance.ts` |
| `/api/admin/funds/:id/review` | `POST` | `MASTER` | 已使用，建議改名 | P2 | `admin/finance.ts` |
| `/api/admin/funds/adjust` | `POST` | `MASTER` | 已使用，建議改名 | P2 | `admin/finance.ts` |
| `/api/v2/admin/finance/provider-accounting` | `GET` | `MASTER` | 建議新增 | P1 | 待收斂 |
| `/api/v2/admin/finance/agent-accounting` | `GET` | `MASTER` | 建議新增 | P1 | 待收斂 |
| `/api/v2/admin/finance/platform-margin` | `GET` | `MASTER` | 建議新增 | P1 | 待收斂 |
| `/api/v2/admin/finance/exchange-rates` | `GET` | `MASTER` | 建議新增 | P1 | 待收斂 |
| `/api/v2/admin/finance/adjustments` | `GET` | `MASTER` | 建議新增 | P2 | 待收斂 |

正式路徑建議：

| 現有路徑 | 建議正式路徑 |
| --- | --- |
| `/api/admin/funds` | `/api/v2/admin/funds` |
| `/api/admin/funds/:id/review` | `/api/v2/admin/funds/:id/review` |
| `/api/admin/funds/adjust` | `/api/v2/admin/funds/adjust` |

財務核心規則：

1. 供應商帳務：`provider_id + provider_currency_id + original_currency + settlement_currency + period`。
2. 代理帳務：`agent_id + settlement_currency + period`。
3. 代理帳務內可展開下級代理結算與商戶結算。
4. 平台毛利：代理應收 - 供應商成本 + 匯率服務費 - 調帳。
5. 供應商帳務與代理帳務不可混成同一張正式帳單。

### 4.6 Admin Reports

| API | Method | Role | 狀態 | 優先級 | 前端 Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/report/financial` | `POST` | `MASTER` | 已使用 | P2 | `admin/reports.ts` |

Request：

```ts
{
  timeRange?: [number, number]
  startTime?: string
  endTime?: string
  groupBy: 'date' | 'agent'
}
```

建議正式路徑：

```text
POST /api/v2/admin/reports/financial
```

### 4.7 Transactions

目前交易中心多數頁面仍為 demo data / mock service，建議正式補以下 API：

| API | Method | Role | Data Scope | 優先級 |
| --- | --- | --- | --- | --- |
| `/api/v2/admin/transactions/players` | `GET` | `MASTER` | `global` | P1 |
| `/api/v2/admin/transactions/bets` | `GET` | `MASTER` | `global` | P1 |
| `/api/v2/admin/transactions/round-settlements` | `GET` | `MASTER` | `global` | P1 |
| `/api/v2/admin/transactions/flows` | `GET` | `MASTER` | `global` | P1 |
| `/api/v2/admin/transactions/repairs` | `GET` | `MASTER` | `global` | P1 |
| `/api/v2/admin/transactions/repairs/:id/retry` | `POST` | `MASTER` | `global` | P1 |
| `/api/v2/admin/transactions/wallet-router` | `GET` | `MASTER` | `global` | P1 |
| `/api/v2/admin/transactions/transfers` | `GET` | `MASTER` | `global` | P1 |

交易與注單必要欄位：

```ts
{
  bet_id: string
  round_id: string
  transaction_id: string
  provider_transaction_id: string
  idempotency_key: string
  merchant_id: string
  agent_id: string
  provider_id: string
  player_id: string
  game_id: string
  wallet_mode: 'seamless' | 'transfer'
  transaction_currency: string
  provider_currency_connection_id: string
  provider_currency: string
  provider_bet_amount: string
  provider_payout_amount: string | null
  payout_scope: 'bet' | 'round' | 'unallocated'
  round_settlement_id: string | null
  settlement_currency: 'USDT'
  settlement_bet_amount: string | null
  settlement_payout_amount: string | null
  settlement_ggr: string | null
  settlement_batch_id: string | null
  exchange_rate_id: string | null
  exchange_rate: string | null
  exchange_fee_rate: string | null
  rate_locked_at: string | null
  provider_bet_group_id: string
  provider_bet_group_snapshot: {
    provider_game_id: string
    provider_bet_group_code: string
    provider_bet_group_version: string
    limit_source: 'player_override' | 'merchant_game_assignment' | 'merchant_currency_default' | 'agent_assignment' | 'provider_default'
    min_bet: string
    max_bet: string
    bet_step: string
  }
  status: 'pending' | 'settled' | 'void' | 'failed'
  created_at: string
}
```

每列只代表一位會員的一次下注。唯一鍵為 `provider_currency_connection_id + provider_bet_id`；`round_id` 只作回合關聯，不得拿來彙總覆蓋逐筆注單。日結前所有 USDT、匯率及批次欄位必須為 `null`。

Provider 只回傳 Round 級 Win 時，需另建 `round_settlement`；單筆 Bet 的 payout / GGR 保持 `null`，不得自行平均分配。Launch Game 必須鎖定唯一下注限額方案，解析優先序為會員覆寫、商戶遊戲、商戶交易幣別預設、代理、Provider 預設。

延遲 Callback 必要欄位：`original_trade_date`、`accepted_at`、`accounting_date`、`late_accounting_status`、`adjustment_batch_id`。已鎖定帳期不得自動重開；延遲事件預設建立次期調整，人工重開需獨立核准與稽核紀錄。

### 4.8 Quality Center

建議正式 API：

| API | Method | Role | 優先級 |
| --- | --- | --- | --- |
| `/api/v2/admin/quality/risk-rules` | `GET` | `MASTER` | P2 |
| `/api/v2/admin/quality/risk-rules` | `POST` | `MASTER` | P2 |
| `/api/v2/admin/quality/alerts` | `GET` | `MASTER` | P2 |
| `/api/v2/admin/quality/alerts/:id/resolve` | `POST` | `MASTER` | P2 |
| `/api/v2/admin/quality/operation-logs` | `GET` | `MASTER` | P1 |

### 4.9 System

建議正式 API：

| API | Method | Role | 優先級 |
| --- | --- | --- | --- |
| `/api/v2/admin/system/staff` | `GET` | `MASTER` | P1 |
| `/api/v2/admin/system/staff` | `POST` | `MASTER` | P1 |
| `/api/v2/admin/system/staff/:staff_id` | `PUT` | `MASTER` | P1 |
| `/api/v2/admin/system/job-levels` | `GET` | `MASTER` | P1 |
| `/api/v2/admin/system/job-levels` | `POST` | `MASTER` | P1 |
| `/api/v2/admin/system/permissions` | `GET` | `MASTER` | P1 |
| `/api/v2/admin/system/settings` | `GET` | `MASTER` | P2 |
| `/api/v2/admin/system/settings` | `PUT` | `MASTER` | P2 |
| `/api/v2/admin/system/audit-logs` | `GET` | `MASTER` | P1 |

### 4.10 Developer Center

建議正式 API：

| API | Method | Role | 優先級 |
| --- | --- | --- | --- |
| `/api/v2/admin/developer/api-docs` | `GET` | `MASTER` | P2 |
| `/api/v2/admin/developer/api-docs/:doc_id` | `GET` | `MASTER` | P2 |
| `/api/v2/admin/developer/callback-test` | `POST` | `MASTER` | P2 |

## 5. 代理 / 商戶端 API

### 5.1 Portal Dashboard

| API | Method | Role | Data Scope | 狀態 | 優先級 | Frontend Service |
| --- | --- | --- | --- | --- | --- | --- |
| `/api/v2/merchant/dashboard/stats` | `GET` | `AGENT` / `MERCHANT` | `agent_tree` / `merchant_self` | 已使用 | P1 | `portal/dashboard.ts` |

Response：

```ts
{
  wallet: {
    balance: number
    credit_limit: number
    currency: string
    exchange_rate?: number
  }
  today_kpi: {
    total_bet: number
    net_win: number
    active_players: number
    tx_count: number
    comparison: {
      bet_pct: number
      win_pct: number
      player_pct: number
    }
  }
  trend_7d: Array<{
    date: string
    bet: number
    net_win: number
  }>
  alerts: Array<{
    type: string
    message: string
    count: number
  }>
  top_games: Array<{
    name: string
    bet: number
    win: number
  }>
}
```

建議正式路徑：

| Role | 建議路徑 |
| --- | --- |
| `AGENT` | `/api/v2/agent/dashboard/stats` |
| `MERCHANT` | `/api/v2/merchant/dashboard/stats` |

若後端希望共用，也可保留同一路徑並依 token scope 回傳。

### 5.2 Portal Games

| API | Method | Role | 狀態 | 優先級 | Frontend Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/agent/games` | `GET` | `AGENT` / `MERCHANT` | 已使用 | P1 | `portal/games.ts` |
| `/api/v2/agent/games/toggle` | `POST` | `AGENT` / `MERCHANT` | 已使用 | P1 | `portal/games.ts` |

Game response：

```ts
{
  game_id: string
  game_code: string
  name_en: string
  name_zh?: string
  provider: string
  type: string
  rtp: number
  merchant_enabled: boolean
  master_enabled: boolean
  thumbnail?: string
  release_date: string
  admin_status: 'active' | 'maintenance' | 'disabled'
}
```

### 5.3 Portal Reports

| API | Method | Role | 狀態 | 優先級 | Frontend Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/merchant/reports/daily` | `GET` | `AGENT` / `MERCHANT` | 已使用 | P1 | `portal/reports.ts` |
| `/api/v2/merchant/reports/transactions` | `GET` | `AGENT` / `MERCHANT` | 已使用 | P1 | `portal/reports.ts` |
| `/api/v2/merchant/reports/bet-logs` | `POST` | `AGENT` / `MERCHANT` | 已使用 | P1 | `portal/reports.ts` |
| `/api/v2/agent/report/win-loss` | `POST` | `AGENT` | 已使用 | P2 | `portal/reports.ts` |

Daily summary：

```ts
{
  total_bet: number
  total_payout: number
  net_win: number
  tx_count: number
  active_players: number
  rtp: number
}
```

Bet log：

```ts
{
  id: string
  created_at: string
  player_id: string
  game_name: string
  bet: number
  win: number
  currency: string
  status: 'win' | 'loss' | 'refund'
  detail?: unknown
}
```

正式建議：

1. Agent 與 Merchant 可共用報表 service，但後端必須依 token scope 限制資料。
2. 報表需同時支援 `transaction_currency` 與 `settlement_currency`；`display_currency` 只作舊版相容別名，正式結算以 USDT 為準。

### 5.4 Portal Finance

| API | Method | Role | 狀態 | 優先級 | Frontend Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/merchant/wallet` | `GET` | `AGENT` / `MERCHANT` | 已使用 | P1 | `portal/finance.ts` |
| `/api/v2/merchant/invoices` | `GET` | `AGENT` / `MERCHANT` | 已使用 | P1 | `portal/finance.ts` |
| `/api/v2/merchant/funds` | `GET` | `AGENT` / `MERCHANT` | 已使用 | P2 | `portal/finance.ts` |
| `/api/v2/merchant/wallet/top-up` | `POST` | `AGENT` / `MERCHANT` | 已使用 | P2 | `portal/finance.ts` |
| `/api/v2/merchant/invoices/:invoiceId/payment` | `POST` | `AGENT` / `MERCHANT` | 已使用 | P2 | `portal/finance.ts` |
| `/api/v2/merchant/wallet/credit-limit-request` | `POST` | `AGENT` / `MERCHANT` | 已使用 | P2 | `portal/finance.ts` |

Wallet：

```ts
{
  credit_limit: number
  balance: number
  outstanding_amount: number
  currency: string
  exchange_rate: number
  credit_request_status: 'none' | 'pending' | 'rejected'
}
```

Invoice：

```ts
{
  id: string
  period: string
  total_ggr: number
  commission_rate: number
  amount_due: number | null
  status: 'pending' | 'paid'
  verification_status: 'none' | 'verifying' | 'verified'
  created_at: string
}
```

備註：

1. 若為代理入口，這裡應呈現代理應收、下級代理結算、商戶結算。
2. 若為商戶入口，這裡只呈現商戶自身錢包、帳單與資金紀錄。
3. 不建議新增獨立「商戶帳務」作正式平台帳務主體；商戶對代理的應收可放在代理帳務底下展開。

### 5.5 Portal Organization

| API | Method | Role | 狀態 | 優先級 | Frontend Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/agent/tree` | `GET` | `AGENT` | 待串接 | P1 | `portal/organization.ts` |
| `/api/v2/agent/sub-agents` | `POST` | `AGENT` | 待串接 | P1 | `portal/organization.ts` |
| `/api/v2/agent/sub-agents/:agent_id` | `PUT` | `AGENT` | 待串接 | P1 | `portal/organization.ts` |
| `/api/v2/agent/sub-agents/:agent_id/rate-versions` | `POST` | `AGENT` | 待串接 | P1 | `portal/organization.ts` |
| `/api/v2/agent/sub-agents/:agent_id/bet-group-access` | `PUT` | `AGENT` | 待串接 | P1 | `portal/organization.ts` |
| `/api/v2/agent/sub-agents/:agent_id/transfer` | `POST` | `AGENT` | 後續專用流程 | P2 | `portal/organization.ts` |

Create / update agent payload：

```ts
{
  agent_code: string
  agent_name: string
  agent_level: 2 | 3
  parent_agent_code: string
  status: 'active' | 'suspended' | 'disabled'
  settlement_currency: 'USDT'
  fx_service_fee_rate: number
  negative_ggr_policy: 'carry_forward' | 'zero_out'
  provider_rates: Array<{
    provider_id: string
    upstream_rate: number
    agent_rate: number
    rate_version: string
    effective_at: string
  }>
  provider_bet_group_ids: string[]
}
```

代理層級規則：

1. 代理只可新增自己下一層代理。
2. L1 可新增 L2，L2 可新增 L3，L3 不可新增代理。
3. 下級代理與商戶的應收彙總應進代理帳務。
4. 代理代碼、層級與上級建立後不可在一般編輯中修改；轉移必須走專用流程並留下生效日與稽核紀錄。
5. 代理費率依供應商建立版本，不得以單一全域費率取代。
6. 下注限額授權只能從 Provider 幣別線已同步且上級已開放的方案勾選，不得自行輸入區間。

### 5.6 Portal Developer

| API | Method | Role | 狀態 | 優先級 | Frontend Service |
| --- | --- | --- | --- | --- | --- |
| `/api/v2/agent/credentials` | `GET` | `AGENT` / `MERCHANT` | 已使用 | P2 | `portal/developer.ts` |
| `/api/v2/agent/whitelist` | `POST` | `AGENT` / `MERCHANT` | 已使用 | P2 | `portal/developer.ts` |

Response：

```ts
{
  merchant_code: string
  secret_key: string
  whitelist: string[]
}
```

建議正式補充：

| API | Method | Role | 優先級 |
| --- | --- | --- | --- |
| `/api/v2/portal/developer/api-docs` | `GET` | `AGENT` / `MERCHANT` | P2 |
| `/api/v2/portal/developer/callback-test` | `POST` | `AGENT` / `MERCHANT` | P2 |
| `/api/v2/portal/developer/rotate-secret` | `POST` | `AGENT` / `MERCHANT` | P2 |

## 6. Legacy API 待整理

舊版代理／商戶混用 API 已自前端移除；後端不應再新增下列路徑：

| 現有 API | 用途 | 建議處理 |
| --- | --- | --- |
| `/api/v2/report/bet-logs` | 舊版注單查詢 | 併入 `/api/v2/merchant/reports/bet-logs` 或 admin transactions。 |
| `/api/v2/agent/list` | 舊版商戶 / 代理列表 | 已拆成 `/api/v2/admin/merchants` 與 `/api/v2/agent/tree`。 |
| `/api/v2/agent/:id` | 舊版商戶 / 代理詳情 | 依角色拆正式路徑。 |
| `/api/v2/agent/update` | 舊版更新 | 改為 RESTful `PUT`。 |
| `/api/v2/agent/management/agents` | 舊版新增 | 改為 admin / agent 對應正式路徑。 |
| `/api/v1/agent/create` | 舊版新增代理 | 後續移除。 |
| `/api/v1/agent/update` | 舊版更新代理 | 後續移除。 |

整理方向：

1. 不要讓後端再新增 v1 API。
2. 管理者商戶 API 統一由 `services/admin/merchants.ts` 封裝。
3. 代理樹 API 統一由 `services/portal/organization.ts` 封裝；目前頁面為本地演示資料，接後端時依本節契約實作。
4. 不得重新引入 `legacyService` 或代理／商戶共用 DTO。

## 7. API 命名統一建議

正式建議使用以下結構：

```text
/api/v2/auth/...
/api/v2/admin/...
/api/v2/agent/...
/api/v2/merchant/...
/api/v2/portal/...
```

其中：

| Prefix | 用途 |
| --- | --- |
| `/api/v2/auth` | 登入、登出、目前使用者。 |
| `/api/v2/admin` | 管理者後台全域功能。 |
| `/api/v2/agent` | 代理後台與代理樹功能。 |
| `/api/v2/merchant` | 商戶後台自身功能。 |
| `/api/v2/portal` | 代理與商戶共用入口功能，例如 API 文件。 |

目前程式已使用的舊路徑不一定要立刻改，建議先在後端提供 alias 或由前端 service 分批替換。

## 8. 後端實作優先級

### P0：入口與授權

1. `POST /api/login`
2. `GET /api/me`
3. Token claims：role、portal、data_scope、agent_id、merchant_id。
4. Middleware：MASTER / AGENT / MERCHANT 資料隔離。

### P1：核心 Demo 串接

1. 管理者總覽。
2. 商戶管理。
3. 代理管理與三級代理。
4. 內容管理：供應商、供應商幣別線、下注限額方案勾選、遊戲、維護排程、活動直接指定遊戲。
5. 交易中心：會員、注單、流水、補單、Wallet Router、轉點紀錄。
6. 財務中心：供應商帳務、代理帳務、平台毛利、匯率管理。

### P2：操作與輔助

1. 資金審核、人工調帳。
2. API 文件、Callback 測試、IP 白名單。
3. 品質中心：風控、告警、操作紀錄。
4. 系統設定、審計紀錄。

### P3：後續優化

1. Export 任務化。
2. 大表格 server-side sorting。
3. 權限矩陣細分到按鈕層級。
4. OpenAPI / Swagger 自動產生文件。

## 9. 前端串接狀態

| 區塊 | 狀態 |
| --- | --- |
| `src/services/apiClient.ts` | 已作為唯一 fetch 出口。 |
| `src/services/admin/content.ts` | 已收斂。 |
| `src/services/admin/finance.ts` | 已收斂部分資金審核。 |
| `src/services/admin/reports.ts` | 已收斂。 |
| `src/services/admin/merchants.ts` | 已收斂商戶供應商授權。 |
| `src/services/portal/*` | 代理 / 商戶端主要 API 已收斂。 |
| `src/services/legacy.ts` | 過渡保留，後續應移除。 |
| `src/services/admin/dashboard.ts` | 仍偏 demo data。 |
| `src/services/admin/transactions.ts` | 仍偏 demo data。 |

## 10. 驗收檢查

後端串接每個模組前，請確認：

1. API 是否使用共用 response wrapper。
2. 是否回傳 `trace_id`。
3. 列表是否支援 `page` / `page_size`。
4. 是否依 token claims 限制資料。
5. `AGENT` 是否只能讀代理樹資料。
6. `MERCHANT` 是否只能讀自身資料。
7. 金額欄位是否區分 `transaction_currency` 與 `settlement_currency`，並僅將 `display_currency` 作為舊版相容別名。
8. 正式結算幣別是否為 USDT。
9. 供應商帳務是否未掛代理或商戶作為主體。
10. 代理帳務是否包含下級代理結算與商戶結算展開。
11. 錯誤狀態是否以 `code` 與 `message` 回傳。
12. 前端 service 是否能不改 UI 直接替換 response。
