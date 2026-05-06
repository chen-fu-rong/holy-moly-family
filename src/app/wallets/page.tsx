"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Wallet, CreditCard, Landmark, Coins, Users } from "lucide-react";

export default function WalletsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [myName, setMyName] = useState("Me");
  
  const [myTotal, setMyTotal] = useState(0);
  const [partnerTotal, setPartnerTotal] = useState(0);
  
  const [myBalances, setMyBalances] = useState<any[]>([]);
  const [partnerBalances, setPartnerBalances] = useState<any[]>([]);
  
  const [showPartnerDetails, setShowPartnerDetails] = useState(false);

  const fetchWalletData = useCallback(async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");
    const storedName = localStorage.getItem("my_name") || "Me";
    setMyName(storedName);
    
    const savedAccs = localStorage.getItem("custom_accounts");
    const accountList: string[] = savedAccs ? JSON.parse(savedAccs) : ["Cash", "KBZPay", "WavePay", "Bank Transfer"];

    if (familyId) {
      const { data, error } = await supabase.from('transactions').select('amount, type, account, spender').eq('family_id', familyId);

      if (data && !error) {
        let mTotal = 0;
        let pTotal = 0;

        const mBals = accountList.map(acc => {
          const accTxs = data.filter(t => t.spender === storedName && (t.account === acc || (accountList.indexOf(acc) === 0 && !accountList.includes(t.account || ""))));
          const bal = accTxs.reduce((sum, tx) => tx.type === 'income' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0);
          mTotal += bal;
          return { name: acc, balance: bal };
        });

        const pBals = accountList.map(acc => {
          const accTxs = data.filter(t => t.spender !== storedName && (t.account === acc || (accountList.indexOf(acc) === 0 && !accountList.includes(t.account || ""))));
          const bal = accTxs.reduce((sum, tx) => tx.type === 'income' ? sum + Number(tx.amount) : sum - Number(tx.amount), 0);
          pTotal += bal;
          return { name: acc, balance: bal };
        });

        setMyTotal(mTotal);
        setPartnerTotal(pTotal);
        setMyBalances(mBals);
        setPartnerBalances(pBals);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchWalletData();
    window.addEventListener("transaction-updated", fetchWalletData);
    window.addEventListener("settings-updated", fetchWalletData);
    return () => {
      window.removeEventListener("transaction-updated", fetchWalletData);
      window.removeEventListener("settings-updated", fetchWalletData);
    };
  }, [fetchWalletData]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const activeBalances = showPartnerDetails ? partnerBalances : myBalances;

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu">
        <div className="absolute top-[10%] -left-[20%] w-[70%] h-[60%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-4xl mx-auto pt-4 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Assets</h1>
        </div>

        {/* Side-by-Side Comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => setShowPartnerDetails(false)}
            className={`rounded-[2rem] p-5 relative overflow-hidden transition-all duration-300 transform-gpu active:scale-95 cursor-pointer ${!showPartnerDetails ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-lg' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-400'}`}
          >
            <p className={`font-bold text-[11px] mb-1 uppercase tracking-wider ${!showPartnerDetails ? 'text-indigo-200' : 'text-gray-400'}`}>My Assets</p>
            <h2 className={`text-2xl md:text-3xl font-black ${!showPartnerDetails ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {myTotal.toLocaleString()} <span className="text-sm">Ks</span>
            </h2>
          </div>

          <div 
            onClick={() => setShowPartnerDetails(true)}
            className={`rounded-[2rem] p-5 relative overflow-hidden transition-all duration-300 transform-gpu active:scale-95 cursor-pointer ${showPartnerDetails ? 'bg-gradient-to-br from-fuchsia-600 to-rose-600 text-white shadow-lg' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-400'}`}
          >
            <p className={`font-bold text-[11px] mb-1 uppercase tracking-wider flex items-center gap-1 ${showPartnerDetails ? 'text-fuchsia-200' : 'text-gray-400'}`}><Users size={12}/> Partner</p>
            <h2 className={`text-2xl md:text-3xl font-black ${showPartnerDetails ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
              {partnerTotal.toLocaleString()} <span className="text-sm">Ks</span>
            </h2>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <CreditCard size={20} className={showPartnerDetails ? "text-fuchsia-500" : "text-blue-500"}/> 
            {showPartnerDetails ? "Partner's Breakdown" : "My Breakdown"}
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeBalances.map((wallet, idx) => (
              <div key={idx} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-100 dark:border-gray-800 p-5 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                    {wallet.name.toLowerCase().includes('cash') ? <Coins size={20} /> : <CreditCard size={20} />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{wallet.name}</p>
                  <p className={`text-xl font-black ${wallet.balance < 0 ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                    {wallet.balance.toLocaleString()} <span className="text-xs text-gray-400">Ks</span>
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