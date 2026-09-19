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
  P2PTrade,
  P2PTradeStatus,
  BillCategory,
  Biller,
  BillPaymentPayload,
  BillPayment,
} from '../types';

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
  } catch { /* session persistence unavailable */ }
};

const clearTokens = (): void => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch { /* no-op */ }
};

export const AUTH_EXPIRED_EVENT = 'africrypto:auth-expired';
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
  } catch { /* non-JSON response */ }
  return `Request failed with status ${res.status}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, allowRefresh = true): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && allowRefresh && !path.startsWith('/auth/') && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch<T>(path, options, false);
    clearTokens();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    throw new Error('Your session has expired. Please log in again.');
  }

  if (!res.ok) throw new Error(await extractErrorMessage(res));
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

function normalizeP2PTrade(raw: any): P2PTrade {
  return {
    ...raw,
    type: String(raw.type).toLowerCase() as P2PTradeType,
    status: String(raw.status).toLowerCase() as P2PTradeStatus,
  };
}

function normalizeTransaction(raw: any): Transaction {
  return {
    ...raw,
    type: String(raw.type).toLowerCase() as TransactionType,
    status: String(raw.status).toLowerCase() as TransactionStatus,
  };
}

export const apiService = {
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

  logout: (): void => clearTokens(),
  hasStoredSession: (): boolean => !!getRefreshToken(),

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

  fetchWalletData: async (_userId: string, _userCountry: string): Promise<WalletData> =>
    apiFetch<WalletData>('/wallets'),

  fetchTransactionHistory: async (_userId: string): Promise<Transaction[]> => {
    const transactions = await apiFetch<any[]>('/transactions?limit=100');
    return transactions.map(normalizeTransaction);
  },

  fetchP2POffers: async (
    cryptoSymbol: string,
    fiatCurrency: string,
    tradeType: P2PTradeType,
    _userCountry: string,
  ): Promise<P2POffer[]> => {
    const query = new URLSearchParams({
      cryptoSymbol,
      fiatCurrency,
      type: tradeType.toUpperCase(),
    });
    return apiFetch<P2POffer[]>(`/p2p/offers?${query.toString()}`);
  },

  fetchUserProfile: async (_userId: string): Promise<UserProfile> =>
    apiFetch<UserProfile>('/users/me'),

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

  getMarketTrendExplanation: async (cryptoSymbol: string): Promise<MarketTrendAnalysis> =>
    apiFetch<MarketTrendAnalysis>(`/market/trend/${encodeURIComponent(cryptoSymbol)}`),

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

  getReceiveAddress: async (_userId: string, cryptoSymbol: string): Promise<ReceiveAddress> =>
    apiFetch<ReceiveAddress>(`/wallets/receive/${encodeURIComponent(cryptoSymbol)}`),

  initiateP2PTrade: async (offerId: string, amount: string, _tradeType: P2PTradeType): Promise<P2PTrade> => {
    const trade = await apiFetch<any>('/p2p/trade', {
      method: 'POST',
      body: JSON.stringify({ offerId, amount }),
    });
    return normalizeP2PTrade(trade);
  },

  fetchP2PTrades: async (): Promise<P2PTrade[]> => {
    const trades = await apiFetch<any[]>('/p2p/trades');
    return trades.map(normalizeP2PTrade);
  },

  markP2PPayment: async (tradeId: string): Promise<P2PTrade> =>
    normalizeP2PTrade(await apiFetch<any>(`/p2p/trades/${encodeURIComponent(tradeId)}/payment`, { method: 'POST' })),

  releaseP2PCrypto: async (tradeId: string): Promise<P2PTrade> =>
    normalizeP2PTrade(await apiFetch<any>(`/p2p/trades/${encodeURIComponent(tradeId)}/release`, { method: 'POST' })),

  cancelP2PTrade: async (tradeId: string): Promise<P2PTrade> =>
    normalizeP2PTrade(await apiFetch<any>(`/p2p/trades/${encodeURIComponent(tradeId)}/cancel`, { method: 'POST' })),

  disputeP2PTrade: async (tradeId: string): Promise<P2PTrade> =>
    normalizeP2PTrade(await apiFetch<any>(`/p2p/trades/${encodeURIComponent(tradeId)}/dispute`, { method: 'POST' })),

  fetchBillCategories: async (country: string): Promise<BillCategory[]> =>
    apiFetch<BillCategory[]>(`/bills/categories/${encodeURIComponent(country)}`),

  fetchBillers: async (country: string, categoryId: string): Promise<Biller[]> =>
    apiFetch<Biller[]>(`/bills/billers/${encodeURIComponent(country)}/${encodeURIComponent(categoryId)}`),

  payBill: async (payload: BillPaymentPayload): Promise<Transaction> => {
    const transaction = await apiFetch<any>('/bills/pay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return normalizeTransaction(transaction);
  },

  fetchBillPayment: async (paymentId: string): Promise<BillPayment> => {
    const payment = await apiFetch<any>(`/bills/payments/${encodeURIComponent(paymentId)}`);
    return { ...payment, status: String(payment.status).toLowerCase() as TransactionStatus };
  },

  reconcileBillPayment: async (paymentId: string): Promise<BillPayment> => {
    const payment = await apiFetch<any>(`/bills/payments/${encodeURIComponent(paymentId)}/reconcile`, { method: 'POST' });
    return { ...payment, status: String(payment.status).toLowerCase() as TransactionStatus };
  },
};
