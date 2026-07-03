
import React from 'react';
import { Shield, Star, Clock, AlertCircle } from 'lucide-react'; 
import { P2POffer, P2PTradeType } from '../types';

interface P2POfferItemProps {
  offer: P2POffer;
  tradeType: P2PTradeType;
  onTrade: (offerId: string, cryptoSymbol: string) => void;
}

const P2POfferItem: React.FC<P2POfferItemProps> = ({ offer, tradeType, onTrade }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 transition-shadow hover:shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{offer.traderAvatarInitial}</span>
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="text-white font-medium text-sm">{offer.traderName}</span>
              {offer.isVerified && <Shield className="w-3 h-3 text-green-400 fill-green-500/30" />}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-500/50" />
                <span className="text-gray-400 text-xs ml-1">{offer.traderRating.toFixed(1)}</span>
              </div>
              <span className="text-gray-400 text-xs">({offer.traderTrades} trades)</span>
            </div>
          </div>
        </div>
        {offer.isOnline && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs">Online</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1.5 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Price:</span>
          <span className="text-white font-medium">{offer.pricePerCoin} / {offer.cryptoSymbol}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Available:</span>
          <span className="text-white">{offer.availableAmountCrypto}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Limit:</span>
          <span className="text-white">{offer.limitFiat}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Payment:</span>
          <span className="text-white truncate max-w-[120px] sm:max-w-[150px]">{offer.paymentMethods.join(', ')}</span>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-gray-500 flex items-center"><AlertCircle className="w-3.5 h-3.5 mr-1 text-yellow-500"/> Payment Window:</span>
          <span className="text-gray-300">{offer.paymentWindowMinutes} min</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500 flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-blue-400"/> Avg. Release:</span>
          <span className="text-gray-300">~{offer.avgReleaseTimeMinutes} min</span>
        </div>
      </div>
      
      <button 
        onClick={() => onTrade(offer.id, offer.cryptoSymbol)}
        className={`w-full py-2.5 rounded-lg font-medium transition-all text-sm ${
        tradeType === P2PTradeType.BUY 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-red-500 hover:bg-red-600 text-white'
      }`}
      aria-label={`${tradeType === P2PTradeType.BUY ? 'Buy' : 'Sell'} ${offer.cryptoSymbol} from ${offer.traderName}`}
      >
        {tradeType === P2PTradeType.BUY ? 'Buy' : 'Sell'} {offer.cryptoSymbol}
      </button>
    </div>
  );
};

export default P2POfferItem;
