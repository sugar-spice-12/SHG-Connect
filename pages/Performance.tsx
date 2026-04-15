import React, { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';
import { 
  Trophy, TrendingUp, Star, Award, Medal, Target,
  ChevronRight, Users, AlertTriangle, CheckCircle,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { 
  calculatePerformance, 
  calculateGroupRankings,
  getGradeColor,
  detectDefaulters,
  PerformanceMetrics,
  MemberRanking,
  Defaulter
} from '../lib/performance';

type TabType = 'rankings' | 'individual' | 'defaulters';

export const Performance: React.FC = () => {
  const { t } = useLanguage();
  const { members, transactions, loans, meetings } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('rankings');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const rankings = useMemo(() => 
    calculateGroupRankings(members, transactions, loans, meetings),
    [members, transactions, loans, meetings]
  );

  const defaulters = useMemo(() => 
    detectDefaulters(loans),
    [loans]
  );

  const selectedPerformance = useMemo(() => {
    if (!selectedMemberId) return null;
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return null;
    return calculatePerformance(member, transactions, loans, meetings);
  }, [selectedMemberId, members, transactions, loans, meetings]);

  const renderRankings = () => (
    <div className="space-y-4">
      {/* Top 3 Podium */}
      {rankings.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6 pt-4">
          {/* 2nd Place */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl">🥈</span>
            </div>
            <p className="text-white text-sm font-medium text-center truncate w-20">{rankings[1]?.memberName.split(' ')[0]}</p>
            <p className="text-white/40 text-xs">{rankings[1]?.score} pts</p>
            <div className="w-20 h-16 bg-gray-500/30 rounded-t-lg mt-2" />
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mb-2 shadow-lg ring-4 ring-yellow-400/30">
              <span className="text-3xl">👑</span>
            </div>
            <p className="text-white font-bold text-center truncate w-24">{rankings[0]?.memberName.split(' ')[0]}</p>
            <p className="text-yellow-400 text-sm font-bold">{rankings[0]?.score} pts</p>
            <div className="w-24 h-24 bg-yellow-500/30 rounded-t-lg mt-2" />
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center mb-2 shadow-lg">
              <span className="text-2xl">🥉</span>
            </div>
            <p className="text-white text-sm font-medium text-center truncate w-20">{rankings[2]?.memberName.split(' ')[0]}</p>
            <p className="text-white/40 text-xs">{rankings[2]?.score} pts</p>
            <div className="w-20 h-12 bg-amber-700/30 rounded-t-lg mt-2" />
          </motion.div>
        </div>
      )}

      {/* Full Rankings List */}
      <div className="space-y-2">
        {rankings.map((ranking, index) => {
          const member = members.find(m => m.id === ranking.memberId);
          return (
            <motion.div
              key={ranking.memberId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => {
                setSelectedMemberId(ranking.memberId);
                setActiveTab('individual');
              }}
              className="glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                index === 2 ? 'bg-amber-600/20 text-amber-500' :
                'bg-white/5 text-white/40'
              }`}>
                #{ranking.rank}
              </div>

              <img 
                src={member?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${ranking.memberName}`} 
                className="w-10 h-10 rounded-full bg-gray-700"
                alt={ranking.memberName}
              />

              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate">{ranking.memberName}</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded bg-gradient-to-r ${getGradeColor(ranking.grade)} text-white font-bold`}>
                    {ranking.grade}
                  </span>
                  <span className="text-white/40 text-xs">{ranking.score} points</span>
                </div>
              </div>

              <ChevronRight className="text-white/20" size={20} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderIndividual = () => {
    if (!selectedMemberId || !selectedPerformance) {
      return (
        <div className="text-center py-12">
          <Users className="mx-auto mb-3 text-white/20" size={48} />
          <p className="text-white/40">Select a member from rankings</p>
        </div>
      );
    }

    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return null;

    return (
      <div className="space-y-6">
        {/* Member Header */}
        <div className="glass-panel p-6 rounded-3xl text-center relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${getGradeColor(selectedPerformance.grade)} opacity-20`} />
          <div className="relative z-10">
            <img 
              src={member.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
              className="w-20 h-20 rounded-full mx-auto mb-3 ring-4 ring-white/20"
              alt={member.name}
            />
            <h2 className="text-xl font-bold text-white">{member.name}</h2>
            <div className={`inline-block mt-2 px-4 py-1 rounded-full bg-gradient-to-r ${getGradeColor(selectedPerformance.grade)} text-white font-bold`}>
              Grade {selectedPerformance.grade} • {selectedPerformance.overallScore} pts
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Attendance', score: selectedPerformance.attendanceScore, icon: CheckCircle, color: 'blue' },
            { label: 'Savings', score: selectedPerformance.savingsScore, icon: Target, color: 'green' },
            { label: 'Repayment', score: selectedPerformance.repaymentScore, icon: TrendingUp, color: 'purple' },
            { label: 'Participation', score: selectedPerformance.participationScore, icon: Users, color: 'orange' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-4 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon size={16} className={`text-${item.color}-400`} />
                <span className="text-white/50 text-xs">{item.label}</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{item.score}</span>
                <span className="text-white/30 text-sm mb-1">/100</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                  className={`h-full bg-${item.color}-500 rounded-full`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Badges */}
        {selectedPerformance.badges.length > 0 && (
          <div>
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Badges Earned</h3>
            <div className="flex flex-wrap gap-2">
              {selectedPerformance.badges.map((badge, index) => (
                <motion.span
                  key={badge}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-sm text-white"
                >
                  {badge}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Insights */}
        {selectedPerformance.insights.length > 0 && (
          <div>
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Insights</h3>
            <div className="space-y-2">
              {selectedPerformance.insights.map((insight, index) => (
                <div key={index} className="glass-panel p-3 rounded-xl flex items-start gap-3">
                  <Star className="text-yellow-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-white/70 text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDefaulters = () => (
    <div className="space-y-4">
      {defaulters.length === 0 ? (
        <div className="glass-panel p-8 rounded-2xl text-center">
          <CheckCircle className="mx-auto mb-3 text-green-400" size={48} />
          <h3 className="text-white font-bold mb-1">No Defaulters!</h3>
          <p className="text-white/40 text-sm">All loans are being repaid on time</p>
        </div>
      ) : (
        <>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-red-400 font-bold">Attention Required</h3>
              <p className="text-red-300/60 text-sm">{defaulters.length} member(s) have overdue loans</p>
            </div>
          </div>

          {defaulters.map((defaulter, index) => (
            <motion.div
              key={defaulter.loanId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass-panel p-4 rounded-2xl border-l-4 ${
                defaulter.severity === 'critical' ? 'border-red-500' :
                defaulter.severity === 'high' ? 'border-orange-500' :
                defaulter.severity === 'medium' ? 'border-yellow-500' :
                'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-white">{defaulter.memberName}</h4>
                  <p className="text-white/40 text-xs">{defaulter.daysOverdue} days overdue</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg font-bold uppercase ${
                  defaulter.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                  defaulter.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                  defaulter.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {defaulter.severity}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/50 text-xs">Overdue Amount</p>
                  <p className="text-xl font-bold text-red-400">₹{defaulter.overdueAmount.toLocaleString()}</p>
                </div>
                <button className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm text-white transition-colors">
                  Contact
                </button>
              </div>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 min-h-screen"
    >
      <Header 
        title="Performance" 
        subtitle="Member rankings & insights"
        showProfile={false}
      />

      <div className="px-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
          {[
            { id: 'rankings', label: 'Rankings', icon: Trophy },
            { id: 'individual', label: 'Individual', icon: Star },
            { id: 'defaulters', label: 'Defaulters', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id 
                  ? 'bg-white/10 text-white' 
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'rankings' && renderRankings()}
        {activeTab === 'individual' && renderIndividual()}
        {activeTab === 'defaulters' && renderDefaulters()}
      </div>
    </motion.div>
  );
};
