
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
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
    GEMINI_TEXT_MODEL, 
    AFRICAN_COUNTRIES_DATA, 
    INITIAL_CRYPTO_ASSETS, 
    INITIAL_FIAT_ASSETS,
    MOCK_BILL_CATEGORIES,
    MOCK_BILLERS,
    MOCK_USD_TO_FIAT_RATES,
    SUPPORTED_CRYPTO_SYMBOLS
} from '../constants';

const MOCK_API_DELAY = 500; // milliseconds

// Ensure API_KEY is handled correctly
let apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn("API_KEY for Gemini is not set. Market analysis feature will be disabled.");
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;


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
  fetchWalletData: async (userId: string, userCountry: string): Promise<WalletData> => {
    console.log(`Fetching wallet data for user ${userId} in ${userCountry}`);
    return new Promise(resolve => setTimeout(() => {
        const data = getInMemoryWalletData(userCountry);
        resolve(JSON.parse(JSON.stringify(data))); // Return copy
    }, MOCK_API_DELAY));
  },

  fetchTransactionHistory: async (userId: string): Promise<Transaction[]> => {
    console.log(`Fetching transaction history for user ${userId}`);
    return new Promise(resolve => setTimeout(() => resolve([...mockTransactions]), MOCK_API_DELAY));
  },

  fetchP2POffers: async (cryptoSymbol: string, fiatCurrency: string, tradeType: P2PTradeType, userCountry: string): Promise<P2POffer[]> => {
    console.log(`Fetching P2P offers for ${cryptoSymbol}/${fiatCurrency}, type: ${tradeType}, country: ${userCountry}`);
    const countryName = Object.keys(AFRICAN_COUNTRIES_DATA).find(
        key => AFRICAN_COUNTRIES_DATA[key].flag === userCountry || AFRICAN_COUNTRIES_DATA[key].currency === fiatCurrency
    ) || 'Nigeria'; // Fallback
    return new Promise(resolve => setTimeout(() => resolve(generateMockP2POffers(countryName, cryptoSymbol, tradeType)), MOCK_API_DELAY));
  },

  fetchUserProfile: async (userId: string): Promise<UserProfile> => {
    console.log(`Fetching profile for user ${userId}`);
    // Update avatarInitial if username changes and it's not set explicitly
    if (mockUserProfile.username === 'Nnamuah Winner' && mockUserProfile.avatarInitial !== 'N') {
        mockUserProfile.avatarInitial = 'N';
    } else if (mockUserProfile.username !== 'Nnamuah Winner' && mockUserProfile.avatarInitial === 'V') { // Revert if username is not ValiantUser
         mockUserProfile.avatarInitial = mockUserProfile.username.charAt(0).toUpperCase();
    }

    return new Promise(resolve => setTimeout(() => resolve({...mockUserProfile}), MOCK_API_DELAY));
  },
  
  updateUserProfile: async (userId: string, data: Partial<UserProfile>): Promise<UserProfile> => {
    console.log(`Updating profile for user ${userId} with data:`, data);
    
    // If username is part of the update, also update avatarInitial
    if (data.username) {
        data.avatarInitial = data.username.charAt(0).toUpperCase();
    }

    mockUserProfile = { ...mockUserProfile, ...data };
    // If country changed, reset wallet data to reflect new country's fiat (or lack thereof initially)
    if (data.country) {
      currentWalletData = generateMockWalletData(data.country);
    }
    return new Promise(resolve => setTimeout(() => resolve({...mockUserProfile}), MOCK_API_DELAY));
  },

  getMarketTrendExplanation: async (cryptoSymbol: string): Promise<MarketTrendAnalysis> => {
    if (!ai) {
      return Promise.reject(new Error("Gemini API client not initialized. API_KEY might be missing."));
    }
    console.log(`Fetching market trend explanation for ${cryptoSymbol} using Gemini`);
    const prompt = `Explain the recent (last 7 days) market trends and key news for ${cryptoSymbol} in a concise paragraph (around 50-70 words) suitable for a mobile crypto app user. Focus on factual price movements and significant events if any. Avoid financial advice.`;
    
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: { temperature: 0.5 } 
      });
      const explanationText = response.text;
      return {
        cryptoSymbol,
        explanation: explanationText,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error fetching market trend explanation from Gemini:", error);
      throw error; 
    }
  },

  sendCrypto: async (payload: SendCryptoPayload): Promise<Transaction> => {
    console.log("Simulating sending crypto:", payload);
    const wallet = getInMemoryWalletData(mockUserProfile.country);
    const asset = wallet.crypto[payload.cryptoSymbol];

    if (!asset || parseFloat(asset.balance.replace(/,/g, '')) < parseFloat(payload.amount)) {
        throw new Error("Insufficient balance.");
    }
    
    asset.balance = (parseFloat(asset.balance.replace(/,/g, '')) - parseFloat(payload.amount)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 8});
    asset.usdValue = parseFloat(asset.balance.replace(/,/g, '')) * asset.price;
    
    // Recalculate total USD balance
    wallet.totalBalanceUSD = Object.values(wallet.crypto).reduce((sum, current) => sum + current.usdValue, 0);
    updateInMemoryWalletData(wallet);


    const newTransaction: Transaction = {
      id: `tx${Date.now()}`,
      type: TransactionType.SEND,
      cryptoSymbol: payload.cryptoSymbol,
      cryptoAmount: payload.amount,
      status: TransactionStatus.PENDING,
      timestamp: new Date().toISOString(),
      addressTo: payload.recipientAddress,
      description: `Sent ${payload.cryptoSymbol} to ${payload.recipientAddress.substring(0,10)}...`
    };
    mockTransactions.unshift(newTransaction); 
    return new Promise(resolve => setTimeout(() => {
      const completedTx = { ...newTransaction, status: TransactionStatus.COMPLETED };
      const txIndex = mockTransactions.findIndex(tx => tx.id === completedTx.id);
      if (txIndex !== -1) mockTransactions[txIndex] = completedTx;
      resolve(completedTx);
    }, MOCK_API_DELAY + 1000));
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