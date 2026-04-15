import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, 
  ArrowLeft, 
  Plus, 
  Bell, 
  AlertTriangle,
  Calendar,
  IndianRupee,
  X,
  Check,
  CheckCheck,
  Clock,
  User,
  Send,
  Pin,
  Trash2
} from 'lucide-react';
import { useHaptics, useNotifications } from '../hooks/useNative';
import { useLanguage } from '../context/LanguageContext';
import { Announcement } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { PermissionGate } from '../components/PermissionGate';
import toast from 'react-hot-toast';

interface AnnouncementsProps {
  onBack: () => void;
}

const mockAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Monthly Meeting Reminder',
    message: 'Our next monthly meeting is scheduled for Sunday, February 2nd at 10:00 AM. Please ensure all members attend with their savings contributions.',
    type: 'meeting',
    createdBy: 'user1',
    createdByName: 'Lakshmi (Leader)',
    createdAt: '2026-01-28T10:00:00',
    readBy: ['user1', 'user2']
  },
  {
    id: '2',
    title: '⚠️ Loan Repayment Due',
    message: 'Reminder: Loan repayments are due by the end of this month. Members with outstanding loans please make your payments before the deadline to avoid penalties.',
    type: 'urgent',
    createdBy: 'user1',
    createdByName: 'Lakshmi (Leader)',
    createdAt: '2026-01-27T14:30:00',
    readBy: ['user1']
  },
  {
    id: '3',
    title: 'New Savings Scheme Launched',
    message: 'We are excited to announce a new recurring deposit scheme with 8% annual interest. Contact the group leader for more details.',
    type: 'general',
    createdBy: 'user1',
    createdByName: 'Lakshmi (Leader)',
    createdAt: '2026-01-25T09:00:00',
    readBy: ['user1', 'user2', 'user3', 'user4']
  }
];

export const Announcements: React.FC<AnnouncementsProps> = ({ onBack }) => {
  const { tap, notify } = useHaptics();
  const { t } = useLanguage();
  const { schedule: scheduleNotification } = useNotifications();
  const { user, currentUserRole } = useAuth();
  const { can } = useRBAC();
  
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // New announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'general' as Announcement['type']
  });

  const canCreate = can('create_announcement');
  const currentUserId = user?.id || 'current-user';

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === 'unread') {
      return !a.readBy.includes(currentUserId);
    }
    return true;
  });

  const unreadCount = announcements.filter(a => !a.readBy.includes(currentUserId)).length;

  const handleMarkAsRead = (id: string) => {
    setAnnouncements(announcements.map(a => {
      if (a.id === id && !a.readBy.includes(currentUserId)) {
        return { ...a, readBy: [...a.readBy, currentUserId] };
      }
      return a;
    }));
  };

  const handleMarkAllRead = () => {
    tap('medium');
    setAnnouncements(announcements.map(a => ({
      ...a,
      readBy: a.readBy.includes(currentUserId) ? a.readBy : [...a.readBy, currentUserId]
    })));
    notify('success');
    toast.success(t('allMarkedAsRead'));
  };

  const handleCreate = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message) {
      toast.error(t('pleaseFillAllFields'));
      return;
    }

    const announcement: Announcement = {
      id: Date.now().toString(),
      title: newAnnouncement.title,
      message: newAnnouncement.message,
      type: newAnnouncement.type,
      createdBy: currentUserId,
      createdByName: user?.name || 'You',
      createdAt: new Date().toISOString(),
      readBy: [currentUserId]
    };

    setAnnouncements([announcement, ...announcements]);
    setShowCreateModal(false);
    setNewAnnouncement({ title: '', message: '', type: 'general' });
    
    // Schedule notification
    await scheduleNotification({
      id: Date.now(),
      title: t('newAnnouncement'),
      body: newAnnouncement.title
    });
    
    notify('success');
    toast.success(t('announcementPosted'));
  };

  const handleDelete = (id: string) => {
    tap('medium');
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success(t('deleted'));
  };

  const getTypeIcon = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'meeting': return Calendar;
      case 'payment': return IndianRupee;
      default: return Bell;
    }
  };

  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'urgent': return 'from-red-500 to-orange-500';
      case 'meeting': return 'from-blue-500 to-cyan-500';
      case 'payment': return 'from-green-500 to-emerald-500';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return t('justNowLabel');
    if (hours < 24) return t('hoursAgoLabel', { hours });
    if (days < 7) return t('daysAgoLabel', { days });
    return date.toLocaleDateString();
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
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { tap('light'); onBack(); }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">{t('announcements')}</h1>
              <p className="text-xs text-white/50">
                {unreadCount > 0 ? `${unreadCount} ${t('unread')}` : '✓'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10"
                title="Mark all as read"
              >
                <CheckCheck className="w-5 h-5" />
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => { tap('medium'); setShowCreateModal(true); }}
                className="p-2 rounded-xl bg-primary hover:bg-primary/80"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => { tap('light'); setFilter('all'); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === 'all' ? 'bg-white/10 text-white' : 'text-white/50'
            }`}
          >
            {t('all')} ({announcements.length})
          </button>
          <button
            onClick={() => { tap('light'); setFilter('unread'); }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === 'unread' ? 'bg-white/10 text-white' : 'text-white/50'
            }`}
          >
            {t('unread')} ({unreadCount})
          </button>
        </div>
      </div>

      <div className="px-4 pt-2 pb-4 space-y-3">
        {filteredAnnouncements.map((announcement, index) => {
          const Icon = getTypeIcon(announcement.type);
          const isRead = announcement.readBy.includes(currentUserId);
          const isOwner = announcement.createdBy === currentUserId;
          
          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleMarkAsRead(announcement.id)}
              className={`bg-surface rounded-2xl p-4 border transition-all cursor-pointer ${
                isRead ? 'border-white/5' : 'border-primary/30 bg-primary/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getTypeColor(announcement.type)} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-semibold ${!isRead ? 'text-white' : 'text-white/80'}`}>
                      {announcement.title}
                    </h3>
                    {!isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </div>
                  
                  <p className="text-sm text-white/60 mt-1 line-clamp-2">
                    {announcement.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <User className="w-3 h-3" />
                      <span>{announcement.createdByName}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(announcement.createdAt)}</span>
                    </div>
                    
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(announcement.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">
              {filter === 'unread' ? t('noUnreadAnnouncements') : t('noAnnouncementsYet')}
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{t('newAnnouncement')}</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 rounded-xl bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('type')}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'general', label: t('general'), icon: Bell },
                      { id: 'urgent', label: t('urgent'), icon: AlertTriangle },
                      { id: 'meeting', label: t('meeting'), icon: Calendar },
                      { id: 'payment', label: t('payment'), icon: IndianRupee }
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setNewAnnouncement({ ...newAnnouncement, type: type.id as any })}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                          newAnnouncement.type === type.id
                            ? 'bg-primary/20 border border-primary'
                            : 'bg-white/5 border border-transparent'
                        }`}
                      >
                        <type.icon className="w-5 h-5" />
                        <span className="text-xs">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('title')}</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary"
                    placeholder={t('announcementTitlePlaceholder')}
                  />
                </div>

                <div>
                  <label className="text-sm text-white/60 mb-2 block">{t('message')}</label>
                  <textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary resize-none"
                    placeholder={t('writeYourAnnouncement')}
                  />
                </div>

                <button
                  onClick={handleCreate}
                  className="w-full py-3 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/80"
                >
                  <Send className="w-5 h-5" />
                  {t('postAnnouncement')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
