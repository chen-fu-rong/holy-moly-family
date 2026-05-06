"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowUpRight, ArrowDownRight, RefreshCcw, Sparkles, TrendingUp, Wallet, HandCoins } from "lucide-react";
import type { Transaction } from "@/types";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [myName, setMyName] = useState("Me");
  
  // Dashboard Metrics
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpense, setMonthlyExpense] = useState<number>(0);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);

  const fetchData = async () => {
    setIsSyncing(true);
    const familyId = localStorage.getItem("family_id");
    const name = localStorage.getItem("my_name") || "Me";
    setMyName(name);

    if (!familyId) return;

    try {
      // 1. Fetch Transactions
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('family_id', familyId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (txError) throw txError;
      if (txData) {
        setTransactions(txData);
        
        // Calculate total balance
        const balance = txData.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);
        setTotalBalance(balance);

        // Calculate this month's stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthTx = txData.filter(t => {
          const d = new Date(t.transaction_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        setMonthlyIncome(thisMonthTx.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0));
        setMonthlyExpense(thisMonthTx.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0));
      }

      // 2. Fetch Loans
      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'active');

      if (loanError) throw loanError;
      if (loanData) {
        setTotalOutstanding(loanData.reduce((acc, curr) => acc + Number(curr.principal_amount), 0));
      }
    } catch (error) {
      console.error("Error fetching vault data:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener("transaction-updated", handleUpdate);
    return () => window.removeEventListener("transaction-updated", handleUpdate);
  }, []);

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      {/* 2026 Aurora Ambient Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-fuchsia-500/20 dark:bg-fuchsia-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 dark:bg-emerald-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '4s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" /> Vault Overview
            </h2>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome, {myName}</h1>
          </div>
          <button 
            onClick={fetchData} 
            className="p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/40 dark:border-gray-700/50 rounded-2xl shadow-sm hover:scale-105 active:scale-95 transition-all text-indigo-600 dark:text-indigo-400"
          >
            <RefreshCcw size={20} className={isSyncing ? "animate-spin" : ""} />
          </button>
        </div>

        {/* The 2026 Bento Box Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Master Balance Card (Spans 2 cols) */}
          <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 rounded-[2rem] p-6 text-white dark:text-gray-900 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            {/* Glassmorphism inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <p className="text-gray-400 dark:text-gray-500 font-bold text-sm flex items-center gap-2 mb-2">
                <Wallet size={16} /> Total Balance
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                {totalBalance.toLocaleString()} <span className="text-xl md:text-2xl text-gray-500">Ks</span>
              </h2>
              
              <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/5 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold">
                <HandCoins size={14} className="text-rose-400" /> 
                <span className="text-gray-300 dark:text-gray-600">Active Debt: {totalOutstanding.toLocaleString()} Ks</span>
              </div>
            </div>
            
            {/* Decorative background icon */}
            <Wallet size={120} className="absolute -bottom-6 -right-6 text-white/5 dark:text-black/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700 ease-out" />
          </div>

          {/* Income Bento Card */}
          <div className="col-span-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-[2rem] p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
              <ArrowUpRight size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">In (This Month)</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">+{monthlyIncome.toLocaleString()}</p>
            </div>
          </div>

          {/* Expense Bento Card */}
          <div className="col-span-1 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 rounded-[2rem] p-5 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
              <ArrowDownRight size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Out (This Month)</p>
              <p className="text-xl font-extrabold text-gray-900 dark:text-white">-{monthlyExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <TrendingUp size={20} className="text-fuchsia-500" /> Recent Activity
            </h3>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">View All</button>
          </div>

          {transactions.length === 0 && !isSyncing ? (
            <div className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border border-dashed border-gray-300 dark:border-gray-700 rounded-[2rem] p-10 text-center">
              <p className="text-gray-500 font-medium">No activity found in the vault yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx, idx) => (
                <div 
                  key={tx.id} 
                  className="group bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 p-4 rounded-2xl flex items-center justify-between hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-300 hover:shadow-md cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${tx.type === 'income' ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100/80 dark:bg-rose-900/30 text-rose-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">{tx.category}</h4>
                      <p className="text-xs text-gray-500 font-medium">{tx.notes || tx.account} • {tx.spender}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                      {new Date(tx.transaction_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}