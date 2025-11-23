import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const AppLock: React.FC = () => {
  const { unlockApp, settings } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle PIN input
  const handleNumberClick = (num: string) => {
    if (isProcessing || pin.length >= 6) return;

    const newPin = pin + num;
    setPin(newPin);
    setError(false);
    setShake(false);

    // Auto-verify when PIN length matches stored PIN length (minimum 4 digits)
    const expectedLength = settings.pin?.length || 4;
    if (newPin.length >= 4 && newPin.length === expectedLength) {
      setTimeout(() => {
        verifyPin(newPin);
      }, 200);
    }
  };

  // Verify PIN
  const verifyPin = (pinToVerify: string) => {
    setIsProcessing(true);
    
    if (unlockApp(pinToVerify)) {
      toast.success('App unlocked!');
    } else {
      setPin('');
      setError(true);
      setShake(true);
      toast.error('Incorrect PIN');
      
      setTimeout(() => setShake(false), 500);
      setIsProcessing(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (isProcessing) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
    setShake(false);
  };

  // Biometric authentication - MANUAL TRIGGER ONLY
  const handleBiometric = async () => {
    if (!settings.isBiometricEnabled) {
      toast.error('Biometric authentication is not enabled');
      return;
    }

    setIsProcessing(true);

    try {
      // Show fingerprint prompt
      const loadingToast = toast.loading('Place your finger on the sensor...', { duration: 5000 });

      // Simulate fingerprint scanning (replace with actual implementation)
      const success = await new Promise<boolean>((resolve) => {
        setTimeout(() => {
          // 85% success rate for demo
          resolve(Math.random() > 0.15);
        }, 2000);
      });

      toast.dismiss(loadingToast);

      if (success) {
        // Unlock using the stored PIN
        if (unlockApp(settings.pin || '')) {
          toast.success('Unlocked with fingerprint!');
        }
      } else {
        toast.error('Fingerprint not recognized. Please try again or use PIN.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Biometric error:', error);
      toast.error('Biometric authentication failed. Please use PIN.');
      setIsProcessing(false);
    }
  };

  const pinLength = settings.pin?.length || 4;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-[#0D0D0F] flex flex-col items-center justify-center p-6"
    >
      {/* Background gradient */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Lock Icon */}
        <motion.div 
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl mb-6">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">App Locked</h2>
          <p className="text-white/50 text-sm">Enter your PIN to unlock</p>
        </motion.div>

        {/* PIN Dots */}
        <motion.div 
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex gap-4 mb-12"
        >
          {Array.from({ length: pinLength }).map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                i < pin.length 
                  ? error 
                    ? 'bg-red-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.5)]' 
                    : 'bg-blue-500 scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                  : 'bg-white/10'
              }`} 
            />
          ))}
        </motion.div>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm mb-4"
          >
            Incorrect PIN. Try again.
          </motion.p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              disabled={isProcessing}
              className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 active:scale-95 transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {num}
            </button>
          ))}
          
          {/* Biometric button - MANUAL ONLY */}
          <div className="flex items-center justify-center">
            {settings.isBiometricEnabled ? (
              <button 
                onClick={handleBiometric}
                disabled={isProcessing}
                className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Fingerprint size={32} />
              </button>
            ) : (
              <div className="w-20 h-20" /> // Empty space if biometric disabled
            )}
          </div>

          {/* Zero button */}
          <button
            onClick={() => handleNumberClick('0')}
            disabled={isProcessing}
            className="w-20 h-20 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 active:scale-95 transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            0
          </button>

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="w-20 h-20 flex items-center justify-center text-white/50 hover:text-white active:scale-95 transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Delete size={28} />
          </button>
        </div>

        {/* Help text */}
        {settings.isBiometricEnabled && (
          <p className="mt-8 text-white/40 text-xs text-center">
            Tap the fingerprint icon to authenticate
          </p>
        )}
      </div>
    </motion.div>
  );
};