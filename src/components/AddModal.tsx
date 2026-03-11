"use client";

import { X, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

// Defaults
const DEFAULT_ACCOUNTS = ["💵 Cash", "💳 KBZPay", "🌊 WavePay", "📱 KPay", "🏦 AYA Pay", "💸 Bank Transfer"];
const DEFAULT_EXPENSES = ["🍔 Food & Drinks", "🚕 Transport", "🛒 Shopping", "💡 Bills & Utilities", "🏠 Rent & Home", "🎮 Entertainment", "❤️ Health & Care"];
const DEFAULT_INCOMES = ["💰 Salary", "📈 Business", "🎁 Bonus", "🔄 Other Income"];

export default function AddModal({ isOpen, onClose, editData }: AddModalProps) {
  const getLocalDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getLocalDateTime());
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 Settings ထဲက Data များ
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [availableExpenses, setAvailableExpenses] = useState<string[]>([]);
  const [availableIncomes, setAvailableIncomes] = useState<string[]>([]);

  // Modal ပွင့်လာတိုင်း LocalStorage က Data ကို ပြန်ဆွဲမည်
  useEffect(() => {
    if (isOpen) {
      const savedAccs = localStorage.getItem("custom_accounts");
      const accList = savedAccs ? JSON.parse(savedAccs) : DEFAULT_ACCOUNTS;
      setAvailableAccounts(accList);

      const savedExps = localStorage.getItem("custom_expenses");
      const expList = savedExps ? JSON.parse(savedExps) : DEFAULT_EXPENSES;
      setAvailableExpenses(expList);

      const savedIncs = localStorage.getItem("custom_incomes");
      const incList = savedIncs ? JSON.parse(savedIncs) : DEFAULT_INCOMES;
      setAvailableIncomes(incList);

      if (editData) {
        setType(editData.type);
        setAmount(Math.abs(editData.amount).toString());
        setAccount(editData.account);
        setCategory(editData.category);
        setNote(editData.note || "");
        
        const txDate = new Date(editData.created_at);
        txDate.setMinutes(txDate.getMinutes() - txDate.getTimezoneOffset());
        setDate(txDate.toISOString().slice(0, 16));
      } else {
        setType("expense");
        setAmount("");
        setNote("");
        setDate(getLocalDateTime());
        // Default အနေနဲ့ ပထမဆုံး Item များကို ရွေးပေးထားမည်
        setAccount(accList[0] || "");
        setCategory(expList[0] || "");
      }
    }
  }, [editData, isOpen]);

  // Income / Expense ပြောင်းတိုင်း Category အလိုလို ပြောင်းရန်
  useEffect(() => {
    if (!editData && isOpen) {
      if (type === "expense") setCategory(availableExpenses[0] || "");
      else setCategory(availableIncomes[0] || "");
    }
  }, [type, availableExpenses, availableIncomes, editData, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!amount) {
      alert("Please enter an amount!");
      return;
    }
    setIsLoading(true);
    const finalAmount = type === "expense" ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
    
    const myName = localStorage.getItem("my_name") || "Unknown";

    const payload = {
      amount: finalAmount,
      type,
      category,
      account,
      note,
      created_at: new Date(date).toISOString(),
      spender: myName 
    };

    let errorResult;
    if (editData?.id) {
      const { error } = await supabase.from("transactions").update(payload).eq("id", editData.id);
      errorResult = error;
    } else {
      const { error } = await supabase.from("transactions").insert([payload]);
      errorResult = error;
    }

    setIsLoading(false);

    if (errorResult) {
      console.error("Error saving data:", errorResult);
      alert("Something went wrong!");
    } else {
      window.dispatchEvent(new Event("transaction-updated"));
      onClose();
    }
  };

  const handleDelete = async () => {
    if(!confirm("Are you sure you want to delete this?")) return;
    setIsLoading(true);
    const { error } = await supabase.from("transactions").delete().eq("id", editData.id);
    setIsLoading(false);
    
    if(!error) {
      window.dispatchEvent(new Event("transaction-updated"));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full md:slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editData ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <div className="flex gap-2">
            {editData && (
              <button onClick={handleDelete} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 hover:bg-red-200 transition-colors">
                <Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
          <button onClick={() => setType("expense")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === "expense" ? "bg-white dark:bg-gray-700 text-rose-600 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>Expense</button>
          <button onClick={() => setType("income")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${type === "income" ? "bg-white dark:bg-gray-700 text-emerald-600 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>Income</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (Ks)</label>
            <input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full text-2xl font-bold p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date & Time</label>
            <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account</label>
            <select value={account} onChange={(e) => setAccount(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer">
              {/* 🟢 Settings မှ ပြင်ထားသော Account များကို ယူသုံးမည် */}
              {availableAccounts.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
              {/* အကယ်၍ အရင်က သုံးခဲ့ဖူးတဲ့ Account က Settings မှာ ဖျက်လိုက်လို့ မရှိတော့ရင်လည်း Select Box မှာ ပေါ်နေစေရန် စစ်ဆေးခြင်း */}
              {editData && !availableAccounts.includes(editData.account) && (
                <option value={editData.account}>{editData.account} (Legacy)</option>
              )}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer">
              {/* 🟢 Settings မှ ပြင်ထားသော Category များကို ယူသုံးမည် */}
              {type === "expense" ? (
                availableExpenses.map(exp => <option key={exp} value={exp}>{exp}</option>)
              ) : (
                availableIncomes.map(inc => <option key={inc} value={inc}>{inc}</option>)
              )}
              {editData && type === "expense" && !availableExpenses.includes(editData.category) && (
                 <option value={editData.category}>{editData.category} (Legacy)</option>
              )}
              {editData && type === "income" && !availableIncomes.includes(editData.category) && (
                 <option value={editData.category}>{editData.category} (Legacy)</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
            <input type="text" placeholder="What was this for?" value={note} onChange={(e) => setNote(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
        </div>

        <button onClick={handleSave} disabled={isLoading} className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2">
          {isLoading ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : (editData ? "Update Transaction" : "Save Transaction")}
        </button>

      </div>
    </div>
  );
}