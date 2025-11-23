
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Member, Transaction, Meeting, Loan, SyncStatus, Conflict, AppState, Notification, AIInsight } from '../types';
import toast from 'react-hot-toast';
import { GoogleGenAI, Type } from "@google/genai";

interface DataContextType {
  members: Member[];
  transactions: Transaction[];
  meetings: Meeting[];
  loans: Loan[];
  notifications: Notification[];
  insights: AIInsight[];
  addTransaction: (t: Omit<Transaction, 'id'> & { id?: string }) => void;
  addMember: (m: Omit<Member, 'id' | 'attendanceRate' | 'savingsBalance' | 'loanOutstanding' | 'lastActive' | 'attendanceHistory'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  addMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  deleteMeeting: (id: string) => void;
  deleteTransaction: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id' | 'status' | 'amountPaid' | 'repaymentHistory' | 'endDate' | 'totalRepayable' | 'emiAmount'>) => void;
  repayLoan: (loanId: string, amount: number, penalty: number) => void;
  refreshData: () => Promise<void>;
  generateAIInsights: (lang?: string) => Promise<void>;
  lastSynced: Date;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  conflicts: Conflict[];
  resolveConflict: (id: string, strategy: 'local' | 'server') => void;
  exportData: () => void;
  simulateConflict: () => void;
  markNotificationRead: (id: string) => void;
  stats: {
    totalSavings: number;
    activeLoans: number;
  };
  aiSummary: string;
  isAIQuotaExceeded: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'shakti_data_v1';
const CLOUD_MOCK_KEY = 'shakti_cloud_mock_v1';

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Mock Encryption/Decryption
const encrypt = (data: string) => btoa(unescape(encodeURIComponent(data)));
const decrypt = (data: string) => decodeURIComponent(escape(atob(data)));

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state from localStorage
  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.members || [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.transactions || [];
      } catch (e) { return []; }
    }
    return [];
  });

  const [meetings, setMeetings] = useState<Meeting[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { const parsed = JSON.parse(saved); return parsed.meetings || []; } catch (e) { return []; }
    }
    return [];
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try { const parsed = JSON.parse(saved); return parsed.loans || []; } catch (e) { return []; }
    }
    return [];
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isAIQuotaExceeded, setIsAIQuotaExceeded] = useState(false);

  const [lastSynced, setLastSynced] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // --- REAL-TIME TAB SYNC ---
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          // When another tab updates data, we immediately update local state
          const remoteData = JSON.parse(e.newValue);
          
          if (remoteData.members) setMembers(remoteData.members);
          if (remoteData.transactions) setTransactions(remoteData.transactions);
          if (remoteData.meetings) setMeetings(remoteData.meetings);
          if (remoteData.loans) setLoans(remoteData.loans);
          
          setLastSynced(new Date());
        } catch (error) {
          console.error("Real-time sync error", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    const dataToSave = { members, transactions, meetings, loans };
    const currentString = localStorage.getItem(STORAGE_KEY);
    const newString = JSON.stringify(dataToSave);
    
    if (currentString !== newString) {
        localStorage.setItem(STORAGE_KEY, newString);
    }
  }, [members, transactions, meetings, loans]);

  // --- AI ENGINE: ANALYTICS & ANOMALY DETECTION ---
  const generateAIInsights = useCallback(async (lang: string = 'en') => {
    const totalSavings = members.reduce((sum, m) => sum + m.savingsBalance, 0);
    const activeLoans = loans.filter(l => l.status === 'Active');
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.totalRepayable - l.amountPaid), 0);
    
    // OFFLINE FALLBACK GENERATOR
    const runOfflineFallback = () => {
        const fallbackInsights: AIInsight[] = [];
        // 1. Savings Analysis
        if (totalSavings < 5000 && members.length > 5) {
            fallbackInsights.push({
                id: 'fb-1',
                type: 'alert',
                title: 'Low Group Savings',
                message: 'Total savings are lower than expected for group size. Encourage weekly deposits.',
                severity: 'medium'
            });
        }
        // 2. Loan Analysis
        if (totalOutstanding > totalSavings) {
            fallbackInsights.push({
                id: 'fb-2',
                type: 'alert',
                title: 'High Loan Ratio',
                message: `Outstanding loans (₹${totalOutstanding}) exceed total savings (₹${totalSavings}). Risk is high.`,
                severity: 'high'
            });
        } else {
            fallbackInsights.push({
                id: 'fb-3',
                type: 'tip',
                title: 'Healthy Financials',
                message: 'Savings cover all active loans. Good financial health!',
                severity: 'low'
            });
        }
        setInsights(fallbackInsights);
        setAiSummary(`Offline Mode: Total Savings ₹${totalSavings}. Active Loans: ${activeLoans.length}.`);
    };

    // If we already know quota is exceeded, skip API
    if (isAIQuotaExceeded) {
        runOfflineFallback();
        return;
    }

    // Attempt API Call
    try {
        if (!process.env.API_KEY) throw new Error("No Key");

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Prepare context data - Slice members to prevent token overflow
        const contextData = {
            totalSavings,
            activeLoansCount: activeLoans.length,
            transactions: transactions.slice(0, 10).map(t => ({
                date: t.date,
                amount: t.amount,
                type: t.type,
            })),
            memberSample: members.slice(0, 3).map(m => ({
                savings: m.savingsBalance,
                loan: m.loanOutstanding
            })),
        };

        const prompt = `
            Analyze SHG data. Lang: ${lang}.
            Data: ${JSON.stringify(contextData)}
            Tasks: 1. Identify anomalies. 2. Monthly summary (15 words). 3. 1 Tip.
            Return JSON.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                maxOutputTokens: 500,
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        insights: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    message: { type: Type.STRING },
                                    severity: { type: Type.STRING }
                                }
                            }
                        },
                        summary: { type: Type.STRING }
                    }
                }
            }
        });

        const result = JSON.parse(response.text);
        if (result) {
            const newInsights = result.insights.map((i: any, idx: number) => ({
                id: `ai-${Date.now()}-${idx}`,
                ...i
            }));
            setInsights(newInsights);
            setAiSummary(result.summary);
            return;
        }

    } catch (error: any) {
        // DETECT QUOTA ERRORS
        if (error.message && (error.message.includes("429") || error.message.includes("quota") || error.message.includes("resource exceeded"))) {
            console.warn("AI Quota Exceeded. Switching to offline mode.");
            setIsAIQuotaExceeded(true);
        } else {
            console.warn("AI API Error. Using Offline Fallback.", error);
        }
        runOfflineFallback();
    }
  }, [members, transactions, loans, isAIQuotaExceeded]);

  // --- NOTIFICATION ENGINE ---
  useEffect(() => {
    const generateNotifications = () => {
        const newNotes: Notification[] = [];
        
        loans.forEach(loan => {
            if (loan.status === 'Active') {
               const progress = (loan.amountPaid / loan.totalRepayable);
               if (progress < 0.5 && Math.random() > 0.7) {
                   newNotes.push({
                       id: `loan-rem-${loan.id}`,
                       title: 'Loan Repayment Due',
                       message: `${loan.memberName} has pending EMI.`,
                       type: 'warning',
                       date: 'Today',
                       read: false
                   });
               }
            }
        });

        if (syncStatus === 'offline') {
            newNotes.push({
                id: 'sync-warn',
                title: 'Sync Pending',
                message: 'You are offline.',
                type: 'alert',
                date: 'Now',
                read: false
            });
        }

        setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const uniqueNew = newNotes.filter(n => !existingIds.has(n.id));
            return [...uniqueNew, ...prev];
        });
    };

    generateNotifications();
  }, [loans, syncStatus]);

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // --- SYNC ENGINE ---
  const syncWithCloud = useCallback(async () => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      setIsSyncing(false);
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const cloudRaw = localStorage.getItem(CLOUD_MOCK_KEY);
      let cloudData: AppState = { members: [], transactions: [], meetings: [], loans: [] };
      
      if (cloudRaw) {
        try {
           const decrypted = decrypt(cloudRaw);
           cloudData = JSON.parse(decrypted);
        } catch (e) {
           console.error("Decryption failed");
        }
      } else {
        const encrypted = encrypt(JSON.stringify({ members, transactions, meetings, loans }));
        localStorage.setItem(CLOUD_MOCK_KEY, encrypted);
        setLastSynced(new Date());
        setSyncStatus('synced');
        setIsSyncing(false);
        return;
      }

      // Conflict Detection
      const newConflicts: Conflict[] = [];
      members.forEach(localMember => {
        const cloudMember = cloudData.members.find(m => m.id === localMember.id);
        if (cloudMember) {
           if (localMember.name !== cloudMember.name || localMember.savingsBalance !== cloudMember.savingsBalance) {
               newConflicts.push({
                   id: localMember.id,
                   type: 'member',
                   localData: localMember,
                   serverData: cloudMember,
                   description: `Member '${localMember.name}' has different details on server.`,
                   timestamp: Date.now()
               });
           }
        }
      });

      if (newConflicts.length > 0) {
          setConflicts(newConflicts);
          setSyncStatus('conflicted');
          setIsSyncing(false);
          return;
      }
      
      setConflicts([]);

      const encrypted = encrypt(JSON.stringify({ members, transactions, meetings, loans }));
      localStorage.setItem(CLOUD_MOCK_KEY, encrypted);
      
      setLastSynced(new Date());
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  }, [members, transactions, meetings, loans]);

  useEffect(() => {
    const handleOnline = () => syncWithCloud();
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
        const timer = setTimeout(syncWithCloud, 2000);
        return () => clearTimeout(timer);
    } else {
        setSyncStatus('offline');
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, [syncWithCloud]);

  const resolveConflict = (id: string, strategy: 'local' | 'server') => {
      const conflict = conflicts.find(c => c.id === id);
      if (!conflict) return;
      
      const winnerData = strategy === 'local' ? conflict.localData : conflict.serverData;

      if (strategy === 'server' && conflict.type === 'member') {
           setMembers(prev => prev.map(m => m.id === id ? winnerData : m));
      } 

      try {
          const cloudRaw = localStorage.getItem(CLOUD_MOCK_KEY);
          if (cloudRaw) {
              const cloudData = JSON.parse(decrypt(cloudRaw));
              if (conflict.type === 'member') {
                  cloudData.members = cloudData.members.map((m: any) => m.id === id ? winnerData : m);
              }
              localStorage.setItem(CLOUD_MOCK_KEY, encrypt(JSON.stringify(cloudData)));
          }
      } catch(e) { console.error("Cloud update error", e); }

      const remaining = conflicts.filter(c => c.id !== id);
      setConflicts(remaining);
      
      if (remaining.length === 0) {
          setSyncStatus('synced');
      }
      toast.success("Conflict Resolved");
  };

  const exportData = () => {
     const data = { members, transactions, meetings, loans, exportedAt: new Date().toISOString() };
     const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `SHG_Backup_${new Date().toISOString().slice(0,10)}.json`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     
     setTimeout(() => {
         toast.success("PDF Report Saved to Device", { icon: '📄' });
     }, 1000);
  };

  const simulateConflict = () => {
      if (members.length === 0) return;
      const target = members[0];
      const fakeCloudMember = { ...target, savingsBalance: target.savingsBalance + 500, name: target.name + " (Cloud)" };
      
      try {
          const cloudRaw = localStorage.getItem(CLOUD_MOCK_KEY);
          let cloudData = { members: [], transactions: [], meetings: [], loans: [] };
          if (cloudRaw) cloudData = JSON.parse(decrypt(cloudRaw));
          
          cloudData.members = cloudData.members.map((m: any) => m.id === target.id ? fakeCloudMember : m) as any;
          localStorage.setItem(CLOUD_MOCK_KEY, encrypt(JSON.stringify(cloudData)));
          
          setTimeout(syncWithCloud, 100);
          toast("Conflict simulated in cloud. Syncing...", { icon: '⚠️' });
      } catch(e) { console.error(e); }
  };

  // --- CRUD ---
  const stats = {
    totalSavings: members.reduce((sum, m) => sum + m.savingsBalance, 0),
    activeLoans: members.reduce((sum, m) => sum + m.loanOutstanding, 0),
  };

  const addMember = (m: Omit<Member, 'id' | 'attendanceRate' | 'savingsBalance' | 'loanOutstanding' | 'lastActive' | 'attendanceHistory'>) => {
    const newMember: Member = {
      ...m,
      id: generateId(),
      savingsBalance: 0,
      loanOutstanding: 0,
      attendanceRate: 100,
      attendanceHistory: [],
      lastActive: new Date().toISOString().split('T')[0],
    };
    setMembers(prev => [...prev, newMember]);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMember = (id: string) => {
    setTransactions(prev => prev.filter(t => t.memberId !== id));
    setMeetings(prev => prev.map(m => ({
        ...m,
        attendees: m.attendees.filter(a => a !== id),
        savingsCollected: (() => { const s = { ...m.savingsCollected }; delete s[id]; return s; })()
    })));
    setLoans(prev => prev.filter(l => l.memberId !== id));
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const addTransaction = (t: Omit<Transaction, 'id'> & { id?: string }) => {
    const newTx: Transaction = { ...t, id: t.id || generateId(), timestamp: Date.now() };
    setTransactions(prev => [newTx, ...prev]);

    if (t.memberId && t.type !== 'Expense') {
      setMembers(prev => prev.map(m => {
        if (m.id === t.memberId) {
          let newSavings = m.savingsBalance;
          let newLoan = m.loanOutstanding;
          if (t.type === 'Savings') newSavings += t.amount;
          else if (t.type === 'Loan Repayment') newLoan = Math.max(0, newLoan - t.amount);
          else if (t.type === 'New Loan') newLoan += t.amount;
          return { ...m, savingsBalance: newSavings, loanOutstanding: newLoan, lastActive: new Date().toISOString().split('T')[0] };
        }
        return m;
      }));
    }
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    if (tx.memberId && tx.type !== 'Expense') {
        setMembers(prev => prev.map(m => {
            if (m.id === tx.memberId) {
                let newSavings = m.savingsBalance;
                let newLoan = m.loanOutstanding;
                if (tx.type === 'Savings') newSavings -= tx.amount;
                else if (tx.type === 'Loan Repayment') newLoan += tx.amount;
                else if (tx.type === 'New Loan') newLoan -= tx.amount;
                return { ...m, savingsBalance: Math.max(0, newSavings), loanOutstanding: Math.max(0, newLoan) };
            }
            return m;
        }));
    }
    if (tx.loanId && tx.type === 'Loan Repayment') {
       setLoans(prev => prev.map(l => {
          if(l.id === tx.loanId) {
             return {
               ...l,
               amountPaid: Math.max(0, l.amountPaid - tx.amount),
               status: 'Active',
               repaymentHistory: l.repaymentHistory.filter(h => h.id !== tx.id)
             }
          }
          return l;
       }));
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addMeeting = (meeting: Omit<Meeting, 'id'>) => {
    const meetingId = generateId();
    const newMeeting: Meeting = { ...meeting, id: meetingId };
    setMeetings(prev => [newMeeting, ...prev]);

    setMembers(prev => prev.map(m => {
      const isPresent = meeting.attendees.includes(m.id);
      const newHistory = [{ date: meeting.date, status: isPresent ? 'Present' : 'Absent' } as const, ...m.attendanceHistory];
      const lastTen = newHistory.slice(0, 10);
      const presentCount = lastTen.filter(h => h.status === 'Present').length;
      return { ...m, attendanceHistory: newHistory, attendanceRate: Math.round((presentCount / lastTen.length) * 100) };
    }));

    Object.entries(meeting.savingsCollected).forEach(([memberId, amount]) => {
      if (amount > 0) addTransaction({ type: 'Savings', amount, date: meeting.date, memberId, memberName: members.find(m => m.id === memberId)?.name, description: 'Meeting Savings', meetingId });
    });

    Object.entries(meeting.loanRecovered || {}).forEach(([memberId, amount]) => {
        if (amount > 0) {
            const activeLoan = loans.find(l => l.memberId === memberId && l.status === 'Active');
            if (activeLoan) {
                const newAmountPaid = activeLoan.amountPaid + amount;
                const repaymentId = generateId();
                setLoans(prev => prev.map(l => l.id === activeLoan.id ? { ...l, amountPaid: newAmountPaid, status: newAmountPaid >= l.totalRepayable ? 'Completed' : 'Active', repaymentHistory: [{ id: repaymentId, date: meeting.date, amount, penalty: 0, balanceAfterRepayment: l.totalRepayable - newAmountPaid }, ...l.repaymentHistory] } : l));
                addTransaction({ id: repaymentId, type: 'Loan Repayment', amount, date: meeting.date, memberId, memberName: members.find(m => m.id === memberId)?.name, description: 'Meeting Repayment', meetingId, loanId: activeLoan.id });
            } else {
                 addTransaction({ type: 'Loan Repayment', amount, date: meeting.date, memberId, memberName: members.find(m => m.id === memberId)?.name, description: 'Meeting Repayment (Unlinked)', meetingId });
            }
        }
    });

    Object.entries(meeting.finesCollected || {}).forEach(([memberId, amount]) => {
        if (amount > 0) addTransaction({ type: 'Fine', amount, date: meeting.date, memberId, memberName: members.find(m => m.id === memberId)?.name, description: 'Meeting Fine', meetingId, penalty: amount });
    });
  };

  const deleteMeeting = (id: string) => {
    const meeting = meetings.find(m => m.id === id);
    if (!meeting) return;
    const txsToRemove = transactions.filter(t => t.meetingId === id);
    deleteMemberStateChanges(txsToRemove, meeting); 
    setTransactions(prev => prev.filter(t => t.meetingId !== id));
    setMeetings(prev => prev.filter(m => m.id !== id));
  };

  const deleteMemberStateChanges = (txs: Transaction[], meeting: Meeting) => {
      setMembers(prev => prev.map(m => {
        if (m.attendanceHistory[0]?.date === meeting.date) {
            return { ...m, attendanceHistory: m.attendanceHistory.slice(1) };
        }
        return m;
      }));
  };

  const addLoan = (loanData: Omit<Loan, 'id' | 'status' | 'amountPaid' | 'repaymentHistory' | 'endDate' | 'totalRepayable' | 'emiAmount'>) => {
    const interest = loanData.principal * (loanData.interestRate / 100) * (loanData.termMonths / 12);
    const totalRepayable = Math.round(loanData.principal + interest);
    const emiAmount = Math.round(totalRepayable / loanData.termMonths);
    const newLoan: Loan = {
      ...loanData, id: generateId(), status: 'Active', amountPaid: 0, repaymentHistory: [],
      totalRepayable, emiAmount, endDate: new Date(new Date().setMonth(new Date().getMonth() + loanData.termMonths)).toLocaleDateString('en-GB')
    };
    setLoans(prev => [newLoan, ...prev]);
    addTransaction({ type: 'New Loan', amount: loanData.principal, date: new Date().toLocaleDateString('en-GB'), memberId: loanData.memberId, memberName: loanData.memberName, description: `Loan Disbursement`, loanId: newLoan.id });
    setMembers(prev => prev.map(m => m.id === loanData.memberId ? { ...m, loanOutstanding: m.loanOutstanding + totalRepayable } : m));
  };

  const repayLoan = (loanId: string, amount: number, penalty: number) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;
    const newAmountPaid = loan.amountPaid + amount;
    const repaymentId = generateId();
    setLoans(prev => prev.map(l => l.id === loanId ? { ...l, amountPaid: newAmountPaid, status: newAmountPaid >= l.totalRepayable ? 'Completed' : 'Active', repaymentHistory: [{ id: repaymentId, date: new Date().toLocaleDateString('en-GB'), amount, penalty, balanceAfterRepayment: l.totalRepayable - newAmountPaid }, ...l.repaymentHistory] } : l));
    addTransaction({ id: repaymentId, type: penalty > 0 ? 'Fine' : 'Loan Repayment', amount: amount + penalty, date: new Date().toLocaleDateString('en-GB'), memberId: loan.memberId, memberName: loan.memberName, description: `Repayment`, loanId, penalty });
    setMembers(prev => prev.map(m => m.id === loan.memberId ? { ...m, loanOutstanding: Math.max(0, m.loanOutstanding - amount) } : m));
  };

  const refreshData = async () => { await syncWithCloud(); };

  return (
    <DataContext.Provider value={{ 
      members, transactions, meetings, loans, notifications, insights, aiSummary, isAIQuotaExceeded,
      addTransaction, addMember, updateMember, deleteMember, addMeeting, deleteMeeting, deleteTransaction,
      addLoan, repayLoan, refreshData, generateAIInsights, lastSynced, isSyncing, syncStatus, conflicts, resolveConflict, exportData, simulateConflict, markNotificationRead, stats 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};
