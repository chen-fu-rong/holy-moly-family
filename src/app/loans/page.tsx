"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, User, AlignLeft, CalendarClock } from "lucide-react";

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [myName, setMyName] = useState("Me");
  const [viewTab, setViewTab] = useState<"me" | "partner">("me");

  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [notes, setNotes] = useState("");
  const [datetime, setDatetime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [isSaving, setIsSaving] = useState(false);

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

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

  const handleAddLoan = async () => {
    if (!counterparty || !amount) return alert("Required fields missing.");
    const familyId = localStorage.getItem("family_id");
    
    setIsSaving(true);
    const payload = {
      family_id: familyId,
      owner: myName,
      counterparty_name: counterparty,
      principal_amount: Number(amount),
      type: type,
      notes: notes,
      status: "active",
      transaction_date: new Date(datetime).toISOString()
    };

    const { error } = await supabase.from('loans').insert([payload]);
    setIsSaving(false);

    if (!error) {
      setShowAddForm(false);
      setCounterparty(""); setAmount(""); setNotes("");
      fetchLoans();
    }
  };

  const markAsSettled = async (id: string) => {
    await supabase.from('loans').update({ status: 'settled' }).eq('id', id);
    fetchLoans();
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const activeLoans = loans.filter(l => l.status === 'active' && (viewTab === 'me' ? l.owner === myName : l.owner !== myName));
  const totalOwedToUs = activeLoans.filter(l => l.type === 'lent').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);
  const totalWeOwe = activeLoans.filter(l => l.type === 'borrowed').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
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
          <button onClick={() => setViewTab("partner")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${viewTab === 'partner' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'}`}>Partner's</button>
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
                <input type="text" placeholder="Person's Name" value={counterparty} onChange={e => setCounterparty(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none" />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Ks</span>
                <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none" />
              </div>
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
            <div key={loan.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${loan.type === 'lent' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                  {loan.type === 'lent' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{loan.counterparty_name}</h3>
                  <p className="text-[10px] text-gray-500">{new Date(loan.transaction_date).toLocaleDateString()} {loan.notes && `• ${loan.notes}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-black ${loan.type === 'lent' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {Number(loan.principal_amount).toLocaleString()}
                </span>
                <button onClick={() => markAsSettled(loan.id)} className="text-gray-300 hover:text-indigo-500 transition-colors">
                  <CheckCircle2 size={24} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}