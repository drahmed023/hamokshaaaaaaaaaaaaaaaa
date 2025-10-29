import React from 'react';
import { useToasts } from '../context/ToastContext';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { SparklesIcon } from './icons/SparklesIcon'; // Using this for info

const ICONS = {
    success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    error: <XCircleIcon className="w-6 h-6 text-red-500" />,
    info: <SparklesIcon className="w-6 h-6 text-blue-500" />,
}

function ToastContainer() {
  const { toasts, removeToast } = useToasts();

  return (
    <div className="fixed top-5 right-5 z-[100] w-full max-w-sm space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white dark:bg-slate-800 shadow-2xl rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-toast-in"
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {ICONS[toast.type]}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-50">{toast.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={() => removeToast(toast.id)}
                  className="rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">Close</span>
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes toast-in {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .animate-toast-in { animation: toast-in 0.3s ease-out forwards; }
          `}</style>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;