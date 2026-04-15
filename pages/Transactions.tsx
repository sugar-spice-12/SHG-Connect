
import React, { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import { Trash2, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { PermissionGate } from '../components/PermissionGate';
import toast from 'react-hot-toast';

export const Transactions: React.FC = () => {
  const { transactions, deleteTransaction } = useData();
  const { t } = useLanguage();
  const { currentUserRole, user } = useAuth();
  const { can, isMemberOnly } = useRBAC();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter transactions based on role
  // Members can only see their own transactions
  const displayedTransactions = useMemo(() => {
    if (can('view_transactions')) {
      return transactions; // Leaders and Animators can see all
    }
    // Members can only see their own transactions
    return transactions.filter(t => t.memberId === user?.memberId);
  }, [transactions, can, user?.memberId]);

  const confirmDelete = () => {
    if (deleteId) {
      deleteTransaction(deleteId);
      toast.success("Deleted successfully");
      setDeleteId(null);
    }
  };

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="pb-24 min-h-screen bg-background relative z-40"
    >
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-900/20 to-background pointer-events-none" />
      
      <Header title={t('history')} subtitle={t('allTransactions')} />

      <div className="px-6 space-y-3 mt-4">
          {displayedTransactions.length === 0 ? (
             <div className="text-center py-8 text-white/30 text-sm col-span-full glass-panel rounded-xl">{t('noTransactions')}</div>
          ) : (
            displayedTransactions.map((t) => (
              <div key={t.id} className="glass-panel p-4 rounded-xl flex items-center gap-4 group relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border border-white/5 shrink-0 ${t.type === 'Savings' ? 'bg-green-500/10 text-green-500' : t.type === 'Expense' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {t.type === 'Savings' ? '+' : t.type === 'Expense' ? '-' : 'R'}
                  </div>
                  <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-white truncate">{t.description}</h4>
                      <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                        <span>{t.memberName || 'Group'}</span>
                        <span>•</span>
                        <span>{t.date}</span>
                      </div>
                  </div>
                  <div className="text-right mr-8 shrink-0">
                    <span className={`font-bold text-sm ${t.type === 'Expense' || t.type === 'New Loan' ? 'text-white' : 'text-green-400'}`}>
                        {t.type === 'Expense' || t.type === 'New Loan' ? '-' : ''}₹{t.amount}
                    </span>
                  </div>
                  
                  <PermissionGate permission="delete_transaction">
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 text-white/30 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                  </PermissionGate>
              </div>
            ))
          )}
      </div>
    </motion.div>
  );
};