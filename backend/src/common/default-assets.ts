// Backend-owned defaults for provisioning a new user's wallet on registration.
// Deliberately separate from the frontend's constants.ts mock data: that file
// seeds fake non-zero demo balances for a UI with no backend; a real account
// here starts at zero and only gains balance through real deposits/trades.

export interface DefaultCryptoAsset {
  symbol: string;
  name: string;
  logoChar: string;
  colorClass: string;
  price: number;
  changePercent: number;
}

export const DEFAULT_CRYPTO_ASSETS: DefaultCryptoAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', logoChar: '₿', colorClass: 'bg-orange-500', price: 67500, changePercent: 2.4 },
  { symbol: 'USDT', name: 'Tether', logoChar: '₮', colorClass: 'bg-green-500', price: 1, changePercent: 0.1 },
  { symbol: 'BNB', name: 'BNB', logoChar: '♦', colorClass: 'bg-yellow-500', price: 645.2, changePercent: 5.2 },
  { symbol: 'ETH', name: 'Ethereum', logoChar: 'Ξ', colorClass: 'bg-sky-500', price: 3805, changePercent: -1.2 },
  { symbol: 'SOL', name: 'Solana', logoChar: 'S', colorClass: 'bg-purple-500', price: 172.5, changePercent: 5.7 },
];

export const SUPPORTED_CRYPTO_SYMBOLS = DEFAULT_CRYPTO_ASSETS.map((asset) => asset.symbol);

export const COUNTRY_CURRENCY: Record<string, { currencyCode: string; symbol: string }> = {
  Nigeria: { currencyCode: 'NGN', symbol: '₦' },
  Ghana: { currencyCode: 'GHS', symbol: '₵' },
  Kenya: { currencyCode: 'KES', symbol: 'KSh' },
  'South Africa': { currencyCode: 'ZAR', symbol: 'R' },
  Egypt: { currencyCode: 'EGP', symbol: 'E£' },
};

export const DEFAULT_COUNTRY = 'Nigeria';
