"use client";

import Providers from './Providers';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { useEffect, useState } from 'react';
import { Lock, AlertTriangle, Shield, Key, Users, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type AppState = "loading" | "unpaired" | "create_vault" | "join_vault" | "show_code" | "locked" | "unlocked";

export default function ClientWrapper({ children }: { children: React.ReactNode; }) {
  const [appState, setAppState] = useState<AppState>("loading");
  const [familyId, setFamilyId] = useState<string | null>(null);
  
  // Form States
  const [userName, setUserName] = useState("");
  const [vaultName, setVaultName] = useState("Holy Moly Family");
  const [pinInput, setPinInput] = useState("");
  const [pairingCodeInput, setPairingCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Lockout States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    // 1. Check if device is already paired to a vault
    const savedFamilyId = localStorage.getItem("family_id");
    const savedName = localStorage.getItem("my_name");
    const unlockedUntil = localStorage.getItem("vault_unlocked_until");
    
    if (savedName) setUserName(savedName);

    if (savedFamilyId) {
      setFamilyId(savedFamilyId);
      
      // NEW: Check if the 7-day session is still valid
      if (unlockedUntil && parseInt(unlockedUntil) > Date.now()) {
        setAppState("unlocked"); // Skip PIN!
      } else {
        setAppState("locked"); // Session expired, ask for PIN
      }
    } else {
      setAppState("unpaired");
    }
  }, []);

  // Handle Lockout Timer
  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = lockoutTime - now;
      if (diff <= 0) {
        setLockoutTime(null);
        localStorage.removeItem("pin_failed_attempts");
        localStorage.removeItem("pin_lockout_time");
        setFailedAttempts(0);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  const generatePairingCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateVault = async () => {
    if (!userName.trim() || pinInput.length < 4) return alert("Enter your name and a 4+ digit PIN.");
    setIsLoading(true);

    const code = generatePairingCode();
    
    const { data, error } = await supabase
      .from('families')
      .insert([{ family_name: vaultName, pairing_code: code, vault_pin: pinInput }])
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      alert("Failed to create vault. Check connection.");
      console.error(error);
      return;
    }

    // Save to local storage
    localStorage.setItem("family_id", data.id);
    localStorage.setItem("my_name", userName.trim());
    localStorage.setItem("my_setup_complete", "true");
    
    setFamilyId(data.id);
    setGeneratedCode(code);
    setAppState("show_code");
  };

  const handleJoinVault = async () => {
    if (!userName.trim() || !pairingCodeInput || !pinInput) return alert("Fill in all fields.");
    setIsLoading(true);

    // Find the vault by pairing code AND verify PIN instantly
    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('pairing_code', pairingCodeInput.toUpperCase())
      .eq('vault_pin', pinInput)
      .single();

    setIsLoading(false);

    if (error || !data) {
      alert("Invalid Pairing Code or PIN.");
      return;
    }

    // Success! Link device
    localStorage.setItem("family_id", data.id);
    localStorage.setItem("my_name", userName.trim());
    localStorage.setItem("my_setup_complete", "true");
    
    setFamilyId(data.id);
    setAppState("unlocked"); // Skip lock screen since they just entered the PIN
  };

  const handleUnlock = async () => {
    if (lockoutTime) return;
    setIsLoading(true);

    const { data, error } = await supabase
      .from('families')
      .select('id')
      .eq('id', familyId)
      .eq('vault_pin', pinInput)
      .single();

    setIsLoading(false);

    if (data && !error) {
      localStorage.removeItem("pin_failed_attempts");
      setFailedAttempts(0);
      setPinInput("");
      
      // NEW: Keep unlocked for 7 days (7 * 24 * 60 * 60 * 1000 milliseconds)
      localStorage.setItem("vault_unlocked_until", (Date.now() + 604800000).toString());
      
      setAppState("unlocked");
    } else {
      // Incorrect PIN - increment failed attempts
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 3) {
        // Lock for 1 hour
        const lockUntil = Date.now() + 3600000;
        setLockoutTime(lockUntil);
        localStorage.setItem("pin_lockout_time", lockUntil.toString());
      }

      localStorage.setItem("pin_failed_attempts", newFailedAttempts.toString());
    }
  };

  if (appState === "loading") return <div className="min-h-screen bg-gray-900 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;

  if (appState === "unpaired") {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6"><Shield size={48} className="text-indigo-600" /></div>
          <h1 className="text-3xl font-bold mb-2 text-center text-gray-900 dark:text-white">Family Vault</h1>
          <p className="text-gray-500 text-center text-sm mb-8">Secure your family's financial data. Create a new vault or connect to your partner's.</p>
          
          <div className="space-y-4">
            <button onClick={() => setAppState("create_vault")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
              <Key size={20} /> Create New Vault
            </button>
            <button onClick={() => setAppState("join_vault")} className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
              <Users size={20} /> Join Existing Vault
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === "create_vault") {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create Vault</h1>
          <div className="space-y-4 mb-8">
            <input type="text" placeholder="Your Name (e.g. Aung)" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="text" placeholder="Vault Name" value={vaultName} onChange={(e) => setVaultName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="password" placeholder="Set Master PIN (4+ digits)" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleCreateVault} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : "Create & Generate Code"}
          </button>
          <button onClick={() => setAppState("unpaired")} className="w-full mt-4 text-gray-500 text-sm font-bold py-2">Back</button>
        </div>
      </div>
    );
  }

  if (appState === "show_code") {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl text-center">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Vault Created!</h1>
          <p className="text-gray-500 mb-6">Share this exact code with your partner so they can link their device.</p>
          <div className="bg-gray-100 dark:bg-gray-900 py-6 rounded-2xl mb-8 border-2 border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-4xl font-mono font-bold text-indigo-600 tracking-[0.2em]">{generatedCode}</p>
          </div>
          <button onClick={() => setAppState("unlocked")} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2">
            Enter App <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (appState === "join_vault") {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Join Vault</h1>
          <div className="space-y-4 mb-8">
            <input type="text" placeholder="Your Name (e.g. Paing)" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="text" placeholder="6-Character Pairing Code" value={pairingCodeInput} onChange={(e) => setPairingCodeInput(e.target.value)} className="w-full uppercase p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500" />
            <input type="password" placeholder="Master Vault PIN" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button onClick={handleJoinVault} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2">
            {isLoading ? <Loader2 className="animate-spin" /> : "Link Device"}
          </button>
          <button onClick={() => setAppState("unpaired")} className="w-full mt-4 text-gray-500 text-sm font-bold py-2">Back</button>
        </div>
      </div>
    );
  }

  if (appState === "locked") {
    return (
      <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center p-4 z-50">
        <div className="bg-gray-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center">
          {lockoutTime ? (
            <>
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-500">Vault Locked</h1>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl w-full text-center mt-4">
                <p className="text-xs text-red-400 font-bold uppercase mb-1">Try again in</p>
                <p className="text-2xl font-mono font-bold text-red-500">{timeLeft}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                <Lock size={32} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Vault Locked</h1>
              <p className="text-gray-400 text-center text-sm mb-8">Welcome back, {userName}.</p>
              <input
                type="password"
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="w-full text-center text-2xl tracking-[0.5em] mb-4 p-4 rounded-xl border-none bg-gray-900 text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {failedAttempts > 0 && <p className="text-rose-500 text-xs mb-6 font-medium">{3 - failedAttempts} attempts remaining</p>}
              <button onClick={handleUnlock} disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center">
                {isLoading ? <Loader2 className="animate-spin" /> : "Unlock"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // If unlocked, render the main app layout
  return (
    <Providers>
      <div className="flex min-h-screen w-full">
        <BottomNav />
        <div className="flex-1 flex flex-col md:ml-24 min-w-0 min-h-screen bg-white dark:bg-gray-950">
          <TopBar />
          <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}