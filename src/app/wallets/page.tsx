"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Wallet, CreditCard, Landmark, Coins, Sparkles } from "lucide-react";

export default function WalletsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [walletBalances, setWalletBalances] = useState<{name: string, balance: number}[]>([]);

  useEffect(() => {
    fetchWalletData();

    // Listen for new transactions AND settings changes
    const handleSync = () => fetchWalletData();
    
    window.addEventListener("transaction-updated", handleSync);
    window.addEventListener("settings-updated", handleSync);

    // Cleanup the listeners when the page unmounts
    return () => {
      window.removeEventListener("transaction-updated", handleSync);
      window.removeEventListener("settings-updated", handleSync);
    };
  }, []);;

  const fetchWalletData = async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");
    
    // Get custom wallets from settings, or use defaults
    const savedAccs = localStorage.getItem("custom_accounts");
    const accountList: string[] = savedAccs ? JSON.parse(savedAccs) : ["💵 Cash", "🔵 KBZPay", "🌊 WavePay", "🏦 Bank Transfer"];

    if (familyId) {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type, account')
        .eq('family_id', familyId);

      if (data && !error) {
        let masterTotal = 0;
        const balances = accountList.map(acc => {
          const accTxs = data.filter(t => t.account === acc);
          const accBalance = accTxs.reduce((sum, tx) => {
            return tx.type === 'income' ? sum + Number(tx.amount) : sum - Number(tx.amount);
          }, 0);
          
          masterTotal += accBalance;
          return { name: acc, balance: accBalance };
        });

        setTotalBalance(masterTotal);
        setWalletBalances(balances);
      }
    }
    setIsLoading(false);
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
      {/* 2026 Aurora Ambient Background (Matching Dashboard) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none">
        <div className="absolute top-[10%] -left-[20%] w-[70%] h-[60%] rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[20%] -right-[10%] w-[60%] h-[50%] rounded-full bg-indigo-500/20 dark:bg-fuchsia-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '14s', animationDelay: '2s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Sparkles size={14} className="text-blue-500" /> Account Hub
            </h2>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">My Wallets</h1>
          </div>
        </div>

        {/* Master Balance Bento Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] relative overflow-hidden group">
           {/* Glassmorphism inner glare */}
           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
           
          <div className="relative z-10">
            <p className="text-indigo-200 font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
               <Landmark size={16} /> Total Liquid Assets
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
              {totalBalance.toLocaleString()} <span className="text-xl md:text-2xl text-indigo-300">Ks</span>
            </h2>
          </div>
          <Wallet size={160} className="absolute -bottom-10 -right-10 text-white/10 group-hover:-rotate-12 transition-transform duration-700 ease-out" />
        </div>

        {/* Individual Wallets Glass Grid */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <CreditCard size={20} className="text-indigo-500"/> Distribution
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {walletBalances.map((wallet, idx) => (
              <div 
                key={idx} 
                className="group bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/40 dark:border-gray-700/50 p-6 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-full bg-gray-100/80 dark:bg-gray-800/80 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/50 dark:group-hover:text-blue-400 transition-colors duration-300 shadow-sm">
                    {wallet.name.toLowerCase().includes('cash') ? <Coins size={24} /> : <CreditCard size={24} />}
                  </div>
                  {/* Subtle indicator if balance is negative */}
                  {wallet.balance < 0 && (
                     <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                       Overdrawn
                     </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">{wallet.name}</p>
                  <p className={`text-2xl font-black ${wallet.balance < 0 ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                    {wallet.balance.toLocaleString()} <span className="text-sm text-gray-400 font-bold">Ks</span>
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