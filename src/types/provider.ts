export type ProviderWalletMode = 'seamless' | 'transfer';
export type ProviderCurrencyStatus = 'connected' | 'testing' | 'disabled';

export interface ProviderCurrencyConnection {
    connection_id: string;
    provider_currency_id: string;
    provider_merchant_id: string;
    currency: string;
    accounting_currency?: 'USDT';
    invoice_currency?: string;
    payment_currency?: string;
    wallet_mode: ProviderWalletMode;
    api_url: string;
    api_key?: string;
    api_key_mask?: string;
    credential?: string;
    credential_mask?: string;
    certificate_name?: string;
    callback_url?: string;
    amount_precision: number;
    status: ProviderCurrencyStatus;
    is_default?: boolean;
    last_tested_at?: string;
}

export interface Provider {
    id: number;
    code: string;
    name: string;
    status: 'active' | 'maintenance';
    apiConfig: {
        apiUrl?: string;
        merchantCode?: string;
        secretKey?: string;
        revenueShare?: number;
        currency?: string;
        [key: string]: string | number | boolean | undefined;
    };
    type?: string;
    gameCount?: number;
    platform_accounting_currency?: 'USDT';
    provider_wallet_currency?: string;
    currency_connections?: ProviderCurrencyConnection[];
    cost_billing_mode?: 'GGR';
    provider_cost_rate?: number;
    negative_ggr_policy?: 'carry_forward' | 'zero_out';
    cost_rate_version?: string;
    cost_rate_effective_at?: string;
    cost_rate_history?: Array<{
        version: string;
        provider_cost_rate: number;
        negative_ggr_policy: 'carry_forward' | 'zero_out';
        effective_at: string;
        changed_by: string;
        changed_at: string;
        remarks?: string;
    }>;
    service_status?: 'active' | 'maintenance';
    integration_status?: 'connected' | 'testing' | 'disabled';
    contract?: {
        costPercent: number;
        expiryDate: number | string;
    };
    contractConfig?: {
        accounting_currency: 'USDT';
        rules: {
            slot_free_spin: { enabled: boolean; provider_share: number };
            live_tip: { enabled: boolean; provider_share: number };
            card_fee: { enabled: boolean; provider_share: number };
        };
    };
    maintenanceConfig?: {
        isEmergency: boolean;
        startTime?: number;
        endTime?: number;
    };
}

export interface ProviderListResponse {
    code: number;
    msg: string;
    data: {
        list: Provider[];
        total: number;
    };
}
