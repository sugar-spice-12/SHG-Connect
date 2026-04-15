// Bank Account Verification and IFSC Lookup
import { haptics } from './native';

// ============ IFSC CODE VALIDATION ============

export interface IFSCDetails {
  bank: string;
  branch: string;
  address: string;
  city: string;
  state: string;
  contact?: string;
  micr?: string;
  swift?: string;
  upi: boolean;
  neft: boolean;
  rtgs: boolean;
  imps: boolean;
}

// Common Indian bank IFSC prefixes
const BANK_PREFIXES: Record<string, string> = {
  'SBIN': 'State Bank of India',
  'HDFC': 'HDFC Bank',
  'ICIC': 'ICICI Bank',
  'UTIB': 'Axis Bank',
  'KKBK': 'Kotak Mahindra Bank',
  'PUNB': 'Punjab National Bank',
  'CNRB': 'Canara Bank',
  'BARB': 'Bank of Baroda',
  'UBIN': 'Union Bank of India',
  'IOBA': 'Indian Overseas Bank',
  'BKID': 'Bank of India',
  'CBIN': 'Central Bank of India',
  'IDIB': 'Indian Bank',
  'ALLA': 'Allahabad Bank',
  'UCBA': 'UCO Bank',
  'SYNB': 'Syndicate Bank',
  'CORP': 'Corporation Bank',
  'VIJB': 'Vijaya Bank',
  'ORBC': 'Oriental Bank of Commerce',
  'ANDB': 'Andhra Bank',
  'MAHB': 'Bank of Maharashtra',
  'PSIB': 'Punjab & Sind Bank',
  'FDRL': 'Federal Bank',
  'SIBL': 'South Indian Bank',
  'KARB': 'Karnataka Bank',
  'KVBL': 'Karur Vysya Bank',
  'CSBK': 'Catholic Syrian Bank',
  'DLXB': 'Dhanlaxmi Bank',
  'JAKA': 'Jammu & Kashmir Bank',
  'YESB': 'Yes Bank',
  'INDB': 'IndusInd Bank',
  'RATN': 'RBL Bank',
  'BDBL': 'Bandhan Bank',
  'IDFB': 'IDFC First Bank',
  'PAYT': 'Paytm Payments Bank',
  'AIRP': 'Airtel Payments Bank',
  'PYTM': 'Paytm Payments Bank',
  'JSFB': 'Jana Small Finance Bank',
  'ESFB': 'Equitas Small Finance Bank',
  'USFB': 'Ujjivan Small Finance Bank',
  'AUBL': 'AU Small Finance Bank',
  'FINO': 'Fino Payments Bank',
  'NSPB': 'NSDL Payments Bank'
};

export const validateIFSC = (ifsc: string): { valid: boolean; error?: string } => {
  if (!ifsc) {
    return { valid: false, error: 'IFSC code is required' };
  }
  
  // IFSC format: 4 letters (bank code) + 0 + 6 alphanumeric (branch code)
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  
  if (!ifscRegex.test(ifsc.toUpperCase())) {
    return { valid: false, error: 'Invalid IFSC format. Should be 11 characters (e.g., SBIN0001234)' };
  }
  
  return { valid: true };
};

export const getBankFromIFSC = (ifsc: string): string | null => {
  const prefix = ifsc.substring(0, 4).toUpperCase();
  return BANK_PREFIXES[prefix] || null;
};

// Offline IFSC lookup (basic info from code)
export const lookupIFSCOffline = (ifsc: string): IFSCDetails | null => {
  const validation = validateIFSC(ifsc);
  if (!validation.valid) return null;
  
  const bankCode = ifsc.substring(0, 4).toUpperCase();
  const branchCode = ifsc.substring(5);
  const bankName = BANK_PREFIXES[bankCode];
  
  if (!bankName) return null;
  
  return {
    bank: bankName,
    branch: `Branch ${branchCode}`,
    address: 'Address not available offline',
    city: 'N/A',
    state: 'N/A',
    upi: true,
    neft: true,
    rtgs: true,
    imps: true
  };
};

// Online IFSC lookup using Razorpay API (free)
export const lookupIFSCOnline = async (ifsc: string): Promise<IFSCDetails | null> => {
  const validation = validateIFSC(ifsc);
  if (!validation.valid) return null;
  
  try {
    const response = await fetch(`https://ifsc.razorpay.com/${ifsc.toUpperCase()}`);
    
    if (!response.ok) {
      return lookupIFSCOffline(ifsc);
    }
    
    const data = await response.json();
    
    return {
      bank: data.BANK,
      branch: data.BRANCH,
      address: data.ADDRESS,
      city: data.CITY,
      state: data.STATE,
      contact: data.CONTACT,
      micr: data.MICR,
      swift: data.SWIFT,
      upi: data.UPI === true,
      neft: data.NEFT === true,
      rtgs: data.RTGS === true,
      imps: data.IMPS === true
    };
  } catch (error) {
    console.error('IFSC lookup failed:', error);
    return lookupIFSCOffline(ifsc);
  }
};

// ============ ACCOUNT NUMBER VALIDATION ============

export const validateAccountNumber = (accountNumber: string): { valid: boolean; error?: string } => {
  if (!accountNumber) {
    return { valid: false, error: 'Account number is required' };
  }
  
  // Remove spaces and dashes
  const cleanNumber = accountNumber.replace(/[\s-]/g, '');
  
  // Account numbers are typically 9-18 digits
  if (!/^\d{9,18}$/.test(cleanNumber)) {
    return { valid: false, error: 'Account number should be 9-18 digits' };
  }
  
  return { valid: true };
};

// ============ UPI ID VALIDATION ============

export const validateUPI = (upiId: string): { valid: boolean; error?: string } => {
  if (!upiId) {
    return { valid: false, error: 'UPI ID is required' };
  }
  
  // UPI format: username@bankhandle
  const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
  
  if (!upiRegex.test(upiId)) {
    return { valid: false, error: 'Invalid UPI ID format (e.g., name@upi)' };
  }
  
  return { valid: true };
};

// Common UPI handles
export const UPI_HANDLES = [
  'upi', 'paytm', 'gpay', 'phonepe', 'ybl', 'okhdfcbank', 'okicici', 
  'oksbi', 'okaxis', 'apl', 'axisbank', 'ibl', 'sbi', 'icici',
  'hdfcbank', 'kotak', 'indus', 'federal', 'rbl', 'idbi'
];

// ============ BANK ACCOUNT STORAGE ============

export interface BankAccount {
  id: string;
  memberId: string;
  memberName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branchName: string;
  accountType: 'savings' | 'current' | 'joint';
  isPrimary: boolean;
  upiId?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

const BANK_ACCOUNTS_KEY = 'shg_bank_accounts';

export const saveBankAccount = (account: Omit<BankAccount, 'id'>): BankAccount => {
  const accounts = getBankAccounts();
  
  // If setting as primary, unset other primary accounts for this member
  if (account.isPrimary) {
    accounts.forEach(a => {
      if (a.memberId === account.memberId) {
        a.isPrimary = false;
      }
    });
  }
  
  const newAccount: BankAccount = {
    ...account,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  };
  
  accounts.push(newAccount);
  localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
  
  haptics.success();
  return newAccount;
};

export const getBankAccounts = (): BankAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(BANK_ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getMemberBankAccounts = (memberId: string): BankAccount[] => {
  return getBankAccounts().filter(a => a.memberId === memberId);
};

export const getPrimaryBankAccount = (memberId: string): BankAccount | null => {
  const accounts = getMemberBankAccounts(memberId);
  return accounts.find(a => a.isPrimary) || accounts[0] || null;
};

export const deleteBankAccount = (id: string) => {
  const accounts = getBankAccounts().filter(a => a.id !== id);
  localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
};

export const verifyBankAccount = (id: string, verifiedBy: string) => {
  const accounts = getBankAccounts().map(a => 
    a.id === id ? { ...a, verifiedAt: new Date().toISOString(), verifiedBy } : a
  );
  localStorage.setItem(BANK_ACCOUNTS_KEY, JSON.stringify(accounts));
};

// ============ LOAN GUARANTOR SYSTEM ============

export interface LoanGuarantor {
  id: string;
  loanId: string;
  guarantorMemberId: string;
  guarantorName: string;
  guarantorPhone?: string;
  relationship: string;
  guaranteeAmount: number;
  status: 'active' | 'released' | 'invoked';
  signedAt: string;
  releasedAt?: string;
}

const GUARANTORS_KEY = 'shg_loan_guarantors';

export const addLoanGuarantor = (guarantor: Omit<LoanGuarantor, 'id' | 'status' | 'signedAt'>): LoanGuarantor => {
  const guarantors = getLoanGuarantors();
  
  const newGuarantor: LoanGuarantor = {
    ...guarantor,
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    status: 'active',
    signedAt: new Date().toISOString()
  };
  
  guarantors.push(newGuarantor);
  localStorage.setItem(GUARANTORS_KEY, JSON.stringify(guarantors));
  
  return newGuarantor;
};

export const getLoanGuarantors = (): LoanGuarantor[] => {
  try {
    return JSON.parse(localStorage.getItem(GUARANTORS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getGuarantorsForLoan = (loanId: string): LoanGuarantor[] => {
  return getLoanGuarantors().filter(g => g.loanId === loanId);
};

export const getGuaranteesByMember = (memberId: string): LoanGuarantor[] => {
  return getLoanGuarantors().filter(g => g.guarantorMemberId === memberId);
};

export const releaseGuarantor = (id: string) => {
  const guarantors = getLoanGuarantors().map(g => 
    g.id === id ? { ...g, status: 'released' as const, releasedAt: new Date().toISOString() } : g
  );
  localStorage.setItem(GUARANTORS_KEY, JSON.stringify(guarantors));
};

export const invokeGuarantee = (id: string) => {
  const guarantors = getLoanGuarantors().map(g => 
    g.id === id ? { ...g, status: 'invoked' as const } : g
  );
  localStorage.setItem(GUARANTORS_KEY, JSON.stringify(guarantors));
};

// ============ PENALTY CALCULATION ============

export interface PenaltyConfig {
  gracePeriodDays: number;
  penaltyType: 'fixed' | 'percentage' | 'compound';
  penaltyRate: number; // Fixed amount or percentage
  maxPenalty?: number; // Cap on total penalty
  compoundingFrequency?: 'daily' | 'weekly' | 'monthly';
}

const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  gracePeriodDays: 7,
  penaltyType: 'percentage',
  penaltyRate: 2, // 2% per month
  maxPenalty: 50, // Max 50% of EMI
  compoundingFrequency: 'monthly'
};

export const calculatePenalty = (
  emiAmount: number,
  dueDate: string,
  config: PenaltyConfig = DEFAULT_PENALTY_CONFIG
): { penalty: number; daysLate: number; breakdown: string } => {
  const [day, month, year] = dueDate.split('/').map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  
  const diffTime = today.getTime() - due.getTime();
  const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Within grace period
  if (daysLate <= config.gracePeriodDays) {
    return { penalty: 0, daysLate: Math.max(0, daysLate), breakdown: 'Within grace period' };
  }
  
  const effectiveDaysLate = daysLate - config.gracePeriodDays;
  let penalty = 0;
  let breakdown = '';
  
  switch (config.penaltyType) {
    case 'fixed':
      penalty = config.penaltyRate * Math.ceil(effectiveDaysLate / 30);
      breakdown = `₹${config.penaltyRate} × ${Math.ceil(effectiveDaysLate / 30)} months`;
      break;
      
    case 'percentage':
      const monthsLate = Math.ceil(effectiveDaysLate / 30);
      penalty = (emiAmount * config.penaltyRate / 100) * monthsLate;
      breakdown = `${config.penaltyRate}% × ${monthsLate} months = ₹${penalty.toFixed(0)}`;
      break;
      
    case 'compound':
      const periods = config.compoundingFrequency === 'daily' 
        ? effectiveDaysLate 
        : config.compoundingFrequency === 'weekly'
          ? Math.ceil(effectiveDaysLate / 7)
          : Math.ceil(effectiveDaysLate / 30);
      
      penalty = emiAmount * (Math.pow(1 + config.penaltyRate / 100, periods) - 1);
      breakdown = `Compound ${config.penaltyRate}% × ${periods} periods`;
      break;
  }
  
  // Apply max cap
  if (config.maxPenalty) {
    const maxAmount = (emiAmount * config.maxPenalty) / 100;
    if (penalty > maxAmount) {
      penalty = maxAmount;
      breakdown += ` (capped at ${config.maxPenalty}%)`;
    }
  }
  
  return { penalty: Math.round(penalty), daysLate, breakdown };
};

export const getPenaltyConfig = (): PenaltyConfig => {
  try {
    const saved = localStorage.getItem('shg_penalty_config');
    return saved ? JSON.parse(saved) : DEFAULT_PENALTY_CONFIG;
  } catch {
    return DEFAULT_PENALTY_CONFIG;
  }
};

export const savePenaltyConfig = (config: PenaltyConfig) => {
  localStorage.setItem('shg_penalty_config', JSON.stringify(config));
};
