
import React from 'react';
import { UserProfile, AfricanCountriesData, AfricanCountryInfo } from '../types';
import { User as UserIcon, MapPin, Shield, Bell, Settings, ArrowRight, Star, LogOut } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface ProfileViewProps {
  userProfile: UserProfile | null;
  africanCountries: AfricanCountriesData;
  onUpdateCountry: (country: string) => void;
  onToggleNotifications: (enabled: boolean) => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ userProfile, africanCountries, onUpdateCountry, onToggleNotifications, onLogout }) => {
  if (!userProfile) {
    return <LoadingSpinner text="Loading profile..." />;
  }

  const currentCountryInfo = africanCountries[userProfile.country];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
            {userProfile.avatarInitial || <UserIcon className="w-8 h-8" />}
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">{userProfile.username}</h3>
            <p className="text-gray-400 text-sm">{userProfile.isVerified ? 'Verified Trader' : 'User'}</p>
            {userProfile.isVerified && (
              <div className="flex items-center mt-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-500/50" />
                <span className="text-white ml-1 text-sm">{userProfile.p2pRating.toFixed(1)}</span>
                <span className="text-gray-400 ml-2 text-xs">({userProfile.p2pTrades} trades)</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span className="text-white text-sm">Location</span>
            </div>
            <select 
              value={userProfile.country}
              onChange={(e) => onUpdateCountry(e.target.value)}
              className="bg-slate-600 border border-slate-500 rounded px-3 py-1 text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              {Object.entries(africanCountries).map(([name, info]) => (
                <option key={name} value={name}>
                  {info.flag} {name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-white text-sm">Verification Status</span>
            </div>
            <span className={`text-sm ${userProfile.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
              {userProfile.isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          
          <button 
            onClick={() => onToggleNotifications(!userProfile.notificationsEnabled)}
            className="w-full flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-purple-400" />
              <span className="text-white text-sm">Notifications</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white text-sm">{userProfile.notificationsEnabled ? 'On' : 'Off'}</span>
              <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${userProfile.notificationsEnabled ? 'bg-green-500' : 'bg-gray-500'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${userProfile.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </div>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-colors">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-400" />
              <span className="text-white text-sm">More Settings</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">Log out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
