
import React from 'react';
import { ChevronRight, Zap } from 'lucide-react'; // Zap for insights/analysis
import { CryptoAsset } from '../types';

interface CryptoListItemProps {
  asset: CryptoAsset;
  onSelect: (symbol: string) => void;
  onAnalyze: (symbol: string) => void;
}

const CryptoListItem: React.FC<CryptoListItemProps> = ({ asset, onSelect, onAnalyze }) => {
  return (
    <div 
      className="bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700 rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-150"
      onClick={() => onSelect(asset.symbol)}
    >
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${asset.colorClass} shadow-md`}>
          <span className="text-white font-bold text-lg">{asset.logoChar}</span>
        </div>
        <div>
          <div className="text-white font-medium">{asset.name} ({asset.symbol})</div>
          <div className="text-gray-400 text-sm">{asset.balance} {asset.symbol}</div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <div className="text-white font-medium">${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={`text-sm ${asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(1)}%
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onAnalyze(asset.symbol); }} 
          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-slate-700 rounded-full transition-colors" 
          aria-label={`Analyze ${asset.name}`}
        >
          <Zap className="w-5 h-5" />
        </button>
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </div>
    </div>
  );
};

export default CryptoListItem;
