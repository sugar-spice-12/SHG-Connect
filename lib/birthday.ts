// Birthday and Reminder Management System
import { Member, Reminder } from '../types';
import { haptics } from './native';

const REMINDERS_KEY = 'shg_reminders_v1';
const BIRTHDAYS_KEY = 'shg_birthdays_v1';

// ============ BIRTHDAY STORAGE ============

export interface MemberBirthday {
  memberId: string;
  memberName: string;
  dateOfBirth: string; // DD/MM/YYYY format
  phone?: string;
}

export const saveMemberBirthday = (birthday: MemberBirthday) => {
  const birthdays = getMemberBirthdays();
  const existing = birthdays.findIndex(b => b.memberId === birthday.memberId);
  if (existing >= 0) {
    birthdays[existing] = birthday;
  } else {
    birthdays.push(birthday);
  }
  localStorage.setItem(BIRTHDAYS_KEY, JSON.stringify(birthdays));
};

export const getMemberBirthdays = (): MemberBirthday[] => {
  try {
    return JSON.parse(localStorage.getItem(BIRTHDAYS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const deleteMemberBirthday = (memberId: string) => {
  const birthdays = getMemberBirthdays().filter(b => b.memberId !== memberId);
  localStorage.setItem(BIRTHDAYS_KEY, JSON.stringify(birthdays));
};

// ============ BIRTHDAY CHECKING ============

export const getTodaysBirthdays = (): MemberBirthday[] => {
  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth() + 1;
  
  return getMemberBirthdays().filter(b => {
    const [day, month] = b.dateOfBirth.split('/').map(Number);
    return day === todayDay && month === todayMonth;
  });
};

export const getUpcomingBirthdays = (days: number = 7): MemberBirthday[] => {
  const today = new Date();
  const upcoming: MemberBirthday[] = [];
  
  getMemberBirthdays().forEach(b => {
    const [day, month] = b.dateOfBirth.split('/').map(Number);
    const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
    
    // If birthday has passed this year, check next year
    if (birthdayThisYear < today) {
      birthdayThisYear.setFullYear(today.getFullYear() + 1);
    }
    
    const diffTime = birthdayThisYear.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0 && diffDays <= days) {
      upcoming.push({ ...b, daysUntil: diffDays } as any);
    }
  });
  
  return upcoming.sort((a, b) => (a as any).daysUntil - (b as any).daysUntil);
};

export const calculateAge = (dateOfBirth: string): number => {
  const [day, month, year] = dateOfBirth.split('/').map(Number);
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// ============ REMINDER MANAGEMENT ============

export const saveReminder = (reminder: Omit<Reminder, 'id'>) => {
  const reminders = getReminders();
  const newReminder: Reminder = {
    ...reminder,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  };
  reminders.push(newReminder);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
  return newReminder;
};

export const getReminders = (): Reminder[] => {
  try {
    return JSON.parse(localStorage.getItem(REMINDERS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getTodaysReminders = (): Reminder[] => {
  const today = new Date().toLocaleDateString('en-GB');
  return getReminders().filter(r => r.date === today && !r.notified);
};

export const getUpcomingReminders = (days: number = 7): Reminder[] => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);
  
  return getReminders().filter(r => {
    const [day, month, year] = r.date.split('/').map(Number);
    const reminderDate = new Date(year, month - 1, day);
    return reminderDate >= today && reminderDate <= endDate;
  }).sort((a, b) => {
    const [aDay, aMonth, aYear] = a.date.split('/').map(Number);
    const [bDay, bMonth, bYear] = b.date.split('/').map(Number);
    return new Date(aYear, aMonth - 1, aDay).getTime() - new Date(bYear, bMonth - 1, bDay).getTime();
  });
};

export const markReminderNotified = (id: string) => {
  const reminders = getReminders().map(r => 
    r.id === id ? { ...r, notified: true } : r
  );
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

export const deleteReminder = (id: string) => {
  const reminders = getReminders().filter(r => r.id !== id);
  localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
};

// ============ AUTO-GENERATE BIRTHDAY REMINDERS ============

export const generateBirthdayReminders = () => {
  const upcoming = getUpcomingBirthdays(7);
  const existingReminders = getReminders();
  
  upcoming.forEach(birthday => {
    const [day, month] = birthday.dateOfBirth.split('/').map(Number);
    const today = new Date();
    let birthdayDate = new Date(today.getFullYear(), month - 1, day);
    if (birthdayDate < today) {
      birthdayDate.setFullYear(today.getFullYear() + 1);
    }
    
    const reminderDate = birthdayDate.toLocaleDateString('en-GB');
    
    // Check if reminder already exists
    const exists = existingReminders.some(
      r => r.type === 'birthday' && r.memberId === birthday.memberId && r.date === reminderDate
    );
    
    if (!exists) {
      saveReminder({
        type: 'birthday',
        title: `🎂 ${birthday.memberName}'s Birthday`,
        message: `Today is ${birthday.memberName}'s birthday! Send them wishes.`,
        date: reminderDate,
        memberId: birthday.memberId,
        memberName: birthday.memberName,
        isRecurring: true,
        recurringType: 'yearly',
        notified: false
      });
    }
  });
};

// ============ LOAN OVERDUE REMINDERS ============

export interface LoanInfo {
  id: string;
  memberId: string;
  memberName: string;
  emiAmount: number;
  endDate: string;
  amountPaid: number;
  totalRepayable: number;
}

export const generateLoanOverdueReminders = (loans: LoanInfo[]) => {
  const today = new Date();
  const existingReminders = getReminders();
  
  loans.forEach(loan => {
    const remaining = loan.totalRepayable - loan.amountPaid;
    if (remaining <= 0) return;
    
    const [day, month, year] = loan.endDate.split('/').map(Number);
    const endDate = new Date(year, month - 1, day);
    
    // If loan is overdue
    if (endDate < today) {
      const reminderDate = today.toLocaleDateString('en-GB');
      const exists = existingReminders.some(
        r => r.type === 'loan_overdue' && r.memberId === loan.memberId && !r.notified
      );
      
      if (!exists) {
        saveReminder({
          type: 'loan_overdue',
          title: `⚠️ Loan Overdue: ${loan.memberName}`,
          message: `Loan of ₹${remaining.toLocaleString()} is overdue. EMI: ₹${loan.emiAmount}`,
          date: reminderDate,
          memberId: loan.memberId,
          memberName: loan.memberName,
          isRecurring: false,
          notified: false
        });
      }
    }
  });
};

// ============ PAYMENT DUE REMINDERS ============

export const generatePaymentDueReminders = (loans: LoanInfo[]) => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const existingReminders = getReminders();
  
  loans.forEach(loan => {
    const remaining = loan.totalRepayable - loan.amountPaid;
    if (remaining <= 0) return;
    
    // Generate reminder for next EMI due
    const reminderDate = nextWeek.toLocaleDateString('en-GB');
    const exists = existingReminders.some(
      r => r.type === 'payment_due' && r.memberId === loan.memberId && r.date === reminderDate
    );
    
    if (!exists) {
      saveReminder({
        type: 'payment_due',
        title: `💰 EMI Due: ${loan.memberName}`,
        message: `EMI of ₹${loan.emiAmount.toLocaleString()} is due. Remaining: ₹${remaining.toLocaleString()}`,
        date: reminderDate,
        memberId: loan.memberId,
        memberName: loan.memberName,
        isRecurring: false,
        notified: false
      });
    }
  });
};

// ============ MEETING REMINDERS ============

export const createMeetingReminder = (date: string, time: string, memberNames: string[]) => {
  return saveReminder({
    type: 'meeting',
    title: '📅 SHG Meeting Today',
    message: `Meeting scheduled at ${time}. ${memberNames.length} members expected.`,
    date,
    isRecurring: false,
    notified: false
  });
};
