"use client";

import { useState } from "react";
import { X, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { triggerHaptic } from "@/lib/utils";

interface TransactionDetailModalProps {
  isOpen: boolean;
  transaction: any | null;
  currency: string;
  isOwner: boolean;
  onClose: () => void;
  onEdit: (tx: any) => void;
  onDelete: (id: string) => void;
}

export default function TransactionDetailModal({
  isOpen,
  transaction,
  currency,
  isOwner,
  onClose,
  onEdit,
  onDelete,
}: TransactionDetailModalProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen || !transaction) return null;

  const handleEdit = () => {
    triggerHaptic('light');
    onEdit(transaction);
    onClose();
  };

  const handleDeleteClick = () => {
    triggerHaptic('medium');
    setConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    triggerHaptic('heavy');
    onDelete(transaction.id);
    setConfirmDelete(false);
    onClose();
  };

  const transactionDate = new Date(transaction.transaction_date || transaction.date || transaction.created_at);
  const dateStr = transactionDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = transactionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      {/* Dark Blur Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 z-10 border border-white/50 dark:border-gray-800">
        
        {/* Close Button */}
        <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 md:px-7 py-4 flex justify-between items-center z-20">
          <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 dark:text-white">
            {transaction.type === 'income' ? 'Income' : 'Expense'} Details
          </h2>
          <button type="button" onClick={onClose} aria-label="Close modal" className="p-2.5 md:p-3 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 transition-transform flex-shrink-0">
            <X size={22} />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="p-6 md:p-7 space-y-6">
          {/* Amount & Type */}
          <div className="text-center space-y-2">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-2 ${transaction.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'}`}>
              {transaction.type === 'income' ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              )}
            </div>
            <p className={`text-4xl md:text-5xl font-black ${transaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
              {transaction.type === 'income' ? '+' : '-'}{Number(transaction.amount).toLocaleString()} <span className="text-lg md:text-xl text-gray-500 dark:text-gray-400">{currency}</span>
            </p>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Category */}
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Category</label>
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{transaction.category || 'General'}</p>
            </div>

            {/* Account */}
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Account</label>
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{transaction.account || 'Cash'}</p>
            </div>

            {/* Date & Time */}
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</label>
              <div className="text-right">
                <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{dateStr}</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{timeStr}</p>
              </div>
            </div>

            {/* Spender */}
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Recorded By</label>
              <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{transaction.spender || 'Unknown'}</p>
            </div>

            {/* Payee/Payer - Show only if present */}
            {transaction.type === 'expense' && transaction.payee && (
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Paid To</label>
                <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{transaction.payee}</p>
              </div>
            )}
            {transaction.type === 'income' && transaction.payer && (
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">From</label>
                <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">{transaction.payer}</p>
              </div>
            )}

            {/* Business Overhead Tag */}
            {transaction.is_business_overhead && (
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</label>
                <p className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">Business</p>
              </div>
            )}

            {/* Notes */}
            {transaction.notes && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Notes</label>
                <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">{transaction.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isOwner && (
            <div className="flex gap-3 pt-4">
              <button 
                onClick={handleEdit}
                className="flex-1 py-3 md:py-4 font-bold rounded-xl text-base md:text-lg bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 transition-transform flex items-center justify-center gap-2 h-12 md:h-14"
              >
                <Edit2 size={20} /> Edit
              </button>
              <button 
                onClick={handleDeleteClick}
                className="flex-1 py-3 md:py-4 font-bold rounded-xl text-base md:text-lg bg-rose-600 hover:bg-rose-700 text-white active:scale-95 transition-transform flex items-center justify-center gap-2 h-12 md:h-14"
              >
                <Trash2 size={20} /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center gap-4 md:gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600">
                  <AlertTriangle size={36} />
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-gray-900 dark:text-white">Delete Transaction?</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm mt-2">This action cannot be undone. Are you sure?</p>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 md:py-4 font-bold rounded-xl text-base md:text-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white active:scale-95 transition-transform h-12 md:h-14"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 md:py-4 font-bold rounded-xl text-base md:text-lg bg-rose-600 text-white active:scale-95 transition-transform h-12 md:h-14"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
