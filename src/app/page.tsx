"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowUpRight, ArrowDownRight, Settings, Sparkles, TrendingUp, Wallet, HandCoins, Loader2 } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Array<{id: string; amount: number; type: string; category: string; account: string; spender: string; notes: string; date: string}>>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [myName, setMyName] = useState("Me");
  
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [dailyIncome, setDailyIncome] = useState<number>(0);
  const [dailyExpense, setDailyExpense] = useState<number>(0);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);

  // Pull to refresh states
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const fetchData = useCallback(async () => {
    setIsSyncing(true);
    const familyId = localStorage.getItem("family_id");
    const name = localStorage.getItem("my_name") || "Me";
    setMyName(name);

    if (!familyId) return;

    try {
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('family_id', familyId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (txError) throw txError;
      if (txData) {
        setTransactions(txData);
        
        const balance = txData.reduce((acc, curr) => curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount), 0);
        setTotalBalance(balance);

        // Daily calculations
        const todayStr = new Date().toLocaleDateString();
        const todayTx = txData.filter(t => new Date(t.transaction_date).toLocaleDateString() === todayStr);

        setDailyIncome(todayTx.filter(t => t.type === 'income').reduce((acc, curr) => acc + Number(curr.amount), 0));
        setDailyExpense(todayTx.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Number(curr.amount), 0));
      }

      const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('family_id', familyId)
        .eq('status', 'active');

      if (loanError) throw loanError;
      if (loanData) {
        const totalBorrowed = loanData.filter(l => l.type === 'borrowed').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);
        setTotalOutstanding(totalBorrowed);
      }
    } catch (error) {
      console.error("Error fetching vault data:", error);
    } finally {
      setIsSyncing(false);
      setIsPulling(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener("transaction-updated", fetchData);
    return () => window.removeEventListener("transaction-updated", fetchData);
  }, [fetchData]);

  // Touch handlers for Pull-to-Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) setStartY(e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0 && e.touches[0].clientY - startY > 70) setIsPulling(true);
  };
  const handleTouchEnd = () => {
    if (isPulling) { fetchData(); setStartY(0); }
  };

  return (
    <div 
      className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Optimized Background (No mix-blend-mode, uses GPU transform) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-fuchsia-400/10 dark:bg-fuchsia-500/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {/* Pull to Refresh Indicator */}
      <div className={`flex justify-center transition-all duration-300 ${isPulling || isSyncing ? 'h-10 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>

      <div className="px-4 md:px-8 max-w-4xl mx-auto pt-2 space-y-6">
        
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" /> Dashboard
            </h2>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Hi, {myName}</h1>
          </div>
          <Link href="/settings" className="p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/40 dark:border-gray-700/50 rounded-2xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300">
            <Settings size={22} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-2 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 rounded-[2rem] p-6 text-white dark:text-gray-900 shadow-xl relative overflow-hidden transform-gpu">
            <div className="relative z-10">
              <p className="text-gray-400 dark:text-gray-500 font-bold text-sm flex items-center gap-2 mb-1">
                <Wallet size={16} /> Total Balance
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                {totalBalance.toLocaleString()} <span className="text-xl text-gray-500">Ks</span>
              </h2>
              <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-black/5 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold">
                <HandCoins size={14} className="text-rose-400" /> 
                <span className="text-gray-300 dark:text-gray-600">We Owe: {totalOutstanding.toLocaleString()} Ks</span>
              </div>
            </div>
            <Wallet size={120} className="absolute -bottom-6 -right-6 text-white/5 dark:text-black/5 -rotate-12" />
          </div>

          <div className="col-span-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
              <ArrowUpRight size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">In (Today)</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">+{dailyIncome.toLocaleString()}</p>
            </div>
          </div>

          <div className="col-span-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2">
              <ArrowDownRight size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Out (Today)</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">-{dailyExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <TrendingUp size={20} className="text-fuchsia-500" /> Recent Activity
          </h3>

          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm transform-gpu transition-transform active:scale-95">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100/80 dark:bg-rose-900/30 text-rose-600'}`}>
                    {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm">{tx.category}</h4>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {tx.account || 'Cash'} • {tx.spender}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                    {new Date(tx.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}