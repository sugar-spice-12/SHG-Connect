// Export utilities for PDF and Excel generation
import { Member, Transaction, Loan, Meeting } from '../types';

// ============ CSV/EXCEL EXPORT ============

export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  if (data.length === 0) return;

  const keys = headers || Object.keys(data[0]);
  const csvContent = [
    keys.join(','),
    ...data.map(row => 
      keys.map(key => {
        const value = row[key];
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

export const exportMembersToCSV = (members: Member[]) => {
  const data = members.map(m => ({
    'Name': m.name,
    'Role': m.role,
    'Phone': m.phoneNumber || 'N/A',
    'Savings Balance': m.savingsBalance,
    'Loan Outstanding': m.loanOutstanding,
    'Attendance Rate': `${m.attendanceRate}%`,
    'Joined Date': m.joinedDate,
    'Last Active': m.lastActive
  }));
  
  exportToCSV(data, 'shg_members');
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const data = transactions.map(t => ({
    'Date': t.date,
    'Type': t.type,
    'Member': t.memberName || 'N/A',
    'Amount': t.amount,
    'Description': t.description,
    'Category': t.category || 'N/A'
  }));
  
  exportToCSV(data, 'shg_transactions');
};

export const exportLoansToCSV = (loans: Loan[]) => {
  const data = loans.map(l => ({
    'Member': l.memberName,
    'Principal': l.principal,
    'Interest Rate': `${l.interestRate}%`,
    'Term (Months)': l.termMonths,
    'EMI': l.emiAmount,
    'Amount Paid': l.amountPaid,
    'Status': l.status,
    'Start Date': l.startDate,
    'End Date': l.endDate
  }));
  
  exportToCSV(data, 'shg_loans');
};

// ============ PDF EXPORT ============

export const generatePDFReport = async (
  title: string,
  data: {
    summary?: { label: string; value: string | number }[];
    tables?: { title: string; headers: string[]; rows: (string | number)[][] }[];
    text?: string[];
  }
) => {
  // Generate HTML content for PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 40px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #6366F1;
        }
        .header h1 {
          color: #6366F1;
          font-size: 24px;
          margin-bottom: 5px;
        }
        .header p {
          color: #666;
          font-size: 12px;
        }
        .summary {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-item {
          flex: 1;
          min-width: 150px;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #6366F1;
        }
        .summary-item .label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
        .summary-item .value {
          font-size: 20px;
          font-weight: bold;
          color: #333;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th {
          background: #6366F1;
          color: white;
          padding: 12px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
        }
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #eee;
          font-size: 13px;
        }
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        .section-title {
          font-size: 16px;
          color: #333;
          margin: 20px 0 10px;
          padding-bottom: 5px;
          border-bottom: 1px solid #ddd;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 11px;
          color: #999;
        }
        @media print {
          body { padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SHG Connect</h1>
        <h2>${title}</h2>
        <p>Generated on ${new Date().toLocaleDateString('en-IN', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      ${data.summary ? `
        <div class="summary">
          ${data.summary.map(item => `
            <div class="summary-item">
              <div class="label">${item.label}</div>
              <div class="value">${item.value}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${data.tables ? data.tables.map(table => `
        <h3 class="section-title">${table.title}</h3>
        <table>
          <thead>
            <tr>
              ${table.headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${table.rows.map(row => `
              <tr>
                ${row.map(cell => `<td>${cell}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `).join('') : ''}

      ${data.text ? data.text.map(t => `<p>${t}</p>`).join('') : ''}

      <div class="footer">
        <p>This report was generated by SHG Connect - Empowering Self-Help Groups</p>
        <p>© ${new Date().getFullYear()} SHG Connect. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }

  return html;
};

export const generateMemberReport = (members: Member[], groupName: string = 'SHG Group') => {
  const totalSavings = members.reduce((sum, m) => sum + m.savingsBalance, 0);
  const totalLoans = members.reduce((sum, m) => sum + m.loanOutstanding, 0);
  const avgAttendance = members.reduce((sum, m) => sum + m.attendanceRate, 0) / members.length;

  return generatePDFReport(`${groupName} - Member Report`, {
    summary: [
      { label: 'Total Members', value: members.length },
      { label: 'Total Savings', value: `₹${totalSavings.toLocaleString()}` },
      { label: 'Total Loans', value: `₹${totalLoans.toLocaleString()}` },
      { label: 'Avg Attendance', value: `${avgAttendance.toFixed(1)}%` }
    ],
    tables: [{
      title: 'Member Details',
      headers: ['Name', 'Role', 'Savings', 'Loan', 'Attendance', 'Joined'],
      rows: members.map(m => [
        m.name,
        m.role,
        `₹${m.savingsBalance.toLocaleString()}`,
        `₹${m.loanOutstanding.toLocaleString()}`,
        `${m.attendanceRate}%`,
        m.joinedDate
      ])
    }]
  });
};

export const generateTransactionReport = (
  transactions: Transaction[], 
  dateRange?: { from: string; to: string }
) => {
  const totalIncome = transactions
    .filter(t => ['Savings', 'Loan Repayment', 'Fine'].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalLoans = transactions
    .filter(t => t.type === 'New Loan')
    .reduce((sum, t) => sum + t.amount, 0);

  return generatePDFReport('Transaction Report', {
    summary: [
      { label: 'Total Transactions', value: transactions.length },
      { label: 'Total Income', value: `₹${totalIncome.toLocaleString()}` },
      { label: 'Total Expense', value: `₹${totalExpense.toLocaleString()}` },
      { label: 'Loans Disbursed', value: `₹${totalLoans.toLocaleString()}` }
    ],
    tables: [{
      title: 'Transaction History',
      headers: ['Date', 'Type', 'Member', 'Amount', 'Description'],
      rows: transactions.slice(0, 50).map(t => [
        t.date,
        t.type,
        t.memberName || '-',
        `₹${t.amount.toLocaleString()}`,
        t.description
      ])
    }]
  });
};

export const generateLoanReport = (loans: Loan[]) => {
  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalDisbursed = loans.reduce((sum, l) => sum + l.principal, 0);
  const totalRecovered = loans.reduce((sum, l) => sum + l.amountPaid, 0);
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.totalRepayable - l.amountPaid), 0);

  return generatePDFReport('Loan Report', {
    summary: [
      { label: 'Total Loans', value: loans.length },
      { label: 'Active Loans', value: activeLoans.length },
      { label: 'Total Disbursed', value: `₹${totalDisbursed.toLocaleString()}` },
      { label: 'Outstanding', value: `₹${totalOutstanding.toLocaleString()}` }
    ],
    tables: [{
      title: 'Loan Details',
      headers: ['Member', 'Principal', 'Interest', 'EMI', 'Paid', 'Status'],
      rows: loans.map(l => [
        l.memberName,
        `₹${l.principal.toLocaleString()}`,
        `${l.interestRate}%`,
        `₹${l.emiAmount.toLocaleString()}`,
        `₹${l.amountPaid.toLocaleString()}`,
        l.status
      ])
    }]
  });
};

// ============ HELPER FUNCTIONS ============

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============ SHARE FUNCTIONALITY ============

export const shareReport = async (title: string, text: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch (err) {
      console.error('Share failed:', err);
    }
  }
  
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Copy failed:', err);
    return false;
  }
};

// ============ RECEIPT GENERATOR ============

export const generateReceipt = (transaction: Transaction, groupName: string = 'SHG Connect') => {
  const receiptNo = `RCP${Date.now().toString().slice(-8)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${receiptNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 300px;
          margin: 0 auto;
        }
        .receipt {
          border: 2px dashed #333;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 1px dashed #333;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .header h1 { font-size: 18px; }
        .header p { font-size: 10px; color: #666; }
        .receipt-no {
          text-align: center;
          font-size: 12px;
          margin-bottom: 15px;
        }
        .details { margin-bottom: 15px; }
        .row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin: 5px 0;
        }
        .amount {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          padding: 15px 0;
          border-top: 1px dashed #333;
          border-bottom: 1px dashed #333;
          margin: 15px 0;
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #666;
        }
        .qr-placeholder {
          width: 80px;
          height: 80px;
          border: 1px solid #333;
          margin: 10px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>${groupName}</h1>
          <p>Self-Help Group</p>
        </div>
        
        <div class="receipt-no">
          Receipt No: <strong>${receiptNo}</strong>
        </div>
        
        <div class="details">
          <div class="row">
            <span>Date:</span>
            <span>${transaction.date}</span>
          </div>
          <div class="row">
            <span>Type:</span>
            <span>${transaction.type}</span>
          </div>
          ${transaction.memberName ? `
          <div class="row">
            <span>Member:</span>
            <span>${transaction.memberName}</span>
          </div>
          ` : ''}
          <div class="row">
            <span>Description:</span>
            <span>${transaction.description}</span>
          </div>
        </div>
        
        <div class="amount">
          ₹${transaction.amount.toLocaleString()}
        </div>
        
        <div class="qr-placeholder">
          [QR Code]
        </div>
        
        <div class="footer">
          <p>Thank you for your contribution!</p>
          <p>Generated by SHG Connect</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  }
};
