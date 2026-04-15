import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ArrowLeft, 
  Search,
  Filter,
  User,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Eye,
  Download,
  Plus,
  ChevronRight,
  MapPin,
  AlertTriangle,
  X
} from 'lucide-react';
import { useHaptics } from '../hooks/useNative';
import { AuditLogEntry, DeviceSession } from '../types';
import { useAuth } from '../context/AuthContext';
import { useRBAC } from '../hooks/useRBAC';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

interface AuditLogProps {
  onBack: () => void;
}

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    userId: 'current-user',
    userName: 'You',
    action: 'login',
    entityType: 'settings',
    description: 'Logged in from Android device',
    timestamp: '2026-01-29T14:30:00',
    deviceInfo: 'Android 14, Chrome'
  },
  {
    id: '2',
    userId: 'current-user',
    userName: 'You',
    action: 'create',
    entityType: 'transaction',
    entityId: 'txn_123',
    description: 'Created savings transaction of ₹5,000',
    timestamp: '2026-01-29T14:25:00',
    changes: [{ field: 'amount', oldValue: null, newValue: 5000 }]
  },
  {
    id: '3',
    userId: 'u1',
    userName: 'Lakshmi',
    action: 'update',
    entityType: 'member',
    entityId: 'mem_456',
    description: 'Updated member profile',
    timestamp: '2026-01-29T12:00:00',
    changes: [{ field: 'phoneNumber', oldValue: '9876543210', newValue: '9876543211' }]
  },
  {
    id: '4',
    userId: 'current-user',
    userName: 'You',
    action: 'export',
    entityType: 'report',
    description: 'Exported monthly report as PDF',
    timestamp: '2026-01-28T16:45:00'
  },
  {
    id: '5',
    userId: 'u2',
    userName: 'Priya',
    action: 'create',
    entityType: 'loan',
    entityId: 'loan_789',
    description: 'Created new loan of ₹25,000',
    timestamp: '2026-01-28T10:30:00'
  },
  {
    id: '6',
    userId: 'current-user',
    userName: 'You',
    action: 'view',
    entityType: 'member',
    entityId: 'mem_123',
    description: 'Viewed member profile: Meena',
    timestamp: '2026-01-27T09:15:00'
  }
];

const mockDevices: DeviceSession[] = [
  {
    id: 'd1',
    userId: 'current-user',
    deviceName: 'Samsung Galaxy S24',
    deviceType: 'mobile',
    browser: 'Chrome',
    os: 'Android 14',
    ipAddress: '192.168.1.100',
    location: 'Mumbai, India',
    lastActive: '2026-01-29T14:30:00',
    createdAt: '2026-01-15T10:00:00',
    isCurrent: true
  },
  {
    id: 'd2',
    userId: 'current-user',
    deviceName: 'Windows PC',
    deviceType: 'desktop',
    browser: 'Edge',
    os: 'Windows 11',
    ipAddress: '192.168.1.101',
    location: 'Mumbai, India',
    lastActive: '2026-01-28T18:00:00',
    createdAt: '2026-01-10T14:00:00',
    isCurrent: false
  }
];

export const AuditLog: React.FC<AuditLogProps> = ({ onBack }) => {
  const { tap, notify } = useHaptics();
  const { currentUserRole } = useAuth();
  const { can, isLeader } = useRBAC();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'logs' | 'devices'>('logs');
  const [logs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [devices, setDevices] = useState<DeviceSession[]>(mockDevices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const canViewAll = can('view_audit_log');

  // If user doesn't have permission, show access denied
  if (!canViewAll) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-background"
      >
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-white/5">
          <div className="px-6 py-4 flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-white/70" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{t('securityLog')}</h1>
              <p className="text-xs text-white/50">{t('activityLog')}</p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center p-8 mt-20 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {t('accessDenied')}
          </h3>
          <p className="text-white/60 text-sm max-w-xs">
            {t('leaderOnlyFeature')}
          </p>
        </div>
      </motion.div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesFilter;
  });

  const handleRevokeDevice = (deviceId: string) => {
    tap('medium');
    setDevices(devices.filter(d => d.id !== deviceId));
    notify('success');
    toast.success('Device session revoked');
  };

  const getActionIcon = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'login': return LogIn;
      case 'logout': return LogOut;
      case 'create': return Plus;
      case 'update': return Edit;
      case 'delete': return Trash2;
      case 'view': return Eye;
      case 'export': return Download;
      default: return Shield;
    }
  };

  const getActionColor = (action: AuditLogEntry['action']) => {
    switch (action) {
      case 'login': return 'text-green-400 bg-green-500/20';
      case 'logout': return 'text-orange-400 bg-orange-500/20';
      case 'create': return 'text-blue-400 bg-blue-500/20';
      case 'update': return 'text-yellow-400 bg-yellow-500/20';
      case 'delete': return 'text-red-400 bg-red-500/20';
      case 'view': return 'text-purple-400 bg-purple-500/20';
      case 'export': return 'text-cyan-400 bg-cyan-500/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getDeviceIcon = (type: DeviceSession['deviceType']) => {
    switch (type) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Smartphone;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
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
        <div className="px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => { tap('light'); onBack(); }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Security & Activity</h1>
            <p className="text-xs text-white/50">Monitor account activity</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => { tap('light'); setActiveTab('logs'); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'logs' ? 'bg-primary text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            Activity Log
          </button>
          <button
            onClick={() => { tap('light'); setActiveTab('devices'); }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'devices' ? 'bg-primary text-white' : 'bg-white/5 text-white/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Devices
          </button>
        </div>
      </div>

      {activeTab === 'logs' && (
        <div className="px-4 py-4 space-y-4">
          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activity..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 text-white text-sm focus:outline-none focus:border-primary"
            >
              <option value="all">All</option>
              <option value="login">Login</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="export">Export</option>
            </select>
          </div>

          {/* Activity List */}
          <div className="space-y-2">
            {filteredLogs.map((log, index) => {
              const Icon = getActionIcon(log.action);
              const colorClass = getActionColor(log.action);
              
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-surface rounded-xl p-4 border border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{log.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(log.timestamp)}
                        </span>
                        {log.deviceInfo && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            {log.deviceInfo}
                          </span>
                        )}
                      </div>

                      {/* Changes */}
                      {log.changes && log.changes.length > 0 && (
                        <div className="mt-2 p-2 bg-white/5 rounded-lg">
                          {log.changes.map((change, i) => (
                            <div key={i} className="text-xs">
                              <span className="text-white/50">{change.field}:</span>
                              <span className="text-red-400 line-through ml-2">{change.oldValue || 'null'}</span>
                              <span className="text-white/30 mx-1">→</span>
                              <span className="text-green-400">{change.newValue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No activity found</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'devices' && (
        <div className="px-4 py-4 space-y-4">
          {/* Security Alert */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Security Tip</p>
              <p className="text-xs text-white/60 mt-1">
                If you see any unfamiliar devices, revoke their access immediately and change your password.
              </p>
            </div>
          </div>

          {/* Device List */}
          <div className="space-y-3">
            {devices.map((device, index) => {
              const Icon = getDeviceIcon(device.deviceType);
              
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-surface rounded-2xl p-4 border ${
                    device.isCurrent ? 'border-green-500/30' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      device.isCurrent ? 'bg-green-500/20' : 'bg-white/10'
                    }`}>
                      <Icon className={`w-6 h-6 ${device.isCurrent ? 'text-green-400' : 'text-white/60'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{device.deviceName}</h3>
                        {device.isCurrent && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            This device
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-white/50 mt-1">
                        {device.browser} • {device.os}
                      </p>
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                        {device.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {device.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(device.lastActive)}
                        </span>
                      </div>
                    </div>
                    
                    {!device.isCurrent && (
                      <button
                        onClick={() => handleRevokeDevice(device.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Revoke All Button */}
          {devices.filter(d => !d.isCurrent).length > 0 && (
            <button
              onClick={() => {
                tap('medium');
                setDevices(devices.filter(d => d.isCurrent));
                notify('success');
                toast.success('All other sessions revoked');
              }}
              className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-colors"
            >
              Sign Out All Other Devices
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};
