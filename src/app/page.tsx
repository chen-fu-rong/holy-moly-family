"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowUpRight, ArrowDownRight, Settings, Sparkles, TrendingUp, Wallet, HandCoins, Loader2, Briefcase, Home } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [myName, setMyName] = useState("Me");
  
  // Workspace State
  const [workspace, setWorkspace] = useState<"personal" | "business">("personal");

  // Global Math
  const [personalBalance, setPersonalBalance] = useState<number>(0);
  const [businessProfit, setBusinessProfit] = useState<number>(0);
  
  // Daily Math
  const [dailyPersonalIncome, setDailyPersonalIncome] = useState<number>(0);
  const [dailyPersonalExpense, setDailyPersonalExpense] = useState<number>(0);
  const [dailyBusinessIncome, setDailyBusinessIncome] = useState<number>(0);
  const [dailyBusinessExpense, setDailyBusinessExpense] = useState<number>(0);

  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
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
        .limit(200); // Fetch a bit more to ensure we have enough to split

      if (txError) throw txError;
      if (txData) {
        setTransactions(txData);
        
        let pIncome = 0, pExpense = 0, bIncome = 0, bExpense = 0;
        let todayPIncome = 0, todayPExpense = 0, todayBIncome = 0, todayBExpense = 0;
        
        const todayStr = new Date().toLocaleDateString();

        txData.forEach(tx => {
          const amt = Number(tx.amount);
          const isToday = new Date(tx.transaction_date || tx.date || tx.created_at).toLocaleDateString() === todayStr;

          if (tx.is_business_overhead) {
            if (tx.type === 'income') { bIncome += amt; if (isToday) todayBIncome += amt; }
            else { bExpense += amt; if (isToday) todayBExpense += amt; }
          } else {
            if (tx.type === 'income') { pIncome += amt; if (isToday) todayPIncome += amt; }
            else { pExpense += amt; if (isToday) todayPExpense += amt; }
          }
        });

        // The Virtual Split!
        setPersonalBalance(pIncome - pExpense);
        setBusinessProfit(bIncome - bExpense);

        setDailyPersonalIncome(todayPIncome);
        setDailyPersonalExpense(todayPExpense);
        setDailyBusinessIncome(todayBIncome);
        setDailyBusinessExpense(todayBExpense);
      }

      // Debt Fetching (We owe)
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
  const handleTouchStart = (e: React.TouchEvent) => { if (window.scrollY === 0) setStartY(e.touches[0].clientY); };
  const handleTouchMove = (e: React.TouchEvent) => { if (startY > 0 && e.touches[0].clientY - startY > 70) setIsPulling(true); };
  const handleTouchEnd = () => { if (isPulling) { fetchData(); setStartY(0); } };

  // Determine Active Workspace Variables
  const isBusiness = workspace === "business";
  const activeBalance = isBusiness ? businessProfit : personalBalance;
  const activeIncome = isBusiness ? dailyBusinessIncome : dailyPersonalIncome;
  const activeExpense = isBusiness ? dailyBusinessExpense : dailyPersonalExpense;
  const activeTransactions = transactions.filter(tx => tx.is_business_overhead === isBusiness);

  return (
    <div 
      className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent] transition-colors duration-500"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
    >
      {/* Dynamic Workspace Background */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu transition-colors duration-700">
        <div className={`absolute -top-[10%] -left-[10%] w-[60%] h-[50%] rounded-full blur-3xl animate-pulse transition-colors duration-700 ${isBusiness ? 'bg-emerald-400/10 dark:bg-emerald-500/10' : 'bg-indigo-400/10 dark:bg-indigo-500/10'}`} style={{ animationDuration: '6s' }} />
        <div className={`absolute top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full blur-3xl animate-pulse transition-colors duration-700 ${isBusiness ? 'bg-cyan-400/10 dark:bg-cyan-500/10' : 'bg-fuchsia-400/10 dark:bg-fuchsia-500/10'}`} style={{ animationDuration: '8s' }} />
      </div>

      {/* Pull to Refresh Indicator */}
      <div className={`flex justify-center transition-all duration-300 ${isPulling || isSyncing ? 'h-10 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
        <Loader2 className="animate-spin text-indigo-500" size={24} />
      </div>

      <div className="px-4 md:px-8 max-w-4xl mx-auto pt-2 space-y-6">
        
        {/* Header & Workspace Toggle */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-2xl w-48 shadow-inner">
            <button 
              onClick={() => setWorkspace("personal")} 
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${!isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Home size={14} /> Family
            </button>
            <button 
              onClick={() => setWorkspace("business")} 
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Briefcase size={14} /> Business
            </button>
          </div>
          
          <Link href="/settings" className="p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-white/40 dark:border-gray-700/50 rounded-2xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 active:scale-95">
            <Settings size={22} />
          </Link>
        </div>

        {/* Dynamic Balance Card */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`col-span-2 md:col-span-2 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden transform-gpu transition-colors duration-700 ${isBusiness ? 'bg-gradient-to-br from-emerald-600 to-cyan-700' : 'bg-gradient-to-br from-indigo-600 to-fuchsia-700'}`}>
            <div className="relative z-10">
              <p className="text-white/80 font-bold text-sm flex items-center gap-2 mb-1 uppercase tracking-wider">
                {isBusiness ? <Briefcase size={16} /> : <Wallet size={16} />} 
                {isBusiness ? 'Business Net Profit' : 'Personal Liquidity'}
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-sm">
                {activeBalance.toLocaleString()} <span className="text-xl text-white/60">Ks</span>
              </h2>
              
              {!isBusiness && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  <HandCoins size={14} className="text-rose-200" /> 
                  <span>We Owe: {totalOutstanding.toLocaleString()} Ks</span>
                </div>
              )}
            </div>
            {isBusiness ? (
              <Briefcase size={120} className="absolute -bottom-6 -right-6 text-white/10 -rotate-12" />
            ) : (
              <Wallet size={120} className="absolute -bottom-6 -right-6 text-white/10 -rotate-12" />
            )}
          </div>

          {/* Today's In/Out */}
          <div className="col-span-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm flex flex-col justify-between">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isBusiness ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
              <ArrowUpRight size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">In (Today)</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">+{activeIncome.toLocaleString()}</p>
            </div>
          </div>

          <div className="col-span-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-2">
              <ArrowDownRight size={20} strokeWidth={3} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Out (Today)</p>
              <p className="text-lg font-extrabold text-gray-900 dark:text-white">-{activeExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filtered Activity List */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <TrendingUp size={20} className={isBusiness ? "text-emerald-500" : "text-fuchsia-500"} /> 
            {isBusiness ? "Business Ledger" : "Family Activity"}
          </h3>

          <div className="space-y-3">
            {activeTransactions.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4 font-medium">No activity in this workspace yet.</p>
            ) : (
              activeTransactions.map((tx: any) => (
                <div key={tx.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm transform-gpu transition-transform active:scale-95 animate-in fade-in zoom-in-95 duration-200">
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
                      {new Date(tx.transaction_date || tx.date || tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}