-- Add payer and payee columns to transactions table if they do not exist
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS payer TEXT,
  ADD COLUMN IF NOT EXISTS payee TEXT;
