"use client";

import { useState, useEffect } from "react";
import { X, Briefcase, HomeIcon, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Bills", 
  "Rent", "Health", "Entertainment", "Business", "Salary", "Baby Prep"
];

const DEFAULT_ACCOUNTS = ["💵 Cash", "🔵 KBZPay", "🌊 WavePay", "🔴 KPay", "🛑 AYA Pay", "🏦 Bank Transfer"];

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddModal({ isOpen, onClose }: AddModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [isBusiness, setIsBusiness] = useState(false);
  const [account, setAccount] = useState("");
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [myName, setMyName] = useState("Me");

  useEffect(() => {
    setMyName(localStorage.getItem("my_name") || "Me");
  }, []);

  // Reset form and load custom wallets when opened
  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setCategory("Food");
      setType("expense");
      setIsBusiness(false);
      setNotes("");
      
      // Load the custom wallets from settings
      const savedAccs = localStorage.getItem("custom_accounts");
      const parsedAccs = savedAccs ? JSON.parse(savedAccs) : DEFAULT_ACCOUNTS;
      setAvailableAccounts(parsedAccs);
      
      // Set the default selected account to the first one in the list
      if (parsedAccs.length > 0) {
        setAccount(parsedAccs[0]);
      }
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      alert("Please enter a valid amount.");
      return;
    }

    setIsLoading(true);

    const payload = {
      amount: Number(amount),
      category: category,
      type: type,
      is_business_overhead: isBusiness,
      spender: myName,
      account: account, // Now uses the wallet you actually selected
      notes: notes,
    };

    const { error } = await supabase
      .from("transactions")
      .insert([payload]);

    setIsLoading(false);

    if (error) {
      console.error("Error saving transaction:", error);
      alert("Failed to save. Check your connection.");
    } else {
      window.dispatchEvent(new Event("transaction-updated"));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-800">
          <h2 className="text-xl font-bold">Add Transaction</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          
          {/* Context Toggle: Household vs Business */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button
              onClick={() => setIsBusiness(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${!isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <HomeIcon size={16} /> Household
            </button>
            <button
              onClick={() => setIsBusiness(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${isBusiness ? 'bg-white dark:bg-gray-700 shadow-sm text-fuchsia-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Briefcase size={16} /> Business
            </button>
          </div>

          {/* Type Toggle (Income/Expense) */}
          <div className="flex gap-4">
            <button
              onClick={() => setType("expense")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${type === "expense" ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
            >
              <ArrowDownCircle size={24} />
              <span className="font-bold text-sm">Expense</span>
            </button>
            <button
              onClick={() => setType("income")}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border-2 transition-all ${type === "income" ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-500'}`}
            >
              <ArrowUpCircle size={24} />
              <span className="font-bold text-sm">Income</span>
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Amount (Ks)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">Ks</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-gray-50 dark:bg-gray-800 text-2xl font-bold rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Wallet / Account Selector */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Wallet / Account</label>
            <div className="relative">
              <select
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
              >
                {availableAccounts.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                ))}
              </select>
              {/* Custom arrow for the select box */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Category Grid */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${category === cat ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isLoading || !amount}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Save Transaction"}
          </button>

        </div>
      </div>
    </div>
  );
}