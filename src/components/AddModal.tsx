"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, HomeIcon, ArrowUpCircle, ArrowDownCircle, Loader2, CalendarClock, AlignLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DEFAULT_ACCOUNTS = ["💵 Cash", "🔵 KBZPay", "🌊 WavePay", "🔴 KPay", "🛑 AYA Pay", "🏦 Bank Transfer"];

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddModal({ isOpen, onClose }: AddModalProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [isBusiness, setIsBusiness] = useState(false);
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");
  
  // Date state initialized to current local time
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16); // Formats to YYYY-MM-DDTHH:mm for the input
  });

  // Dynamic Vault Data
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [myName, setMyName] = useState("Me");

  useEffect(() => {
    setMyName(localStorage.getItem("my_name") || "Me");
  }, []);

  // Fetch Vault settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setNotes("");
      setIsBusiness(false);
      setType("expense");
      
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDate(now.toISOString().slice(0, 16));

      const savedAccs = localStorage.getItem("custom_accounts");
      const parsedAccs = savedAccs ? JSON.parse(savedAccs) : DEFAULT_ACCOUNTS;
      setAvailableAccounts(parsedAccs);
      if (parsedAccs.length > 0) setAccount(parsedAccs[0]);

      // Fetch dynamic categories from Supabase Vault
      const fetchCategories = async () => {
        const familyId = localStorage.getItem("family_id");
        if (!familyId) return;
        const { data } = await supabase.from('families').select('expense_categories, income_categories').eq('id', familyId).single();
        if (data) {
          setExpenseCats(data.expense_categories || []);
          setIncomeCats(data.income_categories || []);
          setCategory(data.expense_categories?.[0] || "Food"); // Default selection
        }
      };
      fetchCategories();
    }
  }, [isOpen]);

  // Swap default category when type changes
  useEffect(() => {
    if (type === "expense" && expenseCats.length > 0) setCategory(expenseCats[0]);
    if (type === "income" && incomeCats.length > 0) setCategory(incomeCats[0]);
  }, [type, expenseCats, incomeCats]);

  const activeCategories = type === "expense" ? expenseCats : incomeCats;

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) return alert("Please enter a valid amount.");
    
    const familyId = localStorage.getItem("family_id");
    if (!familyId) return alert("Error: No Family Vault found.");

    setIsLoading(true);

    const payload = {
      amount: Number(amount),
      // NEW: Safe fallback to "General" if the category array was empty
      category: category || (type === 'expense' ? 'General Expense' : 'General Income'),
      type: type,
      is_business_overhead: isBusiness,
      spender: myName,
      account: account || availableAccounts[0], // Safe fallback for account too
      notes: notes,
      transaction_date: new Date(date).toISOString(),
      family_id: familyId,
    };

    const { error } = await supabase.from("transactions").insert([payload]);
    setIsLoading(false);

    if (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save. Check connection.");
    } else {
      window.dispatchEvent(new Event("transaction-updated"));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity cursor-pointer" onClick={onClose} />
      
      {/* Added max-h-[90vh] and overflow-y-auto to handle smaller screens */}
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 z-10 hide-scrollbar">
        
        <div className="sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur flex justify-between items-center p-5 border-b dark:border-gray-800 z-10">
          <h2 className="text-xl font-bold">Add Transaction</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 transition"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button onClick={() => setIsBusiness(false)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${!isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500'}`}><HomeIcon size={16} /> Household</button>
            <button onClick={() => setIsBusiness(true)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-fuchsia-600' : 'text-gray-500'}`}><Briefcase size={16} /> Business</button>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setType("expense")} className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${type === "expense" ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500'}`}><ArrowDownCircle size={24} /><span className="font-bold text-sm">Expense</span></button>
            <button onClick={() => setType("income")} className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${type === "income" ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500'}`}><ArrowUpCircle size={24} /><span className="font-bold text-sm">Income</span></button>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount (Ks)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">Ks</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full bg-gray-50 dark:bg-gray-800 text-2xl font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* NEW: Date & Time Picker */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><CalendarClock size={14}/> Date & Time</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {activeCategories.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${category === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Wallet / Account</label>
            <select value={account} onChange={(e) => setAccount(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
              {availableAccounts.map((acc) => (<option key={acc} value={acc}>{acc}</option>))}
            </select>
          </div>

          {/* NEW: Notes Section */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2"><AlignLeft size={14}/> Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was this for?" rows={2} className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>

          <button onClick={handleSave} disabled={isLoading || !amount} className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg py-4 rounded-2xl shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-4">
            {isLoading ? <Loader2 className="animate-spin" /> : "Save Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}