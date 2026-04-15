// Member Performance Score Calculator
import { Member, Loan, Transaction, Meeting } from '../types';

export interface PerformanceMetrics {
  attendanceScore: number;      // 0-100 based on attendance rate
  savingsScore: number;         // 0-100 based on savings consistency
  repaymentScore: number;       // 0-100 based on loan repayment
  participationScore: number;   // 0-100 based on meeting participation
  overallScore: number;         // Weighted average
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';
  badges: string[];
  insights: string[];
}

export interface PerformanceWeights {
  attendance: number;
  savings: number;
  repayment: number;
  participation: number;
}

const DEFAULT_WEIGHTS: PerformanceWeights = {
  attendance: 0.25,
  savings: 0.30,
  repayment: 0.30,
  participation: 0.15
};

// ============ SCORE CALCULATIONS ============

export const calculateAttendanceScore = (member: Member): number => {
  // Direct attendance rate
  return member.attendanceRate;
};

export const calculateSavingsScore = (
  member: Member, 
  transactions: Transaction[],
  expectedMonthlySavings: number = 100
): number => {
  const memberTransactions = transactions.filter(
    t => t.memberId === member.id && t.type === 'Savings'
  );
  
  if (memberTransactions.length === 0) return 0;
  
  // Calculate consistency (how many months they saved)
  const months = new Set(memberTransactions.map(t => {
    const [day, month, year] = t.date.split('/');
    return `${month}/${year}`;
  }));
  
  // Calculate average savings
  const totalSavings = memberTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgSavings = totalSavings / memberTransactions.length;
  
  // Score based on consistency and amount
  const consistencyScore = Math.min(100, (months.size / 12) * 100);
  const amountScore = Math.min(100, (avgSavings / expectedMonthlySavings) * 100);
  
  return Math.round((consistencyScore * 0.4) + (amountScore * 0.6));
};

export const calculateRepaymentScore = (
  member: Member,
  loans: Loan[]
): number => {
  const memberLoans = loans.filter(l => l.memberId === member.id);
  
  if (memberLoans.length === 0) return 100; // No loans = perfect score
  
  let totalScore = 0;
  let loanCount = 0;
  
  memberLoans.forEach(loan => {
    loanCount++;
    
    if (loan.status === 'Completed') {
      // Check if completed on time
      const [endDay, endMonth, endYear] = loan.endDate.split('/').map(Number);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      const lastRepayment = loan.repaymentHistory[0];
      
      if (lastRepayment) {
        const [repayDay, repayMonth, repayYear] = lastRepayment.date.split('/').map(Number);
        const repayDate = new Date(repayYear, repayMonth - 1, repayDay);
        
        if (repayDate <= endDate) {
          totalScore += 100; // On time
        } else {
          // Late but completed
          const daysLate = Math.ceil((repayDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
          totalScore += Math.max(60, 100 - daysLate);
        }
      } else {
        totalScore += 100;
      }
    } else if (loan.status === 'Active') {
      // Calculate progress
      const progress = (loan.amountPaid / loan.totalRepayable) * 100;
      
      // Check if on track
      const [startDay, startMonth, startYear] = loan.startDate.split('/').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const today = new Date();
      const monthsElapsed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
      const expectedProgress = (monthsElapsed / loan.termMonths) * 100;
      
      if (progress >= expectedProgress) {
        totalScore += 90; // On track
      } else {
        totalScore += Math.max(40, progress);
      }
    } else if (loan.status === 'Defaulted') {
      totalScore += 0;
    }
  });
  
  return Math.round(totalScore / loanCount);
};

export const calculateParticipationScore = (
  member: Member,
  meetings: Meeting[]
): number => {
  const attendedMeetings = meetings.filter(m => m.attendees.includes(member.id));
  
  if (meetings.length === 0) return 100;
  
  // Base participation rate
  const participationRate = (attendedMeetings.length / meetings.length) * 100;
  
  // Bonus for contributing in meetings
  let contributionBonus = 0;
  attendedMeetings.forEach(m => {
    if (m.savingsCollected[member.id] && m.savingsCollected[member.id] > 0) {
      contributionBonus += 2;
    }
  });
  
  return Math.min(100, Math.round(participationRate + contributionBonus));
};

// ============ OVERALL PERFORMANCE ============

export const calculatePerformance = (
  member: Member,
  transactions: Transaction[],
  loans: Loan[],
  meetings: Meeting[],
  weights: PerformanceWeights = DEFAULT_WEIGHTS
): PerformanceMetrics => {
  const attendanceScore = calculateAttendanceScore(member);
  const savingsScore = calculateSavingsScore(member, transactions);
  const repaymentScore = calculateRepaymentScore(member, loans);
  const participationScore = calculateParticipationScore(member, meetings);
  
  const overallScore = Math.round(
    (attendanceScore * weights.attendance) +
    (savingsScore * weights.savings) +
    (repaymentScore * weights.repayment) +
    (participationScore * weights.participation)
  );
  
  const grade = getGrade(overallScore);
  const badges = getBadges(attendanceScore, savingsScore, repaymentScore, participationScore, member);
  const insights = getInsights(attendanceScore, savingsScore, repaymentScore, participationScore);
  
  return {
    attendanceScore,
    savingsScore,
    repaymentScore,
    participationScore,
    overallScore,
    grade,
    badges,
    insights
  };
};

// ============ GRADING ============

export const getGrade = (score: number): PerformanceMetrics['grade'] => {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
};

export const getGradeColor = (grade: PerformanceMetrics['grade']): string => {
  switch (grade) {
    case 'A+': return 'from-emerald-400 to-green-500';
    case 'A': return 'from-green-400 to-emerald-500';
    case 'B+': return 'from-blue-400 to-cyan-500';
    case 'B': return 'from-cyan-400 to-blue-500';
    case 'C': return 'from-yellow-400 to-orange-500';
    case 'D': return 'from-orange-400 to-red-500';
    case 'F': return 'from-red-400 to-red-600';
  }
};

// ============ BADGES ============

export const getBadges = (
  attendance: number,
  savings: number,
  repayment: number,
  participation: number,
  member: Member
): string[] => {
  const badges: string[] = [];
  
  if (attendance === 100) badges.push('🏆 Perfect Attendance');
  if (attendance >= 90) badges.push('⭐ Regular Attendee');
  
  if (savings >= 95) badges.push('💰 Super Saver');
  if (savings >= 80) badges.push('🐷 Consistent Saver');
  
  if (repayment === 100) badges.push('✅ Loan Champion');
  if (repayment >= 90) badges.push('💳 Reliable Borrower');
  
  if (participation >= 95) badges.push('🤝 Active Participant');
  
  if (member.savingsBalance >= 10000) badges.push('💎 10K Saver');
  if (member.savingsBalance >= 5000) badges.push('🌟 5K Milestone');
  
  if (member.loanOutstanding === 0 && member.savingsBalance > 0) {
    badges.push('🎯 Debt Free');
  }
  
  return badges;
};

// ============ INSIGHTS ============

export const getInsights = (
  attendance: number,
  savings: number,
  repayment: number,
  participation: number
): string[] => {
  const insights: string[] = [];
  
  if (attendance < 70) {
    insights.push('Improve attendance to boost your score');
  }
  
  if (savings < 60) {
    insights.push('Try to save consistently every month');
  }
  
  if (repayment < 70) {
    insights.push('Focus on timely loan repayments');
  }
  
  if (participation < 60) {
    insights.push('Participate more actively in meetings');
  }
  
  if (attendance >= 90 && savings >= 90) {
    insights.push('Excellent performance! Keep it up!');
  }
  
  return insights;
};

// ============ RANKING ============

export interface MemberRanking {
  memberId: string;
  memberName: string;
  score: number;
  grade: PerformanceMetrics['grade'];
  rank: number;
  change: 'up' | 'down' | 'same';
}

export const calculateGroupRankings = (
  members: Member[],
  transactions: Transaction[],
  loans: Loan[],
  meetings: Meeting[]
): MemberRanking[] => {
  const rankings = members.map(member => {
    const performance = calculatePerformance(member, transactions, loans, meetings);
    return {
      memberId: member.id,
      memberName: member.name,
      score: performance.overallScore,
      grade: performance.grade,
      rank: 0,
      change: 'same' as const
    };
  });
  
  // Sort by score descending
  rankings.sort((a, b) => b.score - a.score);
  
  // Assign ranks
  rankings.forEach((r, index) => {
    r.rank = index + 1;
  });
  
  return rankings;
};

// ============ DEFAULTER DETECTION ============

export interface Defaulter {
  memberId: string;
  memberName: string;
  loanId: string;
  overdueAmount: number;
  daysOverdue: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const detectDefaulters = (loans: Loan[]): Defaulter[] => {
  const today = new Date();
  const defaulters: Defaulter[] = [];
  
  loans.filter(l => l.status === 'Active').forEach(loan => {
    const [day, month, year] = loan.endDate.split('/').map(Number);
    const endDate = new Date(year, month - 1, day);
    
    if (today > endDate) {
      const daysOverdue = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      const overdueAmount = loan.totalRepayable - loan.amountPaid;
      
      let severity: Defaulter['severity'] = 'low';
      if (daysOverdue > 90) severity = 'critical';
      else if (daysOverdue > 60) severity = 'high';
      else if (daysOverdue > 30) severity = 'medium';
      
      defaulters.push({
        memberId: loan.memberId,
        memberName: loan.memberName,
        loanId: loan.id,
        overdueAmount,
        daysOverdue,
        severity
      });
    }
  });
  
  return defaulters.sort((a, b) => b.daysOverdue - a.daysOverdue);
};
