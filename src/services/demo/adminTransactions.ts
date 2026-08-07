import type {
  BetDetail,
  BetListItem,
  CallbackRecord,
  LedgerWallet,
  PlayerWallet,
  RepairJobDetail,
  RepairJobListItem,
  RoundSettlementRecord,
  TransactionDetail,
  TransactionListItem,
  TransferRecord,
  WalletRouteRecord
} from '../admin/transactions'

export const betList: BetListItem[] = [
  {
    bet_id: 'BET-20260707-000884',
    round_id: 'R-PG-8842-78231',
    transaction_id: 'TX-20260707-000188',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    player_id: 'GGAP-P-8842',
    merchant_player_id: 'mem_8842',
    wallet_mode: 'seamless',
    provider_id: 'PROV-PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-TWD',
    provider_currency_id: 'PG-CUR-TWD-01',
    provider_merchant_id: 'PG-MCH-YOTA-TWD',
    provider_currency: 'TWD',
    game_id: 'PG-001',
    game_name: 'Mahjong Ways 2',
    game_type: 'Slot',
    status: 'settled',
    transaction_currency: 'TWD',
    transaction_bet_amount: 3200,
    transaction_payout_amount: 5400,
    payout_scope: 'bet',
    round_settlement_id: null,
    display_currency: 'TWD',
    display_bet_amount: 3200,
    display_payout_amount: 5400,
    display_ggr: -2200,
    provider_bet_amount: 3200,
    provider_payout_amount: 5400,
    settlement_currency: 'USDT',
    settlement_bet_amount: 101.59,
    settlement_payout_amount: 171.43,
    settlement_ggr: -69.84,
    settlement_status: 'locked',
    settlement_batch_id: 'SET-20260708-0001',
    settlement_rate_date: '2026-07-07',
    provider_tx_id: 'PG-TX-8842-78231',
    provider_round_status: 'SETTLED',
    created_at: '2026-07-07T08:31:22.000Z',
    settled_at: '2026-07-07T08:32:06.000Z'
  },
  {
    bet_id: 'BET-20260707-000771',
    round_id: 'R-PG-7711-99820',
    transaction_id: 'TX-20260707-000241',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_id: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    player_id: 'GGAP-P-7711',
    merchant_player_id: 'nova_7711',
    wallet_mode: 'transfer',
    provider_id: 'PROV-PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-THB',
    provider_currency_id: 'PG-CUR-THB-01',
    provider_merchant_id: 'PG-MCH-SEA-THB',
    provider_currency: 'THB',
    game_id: 'PG-002',
    game_name: 'Lucky Neko',
    game_type: 'Slot',
    status: 'provider_pending',
    transaction_currency: 'THB',
    transaction_bet_amount: 3200,
    transaction_payout_amount: null,
    payout_scope: 'unallocated',
    round_settlement_id: null,
    display_currency: 'THB',
    display_bet_amount: 3200,
    display_payout_amount: null,
    display_ggr: null,
    provider_bet_amount: 3200,
    provider_payout_amount: null,
    settlement_currency: 'USDT',
    settlement_bet_amount: null,
    settlement_payout_amount: null,
    settlement_ggr: null,
    settlement_status: 'pending_daily',
    settlement_batch_id: null,
    settlement_rate_date: null,
    provider_tx_id: 'PG-TX-7711-PENDING',
    provider_round_status: 'PENDING',
    created_at: '2026-07-07T09:02:18.000Z'
  }
]

export const roundSettlements: RoundSettlementRecord[] = [
  {
    round_settlement_id: 'RS-20260707-PP-77410',
    round_id: 'R-PP-77410-2201',
    provider_id: 'PROV-PP',
    provider_currency_line_id: 'PC-PP-VND',
    provider_currency: 'VND',
    provider_round_win_amount: 1840000,
    payout_scope: 'round',
    allocation_status: 'unallocated',
    related_bet_ids: ['BET-20260706-000925', 'BET-20260706-000926'],
    settlement_currency: 'USDT',
    settlement_win_amount: null,
    settlement_status: 'pending_daily',
    settlement_batch_id: null,
    provider_payload: '{"roundId":"R-PP-77410-2201","win":1840000,"currency":"VND"}',
    created_at: '2026-07-06T14:19:04.000Z'
  }
]

export const betDetails: Record<string, BetDetail> = {
  'BET-20260707-000884': {
    ...(betList[0] as BetListItem),
    settlement_bet_amount: 101.59,
    settlement_payout_amount: 171.43,
    exchange_rate_id: 'FX-20260707-TWD',
    exchange_rate: 31.5,
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-07T00:00:00.000+08:00',
    provider_payload: '{"roundId":"R-PG-8842-78231","bet":3200,"win":5400,"currency":"TWD","status":"SETTLED"}',
    wallet_payload: '{"callback":"seamless","debit":3200,"credit":5400,"idempotency_key":"idem-op1001-pg-8842"}',
    transaction_flows: [
      { flow_id: 'TX-20260707-000188', flow_type: 'Bet', status: 'success', amount: -3200, currency: 'TWD', created_at: '2026-07-07T08:31:22.000Z' },
      { flow_id: 'TX-20260707-000189', flow_type: 'Win', status: 'success', amount: 5400, currency: 'TWD', created_at: '2026-07-07T08:32:06.000Z' }
    ],
    repair_records: [],
    logs: [
      { action: 'Provider 回傳 Bet', operator: 'System', operated_at: '2026-07-07T08:31:22.000Z', trace_id: 'trace-bet-pg-8842' },
      { action: 'Provider 回傳 Win 並結算 Round', operator: 'System', operated_at: '2026-07-07T08:32:06.000Z', trace_id: 'trace-win-pg-8842' }
    ]
  },
  'BET-20260707-000771': {
    ...(betList[1] as BetListItem),
    settlement_bet_amount: null,
    settlement_payout_amount: null,
    exchange_rate_id: null,
    exchange_rate: null,
    exchange_fee_rate: 0.005,
    rate_locked_at: null,
    provider_payload: '{"roundId":"R-PG-7711-99820","bet":3200,"currency":"THB","status":"PENDING"}',
    wallet_payload: '{"wallet_mode":"transfer","ledger_id":"TR-20260707-000077","lock":3200}',
    transaction_flows: [
      { flow_id: 'TX-20260707-000241', flow_type: 'Bet', status: 'pending', amount: -3200, currency: 'THB', created_at: '2026-07-07T09:02:18.000Z' }
    ],
    repair_records: [
      { repair_id: 'RP-20260707-000011', reason: 'Provider Pending 查單', status: 'processing', operator: 'System', created_at: '2026-07-07T09:05:00.000Z' }
    ],
    logs: [
      { action: 'Provider 回傳 Pending', operator: 'System', operated_at: '2026-07-07T09:02:18.000Z', trace_id: 'trace-bet-pg-7711' },
      { action: '建立補單 / Provider 查單', operator: 'System', operated_at: '2026-07-07T09:05:00.000Z', trace_id: 'trace-repair-pg-7711' }
    ]
  }
}

export const transactionList: TransactionListItem[] = [
  {
    transaction_id: 'TX-20260707-000184',
    bet_id: 'BET-20260707-000884',
    round_id: 'R-PG-8842-78231',
    provider_tx_id: 'PG-TX-78231-BET',
    type: 'Bet',
    status: 'success',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    merchant_player_id: 'mem_8842',
    player_wallet_id: 'PW-OP1001-mem_8842-TWD',
    provider_id: 'PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-TWD',
    provider_currency_id: 'PG-CUR-TWD-01',
    provider_merchant_id: 'PG-MCH-YOTA-TWD',
    provider_currency: 'TWD',
    provider_amount: -3200,
    game_code: 'PG-FORTUNE-TIGER',
    game_name: 'Fortune Tiger',
    wallet_mode: 'seamless',
    display_currency: 'TWD',
    display_amount: -3200,
    settlement_currency: 'USDT',
    settlement_amount: -100.38,
    settlement_status: 'locked',
    settlement_batch_id: 'SET-20260708-0001',
    exchange_rate_id: 'FX-20260707-TWD',
    has_difference: false,
    repairable: false,
    idempotency_key: 'idem-op1001-bet-78231',
    callback_status: 'success',
    created_at: '2026-07-07T09:18:12.000Z',
    completed_at: '2026-07-07T09:18:14.000Z'
  },
  {
    transaction_id: 'TX-20260707-000241',
    bet_id: 'BET-20260707-000771',
    round_id: 'R-PG-7711-99820',
    provider_tx_id: 'PG-TX-7711-PENDING',
    type: 'Bet',
    status: 'provider_pending',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_id: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    merchant_player_id: 'nova_7711',
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    provider_id: 'PG',
    provider_name: 'PG Soft',
    provider_currency_line_id: 'PC-PG-THB',
    provider_currency_id: 'PG-CUR-THB-01',
    provider_merchant_id: 'PG-MCH-SEA-THB',
    provider_currency: 'THB',
    provider_amount: -3200,
    game_code: 'PG-LUCKY-NEKO',
    game_name: 'Lucky Neko',
    wallet_mode: 'transfer',
    display_currency: 'THB',
    display_amount: -3200,
    settlement_currency: 'USDT',
    settlement_amount: null,
    settlement_status: 'pending_daily',
    settlement_batch_id: null,
    exchange_rate_id: null,
    has_difference: false,
    repairable: true,
    idempotency_key: 'idem-ledger-lock-99820',
    callback_status: 'skipped',
    created_at: '2026-07-07T09:02:18.000Z'
  }
]

export const transferRecords: TransferRecord[] = [
  {
    transfer_id: 'TR-20260707-000077',
    ledger_id: 'LEDGER-THB-7711',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_id: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    merchant_player_id: 'nova_7711',
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    display_currency: 'THB',
    action: 'Lock',
    display_amount: -3200,
    settlement_currency: 'USDT',
    settlement_amount: -87.45,
    before_balance: 8400,
    after_balance: 5200,
    locked_balance: 3200,
    status: 'pending',
    idempotency_key: 'idem-ledger-lock-99820',
    related_transaction_id: 'TX-20260707-000241',
    related_round_id: 'R-PG-7711-99820',
    created_at: '2026-07-07T09:02:18.000Z'
  }
]

export const transactionDetails: Record<string, TransactionDetail> = {
  'TX-20260707-000184': {
    ...(transactionList[0] as TransactionListItem),
    player_wallet_id: 'PW-OP1001-mem_8842-TWD',
    exchange_rate_id: 'FX-20260707-TWD',
    exchange_rate: 31.8786,
    exchange_fee_rate: 0.005,
    rate_locked_at: '2026-07-07T00:00:00.000Z',
    idempotency_key: 'idem-op1001-bet-78231',
    merchant_callback_url: 'https://bluewhale.example/wallet/bet',
    callback_status: 'success',
    provider_status_code: '200 / OK',
    provider_returned_at: '2026-07-07T09:18:13.000Z',
    request_payload: '{"merchant_player_id":"mem_8842","amount":3200,"currency":"TWD"}',
    response_payload: '{"code":0,"balance":125200}',
    provider_request_payload: '{"provider_currency_id":"PG-CUR-TWD-01","provider_merchant_id":"PG-MCH-YOTA-TWD","amount":"3200.00","currency":"TWD"}',
    provider_response_payload: '{"status":"SUCCESS"}',
    flow_steps: [
      { name: '建立原幣交易流水', status: 'success', time: '2026-07-07T09:18:12.000Z', trace_id: 'trace-create-78231', note: '保存 Provider TWD 幣別線與逐筆注單' },
      { name: 'Provider Bet', status: 'success', time: '2026-07-07T09:18:13.000Z', trace_id: 'trace-provider-78231', note: 'Provider 回傳成功' }
    ],
    transfer_records: [],
    repair_records: []
  },
  'TX-20260707-000241': {
    ...(transactionList[1] as TransactionListItem),
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    exchange_rate_id: null,
    exchange_rate: null,
    exchange_fee_rate: 0.005,
    rate_locked_at: null,
    idempotency_key: 'idem-ledger-lock-99820',
    merchant_callback_url: '-',
    callback_status: 'skipped',
    provider_status_code: 'PROCESSING',
    provider_returned_at: '2026-07-07T09:02:18.000Z',
    request_payload: '{"wallet_mode":"transfer","amount":3200,"currency":"THB"}',
    response_payload: '{"ledger_status":"locked"}',
    provider_request_payload: '{"provider_currency_id":"PG-CUR-THB-01","provider_merchant_id":"PG-MCH-SEA-THB","amount":"3200.00","currency":"THB"}',
    provider_response_payload: '{"status":"PROCESSING"}',
    flow_steps: [
      { name: 'Transfer Ledger Lock', status: 'pending', time: '2026-07-07T09:02:18.000Z', trace_id: 'trace-ledger-99820', note: '已鎖定會員餘額' },
      { name: 'Provider Bet', status: 'pending', time: '2026-07-07T09:02:18.000Z', trace_id: 'trace-provider-99820', note: '等待 Provider 最終狀態' }
    ],
    transfer_records: [transferRecords[0] as TransferRecord],
    repair_records: [
      { repair_id: 'RP-20260707-000011', reason: 'Provider Pending 查單', status: 'processing', operator: 'System', created_at: '2026-07-07T09:05:00.000Z' }
    ]
  }
}

export const repairList: RepairJobListItem[] = [
  {
    repair_id: 'RP-20260707-000011',
    repair_type: 'Provider Pending',
    status: 'processing',
    priority: 'medium',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_id: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    merchant_player_id: 'nova_7711',
    wallet_mode: 'transfer',
    provider_name: 'PG Soft',
    transaction_id: 'TX-20260707-000241',
    round_id: 'R-PG-7711-99820',
    transfer_id: 'TR-20260707-000077',
    callback_id: '-',
    display_currency: 'THB',
    display_amount: -3200,
    settlement_currency: 'USDT',
    settlement_amount: -87.45,
    reason: 'Provider 回 PROCESSING，Transfer Wallet 已鎖定餘額。',
    suggested_action: 'query_provider',
    retry_count: 1,
    max_retry: 5,
    created_at: '2026-07-07T09:05:00.000Z',
    updated_at: '2026-07-07T09:20:00.000Z'
  }
]

export const repairDetails: Record<string, RepairJobDetail> = {
  'RP-20260707-000011': {
    ...(repairList[0] as RepairJobListItem),
    current_blocker: 'Provider 尚未回最終狀態',
    idempotency_key: 'idem-ledger-lock-99820',
    max_retry: 5,
    request_payload: '{"action":"query_provider","round_id":"R-PG-7711-99820"}',
    response_payload: '{"status":"PROCESSING"}',
    provider_payload: '{"provider_tx_id":"PG-TX-7711-PENDING","status":"PROCESSING"}',
    ledger_payload: '{"ledger_id":"LEDGER-THB-7711","locked_balance":3200}',
    steps: [
      { step: '建立補單', action: 'query_provider', status: 'done', operator: 'System', operated_at: '2026-07-07T09:05:00.000Z', trace_id: 'trace-rp-99820-create', note: '由 Provider Pending 自動建立' },
      { step: 'Provider 查單', action: 'query_provider', status: 'processing', operator: 'System', operated_at: '2026-07-07T09:20:00.000Z', trace_id: 'trace-rp-99820-query', note: '等待 Provider 最終狀態' }
    ],
    logs: [
      { action: 'Provider 查單', operator: 'System', operated_at: '2026-07-07T09:20:00.000Z', result: 'PROCESSING' }
    ]
  }
}

export const walletRouteRecords: WalletRouteRecord[] = [
  {
    route_id: 'WR-20260707-000018',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    merchant_player_id: 'mem_8842',
    display_currency: 'TWD',
    wallet_mode: 'seamless',
    route_target: 'Merchant Callback',
    trigger: 'Bet',
    idempotency_key: 'idem-op1001-bet-78231',
    status: 'success',
    latency_ms: 184,
    related_transaction_id: 'TX-20260707-000184',
    related_round_id: 'R-PG-8842-78231',
    created_at: '2026-07-07T09:18:12.000Z'
  }
]

export const ledgerWallets: LedgerWallet[] = [
  {
    ledger_id: 'LEDGER-THB-7711',
    player_wallet_id: 'PW-OP1008-nova_7711-THB',
    merchant_id: 'OP-1008',
    merchant_name: 'NovaPlay Entertainment',
    agent_id: 'AGT-SEA-001',
    agent_name: 'SEA Growth Agent',
    merchant_player_id: 'nova_7711',
    display_currency: 'THB',
    settlement_currency: 'USDT',
    available_balance: 5200,
    locked_balance: 3200,
    ledger_status: 'locked',
    last_action: 'Lock',
    last_transfer_id: 'TR-20260707-000077',
    last_changed_at: '2026-07-07T09:02:18.000Z'
  }
]

export const callbackRecords: CallbackRecord[] = [
  {
    callback_id: 'CB-20260707-000188',
    callback_type: 'Bet',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    wallet_mode: 'seamless',
    endpoint: 'https://bluewhale.example/wallet/bet',
    idempotency_key: 'idem-op1001-bet-78231',
    status: 'success',
    retry_count: 0,
    related_transaction_id: 'TX-20260707-000184',
    related_transfer_id: '-',
    transaction_currency: 'TWD',
    transaction_amount: 3200,
    original_trade_date: '2026-07-07',
    accounting_date: '2026-07-07',
    late_accounting_status: 'on_time',
    adjustment_batch_id: null,
    created_at: '2026-07-07T09:18:12.000Z',
    last_attempt_at: '2026-07-07T09:18:12.500Z'
  },
  {
    callback_id: 'CB-20260708-000041',
    callback_type: 'Win',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    wallet_mode: 'seamless',
    endpoint: 'https://bluewhale.example/wallet/win',
    idempotency_key: 'idem-op1001-win-late-78231',
    status: 'success',
    retry_count: 1,
    related_transaction_id: 'TX-20260707-000189',
    related_transfer_id: '-',
    transaction_currency: 'TWD',
    transaction_amount: 5400,
    original_trade_date: '2026-07-07',
    accounting_date: '2026-07-08',
    late_accounting_status: 'next_period_adjustment',
    adjustment_batch_id: 'ADJ-20260708-LATE-001',
    created_at: '2026-07-08T00:21:12.000+08:00',
    last_attempt_at: '2026-07-08T00:21:13.000+08:00'
  }
]

export const playerList: PlayerWallet[] = [
  {
    player_wallet_id: 'PW-OP1001-mem_8842-TWD',
    merchant_id: 'OP-1001',
    merchant_name: 'Blue Whale Interactive',
    agent_id: 'AGT-DIRECT',
    agent_name: '平台直營代理',
    merchant_player_id: 'mem_8842',
    display_currency: 'TWD',
    settlement_currency: 'USDT',
    wallet_mode: 'seamless',
    status: 'active',
    available_balance: 125200,
    locked_balance: 0,
    total_bet_settlement: 100.38,
    total_ggr_settlement: -69.84,
    last_session_at: '2026-07-07T09:18:14.000Z'
  }
]
