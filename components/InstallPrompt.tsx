
import React from 'react';
import { Smartphone, Download } from 'lucide-react';

interface InstallPromptProps {
  onInstall: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onInstall }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 mx-0 sm:mx-4 my-4 rounded-xl flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <Smartphone className="w-8 h-8 text-white flex-shrink-0" />
        <div>
          <p className="text-white font-medium">Install AfriCrypto App</p>
          <p className="text-blue-100 text-sm">Get the full mobile experience.</p>
        </div>
      </div>
      <button 
        onClick={onInstall}
        className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium text-sm flex items-center space-x-1.5 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span>Install</span>
      </button>
    </div>
  );
};

export default InstallPrompt;
