
import React from 'react';
import { ShoppingCart, Repeat, Users, QrCode } from 'lucide-react'; // ShoppingCart for Buy, Repeat for Sell/Swap
import { ActiveTab } from '../types';

interface QuickActionsGridProps {
  onNavigate: (tab: ActiveTab) => void;
  onShowQRScanner: () => void;
}

const actions = [
  { id: 'buy_crypto', label: 'Buy Crypto', icon: ShoppingCart, tab: ActiveTab.TRADE, specialAction: false }, // Assuming P2P is main trade, can link to specific buy flow later
  { id: 'p2p_trade', label: 'P2P Trade', icon: Users, tab: ActiveTab.TRADE, specialAction: false },
  { id: 'scan_qr', label: 'Scan QR', icon: QrCode, tab: null, specialAction: true }, // Special action
];

const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onNavigate, onShowQRScanner }) => {
  return (
    <div className="my-6">
      <h3 className="text-white font-semibold text-lg mb-3">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => {
              if (action.specialAction && action.id === 'scan_qr') {
                onShowQRScanner();
              } else if (action.tab) {
                onNavigate(action.tab);
              }
            }}
            className="bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center space-y-2 aspect-square transition-all duration-150 shadow-md hover:shadow-lg"
          >
            <action.icon className="w-7 h-7 text-blue-400" />
            <span className="text-white text-xs text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsGrid;
