import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Search, CheckCircle, XCircle, AlertCircle,
  CreditCard, Smartphone, Plus, Trash2, Shield, Loader2,
  Copy, ExternalLink
} from 'lucide-react';
import { 
  validateIFSC, 
  lookupIFSCOnline,
  validateAccountNumber,
  validateUPI,
  saveBankAccount,
  getMemberBankAccounts,
  deleteBankAccount,
  IFSCDetails,
  BankAccount
} from '../lib/bank';
import toast from 'react-hot-toast';

export const BankVerification: React.FC = () => {
  const { t } = useLanguage();
  const { members } = useData();
  
  const [activeTab, setActiveTab] = useState<'verify' | 'accounts'>('verify');
  const [ifscCode, setIfscCode] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [ifscDetails, setIfscDetails] = useState<IFSCDetails | null>(null);
  const [ifscError, setIfscError] = useState('');
  
  // Add Account Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountIfsc, setAccountIfsc] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'current' | 'joint'>('savings');
  const [upiId, setUpiId] = useState('');

  const handleIFSCLookup = async () => {
    const validation = validateIFSC(ifscCode);
    if (!validation.valid) {
      setIfscError(validation.error || 'Invalid IFSC');
      setIfscDetails(null);
      return;
    }

    setIsLookingUp(true);
    setIfscError('');
    
    try {
      const details = await lookupIFSCOnline(ifscCode);
      if (details) {
        setIfscDetails(details);
        toast.success('Bank found!', { icon: '🏦' });
      } else {
        setIfscError('Bank not found');
        setIfscDetails(null);
      }
    } catch (error) {
      setIfscError('Lookup failed');
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddAccount = async () => {
    // Validate
    const accValidation = validateAccountNumber(accountNumber);
    if (!accValidation.valid) {
      toast.error(accValidation.error || 'Invalid account number');
      return;
    }

    const ifscValidation = validateIFSC(accountIfsc);
    if (!ifscValidation.valid) {
      toast.error(ifscValidation.error || 'Invalid IFSC');
      return;
    }

    if (upiId) {
      const upiValidation = validateUPI(upiId);
      if (!upiValidation.valid) {
        toast.error(upiValidation.error || 'Invalid UPI ID');
        return;
      }
    }

    const member = members.find(m => m.id === selectedMember);
    if (!member) {
      toast.error('Please select a member');
      return;
    }

    // Lookup bank details
    const bankDetails = await lookupIFSCOnline(accountIfsc);

    saveBankAccount({
      memberId: member.id,
      memberName: member.name,
      accountNumber,
      ifsc: accountIfsc.toUpperCase(),
      bankName: bankDetails?.bank || 'Unknown Bank',
      branchName: bankDetails?.branch || 'Unknown Branch',
      accountType,
      isPrimary: getMemberBankAccounts(member.id).length === 0,
      upiId: upiId || undefined
    });

    toast.success('Bank account added!', { icon: '✅' });
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedMember('');
    setAccountNumber('');
    setAccountIfsc('');
    setAccountType('savings');
    setUpiId('');
  };

  const handleDeleteAccount = (id: string) => {
    deleteBankAccount(id);
    toast.success('Account removed');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!', { icon: '📋' });
  };

  const renderVerify = () => (
    <div className="space-y-6">
      {/* IFSC Lookup */}
      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-blue-400" />
          IFSC Code Lookup
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
            placeholder="Enter IFSC (e.g., SBIN0001234)"
            maxLength={11}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 uppercase"
          />
          <button
            onClick={handleIFSCLookup}
            disabled={isLookingUp || ifscCode.length !== 11}
            className="px-6 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {isLookingUp ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )}
          </button>
        </div>

        {ifscError && (
          <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
            <XCircle size={16} />
            {ifscError}
          </div>
        )}

        {ifscDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="text-green-400" size={20} />
              <span className="text-green-400 font-bold">Bank Found</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Bank</span>
                <span className="text-white font-medium">{ifscDetails.bank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Branch</span>
                <span className="text-white font-medium">{ifscDetails.branch}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">City</span>
                <span className="text-white font-medium">{ifscDetails.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">State</span>
                <span className="text-white font-medium">{ifscDetails.state}</span>
              </div>
              {ifscDetails.address && ifscDetails.address !== 'Address not available offline' && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-white/50 text-xs">Address</span>
                  <p className="text-white/70 text-sm mt-1">{ifscDetails.address}</p>
                </div>
              )}
              
              {/* Services */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                {ifscDetails.neft && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">NEFT</span>}
                {ifscDetails.rtgs && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">RTGS</span>}
                {ifscDetails.imps && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">IMPS</span>}
                {ifscDetails.upi && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">UPI</span>}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Validation */}
      <div className="glass-panel p-6 rounded-3xl">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-purple-400" />
          Quick Validation
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-white/50 text-xs mb-2 block">Account Number</label>
            <input
              type="text"
              placeholder="Enter account number"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
              onChange={(e) => {
                const result = validateAccountNumber(e.target.value);
                if (e.target.value && !result.valid) {
                  e.target.classList.add('border-red-500');
                } else {
                  e.target.classList.remove('border-red-500');
                }
              }}
            />
          </div>

          <div>
            <label className="text-white/50 text-xs mb-2 block">UPI ID</label>
            <input
              type="text"
              placeholder="name@upi"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500"
              onChange={(e) => {
                const result = validateUPI(e.target.value);
                if (e.target.value && !result.valid) {
                  e.target.classList.add('border-red-500');
                } else {
                  e.target.classList.remove('border-red-500');
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccounts = () => {
    const allAccounts: BankAccount[] = [];
    members.forEach(m => {
      allAccounts.push(...getMemberBankAccounts(m.id));
    });

    return (
      <div className="space-y-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full glass-panel p-4 rounded-2xl flex items-center justify-center gap-2 text-blue-400 hover:bg-white/5 transition-colors"
        >
          <Plus size={20} />
          Add Bank Account
        </button>

        {allAccounts.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl text-center">
            <CreditCard className="mx-auto mb-3 text-white/20" size={48} />
            <p className="text-white/40">No bank accounts added</p>
            <p className="text-white/20 text-sm mt-1">Add member bank details for verification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allAccounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-panel p-4 rounded-2xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-white">{account.memberName}</h4>
                    <p className="text-white/40 text-xs">{account.bankName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.isPrimary && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">Primary</span>
                    )}
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-white/50">Account</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">
                        ****{account.accountNumber.slice(-4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(account.accountNumber)}
                        className="text-white/30 hover:text-white"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-white/50">IFSC</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">{account.ifsc}</span>
                      <button
                        onClick={() => copyToClipboard(account.ifsc)}
                        className="text-white/30 hover:text-white"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {account.upiId && (
                    <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-white/50">UPI</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white">{account.upiId}</span>
                        <button
                          onClick={() => copyToClipboard(account.upiId!)}
                          className="text-white/30 hover:text-white"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {account.verifiedAt && (
                  <div className="mt-3 flex items-center gap-2 text-green-400 text-xs">
                    <CheckCircle size={14} />
                    Verified on {new Date(account.verifiedAt).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 min-h-screen"
    >
      <Header 
        title="Bank Verification" 
        subtitle="IFSC lookup & account management"
        showProfile={false}
      />

      <div className="px-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'verify' ? 'bg-white/10 text-white' : 'text-white/40'
            }`}
          >
            <Search size={16} />
            Verify
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'accounts' ? 'bg-white/10 text-white' : 'text-white/40'
            }`}
          >
            <CreditCard size={16} />
            Accounts
          </button>
        </div>

        {activeTab === 'verify' && renderVerify()}
        {activeTab === 'accounts' && renderAccounts()}
      </div>

      {/* Add Account Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-[#1C1C1E] border-t border-white/10 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
              
              <h3 className="text-xl font-bold text-white mb-6">Add Bank Account</h3>

              <div className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs mb-2 block">Member</label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                  >
                    <option value="">Select member...</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">Account Number</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter account number"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">IFSC Code</label>
                  <input
                    type="text"
                    value={accountIfsc}
                    onChange={(e) => setAccountIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g., SBIN0001234"
                    maxLength={11}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none uppercase"
                  />
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">Account Type</label>
                  <div className="flex gap-2">
                    {(['savings', 'current', 'joint'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setAccountType(type)}
                        className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${
                          accountType === type 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white/5 text-white/50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">UPI ID (Optional)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                    placeholder="name@upi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>

                <button
                  onClick={handleAddAccount}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 rounded-xl font-bold mt-4"
                >
                  Add Account
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
