/**
 * Privacy and Data Masking Utilities
 * Protects sensitive member information based on user roles
 */

import { Role } from '../types';

// Roles that can view full sensitive data (only the member themselves)
const FULL_ACCESS_ROLES: Role[] = [];

// Roles that can view partially masked data
const PARTIAL_ACCESS_ROLES: Role[] = ['CRP']; // Community Resource Person for auditing

// Sensitive data types
export type SensitiveDataType = 'aadhaar' | 'bank_account' | 'phone' | 'pan' | 'upi';

/**
 * Check if user can view sensitive data of another member
 */
export const canViewSensitiveData = (
  viewerRole: Role,
  viewerId: string,
  targetMemberId: string
): boolean => {
  // Users can always view their own data
  if (viewerId === targetMemberId) {
    return true;
  }
  
  // CRP can view for audit purposes (but still masked)
  if (PARTIAL_ACCESS_ROLES.includes(viewerRole)) {
    return true; // Will show partially masked
  }
  
  // No one else can view sensitive data
  return false;
};

/**
 * Check if user can view documents (Aadhaar, Passbook images)
 */
export const canViewDocuments = (
  viewerRole: Role,
  viewerId: string,
  targetMemberId: string
): boolean => {
  // Only the member themselves can view their documents
  return viewerId === targetMemberId;
};

/**
 * Mask Aadhaar number - show only last 4 digits
 * Input: 1234 5678 9012 -> Output: XXXX XXXX 9012
 */
export const maskAadhaar = (aadhaar: string): string => {
  if (!aadhaar) return '';
  const cleaned = aadhaar.replace(/\s/g, '');
  if (cleaned.length < 4) return 'XXXX XXXX XXXX';
  const lastFour = cleaned.slice(-4);
  return `XXXX XXXX ${lastFour}`;
};

/**
 * Mask bank account number - show only last 4 digits
 * Input: 12345678901234 -> Output: XXXXXXXXXX1234
 */
export const maskBankAccount = (accountNumber: string): string => {
  if (!accountNumber) return '';
  const cleaned = accountNumber.replace(/\s/g, '');
  if (cleaned.length < 4) return 'XXXX XXXX XXXX';
  const lastFour = cleaned.slice(-4);
  const masked = 'X'.repeat(Math.max(0, cleaned.length - 4));
  return `${masked}${lastFour}`;
};

/**
 * Mask phone number - show only last 4 digits
 * Input: 9876543210 -> Output: XXXXXX3210
 */
export const maskPhone = (phone: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return 'XXXXXXXXXX';
  const lastFour = cleaned.slice(-4);
  return `XXXXXX${lastFour}`;
};

/**
 * Mask PAN number - show only last 4 characters
 * Input: ABCDE1234F -> Output: XXXXXX234F
 */
export const maskPAN = (pan: string): string => {
  if (!pan) return '';
  if (pan.length < 4) return 'XXXXXXXXXX';
  const lastFour = pan.slice(-4);
  return `XXXXXX${lastFour}`;
};

/**
 * Mask UPI ID - show only domain
 * Input: user@upi -> Output: ****@upi
 */
export const maskUPI = (upi: string): string => {
  if (!upi) return '';
  const parts = upi.split('@');
  if (parts.length !== 2) return '****@****';
  return `****@${parts[1]}`;
};

/**
 * Mask email - show first 2 chars and domain
 * Input: example@email.com -> Output: ex****@email.com
 */
export const maskEmail = (email: string): string => {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return '****@****';
  const name = parts[0];
  const domain = parts[1];
  const maskedName = name.length > 2 ? name.slice(0, 2) + '****' : '****';
  return `${maskedName}@${domain}`;
};

/**
 * Get appropriate mask function for data type
 */
export const getMaskFunction = (type: SensitiveDataType) => {
  switch (type) {
    case 'aadhaar':
      return maskAadhaar;
    case 'bank_account':
      return maskBankAccount;
    case 'phone':
      return maskPhone;
    case 'pan':
      return maskPAN;
    case 'upi':
      return maskUPI;
    default:
      return (value: string) => value;
  }
};

/**
 * Privacy notice text for different languages
 */
export const privacyNotice = {
  en: "Sensitive information is hidden for privacy. Only the member can view their own details.",
  hi: "गोपनीयता के लिए संवेदनशील जानकारी छिपी हुई है। केवल सदस्य अपना विवरण देख सकते हैं।",
  ta: "தனியுரிமைக்காக முக்கிய தகவல்கள் மறைக்கப்பட்டுள்ளன. உறுப்பினர் மட்டுமே தங்கள் விவரங்களைப் பார்க்க முடியும்.",
  te: "గోప్యత కోసం సున్నితమైన సమాచారం దాచబడింది. సభ్యుడు మాత్రమే వారి వివరాలను చూడగలరు.",
  kn: "ಗೌಪ್ಯತೆಗಾಗಿ ಸೂಕ್ಷ್ಮ ಮಾಹಿತಿಯನ್ನು ಮರೆಮಾಡಲಾಗಿದೆ. ಸದಸ್ಯರು ಮಾತ್ರ ತಮ್ಮ ವಿವರಗಳನ್ನು ನೋಡಬಹುದು."
};
