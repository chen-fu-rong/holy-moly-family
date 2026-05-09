"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { exportToCSV } from "@/lib/utils";
import { Loader2, PieChart, Target, TrendingDown, AlertTriangle, CheckCircle2, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, Download, Share2, Clock4, Wallet, TrendingUp } from "lucide-react";
import { LineChart, PieChart as RePieChart, ResponsiveContainer, Line, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const rangeOptions = [
  { key: 'thisMonth', label: 'This Month' },
  { key: 'last3Months', label: 'Last 3 Months' },
  { key: 'thisYear', label: 'This Year' },
  { key: 'custom', label: 'Custom' },
] as const;

type RangeKey = (typeof rangeOptions)[number]['key'];

const chartColors = ['#4f46e5', '#22c55e', '#f97316', '#0ea5e9', '#7c3aed', '#ef4444'];

function buildDateRange(rangeKey: RangeKey, customStart: string, customEnd: string) {
  const now = new Date();
  switch (rangeKey) {
    case 'last3Months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { start, end };
    }
    case 'custom': {
      const start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = customEnd ? new Date(customEnd) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
      }
      return { start, end: new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59) };
    }
    default:
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) };
  }
}

function createDateLabels(start: Date, end: Date) {
  const labels: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    labels.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return labels;
}

function formatDateLabel(date: string) {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatCurrencyTooltip(value?: any) {
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === 'number' ? `${item.toLocaleString()} Ks` : item);
  }
  return typeof value === 'number' ? `${value.toLocaleString()} Ks` : (value ?? '');
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<RangeKey>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expectedIncome, setExpectedIncome] = useState(0);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const rangeBounds = useMemo(() => buildDateRange(dateRange, customStart, customEnd), [dateRange, customStart, customEnd]);
  const currentRangeLabel = useMemo(() => {
    if (dateRange === 'custom') {
      return customStart && customEnd ? `${customStart} → ${customEnd}` : 'Custom Range';
    }
    return rangeOptions.find(option => option.key === dateRange)?.label ?? 'This Month';
  }, [dateRange, customStart, customEnd]);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem('family_id');
    if (!familyId) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const familyPromise = supabase
      .from('families')
      .select('expected_monthly_income, budget_limits')
      .eq('id', familyId)
      .single();

    const { start, end } = rangeBounds;
    const transactionPromise = supabase
      .from('transactions')
      .select('amount, type, category, is_business_overhead, transaction_date, account, notes')
      .eq('family_id', familyId)
      .gte('transaction_date', start.toISOString())
      .lte('transaction_date', end.toISOString())
      .order('transaction_date', { ascending: true });

    const [familyRes, txRes] = await Promise.all([familyPromise, transactionPromise]);

    if (familyRes.data) {
      setExpectedIncome(Number(familyRes.data.expected_monthly_income || 0));
      setBudgetLimits(familyRes.data.budget_limits || {});
    }

    if (txRes.data) {
      setTransactions(txRes.data);
    } else {
      setTransactions([]);
    }

    setIsLoading(false);
  }, [rangeBounds]);

  useEffect(() => {
    void fetchReportData();
    const handleUpdate = () => void fetchReportData();
    window.addEventListener('transaction-updated', handleUpdate);
    window.addEventListener('settings-updated', handleUpdate);
    return () => {
      window.removeEventListener('transaction-updated', handleUpdate);
      window.removeEventListener('settings-updated', handleUpdate);
    };
  }, [fetchReportData]);

  const stats = useMemo(() => {
    const result = {
      totalIncome: 0,
      totalExpense: 0,
      personalIncome: 0,
      businessIncome: 0,
      personalExpense: 0,
      businessExpense: 0,
      expenseByCategory: {} as Record<string, number>,
      incomeByCategory: {} as Record<string, number>,
      dailyTrend: [] as Array<{ date: string; income: number; expense: number }>,
    };

    const dailyMap: Record<string, { income: number; expense: number }> = {};
    const labels = createDateLabels(rangeBounds.start, rangeBounds.end);
    labels.forEach(label => {
      dailyMap[label] = { income: 0, expense: 0 };
    });

    transactions.forEach(tx => {
      const amount = Number(tx.amount || 0);
      const date = tx.transaction_date ? tx.transaction_date.slice(0, 10) : '';
      const category = tx.category || 'Uncategorized';
      const isBusiness = Boolean(tx.is_business_overhead);

      if (tx.type === 'income') {
        result.totalIncome += amount;
        if (isBusiness) {
          result.businessIncome += amount;
        } else {
          result.personalIncome += amount;
        }
        result.incomeByCategory[category] = (result.incomeByCategory[category] || 0) + amount;
        if (dailyMap[date]) dailyMap[date].income += amount;
      } else {
        result.totalExpense += amount;
        if (isBusiness) {
          result.businessExpense += amount;
        } else {
          result.personalExpense += amount;
        }
        result.expenseByCategory[category] = (result.expenseByCategory[category] || 0) + amount;
        if (dailyMap[date]) dailyMap[date].expense += amount;
      }
    });

    result.dailyTrend = labels.map(label => ({ date: label, income: dailyMap[label].income, expense: dailyMap[label].expense }));
    return result;
  }, [transactions, rangeBounds.end, rangeBounds.start]);

  const totalBudgeted = useMemo(() => Object.values(budgetLimits).reduce((acc, limit) => acc + Number(limit || 0), 0), [budgetLimits]);
  const netCashFlow = stats.totalIncome - stats.totalExpense;
  const expenseCategories = useMemo(() => Object.entries(stats.expenseByCategory).sort((a, b) => b[1] - a[1]), [stats.expenseByCategory]);
  const incomeCategories = useMemo(() => Object.entries(stats.incomeByCategory).sort((a, b) => b[1] - a[1]), [stats.incomeByCategory]);
  const budgetRows = useMemo(() => Object.entries(budgetLimits).map(([category, limit]) => ({ category, limit: Number(limit), spent: stats.expenseByCategory[category] || 0 })), [budgetLimits, stats.expenseByCategory]);
  const overBudgetRows = budgetRows.filter(row => row.spent > row.limit && row.limit > 0);
  const topExpenses = expenseCategories.slice(0, 5);
  const topIncomes = incomeCategories.slice(0, 5);

  const transactionExportData = useMemo(() => transactions.map(tx => ({
    Date: tx.transaction_date?.slice(0, 10) || '',
    Type: tx.type,
    Category: tx.category || 'Uncategorized',
    Amount: tx.amount,
    Account: tx.account || '',
    Business: tx.is_business_overhead ? 'Yes' : 'No',
    Notes: tx.notes || '',
  })), [transactions]);

  const handleExport = () => {
    exportToCSV(transactionExportData, `transactions_${currentRangeLabel.replace(/\s+/g, '_')}`);
  };

  const handleCopySummary = async () => {
    const text = `Report ${currentRangeLabel}: Income ${stats.totalIncome.toLocaleString()} Ks, Expense ${stats.totalExpense.toLocaleString()} Ks, Net ${netCashFlow.toLocaleString()} Ks.`;
    await navigator.clipboard.writeText(text);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 1500);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu">
        <div className="absolute top-[10%] -left-[20%] w-[70%] h-[60%] rounded-full bg-sky-400/10 dark:bg-sky-600/10 blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[20%] -right-[10%] w-[60%] h-[50%] rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-6xl mx-auto pt-4 space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <BarChart3 size={14} className="text-cyan-500" /> Performance Report
            </h2>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white">Family Financial Insights</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-2xl">Visualize your income, spending, budgets, and category breakdowns with easy charts and actionable insights.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
            <button onClick={handleExport} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-bold hover:shadow-sm transition">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={handleCopySummary} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-bold hover:shadow-sm transition">
              <Share2 size={16} /> Copy Summary
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'Total Income', value: stats.totalIncome, icon: <ArrowUpRight size={20} className="text-emerald-500" />, color: 'from-emerald-500 to-cyan-500' },
                { title: 'Total Expense', value: stats.totalExpense, icon: <ArrowDownRight size={20} className="text-rose-500" />, color: 'from-rose-500 to-fuchsia-500' },
                { title: 'Net Cash Flow', value: netCashFlow, icon: <TrendingUp size={20} className="text-indigo-500" />, color: 'from-indigo-500 to-violet-500' },
                { title: 'Budget Capacity', value: totalBudgeted, icon: <Wallet size={20} className="text-sky-500" />, color: 'from-sky-500 to-cyan-500' },
              ].map((card) => (
                <div key={card.title} className="rounded-[2rem] p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${card.color} text-white`}>
                      {card.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{card.title}</span>
                  </div>
                  <p className="text-3xl font-black text-gray-900 dark:text-white">{card.value.toLocaleString()} Ks</p>
                </div>
              ))}
            </div>

            <div className="rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Income vs Expense Trend</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track how cash flow moves over the selected period.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rangeOptions.map(option => (
                    <button
                      key={option.key}
                      onClick={() => setDateRange(option.key)}
                      className={`rounded-2xl px-4 py-2 text-sm font-bold transition ${dateRange === option.key ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {dateRange === 'custom' && (
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <label className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
                    Start date
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3 outline-none text-sm text-gray-900 dark:text-white" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
                    End date
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-3 outline-none text-sm text-gray-900 dark:text-white" />
                  </label>
                </div>
              )}
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.dailyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tickFormatter={formatDateLabel} tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <Tooltip formatter={formatCurrencyTooltip} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Expense Mix</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Most costly categories this period.</p>
                  </div>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{expenseCategories.length} categories</span>
                </div>
                {expenseCategories.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">No expense data yet.</div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={expenseCategories.map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                          {expenseCategories.map(([_, __], idx) => (
                            <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={formatCurrencyTooltip} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Income Mix</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Where your money is coming from.</p>
                  </div>
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{incomeCategories.length} categories</span>
                </div>
                {incomeCategories.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">No income data yet.</div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie data={incomeCategories.map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                          {incomeCategories.map(([_, __], idx) => (
                            <Cell key={idx} fill={chartColors[(idx + 2) % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={formatCurrencyTooltip} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Budget Summary</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track budgeted categories and overspending alerts.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Clock4 size={14} /> {currentRangeLabel}
                </span>
              </div>
              <div className="space-y-3">
                {budgetRows.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">No budgets set yet.</div>
                ) : (
                  budgetRows.map((row) => {
                    const progress = row.limit ? Math.min((row.spent / row.limit) * 100, 100) : 0;
                    const statusClass = row.spent > row.limit ? 'bg-rose-500' : row.spent > row.limit * 0.85 ? 'bg-amber-400' : 'bg-emerald-500';
                    return (
                      <div key={row.category} className="rounded-3xl border border-gray-100 dark:border-gray-800 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <h4 className="font-bold text-gray-900 dark:text-white">{row.category}</h4>
                          <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{row.spent.toLocaleString()} / {row.limit.toLocaleString()} Ks</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div className={`h-full rounded-full ${statusClass}`} style={{ width: `${progress}%` }} />
                        </div>
                        {row.spent > row.limit && row.limit > 0 ? (
                          <p className="mt-2 text-xs font-bold text-rose-500">Exceeded by {(row.spent - row.limit).toLocaleString()} Ks</p>
                        ) : (
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{(row.limit - row.spent).toLocaleString()} Ks remaining</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Top Categories</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Highest impact areas in your cash flow.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Expenses</h4>
                  <div className="space-y-3">
                    {topExpenses.length === 0 ? <p className="text-sm text-gray-500">No expense categories yet.</p> : topExpenses.map(([category, value], idx) => (
                      <div key={category} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: chartColors[idx % chartColors.length] }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{category}</span>
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{value.toLocaleString()} Ks</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Income</h4>
                  <div className="space-y-3">
                    {topIncomes.length === 0 ? <p className="text-sm text-gray-500">No income categories yet.</p> : topIncomes.map(([category, value], idx) => (
                      <div key={category} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: chartColors[(idx + 2) % chartColors.length] }} />
                          <span className="font-medium text-gray-900 dark:text-gray-100">{category}</span>
                        </div>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{value.toLocaleString()} Ks</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Alerts</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Important budget and income signals.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-3xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 p-4">
                  <p className="text-sm font-bold text-sky-700 dark:text-sky-300">Income performance</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Total income this period is {stats.totalIncome.toLocaleString()} Ks. {stats.totalIncome >= expectedIncome ? 'You are meeting or exceeding expected family income.' : 'Income is below expected monthly target.'}</p>
                </div>
                {overBudgetRows.length > 0 ? (
                  overBudgetRows.map(row => (
                    <div key={row.category} className="rounded-3xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800 p-4">
                      <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{row.category} is over budget</p>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">You have exceeded the budget by {(row.spent - row.limit).toLocaleString()} Ks. Consider reducing spending in this category.</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800 p-4">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">No overspend alerts</p>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">All tracked categories are within budget.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showCopySuccess && (
          <div className="fixed right-4 bottom-4 rounded-3xl bg-emerald-600 px-4 py-3 text-white shadow-lg shadow-emerald-500/20">
            Summary copied to clipboard.
          </div>
        )}
      </div>
    </div>
  );
}
