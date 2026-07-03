import React from 'react';
import { X, QrCode as QrCodeIcon } from 'lucide-react';

interface QRScannerModalProps {
  onClose: () => void;
  onScanSuccess?: (data: string) => void; // Optional: if it were a real scanner
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ onClose, onScanSuccess }) => {
  // This is a MOCK scanner UI. No actual scanning functionality.
  // A real implementation would use a library like react-qr-scanner or html5-qrcode.
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold text-lg">Scan QR Code</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close QR scanner"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="bg-black rounded-xl p-2 sm:p-4 mb-4">
          {/* Placeholder for camera view */}
          <div className="aspect-square bg-gray-700 rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
            <QrCodeIcon className="w-20 h-20 sm:w-24 sm:h-24 text-gray-500 opacity-50" />
            <p className="text-gray-400 text-xs mt-2">Camera view (simulation)</p>
            {/* Scanner frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8">
                <div className="w-full h-full border-2 border-dashed border-blue-400 rounded-lg opacity-75"></div>
            </div>
            {/* Simulated scanning line: uses 'animate-scan-line' defined in index.html via Tailwind config */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)] animate-scan-line"></div>
          </div>
        </div>
        
        <p className="text-gray-300 text-center text-sm mb-4">
          Position the QR code within the frame. (This is a visual mock)
        </p>
        
        {onScanSuccess && (
            <button
                onClick={() => onScanSuccess("mock_scanned_qr_data_123")} // Simulate a scan
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium mb-2 transition-colors"
            >
                Simulate Scan Success
            </button>
        )}
        <button 
          onClick={onClose}
          className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default QRScannerModal;
