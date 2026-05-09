"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowUpRight, ArrowDownRight, Settings, Sparkles, TrendingUp, Wallet, HandCoins, Loader2, Briefcase, Home, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useVaultStore } from "@/lib/store";
import { triggerHaptic } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const isOwner = useVaultStore(state => state.isOwner);
  const transactions = useVaultStore(state => state.transactions);
  const deleteTransaction = useVaultStore(state => state.deleteTransaction);
  const loans = useVaultStore(state => state.loans);
  const currency = useVaultStore(state => state.currency);
  const isSyncing = useVaultStore(state => state.isLoading);
  const [myName, setMyName] = useState("Me");
  
  // Workspace State
  const [workspace, setWorkspace] = useState<"personal" | "business">("personal");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setMyName(localStorage.getItem("my_name") || "Me");
  }, []);

  // Use Memo for heavy math to avoid recalculating on every render
  const stats = useMemo(() => {
    let pIncome = 0, pExpense = 0, bIncome = 0, bExpense = 0;
    let todayPIncome = 0, todayPExpense = 0, todayBIncome = 0, todayBExpense = 0;
    const todayStr = new Date().toLocaleDateString();

    transactions.forEach(tx => {
      const amt = Number(tx.amount);
      const isToday = new Date(tx.transaction_date).toLocaleDateString() === todayStr;

      if (tx.is_business_overhead) {
        if (tx.type === 'income') { bIncome += amt; if (isToday) todayBIncome += amt; }
        else { bExpense += amt; if (isToday) todayBExpense += amt; }
      } else {
        if (tx.type === 'income') { pIncome += amt; if (isToday) todayPIncome += amt; }
        else { pExpense += amt; if (isToday) todayPExpense += amt; }
      }
    });

    const totalBorrowed = loans.filter(l => l.status === 'active' && l.type === 'borrowed').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);

    return {
      personalBalance: pIncome - pExpense,
      businessProfit: bIncome - bExpense,
      dailyPersonalIncome: todayPIncome,
      dailyPersonalExpense: todayPExpense,
      dailyBusinessIncome: todayBIncome,
      dailyBusinessExpense: todayBExpense,
      totalOutstanding: totalBorrowed
    };
  }, [transactions, loans]);

  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const fetchData = useCallback(async () => {
    const familyId = localStorage.getItem("family_id");
    if (familyId) await useVaultStore.getState().fetchVaultData(familyId);
    setIsPulling(false);
  }, []);

  // Touch handlers for Pull-to-Refresh
  const handleTouchStart = (e: React.TouchEvent) => { if (window.scrollY === 0) setStartY(e.touches[0].clientY); };
  const handleTouchMove = (e: React.TouchEvent) => { 
    if (startY > 0 && e.touches[0].clientY - startY > 70 && !isPulling) {
      setIsPulling(true);
      triggerHaptic('light');
    } 
  };
  const handleTouchEnd = () => { 
    if (isPulling) { 
      triggerHaptic('medium');
      fetchData(); 
      setStartY(0); 
    } 
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    setConfirmDelete(null);
  };

  // Determine Active Workspace Variables
  const isBusiness = workspace === "business";
  const activeBalance = isBusiness ? stats.businessProfit : stats.personalBalance;
  const activeIncome = isBusiness ? stats.dailyBusinessIncome : stats.dailyPersonalIncome;
  const activeExpense = isBusiness ? stats.dailyBusinessExpense : stats.dailyPersonalExpense;
  const activeTransactions = transactions.filter(tx => tx.is_business_overhead === isBusiness);

  if (isSyncing && transactions.length === 0) {
    return (
      <div className="px-4 md:px-8 max-w-4xl mx-auto pt-24 space-y-6">
        <div className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[2rem]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[2rem]" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-[2rem]" />
        </div>
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent] transition-colors duration-500"
      onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
    >
      {/* 2026 Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Delete Transaction?</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">This action cannot be undone. Are you sure?</p>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => {
                  setConfirmDelete(null);
                  triggerHaptic('light');
                }} 
                className="flex-1 py-3 font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDelete(confirmDelete!);
                  triggerHaptic('heavy');
                }} 
                className="flex-1 py-3 font-bold rounded-xl bg-rose-600 text-white active:scale-95 transition-transform"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
              onClick={() => {
                setWorkspace("personal");
                triggerHaptic('light');
              }} 
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${!isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Home size={14} /> Family
            </button>
            <button 
              onClick={() => {
                setWorkspace("business");
                triggerHaptic('light');
              }} 
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <Briefcase size={14} /> Business
            </button>
          </div>
          
          <div className="flex gap-2">
            {/* The New Savings Goal Button */}
            <Link 
              href="/savings" 
              onClick={() => triggerHaptic('light')}
              className="p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-amber-200 dark:border-amber-900/30 rounded-2xl shadow-sm hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-amber-600 dark:text-amber-500 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.5-1 2-2h2v-4h-2.13c.09-.32.13-.65.13-1 0-2.8-2.2-5-5-5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>
            </Link>

            {/* Owner-Only Settings Button */}
            {isOwner && (
              <Link href="/settings" className="p-3 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300 active:scale-95">
                <Settings size={22} />
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Balance Card - Swipeable */}
        <motion.div 
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = offset.x;
            if (swipe < -50) {
              setWorkspace("business");
              triggerHaptic('medium');
            } else if (swipe > 50) {
              setWorkspace("personal");
              triggerHaptic('medium');
            }
          }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className={`col-span-2 md:col-span-2 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden transform-gpu transition-colors duration-700 ${isBusiness ? 'bg-gradient-to-br from-emerald-600 to-cyan-700' : 'bg-gradient-to-br from-indigo-600 to-fuchsia-700'}`}>
            <div className="relative z-10">
              <p className="text-white/80 font-bold text-sm flex items-center gap-2 mb-1 uppercase tracking-wider">
                {isBusiness ? <Briefcase size={16} /> : <Wallet size={16} />} 
                {isBusiness ? 'Business Net Profit' : 'Personal Liquidity'}
              </p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-sm">
                {activeBalance.toLocaleString()} <span className="text-xl text-white/60">{currency}</span>
              </h2>
              
              {!isBusiness && (
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                  <HandCoins size={14} className="text-rose-200" /> 
                  <span>We Owe: {stats.totalOutstanding.toLocaleString()} {currency}</span>
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
        </motion.div>

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
                <div key={tx.id} className="relative rounded-2xl overflow-hidden group shadow-sm">
                  {/* Background Action: Delete */}
                  {isOwner && (
                    <div className="absolute inset-y-0 right-0 w-24 bg-rose-500 flex items-center justify-end pr-5">
                      <Trash2 className="text-white" size={20} />
                    </div>
                  )}

                  {/* Swipeable Foreground Card */}
                  <motion.div
                    drag={isOwner ? "x" : false}
                    dragConstraints={{ left: -80, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(e, { offset }) => {
                      if (offset.x < -50 && isOwner) {
                        triggerHaptic('medium');
                        setConfirmDelete(tx.id);
                      }
                    }}
                    className="relative z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between transform-gpu active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100/80 dark:bg-rose-900/30 text-rose-600'}`}>
                        {tx.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{tx.category}</h4>
                        <p className="text-[11px] text-gray-500 font-medium">
                          {tx.account || 'Cash'} • {tx.spender}
                        </p>
                        {tx.notes && (
                          <p className="text-[10px] text-gray-400 italic mt-0.5 line-clamp-1 max-w-[150px]">
                            {tx.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`font-black ${tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                          {tx.type === 'income' ? '+' : '-'}{Number(tx.amount).toLocaleString()} {currency}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                          {new Date(tx.transaction_date || tx.date || tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}