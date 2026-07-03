
export interface CryptoAsset {
  balance: string;
  usdValue: number;
  price: number;
  changePercent: number; // Use number for calculations
  name: string;
  symbol: string;
  logoChar: string; // e.g. '₿'
  colorClass: string; // Tailwind color class
}

export interface FiatAsset {
  balance: string;
  symbol: string; // e.g. '₦'
  currencyCode: string; // e.g. 'NGN'
}

export interface WalletData {
  totalBalanceUSD: number;
  crypto: Record<string, CryptoAsset>;
  fiat: Record<string, FiatAsset>;
  dailyChangePercent: number;
}

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum TransactionType {
  BUY = 'buy',
  SELL = 'sell',
  SEND = 'send',
  RECEIVE = 'receive',
  P2P_BUY = 'p2p_buy',
  P2P_SELL = 'p2p_sell',
  BILL_PAYMENT = 'bill_payment',
}

export interface Transaction {
  id: string;
  type: TransactionType;
  cryptoSymbol: string; // Primary crypto involved, or payment crypto for bills
  cryptoAmount: string; // Amount of crypto involved
  fiatAmount?: string; // Fiat equivalent or fiat amount of bill
  fiatCurrency?: string; // Currency of fiatAmount
  status: TransactionStatus;
  timestamp: string; // ISO 8601 string
  addressTo?: string;
  addressFrom?: string;
  description?: string; // e.g., "Sent BTC", "Bought Airtime", "Paid Electricity Bill for Meter 123"
  billerName?: string; // For bill payments
  billDetails?: Record<string, string>; // e.g., { "Phone Number": "080...", "Meter Number": "123..." }
}

export interface P2POffer {
  id: string;
  traderName: string;
  traderAvatarInitial: string;
  traderRating: number;
  traderTrades: number;
  pricePerCoin: string; // e.g. "₦70,500,000" for 1 BTC
  availableAmountCrypto: string; // e.g. "0.01 - 0.5 BTC"
  limitFiat: string; // e.g. "₦50,000 - ₦5,000,000"
  paymentMethods: string[];
  isOnline: boolean;
  isVerified: boolean;
  responseTime: string;
  cryptoSymbol: string;
  fiatCurrency: string;
  paymentWindowMinutes: number;
  avgReleaseTimeMinutes: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  country: string;
  isVerified: boolean;
  p2pRating: number;
  p2pTrades: number;
  notificationsEnabled: boolean;
  profilePicUrl?: string; // Optional
  avatarInitial: string;
}

export interface AfricanCountryInfo {
  currency: string;
  symbol: string;
  flag: string;
  paymentMethods: string[];
}

export type AfricanCountriesData = Record<string, AfricanCountryInfo>;

export interface MarketTrendAnalysis {
  cryptoSymbol: string;
  explanation: string;
  generatedAt: string;
}

export interface SendCryptoPayload {
  userId: string;
  cryptoSymbol: string;
  recipientAddress: string;
  amount: string;
  memo?: string; // Optional for certain cryptos
}

export interface ReceiveAddress {
  cryptoSymbol: string;
  address: string;
  qrCodeData: string; // Data for QR code generation (e.g. the address itself)
  memo?: string; // For cryptos that might need a memo/tag
}

export enum ActiveTab {
  HOME = 'home',
  TRADE = 'trade',
  WALLET = 'wallet',
  BILLS = 'bills', // New tab for Bill Payments
  HISTORY = 'history',
  PROFILE = 'profile',
  SEND = 'send',
  RECEIVE = 'receive',
}

export enum P2PTradeType {
  BUY = 'buy',
  SELL = 'sell',
}

export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}

export interface MarketHighlightItem {
  id: string;
  name: string;
  symbol: string;
  logoChar: string;
  colorClass: string;
  priceUSD: number;
  change24hPercent: number;
}

// Types for Bill Payments Feature
export interface BillCategory {
  id: string;
  name: string;
  iconName: string; // Lucide icon name string
  countries: string[]; // List of countries where this category is available
}

export interface BillerField {
  id: string; // e.g., 'phoneNumber', 'meterNumber', 'amount'
  label: string;
  type: 'text' | 'tel' | 'number' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[]; // For select type
  validationRegex?: string;
  required?: boolean;
}

export interface Biller {
  id: string;
  name: string;
  categoryId: string;
  country: string; // Specific country for this biller
  logoUrl?: string; // Optional URL for biller's logo
  fields: BillerField[]; // Fields required for this biller
  fixedAmount?: number; // For fixed amount bills
  minAmount?: number; // For variable amount bills
  maxAmount?: number; // For variable amount bills
  paymentAssetSymbols: string[]; // Allowed payment assets e.g. ['NGN', 'USDT']
}

export interface BillPaymentPayload {
  userId: string;
  billerId: string;
  amountFiat: number; // The actual amount of the bill in fiat
  fiatCurrency: string; // The currency of the bill (e.g., NGN)
  paymentAssetSymbol: string; // Symbol of asset used for payment (e.g., 'NGN' or 'USDT')
  paymentAmountGross: number; // Amount deducted from user's wallet (could be crypto or fiat)
  details: Record<string, string>; // Key-value pairs of BillerField.id and user input
  cryptoToFiatRate?: number; // If paid with crypto, the conversion rate used
}
