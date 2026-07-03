
import React from 'react';
import { MarketHighlightItem } from '../types';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface MarketHighlightsProps {
  highlights: MarketHighlightItem[];
  onAnalyze: (symbol: string) => void;
}

const MarketHighlights: React.FC<MarketHighlightsProps> = ({ highlights, onAnalyze }) => {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  return (
    <div className="my-6">
      <h3 className="text-white font-semibold text-lg mb-3">Market Highlights</h3>
      <div className="flex overflow-x-auto space-x-3 pb-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
        {highlights.map(item => (
          <div 
            key={item.id} 
            className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 min-w-[160px] flex-shrink-0 cursor-pointer hover:bg-slate-700/80 transition-all duration-150"
            onClick={() => onAnalyze(item.symbol)}
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.colorClass} shadow-md`}>
                <span className="text-white font-bold text-md">{item.logoChar}</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{item.symbol}</p>
                <p className="text-gray-400 text-xs truncate max-w-[80px]">{item.name}</p>
              </div>
            </div>
            <p className="text-white text-lg font-semibold">${item.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <div className={`flex items-center text-xs ${item.change24hPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {item.change24hPercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {item.change24hPercent.toFixed(1)}%
            </div>
             <button 
                onClick={(e) => { e.stopPropagation(); onAnalyze(item.symbol); }} 
                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center"
                aria-label={`Analyze ${item.name}`}
            >
                <Zap className="w-3 h-3 mr-1" /> Analyze
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketHighlights;
