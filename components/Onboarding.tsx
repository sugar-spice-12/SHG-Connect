// src/components/Onboarding.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Shield, Users, Zap, Fingerprint, Smartphone, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const slides = [
    {
        id: 1,
        icon: Users,
        title: "Empower Your Group",
        desc: "Manage savings, loans, and meetings for your Self-Help Group in one place. Simple, transparent, and secure."
    },
    {
        id: 2,
        icon: Zap,
        title: "Works Offline",
        desc: "No internet? No problem. Record transactions anytime, anywhere. We sync automatically when you're online."
    },
    {
        id: 3,
        icon: Shield,
        title: "Bank-Grade Security",
        desc: "Your financial data is encrypted and protected with your device's fingerprint, face, or PIN lock."
    }
];

export const Onboarding: React.FC = () => {
  const { completeOnboarding, enableAppLock, isBiometricSupported } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSecuritySetup, setShowSecuritySetup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [securityEnabled, setSecurityEnabled] = useState(false);

  const nextSlide = async () => {
    if (isProcessing) return;
    
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(c => c + 1);
    } else {
      // Last slide - complete onboarding and show security setup
      setIsProcessing(true);
      try {
        await completeOnboarding();
        setShowSecuritySetup(true);
      } catch (error) {
        console.error("Error completing onboarding:", error);
        toast.error("Failed to complete onboarding");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleEnableSecurity = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const success = await enableAppLock();
      if (success) {
        setSecurityEnabled(true);
        // Auto-close after success
        setTimeout(() => {
          setShowSecuritySetup(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error enabling security:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipSecurity = () => {
    setShowSecuritySetup(false);
    toast("You can enable app lock later in Settings", { icon: "💡" });
  };

  const Icon = slides[currentSlide].icon;

  // Security Setup Screen
  if (showSecuritySetup) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0D0D0F] flex flex-col items-center justify-center p-6">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]" />
        
        <div className="w-full max-w-md flex-1 flex flex-col justify-center relative z-10">
          {securityEnabled ? (
            // Success State
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-6">
                <Check size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">All Set!</h2>
              <p className="text-white/60">Your app is now protected with device security.</p>
            </motion.div>
          ) : (
            // Setup State
            <>
              <div className="text-center mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl">
                  <Fingerprint size={48} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Secure Your App</h2>
                <p className="text-white/60 text-lg">
                  Use your device's built-in security to protect your financial data.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Fingerprint size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Fingerprint</p>
                    <p className="text-white/50 text-sm">Quick unlock with your fingerprint</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Smartphone size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Face ID / Device PIN</p>
                    <p className="text-white/50 text-sm">Uses your phone's security settings</p>
                  </div>
                </div>
              </div>

              {isBiometricSupported ? (
                <button
                  onClick={handleEnableSecurity}
                  disabled={isProcessing}
                  className="h-14 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Shield size={20} />
                      Enable App Lock
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-3">
                  <p className="text-yellow-200 text-sm text-center">
                    ⚠️ Device authentication is not available on this browser. 
                    Use Chrome or Edge on a device with biometric support.
                  </p>
                </div>
              )}

              <button
                onClick={handleSkipSecurity}
                disabled={isProcessing}
                className="h-14 w-full bg-white/5 border border-white/10 text-white rounded-full font-medium hover:bg-white/10 transition-all disabled:opacity-50"
              >
                Skip for Now
              </button>

              <p className="mt-6 text-white/30 text-xs text-center">
                You can always enable this later in Settings → Security
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Onboarding Slides
  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D0F] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="text-center"
          >
            <div className="w-32 h-32 mx-auto bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse" />
              <Icon size={64} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">{slides[currentSlide].title}</h2>
            <p className="text-white/60 leading-relaxed text-lg">{slides[currentSlide].desc}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-md pb-10 flex items-center justify-between">
        <div className="flex gap-2">
          {slides.map((_, idx) => (
            <div 
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>
        
        <button 
          onClick={nextSlide}
          disabled={isProcessing}
          className="h-14 px-8 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
              <ChevronRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
