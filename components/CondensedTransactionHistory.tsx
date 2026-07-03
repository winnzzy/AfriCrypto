
import React from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, CheckCircle, Clock, Users, ShoppingBag } from 'lucide-react'; // ShoppingBag for Buy/Sell
import { ActiveTab } from '../types';

interface CondensedTransactionHistoryProps {
  transactions: Transaction[] | null;
  onNavigateToHistory: (tab: ActiveTab) => void;
}

const TransactionIcon: React.FC<{ type: TransactionType }> = ({ type }) => {
  let IconComponent;
  let colorClass = 'text-gray-400';

  switch (type) {
    case TransactionType.P2P_BUY: IconComponent = Users; colorClass = 'text-green-400'; break;
    case TransactionType.P2P_SELL: IconComponent = Users; colorClass = 'text-red-400'; break;
    case TransactionType.BUY: IconComponent = ShoppingBag; colorClass = 'text-green-400'; break;
    case TransactionType.SELL: IconComponent = ShoppingBag; colorClass = 'text-red-400'; break;
    case TransactionType.SEND: IconComponent = ArrowUpRight; colorClass = 'text-blue-400'; break;
    case TransactionType.RECEIVE: IconComponent = ArrowDownLeft; colorClass = 'text-teal-400'; break;
    default: IconComponent = CheckCircle;
  }
  return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
};


const CondensedTransactionHistory: React.FC<CondensedTransactionHistoryProps> = ({ transactions, onNavigateToHistory }) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="my-6">
        <h3 className="text-white font-semibold text-lg mb-2">Recent Activity</h3>
        <p className="text-gray-500 text-sm text-center py-3">No recent transactions.</p>
      </div>
    );
  }

  const recentTxs = transactions.slice(0, 3);

  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-white font-semibold text-lg">Recent Activity</h3>
        <button 
            onClick={() => onNavigateToHistory(ActiveTab.HISTORY)}
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
            View All
        </button>
      </div>
      <div className="space-y-2">
        {recentTxs.map(tx => (
          <div key={tx.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                  tx.type === TransactionType.RECEIVE || tx.type === TransactionType.BUY || tx.type === TransactionType.P2P_BUY ? 'bg-green-500/10' :
                  (tx.type === TransactionType.SEND || tx.type === TransactionType.SELL || tx.type === TransactionType.P2P_SELL ? 'bg-red-500/10' : 'bg-blue-500/10')
              }`}>
                <TransactionIcon type={tx.type} />
              </div>
              <div>
                <p className="text-white text-sm font-medium capitalize truncate max-w-[150px]">{tx.description || `${tx.type.replace('_',' ')} ${tx.cryptoSymbol}`}</p>
                <p className="text-gray-400 text-xs">
                  {new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                tx.type === TransactionType.RECEIVE || tx.type === TransactionType.BUY || tx.type === TransactionType.P2P_BUY ? 'text-green-400' : 
                (tx.type === TransactionType.SEND || tx.type === TransactionType.SELL || tx.type === TransactionType.P2P_SELL ? 'text-red-400' : 'text-white')
              }`}>
                {tx.type === TransactionType.RECEIVE || tx.type === TransactionType.BUY || tx.type === TransactionType.P2P_BUY ? '+' : '-'}
                {tx.cryptoAmount} {tx.cryptoSymbol}
              </p>
              <div className={`text-xs capitalize flex items-center justify-end space-x-1 mt-0.5 ${
                tx.status === TransactionStatus.COMPLETED ? 'text-green-500' : 
                tx.status === TransactionStatus.PENDING ? 'text-yellow-500' : 'text-red-600'
              }`}>
                {tx.status === TransactionStatus.COMPLETED && <CheckCircle className="w-3 h-3"/>}
                {tx.status === TransactionStatus.PENDING && <Clock className="w-3 h-3"/>}
                <span>{tx.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CondensedTransactionHistory;
