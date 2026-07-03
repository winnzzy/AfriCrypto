
import React from 'react';
import { QrCode, RefreshCw, ArrowUpRight, ArrowDownLeft, TrendingUp } from 'lucide-react';
import { WalletData } from '../types';
import { ActiveTab } from '../types'; // Ensure ActiveTab is imported

interface WalletOverviewProps {
  walletData: WalletData | null;
  onQuickAction: (tab: ActiveTab) => void;
  onRefresh: () => void;
  onShowQRScanner: () => void;
}

const WalletOverview: React.FC<WalletOverviewProps> = ({ walletData, onQuickAction, onRefresh, onShowQRScanner }) => {
  if (!walletData) {
    return (
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6 animate-pulse">
            <div className="h-8 bg-blue-400/50 rounded w-3/4 mb-2"></div>
            <div className="h-12 bg-blue-400/50 rounded w-1/2 mb-4"></div>
            <div className="grid grid-cols-3 gap-3">
                {[1,2,3].map(i => <div key={i} className="bg-white/10 rounded-xl p-3 h-20"></div>)}
            </div>
        </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-blue-100 text-sm">Total Portfolio Value</p>
          <h2 className="text-3xl font-bold">${walletData.totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <p className={`${walletData.dailyChangePercent >= 0 ? 'text-green-300' : 'text-red-300'} text-sm`}>
            {walletData.dailyChangePercent >= 0 ? '+' : ''}
            {walletData.dailyChangePercent.toFixed(1)}% today
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onShowQRScanner} // This could be for receiving via QR, or scanning to send. Ambiguous in original. Let's assume it means "Show my QR for receiving"
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <QrCode className="w-5 h-5" />
          </button>
          <button 
            onClick={onRefresh}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={() => onQuickAction(ActiveTab.SEND)}
          className="bg-white/20 hover:bg-white/30 rounded-xl p-3 flex flex-col items-center transition-colors"
        >
          <ArrowUpRight className="w-5 h-5 mb-1" />
          <span className="text-xs">Send</span>
        </button>
        <button 
          onClick={() => onQuickAction(ActiveTab.RECEIVE)}
          className="bg-white/20 hover:bg-white/30 rounded-xl p-3 flex flex-col items-center transition-colors"
        >
          <ArrowDownLeft className="w-5 h-5 mb-1" />
          <span className="text-xs">Receive</span>
        </button>
        <button 
          onClick={() => onQuickAction(ActiveTab.TRADE)}
          className="bg-white/20 hover:bg-white/30 rounded-xl p-3 flex flex-col items-center transition-colors"
        >
          <TrendingUp className="w-5 h-5 mb-1" />
          <span className="text-xs">Trade</span>
        </button>
      </div>
    </div>
  );
};

export default WalletOverview;
