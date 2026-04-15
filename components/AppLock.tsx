import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Fingerprint, Smartphone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const AppLock: React.FC = () => {
  const { unlockWithBiometric, settings, isBiometricSupported } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Auto-trigger biometric on mount
  useEffect(() => {
    if (settings.isBiometricEnabled && isBiometricSupported) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleUnlock();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleUnlock = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setError('');

    try {
      const success = await unlockWithBiometric();
      if (!success) {
        setError('Authentication failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Unlock error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#0D0D0F] flex flex-col items-center justify-center p-6"
    >
      {/* Background gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Lock Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl mb-6">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">SHG Connect</h2>
          <p className="text-white/50 text-sm text-center">
            Authenticate to access your account
          </p>
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl w-full"
          >
            <p className="text-red-400 text-sm text-center">{error}</p>
          </motion.div>
        )}

        {/* Main Unlock Button */}
        <motion.button
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleUnlock}
          disabled={isProcessing}
          className={`w-full max-w-xs p-6 rounded-3xl flex flex-col items-center gap-4 transition-all ${
            isProcessing 
              ? 'bg-blue-600/20 border-blue-500/30' 
              : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'
          } border backdrop-blur-xl`}
        >
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isProcessing 
              ? 'bg-blue-500 animate-pulse' 
              : 'bg-gradient-to-tr from-blue-500 to-purple-500'
          }`}>
            {isProcessing ? (
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Fingerprint size={36} className="text-white" />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-white font-bold text-lg mb-1">
              {isProcessing ? 'Authenticating...' : 'Tap to Unlock'}
            </p>
            <p className="text-white/50 text-xs">
              Use fingerprint, face, or device PIN
            </p>
          </div>
        </motion.button>

        {/* Device info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex items-center gap-2 text-white/30"
        >
          <Smartphone size={14} />
          <p className="text-xs">
            Uses your device's built-in security
          </p>
        </motion.div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-white/20 text-xs text-center max-w-xs"
        >
          Your device will prompt for fingerprint, face recognition, or PIN based on your device settings
        </motion.p>
      </div>
    </motion.div>
  );
};
