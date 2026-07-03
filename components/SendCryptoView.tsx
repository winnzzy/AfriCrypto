
import React, { useState } from 'react';
import { QrCode, Send as SendIcon, AlertTriangle } from 'lucide-react';
import { WalletData, CryptoAsset } from '../types';
import { SUPPORTED_CRYPTO_SYMBOLS } from '../constants';
import LoadingSpinner from './LoadingSpinner';

interface SendCryptoViewProps {
  walletData: WalletData | null;
  onSend: (cryptoSymbol: string, recipientAddress: string, amount: string) => Promise<void>;
  onShowQRScanner: () => void; // For scanning recipient address
}

const SendCryptoView: React.FC<SendCryptoViewProps> = ({ walletData, onSend, onShowQRScanner }) => {
  const [selectedCrypto, setSelectedCrypto] = useState<string>(SUPPORTED_CRYPTO_SYMBOLS[0]);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableAsset = walletData?.crypto[selectedCrypto];

  const handleSend = async () => {
    if (!availableAsset || !recipientAddress || !amount) {
      setError("Please fill all fields and select a valid asset.");
      return;
    }
    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }
    // Basic address validation (very simple)
    if (recipientAddress.length < 20) {
        setError("Invalid recipient address format.");
        return;
    }

    setIsSending(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await onSend(selectedCrypto, recipientAddress, amount);
      setSuccessMessage(`Successfully sent ${amount} ${selectedCrypto}!`);
      setRecipientAddress('');
      setAmount('');
    } catch (err: any) {
      setError(err.message || "Failed to send crypto. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-2xl">Send Crypto</h2>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="send-crypto-select" className="text-gray-400 text-sm mb-1 block">Cryptocurrency</label>
            <select 
              id="send-crypto-select"
              value={selectedCrypto}
              onChange={(e) => setSelectedCrypto(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {SUPPORTED_CRYPTO_SYMBOLS.map(symbol => (
                <option key={symbol} value={symbol}>{walletData?.crypto[symbol]?.name || symbol} ({symbol})</option>
              ))}
            </select>
            {availableAsset && <p className="text-xs text-gray-400 mt-1">Available: {availableAsset.balance} {availableAsset.symbol}</p>}
          </div>
          
          <div>
            <label htmlFor="recipient-address" className="text-gray-400 text-sm mb-1 block">Recipient Address</label>
            <div className="flex space-x-2">
              <input 
                id="recipient-address"
                type="text" 
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button 
                onClick={onShowQRScanner}
                className="bg-blue-500 hover:bg-blue-600 p-3 rounded-lg transition-colors"
                aria-label="Scan QR code for address"
              >
                <QrCode className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="send-amount" className="text-gray-400 text-sm mb-1 block">Amount</label>
            <div className="relative">
              <input 
                id="send-amount"
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-3 pr-12 py-3 text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{selectedCrypto}</span>
            </div>
          </div>
          
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Network Fee</label>
            <div className="bg-slate-700/70 rounded-lg p-3 flex justify-between text-sm">
              <span className="text-gray-300">Estimated fee:</span>
              <span className="text-white">~0.00005 {selectedCrypto}</span> {/* Mock fee */}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-500/10 text-green-400 text-sm p-3 rounded-lg">
              {successMessage}
            </div>
          )}
          
          <button 
            onClick={handleSend}
            disabled={isSending || !availableAsset}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white py-3.5 rounded-xl font-medium text-lg flex items-center justify-center space-x-2 transition-opacity disabled:opacity-60"
          >
            {isSending ? <LoadingSpinner size="sm" color="text-white" /> : <SendIcon className="w-5 h-5" />}
            <span>{isSending ? 'Sending...' : 'Send Crypto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendCryptoView;
