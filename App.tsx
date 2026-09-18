
import React, { useState, useEffect, useCallback } from 'react';
import {
  Home, TrendingUp, Wallet, Activity, User, QrCode, Smartphone, X, MapPin, Search, Filter, AlertTriangle, Send, CheckCircle, RefreshCw, MessageCircle, Star, Shield, Bell, Eye, EyeOff, Copy, CreditCard, ArrowUpRight, ArrowDownLeft, Clock, Plus, Minus, Key, Lock, TrendingDown, Settings, Download, Menu, ChevronDown, Award, Lightbulb, ShieldCheck as ShieldCheckIcon, Zap, Wifi, Tv, Gamepad2, Router, FileText // Added Bill Payment Icons
} from 'lucide-react'; 

import { 
  ActiveTab, 
  WalletData, 
  Transaction, 
  UserProfile,
  P2PTradeType,
  P2PTrade,
  AppNotification,
  TransactionType // Added TransactionType
} from './types';
import { AFRICAN_COUNTRIES_DATA, MOCK_MARKET_HIGHLIGHTS, MOCK_INFO_CARD_DATA } from './constants';
import { apiService, AUTH_EXPIRED_EVENT } from './services/apiService';

// Import Components
import AuthView from './components/AuthView';
import MobileHeader from './components/MobileHeader';
import WalletOverview from './components/WalletOverview';
import CryptoList from './components/CryptoList';
import P2PTrading from './components/P2PTrading';
import TransactionHistory from './components/TransactionHistory';
import MobileNavigation from './components/MobileNavigation';
import InstallPromptComponent from './components/InstallPrompt';
import ProfileView from './components/ProfileView';
import SendCryptoView from './components/SendCryptoView';
import ReceiveCryptoView from './components/ReceiveCryptoView';
import QRScannerModal from './components/QRScannerModal';
import MarketAnalysisModal from './components/MarketAnalysisModal';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

// New Home Page Components
import MarketHighlights from './components/MarketHighlights';
import QuickActionsGrid from './components/QuickActionsGrid';
import CondensedTransactionHistory from './components/CondensedTransactionHistory';
import InfoCard from './components/InfoCard';

// New Wallet Page Components
import PortfolioSummary from './components/PortfolioSummary';
import FiatAssetList from './components/FiatAssetList';

// New Bill Payments Component
import BillPaymentsView from './components/BillPaymentsView';


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(ActiveTab.HOME);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [p2pTrades, setP2PTrades] = useState<P2PTrade[]>([]);

  // Gates the whole app behind auth. authChecking covers the brief window
  // where we're trying to silently restore a session from a stored refresh
  // token before deciding whether to show the login screen.
  const [authChecking, setAuthChecking] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showMarketAnalysisModal, setShowMarketAnalysisModal] = useState<string | null>(null); 
  
  const [notificationsCount, setNotificationsCount] = useState(3); 
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null); 
  const [showInstallPromptBanner, setShowInstallPromptBanner] = useState(false);

  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((message: string, type: AppNotification['type'] = 'info') => {
    const newNotif = { id: Date.now().toString(), message, type, timestamp: Date.now() };
    setAppNotifications(prev => [newNotif, ...prev.slice(0, 2)]); 
    setTimeout(() => {
      setAppNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000); 
  }, []);

  const currentCountryInfo = userProfile ? AFRICAN_COUNTRIES_DATA[userProfile.country] : AFRICAN_COUNTRIES_DATA['Nigeria'];

  // Loads wallet + transaction data for an already-known profile (from login,
  // signup, or a restored session) — unlike the old loadInitialData, it no
  // longer fetches the profile itself since the caller already has it.
  const loadAppData = useCallback(async (profile: UserProfile, isRetry = false) => {
    if (!isRetry) setIsLoading(true); else addNotification("Retrying data load...", "info");
    setError(null);
    try {
      const [fetchedWalletData, fetchedTransactions] = await Promise.all([
        apiService.fetchWalletData(profile.userId, profile.country),
        apiService.fetchTransactionHistory(profile.userId),
      ]);
      setWalletData(fetchedWalletData);
      setTransactions(fetchedTransactions);
      try { setP2PTrades(await apiService.fetchP2PTrades()); } catch { setP2PTrades([]); }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setError("Could not load app data. Please check your connection and try again.");
      addNotification("Error loading data.", 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const handleLogout = useCallback(() => {
    apiService.logout();
    setUserProfile(null);
    setWalletData(null);
    setTransactions(null);
    setActiveTab(ActiveTab.HOME);
  }, []);

  const handleAuthenticated = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    await loadAppData(profile);
  }, [loadAppData]);

  // On boot, try to silently resume a session from a stored refresh token
  // before falling back to the login screen.
  useEffect(() => {
    (async () => {
      const restoredProfile = await apiService.restoreSession();
      if (restoredProfile) {
        setUserProfile(restoredProfile);
        await loadAppData(restoredProfile);
      }
      setAuthChecking(false);
    })();
    // Only ever run once on mount — loadAppData is stable via useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fires if any API call's token refresh attempt fails (e.g. the refresh
  // token itself expired or was revoked) — drops back to the login screen
  // from anywhere in the app, not just whichever call site hit it.
  useEffect(() => {
    const handleExpired = () => {
      handleLogout();
      addNotification("Your session has expired. Please log in again.", "error");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, [handleLogout, addNotification]);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); addNotification("You are back online!", "success");}
    const handleOffline = () => { setIsOnline(false); addNotification("You are offline. Features may be limited.", "error");}
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallPromptBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [addNotification]);
  
  const handleInstallPWA = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        addNotification("AfriCrypto installed successfully!", "success");
      }
      setDeferredInstallPrompt(null);
      setShowInstallPromptBanner(false);
    }
  };

  const handleQuickAction = (tab: ActiveTab) => {
    setActiveTab(tab);
  };
  
  const handleNavigation = (tab: ActiveTab) => {
    setActiveTab(tab);
  };


  const handleRefreshWallet = async () => {
    if (!userProfile) return;
    addNotification("Refreshing wallet data...", "info");
    try {
      const refreshedWalletData = await apiService.fetchWalletData(userProfile.userId, userProfile.country);
      setWalletData(refreshedWalletData);
      // Also refresh transactions as part of a general refresh
      const refreshedTransactions = await apiService.fetchTransactionHistory(userProfile.userId);
      setTransactions(refreshedTransactions);
      addNotification("Wallet data refreshed!", "success");
    } catch (e) {
      addNotification("Failed to refresh wallet data.", "error");
    }
  };

  const handleUpdateCountry = async (newCountry: string) => {
    if (!userProfile || userProfile.country === newCountry) return;
    const oldCountry = userProfile.country;
    addNotification(`Updating location to ${newCountry}...`, "info");
    setUserProfile(prev => prev ? { ...prev, country: newCountry } : null);
    try {
      await apiService.updateUserProfile(userProfile.userId, { country: newCountry });
      // Wallet data needs to be re-fetched for the new country context (especially fiat)
      const refreshedWalletData = await apiService.fetchWalletData(userProfile.userId, newCountry);
      setWalletData(refreshedWalletData);
      addNotification(`Location updated to ${newCountry}.`, "success");
    } catch (e) {
      setUserProfile(prev => prev ? { ...prev, country: oldCountry } : null); // Revert on error
      addNotification("Failed to update location.", "error");
    }
  };

  const handleToggleNotifications = async (enabled: boolean) => {
     if (!userProfile) return;
     setUserProfile(prev => prev ? { ...prev, notificationsEnabled: enabled } : null);
     try {
       await apiService.updateUserProfile(userProfile.userId, { notificationsEnabled: enabled });
       addNotification(`Notifications ${enabled ? 'enabled' : 'disabled'}.`, "success");
     } catch (e) {
       setUserProfile(prev => prev ? { ...prev, notificationsEnabled: !enabled } : null);
       addNotification("Failed to update notification settings.", "error");
     }
  };

  const handleSendCrypto = async (cryptoSymbol: string, recipientAddress: string, amount: string) => {
    if (!userProfile) return;
    try {
      const newTransaction = await apiService.sendCrypto({ userId: userProfile.userId, cryptoSymbol, recipientAddress, amount });
      setTransactions(prev => prev ? [newTransaction, ...prev] : [newTransaction]);
      // Re-fetch wallet data after send
      const refreshedWalletData = await apiService.fetchWalletData(userProfile.userId, userProfile.country);
      setWalletData(refreshedWalletData);
      addNotification(`Successfully sent ${amount} ${cryptoSymbol}.`, "success");
    } catch (err: any) {
      addNotification(err.message || `Failed to send ${cryptoSymbol}.`, "error");
      throw err;
    }
  };

  const handleInitiateP2PTrade = async (offerId: string, cryptoSymbol: string, amount: string, tradeType: P2PTradeType) => {
    try {
        const newTrade = await apiService.initiateP2PTrade(offerId, amount, tradeType);
        setP2PTrades(prev => [newTrade, ...prev.filter(t => t.id !== newTrade.id)]);
        addNotification(`P2P ${tradeType} for ${amount} ${cryptoSymbol} initiated. Crypto is now protected by escrow.`, "success");
        if (userProfile) {
          const refreshedWalletData = await apiService.fetchWalletData(userProfile.userId, userProfile.country);
          setWalletData(refreshedWalletData);
        }
    } catch (err: any) {
        addNotification(err.message || `Failed to initiate P2P ${tradeType}.`, "error");
    }
  };

  const handleBillPaymentSuccess = async (newTransaction: Transaction) => {
    addNotification(`Successfully paid ${newTransaction.billerName || 'bill'}.`, 'success');
    setTransactions(prev => prev ? [newTransaction, ...prev] : [newTransaction]);
    // Re-fetch wallet data as bill payment affects balance
    if (userProfile) {
        try {
            const refreshedWalletData = await apiService.fetchWalletData(userProfile.userId, userProfile.country);
            setWalletData(refreshedWalletData);
        } catch(e) {
            addNotification("Error updating wallet after bill payment.", "error");
        }
    }
    // Optionally navigate away from bill payment success screen or reset it
  };


  const renderContent = () => {
    if (isLoading && walletData === null && transactions === null) {
      return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><LoadingSpinner text="Loading AfriCrypto..." size="lg" /></div>;
    }
    if (error && walletData === null && transactions === null) {
      return (
        <div className="p-4">
          <ErrorMessage title="Application Error" message={error} />
          <button
            onClick={() => userProfile && loadAppData(userProfile, true)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case ActiveTab.HOME:
        return (
          <div className="space-y-1">
            {userProfile && <h2 className="text-2xl font-semibold text-white mb-3 mt-1">Welcome back, <span className="text-blue-400">{userProfile.username}!</span></h2>}
            <WalletOverview 
              walletData={walletData} 
              onQuickAction={handleQuickAction} 
              onRefresh={handleRefreshWallet}
              onShowQRScanner={() => setShowQRScanner(true)}
            />
            <MarketHighlights 
                highlights={MOCK_MARKET_HIGHLIGHTS} 
                onAnalyze={(symbol) => setShowMarketAnalysisModal(symbol)}
            />
            <QuickActionsGrid 
                onNavigate={handleNavigation} 
                onShowQRScanner={() => setShowQRScanner(true)} 
            />
            <CondensedTransactionHistory 
                transactions={transactions} 
                onNavigateToHistory={() => setActiveTab(ActiveTab.HISTORY)} 
            />
            <InfoCard 
                title={MOCK_INFO_CARD_DATA.title}
                text={MOCK_INFO_CARD_DATA.text}
                iconName={MOCK_INFO_CARD_DATA.icon as "ShieldCheck" | "Lightbulb" | "Zap"}
                onClick={() => addNotification("Learn more clicked! (placeholder)", "info")}
            />
          </div>
        );
      case ActiveTab.WALLET:
         return (
          <div className="space-y-6">
            <PortfolioSummary 
                walletData={walletData}
                onNavigate={handleNavigation}
            />
            <CryptoList 
              assets={walletData?.crypto || null} 
              onSelectAsset={(symbol) => console.log("Selected asset:", symbol)}
              onAnalyzeAsset={(symbol) => setShowMarketAnalysisModal(symbol)}
            />
            <FiatAssetList 
                fiatAssets={walletData?.fiat || null}
                africanCountriesData={AFRICAN_COUNTRIES_DATA}
            />
          </div>
        );
      case ActiveTab.BILLS:
        return <BillPaymentsView 
                  userProfile={userProfile} 
                  walletData={walletData} 
                  onPaymentSuccess={handleBillPaymentSuccess} 
                />;
      case ActiveTab.TRADE:
        return <P2PTrading userCountryInfo={currentCountryInfo} trades={p2pTrades} onTradesChange={setP2PTrades} onInitiateTrade={handleInitiateP2PTrade}/>;
      case ActiveTab.HISTORY:
        return <TransactionHistory transactions={transactions} isLoading={isLoading && transactions === null} />;
      case ActiveTab.PROFILE:
        return <ProfileView
                  userProfile={userProfile}
                  africanCountries={AFRICAN_COUNTRIES_DATA}
                  onUpdateCountry={handleUpdateCountry}
                  onToggleNotifications={handleToggleNotifications}
                  onLogout={handleLogout}
               />;
      case ActiveTab.SEND:
        return <SendCryptoView walletData={walletData} onSend={handleSendCrypto} onShowQRScanner={() => setShowQRScanner(true)} />;
      case ActiveTab.RECEIVE:
        return <ReceiveCryptoView />;
      default:
        return <p className="text-white">Page not found.</p>;
    }
  };
  
  const cryptoForAnalysis = showMarketAnalysisModal && walletData?.crypto[showMarketAnalysisModal];

  // Still resolving whether a stored refresh token is good for anything —
  // avoid flashing the login screen for users with a valid session.
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <LoadingSpinner text="Loading AfriCrypto..." size="lg" />
      </div>
    );
  }

  if (!userProfile) {
    return <AuthView onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col">
      {userProfile && <MobileHeader userCountryInfo={currentCountryInfo} notificationCount={notificationsCount} isOnline={isOnline} />}
      
      <div className="fixed top-[60px] sm:top-[68px] right-2 sm:right-4 z-[100] w-full max-w-[calc(100%-1rem)] sm:max-w-xs md:max-w-sm space-y-2 pointer-events-none">
        {appNotifications.map(n => (
          <div key={n.id} 
               className={`p-3 rounded-lg shadow-xl text-sm flex items-start space-x-2 border pointer-events-auto
                           ${n.type === 'success' ? 'bg-green-600/95 border-green-500 text-white' : 
                             n.type === 'error' ? 'bg-red-600/95 border-red-500 text-white' : 
                             'bg-blue-600/95 border-blue-500 text-white'}
                            animate-fade-in-down transition-opacity duration-300 opacity-0`}
                style={{ animationFillMode: 'forwards' }}
            >
            {n.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {n.type === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {n.type === 'info' && <MessageCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <span>{n.message}</span>
          </div>
        ))}
      </div>

      <main className="flex-grow px-4 py-4 max-w-md mx-auto w-full pb-20"> 
        {showInstallPromptBanner && deferredInstallPrompt && (
          <InstallPromptComponent onInstall={handleInstallPWA} />
        )}
        {error && userProfile && <ErrorMessage title="Error" message={error} /> }
        {renderContent()}
      </main>

      {showQRScanner && <QRScannerModal onClose={() => setShowQRScanner(false)} />}
      {showMarketAnalysisModal && cryptoForAnalysis && (
        <MarketAnalysisModal 
          cryptoSymbol={showMarketAnalysisModal} 
          cryptoName={cryptoForAnalysis.name}
          onClose={() => setShowMarketAnalysisModal(null)} 
        />
      )}
      
      {userProfile && <MobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
};

export default App;
