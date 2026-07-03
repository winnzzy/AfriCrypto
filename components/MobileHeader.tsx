
import React from 'react';
import { Bell, MapPin } from 'lucide-react';
import { AfricanCountryInfo } from '../types';

interface MobileHeaderProps {
  userCountryInfo: AfricanCountryInfo | undefined;
  notificationCount: number;
  isOnline: boolean;
  appName?: string;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ userCountryInfo, notificationCount, isOnline, appName = "AfriCrypto" }) => {
  return (
    <div className="bg-slate-900 sticky top-0 z-40 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">{appName.charAt(0)}</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg">{appName}</h1>
          {!isOnline && <span className="text-red-400 text-xs animate-pulse">Offline Mode</span>}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {userCountryInfo && (
          <div className="flex items-center space-x-1 bg-slate-700 rounded-full px-2 py-1">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="text-white text-xs">{userCountryInfo.flag}</span>
          </div>
        )}
        
        <button className="relative p-2 text-gray-300 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;
