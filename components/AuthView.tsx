
import React, { useState } from 'react';
import { Lock, Mail, MapPin, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';
import { AFRICAN_COUNTRIES_DATA } from '../constants';
import { apiService } from '../services/apiService';
import LoadingSpinner from './LoadingSpinner';

interface AuthViewProps {
  onAuthenticated: (profile: UserProfile) => void;
}

type Mode = 'login' | 'signup';

const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState<string>(Object.keys(AFRICAN_COUNTRIES_DATA)[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const profile = mode === 'login'
        ? await apiService.login(email, password)
        : await apiService.signup(email, password, country);
      onAuthenticated(profile);
    } catch (err: any) {
      setError(err.message || `Failed to ${mode === 'login' ? 'log in' : 'sign up'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-3">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <h1 className="text-white font-bold text-2xl">AfriCrypto</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-xl">
          <div className="flex bg-slate-700/50 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'login' ? 'bg-blue-500 text-white' : 'text-gray-300'
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === 'signup' ? 'bg-blue-500 text-white' : 'text-gray-300'
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="space-y-3 mb-5">
            <button type="button" disabled className="w-full bg-white text-slate-900 py-3 rounded-xl font-medium flex items-center justify-center gap-3 disabled:opacity-90">
              <span className="font-bold text-lg">G</span><span>Continue with Google</span>
            </button>
            <button type="button" disabled className="w-full bg-black border border-slate-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-3 disabled:opacity-90">
              <span className="text-xl">●</span><span>Continue with Apple</span>
            </button>
            <button type="button" disabled className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-3 disabled:opacity-90">
              <span className="font-bold text-lg">f</span><span>Continue with Facebook</span>
            </button>
            <p className="text-center text-xs text-gray-500">Social sign-in is being connected securely. Email access remains available below.</p>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-slate-700 flex-1" />
            <span className="text-xs uppercase tracking-wider text-gray-500">or continue with email</span>
            <div className="h-px bg-slate-700 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="text-gray-400 text-sm mb-1 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="text-gray-400 text-sm mb-1 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-country" className="text-gray-400 text-sm mb-1 block">Country</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="auth-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-3 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    {Object.entries(AFRICAN_COUNTRIES_DATA).map(([name, info]) => (
                      <option key={name} value={name}>{info.flag} {name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-1">Determines your default currency and payment methods.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-white py-3.5 rounded-xl font-medium text-lg flex items-center justify-center space-x-2 transition-opacity disabled:opacity-60"
            >
              {isSubmitting
                ? <LoadingSpinner size="sm" color="text-white" />
                : <span>{mode === 'login' ? 'Log in' : 'Create account'}</span>}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => switchMode('signup')} className="text-blue-400 hover:underline">Sign up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => switchMode('login')} className="text-blue-400 hover:underline">Log in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthView;
