
import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Wallet, AlertCircle, CalendarCheck, TrendingUp, Edit2, Save, Camera, FileText, CreditCard, Trash2, Download, Upload, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { canViewDocuments, maskPhone, privacyNotice } from '../lib/privacy';
import toast from 'react-hot-toast';

interface MemberProfileProps {
  memberId: string;
  onBack: () => void;
}

const LOAN_COLORS = ['#10B981', '#374151'];

export const MemberProfile: React.FC<MemberProfileProps> = ({ memberId, onBack }) => {
  const { members, transactions, updateMember, deleteMember, loans } = useData();
  const { t, language } = useLanguage();
  const { user, currentUserRole } = useAuth();
  const member = members.find(m => m.id === memberId);
  const memberTransactions = transactions.filter(t => t.memberId === memberId).slice(0, 5);
  
  const [activeTab, setActiveTab] = useState<'overview' | 'passbook'>('overview');
  const [passbookFilter, setPassbookFilter] = useState<'savings' | 'loans' | 'fines'>('savings');

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(member?.name || '');
  const [editPhone, setEditPhone] = useState(member?.phoneNumber || '');
  const [editRole, setEditRole] = useState(member?.role || 'Member');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Refs for file upload
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const passbookInputRef = useRef<HTMLInputElement>(null);

  if (!member) return null;

  // Privacy check - can current user view this member's sensitive data?
  const currentUserId = user?.id || '';
  const isOwnProfile = currentUserId === memberId;
  const canViewSensitive = canViewDocuments(currentUserRole, currentUserId, memberId);

  // Generate savings data dynamically based on current balance for visualization
  const generateSavingsCurve = () => {
    const data = [];
    let current = member.savingsBalance;
    for (let i = 0; i < 6; i++) {
      data.unshift({ month: i === 0 ? 'Current' : `${i}m ago`, amount: Math.max(0, current) });
      current -= (Math.random() * 500 + 100);
    }
    return data;
  };
  
  const savingsData = generateSavingsCurve();

  const loanData = [
    { name: 'Repaid', value: 100 - (member.loanOutstanding > 0 ? 35 : 100) }, // Mock logic for visuals
    { name: 'Remaining', value: member.loanOutstanding > 0 ? 35 : 0 },
  ];

  const handleSaveProfile = () => {
    updateMember(member.id, {
      name: editName,
      phoneNumber: editPhone,
      role: editRole
    });
    setIsEditing(false);
    toast.success("Profile updated");
  };

  const confirmDelete = () => {
    deleteMember(member.id);
    toast.success(t('deleted'));
    onBack();
  };

  const downloadPassbook = () => {
    toast.success(t('digitalPassbook') + " Downloaded", { icon: '📥' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'aadhaarUrl' | 'passbookUrl') => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              updateMember(member.id, { [field]: reader.result as string });
              toast.success("Document Uploaded");
          };
          reader.readAsDataURL(file);
      }
  };

  // --- PASSBOOK HELPERS ---
  const getSavingsLedger = () => {
    // Sort Chronologically (Oldest First) for calculation
    const savingsTx = transactions
        .filter(t => t.memberId === memberId && t.type === 'Savings')
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    let runningBalance = 0;
    return savingsTx.map(tx => {
        runningBalance += tx.amount;
        return { ...tx, balance: runningBalance };
    }).reverse(); // Show Newest First
  };

  const getMemberLoans = () => {
    return loans.filter(l => l.memberId === memberId);
  };

  const getFines = () => {
     return transactions.filter(t => t.memberId === memberId && t.type === 'Fine');
  };

  const renderOverview = () => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: 10 }}
        className="space-y-8"
    >
        {/* Documents Section - Privacy Protected */}
        <div>
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3 ml-1">{t('documents')}</h3>
          
          {/* Privacy Notice for non-owners */}
          {!canViewSensitive && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <ShieldAlert size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/80">
                {privacyNotice[language]}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
             {/* Hidden Inputs - Only for own profile */}
             {canViewSensitive && (
               <>
                 <input 
                    type="file" 
                    ref={aadhaarInputRef} 
                    hidden 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'aadhaarUrl')}
                 />
                 <input 
                    type="file" 
                    ref={passbookInputRef} 
                    hidden 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, 'passbookUrl')}
                 />
               </>
             )}

             {/* Aadhaar Card */}
             <div 
                onClick={() => canViewSensitive && aadhaarInputRef.current?.click()}
                className={`glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-3 border border-dashed border-white/20 min-h-[120px] relative group ${
                  canViewSensitive ? 'hover:bg-white/5 cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
             >
                {canViewSensitive ? (
                  // Owner can see their documents
                  member.aadhaarUrl ? (
                    <>
                       <img src={member.aadhaarUrl} className="w-full h-20 object-cover rounded-lg opacity-70 group-hover:opacity-40 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Upload size={24} className="text-white" />
                       </div>
                    </>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <CreditCard size={24} />
                    </div>
                  )
                ) : (
                  // Others see locked icon
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                    <EyeOff size={24} />
                  </div>
                )}
                <div className="text-center">
                   <p className="text-sm font-medium">{t('aadhaar')}</p>
                   <p className="text-[10px] text-white/40">
                     {canViewSensitive 
                       ? (member.aadhaarUrl ? 'Tap to change' : 'Tap to upload')
                       : 'Protected'
                     }
                   </p>
                </div>
             </div>

             {/* Bank Passbook */}
             <div 
                onClick={() => canViewSensitive && passbookInputRef.current?.click()}
                className={`glass-panel p-4 rounded-2xl flex flex-col items-center justify-center gap-3 border border-dashed border-white/20 min-h-[120px] relative group ${
                  canViewSensitive ? 'hover:bg-white/5 cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
             >
                {canViewSensitive ? (
                  // Owner can see their documents
                  member.passbookUrl ? (
                    <>
                       <img src={member.passbookUrl} className="w-full h-20 object-cover rounded-lg opacity-70 group-hover:opacity-40 transition-opacity" />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Upload size={24} className="text-white" />
                       </div>
                    </>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                      <FileText size={24} />
                    </div>
                  )
                ) : (
                  // Others see locked icon
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                    <EyeOff size={24} />
                  </div>
                )}
                <div className="text-center">
                   <p className="text-sm font-medium">{t('passbook')}</p>
                   <p className="text-[10px] text-white/40">
                     {canViewSensitive 
                       ? (member.passbookUrl ? 'Tap to change' : 'Tap to upload')
                       : 'Protected'
                     }
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Savings Card */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-blue-600 to-indigo-800 shadow-lg shadow-blue-900/20">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Wallet size={40} />
                </div>
                <p className="text-blue-100 text-xs font-medium mb-1 opacity-80">TOTAL SAVINGS</p>
                <h3 className="text-3xl font-bold text-white mb-4">₹{member.savingsBalance.toLocaleString()}</h3>
                <div className="flex items-center gap-2 text-xs text-blue-100 bg-white/10 w-fit px-2 py-1 rounded-lg backdrop-blur-md">
                    <TrendingUp size={12} /> Updated
                </div>
            </div>

            {/* Loan Card */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-900/20">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <AlertCircle size={40} />
                </div>
                <p className="text-orange-100 text-xs font-medium mb-1 opacity-80">LOAN OUTSTANDING</p>
                <h3 className="text-3xl font-bold text-white mb-4">₹{member.loanOutstanding.toLocaleString()}</h3>
                <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-white h-full rounded-full" style={{ width: `${loanData[0].value}%` }} />
                </div>
                <p className="text-[10px] text-orange-100 mt-2 text-right">{loanData[0].value}% Repaid</p>
            </div>

            {/* Attendance Card */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-900/20">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <CalendarCheck size={40} />
                </div>
                <p className="text-purple-100 text-xs font-medium mb-1 opacity-80">ATTENDANCE RATE</p>
                <h3 className="text-3xl font-bold text-white mb-4">{member.attendanceRate}%</h3>
                <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 5 ? 'bg-white' : 'bg-white/30'}`} />
                    ))}
                </div>
                <p className="text-[10px] text-purple-100 mt-2">Based on last meetings</p>
            </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Savings Trend Chart */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-3xl">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    Savings Growth <span className="text-xs font-normal text-white/50 bg-white/5 px-2 py-1 rounded-lg">Estimated</span>
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={savingsData}>
                            <defs>
                                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Loan Repayment Pie */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col items-center justify-center relative">
                <h3 className="font-bold text-lg mb-2 w-full text-left">Loan Status</h3>
                <div className="h-40 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={loanData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {loanData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={LOAN_COLORS[index % LOAN_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-white">{loanData[0].value}%</span>
                        <span className="text-[10px] text-white/50">PAID</span>
                    </div>
                </div>
                <div className="flex justify-between w-full mt-2 px-4">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                        <div className="w-2 h-2 rounded-full bg-green-500" /> Repaid
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                        <div className="w-2 h-2 rounded-full bg-gray-700" /> Due
                    </div>
                </div>
            </div>
        </div>

        {/* Recent Activity */}
        <div>
            <h3 className="font-bold text-lg mb-4">{t('recentActivity')}</h3>
            <div className="flex flex-col gap-3">
                {memberTransactions.map((t) => (
                    <div key={t.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                            ${t.type === 'Savings' ? 'bg-green-500/10 text-green-500' : 
                              t.type === 'Loan Repayment' ? 'bg-purple-500/10 text-purple-500' : 
                              'bg-red-500/10 text-red-500'}`}>
                            {t.type === 'Savings' ? <TrendingUp size={20} /> : <Wallet size={20} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-white">{t.description}</h4>
                            <p className="text-xs text-white/40">{t.date}</p>
                        </div>
                        <div className="text-right">
                            <span className={`font-bold block ${t.type === 'Expense' ? 'text-white' : 'text-green-400'}`}>
                                {t.type === 'Expense' ? '-' : ''}₹{t.amount}
                            </span>
                            <span className="text-[10px] text-white/30 uppercase">{t.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </motion.div>
  );

  const renderPassbook = () => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="space-y-4"
    >
        {/* Passbook Header Actions */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            <button 
                onClick={() => setPassbookFilter('savings')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${passbookFilter === 'savings' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/60'}`}
            >
                {t('savings')} {t('ledger')}
            </button>
            <button 
                onClick={() => setPassbookFilter('loans')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${passbookFilter === 'loans' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/60'}`}
            >
                {t('loans')} {t('ledger')}
            </button>
            <button 
                onClick={() => setPassbookFilter('fines')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${passbookFilter === 'fines' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/60'}`}
            >
                {t('fines')}
            </button>
        </div>

        {/* SAVINGS LEDGER */}
        {passbookFilter === 'savings' && (
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-white">{t('savings')} {t('ledger')}</h4>
                        <p className="text-[10px] text-white/40">Running Balance</p>
                    </div>
                    <button onClick={downloadPassbook} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70">
                        <Download size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white/40 uppercase bg-white/5">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Desc</th>
                                <th className="px-4 py-3 text-right">{t('credit')}</th>
                                <th className="px-4 py-3 text-right">{t('balance')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {getSavingsLedger().map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-white/70">{tx.date}</td>
                                    <td className="px-4 py-3 text-white/90 font-medium">{tx.description || 'Savings'}</td>
                                    <td className="px-4 py-3 text-right text-green-400 font-medium">+₹{tx.amount}</td>
                                    <td className="px-4 py-3 text-right font-bold">₹{tx.balance}</td>
                                </tr>
                            ))}
                            {getSavingsLedger().length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-white/30">No savings records</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* LOANS LEDGER */}
        {passbookFilter === 'loans' && (
            <div className="space-y-4">
                {getMemberLoans().length === 0 ? (
                    <div className="glass-panel p-8 text-center text-white/30 rounded-2xl">No loans found</div>
                ) : (
                    getMemberLoans().map(loan => (
                        <div key={loan.id} className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                            <div className="p-4 bg-gradient-to-r from-gray-900 to-[#1C1C1E] border-b border-white/10">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-bold text-white">{t('loanStatus')}: {loan.status}</h4>
                                        <p className="text-xs text-white/40">Principal: ₹{loan.principal} @ {loan.interestRate}%</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${loan.status === 'Active' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {loan.status.toUpperCase()}
                                    </span>
                                </div>
                                <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                                    <div className="bg-blue-500 h-full" style={{ width: `${(loan.amountPaid / loan.totalRepayable) * 100}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] mt-1 text-white/50">
                                    <span>Paid: ₹{loan.amountPaid}</span>
                                    <span>Total: ₹{loan.totalRepayable}</span>
                                </div>
                            </div>
                            <div className="bg-black/20">
                                <div className="px-4 py-2 text-xs font-bold text-white/30 uppercase tracking-wider">Repayment History</div>
                                {loan.repaymentHistory && loan.repaymentHistory.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {loan.repaymentHistory.map(h => (
                                            <div key={h.id} className="flex justify-between items-center px-4 py-2 text-xs">
                                                <span className="text-white/60">{h.date}</span>
                                                <div className="flex gap-3">
                                                    <span className="text-white font-bold">₹{h.amount}</span>
                                                    {h.penalty > 0 && <span className="text-red-400">+₹{h.penalty} Fine</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 text-xs text-white/30 italic">No repayments yet</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* FINES LEDGER */}
        {passbookFilter === 'fines' && (
            <div className="glass-panel rounded-2xl overflow-hidden">
                 <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h4 className="font-bold text-white">{t('fines')} & Penalties</h4>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-white/40 uppercase bg-white/5">
                        <tr>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Reason</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {getFines().map((tx) => (
                            <tr key={tx.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-white/70">{tx.date}</td>
                                <td className="px-4 py-3 text-white/90">{tx.description}</td>
                                <td className="px-4 py-3 text-right text-red-400 font-bold">-₹{tx.amount}</td>
                            </tr>
                        ))}
                        {getFines().length === 0 && (
                             <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-white/30">No fines recorded</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className="pb-24 min-h-screen bg-[#0D0D0F]"
    >
      <Header 
        title={isEditing ? t('editProfile') : `${member.name.split(' ')[0]}'s Profile`} 
        subtitle={isEditing ? '' : member.role} 
        showProfile={false} 
        onBack={onBack} 
      />

      <div className="px-6 md:px-8 max-w-7xl mx-auto">
        
        {/* Profile Header Card */}
        <div className="glass-panel p-6 rounded-3xl mb-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500" />
            
            <div className="relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-600">
                    <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-full object-cover border-4 border-[#0D0D0F]" />
                </div>
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer">
                    <Camera className="text-white" />
                  </div>
                )}
            </div>
            
            <div className="flex-1 text-center md:text-left w-full">
                {isEditing ? (
                  <div className="space-y-3 w-full">
                    <input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white font-bold text-lg outline-none focus:border-blue-500"
                      placeholder="Full Name"
                    />
                    <input 
                      value={editPhone} 
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500"
                      placeholder="Phone Number"
                    />
                    <select 
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                    >
                      <option value="Member" className="text-black">Member</option>
                      <option value="Leader" className="text-black">Leader</option>
                      <option value="Animator" className="text-black">Animator</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{member.name}</h2>
                    <p className="text-white/50 mb-4 text-sm md:text-base flex items-center justify-center md:justify-start gap-2">
                      <span>ID: SHG-{member.id.substring(0, 4)}</span>
                      <span>•</span>
                      <span>{member.phoneNumber || 'No Phone'}</span>
                    </p>
                  </>
                )}
                
                <div className="flex justify-center md:justify-start gap-3 mt-4">
                    {isEditing ? (
                      <button onClick={handleSaveProfile} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition-colors text-sm font-bold text-white">
                          <Save size={16} /> Save
                      </button>
                    ) : (
                      <>
                        {member.phoneNumber && (
                          <button onClick={() => window.location.href = `tel:${member.phoneNumber}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
                              <Phone size={16} className="text-green-400" /> Call
                          </button>
                        )}
                        <button onClick={() => {
                            setEditName(member.name);
                            setEditPhone(member.phoneNumber || '');
                            setEditRole(member.role);
                            setIsEditing(true);
                          }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
                            <Edit2 size={16} /> Edit
                        </button>
                      </>
                    )}
                </div>
            </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-4 border-b border-white/10 mb-6">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-2 text-sm font-medium transition-all relative ${activeTab === 'overview' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
                {t('overview')}
                {activeTab === 'overview' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
            <button 
                onClick={() => setActiveTab('passbook')}
                className={`pb-3 px-2 text-sm font-medium transition-all relative ${activeTab === 'passbook' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
            >
                {t('digitalPassbook')}
                {activeTab === 'passbook' && <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
        </div>

        <AnimatePresence mode="wait">
            {activeTab === 'overview' ? renderOverview() : renderPassbook()}
        </AnimatePresence>

        {isEditing && (
            <div className="mt-8 flex justify-center">
                <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer"
                >
                    <Trash2 size={18} /> {t('deleteMember')}
                </button>
            </div>
        )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">{t('deleteConfirm')}</h3>
              <p className="text-white/50 text-sm mb-6">This member and all their history will be permanently deleted.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
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
      </div>
    </motion.div>
  );
};