





import React, { useState, useEffect } from 'react';
import Button from './Button';
import { usePomodoro } from '../hooks/usePomodoro';
import Confetti from './Confetti';
// FIX: Import the missing getSessionSummary function.
import { getSessionSummary } from '../services/geminiService';
import Loader from './Loader';
import { CheckIcon } from './icons/CheckIcon';

type SessionSummaryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function SessionSummaryModal({ isOpen, onClose }: SessionSummaryModalProps) {
    const { state } = usePomodoro();
    const { sessionsToday, totalFocusTime } = state;
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    
    const totalMinutes = Math.floor(totalFocusTime / 60);
    
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            const fetchSummary = async () => {
                try {
                    const result = await getSessionSummary(totalMinutes, sessionsToday);
                    setSummary(result);
                } catch (error) {
                    console.error("Failed to fetch session summary:", error);
                    setSummary("Incredible focus! Keep that momentum going into your next session.");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchSummary();
        }
    }, [isOpen, totalMinutes, sessionsToday]);
    
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
             <div className="relative bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl w-full max-w-sm m-4 text-center">
                <Confetti />
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-primary-600 dark:text-primary-400">Great Work!</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">You've completed a focus session.</p>

                <div className="my-6 space-y-3 text-start">
                    <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <h3 className="font-semibold text-sm mb-2 text-slate-600 dark:text-slate-300">AI Summary</h3>
                        {isLoading ? <Loader text="Analyzing..." /> : <p className="text-slate-800 dark:text-slate-200">{summary}</p>}
                    </div>
                </div>

                {/* Fix: Added children to Button component to resolve missing prop error. */}
                <Button onClick={onClose} size="lg" className="w-full">
                    Start Your Break
                </Button>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
             `}</style>
        </div>
    );
};

export default SessionSummaryModal;