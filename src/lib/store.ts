import { create } from 'zustand';
import { supabase } from './supabase';

interface VaultState {
  family: any | null;
  transactions: any[];
  loans: any[];
  savingsGoals: any[];
  isLoading: boolean;
  isOwner: boolean;
  currency: string;
  
  // Actions
  fetchVaultData: (familyId: string) => Promise<void>;
  setOwner: (isOwner: boolean) => void;
  syncTransactions: (familyId: string) => Promise<void>;
  syncLoans: (familyId: string) => Promise<void>;
  syncSavings: (familyId: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  addTransaction: (payload: any) => Promise<{ error: any }>;
  editTransaction: (id: string, payload: any) => Promise<{ error: any }>;
  addLoan: (payload: any) => Promise<{ error: any }>;
  addSavingsGoal: (payload: any) => Promise<{ error: any }>;
  settleLoan: (id: string) => Promise<void>;
  updateSavingsProgress: (id: string, amount: number) => Promise<void>;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  family: null,
  transactions: [],
  loans: [],
  savingsGoals: [],
  isLoading: false,
  isOwner: false,
  currency: 'Ks',

  setOwner: (isOwner: boolean) => set({ isOwner }),

  fetchVaultData: async (familyId: string) => {
    set({ isLoading: true });
    
    // Fetch everything in parallel
    const [familyRes, txRes, loanRes, savingsRes] = await Promise.all([
      supabase.from('families').select('*').eq('id', familyId).single(),
      supabase.from('transactions').select('*').eq('family_id', familyId).order('transaction_date', { ascending: false }).limit(500),
      supabase.from('loans').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
      supabase.from('savings_goals').select('*').eq('family_id', familyId).order('created_at', { ascending: false })
    ]);

    set({
      family: familyRes.data,
      transactions: txRes.data || [],
      loans: loanRes.data || [],
      savingsGoals: savingsRes.data || [],
      currency: familyRes.data?.currency || 'Ks',
      isLoading: false
    });
  },

  syncTransactions: async (familyId: string) => {
    const { data } = await supabase.from('transactions').select('*').eq('family_id', familyId).order('transaction_date', { ascending: false }).limit(500);
    set({ transactions: data || [] });
  },

  syncLoans: async (familyId: string) => {
    const { data } = await supabase.from('loans').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
    set({ loans: data || [] });
  },

  syncSavings: async (familyId: string) => {
    const { data } = await supabase.from('savings_goals').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
    set({ savingsGoals: data || [] });
  },

  deleteTransaction: async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      set(state => ({
        transactions: state.transactions.filter(t => t.id !== id)
      }));
    }
  },

  deleteSavingsGoal: async (id: string) => {
    const { error } = await supabase.from('savings_goals').delete().eq('id', id);
    if (!error) {
      set(state => ({
        savingsGoals: state.savingsGoals.filter(s => s.id !== id)
      }));
    }
  },

  deleteLoan: async (id: string) => {
    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (!error) {
      set(state => ({
        loans: state.loans.filter(l => l.id !== id)
      }));
    }
  },

  addTransaction: async (payload: any) => {
    const { data, error } = await supabase.from('transactions').insert([payload]).select();
    if (!error && data && data.length > 0) {
      set(state => ({
        transactions: [data[0], ...state.transactions].sort((a, b) => 
          new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        ).slice(0, 500)
      }));
    }

    return {
      error: error || (data && data.length === 0 ? new Error('No transaction row returned from insert.') : null)
    };
  },

  editTransaction: async (id: string, payload: any) => {
    const { data, error } = await supabase.from('transactions').update(payload).eq('id', id).select();
    if (!error && data && data.length > 0) {
      set(state => ({
        transactions: state.transactions.map(t => t.id === id ? data[0] : t).sort((a, b) => 
          new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        )
      }));
    }

    return {
      error: error || (data && data.length === 0 ? new Error('No transaction row returned from update.') : null)
    };
  },

  addLoan: async (payload: any) => {
    const { data, error } = await supabase.from('loans').insert([payload]).select();
    if (!error && data) {
      set(state => ({
        loans: [data[0], ...state.loans]
      }));
    }
    return { error };
  },

  addSavingsGoal: async (payload: any) => {
    const { data, error } = await supabase.from('savings_goals').insert([payload]).select();
    if (!error && data) {
      set(state => ({
        savingsGoals: [data[0], ...state.savingsGoals]
      }));
    }
    return { error };
  },

  settleLoan: async (id: string) => {
    const { error } = await supabase.from('loans').update({ status: 'settled' }).eq('id', id);
    if (!error) {
      set(state => ({
        loans: state.loans.map(l => l.id === id ? { ...l, status: 'settled' } : l)
      }));
    }
  },

  updateSavingsProgress: async (id: string, amount: number) => {
    const { error } = await supabase.from('savings_goals').update({ current_amount: amount }).eq('id', id);
    if (!error) {
      set(state => ({
        savingsGoals: state.savingsGoals.map(s => s.id === id ? { ...s, current_amount: amount } : s)
      }));
    }
  }
}));
