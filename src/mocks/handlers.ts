import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import type { Merchant, MerchantDetail } from '../types/merchant'
import type { Provider } from '../types/provider'
import { buildFinancialReport } from './financialReport'
import { mockGames } from './data/games'
import { financeHandlers } from './finance'
import { systemHandlers } from './system'
import { agentHandlers } from './agent'
import { fundsHandlers } from './funds'

// ... existing code ...

// Helper Functions
function createRandomMerchant(id: number): Merchant {
    const walletMode = faker.helpers.arrayElement(['transfer', 'seamless']) as 'transfer' | 'seamless'
    const displayId = `OP-${(1000 + id).toString()}`
    const displayCurrency = faker.helpers.arrayElement(['TWD', 'PHP', 'THB', 'VND', 'IDR']) as Merchant['currency_type']
    const displayCurrencyRates: Record<string, number> = {
        TWD: 32,
        PHP: 58,
        THB: 36,
        VND: 25500,
        IDR: 16200
    }
    const baseRate = displayCurrencyRates[displayCurrency] ?? 32
    const serviceFeeRate = 0.005
    const displayCurrencies = Array.from(new Set([
        displayCurrency,
        ...faker.helpers.arrayElements(['TWD', 'PHP', 'THB', 'VND', 'IDR'] as Merchant['currency_type'][], { min: 1, max: 3 })
    ])) as Merchant['currency_type'][]
    const todayBet = faker.number.float({ min: 25000, max: 800000, fractionDigits: 2 })
    const todayPayout = todayBet * faker.number.float({ min: 0.78, max: 1.04, fractionDigits: 4 })
    const settlementTodayBet = todayBet / baseRate
    const settlementTodayPayout = todayPayout / baseRate
    const settlementTodayGgr = settlementTodayBet - settlementTodayPayout
    const serviceFeeAmount = Math.max(settlementTodayGgr, 0) * serviceFeeRate
    const agent = faker.helpers.arrayElement([
        { id: 1, code: 'AGT-DIRECT', name: '平台直營代理', direct: true, level: 1 as const, parent: null, root: 'AGT-DIRECT', settlement: 'AGT-DIRECT', path: 'AGT-DIRECT', upstream: { PG: 0.07, JILI: 0.085, EVO: 0.1, PP: 0.082 } },
        { id: 2, code: 'AGT-SEA-001', name: 'SEA Growth Agent', direct: false, level: 1 as const, parent: null, root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001', upstream: { PG: 0.075, JILI: 0.09, EVO: 0.095, PP: 0.078 } },
        { id: 3, code: 'AGT-SEA-SUB01', name: 'SEA Sub Agent 01', direct: false, level: 2 as const, parent: 'AGT-SEA-001', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01', upstream: { PG: 0.088, JILI: 0.102, EVO: 0.108, PP: 0.092 } },
        { id: 4, code: 'AGT-SEA-SUB01-L3', name: 'SEA Local Desk L3', direct: false, level: 3 as const, parent: 'AGT-SEA-SUB01', root: 'AGT-SEA-001', settlement: 'AGT-SEA-001', path: 'AGT-SEA-001 / AGT-SEA-SUB01 / AGT-SEA-SUB01-L3', upstream: { PG: 0.096, JILI: 0.11, EVO: 0.116, PP: 0.1 } }
    ])
    const quoteProviders = [
        { provider_id: 'PG', provider_name: 'PG Soft', cost: 0.04 },
        { provider_id: 'JILI', provider_name: 'JILI', cost: 0.05 },
        { provider_id: 'EVO', provider_name: 'Evolution', cost: 0.06 },
        { provider_id: 'PP', provider_name: 'Pragmatic Play', cost: 0.05 }
    ]
    const merchantQuoteRates = quoteProviders.map((provider) => {
        const upstreamRate = agent.upstream[provider.provider_id as keyof typeof agent.upstream]
        const quoteRate = upstreamRate + faker.number.float({ min: 0.008, max: 0.025, fractionDigits: 4 })
        return {
            provider_id: provider.provider_id,
            provider_name: provider.provider_name,
            provider_cost_rate_snapshot: provider.cost,
            agent_upstream_rate: upstreamRate,
            quote_markup_rate: quoteRate - upstreamRate,
            quote_markup_source: 'provider_override' as const,
            merchant_quote_rate: quoteRate,
            merchant_margin_rate: quoteRate - upstreamRate,
            rate_source_agent_id: agent.code,
            rate_source_agent_level: agent.level,
            effective_at: '2026-07-01T01:00:00.000Z',
            status: 'active' as const
        }
    })
    const status = faker.helpers.weightedArrayElement([
        { weight: 70, value: 'active' },
        { weight: 16, value: 'disabled' },
        { weight: 10, value: 'frozen' },
        { weight: 4, value: 'archived' }
    ]) as Merchant['status']
    const merchantName = faker.helpers.arrayElement([
        'Golden Dragon Gaming',
        'NovaPlay Entertainment',
        'Blue Whale Interactive',
        'Royal Ace Group',
        'Lucky Star Digital',
        'HyperWin Network'
    ])
    const enabledProviderCount = faker.number.int({ min: 2, max: 5 })
    const enabledGameCount = faker.number.int({ min: 80, max: 620 })

    return {
        id,
        display_id: displayId,
        merchant_code: displayId,
        site_code: faker.string.alpha({ length: 3, casing: 'upper' }),
        account: faker.internet.username(),
        name: merchantName,
        merchant_name: merchantName,
        merchant_type: 'merchant',
        remarks: faker.helpers.arrayElement(['正式營運商戶', '待完成 Production 上線檢查', 'VIP 商務合作戶', 'Sandbox 驗證中']),
        contact_name: faker.person.fullName(),
        contact_email: faker.internet.email(),
        telegram: `@${faker.internet.username().toLowerCase()}`,
        phone: faker.phone.number(),
        currency_type: displayCurrency,
        supported_currencies: displayCurrencies,
        multi_currency_enabled: true,
        transaction_currencies: displayCurrencies,
        display_currencies: displayCurrencies,
        default_transaction_currency: displayCurrency,
        default_display_currency: displayCurrency,
        settlement_currency: 'USDT',
        callback_amount_mode: 'transaction_currency',
        service_fee_rate: serviceFeeRate,
        service_fee_amount: Number(serviceFeeAmount.toFixed(4)),
        base_usdt_amount: Number(settlementTodayGgr.toFixed(4)),
        final_settlement_usdt: Number((settlementTodayGgr + serviceFeeAmount).toFixed(4)),
        daily_settlement_time: '00:10 Asia/Taipei',
        fx_rate_update_time: '00:05 Asia/Taipei',
        exchange_fee_rate: serviceFeeRate,
        base_rate: baseRate,
        exchange_rate_id: `FX-${displayCurrency}-USDT-${faker.date.recent({ days: 1 }).toISOString().slice(0, 10).replace(/-/g, '')}`,
        rate_locked_at: faker.date.recent({ days: 1 }).toISOString(),
        percent: faker.number.float({ min: 10, max: 90, fractionDigits: 2 }), // Refers to revenue_share
        revenue_share: faker.number.float({ min: 10, max: 90, fractionDigits: 2 }),
        fixed_fee: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }),
        minimum_guarantee: faker.number.float({ min: 0, max: 20000, fractionDigits: 2 }),
        settlement_cycle: faker.helpers.arrayElement(['weekly', 'monthly']),
        special_rate_count: faker.number.int({ min: 0, max: 6 }),
        authorized_providers: faker.helpers.arrayElements(['pg', 'evo', 'pp', 'jili', 'habanero'], { min: 0, max: 3 }),
        enabled_provider_count: enabledProviderCount,
        enabled_game_count: enabledGameCount,
        disabled_game_count: faker.number.int({ min: 0, max: 24 }),
        game_package: faker.helpers.arrayElement(['Default Global Pack', 'VIP Slot Pack', 'Live Casino Pack', 'SEA Market Pack']),
        state: status === 'active' ? 1 : 0,
        status,
        created_at: faker.date.past().toISOString(),
        updated_at: faker.date.recent({ days: 12 }).toISOString(),
        // Extended fields
        walletMode,
        wallet_mode: walletMode,
        api_key: `ak_${faker.string.alphanumeric(18).toLowerCase()}`,
        api_secret_masked: 'sk_live_****************',
        secretKey: faker.string.uuid(),
        callback_url: `https://wallet.${faker.internet.domainName()}/ggap/callback`,
        ipWhitelist: [faker.internet.ip(), faker.internet.ip()],
        ip_whitelist: [faker.internet.ip(), faker.internet.ip()],
        sign_method: faker.helpers.arrayElement(['HMAC-SHA256', 'RSA']),
        api_status: status === 'active' ? faker.helpers.arrayElement(['active', 'testing']) : 'disabled',
        environment: faker.helpers.arrayElement(['sandbox', 'production']),
        balance_url: `https://wallet.${faker.internet.domainName()}/balance`,
        bet_url: `https://wallet.${faker.internet.domainName()}/bet`,
        win_url: `https://wallet.${faker.internet.domainName()}/win`,
        rollback_url: `https://wallet.${faker.internet.domainName()}/rollback`,
        refund_url: `https://wallet.${faker.internet.domainName()}/refund`,
        timeout_ms: faker.helpers.arrayElement([3000, 5000, 8000]),
        retry_count: faker.number.int({ min: 1, max: 3 }),
        allow_negative_balance: faker.number.float({ min: 0, max: 1 }) < 0.18,
        idempotency_enabled: true,
        baseCurrency: 'USDT',
        parent_agent: agent.name,
        agent_id: agent.id,
        agent_code: agent.code,
        agent_name: agent.name,
        agent_level: agent.level,
        parent_agent_code: agent.parent,
        root_agent_code: agent.root,
        settlement_agent_code: agent.settlement,
        agent_path: agent.path,
        is_direct_agent: agent.direct,
        settlement_owner_type: 'agent',
        agent_binding: true,
        agent_commission_mode: faker.helpers.arrayElement(['GGR', 'NGR', 'valid_bet']),
        agent_commission_rate: faker.number.float({ min: 2, max: 18, fractionDigits: 2 }),
        merchant_quote_rates: merchantQuoteRates,
        agent_effective_at: faker.date.past().toISOString(),
        today_bet: Number(todayBet.toFixed(2)),
        today_payout: Number(todayPayout.toFixed(2)),
        today_ggr: Number((todayBet - todayPayout).toFixed(2)),
        settlement_today_bet: Number(settlementTodayBet.toFixed(4)),
        settlement_today_payout: Number(settlementTodayPayout.toFixed(4)),
        settlement_today_ggr: Number(settlementTodayGgr.toFixed(4)),
        active_players: faker.number.int({ min: 120, max: 9500 }),
        transaction_success_rate: faker.number.float({ min: 96.2, max: 99.99, fractionDigits: 2 }),
        failed_transactions: faker.number.int({ min: 0, max: 38 }),
        receivable_amount: faker.number.float({ min: 1000, max: 96000, fractionDigits: 2 }),
        pending_settlement_amount: faker.number.float({ min: 0, max: 48000, fractionDigits: 2 }),
        invoice_status: faker.helpers.arrayElement(['none', 'pending', 'confirmed', 'overdue']),
        agent_transfer_logs: Array.from({ length: agent.direct ? 1 : 2 }).map((_, index) => ({
            transfer_no: `TRF-${faker.string.numeric(8)}`,
            from_agent: index === 0 ? '未指定' : '平台直營代理',
            to_agent: index === 0 ? agent.name : faker.helpers.arrayElement(['SEA Growth Agent', 'VIP Channel Agent']),
            effective_at: faker.date.past().toISOString(),
            operator: faker.helpers.arrayElement(['Admin', 'Operation Admin']),
            reason: index === 0 ? '新增商戶預設歸屬' : '商務轉移代理歸屬'
        })),
        audit_logs: Array.from({ length: 4 }).map((_, index) => ({
            audit_no: `AUD-${faker.string.numeric(8)}`,
            operated_at: faker.date.recent({ days: index + 1 }).toISOString(),
            operator: faker.helpers.arrayElement(['Admin', 'Finance Admin', 'Tech Admin', 'Risk Admin']),
            action: faker.helpers.arrayElement(['更新商戶設定', '重置 API Secret', '調整遊戲權限', '測試 Callback URL']),
            target: displayId,
            ip_address: faker.internet.ip(),
            trace_id: `trace-${faker.string.uuid()}`,
            result: 'success'
        })),
        // Balance only for transfer wallet mode
        balance: walletMode === 'transfer'
            ? faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 })
            : undefined,
        credit_limit: faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 })
    }
}

// Mock Providers
export const mockProviders: Provider[] = [
    {
        id: 1,
        code: 'pg',
        name: 'PG Soft',
        status: 'active',
        type: 'Slot',
        gameCount: 128,
        platform_accounting_currency: 'USDT',
        provider_wallet_currency: 'TWD',
        currency_connections: [
            { connection_id: 'PC-PG-TWD', provider_currency_id: 'PG-CUR-TWD-01', provider_merchant_id: 'PG-MCH-YOTA-TWD', currency: 'TWD', wallet_mode: 'seamless', api_url: 'https://api.pgsoft.com/twd', api_key_mask: 'pg_twd_****91A2', credential_mask: 'cert_****TWD', callback_url: 'https://api.ggap.example/provider/pg/twd/callback', amount_precision: 2, status: 'connected', is_default: true, last_tested_at: '2026-07-07T08:30:00.000Z' },
            { connection_id: 'PC-PG-THB', provider_currency_id: 'PG-CUR-THB-01', provider_merchant_id: 'PG-MCH-SEA-THB', currency: 'THB', wallet_mode: 'seamless', api_url: 'https://api.pgsoft.com/thb', api_key_mask: 'pg_thb_****73C4', credential_mask: 'cert_****THB', callback_url: 'https://api.ggap.example/provider/pg/thb/callback', amount_precision: 2, status: 'connected', last_tested_at: '2026-07-07T08:35:00.000Z' },
            { connection_id: 'PC-PG-USDT', provider_currency_id: 'PG-CUR-USDT-01', provider_merchant_id: 'PG-MCH-USDT', currency: 'USDT', wallet_mode: 'transfer', api_url: 'https://api.pgsoft.com/usdt', api_key_mask: 'pg_usdt_****45E6', credential_mask: 'cert_****USDT', callback_url: 'https://api.ggap.example/provider/pg/usdt/callback', amount_precision: 2, status: 'testing', last_tested_at: '2026-07-07T08:40:00.000Z' }
        ],
        cost_billing_mode: 'GGR',
        provider_cost_rate: 0.04,
        negative_ggr_policy: 'carry_forward',
        cost_rate_version: 'PG-COST-2026.07',
        cost_rate_effective_at: '2026-07-01T00:00:00.000Z',
        service_status: 'active',
        integration_status: 'connected',
        cost_rate_history: [
            { version: 'PG-COST-2026.07', provider_cost_rate: 0.04, negative_ggr_policy: 'carry_forward', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', changed_at: '2026-06-25T03:00:00.000Z', remarks: 'MVP USDT 成本費率' },
            { version: 'PG-COST-2026.06', provider_cost_rate: 0.045, negative_ggr_policy: 'carry_forward', effective_at: '2026-06-01T00:00:00.000Z', changed_by: 'Finance', changed_at: '2026-05-25T03:00:00.000Z' }
        ],
        apiConfig: {
            apiUrl: 'https://api.pgsoft.com',
            merchantCode: 'AGG_TEST',
            secretKey: 'sk_pg_123',
            revenueShare: 12,
            currency: 'USD'
        },
        contractConfig: {
            accounting_currency: 'USDT',
            rules: {
                slot_free_spin: { enabled: false, provider_share: 0 },
                live_tip: { enabled: false, provider_share: 0 },
                card_fee: { enabled: false, provider_share: 0 }
            }
        }
    },
    {
        id: 2,
        code: 'evo',
        name: 'Evolution',
        status: 'active',
        type: 'Live',
        gameCount: 85,
        platform_accounting_currency: 'USDT',
        provider_wallet_currency: 'TWD',
        currency_connections: [
            { connection_id: 'PC-EVO-TWD', provider_currency_id: 'EVO-CUR-TWD-01', provider_merchant_id: 'EVO-MCH-TWD', currency: 'TWD', wallet_mode: 'seamless', api_url: 'https://api.evolution.com/twd', api_key_mask: 'evo_twd_****12A8', credential_mask: 'cert_****TWD', amount_precision: 2, status: 'connected', is_default: true },
            { connection_id: 'PC-EVO-PHP', provider_currency_id: 'EVO-CUR-PHP-01', provider_merchant_id: 'EVO-MCH-PHP', currency: 'PHP', wallet_mode: 'seamless', api_url: 'https://api.evolution.com/php', api_key_mask: 'evo_php_****35B7', credential_mask: 'cert_****PHP', amount_precision: 2, status: 'testing' }
        ],
        cost_billing_mode: 'GGR',
        provider_cost_rate: 0.06,
        negative_ggr_policy: 'carry_forward',
        cost_rate_version: 'EVO-COST-2026.07',
        cost_rate_effective_at: '2026-07-01T00:00:00.000Z',
        service_status: 'active',
        integration_status: 'connected',
        cost_rate_history: [
            { version: 'EVO-COST-2026.07', provider_cost_rate: 0.06, negative_ggr_policy: 'carry_forward', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', changed_at: '2026-06-26T03:20:00.000Z' }
        ],
        apiConfig: {
            apiUrl: 'https://api.evolution.com',
            merchantCode: 'AGG_EVO',
            secretKey: 'sk_evo_456',
            revenueShare: 10,
            currency: 'EUR'
        },
        contractConfig: {
            accounting_currency: 'USDT',
            rules: {
                slot_free_spin: { enabled: false, provider_share: 0 },
                live_tip: { enabled: false, provider_share: 0 },
                card_fee: { enabled: false, provider_share: 0 }
            }
        }
    },
    {
        id: 3,
        code: 'pp',
        name: 'Pragmatic Play',
        status: 'active',
        type: 'Slot',
        gameCount: 256,
        platform_accounting_currency: 'USDT',
        provider_wallet_currency: 'VND',
        currency_connections: [
            { connection_id: 'PC-PP-VND', provider_currency_id: 'PP-CUR-VND-01', provider_merchant_id: 'PP-MCH-VND', currency: 'VND', wallet_mode: 'transfer', api_url: 'https://api.pragmaticplay.com/vnd', api_key_mask: 'pp_vnd_****92D1', credential_mask: 'cert_****VND', amount_precision: 0, status: 'connected', is_default: true }
        ],
        cost_billing_mode: 'GGR',
        provider_cost_rate: 0.05,
        negative_ggr_policy: 'zero_out',
        cost_rate_version: 'PP-COST-2026.07',
        cost_rate_effective_at: '2026-07-01T00:00:00.000Z',
        service_status: 'active',
        integration_status: 'connected',
        cost_rate_history: [
            { version: 'PP-COST-2026.07', provider_cost_rate: 0.05, negative_ggr_policy: 'zero_out', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', changed_at: '2026-06-24T04:10:00.000Z' }
        ],
        apiConfig: {
            apiUrl: 'https://api.pragmaticplay.com',
            merchantCode: 'AGG_PP',
            secretKey: 'sk_pp_789',
            revenueShare: 15,
            currency: 'USD'
        },
        contractConfig: {
            accounting_currency: 'USDT',
            rules: {
                slot_free_spin: { enabled: false, provider_share: 0 },
                live_tip: { enabled: false, provider_share: 0 },
                card_fee: { enabled: false, provider_share: 0 }
            }
        }
    },
    {
        id: 4,
        code: 'jili',
        name: 'JILI',
        status: 'maintenance',
        type: 'Slot',
        gameCount: 67,
        platform_accounting_currency: 'USDT',
        provider_wallet_currency: 'PHP',
        currency_connections: [
            { connection_id: 'PC-JILI-PHP', provider_currency_id: 'JILI-CUR-PHP-01', provider_merchant_id: 'JILI-MCH-PHP', currency: 'PHP', wallet_mode: 'seamless', api_url: 'https://api.jili.com/php', api_key_mask: 'jili_php_****77B2', credential_mask: 'cert_****PHP', amount_precision: 2, status: 'connected', is_default: true },
            { connection_id: 'PC-JILI-IDR', provider_currency_id: 'JILI-CUR-IDR-01', provider_merchant_id: 'JILI-MCH-IDR', currency: 'IDR', wallet_mode: 'transfer', api_url: 'https://api.jili.com/idr', api_key_mask: 'jili_idr_****64E8', credential_mask: 'cert_****IDR', amount_precision: 0, status: 'testing' }
        ],
        cost_billing_mode: 'GGR',
        provider_cost_rate: 0.052,
        negative_ggr_policy: 'zero_out',
        cost_rate_version: 'JILI-COST-2026.07',
        cost_rate_effective_at: '2026-07-01T00:00:00.000Z',
        service_status: 'maintenance',
        integration_status: 'connected',
        cost_rate_history: [
            { version: 'JILI-COST-2026.07', provider_cost_rate: 0.052, negative_ggr_policy: 'zero_out', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', changed_at: '2026-06-23T06:00:00.000Z' }
        ],
        apiConfig: {
            apiUrl: 'https://api.jili.com',
            merchantCode: 'AGG_JILI',
            secretKey: 'sk_jili_abc',
            revenueShare: 8,
            currency: 'USD'
        },
        contractConfig: {
            accounting_currency: 'USDT',
            rules: {
                slot_free_spin: { enabled: false, provider_share: 0 },
                live_tip: { enabled: false, provider_share: 0 },
                card_fee: { enabled: false, provider_share: 0 }
            }
        }
    },
    {
        id: 5,
        code: 'habanero',
        name: 'Habanero',
        status: 'active',
        type: 'Slot',
        gameCount: 142,
        platform_accounting_currency: 'USDT',
        provider_wallet_currency: 'IDR',
        currency_connections: [
            { connection_id: 'PC-HAB-IDR', provider_currency_id: 'HAB-CUR-IDR-01', provider_merchant_id: 'HAB-MCH-IDR', currency: 'IDR', wallet_mode: 'transfer', api_url: 'https://api.habanero.com/idr', api_key_mask: 'hab_idr_****19F3', credential_mask: 'cert_****IDR', amount_precision: 0, status: 'testing', is_default: true }
        ],
        cost_billing_mode: 'GGR',
        provider_cost_rate: 0.048,
        negative_ggr_policy: 'carry_forward',
        cost_rate_version: 'HAB-COST-2026.07',
        cost_rate_effective_at: '2026-07-01T00:00:00.000Z',
        service_status: 'active',
        integration_status: 'testing',
        cost_rate_history: [
            { version: 'HAB-COST-2026.07', provider_cost_rate: 0.048, negative_ggr_policy: 'carry_forward', effective_at: '2026-07-01T00:00:00.000Z', changed_by: 'Finance', changed_at: '2026-06-21T08:00:00.000Z' }
        ],
        apiConfig: {
            apiUrl: 'https://api.habanero.com',
            merchantCode: 'AGG_HAB',
            secretKey: 'sk_hab_xyz',
            revenueShare: 11,
            currency: 'USD'
        },
        contractConfig: {
            accounting_currency: 'USDT',
            rules: {
                slot_free_spin: { enabled: false, provider_share: 0 },
                live_tip: { enabled: false, provider_share: 0 },
                card_fee: { enabled: false, provider_share: 0 }
            }
        }
    }
]

// Merchant Subscription Map: merchantId -> [{ providerId, status, revenueShare, excludedGames }]
const merchantSubscriptionMap = new Map<number, any[]>()

export const handlers = [
    // ================== AUTH HANDLERS ==================
    // Login API - Returns role-based tokens
    http.post('/api/login', async ({ request }) => {
        await delay(500)
        const body = await request.json() as { username: string; password: string; portal?: string }
        const { username, password, portal } = body

        const rejectWrongPortal = (accountPortal: string) => {
            if (!portal || portal === accountPortal) return null
            return HttpResponse.json({
                success: false,
                message: '此帳號不可登入目前入口，請切換正確後台。'
            }, { status: 403 })
        }

        if (username === 'admin' && password === 'admin123') {
            const wrongPortal = rejectWrongPortal('admin')
            if (wrongPortal) return wrongPortal

            return HttpResponse.json({
                success: true,
                token: 'mock-master-token-' + Date.now(),
                id: 'USR-MASTER',
                role: 'MASTER',
                portal: 'admin',
                data_scope: 'global',
                name: 'Super Admin',
                code: null
            })
        }

        if (username === 'agent' && password === 'agent123') {
            const wrongPortal = rejectWrongPortal('agent')
            if (wrongPortal) return wrongPortal

            return HttpResponse.json({
                success: true,
                token: 'mock-agent-token-' + Date.now(),
                id: 'USR-AGENT-L1',
                role: 'AGENT',
                portal: 'agent',
                data_scope: 'agent_tree',
                name: 'SEA Master Agent',
                agent_id: 'AGT-SEA-001',
                agent_level: 1,
                code: 'AGT-SEA-001'
            })
        }

        if (username === 'merchant' && password === '123456') {
            const wrongPortal = rejectWrongPortal('merchant')
            if (wrongPortal) return wrongPortal

            return HttpResponse.json({
                success: true,
                token: 'mock-merchant-token-' + Date.now(),
                id: 'USR-MERCHANT',
                role: 'MERCHANT',
                portal: 'merchant',
                data_scope: 'merchant_self',
                name: 'Golden Dragon',
                merchant_id: 'OP-1007',
                merchant_code: 'OP-1007',
                agent_id: 'AGT-SEA-001',
                code: 'OP-1007'
            })
        }

        return HttpResponse.json({
            success: false,
            message: '帳號或密碼錯誤'
        }, { status: 401 })
    }),

    // ================== MASTER REPORT CENTER ==================
    http.post('/api/v2/report/financial', async ({ request }) => {
        await delay(450)
        const body = await request.json().catch(() => ({})) as { groupBy?: 'date' | 'agent' | 'provider' | 'merchant'; startTime?: string; endTime?: string }
        const list = buildFinancialReport({
            groupBy: body.groupBy || 'date',
            startTime: body.startTime,
            endTime: body.endTime
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            message: 'success',
            data: { list }
        })
    }),

    // ... existing handlers ...

    // Get Merchant Subscriptions
    http.get('/api/v2/merchant/:id/providers', async ({ params }) => {
        await delay(500)
        const merchantId = Number(params.id)

        let subscriptions = merchantSubscriptionMap.get(merchantId)
        if (!subscriptions) {
            // Default: All providers disabled
            subscriptions = mockProviders.map(p => ({
                providerId: p.id,
                status: 'disabled',
                revenueShare: 0,
                excludedGames: []
            }))
            merchantSubscriptionMap.set(merchantId, subscriptions)
        }

        // Merge with current provider list to handle new providers
        const result = mockProviders.map(p => {
            const sub = subscriptions?.find(s => s.providerId === p.id)
            return {
                providerId: p.id,
                name: p.name,
                code: p.code,
                globalStatus: p.status, // Current global status
                status: sub?.status || 'disabled',
                revenueShare: sub?.revenueShare || 0,
                excludedGames: sub?.excludedGames || []
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: result
        })
    }),

    // Update Merchant Subscriptions
    http.post('/api/v2/merchant/:id/providers', async ({ params, request }) => {
        await delay(800)
        const merchantId = Number(params.id)
        const body = await request.json() as any[]

        // Update map
        merchantSubscriptionMap.set(merchantId, body)

        return HttpResponse.json({
            code: 0,
            msg: 'Subscriptions Updated'
        })
    }),

    // Game List
    http.get('/api/v2/games', async ({ request }) => {
        await delay(500)
        const url = new URL(request.url)
        const providerId = url.searchParams.get('provider_id')
        const type = url.searchParams.get('type')
        const status = url.searchParams.get('status')
        const search = url.searchParams.get('search')?.toLowerCase()

        let filtered = [...mockGames]

        if (providerId) {
            filtered = filtered.filter(g => g.providerId === Number(providerId))
        }
        if (type) {
            filtered = filtered.filter(g => g.type === type)
        }
        if (status) {
            filtered = filtered.filter(g => g.status === status)
        }
        if (search) {
            filtered = filtered.filter(g =>
                g.name_en.toLowerCase().includes(search) ||
                (g.name_zh && g.name_zh.includes(search)) ||
                g.game_id.toLowerCase().includes(search)
            )
        }

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list: filtered,
                total: filtered.length
            }
        })
    }),

    // Game Sync
    http.post('/api/v2/games/sync', async () => {
        await delay(3000)
        return HttpResponse.json({
            code: 0,
            msg: `Synced ${faker.number.int({ min: 5, max: 20 })} new games successfully`,
            data: { count: 15 }
        })
    }),

    // Update Game Status
    http.post('/api/v2/games/update', async ({ request }) => {
        await delay(600)
        const body = await request.json() as any
        const game = mockGames.find(g => g.game_id === body.game_id)
        if (game) {
            Object.assign(game, body)
        }
        return HttpResponse.json({
            code: 0,
            msg: 'Game Updated'
        })
    }),
    // Create Provider
    http.post('/api/admin/providers', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any

        if (mockProviders.some(p => p.code === body.code)) {
            return HttpResponse.json({
                code: 409,
                msg: 'Provider Code already exists'
            })
        }

        const newProvider = {
            id: mockProviders.length + 1,
            code: body.code,
            name: body.name,
            status: 'active' as const,
            type: body.type || 'Slot',
            gameCount: 0,
            platform_accounting_currency: 'USDT' as const,
            provider_wallet_currency: body.provider_wallet_currency || body.currency_connections?.[0]?.currency || 'TWD',
            currency_connections: body.currency_connections || [],
            cost_billing_mode: 'GGR' as const,
            provider_cost_rate: body.provider_cost_rate ?? 0,
            negative_ggr_policy: body.negative_ggr_policy ?? 'carry_forward',
            cost_rate_version: body.cost_rate_version || `${String(body.code).toUpperCase()}-COST-2026.07`,
            cost_rate_effective_at: body.cost_rate_effective_at || new Date().toISOString(),
            service_status: 'active' as const,
            integration_status: 'testing' as const,
            cost_rate_history: [
                {
                    version: body.cost_rate_version || `${String(body.code).toUpperCase()}-COST-2026.07`,
                    provider_cost_rate: body.provider_cost_rate ?? 0,
                    negative_ggr_policy: body.negative_ggr_policy ?? 'carry_forward',
                    effective_at: body.cost_rate_effective_at || new Date().toISOString(),
                    changed_by: 'Admin',
                    changed_at: new Date().toISOString(),
                    remarks: '新增供應商時建立成本費率'
                }
            ],
            apiConfig: body.apiConfig || {},
            contractConfig: body.contractConfig || {
                accounting_currency: 'USDT',
                rules: {
                    slot_free_spin: { enabled: false, provider_share: 0 },
                    live_tip: { enabled: false, provider_share: 0 },
                    card_fee: { enabled: false, provider_share: 0 }
                }
            },
            contract: body.contract || { costPercent: 0, expiryDate: '' }
        }

        mockProviders.push(newProvider)

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: newProvider
        })
    }),

    // Provider List
    http.get('/api/v2/providers', async () => {
        await delay(600)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list: mockProviders,
                total: mockProviders.length
            }
        })
    }),

    // Update Provider
    http.post('/api/v2/providers/update', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        const providerIndex = mockProviders.findIndex(p => p.id === body.id)

        if (providerIndex !== -1) {
            // Merge updates
            mockProviders[providerIndex] = {
                ...mockProviders[providerIndex],
                ...body,
                apiConfig: {
                    ...mockProviders[providerIndex]!.apiConfig,
                    ...(body.apiConfig || {})
                }
            }
        }

        return HttpResponse.json({
            code: 0,
            msg: 'Provider Updated Successfully'
        })
    }),
    ...agentHandlers,
    ...fundsHandlers,

    http.get('/api/v2/admin/merchants', async ({ request }) => {
        await delay(500) // Simulate network latency
        const url = new URL(request.url)
        const search = url.searchParams.get('search')?.toLowerCase()

        // Generate 20 mock merchants
        let mockList = Array.from({ length: 20 }).map((_, i) => createRandomMerchant(i + 1))

        if (search) {
            mockList = mockList.filter(m =>
                m.display_id?.toLowerCase().includes(search) ||
                m.site_code?.toLowerCase().includes(search) ||
                m.name?.toLowerCase().includes(search)
            )
        }

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list: mockList,
                total: mockList.length,
                page: 1,
                limit: 20
            }
        })
    }),

    // Get Merchant Detail
    http.get('/api/v2/admin/merchants/:id', async ({ params }) => {
        await delay(500)
        const id = Number(params.id)
        const merchant = createRandomMerchant(id) as MerchantDetail

        // Enrich with detail fields
        merchant.secret_key = faker.string.uuid()
        merchant.wallet_mode = faker.helpers.arrayElement(['transfer', 'seamless'])
        merchant.ip_whitelist = [faker.internet.ip(), faker.internet.ip()]
        merchant.rtp_level = faker.number.float({ min: 90, max: 99, fractionDigits: 1 })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: merchant
        })
    }),

    // Update Game Config
    http.post('/api/v2/game/update', async () => {
        await delay(1000)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: null
        })
    }),

    // Update Merchant
    http.put('/api/v2/admin/merchants/:id', async () => {
        await delay(800)
        return HttpResponse.json({
            code: 0,
            msg: 'success'
        })
    }),

    // Update RTP
    http.post('/api/v2/game/rtp', async () => {
        await delay(1000) // Longer delay for critical change
        // Simulate random failure
        if (Math.random() > 0.9) {
            return HttpResponse.json({
                code: 500,
                msg: 'System busy, please try again.'
            })
        }
        return HttpResponse.json({
            code: 0,
            msg: 'RTP Updated Successfully'
        })
    }),

    // Create Merchant
    http.post('/api/v2/admin/merchants', async ({ request }) => {
        await delay(1000)
        const body = await request.json() as any

        // Mock Conflict Error (Site Code 'EXIST')
        if (body.site_code === 'EXT') {
            return HttpResponse.json({
                code: 409,
                msg: 'Site Code already exists'
            })
        }

        return HttpResponse.json({
            code: 0,
            msg: 'Merchant Created Successfully',
            data: {
                id: faker.number.int({ min: 100, max: 999 })
            }
        })
    }),

    // Get Bet Logs (Round Search) - Phase 8.8 Spec
    http.post('/api/v2/report/bet-logs', async ({ request }) => {
        await delay(800)
        const body = await request.json() as any
        const { match_roundId, match_playerId, match_merchant, match_provider, timeRange } = {
            match_roundId: body.roundId,
            match_playerId: body.playerId,
            match_merchant: body.merchantCode,
            match_provider: body.provider,
            timeRange: body.timeRange
        }

        const list = faker.helpers.multiple(() => {
            // Merchant data
            const merchantCode = match_merchant || `OP-${faker.number.int({ min: 1001, max: 1020 })}`
            const merchantName = faker.helpers.arrayElement(['Golden Dragon', 'Silver Tiger', 'Diamond Star', 'Royal Crown', 'Lucky 88', 'Grand Casino'])

            // Provider data
            const providerScenario = match_provider
                ? (match_provider === 'pg' ? 'PG' : match_provider === 'evo' ? 'EVO' : 'PP')
                : faker.helpers.weightedArrayElement([
                    { weight: 60, value: 'PG' },
                    { weight: 30, value: 'EVO' },
                    { weight: 10, value: 'PP' }
                ])

            const providerName = providerScenario === 'PG' ? 'PG Soft' : providerScenario === 'EVO' ? 'Evolution' : 'Pragmatic Play'
            const gameName = faker.helpers.arrayElement(['Fortune Tiger', 'Super Ace', 'Crazy Time', 'Sweet Bonanza', 'Gates of Olympus'])

            // Player IDs (dual-layer)
            const aggPlayerId = match_playerId || `PL-${faker.number.int({ min: 1000, max: 9999 })}`
            const merchantMemberId = match_playerId || `mem_${faker.internet.username().toLowerCase()}`

            // Financial scenarios
            const scenario = faker.helpers.weightedArrayElement([
                { weight: 40, value: 'WIN' },    // 40% wins
                { weight: 50, value: 'LOSS' },   // 50% losses
                { weight: 10, value: 'REFUND' }  // 10% refunds/cancelled
            ])

            let betAmount: number, payoutAmount: number, netWin: number, status: 'settled' | 'unsettled' | 'cancelled'

            const baseBet = faker.number.float({ min: 10, max: 500, fractionDigits: 2 })

            switch (scenario) {
                case 'WIN':
                    betAmount = baseBet
                    payoutAmount = baseBet * faker.number.float({ min: 1.5, max: 10, fractionDigits: 2 })
                    netWin = Number((payoutAmount - betAmount).toFixed(2))
                    status = 'settled'
                    break
                case 'LOSS':
                    betAmount = baseBet
                    payoutAmount = faker.datatype.boolean(0.9) ? 0 : baseBet * faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 })
                    netWin = Number((payoutAmount - betAmount).toFixed(2))
                    status = 'settled'
                    break
                case 'REFUND':
                    betAmount = baseBet
                    payoutAmount = baseBet
                    netWin = 0
                    status = 'cancelled'
                    break
                default:
                    betAmount = baseBet
                    payoutAmount = 0
                    netWin = -baseBet
                    status = 'settled'
            }

            // Timestamp
            let created_at = faker.date.recent({ days: 1 }).toISOString()
            if (timeRange && timeRange.length === 2) {
                const start = new Date(timeRange[0])
                const end = new Date(timeRange[1])
                created_at = faker.date.between({ from: start, to: end }).toISOString()
            }

            return {
                // Core IDs
                round_id: match_roundId || `R-${faker.string.numeric(12)}`,
                id: `PF-${faker.string.numeric(10)}`,
                created_at,

                // Merchant info
                merchant_display_id: merchantCode,
                merchant_name: merchantName,

                // Game info
                provider_name: providerName,
                game_name: gameName,

                // Player IDs
                agg_player_id: aggPlayerId,
                merchant_member_id: merchantMemberId,

                // Financial
                bet_amount: betAmount,
                payout_amount: payoutAmount,
                net_win: netWin,
                currency: 'USD',

                // Status
                status,

                // Detail
                game_detail: {
                    round_id: `R-${faker.string.numeric(12)}`,
                    matrix: [],
                    lines_won: [],
                    free_games_triggered: false,
                    multiplier: 1,
                    currency: 'USD'
                },

                // Legacy compatibility (for existing code)
                merchant_code: merchantCode,
                providerCode: providerScenario.toLowerCase(),
                providerName,
                player_account: merchantMemberId,
                player_id: aggPlayerId,
                win_amount: payoutAmount,
                profit: netWin,
                payout: betAmount > 0 ? payoutAmount / betAmount : 0,
                originalBet: betAmount,
                originalWin: payoutAmount,
                exchangeRate: 1.0,
                txId: faker.string.uuid()
            }
        }, { count: 50 })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: 200
            }
        })
    }),

    // Portal credentials are split by entry point. Backend must derive the target
    // identity from the authenticated token instead of accepting an agent/merchant id.
    http.get('/api/v2/agent/credentials', async () => {
        await delay(250)
        return HttpResponse.json({
            code: 0,
            message: 'success',
            data: {
                merchant_code: 'AGT-SEA-001',
                secret_key: 'agt_report_sk_****8F21',
                whitelist: ['203.0.113.18', '198.51.100.24']
            }
        })
    }),
    http.post('/api/v2/agent/whitelist', async () => {
        await delay(300)
        return HttpResponse.json({ code: 0, message: 'success', data: { updated: true } })
    }),
    http.get('/api/v2/merchant/credentials', async () => {
        await delay(250)
        return HttpResponse.json({
            code: 0,
            message: 'success',
            data: {
                merchant_code: 'OP-1007',
                secret_key: 'mch_wallet_sk_****91C3',
                whitelist: ['203.0.113.42']
            }
        })
    }),
    http.post('/api/v2/merchant/whitelist', async () => {
        await delay(300)
        return HttpResponse.json({ code: 0, message: 'success', data: { updated: true } })
    }),

    // Agent dashboard is aggregated only from AGT-SEA-001 and its descendants.
    http.get('/api/v2/agent/dashboard/stats', async () => {
        await delay(350)
        return HttpResponse.json({
            code: 0,
            message: 'success',
            data: {
                wallet: { balance: 101400, credit_limit: 188400, currency: 'USDT', exchange_rate: 1 },
                today_kpi: {
                    total_bet: 4231062.31,
                    net_win: 154433.28,
                    active_players: 1284,
                    tx_count: 18420,
                    comparison: { bet_pct: 1.7, win_pct: 4.5, player_pct: 2.1 }
                },
                trend_7d: [
                    { date: '08/01', bet: 3721000, net_win: 131800 },
                    { date: '08/02', bet: 3894000, net_win: 142100 },
                    { date: '08/03', bet: 4012000, net_win: 147900 },
                    { date: '08/04', bet: 3968000, net_win: 139400 },
                    { date: '08/05', bet: 4155000, net_win: 151200 },
                    { date: '08/06', bet: 4231062.31, net_win: 154433.28 }
                ],
                alerts: [],
                top_games: [
                    { name: 'Mahjong Ways', bet: 812400, win: 776100 },
                    { name: 'Super Ace', bet: 638200, win: 612900 }
                ]
            }
        })
    }),

    // Merchant dashboard is scoped to OP-1007 by the authenticated token.
    // Dashboard Statistics (War Room)
    http.get('/api/v2/report/dashboard', async () => {
        await delay(500)

        // Generate trend data for 7 days
        const trend = Array.from({ length: 7 }, (_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - (6 - i))
            const bet = faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 })
            const win = bet * faker.number.float({ min: 0.90, max: 1.05, fractionDigits: 2 }) // RTP 90-105%
            return {
                date: date.toISOString().split('T')[0],
                ggr: Number((bet - win).toFixed(2)),
                bet: Number(bet.toFixed(2))
            }
        })

        // Current snapshot stats
        const totalBet = 1500000 + faker.number.float({ min: 100, max: 1000 }) // ~1.5M
        const totalWin = totalBet * 0.965 // ~96.5% RTP
        const ggr = totalBet - totalWin

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                // KPIs
                total_bet: Number(totalBet.toFixed(2)),
                total_ggr: Number(ggr.toFixed(2)),
                rtp: 96.50,
                active_players: faker.number.int({ min: 2500, max: 3500 }),
                total_requests: faker.number.int({ min: 4000000, max: 4500000 }), // ~4.2M
                avg_margin: 3.5, // 3.5%

                // Charts
                trend, // [ {date, ggr, bet}, ... ]
                provider_share: [
                    { name: 'PG Soft', value: 45 },
                    { name: 'Evolution', value: 30 },
                    { name: 'Pragmatic Play', value: 25 }
                ],

                // Top Lists
                top_merchants: [
                    { name: 'Bet365', ggr: 45000 },
                    { name: '1xbet', ggr: 32000 },
                    { name: 'K9Win', ggr: 28000 },
                    { name: 'M88', ggr: 15000 },
                    { name: 'Fun88', ggr: 12000 }
                ],
                top_games: [
                    { name: 'Mahjong Ways 2', bet_count: 50000 },
                    { name: 'Super Ace', bet_count: 42000 },
                    { name: 'Crazy Time', bet_count: 35000 },
                    { name: 'Fortune Tiger', bet_count: 28000 },
                    { name: 'Gates of Olympus', bet_count: 25000 }
                ],

                // System Health
                system_health: [
                    { provider: 'PG Soft', status: 'healthy', latency: 45 },
                    { provider: 'Evolution', status: 'warning', latency: 120 },
                    { provider: 'Pragmatic Play', status: 'critical', latency: 0 } // 0 = timeout
                ]
            }
        })
    }),

    // Game Center - List
    http.get('/api/v2/game/list', async () => {
        await delay(600)

        const list = faker.helpers.multiple(() => {
            const provider = faker.helpers.arrayElement(['PGSoft', 'JILI', 'PragmaticPlay', 'Habanero'])
            return {
                game_id: faker.string.alpha({ length: 6, casing: 'lower' }) + '_' + faker.number.int({ min: 100, max: 999 }),
                name_en: faker.lorem.words({ min: 2, max: 3 }).replace(/^\w/, (c) => c.toUpperCase()),
                provider: provider,
                type: faker.helpers.arrayElement(['Slot', 'Live', 'Fishing']),
                rtp_default: faker.number.float({ min: 95.0, max: 98.0, fractionDigits: 1 }),
                status: faker.helpers.arrayElement(['active', 'maintenance'])
            }
        }, { count: 30 })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: 100
            }
        })
    }),

    // Generate New Key
    http.post('/api/v2/agent/regenerate-key', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'New Secret Key Generated',
            data: {
                secret_key: 'sk_live_' + faker.string.uuid()
            }
        })
    }),

    // Save Merchant Config
    http.post('/api/v2/agent/config/update', async () => {
        await delay(800)
        return HttpResponse.json({
            code: 0,
            msg: 'Configuration Saved Successfully'
        })
    }),

    // Agent Game List (Phase 9.1)
    http.get('/api/v2/agent/games', async () => {
        await delay(600)

        // Transform mockGames into MerchantGame format
        const list = mockGames.map(game => ({
            game_id: game.game_id,
            game_code: game.game_id, // simple mapping
            name_en: game.name_en,
            name_zh: game.name_zh,
            provider: game.provider,
            type: game.type,
            rtp: game.rtp_default,
            // Randomly assign states for demo
            merchant_enabled: faker.datatype.boolean(),
            master_enabled: game.status === 'active', // 'maintenance' or 'disabled' -> false
            thumbnail: game.thumbnail,
            // New fields for Phase 9.1
            release_date: faker.date.past({ years: 2 }).toISOString().split('T')[0],
            admin_status: game.status // 'active' | 'maintenance' | 'disabled'
        }))

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total: list.length
            }
        })
    }),

    // Toggle Agent Game Status
    http.post('/api/v2/agent/games/toggle', async () => {
        await delay(400)
        return HttpResponse.json({
            code: 0,
            msg: 'success'
        })
    }),

    // Merchant Daily Revenue Report (Aggregated)
    http.get('/api/v2/merchant/reports/daily', async () => {
        await delay(500)

        const items = Array.from({ length: 30 }).map((_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]

            // Generate nested items first
            const categories = ['Slot', 'Live', 'Arcade']
            const children = categories.map(cat => {
                const bet = Number(faker.finance.amount({ min: 1000, max: 100000, dec: 2 }))
                const rtp = faker.number.int({ min: 85, max: 105 })
                const payout = Number((bet * (rtp / 100)).toFixed(2))
                return {
                    key: `${dateStr}-${cat}`,
                    date: cat, // Display name for UI
                    active_players: faker.number.int({ min: 5, max: 200 }),
                    tx_count: faker.number.int({ min: 10, max: 500 }),
                    total_bet: bet,
                    total_payout: payout,
                    net_win: Number((payout - bet).toFixed(2)),
                    rtp: rtp
                }
            })

            // Sum up for daily total
            const dailyTotal = children.reduce((acc, curr) => ({
                active_players: acc.active_players + curr.active_players,
                tx_count: acc.tx_count + curr.tx_count,
                total_bet: acc.total_bet + curr.total_bet,
                total_payout: acc.total_payout + curr.total_payout,
                net_win: acc.net_win + curr.net_win
            }), { active_players: 0, tx_count: 0, total_bet: 0, total_payout: 0, net_win: 0 })

            return {
                key: dateStr,
                date: dateStr,
                ...dailyTotal,
                children // Nested data
            }
        })

        // Calculate Grand Total Summary
        const summary = items.reduce((acc, curr) => ({
            total_bet: acc.total_bet + curr.total_bet,
            total_payout: acc.total_payout + curr.total_payout,
            net_win: acc.net_win + curr.net_win,
            tx_count: acc.tx_count + curr.tx_count,
            active_players: acc.active_players + curr.active_players
        }), { total_bet: 0, total_payout: 0, net_win: 0, tx_count: 0, active_players: 0 })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                items,
                summary
            }
        })
    }),

    // Merchant Report Transactions Information (Drill-down)
    http.get('/api/v2/merchant/reports/transactions', async () => {
        await delay(600)
        const total = 50
        const list = Array.from({ length: 15 }).map(() => {
            const bet = Number(faker.finance.amount({ min: 10, max: 1000, dec: 2 }))
            const isWin = faker.datatype.boolean()
            const payout = isWin ? bet * faker.number.float({ min: 0.5, max: 50 }) : 0

            return {
                id: faker.string.uuid(),
                player_id: `user_${faker.string.alphanumeric(6)}`,
                game_name: faker.helpers.arrayElement(mockGames).name_en,
                bet_amount: bet,
                payout_amount: Number(payout.toFixed(2)),
                net_win: Number((payout - bet).toFixed(2)),
                created_at: faker.date.recent().toISOString()
            }
        })

        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                list,
                total
            }
        })
    }),

    // ================== MERCHANT FINANCE CENTER ==================
    // Get Merchant Wallet
    http.get('/api/v2/merchant/wallet', async () => {
        await delay(300)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: {
                credit_limit: 100000,
                balance: 23456.78,
                outstanding_amount: 15800.50,
                currency: 'TWD',
                exchange_rate: 32.50,
                credit_request_status: 'none' // 'none' | 'pending' | 'rejected'
            }
        })
    }),

    // Submit Credit Limit Request
    http.post('/api/v2/merchant/wallet/credit-limit-request', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { request_id: faker.string.uuid() }
        })
    }),

    // Submit Top-up Request
    http.post('/api/v2/merchant/wallet/top-up', async () => {
        await delay(500)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { request_id: faker.string.uuid() }
        })
    }),

    // Get Invoices with verification_status
    http.get('/api/v2/merchant/invoices', async () => {
        await delay(400)
        const list = Array.from({ length: 6 }).map((_, i) => {
            const isPaid = i < 2
            return {
                id: `INV-${2026}${String(i + 1).padStart(2, '0')}`,
                period: `2025-${String(12 - i).padStart(2, '0')}`,
                total_ggr: Number(faker.finance.amount({ min: 5000, max: 50000, dec: 2 })),
                commission_rate: 15,
                amount_due: Number(faker.finance.amount({ min: 1000, max: 10000, dec: 2 })),
                status: isPaid ? 'paid' : 'pending',
                verification_status: isPaid ? 'verified' : (i === 2 ? 'verifying' : 'none'),
                created_at: faker.date.past().toISOString()
            }
        })
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { list, total: list.length }
        })
    }),

    // Submit Invoice Payment Proof
    http.post('/api/v2/merchant/invoices/:id/payment', async () => {
        await delay(600)
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { verification_status: 'verifying' }
        })
    }),
    // Dashboard Statistics (War Room)
    http.get('/api/v2/merchant/dashboard/stats', async () => {
        await delay(500);
        const wallet = {
            balance: Number(faker.finance.amount({ min: 50000, max: 200000, dec: 2 })),
            credit_limit: Number(faker.finance.amount({ min: 100000, max: 500000, dec: 2 })),
            currency: faker.helpers.arrayElement(['TWD', 'USD', 'CNY']),
            exchange_rate: Number(faker.finance.amount({ min: 0.8, max: 1.2, dec: 4 }))
        };
        const totalBet = Number(faker.finance.amount({ min: 1000000, max: 5000000, dec: 2 }));
        const totalWin = totalBet * faker.number.float({ min: 0.9, max: 1.05, fractionDigits: 4 });
        const today_kpi = {
            total_bet: totalBet,
            net_win: Number((totalBet - totalWin).toFixed(2)),
            active_players: faker.number.int({ min: 2000, max: 5000 }),
            tx_count: faker.number.int({ min: 10000, max: 50000 }),
            comparison: {
                bet_pct: faker.number.float({ min: -5, max: 5, fractionDigits: 2 }),
                win_pct: faker.number.float({ min: -5, max: 5, fractionDigits: 2 }),
                player_pct: faker.number.float({ min: -5, max: 5, fractionDigits: 2 })
            }
        };
        const trend_7d = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const bet = Number(faker.finance.amount({ min: 50000, max: 300000, dec: 2 }));
            const win = bet * faker.number.float({ min: 0.9, max: 1.05, fractionDigits: 4 });
            return { date: date.toISOString().split('T')[0], bet, net_win: Number((bet - win).toFixed(2)) };
        });
        const alerts = [
            { type: 'invoice', message: '您有 2 筆待付帳單', count: 2 },
            { type: 'reject', message: '最近有 1 筆充值申請被拒絕', count: 1 }
        ];
        const top_games = faker.helpers.multiple(() => ({
            name: faker.lorem.words(2),
            bet: Number(faker.finance.amount({ min: 20000, max: 150000, dec: 2 })),
            win: Number(faker.finance.amount({ min: 15000, max: 140000, dec: 2 }))
        }), { count: 5 });
        return HttpResponse.json({
            code: 0,
            msg: 'success',
            data: { wallet, today_kpi, trend_7d, alerts, top_games }
        });
    }),
    ...financeHandlers,
    ...systemHandlers
]
