// Communication utilities for WhatsApp, Calls, SMS
import { haptics } from './native';

// ============ PHONE CALLS ============

export const makePhoneCall = (phoneNumber: string) => {
  haptics.medium();
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  window.location.href = `tel:${cleanNumber}`;
};

// ============ WHATSAPP ============

export const openWhatsApp = (phoneNumber: string, message?: string) => {
  haptics.light();
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  // Add country code if not present (assuming India)
  const fullNumber = cleanNumber.startsWith('91') ? cleanNumber : `91${cleanNumber}`;
  
  let url = `https://wa.me/${fullNumber}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  
  window.open(url, '_blank');
};

export const sendWhatsAppMessage = (phoneNumber: string, message: string) => {
  openWhatsApp(phoneNumber, message);
};

// Pre-defined message templates
export const whatsAppTemplates = {
  meetingReminder: (memberName: string, date: string, time: string) => 
    `Hi ${memberName}! 🙏\n\nThis is a reminder for our SHG meeting scheduled on ${date} at ${time}.\n\nPlease bring your savings contribution.\n\n- SHG Connect`,
  
  paymentReminder: (memberName: string, amount: number, dueDate: string) =>
    `Hi ${memberName}! 🙏\n\nThis is a friendly reminder that your payment of ₹${amount.toLocaleString()} is due on ${dueDate}.\n\nPlease make the payment at your earliest convenience.\n\n- SHG Connect`,
  
  loanApproval: (memberName: string, amount: number) =>
    `Hi ${memberName}! 🎉\n\nGreat news! Your loan application of ₹${amount.toLocaleString()} has been approved.\n\nPlease contact the group leader for disbursement details.\n\n- SHG Connect`,
  
  birthdayWish: (memberName: string) =>
    `Happy Birthday ${memberName}! 🎂🎉\n\nWishing you a wonderful year ahead filled with happiness and prosperity.\n\nFrom your SHG family! 💐`,
  
  welcomeMessage: (memberName: string, groupName: string) =>
    `Welcome to ${groupName}, ${memberName}! 🙏\n\nWe're excited to have you as part of our SHG family.\n\nFor any queries, feel free to reach out to the group leader.\n\n- SHG Connect`,
  
  savingsConfirmation: (memberName: string, amount: number, date: string) =>
    `Hi ${memberName}! ✅\n\nYour savings of ₹${amount.toLocaleString()} has been recorded on ${date}.\n\nThank you for your contribution!\n\n- SHG Connect`
};

// ============ SMS ============

export const sendSMS = (phoneNumber: string, message: string) => {
  haptics.light();
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  window.location.href = `sms:${cleanNumber}?body=${encodeURIComponent(message)}`;
};

// ============ EMAIL ============

export const sendEmail = (email: string, subject: string, body: string) => {
  haptics.light();
  window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

// ============ BULK MESSAGING ============

export interface BulkMessageOptions {
  recipients: { name: string; phone: string }[];
  template: string;
  channel: 'whatsapp' | 'sms';
}

export const prepareBulkMessages = (options: BulkMessageOptions) => {
  return options.recipients.map(recipient => ({
    name: recipient.name,
    phone: recipient.phone,
    message: options.template.replace('{name}', recipient.name),
    channel: options.channel
  }));
};

// ============ CONTACT ACTIONS COMPONENT DATA ============

export interface ContactAction {
  id: string;
  label: string;
  icon: string;
  action: (phone: string, name?: string) => void;
  color: string;
}

export const contactActions: ContactAction[] = [
  {
    id: 'call',
    label: 'Call',
    icon: 'Phone',
    action: (phone) => makePhoneCall(phone),
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'MessageCircle',
    action: (phone, name) => openWhatsApp(phone, `Hi ${name || ''}! `),
    color: 'from-green-600 to-green-700'
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: 'MessageSquare',
    action: (phone) => sendSMS(phone, ''),
    color: 'from-blue-500 to-blue-600'
  }
];

// ============ BIRTHDAY CHECKER ============

export const checkBirthdays = (members: { name: string; phone?: string; joinedDate: string }[]) => {
  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // This would need actual birthday data - using joinedDate as placeholder
  return members.filter(m => {
    const joinedDate = new Date(m.joinedDate);
    const memberDateStr = `${String(joinedDate.getMonth() + 1).padStart(2, '0')}-${String(joinedDate.getDate()).padStart(2, '0')}`;
    return memberDateStr === todayStr;
  });
};

// ============ REMINDER SCHEDULER ============

export interface ReminderConfig {
  type: 'meeting' | 'payment' | 'birthday' | 'custom';
  title: string;
  message: string;
  scheduledFor: Date;
  recipients: { name: string; phone: string }[];
}

export const scheduleReminder = async (config: ReminderConfig) => {
  // Store in local storage for now
  const reminders = JSON.parse(localStorage.getItem('scheduled_reminders') || '[]');
  reminders.push({
    ...config,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  });
  localStorage.setItem('scheduled_reminders', JSON.stringify(reminders));
  
  return true;
};

export const getScheduledReminders = () => {
  return JSON.parse(localStorage.getItem('scheduled_reminders') || '[]');
};

export const cancelReminder = (id: string) => {
  const reminders = getScheduledReminders().filter((r: any) => r.id !== id);
  localStorage.setItem('scheduled_reminders', JSON.stringify(reminders));
};
