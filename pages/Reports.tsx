
import React, { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Table, Calendar, TrendingUp, BookOpen, BarChart2, Sparkles, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GoogleGenAI } from '@google/genai';

export const Reports: React.FC = () => {
  const { t } = useLanguage();
  const { transactions, members, loans, meetings, isAIQuotaExceeded } = useData();
  const [filter, setFilter] = useState<'all' | 'month'>('month');
  const [aiReport, setAiReport] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- HELPER: CSV GENERATOR ---
  const downloadCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        toast.error("No data available to export");
        return;
    }

    // Generate Headers
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    // Generate Rows
    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '\\"');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // Create Blob and Link
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success(`${filename} Downloaded`, { icon: '📄' });
  };

  // --- CHART DATA LOGIC ---
  const chartData = useMemo(() => {
    const last6Months = [];
    // Generate last 6 month buckets
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        last6Months.push({
            monthIdx: d.getMonth(),
            year: d.getFullYear(),
            name: d.toLocaleString('default', { month: 'short' }),
            Income: 0,
            Expense: 0
        });
    }

    // Populate buckets
    transactions.forEach(t => {
        const tDate = new Date(t.timestamp || Date.now());
        // Find matching bucket
        const bucket = last6Months.find(m => m.monthIdx === tDate.getMonth() && m.year === tDate.getFullYear());
        
        if (bucket) {
            if (['Savings', 'Loan Repayment', 'Fine'].includes(t.type)) {
                bucket.Income += t.amount;
            } else {
                bucket.Expense += t.amount;
            }
        }
    });

    return last6Months;
  }, [transactions]);

  // --- REPORT LOGIC ---

  const exportSavingsReport = () => {
    const data = members.map(m => ({
        "Member ID": m.id,
        "Name": m.name,
        "Phone": m.phoneNumber || 'N/A',
        "Role": m.role,
        "Total Savings": m.savingsBalance,
        "Attendance Rate": m.attendanceRate + '%',
        "Joined Date": m.joinedDate
    }));
    downloadCSV(data, 'Savings_Report');
  };

  const exportLoanRegister = () => {
    const data = loans.map(l => ({
        "Loan ID": l.id,
        "Member": l.memberName,
        "Principal": l.principal,
        "Interest Rate": l.interestRate + '%',
        "Start Date": l.startDate,
        "End Date": l.endDate,
        "Status": l.status,
        "Total Repayable": l.totalRepayable,
        "Amount Paid": l.amountPaid,
        "Outstanding Balance": l.totalRepayable - l.amountPaid
    }));
    downloadCSV(data, 'Loan_Register');
  };

  const exportAttendanceReport = () => {
    const data = meetings.map(m => ({
        "Meeting Date": m.date,
        "Total Collected": m.totalCollected,
        "Present Count": m.attendees.length,
        "Absent Count": members.length - m.attendees.length,
        "Status": m.status
    }));
    downloadCSV(data, 'Meeting_Attendance_Log');
  };

  // --- AI ANALYSIS LOGIC ---
  const generateAiReport = async () => {
    if (isAIQuotaExceeded) {
        toast.error("Offline Mode: AI features unavailable");
        return;
    }
    const apiKey = process.env.API_KEY || "AIzaSyAhWTKA4WwaT9RNfznrVYvE_MsOauofpP0";
    if (!apiKey) {
        toast.error("API Key missing");
        return;
    }

    setIsAnalyzing(true);
    try {
        const ai = new GoogleGenAI({ apiKey });
        const summaryData = {
            monthlyTrends: chartData.map(d => `${d.name}: In ${d.Income} / Out ${d.Expense}`),
            totalMembers: members.length,
            activeLoans: loans.filter(l => l.status === 'Active').length
        };
        
        const prompt = `Analyze this financial data for a Self-Help Group. Provide 3 brief, actionable bullet points about their financial health and 1 recommendation. Data: ${JSON.stringify(summaryData)}. Keep it encouraging.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        setAiReport(response.text);
    } catch (e) {
        toast.error("Analysis failed");
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- CASH BOOK LOGIC ---
  const getCashBook = useMemo(() => {
    // 1. Sort Chronologically
    const sorted = [...transactions].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    
    // 2. Filter if needed
    const filtered = filter === 'all' ? sorted : sorted.filter(t => {
        const txDate = new Date(t.timestamp || Date.now());
        const now = new Date();
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    });

    // 3. Calculate Running Balance
    let cashBalance = 0;
    
    const fullLedger = sorted.map(tx => {
        let credit = 0;
        let debit = 0;
        // Income logic
        if (['Savings', 'Loan Repayment', 'Fine'].includes(tx.type)) {
            credit = tx.amount;
            cashBalance += tx.amount;
        } 
        // Expense logic
        else if (['New Loan', 'Expense'].includes(tx.type)) {
            debit = tx.amount;
            cashBalance -= tx.amount;
        }
        return { ...tx, credit, debit, balance: cashBalance };
    });

    // If filtering by month, we filter the *calculated* ledger
    if (filter === 'month') {
        const now = new Date();
        return fullLedger.filter(t => {
            const txDate = new Date(t.timestamp || Date.now());
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        }).reverse();
    }

    return fullLedger.reverse(); // Show newest first
  }, [transactions, filter]);

  const exportCashBook = () => {
    const data = getCashBook.map(tx => ({
        "Date": tx.date,
        "Description": tx.description,
        "Member": tx.memberName || 'Group',
        "Type": tx.type,
        "Credit (+)": tx.credit || 0,
        "Debit (-)": tx.debit || 0,
        "Running Balance": tx.balance
    }));
    downloadCSV(data, 'Group_Cash_Book');
  };

  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-24 min-h-screen"
    >
        <Header title={t('report')} subtitle={t('monthlyOverview')} showProfile={false} />

        <div className="px-6 space-y-6">
            
            {/* CASH FLOW GRAPH */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <BarChart2 size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">Cash Flow Analysis</h3>
                            <p className="text-[10px] text-white/40">Income vs Expense (Last 6 Months)</p>
                        </div>
                    </div>
                    <button 
                        onClick={generateAiReport}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity"
                    >
                        {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Analyze
                    </button>
                </div>

                {/* AI REPORT PANEL */}
                <AnimatePresence>
                    {aiReport && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 20 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="bg-white/5 border border-purple-500/30 rounded-xl overflow-hidden"
                        >
                            <div className="p-4">
                                <h4 className="text-purple-300 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Sparkles size={12} /> AI Insights
                                </h4>
                                <div className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                                    {aiReport}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} iconType="circle" />
                            <Bar dataKey="Income" fill="#4ADE80" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="Expense" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Report Generation Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div onClick={exportSavingsReport} className="glass-panel p-4 rounded-2xl group cursor-pointer hover:bg-white/5 transition-colors active:scale-95">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <TrendingUp size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-white">{t('savingsReport')}</h4>
                    <p className="text-[10px] text-white/40 mt-1">Export CSV</p>
                </div>
                <div onClick={exportLoanRegister} className="glass-panel p-4 rounded-2xl group cursor-pointer hover:bg-white/5 transition-colors active:scale-95">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <BookOpen size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-white">{t('loanRegister')}</h4>
                    <p className="text-[10px] text-white/40 mt-1">Export CSV</p>
                </div>
                 <div onClick={exportAttendanceReport} className="glass-panel p-4 rounded-2xl group cursor-pointer hover:bg-white/5 transition-colors active:scale-95">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Calendar size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-white">Attendance Log</h4>
                    <p className="text-[10px] text-white/40 mt-1">Export CSV</p>
                </div>
                 <div onClick={exportCashBook} className="glass-panel p-4 rounded-2xl group cursor-pointer hover:bg-white/5 transition-colors active:scale-95">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Table size={20} />
                    </div>
                    <h4 className="font-bold text-sm text-white">{t('cashBook')}</h4>
                    <p className="text-[10px] text-white/40 mt-1">Export CSV</p>
                </div>
            </div>

            {/* Cash Book Table Preview */}
            <div className="glass-panel rounded-2xl overflow-hidden min-h-[400px]">
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h4 className="font-bold text-white">{t('cashBook')}</h4>
                        <div className="flex bg-black/30 rounded-lg p-0.5">
                            <button 
                                onClick={() => setFilter('month')}
                                className={`px-2 py-1 text-[10px] rounded-md transition-all ${filter === 'month' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                            >
                                This Month
                            </button>
                            <button 
                                onClick={() => setFilter('all')}
                                className={`px-2 py-1 text-[10px] rounded-md transition-all ${filter === 'all' ? 'bg-white/10 text-white' : 'text-white/40'}`}
                            >
                                All Time
                            </button>
                        </div>
                    </div>
                    <button onClick={exportCashBook} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70">
                        <Download size={16} />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-white/40 uppercase bg-white/5">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Particulars</th>
                                <th className="px-4 py-3 text-right text-green-400">{t('credit')}</th>
                                <th className="px-4 py-3 text-right text-red-400">{t('debit')}</th>
                                <th className="px-4 py-3 text-right">{t('balance')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {getCashBook.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-white/30 text-xs">
                                        No records found for this period
                                    </td>
                                </tr>
                            ) : (
                                getCashBook.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-white/70 text-xs">{tx.date}</td>
                                        <td className="px-4 py-3 text-white/90 font-medium">
                                            {tx.description}
                                            <div className="text-[10px] text-white/30 font-normal">{tx.memberName || 'Group'}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-green-400/80 text-xs">{tx.credit > 0 ? `₹${tx.credit}` : '-'}</td>
                                        <td className="px-4 py-3 text-right text-red-400/80 text-xs">{tx.debit > 0 ? `₹${tx.debit}` : '-'}</td>
                                        <td className="px-4 py-3 text-right font-bold text-white">₹{tx.balance}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </motion.div>
  );
};
