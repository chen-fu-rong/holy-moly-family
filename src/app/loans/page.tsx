"use client";

import { HandCoins, Loader2, Plus, Trash2, TrendingUp, Calendar, Percent, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Loan } from "../../types";

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form States
  const [loanType, setLoanType] = useState<"lent" | "borrowed">("lent");
  const [borrower, setBorrower] = useState("");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("loans").select("*").order("created_at", { ascending: false });
    if (!error && data) setLoans(data);
    setLoading(false);
  };

  const calculateLoanDetails = (principalAmt: number, ratePct: number, startStr: string) => {
    const start = new Date(startStr);
    const now = new Date();
    let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) monthsPassed -= 1;
    if (monthsPassed < 0) monthsPassed = 0;
    const totalInterest = principalAmt * (ratePct / 100) * monthsPassed;
    return { monthsPassed, totalInterest, currentTotal: principalAmt + totalInterest };
  };

  const handleSaveLoan = async () => {
    if (!borrower || !principal || !rate) return alert("Please fill all fields!");
    setIsAdding(false);
    setLoading(true);
    
    const { error } = await supabase.from("loans").insert([{
      type: loanType,
      borrower_name: borrower,
      principal_amount: Number(principal),
      interest_rate: Number(rate),
      start_date: startDate
    }]);

    if (!error) {
      setBorrower(""); setPrincipal(""); setRate("");
      fetchLoans();
    } else {
      alert("Error adding record.");
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure you want to delete this record?")) return;
    setLoading(true);
    await supabase.from("loans").delete().eq("id", id);
    fetchLoans();
  };

  let totalReceivable = 0; 
  let totalPayable = 0; 

  loans.forEach(loan => {
    const { currentTotal } = calculateLoanDetails(loan.principal_amount, loan.interest_rate, loan.start_date);
    if (loan.type === "borrowed") totalPayable += currentTotal;
    else totalReceivable += currentTotal;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 w-full max-w-5xl mx-auto relative pb-32">
      
      {/* Header & Totals */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <p className="text-gray-500 font-medium">Investments & Debts</p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-2">Loans & Debts Book</h2>
        </div>
        
        <div className="flex gap-4 w-full lg:w-auto">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 p-4 rounded-2xl flex-1">
            <p className="text-emerald-600 text-xs font-bold uppercase mb-1">Total Receivable</p>
            <h3 className="text-xl font-extrabold text-emerald-700">{totalReceivable.toLocaleString()} Ks</h3>
          </div>
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 p-4 rounded-2xl flex-1">
            <p className="text-rose-600 text-xs font-bold uppercase mb-1">Total Payable</p>
            <h3 className="text-xl font-extrabold text-rose-700">{totalPayable.toLocaleString()} Ks</h3>
          </div>
        </div>
      </div>

      <button onClick={() => setIsAdding(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-md flex justify-center items-center gap-2">
        <Plus size={20} /> Add Record
      </button>

      {/* Form */}
      {isAdding && (
        <div className="bg-white dark:bg-gray-900 border border-indigo-200 p-6 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-lg mb-4">Record New Entry</h3>
          
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
            <button onClick={() => setLoanType("lent")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${loanType === "lent" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500"}`}>I Lent Money</button>
            <button onClick={() => setLoanType("borrowed")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${loanType === "borrowed" ? "bg-white text-rose-600 shadow-sm" : "text-gray-500"}`}>I Borrowed</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">{loanType === 'lent' ? 'Borrower Name' : 'Lender Name'}</label>
              <input type="text" value={borrower} onChange={e=>setBorrower(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-950 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Principal Amount (Ks)</label>
              <input type="number" value={principal} onChange={e=>setPrincipal(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-950 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Monthly Interest Rate (%)</label>
              <input type="number" step="0.1" value={rate} onChange={e=>setRate(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-950 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:bg-gray-950 outline-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSaveLoan} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700">Save</button>
            <button onClick={() => setIsAdding(false)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loans.map(loan => {
          const { monthsPassed, totalInterest, currentTotal } = calculateLoanDetails(loan.principal_amount, loan.interest_rate, loan.start_date);
          const isDebt = loan.type === "borrowed";
          
          return (
            <div key={loan.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm relative group">
              <button onClick={() => handleDelete(loan.id)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
              
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${isDebt ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {isDebt ? <ArrowDownRight size={20}/> : <ArrowUpRight size={20}/>}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{loan.borrower_name}</h3>
                  <p className="text-xs text-gray-500">{isDebt ? 'I owe them' : 'They owe me'} • Started: {new Date(loan.start_date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Principal</p>
                    <p className="font-semibold">{loan.principal_amount.toLocaleString()} <span className="text-xs">Ks</span></p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl">
                    <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Interest Rate</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{loan.interest_rate}% <span className="text-xs text-gray-500">/ mo</span></p>
                  </div>
              </div>

              <div className={`p-5 rounded-2xl text-white ${isDebt ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-medium opacity-90">{isDebt ? 'Current Debt' : 'Current Value'}</p>
                  <p className="text-xs bg-black/20 px-2 py-1 rounded-md flex items-center gap-1">
                    <TrendingUp size={12}/> +{monthsPassed} Months
                  </p>
                </div>
                <h4 className="text-3xl font-extrabold mb-1">{currentTotal.toLocaleString()} <span className="text-lg font-normal opacity-80">Ks</span></h4>
                <p className="text-xs opacity-80">Includes {totalInterest.toLocaleString()} Ks in interest</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}