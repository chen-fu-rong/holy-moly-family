"use client";

import { ArrowDownRight, ArrowUpRight, Wallet, Coffee, ShoppingCart, TrendingUp, Bus, Zap, Briefcase, Receipt, Edit2, RefreshCcw, HomeIcon, Activity, HeartPulse, Scale, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; 
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  
  // Balances
  const [cashBalance, setCashBalance] = useState(0); 
  const [netWorth, setNetWorth] = useState(0); 
  const [myBalance, setMyBalance] = useState(0);
  const [partnerBalance, setPartnerBalance] = useState(0);
  
  // Person Data
  const [myName, setMyName] = useState("");
  const [partnerName, setPartnerName] = useState("Partner");
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Chart Data & Toggle
  const [chartData, setChartData] = useState<any[]>([]);
  const [isCompareOverview, setIsCompareOverview] = useState(false); // 🟢 Overview Card အတွက် Compare Toggle

  useEffect(() => {
    const name = localStorage.getItem("my_name") || "Me";
    setMyName(name);

    const cachedData = localStorage.getItem("cached_transactions");
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      setTransactions(parsedData);
      // Loans data is not cached in this example for simplicity, so we will fetch
    } else {
      setIsSyncing(true);
    }

    fetchData(name);
    
    const handleUpdate = () => fetchData(name);
    window.addEventListener("transaction-updated", handleUpdate);
    return () => window.removeEventListener("transaction-updated", handleUpdate);
  }, []);

  const fetchData = async (currentName: string) => {
    setIsSyncing(true);
    const [txRes, loanRes] = await Promise.all([
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("loans").select("*")
    ]);

    if (!txRes.error && txRes.data) {
      setTransactions(txRes.data);
      localStorage.setItem("cached_transactions", JSON.stringify(txRes.data));
    }
    if (!loanRes.error && loanRes.data) setLoans(loanRes.data);

    calculateEverything(txRes.data || [], loanRes.data || [], currentName);
    processChartData(txRes.data || [], currentName);
    setIsSyncing(false);
  };

  const calculateEverything = (txData: any[], loanData: any[], currentName: string) => {
    let cash = 0, mine = 0, partner = 0, pName = "Partner";

    txData.forEach(tx => {
      cash += tx.amount;
      if (tx.spender === currentName) {
        mine += tx.amount;
      } else {
        if (tx.spender && tx.spender !== "Unknown" && tx.spender !== "Shared") pName = tx.spender;
        partner += tx.amount;
      }
    });

    let netReceivable = 0; 
    let netPayable = 0; 

    loanData.forEach(loan => {
      const start = new Date(loan.start_date);
      const now = new Date();
      let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      if (now.getDate() < start.getDate()) monthsPassed -= 1;
      if (monthsPassed < 0) monthsPassed = 0;

      const totalValue = loan.principal_amount + (loan.principal_amount * (loan.interest_rate / 100) * monthsPassed);
      
      if (loan.type === "lent") netReceivable += totalValue;
      else netPayable += totalValue;
    });

    setCashBalance(cash);
    // Net Worth = Cash Balance + ရစရာ(အတိုးပါပြီး) - ပေးစရာ(အတိုးပါပြီး)
    setNetWorth(cash + netReceivable - netPayable); 
    setMyBalance(mine);
    setPartnerBalance(partner);
    setPartnerName(pName);
  };

  // 🟢 Overview ဇယားအတွက် လအလိုက် Data တွက်ချက်ခြင်း
  const processChartData = (data: any[], currentName: string) => {
    const result: Record<string, any> = {};
    
    // ပြီးခဲ့သော ၆ လစာ Array ကြိုဆောက်ထားမည်
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      result[monthName] = { 
        month: monthName, 
        myIncome: 0, 
        myExpense: 0, 
        partnerIncome: 0, 
        partnerExpense: 0 
      };
    }
    
    data.forEach(tx => {
      const d = new Date(tx.created_at);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      
      if (result[monthName]) {
        const isMine = tx.spender === currentName;
        if (tx.type === 'income') {
          if (isMine) result[monthName].myIncome += tx.amount;
          else result[monthName].partnerIncome += tx.amount;
        } else {
          if (isMine) result[monthName].myExpense += Math.abs(tx.amount);
          else result[monthName].partnerExpense += Math.abs(tx.amount);
        }
      }
    });
    
    setChartData(Object.values(result));
  };

  const handleEditClick = (tx: any) => window.dispatchEvent(new CustomEvent("open-edit-modal", { detail: tx }));

  const getIcon = (category: string) => {
    if (category.includes("Food")) return Coffee;
    if (category.includes("Transport")) return Bus;
    if (category.includes("Shopping")) return ShoppingCart;
    if (category.includes("Bills")) return Zap;
    if (category.includes("Rent")) return HomeIcon;
    if (category.includes("Health")) return HeartPulse;
    if (category.includes("Entertainment")) return Activity;
    if (category.includes("Salary") || category.includes("Business")) return Wallet;
    return Receipt;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 w-full max-w-7xl mx-auto pb-24">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm font-medium">Welcome back,</p>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{myName}'s Dashboard</h2>
        </div>
        <div onClick={() => fetchData(myName)} className={`w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold cursor-pointer shadow-sm ${isSyncing ? "animate-pulse" : ""}`}>
          {isSyncing ? <RefreshCcw size={20} className="animate-spin" /> : myName.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* 🟢 Main Balance Card (Original Clean View) */}
        <div className="xl:col-span-1 w-full flex flex-col gap-4">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="relative z-10">
              <p className="text-indigo-100 text-sm font-medium mb-1 opacity-90">Total Family Net Worth</p>
              <h3 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                {netWorth.toLocaleString()} <span className="text-xl font-normal opacity-80">Ks</span>
              </h3>
              
              <div className="flex bg-black/20 rounded-2xl p-4 gap-4 backdrop-blur-sm border border-white/10">
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-indigo-100 font-medium mb-1 truncate">{myName === "Me" ? "My" : `${myName}'s`} Balance</p>
                  <p className="font-bold text-lg truncate">{myBalance.toLocaleString()} <span className="text-xs font-normal">Ks</span></p>
                </div>
                <div className="w-px bg-white/20"></div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs text-indigo-100 font-medium mb-1 truncate">{partnerName === "Partner" ? "Partner's" : `${partnerName}'s`} Balance</p>
                  <p className="font-bold text-lg truncate">{partnerBalance.toLocaleString()} <span className="text-xs font-normal">Ks</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 Monthly Overview Card (ဖုန်းမှာပါ ပေါ်အောင် ပြင်ထားပြီး Compare ခလုတ်ပါသည်) */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-900/40 rounded-3xl p-5 md:p-6 border border-gray-100 dark:border-gray-800 shadow-sm w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg md:text-xl font-bold">Monthly Overview</h3>
            
            <button 
              onClick={() => setIsCompareOverview(!isCompareOverview)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${isCompareOverview ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-indigo-600'}`}
            >
              {isCompareOverview ? <User size={14} /> : <Scale size={14} />} 
              {isCompareOverview ? "My Overview" : "Compare"}
            </button>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                
                {/* Toggle on/off graphs based on mode */}
                {!isCompareOverview ? (
                  <>
                    <Bar dataKey="myIncome" name={`${myName}'s Income`} fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="myExpense" name={`${myName}'s Expense`} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="myExpense" name={`${myName}'s Spend`} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="partnerExpense" name={`${partnerName}'s Spend`} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="xl:col-span-3 bg-white dark:bg-gray-900/40 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Recent Transactions</h3>
            <p className="text-sm font-bold text-gray-500">Cash Flow: <span className="text-gray-900 dark:text-white">{cashBalance.toLocaleString()} Ks</span></p>
          </div>
          
          <div className="space-y-3 overflow-y-auto pr-2 max-h-[400px]">
            {transactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No transactions yet. Click +</div>
            ) : (
              transactions.map((tx) => {
                const Icon = getIcon(tx.category);
                const isMine = tx.spender === myName;
                return (
                  <div key={tx.id} onClick={() => handleEditClick(tx)} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer relative overflow-hidden group transition-colors">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isMine ? 'bg-indigo-500' : 'bg-fuchsia-400'}`}></div>
                    <div className="flex items-center gap-3 pl-2">
                      <div className={`p-2 rounded-xl ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        <Icon size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tx.category}</p>
                        <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                          {tx.account} • {formatDate(tx.created_at)} • 
                          <span className={`${isMine ? 'text-indigo-600' : 'text-fuchsia-600'} font-semibold`}>{tx.spender}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'income' ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}