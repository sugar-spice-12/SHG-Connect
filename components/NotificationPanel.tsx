
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Calendar, Info } from 'lucide-react';
import { Notification } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onMarkRead }) => {
  const { t } = useLanguage();

  const getIcon = (type: Notification['type']) => {
    switch(type) {
      case 'warning': return <AlertCircle className="text-orange-400" size={20} />;
      case 'alert': return <AlertCircle className="text-red-400" size={20} />;
      case 'success': return <CheckCircle className="text-green-400" size={20} />;
      default: return <Info className="text-blue-400" size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute top-16 right-4 w-80 max-w-[90vw] bg-[#1C1C1E] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Bell size={16} /> {t('notifications')}
        </h3>
        <button onClick={onClose} className="text-xs text-blue-400 hover:text-blue-300">Close</button>
      </div>
      
      <div className="max-h-[60vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-white/30 text-sm">
            No new notifications
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => onMarkRead(n.id)}
                className={`p-4 hover:bg-white/5 transition-colors cursor-pointer relative ${n.read ? 'opacity-50' : 'opacity-100'}`}
              >
                <div className="flex gap-3">
                  <div className="mt-1 shrink-0">{getIcon(n.type)}</div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{n.title}</h4>
                    <p className="text-xs text-white/60 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1">
                      <Calendar size={10} /> {n.date}
                    </p>
                  </div>
                </div>
                {!n.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
