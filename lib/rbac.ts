/**
 * Role-Based Access Control (RBAC) System
 * Defines permissions for Member, SHG Leader, and Animator roles
 */

import { Role } from '../types';

// Define all possible permissions in the app
export type Permission =
  // Dashboard
  | 'view_dashboard'
  | 'view_group_stats'
  
  // Members
  | 'view_members'
  | 'view_member_profile'
  | 'add_member'
  | 'edit_member'
  | 'delete_member'
  | 'view_own_profile'
  | 'edit_own_profile'
  
  // Transactions
  | 'view_transactions'
  | 'view_own_transactions'
  | 'add_transaction'
  | 'edit_transaction'
  | 'delete_transaction'
  | 'record_savings'
  | 'record_expense'
  
  // Loans
  | 'view_loans'
  | 'view_own_loans'
  | 'create_loan'
  | 'approve_loan'
  | 'record_repayment'
  | 'edit_loan'
  | 'delete_loan'
  
  // Meetings
  | 'view_meetings'
  | 'start_meeting'
  | 'end_meeting'
  | 'mark_attendance'
  | 'view_attendance'
  
  // Reports & Analytics
  | 'view_reports'
  | 'view_analytics'
  | 'export_reports'
  | 'generate_receipts'
  
  // Announcements
  | 'view_announcements'
  | 'create_announcement'
  | 'edit_announcement'
  | 'delete_announcement'
  
  // Voting & Polls
  | 'view_polls'
  | 'create_poll'
  | 'vote_in_poll'
  | 'close_poll'
  
  // Chat
  | 'view_chat'
  | 'send_message'
  
  // Savings Goals
  | 'view_savings_goals'
  | 'create_savings_goal'
  | 'contribute_to_goal'
  | 'edit_savings_goal'
  | 'delete_savings_goal'
  
  // Settings
  | 'view_settings'
  | 'change_language'
  | 'manage_security'
  | 'view_audit_log'
  
  // Documents
  | 'view_own_documents'
  | 'upload_own_documents'
  | 'view_member_documents' // Only for authorized roles
  
  // Communication
  | 'call_members'
  | 'whatsapp_members'
  | 'sms_members'
  
  // Calculator & Tools
  | 'use_calculator'
  | 'use_voice_commands'
  | 'scan_documents'
  | 'generate_upi_qr'
  
  // New Features
  | 'view_birthdays'
  | 'add_birthday'
  | 'view_performance'
  | 'export_data'
  | 'import_data'
  | 'view_bank_accounts'
  | 'add_bank_account'
  | 'verify_bank_account'
  | 'view_meeting_minutes'
  | 'create_meeting_minutes'
  | 'edit_meeting_minutes'
  | 'use_gps_attendance'
  | 'manage_meeting_locations'
  | 'view_loan_guarantors'
  | 'add_loan_guarantor';

// Role hierarchy (higher number = more permissions)
export const ROLE_HIERARCHY: Record<Role, number> = {
  'Member': 1,
  'Animator': 2,
  'SHG Leader': 3,
  'CRP': 4  // Community Resource Person (highest for auditing)
};

// Define permissions for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  'Member': [
    // Dashboard - Limited view
    'view_dashboard',
    
    // Members - Can view list but limited profile access
    'view_members',
    'view_member_profile',
    'view_own_profile',
    'edit_own_profile',
    
    // Transactions - Own only
    'view_own_transactions',
    
    // Loans - Own only
    'view_own_loans',
    
    // Meetings - View and attendance
    'view_meetings',
    'view_attendance',
    
    // Reports - Limited
    'view_reports',
    
    // Announcements - View only
    'view_announcements',
    
    // Voting
    'view_polls',
    'vote_in_poll',
    
    // Chat
    'view_chat',
    'send_message',
    
    // Savings Goals
    'view_savings_goals',
    'contribute_to_goal',
    
    // Settings - Own only
    'view_settings',
    'change_language',
    'manage_security',
    
    // Documents - Own only
    'view_own_documents',
    'upload_own_documents',
    
    // Tools
    'use_calculator',
    'use_voice_commands',
    
    // New Features - Limited for Members
    'view_birthdays',
    'view_performance',
  ],
  
  'Animator': [
    // All Member permissions plus:
    // Dashboard
    'view_dashboard',
    'view_group_stats',
    
    // Members - Can view and help with profiles
    'view_members',
    'view_member_profile',
    'view_own_profile',
    'edit_own_profile',
    'add_member', // Can help add members
    
    // Transactions - Can view all and record
    'view_transactions',
    'view_own_transactions',
    'add_transaction',
    'record_savings',
    
    // Loans - Can view all
    'view_loans',
    'view_own_loans',
    'record_repayment',
    
    // Meetings - Can assist
    'view_meetings',
    'mark_attendance',
    'view_attendance',
    
    // Reports
    'view_reports',
    'view_analytics',
    'export_reports',
    
    // Announcements - Can create
    'view_announcements',
    'create_announcement',
    
    // Voting
    'view_polls',
    'create_poll',
    'vote_in_poll',
    
    // Chat
    'view_chat',
    'send_message',
    
    // Savings Goals
    'view_savings_goals',
    'create_savings_goal',
    'contribute_to_goal',
    
    // Settings
    'view_settings',
    'change_language',
    'manage_security',
    
    // Documents - Own only
    'view_own_documents',
    'upload_own_documents',
    
    // Communication
    'call_members',
    'whatsapp_members',
    
    // Tools
    'use_calculator',
    'use_voice_commands',
    'scan_documents',
    'generate_upi_qr',
    
    // New Features - Animator level
    'view_birthdays',
    'add_birthday',
    'view_performance',
    'view_meeting_minutes',
    'create_meeting_minutes',
    'use_gps_attendance',
    'view_bank_accounts',
    'view_loan_guarantors',
  ],
  
  'SHG Leader': [
    // Full access to most features
    // Dashboard
    'view_dashboard',
    'view_group_stats',
    
    // Members - Full management
    'view_members',
    'view_member_profile',
    'add_member',
    'edit_member',
    'delete_member',
    'view_own_profile',
    'edit_own_profile',
    
    // Transactions - Full access
    'view_transactions',
    'view_own_transactions',
    'add_transaction',
    'edit_transaction',
    'delete_transaction',
    'record_savings',
    'record_expense',
    
    // Loans - Full management
    'view_loans',
    'view_own_loans',
    'create_loan',
    'approve_loan',
    'record_repayment',
    'edit_loan',
    'delete_loan',
    
    // Meetings - Full control
    'view_meetings',
    'start_meeting',
    'end_meeting',
    'mark_attendance',
    'view_attendance',
    
    // Reports - Full access
    'view_reports',
    'view_analytics',
    'export_reports',
    'generate_receipts',
    
    // Announcements - Full control
    'view_announcements',
    'create_announcement',
    'edit_announcement',
    'delete_announcement',
    
    // Voting - Full control
    'view_polls',
    'create_poll',
    'vote_in_poll',
    'close_poll',
    
    // Chat
    'view_chat',
    'send_message',
    
    // Savings Goals - Full management
    'view_savings_goals',
    'create_savings_goal',
    'contribute_to_goal',
    'edit_savings_goal',
    'delete_savings_goal',
    
    // Settings
    'view_settings',
    'change_language',
    'manage_security',
    'view_audit_log',
    
    // Documents - Own only (privacy protection)
    'view_own_documents',
    'upload_own_documents',
    // Note: Leaders cannot view other members' documents
    
    // Communication
    'call_members',
    'whatsapp_members',
    'sms_members',
    
    // Tools
    'use_calculator',
    'use_voice_commands',
    'scan_documents',
    'generate_upi_qr',
    
    // New Features - Leader level (full access)
    'view_birthdays',
    'add_birthday',
    'view_performance',
    'export_data',
    'import_data',
    'view_bank_accounts',
    'add_bank_account',
    'verify_bank_account',
    'view_meeting_minutes',
    'create_meeting_minutes',
    'edit_meeting_minutes',
    'use_gps_attendance',
    'manage_meeting_locations',
    'view_loan_guarantors',
    'add_loan_guarantor',
  ],
  
  'CRP': [
    // Community Resource Person - Audit access
    // All SHG Leader permissions plus audit capabilities
    'view_dashboard',
    'view_group_stats',
    'view_members',
    'view_member_profile',
    'add_member',
    'edit_member',
    'delete_member',
    'view_own_profile',
    'edit_own_profile',
    'view_transactions',
    'view_own_transactions',
    'add_transaction',
    'edit_transaction',
    'delete_transaction',
    'record_savings',
    'record_expense',
    'view_loans',
    'view_own_loans',
    'create_loan',
    'approve_loan',
    'record_repayment',
    'edit_loan',
    'delete_loan',
    'view_meetings',
    'start_meeting',
    'end_meeting',
    'mark_attendance',
    'view_attendance',
    'view_reports',
    'view_analytics',
    'export_reports',
    'generate_receipts',
    'view_announcements',
    'create_announcement',
    'edit_announcement',
    'delete_announcement',
    'view_polls',
    'create_poll',
    'vote_in_poll',
    'close_poll',
    'view_chat',
    'send_message',
    'view_savings_goals',
    'create_savings_goal',
    'contribute_to_goal',
    'edit_savings_goal',
    'delete_savings_goal',
    'view_settings',
    'change_language',
    'manage_security',
    'view_audit_log',
    'view_own_documents',
    'upload_own_documents',
    'view_member_documents', // CRP can view for auditing (masked)
    'call_members',
    'whatsapp_members',
    'sms_members',
    'use_calculator',
    'use_voice_commands',
    'scan_documents',
    'generate_upi_qr',
    
    // New Features - CRP level (full access + audit)
    'view_birthdays',
    'add_birthday',
    'view_performance',
    'export_data',
    'import_data',
    'view_bank_accounts',
    'add_bank_account',
    'verify_bank_account',
    'view_meeting_minutes',
    'create_meeting_minutes',
    'edit_meeting_minutes',
    'use_gps_attendance',
    'manage_meeting_locations',
    'view_loan_guarantors',
    'add_loan_guarantor',
  ]
};

/**
 * Check if a role has a specific permission
 */
export const hasPermission = (role: Role, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

/**
 * Check if a role has any of the specified permissions
 */
export const hasAnyPermission = (role: Role, permissions: Permission[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if a role has all of the specified permissions
 */
export const hasAllPermissions = (role: Role, permissions: Permission[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 */
export const getPermissions = (role: Role): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if roleA is higher than roleB in hierarchy
 */
export const isHigherRole = (roleA: Role, roleB: Role): boolean => {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
};

/**
 * Check if roleA is equal or higher than roleB
 */
export const isEqualOrHigherRole = (roleA: Role, roleB: Role): boolean => {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
};

/**
 * Feature access configuration for UI elements
 */
export const FEATURE_ACCESS: Record<string, { 
  requiredPermissions: Permission[]; 
  requireAll?: boolean;
  description: string;
}> = {
  // Navigation items
  'nav_dashboard': {
    requiredPermissions: ['view_dashboard'],
    description: 'Dashboard access'
  },
  'nav_members': {
    requiredPermissions: ['view_members'],
    description: 'Members list access'
  },
  'nav_transactions': {
    requiredPermissions: ['view_transactions', 'view_own_transactions'],
    description: 'Transactions access'
  },
  'nav_meetings': {
    requiredPermissions: ['view_meetings'],
    description: 'Meetings access'
  },
  'nav_loans': {
    requiredPermissions: ['view_loans', 'view_own_loans'],
    description: 'Loans access'
  },
  'nav_reports': {
    requiredPermissions: ['view_reports'],
    description: 'Reports access'
  },
  'nav_settings': {
    requiredPermissions: ['view_settings'],
    description: 'Settings access'
  },
  
  // Action buttons
  'btn_add_member': {
    requiredPermissions: ['add_member'],
    description: 'Add new member'
  },
  'btn_delete_member': {
    requiredPermissions: ['delete_member'],
    description: 'Delete member'
  },
  'btn_create_loan': {
    requiredPermissions: ['create_loan'],
    description: 'Create new loan'
  },
  'btn_approve_loan': {
    requiredPermissions: ['approve_loan'],
    description: 'Approve loan'
  },
  'btn_start_meeting': {
    requiredPermissions: ['start_meeting'],
    description: 'Start meeting'
  },
  'btn_create_announcement': {
    requiredPermissions: ['create_announcement'],
    description: 'Create announcement'
  },
  'btn_create_poll': {
    requiredPermissions: ['create_poll'],
    description: 'Create poll'
  },
  'btn_export_reports': {
    requiredPermissions: ['export_reports'],
    description: 'Export reports'
  },
  'btn_view_audit_log': {
    requiredPermissions: ['view_audit_log'],
    description: 'View audit log'
  },
  
  // Features
  'feature_analytics': {
    requiredPermissions: ['view_analytics'],
    description: 'Analytics dashboard'
  },
  'feature_group_stats': {
    requiredPermissions: ['view_group_stats'],
    description: 'Group statistics'
  },
  'feature_all_transactions': {
    requiredPermissions: ['view_transactions'],
    description: 'View all transactions'
  },
};

/**
 * Check if a feature is accessible for a role
 */
export const canAccessFeature = (role: Role, featureKey: string): boolean => {
  const feature = FEATURE_ACCESS[featureKey];
  if (!feature) return false;
  
  if (feature.requireAll) {
    return hasAllPermissions(role, feature.requiredPermissions);
  }
  return hasAnyPermission(role, feature.requiredPermissions);
};

/**
 * Role display information
 */
export const ROLE_INFO: Record<Role, {
  label: string;
  labelHi: string;
  labelTa: string;
  labelTe: string;
  labelKn: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  'Member': {
    label: 'Member',
    labelHi: 'सदस्य',
    labelTa: 'உறுப்பினர்',
    labelTe: 'సభ్యుడు',
    labelKn: 'ಸದಸ್ಯ',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    description: 'Regular group member with basic access'
  },
  'Animator': {
    label: 'Animator',
    labelHi: 'एनिमेटर',
    labelTa: 'அனிமேட்டர்',
    labelTe: 'యానిమేటర్',
    labelKn: 'ಅನಿಮೇಟರ್',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    description: 'Assists the leader in group activities'
  },
  'SHG Leader': {
    label: 'SHG Leader',
    labelHi: 'SHG नेता',
    labelTa: 'SHG தலைவர்',
    labelTe: 'SHG నాయకుడు',
    labelKn: 'SHG ನಾಯಕ',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    description: 'Group leader with full management access'
  },
  'CRP': {
    label: 'CRP',
    labelHi: 'CRP',
    labelTa: 'CRP',
    labelTe: 'CRP',
    labelKn: 'CRP',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Community Resource Person for auditing'
  }
};
