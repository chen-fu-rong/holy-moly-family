export interface Transaction {
  id: string;
  created_at: string;
  transaction_date: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  is_business_overhead: boolean;
  spender: string;
  account: string;
  notes?: string;
  payer?: string;
  payee?: string;
}

export interface Loan {
  id: number;
  created_at: string;
  type: 'lent' | 'borrowed';
  counterparty_name: string;
  principal_amount: number;
  interest_rate: number;
  transaction_date: string;
  status?: 'active' | 'paid' | 'pending' | string;
}