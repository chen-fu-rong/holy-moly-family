"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus, Target, TrendingUp, CheckCircle2, PiggyBank, Calendar, ArrowRight } from "lucide-react";

export default function SavingsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New Goal Form
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Deposit Form
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const fetchGoals = useCallback(async () => {
    setIsLoading(true);
    const familyId = localStorage.getItem("family_id");

    if (familyId) {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });
        
      if (data && !error) setGoals(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleCreateGoal = async () => {
    if (!name || !targetAmount || !targetDate) return alert("Please fill all fields.");
    const familyId = localStorage.getItem("family_id");
    
    setIsSaving(true);
    const { error } = await supabase.from('savings_goals').insert([{
      family_id: familyId,
      name: name,
      target_amount: Number(targetAmount),
      current_amount: 0,
      target_date: targetDate
    }]);
    setIsSaving(false);

    if (!error) {
      setShowAddForm(false);
      setName(""); setTargetAmount(""); setTargetDate("");
      fetchGoals();
    }
  };

  const handleDeposit = async (id: string, current: number) => {
    if (!depositAmount || Number(depositAmount) <= 0) return;
    const newAmount = current + Number(depositAmount);
    
    setIsSaving(true);
    await supabase.from('savings_goals').update({ current_amount: newAmount }).eq('id', id);
    setIsSaving(false);
    
    setDepositGoalId(null);
    setDepositAmount("");
    fetchGoals();
  };

  if (isLoading) return <div className="flex justify-center items-center h-[100dvh]"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const totalSaved = goals.reduce((acc, curr) => acc + Number(curr.current_amount), 0);
  const totalTarget = goals.reduce((acc, curr) => acc + Number(curr.target_amount), 0);

  return (
    <div className="relative min-h-[100dvh] pb-[calc(env(safe-area-inset-bottom)+8rem)] pt-[calc(env(safe-area-inset-top)+1rem)] [-webkit-tap-highlight-color:transparent]">
      
      {/* Golden/Amber Aurora for Wealth Growth */}
      <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-gray-950 pointer-events-none transform-gpu">
        <div className="absolute top-[10%] -left-[10%] w-[60%] h-[50%] rounded-full bg-amber-400/10 dark:bg-amber-600/10 blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-[20%] -right-[10%] w-[50%] h-[60%] rounded-full bg-orange-400/10 dark:bg-orange-600/10 blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <div className="px-4 md:px-8 max-w-3xl mx-auto pt-4 space-y-6">
        
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              <PiggyBank size={14} className="text-amber-500" /> Future Wealth
            </h2>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Savings Goals</h1>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-sm">
            {showAddForm ? "Cancel" : <><Plus size={18} /> New Goal</>}
          </button>
        </div>

        {/* Master Savings Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden transform-gpu">
          <div className="relative z-10">
            <p className="text-amber-100 font-bold text-sm mb-2 uppercase tracking-wider flex items-center gap-2">
               <TrendingUp size={16} /> Total Locked Liquidity
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
              {totalSaved.toLocaleString()} <span className="text-xl text-amber-200">Ks</span>
            </h2>
            <p className="text-sm font-bold text-amber-100 mt-2">
              Targeting: {totalTarget.toLocaleString()} Ks
            </p>
          </div>
          <PiggyBank size={140} className="absolute -bottom-6 -right-6 text-white/10 -rotate-12" />
        </div>

        {/* Add Goal Form */}
        {showAddForm && (
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300">
            <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Create a Sinking Fund</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Goal Name (e.g., Vacation)" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-amber-500" />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Ks</span>
                <input type="number" placeholder="Target Amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
              </div>
              <button onClick={handleCreateGoal} disabled={isSaving} className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform flex justify-center mt-2 shadow-md hover:bg-amber-600">
                {isSaving ? <Loader2 className="animate-spin" /> : "Start Saving"}
              </button>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4 pt-2">
          {goals.map(goal => {
            const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
            const isComplete = progress >= 100;
            const isDepositing = depositGoalId === goal.id;

            return (
              <div key={goal.id} className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 p-5 rounded-[2rem] shadow-sm transform-gpu transition-all ${isComplete ? 'border-emerald-200 dark:border-emerald-900/50' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                      {goal.name} {isComplete && <CheckCircle2 size={18} className="text-emerald-500" />}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">Target: {new Date(goal.target_date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-xl ${isComplete ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {Number(goal.current_amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      / {Number(goal.target_amount).toLocaleString()} Ks
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${isComplete ? 'bg-emerald-500' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                {/* Deposit Actions */}
                {!isComplete && (
                  <>
                    {!isDepositing ? (
                      <button onClick={() => setDepositGoalId(goal.id)} className="w-full py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-xl transition-colors flex justify-center items-center gap-1">
                        Deposit Funds <ArrowRight size={14} />
                      </button>
                    ) : (
                      <div className="flex gap-2 animate-in slide-in-from-top-2">
                        <input 
                          type="number" 
                          placeholder="Amount" 
                          value={depositAmount} 
                          onChange={e => setDepositAmount(e.target.value)} 
                          className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                          autoFocus
                        />
                        <button onClick={() => setDepositGoalId(null)} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold rounded-xl text-sm">Cancel</button>
                        <button onClick={() => handleDeposit(goal.id, goal.current_amount)} disabled={isSaving} className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-sm shadow-sm flex items-center justify-center min-w-[70px]">
                          {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Save"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}