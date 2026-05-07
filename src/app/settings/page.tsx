"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Trash2, Plus, Settings, Wallet, Tags, AlertTriangle, Target, Calculator } from "lucide-react";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Settings States
  const [wallets, setWallets] = useState<string[]>([]);
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats] = useState<string[]>([]);
  
  // Budgeting States
  const [expectedIncome, setExpectedIncome] = useState<number>(0);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});

  // Input States
  const [newWallet, setNewWallet] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [newIncomeCat, setNewIncomeCat] = useState("");

  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");

    const savedAccs = localStorage.getItem("custom_accounts");
    if (savedAccs) setWallets(JSON.parse(savedAccs));
    else setWallets(["Cash", "KBZPay", "WavePay", "Bank Transfer"]);

    if (familyId) {
      const { data, error } = await supabase
        .from('families')
        .select('expense_categories, income_categories, expected_monthly_income, budget_limits')
        .eq('id', familyId)
        .single();

      if (data && !error) {
        setExpenseCats(data.expense_categories || ['Food', 'Transport', 'Utilities', 'Shopping']);
        setIncomeCats(data.income_categories || ['Salary', 'Business']);
        setExpectedIncome(data.expected_monthly_income || 0);
        setBudgetLimits(data.budget_limits || {});
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    const familyId = localStorage.getItem("family_id");
    
    localStorage.setItem("custom_accounts", JSON.stringify(wallets));
    window.dispatchEvent(new Event("settings-updated"));

    if (familyId) {
      const { error } = await supabase
        .from('families')
        .update({
          expense_categories: expenseCats,
          income_categories: incomeCats,
          expected_monthly_income: expectedIncome,
          budget_limits: budgetLimits
        })
        .eq('id', familyId);

      if (error) alert("Failed to sync settings to the cloud.");
    }
    
    setIsSaving(false);
    
    const btn = document.getElementById('save-btn');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg class="w-5 h-5 inline mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Saved!';
      btn.classList.add('bg-emerald-500');
      btn.classList.remove('bg-indigo-600');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('bg-emerald-500');
        btn.classList.add('bg-indigo-600');
      }, 2000);
    }
  };

  const handleDisconnect = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  // --- Category Management Helpers ---
  const addExpenseCategory = () => {
    if (!newExpenseCat.trim()) return;
    const catName = newExpenseCat.trim();
    if (!expenseCats.includes(catName)) {
      setExpenseCats(prev => [...prev, catName]);
      setBudgetLimits(prev => ({ ...prev, [catName]: 0 }));
    }
    setNewExpenseCat("");
  };

  const removeExpenseCategory = (catToRemove: string) => {
    setExpenseCats(prev => prev.filter(c => c !== catToRemove));
    const newLimits = { ...budgetLimits };
    delete newLimits[catToRemove];
    setBudgetLimits(newLimits);
  };

  const updateBudgetLimit = (cat: string, amount: number) => {
    setBudgetLimits(prev => ({ ...prev, [cat]: amount }));
  };

  const addIncomeCategory = () => {
    if (!newIncomeCat.trim()) return;
    const catName = newIncomeCat.trim();
    if (!incomeCats.includes(catName)) {
      setIncomeCats(prev => [...prev, catName]);
    }
    setNewIncomeCat("");
  };

  // Math for the Zero-Based Calculator
  const totalBudgeted = expenseCats.reduce((acc, cat) => acc + (budgetLimits[cat] || 0), 0);
  const leftToAllocate = expectedIncome - totalBudgeted;
  const allocationPercent = expectedIncome > 0 ? (totalBudgeted / expectedIncome) * 100 : 0;

  if (isLoading) return <div className="flex justify-center items-center h-[100dvh]"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu">
        <div className="absolute top-[0%] -right-[10%] w-[60%] h-[50%] rounded-full bg-violet-500/10 dark:bg-violet-600/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[20%] -left-[10%] w-[50%] h-[40%] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-600/10 blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-2xl mx-auto pt-4 space-y-6">
        
        <div className="flex justify-between items-end mb-2">
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <Settings size={14} className="text-violet-500" /> Configuration
            </h2>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Settings</h1>
          </div>
        </div>

        {/* Live Master Budget Calculator */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden transform-gpu">
          <Calculator className="absolute -bottom-4 -right-4 text-white/10" size={120} />
          <div className="relative z-10">
            <h3 className="font-bold text-indigo-100 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
              <Target size={16} /> Monthly Budget Plan
            </h3>
            
            <div className="mb-4">
              <label className="text-sm font-medium text-indigo-200 mb-1 block">Expected Monthly Income</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-bold">Ks</span>
                <input 
                  type="number" 
                  value={expectedIncome || ""} 
                  onChange={(e) => setExpectedIncome(Number(e.target.value))}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-white/50 text-white font-black text-xl placeholder-white/30"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
              <div className="flex justify-between text-sm mb-2 font-bold">
                <span className="text-indigo-100">Total Allocated</span>
                <span className={leftToAllocate < 0 ? "text-rose-300" : "text-white"}>
                  {totalBudgeted.toLocaleString()} Ks
                </span>
              </div>
              <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${leftToAllocate < 0 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2 font-medium">
                <span className="text-indigo-200">
                  {leftToAllocate < 0 ? "Over Budget!" : "Left to Allocate"}
                </span>
                <span className={leftToAllocate < 0 ? "text-rose-300 font-bold" : "text-emerald-300 font-bold"}>
                  {leftToAllocate.toLocaleString()} Ks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Categories & Envelopes (SYNCED) */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm transform-gpu">
          <div className="mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Tags className="text-rose-500" size={20} /> Expenses & Envelopes
            </h3>
            <p className="text-xs text-gray-500 mt-1">Set a monthly limit for each category. Set to 0 for tracking only.</p>
          </div>
          
          <div className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="New Category (e.g., Rent)" 
              value={newExpenseCat} 
              onChange={e => setNewExpenseCat(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && addExpenseCategory()}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 transition-all text-sm"
            />
            <button onClick={addExpenseCategory} className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 p-3 rounded-xl active:scale-95 transition-transform">
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {expenseCats.map((cat) => (
              <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 gap-3">
                <div className="font-bold text-gray-700 dark:text-gray-300 flex-1 pl-2">{cat}</div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Ks</span>
                    <input 
                      type="number"
                      value={budgetLimits[cat] || ""}
                      onChange={(e) => updateBudgetLimit(cat, Number(e.target.value))}
                      placeholder="Limit"
                      className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-9 pr-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                    />
                  </div>
                  <button onClick={() => removeExpenseCategory(cat)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RESTORED: Income Categories */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm transform-gpu">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <Tags className="text-emerald-500" size={20} /> Income Categories
          </h3>
          
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="e.g., Salary, Business" 
              value={newIncomeCat} 
              onChange={e => setNewIncomeCat(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && addIncomeCategory()}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
            />
            <button 
              onClick={addIncomeCategory}
              className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-xl hover:scale-105 active:scale-95 transition-transform"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {incomeCats.map((cat, idx) => (
              <div key={idx} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium border border-emerald-100 dark:border-emerald-800/50">
                {cat}
                <button onClick={() => setIncomeCats(prev => prev.filter(c => c !== cat))} className="text-emerald-400/50 hover:text-emerald-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Wallets Management */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-6 rounded-[2rem] shadow-sm transform-gpu">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
            <Wallet className="text-blue-500" size={20} /> Custom Accounts
          </h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" placeholder="e.g., KBZPay" value={newWallet} onChange={e => setNewWallet(e.target.value)} 
              onKeyDown={e => { if (e.key === 'Enter' && newWallet.trim()) { setWallets(prev => [...prev, newWallet.trim()]); setNewWallet(""); } }}
              className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button onClick={() => { if (newWallet.trim()) { setWallets(prev => [...prev, newWallet.trim()]); setNewWallet(""); } }} className="bg-blue-100 text-blue-600 p-3 rounded-xl active:scale-95 transition-transform"><Plus size={20} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {wallets.map((wallet, idx) => (
              <div key={idx} className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                {wallet}
                <button onClick={() => setWallets(prev => prev.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-rose-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Master Save Button */}
        <button 
          id="save-btn" onClick={handleSave} disabled={isSaving}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex justify-center items-center gap-2 transform-gpu"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Configuration</>}
        </button>

        {/* Secure Disconnect Zone */}
        <div className="pt-8 pb-4">
          {!showDisconnectConfirm ? (
            <button onClick={() => setShowDisconnectConfirm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/50 text-rose-500 font-bold active:scale-95 transition-all transform-gpu">
              Disconnect Device
            </button>
          ) : (
            <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/30 animate-in zoom-in-95 duration-200">
              <h3 className="font-extrabold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2"><AlertTriangle size={20} /> Are you absolutely sure?</h3>
              <p className="text-sm text-rose-600/80 dark:text-rose-300/80 mb-6 font-medium">This logs you out locally. Cloud data is safe.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDisconnectConfirm(false)} className="flex-1 py-3.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl active:scale-95 transition-transform border border-gray-200 dark:border-gray-700">Cancel</button>
                <button onClick={handleDisconnect} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-xl active:scale-95 transition-transform">Disconnect</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}