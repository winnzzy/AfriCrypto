
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  title?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, title = "An Error Occurred" }) => {
  if (!message) return null;

  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
      <div className="flex space-x-3">
        <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-red-400 font-semibold text-md">{title}</h3>
          <p className="text-red-300 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
