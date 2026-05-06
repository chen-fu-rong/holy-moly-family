export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  is_business_overhead: boolean;
  spender: string;
  account: string;
  notes?: string;
}

export interface Loan {
  id: number;
  created_at: string;
  type: 'lent' | 'borrowed';
  borrower_name: string;
  principal_amount: number;
  interest_rate: number;
  start_date: string;
}