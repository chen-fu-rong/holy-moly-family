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
  }
}));
