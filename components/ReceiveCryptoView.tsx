
import React, { useState, useEffect, useCallback } from 'react';
import { QrCode, Copy, AlertTriangle, Share2 } from 'lucide-react';
import { ReceiveAddress } from '../types';
import { apiService } from '../services/apiService';
import { DEFAULT_USER_ID, SUPPORTED_CRYPTO_SYMBOLS } from '../constants';
import LoadingSpinner from './LoadingSpinner';

// Simple QR Code generator (SVG) - for demo purposes. A library like qrcode.react is better for production.
const generateSimpleQR = (data: string): React.ReactNode => {
    if (!data) return <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500 text-xs p-2">QR Error: No Data</div>;
    // This is a placeholder visual, not a functional QR code.
    return (
      <div className="w-full h-full p-2 bg-white flex items-center justify-center">
        <QrCode className="w-3/4 h-3/4 text-gray-800" /> 
      </div>
    );
  };
  

interface ReceiveCryptoViewProps {
  // Props if needed, e.g., pre-selected crypto
}

const ReceiveCryptoView: React.FC<ReceiveCryptoViewProps> = () => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>(SUPPORTED_CRYPTO_SYMBOLS[0]);
  const [receiveAddressData, setReceiveAddressData] = useState<ReceiveAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchAddress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const addressData = await apiService.getReceiveAddress(DEFAULT_USER_ID, selectedCrypto);
      setReceiveAddressData(addressData);
    } catch (err) {
      setError('Failed to fetch receiving address. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCrypto]);

  useEffect(() => {
    fetchAddress();
  }, [fetchAddress]);

  const handleCopyToClipboard = () => {
    if (receiveAddressData?.address) {
      navigator.clipboard.writeText(receiveAddressData.address)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(err => console.error('Failed to copy text: ', err));
    }
  };

  const handleShare = () => {
    if (navigator.share && receiveAddressData?.address) {
      navigator.share({
        title: `My ${selectedCrypto} Address`,
        text: `Here's my ${selectedCrypto} address: ${receiveAddressData.address}`,
      })
      .catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support navigator.share
      alert(`Share this ${selectedCrypto} address: ${receiveAddressData?.address}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-2xl">Receive Crypto</h2>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="receive-crypto-select" className="text-gray-400 text-sm mb-1 block">Select Cryptocurrency</label>
            <select 
              id="receive-crypto-select"
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SUPPORTED_CRYPTO_SYMBOLS.map(symbol => (
                <option key={symbol} value={symbol}>{symbol}</option>
              ))}
            </select>
          </div>
          
          {isLoading && <LoadingSpinner text={`Generating ${selectedCrypto} address...`} />}
          {error && <p className="text-red-400 text-center">{error}</p>}

          {!isLoading && !error && receiveAddressData && (
            <>
              <div className="text-center py-4">
                <div className="bg-white p-2 rounded-2xl inline-block mb-4 shadow-lg w-48 h-48 sm:w-56 sm:h-56">
                   {generateSimpleQR(receiveAddressData.qrCodeData)}
                </div>
                
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Your {receiveAddressData.cryptoSymbol} Address</p>
                  <div className="flex items-center justify-between space-x-2">
                    <span className="text-white font-mono text-xs sm:text-sm break-all">{receiveAddressData.address}</span>
                    <button 
                        onClick={handleCopyToClipboard} 
                        className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-slate-600 transition-colors"
                        aria-label="Copy address"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copied && <p className="text-green-400 text-xs mt-1">Copied to clipboard!</p>}
                </div>
              </div>

              <button 
                onClick={handleShare}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
                >
                <Share2 className="w-4 h-4" />
                <span>Share Address</span>
              </button>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
                <div className="flex space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium text-sm">Important</p>
                    <p className="text-yellow-200 text-xs">Only send {receiveAddressData.cryptoSymbol} to this address. Sending other cryptocurrencies may result in permanent loss.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiveCryptoView;
