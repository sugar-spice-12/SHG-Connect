import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cake, Calendar, Gift, Bell, Phone, MessageCircle, 
  Plus, X, Check, ChevronRight, Sparkles, Heart
} from 'lucide-react';
import { 
  getTodaysBirthdays, 
  getUpcomingBirthdays, 
  saveMemberBirthday, 
  getMemberBirthdays,
  calculateAge,
  MemberBirthday
} from '../lib/birthday';
import { openWhatsApp, whatsAppTemplates } from '../lib/communication';
import toast from 'react-hot-toast';

export const Birthdays: React.FC = () => {
  const { t } = useLanguage();
  const { members } = useData();
  const [todaysBirthdays, setTodaysBirthdays] = useState<MemberBirthday[]>([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<(MemberBirthday & { daysUntil?: number })[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    loadBirthdays();
  }, []);

  const loadBirthdays = () => {
    setTodaysBirthdays(getTodaysBirthdays());
    setUpcomingBirthdays(getUpcomingBirthdays(30));
  };

  const handleAddBirthday = () => {
    if (!selectedMember || !birthDate) {
      toast.error('Please fill all fields');
      return;
    }

    const member = members.find(m => m.id === selectedMember);
    if (!member) return;

    // Convert date format
    const [year, month, day] = birthDate.split('-');
    const formattedDate = `${day}/${month}/${year}`;

    saveMemberBirthday({
      memberId: member.id,
      memberName: member.name,
      dateOfBirth: formattedDate,
      phone: member.phoneNumber
    });

    toast.success('Birthday added!', { icon: '🎂' });
    setShowAddModal(false);
    setSelectedMember('');
    setBirthDate('');
    loadBirthdays();
  };

  const sendBirthdayWish = (birthday: MemberBirthday) => {
    if (birthday.phone) {
      openWhatsApp(birthday.phone, whatsAppTemplates.birthdayWish(birthday.memberName));
    } else {
      toast.error('No phone number available');
    }
  };

  const existingBirthdayIds = getMemberBirthdays().map(b => b.memberId);
  const membersWithoutBirthday = members.filter(m => !existingBirthdayIds.includes(m.id));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 min-h-screen"
    >
      <Header 
        title={t('birthdayReminder')} 
        subtitle="Celebrate your members"
        showProfile={false}
      />

      <div className="px-6 space-y-6">
        {/* Today's Birthdays */}
        {todaysBirthdays.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 p-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Cake className="text-white" size={24} />
                <h2 className="text-xl font-bold text-white">Today's Birthdays!</h2>
              </div>
              
              <div className="space-y-3">
                {todaysBirthdays.map(birthday => (
                  <motion.div
                    key={birthday.memberId}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                        <span className="text-2xl">🎂</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{birthday.memberName}</h3>
                        <p className="text-white/70 text-sm">
                          Turns {calculateAge(birthday.dateOfBirth)} today!
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => sendBirthdayWish(birthday)}
                      className="bg-white text-purple-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors"
                    >
                      <Gift size={16} />
                      Wish
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Birthdays */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider">
              Upcoming Birthdays
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-400 text-xs flex items-center gap-1"
            >
              <Plus size={14} />
              Add Birthday
            </button>
          </div>

          {upcomingBirthdays.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center">
              <Calendar className="mx-auto mb-3 text-white/20" size={48} />
              <p className="text-white/40">No upcoming birthdays</p>
              <p className="text-white/20 text-sm mt-1">Add member birthdays to get reminders</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBirthdays.map((birthday, index) => (
                <motion.div
                  key={birthday.memberId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-panel p-4 rounded-2xl flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      (birthday as any).daysUntil === 0 
                        ? 'bg-pink-500/20 text-pink-400' 
                        : (birthday as any).daysUntil <= 7 
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-white/5 text-white/40'
                    }`}>
                      <Cake size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{birthday.memberName}</h4>
                      <p className="text-white/40 text-xs">{birthday.dateOfBirth}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${
                      (birthday as any).daysUntil === 0 
                        ? 'bg-pink-500/20 text-pink-400' 
                        : (birthday as any).daysUntil <= 7 
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-white/5 text-white/40'
                    }`}>
                      {(birthday as any).daysUntil === 0 
                        ? 'Today!' 
                        : (birthday as any).daysUntil === 1 
                          ? 'Tomorrow'
                          : `${(birthday as any).daysUntil} days`}
                    </span>
                    
                    {birthday.phone && (
                      <button
                        onClick={() => sendBirthdayWish(birthday)}
                        className="p-2 text-white/30 hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <MessageCircle size={18} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-2xl text-center">
            <div className="text-3xl font-bold text-pink-400">{getMemberBirthdays().length}</div>
            <p className="text-white/40 text-xs mt-1">Birthdays Saved</p>
          </div>
          <div className="glass-panel p-4 rounded-2xl text-center">
            <div className="text-3xl font-bold text-purple-400">{upcomingBirthdays.length}</div>
            <p className="text-white/40 text-xs mt-1">This Month</p>
          </div>
        </div>
      </div>

      {/* Add Birthday Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#1C1C1E] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Birthday</h3>
                <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs mb-2 block">Select Member</label>
                  <select
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">Choose member...</option>
                    {membersWithoutBirthday.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-white/50 text-xs mb-2 block">Date of Birth</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddBirthday}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Cake size={18} />
                  Save Birthday
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
