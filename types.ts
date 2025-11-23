
export type View = 'dashboard' | 'members' | 'transactions' | 'analytics' | 'profile' | 'settings' | 'meetings' | 'loans' | 'reports' | 'transact';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'conflicted';

export type Role = 'SHG Leader' | 'Animator' | 'CRP' | 'Member';

export interface User {
  id: string;
  name: string;
  phoneNumber: string;
  role: Role;
  memberId?: string; // Links auth user to specific member data
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