import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Check, AlertCircle, Fingerprint, Smartphone, ShieldOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const SecuritySettings: React.FC = () => {
  const { settings, enableAppLock, disableAppLock, isBiometricSupported } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleEnableAppLock = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      await enableAppLock();
    } catch (error) {
      console.error("Error enabling app lock:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableAppLock = () => {
    if (window.confirm('Warning: Disabling app lock will remove security protection. Continue?')) {
      disableAppLock();
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0F] p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
              <Shield size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Security Settings</h1>
          </div>
          <p className="text-white/50 text-sm">Protect your app with device authentication</p>
        </div>

        {/* App Lock Settings */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                settings.isBiometricEnabled ? 'bg-green-500/20' : 'bg-white/10'
              }`}>
                <Fingerprint size={24} className={settings.isBiometricEnabled ? 'text-green-400' : 'text-white/50'} />
              </div>
              <div>
                <h3 className="text-white font-semibold">App Lock</h3>
                <p className="text-white/50 text-sm">
                  {settings.isBiometricEnabled 
                    ? 'Protected with device authentication' 
                    : 'Not enabled'}
                </p>
              </div>
            </div>
            {settings.isBiometricEnabled && (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full">
                <Check size={16} />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Fingerprint size={20} className="text-blue-400" />
              <span className="text-white/80 text-sm">Fingerprint authentication</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Smartphone size={20} className="text-purple-400" />
              <span className="text-white/80 text-sm">Face ID / Device PIN / Pattern</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
              <Lock size={20} className="text-orange-400" />
              <span className="text-white/80 text-sm">Auto-lock after 30 minutes of inactivity</span>
            </div>
          </div>

          {settings.isBiometricEnabled ? (
            // Disable button when enabled
            <button
              onClick={handleDisableAppLock}
              className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 font-medium transition-all flex items-center justify-center gap-2"
            >
              <ShieldOff size={18} />
              Disable App Lock
            </button>
          ) : isBiometricSupported ? (
            // Enable button when supported
            <button
              onClick={handleEnableAppLock}
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Enable App Lock
                </>
              )}
            </button>
          ) : (
            // Not supported message
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-200 text-sm font-medium mb-1">
                  Device authentication not available
                </p>
                <p className="text-yellow-200/70 text-xs">
                  Your browser or device doesn't support biometric authentication. 
                  Try using Chrome or Edge on a device with fingerprint or face recognition.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <Shield size={18} />
            How It Works
          </h3>
          <ul className="space-y-3 text-blue-200 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Uses your device's built-in security (fingerprint, face, or device PIN)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>No separate PIN to remember - uses what you already have set up on your phone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>App automatically locks after 30 minutes of inactivity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Your biometric data never leaves your device - it's processed locally</span>
            </li>
          </ul>
        </div>

        {/* Additional Info */}
        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-white/40 text-xs text-center">
            App lock uses the Web Authentication API (WebAuthn) which is supported on most modern browsers and devices.
          </p>
        </div>
      </div>
    </div>
  );
};
