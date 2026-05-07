"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, ArrowUpRight, ArrowDownRight, Briefcase, Calendar, AlignLeft, Tags, Wallet } from "lucide-react";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddModal({ isOpen, onClose }: AddModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [isBusiness, setIsBusiness] = useState(false);
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });

  // Data Lists
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats] = useState<string[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      // Reset form when opened
      setAmount("");
      setNotes("");
      setIsBusiness(false); 
      setDate(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
      });
    }
  }, [isOpen]);

  const fetchDropdownData = async () => {
    const familyId = localStorage.getItem("family_id");
    const savedAccs = localStorage.getItem("custom_accounts");

    if (savedAccs) {
      const parsedAccs = JSON.parse(savedAccs);
      setAvailableAccounts(parsedAccs);
      setAccount(parsedAccs[0]); // Default to first account
    }

    if (familyId) {
      const { data, error } = await supabase
        .from('families')
        .select('expense_categories, income_categories')
        .eq('id', familyId)
        .single();

      if (data && !error) {
        const eCats = data.expense_categories || ['General Expense'];
        const iCats = data.income_categories || ['General Income'];
        setExpenseCats(eCats);
        setIncomeCats(iCats);
        setCategory(type === 'expense' ? eCats[0] : iCats[0]);
      }
    }
  };

  // Update category dropdown if type changes
  useEffect(() => {
    setCategory(type === 'expense' ? expenseCats[0] : incomeCats[0]);
  }, [type, expenseCats, incomeCats]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) return alert("Please enter a valid amount.");

    setIsSaving(true);
    const familyId = localStorage.getItem("family_id");
    const myName = localStorage.getItem("my_name") || "Me";

    const payload = {
      amount: Number(amount),
      category: category || (type === 'expense' ? 'General Expense' : 'General Income'),
      type: type,
      is_business_overhead: isBusiness,
      spender: myName,
      account: account || availableAccounts[0] || 'Cash',
      notes: notes,
      transaction_date: new Date(date).toISOString(),
      family_id: familyId,
    };

    const { error } = await supabase.from('transactions').insert([payload]);

    setIsSaving(false);

    if (error) {
      alert("Failed to save transaction.");
      console.error(error);
    } else {
      // Broadcast to the rest of the app to update balances instantly
      window.dispatchEvent(new Event("transaction-updated"));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Dark Blur Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[2.5rem] sm:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 z-10 border border-white/50 dark:border-gray-800 pb-8 sm:pb-6">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center z-20">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">New Record</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-transform">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Income / Expense Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl">
            <button 
              onClick={() => setType("expense")} 
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'expense' ? 'bg-white dark:bg-gray-700 shadow-sm text-rose-600' : 'text-gray-500'}`}
            >
              <ArrowDownRight size={18} /> Expense
            </button>
            <button 
              onClick={() => setType("income")} 
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${type === 'income' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'text-gray-500'}`}
            >
              <ArrowUpRight size={18} /> Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="relative">
            <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-black text-xl ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>Ks</span>
            <input 
              type="number" 
              inputMode="numeric"
              placeholder="0" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[1.5rem] py-5 pl-14 pr-6 outline-none focus:ring-2 focus:ring-indigo-500 text-3xl font-black text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 transition-all"
              autoFocus
            />
          </div>

          {/* Business Toggle */}
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                <Briefcase size={16} />
              </div>
              <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Business Record?</span>
            </div>
            <button 
              onClick={() => setIsBusiness(!isBusiness)} 
              className={`w-12 h-6 rounded-full transition-colors relative ${isBusiness ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${isBusiness ? 'translate-x-6.5 left-0.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="relative">
              <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-700 dark:text-gray-200 appearance-none"
              >
                {(type === 'expense' ? expenseCats : incomeCats).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Wallet Account */}
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select 
                value={account} 
                onChange={e => setAccount(e.target.value)} 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-700 dark:text-gray-200 appearance-none"
              >
                {availableAccounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="datetime-local" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-gray-700 dark:text-gray-200" 
            />
          </div>

          {/* Notes */}
          <div className="relative">
            <AlignLeft className="absolute left-4 top-4 text-gray-400" size={18} />
            <textarea 
              placeholder="Add a note..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-900 dark:text-gray-100 resize-none" 
              rows={2} 
            />
          </div>

          {/* Save Button */}
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black py-4 rounded-2xl active:scale-95 transition-transform flex justify-center items-center shadow-lg shadow-indigo-500/20"
          >
            {isSaving ? <Loader2 className="animate-spin" size={24} /> : "Save Transaction"}
          </button>

        </div>
      </div>
    </div>
  );
}