"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, X, Save, Wallet, Tags, Building } from "lucide-react";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [vaultName, setVaultName] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  
  // Arrays for our settings
  const [expenseCats, setExpenseCats] = useState<string[]>([]);
  const [incomeCats, setIncomeCats] = useState<string[]>([]);
  const [wallets, setWallets] = useState<string[]>([]);

  // Inputs for adding new items
  const [newExp, setNewExp] = useState("");
  const [newInc, setNewInc] = useState("");
  const [newWallet, setNewWallet] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");
    
    // Load local wallets
    const savedAccs = localStorage.getItem("custom_accounts");
    if (savedAccs) setWallets(JSON.parse(savedAccs));
    else setWallets(["💵 Cash", "🔵 KBZPay", "🌊 WavePay", "🏦 Bank Transfer"]);

    // Load Vault categories
    if (familyId) {
      const { data, error } = await supabase
        .from('families')
        .select('family_name, pairing_code, expense_categories, income_categories')
        .eq('id', familyId)
        .single();
        
      if (data && !error) {
        setVaultName(data.family_name);
        setPairingCode(data.pairing_code);
        setExpenseCats(data.expense_categories || []);
        setIncomeCats(data.income_categories || []);
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const familyId = localStorage.getItem("family_id");
    
    // 1. Save wallets locally
    localStorage.setItem("custom_accounts", JSON.stringify(wallets));

    // 2. Save categories to Supabase Vault
    if (familyId) {
      const { error } = await supabase
        .from('families')
        .update({
          expense_categories: expenseCats,
          income_categories: incomeCats
        })
        .eq('id', familyId);

      if (error) {
        alert("Failed to sync settings to the Vault.");
        console.error(error);
      } else {
        alert("Settings saved successfully!");
      }
    }
    setIsSaving(false);
  };

  // Helper functions to add/remove items from arrays
  const addItem = (item: string, setArray: any, setNewItem: any) => {
    if (!item.trim()) return;
    setArray((prev: string[]) => [...prev, item.trim()]);
    setNewItem("");
  };

  const removeItem = (indexToRemove: number, setArray: any) => {
    setArray((prev: string[]) => prev.filter((_, index) => index !== indexToRemove));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-end border-b dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your vault preferences</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save 
        </button>
      </div>

      {/* Vault Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 p-5 rounded-3xl flex items-center gap-4">
        <div className="bg-indigo-100 dark:bg-indigo-800 p-3 rounded-2xl text-indigo-600 dark:text-indigo-300">
          <Building size={24} />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Active Vault</p>
          <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{vaultName}</h2>
          <p className="text-sm text-indigo-600/80 dark:text-indigo-400 mt-1">Pairing Code: <span className="font-mono font-bold tracking-widest">{pairingCode}</span></p>
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Tags size={20} className="text-rose-500" /> Expense Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {expenseCats.map((cat, idx) => (
            <div key={idx} className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
              {cat}
              <button onClick={() => removeItem(idx, setExpenseCats)} className="text-gray-400 hover:text-rose-500 transition-colors"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newExp} onChange={(e) => setNewExp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem(newExp, setExpenseCats, setNewExp)} placeholder="New expense category..." className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={() => addItem(newExp, setExpenseCats, setNewExp)} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2.5 rounded-xl"><Plus size={18} /></button>
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Tags size={20} className="text-emerald-500" /> Income Categories</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {incomeCats.map((cat, idx) => (
            <div key={idx} className="bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium">
              {cat}
              <button onClick={() => removeItem(idx, setIncomeCats)} className="text-gray-400 hover:text-rose-500 transition-colors"><X size={14} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newInc} onChange={(e) => setNewInc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem(newInc, setIncomeCats, setNewInc)} placeholder="New income category..." className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={() => addItem(newInc, setIncomeCats, setNewInc)} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2.5 rounded-xl"><Plus size={18} /></button>
        </div>
      </div>

      {/* Wallets / Accounts */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Wallet size={20} className="text-blue-500" /> My Wallets & Accounts</h2>
        <p className="text-xs text-gray-500 mb-4">Note: Wallets are saved locally to this device.</p>
        <div className="flex flex-col gap-2 mb-4">
          {wallets.map((wallet, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-xl flex justify-between items-center text-sm font-bold">
              {wallet}
              <button onClick={() => removeItem(idx, setWallets)} className="text-gray-400 hover:text-rose-500 transition-colors bg-white dark:bg-gray-900 p-1.5 rounded-lg shadow-sm"><X size={16} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newWallet} onChange={(e) => setNewWallet(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addItem(newWallet, setWallets, setNewWallet)} placeholder="Add new wallet (e.g. 🏦 Yoma Bank)" className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={() => addItem(newWallet, setWallets, setNewWallet)} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 p-2.5 rounded-xl"><Plus size={18} /></button>
        </div>
      </div>

      {/* Buffer for bottom nav */}
      <div className="h-10"></div>
    </div>
  );
}