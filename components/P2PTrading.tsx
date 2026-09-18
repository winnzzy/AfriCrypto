
import React, { useState, useEffect, useCallback } from 'react';
import { P2POffer, P2PTrade, P2PTradeStatus, P2PTradeType, AfricanCountryInfo } from '../types';
import { apiService } from '../services/apiService';
import P2POfferItem from './P2POfferItem';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { SUPPORTED_CRYPTO_SYMBOLS } from '../constants';

interface P2PTradingProps {
  userCountryInfo: AfricanCountryInfo | undefined;
  trades: P2PTrade[];
  onTradesChange: (trades: P2PTrade[]) => void;
  onInitiateTrade: (offerId: string, cryptoSymbol: string, amount: string, tradeType: P2PTradeType) => void;
}

const P2PTrading: React.FC<P2PTradingProps> = ({ userCountryInfo, trades, onTradesChange, onInitiateTrade }) => {
  const [tradeType, setTradeType] = useState<P2PTradeType>(P2PTradeType.BUY);
  const [selectedCrypto, setSelectedCrypto] = useState<string>(SUPPORTED_CRYPTO_SYMBOLS[0]);
  const [amount, setAmount] = useState('');
  const [offers, setOffers] = useState<P2POffer[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradeActionId, setTradeActionId] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    if (!userCountryInfo) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedOffers = await apiService.fetchP2POffers(selectedCrypto, userCountryInfo.currency, tradeType, userCountryInfo.flag); // flag as country identifier for mock
      setOffers(fetchedOffers);
    } catch (err) {
      setError('Failed to fetch P2P offers. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCrypto, tradeType, userCountryInfo?.currency, userCountryInfo?.flag]); // Corrected dependencies

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const updateTrade = (updated: P2PTrade) => onTradesChange(trades.map(t => t.id === updated.id ? updated : t));

  const runTradeAction = async (trade: P2PTrade, action: 'payment' | 'release' | 'cancel' | 'dispute') => {
    setTradeActionId(trade.id);
    setError(null);
    try {
      const updated = action === 'payment' ? await apiService.markP2PPayment(trade.id)
        : action === 'release' ? await apiService.releaseP2PCrypto(trade.id)
        : action === 'cancel' ? await apiService.cancelP2PTrade(trade.id)
        : await apiService.disputeP2PTrade(trade.id);
      updateTrade(updated);
    } catch (err: any) {
      setError(err.message || 'Unable to update trade.');
    } finally {
      setTradeActionId(null);
    }
  };

  const handleTradeAction = (offerId: string, cryptoSymbol: string) => {
    // In a real app, you'd likely open a modal to confirm amount, etc.
    // For this mock, we'll use the globally set amount, or a default.
    const tradeAmount = amount || "0.001"; // Default amount if not set
    onInitiateTrade(offerId, cryptoSymbol, tradeAmount, tradeType);
  };
  
  if (!userCountryInfo) {
    return <LoadingSpinner text="Initializing P2P market..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold text-xl">P2P Trading</h3>
        <div className="flex bg-slate-700 rounded-lg p-1">
          <button 
            onClick={() => setTradeType(P2PTradeType.BUY)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tradeType === P2PTradeType.BUY ? 'bg-green-500 text-white shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            Buy
          </button>
          <button 
            onClick={() => setTradeType(P2PTradeType.SELL)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              tradeType === P2PTradeType.SELL ? 'bg-red-500 text-white shadow-md' : 'text-gray-300 hover:text-white'
            }`}
          >
            Sell
          </button>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="p2p-crypto-select" className="text-gray-400 text-xs mb-1 block">Crypto</label>
            <select 
              id="p2p-crypto-select"
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SUPPORTED_CRYPTO_SYMBOLS.map(symbol => <option key={symbol} value={symbol}>{symbol}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="p2p-fiat-select" className="text-gray-400 text-xs mb-1 block">Fiat</label>
            <select 
              id="p2p-fiat-select"
              disabled 
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option>{userCountryInfo.currency}</option>
            </select>
          </div>
        </div>
        
        <div className="mb-2">
          <label htmlFor="p2p-amount-input" className="text-gray-400 text-xs mb-1 block">Amount ({userCountryInfo.currency})</label>
          <input 
            id="p2p-amount-input"
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter amount in ${userCountryInfo.currency}`}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button 
            onClick={fetchOffers}
            disabled={isLoading}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Find Offers'}
        </button>
      </div>

      {isLoading && <LoadingSpinner text="Fetching offers..." />}
      {error && <ErrorMessage message={error} />}
      
      {!isLoading && !error && offers && offers.length === 0 && (
        <p className="text-gray-400 text-center py-4">No offers found for your criteria.</p>
      )}

      {trades.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
          <h4 className="text-white font-semibold">My P2P Trades</h4>
          {trades.slice(0, 5).map(trade => (
            <div key={trade.id} className="border border-slate-700 rounded-lg p-3">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-white text-sm font-medium">{trade.cryptoAmount} {trade.cryptoSymbol}</p>
                  <p className="text-gray-400 text-xs">{trade.fiatAmount} {trade.fiatCurrency}</p>
                </div>
                <span className="text-xs text-blue-300">{trade.status.replaceAll('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {trade.status === P2PTradeStatus.AWAITING_PAYMENT && <>
                  <button disabled={tradeActionId===trade.id} onClick={() => runTradeAction(trade,'payment')} className="px-3 py-1.5 bg-blue-600 rounded text-xs text-white">I have paid</button>
                  <button disabled={tradeActionId===trade.id} onClick={() => runTradeAction(trade,'cancel')} className="px-3 py-1.5 bg-slate-600 rounded text-xs text-white">Cancel</button>
                </>}
                {trade.status === P2PTradeStatus.PAYMENT_MARKED && <>
                  <button disabled={tradeActionId===trade.id} onClick={() => runTradeAction(trade,'release')} className="px-3 py-1.5 bg-green-600 rounded text-xs text-white">Release crypto</button>
                  <button disabled={tradeActionId===trade.id} onClick={() => runTradeAction(trade,'dispute')} className="px-3 py-1.5 bg-amber-600 rounded text-xs text-white">Open dispute</button>
                </>}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && offers && offers.length > 0 && (
        <div className="space-y-3">
          {offers.map(offer => (
            <P2POfferItem key={offer.id} offer={offer} tradeType={tradeType} onTrade={handleTradeAction} />
          ))}
        </div>
      )}
    </div>
  );
};

export default P2PTrading;
