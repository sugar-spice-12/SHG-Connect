import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Copy, 
  Check, 
  Share2, 
  Download,
  IndianRupee,
  User,
  FileText,
  X,
  Smartphone,
  ArrowRight
} from 'lucide-react';
import { useHaptics, useShare } from '../hooks/useNative';
import toast from 'react-hot-toast';

interface UPIPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  defaultDescription?: string;
  memberName?: string;
}

export const UPIPayment: React.FC<UPIPaymentProps> = ({
  isOpen,
  onClose,
  defaultAmount = 0,
  defaultDescription = 'SHG Payment',
  memberName
}) => {
  const { tap, notify } = useHaptics();
  const { share } = useShare();
  
  const [payeeName, setPayeeName] = useState('SHG Connect Group');
  const [payeeUPI, setPayeeUPI] = useState('shgconnect@upi');
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [description, setDescription] = useState(defaultDescription);
  const [copied, setCopied] = useState(false);

  // Generate UPI URL
  const upiUrl = useMemo(() => {
    const params = new URLSearchParams({
      pa: payeeUPI, // Payee address
      pn: payeeName, // Payee name
      am: amount || '0', // Amount
      cu: 'INR', // Currency
      tn: description, // Transaction note
    });
    return `upi://pay?${params.toString()}`;
  }, [payeeUPI, payeeName, amount, description]);

  // Generate QR code using a simple SVG-based approach
  const qrCodeSvg = useMemo(() => {
    // Simple QR code representation using data URL
    // In production, you'd use a proper QR library
    const data = encodeURIComponent(upiUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&bgcolor=1C1C1E&color=FFFFFF`;
  }, [upiUrl]);

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(payeeUPI);
      setCopied(true);
      tap('medium');
      toast.success('UPI ID copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    tap('light');
    await share({
      title: 'SHG Payment Request',
      text: `Pay ₹${amount} to ${payeeName}\nUPI: ${payeeUPI}\nFor: ${description}`,
      url: upiUrl
    });
  };

  const handleOpenUPIApp = () => {
    tap('medium');
    notify('success');
    window.location.href = upiUrl;
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-surface p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">UPI Payment</h2>
                <p className="text-xs text-white/50">Scan QR or share link</p>
              </div>
            </div>
            <button
              onClick={() => { tap('light'); onClose(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* QR Code Display */}
            <div className="bg-white rounded-2xl p-4 flex flex-col items-center">
              <img 
                src={qrCodeSvg} 
                alt="UPI QR Code"
                className="w-48 h-48 rounded-xl"
              />
              <p className="mt-3 text-black font-medium">{payeeName}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-600 text-sm">{payeeUPI}</p>
                <button
                  onClick={handleCopyUPI}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
              {amount && parseFloat(amount) > 0 && (
                <p className="mt-2 text-2xl font-bold text-black">₹{parseFloat(amount).toLocaleString()}</p>
              )}
            </div>

            {/* Amount Input */}
            <div className="bg-white/5 rounded-xl p-4">
              <label className="text-sm text-white/60 mb-2 block">Amount (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-xl font-bold focus:outline-none focus:border-primary"
                  placeholder="0"
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => { tap('light'); setAmount(amt.toString()); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      amount === amt.toString()
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 rounded-xl p-4">
              <label className="text-sm text-white/60 mb-2 block">Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                  placeholder="Payment for..."
                />
              </div>
            </div>

            {/* UPI ID Input */}
            <div className="bg-white/5 rounded-xl p-4">
              <label className="text-sm text-white/60 mb-2 block">Payee UPI ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={payeeUPI}
                  onChange={(e) => setPayeeUPI(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                  placeholder="name@upi"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share</span>
              </button>
              <button
                onClick={handleOpenUPIApp}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity"
              >
                <Smartphone className="w-5 h-5" />
                <span>Pay Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Supported Apps */}
            <div className="text-center">
              <p className="text-xs text-white/40">Supported UPI Apps</p>
              <div className="flex justify-center gap-4 mt-2">
                {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <span key={app} className="text-xs text-white/60 bg-white/5 px-2 py-1 rounded">
                    {app}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Quick UPI Button Component
export const UPIButton: React.FC<{
  amount?: number;
  description?: string;
  memberName?: string;
  className?: string;
}> = ({ amount, description, memberName, className }) => {
  const [showModal, setShowModal] = useState(false);
  const { tap } = useHaptics();

  return (
    <>
      <button
        onClick={() => { tap('light'); setShowModal(true); }}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity ${className}`}
      >
        <QrCode className="w-4 h-4" />
        <span>Pay via UPI</span>
      </button>
      
      <UPIPayment
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        defaultAmount={amount}
        defaultDescription={description}
        memberName={memberName}
      />
    </>
  );
};
