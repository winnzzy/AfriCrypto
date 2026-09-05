
import {
  WalletData,
  Transaction,
  P2POffer,
  UserProfile,
  MarketTrendAnalysis,
  SendCryptoPayload,
  ReceiveAddress,
  TransactionStatus,
  TransactionType,
  P2PTradeType,
  CryptoAsset,
  FiatAsset,
  BillCategory,
  Biller,
  BillPaymentPayload
} from '../types';
import {
    DEFAULT_USER_ID,
    AFRICAN_COUNTRIES_DATA,
    INITIAL_CRYPTO_ASSETS,
    INITIAL_FIAT_ASSETS,
    MOCK_BILL_CATEGORIES,
    MOCK_BILLERS,
    MOCK_USD_TO_FIAT_RATES,
    SUPPORTED_CRYPTO_SYMBOLS
} from '../constants';

const MOCK_API_DELAY = 500; // milliseconds

// --- Real backend wiring ---
// Base URL of the NestJS backend (see /backend). Set via API_BASE_URL in
// .env.local; vite.config.ts exposes it as process.env.API_BASE_URL the same
// way GEMINI_API_KEY is exposed below.
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

const ACCESS_TOKEN_KEY = 'africrypto.accessToken';
const REFRESH_TOKEN_KEY = 'africrypto.refreshToken';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse extends AuthTokens {
  profile: UserProfile;
}

const getAccessToken = (): string | null => {
  try { return localStorage.getItem(ACCESS_TOKEN_KEY); } catch { return null; }
};
const getRefreshToken = (): string | null => {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
};
const setTokens = (accessToken: string, refreshToken: string): void => {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch { /* localStorage unavailable — session just won't persist across reloads */ }
};
const clearTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch { /* no-op */ }
};

// Dispatched when a refresh attempt fails so App.tsx can drop back to the
// login screen from anywhere in the app, not just the call site that hit it.
export const AUTH_EXPIRED_EVENT = 'africrypto:auth-expired';

// Refresh tokens rotate server-side on every use (see backend AuthService) —
// if two requests raced to refresh with the same token, the second would
// look like a reuse of an already-consumed token and the backend would
// revoke the whole session. De-duping concurrent refreshes avoids that.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data: AuthTokens = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (Array.isArray(body?.message)) return body.message.join(', ');
    if (typeof body?.message === 'string') return body.message;
  } catch { /* non-JSON error body */ }
  return `Request failed with status ${res.status}`;
}

// Thin fetch wrapper: attaches the access token, retries once through a
// token refresh on 401, and normalizes error responses into thrown Errors
// (so existing component code doing `catch (err: any) { err.message }`
// keeps working unchanged).
async function apiFetch<T>(path: string, options: RequestInit = {}, allowRefresh = true): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && allowRefresh && !path.startsWith('/auth/') && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, options, false);
    clearTokens();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    throw new Error('Your session has expired. Please log in again.');
  }

  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

// The backend's Prisma enums are UPPER_CASE (e.g. "SEND", "COMPLETED") while
// types.ts's TransactionType/TransactionStatus are lower_case string enums —
// every member matches case-insensitively, so a lowercase pass is enough.
function normalizeTransaction(raw: any): Transaction {
  return {
    ...raw,
    type: String(raw.type).toLowerCase() as TransactionType,
    status: String(raw.status).toLowerCase() as TransactionStatus,
  };
}

// Mock Data (in-memory store for wallet balances for demonstration)
let currentWalletData: WalletData | null = null;
const getInMemoryWalletData = (userCountry: string): WalletData => {
    if (!currentWalletData || currentWalletData.fiat[AFRICAN_COUNTRIES_DATA[userCountry]?.currency] === undefined) {
        currentWalletData = generateMockWalletData(userCountry);
    }
    // Ensure current country's fiat is correctly initialized if user switches country
    const countryInfo = AFRICAN_COUNTRIES_DATA[userCountry] || AFRICAN_COUNTRIES_DATA['Nigeria'];
    if (!currentWalletData.fiat[countryInfo.currency]) {
        currentWalletData.fiat = {
            ...currentWalletData.fiat,
            ...INITIAL_FIAT_ASSETS(countryInfo.symbol, countryInfo.currency)
        };
    }
    return currentWalletData;
};
const updateInMemoryWalletData = (newData: WalletData) => {
    currentWalletData = newData;
};


// Mock Data Generators
const generateMockWalletData = (userCountry: string): WalletData => {
  const countryInfo = AFRICAN_COUNTRIES_DATA[userCountry] || AFRICAN_COUNTRIES_DATA['Nigeria'];
  const fiatAssets = INITIAL_FIAT_ASSETS(countryInfo.symbol, countryInfo.currency);
  
  let totalUsd = 0;
  Object.values(INITIAL_CRYPTO_ASSETS).forEach(asset => totalUsd += asset.usdValue);

  return {
    totalBalanceUSD: totalUsd,
    crypto: JSON.parse(JSON.stringify(INITIAL_CRYPTO_ASSETS)), // Deep copy for mutable mock
    fiat: JSON.parse(JSON.stringify(fiatAssets)), // Deep copy
    dailyChangePercent: 12.5,
  };
};

const mockTransactions: Transaction[] = [
  { id: 'tx1', type: TransactionType.P2P_BUY, cryptoSymbol: 'BTC', cryptoAmount: '0.001', fiatAmount: '67,500', fiatCurrency: 'NGN', status: TransactionStatus.COMPLETED, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), description: 'Bought BTC from CryptoKing_NG' },
  { id: 'tx2', type: TransactionType.P2P_SELL, cryptoSymbol: 'USDT', cryptoAmount: '500', fiatAmount: '500,000', fiatCurrency: 'NGN', status: TransactionStatus.PENDING, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: 'Selling USDT to QuickBuyer' },
  { id: 'tx3', type: TransactionType.SEND, cryptoSymbol: 'BNB', cryptoAmount: '2.5', status: TransactionStatus.COMPLETED, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), addressTo: '0x123...abc', description: 'Sent BNB to friend' },
  { id: 'tx4', type: TransactionType.RECEIVE, cryptoSymbol: 'BTC', cryptoAmount: '0.0005', status: TransactionStatus.COMPLETED, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), addressFrom: 'external_wallet', description: 'Received BTC deposit' },
];

const generateMockP2POffers = (userCountry: string, cryptoSymbol: string, tradeType: P2PTradeType): P2POffer[] => {
  const countryInfo = AFRICAN_COUNTRIES_DATA[userCountry] || AFRICAN_COUNTRIES_DATA['Nigeria'];
  const basePrice = cryptoSymbol === 'BTC' ? 70000000 : cryptoSymbol === 'USDT' ? 1500 : 600000; // Mock base prices in NGN

  return [
    { 
      id: 'offer1', 
      traderName: 'CryptoKing_NG', 
      traderAvatarInitial: 'C',
      traderRating: 4.9, 
      traderTrades: 1250, 
      pricePerCoin: `${countryInfo.symbol}${ (basePrice * (tradeType === P2PTradeType.BUY ? 1.02 : 0.98)).toLocaleString()}`, 
      availableAmountCrypto: `0.01 - 0.5 ${cryptoSymbol}`,
      limitFiat: `${countryInfo.symbol}50,000 - ${countryInfo.symbol}5,000,000`, 
      paymentMethods: countryInfo.paymentMethods.slice(0, 2),
      isOnline: true,
      isVerified: true,
      responseTime: '~5 min',
      cryptoSymbol: cryptoSymbol,
      fiatCurrency: countryInfo.currency,
      paymentWindowMinutes: Math.random() < 0.5 ? 15 : 30,
      avgReleaseTimeMinutes: Math.floor(Math.random() * 5) + 2, // 2-6 minutes
    },
    { 
      id: 'offer2', 
      traderName: 'AfriTrader', 
      traderAvatarInitial: 'A',
      traderRating: 4.8, 
      traderTrades: 890, 
      pricePerCoin: `${countryInfo.symbol}${ (basePrice * (tradeType === P2PTradeType.BUY ? 1.025 : 0.975)).toLocaleString()}`, 
      availableAmountCrypto: `0.005 - 0.2 ${cryptoSymbol}`,
      limitFiat: `${countryInfo.symbol}100,000 - ${countryInfo.symbol}2,000,000`, 
      paymentMethods: countryInfo.paymentMethods.slice(1, 3),
      isOnline: false,
      isVerified: true,
      responseTime: '~10 min',
      cryptoSymbol: cryptoSymbol,
      fiatCurrency: countryInfo.currency,
      paymentWindowMinutes: Math.random() < 0.5 ? 15 : 20,
      avgReleaseTimeMinutes: Math.floor(Math.random() * 6) + 3, // 3-8 minutes
    },
    { 
      id: 'offer3', 
      traderName: 'NaijaCoins', 
      traderAvatarInitial: 'N',
      traderRating: 4.7, 
      traderTrades: 550, 
      pricePerCoin: `${countryInfo.symbol}${ (basePrice * (tradeType === P2PTradeType.BUY ? 1.018 : 0.982)).toLocaleString()}`, 
      availableAmountCrypto: `0.001 - 1.0 ${cryptoSymbol}`,
      limitFiat: `${countryInfo.symbol}10,000 - ${countryInfo.symbol}10,000,000`, 
      paymentMethods: [countryInfo.paymentMethods[0]],
      isOnline: true,
      isVerified: false,
      responseTime: '~2 min',
      cryptoSymbol: cryptoSymbol,
      fiatCurrency: countryInfo.currency,
      paymentWindowMinutes: 10,
      avgReleaseTimeMinutes: Math.floor(Math.random() * 3) + 1, // 1-3 minutes
    }
  ];
};

let mockUserProfile: UserProfile = { // Made mutable for updates
  userId: DEFAULT_USER_ID,
  username: 'Nnamuah Winner', // Updated username
  country: 'Nigeria',
  isVerified: true,
  p2pRating: 4.9,
  p2pTrades: 127,
  notificationsEnabled: true,
  avatarInitial: 'N', // Updated initial to match new username
};

// API Service Functions
export const apiService = {
  // --- Auth ---
  // signup/login store the returned token pair and hand back the profile —
  // callers don't touch tokens directly, they just get a UserProfile back
  // like any other profile-fetching call.
  signup: async (email: string, password: string, country: string): Promise<UserProfile> => {
    const data = await apiFetch<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, country }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.profile;
  },

  login: async (email: string, password: string): Promise<UserProfile> => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    return data.profile;
  },

  logout: (): void => {
    clearTokens();
  },

  // Synchronous best-effort check (a stored refresh token that has since
  // expired still passes this) — used only to decide whether it's worth
  // attempting restoreSession() on boot instead of showing the login screen
  // immediately.
  hasStoredSession: (): boolean => !!getRefreshToken(),

  // Called once on app boot. Exchanges the stored refresh token for a fresh
  // access token and fetches the profile, or returns null (and clears
  // whatever was stored) if the session can no longer be revived.
  restoreSession: async (): Promise<UserProfile | null> => {
    if (!getRefreshToken()) return null;
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      clearTokens();
      return null;
    }
    try {
      return await apiFetch<UserProfile>('/users/me');
    } catch {
      clearTokens();
      return null;
    }
  },

  // userId is no longer needed here — the backend identifies the caller from
  // the access token — but the parameter stays so App.tsx and friends don't
  // need to change.
  fetchWalletData: async (_userId: string, _userCountry: string): Promise<WalletData> => {
    return apiFetch<WalletData>('/wallets');
  },

  // Fetches the most recent page of history. The backend paginates
  // (?page=/?limit=, default 20/page) and returns pagination metadata on
  // response headers — not consumed here yet since this function's return
  // type is still a plain Transaction[] for drop-in compatibility. A larger
  // limit is requested so this still reads as "full history" for now.
  fetchTransactionHistory: async (_userId: string): Promise<Transaction[]> => {
    const transactions = await apiFetch<any[]>('/transactions?limit=100');
    return transactions.map(normalizeTransaction);
  },

  fetchP2POffers: async (cryptoSymbol: string, fiatCurrency: string, tradeType: P2PTradeType, userCountry: string): Promise<P2POffer[]> => {
    console.log(`Fetching P2P offers for ${cryptoSymbol}/${fiatCurrency}, type: ${tradeType}, country: ${userCountry}`);
    const countryName = Object.keys(AFRICAN_COUNTRIES_DATA).find(
        key => AFRICAN_COUNTRIES_DATA[key].flag === userCountry || AFRICAN_COUNTRIES_DATA[key].currency === fiatCurrency
    ) || 'Nigeria'; // Fallback
    return new Promise(resolve => setTimeout(() => resolve(generateMockP2POffers(countryName, cryptoSymbol, tradeType)), MOCK_API_DELAY));
  },

  fetchUserProfile: async (_userId: string): Promise<UserProfile> => {
    return apiFetch<UserProfile>('/users/me');
  },

  // The backend recomputes avatarInitial itself when username changes, and
  // rejects any field outside its update DTO (username/country/
  // notificationsEnabled/profilePicUrl) — so only those are forwarded, even
  // though callers may pass a wider Partial<UserProfile>.
  updateUserProfile: async (_userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
    const { username, country, notificationsEnabled, profilePicUrl } = data;
    const payload: Partial<UserProfile> = {};
    if (username !== undefined) payload.username = username;
    if (country !== undefined) payload.country = country;
    if (notificationsEnabled !== undefined) payload.notificationsEnabled = notificationsEnabled;
    if (profilePicUrl !== undefined) payload.profilePicUrl = profilePicUrl;

    return apiFetch<UserProfile>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // Proxied through the backend (GET /market/trend/:cryptoSymbol) so the
  // Gemini API key never reaches the browser — it used to be called
  // directly from here with the key injected into the client bundle via
  // vite.config.ts's `define`, which shipped the key to anyone who opened
  // devtools. The backend returns 503 if it has no key configured.
  getMarketTrendExplanation: async (cryptoSymbol: string): Promise<MarketTrendAnalysis> => {
    return apiFetch<MarketTrendAnalysis>(`/market/trend/${encodeURIComponent(cryptoSymbol)}`);
  },

  // The backend performs the balance check, decrement, and PENDING ->
  // COMPLETED transition atomically server-side and returns the finished
  // transaction directly — no client-side polling needed. userId is dropped
  // from the payload since the backend identifies the sender from the token.
  sendCrypto: async (payload: SendCryptoPayload): Promise<Transaction> => {
    const transaction = await apiFetch<any>('/wallets/send', {
      method: 'POST',
      body: JSON.stringify({
        cryptoSymbol: payload.cryptoSymbol,
        recipientAddress: payload.recipientAddress,
        amount: payload.amount,
        memo: payload.memo,
      }),
    });
    return normalizeTransaction(transaction);
  },

  getReceiveAddress: async (userId: string, cryptoSymbol: string): Promise<ReceiveAddress> => {
    console.log(`Generating receive address for ${cryptoSymbol} for user ${userId}`);
    const mockAddress = `mock_${cryptoSymbol.toLowerCase()}_address_${userId}_${Date.now().toString().slice(-6)}`;
    return new Promise(resolve => setTimeout(() => resolve({
      cryptoSymbol,
      address: mockAddress,
      qrCodeData: mockAddress, 
    }), MOCK_API_DELAY));
  },

  initiateP2PTrade: async (offerId: string, amount: string, tradeType: P2PTradeType): Promise<Transaction> => {
    console.log(`Initiating P2P ${tradeType} trade for offer ${offerId} with amount ${amount}`);
    const countryName = mockUserProfile.country;
    
    // Simplified: Generate all possible offers for the country and then find the one.
    // In a real app, you'd likely pass more context or the offer object itself if already fetched.
    let allMockOffers: P2POffer[] = [];
    SUPPORTED_CRYPTO_SYMBOLS.forEach(sym => {
      allMockOffers = [
        ...allMockOffers, 
        ...generateMockP2POffers(countryName, sym, P2PTradeType.BUY),
        ...generateMockP2POffers(countryName, sym, P2PTradeType.SELL)
      ];
    });

    const offer = allMockOffers.find(o => o.id === offerId);
    
    if (!offer) throw new Error('Offer not found for mock trade initiation.');

    const newTransaction: Transaction = {
      id: `p2ptx${Date.now()}`,
      type: tradeType === P2PTradeType.BUY ? TransactionType.P2P_BUY : TransactionType.P2P_SELL,
      cryptoSymbol: offer.cryptoSymbol,
      cryptoAmount: amount, 
      fiatAmount: (parseFloat(amount) * parseFloat(offer.pricePerCoin.replace(/[^0-9.-]+/g,""))).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
      fiatCurrency: offer.fiatCurrency,
      status: TransactionStatus.PENDING,
      timestamp: new Date().toISOString(),
      description: `${tradeType === P2PTradeType.BUY ? 'Buying' : 'Selling'} ${offer.cryptoSymbol} via P2P with ${offer.traderName}`
    };
    mockTransactions.unshift(newTransaction);
    return new Promise(resolve => setTimeout(() => resolve(newTransaction), MOCK_API_DELAY));
  },

  // --- Bill Payments API ---
  fetchBillCategories: async (country: string): Promise<BillCategory[]> => {
    console.log(`Fetching bill categories for ${country}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_BILL_CATEGORIES.filter(cat => cat.countries.includes(country)));
        }, MOCK_API_DELAY);
    });
  },

  fetchBillers: async (country: string, categoryId: string): Promise<Biller[]> => {
    console.log(`Fetching billers for ${country}, category ${categoryId}`);
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(MOCK_BILLERS.filter(b => b.country === country && b.categoryId === categoryId));
        }, MOCK_API_DELAY);
    });
  },

  payBill: async (payload: BillPaymentPayload): Promise<Transaction> => {
    console.log("Simulating paying bill:", payload);
    const wallet = getInMemoryWalletData(mockUserProfile.country);
    const biller = MOCK_BILLERS.find(b => b.id === payload.billerId);
    if (!biller) throw new Error("Biller not found.");

    let cryptoAmountPaid = '0';

    if (SUPPORTED_CRYPTO_SYMBOLS.includes(payload.paymentAssetSymbol)) { // Paying with Crypto
      const asset = wallet.crypto[payload.paymentAssetSymbol];
      if (!asset) throw new Error(`Crypto asset ${payload.paymentAssetSymbol} not found in wallet.`);
      
      const cryptoAmountNeeded = payload.paymentAmountGross; // This is already calculated crypto amount
      cryptoAmountPaid = cryptoAmountNeeded.toString();

      if (parseFloat(asset.balance.replace(/,/g, '')) < cryptoAmountNeeded) {
        throw new Error(`Insufficient ${payload.paymentAssetSymbol} balance.`);
      }
      asset.balance = (parseFloat(asset.balance.replace(/,/g, '')) - cryptoAmountNeeded).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8});
      asset.usdValue = parseFloat(asset.balance.replace(/,/g, '')) * asset.price;
      
    } else { // Paying with Fiat
      const asset = wallet.fiat[payload.paymentAssetSymbol];
      if (!asset) throw new Error(`Fiat asset ${payload.paymentAssetSymbol} not found in wallet.`);
      
      const fiatAmountNeeded = payload.paymentAmountGross; // This is the bill amount in fiat
      cryptoAmountPaid = '0'; // No crypto involved directly for payment itself

      if (parseFloat(asset.balance.replace(/,/g, '')) < fiatAmountNeeded) {
        throw new Error(`Insufficient ${payload.paymentAssetSymbol} balance.`);
      }
      asset.balance = (parseFloat(asset.balance.replace(/,/g, '')) - fiatAmountNeeded).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    // Recalculate total USD balance
    wallet.totalBalanceUSD = Object.values(wallet.crypto).reduce((sum, current) => sum + current.usdValue, 0);
    // Note: This mock totalBalanceUSD does not include fiat values converted to USD. A real app would.
    updateInMemoryWalletData(wallet);

    const newTransaction: Transaction = {
      id: `billtx${Date.now()}`,
      type: TransactionType.BILL_PAYMENT,
      cryptoSymbol: SUPPORTED_CRYPTO_SYMBOLS.includes(payload.paymentAssetSymbol) ? payload.paymentAssetSymbol : '', // Symbol of crypto used, if any
      cryptoAmount: cryptoAmountPaid,
      fiatAmount: payload.amountFiat.toString(),
      fiatCurrency: payload.fiatCurrency,
      status: TransactionStatus.COMPLETED, // Mock success
      timestamp: new Date().toISOString(),
      description: `Paid ${biller.name}`,
      billerName: biller.name,
      billDetails: payload.details,
    };
    mockTransactions.unshift(newTransaction);
    return new Promise(resolve => setTimeout(() => resolve(newTransaction), MOCK_API_DELAY + 500));
  }
};