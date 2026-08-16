'use client';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-800">
        <div className={`p-6 border-b border-slate-800 ${isDestructive ? 'bg-red-950/40' : 'bg-slate-950'}`}>
          <div className="flex items-start space-x-3">
            {isDestructive && <div className="p-2 bg-red-600/20 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-400" /></div>}
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-sm text-slate-400 mt-1">{message}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer text-xs"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 font-bold rounded-xl transition-all shadow-md text-xs cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
