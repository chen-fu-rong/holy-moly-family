"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, PieChart, Target, TrendingDown, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Budget Data
  const [expectedIncome, setExpectedIncome] = useState(0);
  // const [expectedIncome, setExpectedIncome] = useState(0);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});
  
  // Transaction Data
  const [totalSpent, setTotalSpent] = useState(0);
  const [spentByCategory, setSpentByCategory] = useState<Record<string, number>>({});
  
  // Time state
  const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");

    if (familyId) {
      // 1. Fetch Budget Limits
      const { data: familyData } = await supabase
        .from('families')
        .select('expected_monthly_income, budget_limits')
        .eq('id', familyId)
        .single();

      if (familyData) {
        setExpectedIncome(familyData.expected_monthly_income || 0);
        setBudgetLimits(familyData.budget_limits || {});
      }

      // 2. Fetch Current Month's Transactions
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: txData } = await supabase
        .from('transactions')
        .select('amount, type, category')
        .eq('family_id', familyId)
        .eq('type', 'expense')
        .gte('transaction_date', firstDay)
        .lte('transaction_date', lastDay);

      if (txData) {
        let total = 0;
        const categoryTotals: Record<string, number> = {};

        txData.forEach(tx => {
          const amt = Number(tx.amount);
          total += amt;
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
        });

        setTotalSpent(total);
        setSpentByCategory(categoryTotals);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchReportData();
    const handleUpdate = () => void fetchReportData();
    window.addEventListener("transaction-updated", handleUpdate);
    window.addEventListener("settings-updated", handleUpdate);
    return () => {
      window.removeEventListener("transaction-updated", handleUpdate);
      window.removeEventListener("settings-updated", handleUpdate);
    };
  }, [fetchReportData]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const totalBudgeted = Object.values(budgetLimits).reduce((acc, limit) => acc + limit, 0);
  const overallProgress = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  const isOverBudget = totalSpent > totalBudgeted;

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
      {/* 2026 Aurora Ambient Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu">
        <div className="absolute top-[10%] -left-[20%] w-[70%] h-[60%] rounded-full bg-emerald-400/10 dark:bg-emerald-600/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[20%] -right-[10%] w-[60%] h-[50%] rounded-full bg-indigo-400/10 dark:bg-indigo-600/10 blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-4xl mx-auto pt-4 space-y-6">
        
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <PieChart size={14} className="text-emerald-500" /> Analytics
            </h2>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Budget & Reports</h1>
          </div>
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
            <Calendar size={14} /> {currentMonthName}
          </div>
        </div>

        {/* Master Budget Health Card */}
        <div className={`rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden transform-gpu transition-colors duration-500 ${isOverBudget ? 'bg-gradient-to-br from-rose-600 to-rose-800' : 'bg-gradient-to-br from-indigo-600 to-emerald-600'}`}>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <p className="font-bold text-white/80 text-sm flex items-center gap-2 uppercase tracking-wider">
                <Target size={16} /> Monthly Burn Rate
              </p>
              {isOverBudget ? (
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                  <AlertTriangle size={14} /> Over Budget
                </div>
              ) : (
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                  <CheckCircle2 size={14} /> On Track
                </div>
              )}
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
                {totalSpent.toLocaleString()}
              </h2>
              <span className="text-lg text-white/70 font-bold">/ {totalBudgeted.toLocaleString()} Ks</span>
            </div>

            {/* Master Progress Bar */}
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-rose-400' : 'bg-white'}`}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </div>
          <TrendingDown size={140} className="absolute -bottom-8 -right-8 text-white/10 -rotate-12" />
        </div>

        {/* Smart Envelopes List */}
        <div>
          <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            Smart Envelopes
          </h3>
          
          {Object.keys(budgetLimits).length === 0 ? (
            <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-700 p-8 rounded-[2rem] text-center">
              <p className="text-gray-500 font-medium">No budget limits set. Go to Settings to configure your envelopes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(budgetLimits).map(([category, limit], idx) => {
                if (limit === 0) return null; // Skip tracking-only categories
                
                const spent = spentByCategory[category] || 0;
                const progress = (spent / limit) * 100;
                const isWarning = progress > 85 && progress <= 100;
                const isDanger = progress > 100;
                
                return (
                  <div 
                    key={category} 
                    className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-5 rounded-[1.5rem] shadow-sm transform-gpu transition-all hover:scale-[1.01] animate-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">{category}</h4>
                      <p className={`font-black text-sm ${isDanger ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                        {spent.toLocaleString()} <span className="text-xs text-gray-400 font-bold">/ {limit.toLocaleString()} Ks</span>
                      </p>
                    </div>
                    
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-end mt-2 text-[10px] font-bold uppercase tracking-wider">
                      {isDanger ? (
                        <span className="text-rose-500">Over limit by {(spent - limit).toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">{(limit - spent).toLocaleString()} remaining</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}