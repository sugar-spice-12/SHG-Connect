
export type View = 'dashboard' | 'members' | 'transactions' | 'analytics' | 'profile' | 'settings' | 'meetings' | 'loans' | 'reports' | 'transact' | 'calculator' | 'savings-goals' | 'announcements' | 'chat' | 'voting' | 'scanner' | 'audit-log' | 'birthdays' | 'performance' | 'backup' | 'bank-verification' | 'meeting-minutes' | 'gps-attendance';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'conflicted';

export type Role = 'SHG Leader' | 'Animator' | 'CRP' | 'Member';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: Role;
  memberId?: string; // Links auth user to specific member data
  email?: string;
  avatarUrl?: string;
}

export interface Conflict {
  id: string;
  type: 'member' | 'transaction' | 'meeting';
  localData: any;
  serverData: any;
  description: string;
  timestamp: number;
}

export interface AIInsight {
  id: string;
  type: 'anomaly' | 'prediction' | 'tip' | 'alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  relatedId?: string;
  date?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  date: string;
  read: boolean;
  actionUrl?: string;
}

export interface AuthSettings {
  isPinEnabled: boolean;
  pin: string;
  isBiometricEnabled: boolean;
  onboardingCompleted: boolean;
}

export interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent';
  memberId?: string;
  meetingId?: string;
  checkInTime?: string;
  location?: { lat: number; lng: number };
}

// ============ NEW TYPES ============

// UPI Payment
export interface UPIPayment {
  id: string;
  payeeName: string;
  payeeUPI: string;
  amount: number;
  description: string;
  qrCode?: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: string;
  completedAt?: string;
}

// Savings Goal
export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
  type: 'group' | 'individual';
  memberId?: string;
  status: 'active' | 'completed' | 'cancelled';
  contributions: SavingsContribution[];
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
}

// Announcement
export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'urgent' | 'meeting' | 'payment';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
  readBy: string[];
  attachments?: string[];
}

// Chat Message
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'voice';
  attachmentUrl?: string;
  readBy: string[];
  replyTo?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'group' | 'direct';
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
}

// Voting/Poll
export interface VotingOption {
  id: string;
  text: string;
  votes: string[]; // Member IDs who voted
}

export interface VotingPoll {
  id: string;
  question: string;
  description?: string;
  options: VotingOption[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  endsAt: string;
  status: 'active' | 'closed';
  isAnonymous: boolean;
  allowMultiple: boolean;
  totalVotes: number;
}

// Document
export interface ScannedDocument {
  id: string;
  type: 'aadhaar' | 'pan' | 'passbook' | 'receipt' | 'other';
  memberId?: string;
  memberName?: string;
  imageUrl: string;
  extractedData?: Record<string, string>;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// Audit Log
export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'view';
  entityType: 'member' | 'transaction' | 'loan' | 'meeting' | 'settings' | 'report';
  entityId?: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  deviceInfo?: string;
  changes?: { field: string; oldValue: any; newValue: any }[];
}

// Device Session
export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser?: string;
  os?: string;
  ipAddress?: string;
  location?: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

// Meeting with enhanced features
export interface MeetingLocation {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

export interface MeetingMinutes {
  id: string;
  meetingId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// Birthday/Reminder
export interface Reminder {
  id: string;
  type: 'birthday' | 'payment_due' | 'loan_overdue' | 'meeting' | 'custom';
  title: string;
  message: string;
  date: string;
  memberId?: string;
  memberName?: string;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notified: boolean;
}

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  role: Role; // Extended to include basic 'Member' for data purposes
  savingsBalance: number;
  loanOutstanding: number;
  attendanceRate: number; // Percentage
  attendanceHistory: AttendanceRecord[];
  lastActive: string;
  phoneNumber?: string;
  aadhaarUrl?: string;
  passbookUrl?: string;
  joinedDate: string;
}

export interface LoanRepayment {
  id: string;
  date: string;
  amount: number;
  penalty: number;
  balanceAfterRepayment: number;
}

export interface Loan {
  id: string;
  memberId: string;
  memberName: string;
  principal: number;
  interestRate: number; // Annual %
  termMonths: number;
  startDate: string;
  endDate: string;
  emiAmount: number;
  totalRepayable: number;
  amountPaid: number;
  status: 'Active' | 'Completed' | 'Defaulted';
  repaymentHistory: LoanRepayment[];
}

export type ExpenseCategory = 'Stationary' | 'Training' | 'Travel' | 'Food' | 'Other';

export interface Transaction {
  id: string;
  type: 'Savings' | 'Loan Repayment' | 'New Loan' | 'Fine' | 'Expense';
  amount: number;
  date: string;
  timestamp?: number; 
  memberId?: string;
  memberName?: string;
  description: string;
  meetingId?: string;
  // New fields
  category?: ExpenseCategory;
  receiptUrl?: string;
  loanId?: string;
  penalty?: number;
}

export interface Meeting {
  id: string;
  date: string;
  timestamp: number;
  attendees: string[]; // Member IDs
  savingsCollected: Record<string, number>; // MemberID -> Amount
  loanRecovered: Record<string, number>; // MemberID -> Amount
  finesCollected: Record<string, number>; // MemberID -> Amount
  totalCollected: number;
  status: 'Active' | 'Completed';
  notes?: string;
}

export interface AppState {
  members: Member[];
  transactions: Transaction[];
  meetings: Meeting[];
  loans: Loan[];
}