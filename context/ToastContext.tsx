import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { ToastMessage } from '../types';
import { setGamificationToastDispatcher } from './GamificationContext';

type ToastContextType = {
  addToast: (message: string, type: ToastMessage['type'], title: string) => void;
  removeToast: (id: string) => void;
  toasts: ToastMessage[];
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// FIX: Changed from a const arrow function (React.FC) to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);
  
  const addToast = useCallback((message: string, type: ToastMessage['type'], title: string) => {
    const id = Date.now().toString();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, title }]);
    setTimeout(() => removeToast(id), 5000); // Auto-remove after 5 seconds
  }, [removeToast]);

  // Set the dispatcher for the gamification context to use
  useEffect(() => {
    setGamificationToastDispatcher((title, message) => addToast(message, 'success', title));
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToasts = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToasts must be used within a ToastProvider');
  }
  return context;
};