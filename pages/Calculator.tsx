import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  IndianRupee,
  PiggyBank,
  Percent,
  ChevronDown,
  ChevronUp,
  Download,
  Share2
} from 'lucide-react';
import { useHaptics } from '../hooks/useNative';
import { useLanguage } from '../context/LanguageContext';

interface CalculatorProps {
  onBack: () => void;
}

interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export const CalculatorPage: React.FC<CalculatorProps> = ({ onBack }) => {
  const { tap } = useHaptics();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'emi' | 'interest' | 'savings'>('emi');
  
  // EMI Calculator State
  const [principal, setPrincipal] = useState<string>('50000');
  const [interestRate, setInterestRate] = useState<string>('12');
  const [tenure, setTenure] = useState<string>('12');
  const [showSchedule, setShowSchedule] = useState(false);
  
  // Interest Calculator State
  const [interestPrincipal, setInterestPrincipal] = useState<string>('10000');
  const [interestRateSimple, setInterestRateSimple] = useState<string>('10');
  const [interestYears, setInterestYears] = useState<string>('1');
  const [interestType, setInterestType] = useState<'simple' | 'compound'>('compound');
  
  // Savings Calculator State
  const [monthlyDeposit, setMonthlyDeposit] = useState<string>('1000');
  const [savingsRate, setSavingsRate] = useState<string>('8');
  const [savingsYears, setSavingsYears] = useState<string>('5');

  // EMI Calculation
  const emiResult = useMemo(() => {
    const p = parseFloat(principal) || 0;
    const r = (parseFloat(interestRate) || 0) / 12 / 100;
    const n = parseInt(tenure) || 1;
    
    if (p <= 0 || r <= 0 || n <= 0) {
      return { emi: 0, totalPayment: 0, totalInterest: 0, schedule: [] };
    }
    
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - p;
    
    // Generate amortization schedule
    const schedule: AmortizationRow[] = [];
    let balance = p;
    
    for (let month = 1; month <= n; month++) {
      const interestPayment = balance * r;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;
      
      schedule.push({
        month,
        emi: Math.round(emi),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.max(0, Math.round(balance))
      });
    }
    
    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      schedule
    };
  }, [principal, interestRate, tenure]);

  // Interest Calculation
  const interestResult = useMemo(() => {
    const p = parseFloat(interestPrincipal) || 0;
    const r = parseFloat(interestRateSimple) || 0;
    const t = parseFloat(interestYears) || 0;
    
    if (p <= 0 || r <= 0 || t <= 0) {
      return { interest: 0, total: 0 };
    }
    
    let interest: number;
    let total: number;
    
    if (interestType === 'simple') {
      interest = (p * r * t) / 100;
      total = p + interest;
    } else {
      // Compound interest (yearly compounding)
      total = p * Math.pow(1 + r / 100, t);
      interest = total - p;
    }
    
    return {
      interest: Math.round(interest),
      total: Math.round(total)
    };
  }, [interestPrincipal, interestRateSimple, interestYears, interestType]);

  // Savings Calculation (SIP style)
  const savingsResult = useMemo(() => {
    const monthly = parseFloat(monthlyDeposit) || 0;
    const r = (parseFloat(savingsRate) || 0) / 12 / 100;
    const n = (parseFloat(savingsYears) || 0) * 12;
    
    if (monthly <= 0 || r <= 0 || n <= 0) {
      return { totalDeposited: 0, totalValue: 0, interestEarned: 0 };
    }
    
    // Future Value of SIP
    const totalValue = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const totalDeposited = monthly * n;
    const interestEarned = totalValue - totalDeposited;
    
    return {
      totalDeposited: Math.round(totalDeposited),
      totalValue: Math.round(totalValue),
      interestEarned: Math.round(interestEarned)
    };
  }, [monthlyDeposit, savingsRate, savingsYears]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleTabChange = (tab: 'emi' | 'interest' | 'savings') => {
    tap('light');
    setActiveTab(tab);
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
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => { tap('light'); onBack(); }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{t('calculator')}</h1>
            <p className="text-xs text-white/50">EMI, {t('interestCalculator')}, {t('savings')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex gap-2">
          {[
            { id: 'emi', label: 'EMI', icon: Calculator },
            { id: 'interest', label: t('interestCalculator'), icon: Percent },
            { id: 'savings', label: t('savings'), icon: PiggyBank }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <AnimatePresence mode="wait">
          {/* EMI Calculator */}
          {activeTab === 'emi' && (
            <motion.div
              key="emi"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Input Fields */}
              <div className="bg-surface rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('loanAmount')} (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                      placeholder="50000"
                    />
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="500000"
                    step="1000"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    className="w-full mt-2 accent-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('interestRate')} (%)</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                      placeholder="12"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="36"
                    step="0.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full mt-2 accent-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('durationMonths')}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="number"
                      value={tenure}
                      onChange={(e) => setTenure(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary"
                      placeholder="12"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-2xl p-4 border border-primary/30">
                <div className="text-center mb-4">
                  <p className="text-sm text-white/60">{t('monthlyEmi')}</p>
                  <p className="text-4xl font-bold text-primary">{formatCurrency(emiResult.emi)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/50">{t('totalPayment')}</p>
                    <p className="text-lg font-semibold">{formatCurrency(emiResult.totalPayment)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/50">{t('totalInterest')}</p>
                    <p className="text-lg font-semibold text-orange-400">{formatCurrency(emiResult.totalInterest)}</p>
                  </div>
                </div>

                {/* Visual Breakdown */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{t('principal')}</span>
                    <span>{t('totalInterest')}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-white/10 flex">
                    <div 
                      className="bg-primary h-full transition-all"
                      style={{ width: `${(parseFloat(principal) / emiResult.totalPayment) * 100}%` }}
                    />
                    <div 
                      className="bg-orange-500 h-full transition-all"
                      style={{ width: `${(emiResult.totalInterest / emiResult.totalPayment) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Amortization Schedule Toggle */}
              <button
                onClick={() => { tap('light'); setShowSchedule(!showSchedule); }}
                className="w-full bg-surface rounded-xl p-4 flex items-center justify-between"
              >
                <span className="font-medium">{t('amortizationSchedule')}</span>
                {showSchedule ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {/* Amortization Schedule */}
              <AnimatePresence>
                {showSchedule && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-surface rounded-xl overflow-hidden">
                      <div className="grid grid-cols-5 gap-2 p-3 bg-white/5 text-xs font-medium text-white/60">
                        <span>{t('months')}</span>
                        <span>EMI</span>
                        <span>{t('principal')}</span>
                        <span>{t('totalInterest')}</span>
                        <span>{t('balance')}</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {emiResult.schedule.map((row) => (
                          <div key={row.month} className="grid grid-cols-5 gap-2 p-3 text-xs border-t border-white/5">
                            <span className="text-white/60">{row.month}</span>
                            <span>₹{row.emi.toLocaleString()}</span>
                            <span className="text-green-400">₹{row.principal.toLocaleString()}</span>
                            <span className="text-orange-400">₹{row.interest.toLocaleString()}</span>
                            <span className="text-white/60">₹{row.balance.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Interest Calculator */}
          {activeTab === 'interest' && (
            <motion.div
              key="interest"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Interest Type Toggle */}
              <div className="bg-surface rounded-xl p-1 flex">
                <button
                  onClick={() => { tap('light'); setInterestType('simple'); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    interestType === 'simple' ? 'bg-primary text-white' : 'text-white/60'
                  }`}
                >
                  {t('simpleInterest')}
                </button>
                <button
                  onClick={() => { tap('light'); setInterestType('compound'); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    interestType === 'compound' ? 'bg-primary text-white' : 'text-white/60'
                  }`}
                >
                  {t('compoundInterest')}
                </button>
              </div>

              {/* Input Fields */}
              <div className="bg-surface rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('principalAmount')} (₹)</label>
                  <input
                    type="number"
                    value={interestPrincipal}
                    onChange={(e) => setInterestPrincipal(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('interestRate')} (%)</label>
                  <input
                    type="number"
                    value={interestRateSimple}
                    onChange={(e) => setInterestRateSimple(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('timePeriodYears')}</label>
                  <input
                    type="number"
                    value={interestYears}
                    onChange={(e) => setInterestYears(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl p-4 border border-green-500/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-white/60">{t('interestEarned')}</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(interestResult.interest)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-white/60">{t('totalAmount')}</p>
                    <p className="text-2xl font-bold">{formatCurrency(interestResult.total)}</p>
                  </div>
                </div>

                {/* Formula Display */}
                <div className="mt-4 p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/50 mb-1">{t('formulaUsed')}:</p>
                  <p className="text-sm font-mono text-white/80">
                    {interestType === 'simple' 
                      ? 'SI = (P × R × T) / 100'
                      : 'A = P × (1 + R/100)^T'
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Savings Calculator */}
          {activeTab === 'savings' && (
            <motion.div
              key="savings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Input Fields */}
              <div className="bg-surface rounded-2xl p-4 space-y-4">
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('monthlySavings')} (₹)</label>
                  <input
                    type="number"
                    value={monthlyDeposit}
                    onChange={(e) => setMonthlyDeposit(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={monthlyDeposit}
                    onChange={(e) => setMonthlyDeposit(e.target.value)}
                    className="w-full mt-2 accent-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('expectedReturn')} (%)</label>
                  <input
                    type="number"
                    value={savingsRate}
                    onChange={(e) => setSavingsRate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('timePeriodYears')}</label>
                  <input
                    type="number"
                    value={savingsYears}
                    onChange={(e) => setSavingsYears(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                  />
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={savingsYears}
                    onChange={(e) => setSavingsYears(e.target.value)}
                    className="w-full mt-2 accent-primary"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-2xl p-4 border border-blue-500/30">
                <div className="text-center mb-4">
                  <p className="text-sm text-white/60">{t('totalValue')}</p>
                  <p className="text-4xl font-bold text-blue-400">{formatCurrency(savingsResult.totalValue)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/50">{t('totalDeposited')}</p>
                    <p className="text-lg font-semibold">{formatCurrency(savingsResult.totalDeposited)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-xs text-white/50">{t('interestEarned')}</p>
                    <p className="text-lg font-semibold text-green-400">{formatCurrency(savingsResult.interestEarned)}</p>
                  </div>
                </div>

                {/* Visual Breakdown */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white/60 mb-1">
                    <span>{t('deposits')}</span>
                    <span>{t('totalInterest')}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden bg-white/10 flex">
                    <div 
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${(savingsResult.totalDeposited / savingsResult.totalValue) * 100}%` }}
                    />
                    <div 
                      className="bg-green-500 h-full transition-all"
                      style={{ width: `${(savingsResult.interestEarned / savingsResult.totalValue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-sm text-yellow-400">
                  💡 <strong>{t('tip')}:</strong> {t('savingTip', { amount: monthlyDeposit, years: savingsYears, rate: savingsRate, growth: Math.round((savingsResult.interestEarned / savingsResult.totalDeposited) * 100) })}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
