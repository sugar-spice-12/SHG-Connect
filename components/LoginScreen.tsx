import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ShieldCheck, Lock, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const LoginScreen: React.FC = () => {
  const { login, verifyOtp, otpAttempts, isOtpBlocked, otpBlockedUntil } = useAuth();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [blockCountdown, setBlockCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Countdown timer for block duration
  useEffect(() => {
    if (isOtpBlocked && otpBlockedUntil) {
      const updateBlockCountdown = () => {
        const remaining = Math.max(0, Math.ceil((otpBlockedUntil - Date.now()) / 1000));
        setBlockCountdown(remaining);
      };
      updateBlockCountdown();
      const timer = setInterval(updateBlockCountdown, 1000);
      return () => clearInterval(timer);
    } else {
      setBlockCountdown(0);
    }
  }, [isOtpBlocked, otpBlockedUntil]);

  // Validate email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // -----------------------------
  // SEND OTP
  // -----------------------------
  const handleGetOtp = async () => {
    setError('');
    
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      toast.error("Enter valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email);

      if (success) {
        setStep("otp");
        setCountdown(60);
        toast.success(`OTP sent to ${email}`);
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      console.error("Get OTP error:", err);
      setError(err.message || "Failed to send OTP");
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // RESEND OTP
  // -----------------------------
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError('');
    setIsLoading(true);

    try {
      const success = await login(email);

      if (success) {
        setCountdown(60);
        toast.success("OTP resent successfully");
      } else {
        setError("Failed to resend OTP");
      }
    } catch (err: any) {
      console.error("Resend OTP error:", err);
      setError(err.message || "Failed to resend OTP");
      toast.error(err.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // VERIFY OTP
  // -----------------------------
  const handleVerify = async () => {
    setError('');
    
    // Check if blocked
    if (isOtpBlocked) {
      setError("Too many failed attempts. Please wait before trying again.");
      return;
    }
    
    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      toast.error("Enter 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const success = await verifyOtp(email, otp);

      if (!success) {
        setError("Invalid OTP. Please check and try again.");
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError(err.message || "Incorrect OTP");
      toast.error(err.message || "Incorrect OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // CHANGE EMAIL
  // -----------------------------
  const handleChangeEmail = () => {
    setStep("email");
    setOtp("");
    setError("");
    setCountdown(0);
  };

  // -----------------------------
  // HANDLE ENTER KEY
  // -----------------------------
  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !isLoading) {
      action();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D0D0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">

      {/* Background Gradient Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SHG Connect</h1>
          <p className="text-white/50 text-sm">Secure Financial Management for SHGs</p>
        </div>

        {/* Main Card */}
        <div className="glass-panel p-8 rounded-3xl border border-white/10 backdrop-blur-xl">

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </motion.div>
          )}

          {/* EMAIL STEP */}
          {step === 'email' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              
              <div>
                <label className="text-xs text-white/50 font-bold uppercase tracking-wider mb-2 block">
                  Email Address
                </label>

                <div className="bg-white/5 border border-white/10 rounded-xl flex items-center px-4 py-3 focus-within:border-blue-500 transition-colors">
                  <Mail size={18} className="text-white/30 mr-3" />

                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value.toLowerCase().trim());
                      setError('');
                    }}
                    onKeyPress={(e) => handleKeyPress(e, handleGetOtp)}
                    className="bg-transparent outline-none text-white font-medium w-full placeholder:text-white/20"
                    placeholder="your.email@example.com"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>

                {email.length > 0 && !isValidEmail(email) && (
                  <p className="text-xs text-yellow-400/80 mt-2">
                    Please enter a valid email address
                  </p>
                )}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-xs text-blue-200">
                  💡 <strong>Note:</strong> We'll send a 6-digit OTP to your email. Check your inbox (and spam folder) after clicking "Get OTP".
                </p>
              </div>

              <p className="text-xs text-center text-white/30 px-4">
                First time? The first user to log in will be assigned as the <strong>SHG Leader</strong>.
              </p>

              <button 
                onClick={handleGetOtp}
                disabled={isLoading || !isValidEmail(email)}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Get OTP <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* OTP STEP */}
          {step === 'otp' && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-6"
            >
              
              <div className="text-center">
                <p className="text-white/60 text-sm">Enter the OTP sent to</p>
                <p className="text-white font-bold">{email}</p>
                <p className="text-white/40 text-xs mt-2">Check your inbox and spam folder</p>
              </div>

              {/* Security Block Warning */}
              {isOtpBlocked && blockCountdown > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-center"
                >
                  <Shield size={24} className="text-red-400 mx-auto mb-2" />
                  <p className="text-red-200 text-sm font-medium">Account Temporarily Locked</p>
                  <p className="text-red-300/70 text-xs mt-1">
                    Too many failed attempts. Try again in{' '}
                    <span className="font-bold text-red-300">
                      {Math.floor(blockCountdown / 60)}:{(blockCountdown % 60).toString().padStart(2, '0')}
                    </span>
                  </p>
                </motion.div>
              )}

              {/* Attempts Warning */}
              {!isOtpBlocked && otpAttempts > 0 && otpAttempts < 5 && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                  <p className="text-yellow-200 text-xs">
                    ⚠️ {5 - otpAttempts} attempt{5 - otpAttempts !== 1 ? 's' : ''} remaining before temporary lock
                  </p>
                </div>
              )}

              <div className="flex justify-center">
                <input 
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setError('');
                  }}
                  onKeyPress={(e) => handleKeyPress(e, handleVerify)}
                  className="w-48 text-center text-3xl tracking-[0.3em] bg-transparent border-b-2 border-white/20 focus:border-blue-500 outline-none text-white py-2 font-mono"
                  placeholder="••••••"
                  maxLength={6}
                  disabled={isLoading || isOtpBlocked}
                  autoFocus
                />
              </div>

              <button 
                onClick={handleVerify}
                disabled={isLoading || otp.length !== 6 || isOtpBlocked}
                className="w-full h-12 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : isOtpBlocked ? (
                  <>
                    <Shield size={18} /> Locked
                  </>
                ) : (
                  <>
                    Verify & Login <Lock size={18} />
                  </>
                )}
              </button>

              <div className="flex flex-col items-center gap-3 pt-2">
                {/* Resend OTP */}
                {countdown > 0 ? (
                  <p className="text-xs text-white/40">
                    Resend OTP in <span className="text-blue-400 font-bold">{countdown}s</span>
                  </p>
                ) : (
                  <button 
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                )}

                {/* Change Email */}
                <button 
                  onClick={handleChangeEmail}
                  disabled={isLoading}
                  className="text-xs text-white/40 hover:text-white transition-colors disabled:opacity-50"
                >
                  Change Email Address
                </button>
              </div>
            </motion.div>
          )}

        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-green-400/70">
            <Shield size={14} />
            <p className="text-xs">Protected with end-to-end encryption</p>
          </div>
          <p className="text-xs text-white/30">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
};