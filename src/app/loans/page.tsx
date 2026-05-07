"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, User, AlignLeft, CalendarClock, Percent, Trash2, AlertTriangle } from "lucide-react";

export default function LoansPage() {
  const [loans, setLoans] = useState<Array<{
    id: string;
    family_id: string;
    owner: string;
    counterparty_name: string;
    principal_amount: number;
    interest_rate: number;
    type: 'lent' | 'borrowed';
    notes: string;
    status: string;
    transaction_date: string;
    created_at: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [myName, setMyName] = useState("Me");
  const [viewTab, setViewTab] = useState<"me" | "partner">("me");

  // Form States
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [notes, setNotes] = useState("");
  const [hasInterest, setHasInterest] = useState(false);
  const [interestRate, setInterestRate] = useState("");
  const [datetime, setDatetime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [isSaving, setIsSaving] = useState(false);

  // Safety Confirmation State
  const [confirmDialog, setConfirmDialog] = useState<{ id: string, action: 'settle' | 'delete', title: string } | null>(null);

  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");
    const storedName = localStorage.getItem("my_name") || "Me";
    setMyName(storedName);

    if (familyId) {
      const { data, error } = await supabase.from('loans').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
      if (data && !error) setLoans(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLoans();
  }, [fetchLoans]);

  const handleAddLoan = async () => {
    if (!counterparty || !amount) return alert("Required fields missing.");
    const familyId = localStorage.getItem("family_id");
    
    setIsSaving(true);
    const payload = {
      family_id: familyId,
      owner: myName,
      counterparty_name: counterparty,
      principal_amount: Number(amount),
      interest_rate: hasInterest && interestRate ? Number(interestRate) : 0,
      type: type,
      notes: notes,
      status: "active",
      transaction_date: new Date(datetime).toISOString()
    };

    const { error } = await supabase.from('loans').insert([payload]);
    setIsSaving(false);

    if (!error) {
      setShowAddForm(false);
      setCounterparty(""); setAmount(""); setNotes(""); setHasInterest(false); setInterestRate("");
      fetchLoans();
    }
  };

  const executeAction = async () => {
    if (!confirmDialog) return;
    
    if (confirmDialog.action === 'settle') {
      await supabase.from('loans').update({ status: 'settled' }).eq('id', confirmDialog.id);
    } else if (confirmDialog.action === 'delete') {
      await supabase.from('loans').delete().eq('id', confirmDialog.id);
    }
    
    setConfirmDialog(null);
    fetchLoans();
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const activeLoans = loans.filter(l => l.status === 'active' && (viewTab === 'me' ? l.owner === myName : l.owner !== myName));
  const totalOwedToUs = activeLoans.filter(l => l.type === 'lent').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);
  const totalWeOwe = activeLoans.filter(l => l.type === 'borrowed').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
      {/* 2026 Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-rose-600" size={28} />
            </div>
            <h2 className="text-xl font-extrabold text-center mb-2">{confirmDialog.title}</h2>
            <p className="text-center text-gray-500 text-sm mb-6">This action cannot be undone. Are you sure you want to proceed?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white active:scale-95 transition-transform">Cancel</button>
              <button onClick={executeAction} className="flex-1 py-3 font-bold rounded-xl bg-rose-600 text-white active:scale-95 transition-transform">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 md:px-8 max-w-3xl mx-auto pt-4 space-y-6">
        <div className="flex justify-between items-end">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Debts</h1>
          <button onClick={() => setShowAddForm(!showAddForm)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform">
            {showAddForm ? "Cancel" : <><Plus size={18} /> New</>}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-2xl">
          <button onClick={() => setViewTab("me")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${viewTab === 'me' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>My Records</button>
          <button onClick={() => setViewTab("partner")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${viewTab === 'partner' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Partner&apos;s</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-3xl">
            <p className="text-emerald-600 dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><ArrowUpRight size={14}/> To Receive</p>
            <p className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-1">{totalOwedToUs.toLocaleString()} Ks</p>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-500/20 p-4 rounded-3xl">
            <p className="text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><ArrowDownRight size={14}/> To Pay</p>
            <p className="text-xl font-black text-rose-900 dark:text-rose-100 mt-1">{totalWeOwe.toLocaleString()} Ks</p>
          </div>
        </div>

        {showAddForm && (
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-4">
              <button onClick={() => setType("lent")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${type === 'lent' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'text-gray-500'}`}>I Lent</button>
              <button onClick={() => setType("borrowed")} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${type === 'borrowed' ? 'bg-white dark:bg-gray-700 shadow-sm text-rose-600' : 'text-gray-500'}`}>I Borrowed</button>
            </div>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Counterparty Name" value={counterparty} onChange={e => setCounterparty(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Ks</span>
                <input type="number" placeholder="Principal Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none" />
              </div>

              {/* iOS Style Interest Toggle */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Apply Interest Rate?</span>
                <button 
                  onClick={() => setHasInterest(!hasInterest)} 
                  className={`w-12 h-6 rounded-full transition-colors relative ${hasInterest ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${hasInterest ? 'translate-x-6.5 left-0.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Conditional Interest Input */}
              {hasInterest && (
                <div className="relative animate-in slide-in-from-top-2">
                  <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="number" placeholder="Interest %" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/30 rounded-xl py-3 pl-12 pr-4 outline-none text-indigo-700 dark:text-indigo-300" />
                </div>
              )}

              <div className="relative">
                <CalendarClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none text-sm" />
              </div>
              <div className="relative">
                <AlignLeft className="absolute left-4 top-4 text-gray-400" size={18} />
                <textarea placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none resize-none" rows={2} />
              </div>
              <button onClick={handleAddLoan} disabled={isSaving} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform flex justify-center">
                {isSaving ? <Loader2 className="animate-spin" /> : "Save Record"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {activeLoans.map(loan => (
            <div key={loan.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm group">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${loan.type === 'lent' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                  {loan.type === 'lent' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{loan.counterparty_name}</h3>
                  <p className="text-[10px] text-gray-500">
                    {new Date(loan.transaction_date).toLocaleDateString()} 
                    {loan.interest_rate > 0 && <span className="text-indigo-500 font-bold ml-1">({loan.interest_rate}% Int)</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-black ${loan.type === 'lent' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {Number(loan.principal_amount).toLocaleString()}
                </span>
                
                {/* Actions: Settle and Delete */}
                <div className="flex flex-col gap-1">
                  <button onClick={() => setConfirmDialog({ id: loan.id, action: 'settle', title: 'Settle Debt?' })} className="text-gray-300 hover:text-emerald-500 transition-colors p-1" title="Mark Settled">
                    <CheckCircle2 size={20} />
                  </button>
                  <button onClick={() => setConfirmDialog({ id: loan.id, action: 'delete', title: 'Delete Record?' })} className="text-gray-300 hover:text-rose-500 transition-colors p-1" title="Delete Record">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}