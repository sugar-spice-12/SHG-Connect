import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const SecuritySettings: React.FC = () => {
  const { settings, setupSecurity } = useAuth();
  const [showChangePIN, setShowChangePIN] = useState(false);
  const [currentPIN, setCurrentPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');

  // Change PIN
  const handleChangePIN = () => {
    if (currentPIN !== settings.pin) {
      toast.error('Current PIN is incorrect');
      return;
    }

    if (newPIN.length < 4) {
      toast.error('New PIN must be at least 4 digits');
      return;
    }

    if (newPIN !== confirmPIN) {
      toast.error('PINs do not match');
      return;
    }

    setupSecurity(newPIN, false);
    setShowChangePIN(false);
    setCurrentPIN('');
    setNewPIN('');
    setConfirmPIN('');
    toast.success('PIN changed successfully');
  };

  // Disable PIN
  const handleDisablePIN = () => {
    if (window.confirm('Warning: Disabling PIN will remove all security. Continue?')) {
      setupSecurity('', false);
      toast.success('Security disabled');
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
          <p className="text-white/50 text-sm">Manage your app security and PIN</p>
        </div>

        {/* PIN Settings */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-blue-400" />
              <div>
                <h3 className="text-white font-semibold">PIN Security</h3>
                <p className="text-white/50 text-sm">
                  {settings.isPinEnabled ? `PIN is enabled (${settings.pin?.length || 4} digits)` : 'No PIN set'}
                </p>
              </div>
            </div>
            {settings.isPinEnabled && (
              <div className="flex items-center gap-2 text-green-400">
                <Check size={20} />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>

          {settings.isPinEnabled && (
            <div className="space-y-2">
              <button
                onClick={() => setShowChangePIN(!showChangePIN)}
                className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all"
              >
                Change PIN
              </button>
              <button
                onClick={handleDisablePIN}
                className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 font-medium transition-all"
              >
                Disable PIN
              </button>
            </div>
          )}

          {!settings.isPinEnabled && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-200 text-sm">
                No PIN is set. Your app is not protected. Set up a PIN in the onboarding screen or contact support.
              </p>
            </div>
          )}

          {/* Change PIN Form */}
          {showChangePIN && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 space-y-3 pt-4 border-t border-white/10"
            >
              <input
                type="password"
                inputMode="numeric"
                placeholder="Current PIN"
                value={currentPIN}
                onChange={(e) => setCurrentPIN(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-blue-500 outline-none"
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder="New PIN (4-6 digits)"
                value={newPIN}
                onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-blue-500 outline-none"
              />
              <input
                type="password"
                inputMode="numeric"
                placeholder="Confirm New PIN"
                value={confirmPIN}
                onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:border-blue-500 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleChangePIN}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-medium hover:scale-105 active:scale-95 transition-all"
                >
                  Save New PIN
                </button>
                <button
                  onClick={() => {
                    setShowChangePIN(false);
                    setCurrentPIN('');
                    setNewPIN('');
                    setConfirmPIN('');
                  }}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
            <Shield size={18} />
            Security Tips
          </h3>
          <ul className="space-y-2 text-blue-200 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Use a strong PIN that's difficult to guess (avoid 1234, 0000, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Don't share your PIN with anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Change your PIN regularly for better security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>If you forget your PIN, you'll need to log in again with OTP</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};