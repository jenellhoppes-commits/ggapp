import type { MerchantBetLimitAssignment } from './gameLimit'

export type MerchantStatus = 'active' | 'disabled' | 'frozen' | 'archived'
export type MerchantWalletMode = 'seamless' | 'transfer'
export type MerchantCurrency = 'USDT' | 'USD' | 'TWD' | 'CNY' | 'PHP' | 'THB' | 'VND' | 'IDR'
export type MerchantCallbackAmountMode = 'transaction_currency' | 'settlement_currency'

export interface MerchantAuditLog {
    audit_no: string;
    operated_at: string;
    operator: string;
    action: string;
    target: string;
    ip_address: string;
    trace_id: string;
    result: 'success' | 'failed';
}

export interface MerchantAgentTransferLog {
    transfer_no: string;
    from_agent: string;
    to_agent: string;
    effective_at: string;
    operator: string;
    reason: string;
}

export interface MerchantQuoteRate {
    provider_id: string;
    provider_name: string;
    provider_cost_rate_snapshot: number;
    agent_upstream_rate: number;
    quote_markup_rate?: number;
    quote_markup_source?: 'provider_override' | 'merchant_default';
    merchant_quote_rate: number;
    merchant_margin_rate: number;
    rate_source_agent_id: string;
    rate_source_agent_level: 1 | 2 | 3;
    rate_version?: string;
    effective_at: string;
    status: 'active' | 'draft' | 'expired';
}

export interface Merchant {
    id: number;
    display_id: string;
    merchant_code?: string;
    site_code: string;
    merchant_name?: string;
    merchant_type?: 'merchant';
    account: string;
    name: string;
    remarks?: string;
    contact_name?: string;
    contact_email?: string;
    telegram?: string;
    phone?: string;
    currency_type: MerchantCurrency;
    supported_currencies?: string[];
    multi_currency_enabled?: boolean;
    transaction_currencies?: MerchantCurrency[];
    display_currencies?: MerchantCurrency[];
    default_transaction_currency?: MerchantCurrency;
    default_display_currency?: MerchantCurrency;
    settlement_currency?: 'USDT';
    callback_amount_mode?: MerchantCallbackAmountMode;
    service_fee_rate?: number;
    default_merchant_markup_rate?: number;
    service_fee_amount?: number;
    base_usdt_amount?: number;
    final_settlement_usdt?: number;
    daily_settlement_time?: string;
    fx_rate_update_time?: string;
    exchange_fee_rate?: number;
    base_rate?: number;
    exchange_rate_id?: string;
    rate_locked_at?: string;
    percent: number;
    revenue_share?: number;
    fixed_fee?: number;
    minimum_guarantee?: number;
    settlement_cycle?: 'daily' | 'weekly' | 'monthly';
    special_rate_count?: number;
    authorized_providers?: string[];
    enabled_provider_count?: number;
    enabled_game_count?: number;
    disabled_game_count?: number;
    game_package?: string;
    state: number;
    status?: MerchantStatus;
    created_at: string;
    updated_at?: string;
    walletMode?: MerchantWalletMode;
    wallet_mode?: MerchantWalletMode;
    api_key?: string;
    api_secret_masked?: string;
    secretKey?: string;
    callback_url?: string;
    ipWhitelist?: string[];
    ip_whitelist?: string[];
    sign_method?: 'HMAC-SHA256' | 'RSA';
    api_status?: 'active' | 'disabled' | 'testing';
    environment?: 'sandbox' | 'production';
    balance_url?: string;
    bet_url?: string;
    win_url?: string;
    rollback_url?: string;
    refund_url?: string;
    timeout_ms?: number;
    retry_count?: number;
    allow_negative_balance?: boolean;
    idempotency_enabled?: boolean;
    baseCurrency?: string;
    balance?: number;
    credit_limit?: number;
    parent_agent?: string;
    agent_id?: number;
    agent_code?: string;
    agent_name?: string;
    agent_level?: 1 | 2 | 3;
    parent_agent_code?: string | null;
    root_agent_code?: string;
    settlement_agent_code?: string;
    agent_path?: string;
    is_direct_agent?: boolean;
    settlement_owner_type?: 'agent';
    agent_binding?: boolean;
    agent_commission_mode?: 'GGR' | 'NGR' | 'valid_bet';
    agent_commission_rate?: number;
    merchant_quote_rates?: MerchantQuoteRate[];
    bet_limit_assignments?: MerchantBetLimitAssignment[];
    agent_effective_at?: string;
    today_bet?: number;
    today_payout?: number;
    today_ggr?: number;
    settlement_today_bet?: number;
    settlement_today_payout?: number;
    settlement_today_ggr?: number;
    active_players?: number;
    transaction_success_rate?: number;
    failed_transactions?: number;
    receivable_amount?: number;
    pending_settlement_amount?: number;
    invoice_status?: 'none' | 'pending' | 'confirmed' | 'overdue';
    agent_transfer_logs?: MerchantAgentTransferLog[];
    audit_logs?: MerchantAuditLog[];
}

export interface MerchantDetail extends Merchant {
    secret_key: string; // UUID
    wallet_mode: 'transfer' | 'seamless';
    ip_whitelist: string[];
    rtp_level: number;
}
