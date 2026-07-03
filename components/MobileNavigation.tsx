
import React from 'react';
import { Home, TrendingUp, Wallet, Activity, User, CreditCard } from 'lucide-react'; // Added CreditCard
import { ActiveTab } from '../types';

interface MobileNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const navItems = [
  { id: ActiveTab.HOME, icon: Home, label: 'Home' },
  { id: ActiveTab.TRADE, icon: TrendingUp, label: 'Trade' },
  { id: ActiveTab.WALLET, icon: Wallet, label: 'Wallet' },
  { id: ActiveTab.BILLS, icon: CreditCard, label: 'Bills' }, // New Bills tab
  { id: ActiveTab.HISTORY, icon: Activity, label: 'History' },
  // Profile moved to the end for 5-item layout if Bills is in middle, or keep 5 items and pick most important
];
// To keep 5 items, we might need to combine or make profile accessible differently,
// or decide which one of the 5 is most important. For now, adding it as a 6th:
const finalNavItems = navItems.slice(0, 4); // Home, Trade, Wallet, Bills
finalNavItems.push({ id: ActiveTab.HISTORY, icon: Activity, label: 'History' });
// Or, if we want to keep Profile:
// const finalNavItems = [
//   { id: ActiveTab.HOME, icon: Home, label: 'Home' },
//   { id: ActiveTab.TRADE, icon: TrendingUp, label: 'Trade' },
//   { id: ActiveTab.WALLET, icon: Wallet, label: 'Wallet' },
//   { id: ActiveTab.BILLS, icon: CreditCard, label: 'Bills' },
//   { id: ActiveTab.PROFILE, icon: User, label: 'Profile' },
// ];
// Let's go with 5 items, replacing History with Bills and keeping Profile.
// Users can access History from Home or Wallet views if needed (condensed history)

const fiveMostImportantNavItems = [
    { id: ActiveTab.HOME, icon: Home, label: 'Home' },
    { id: ActiveTab.TRADE, icon: TrendingUp, label: 'Trade' },
    { id: ActiveTab.WALLET, icon: Wallet, label: 'Wallet' },
    { id: ActiveTab.BILLS, icon: CreditCard, label: 'Bills' },
    { id: ActiveTab.PROFILE, icon: User, label: 'Profile' },
];


const MobileNavigation: React.FC<MobileNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-slate-700/50 z-30">
      <div className={`grid grid-cols-${fiveMostImportantNavItems.length} h-16`}>
        {fiveMostImportantNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-150 ${
              activeTab === item.id ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileNavigation;
