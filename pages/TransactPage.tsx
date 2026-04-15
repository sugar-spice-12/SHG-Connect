import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { Check, Mic, MicOff, Receipt, FileText, Coffee, BookOpen, Plane } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { ExpenseCategory } from '../types';
import { useAuth } from '../context/AuthContext';

export const TransactPage: React.FC = () => {
  const { members, addTransaction } = useData();
  const { t, language } = useLanguage();
  const { currentUserRole, user } = useAuth();
  
  // Transaction Form State
  const [amount, setAmount] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [mode, setMode] = useState<'income' | 'expense'>('income');
  const [incomeType, setIncomeType] = useState<'Savings' | 'Loan Repayment'>('Savings');
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('Other');
  const [description, setDescription] = useState('');
  
  // Voice AI State
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSave = () => {
    // If Animator tries to save, they can only save for themselves
    if (currentUserRole === 'Animator' && user?.memberId) {
        if (selectedMemberId !== user.memberId) {
             setSelectedMemberId(user.memberId); // Force self selection
        }
    }

    if (!amount) {
        toast.error("Please enter amount");
        return;
    }

    const valAmount = parseInt(amount);

    if (mode === 'income') {
        if (!selectedMemberId) {
            toast.error("Please select a member");
            return;
        }
        const member = members.find(m => m.id === selectedMemberId);
        addTransaction({
            type: incomeType,
            amount: valAmount,
            date: t('justNow'),
            memberId: selectedMemberId,
            memberName: member?.name || 'Unknown',
            description: incomeType === 'Savings' ? t('savings') : t('repayment')
        });
    } else {
        // Expense
        addTransaction({
            type: 'Expense',
            amount: valAmount,
            date: t('justNow'),
            description: description || expenseCategory,
            category: expenseCategory,
            receiptUrl: 'mock_receipt.jpg'
        });
    }

    toast.success(t('save'), {
        icon: '💾',
        style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
        },
    });
    setAmount('');
    setSelectedMemberId(null);
    setDescription('');
  };

  // Local voice command processing (no API needed)
  const processVoiceInput = (transcript: string) => {
    setIsProcessing(true);
    try {
      const text = transcript.toLowerCase();
      
      // Extract amount - look for numbers
      const amountMatch = text.match(/(\d+)/);
      if (amountMatch) {
        setAmount(amountMatch[1]);
      }
      
      // Detect transaction type
      if (text.includes('expense') || text.includes('kharcha') || text.includes('spent') || text.includes('खर्च')) {
        setMode('expense');
        // Try to detect category
        if (text.includes('food') || text.includes('khana') || text.includes('खाना')) {
          setExpenseCategory('Food');
        } else if (text.includes('travel') || text.includes('yatra') || text.includes('यात्रा')) {
          setExpenseCategory('Travel');
        } else if (text.includes('training') || text.includes('प्रशिक्षण')) {
          setExpenseCategory('Training');
        } else if (text.includes('stationary') || text.includes('stationery')) {
          setExpenseCategory('Stationary');
        }
        setDescription(transcript);
      } else if (text.includes('loan') || text.includes('repay') || text.includes('rin') || text.includes('ऋण') || text.includes('भुगतान')) {
        setMode('income');
        setIncomeType('Loan Repayment');
      } else if (text.includes('saving') || text.includes('bachat') || text.includes('बचत') || text.includes('deposit')) {
        setMode('income');
        setIncomeType('Savings');
      }
      
      // Try to find member name
      for (const member of members) {
        const firstName = member.name.split(' ')[0].toLowerCase();
        if (text.includes(firstName)) {
          setSelectedMemberId(member.id);
          break;
        }
      }
      
      if (amountMatch) {
        toast.success("Voice command processed!");
      } else {
        toast("Speak amount clearly, e.g., '500 savings from Lakshmi'", { icon: '💡' });
      }
    } catch (error) {
      toast.error("Could not process voice command");
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceInput = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { 
      toast.error("Voice not supported in this browser. Use Chrome or Edge."); 
      return; 
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setIsListening(true);
      toast('🎤 Listening... Say amount and type', { duration: 2000 });
    };
    
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      console.log('Voice input:', transcript);
      processVoiceInput(transcript);
    };
    
    recognition.onerror = (e: any) => {
      console.error('Speech recognition error:', e.error);
      switch (e.error) {
        case 'not-allowed':
        case 'permission-denied':
          toast((t) => (
            <div className="flex flex-col gap-1">
              <span className="font-bold">🎤 Microphone Blocked</span>
              <span className="text-xs">Click the lock icon in address bar → Allow microphone</span>
            </div>
          ), { duration: 5000 });
          break;
        case 'no-speech':
          toast.error("No speech detected. Please try again.");
          break;
        case 'audio-capture':
          toast.error("No microphone found. Please check your device.");
          break;
        case 'network':
          toast.error("Network error. Voice requires internet.");
          break;
        default:
          toast.error("Voice recognition failed. Please try again.");
      }
      setIsListening(false);
    };
    
    recognition.onend = () => setIsListening(false);
    
    try {
      recognition.start();
    } catch (error) {
      toast.error("Could not start voice recognition");
      setIsListening(false);
    }
  };

  const categories: { id: ExpenseCategory; icon: any; labelKey: string }[] = [
      { id: 'Stationary', icon: BookOpen, labelKey: 'stat_stationary' },
      { id: 'Training', icon: FileText, labelKey: 'stat_training' },
      { id: 'Travel', icon: Plane, labelKey: 'stat_travel' },
      { id: 'Food', icon: Coffee, labelKey: 'stat_food' },
      { id: 'Other', icon: Receipt, labelKey: 'stat_other' },
  ];

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="pb-24 min-h-screen bg-background relative z-40"
    >
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-900/20 to-background pointer-events-none" />
      
      <Header title={t('newEntry')} subtitle={t('transact')} />

      <div className="px-6 mt-2 relative">
            {/* Mic and Amount Input */}
            <div className="text-center mb-8 relative">
                <p className="text-white/40 text-sm mb-2">{t('enterAmount')}</p>
                <div className="flex items-center justify-center gap-1">
                    <span className="text-4xl text-white/30 font-light">₹</span>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="bg-transparent text-6xl font-bold text-white w-48 text-center focus:outline-none placeholder:text-white/10"/>
                </div>
                <button 
                    onClick={startVoiceInput} 
                    disabled={isListening || isProcessing}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
            </div>

            <div className="flex gap-4 mb-6">
                <button onClick={() => setMode('income')} className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${mode === 'income' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-transparent text-white/40'}`}>Incoming</button>
                <button onClick={() => setMode('expense')} className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${mode === 'expense' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-transparent text-white/40'}`}>{t('expense')}</button>
            </div>

          {mode === 'income' ? (
             <>
                <div className="glass-panel p-1 rounded-xl flex mb-6">
                    {['Savings', 'Loan Repayment'].map((typeKey) => (
                        <button key={typeKey} onClick={() => setIncomeType(typeKey as any)} className={`flex-1 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${incomeType === typeKey ? 'bg-white/10 text-white shadow-lg' : 'text-white/50 hover:text-white'}`}>{typeKey === 'Savings' ? t('savings') : t('repayment')}</button>
                    ))}
                </div>

                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">{t('selectMember')}</p>
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {members.slice(0,7).map((member) => {
                        const isAllowed = currentUserRole !== 'Animator' || (user?.memberId === member.id);
                        return (
                            <button 
                                key={member.id}
                                disabled={!isAllowed}
                                onClick={() => setSelectedMemberId(member.id)}
                                className={`flex flex-col items-center gap-2 group ${!isAllowed ? 'opacity-20 pointer-events-none' : ''}`}
                            >
                                <div className={`w-14 h-14 rounded-full p-[2px] transition-all ${selectedMemberId === member.id ? 'bg-gradient-to-tr from-green-400 to-blue-500 scale-110 shadow-lg shadow-blue-500/30' : 'bg-transparent opacity-50 group-hover:opacity-100'}`}>
                                    <img src={member.avatarUrl} className="w-full h-full rounded-full object-cover bg-gray-800" />
                                </div>
                                <span className={`text-[10px] text-center truncate w-full ${selectedMemberId === member.id ? 'text-white font-bold' : 'text-white/40'}`}>
                                    {member.name.split(' ')[0]}
                                </span>
                            </button>
                        );
                    })}
                </div>
             </>
          ) : (
             <>
                <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">{t('category')}</p>
                <div className="flex flex-wrap gap-3 mb-8">
                    {categories.map((cat) => (
                        <button key={cat.id} onClick={() => setExpenseCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${expenseCategory === cat.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/60'}`}>
                            <cat.icon size={14} /><span className="text-sm font-medium">{(t as any)(cat.labelKey)}</span>
                        </button>
                    ))}
                </div>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-white/30 mb-4" />
             </>
          )}

          <button 
              onClick={handleSave}
              disabled={!amount || (mode === 'income' && !selectedMemberId)}
              className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl transition-all ${amount && (mode === 'expense' || selectedMemberId) ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}
          >
              <Check size={20} /> {t('save')}
          </button>
        </div>
    </motion.div>
  );
};