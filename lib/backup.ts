// Data Export/Import and Backup System
import { Member, Transaction, Meeting, Loan, SavingsGoal, Announcement, VotingPoll, ChatMessage } from '../types';
import { getMemberBirthdays, MemberBirthday } from './birthday';
import { haptics } from './native';

const STORAGE_KEY = 'shakti_data_v1';

export interface BackupData {
  version: string;
  exportedAt: string;
  exportedBy?: string;
  deviceInfo?: string;
  data: {
    members: Member[];
    transactions: Transaction[];
    meetings: Meeting[];
    loans: Loan[];
    birthdays: MemberBirthday[];
    savingsGoals?: SavingsGoal[];
    announcements?: Announcement[];
    polls?: VotingPoll[];
    messages?: ChatMessage[];
    settings?: Record<string, any>;
  };
  checksum: string;
}

// ============ CHECKSUM ============

const generateChecksum = (data: any): string => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

// ============ EXPORT ============

export const exportFullBackup = (
  members: Member[],
  transactions: Transaction[],
  meetings: Meeting[],
  loans: Loan[],
  exportedBy?: string
): BackupData => {
  const birthdays = getMemberBirthdays();
  
  // Get additional data from localStorage
  const savingsGoals = JSON.parse(localStorage.getItem('shg_savings_goals') || '[]');
  const announcements = JSON.parse(localStorage.getItem('shg_announcements') || '[]');
  const polls = JSON.parse(localStorage.getItem('shg_polls') || '[]');
  const messages = JSON.parse(localStorage.getItem('shg_messages') || '[]');
  
  const data = {
    members,
    transactions,
    meetings,
    loans,
    birthdays,
    savingsGoals,
    announcements,
    polls,
    messages,
    settings: {
      language: localStorage.getItem('shg_language'),
      theme: localStorage.getItem('shg_theme'),
      welcomeSeen: localStorage.getItem('shg_welcome_seen')
    }
  };
  
  const backup: BackupData = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy,
    deviceInfo: navigator.userAgent,
    data,
    checksum: generateChecksum(data)
  };
  
  return backup;
};

export const downloadBackup = (backup: BackupData, filename?: string) => {
  haptics.medium();
  
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `SHG_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
};

// ============ IMPORT ============

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    members: number;
    transactions: number;
    meetings: number;
    loans: number;
    birthdays: number;
  };
  warnings?: string[];
}

export const validateBackup = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('No data provided');
    return { valid: false, errors };
  }
  
  if (!data.version) {
    errors.push('Missing version information');
  }
  
  if (!data.data) {
    errors.push('Missing data object');
    return { valid: false, errors };
  }
  
  if (!Array.isArray(data.data.members)) {
    errors.push('Invalid members data');
  }
  
  if (!Array.isArray(data.data.transactions)) {
    errors.push('Invalid transactions data');
  }
  
  if (!Array.isArray(data.data.meetings)) {
    errors.push('Invalid meetings data');
  }
  
  if (!Array.isArray(data.data.loans)) {
    errors.push('Invalid loans data');
  }
  
  // Verify checksum
  if (data.checksum) {
    const calculatedChecksum = generateChecksum(data.data);
    if (calculatedChecksum !== data.checksum) {
      errors.push('Data integrity check failed - file may be corrupted');
    }
  }
  
  return { valid: errors.length === 0, errors };
};

export const importBackup = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress((e.loaded / e.total) * 100);
      }
    };
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content) as BackupData;
        
        // Validate
        const validation = validateBackup(backup);
        if (!validation.valid) {
          resolve({
            success: false,
            message: 'Invalid backup file',
            warnings: validation.errors
          });
          return;
        }
        
        const warnings: string[] = [];
        
        // Import main data
        const currentData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        
        // Merge strategy: Replace all
        const newData = {
          members: backup.data.members,
          transactions: backup.data.transactions,
          meetings: backup.data.meetings,
          loans: backup.data.loans
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        
        // Import birthdays
        if (backup.data.birthdays) {
          localStorage.setItem('shg_birthdays_v1', JSON.stringify(backup.data.birthdays));
        }
        
        // Import additional data
        if (backup.data.savingsGoals) {
          localStorage.setItem('shg_savings_goals', JSON.stringify(backup.data.savingsGoals));
        }
        
        if (backup.data.announcements) {
          localStorage.setItem('shg_announcements', JSON.stringify(backup.data.announcements));
        }
        
        if (backup.data.polls) {
          localStorage.setItem('shg_polls', JSON.stringify(backup.data.polls));
        }
        
        if (backup.data.messages) {
          localStorage.setItem('shg_messages', JSON.stringify(backup.data.messages));
        }
        
        // Import settings
        if (backup.data.settings) {
          if (backup.data.settings.language) {
            localStorage.setItem('shg_language', backup.data.settings.language);
          }
          if (backup.data.settings.theme) {
            localStorage.setItem('shg_theme', backup.data.settings.theme);
          }
        }
        
        haptics.success();
        
        resolve({
          success: true,
          message: 'Backup restored successfully',
          stats: {
            members: backup.data.members.length,
            transactions: backup.data.transactions.length,
            meetings: backup.data.meetings.length,
            loans: backup.data.loans.length,
            birthdays: backup.data.birthdays?.length || 0
          },
          warnings: warnings.length > 0 ? warnings : undefined
        });
        
      } catch (error) {
        resolve({
          success: false,
          message: 'Failed to parse backup file',
          warnings: [(error as Error).message]
        });
      }
    };
    
    reader.onerror = () => {
      resolve({
        success: false,
        message: 'Failed to read file'
      });
    };
    
    reader.readAsText(file);
  });
};

// ============ AUTO BACKUP ============

const AUTO_BACKUP_KEY = 'shg_auto_backup';
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

export const shouldAutoBackup = (): boolean => {
  const lastBackup = localStorage.getItem(AUTO_BACKUP_KEY);
  if (!lastBackup) return true;
  
  const lastBackupTime = new Date(lastBackup).getTime();
  return Date.now() - lastBackupTime > BACKUP_INTERVAL;
};

export const saveAutoBackup = (backup: BackupData) => {
  // Store in localStorage (limited size)
  const compressedBackup = {
    ...backup,
    data: {
      members: backup.data.members,
      transactions: backup.data.transactions.slice(0, 100), // Last 100 transactions
      meetings: backup.data.meetings.slice(0, 50),
      loans: backup.data.loans,
      birthdays: backup.data.birthdays
    }
  };
  
  try {
    localStorage.setItem('shg_auto_backup_data', JSON.stringify(compressedBackup));
    localStorage.setItem(AUTO_BACKUP_KEY, new Date().toISOString());
    return true;
  } catch (e) {
    console.error('Auto backup failed - storage full');
    return false;
  }
};

export const getLastAutoBackup = (): BackupData | null => {
  try {
    const data = localStorage.getItem('shg_auto_backup_data');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const getLastBackupTime = (): Date | null => {
  const time = localStorage.getItem(AUTO_BACKUP_KEY);
  return time ? new Date(time) : null;
};

// ============ EXPORT FORMATS ============

export const exportAsCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const value = row[h];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportMembersCSV = (members: Member[]) => {
  const data = members.map(m => ({
    Name: m.name,
    Role: m.role,
    Phone: m.phoneNumber || '',
    'Savings Balance': m.savingsBalance,
    'Loan Outstanding': m.loanOutstanding,
    'Attendance Rate': `${m.attendanceRate}%`,
    'Joined Date': m.joinedDate
  }));
  
  exportAsCSV(data, `SHG_Members_${new Date().toISOString().slice(0, 10)}`);
};

export const exportTransactionsCSV = (transactions: Transaction[]) => {
  const data = transactions.map(t => ({
    Date: t.date,
    Type: t.type,
    Amount: t.amount,
    Member: t.memberName || '',
    Description: t.description,
    Category: t.category || ''
  }));
  
  exportAsCSV(data, `SHG_Transactions_${new Date().toISOString().slice(0, 10)}`);
};

export const exportLoansCSV = (loans: Loan[]) => {
  const data = loans.map(l => ({
    Member: l.memberName,
    Principal: l.principal,
    'Interest Rate': `${l.interestRate}%`,
    'Term (Months)': l.termMonths,
    EMI: l.emiAmount,
    'Total Repayable': l.totalRepayable,
    'Amount Paid': l.amountPaid,
    Status: l.status,
    'Start Date': l.startDate,
    'End Date': l.endDate
  }));
  
  exportAsCSV(data, `SHG_Loans_${new Date().toISOString().slice(0, 10)}`);
};
