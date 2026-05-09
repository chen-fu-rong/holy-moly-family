"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, Trash2, Plus, Wallet, Tags, AlertTriangle, ShieldCheck, Target, Calculator, Home, Briefcase, Key, Copy, Check, Users, Download, Database, CheckCircle2 } from "lucide-react";
import { exportToCSV, triggerHaptic } from "@/lib/utils";
import { useVaultStore } from "@/lib/store";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [myName, setMyName] = useState("Unknown User");
  const [pairingCode, setPairingCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<any[]>([]); // Added members state
  const [isOwner, setIsOwner] = useState(false); // Added isOwner state
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"family" | "business" | "wallets" | "danger">("family");

  // Family States
  const [familyExpenseCats, setFamilyExpenseCats] = useState<string[]>([]);
  const [familyIncomeCats, setFamilyIncomeCats] = useState<string[]>([]);
  const [expectedIncome, setExpectedIncome] = useState<number>(0);
  const [budgetLimits, setBudgetLimits] = useState<Record<string, number>>({});
  const [newFamilyExp, setNewFamilyExp] = useState("");
  const [newFamilyInc, setNewFamilyInc] = useState("");

  // Business States
  const [businessExpenseCats, setBusinessExpenseCats] = useState<string[]>([]);
  const [businessIncomeCats, setBusinessIncomeCats] = useState<string[]>([]);
  const [newBusinessExp, setNewBusinessExp] = useState("");
  const [newBusinessInc, setNewBusinessInc] = useState("");

  // Wallets States
  const [wallets, setWallets] = useState<string[]>([]);
  const [newWallet, setNewWallet] = useState("");

  // Currency State
  const [currency, setCurrency] = useState("Ks");

  // Danger States
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");
    const storedName = localStorage.getItem("my_name");
    const storedCurrency = localStorage.getItem("vault_currency") || "Ks";
    setCurrency(storedCurrency);
    setIsOwner(localStorage.getItem("is_vault_owner") === "true");
    
    if (storedName) setMyName(storedName);

    const savedAccs = localStorage.getItem("custom_accounts");
    if (savedAccs) {
      setWallets(JSON.parse(savedAccs));
    } else {
      setWallets(["Cash", "KBZPay", "WavePay", "Bank Transfer"]);
    }

    const savedFamilyExpenses = localStorage.getItem("family_expense_categories");
    const savedFamilyIncomes = localStorage.getItem("family_income_categories");
    const savedBudgetLimits = localStorage.getItem("family_budget_limits");
    const savedBusinessExpenses = localStorage.getItem("business_expense_categories");
    const savedBusinessIncomes = localStorage.getItem("business_income_categories");

    setFamilyExpenseCats(savedFamilyExpenses ? JSON.parse(savedFamilyExpenses) : ["Housing", "Groceries", "Utilities"]);
    setFamilyIncomeCats(savedFamilyIncomes ? JSON.parse(savedFamilyIncomes) : ["Salary", "Cash Gifts"]);
    setBudgetLimits(savedBudgetLimits ? JSON.parse(savedBudgetLimits) : {});
    setBusinessExpenseCats(savedBusinessExpenses ? JSON.parse(savedBusinessExpenses) : ["Software", "Marketing", "Contractors"]);
    setBusinessIncomeCats(savedBusinessIncomes ? JSON.parse(savedBusinessIncomes) : ["Client Invoices", "Product Sales"]);

    if (familyId) {
      try {
        const { data, error } = await supabase
          .from('families')
          .select('expected_monthly_income')
          .eq('id', familyId)
          .single();

        if (error) {
          console.error('Error fetching settings:', error);
          alert(`Failed to load settings: ${error.message}`);
        } else if (data) {
          // Family Data (Using ?? [] so it respects if you intentionally delete everything)
          setExpectedIncome(data.expected_monthly_income ? Number(data.expected_monthly_income) : 0);
        }
      } catch (err) {
        console.error('Unexpected error fetching settings:', err);
        alert('Unexpected error loading settings');
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    triggerHaptic('medium');
    const familyId = localStorage.getItem("family_id");
    
    localStorage.setItem("custom_accounts", JSON.stringify(wallets));
    localStorage.setItem("vault_currency", currency);
    localStorage.setItem("family_expense_categories", JSON.stringify(familyExpenseCats));
    localStorage.setItem("family_income_categories", JSON.stringify(familyIncomeCats));
    localStorage.setItem("family_budget_limits", JSON.stringify(budgetLimits));
    localStorage.setItem("business_expense_categories", JSON.stringify(businessExpenseCats));
    localStorage.setItem("business_income_categories", JSON.stringify(businessIncomeCats));
    window.dispatchEvent(new Event("settings-updated"));

    if (familyId) {
      try {
        const { error } = await supabase
          .from('families')
          .update({
            expected_monthly_income: expectedIncome.toString()
          })
          .eq('id', familyId);

        if (error) {
          console.error('Error saving settings:', error);
          alert(`Failed to sync settings to the cloud: ${error.message}`);
        } else {
          console.log('Settings saved successfully');
        }
      } catch (err) {
        console.error('Unexpected error saving settings:', err);
        alert('Unexpected error saving settings');
      }
    }
    
    setIsSaving(false);
    setSaveStatus('saved');
    
    // Reset to idle after animation
    setTimeout(() => {
      setSaveStatus('idle');
    }, 2000);
  };

  const handleDisconnect = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const copyPairingCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approveMember = (name: string) => {
    setMembers(prev => prev.map(m => m.name === name ? { ...m, status: 'approved' } : m));
  };

  const removeMember = (name: string) => {
    if (name === myName && isOwner) return alert("You cannot remove yourself as the owner.");
    setMembers(prev => prev.filter(m => m.name !== name));
  };

  // --- Generic Add/Remove Helpers ---
  const addItem = (item: string, setter: React.Dispatch<React.SetStateAction<string[]>>, clear: () => void) => {
    if (!item.trim()) return;
    const val = item.trim();
    setter(prev => prev.includes(val) ? prev : [...prev, val]);
    clear();
  };

  const removeItem = (itemToRemove: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter(i => i !== itemToRemove));
  };

  // --- Family Special Helpers (Synced with Budget Envelopes) ---
  const addFamilyExpense = () => {
    if (!newFamilyExp.trim()) return;
    const catName = newFamilyExp.trim();
    if (!familyExpenseCats.includes(catName)) {
      setFamilyExpenseCats(prev => [...prev, catName]);
      setBudgetLimits(prev => ({ ...prev, [catName]: 0 }));
    }
    setNewFamilyExp("");
  };

  const removeFamilyExpense = (catToRemove: string) => {
    setFamilyExpenseCats(prev => prev.filter(c => c !== catToRemove));
    const newLimits = { ...budgetLimits };
    delete newLimits[catToRemove];
    setBudgetLimits(newLimits);
  };

  // Math for the Zero-Based Calculator
  const totalBudgeted = familyExpenseCats.reduce((acc, cat) => acc + (budgetLimits[cat] || 0), 0);
  const leftToAllocate = expectedIncome - totalBudgeted;
  const allocationPercent = expectedIncome > 0 ? (totalBudgeted / expectedIncome) * 100 : 0;

  if (isLoading) return <div className="flex justify-center items-center h-[100dvh]"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
      {/* Dynamic Settings Background based on Tab */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu transition-colors duration-700">
        <div className={`absolute top-[0%] -right-[10%] w-[60%] h-[50%] rounded-full blur-3xl animate-pulse transition-colors duration-700 ${activeTab === 'business' ? 'bg-emerald-500/10' : 'bg-violet-500/10'}`} style={{ animationDuration: '8s' }} />
        <div className={`absolute bottom-[20%] -left-[10%] w-[50%] h-[40%] rounded-full blur-3xl animate-pulse transition-colors duration-700 ${activeTab === 'business' ? 'bg-cyan-500/10' : 'bg-fuchsia-500/10'}`} style={{ animationDuration: '10s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-2xl mx-auto pt-4 space-y-6">
        
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Vault Settings</h1>

        {/* The Tab Navigation UI */}
        <div role="tablist" aria-label="Settings tabs" className="flex overflow-x-auto hide-scrollbar gap-2 bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl snap-x">
          <button type="button" role="tab" aria-selected={activeTab === 'family'} aria-controls="family-panel" id="tab-family" onClick={() => setActiveTab("family")} className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${activeTab === 'family' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <Home size={16}/> Family
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'business'} aria-controls="business-panel" id="tab-business" onClick={() => setActiveTab("business")} className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${activeTab === 'business' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <Briefcase size={16}/> Business
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'wallets'} aria-controls="wallets-panel" id="tab-wallets" onClick={() => setActiveTab("wallets")} className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${activeTab === 'wallets' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <Wallet size={16}/> Accounts
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'danger'} aria-controls="danger-panel" id="tab-danger" onClick={() => setActiveTab("danger")} className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${activeTab === 'danger' ? 'bg-white dark:bg-gray-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
            <AlertTriangle size={16}/> System
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-5 md:p-6 rounded-[2rem] shadow-sm min-h-[50vh] transform-gpu">
          
          {/* 1. FAMILY TAB */}
          {activeTab === "family" && (
            <div id="family-panel" role="tabpanel" aria-labelledby="tab-family" tabIndex={0} className="space-y-8 animate-in fade-in duration-300">
              
              {/* Live Master Budget Calculator */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden transform-gpu">
                <Calculator className="absolute -bottom-4 -right-4 text-white/10" size={120} />
                <div className="relative z-10">
                  <h3 className="font-bold text-indigo-100 mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <Target size={16} /> Monthly Budget Plan
                  </h3>
                  <div className="mb-4">
                    <label className="text-sm font-medium text-indigo-200 mb-1 block">Expected Family Income</label>
                    <div className="relative flex gap-2">
                      <div className="relative w-24">
                        <label htmlFor="currencySelect" className="sr-only">Currency</label>
                        <select 
                          id="currencySelect"
                          value={currency} 
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 px-3 outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-white font-bold text-lg appearance-none cursor-pointer"
                        >
                          <option value="Ks" className="text-gray-900">Ks</option>
                          <option value="$" className="text-gray-900">$</option>
                          <option value="€" className="text-gray-900">€</option>
                          <option value="£" className="text-gray-900">£</option>
                          <option value="¥" className="text-gray-900">¥</option>
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <label htmlFor="expectedIncome" className="sr-only">Expected family income</label>
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 font-bold">{currency}</span>
                        <input id="expectedIncome" type="number" value={expectedIncome || ""} onChange={(e) => setExpectedIncome(Number(e.target.value))} className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-xl py-3 pl-12 pr-4 outline-none focus-visible:ring-2 focus-visible:ring-white/50 text-white font-black text-xl placeholder-white/30" placeholder="0" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                    <div className="flex justify-between text-sm mb-2 font-bold">
                      <span className="text-indigo-100">Total Allocated</span>
                      <span className={leftToAllocate < 0 ? "text-rose-300" : "text-white"}>{totalBudgeted.toLocaleString()} {currency}</span>
                    </div>
                    <div role="progressbar" aria-label="Budget allocation progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(allocationPercent, 100)} className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${leftToAllocate < 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${Math.min(allocationPercent, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs mt-2 font-medium">
                      <span className="text-indigo-200">{leftToAllocate < 0 ? "Over Budget!" : "Left to Allocate"}</span>
                      <span className={leftToAllocate < 0 ? "text-rose-300 font-bold" : "text-emerald-300 font-bold"}>{leftToAllocate.toLocaleString()} {currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Family Envelopes */}
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-1"><Tags className="text-rose-500" size={20} /> Family Expenses</h3>
                <p className="text-xs text-gray-500 mb-4">Set limits for your household budgeting envelopes.</p>
                <div className="flex gap-2 mb-4">
                  <label htmlFor="newFamilyExp" className="sr-only">New family expense category</label>
                  <input id="newFamilyExp" type="text" placeholder="e.g., Rent" value={newFamilyExp} onChange={e => setNewFamilyExp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addFamilyExpense()} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 text-sm" />
                  <button type="button" onClick={addFamilyExpense} aria-label="Add family expense category" className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 p-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95"><Plus size={20} /></button>
                </div>
                <div className="space-y-3">
                  {familyExpenseCats.map((cat) => (
                    <div key={cat} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 gap-3">
                      <div className="font-bold text-gray-700 dark:text-gray-300 flex-1 pl-2">{cat}</div>
                      <div className="flex items-center gap-2">
                        <div className="relative w-full sm:w-40">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">{currency}</span>
                          <input type="number" aria-label={`Budget limit for ${cat}`} value={budgetLimits[cat] || ""} onChange={(e) => setBudgetLimits(prev => ({ ...prev, [cat]: Number(e.target.value) }))} placeholder="Limit" className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-9 pr-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-right" />
                        </div>
                        <button type="button" onClick={() => removeFamilyExpense(cat)} aria-label={`Remove ${cat}`} className="p-2 text-gray-400 hover:text-rose-500 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Family Incomes */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-4"><Tags className="text-emerald-500" size={20} /> Family Incomes</h3>
                <div className="flex gap-2 mb-4">
                  <label htmlFor="newFamilyInc" className="sr-only">New family income category</label>
                  <input id="newFamilyInc" type="text" placeholder="e.g., Salary" value={newFamilyInc} onChange={e => setNewFamilyInc(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(newFamilyInc, setFamilyIncomeCats, () => setNewFamilyInc(""))} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm" />
                  <button type="button" onClick={() => addItem(newFamilyInc, setFamilyIncomeCats, () => setNewFamilyInc(""))} aria-label="Add family income category" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"><Plus size={20} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {familyIncomeCats.map(cat => (
                    <div key={cat} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium border border-emerald-100 dark:border-emerald-800/50">
                      {cat} <button type="button" onClick={() => removeItem(cat, setFamilyIncomeCats)} aria-label={`Remove ${cat}`} className="text-emerald-400/50 hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 2. BUSINESS TAB */}
          {activeTab === "business" && (
            <div id="business-panel" role="tabpanel" aria-labelledby="tab-business" tabIndex={0} className="space-y-8 animate-in fade-in duration-300">
              
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-1"><Tags className="text-cyan-500" size={20} /> Business Expenses</h3>
                <p className="text-xs text-gray-500 mb-4">Keep your business overhead categorized perfectly.</p>
                <div className="flex gap-2 mb-4">
                  <label htmlFor="newBusinessExp" className="sr-only">New business expense category</label>
                  <input id="newBusinessExp" type="text" placeholder="e.g., Server Hosting" value={newBusinessExp} onChange={e => setNewBusinessExp(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(newBusinessExp, setBusinessExpenseCats, () => setNewBusinessExp(""))} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 text-sm" />
                  <button type="button" onClick={() => addItem(newBusinessExp, setBusinessExpenseCats, () => setNewBusinessExp(""))} aria-label="Add business expense category" className="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 p-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 active:scale-95"><Plus size={20} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {businessExpenseCats.map(cat => (
                    <div key={cat} className="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold border border-cyan-100 dark:border-cyan-800/50">
                      {cat} <button type="button" onClick={() => removeItem(cat, setBusinessExpenseCats)} aria-label={`Remove ${cat}`} className="text-cyan-400/50 hover:text-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-4"><Tags className="text-emerald-500" size={20} /> Business Incomes</h3>
                <div className="flex gap-2 mb-4">
                  <label htmlFor="newBusinessInc" className="sr-only">New business income category</label>
                  <input id="newBusinessInc" type="text" placeholder="e.g., Client Retainers" value={newBusinessInc} onChange={e => setNewBusinessInc(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(newBusinessInc, setBusinessIncomeCats, () => setNewBusinessInc(""))} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-sm" />
                  <button type="button" onClick={() => addItem(newBusinessInc, setBusinessIncomeCats, () => setNewBusinessInc(""))} aria-label="Add business income category" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"><Plus size={20} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {businessIncomeCats.map(cat => (
                    <div key={cat} className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold border border-emerald-100 dark:border-emerald-800/50">
                      {cat} <button type="button" onClick={() => removeItem(cat, setBusinessIncomeCats)} aria-label={`Remove ${cat}`} className="text-emerald-400/50 hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* 3. WALLETS TAB */}
          {activeTab === "wallets" && (
            <div id="wallets-panel" role="tabpanel" aria-labelledby="tab-wallets" tabIndex={0} className="space-y-6 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white mb-1"><Wallet className="text-blue-500" size={20} /> Custom Accounts</h3>
              <p className="text-xs text-gray-500 mb-4">Manage where your physical money sits.</p>
              <div className="flex gap-2 mb-4">
                <label htmlFor="newWallet" className="sr-only">New wallet account</label>
                <input id="newWallet" type="text" placeholder="e.g., KBZPay" value={newWallet} onChange={e => setNewWallet(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(newWallet, setWallets, () => setNewWallet(""))} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-sm" />
                <button type="button" onClick={() => addItem(newWallet, setWallets, () => setNewWallet(""))} aria-label="Add wallet account" className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 p-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95"><Plus size={20} /></button>
              </div>
              <div className="flex flex-col gap-2">
                {wallets.map(wallet => (
                  <div key={wallet} className="bg-gray-50 dark:bg-gray-800 px-4 py-3 rounded-xl flex items-center justify-between text-sm font-bold text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
                    {wallet} <button type="button" onClick={() => removeItem(wallet, setWallets)} aria-label={`Remove wallet ${wallet}`} className="text-gray-400 hover:text-rose-500 p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. DANGER TAB */}
          {activeTab === "danger" && (
            <div id="danger-panel" role="tabpanel" aria-labelledby="tab-danger" tabIndex={0} className="space-y-8 animate-in fade-in duration-300">
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-[1.5rem] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldCheck size={14} /> Device Identity</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">Logged in as: {myName}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md">
                  {myName.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 p-5 rounded-[1.5rem]">
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Key size={14} /> Vault Pairing Code
                </p>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
                  <span className="text-2xl font-black tracking-widest text-gray-900 dark:text-white font-mono">
                    {pairingCode || "------"}
                  </span>
                  <button 
                    type="button"
                    onClick={copyPairingCode}
                    aria-label={copied ? 'Pairing code copied' : 'Copy pairing code'}
                    className={`p-3 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white active:scale-95'}`}
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-3 font-medium px-1">
                  Share this code with family members to let them join this vault. They will also need your Vault PIN.
                </p>
              </div>

              {/* Members Management Section */}
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-100 dark:border-gray-800 p-5 rounded-[1.5rem] space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Users size={14} /> Vault Members
                </p>
                {isOwner && <p className="text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">Don&apos;t forget to Save Configuration after approving!</p>}
                
                <div className="space-y-3">
                  {members.length === 0 ? (
                    <p className="text-sm text-gray-400 italic py-2 text-center">No other members joined yet.</p>
                  ) : (
                    members.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${member.status === 'approved' ? 'bg-indigo-500' : 'bg-amber-500'}`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{member.name}</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${member.status === 'approved' ? 'text-indigo-500' : 'text-amber-500 animate-pulse'}`}>
                              {member.status}
                            </p>
                          </div>
                        </div>
                        
                        {isOwner && (
                          <div className="flex gap-2">
                            {member.status === 'pending' && (
                              <button 
                                type="button"
                                onClick={() => approveMember(member.name)}
                                aria-label={`Approve ${member.name}`}
                                className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95"
                                title="Approve Member"
                              >
                                <ShieldCheck size={18} />
                              </button>
                            )}
                            {member.name !== myName && (
                              <button 
                                type="button"
                                onClick={() => removeMember(member.name)}
                                aria-label={`Remove ${member.name}`}
                                className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95"
                                title="Remove Member"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Data Management Section */}
              <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-gray-100 dark:border-gray-800 p-5 rounded-[1.5rem] space-y-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Database size={14} /> Data Management
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      const txs = useVaultStore.getState().transactions;
                      exportToCSV(txs, `vault_transactions_${new Date().toISOString().split('T')[0]}`);
                      triggerHaptic('success');
                    }}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600">
                        <Download size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">Export Transactions</p>
                        <p className="text-[10px] text-gray-500">Download all data to CSV</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                {!showDisconnectConfirm ? (
                  <button type="button" onClick={() => setShowDisconnectConfirm(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/50 text-rose-500 font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 transition-all">
                    Disconnect Device
                  </button>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-900/20 p-6 rounded-[2rem] border border-rose-200 dark:border-rose-500/30 animate-in zoom-in-95 duration-200">
                    <h3 className="font-extrabold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2"><AlertTriangle size={20} /> Are you absolutely sure?</h3>
                    <p className="text-sm text-rose-600/80 dark:text-rose-300/80 mb-6 font-medium">This logs you out locally. Cloud data is safe.</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setShowDisconnectConfirm(false)} className="flex-1 py-3.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 border border-gray-200 dark:border-gray-700">Cancel</button>
                      <button type="button" onClick={handleDisconnect} className="flex-1 py-3.5 bg-rose-600 text-white font-bold rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95">Disconnect</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Master Save Button */}
        <button 
          type="button"
          onClick={handleSave} disabled={isSaving}
          aria-live="polite"
          className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 flex justify-center items-center gap-2 transform-gpu ${
            saveStatus === 'saved' 
              ? 'bg-emerald-500 shadow-emerald-500/20' 
              : activeTab === 'business' 
                ? 'bg-emerald-600 shadow-emerald-500/20' 
                : 'bg-indigo-600 shadow-indigo-500/20'
          }`}
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="animate-spin" size={20} />
          ) : saveStatus === 'saved' ? (
            <>
              <CheckCircle2 size={20} />
              Saved!
            </>
          ) : (
            <>
              <Save size={20} />
              Save Configuration
            </>
          )}
        </button>

      </div>
    </div>
  );
}