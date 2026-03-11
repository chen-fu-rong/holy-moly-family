"use client";

import { CreditCard, Landmark, Loader2, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const DEFAULT_ACCOUNTS = ["💵 Cash", "💳 KBZPay", "🌊 WavePay", "📱 KPay", "🏦 AYA Pay", "💸 Bank Transfer"];

export default function WalletsPage() {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<string[]>([]);

  // 🟢 Data ဆွဲယူမည့် Function ကို သီးသန့်ထုတ်ရေးထားသည် (Refresh လုပ်ရလွယ်အောင်)
  const loadWalletData = async () => {
    setLoading(true);
    
    // 1. Settings က ထည့်ထားတဲ့ ကတ်အသစ်များကို Local Storage မှ ယူမည်
    const savedAccs = localStorage.getItem("custom_accounts");
    const activeAccounts = savedAccs ? JSON.parse(savedAccs) : DEFAULT_ACCOUNTS;
    setAccounts(activeAccounts);

    // 2. Database မှ Transaction အားလုံးကိုဆွဲယူပြီး Balance တွက်မည်
    const { data, error } = await supabase.from("transactions").select("amount, account");
    if (!error && data) {
      const calc: Record<string, number> = {};
      data.forEach(tx => {
        // ထွက်ငွေဆိုရင် အနှုတ်ပြထားပြီးသားမို့ တိုက်ရိုက်ပေါင်းထည့်ရုံသာ
        calc[tx.account] = (calc[tx.account] || 0) + tx.amount;
      });
      setBalances(calc);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWalletData();
    
    // 🟢 Form ကနေ ငွေသွင်းလိုက်တိုင်း Wallets တွေကို Auto Refresh လုပ်ပေးမည်
    window.addEventListener("transaction-updated", loadWalletData);
    return () => window.removeEventListener("transaction-updated", loadWalletData);
  }, []);

  // ကတ်အသစ်တွေပါ အရောင်လှလှလေးတွေ ကျပန်းပေါ်အောင် ပြင်ထားသည်
  const getWalletStyle = (accountName: string) => {
    const name = accountName.toLowerCase();
    if (name.includes("kbz")) return "from-blue-600 to-blue-800 text-white";
    if (name.includes("wave")) return "from-yellow-400 to-yellow-500 text-gray-900";
    if (name.includes("kpay")) return "from-rose-600 to-rose-800 text-white";
    if (name.includes("aya")) return "from-red-600 to-red-900 text-white";
    if (name.includes("cash")) return "from-emerald-500 to-emerald-700 text-white";
    
    // Custom ကတ်များအတွက် အရောင်များ (စာလုံးအရေအတွက်ပေါ် မူတည်ပြီး အရောင်ပြောင်းမည်)
    const colors = ["from-purple-500 to-purple-700", "from-cyan-500 to-cyan-700", "from-orange-500 to-orange-700", "from-indigo-500 to-indigo-700"];
    const idx = accountName.length % colors.length;
    return `${colors[idx]} text-white`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 w-full max-w-7xl mx-auto pb-24">
      <div>
        <p className="text-gray-500 font-medium">My Accounts</p>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Wallets Balance</h2>
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc, index) => {
            const amount = balances[acc] || 0; // Data မရှိရင် 0 လို့ပြမည်
            return (
              <div key={index} className={`bg-gradient-to-br ${getWalletStyle(acc)} rounded-3xl p-6 shadow-lg relative overflow-hidden transition-transform hover:scale-[1.02]`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl -mr-6 -mt-6"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      {acc.includes("Bank") || acc.includes("🏦") ? <Landmark size={24} /> : <Wallet size={24} />}
                    </div>
                  </div>
                  <p className="opacity-80 text-sm font-medium mb-1">{acc}</p>
                  <h3 className="text-3xl font-extrabold tracking-tight">
                    {amount.toLocaleString()} <span className="text-lg font-normal opacity-80">Ks</span>
                  </h3>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}