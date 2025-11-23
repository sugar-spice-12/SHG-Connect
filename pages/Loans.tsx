
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Banknote, ChevronRight, Plus, X, User, Calendar, Calculator, AlertCircle, Mic, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleGenAI, Type } from "@google/genai";

export const Loans: React.FC = () => {
  const { loans, members, addLoan, repayLoan, isAIQuotaExceeded } = useData();
  const { t, language } = useLanguage();
  const { currentUserRole } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [repayModalLoanId, setRepayModalLoanId] = useState<string | null>(null);

  // Add Loan Form
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('12'); // Default 12%
  const [duration, setDuration] = useState('12'); // Default 12 months
  
  // Voice State
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Repay Form
  const [repayAmount, setRepayAmount] = useState('');
  const [penalty, setPenalty] = useState('');

  // Derived EMI
  const calculatedEMI = React.useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(interestRate);
    const n = parseFloat(duration);
    if (isNaN(p) || isNaN(r) || isNaN(n) || n === 0) return 0;
    
    // Simple Interest: (P + (P*R*T/100)) / N
    // T in years = n/12
    const interest = p * (r/100) * (n/12);
    const total = p + interest;
    return Math.round(total / n);
  }, [principal, interestRate, duration]);

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !principal) {
        toast.error("Please fill all fields");
        return;
    }

    const member = members.find(m => m.id === selectedMemberId);
    addLoan({
        memberId: selectedMemberId,
        memberName: member?.name || 'Unknown',
        principal: parseFloat(principal),
        interestRate: parseFloat(interestRate),
        termMonths: parseFloat(duration),
        startDate: new Date().toLocaleDateString('en-GB')
    });

    toast.success(t('disburse'), { icon: '💸' });
    setShowAddModal(false);
    setPrincipal('');
    setSelectedMemberId('');
    setDuration('12');
  };

  const startVoiceFill = () => {
    if (isAIQuotaExceeded) {
        toast.error("Offline Mode: Voice unavailable");
        return;
    }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        toast.error("Voice not supported on this device");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    
    toast('Listening... e.g., "5000 loan for Lakshmi"', { icon: '🎙️' });
    
    recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        processVoiceCommand(transcript);
    };
    recognition.start();
  };

  const processVoiceCommand = async (text: string) => {
      if (!process.env.API_KEY) return;
      setIsProcessingVoice(true);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const memberList = members.map(m => `${m.name} (ID: ${m.id})`).join(', ');
          
          const prompt = `
            Extract loan details from: "${text}".
            Available Members: ${memberList}.
            Return JSON: { 
                "memberId": string (best matching ID from list or null), 
                "principal": number, 
                "duration": number (months, default 12 if not specified),
                "interest": number (default 12 if not specified)
            }
          `;

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: { 
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          memberId: { type: Type.STRING, nullable: true },
                          principal: { type: Type.NUMBER },
                          duration: { type: Type.NUMBER },
                          interest: { type: Type.NUMBER }
                      }
                  }
              }
          });

          const result = JSON.parse(response.text);
          
          if (result) {
              if (result.memberId) setSelectedMemberId(result.memberId);
              if (result.principal) setPrincipal(result.principal.toString());
              if (result.duration) setDuration(result.duration.toString());
              if (result.interest) setInterestRate(result.interest.toString());
              toast.success("Form Auto-filled!");
          }
      } catch (e) {
          toast.error("Could not understand command");
      } finally {
          setIsProcessingVoice(false);
      }
  };

  const handleRepay = () => {
    if (!repayModalLoanId || !repayAmount) return;
    
    repayLoan(repayModalLoanId, parseFloat(repayAmount), parseFloat(penalty) || 0);
    toast.success("Repayment Recorded", { icon: '✅' });
    setRepayModalLoanId(null);
    setRepayAmount('');
    setPenalty('');
  };

  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.totalRepayable - l.amountPaid), 0);

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-24 relative min-h-screen"
    >
      <Header title={t('loans')} subtitle={t('loanStatus')} showProfile={false} />

      {/* Dashboard Stats */}
      <div className="px-6 mb-6">
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Banknote size={80} />
            </div>
            <div className="relative z-10">
                <p className="text-white/50 text-xs font-medium mb-1">TOTAL OUTSTANDING</p>
                <h3 className="text-3xl font-bold text-white">₹{(totalOutstanding / 1000).toFixed(1)}k</h3>
                <div className="mt-4 flex gap-4">
                    <div>
                        <p className="text-2xl font-bold text-blue-400">{activeLoans.length}</p>
                        <p className="text-[10px] text-white/40 uppercase">{t('activeLoans')}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-green-400">{loans.filter(l => l.status === 'Completed').length}</p>
                        <p className="text-[10px] text-white/40 uppercase">Closed</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Active Loans List */}
      <div className="px-6 pb-24">
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 pl-2">{t('activeLoans')}</h3>
        <div className="space-y-4">
            {activeLoans.length === 0 ? (
                <div className="text-center py-10 text-white/20 border border-dashed border-white/10 rounded-2xl">
                    <Banknote size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active loans</p>
                </div>
            ) : (
                activeLoans.map(loan => {
                    const progress = (loan.amountPaid / loan.totalRepayable) * 100;
                    return (
                        <div key={loan.id} className="glass-panel p-4 rounded-2xl group hover:bg-white/5 transition-colors relative">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-white">{loan.memberName}</h4>
                                    <p className="text-xs text-white/40">₹{loan.principal} • {loan.interestRate}% • {loan.termMonths}m</p>
                                </div>
                                <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md">
                                    EMI: ₹{loan.emiAmount}
                                </span>
                            </div>
                            
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-white/60">{Math.round(progress)}% {t('paid')}</span>
                                    <span className="text-white font-medium">₹{loan.totalRepayable - loan.amountPaid} {t('remaining')}</span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                            </div>

                            {currentUserRole !== 'Member' && (
                                <button 
                                    onClick={() => {
                                        setRepayModalLoanId(loan.id);
                                        setRepayAmount(loan.emiAmount.toString());
                                    }}
                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors border border-white/5"
                                >
                                    {t('repayLoan')}
                                </button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* FAB - Only for Leaders/Animators */}
      {currentUserRole !== 'Member' && (
        <button 
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 text-white flex items-center justify-center shadow-2xl shadow-orange-900/50 font-bold active:scale-90 transition-transform hover:scale-105 z-50"
        >
            <Plus size={24} />
        </button>
      )}

      {/* Add Loan Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-[#1C1C1E] rounded-t-3xl md:rounded-3xl p-6 border border-white/10 shadow-2xl h-[85vh] md:h-auto overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{t('createLoan')}</h2>
                    <button 
                        onClick={startVoiceFill}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isProcessingVoice ? 'bg-white text-black animate-pulse' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white'}`}
                    >
                        {isProcessingVoice ? <Loader2 size={14} className="animate-spin" /> : <Mic size={16} />}
                    </button>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-white/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateLoan} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-xs text-white/50 font-medium ml-1">{t('selectMember')}</label>
                   <div className="grid grid-cols-4 gap-2">
                      {members.map(m => (
                          <button
                             key={m.id}
                             type="button"
                             onClick={() => setSelectedMemberId(m.id)}
                             className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                                 selectedMemberId === m.id 
                                 ? 'bg-blue-600/20 border-blue-500' 
                                 : 'bg-white/5 border-transparent opacity-60'
                             }`}
                          >
                              <img src={m.avatarUrl} className="w-8 h-8 rounded-full mb-1" />
                              <span className="text-[10px] truncate w-full text-center">{m.name.split(' ')[0]}</span>
                          </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium ml-1">{t('principal')}</label>
                  <div className="bg-white/5 rounded-xl flex items-center px-4 border border-white/5 focus-within:border-blue-500/50">
                    <span className="text-white/30 mr-2">₹</span>
                    <input 
                      type="number" 
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      className="w-full h-12 bg-transparent outline-none text-white font-bold"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs text-white/50 font-medium ml-1">{t('interestRate')}</label>
                        <input 
                            type="number" 
                            value={interestRate}
                            onChange={(e) => setInterestRate(e.target.value)}
                            className="w-full h-12 bg-white/5 rounded-xl px-4 border border-white/5 outline-none text-white"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-white/50 font-medium ml-1">{t('durationMonths')}</label>
                        <input 
                            type="number" 
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="w-full h-12 bg-white/5 rounded-xl px-4 border border-white/5 outline-none text-white"
                        />
                    </div>
                </div>

                {/* EMI Calculator Preview */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-white/10 mt-4">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <Calculator size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Preview</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-white/50 text-xs">Monthly EMI</p>
                            <p className="text-2xl font-bold text-white">₹{calculatedEMI}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-white/50 text-xs">{t('totalRepayable')}</p>
                             <p className="text-lg font-bold text-green-400">₹{calculatedEMI * parseFloat(duration || '0')}</p>
                        </div>
                    </div>
                </div>

                <button 
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl font-bold text-white text-lg mt-4 shadow-lg active:scale-[0.98] transition-transform"
                >
                  {t('disburse')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Repay Modal */}
      <AnimatePresence>
        {repayModalLoanId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setRepayModalLoanId(null)} />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-[#1C1C1E] w-full max-w-sm rounded-2xl p-6 border border-white/10 shadow-2xl"
                >
                    <h3 className="text-xl font-bold text-white mb-4">{t('repayLoan')}</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">Amount</label>
                            <input 
                                type="number"
                                value={repayAmount}
                                onChange={(e) => setRepayAmount(e.target.value)}
                                className="w-full bg-white/5 h-12 rounded-xl px-4 text-white font-bold border border-white/10 outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/50 mb-1 block">{t('penalty')} (Optional)</label>
                            <input 
                                type="number"
                                value={penalty}
                                onChange={(e) => setPenalty(e.target.value)}
                                placeholder="0"
                                className="w-full bg-white/5 h-12 rounded-xl px-4 text-white border border-white/10 outline-none focus:border-red-500"
                            />
                        </div>
                        <button 
                            onClick={handleRepay}
                            className="w-full h-12 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl mt-2"
                        >
                            Confirm Payment
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
