// Meeting Minutes Management
import { MeetingMinutes } from '../types';
import { haptics } from './native';

const MINUTES_KEY = 'shg_meeting_minutes';

// ============ CRUD OPERATIONS ============

export const saveMinutes = (minutes: Omit<MeetingMinutes, 'id' | 'createdAt'>): MeetingMinutes => {
  const allMinutes = getAllMinutes();
  
  // Check if minutes already exist for this meeting
  const existing = allMinutes.findIndex(m => m.meetingId === minutes.meetingId);
  
  const newMinutes: MeetingMinutes = {
    ...minutes,
    id: existing >= 0 ? allMinutes[existing].id : Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    createdAt: existing >= 0 ? allMinutes[existing].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (existing >= 0) {
    allMinutes[existing] = newMinutes;
  } else {
    allMinutes.push(newMinutes);
  }
  
  localStorage.setItem(MINUTES_KEY, JSON.stringify(allMinutes));
  haptics.success();
  
  return newMinutes;
};

export const getAllMinutes = (): MeetingMinutes[] => {
  try {
    return JSON.parse(localStorage.getItem(MINUTES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const getMinutesForMeeting = (meetingId: string): MeetingMinutes | null => {
  return getAllMinutes().find(m => m.meetingId === meetingId) || null;
};

export const deleteMinutes = (id: string) => {
  const allMinutes = getAllMinutes().filter(m => m.id !== id);
  localStorage.setItem(MINUTES_KEY, JSON.stringify(allMinutes));
};

// ============ TEMPLATES ============

export interface MinutesTemplate {
  id: string;
  name: string;
  sections: string[];
  content: string;
}

const DEFAULT_TEMPLATES: MinutesTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Meeting',
    sections: ['Opening', 'Attendance', 'Financial Report', 'Discussions', 'Decisions', 'Action Items', 'Closing'],
    content: `# Meeting Minutes

## Opening
- Meeting called to order at [TIME]
- Opening prayer/song

## Attendance
- Total members present: [COUNT]
- Absentees: [NAMES]

## Financial Report
- Opening balance: ₹[AMOUNT]
- Savings collected: ₹[AMOUNT]
- Loan repayments: ₹[AMOUNT]
- Expenses: ₹[AMOUNT]
- Closing balance: ₹[AMOUNT]

## Discussions
1. [TOPIC 1]
2. [TOPIC 2]

## Decisions Made
1. [DECISION 1]
2. [DECISION 2]

## Action Items
| Task | Assigned To | Due Date |
|------|-------------|----------|
| [TASK] | [NAME] | [DATE] |

## Closing
- Next meeting: [DATE] at [TIME]
- Meeting adjourned at [TIME]

---
Minutes recorded by: [NAME]
Date: [DATE]`
  },
  {
    id: 'quick',
    name: 'Quick Summary',
    sections: ['Summary', 'Collections', 'Decisions'],
    content: `# Quick Meeting Summary

**Date:** [DATE]
**Attendees:** [COUNT] members

## Collections
- Savings: ₹[AMOUNT]
- Repayments: ₹[AMOUNT]
- Fines: ₹[AMOUNT]
- **Total:** ₹[AMOUNT]

## Key Decisions
1. [DECISION]

## Next Meeting
[DATE] at [TIME]`
  },
  {
    id: 'detailed',
    name: 'Detailed Minutes',
    sections: ['Preliminaries', 'Roll Call', 'Previous Minutes', 'Financial', 'Old Business', 'New Business', 'Elections', 'Announcements', 'Adjournment'],
    content: `# Detailed Meeting Minutes

## 1. Preliminaries
- **Date:** [DATE]
- **Time:** [START TIME] - [END TIME]
- **Venue:** [LOCATION]
- **Presided by:** [NAME]
- **Minutes by:** [NAME]

## 2. Roll Call
### Present ([COUNT])
[LIST OF NAMES]

### Absent ([COUNT])
[LIST OF NAMES]

### Guests
[LIST IF ANY]

## 3. Reading of Previous Minutes
- Previous minutes dated [DATE] were read
- Corrections: [IF ANY]
- Motion to approve: [NAME]
- Seconded by: [NAME]
- Status: Approved/Amended

## 4. Financial Report
### Income
| Source | Amount |
|--------|--------|
| Savings | ₹[AMOUNT] |
| Loan Repayments | ₹[AMOUNT] |
| Fines | ₹[AMOUNT] |
| Interest | ₹[AMOUNT] |
| **Total Income** | ₹[AMOUNT] |

### Expenses
| Item | Amount |
|------|--------|
| [ITEM] | ₹[AMOUNT] |
| **Total Expenses** | ₹[AMOUNT] |

### Balance
- Opening: ₹[AMOUNT]
- Closing: ₹[AMOUNT]

## 5. Old Business
[PENDING ITEMS FROM PREVIOUS MEETING]

## 6. New Business
### Item 1: [TITLE]
- Discussion: [SUMMARY]
- Decision: [OUTCOME]
- Vote: For [X], Against [Y], Abstain [Z]

## 7. Loan Applications
| Applicant | Amount | Purpose | Decision |
|-----------|--------|---------|----------|
| [NAME] | ₹[AMOUNT] | [PURPOSE] | Approved/Rejected |

## 8. Announcements
1. [ANNOUNCEMENT]

## 9. Next Meeting
- **Date:** [DATE]
- **Time:** [TIME]
- **Venue:** [LOCATION]
- **Agenda:** [ITEMS]

## 10. Adjournment
- Motion to adjourn: [NAME]
- Seconded by: [NAME]
- Meeting adjourned at [TIME]

---
**Signatures:**

___________________ ___________________
President Secretary

Date: [DATE]`
  }
];

export const getMinutesTemplates = (): MinutesTemplate[] => {
  try {
    const custom = JSON.parse(localStorage.getItem('shg_minutes_templates') || '[]');
    return [...DEFAULT_TEMPLATES, ...custom];
  } catch {
    return DEFAULT_TEMPLATES;
  }
};

export const saveCustomTemplate = (template: Omit<MinutesTemplate, 'id'>): MinutesTemplate => {
  const templates = JSON.parse(localStorage.getItem('shg_minutes_templates') || '[]');
  const newTemplate: MinutesTemplate = {
    ...template,
    id: 'custom_' + Date.now().toString(36)
  };
  templates.push(newTemplate);
  localStorage.setItem('shg_minutes_templates', JSON.stringify(templates));
  return newTemplate;
};

// ============ AUTO-GENERATE MINUTES ============

export interface MeetingData {
  date: string;
  attendees: string[];
  absentees: string[];
  savingsCollected: number;
  loanRepayments: number;
  finesCollected: number;
  totalCollected: number;
  openingBalance?: number;
  closingBalance?: number;
}

export const generateMinutesFromMeeting = (
  meetingData: MeetingData,
  template: MinutesTemplate = DEFAULT_TEMPLATES[0]
): string => {
  let content = template.content;
  
  // Replace placeholders
  content = content.replace(/\[DATE\]/g, meetingData.date);
  content = content.replace(/\[COUNT\]/g, meetingData.attendees.length.toString());
  content = content.replace(/\[NAMES\]/g, meetingData.absentees.join(', ') || 'None');
  
  // Financial placeholders
  content = content.replace(/Savings collected: ₹\[AMOUNT\]/g, `Savings collected: ₹${meetingData.savingsCollected.toLocaleString()}`);
  content = content.replace(/Loan repayments: ₹\[AMOUNT\]/g, `Loan repayments: ₹${meetingData.loanRepayments.toLocaleString()}`);
  content = content.replace(/Savings: ₹\[AMOUNT\]/g, `Savings: ₹${meetingData.savingsCollected.toLocaleString()}`);
  content = content.replace(/Repayments: ₹\[AMOUNT\]/g, `Repayments: ₹${meetingData.loanRepayments.toLocaleString()}`);
  content = content.replace(/Fines: ₹\[AMOUNT\]/g, `Fines: ₹${meetingData.finesCollected.toLocaleString()}`);
  content = content.replace(/\*\*Total:\*\* ₹\[AMOUNT\]/g, `**Total:** ₹${meetingData.totalCollected.toLocaleString()}`);
  content = content.replace(/Total: ₹\[AMOUNT\]/g, `Total: ₹${meetingData.totalCollected.toLocaleString()}`);
  
  if (meetingData.openingBalance !== undefined) {
    content = content.replace(/Opening balance: ₹\[AMOUNT\]/g, `Opening balance: ₹${meetingData.openingBalance.toLocaleString()}`);
    content = content.replace(/Opening: ₹\[AMOUNT\]/g, `Opening: ₹${meetingData.openingBalance.toLocaleString()}`);
  }
  
  if (meetingData.closingBalance !== undefined) {
    content = content.replace(/Closing balance: ₹\[AMOUNT\]/g, `Closing balance: ₹${meetingData.closingBalance.toLocaleString()}`);
    content = content.replace(/Closing: ₹\[AMOUNT\]/g, `Closing: ₹${meetingData.closingBalance.toLocaleString()}`);
  }
  
  // Add timestamp
  content = content.replace(/\[TIME\]/g, new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
  
  return content;
};

// ============ EXPORT MINUTES ============

export const exportMinutesAsPDF = async (minutes: MeetingMinutes): Promise<void> => {
  // Create a printable HTML version
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Meeting Minutes - ${minutes.createdAt}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
      </style>
    </head>
    <body>
      ${minutes.content.replace(/\n/g, '<br>').replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/^## (.+)$/gm, '<h2>$1</h2>')}
      <div class="footer">
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  }
};

export const shareMinutes = async (minutes: MeetingMinutes): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Meeting Minutes - ${minutes.createdAt.split('T')[0]}`,
        text: minutes.content
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  } else {
    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(minutes.content);
    haptics.success();
  }
};
