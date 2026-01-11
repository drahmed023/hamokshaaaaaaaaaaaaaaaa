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
                    // FIX: Removed the 2nd argument (sessionsToday) to match the getSessionSummary function signature which expects 1 argument.
                    const result = await getSessionSummary(totalMinutes);
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
    }, [isOpen, totalMinutes]);
    
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
             <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-8 rounded-xl shadow-2xl w-full max-w-sm m-4 text-center">
                <Confetti />
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckIcon className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-primary-700 dark:text-primary-400">Great Work!</h2>
                <p className="text-slate-600 dark:text-slate-300 mt-2">You've completed a focus session.</p>

                <div className="my-6 space-y-3 text-start">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="font-semibold text-sm mb-2 text-slate-700 dark:text-slate-200">AI Summary</h3>
                        {isLoading ? <Loader text="Analyzing..." /> : <p className="text-slate-800 dark:text-slate-100">{summary}</p>}
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