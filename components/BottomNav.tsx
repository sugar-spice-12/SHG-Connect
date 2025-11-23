
import React from 'react';
import { Home, Users, Banknote, FileText, PlusCircle } from 'lucide-react';
import { View } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavProps {
  currentView: View;
  onChangeView: (view: View) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView }) => {
  const { t } = useLanguage();
  
  const navItems = [
    { id: 'dashboard', icon: Home, label: t('home') },
    { id: 'transact', icon: PlusCircle, label: t('transact') },
    { id: 'reports', icon: FileText, label: t('report') },
    { id: 'members', icon: Users, label: t('members') },
    { id: 'loans', icon: Banknote, label: t('loans') },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="glass-panel rounded-2xl px-2 py-2 flex justify-between items-center shadow-2xl shadow-black/50 backdrop-blur-xl border border-white/10 bg-[#1C1C1E]/90">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as View)}
              className={`relative flex flex-col items-center justify-center w-14 h-14 transition-all duration-300 rounded-xl group ${
                isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {/* Active Indicator Background */}
              <div className={`absolute inset-0 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/10' : 'scale-0 group-hover:scale-100 group-hover:bg-white/5'}`} />
              
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
              
              {/* Active Dot */}
              {isActive && (
                <span className="absolute bottom-2 w-1 h-1 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)] z-10" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};