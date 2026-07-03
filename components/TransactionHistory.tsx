
import React from 'react';
import { Transaction } from '../types';
import TransactionItem from './TransactionItem';
import LoadingSpinner from './LoadingSpinner';

interface TransactionHistoryProps {
  transactions: Transaction[] | null;
  isLoading: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, isLoading }) => {
  if (isLoading) {
    return <LoadingSpinner text="Loading transaction history..." />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-xl">Recent Transactions</h3>
        <p className="text-gray-400 text-center py-6">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-semibold text-xl">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map(tx => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
      </div>
    </div>
  );
};

export default TransactionHistory;
