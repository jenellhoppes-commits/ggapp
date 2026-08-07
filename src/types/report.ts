export interface GameDetail {
    round_id: string;
    matrix: string[][];
    lines_won: { line_id: number; win: number; symbols: string[] }[];
    free_games_triggered: boolean;
    multiplier: number;
    currency: string;
}

export interface BetLog {
    // One record represents one member bet. round_id is a relation, never the row key.
    bet_id: string;
    round_id: string;
    transaction_id: string;
    provider_tx_id: string;
    idempotency_key: string;
    created_at: string;

    agent_id: string;
    agent_path: string;
    merchant_id: string;
    merchant_name: string;
    player_id: string;
    merchant_player_id: string;

    provider_id: string;
    provider_name: string;
    provider_game_id: string;
    game_name: string;
    provider_currency_connection_id: string;
    provider_currency_id: string;
    provider_currency: string;
    wallet_mode: 'seamless' | 'transfer';

    provider_bet_amount: number;
    provider_payout_amount: number | null;
    provider_refund_amount: number;
    provider_ggr: number | null;
    payout_scope: 'bet' | 'round' | 'unallocated';
    round_settlement_id: string | null;
    settlement_currency: 'USDT';
    settlement_bet_amount: number | null;
    settlement_payout_amount: number | null;
    settlement_ggr: number | null;
    settlement_status: 'pending_daily' | 'processing' | 'locked' | 'failed' | 'reopened';
    settlement_batch_id: string | null;
    exchange_rate_id: string | null;
    exchange_rate: number | null;

    provider_bet_group_id: string;
    provider_bet_group_code: string;
    provider_bet_group_name: string;
    provider_bet_group_version: string;
    limit_min_bet: number;
    limit_max_bet: number;
    limit_bet_step: number;
    limit_check_result: 'passed' | 'blocked' | 'manual_review';

    status: 'pending' | 'settled' | 'cancelled' | 'refunded' | 'abnormal';

    // Detail payload
    game_detail?: GameDetail;

    // Legacy aliases remain optional while older API consumers migrate.
    id?: string;
    merchant_display_id?: string;
    agg_player_id?: string;
    merchant_member_id?: string;
    bet_amount?: number;
    payout_amount?: number;
    net_win?: number;
    currency?: string;
    player_account?: string;
    win_amount?: number;
    profit?: number;
    payout?: number;
    merchant_code?: string;
    providerCode?: string;
    providerName?: string;
    originalBet?: number;
    originalWin?: number;
    exchangeRate?: number;
    providerId?: number;
    txId?: string;
    currencyBaseAmount?: number;
}

export interface BetLogSearchResponse {
    code: number;
    msg: string;
    data: {
        list: BetLog[];
        total: number;
    };
}

export type FinancialReportGroupBy = 'date' | 'agent' | 'provider' | 'merchant'

export interface FinancialReportItem {
    key: string; // Date, agent, provider, or merchant display name
    settlement_currency: 'USDT';
    total_bet: number;
    total_win: number;
    settlement_ggr: number;
    agent_game_charge: number;
    fx_service_fee: number;
    agent_receivable: number; // Final receivable, including FX fee and agent adjustment.
    provider_payable: number;
    provider_cost: number; // Backward-compatible alias of provider_payable.
    platform_adjustment: number;
    adjustment_amount: number;
    activity_cost: number;
    compensation_cost: number;
    platform_margin: number;
    margin_rate: number;
    round_count: number;
    settlement_status: 'pending_daily' | 'processing' | 'locked' | 'failed' | 'reopened';
    settlement_batch_id: string;

    // Legacy fields kept for older mock/report consumers.
    ggr?: number;
    rtp?: number;
}

export interface RoundSettlement {
    round_settlement_id: string;
    round_id: string;
    provider_id: string;
    provider_currency_connection_id: string;
    provider_currency: string;
    provider_round_win_amount: number;
    payout_scope: 'round';
    allocation_status: 'not_required' | 'provider_allocated' | 'unallocated';
    related_bet_ids: string[];
    settlement_currency: 'USDT';
    settlement_win_amount: number | null;
    settlement_status: 'pending_daily' | 'processing' | 'locked' | 'failed' | 'reopened';
    provider_raw_payload: string;
    created_at: string;
}
