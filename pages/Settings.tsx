import React, { useState } from 'react';
import { Header } from '../components/Header';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../translations';
import { Check, Cloud, Download, RefreshCw, Shield, LogOut, User, Mail, Briefcase, Edit2, X, Save } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { language, setLanguage, t } = useLanguage();
  const { refreshData, exportData, isSyncing, syncStatus, lastSynced } = useData();
  const { settings, updateSettings, user, logout, updateUser } = useAuth();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [editedRole, setEditedRole] = useState(user?.role || '');

  const languages: { code: Language; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  ];

  const handleSync = async () => {
    await refreshData();
    toast.success(t('synced'));
  };

  const togglePin = () => {
    updateSettings({ isPinEnabled: !settings.isPinEnabled });
    toast.success(settings.isPinEnabled ? "PIN Disabled" : "PIN Enabled");
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      toast.success('Logged out successfully');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    if (!editedName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      const success = await updateUser({
        name: editedName.trim(),
        role: editedRole.trim() || user.role,
      });

      if (success) {
        setIsEditingProfile(false);
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleExportJSON = () => {
    exportData();
    toast.success('Data exported as JSON');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pb-24 min-h-screen bg-background"
    >
      <Header title={t('appSettings')} subtitle={t('settings')} showProfile={false} onBack={onBack} />

      <div className="px-6 max-w-md mx-auto space-y-8">
        
        {/* Profile Section */}
        <div>
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 pl-2">Profile</h3>
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-bold outline-none focus:border-blue-500"
                      placeholder="Your Name"
                    />
                  ) : (
                    <h4 className="font-bold text-white text-lg">{user?.name || 'User'}</h4>
                  )}
                  <p className="text-xs text-white/50">{user?.phoneNumber || user?.email || 'No contact info'}</p>
                </div>
              </div>
              
              {isEditingProfile ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                  >
                    <Save size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      setEditedName(user?.name || '');
                      setEditedRole(user?.role || '');
                    }}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-white/40" />
                <span className="text-sm text-white/70">{user?.email || user?.phoneNumber || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-white/40" />
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={editedRole}
                    onChange={(e) => setEditedRole(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm outline-none focus:border-blue-500 flex-1"
                    placeholder="Your Role"
                  />
                ) : (
                  <span className="text-sm text-white/70">{user?.role || 'Member'}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <User size={16} className="text-white/40" />
                <span className="text-sm text-white/70">Member ID: {user?.memberId || user?.id || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div>
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 pl-2">{t('security')}</h3>
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{t('appLock')}</h4>
                  <p className="text-[10px] text-white/40">{t('enablePin')}</p>
                </div>
              </div>
              <button 
                onClick={togglePin}
                className={`w-12 h-7 rounded-full p-1 transition-all ${settings.isPinEnabled ? 'bg-green-500' : 'bg-white/10'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${settings.isPinEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Language Section */}
        <div>
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 pl-2">{t('selectLanguage')}</h3>
          <div className="flex flex-col gap-3">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`relative glass-panel p-4 rounded-2xl flex items-center justify-between group transition-all ${
                  language === lang.code ? 'bg-white/10 border-white/30' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    language === lang.code ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' : 'bg-white/10 text-white/50'
                  }`}>
                    {lang.code.toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className={`font-bold ${language === lang.code ? 'text-white' : 'text-white/80'}`}>{lang.native}</p>
                    <p className="text-xs text-white/40">{lang.label}</p>
                  </div>
                </div>
                
                {language === lang.code && (
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Backup & Data Section */}
        <div>
          <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-4 pl-2">{t('dataBackup')}</h3>
          <div className="glass-panel rounded-2xl overflow-hidden">
            {/* Cloud Backup */}
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Cloud size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{t('cloudBackup')}</h4>
                  <p className="text-[10px] text-white/40">{t('backupDesc')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-orange-500'}`} />
                <button onClick={handleSync} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 transition-colors">
                  <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
                </button>
              </div>
            </div>

            {/* Export JSON */}
            <button 
              onClick={handleExportJSON}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Download size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{t('exportData')}</h4>
                  <p className="text-[10px] text-white/40">Export as JSON Format</p>
                </div>
              </div>
              <div className="text-white/30">→</div>
            </button>
          </div>
          <p className="text-center text-xs text-white/30 mt-2">{t('lastBackup')}: {lastSynced.toLocaleTimeString()}</p>
        </div>

        {/* Logout Section */}
        <div>
          <button
            onClick={handleLogout}
            className="w-full glass-panel p-4 rounded-2xl flex items-center justify-between hover:bg-red-500/10 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 group-hover:bg-red-500/20 transition-colors">
                <LogOut size={20} />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-white text-sm">Logout</h4>
                <p className="text-[10px] text-white/40">Sign out of your account</p>
              </div>
            </div>
            <div className="text-red-400">→</div>
          </button>
        </div>

        {/* App Info */}
        <div className="text-center text-white/30 text-xs pb-6">
          <p>SHG Connect v1.0.0</p>
          <p className="mt-1">© 2024 All rights reserved</p>
        </div>
      </div>
    </motion.div>
  );
};