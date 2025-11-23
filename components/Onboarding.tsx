// src/components/Onboarding.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Shield, Users, Zap } from 'lucide-react';
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
        desc: "Your financial data is encrypted and protected with PIN and Biometric lock. Your privacy is our priority."
    }
];

export const Onboarding: React.FC = () => {
  const { completeOnboarding, showPinSetup, setupSecurity } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const nextSlide = async () => {
    if (isProcessing) return;
    
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(c => c + 1);
    } else {
      // Last slide - complete onboarding
      setIsProcessing(true);
      try {
        await completeOnboarding();
        // After onboarding is complete, check if PIN setup is needed
        if (showPinSetup) {
          setShowPinScreen(true);
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
        toast.error("Failed to complete onboarding");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handlePinSetup = () => {
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    
    if (pin !== confirmPin) {
      toast.error("PINs do not match");
      return;
    }
    
    setupSecurity(pin, false); // biometric disabled
    toast.success("PIN setup complete!");
  };

  const handleSkipPin = () => {
    // Setup with empty PIN (no PIN protection)
    setupSecurity("", false);
  };

  const Icon = slides[currentSlide].icon;

  // PIN Setup Screen
  if (showPinScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0D0D0F] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md flex-1 flex flex-col justify-center">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6">
              <Shield size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Set Your PIN</h2>
            <p className="text-white/60">Secure your account with a 4-6 digit PIN.</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Enter PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl p-4 rounded-xl w-full bg-white/10 text-white border border-white/20 focus:border-blue-500 outline-none"
                placeholder="••••"
              />
            </div>

            <div>
              <label className="text-sm text-white/60 mb-2 block">Confirm PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl p-4 rounded-xl w-full bg-white/10 text-white border border-white/20 focus:border-blue-500 outline-none"
                placeholder="••••"
              />
            </div>
          </div>

          <button
            onClick={handlePinSetup}
            disabled={pin.length < 4 || pin !== confirmPin}
            className="h-14 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            Save PIN & Continue
          </button>

          <button
            onClick={handleSkipPin}
            className="h-14 w-full bg-white/5 border border-white/10 text-white rounded-full font-medium hover:bg-white/10 transition-all"
          >
            Skip for Now
          </button>
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