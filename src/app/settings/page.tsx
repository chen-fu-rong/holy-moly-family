"use client";

import { Check, Plus, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";

// Default စာရင်းများ
const DEFAULT_ACCOUNTS = ["💵 Cash", "💳 KBZPay", "🌊 WavePay", "📱 KPay", "🏦 AYA Pay", "💸 Bank Transfer"];
const DEFAULT_EXPENSES = ["🍔 Food & Drinks", "🚕 Transport", "🛒 Shopping", "💡 Bills & Utilities", "🏠 Rent & Home", "🎮 Entertainment", "❤️ Health & Care"];
const DEFAULT_INCOMES = ["💰 Salary", "📈 Business", "🎁 Bonus", "🔄 Other Income"];

export default function SettingsPage() {
  const [myName, setMyName] = useState("");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<string[]>([]);
  const [incomes, setIncomes] = useState<string[]>([]);

  const [newAcc, setNewAcc] = useState("");
  const [newExp, setNewExp] = useState("");
  const [newInc, setNewInc] = useState("");

  // Local Storage မှ Data များဆွဲယူခြင်း
  useEffect(() => {
    setMyName(localStorage.getItem("my_name") || "Me");
    
    const savedAccs = localStorage.getItem("custom_accounts");
    setAccounts(savedAccs ? JSON.parse(savedAccs) : DEFAULT_ACCOUNTS);

    const savedExps = localStorage.getItem("custom_expenses");
    setExpenses(savedExps ? JSON.parse(savedExps) : DEFAULT_EXPENSES);

    const savedIncs = localStorage.getItem("custom_incomes");
    setIncomes(savedIncs ? JSON.parse(savedIncs) : DEFAULT_INCOMES);
  }, []);

  // Profile နာမည်ပြောင်းခြင်း
  const saveName = () => {
    if (myName.trim()) {
      localStorage.setItem("my_name", myName.trim());
      alert("Profile name updated!");
      // ချက်ချင်းသက်ရောက်စေရန် Event လွှင့်မည်
      window.dispatchEvent(new Event("transaction-updated")); 
    }
  };

  // List ထဲသို့ အသစ်ထည့်ခြင်းနှင့် ဖျက်ခြင်းများ
  const addItem = (type: "acc" | "exp" | "inc") => {
    if (type === "acc" && newAcc.trim()) {
      const updated = [...accounts, newAcc.trim()];
      setAccounts(updated);
      localStorage.setItem("custom_accounts", JSON.stringify(updated));
      setNewAcc("");
    } else if (type === "exp" && newExp.trim()) {
      const updated = [...expenses, newExp.trim()];
      setExpenses(updated);
      localStorage.setItem("custom_expenses", JSON.stringify(updated));
      setNewExp("");
    } else if (type === "inc" && newInc.trim()) {
      const updated = [...incomes, newInc.trim()];
      setIncomes(updated);
      localStorage.setItem("custom_incomes", JSON.stringify(updated));
      setNewInc("");
    }
  };

  const removeItem = (type: "acc" | "exp" | "inc", index: number) => {
    if (type === "acc") {
      const updated = accounts.filter((_, i) => i !== index);
      setAccounts(updated);
      localStorage.setItem("custom_accounts", JSON.stringify(updated));
    } else if (type === "exp") {
      const updated = expenses.filter((_, i) => i !== index);
      setExpenses(updated);
      localStorage.setItem("custom_expenses", JSON.stringify(updated));
    } else if (type === "inc") {
      const updated = incomes.filter((_, i) => i !== index);
      setIncomes(updated);
      localStorage.setItem("custom_incomes", JSON.stringify(updated));
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8 w-full max-w-3xl mx-auto">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage your profile, categories, and wallets.</p>
      </div>

      {/* Profile Setting */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold flex items-center gap-2 mb-4"><User size={20} className="text-indigo-500" /> Your Profile</h3>
        <div className="flex gap-3">
          <input 
            type="text" 
            value={myName} 
            onChange={(e) => setMyName(e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={saveName} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl transition-colors font-medium">Save</button>
        </div>
      </div>

      {/* Accounts / Wallets */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold mb-4">💳 Custom Wallets / Accounts</h3>
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="e.g. 🏦 CB Pay" value={newAcc} onChange={(e) => setNewAcc(e.target.value)} className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none" />
          <button onClick={() => addItem("acc")} className="bg-gray-900 dark:bg-gray-700 text-white p-3 rounded-xl hover:bg-gray-800"><Plus size={24} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {accounts.map((acc, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-sm font-medium">
              {acc} <Trash2 size={14} className="text-red-500 cursor-pointer ml-1 hover:text-red-700" onClick={() => removeItem("acc", i)} />
            </div>
          ))}
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold mb-4 text-rose-500">🔻 Expense Categories</h3>
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="e.g. 🐶 Pet Care" value={newExp} onChange={(e) => setNewExp(e.target.value)} className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none" />
          <button onClick={() => addItem("exp")} className="bg-rose-500 text-white p-3 rounded-xl hover:bg-rose-600"><Plus size={24} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {expenses.map((exp, i) => (
            <div key={i} className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-full text-sm font-medium">
              {exp} <Trash2 size={14} className="cursor-pointer ml-1 hover:text-rose-900" onClick={() => removeItem("exp", i)} />
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="font-bold mb-4 text-emerald-500">🔺 Income Categories</h3>
        <div className="flex gap-3 mb-4">
          <input type="text" placeholder="e.g. 📈 Investments" value={newInc} onChange={(e) => setNewInc(e.target.value)} className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none" />
          <button onClick={() => addItem("inc")} className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600"><Plus size={24} /></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {incomes.map((inc, i) => (
            <div key={i} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-full text-sm font-medium">
              {inc} <Trash2 size={14} className="cursor-pointer ml-1 hover:text-emerald-900" onClick={() => removeItem("inc", i)} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}