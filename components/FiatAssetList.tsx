
import React from 'react';
import { FiatAsset, AfricanCountriesData } from '../types';
import { Landmark, PlusCircle, MinusCircle } from 'lucide-react'; // PlusCircle for Add Funds, MinusCircle for Withdraw

interface FiatAssetListProps {
  fiatAssets: Record<string, FiatAsset> | null;
  africanCountriesData: AfricanCountriesData;
}

const FiatAssetList: React.FC<FiatAssetListProps> = ({ fiatAssets, africanCountriesData }) => {
  if (!fiatAssets || Object.keys(fiatAssets).length === 0) {
    return (
      <div className="my-6">
        <h3 className="text-white font-semibold text-lg mb-3">Fiat Balances</h3>
        <p className="text-gray-500 text-sm text-center py-3 bg-slate-800/40 rounded-lg">No fiat balances found.</p>
      </div>
    );
  }

  const getCountryFlag = (currencyCode: string): string => {
    const country = Object.values(africanCountriesData).find(c => c.currency === currencyCode);
    return country ? country.flag : '🏳️';
  };

  return (
    <div className="my-6">
      <h3 className="text-white font-semibold text-lg mb-3">Fiat Balances</h3>
      <div className="space-y-3">
        {Object.entries(fiatAssets).map(([currencyCode, asset]) => (
          <div key={currencyCode} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getCountryFlag(currencyCode)}</span>
                <div>
                  <p className="text-white font-medium">{currencyCode}</p>
                  <p className="text-gray-400 text-sm">Local Currency</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white text-xl font-semibold">{asset.symbol}{asset.balance}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <button disabled className="bg-green-500/20 text-green-300 hover:bg-green-500/30 rounded-md py-2 px-3 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-60 cursor-not-allowed">
                    <PlusCircle className="w-4 h-4"/>
                    <span>Add Funds</span>
                </button>
                <button disabled className="bg-red-500/20 text-red-300 hover:bg-red-500/30 rounded-md py-2 px-3 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-60 cursor-not-allowed">
                    <MinusCircle className="w-4 h-4"/>
                    <span>Withdraw</span>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FiatAssetList;
