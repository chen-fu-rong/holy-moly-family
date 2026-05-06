"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, ArrowUpRight, ArrowDownRight, CheckCircle2, User, AlignLeft } from "lucide-react";

export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Loan Form States
  const [counterparty, setCounterparty] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");
    if (!familyId) return;

    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });

    if (data && !error) setLoans(data);
    setIsLoading(false);
  };

  const handleAddLoan = async () => {
    if (!counterparty || !amount) return alert("Name and amount are required.");
    const familyId = localStorage.getItem("family_id");
    
    setIsSaving(true);
    const payload = {
      family_id: familyId,
      counterparty_name: counterparty,
      principal_amount: Number(amount),
      type: type,
      notes: notes,
      status: "active"
    };

    const { error } = await supabase.from('loans').insert([payload]);
    setIsSaving(false);

    if (!error) {
      setShowAddForm(false);
      setCounterparty("");
      setAmount("");
      setNotes("");
      fetchLoans(); // Refresh list
    } else {
      alert("Failed to save loan.");
    }
  };

  const markAsSettled = async (id: string) => {
    const { error } = await supabase.from('loans').update({ status: 'settled' }).eq('id', id);
    if (!error) fetchLoans(); // Refresh list
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const activeLoans = loans.filter(l => l.status === 'active');
  const settledLoans = loans.filter(l => l.status === 'settled');

  const totalOwedToUs = activeLoans.filter(l => l.type === 'lent').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);
  const totalWeOwe = activeLoans.filter(l => l.type === 'borrowed').reduce((acc, curr) => acc + Number(curr.principal_amount), 0);

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      <div className="flex justify-between items-end border-b dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold">Loans & Debt</h1>
          <p className="text-gray-500 text-sm mt-1">Track money owed to and from the family vault.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          {showAddForm ? "Cancel" : <><Plus size={18} /> New</>}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/20 p-5 rounded-3xl">
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-1"><ArrowUpRight size={16}/> Owed to us</p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{totalOwedToUs.toLocaleString()} Ks</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-500/20 p-5 rounded-3xl">
          <p className="text-rose-600 dark:text-rose-400 text-sm font-bold flex items-center gap-1"><ArrowDownRight size={16}/> We owe</p>
          <p className="text-2xl font-bold text-rose-900 dark:text-rose-100 mt-1">{totalWeOwe.toLocaleString()} Ks</p>
        </div>
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg">
          <h2 className="font-bold text-lg mb-4">Add a Debt Record</h2>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-4">
            <button onClick={() => setType("lent")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'lent' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'text-gray-500'}`}>I lent money</button>
            <button onClick={() => setType("borrowed")} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${type === 'borrowed' ? 'bg-white dark:bg-gray-700 shadow-sm text-rose-600' : 'text-gray-500'}`}>I borrowed money</button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Person's Name" value={counterparty} onChange={e => setCounterparty(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Ks</span>
              <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-gray-400" size={18} />
              <textarea placeholder="Notes (e.g., Dinner, Rent)" value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" rows={2} />
            </div>
            <button onClick={handleAddLoan} disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center">
              {isSaving ? <Loader2 className="animate-spin" /> : "Save Record"}
            </button>
          </div>
        </div>
      )}

      {/* Active Loans List */}
      <div>
        <h2 className="text-lg font-bold mb-4">Active Records</h2>
        {activeLoans.length === 0 ? (
          <p className="text-gray-500 text-sm italic bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl text-center border border-dashed border-gray-200 dark:border-gray-700">No active debts! You are all clear.</p>
        ) : (
          <div className="space-y-3">
            {activeLoans.map(loan => (
              <div key={loan.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${loan.type === 'lent' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                    {loan.type === 'lent' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{loan.counterparty_name}</h3>
                    <p className="text-xs text-gray-500">{loan.notes || (loan.type === 'lent' ? 'Owes you' : 'You owe them')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${loan.type === 'lent' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Number(loan.principal_amount).toLocaleString()} Ks
                  </span>
                  <button onClick={() => markAsSettled(loan.id)} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Mark as Settled">
                    <CheckCircle2 size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-20"></div>
    </div>
  );
}