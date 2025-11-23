import React, { useState } from 'react';
import { Bell, Search, ChevronLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { NotificationPanel } from './NotificationPanel';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showProfile?: boolean;
  onBack?: () => void;
  onProfileClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showProfile = true, onBack, onProfileClick }) => {
  const { t } = useLanguage();
  const { notifications, markNotificationRead } = useData();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Extract first name for greeting
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <div className="pt-6 pb-4 px-6 flex justify-between items-center z-20 relative">
      <div className="flex items-center gap-4">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:bg-white/10 transition-colors active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <div>
          {subtitle && <p className="text-blue-400 text-xs font-bold tracking-wider mb-1 uppercase">{subtitle}</p>}
          <h1 className="text-2xl font-bold text-white leading-tight whitespace-pre-line">
            {title || `${t('welcome')},\n${firstName}`}
          </h1>
        </div>
      </div>
      
      <div className="flex gap-3 relative">
        <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors">
          <Search size={18} />
        </button>
        
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/70 hover:bg-white/10 transition-colors relative"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>

        {showNotifications && (
            <NotificationPanel 
                notifications={notifications} 
                onClose={() => setShowNotifications(false)}
                onMarkRead={markNotificationRead}
            />
        )}

        {showProfile && (
          <button 
            onClick={onProfileClick}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 p-[2px] cursor-pointer hover:scale-105 transition-transform"
          >
            <img src="https://picsum.photos/100/100" alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-[#0D0D0F]" />
          </button>
        )}
      </div>
    </div>
  );
};