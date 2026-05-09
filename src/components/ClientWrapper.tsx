"use client";

import Providers from './Providers';
import BottomNav from './BottomNav';
import AddModal from './AddModal';
import { useEffect, useState } from 'react';
import { Lock, AlertTriangle, Shield, Key, Users, ArrowRight, Loader2, CheckCircle, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useVaultStore } from '@/lib/store';
import { toast } from 'sonner';

type AppState = "loading" | "unpaired" | "create_vault" | "join_vault" | "show_code" | "pending_approval" | "locked" | "unlocked";

// Helper for Auth Screen Backgrounds
const AuthBackground = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu">
    <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] rounded-full bg-indigo-400/20 dark:bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
    <div className="absolute top-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-fuchsia-400/20 dark:bg-fuchsia-500/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
  </div>
);

export default function ClientWrapper({ children }: { children: React.ReactNode; }) {
  const [appState, setAppState] = useState<AppState>("loading");
  const [isVisualFeedback, setIsVisualFeedback] = useState(false);

  useEffect(() => {
    const handleVisualHaptic = (e: any) => {
      const style = e.detail?.style;
      setIsVisualFeedback(true);
      setTimeout(() => setIsVisualFeedback(false), style === 'heavy' ? 150 : 80);
    };

    window.addEventListener('visual-haptic', handleVisualHaptic);
    return () => window.removeEventListener('visual-haptic', handleVisualHaptic);
  }, []);

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

  // Global Modal State for the floating '+' button
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetchVaultData = useVaultStore(state => state.fetchVaultData);
  const setOwner = useVaultStore(state => state.setOwner);

  useEffect(() => {
    // 1. Check if device is already paired to a vault
    const savedFamilyId = localStorage.getItem("family_id");
    const savedName = localStorage.getItem("my_name");
    const unlockedUntil = localStorage.getItem("vault_unlocked_until");
    const isOwnerStored = localStorage.getItem("is_vault_owner") === "true";
    
    setOwner(isOwnerStored);

    if (savedName) setUserName(savedName);

    if (savedFamilyId) {
      setFamilyId(savedFamilyId);
      
      // Check approval status first
      const verifyAccess = async () => {
        const { data } = await supabase
          .from('families')
          .select('members')
          .eq('id', savedFamilyId)
          .single();
        
        if (data?.members) {
          const myRecord = data.members.find((m: any) => m.name === savedName);
          if (myRecord?.status === 'approved') {
            if (unlockedUntil && parseInt(unlockedUntil) > Date.now()) {
              setAppState("unlocked");
              fetchVaultData(savedFamilyId);
            } else {
              setAppState("locked");
            }
          } else {
            setAppState("pending_approval");
          }
        } else {
          // If no members field exists yet, assume legacy vault and let them in
          if (unlockedUntil && parseInt(unlockedUntil) > Date.now()) {
            setAppState("unlocked");
            fetchVaultData(savedFamilyId);
          } else {
            setAppState("locked");
          }
        }
      };

      verifyAccess();

      // Real-time listener for this vault
      const channel = supabase.channel(`vault-${savedFamilyId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `family_id=eq.${savedFamilyId}` }, () => {
          useVaultStore.getState().syncTransactions(savedFamilyId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'loans', filter: `family_id=eq.${savedFamilyId}` }, () => {
          useVaultStore.getState().syncLoans(savedFamilyId);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_goals', filter: `family_id=eq.${savedFamilyId}` }, () => {
          useVaultStore.getState().syncSavings(savedFamilyId);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    } else {
      setAppState("unpaired");
    }

    // 2. Setup Global Add Modal Listener
    const handleOpenModal = () => setIsModalOpen(true);
    window.addEventListener("open-add-modal", handleOpenModal);
    return () => window.removeEventListener("open-add-modal", handleOpenModal);
  }, [fetchVaultData, setOwner]);

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
    if (!userName.trim() || pinInput.length < 4) return toast.error("Enter your name and a 4+ digit PIN.");
    setIsLoading(true);

    const code = generatePairingCode();
    
    const { data, error } = await supabase
      .from('families')
      .insert([{ 
        family_name: vaultName, 
        pairing_code: code, 
        vault_pin: pinInput,
        members: [{ name: userName.trim(), status: 'approved' }]
      }])
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      toast.error("Failed to create vault. Check connection.");
      console.error(error);
      return;
    }

    localStorage.setItem("family_id", data.id);
    // Add this line inside handleCreateVault:
    localStorage.setItem("is_vault_owner", "true");
    localStorage.setItem("my_name", userName.trim());
    localStorage.setItem("my_setup_complete", "true");
    localStorage.setItem("vault_unlocked_until", (Date.now() + 604800000).toString());
    
    setFamilyId(data.id);
    setGeneratedCode(code);
    setAppState("show_code");
  };

  const checkApprovalStatus = async () => {
    const savedFamilyId = localStorage.getItem("family_id");
    const savedName = localStorage.getItem("my_name");
    if (!savedFamilyId || !savedName) return;

    setIsLoading(true);
    const { data } = await supabase
      .from('families')
      .select('members')
      .eq('id', savedFamilyId)
      .single();
    setIsLoading(false);

    if (data?.members) {
      const myRecord = data.members.find((m: any) => m.name === savedName);
      if (myRecord?.status === 'approved') {
        localStorage.setItem("vault_unlocked_until", (Date.now() + 604800000).toString());
        setAppState("unlocked");
      } else {
        toast.info("Still waiting for approval.");
      }
    }
  };

  const handleJoinVault = async () => {
    if (!userName.trim() || !pairingCodeInput || !pinInput) return toast.error("Fill in all fields.");
    setIsLoading(true);

    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('pairing_code', pairingCodeInput.toUpperCase())
      .eq('vault_pin', pinInput)
      .single();

    setIsLoading(false);

    if (error || !data) {
      toast.error("Invalid Pairing Code or PIN.");
      return;
    }

    // Add member to pending list
    const currentMembers = data.members || [];
    const isAlreadyMember = currentMembers.some((m: any) => m.name === userName.trim());
    
    if (!isAlreadyMember) {
      const updatedMembers = [...currentMembers, { name: userName.trim(), status: 'pending' }];
      await supabase
        .from('families')
        .update({ members: updatedMembers })
        .eq('id', data.id);
    }

    localStorage.setItem("family_id", data.id);
    localStorage.setItem("my_name", userName.trim());
    localStorage.setItem("my_setup_complete", "true");
    
    // Check if approved immediately (in case they rejoin)
    const myMemberRecord = currentMembers.find((m: any) => m.name === userName.trim());
    if (myMemberRecord?.status === 'approved') {
      localStorage.setItem("vault_unlocked_until", (Date.now() + 604800000).toString());
      setFamilyId(data.id);
      setAppState("unlocked");
    } else {
      setAppState("pending_approval");
    }
  };

  const handleUnlock = async () => {
    if (lockoutTime) return;
    setIsLoading(true);

    const code = generatePairingCode();
    
    // Define the perfect starter kit
    const defaultExpenses = ['Groceries', 'Transport', 'Utilities', 'Dining Out', 'Shopping'];
    const defaultIncomes = ['Salary', 'Business', 'Freelance'];
    const defaultBudgets = { 'Groceries': 0, 'Transport': 0, 'Utilities': 0, 'Dining Out': 0, 'Shopping': 0 };

    const { data, error } = await supabase
      .from('families')
      .insert([{ 
        family_name: vaultName, 
        pairing_code: code, 
        vault_pin: pinInput,
        expense_categories: defaultExpenses,
        income_categories: defaultIncomes,
        budget_limits: defaultBudgets
      }])
      .select()
      .single();

    setIsLoading(false);

    if (data && !error) {
      localStorage.removeItem("pin_failed_attempts");
      setFailedAttempts(0);
      setPinInput("");
      localStorage.setItem("vault_unlocked_until", (Date.now() + 604800000).toString());
      setAppState("unlocked");
    } else {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);

      if (newFailedAttempts >= 3) {
        const lockUntil = Date.now() + 3600000;
        setLockoutTime(lockUntil);
        localStorage.setItem("pin_lockout_time", lockUntil.toString());
      }

      localStorage.setItem("pin_failed_attempts", newFailedAttempts.toString());
    }
  };

  // UI: Loading
  if (appState === "loading") {
    return <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>;
  }

  // UI: Setup Required
  if (appState === "unpaired") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <AuthBackground />
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-white/50 dark:border-gray-800 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield size={36} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-900 dark:text-white">Family Vault</h1>
          <p className="text-gray-500 text-center text-sm mb-8 font-medium">Secure your financial data. Create a new vault or connect to a partner.</p>
          
          <div className="space-y-4">
            <button onClick={() => setAppState("create_vault")} className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:scale-[1.02] active:scale-95 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform-gpu shadow-md">
              <Key size={20} /> Create New Vault
            </button>
            <button onClick={() => setAppState("join_vault")} className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 text-gray-900 dark:text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all transform-gpu shadow-sm">
              <Users size={20} /> Join Existing Vault
            </button>
          </div>
        </div>
      </div>
    );
  }

  // UI: Create Vault
  if (appState === "create_vault") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <AuthBackground />
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-white/50 dark:border-gray-800 animate-in zoom-in-95 duration-300">
          <h1 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white">Create Vault</h1>
          <div className="space-y-4 mb-8">
            <input type="text" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <input type="text" placeholder="Vault Name" value={vaultName} onChange={(e) => setVaultName(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <input type="password" placeholder="Set Master PIN (4+ digits)" inputMode="numeric" pattern="[0-9]*" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <button onClick={handleCreateVault} disabled={isLoading} className="w-full bg-indigo-600 active:scale-95 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-transform transform-gpu shadow-md">
            {isLoading ? <Loader2 className="animate-spin" /> : "Create & Generate Code"}
          </button>
          <button onClick={() => setAppState("unpaired")} className="w-full mt-4 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm font-bold py-2 transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

  // UI: Show Generated Code
  if (appState === "show_code") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <AuthBackground />
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-white/50 dark:border-gray-800 animate-in zoom-in-95 duration-300 text-center">
          <CheckCircle size={56} className="text-emerald-500 mx-auto mb-6 drop-shadow-md" />
          <h1 className="text-2xl font-extrabold mb-2 text-gray-900 dark:text-white">Vault Created!</h1>
          <p className="text-gray-500 mb-6 font-medium text-sm">Share this exact code with your partner to link their device.</p>
          <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm py-6 rounded-2xl mb-8 border border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-4xl font-mono font-black text-indigo-600 tracking-[0.2em]">{generatedCode}</p>
          </div>
          <button onClick={() => setAppState("unlocked")} className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 active:scale-95 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-transform transform-gpu shadow-md">
            Enter App <ArrowRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // UI: Pending Approval
  if (appState === "pending_approval") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4 text-center">
        <AuthBackground />
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-white/50 dark:border-gray-800 animate-in zoom-in-95 duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shadow-lg">
              <Shield size={36} className="text-amber-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold mb-2 text-gray-900 dark:text-white">Waiting for Approval</h1>
          <p className="text-gray-500 mb-8 font-medium">Your request to join has been sent to the Vault Owner. Please ask them to approve you in their Settings page.</p>
          
          <div className="space-y-4">
            <button 
              onClick={checkApprovalStatus}
              disabled={isLoading}
              className="w-full bg-indigo-600 active:scale-95 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-all shadow-md"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> I&apos;m Approved Now</>}
            </button>
            <button 
              onClick={() => { localStorage.clear(); setAppState("unpaired"); }}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold py-4 rounded-2xl active:scale-95 transition-all"
            >
              Cancel & Start Over
            </button>
          </div>
        </div>
      </div>
    );
  }

  // UI: Join Vault
  if (appState === "join_vault") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <AuthBackground />
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-white/50 dark:border-gray-800 animate-in zoom-in-95 duration-300">
          <h1 className="text-2xl font-extrabold mb-6 text-gray-900 dark:text-white">Join Vault</h1>
          <div className="space-y-4 mb-8">
            <input type="text" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <input type="text" placeholder="6-Character Pairing Code" value={pairingCodeInput} onChange={(e) => setPairingCodeInput(e.target.value)} className="w-full uppercase p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 dark:text-white font-mono tracking-widest outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <input type="password" placeholder="Master Vault PIN" inputMode="numeric" pattern="[0-9]*" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
          </div>
          <button onClick={handleJoinVault} disabled={isLoading} className="w-full bg-indigo-600 active:scale-95 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-2 transition-transform transform-gpu shadow-md">
            {isLoading ? <Loader2 className="animate-spin" /> : "Link Device"}
          </button>
          <button onClick={() => setAppState("unpaired")} className="w-full mt-4 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm font-bold py-2 transition-colors">Go Back</button>
        </div>
      </div>
    );
  }

  // UI: PIN Locked
  if (appState === "locked") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4">
        <AuthBackground />
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-white/50 dark:border-gray-800 animate-in zoom-in-95 duration-300 flex flex-col items-center">
          {lockoutTime ? (
            <>
              <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={36} className="text-rose-500" />
              </div>
              <h1 className="text-2xl font-extrabold mb-2 text-rose-500">Vault Locked</h1>
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl w-full text-center mt-4">
                <p className="text-xs text-rose-500 font-bold uppercase mb-1">Try again in</p>
                <p className="text-3xl font-mono font-black text-rose-600">{timeLeft}</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30">
                <Lock size={36} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold mb-2 text-gray-900 dark:text-white">Vault Locked</h1>
              <p className="text-gray-500 text-center text-sm mb-8 font-medium">Welcome back, {userName}.</p>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="PIN"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                className="w-full text-center text-3xl tracking-[0.5em] font-black mb-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              {failedAttempts > 0 && <p className="text-rose-500 text-xs mb-6 font-bold">{3 - failedAttempts} attempts remaining</p>}
              <button onClick={handleUnlock} disabled={isLoading} className="w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-transform transform-gpu shadow-md flex justify-center items-center">
                {isLoading ? <Loader2 className="animate-spin" /> : "Unlock"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // UNLOCKED STATE (The actual app)
  return (
    <Providers>
      {/* iOS Haptic Fallback Overlay */}
      {isVisualFeedback && (
        <div className="fixed inset-0 z-[100] pointer-events-none bg-white/10 dark:bg-white/5 animate-in fade-in duration-75 mix-blend-overlay" />
      )}
      
      <div className={`flex flex-col md:flex-row min-h-[100dvh] w-full [-webkit-tap-highlight-color:transparent] transition-transform duration-75 ${isVisualFeedback ? 'scale-[0.995]' : 'scale-100'}`}>
        <BottomNav />
        {/* TopBar completely removed to reclaim screen real estate */}
        <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh] bg-transparent">
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </div>
      
      {/* Global Add Modal handles all '+' button clicks */}
      <AddModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </Providers>
  );
}