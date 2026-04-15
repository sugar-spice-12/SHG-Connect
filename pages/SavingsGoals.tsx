import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  ArrowLeft, 
  Plus, 
  TrendingUp, 
  Calendar,
  Users,
  User,
  Trophy,
  Sparkles,
  ChevronRight,
  X,
  Check,
  IndianRupee,
  Lock
} from 'lucide-react';
import { useHaptics } from '../hooks/useNative';
import { useLanguage } from '../context/LanguageContext';
import { useRBAC } from '../hooks/useRBAC';
import { PermissionGate } from '../components/PermissionGate';
import { SavingsGoal, SavingsContribution } from '../types';
import toast from 'react-hot-toast';

interface SavingsGoalsProps {
  onBack: () => void;
}

// Mock data - in real app, this would come from context/API
const mockGoals: SavingsGoal[] = [
  {
    id: '1',
    title: 'Emergency Fund',
    targetAmount: 50000,
    currentAmount: 32500,
    deadline: '2026-06-30',
    createdAt: '2025-01-01',
    type: 'group',
    status: 'active',
    contributions: [
      { id: 'c1', goalId: '1', memberId: 'm1', memberName: 'Lakshmi', amount: 5000, date: '2026-01-15' },
      { id: 'c2', goalId: '1', memberId: 'm2', memberName: 'Priya', amount: 3000, date: '2026-01-15' },
    ]
  },
  {
    id: '2',
    title: 'Festival Savings',
    targetAmount: 20000,
    currentAmount: 20000,
    deadline: '2025-10-15',
    createdAt: '2025-06-01',
    type: 'group',
    status: 'completed',
    contributions: []
  },
  {
    id: '3',
    title: 'My Education Fund',
    targetAmount: 15000,
    currentAmount: 8500,
    deadline: '2026-12-31',
    createdAt: '2025-09-01',
    type: 'individual',
    memberId: 'current-user',
    status: 'active',
    contributions: []
  }
];

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({ onBack }) => {
  const { tap, notify } = useHaptics();
  const { t } = useLanguage();
  const { can } = useRBAC();
  const [goals, setGoals] = useState<SavingsGoal[]>(mockGoals);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [filter, setFilter] = useState<'all' | 'group' | 'individual'>('all');

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    type: 'group' as 'group' | 'individual'
  });

  // Contribution form state
  const [contributionAmount, setContributionAmount] = useState('');

  const filteredGoals = goals.filter(g => {
    if (filter === 'all') return true;
    return g.type === filter;
  });

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.deadline) {
      toast.error(t('pleaseFillAllFields'));
      return;
    }

    const goal: SavingsGoal = {
      id: Date.now().toString(),
      title: newGoal.title,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline,
      createdAt: new Date().toISOString().split('T')[0],
      type: newGoal.type,
      status: 'active',
      contributions: []
    };

    setGoals([goal, ...goals]);
    setShowAddModal(false);
    setNewGoal({ title: '', targetAmount: '', deadline: '', type: 'group' });
    notify('success');
    toast.success(t('goalCreated'));
  };

  const handleContribute = () => {
    if (!selectedGoal || !contributionAmount) return;

    const amount = parseFloat(contributionAmount);
    if (amount <= 0) {
      toast.error(t('enterValidAmount'));
      return;
    }

    setGoals(goals.map(g => {
      if (g.id === selectedGoal.id) {
        const newAmount = Math.min(g.currentAmount + amount, g.targetAmount);
        const isCompleted = newAmount >= g.targetAmount;
        
        return {
          ...g,
          currentAmount: newAmount,
          status: isCompleted ? 'completed' : 'active',
          contributions: [
            ...g.contributions,
            {
              id: Date.now().toString(),
              goalId: g.id,
              memberId: 'current-user',
              memberName: 'You',
              amount,
              date: new Date().toISOString().split('T')[0]
            }
          ]
        };
      }
      return g;
    }));

    setShowContributeModal(false);
    setContributionAmount('');
    notify('success');
    toast.success(t('amountAdded', { amount: amount.toLocaleString() }));
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'from-green-500 to-emerald-500';
    if (progress >= 75) return 'from-blue-500 to-cyan-500';
    if (progress >= 50) return 'from-yellow-500 to-orange-500';
    return 'from-purple-500 to-pink-500';
  };

  const getDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return t('overdue');
    if (days === 0) return t('todayLabel');
    if (days === 1) return t('oneDayLeftLabel');
    return t('daysLeftLabel', { days });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background pb-24"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { tap('light'); onBack(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{t('savingsGoals')}</h1>
              <p className="text-xs text-white/50">{t('trackFinancialTargets')}</p>
            </div>
          </div>
          <PermissionGate permission="create_savings_goal">
            <button
              onClick={() => { tap('medium'); setShowAddModal(true); }}
              className="p-2 rounded-xl bg-primary hover:bg-primary/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </PermissionGate>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-2xl p-4 border border-primary/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-white/60">{t('totalSaved')}</p>
              <p className="text-2xl font-bold">₹{totalSaved.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">{t('progress')}</span>
              <span className="font-medium">{Math.round((totalSaved / totalTarget) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalSaved / totalTarget) * 100, 100)}%` }}
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
              />
            </div>
            <p className="text-xs text-white/40 text-right">
              {t('target')}: ₹{totalTarget.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: t('allGoals'), icon: Target },
            { id: 'group', label: t('group'), icon: Users },
            { id: 'individual', label: t('personal'), icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { tap('light'); setFilter(tab.id as any); }}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                filter === tab.id
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {filteredGoals.map((goal, index) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isCompleted = goal.status === 'completed';
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-surface rounded-2xl p-4 border ${
                  isCompleted ? 'border-green-500/30' : 'border-white/5'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-500/20' 
                        : goal.type === 'group' 
                          ? 'bg-blue-500/20' 
                          : 'bg-purple-500/20'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : goal.type === 'group' ? (
                        <Users className="w-5 h-5 text-blue-400" />
                      ) : (
                        <User className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-xs text-white/50 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {getDaysRemaining(goal.deadline)}
                      </p>
                    </div>
                  </div>
                  
                  {!isCompleted && (
                    <button
                      onClick={() => {
                        tap('light');
                        setSelectedGoal(goal);
                        setShowContributeModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors"
                    >
                      + {t('add')}
                    </button>
                  )}
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">
                      ₹{goal.currentAmount.toLocaleString()}
                    </span>
                    <span className="font-medium">
                      ₹{goal.targetAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      className={`h-full bg-gradient-to-r ${getProgressColor(progress)} rounded-full`}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/40">
                    <span>{Math.round(progress)}% {t('complete')}</span>
                    <span>₹{(goal.targetAmount - goal.currentAmount).toLocaleString()} {t('toGo')}</span>
                  </div>
                </div>

                {/* Recent Contributors */}
                {goal.contributions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-xs text-white/50 mb-2">{t('recentContributions')}</p>
                    <div className="flex flex-wrap gap-2">
                      {goal.contributions.slice(-3).map(c => (
                        <span key={c.id} className="text-xs bg-white/5 px-2 py-1 rounded-md">
                          {c.memberName}: ₹{c.amount.toLocaleString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredGoals.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">{t('noGoalsFound')}</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
            >
              {t('createFirstGoal')}
            </button>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t('newSavingsGoal')}</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('goalTitle')}</label>
                  <input
                    type="text"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                    placeholder={t('goalTitlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('targetAmount')} (₹)</label>
                  <input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('deadline')}</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('goalType')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setNewGoal({ ...newGoal, type: 'group' })}
                      className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                        newGoal.type === 'group'
                          ? 'border-primary bg-primary/20'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span>{t('groupGoal')}</span>
                    </button>
                    <button
                      onClick={() => setNewGoal({ ...newGoal, type: 'individual' })}
                      className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
                        newGoal.type === 'individual'
                          ? 'border-primary bg-primary/20'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span>{t('personal')}</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddGoal}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
                >
                  {t('createGoal')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribute Modal */}
      <AnimatePresence>
        {showContributeModal && selectedGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowContributeModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">{t('addContribution')}</h2>
                  <p className="text-sm text-white/50">{selectedGoal.title}</p>
                </div>
                <button
                  onClick={() => setShowContributeModal(false)}
                  className="p-2 rounded-xl bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">{t('current')}</span>
                    <span>₹{selectedGoal.currentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">{t('remaining')}</span>
                    <span className="text-primary">
                      ₹{(selectedGoal.targetAmount - selectedGoal.currentAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('amountToAdd')} (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-xl font-bold focus:outline-none focus:border-primary"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Quick amounts */}
                <div className="flex gap-2 flex-wrap">
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setContributionAmount(amt.toString())}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-sm hover:bg-white/20"
                    >
                      ₹{amt.toLocaleString()}
                    </button>
                  ))}
                  <button
                    onClick={() => setContributionAmount(
                      (selectedGoal.targetAmount - selectedGoal.currentAmount).toString()
                    )}
                    className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm"
                  >
                    {t('completeGoal')}
                  </button>
                </div>

                <button
                  onClick={handleContribute}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
                >
                  {t('add')} ₹{contributionAmount ? parseFloat(contributionAmount).toLocaleString() : '0'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
