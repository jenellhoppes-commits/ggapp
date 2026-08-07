# GGAP 財務邏輯 V2

## 1. 財務主體

GGAP 同時維護三條資料線，但只有兩條正式帳務線：

1. 供應商應付：GGAP 對供應商付款。
2. 代理應收：GGAP 對 L1 代理或平台直營代理收款。
3. 代理內部結算：計算 L1 對 L2、L2 對 L3，以及代理對商戶的應收；這是代理帳務明細，不形成 GGAP 對商戶帳單。

供應商與代理沒有直接帳務關係。兩條正式帳務線只在平台毛利報表交會。

## 2. 幣別與金額層次

每筆交易必須同時保留以下層次：

- `transaction_currency` / `transaction_amount`：會員錢包、Merchant Callback 與 Provider 即時交易共同使用的真實原幣。
- `original_currency` / `original_amount`：Provider 實際交易幣別與金額。
- `settlement_currency`：MVP 固定為 USDT。
- `settlement_amount`：T-1 日結完成後的正式 USDT 金額。
- `exchange_rate_id` / `exchange_rate`：交易日公告匯率快照。
- `settlement_batch_id`：產生正式 USDT 金額的日結批次。

交易建立時 `settlement_status = pending_daily`，正式 USDT 欄位必須為空。日結鎖定後才能寫入 settlement 金額與匯率快照。

Seamless Wallet 的 Bet、Win、Refund、Rollback Callback 預設使用 `transaction_currency`，不得在即時階段改送 USDT。只有會員錢包本身就是 USDT 時，Callback 才能使用 USDT。

## 3. 匯率方向與日結

匯率方向固定為：

```text
1 USDT = N original_currency
base_settlement_ggr = original_ggr / base_rate
```

唯一業務時區固定為 `Asia/Taipei`。排程錯開執行：

- 00:00：關閉 T-1 帳期，延遲 Callback 進入待處理佇列。
- 00:05：取得並鎖定交易日公告匯率。
- 00:10：執行 T-1 日結與帳務來源產生。

日結順序：

1. 關閉 T-1 交易窗口並檢查未完成 Provider 交易。
2. 取得交易日公告匯率，建立不可變快照。
3. 依 Provider 幣別線彙總原幣 Bet、Win、Refund 與 GGR。
4. 換算 `base_settlement_ggr`。
5. 產生 `daily_trade_summary`。
6. 分別產生代理應收來源與供應商應付來源。
7. 鎖定批次、匯率、費率版本與正式 USDT 金額。

狀態：`pending_daily -> processing -> locked`。異常為 `failed`；人工重開為 `reopened`，重開與重算必須留下稽核紀錄。

## 4. 匯率服務費

匯率服務費獨立於公告匯率，不可藏入匯率：

```text
exchange_service_fee = max(base_settlement_ggr, 0) * exchange_service_fee_rate
```

費率優先序：代理／合約指定值 > 系統統一服務費率。MVP 預設為 0.5%。匯率管理只保存交易套用的服務費快照，不提供修改入口；服務費政策由系統設定或代理合約維護。

商戶報價加價與匯率服務費是兩種不同費率：

- `merchant_quote_markup_rate`：代理對商戶的商業報價加價，影響代理級差毛利。
- `exchange_service_fee_rate`：GGAP 的換匯服務費，沿代理樹原額穿透至平台，不形成代理毛利。

商戶未指定 Provider 報價時，使用商戶預設報價加價；不得拿系統匯率服務費率當成商戶報價備援值。

## 5. 供應商應付

正式維度：

```text
provider_id
+ provider_currency_connection_id
+ provider_currency_id
+ original_currency
+ settlement_currency
+ period
```

```text
provider_cost_base = apply_negative_ggr_policy(provider_report_ggr_usdt)
provider_game_cost = provider_cost_base * provider_cost_rate
provider_payable = provider_game_cost + fixed_fee + provider_adjustment
```

Provider 報表與平台快照若出現 GGR 差異，成本影響為 `ggr_difference_usdt × provider_cost_rate`；不可把整筆 GGR 差異直接當作應付調整。只有供應商確認的折讓、補款、固定費或其他帳單項目才能直接寫入 `provider_adjustment`。

正式金額以供應商報表、Provider 交易快照、合約費率版本及調整金額計算。`agent_id`、`merchant_id` 只能作來源追溯，不可作供應商帳單主維度。

供應商帳單保存 `invoice_currency`，付款保存 `payment_currency`。MVP 預設依 Provider 合約使用各幣別線原幣請款與付款，同時保存不可變的 USDT 帳務鏡像；後台跨供應商彙總只加總 USDT 鏡像，不可直接加總不同原幣。

負 GGR 依供應商合約採 `carry_forward` 或 `zero_out`。Carry Forward 必須使用獨立餘額，不得產生負帳單：

```text
applied_carry_forward = min(max(provider_report_ggr_usdt, 0), opening_carry_forward)
provider_cost_base = max(provider_report_ggr_usdt, 0) - applied_carry_forward
closing_carry_forward = opening_carry_forward
                        - applied_carry_forward
                        + abs(min(provider_report_ggr_usdt, 0))
provider_payable = max(provider_game_cost + fixed_fee + provider_adjustment, 0)
```

## 6. 代理應收

正式維度：

```text
root_agent_id + settlement_currency + period
```

明細依 Provider、商戶、下級代理與原幣展開，以套用費率快照：

```text
agent_game_charge = max(base_settlement_ggr, 0) * agent_rate
final_agent_receivable = agent_game_charge
                       + exchange_service_fee
                       + agent_adjustment
```

GGAP 正式只向 L1 或平台直營代理收款。L2、L3 不直接形成 GGAP 應收帳單。

## 7. 代理內部結算

```text
child_agent_receivable = max(base_settlement_ggr, 0) * child_rate
                       + exchange_service_fee
                       + child_agent_adjustment
child_agent_margin = max(base_settlement_ggr, 0) * (child_rate - upstream_rate)

merchant_receivable_to_agent = max(base_settlement_ggr, 0) * merchant_quote_rate
                             + exchange_service_fee
                             + merchant_adjustment
merchant_margin = max(base_settlement_ggr, 0) * (merchant_quote_rate - agent_upstream_rate)
```

`exchange_service_fee` 為平台費用，需從商戶沿 L3、L2、L1 原額穿透至 GGAP；不得列入任何代理層級毛利，也不得在每一層重新加乘一次。

商戶與下級代理可依 Provider 覆寫費率；沒有指定時繼承上層統一費率。費率必須保存版本與生效時間，歷史帳期不可因新費率而重算。

## 8. 平台毛利

為避免重複計入服務費，平台毛利使用代理最終應收：

```text
platform_margin = final_agent_receivable
                - provider_payable
                + platform_adjustment
                - activity_cost
                - compensation_cost
```

等價展開：

```text
platform_margin = agent_game_charge
                + exchange_service_fee
                - provider_payable
                + platform_adjustment
                - activity_cost
                - compensation_cost
```

不可同時使用 `final_agent_receivable` 又額外加一次 `exchange_service_fee`。

## 9. 帳單與收付款

- 供應商帳單：`PROVIDER_PAYABLE`，對象為 Provider。
- 代理帳單：`AGENT_RECEIVABLE`，對象為 L1 或平台直營代理。
- 商戶與下級代理結算：只存在代理帳務明細及代理報表，不建立 GGAP 正式帳單。
- 帳單只能引用已鎖定的日結與費率快照。
- 建立帳單時必須保存 `invoice_amount_usdt`、`invoice_amount_original`、`invoice_currency` 與 `invoice_exchange_rate` 不可變快照；後續匯率或帳務來源異動不得改寫既有帳單。
- 付款、收款、調帳、重開與作廢均需獨立流水及 `trace_id`。

## 10. 金額與 API 規則

- DB 使用 `DECIMAL`，API 金額與匯率使用 decimal string。
- 前端只在顯示層轉為格式化字串，不使用浮點數作正式財務計算。
- 每筆交易需有 `idempotency_key`；Provider 注單唯一鍵為 `provider_currency_connection_id + provider_bet_id`。
- 歷史匯率、費率版本、日結批次及帳單來源均不可覆寫。

## 11. 延遲 Callback 與帳期歸屬

- 以 Provider 事件時間決定 `original_trade_date`，以系統實際接受時間保存 `accepted_at`。
- 00:00 關帳後、00:10 批次鎖定前收到的 T-1 事件進入待處理佇列；只有批次尚未開始時可納入原帳期。
- 批次已鎖定後收到的事件不得自動重開或改寫 T-1；建立 `next_period_adjustment`，保留原交易日並於下一個開放帳期入帳。
- 只有財務主管可人工重開，且必須保存原因、核准者、舊批次、新批次與 `trace_id`。
- Callback、逐筆交易與調整紀錄需保存 `original_trade_date`、`accounting_date`、`late_accounting_status` 與 `adjustment_batch_id`。
