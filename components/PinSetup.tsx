
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const PinSetup: React.FC = () => {
  const { setupSecurity } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleNumberClick = (num: string) => {
    const currentVal = step === 'enter' ? pin : confirmPin;
    const setter = step === 'enter' ? setPin : setConfirmPin;
    
    if (currentVal.length < 4) {
        const newVal = currentVal + num;
        setter(newVal);
        
        if (newVal.length === 4) {
            if (step === 'enter') {
                setTimeout(() => setStep('confirm'), 300);
            } else {
                // Final validation
                if (pin === newVal) {
                    setTimeout(() => {
                        setupSecurity(pin, true); // Enable biometric by default for UX
                        toast.success("Security Set Up Successfully");
                    }, 300);
                } else {
                    toast.error("PINs do not match. Try again.");
                    setTimeout(() => {
                        setPin('');
                        setConfirmPin('');
                        setStep('enter');
                    }, 1000);
                }
            }
        }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D0F] flex flex-col items-center justify-center p-6">
        <div className="mb-10 text-center">
            <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                <Lock size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
                {step === 'enter' ? 'Set 4-Digit PIN' : 'Confirm PIN'}
            </h2>
            <p className="text-white/50 text-sm">
                {step === 'enter' ? 'Create a secure PIN for quick login' : 'Re-enter your PIN to confirm'}
            </p>
        </div>

        {/* Dots */}
        <div className="flex gap-4 mb-12">
            {[0, 1, 2, 3].map((i) => (
                <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        i < (step === 'enter' ? pin.length : confirmPin.length)
                            ? 'bg-blue-500 scale-110' 
                            : 'bg-white/10'
                    }`} 
                />
            ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                <button
                    key={num}
                    onClick={() => handleNumberClick(num.toString())}
                    className={`w-20 h-20 rounded-full glass-panel flex items-center justify-center text-2xl font-bold text-white active:bg-white/20 transition-colors mx-auto ${num === 0 ? 'col-start-2' : ''}`}
                >
                    {num}
                </button>
            ))}
        </div>
    </div>
  );
};
