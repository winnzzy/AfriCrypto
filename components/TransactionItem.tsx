
import React from 'react';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown, CheckCircle, Clock, XCircle, Users } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionIcon: React.FC<{ type: TransactionType, status: TransactionStatus }> = ({ type, status }) => {
  let IconComponent;
  let colorClass = 'text-gray-400';

  if (status === TransactionStatus.COMPLETED) {
    colorClass = type === TransactionType.RECEIVE || type === TransactionType.BUY || type === TransactionType.P2P_BUY ? 'text-green-500' : 'text-red-500';
     if (type === TransactionType.SEND) colorClass = 'text-blue-500';
  } else if (status === TransactionStatus.PENDING) {
    colorClass = 'text-yellow-500';
  } else {
    colorClass = 'text-red-700';
  }

  switch (type) {
    case TransactionType.BUY: IconComponent = TrendingUp; break;
    case TransactionType.P2P_BUY: IconComponent = Users; break; // Or specific P2P icon
    case TransactionType.SELL: IconComponent = TrendingDown; break;
    case TransactionType.P2P_SELL: IconComponent = Users; break; // Or specific P2P icon
    case TransactionType.SEND: IconComponent = ArrowUpRight; break;
    case TransactionType.RECEIVE: IconComponent = ArrowDownLeft; break;
    default: IconComponent = TrendingUp;
  }

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass.replace('text-', 'bg-')}/10`}>
      <IconComponent className={`w-5 h-5 ${colorClass}`} />
    </div>
  );
};

const StatusIndicator: React.FC<{ status: TransactionStatus }> = ({ status }) => {
  if (status === TransactionStatus.COMPLETED) return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === TransactionStatus.PENDING) return <Clock className="w-4 h-4 text-yellow-500" />;
  return <XCircle className="w-4 h-4 text-red-500" />;
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
  };

  const title = transaction.description || `${transaction.type.replace('_', ' ')} ${transaction.cryptoSymbol}`;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <TransactionIcon type={transaction.type} status={transaction.status} />
        <div>
          <div className="text-white font-medium capitalize text-sm">{title}</div>
          <div className="text-gray-400 text-xs">{formatTimestamp(transaction.timestamp)}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-white font-medium text-sm ${
          transaction.type === TransactionType.RECEIVE || transaction.type === TransactionType.BUY || transaction.type === TransactionType.P2P_BUY ? 'text-green-400' : 
          (transaction.type === TransactionType.SEND || transaction.type === TransactionType.SELL || transaction.type === TransactionType.P2P_SELL ? 'text-red-400' : 'text-white')
        }`}>
          {transaction.type === TransactionType.RECEIVE || transaction.type === TransactionType.BUY || transaction.type === TransactionType.P2P_BUY ? '+' : 
           (transaction.type === TransactionType.SEND || transaction.type === TransactionType.SELL || transaction.type === TransactionType.P2P_SELL ? '-' : '')}
          {transaction.cryptoAmount} {transaction.cryptoSymbol}
        </div>
        {transaction.fiatAmount && transaction.fiatCurrency && (
          <div className="text-gray-400 text-xs">
            ~ {transaction.fiatAmount} {transaction.fiatCurrency}
          </div>
        )}
        <div className="flex items-center justify-end space-x-1 mt-0.5">
          <StatusIndicator status={transaction.status} />
          <span className={`text-xs capitalize ${
            transaction.status === TransactionStatus.COMPLETED ? 'text-green-500' :
            transaction.status === TransactionStatus.PENDING ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {transaction.status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TransactionItem;
