import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, Upload, Cloud, HardDrive, Shield, Clock,
  CheckCircle, AlertTriangle, FileJson, FileSpreadsheet,
  RefreshCw, Trash2, Info, X
} from 'lucide-react';
import { 
  exportFullBackup, 
  downloadBackup, 
  importBackup,
  getLastBackupTime,
  exportMembersCSV,
  exportTransactionsCSV,
  exportLoansCSV,
  ImportResult
} from '../lib/backup';
import toast from 'react-hot-toast';

export const Backup: React.FC = () => {
  const { t } = useLanguage();
  const { members, transactions, meetings, loans } = useData();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const lastBackup = getLastBackupTime();

  const handleFullBackup = async () => {
    setIsExporting(true);
    try {
      const backup = exportFullBackup(members, transactions, meetings, loans, user?.name);
      downloadBackup(backup);
      toast.success('Backup downloaded!', { icon: '💾' });
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const result = await importBackup(file, (progress) => {
        setImportProgress(progress);
      });

      setImportResult(result);
      setShowResultModal(true);

      if (result.success) {
        toast.success('Backup restored! Refreshing...', { icon: '✅' });
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      toast.error('Import failed');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportCSV = (type: 'members' | 'transactions' | 'loans') => {
    switch (type) {
      case 'members':
        exportMembersCSV(members);
        break;
      case 'transactions':
        exportTransactionsCSV(transactions);
        break;
      case 'loans':
        exportLoansCSV(loans);
        break;
    }
    toast.success(`${type} exported as CSV`, { icon: '📊' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 min-h-screen"
    >
      <Header 
        title={t('dataBackup')} 
        subtitle="Export & restore your data"
        showProfile={false}
      />

      <div className="px-6 space-y-6">
        {/* Backup Status */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Cloud className="text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Backup Status</h3>
                <p className="text-white/40 text-sm">
                  {lastBackup 
                    ? `Last backup: ${lastBackup.toLocaleDateString()} at ${lastBackup.toLocaleTimeString()}`
                    : 'No backup found'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xl font-bold text-white">{members.length}</p>
                <p className="text-white/40 text-xs">Members</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xl font-bold text-white">{transactions.length}</p>
                <p className="text-white/40 text-xs">Transactions</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-xl font-bold text-white">{loans.length}</p>
                <p className="text-white/40 text-xs">Loans</p>
              </div>
            </div>
          </div>
        </div>

        {/* Full Backup */}
        <div>
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Full Backup</h3>
          
          <div className="space-y-3">
            <button
              onClick={handleFullBackup}
              disabled={isExporting}
              className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                {isExporting ? (
                  <RefreshCw className="text-green-400 animate-spin" size={24} />
                ) : (
                  <Download className="text-green-400" size={24} />
                )}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-white">Export Full Backup</h4>
                <p className="text-white/40 text-sm">Download all data as JSON file</p>
              </div>
              <FileJson className="text-white/20" size={20} />
            </button>

            <label className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                {isImporting ? (
                  <RefreshCw className="text-purple-400 animate-spin" size={24} />
                ) : (
                  <Upload className="text-purple-400" size={24} />
                )}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-bold text-white">Restore from Backup</h4>
                <p className="text-white/40 text-sm">
                  {isImporting ? `Importing... ${Math.round(importProgress)}%` : 'Upload JSON backup file'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                disabled={isImporting}
              />
            </label>
          </div>
        </div>

        {/* CSV Exports */}
        <div>
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Export as CSV</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'members', label: 'Members', count: members.length },
              { type: 'transactions', label: 'Transactions', count: transactions.length },
              { type: 'loans', label: 'Loans', count: loans.length }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => handleExportCSV(item.type as any)}
                className="glass-panel p-4 rounded-2xl text-center hover:bg-white/5 transition-colors"
              >
                <FileSpreadsheet className="mx-auto mb-2 text-emerald-400" size={24} />
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-white/40 text-xs">{item.count} rows</p>
              </button>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
          <Shield className="text-blue-400 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-blue-400 font-bold text-sm">Data Security</h4>
            <p className="text-blue-300/60 text-xs mt-1">
              Your backup files contain sensitive financial data. Store them securely and don't share with unauthorized persons.
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="glass-panel p-4 rounded-2xl">
          <h4 className="font-bold text-white mb-3 flex items-center gap-2">
            <Info size={16} className="text-white/40" />
            Backup Tips
          </h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
              Create backups regularly (weekly recommended)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
              Store backups in multiple locations (cloud + local)
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
              Test restore occasionally to verify backup integrity
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
              Restoring will replace all current data
            </li>
          </ul>
        </div>
      </div>

      {/* Import Result Modal */}
      <AnimatePresence>
        {showResultModal && importResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResultModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="text-center mb-4">
                {importResult.success ? (
                  <CheckCircle className="mx-auto text-green-400" size={48} />
                ) : (
                  <AlertTriangle className="mx-auto text-red-400" size={48} />
                )}
              </div>

              <h3 className="text-xl font-bold text-white text-center mb-2">
                {importResult.success ? 'Restore Successful!' : 'Restore Failed'}
              </h3>
              <p className="text-white/50 text-center text-sm mb-4">
                {importResult.message}
              </p>

              {importResult.stats && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{importResult.stats.members}</p>
                    <p className="text-white/40 text-xs">Members</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{importResult.stats.transactions}</p>
                    <p className="text-white/40 text-xs">Transactions</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{importResult.stats.meetings}</p>
                    <p className="text-white/40 text-xs">Meetings</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-white">{importResult.stats.loans}</p>
                    <p className="text-white/40 text-xs">Loans</p>
                  </div>
                </div>
              )}

              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg mb-4">
                  <p className="text-yellow-400 text-xs font-bold mb-1">Warnings:</p>
                  {importResult.warnings.map((w, i) => (
                    <p key={i} className="text-yellow-300/60 text-xs">• {w}</p>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowResultModal(false)}
                className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
