
import React from 'react';
import { Biller } from '../types';
import { ChevronRight, Landmark } from 'lucide-react'; // Landmark as default logo

interface BillerItemProps {
  biller: Biller;
  onSelectBiller: (billerId: string) => void;
}

const BillerItem: React.FC<BillerItemProps> = ({ biller, onSelectBiller }) => {
  return (
    <button
      onClick={() => onSelectBiller(biller.id)}
      className="w-full bg-slate-800/50 hover:bg-slate-700/70 border border-slate-700 rounded-lg p-4 flex items-center justify-between transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label={`Select biller: ${biller.name}`}
    >
      <div className="flex items-center space-x-3">
        {biller.logoUrl ? (
          <img src={biller.logoUrl} alt={`${biller.name} logo`} className="w-8 h-8 rounded-md object-contain bg-white p-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <span className="text-white text-sm">{biller.name}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-500" />
    </button>
  );
};

export default BillerItem;
