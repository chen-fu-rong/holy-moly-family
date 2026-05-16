"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X, Loader2, ArrowUpRight, ArrowDownRight, Briefcase, Calendar, AlignLeft, Tags, Wallet, AlertTriangle, User } from "lucide-react";
import { triggerHaptic } from "@/lib/utils";
import { useVaultStore } from "@/lib/store";
import { predictCategory } from "@/lib/insights";
import { toast } from "sonner";

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export default function AddModal({ isOpen, onClose, initialData }: AddModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [isBusiness, setIsBusiness] = useState(false);
  const [date, setDate] = useState("");
  const [payer, setPayer] = useState("");
  const [payee, setPayee] = useState("");

  const transactions = useVaultStore(state => state.transactions);

  // Auto-categorization Logic
  useEffect(() => {
    if (!initialData && notes.length > 2) {
      const suggested = predictCategory(notes, transactions);
      if (suggested) {
        // Only set if current category is the default or empty
        const allCats = [...expenseCats, ...incomeCats, ...bizExpenseCats, ...bizIncomeCats];
        if (!category || category === expenseCats[0] || category === bizExpenseCats[0]) {
          setCategory(suggested);
        }
      }
    }
  }, [notes, initialData, transactions]);

  // Data Lists
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats] = useState<string[]>([]);
  const [bizExpenseCats, setBizExpenseCats] = useState<string[]>([]);
  const [bizIncomeCats, setBizIncomeCats] = useState<string[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);

  const family = useVaultStore(state => state.family);
  const currency = useVaultStore(state => state.currency);

  const getLocalCategories = () => {
    const storedFamilyExpense = localStorage.getItem("family_expense_categories");
    const storedFamilyIncome = localStorage.getItem("family_income_categories");
    const storedBusinessExpense = localStorage.getItem("business_expense_categories");
    const storedBusinessIncome = localStorage.getItem("business_income_categories");

    return {
      familyExpense: storedFamilyExpense ? JSON.parse(storedFamilyExpense) : null,
      familyIncome: storedFamilyIncome ? JSON.parse(storedFamilyIncome) : null,
      businessExpense: storedBusinessExpense ? JSON.parse(storedBusinessExpense) : null,
      businessIncome: storedBusinessIncome ? JSON.parse(storedBusinessIncome) : null,
    };
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmount(initialData.amount.toString());
        setCategory(initialData.category);
        setAccount(initialData.account);
        setNotes(initialData.notes || "");
        setIsBusiness(initialData.is_business_overhead);
        setPayer(initialData.payer || "");
        setPayee(initialData.payee || "");
        const d = new Date(initialData.transaction_date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDate(d.toISOString().slice(0, 16));
      } else {
        setType("expense");
        setAmount("");
        setCategory("");
        setAccount("");
        setNotes("");
        setIsBusiness(false);
        setPayer("");
        setPayee("");
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setDate(now.toISOString().slice(0, 16));
      }
    }
  }, [isOpen, initialData]);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchDropdownData = async () => {
    const familyId = localStorage.getItem("family_id");
    const savedAccs = localStorage.getItem("custom_accounts");
    const localCategories = getLocalCategories();

    if (savedAccs) {
      const parsedAccs = JSON.parse(savedAccs);
      setAvailableAccounts(parsedAccs);
      setAccount(prev => prev || parsedAccs[0]);
    } else {
      const defaults = ["Cash", "KBZPay", "WavePay", "Bank Transfer"];
      setAvailableAccounts(defaults);
      setAccount(prev => prev || defaults[0]);
    }

    if (family) {
      const eCats = localCategories.familyExpense || family.expense_categories || ['General Expense'];
      const iCats = localCategories.familyIncome || family.income_categories || ['General Income'];
      const beCats = localCategories.businessExpense || family.business_expense_categories || ['Software', 'Marketing', 'Contractors'];
      const biCats = localCategories.businessIncome || family.business_income_categories || ['Client Invoices', 'Product Sales'];
      const fWallets = family.wallets || (savedAccs ? JSON.parse(savedAccs) : ["Cash", "KBZPay", "WavePay", "Bank Transfer"]);
      
      setExpenseCats(eCats);
      setIncomeCats(iCats);
      setBizExpenseCats(beCats);
      setBizIncomeCats(biCats);
      setAvailableAccounts(fWallets);
      if (!initialData) setAccount(prev => prev || fWallets[0]);
      
      // Set initial category
      if (!initialData) {
        if (isBusiness) {
          setCategory(type === 'expense' ? beCats[0] : biCats[0]);
        } else {
          setCategory(type === 'expense' ? eCats[0] : iCats[0]);
        }
      }
    } else if (familyId) {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (data && !error) {
        const eCats = localCategories.familyExpense || data.expense_categories || ['General Expense'];
        const iCats = localCategories.familyIncome || data.income_categories || ['General Income'];
        const beCats = localCategories.businessExpense || data.business_expense_categories || ['Software', 'Marketing', 'Contractors'];
        const biCats = localCategories.businessIncome || data.business_income_categories || ['Client Invoices', 'Product Sales'];
        const fWallets = data.wallets || (savedAccs ? JSON.parse(savedAccs) : ["Cash", "KBZPay", "WavePay", "Bank Transfer"]);

        setExpenseCats(eCats);
        setIncomeCats(iCats);
        setBizExpenseCats(beCats);
        setBizIncomeCats(biCats);
        setAvailableAccounts(fWallets);
        if (!initialData) setAccount(prev => prev || fWallets[0]);
        
        if (!initialData) {
          if (isBusiness) {
            setCategory(type === 'expense' ? beCats[0] : biCats[0]);
          } else {
            setCategory(type === 'expense' ? eCats[0] : iCats[0]);
          }
        }
      }
    }
  };

  // Update category dropdown if type or business toggle changes
  useEffect(() => {
    // Prevent overriding if editing an existing record, unless the type/workspace changed manually AFTER opening
    if (initialData && initialData.type === type && initialData.is_business_overhead === isBusiness) {
      return;
    }
    
    if (isBusiness) {
      setCategory(type === 'expense' ? bizExpenseCats[0] : bizIncomeCats[0]);
    } else {
      setCategory(type === 'expense' ? expenseCats[0] : incomeCats[0]);
    }
  }, [type, isBusiness, expenseCats, incomeCats, bizExpenseCats, bizIncomeCats]);

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) return toast.error("Please enter a valid amount.");

    // Budget Check for Expenses
    if (type === 'expense' && !isBusiness) {
      const family = useVaultStore.getState().family;
      const txs = useVaultStore.getState().transactions;
      const limit = family?.budget_limits?.[category] || 0;
      
      if (limit > 0) {
        const now = new Date();
        const thisMonthTxs = txs.filter(t => {
          const d = new Date(t.transaction_date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.category === category && t.type === 'expense';
        });
        const currentSpent = thisMonthTxs.reduce((sum, t) => sum + Number(t.amount), 0);
        
        if (currentSpent + Number(amount) > limit) {
          triggerHaptic('warning');
          toast.warning(`Warning: This will put you ${ (currentSpent + Number(amount) - limit).toLocaleString() } ${currency} over your budget for ${category}.`);
        }
      }
    }

    setIsSaving(true);
    triggerHaptic('medium');
    const familyId = localStorage.getItem("family_id");
    const myName = localStorage.getItem("my_name") || "Me";

    if (!familyId) {
      setIsSaving(false);
      toast.error("Unable to save transaction: vault not found.");
      console.error("Missing family_id in localStorage when saving transaction.");
      return;
    }

    const payload = {
      amount: Number(amount),
      category: category || (type === 'expense' ? 'General Expense' : 'General Income'),
      type: type,
      is_business_overhead: isBusiness,
      spender: initialData ? initialData.spender : myName,
      account: account || availableAccounts[0] || 'Cash',
      notes: notes,
      payer: payer || undefined,
      payee: payee || undefined,
      transaction_date: new Date(date).toISOString(),
      family_id: familyId,
    };

    let error;
    if (initialData) {
      const res = await useVaultStore.getState().editTransaction(initialData.id, payload);
      error = res.error;
    } else {
      const res = await useVaultStore.getState().addTransaction(payload);
      error = res.error;
    }

    setIsSaving(false);

    if (error) {
      toast.error(error.message || "Failed to save transaction.");
      console.error(error);
    } else {
      triggerHaptic('success');
      toast.success(initialData ? "Transaction updated." : "Transaction saved.");
      window.dispatchEvent(new Event("transaction-updated"));
      // Auto-hide modal after successful save (unless editing)
      setTimeout(() => onClose(), 300);
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
      <div role="dialog" aria-modal="true" aria-labelledby="addModalTitle" className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl w-full max-w-md md:max-w-lg max-h-[90dvh] overflow-y-auto rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 z-10 border border-white/50 dark:border-gray-800 pb-8 md:pb-6">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 md:px-7 py-4 md:py-5 flex justify-between items-center z-20">
          <h2 id="addModalTitle" className="text-lg md:text-2xl font-extrabold text-gray-900 dark:text-white">
            {initialData ? "Edit Record" : "New Record"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="p-2.5 md:p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 transition-transform flex-shrink-0">
            <X size={22} />
          </button>
        </div>

        <div className="p-5 md:p-7 space-y-6 md:space-y-5">
          
          {/* Step Indicator */}
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Essential Details</div>

          {/* Income / Expense Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 md:p-2 rounded-2xl" role="group" aria-label="Transaction type">
            <button 
              type="button"
              onClick={() => setType("expense")} 
              aria-pressed={type === 'expense'}
              className={`flex-1 py-3 md:py-3.5 rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${type === 'expense' ? 'bg-white dark:bg-gray-700 shadow-sm text-rose-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ArrowDownRight size={20} /> Expense
            </button>
            <button 
              type="button"
              onClick={() => setType("income")} 
              aria-pressed={type === 'income'}
              className={`flex-1 py-3 md:py-3.5 rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${type === 'income' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <ArrowUpRight size={20} /> Income
            </button>
          </div>

          {/* Amount Input */}
          <div className="relative">
            <label htmlFor="transactionAmount" className="sr-only">Transaction amount</label>
            <span className={`absolute left-5 top-1/2 -translate-y-1/2 font-black text-2xl md:text-3xl ${type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{currency}</span>
            <input 
              id="transactionAmount"
              type="number" 
              inputMode="numeric"
              placeholder="0" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[1.5rem] py-6 md:py-7 pl-16 pr-6 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-4xl md:text-5xl font-black text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 transition-all"
              autoFocus
            />
          </div>

          {/* Business Toggle */}
          <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-4 md:p-5 rounded-2xl">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-9 md:w-10 h-9 md:h-10 rounded-full bg-emerald-200 dark:bg-emerald-800/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                <Briefcase size={18} />
              </div>
              <span className="text-sm md:text-base font-bold text-emerald-900 dark:text-emerald-100">Business Record?</span>
            </div>
            <button 
              type="button"
              onClick={() => setIsBusiness(!isBusiness)} 
              aria-pressed={isBusiness}
              aria-label="Toggle business record"
              className={`w-12 h-7 md:w-14 h-8 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex-shrink-0 ${isBusiness ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${isBusiness ? 'translate-x-7 left-0.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Transaction Details Section */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Details</div>
            <div className="grid grid-cols-2 gap-4 md:gap-5">
            {/* Category */}
            <div className="relative">
              <Tags className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <label htmlFor="transactionCategory" className="sr-only">Transaction category</label>
              <select 
                id="transactionCategory"
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 md:py-4 pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm md:text-base font-bold text-gray-700 dark:text-gray-200 appearance-none"
              >
                {(isBusiness 
                  ? (type === 'expense' ? (bizExpenseCats.length ? bizExpenseCats : ['General Expense']) : (bizIncomeCats.length ? bizIncomeCats : ['General Income']))
                  : (type === 'expense' ? (expenseCats.length ? expenseCats : ['General Expense']) : (incomeCats.length ? incomeCats : ['General Income']))
                ).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Wallet Account */}
            <div className="relative">
              <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <label htmlFor="transactionAccount" className="sr-only">Account</label>
              <select 
                id="transactionAccount"
                value={account} 
                onChange={e => setAccount(e.target.value)} 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 md:py-4 pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm md:text-base font-bold text-gray-700 dark:text-gray-200 appearance-none"
              >
                {(availableAccounts.length ? availableAccounts : ['Cash']).map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Participants</div>
            <div className="grid grid-cols-2 gap-4 md:gap-5">
            {/* Payer */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <label htmlFor="payer" className="sr-only">Payer</label>
              <input
                id="payer"
                type="text"
                placeholder={type === 'expense' ? 'Payer' : 'Income from'}
                value={payer}
                onChange={e => setPayer(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 md:py-4 pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm md:text-base font-medium text-gray-700 dark:text-gray-200"
              />
            </div>

            {/* Payee */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <label htmlFor="payee" className="sr-only">Payee</label>
              <input
                id="payee"
                type="text"
                placeholder={type === 'income' ? 'Payee' : 'Paid to'}
                value={payee}
                onChange={e => setPayee(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 md:py-4 pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm md:text-base font-medium text-gray-700 dark:text-gray-200"
              />
            </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Additional Info</div>
           <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <label htmlFor="transactionDate" className="sr-only">Transaction date and time</label>
            <input 
              id="transactionDate"
              type="datetime-local" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 md:py-4 pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm md:text-base font-bold text-gray-700 dark:text-gray-200" 
            />
            </div>

            {/* Notes */}
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-gray-400" size={20} />
              <label htmlFor="transactionNotes" className="sr-only">Transaction notes</label>
              <textarea 
                id="transactionNotes"
                placeholder="Add a note..." 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 md:py-4 pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 resize-none"
              rows={3}
            />
            </div>
          </div>

          {/* Save Button - Prominent CTA */}
          <button 
            type="button"
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-black py-4 md:py-5 rounded-2xl active:scale-95 transition-transform flex justify-center items-center shadow-lg shadow-indigo-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 text-base md:text-lg h-12 md:h-14 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="animate-spin" size={28} /> : "Save Transaction"}
          </button>

        </div>
      </div>
    </div>
  );
}