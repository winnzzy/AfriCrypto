
import React, { useState, useEffect, useCallback } from 'react';
import { BillCategory, Biller, BillerField, UserProfile, WalletData, FiatAsset } from '../types';
import { apiService } from '../services/apiService';
import { SUPPORTED_CRYPTO_SYMBOLS, AFRICAN_COUNTRIES_DATA } from '../constants';
import BillCategoryItem from './BillCategoryItem';
import BillerItem from './BillerItem';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { ArrowLeft, CheckCircle } from 'lucide-react';

type BillPaymentStep = 'selectCategory' | 'selectBiller' | 'enterDetails' | 'confirmPayment' | 'paymentSuccess';

interface BillPaymentsViewProps {
  userProfile: UserProfile | null;
  walletData: WalletData | null;
  onPaymentSuccess: (transaction: any) // Pass the successful transaction back
    => void; 
}

const BillPaymentsView: React.FC<BillPaymentsViewProps> = ({ userProfile, walletData, onPaymentSuccess }) => {
  const [currentStep, setCurrentStep] = useState<BillPaymentStep>('selectCategory');
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [billers, setBillers] = useState<Biller[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BillCategory | null>(null);
  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [paymentAssetSymbol, setPaymentAssetSymbol] = useState<string>(''); // e.g., 'NGN' or 'USDT'
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentAttemptKey, setPaymentAttemptKey] = useState<string | null>(null);

  const userCountry = userProfile?.country || 'Nigeria'; // Default for safety
  const userFiatCurrency = userProfile && AFRICAN_COUNTRIES_DATA[userProfile.country] ? AFRICAN_COUNTRIES_DATA[userProfile.country].currency : 'NGN';
  const userFiatSymbol = userProfile && AFRICAN_COUNTRIES_DATA[userProfile.country] ? AFRICAN_COUNTRIES_DATA[userProfile.country].symbol : '₦';


  // Fetch Categories
  useEffect(() => {
    if (currentStep === 'selectCategory' && userProfile) {
      setIsLoading(true);
      setError(null);
      apiService.fetchBillCategories(userProfile.country)
        .then(setCategories)
        .catch(() => setError("Could not load bill categories."))
        .finally(() => setIsLoading(false));
    }
  }, [currentStep, userProfile]);

  // Fetch Billers
  useEffect(() => {
    if (currentStep === 'selectBiller' && selectedCategory && userProfile) {
      setIsLoading(true);
      setError(null);
      apiService.fetchBillers(userProfile.country, selectedCategory.id)
        .then(setBillers)
        .catch(() => setError(`Could not load billers for ${selectedCategory.name}.`))
        .finally(() => setIsLoading(false));
    }
  }, [currentStep, selectedCategory, userProfile]);

  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setSelectedCategory(category || null);
    setCurrentStep('selectBiller');
    setBillers([]); // Clear previous billers
  };

  const handleBillerSelect = (billerId: string) => {
    const biller = billers.find(b => b.id === billerId);
    setSelectedBiller(biller || null);
    setFormData({}); // Reset form data
    // Set default payment asset if specified by biller, or user's fiat
    setPaymentAssetSymbol(biller?.paymentAssetSymbols[0] || userFiatCurrency);
    setCurrentStep('enterDetails');
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const validateDetails = (): boolean => {
    if (!selectedBiller) return false;
    for (const field of selectedBiller.fields) {
      if (field.required && !formData[field.id]?.trim()) {
        setError(`Please fill in ${field.label}.`);
        return false;
      }
      if (field.validationRegex && formData[field.id] && !new RegExp(field.validationRegex).test(formData[field.id])) {
          setError(`Invalid format for ${field.label}.`);
          return false;
      }
    }
    // Amount validation if amount is a field
    const amountField = selectedBiller.fields.find(f => f.id === 'amount');
    if (amountField && formData.amount) {
        const amountNum = parseFloat(formData.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError("Amount must be a positive number.");
            return false;
        }
        if (selectedBiller.minAmount && amountNum < selectedBiller.minAmount) {
            setError(`Amount must be at least ${userFiatSymbol}${selectedBiller.minAmount}.`);
            return false;
        }
        if (selectedBiller.maxAmount && amountNum > selectedBiller.maxAmount) {
            setError(`Amount must be no more than ${userFiatSymbol}${selectedBiller.maxAmount}.`);
            return false;
        }
    }
    setError(null);
    return true;
  };

  const handleDetailsSubmit = () => {
    if (validateDetails()) {
      setCurrentStep('confirmPayment');
    }
  };
  
  const getBillAmountFiat = (): number => {
    if (selectedBiller?.fixedAmount) return selectedBiller.fixedAmount;
    return parseFloat(formData.amount || '0');
  };


  const handlePaymentConfirm = async () => {
    if (!userProfile || !selectedBiller || !paymentAssetSymbol) return;
    setIsLoading(true);
    setError(null);

    const key = paymentAttemptKey || (globalThis.crypto?.randomUUID?.() ?? `bill-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    if (!paymentAttemptKey) setPaymentAttemptKey(key);

    try {
      const transaction = await apiService.payBill({
        billerId: selectedBiller.id,
        paymentAssetSymbol,
        details: formData,
        idempotencyKey: key,
      });
      onPaymentSuccess(transaction);
      setPaymentAttemptKey(null);
      setCurrentStep('paymentSuccess');
    } catch (err: any) {
      setError(err.message || "Payment failed. You can safely retry this payment.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep('selectCategory');
    setSelectedCategory(null);
    setSelectedBiller(null);
    setFormData({});
    setError(null);
    setPaymentAssetSymbol('');
    setPaymentAttemptKey(null);
  };
  
  const availablePaymentAssets = () => {
    if (!walletData || !selectedBiller) return [];
    const assets: { symbol: string, name: string, balance: string, isCrypto: boolean }[] = [];
    
    // Fiat option
    const fiat = walletData.fiat[userFiatCurrency];
    if (fiat && selectedBiller.paymentAssetSymbols.includes(userFiatCurrency)) {
        assets.push({ symbol: userFiatCurrency, name: `${userFiatCurrency} Wallet`, balance: `${userFiatSymbol}${parseFloat(fiat.balance.replace(/,/g, '')).toLocaleString()}`, isCrypto: false });
    }

    // Crypto options
    selectedBiller.paymentAssetSymbols.forEach(sym => {
        if (SUPPORTED_CRYPTO_SYMBOLS.includes(sym) && walletData.crypto[sym]) {
            const crypto = walletData.crypto[sym];
            assets.push({ symbol: sym, name: `${crypto.name} (${sym})`, balance: `${crypto.balance} ${sym}`, isCrypto: true });
        }
    });
    return assets;
  };


  if (!userProfile || !walletData) {
    return <LoadingSpinner text="Initializing bill payments..." />;
  }

  // Common Back Button
  const BackButton: React.FC<{ to: BillPaymentStep }> = ({ to }) => (
    <button onClick={() => setCurrentStep(to)} className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 text-sm mb-4">
      <ArrowLeft className="w-4 h-4" />
      <span>Back</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-2xl">Pay Bills</h2>
      
      {error && <ErrorMessage message={error} title="Error" />}

      {isLoading && <LoadingSpinner text="Loading..." />}

      {!isLoading && currentStep === 'selectCategory' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {categories.length > 0 ? categories.map(cat => (
            <BillCategoryItem key={cat.id} category={cat} onSelectCategory={handleCategorySelect} />
          )) : <p className="text-gray-400 col-span-full text-center">No bill categories available for {userCountry}.</p>}
        </div>
      )}

      {!isLoading && currentStep === 'selectBiller' && selectedCategory && (
        <div>
          <BackButton to="selectCategory" />
          <h3 className="text-white font-semibold text-lg mb-3">Select Biller for {selectedCategory.name}</h3>
          <div className="space-y-2">
            {billers.length > 0 ? billers.map(b => (
              <BillerItem key={b.id} biller={b} onSelectBiller={handleBillerSelect} />
            )) : <p className="text-gray-400 text-center">No billers found for {selectedCategory.name} in {userCountry}.</p>}
          </div>
        </div>
      )}

      {!isLoading && currentStep === 'enterDetails' && selectedBiller && (
        <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg border border-slate-700">
          <BackButton to="selectBiller" />
          <h3 className="text-white font-semibold text-lg mb-1">{selectedBiller.name}</h3>
          <p className="text-sm text-gray-400 mb-4">Enter payment details</p>
          <div className="space-y-4">
            {selectedBiller.fields.map(field => (
              <div key={field.id}>
                <label htmlFor={field.id} className="text-gray-300 text-sm mb-1 block">{field.label}{field.required && '*'}</label>
                {field.type === 'select' ? (
                  <select 
                    id={field.id} 
                    value={formData[field.id] || ''} 
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : (
                  <input 
                    id={field.id}
                    type={field.type}
                    value={formData[field.id] || ''}
                    onChange={e => handleInputChange(field.id, e.target.value)}
                    placeholder={field.placeholder || field.label}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500"
                    disabled={field.id === 'amount' && selectedBiller.fixedAmount !== undefined}
                  />
                )}
                 {field.id === 'amount' && selectedBiller.minAmount && selectedBiller.maxAmount && (
                    <p className="text-xs text-gray-500 mt-1">Min: {userFiatSymbol}{selectedBiller.minAmount}, Max: {userFiatSymbol}{selectedBiller.maxAmount}</p>
                 )}
              </div>
            ))}
            <button onClick={handleDetailsSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium">
              Proceed to Confirm
            </button>
          </div>
        </div>
      )}

      {!isLoading && currentStep === 'confirmPayment' && selectedBiller && (
         <div className="bg-slate-800/50 p-4 sm:p-6 rounded-lg border border-slate-700">
          <BackButton to="enterDetails" />
          <h3 className="text-white font-semibold text-lg mb-3">Confirm Payment</h3>
          <div className="space-y-3 text-sm mb-4">
            <p><span className="text-gray-400">Biller:</span> <span className="text-white">{selectedBiller.name}</span></p>
            {Object.entries(formData).map(([key, value]) => {
                const fieldLabel = selectedBiller.fields.find(f => f.id === key)?.label || key;
                return <p key={key}><span className="text-gray-400">{fieldLabel}:</span> <span className="text-white">{value}</span></p>;
            })}
             <p><span className="text-gray-400">Bill Amount:</span> <span className="text-white font-semibold">{userFiatSymbol}{getBillAmountFiat().toLocaleString()}</span></p>
          </div>

          <div>
            <label htmlFor="paymentAsset" className="text-gray-300 text-sm mb-1 block">Pay with:</label>
            <select 
              id="paymentAsset" 
              value={paymentAssetSymbol} 
              onChange={e => setPaymentAssetSymbol(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white mb-2 focus:ring-2 focus:ring-blue-500"
            >
              {availablePaymentAssets().map(opt => (
                  <option key={opt.symbol} value={opt.symbol}>{opt.name} (Bal: {opt.balance})</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mb-4">
              The final {paymentAssetSymbol} amount is calculated securely by AfriCrypto when you submit the payment.
            </p>
          </div>

          <button disabled={isLoading || !paymentAssetSymbol} onClick={handlePaymentConfirm} className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-lg font-medium">
            {isLoading ? 'Processing securely...' : 'Pay Now'}
          </button>
        </div>
      )}
      
      {currentStep === 'paymentSuccess' && selectedBiller && (
        <div className="text-center p-6 bg-slate-800/50 rounded-lg border border-slate-700">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Payment Successful!</h3>
            <p className="text-gray-300 mb-4">
                Your payment of {userFiatSymbol}{getBillAmountFiat().toLocaleString()} to {selectedBiller.name} has been processed.
            </p>
            <button onClick={resetFlow} className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg font-medium">
                Pay Another Bill
            </button>
        </div>
      )}

    </div>
  );
};

export default BillPaymentsView;
