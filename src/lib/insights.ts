import { Transaction, Loan } from "@/types";

export interface Insight {
  type: 'positive' | 'neutral' | 'negative' | 'warning';
  title: string;
  description: string;
  icon: string;
}

export function generateInsights(
  transactions: Transaction[], 
  loans: Loan[], 
  savingsGoals: any[], 
  budgetLimits: Record<string, number>, 
  currency: string
): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 1. Month-to-Date Stats
  const thisMonthTxs = transactions.filter(tx => {
    const d = new Date(tx.transaction_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const expenses = thisMonthTxs.filter(tx => tx.type === 'expense');
  const totalExpenses = expenses.reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  if (expenses.length > 0) {
    // 2. Highest Category Insight & Budget Proximity
    const categories: Record<string, number> = {};
    expenses.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + Number(tx.amount);
    });

    Object.entries(categories).forEach(([cat, amt]) => {
      const limit = budgetLimits[cat] || 0;
      if (limit > 0) {
        const percent = (amt / limit) * 100;
        if (percent >= 100) {
          insights.push({
            type: 'negative',
            title: 'Budget Exceeded',
            description: `You've spent ${amt.toLocaleString()} ${currency} on "${cat}", which is ${Math.round(percent - 100)}% over your limit!`,
            icon: 'AlertTriangle'
          });
        } else if (percent >= 80) {
          insights.push({
            type: 'warning',
            title: 'Approaching Limit',
            description: `You've used ${Math.round(percent)}% of your budget for "${cat}". Time to be careful!`,
            icon: 'PieChart'
          });
        }
      }
    });

    const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory && topCategory[1] > totalExpenses * 0.3 && !insights.find(i => i.title === 'Budget Exceeded' && i.description.includes(topCategory[0]))) {
      insights.push({
        type: 'neutral',
        title: 'Category Alert',
        description: `You've spent ${topCategory[1].toLocaleString()} ${currency} on "${topCategory[0]}", which is ${Math.round((topCategory[1] / totalExpenses) * 100)}% of your monthly spending.`,
        icon: 'PieChart'
      });
    }

    // 3. Daily Average
    const daysInMonthSoFar = now.getDate();
    const dailyAvg = totalExpenses / daysInMonthSoFar;
    insights.push({
      type: 'neutral',
      title: 'Daily Burn Rate',
      description: `Your average daily spending this month is ${Math.round(dailyAvg).toLocaleString()} ${currency}.`,
      icon: 'TrendingUp'
    });
  }

  // 4. Week-over-Week Comparison
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const last7Days = transactions.filter(tx => {
    const d = new Date(tx.transaction_date);
    return d >= oneWeekAgo && d <= now && tx.type === 'expense';
  }).reduce((sum, tx) => sum + Number(tx.amount), 0);

  const prev7Days = transactions.filter(tx => {
    const d = new Date(tx.transaction_date);
    return d >= twoWeeksAgo && d < oneWeekAgo && tx.type === 'expense';
  }).reduce((sum, tx) => sum + Number(tx.amount), 0);

  if (prev7Days > 0) {
    const diff = ((last7Days - prev7Days) / prev7Days) * 100;
    if (diff > 20) {
      insights.push({
        type: 'warning',
        title: 'Spending Surge',
        description: `Your spending this week is ${Math.round(diff)}% higher than last week. Consider reviewing recent expenses.`,
        icon: 'AlertTriangle'
      });
    } else if (diff < -20) {
      insights.push({
        type: 'positive',
        title: 'Great Progress!',
        description: `You've spent ${Math.round(Math.abs(diff))}% less this week compared to last week. Keep it up!`,
        icon: 'CheckCircle'
      });
    }
  }

  // 5. Large Transaction Detection
  const avgTxSize = totalExpenses / (expenses.length || 1);
  const largeTxs = expenses.filter(tx => Number(tx.amount) > avgTxSize * 3);
  if (largeTxs.length > 0) {
    insights.push({
      type: 'neutral',
      title: 'Large Purchase detected',
      description: `Found ${largeTxs.length} unusually large transaction(s) this month. These significantly impact your average.`,
      icon: 'Target'
    });
  }

  // 6. Savings Suggestion & Milestones
  const totalIncome = thisMonthTxs.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
  if (totalIncome > totalExpenses && totalIncome > 0) {
    const surplus = totalIncome - totalExpenses;
    if (surplus > totalIncome * 0.2) {
      insights.push({
        type: 'positive',
        title: 'Savings Potential',
        description: `You have a surplus of ${surplus.toLocaleString()} ${currency} this month. Consider moving ${Math.round(surplus * 0.5).toLocaleString()} ${currency} to your savings goals!`,
        icon: 'Wallet'
      });
    }
  }

  savingsGoals.forEach(goal => {
    const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
    if (progress >= 100) {
      insights.push({
        type: 'positive',
        title: 'Goal Achieved!',
        description: `Congratulations! You've reached 100% of your "${goal.name}" goal!`,
        icon: 'CheckCircle'
      });
    } else if (progress >= 75) {
      insights.push({
        type: 'positive',
        title: 'Goal Milestone',
        description: `You're so close! You've reached 75% of your "${goal.name}" goal.`,
        icon: 'Target'
      });
    }
  });

  // 7. Loan Maturity Warning
  loans.filter(l => l.status === 'active' && l.type === 'borrowed').forEach(loan => {
    const startDate = new Date(loan.transaction_date);
    const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 30) {
      insights.push({
        type: 'warning',
        title: 'Outstanding Debt',
        description: `Your loan from ${loan.counterparty_name} has been active for ${diffDays} days. Consider settling it soon.`,
        icon: 'AlertTriangle'
      });
    }
  });

  // 8. Liquidity Safe Zone
  const personalIncome = transactions.filter(tx => !tx.is_business_overhead && tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const personalExpense = transactions.filter(tx => !tx.is_business_overhead && tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const balance = personalIncome - personalExpense;
  
  if (balance < 50000 && balance > 0) {
    insights.push({
      type: 'warning',
      title: 'Low Balance Alert',
      description: `Your personal balance is getting low (${balance.toLocaleString()} ${currency}). Watch your next expenses.`,
      icon: 'Wallet'
    });
  }

  // 9. Time of Day pattern
  const nightTxs = expenses.filter(tx => {
    const d = new Date(tx.transaction_date);
    const hour = d.getHours();
    return hour >= 22 || hour <= 4;
  });
  if (nightTxs.length >= 3) {
    insights.push({
      type: 'warning',
      title: 'Late Night Spending',
      description: `You've made ${nightTxs.length} transactions late at night recently. Impulse buys?`,
      icon: 'AlertTriangle'
    });
  }

  return insights;
}

/**
 * Predicts the category based on notes and previous patterns
 */
export function predictCategory(notes: string, history: Transaction[]): string | null {
  if (!notes || notes.length < 2) return null;
  const search = notes.toLowerCase();
  
  // 1. Check history for exact or partial note matches
  const match = history.find(tx => tx.notes?.toLowerCase().includes(search) || search.includes(tx.notes?.toLowerCase() || ''));
  if (match) return match.category;

  // 2. Simple keyword mapping
  const keywords: Record<string, string> = {
    'food': 'Food & Dining',
    'eat': 'Food & Dining',
    'taxi': 'Transport',
    'grab': 'Transport',
    'fuel': 'Transport',
    'gas': 'Transport',
    'rent': 'Housing',
    'internet': 'Bills',
    'wifi': 'Bills',
    'topup': 'Bills',
    'phone': 'Bills',
    'movie': 'Entertainment',
    'game': 'Entertainment',
    'salary': 'Salary',
    'bonus': 'Income'
  };

  for (const [key, cat] of Object.entries(keywords)) {
    if (search.includes(key)) return cat;
  }

  return null;
}
