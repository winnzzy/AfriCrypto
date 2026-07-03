
import React from 'react';
import { CryptoAsset } from '../types';
import CryptoListItem from './CryptoListItem';

interface CryptoListProps {
  assets: Record<string, CryptoAsset> | null;
  onSelectAsset: (symbol: string) => void; // For future detailed view
  onAnalyzeAsset: (symbol: string) => void; // For market analysis
}

const CryptoList: React.FC<CryptoListProps> = ({ assets, onSelectAsset, onAnalyzeAsset }) => {
  if (!assets) {
    return (
      <div className="space-y-3">
        <h3 className="text-white font-semibold text-lg mb-4">Your Assets</h3>
        {[1,2,3].map(i => (
          <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 h-20 animate-pulse"></div>
        ))}
      </div>
    );
  }
  
  const assetArray = Object.values(assets);

  if (assetArray.length === 0) {
    return (
      <div>
        <h3 className="text-white font-semibold text-lg mb-4">Your Assets</h3>
        <p className="text-gray-400 text-center py-4">No crypto assets yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-white font-semibold text-lg mb-4">Your Assets</h3>
      {assetArray.map((asset) => (
        <CryptoListItem 
          key={asset.symbol} 
          asset={asset} 
          onSelect={onSelectAsset}
          onAnalyze={onAnalyzeAsset}
        />
      ))}
    </div>
  );
};

export default CryptoList;
