
import { AfricanCountriesData, CryptoAsset, FiatAsset, MarketHighlightItem, BillCategory, Biller } from './types';

export const DEFAULT_USER_ID = 'user123';

export const AFRICAN_COUNTRIES_DATA: AfricanCountriesData = {
    'Nigeria': { currency: 'NGN', symbol: '₦', flag: '🇳🇬', paymentMethods: ['Bank Transfer', 'PalmPay', 'OPay', 'Kuda'] },
    'Ghana': { currency: 'GHS', symbol: '₵', flag: '🇬🇭', paymentMethods: ['MTN MoMo', 'Vodafone Cash', 'AirtelTigo Money'] },
    'Kenya': { currency: 'KES', symbol: 'KSh', flag: '🇰🇪', paymentMethods: ['M-Pesa', 'Airtel Money', 'T-Kash'] },
    'South Africa': { currency: 'ZAR', symbol: 'R', flag: '🇿🇦', paymentMethods: ['Bank Transfer', 'FNB eWallet', 'Capitec Pay'] },
    'Egypt': { currency: 'EGP', symbol: 'E£', flag: '🇪🇬', paymentMethods: ['Bank Transfer', 'Vodafone Cash', 'Orange Money'] },
    // Add more countries as needed
};

export const INITIAL_CRYPTO_ASSETS: Record<string, CryptoAsset> = {
  BTC: { name: 'Bitcoin', symbol: 'BTC', balance: '0.00234567', usdValue: 158.42, price: 67500, changePercent: 2.4, logoChar: '₿', colorClass: 'bg-orange-500' },
  USDT: { name: 'Tether', symbol: 'USDT', balance: '2,847.50', usdValue: 2847.50, price: 1.00, changePercent: 0.1, logoChar: '₮', colorClass: 'bg-green-500' },
  BNB: { name: 'BNB', symbol: 'BNB', balance: '4.67', usdValue: 3014.15, price: 645.20, changePercent: 5.2, logoChar: '♦', colorClass: 'bg-yellow-500' },
  ETH: { name: 'Ethereum', symbol: 'ETH', balance: '0.05', usdValue: 190.25, price: 3805, changePercent: -1.2, logoChar: 'Ξ', colorClass: 'bg-sky-500'},
  SOL: { name: 'Solana', symbol: 'SOL', balance: '1.5', usdValue: 258.75, price: 172.50, changePercent: 5.7, logoChar: 'S', colorClass: 'bg-purple-500'},
};

export const INITIAL_FIAT_ASSETS: (userCurrencySymbol: string, userCurrencyCode: string) => Record<string, FiatAsset> = (userCurrencySymbol, userCurrencyCode) => ({
  [userCurrencyCode]: { balance: '2450000', symbol: userCurrencySymbol, currencyCode: userCurrencyCode } // Note: balance as number string
});

export const SUPPORTED_CRYPTO_SYMBOLS = ['BTC', 'USDT', 'BNB', 'ETH', 'SOL'];
export const SUPPORTED_FIAT_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'EGP'];

export const MOCK_MARKET_HIGHLIGHTS: MarketHighlightItem[] = [
  { id: 'sol', name: 'Solana', symbol: 'SOL', logoChar: 'S', colorClass: 'bg-purple-500', priceUSD: 172.50, change24hPercent: 5.7 },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', logoChar: '₿', colorClass: 'bg-orange-500', priceUSD: 67500.00, change24hPercent: 2.4 },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', logoChar: 'Ξ', colorClass: 'bg-sky-500', priceUSD: 3805.12, change24hPercent: -1.2 },
  { id: 'doge', name: 'Dogecoin', symbol: 'DOGE', logoChar: 'Ð', colorClass: 'bg-yellow-400', priceUSD: 0.16, change24hPercent: 12.3 },
];

export const MOCK_INFO_CARD_DATA = {
    title: "Secure Your Wallet",
    text: "Enable Two-Factor Authentication (2FA) for an extra layer of security on your account.",
    icon: "ShieldCheck" // Corresponds to Lucide icon name
};

// --- Bill Payments Constants ---
export const MOCK_BILL_CATEGORIES: BillCategory[] = [
    { id: 'airtime', name: 'Airtime Top-up', iconName: 'Smartphone', countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt'] },
    { id: 'data', name: 'Data Bundles', iconName: 'Wifi', countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa', 'Egypt'] },
    { id: 'electricity', name: 'Electricity Bill', iconName: 'Zap', countries: ['Nigeria', 'Kenya', 'South Africa'] },
    { id: 'tv', name: 'TV Subscription', iconName: 'Tv', countries: ['Nigeria', 'Kenya', 'Ghana', 'South Africa'] },
    { id: 'betting', name: 'Betting Wallet', iconName: 'Gamepad2', countries: ['Nigeria', 'Kenya', 'Ghana'] },
    { id: 'internet', name: 'Internet Services', iconName: 'Router', countries: ['Nigeria', 'Kenya', 'South Africa'] },
];

export const MOCK_BILLERS: Biller[] = [
    // Nigeria - Airtime
    { id: 'nga-mtn-airtime', name: 'MTN Airtime (NG)', categoryId: 'airtime', country: 'Nigeria', logoUrl: '/img/mtn-logo.png',
      fields: [
        { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '080XXXXXXXX', required: true, validationRegex: '^(0[789][01]\\d{8})$' },
        { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 500', required: true },
      ], minAmount: 50, maxAmount: 10000, paymentAssetSymbols: ['NGN', 'USDT']
    },
    { id: 'nga-glo-airtime', name: 'Glo Airtime (NG)', categoryId: 'airtime', country: 'Nigeria', logoUrl: '/img/glo-logo.png',
      fields: [
        { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '080XXXXXXXX', required: true },
        { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 500', required: true },
      ], minAmount: 50, maxAmount: 10000, paymentAssetSymbols: ['NGN', 'USDT']
    },
    // Nigeria - Electricity
    { id: 'nga-ikeja-electric', name: 'Ikeja Electric (NG)', categoryId: 'electricity', country: 'Nigeria', logoUrl: '/img/ikeja-electric-logo.png',
      fields: [
        { id: 'meterNumber', label: 'Meter Number', type: 'text', placeholder: 'Enter meter number', required: true },
        { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 5000', required: true },
      ], minAmount: 1000, maxAmount: 100000, paymentAssetSymbols: ['NGN', 'USDT', 'BTC']
    },
    // Nigeria - TV
    { id: 'nga-dstv', name: 'DStv Subscription (NG)', categoryId: 'tv', country: 'Nigeria', logoUrl: '/img/dstv-logo.png',
      fields: [
        { id: 'smartcardNumber', label: 'Smartcard Number', type: 'text', placeholder: 'Enter smartcard number', required: true },
        { id: 'bouquet', label: 'Bouquet', type: 'select', options: [ {value: 'compact', label: 'Compact'}, {value: 'premium', label: 'Premium'} ], required: true },
        // Amount might be determined by bouquet, or could be variable for box office
      ], paymentAssetSymbols: ['NGN'] // Example: Only NGN
    },
     // Nigeria - Betting
    { id: 'nga-bet9ja', name: 'Bet9ja Wallet Top-up (NG)', categoryId: 'betting', country: 'Nigeria', logoUrl: '/img/bet9ja-logo.png',
      fields: [
        { id: 'userId', label: 'Bet9ja User ID', type: 'text', placeholder: 'Enter User ID', required: true },
        { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 1000', required: true },
      ], minAmount: 100, maxAmount: 50000, paymentAssetSymbols: ['NGN', 'USDT']
    },

    // Kenya - Airtime
    { id: 'ken-safaricom-airtime', name: 'Safaricom Airtime (KE)', categoryId: 'airtime', country: 'Kenya', logoUrl: '/img/safaricom-logo.png',
      fields: [
        { id: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '07XXXXXXXX', required: true },
        { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 100', required: true },
      ], minAmount: 20, maxAmount: 5000, paymentAssetSymbols: ['KES', 'USDT']
    },
    // Kenya - Electricity
    { id: 'ken-kplc-prepaid', name: 'KPLC Prepaid Token (KE)', categoryId: 'electricity', country: 'Kenya', logoUrl: '/img/kplc-logo.png',
      fields: [
        { id: 'meterNumber', label: 'Meter Number', type: 'text', placeholder: 'Enter meter number', required: true },
        { id: 'amount', label: 'Amount', type: 'number', placeholder: 'e.g., 500', required: true },
      ], minAmount: 50, maxAmount: 35000, paymentAssetSymbols: ['KES', 'USDT']
    },
];

// USD to Local Currency Mock Conversion Rates
// In a real app, these would come from a live FX API
export const MOCK_USD_TO_FIAT_RATES: Record<string, number> = {
    'NGN': 1500,
    'KES': 130,
    'GHS': 12,
    'ZAR': 18.5,
    'EGP': 47,
};
