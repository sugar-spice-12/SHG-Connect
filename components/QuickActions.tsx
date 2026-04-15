import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  Target, 
  Megaphone, 
  Vote, 
  MessageCircle, 
  QrCode,
  Camera,
  FileText,
  Phone,
  Shield,
  ChevronRight,
  X,
  Sparkles,
  Lock,
  Cake,
  Trophy,
  HardDrive,
  Building2,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { useHaptics } from '../hooks/useNative';
import { useLanguage } from '../context/LanguageContext';
import { useRBAC } from '../hooks/useRBAC';
import { Permission } from '../lib/rbac';
import { View } from '../types';
import { UPIPayment } from './UPIPayment';
import { DocumentScanner } from './DocumentScanner';

interface QuickActionsProps {
  onNavigate: (view: View) => void;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
  permission?: Permission; // Optional permission required
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const { tap } = useHaptics();
  const { t } = useLanguage();
  const { can } = useRBAC();
  const [showUPI, setShowUPI] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const allActions: QuickAction[] = [
    {
      id: 'calculator',
      label: t('emiCalculator'),
      description: t('calculator'),
      icon: Calculator,
      color: 'from-blue-500 to-cyan-500',
      action: () => onNavigate('calculator'),
      permission: 'use_calculator'
    },
    {
      id: 'savings',
      label: t('savingsGoals'),
      description: t('savingsGoals'),
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      action: () => onNavigate('savings-goals'),
      permission: 'view_savings_goals'
    },
    {
      id: 'announcements',
      label: t('announcements'),
      description: t('announcements'),
      icon: Megaphone,
      color: 'from-purple-500 to-pink-500',
      action: () => onNavigate('announcements'),
      permission: 'view_announcements'
    },
    {
      id: 'voting',
      label: t('voting'),
      description: t('voting'),
      icon: Vote,
      color: 'from-orange-500 to-red-500',
      action: () => onNavigate('voting'),
      permission: 'view_polls'
    },
    {
      id: 'chat',
      label: t('groupChat'),
      description: t('messages'),
      icon: MessageCircle,
      color: 'from-indigo-500 to-purple-500',
      action: () => onNavigate('chat'),
      permission: 'view_chat'
    },
    {
      id: 'upi',
      label: t('upiPayment'),
      description: t('generateQR'),
      icon: QrCode,
      color: 'from-green-600 to-teal-500',
      action: () => setShowUPI(true),
      permission: 'generate_upi_qr'
    },
    {
      id: 'scanner',
      label: t('scanDocument'),
      description: t('documents'),
      icon: Camera,
      color: 'from-yellow-500 to-orange-500',
      action: () => setShowScanner(true),
      permission: 'scan_documents'
    },
    {
      id: 'audit',
      label: t('securityLog'),
      description: t('activityLog'),
      icon: Shield,
      color: 'from-red-500 to-pink-500',
      action: () => onNavigate('audit-log'),
      permission: 'view_audit_log'
    },
    {
      id: 'birthdays',
      label: 'Birthdays',
      description: 'Member birthdays',
      icon: Cake,
      color: 'from-pink-500 to-rose-500',
      action: () => onNavigate('birthdays')
    },
    {
      id: 'performance',
      label: 'Performance',
      description: 'Member rankings',
      icon: Trophy,
      color: 'from-amber-500 to-yellow-500',
      action: () => onNavigate('performance')
    },
    {
      id: 'backup',
      label: 'Backup',
      description: 'Export/Import data',
      icon: HardDrive,
      color: 'from-slate-500 to-gray-600',
      action: () => onNavigate('backup'),
      permission: 'export_data'
    },
    {
      id: 'bank',
      label: 'Bank Verify',
      description: 'IFSC lookup',
      icon: Building2,
      color: 'from-emerald-500 to-green-600',
      action: () => onNavigate('bank-verification')
    },
    {
      id: 'minutes',
      label: 'Minutes',
      description: 'Meeting notes',
      icon: ClipboardList,
      color: 'from-violet-500 to-purple-600',
      action: () => onNavigate('meeting-minutes'),
      permission: 'view_meeting_minutes'
    },
    {
      id: 'gps',
      label: 'GPS Check-in',
      description: 'Location attendance',
      icon: MapPin,
      color: 'from-cyan-500 to-blue-600',
      action: () => onNavigate('gps-attendance'),
      permission: 'use_gps_attendance'
    }
  ];

  // Filter actions based on permissions
  const actions = useMemo(() => {
    return allActions.filter(action => {
      if (!action.permission) return true;
      return can(action.permission);
    });
  }, [allActions, can]);

  const visibleActions = isExpanded ? actions : actions.slice(0, 4);

  return (
    <>
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-white/80">{t('quickActions')}</h2>
          </div>
          <button
            onClick={() => { tap('light'); setIsExpanded(!isExpanded); }}
            className="text-xs text-primary hover:underline"
          >
            {isExpanded ? t('showLess') : t('viewAllActions')}
          </button>
        </div>

        <motion.div 
          layout
          className="grid grid-cols-4 gap-3"
        >
          <AnimatePresence>
            {visibleActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => { tap('light'); action.action(); }}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-surface border border-white/5 hover:border-white/20 transition-all active:scale-95"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white/70 text-center leading-tight">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* UPI Payment Modal */}
      <UPIPayment
        isOpen={showUPI}
        onClose={() => setShowUPI(false)}
      />

      {/* Document Scanner Modal */}
      <DocumentScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
};

// Horizontal scrollable version for compact spaces
export const QuickActionsHorizontal: React.FC<QuickActionsProps> = ({ onNavigate }) => {
  const { tap } = useHaptics();
  const [showUPI, setShowUPI] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const actions = [
    { id: 'calculator', label: 'Calculator', icon: Calculator, color: 'bg-blue-500', action: () => onNavigate('calculator') },
    { id: 'goals', label: 'Goals', icon: Target, color: 'bg-green-500', action: () => onNavigate('savings-goals') },
    { id: 'announce', label: 'Announce', icon: Megaphone, color: 'bg-purple-500', action: () => onNavigate('announcements') },
    { id: 'vote', label: 'Vote', icon: Vote, color: 'bg-orange-500', action: () => onNavigate('voting') },
    { id: 'chat', label: 'Chat', icon: MessageCircle, color: 'bg-indigo-500', action: () => onNavigate('chat') },
    { id: 'upi', label: 'UPI', icon: QrCode, color: 'bg-teal-500', action: () => setShowUPI(true) },
    { id: 'scan', label: 'Scan', icon: Camera, color: 'bg-yellow-500', action: () => setShowScanner(true) },
  ];

  return (
    <>
      <div className="px-4 mb-4 overflow-x-auto hide-scrollbar">
        <div className="flex gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => { tap('light'); action.action(); }}
              className="flex flex-col items-center gap-1.5 min-w-[60px]"
            >
              <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] text-white/60">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <UPIPayment isOpen={showUPI} onClose={() => setShowUPI(false)} />
      <DocumentScanner isOpen={showScanner} onClose={() => setShowScanner(false)} />
    </>
  );
};
