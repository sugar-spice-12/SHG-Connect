
import React from 'react';
import { Header } from '../components/Header';
import { BarChart, Bar, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';

const data = [
  { name: 'Week 1', savings: 4000 },
  { name: 'Week 2', savings: 3000 },
  { name: 'Week 3', savings: 2000 },
  { name: 'Week 4', savings: 2780 },
];

const loanData = [
    { name: 'Jan', loans: 10000 },
    { name: 'Feb', loans: 15000 },
    { name: 'Mar', loans: 12000 },
    { name: 'Apr', loans: 8000 },
];

export const Analytics: React.FC = () => {
  const { t } = useLanguage();
  const { aiSummary } = useData();

  return (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-24"
    >
      <Header title="Analytics" subtitle={t('monthlyOverview')} showProfile={false} />

      <div className="px-6 space-y-6">
        {/* AI Summary Card */}
        {aiSummary && (
            <div className="glass-panel-strong p-6 rounded-3xl border border-purple-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Sparkles size={60} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-1.5 rounded-lg">
                        <Sparkles size={16} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">AI Monthly Report</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed font-medium relative z-10">
                    {aiSummary}
                </p>
            </div>
        )}

        {/* Savings Chart */}
        <div className="glass-panel p-6 rounded-3xl">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <p className="text-xs text-white/50 mb-1">{t('totalSavings')} (Oct)</p>
                    <h3 className="text-2xl font-bold">₹12,780</h3>
                </div>
                <div className="text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">+12%</div>
            </div>
            <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <Bar dataKey="savings" fill="#6366F1" radius={[4, 4, 0, 0]} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '8px', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Loan Trend */}
        <div className="glass-panel p-6 rounded-3xl">
            <div className="mb-4">
                <p className="text-xs text-white/50 mb-1">Loan Disbursement</p>
                <h3 className="text-lg font-bold">Trend Analysis</h3>
            </div>
            <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={loanData}>
                        <Line type="monotone" dataKey="loans" stroke="#EC4899" strokeWidth={3} dot={{r: 4, fill: '#EC4899'}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '8px', border: 'none' }}
                            itemStyle={{ color: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </motion.div>
  );
};