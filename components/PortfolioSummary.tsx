
import React from 'react';
import { WalletData, CryptoAsset, ActiveTab } from '../types';
import { Download, Upload, Repeat, PieChart, ShieldCheck as ShieldCheckIcon } from 'lucide-react'; // Download for Deposit, Upload for Withdraw, Repeat for Swap

interface PortfolioSummaryProps {
  walletData: WalletData | null;
  onNavigate: (tab: ActiveTab) => void;
  // onSwap: () => void; // For future swap functionality
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ walletData, onNavigate }) => {
  if (!walletData) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-10 bg-slate-700 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-slate-700 rounded w-full mb-4"></div>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="bg-slate-700/50 rounded-xl h-16"></div>)}
        </div>
      </div>
    );
  }

  const { totalBalanceUSD, crypto, dailyChangePercent } = walletData;

  // Calculate crypto distribution for a simple bar
  const topAssetsForChart = ['BTC', 'ETH', 'USDT'];
  let totalCryptoValue = 0;
  Object.values(crypto).forEach(c => totalCryptoValue += c.usdValue);
  
  const chartData = topAssetsForChart.map(symbol => {
    const asset = crypto[symbol];
    return asset && totalCryptoValue > 0 ? 
      { symbol, value: asset.usdValue, percentage: (asset.usdValue / totalCryptoValue) * 100, color: asset.colorClass.replace('bg-', 'border-') } : 
      null;
  }).filter(Boolean) as { symbol: string; value: number; percentage: number, color: string }[];

  const otherPercentage = 100 - chartData.reduce((sum, asset) => sum + asset.percentage, 0);
  if (otherPercentage > 0.1 && totalCryptoValue > 0) { // Add "Others" if significant
    chartData.push({symbol: "Others", value: 0, percentage: otherPercentage, color: 'border-gray-500'});
  }


  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 mb-6 shadow-xl">
      <div className="flex justify-between items-center mb-1">
        <p className="text-gray-400 text-sm">Total Portfolio Value</p>
        <PieChart className="w-5 h-5 text-gray-500" />
      </div>
      <h2 className="text-3xl text-white font-bold mb-1">${totalBalanceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
      <p className={`text-sm mb-1 ${dailyChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {dailyChangePercent >= 0 ? '+' : ''}{dailyChangePercent.toFixed(1)}% Today
      </p>
      <div className="flex items-center text-xs text-green-300/80 mt-1 mb-4">
        <ShieldCheckIcon className="w-3.5 h-3.5 mr-1.5 text-green-400" />
        <span>Your Keys, Your Crypto (Self-Custodial Control)</span>
      </div>


      { chartData.length > 0 && totalCryptoValue > 0 && (
        <div className="mb-5">
            <p className="text-gray-400 text-xs mb-1">Crypto Asset Distribution:</p>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-700">
            {chartData.map(asset => (
                <div 
                key={asset.symbol} 
                className={`h-full ${asset.color.replace('border-', 'bg-')}`} // Use bg- for actual bar color
                style={{ width: `${asset.percentage}%` }}
                title={`${asset.symbol}: ${asset.percentage.toFixed(1)}%`}
                ></div>
            ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {chartData.map(asset => (
                    <div key={asset.symbol} className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${asset.color.replace('border-', 'bg-')}`}></div>
                        <span className="text-gray-300 text-xs">{asset.symbol} ({asset.percentage.toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-sm">
        <button 
          onClick={() => onNavigate(ActiveTab.RECEIVE)}
          className="bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg py-3 px-2 flex flex-col items-center justify-center space-y-1 transition-colors"
          aria-label="Deposit crypto"
        >
          <Download className="w-5 h-5" />
          <span>Deposit</span>
        </button>
        <button 
          onClick={() => onNavigate(ActiveTab.SEND)}
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg py-3 px-2 flex flex-col items-center justify-center space-y-1 transition-colors"
          aria-label="Withdraw crypto"
        >
          <Upload className="w-5 h-5" />
          <span>Withdraw</span>
        </button>
        <button 
          // onClick={onSwap} // For future
          disabled // Placeholder
          className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg py-3 px-2 flex flex-col items-center justify-center space-y-1 transition-colors disabled:opacity-50 cursor-not-allowed"
          aria-label="Swap crypto (coming soon)"
        >
          <Repeat className="w-5 h-5" />
          <span>Swap</span>
        </button>
      </div>
    </div>
  );
};

export default PortfolioSummary;
