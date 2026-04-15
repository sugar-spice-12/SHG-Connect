
import React, { useMemo, useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { FeaturedCard } from '../components/FeaturedCard';
import { ConflictResolver } from '../components/ConflictResolver';
import { QuickActions } from '../components/QuickActions';
import { WifiOff, RefreshCw, ArrowUpRight, ArrowDownLeft, AlertTriangle, Cloud, Sparkles, Lightbulb, Zap, X } from 'lucide-react';
import { View } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface DashboardProps {
  onChangeView: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onChangeView }) => {
  const { stats, transactions, refreshData, lastSynced, isSyncing, syncStatus, conflicts, resolveConflict, insights, generateAIInsights, members } = useData();
  const { t, language } = useLanguage();
  const { currentUserRole, user } = useAuth();
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  // Trigger AI analysis when language changes or data loads
  useEffect(() => {
     const timer = setTimeout(() => {
         generateAIInsights(language);
     }, 1000);
     return () => clearTimeout(timer);
  }, [language]);

  // Format last synced time
  const timeSinceSync = useMemo(() => {
    const diff = Math.floor((new Date().getTime() - lastSynced.getTime()) / 60000);
    if (diff < 1) return t('justNow');
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  }, [lastSynced, t]);

  const handleRefresh = async () => {
    await refreshData();
    await generateAIInsights(language);
    toast.success(t('synced'), {
      icon: '☁️',
      style: { borderRadius: '10px', background: '#333', color: '#fff' },
    });
  };

  // --- ROLE BASED STATS LOGIC ---
  // If Animator, calculate only their personal stats
  const displayStats = useMemo(() => {
    if (currentUserRole === 'Animator' && user?.memberId) {
        const me = members.find(m => m.id === user.memberId);
        if (me) {
            return {
                totalSavings: me.savingsBalance,
                activeLoans: me.loanOutstanding
            };
        }
        return { totalSavings: 0, activeLoans: 0 };
    }
    return stats;
  }, [currentUserRole, user, members, stats]);

  const savingsGoal = 100000;
  const loanLimit = 100000;
  const savingsProgress = Math.min((displayStats.totalSavings / savingsGoal) * 100, 100);
  const loanProgress = Math.min((displayStats.activeLoans / loanLimit) * 100, 100);

  const activeInsights = insights.filter(i => !dismissedInsights.includes(i.id));
  
  // Animators don't see group transactions in activity list, only theirs
  const displayTransactions = useMemo(() => {
      if (currentUserRole === 'Animator' && user?.memberId) {
          return transactions.filter(t => t.memberId === user.memberId).slice(0, 5);
      }
      return transactions.slice(0, 5);
  }, [transactions, currentUserRole, user]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="pb-20"
    >
      <Header 
        onProfileClick={() => onChangeView('settings')} 
        subtitle={
            currentUserRole === 'Animator' ? 'My Dashboard' : 
            currentUserRole === 'CRP' ? 'Cluster View' : 
            'Leader Dashboard'
        } 
      />
      
      {/* Status Bar */}
      <div className="px-6 mb-4 flex items-center gap-2 text-xs text-white/40 max-w-7xl mx-auto overflow-x-auto hide-scrollbar">
        {syncStatus === 'offline' ? (
          <div className="flex items-center gap-1.5 bg-orange-500/10 px-2 py-1 rounded-md text-orange-400 border border-orange-500/20 whitespace-nowrap">
              <WifiOff size={12} />
              <span className="font-medium">{t('offlineMode')}</span>
          </div>
        ) : syncStatus === 'conflicted' ? (
           <button onClick={() => setShowConflictModal(true)} className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-md text-red-400 border border-red-500/20 whitespace-nowrap animate-pulse">
              <AlertTriangle size={12} />
              <span className="font-medium">{t('conflictsFound')} ({conflicts.length})</span>
           </button>
        ) : (
          <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-md text-green-400 border border-green-500/20 whitespace-nowrap">
              <Cloud size={12} />
              <span className="font-medium">{t('synced')}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-1 rounded-md text-purple-400 border border-purple-500/20 whitespace-nowrap">
             <span className="font-medium">{currentUserRole}</span>
        </div>

        <button 
          onClick={handleRefresh}
          className="flex items-center gap-1 ml-auto active:opacity-50 transition-opacity whitespace-nowrap"
          disabled={isSyncing}
        >
            <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? t('syncing') : `${t('lastBackup')}: ${timeSinceSync}`}
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Conflict Alert */}
        <AnimatePresence>
            {syncStatus === 'conflicted' && (
                <motion.div 
                   initial={{ height: 0, opacity: 0 }} 
                   animate={{ height: 'auto', opacity: 1 }}
                   exit={{ height: 0, opacity: 0 }}
                   className="px-6 mb-4"
                >
                    <div onClick={() => setShowConflictModal(true)} className="glass-panel p-4 rounded-2xl border border-red-500/30 bg-red-900/10 flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">{t('conflictsFound')}</h4>
                                <p className="text-xs text-white/50">Tap to resolve {conflicts.length} data mismatch(es)</p>
                            </div>
                        </div>
                        <div className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">Resolve</div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* Smart AI Insights Section - Hide for Animator */}
        <AnimatePresence>
        {activeInsights.length > 0 && currentUserRole !== 'Animator' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-6"
          >
            <div className="glass-panel-strong p-5 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-yellow-400 animate-pulse-soft" />
                        <span className="text-xs font-extrabold text-blue-200 uppercase tracking-widest">SHG Connect AI Insights</span>
                    </div>
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/50">{activeInsights.length} new</span>
                </div>

                <div className="space-y-3 relative z-10">
                    {activeInsights.slice(0, 3).map(insight => (
                        <motion.div 
                          key={insight.id} 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: 20, opacity: 0 }}
                          className={`flex gap-3 items-start p-3 rounded-xl border backdrop-blur-sm transition-all
                            ${insight.severity === 'high' ? 'bg-red-500/10 border-red-500/20' : 'bg-black/20 border-white/5'}`}
                        >
                             <div className="mt-0.5 shrink-0">
                               {insight.type === 'anomaly' || insight.type === 'alert' ? <AlertTriangle size={18} className="text-red-400" /> : 
                                insight.type === 'prediction' ? <Zap size={18} className="text-green-400" /> :
                                <Lightbulb size={18} className="text-yellow-400" />}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <h5 className={`text-sm font-bold mb-1 ${insight.severity === 'high' ? 'text-red-300' : 'text-white'}`}>{insight.title}</h5>
                                 <p className="text-xs text-white/70 leading-relaxed">{insight.message}</p>
                             </div>
                             <button 
                               onClick={() => setDismissedInsights(prev => [...prev, insight.id])}
                               className="p-1 text-white/20 hover:text-white transition-colors"
                             >
                               <X size={14} />
                             </button>
                        </motion.div>
                    ))}
                </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-0 lg:px-6">
            {/* Main Action Card */}
            <div className="lg:col-span-2">
                {currentUserRole === 'SHG Leader' && (
                    <FeaturedCard 
                    title={t('recordSavings')}
                    subtitle={`${t('weeklyCollection')} • ${new Date().toLocaleDateString('en-US', { weekday: 'short' })}`}
                    date={new Date().getDate().toString()}
                    onClick={() => onChangeView('meetings')}
                    />
                )}
                
                {/* Stats Grid */}
                <div className="px-6 lg:px-0 grid grid-cols-2 gap-3 mb-6 lg:mb-0">
                  <div className="glass-panel p-4 rounded-2xl relative overflow-hidden flex flex-col justify-center group hover:bg-white/5 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-20">
                      <ArrowUpRight className="text-green-400 group-hover:scale-110 transition-transform" size={24} />
                    </div>
                    <p className="text-white/50 text-xs mb-1 font-medium">{currentUserRole === 'Animator' ? 'My Savings' : t('totalSavings')}</p>
                    <h4 className="text-2xl font-bold tracking-tight">₹{(displayStats.totalSavings / 1000).toFixed(1)}k</h4>
                    <div className="mt-3 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                          className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all duration-1000" 
                          style={{ width: `${savingsProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="glass-panel p-4 rounded-2xl relative overflow-hidden flex flex-col justify-center group hover:bg-white/5 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-20">
                      <ArrowDownLeft className="text-red-400 group-hover:scale-110 transition-transform" size={24} />
                    </div>
                    <p className="text-white/50 text-xs mb-1 font-medium">{currentUserRole === 'Animator' ? 'My Loans' : t('activeLoans')}</p>
                    <h4 className="text-2xl font-bold tracking-tight">₹{(displayStats.activeLoans / 1000).toFixed(1)}k</h4>
                    <div className="mt-3 w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                          className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full shadow-[0_0_10px_rgba(248,113,113,0.5)] transition-all duration-1000" 
                          style={{ width: `${loanProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-3">
              <QuickActions onNavigate={onChangeView} />
            </div>

            {/* Recent Activity */}
            <div className="px-6 lg:px-0 lg:h-full">
              <div className="glass-panel rounded-3xl p-5 h-full min-h-[300px]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold">{t('recentActivity')}</h3>
                      <button 
                        onClick={() => onChangeView('transactions')}
                        className="text-xs text-blue-400 font-medium hover:text-blue-300"
                      >
                        {t('viewAll')}
                      </button>
                  </div>

                  <div className="space-y-3">
                      {displayTransactions.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-sm">
                          {t('noTransactions')}
                        </div>
                      ) : (
                        displayTransactions.map((t) => (
                          <div key={t.id} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border border-white/5 shrink-0
                                  ${t.type === 'Savings' ? 'bg-green-500/10 text-green-500' : 
                                    t.type === 'Loan Repayment' ? 'bg-purple-500/10 text-purple-500' : 
                                    t.type.includes('Loan') ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {t.type === 'Savings' ? '+' : t.type === 'Loan Repayment' ? 'R' : t.type === 'New Loan' ? 'L' : '-'}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-white truncate">{t.description}</h4>
                                  <p className="text-xs text-white/40 mt-0.5 truncate">{t.memberName || 'Group Transaction'}</p>
                              </div>
                              <div className="text-right shrink-0">
                                  <span className={`font-bold block text-sm ${t.type === 'Expense' || t.type === 'New Loan' ? 'text-white' : 'text-green-400'}`}>
                                      {t.type === 'Expense' || t.type === 'New Loan' ? '-' : ''}₹{t.amount}
                                  </span>
                                  <span className="text-[10px] text-white/30">{t.date}</span>
                              </div>
                          </div>
                        ))
                      )}
                  </div>
              </div>
            </div>
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      <AnimatePresence>
        {showConflictModal && conflicts.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConflictModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <div className="relative z-10 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
                {conflicts.map(conflict => (
                    <ConflictResolver 
                        key={conflict.id} 
                        conflict={conflict} 
                        onResolve={resolveConflict} 
                    />
                ))}
                <div className="text-center">
                    <button onClick={() => setShowConflictModal(false)} className="text-white/50 text-sm underline">Cancel</button>
                </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
