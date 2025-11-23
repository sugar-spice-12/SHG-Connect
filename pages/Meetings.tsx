
import React, { useState } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calendar, Check, IndianRupee, ChevronRight, CheckCircle, AlertCircle, X, Trash2, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleGenAI } from '@google/genai';

type WizardStep = 'intro' | 'attendance' | 'savings' | 'recoveries' | 'summary';

export const Meetings: React.FC = () => {
  const { t } = useLanguage();
  const { members, meetings, addMeeting, deleteMeeting, loans, isAIQuotaExceeded } = useData();
  const { currentUserRole } = useAuth();
  const [step, setStep] = useState<WizardStep>('intro');
  
  // Meeting State
  const [attendees, setAttendees] = useState<string[]>([]);
  const [savings, setSavings] = useState<Record<string, number>>({});
  const [loanPayments, setLoanPayments] = useState<Record<string, number>>({});
  const [fines, setFines] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // AI Meeting Prep State
  const [aiAgenda, setAiAgenda] = useState('');
  const [isGeneratingAgenda, setIsGeneratingAgenda] = useState(false);

  // Delete Modal State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const startMeeting = () => {
    // Initialize defaults
    setAttendees(members.map(m => m.id));
    const defaultSavings: Record<string, number> = {};
    members.forEach(m => defaultSavings[m.id] = 0); // Default 0, user sets amount
    setSavings(defaultSavings);
    setLoanPayments({});
    setFines({});
    setStep('attendance');
  };

  const generateMeetingPrep = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAIQuotaExceeded) {
        toast.error("Offline Mode: AI features unavailable");
        return;
    }
    if (!process.env.API_KEY) {
        toast.error("API Key Missing");
        return;
    }

    setIsGeneratingAgenda(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const context = {
            totalMembers: members.length,
            activeLoans: loans.filter(l => l.status === 'Active').map(l => ({ name: l.memberName, amount: l.emiAmount })),
            lastMeeting: meetings[0]?.date
        };

        const prompt = `
            You are a secretary for a Self Help Group.
            Analyze this context: ${JSON.stringify(context)}.
            Generate a 3-bullet point agenda for today's meeting.
            1. Expected Collection (estimate).
            2. Key Defaulters/Recoveries to focus on.
            3. A motivational tip.
            Keep it very short and direct.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        setAiAgenda(response.text);
    } catch (e) {
        toast.error("Failed to generate agenda");
    } finally {
        setIsGeneratingAgenda(false);
    }
  };

  const toggleAttendance = (memberId: string) => {
    if (attendees.includes(memberId)) {
      setAttendees(prev => prev.filter(id => id !== memberId));
      // Remove savings entry if absent
      setSavings(prev => {
        const next = { ...prev };
        delete next[memberId];
        return next;
      });
    } else {
      setAttendees(prev => [...prev, memberId]);
      // Re-add savings entry if present
      setSavings(prev => ({ ...prev, [memberId]: 0 }));
    }
  };

  const updateSavings = (memberId: string, amount: number) => {
    setSavings(prev => ({ ...prev, [memberId]: amount }));
  };

  const updateLoanPayment = (memberId: string, amount: number) => {
    setLoanPayments(prev => ({ ...prev, [memberId]: amount }));
  };

  const updateFine = (memberId: string, amount: number) => {
    setFines(prev => ({ ...prev, [memberId]: amount }));
  };

  const applyBulkSavings = (amount: number) => {
    const newSavings = { ...savings };
    attendees.forEach(id => {
      newSavings[id] = amount;
    });
    setSavings(newSavings);
    toast.success(t('applyToAll'), { icon: '✅' });
  };

  const finishMeeting = async () => {
    setLoading(true);
    const totalSavings = (Object.values(savings) as number[]).reduce((a, b) => a + b, 0);
    const totalLoanRec = (Object.values(loanPayments) as number[]).reduce((a, b) => a + b, 0);
    const totalFines = (Object.values(fines) as number[]).reduce((a, b) => a + b, 0);
    
    addMeeting({
        date: new Date().toLocaleDateString('en-GB'),
        timestamp: Date.now(),
        attendees,
        savingsCollected: savings,
        loanRecovered: loanPayments,
        finesCollected: fines,
        totalCollected: totalSavings + totalLoanRec + totalFines,
        status: 'Completed'
    });

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
    setLoading(false);
    setStep('intro');
    toast.success(t('save'), { icon: '🎉' });
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMeeting(deleteId);
      toast.success(t('deleted'));
      setDeleteId(null);
    }
  };

  const renderIntro = () => (
    <div className="px-6 space-y-6">
      {/* Start New Meeting Card - Only for Leaders */}
      {currentUserRole !== 'Member' && (
        <div 
          onClick={startMeeting}
          className="glass-panel p-6 rounded-3xl relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 group-hover:opacity-30 transition-opacity" />
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                <h3 className="text-xl font-bold text-white mb-1">{t('startMeeting')}</h3>
                <p className="text-white/50 text-xs">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <ChevronRight size={24} />
                </div>
            </div>
            
            {/* AI PREP BUTTON */}
            <div className="flex items-start gap-2 border-t border-white/10 pt-3 mt-1">
                {!aiAgenda ? (
                     <button 
                        onClick={generateMeetingPrep}
                        disabled={isGeneratingAgenda}
                        className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-purple-200 transition-colors"
                     >
                        {isGeneratingAgenda ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Generate Smart Agenda
                     </button>
                ) : (
                    <div className="bg-black/20 p-3 rounded-xl w-full text-xs text-white/80 leading-relaxed whitespace-pre-line border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-purple-300 flex items-center gap-1"><Sparkles size={10} /> AI Agenda</span>
                            <button onClick={(e) => { e.stopPropagation(); setAiAgenda(''); }} className="text-white/30 hover:text-white"><X size={12} /></button>
                        </div>
                        {aiAgenda}
                    </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Past Meetings List */}
      <div>
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 pl-2">{t('history')}</h3>
        <div className="space-y-3">
          {meetings.length === 0 ? (
            <div className="text-center py-10 text-white/20 border border-dashed border-white/10 rounded-2xl">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('noMeetings')}</p>
            </div>
          ) : (
            meetings.map(m => (
              <div key={m.id} className="glass-panel p-4 rounded-2xl flex justify-between items-center group relative">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center font-bold text-xs flex-col">
                    <span>{m.date.split('/')[0]}</span>
                    <span className="text-[8px] uppercase">{new Date(m.timestamp).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-white text-sm">{t('meetingSummary')}</h4>
                    <p className="text-white/40 text-xs">{m.attendees.length} Present • ₹{m.totalCollected}</p>
                  </div>
                </div>
                <div className="text-right mr-8">
                  <span className="text-xs text-green-400 flex items-center justify-end gap-1">
                    <CheckCircle size={10} /> Completed
                  </span>
                </div>
                
                {currentUserRole !== 'Member' && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setDeleteId(m.id); }}
                        className="absolute top-4 right-4 p-2 text-white/20 hover:text-red-400 transition-colors z-20 hover:bg-white/5 rounded-full cursor-pointer"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="px-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">{t('markAttendance')}</h3>
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-lg font-bold">{attendees.length}/{members.length}</span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {members.map(member => {
          const isPresent = attendees.includes(member.id);
          return (
            <motion.div 
              key={member.id}
              layout
              onClick={() => toggleAttendance(member.id)}
              className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                isPresent 
                  ? 'bg-blue-600/20 border-blue-500/50' 
                  : 'bg-white/5 border-transparent opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <img src={member.avatarUrl} className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
                <div>
                  <p className={`font-bold text-sm ${isPresent ? 'text-white' : 'text-white/50'}`}>{member.name}</p>
                  <p className="text-[10px] text-white/30">{member.role}</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                isPresent ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'
              }`}>
                {isPresent && <Check size={14} strokeWidth={3} />}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderSavings = () => (
    <div className="px-6 pb-24">
       <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">{t('collectSavings')}</h3>
        <button 
          onClick={() => applyBulkSavings(100)}
          className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-blue-300 font-medium transition-colors"
        >
          {t('applyToAll')}
        </button>
      </div>

      <div className="space-y-3">
        {members.filter(m => attendees.includes(m.id)).map(member => (
          <div key={member.id} className="glass-panel p-3 rounded-xl flex items-center gap-3">
             <img src={member.avatarUrl} className="w-10 h-10 rounded-full bg-gray-700 object-cover" />
             <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-white truncate">{member.name}</p>
             </div>
             <div className="flex items-center bg-black/30 rounded-lg px-3 py-2 border border-white/10 w-28">
                <span className="text-white/30 text-xs mr-1">₹</span>
                <input 
                  type="number"
                  value={savings[member.id] || ''}
                  onChange={(e) => updateSavings(member.id, parseInt(e.target.value) || 0)}
                  className="bg-transparent w-full text-right text-white font-bold outline-none"
                  placeholder="0"
                />
             </div>
          </div>
        ))}
        {attendees.length === 0 && (
          <div className="text-center py-10 text-white/30 flex flex-col items-center gap-2">
            <AlertCircle />
            <p>No members marked present.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecoveries = () => (
    <div className="px-6 pb-24">
       <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">{t('collectRecoveries')}</h3>
        <p className="text-xs text-white/40">Loans & Fines</p>
      </div>

      <div className="space-y-4">
        {members.filter(m => attendees.includes(m.id)).map(member => {
          const activeLoan = loans.find(l => l.memberId === member.id && l.status === 'Active');
          return (
            <div key={member.id} className="glass-panel p-4 rounded-xl space-y-3">
               <div className="flex items-center gap-3 mb-2">
                   <img src={member.avatarUrl} className="w-8 h-8 rounded-full bg-gray-700 object-cover" />
                   <div className="flex-1">
                      <p className="font-bold text-sm text-white">{member.name}</p>
                      {activeLoan && (
                          <p className="text-[10px] text-red-400">Due EMI: ₹{activeLoan.emiAmount}</p>
                      )}
                   </div>
               </div>
               
               {/* Loan Input */}
               {activeLoan ? (
                   <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                       <label className="text-xs text-white/50">Loan Repayment</label>
                       <div className="flex items-center w-24">
                            <span className="text-white/30 text-xs mr-1">₹</span>
                            <input 
                            type="number"
                            value={loanPayments[member.id] || ''}
                            onChange={(e) => updateLoanPayment(member.id, parseInt(e.target.value) || 0)}
                            className="bg-transparent w-full text-right text-white font-bold outline-none"
                            placeholder="0"
                            />
                       </div>
                   </div>
               ) : (
                   <p className="text-[10px] text-white/20 italic pl-1">No active loans</p>
               )}

               {/* Fine Input */}
               <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 border border-red-500/10">
                   <label className="text-xs text-white/50">Fine / Penalty</label>
                   <div className="flex items-center w-24">
                        <span className="text-white/30 text-xs mr-1">₹</span>
                        <input 
                        type="number"
                        value={fines[member.id] || ''}
                        onChange={(e) => updateFine(member.id, parseInt(e.target.value) || 0)}
                        className="bg-transparent w-full text-right text-red-400 font-bold outline-none"
                        placeholder="0"
                        />
                   </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSummary = () => {
    const totalSavings = (Object.values(savings) as number[]).reduce((a, b) => a + b, 0);
    const totalLoanRec = (Object.values(loanPayments) as number[]).reduce((a, b) => a + b, 0);
    const totalFines = (Object.values(fines) as number[]).reduce((a, b) => a + b, 0);
    const total = totalSavings + totalLoanRec + totalFines;

    return (
      <div className="px-6">
        <div className="glass-panel p-6 rounded-3xl mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500" />
          <h2 className="text-4xl font-bold text-white mb-1">₹{total.toLocaleString()}</h2>
          <p className="text-white/50 text-sm mb-4">{t('totalCollected')}</p>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
             <div className="bg-white/5 rounded-lg p-2">
                 <p className="text-green-400 font-bold">₹{totalSavings}</p>
                 <p className="text-white/30 uppercase">Savings</p>
             </div>
             <div className="bg-white/5 rounded-lg p-2">
                 <p className="text-blue-400 font-bold">₹{totalLoanRec}</p>
                 <p className="text-white/30 uppercase">Loans</p>
             </div>
             <div className="bg-white/5 rounded-lg p-2">
                 <p className="text-red-400 font-bold">₹{totalFines}</p>
                 <p className="text-white/30 uppercase">Fines</p>
             </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 mb-4">
            <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={16} />
            <div>
                <p className="text-sm font-bold text-blue-100">Confirm Meeting Details</p>
                <p className="text-xs text-blue-200/60 mt-1">Once finished, transactions will be generated for all {attendees.length} present members.</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{attendees.length}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('presentMembers')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white/50">{members.length - attendees.length}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">{t('absent')}</p>
            </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 relative min-h-screen"
    >
      <Header 
        title={step === 'intro' ? t('meetings') : t('startMeeting')} 
        subtitle={step === 'intro' ? t('weeklyCollection') : `Step ${step === 'attendance' ? '1' : step === 'savings' ? '2' : step === 'recoveries' ? '3' : '4'} of 4`}
        onBack={step !== 'intro' ? () => setStep(
            step === 'summary' ? 'recoveries' : 
            step === 'recoveries' ? 'savings' :
            step === 'savings' ? 'attendance' : 'intro'
        ) : undefined}
        showProfile={false}
      />

      {/* Wizard Content */}
      <div className="mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'intro' && renderIntro()}
            {step === 'attendance' && renderAttendance()}
            {step === 'savings' && renderSavings()}
            {step === 'recoveries' && renderRecoveries()}
            {step === 'summary' && renderSummary()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Wizard Footer Actions */}
      {step !== 'intro' && (
        <div className="fixed bottom-24 left-6 right-6 z-40">
           <button
              onClick={() => {
                if (step === 'attendance') setStep('savings');
                else if (step === 'savings') setStep('recoveries');
                else if (step === 'recoveries') setStep('summary');
                else finishMeeting();
              }}
              disabled={loading}
              className={`w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-blue-900/40 transition-all active:scale-95
                ${loading ? 'bg-white/10 text-white/50' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-[1.02]'}
              `}
           >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 'summary' ? (
                    <> <CheckCircle size={20} /> {t('finishMeeting')} </>
                  ) : (
                    <> {step === 'recoveries' ? 'Summary' : 'Next'} <ChevronRight size={20} /> </>
                  )}
                </>
              )}
           </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">{t('deleteConfirm')}</h3>
              <p className="text-white/50 text-sm mb-6">This meeting record will be permanently removed.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
                >
                  {t('delete')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
