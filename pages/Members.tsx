import React, { useState, useMemo, useCallback, memo } from 'react';
import { Header } from '../components/Header';
import { useData } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ChevronRight, Plus, X, User, Calendar, Search, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../lib/hooks';
import { useRBAC } from '../hooks/useRBAC';
import { PermissionGate, RoleBadge } from '../components/PermissionGate';
import toast from 'react-hot-toast';
import { Member } from '../types';

interface MembersProps {
  onSelectMember?: (id: string) => void;
}

// Memoized Member Card Component for better performance
const MemberCard = memo(({ 
  member, 
  onSelect, 
  onCall,
  t 
}: { 
  member: Member; 
  onSelect: () => void; 
  onCall: (phone: string, name: string, e: React.MouseEvent) => void;
  t: (key: string) => string;
}) => (
  <div 
    onClick={onSelect}
    className="glass-panel p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden group cursor-pointer hover:bg-white/5 transition-all hover:scale-[1.02]"
  >
    {/* Status Indicator strip */}
    <div className={`absolute left-0 top-0 bottom-0 w-1 ${member.attendanceRate > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} />

    <div className="relative">
      <img src={member.avatarUrl} alt={member.name} className="w-14 h-14 rounded-full object-cover border-2 border-white/5 group-hover:border-blue-500/50 transition-colors" />
      {member.role === 'SHG Leader' && (
        <span className="absolute -bottom-1 -right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#0D0D0F] shadow-sm">LEADER</span>
      )}
    </div>
    
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-white text-base truncate group-hover:text-blue-400 transition-colors">{member.name}</h3>
      <div className="flex flex-col gap-1 mt-1">
        <div className="text-xs text-white/50 flex items-center justify-between">
          <span>{t('savings')}</span>
          <span className="text-white font-medium">₹{member.savingsBalance.toLocaleString()}</span>
        </div>
        {member.loanOutstanding > 0 && (
          <div className="text-xs text-white/50 flex items-center justify-between">
            <span>Loan</span>
            <span className="text-red-400 font-medium">₹{member.loanOutstanding.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>

    <div className="flex flex-col items-end justify-between h-full gap-2 pl-2 border-l border-white/5">
      <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
      {member.phoneNumber && (
        <button 
          onClick={(e) => onCall(member.phoneNumber!, member.name, e)}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-green-400 hover:bg-green-500 hover:text-white transition-colors active:scale-90"
          title={`Call ${member.name}`}
        >
          <Phone size={14} />
        </button>
      )}
    </div>
  </div>
));

MemberCard.displayName = 'MemberCard';

export const Members: React.FC<MembersProps> = ({ onSelectMember }) => {
  const { members, addMember } = useData();
  const { t } = useLanguage();
  const { currentUserRole, user } = useAuth();
  const { can, canManageMember, getRoleLabel, isMemberOnly } = useRBAC();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Member' | 'SHG Leader' | 'Animator'>('Member');

  // Handle phone call - memoized
  const handleCall = useCallback((phoneNumber: string, memberName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!phoneNumber) {
      toast.error("No phone number available");
      return;
    }

    // Format phone number (remove any spaces or special characters)
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit number
    if (cleanPhone.length !== 10) {
      toast.error("Invalid phone number");
      return;
    }

    // Initiate call
    const telLink = `tel:+91${cleanPhone}`;
    window.location.href = telLink;
    
    // Show feedback
    toast.success(`Calling ${memberName}...`, { icon: '📞' });
  }, []);

  const handleAddMember = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName) {
      toast.error("Name is required");
      return;
    }

    if (newMemberPhone && !/^\d{10}$/.test(newMemberPhone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    addMember({
      name: newMemberName,
      role: newMemberRole,
      phoneNumber: newMemberPhone,
      avatarUrl: `https://picsum.photos/200/200?random=${Date.now()}`,
      joinedDate: new Date().toLocaleDateString('en-GB'),
    });

    toast.success(t('saveMember'), { icon: '✅' });
    setShowAddModal(false);
    // Reset form
    setNewMemberName('');
    setNewMemberPhone('');
    setNewMemberRole('Member');
  }, [newMemberName, newMemberPhone, newMemberRole, addMember, t]);

  // Filter and search members - memoized for performance
  // Members can only see themselves, Animators can see all but limited actions
  const displayedMembers = useMemo(() => {
    let filtered = members;
    
    // Members can only see their own profile
    if (isMemberOnly && user?.memberId) {
      filtered = members.filter(m => m.id === user.memberId);
    }
    
    // Apply search filter
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(query) ||
        m.phoneNumber?.includes(query) ||
        m.role.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [members, isMemberOnly, user?.memberId, debouncedSearch]);

  // Memoized member select handler
  const handleMemberSelect = useCallback((id: string) => {
    onSelectMember?.(id);
  }, [onSelectMember]);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pb-24 relative"
    >
      <Header title={t('groupMembers')} subtitle={`SHG • ${members.length} Active`} showProfile={false} />
      
      {/* Search Bar */}
      <div className="px-6 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {debouncedSearch && (
          <p className="text-xs text-white/40 mt-2 ml-1">
            Found {displayedMembers.length} member{displayedMembers.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
      
      <div className="px-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
        {displayedMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onSelect={() => handleMemberSelect(member.id)}
            onCall={handleCall}
            t={t}
          />
        ))}
        
        {displayedMembers.length === 0 && isMemberOnly && (
            <div className="col-span-full text-center p-10 text-white/30">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t('viewOnlyAccess')}</p>
                <p className="text-xs mt-2">{t('noPermissionMessage')}</p>
            </div>
        )}
      </div>

      {/* Add Member FAB - Only for users with add_member permission */}
      <PermissionGate permission="add_member">
        <button 
            onClick={() => setShowAddModal(true)}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-blue-900/50 font-bold active:scale-90 transition-transform hover:scale-105 z-50"
        >
            <Plus size={24} />
        </button>
      </PermissionGate>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-[#1C1C1E] rounded-t-3xl md:rounded-3xl p-6 border border-white/10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">{t('addMember')}</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-white/5 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium ml-1">{t('fullName')}</label>
                  <div className="bg-white/5 rounded-xl flex items-center px-4 border border-white/5 focus-within:border-blue-500/50 transition-colors">
                    <User size={18} className="text-white/30 mr-3" />
                    <input 
                      type="text" 
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Lakshmi Devi"
                      className="w-full h-12 bg-transparent outline-none text-white placeholder:text-white/20"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium ml-1">{t('phoneNumber')}</label>
                  <div className="bg-white/5 rounded-xl flex items-center px-4 border border-white/5 focus-within:border-blue-500/50 transition-colors">
                    <Phone size={18} className="text-white/30 mr-3" />
                    <input 
                      type="tel" 
                      value={newMemberPhone}
                      onChange={(e) => setNewMemberPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full h-12 bg-transparent outline-none text-white placeholder:text-white/20"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-[10px] text-white/30 ml-1">Must be 10 digits</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium ml-1">{t('role')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Member', 'SHG Leader', 'Animator'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setNewMemberRole(role)}
                        className={`py-3 rounded-xl text-sm font-medium border transition-all ${
                          newMemberRole === role 
                            ? 'bg-blue-600 border-blue-500 text-white' 
                            : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                        }`}
                      >
                        {role === 'SHG Leader' ? 'Leader' : role}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-white/50 font-medium ml-1">{t('joined')}</label>
                  <div className="bg-white/5 rounded-xl flex items-center px-4 py-3 text-white/50 border border-white/5">
                     <Calendar size={18} className="mr-3 opacity-50" />
                     <span>{new Date().toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white text-lg mt-4 shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-transform"
                >
                  {t('saveMember')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};