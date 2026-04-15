import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote, 
  ArrowLeft, 
  Plus, 
  Check, 
  Clock, 
  Users,
  X,
  BarChart3,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Trash2,
  Share2
} from 'lucide-react';
import { useHaptics, useShare } from '../hooks/useNative';
import { useLanguage } from '../context/LanguageContext';
import { VotingPoll, VotingOption } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { PermissionGate } from '../components/PermissionGate';
import toast from 'react-hot-toast';

interface VotingProps {
  onBack: () => void;
}

const mockPolls: VotingPoll[] = [
  {
    id: '1',
    question: 'Should we increase the monthly savings amount?',
    description: 'Proposal to increase from ₹500 to ₹750 per month',
    options: [
      { id: 'o1', text: 'Yes, increase to ₹750', votes: ['u1', 'u2', 'u3', 'u4', 'u5'] },
      { id: 'o2', text: 'No, keep at ₹500', votes: ['u6', 'u7'] },
      { id: 'o3', text: 'Increase to ₹1000', votes: ['u8'] }
    ],
    createdBy: 'leader1',
    createdByName: 'Lakshmi',
    createdAt: '2026-01-25T10:00:00',
    endsAt: '2026-02-01T23:59:59',
    status: 'active',
    isAnonymous: false,
    allowMultiple: false,
    totalVotes: 8
  },
  {
    id: '2',
    question: 'Best day for weekly meetings?',
    options: [
      { id: 'o1', text: 'Sunday', votes: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'] },
      { id: 'o2', text: 'Saturday', votes: ['u7', 'u8', 'u9'] },
      { id: 'o3', text: 'Wednesday', votes: ['u10'] }
    ],
    createdBy: 'leader1',
    createdByName: 'Lakshmi',
    createdAt: '2026-01-20T10:00:00',
    endsAt: '2026-01-27T23:59:59',
    status: 'closed',
    isAnonymous: true,
    allowMultiple: false,
    totalVotes: 10
  }
];

export const Voting: React.FC<VotingProps> = ({ onBack }) => {
  const { tap, notify } = useHaptics();
  const { share } = useShare();
  const { t } = useLanguage();
  const { user, currentUserRole } = useAuth();
  const { can } = useRBAC();
  
  const [polls, setPolls] = useState<VotingPoll[]>(mockPolls);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'active' | 'closed'>('active');
  
  // New poll form
  const [newPoll, setNewPoll] = useState({
    question: '',
    description: '',
    options: ['', ''],
    endsAt: '',
    isAnonymous: false,
    allowMultiple: false
  });

  const currentUserId = user?.id || 'current-user';
  const canCreate = can('create_poll');

  const filteredPolls = polls.filter(p => p.status === filter);

  const hasVoted = (poll: VotingPoll) => {
    return poll.options.some(o => o.votes.includes(currentUserId));
  };

  const getVotedOption = (poll: VotingPoll) => {
    return poll.options.find(o => o.votes.includes(currentUserId))?.id;
  };

  const handleVote = (pollId: string, optionId: string) => {
    tap('medium');
    
    setPolls(polls.map(poll => {
      if (poll.id !== pollId || poll.status === 'closed') return poll;
      
      // Remove previous vote if not allowing multiple
      const updatedOptions = poll.options.map(opt => {
        if (!poll.allowMultiple) {
          // Remove user from all options first
          const filteredVotes = opt.votes.filter(v => v !== currentUserId);
          // Add vote to selected option
          if (opt.id === optionId) {
            return { ...opt, votes: [...filteredVotes, currentUserId] };
          }
          return { ...opt, votes: filteredVotes };
        } else {
          // Toggle vote for multiple choice
          if (opt.id === optionId) {
            if (opt.votes.includes(currentUserId)) {
              return { ...opt, votes: opt.votes.filter(v => v !== currentUserId) };
            }
            return { ...opt, votes: [...opt.votes, currentUserId] };
          }
          return opt;
        }
      });

      const totalVotes = new Set(updatedOptions.flatMap(o => o.votes)).size;
      
      return { ...poll, options: updatedOptions, totalVotes };
    }));

    notify('success');
    toast.success(t('voteRecorded'));
  };

  const handleCreatePoll = () => {
    const validOptions = newPoll.options.filter(o => o.trim());
    
    if (!newPoll.question || validOptions.length < 2 || !newPoll.endsAt) {
      toast.error(t('pleaseFillAllFields'));
      return;
    }

    const poll: VotingPoll = {
      id: Date.now().toString(),
      question: newPoll.question,
      description: newPoll.description,
      options: validOptions.map((text, i) => ({
        id: `opt_${i}`,
        text,
        votes: []
      })),
      createdBy: currentUserId,
      createdByName: user?.name || 'You',
      createdAt: new Date().toISOString(),
      endsAt: new Date(newPoll.endsAt).toISOString(),
      status: 'active',
      isAnonymous: newPoll.isAnonymous,
      allowMultiple: newPoll.allowMultiple,
      totalVotes: 0
    };

    setPolls([poll, ...polls]);
    setShowCreateModal(false);
    setNewPoll({
      question: '',
      description: '',
      options: ['', ''],
      endsAt: '',
      isAnonymous: false,
      allowMultiple: false
    });
    
    notify('success');
    toast.success(t('pollCreated'));
  };

  const addOption = () => {
    if (newPoll.options.length < 6) {
      setNewPoll({ ...newPoll, options: [...newPoll.options, ''] });
    }
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll({
        ...newPoll,
        options: newPoll.options.filter((_, i) => i !== index)
      });
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return t('ended');
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return t('daysHoursLeft', { days, hours: hours % 24 });
    if (hours > 0) return t('hoursLeft', { hours });
    return t('endingSoon');
  };

  const getWinningOption = (poll: VotingPoll) => {
    return poll.options.reduce((max, opt) => 
      opt.votes.length > max.votes.length ? opt : max
    , poll.options[0]);
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
              <h1 className="text-xl font-bold">{t('votingAndPolls')}</h1>
              <p className="text-xs text-white/50">{t('groupDecisionsMadeEasy')}</p>
            </div>
          </div>
          
          {canCreate && (
            <button
              onClick={() => { tap('medium'); setShowCreateModal(true); }}
              className="p-2 rounded-xl bg-primary hover:bg-primary/80"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => { tap('light'); setFilter('active'); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              filter === 'active' ? 'bg-primary text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            <Vote className="w-4 h-4" />
            {t('active')}
          </button>
          <button
            onClick={() => { tap('light'); setFilter('closed'); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              filter === 'closed' ? 'bg-white/10 text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {t('results')}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {filteredPolls.map((poll, index) => {
          const voted = hasVoted(poll);
          const votedOptionId = getVotedOption(poll);
          const winner = poll.status === 'closed' ? getWinningOption(poll) : null;
          
          return (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface rounded-2xl p-4 border border-white/5"
            >
              {/* Poll Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{poll.question}</h3>
                  {poll.description && (
                    <p className="text-sm text-white/50 mt-1">{poll.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {poll.isAnonymous && (
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-md flex items-center gap-1">
                      <EyeOff className="w-3 h-3" />
                      {t('anonymous')}
                    </span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 mb-4">
                {poll.options.map(option => {
                  const percentage = poll.totalVotes > 0 
                    ? Math.round((option.votes.length / poll.totalVotes) * 100)
                    : 0;
                  const isSelected = votedOptionId === option.id;
                  const isWinner = winner?.id === option.id;
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => poll.status === 'active' && handleVote(poll.id, option.id)}
                      disabled={poll.status === 'closed'}
                      className={`w-full p-3 rounded-xl relative overflow-hidden transition-all ${
                        poll.status === 'active'
                          ? isSelected
                            ? 'border-2 border-primary bg-primary/10'
                            : 'border border-white/10 hover:border-white/30 bg-white/5'
                          : 'border border-white/5 bg-white/5'
                      }`}
                    >
                      {/* Progress Bar Background */}
                      {(voted || poll.status === 'closed') && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className={`absolute inset-y-0 left-0 ${
                            isWinner ? 'bg-green-500/20' : 'bg-white/10'
                          }`}
                        />
                      )}
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {poll.status === 'active' ? (
                            isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-primary" />
                            ) : (
                              <Circle className="w-5 h-5 text-white/30" />
                            )
                          ) : isWinner ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : null}
                          <span className={isWinner ? 'font-medium text-green-400' : ''}>
                            {option.text}
                          </span>
                        </div>
                        
                        {(voted || poll.status === 'closed') && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{percentage}%</span>
                            <span className="text-xs text-white/40">
                              ({option.votes.length})
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Poll Footer */}
              <div className="flex items-center justify-between text-xs text-white/40">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {poll.totalVotes} {t('votes')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getTimeRemaining(poll.endsAt)}
                  </span>
                </div>
                
                <span>{t('by')} {poll.createdByName}</span>
              </div>
            </motion.div>
          );
        })}

        {filteredPolls.length === 0 && (
          <div className="text-center py-12">
            <Vote className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">
              {filter === 'active' ? t('noActivePolls') : t('noClosedPolls')}
            </p>
            {canCreate && filter === 'active' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
              >
                {t('createFirstPoll')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Poll Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t('createPoll')}</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('question')} *</label>
                  <input
                    type="text"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                    placeholder={t('whatDoYouWantToAsk')}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('description')} ({t('optional')})</label>
                  <textarea
                    value={newPoll.description}
                    onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary resize-none"
                    placeholder={t('addMoreContext')}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('options')} *</label>
                  <div className="space-y-2">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const updated = [...newPoll.options];
                            updated[index] = e.target.value;
                            setNewPoll({ ...newPoll, options: updated });
                          }}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-primary"
                          placeholder={`${t('option')} ${index + 1}`}
                        />
                        {newPoll.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {newPoll.options.length < 6 && (
                    <button
                      onClick={addOption}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      + {t('addOption')}
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('endDate')} *</label>
                  <input
                    type="datetime-local"
                    value={newPoll.endsAt}
                    onChange={(e) => setNewPoll({ ...newPoll, endsAt: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPoll.isAnonymous}
                      onChange={(e) => setNewPoll({ ...newPoll, isAnonymous: e.target.checked })}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm">{t('anonymousVoting')}</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPoll.allowMultiple}
                      onChange={(e) => setNewPoll({ ...newPoll, allowMultiple: e.target.checked })}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm">{t('multipleChoice')}</span>
                  </label>
                </div>

                <button
                  onClick={handleCreatePoll}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/80"
                >
                  {t('createPoll')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
